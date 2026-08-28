'use strict';

// GENERIC WARRANTY LOOKUP — drive the manufacturer's own form like a person would.
//
// Trane works because someone reverse-engineered its JSON endpoint. That does not
// scale: every manufacturer has a different form, and hand-written scrapers break
// the first time a vendor redesigns. Meanwhile we already have a real browser
// sitting there.
//
// So this reads the actual form, decides which box the serial goes in, fills it,
// submits, and reads the answer back. Any brand with a public lookup page works
// without anyone writing a brand-specific module — and when a vendor moves a field,
// it adapts instead of breaking.
//
// The trade is honest: slower than Trane's direct call (20-60s vs ~3s) and it costs
// a couple of model calls per lookup. So it is a FALLBACK. A brand with a hand-written
// module keeps using it; everything else comes here instead of saying "not wired yet".
//
// ⚠️ PRIVACY — same rule as trane.js, enforced harder because this one reads whole
// pages. Manufacturer warranty results routinely include the homeowner's install
// address on a serial number alone. Address-shaped lines are stripped BEFORE any page
// text is sent to the model, the model is told to return equipment and policy fields
// only, and nothing raw is cached or logged.

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.WARRANTY_AGENT_MODEL || 'claude-opus-4-8';

const log = (...a) => console.log('[agent]', ...a);

// ── PRIVACY SCRUB ────────────────────────────────────────────────────────────
// Runs on every string that leaves this process for the model. Deliberately
// aggressive: losing a line of page text costs nothing, leaking a customer's
// address costs Brandon the account.
function scrub(text) {
  return String(text || '')
    // street addresses: "123 Main St", "45 Oak Avenue Apt 2"
    .replace(/\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|circle|cir|pl|place|ter|terrace|hwy|highway|pkwy|parkway)\b\.?/gi, '[address]')
    // Apartment designators are SHORT ("Apt 3B", "Ste 200"). Bounded to 4 characters
    // because an unbounded match ate "Unit 4TWR6036H1000AA" — the model number, which
    // is the single field this whole lookup exists to return.
    .replace(/\b(?:apt|apartment|suite|ste)\.?\s*#?\s*[A-Za-z0-9-]{1,4}\b/gi, '[unit]')
    // ZIP / ZIP+4
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '[zip]')
    // Phone numbers ONLY when they are punctuated like phone numbers. A bare run of
    // ten digits is far more likely to be a serial number here — matching those
    // destroyed "1904512345", and a lookup that loses the serial is worthless. An
    // unpunctuated phone can slip through; the extraction prompt is still told to
    // return no customer data, and name/address/zip/email are already gone.
    .replace(/(?:\+?1[-. ])?\(\d{3}\)\s*\d{3}[-. ]?\d{4}/g, '[phone]')
    .replace(/(?:\+?1[-. ])?\b\d{3}[-.]\d{3}[-.]\d{4}\b/g, '[phone]')
    // email
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, '[email]');
}

async function ask(messages, maxTokens) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(60000),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens || 900, messages }),
  });
  if (!r.ok) throw new Error('model ' + r.status + ' ' + (await r.text()).slice(0, 120));
  const d = await r.json();
  return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function firstJson(text, fallback) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return fallback;
  try { return JSON.parse(m[0]); } catch (_) { return fallback; }
}

// ── READ THE FORM ────────────────────────────────────────────────────────────
// Structured field descriptions beat a screenshot here: cheaper, faster, and the
// model gets the real selector instead of guessing from pixels.
async function describeForm(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const labelFor = (el) => {
      if (el.id) {
        const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (l) return (l.innerText || '').trim().slice(0, 80);
      }
      const p = el.closest('label');
      if (p) return (p.innerText || '').trim().slice(0, 80);
      return '';
    };
    const sel = (el) => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
      const all = [...document.querySelectorAll(el.tagName)];
      return `${el.tagName.toLowerCase()}:nth-of-type(${all.indexOf(el) + 1})`;
    };
    const inputs = [...document.querySelectorAll('input, select, textarea')]
      .filter(el => vis(el) && !['hidden', 'submit', 'button', 'image'].includes(el.type))
      .slice(0, 25)
      .map(el => ({
        selector: sel(el), tag: el.tagName.toLowerCase(), type: el.type || '',
        name: el.name || '', id: el.id || '',
        placeholder: el.placeholder || '', label: labelFor(el),
        options: el.tagName === 'SELECT' ? [...el.options].slice(0, 12).map(o => o.value) : undefined,
      }));
    const buttons = [...document.querySelectorAll('button, input[type=submit], a[role=button]')]
      .filter(vis).slice(0, 15)
      .map(el => ({ selector: sel(el), text: (el.innerText || el.value || '').trim().slice(0, 50) }));
    return { inputs, buttons, title: document.title };
  });
}

// ── THE LOOKUP ───────────────────────────────────────────────────────────────
async function agentLookup(page, brand, serial, extra) {
  if (!ANTHROPIC_KEY) throw new Error('agent lookup needs ANTHROPIC_API_KEY');
  const url = brand.where && /^https?:/i.test(brand.where) ? brand.where : `https://${brand.where}`;
  log(`${brand.id}: opening ${url}`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);

  const form = await describeForm(page);
  if (!form.inputs.length) throw new Error('no form fields found on the lookup page');

  const known = Object.assign({ serial }, extra || {});
  const plan = firstJson(await ask([{
    role: 'user',
    content: `This is a manufacturer HVAC warranty-lookup page for ${brand.label}.

FIELDS ON THE PAGE:
${JSON.stringify(form.inputs, null, 1)}

BUTTONS:
${JSON.stringify(form.buttons, null, 1)}

I HAVE THESE VALUES:
${JSON.stringify(known, null, 1)}

Decide which field each value goes in. Ignore newsletter signups, search boxes, cookie banners and anything unrelated to a warranty/registration lookup.

Reply with ONLY JSON:
{"fill":[{"selector":"...","value":"..."}],"submit":"<selector of the submit button>","confident":true}

If this page has no warranty lookup form, reply {"fill":[],"submit":null,"confident":false}.`,
  }], 800), { fill: [], submit: null, confident: false });

  if (!plan.confident || !plan.fill.length || !plan.submit) {
    throw new Error('could not identify the lookup form');
  }

  for (const f of plan.fill) {
    try { await page.fill(f.selector, String(f.value)); }
    catch (_) { log(`  could not fill ${f.selector}`); }
  }
  await Promise.allSettled([
    page.click(plan.submit),
    page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(3500);

  // Read the answer. Scrubbed before it leaves the process.
  const raw = await page.evaluate(() => (document.body.innerText || '').slice(0, 6000));
  const result = firstJson(await ask([{
    role: 'user',
    content: `This is the RESULT page after submitting an HVAC warranty lookup for ${brand.label}, serial ${serial}.

PAGE TEXT:
${scrub(raw)}

Extract ONLY equipment and warranty-policy facts. Do NOT return any customer name, address, phone or email even if present.

Reply with ONLY JSON:
{"found":true|false,
 "registered":true|false|null,   // true only if the page says the unit was REGISTERED (extended term), false if it shows base/standard coverage, null if unclear
 "model":"...|null",
 "installDate":"YYYY-MM-DD|null",
 "parts":{"endDate":"YYYY-MM-DD|null","years":n|null},
 "compressor":{"endDate":"YYYY-MM-DD|null","years":n|null},
 "labor":{"endDate":"YYYY-MM-DD|null","years":n|null},
 "summary":"one plain sentence a technician can read aloud",
 "notFoundReason":"...|null"}

found:false if the page says no record, invalid serial, or shows the empty form again.`,
  }], 900), null);

  if (!result) throw new Error('could not read the result page');
  log(`${brand.id}: found=${result.found} registered=${result.registered}`);
  return {
    found: !!result.found,
    registered: result.registered === null ? null : !!result.registered,
    model: result.model || null,
    installDate: result.installDate || null,
    parts: result.parts || null,
    compressor: result.compressor || null,
    labor: result.labor || null,
    summary: result.summary || null,
    notFoundReason: result.found ? null : (result.notFoundReason || null),
    via: 'agent',
  };
}

module.exports = { agentLookup, scrub };

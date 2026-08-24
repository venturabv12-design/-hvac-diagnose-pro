'use strict';

// TRANE / AMERICAN STANDARD / RUNTRU
//
// Trane's public warranty lookup is a React front end over a JSON endpoint:
//
//   POST https://www.trane.com/residential/api/warranty-registration/
//   {"service":"registrations/serial-number/search","lastName":"","serialNumber":"..."}
//
// We hit that endpoint rather than clicking the form, because the JSON contract
// survives a UI redesign and the form does not. But the request has to originate
// from inside a real browser session: a plain server-side fetch is refused at the
// edge (403, then the connection is dropped outright). So we load the page once to
// establish the session and make the call from within the page.
//
// ⚠️ PRIVACY: the response carries the homeowner's full install address under
// `install-location` — returned on a serial number alone, with no last name. That
// never leaves this module. `normalise()` below reads only the equipment and policy
// fields; the address is not returned, not cached, and not logged.

const LOOKUP_PAGE = 'https://www.trane.com/residential/en/resources/warranty-and-registration/lookup/';
const API_PATH = '/residential/api/warranty-registration/';

// Trane's own term-type value. REGISTERED is the extended term (the homeowner or
// dealer registered within the window); BASE is the shorter default everyone gets.
// This distinction is the entire point of the feature — it is what separates a real
// answer from the "likely warranty" guess that serial-decoders give you.
function isRegistered(termType) {
  return String(termType || '').toUpperCase() === 'REGISTERED';
}

function toISO(ms) {
  if (!ms && ms !== 0) return null;
  const d = new Date(Number(ms));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Trane returns install-date as a loose 'YYYY-M-D'. Normalise so the client never
// has to parse two different date shapes.
function normaliseInstallDate(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

function normalise(json, serial) {
  const regs = (json && json.registrations) || [];
  const policies = [];
  let component = null;
  let installDate = null;

  for (const reg of regs) {
    for (const system of reg.systems || []) {
      for (const asset of system.assets || []) {
        const c = asset.component || {};
        // Only take the asset matching the serial we asked about — a registration
        // can cover a whole system (condenser + air handler + furnace).
        const sameSerial = String(c['serial-number'] || '').toUpperCase() === String(serial).toUpperCase();
        if (!component || sameSerial) {
          if (sameSerial || !component) {
            component = {
              model: c['model-number'] || null,
              category: c['warranty-category'] || null,
              serial: c['serial-number'] || serial,
            };
            installDate = normaliseInstallDate(asset['install-date']);
          }
        }
        if (!sameSerial) continue;
        for (const p of (asset['warranty-term'] || {}).policies || []) {
          policies.push({
            description: p.description || null,
            status: p['policy-status'] || null,
            registered: isRegistered(p['term-type']),
            termType: p['term-type'] || null,
            termLabel: (p['term-type-description'] || '').replace(/^\(|\)$/g, '') || null,
            startDate: toISO(p['start-date']),
            endDate: toISO(p['end-date']),
          });
        }
      }
    }
  }

  if (!component && !policies.length) return { found: false };

  const active = policies.filter(p => String(p.status).toLowerCase() === 'active');
  const primary = active[0] || policies[0] || null;

  return {
    found: true,
    model: component ? component.model : null,
    category: component ? component.category : null,
    installDate,
    // Top-level convenience fields — what Mike actually says out loud.
    registered: primary ? primary.registered : null,
    status: primary ? primary.status : null,
    termLabel: primary ? primary.termLabel : null,
    endDate: primary ? primary.endDate : null,
    coverage: policies,
  };
}

async function lookup(page, serial) {
  // Establish the session. domcontentloaded is enough — we never touch the form.
  if (!page.url().startsWith('https://www.trane.com')) {
    await page.goto(LOOKUP_PAGE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);
  }

  const call = async () => page.evaluate(async ({ apiPath, serialNumber }) => {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        service: 'registrations/serial-number/search',
        lastName: '',
        serialNumber,
      }),
    });
    let body = null;
    try { body = await res.json(); } catch (_) {}
    return { status: res.status, body };
  }, { apiPath: API_PATH, serialNumber: serial });

  let out = await call();

  // A stale session shows up as a 4xx. Reload the page once and retry before giving up.
  if (out.status !== 200) {
    await page.goto(LOOKUP_PAGE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);
    out = await call();
  }

  if (out.status !== 200) {
    const err = new Error(`trane lookup returned ${out.status}`);
    err.upstreamStatus = out.status;
    throw err;
  }

  return normalise(out.body, serial);
}

module.exports = {
  id: 'trane',
  label: 'Trane / American Standard',
  aliases: ['trane', 'american standard', 'americanstandard', 'runtru', 'run tru'],
  supported: true,
  origin: 'https://www.trane.com',
  lookup,
  // exported for unit-testing the parser without a browser
  _normalise: normalise,
};

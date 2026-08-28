'use strict';
// Which manufacturers actually have a PUBLIC warranty lookup?
//
// Written after getting this wrong three times in a row — Goodman, Rheem and Lennox
// were all declared impossible because I opened a plausible-looking URL, hit a login
// or a registration flow, and stopped. The lesson is in the method: check several
// candidate URLs per brand, look INSIDE iframes, dismiss the cookie banner first, and
// judge by whether a serial-number field actually exists rather than by the page title.
//
//   node warranty-service/scan-brands.js
const { chromium } = require('playwright');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const BRANDS = [
  ['Lennox / Armstrong / Ducane', ['https://www.lennox.com/residential/owners/assistance/warranty/']],
  ['Goodman / Amana / Daikin', ['https://www.goodmanmfg.com/warranty-lookup']],
  ['Rheem / Ruud', ['https://ruud.registermyunit.com/en-US/warranty/brand?brand=ruud&verify=true',
                    'https://rheem.registermyunit.com/en-US/warranty/brand?brand=rheem&verify=true']],
  ['Carrier / Bryant / Payne', ['https://www.carrier.com/residential/en/us/warranty-lookup/',
                                'https://www.bryant.com/en/us/warranty-lookup/']],
  ['Trane / American Standard', ['https://www.trane.com/residential/en/resources/warranty-and-registration/lookup/',
                                 'https://www.americanstandardair.com/warranty-lookup/']],
  ['York / Coleman / Luxaire (JCI)', ['https://www.york.com/residential-equipment/warranty-lookup',
                                      'https://www.upgnet.com/warranty/',
                                      'https://www.york.com/support/warranty']],
  ['ICP: Heil / Tempstar / Comfortmaker / Arcoaire', ['https://www.heil-hvac.com/en/us/support/warranty-lookup/',
                                                      'https://www.tempstar.com/en/us/support/warranty-lookup/',
                                                      'https://www.comfortmaker.com/en/us/support/warranty-lookup/']],
  ['Nortek: Frigidaire / Maytag / Nordyne', ['https://www.nortekhvac.com/warranty-lookup/',
                                             'https://www.frigidaire-hvac.com/warranty']],
  ['Mitsubishi Electric', ['https://www.mitsubishicomfort.com/warranty',
                           'https://www.mitsubishicomfort.com/support/warranty-lookup']],
  ['Bosch Home Comfort', ['https://www.bosch-homecomfort.com/us/en/residential/support/warranty/']],
  ['Bard', ['https://www.bardhvac.com/warranty/']],
];

const SERIALish = /serial/i;

async function probe(page, url) {
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    const status = r ? r.status() : 0;
    await page.waitForTimeout(3500);

    for (const t of ['Accept All Optional Cookies', 'Accept All Cookies', 'Accept All', 'I Accept', 'Accept', 'Agree']) {
      try {
        const b = await page.$(`button:has-text("${t}")`);
        if (b) { await b.click({ timeout: 2500 }); await page.waitForTimeout(1200); break; }
      } catch (_) {}
    }

    const scan = async (fr) => fr.evaluate(() => {
      const vis = el => { const b = el.getBoundingClientRect(), s = getComputedStyle(el);
        return b.width > 0 && b.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
      const fields = [...document.querySelectorAll('input,select')].filter(vis)
        .filter(e => !['hidden', 'submit', 'button', 'image'].includes(e.type))
        .map(e => (e.name || e.id || e.placeholder || '').toString());
      return { fields, text: (document.body.innerText || '').slice(0, 4000) };
    }).catch(() => ({ fields: [], text: '' }));

    let best = await scan(page.mainFrame()), where = 'page';
    if (!best.fields.length) {
      for (const fr of page.frames()) {
        if (fr === page.mainFrame()) continue;
        const f = await scan(fr);
        if (f.fields.length) { best = f; where = 'iframe'; break; }
      }
    }
    const hasSerialField = best.fields.some(f => SERIALish.test(f));
    const mentionsSerial = SERIALish.test(best.text);
    const login = /please log ?in|sign in to|username|password/i.test(best.text);
    return { status, where, fields: best.fields.slice(0, 6), hasSerialField, mentionsSerial, login };
  } catch (e) {
    return { status: 0, error: e.message.slice(0, 50) };
  }
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  const results = [];
  for (const [brand, urls] of BRANDS) {
    let hit = null;
    for (const u of urls) {
      const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
      const r = await probe(p, u);
      await p.close();
      const ok = r.hasSerialField || (r.mentionsSerial && r.fields.length && !r.login);
      if (ok) { hit = { url: u, ...r }; break; }
      if (!hit) hit = { url: u, ...r };
      if (r.hasSerialField) break;
    }
    const verdict = hit.hasSerialField ? 'PUBLIC ✅'
      : hit.login ? 'LOGIN ❌'
      : hit.mentionsSerial ? 'MAYBE ⚠️'
      : 'NO FORM ❌';
    results.push([brand, verdict, hit]);
    console.log(`${verdict.padEnd(11)} ${brand}`);
    console.log(`            ${hit.url}`);
    console.log(`            http ${hit.status} · form in ${hit.where || '-'} · fields: ${JSON.stringify(hit.fields || [])}${hit.error ? ' · ' + hit.error : ''}`);
  }
  await b.close();
  console.log('\nPUBLIC: ' + results.filter(r => r[1].startsWith('PUBLIC')).map(r => r[0]).join(' | '));
})();

'use strict';
// Find the REAL public warranty-lookup URL for the brands I haven't cracked.
// Guessing URL patterns failed three times in a row; search for them instead, then
// every candidate still gets opened in a browser before it is believed.
const KEY = process.env.ANTHROPIC_API_KEY;

const BRANDS = [
  'York (Johnson Controls), also Coleman HVAC and Luxaire',
  'International Comfort Products — Heil, Tempstar, Comfortmaker, Arcoaire, KeepRite',
  'Nortek Global HVAC — Frigidaire, Maytag HVAC, Nordyne, Broan, Gibson, Intertherm',
  'Mitsubishi Electric Trane HVAC US (mini-splits)',
  'Bosch Home Comfort US',
  'Bard Manufacturing',
  'Amana brand HVAC (amana-hac.com)',
  'Payne',
];

const Q = `For each HVAC manufacturer below, find the EXACT URL of its PUBLIC warranty
lookup / warranty verification page — the page where a homeowner or technician enters a
SERIAL NUMBER and gets back registration or coverage status.

${BRANDS.map((b, i) => `${i + 1}. ${b}`).join('\n')}

CRITICAL DISTINCTIONS — I have been burned by all three:
- A PRODUCT REGISTRATION page (register a new unit) is NOT a warranty lookup.
- A DEALER/DISTRIBUTOR PORTAL behind a login is NOT a public lookup.
- A warranty POLICY/PDF page explaining terms is NOT a lookup.
I want the page with a serial-number input that returns coverage for that unit.

Note that manufacturers often put this on a sibling domain: Goodman's is
goodmanmfg.com/warranty-lookup while warranty.goodmanmfg.com is the distributor login.
Rheem's is registermyunit.com/en-US/warranty/brand?brand=rheem&verify=true. Look for
that kind of thing.

Reply with ONLY JSON:
[{"brand":"...","url":"...|null","confidence":"high|medium|low","note":"what the page is, or why none exists"}]

If a brand genuinely has no public lookup, url null and say what it requires instead.`;

(async () => {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: AbortSignal.timeout(600000),
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-opus-4-8', max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 20 }],
      messages: [{ role: 'user', content: Q }],
    }),
  });
  if (!r.ok) { console.error('HTTP', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  const d = await r.json();
  const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  const m = text.match(/\[[\s\S]*\]/);
  console.log(m ? m[0] : text);
})();

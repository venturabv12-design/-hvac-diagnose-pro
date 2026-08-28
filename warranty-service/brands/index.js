'use strict';

// Brand registry.
//
// Adding a manufacturer is adding one file here — that is deliberate. Each brand
// has its own lobby, its own way of being asked, and its own way of answering, and
// when one of them redecorates only that file changes.
//
// ── WHAT EACH MANUFACTURER REQUIRES ─────────────────────────────────────────
// Brandon's call, and it's the right one: every manufacturer's lookup wants a
// different set of fields, so Mike should ASK THE TECH for exactly that brand's
// fields instead of demanding a lowest-common-denominator set. `requires` and
// `optional` below are what Mike reads off to the tech. Getting to the form is the
// proof the path works; asking for the right inputs is what makes it usable.
//
//   Trane    → serial alone
//   Goodman  → serial + model (their form will not submit without the model)
//   Carrier  → serial + whether the caller is the original purchaser
//   Rheem    → serial
//   Lennox   → nothing will help; there is no public registry
//
// ── STATES ──────────────────────────────────────────────────────────────────
//   supported: true,  verified: true   → wired AND confirmed against a real unit
//   supported: true,  verified: false  → wired, never seen a real success response.
//                                        Parsers FAIL SAFE: anything they cannot read
//                                        with confidence returns unreadable, and Mike
//                                        says he could not verify. He never guesses.
//   supported: false, publicRegistry:true  → public lookup exists, not built yet
//   supported: false, publicRegistry:false → no public lookup at all (Lennox)

const trane = require('./trane');

// Field definitions Mike reads to the tech, in the order he should ask.
const FIELD = {
  serial: { key: 'serial', label: 'serial number', hint: 'off the data plate' },
  model: { key: 'model', label: 'model number', hint: 'same plate, usually the line above' },
  zip: {
    key: 'zip',
    label: "the property's zip code",
    hint: 'Lennox and Goodman both ask for it',
  },
  state: {
    key: 'state',
    label: "the property's state",
    hint: 'two letters, e.g. VA — Rheem asks for it with the last name',
  },
  lastName: {
    key: 'lastName',
    label: "the homeowner's last name",
    hint: 'Goodman will not return full coverage without it',
  },
  originalPurchaser: {
    key: 'originalPurchaser',
    label: 'is the homeowner the original purchaser',
    hint: 'yes or no — Carrier asks because coverage changes on resale',
    type: 'boolean',
  },
};

const PENDING = [
  {
    id: 'goodman',
    label: 'Goodman / Amana / Daikin',
    aliases: ['goodman', 'amana', 'daikin'],
    // CORRECTED 2026-08-28 — Brandon caught this. I tested warranty.goodmanmfg.com,
    // which IS a distributor login, and wrongly concluded the brand had no public
    // lookup. The public form is at goodmanmfg.com/warranty-lookup and needs no
    // account. It also lives inside an IFRAME, which is why a first pass reported
    // "no form fields" even on the right URL.
    //
    // Their note on the page: "Homeowner last name must be entered and verified to
    // display complete limited warranty coverage." So the tech needs the customer's
    // last name — worth asking for up front rather than failing after the fact.
    publicRegistry: true,
    where: 'https://www.goodmanmfg.com/warranty-lookup',
    requires: [FIELD.serial, FIELD.model, FIELD.lastName, FIELD.zip],
    note: 'Public lookup, no login. Goodman needs the homeowner LAST NAME to return ' +
          'full coverage — serial and model alone will not do it. Install type ' +
          'defaults to Residential.',  },
  {
    id: 'carrier',
    label: 'Carrier / Bryant / Payne',
    aliases: ['carrier', 'bryant', 'payne'],
    publicRegistry: true,
    where: 'carrier.com/residential/en/us/warranty-lookup/',
    requires: [FIELD.serial, FIELD.originalPurchaser],
    note: 'Serial plus original-purchaser only — no last name or zip.',
  },
  {
    id: 'rheem',
    label: 'Rheem / Ruud',
    aliases: ['rheem', 'ruud'],
    // CORRECTED 2026-08-28 — Brandon again. The bare domain lands on a REGISTRATION
    // flow, which is what I tested and wrongly wrote off. The verify form is at
    // /en-US/warranty/brand?brand=ruud&verify=true and is fully public:
    // tbSerialNumber, tbHomeOwnerLastName, tbHomeOwnerState, "Verify Warranty
    // Registration". Rheem-branded units use the same path with brand=rheem.
    publicRegistry: true,
    where: 'https://ruud.registermyunit.com/en-US/warranty/brand?brand=ruud&verify=true',
    requires: [FIELD.serial, FIELD.lastName, FIELD.state],
    note: 'Public verify form, no login. Needs the homeowner LAST NAME and STATE ' +
          'alongside the serial. Ruud and Rheem share the portal.',  },
  {
    id: 'mitsubishi',
    label: 'Mitsubishi Electric',
    aliases: ['mitsubishi', 'metus', 'mr slim', 'mrslim'],
    // Added 2026-08-28. registermehvac.com returns 403 to a browser whose user agent
    // says "HeadlessChrome" and 200 to an ordinary one — it was refusing a headless
    // browser, not gating the page. Search by model + serial.
    publicRegistry: true,
    where: 'https://registermehvac.com/WarrantyLookup_88973.aspx',
    requires: [FIELD.serial, FIELD.model],
    note: 'Public lookup. Model plus serial, or the warranty number if the homeowner ' +
          'has their paperwork.',
  },
  {
    id: 'lennox',
    label: 'Lennox / Armstrong Air / Ducane',
    aliases: ['lennox', 'armstrong air', 'ducane'],
    // CORRECTED 2026-08-28 — Brandon: "I don't need a login for Lennox either."
    // He is right. lennox.com/residential/owners/assistance/warranty/ is a public
    // "Lennox Warranty Lookup" with a serial field and a Search button. The dealer
    // portal exists, but it is not the only way in, and the note here previously told
    // technicians the opposite.
    publicRegistry: true,
    where: 'https://www.lennox.com/residential/owners/assistance/warranty/',
    requires: [FIELD.serial, FIELD.lastName, FIELD.zip],
    note: 'Public lookup, no login. Serial alone gets a result; last name and zip ' +
          'sharpen it.',
  },
];

const IMPLEMENTED = [trane];

function resolve(brandName) {
  const q = String(brandName || '').trim().toLowerCase();
  if (!q) return null;

  for (const b of IMPLEMENTED) {
    if (b.aliases.some(a => q.includes(a))) return b;
  }
  for (const b of PENDING) {
    if (b.aliases.some(a => q.includes(a))) return Object.assign({ supported: false }, b);
  }
  return null;
}

// What Mike should ask the tech for, for this brand. Returns null for an unknown
// brand so Mike asks who made it before asking for anything else.
function requirements(brandName) {
  const b = resolve(brandName);
  if (!b) return null;
  return {
    brand: b.id,
    brandLabel: b.label,
    canCheck: !!b.supported || !!b.publicRegistry,
    requires: (b.requires || []).map(f => ({ key: f.key, label: f.label, hint: f.hint, type: f.type || 'text' })),
    note: b.note || null,
  };
}

function catalogue() {
  return [
    ...IMPLEMENTED.map(b => ({
      id: b.id,
      label: b.label,
      supported: true,
      verified: b.verified !== false,
      requires: (b.requires || []).map(f => f.key),
    })),
    ...PENDING.map(b => ({
      id: b.id,
      label: b.label,
      supported: false,
      publicRegistry: b.publicRegistry,
      where: b.where,
      requires: (b.requires || []).map(f => f.key),
    })),
  ];
}

module.exports = { resolve, requirements, catalogue, FIELD };

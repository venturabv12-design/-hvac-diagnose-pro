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
    publicRegistry: true,
    where: 'warranty.goodmanmfg.com',
    requires: [FIELD.serial, FIELD.model],
    note: 'Their form resolves the model from the serial first, then looks up entitlement. ' +
          'Having the model from the tech skips a step.',
  },
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
    publicRegistry: true,
    where: 'rheem.registermyunit.com',
    requires: [FIELD.serial],
  },
  {
    id: 'lennox',
    label: 'Lennox',
    aliases: ['lennox', 'armstrong air', 'ducane'],
    publicRegistry: false,
    where: 'LennoxPros dealer portal',
    requires: [],
    note: 'No public registry. Registration status requires a dealer login, so no ' +
          'amount of information from the tech will get it. Say so plainly.',
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

'use strict';

// Brand registry.
//
// Adding a manufacturer is adding one file here — that is deliberate. Each brand
// has its own lobby, its own way of being asked, and its own way of answering, and
// when one of them redecorates only that file changes.
//
// Three states, because "we can't check this one" and "we haven't built this one
// yet" are different answers and Mike must not blur them:
//
//   supported: true                        → wired and verified against a real serial
//   supported: false, publicRegistry: true → a public lookup exists, not wired yet
//   supported: false, publicRegistry: false→ no public lookup; dealer portal only
//
// Anything unknown falls through to null and Mike says he can't verify it, rather
// than guessing. Guessing is what the serial-decoder apps already do.

const trane = require('./trane');

const PENDING = [
  {
    id: 'goodman',
    label: 'Goodman / Amana / Daikin',
    aliases: ['goodman', 'amana', 'daikin'],
    publicRegistry: true,
    where: 'warranty.goodmanmfg.com',
    note: 'Public lookup takes serial, model, last name and zip.',
  },
  {
    id: 'carrier',
    label: 'Carrier / Bryant / Payne',
    aliases: ['carrier', 'bryant', 'payne'],
    publicRegistry: true,
    where: 'carrier.com/residential/en/us/warranty-lookup/',
  },
  {
    id: 'rheem',
    label: 'Rheem / Ruud',
    aliases: ['rheem', 'ruud'],
    publicRegistry: true,
    where: 'rheem.registermyunit.com',
  },
  {
    id: 'lennox',
    label: 'Lennox',
    aliases: ['lennox', 'armstrong air', 'ducane'],
    publicRegistry: false,
    where: 'LennoxPros dealer portal',
    note: 'No public registry. Registration status requires a dealer login.',
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
    if (b.aliases.some(a => q.includes(a))) {
      return Object.assign({ supported: false }, b);
    }
  }
  return null;
}

function catalogue() {
  return [
    ...IMPLEMENTED.map(b => ({ id: b.id, label: b.label, supported: true })),
    ...PENDING.map(b => ({
      id: b.id,
      label: b.label,
      supported: false,
      publicRegistry: b.publicRegistry,
      where: b.where,
    })),
  ];
}

module.exports = { resolve, catalogue };

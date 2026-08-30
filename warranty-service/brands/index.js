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
    // Reads inside a sentence: "Carrier just needs <label> alongside the serial."
    // The old phrasing was a question, which concatenated to "just needs is the
    // homeowner the original purchaser alongside the serial."
    label: 'whether the homeowner is the original purchaser',
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
    // ICP — Heil, Tempstar, Comfortmaker, Arcoaire, KeepRite, Day & Night — is owned by
    // Carrier Global, and the equipment is the same box under a different badge. Brandon,
    // ten years in the field (2026-08-30): "I know Carrier and ICP work because I've done
    // it before. They all look the same. They're all the same." He has looked ICP serials
    // up on Carrier's own form and got the record. Field experience beats our guess here,
    // so a tech typing Heil now reaches a real registry instead of "not wired yet".
    //
    // Carrier's consumer page does not advertise the ICP brands by name, so this is
    // wired on his account, not on their marketing. The failure direction stays safe:
    // if their registry genuinely has no record for an ICP serial it reports "no
    // registration came back" with both causes named, and the guard layer keeps Mike
    // from turning that into "not covered".
    aliases: ['carrier', 'bryant', 'payne',
              'heil', 'tempstar', 'comfortmaker', 'arcoaire', 'keeprite', 'kee prite',
              'day & night', 'day and night', 'day-night', 'icp', 'international comfort'],
    publicRegistry: true,
    // www. is not cosmetic here. The bare host 301-redirects, and on a cold profile
    // that extra hop in front of a heavy SPA was enough to blow the 45s page budget
    // and surface as SITE_DOWN — while curl got 200 from www in 2.6s at the same
    // moment. Point at the address that actually serves the page.
    where: 'https://www.carrier.com/residential/en/us/warranty-lookup/',
    requires: [FIELD.serial, FIELD.originalPurchaser],
    note: 'Serial plus original-purchaser only — no last name or zip. Covers the ICP brands (Heil, Tempstar, Comfortmaker, Arcoaire, KeepRite, Day & Night) — same Carrier registry.',
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
    // 'armstrong air' alone never matched a tech typing just "Armstrong" — resolve()
    // asks whether the TECH'S words contain the alias, so the shorter form has to be
    // listed too. Our own label says "Lennox / Armstrong / Ducane" while Mike was
    // telling anyone who typed Armstrong that the brand was not wired.
    aliases: ['lennox', 'armstrong', 'armstrong air', 'ducane', 'aire-flo', 'aireflo'],
    // CORRECTED 2026-08-28 — Brandon: "I don't need a login for Lennox either."
    // He is right. lennox.com/residential/owners/assistance/warranty/ is a public
    // "Lennox Warranty Lookup" with a serial field and a Search button. The dealer
    // portal exists, but it is not the only way in, and the note here previously told
    // technicians the opposite.
    publicRegistry: true,
    where: 'https://www.lennox.com/residential/owners/assistance/warranty/',
    // VERIFIED against the live page 2026-08-29 by enumerating its forms: the
    // "Lennox Warranty Lookup" takes the SERIAL AND NOTHING ELSE. The last name
    // belongs to a different form further down the page ("Need a Product Warranty
    // Certificate?") and the zip belongs to the dealer finder in the site header —
    // neither is part of this lookup. Asking a technician for them made him hunt down
    // the homeowner's details for no reason, and worse, it fed the planner fields from
    // three separate forms, which is what stopped Lennox ever submitting.
    requires: [FIELD.serial],
    note: 'Public lookup, no login. Serial only.',
  },
];

// Trane's hand-written integration is retired. It posted a fixed payload shape to
// their private warranty-registration API, and Trane changed the form — their lookup
// page now carries a last-name field alongside the serial — so our old shape stopped
// matching and every Trane lookup came back as "they moved their warranty page". The
// page had not moved at all; we were calling it wrong. Their API still answers 200
// when their own page calls it.
//
// The generic agent reads whatever form is actually on the page, which is why the
// other five brands survived changes like this untouched. Verified against Trane's
// live form: reaches it and completes, with and without a last name. Keeping a
// bespoke integration for one brand bought us nothing and cost us the brand.
//
// trane.js is retained for its serial parser and its unit tests, but is no longer
// the lookup path.
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

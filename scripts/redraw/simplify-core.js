#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * simplify-core.js — reduce a FULL traced netlist to the clean APPRENTICE CORE.
 *
 * A raw OEM trace includes every factory-optional part (start relay/cap/thermistor,
 * liquid-line solenoid, the pressure/temp safety string, crankcase heater). Great
 * for accuracy, too busy for a brand-new apprentice or a homeowner. This keeps the
 * core loop — power -> single-pole contactor -> compressor + fan + run capacitor —
 * and represents the 24V control as a single clean "from the indoor unit" feed to
 * the contactor coil (the optional safety switches live in that 24V line on the
 * real unit; they stay in the full manual, one tap away).
 *
 * Pure + deterministic. No AI. Does NOT invent power connections — it only DROPS
 * optional parts and collapses the 24V control path to coil<->indoor supply.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const { roleOf } = require('./render-illustration-svg.js');

const CORE_ROLES = new Set(['power', 'contactor', 'compressor', 'runcap', 'fan']);

function simplifyCoreAC(nl) {
  const comps = (nl.components || []).map(c => ({ c, role: roleOf(c) }));
  const keep = comps.filter(x => CORE_ROLES.has(x.role)).map(x => x.c);
  const keepIds = new Set(keep.map(c => c.id));
  const cont = keep.find(c => roleOf(c) === 'contactor');

  // Clean 24V source (indoor unit) — replaces whatever the trace called the external 24V supply.
  const IDU = { id: 'IDU', kind: 'terminal-block', label: '24V (from indoor unit)' };

  const terminals = (nl.terminals || []).filter(t => keepIds.has(t.component));
  terminals.push({ component: 'IDU', id: 'R' }, { component: 'IDU', id: 'C' });

  // keep only nets fully inside the core (both endpoints kept) — never fabricate a power tie
  const nets = (nl.nets || []).filter(n => (n.endpoints || []).every(e => keepIds.has(e.component)));

  // collapse the 24V control path to two clean wires: coil <-> indoor supply
  if (cont) {
    nets.push({ id: 'ctl_call', voltage_class: 'low-voltage', wire_color: 'yellow', label: '24V call to coil',
      plain: '24-volt "turn on" signal from indoors to the contactor coil',
      endpoints: [{ component: 'IDU', terminal: 'R' }, { component: cont.id, terminal: 'COIL1' }] });
    nets.push({ id: 'ctl_com', voltage_class: 'low-voltage', wire_color: 'blue', label: '24V common',
      plain: '24-volt common back to the indoor unit',
      endpoints: [{ component: cont.id, terminal: 'COIL2' }, { component: 'IDU', terminal: 'C' }] });
  }

  return {
    ...nl,
    components: [...keep, IDU],
    terminals,
    nets,
    notes: [ ...(nl.notes || []), 'Apprentice CORE view — factory-optional safety/start parts left to the full manual.' ],
  };
}

module.exports = { simplifyCoreAC };

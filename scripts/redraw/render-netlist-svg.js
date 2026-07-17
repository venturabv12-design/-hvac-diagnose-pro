#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * renderNetlistSVG(netlist) -> clean, legible, color-coded SVG string.
 *
 * PURE + DETERMINISTIC. No AI, no network, no DB, no randomness, no Date.now().
 * The SAME netlist always renders BYTE-IDENTICAL output (stable sort on ids +
 * fixed grid layout) so the result is cacheable and diffable, and the verify
 * gate can round-trip it.
 *
 * The whole accuracy story: the AI extracts STRUCTURE (a netlist); this file is
 * the ONLY thing that emits geometry. The model never draws a coordinate — so
 * there is nowhere for a hallucinated wire to hide. Every rendered net carries
 * data-net / data-from / data-to attributes = the machine-readable proof of what
 * was actually drawn, which verify-gate.js checks set-equal to the source.
 *
 * Layout: components are laid out on a fixed grid (row-major, ranked by net
 * degree so busy parts sit centrally); nets are drawn as color-coded orthogonal
 * polylines routed on per-net horizontal lanes below the component band. Style
 * matches the app's dark aesthetic (teal/rust palette, big >=14px labels).
 *
 * VOLTAGE-CLASS COLOR CODE (safety-legible at a glance):
 *   line          240/208V  -> red-orange (danger)
 *   start-winding run/start -> amber
 *   low-voltage   24V ctrl  -> teal
 *   ground                  -> green
 *   signal                  -> violet
 *   unknown                 -> slate
 *
 * Exported: renderNetlistSVG(netlist) and helpers (VOLTAGE_COLORS, escapeXml).
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const VOLTAGE_COLORS = {
  'line':          { stroke: '#ff5a3c', label: '240V LINE' },
  'start-winding': { stroke: '#ffb020', label: 'START/RUN' },
  'low-voltage':   { stroke: '#00c2b2', label: '24V CTRL' },
  'ground':        { stroke: '#3ddc84', label: 'GROUND' },
  'signal':        { stroke: '#a06bff', label: 'SIGNAL' },
  'unknown':       { stroke: '#8a94a6', label: 'UNKNOWN' },
};

function escapeXml(s) {
  return String(s == null ? '' : s)
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#39;');
}

// Stable numeric-aware compare so ids sort deterministically (n2 < n10).
function stableCompare(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

// Terminal endpoint key: "COMP/TERM" — the canonical identity used everywhere.
function epKey(component, terminal) {
  return String(component) + '/' + String(terminal);
}

/**
 * renderNetlistSVG(netlist) -> string (SVG). Deterministic + pure.
 * Throws a TypeError if the netlist is missing required arrays (fail loud in
 * the pipeline; callers catch and skip persistence).
 */
function renderNetlistSVG(netlist) {
  if (!netlist || typeof netlist !== 'object') throw new TypeError('renderNetlistSVG: netlist must be an object');
  const components = Array.isArray(netlist.components) ? netlist.components : null;
  const nets = Array.isArray(netlist.nets) ? netlist.nets : null;
  if (!components || !nets) throw new TypeError('renderNetlistSVG: netlist.components and netlist.nets are required arrays');

  // ── degree per component (how many nets touch it) — ranks busy parts central ──
  const degree = {};
  components.forEach(c => { degree[c.id] = 0; });
  nets.forEach(n => {
    (n.endpoints || []).forEach(ep => {
      if (degree[ep.component] != null) degree[ep.component] += 1;
    });
  });

  // ── deterministic component order: highest degree first, id tiebreak ──────────
  const comps = components.slice().sort((a, b) => {
    const d = (degree[b.id] || 0) - (degree[a.id] || 0);
    return d !== 0 ? d : stableCompare(a.id, b.id);
  });

  // ── grid geometry (fixed) ─────────────────────────────────────────────────────
  const COLS = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(comps.length))));
  const BOX_W = 190, BOX_H = 96;
  const GAP_X = 70, GAP_Y = 64;
  const MARGIN = 40;
  const HEADER_H = 92;                      // title + legend band
  const rows = Math.ceil(comps.length / COLS);

  // Terminal list per component (deterministic order), for pin dots + net anchors.
  const termsByComp = {};
  (Array.isArray(netlist.terminals) ? netlist.terminals : []).forEach(t => {
    (termsByComp[t.component] = termsByComp[t.component] || []).push(t);
  });
  Object.keys(termsByComp).forEach(k => termsByComp[k].sort((a, b) => stableCompare(a.id, b.id)));

  // Place each component box on the grid; record anchor points for each terminal.
  const pos = {};            // compId -> {x,y,w,h,cx,cy}
  const termAnchor = {};     // "COMP/TERM" -> {x,y}
  comps.forEach((c, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = MARGIN + col * (BOX_W + GAP_X);
    const y = HEADER_H + MARGIN + row * (BOX_H + GAP_Y);
    pos[c.id] = { x, y, w: BOX_W, h: BOX_H, cx: x + BOX_W / 2, cy: y + BOX_H / 2 };
    const terms = termsByComp[c.id] || [];
    // Spread terminals along the box bottom edge as labeled pins.
    const n = Math.max(terms.length, 1);
    terms.forEach((t, ti) => {
      const px = x + (BOX_W * (ti + 1)) / (n + 1);
      const py = y + BOX_H;
      termAnchor[epKey(c.id, t.id)] = { x: px, y: py };
    });
  });

  const gridBottom = HEADER_H + MARGIN + rows * (BOX_H + GAP_Y);

  // ── net lanes: each net gets its own horizontal lane below the grid ───────────
  const netsSorted = nets.slice().sort((a, b) => stableCompare(a.id, b.id));
  const LANE_H = 30;
  const laneTop = gridBottom + 10;
  const width = MARGIN * 2 + COLS * BOX_W + (COLS - 1) * GAP_X;
  const height = laneTop + netsSorted.length * LANE_H + 40;

  // ── build SVG ─────────────────────────────────────────────────────────────────
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="ui-sans-serif,system-ui,Arial,sans-serif">`);
  out.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#0e131a"/>`);

  // Title
  out.push(`<text x="${MARGIN}" y="34" fill="#e8ecf2" font-size="20" font-weight="700">${escapeXml(netlist.model_key || 'Wiring')} — ${escapeXml(netlist.circuit_type || 'circuit')}</text>`);

  // Legend (only classes actually present, deterministic order).
  const present = [];
  netsSorted.forEach(n => {
    const vc = VOLTAGE_COLORS[n.voltage_class] ? n.voltage_class : 'unknown';
    if (present.indexOf(vc) === -1) present.push(vc);
  });
  present.sort(stableCompare);
  let lx = MARGIN;
  present.forEach(vc => {
    const c = VOLTAGE_COLORS[vc];
    out.push(`<rect x="${lx}" y="56" width="26" height="10" rx="2" fill="${c.stroke}"/>`);
    out.push(`<text x="${lx + 32}" y="65" fill="#aab3c0" font-size="12">${escapeXml(c.label)}</text>`);
    lx += 32 + c.label.length * 7 + 22;
  });

  // Component boxes + terminal pins.
  comps.forEach(c => {
    const p = pos[c.id];
    out.push(`<g data-comp="${escapeXml(c.id)}">`);
    out.push(`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="10" fill="#1a212b" stroke="#31404f" stroke-width="2"/>`);
    out.push(`<text x="${p.cx}" y="${p.y + 26}" fill="#e8ecf2" font-size="15" font-weight="600" text-anchor="middle">${escapeXml(c.label)}</text>`);
    if (c.kind) out.push(`<text x="${p.cx}" y="${p.y + 44}" fill="#6b7787" font-size="11" text-anchor="middle">${escapeXml(c.kind)}</text>`);
    const terms = termsByComp[c.id] || [];
    const n = Math.max(terms.length, 1);
    terms.forEach((t, ti) => {
      const px = p.x + (p.w * (ti + 1)) / (n + 1);
      const py = p.y + p.h;
      out.push(`<circle cx="${px}" cy="${py}" r="3.5" fill="#e8ecf2"/>`);
      out.push(`<text x="${px}" y="${py + 15}" fill="#c4ccd6" font-size="12" text-anchor="middle">${escapeXml(t.label || t.id)}</text>`);
    });
    out.push(`</g>`);
  });

  // Nets: color-coded orthogonal polylines on per-net lanes, tagged for verify.
  netsSorted.forEach((net, li) => {
    const vc = VOLTAGE_COLORS[net.voltage_class] ? net.voltage_class : 'unknown';
    const color = VOLTAGE_COLORS[vc].stroke;
    const laneY = laneTop + li * LANE_H + LANE_H / 2;

    // Endpoints in deterministic order; anchor to terminal pin if known, else box center.
    const eps = (net.endpoints || []).slice().sort((a, b) =>
      stableCompare(epKey(a.component, a.terminal), epKey(b.component, b.terminal)));

    for (let k = 0; k < eps.length; k++) {
      const from = eps[k];
      // Draw a labeled net segment from EACH endpoint down to the net's lane; and
      // connect consecutive endpoints along the lane. Each drawn segment carries
      // data-net + data-from + data-to so the redraw is machine-verifiable.
      const aAnchor = termAnchor[epKey(from.component, from.terminal)] ||
        (pos[from.component] ? { x: pos[from.component].cx, y: pos[from.component].y + pos[from.component].h } : { x: MARGIN, y: laneY });
      // vertical drop to the lane
      out.push(`<polyline points="${aAnchor.x.toFixed(1)},${aAnchor.y.toFixed(1)} ${aAnchor.x.toFixed(1)},${laneY.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.9"/>`);

      if (k < eps.length - 1) {
        const to = eps[k + 1];
        const bAnchor = termAnchor[epKey(to.component, to.terminal)] ||
          (pos[to.component] ? { x: pos[to.component].cx, y: pos[to.component].y + pos[to.component].h } : { x: width - MARGIN, y: laneY });
        // horizontal run along the lane connecting this endpoint to the next.
        out.push(`<polyline data-net="${escapeXml(net.id)}" data-from="${escapeXml(epKey(from.component, from.terminal))}" data-to="${escapeXml(epKey(to.component, to.terminal))}" points="${aAnchor.x.toFixed(1)},${laneY.toFixed(1)} ${bAnchor.x.toFixed(1)},${laneY.toFixed(1)}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`);
      }
    }

    // Net label chip at the left margin of the lane.
    const chip = (net.label ? net.label + ' ' : '') + (net.wire_color ? '(' + net.wire_color + (net.gauge ? ' ' + net.gauge + 'ga' : '') + ')' : '');
    out.push(`<text x="${MARGIN}" y="${(laneY - 6).toFixed(1)}" fill="${color}" font-size="12" font-weight="600">${escapeXml(net.id)}: ${escapeXml(chip)}</text>`);
  });

  out.push('</svg>');
  return out.join('');
}

module.exports = { renderNetlistSVG, VOLTAGE_COLORS, escapeXml, epKey };

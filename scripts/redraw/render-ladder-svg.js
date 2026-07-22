#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * renderLadderSVG(ladder) -> clean, legible HVAC LADDER (elementary) diagram SVG.
 *
 * PURE + DETERMINISTIC. No AI, no network, no randomness. Same ladder → identical
 * bytes (cacheable + diffable). The vision model emits STRUCTURE (rungs: rail →
 * series contacts → load → rail); this file is the ONLY thing that emits geometry.
 *
 * Why a ladder (not a node graph): a wiring diagram is readable when it's drawn
 * the way a tech already thinks about it — two power rails, one LOAD per rung,
 * the switches that control it in series to its left. That's the whole "easy to
 * see and follow" win. Rendered black-on-white like a real manual (prints clean,
 * readable in sunlight), voltage color only on the rails/wires for safety cueing.
 *
 * Each drawn connection carries data-conn="A|B" (canonical endpoint pair) so the
 * verify gate can round-trip the drawing against the source.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const CLASS_COLOR = {
  'line':          '#d92b1c',   // 240V — danger red
  'start-winding': '#d98a00',   // start/run — amber
  'low-voltage':   '#0f8a7e',   // 24V control — teal
  'ground':        '#2a8a3e',
  'signal':        '#6b3fd0',
  'unknown':       '#333a44',
};

function escapeXml(s) {
  return String(s == null ? '' : s)
    .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;')
    .split('"').join('&quot;').split("'").join('&#39;');
}
const f1 = (n) => Number(n).toFixed(1);

// ── geometry constants ────────────────────────────────────────────────────────
const M = 46;                 // outer margin
const RAIL_INSET = 74;        // rail distance from section edge
const RUNG_GAP = 128;         // vertical spacing between rungs
const SECT_TITLE_H = 46;      // section title band
const SECT_GAP = 54;          // gap between sections
const WIDTH = 1180;
const SYM = 30;               // nominal symbol half-extent

// ── symbol renderers: each returns {svg, wIn, wOut} drawn centred at (x,y) ──────
// They draw ON the rung line; the rung polyline is drawn separately behind them.
// Contact / switch — textbook NO (open pads) vs NC (pads + diagonal bar).
// White knockout behind the pads so the rung line doesn't muddy the symbol.
function symContact(x, y, el, color) {
  const nc = el.state === 'NC';
  const g = [];
  const hw = 11, ph = 12;
  g.push(`<rect x="${f1(x-hw-3)}" y="${f1(y-ph-3)}" width="${f1((hw+3)*2)}" height="${f1((ph+3)*2)}" fill="#fff"/>`);
  g.push(`<line x1="${f1(x-hw)}" y1="${f1(y-ph)}" x2="${f1(x-hw)}" y2="${f1(y+ph)}" stroke="#111" stroke-width="2.6"/>`);
  g.push(`<line x1="${f1(x+hw)}" y1="${f1(y-ph)}" x2="${f1(x+hw)}" y2="${f1(y+ph)}" stroke="#111" stroke-width="2.6"/>`);
  // stub the rung into each pad
  g.push(`<line x1="${f1(x-hw-3)}" y1="${f1(y)}" x2="${f1(x-hw)}" y2="${f1(y)}" stroke="#111" stroke-width="2.2"/>`);
  g.push(`<line x1="${f1(x+hw)}" y1="${f1(y)}" x2="${f1(x+hw+3)}" y2="${f1(y)}" stroke="#111" stroke-width="2.2"/>`);
  if (nc) g.push(`<line x1="${f1(x-hw-2)}" y1="${f1(y+ph)}" x2="${f1(x+hw+2)}" y2="${f1(y-ph)}" stroke="#111" stroke-width="2.4"/>`);
  labelAbove(g, x, y, el.label, el.sub, ph + 2);
  if (el.state === 'NO' || el.state === 'NC') g.push(`<text x="${f1(x)}" y="${f1(y+ph+13)}" text-anchor="middle" font-size="9.5" fill="#999">${el.state}</text>`);
  return { svg: g.join(''), half: hw + 2 };
}

// Relay/contactor coil — standard circle (NO ~ symbol). Terminals below.
function symCoil(x, y, el, color) {
  const g = [];
  const r = 17;
  g.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#fff" stroke="${color}" stroke-width="2.8"/>`);
  labelAbove(g, x, y, el.label, el.sub, r + 2);
  if (el.terminals && el.terminals.length) labelBelow(g, x, y, el.terminals.join('–'), r + 2);
  return { svg: g.join(''), half: r };
}

// Inline run/start capacitor — two plates (one curved), clearly a cap.
function symCapacitor(x, y, el, color) {
  const g = [];
  const col = CLASS_COLOR['start-winding'];
  g.push(`<rect x="${f1(x-14)}" y="${f1(y-16)}" width="28" height="32" fill="#fff"/>`);
  g.push(`<line x1="${f1(x-5)}" y1="${f1(y-13)}" x2="${f1(x-5)}" y2="${f1(y+13)}" stroke="${col}" stroke-width="3"/>`);
  g.push(`<path d="M ${f1(x+5)} ${f1(y-13)} q 8 13 0 26" fill="none" stroke="${col}" stroke-width="3"/>`);
  g.push(`<line x1="${f1(x-14)}" y1="${f1(y)}" x2="${f1(x-5)}" y2="${f1(y)}" stroke="${col}" stroke-width="2"/>`);
  g.push(`<line x1="${f1(x+7)}" y1="${f1(y)}" x2="${f1(x+14)}" y2="${f1(y)}" stroke="${col}" stroke-width="2"/>`);
  labelAbove(g, x, y, el.label, el.sub, 16);
  return { svg: g.join(''), half: 14 };
}

// Fuse — rectangle with a line through.
function symFuse(x, y, el, color) {
  const g = [];
  g.push(`<rect x="${f1(x-16)}" y="${f1(y-8)}" width="32" height="16" rx="3" fill="#fff" stroke="#111" stroke-width="2.2"/>`);
  g.push(`<line x1="${f1(x-16)}" y1="${f1(y)}" x2="${f1(x+16)}" y2="${f1(y)}" stroke="#111" stroke-width="1.6"/>`);
  labelAbove(g, x, y, el.label, el.sub, 10);
  return { svg: g.join(''), half: 16 };
}

// Generic device (thermistor / sensor / start-circuit device / other) — a clear
// labeled node with a diagonal (sensor) mark, sized like the other symbols.
function symDevice(x, y, el, color) {
  const g = [];
  const r = 13;
  g.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#fff" stroke="#111" stroke-width="2.4"/>`);
  g.push(`<line x1="${f1(x-8)}" y1="${f1(y+8)}" x2="${f1(x+9)}" y2="${f1(y-9)}" stroke="#111" stroke-width="2"/>`);
  labelAbove(g, x, y, el.label, el.sub, r + 2);
  return { svg: g.join(''), half: r };
}

function symMotor(x, y, el, color) {
  const g = [];
  const r = 27;
  g.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#fff" stroke="${color}" stroke-width="2.8"/>`);
  g.push(`<text x="${f1(x)}" y="${f1(y+5)}" text-anchor="middle" font-size="15" font-weight="700" fill="${color}">M</text>`);
  labelAbove(g, x, y, el.label, el.sub, r + 2);
  // terminal pins spread along the bottom of the motor so bridges can anchor distinctly
  const terms = el.terminals || [];
  const termPos = {};
  const spread = Math.min(r * 1.4, 12 * Math.max(terms.length - 1, 1));
  terms.forEach((t, i) => {
    const tx = terms.length === 1 ? x : x - spread + (2 * spread * i) / (terms.length - 1);
    const ty = y + r + 4;
    g.push(`<circle cx="${f1(tx)}" cy="${f1(ty)}" r="2.4" fill="${color}"/>`);
    g.push(`<text x="${f1(tx)}" y="${f1(ty+13)}" text-anchor="middle" font-size="11" font-weight="600" fill="#333">${escapeXml(t)}</text>`);
    termPos[t] = { x: tx, y: ty };
  });
  return { svg: g.join(''), half: r, terms: termPos };
}

function symHeater(x, y, el, color) {
  const g = [];
  const w = 46, h = 20;
  g.push(`<rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${w}" height="${h}" fill="#fff" stroke="#111" stroke-width="2.2"/>`);
  // hatching
  for (let i=-w/2+6; i<w/2-2; i+=8) g.push(`<line x1="${f1(x+i)}" y1="${f1(y-h/2)}" x2="${f1(x+i+6)}" y2="${f1(y+h/2)}" stroke="#111" stroke-width="1.3"/>`);
  labelAbove(g, x, y, el.label, el.sub, h/2 + 2);
  return { svg: g.join(''), half: w/2 };
}

function symSolenoid(x, y, el, color) {
  const g = [];
  const w = 38, h = 24;
  g.push(`<rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${w}" height="${h}" rx="3" fill="#fff" stroke="${color}" stroke-width="2.6"/>`);
  g.push(`<line x1="${f1(x-w/2)}" y1="${f1(y)}" x2="${f1(x+w/2)}" y2="${f1(y)}" stroke="${color}" stroke-width="1.6"/>`);
  labelAbove(g, x, y, el.label, el.sub, h/2 + 2);
  return { svg: g.join(''), half: w/2 };
}

function symTransformer(x, y, el, color) {
  const g = [];
  const r = 8;
  // two stacked winding bumps + core
  for (let i=0;i<3;i++) g.push(`<path d="M ${f1(x-18+i*12)} ${f1(y)} a ${r} ${r} 0 0 1 12 0" fill="none" stroke="#111" stroke-width="2"/>`);
  g.push(`<line x1="${f1(x-20)}" y1="${f1(y+6)}" x2="${f1(x+20)}" y2="${f1(y+6)}" stroke="#111" stroke-width="1.6"/>`);
  labelAbove(g, x, y, el.label, el.sub, 14);
  if (el.terminals) labelBelow(g, x, y, el.terminals.join('–'), 12);
  return { svg: g.join(''), half: 22 };
}

function symBoard(x, y, el, color) {
  const g = [];
  const terms = el.terminals || [];
  const w = Math.max(90, terms.length * 24), h = 44;
  g.push(`<rect x="${f1(x-w/2)}" y="${f1(y-h/2)}" width="${w}" height="${h}" rx="5" fill="#fff" stroke="${color}" stroke-width="2.6"/>`);
  g.push(`<text x="${f1(x)}" y="${f1(y-2)}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${color}">${escapeXml(el.label)}</text>`);
  // terminal pins along the bottom
  terms.forEach((t, i) => {
    const px = x - w/2 + (w * (i+1))/(terms.length+1);
    g.push(`<circle cx="${f1(px)}" cy="${f1(y+h/2)}" r="2.6" fill="#111"/>`);
    g.push(`<text x="${f1(px)}" y="${f1(y+h/2+14)}" text-anchor="middle" font-size="10.5" fill="#333">${escapeXml(t)}</text>`);
  });
  labelAbove(g, x, y, el.sub || '', '', h/2 + 2);
  return { svg: g.join(''), half: w/2 };
}

function symTerminal(x, y, el, color) {
  const g = [];
  // solid terminal node with a ring; designation label ABOVE, never crammed inside
  g.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);
  g.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="7.5" fill="none" stroke="${color}" stroke-width="1.6"/>`);
  labelAbove(g, x, y, el.label, el.sub, 8);
  return { svg: g.join(''), half: 8 };
}

// label helpers — BOTH label and sub stack ABOVE the symbol (never over it)
function labelAbove(g, x, y, label, sub, off) {
  off = off == null ? 16 : off;
  const base = y - off - 7;            // just above the symbol top
  if (label) g.push(`<text x="${f1(x)}" y="${f1(sub ? base - 13 : base)}" text-anchor="middle" font-size="13" font-weight="700" fill="#111">${escapeXml(label)}</text>`);
  if (sub) g.push(`<text x="${f1(x)}" y="${f1(base)}" text-anchor="middle" font-size="10.5" fill="#666">${escapeXml(sub)}</text>`);
}
function labelBelow(g, x, y, txt, off) {
  off = off == null ? 16 : off;
  if (txt) g.push(`<text x="${f1(x)}" y="${f1(y+off+15)}" text-anchor="middle" font-size="11" fill="#444">${escapeXml(txt)}</text>`);
}

const symOverload = (x, y, el, color) => symContact(x, y, { ...el, state: 'NC' }, color);
const SYMBOLS = {
  contact: symContact, switch: symContact, overload: symOverload,
  coil: symCoil, motor: symMotor, heater: symHeater, solenoid: symSolenoid,
  transformer: symTransformer, board: symBoard, terminal: symTerminal,
  capacitor: symCapacitor, fuse: symFuse, other: symDevice, sensor: symDevice,
};

// ── main ────────────────────────────────────────────────────────────────────
function renderLadderSVG(ladder) {
  if (!ladder || !Array.isArray(ladder.sections)) throw new TypeError('renderLadderSVG: ladder.sections[] required');
  const out = [];
  const railLX = M + RAIL_INSET;
  const railRX = WIDTH - M - RAIL_INSET;
  let y = M + 40;

  const body = [];
  // title
  body.push(`<text x="${M}" y="${f1(M+6)}" font-size="21" font-weight="800" fill="#0b0d10">${escapeXml(ladder.model_key || 'Wiring')}  —  ${escapeXml(ladder.circuit_type || 'circuit')}</text>`);
  body.push(`<text x="${M}" y="${f1(M+26)}" font-size="12.5" fill="#7a8390">Redrawn clean from the OEM diagram · verified to source · one circuit per rung</text>`);
  y = M + 56;

  const termXY = {};  // "COMP/T" -> {x,y} for bridge anchors + connection export
  const connOut = []; // data-conn pairs

  ladder.sections.forEach((sec) => {
    const color = CLASS_COLOR[sec.voltage_class] || CLASS_COLOR.unknown;
    const rungs = Array.isArray(sec.rungs) ? sec.rungs : [];
    const secTop = y;
    // section title
    body.push(`<rect x="${M}" y="${f1(secTop)}" width="${WIDTH-2*M}" height="30" rx="6" fill="${color}" opacity="0.10"/>`);
    body.push(`<rect x="${M}" y="${f1(secTop)}" width="6" height="30" rx="3" fill="${color}"/>`);
    body.push(`<text x="${M+18}" y="${f1(secTop+20)}" font-size="14.5" font-weight="800" fill="${color}">${escapeXml(sec.title || sec.id)}</text>`);
    const ladderTop = secTop + 30 + 84;
    const railTopY = ladderTop - 16;
    const railBotY = ladderTop + (rungs.length - 1) * RUNG_GAP + 16;

    // rails
    body.push(`<line x1="${f1(railLX)}" y1="${f1(railTopY)}" x2="${f1(railLX)}" y2="${f1(railBotY)}" stroke="${color}" stroke-width="4.5"/>`);
    body.push(`<line x1="${f1(railRX)}" y1="${f1(railTopY)}" x2="${f1(railRX)}" y2="${f1(railBotY)}" stroke="${color}" stroke-width="4.5"/>`);
    body.push(`<text x="${f1(railLX)}" y="${f1(railTopY-8)}" text-anchor="middle" font-size="13" font-weight="800" fill="${color}">${escapeXml(sec.left_rail||'L1')}</text>`);
    body.push(`<text x="${f1(railRX)}" y="${f1(railTopY-8)}" text-anchor="middle" font-size="13" font-weight="800" fill="${color}">${escapeXml(sec.right_rail||'L2')}</text>`);

    // rungs
    rungs.forEach((rung, ri) => {
      const ry = ladderTop + ri * RUNG_GAP;
      const els = Array.isArray(rung.elements) ? rung.elements : [];
      // rung base line (behind symbols)
      body.push(`<line data-conn="${escapeXml(sec.left_rail||'L1')}|${escapeXml((els[0]&&els[0].label)||rung.id)}" x1="${f1(railLX)}" y1="${f1(ry)}" x2="${f1(railRX)}" y2="${f1(ry)}" stroke="#111" stroke-width="2.2"/>`);
      // rung title — raised well clear of element labels, styled as a section-ish caption
      body.push(`<text x="${f1(railLX-40)}" y="${f1(ry-62)}" font-size="12" font-weight="800" fill="#8a4b00" opacity="0.92">${escapeXml((rung.label||'').toUpperCase())}</text>`);
      // place elements evenly between rails (biased so the load sits right-ish)
      const n = els.length;
      const usable = railRX - railLX;
      els.forEach((el, ei) => {
        const frac = n === 1 ? 0.62 : (0.12 + 0.76 * (ei / (n - 1)));
        const ex = railLX + usable * frac;
        const fn = SYMBOLS[el.kind] || symTerminal;
        const r = fn(ex, ry, el, color);
        body.push(r.svg);
        // record terminal anchors for bridges — use precise per-terminal positions if the symbol returned them
        if (r.terms) {
          Object.keys(r.terms).forEach(t => { termXY[`${el.label}/${t}`] = r.terms[t]; });
        }
        (el.terminals || []).forEach(t => { if (!termXY[`${el.label}/${t}`]) termXY[`${el.label}/${t}`] = { x: ex, y: ry + (r.half||16) }; });
        if (el.label) termXY[`${el.label}`] = { x: ex, y: ry };
        // connection pair between consecutive elements
        if (ei > 0) connOut.push(`${els[ei-1].label}|${el.label}`);
      });
      // last element → right rail connection
      if (n) connOut.push(`${els[n-1].label}|${sec.right_rail||'L2'}`);
    });

    y = railBotY + SECT_GAP;
  });

  // bridges (run capacitors etc.) — rendered as discrete part CALLOUTS in a clean
  // band (never crossing leads). A tech thinks of a dual-run cap as one part with
  // HERM/C/FAN spades; we show it that way with what each spade lands on.
  const rawBridges = Array.isArray(ladder.bridges) ? ladder.bridges : [];
  // group bridges that describe the SAME part (same label) into one card with rows
  const grouped = [];
  const byLabel = {};
  rawBridges.forEach(b => {
    const key = b.label || 'part';
    if (!byLabel[key]) { byLabel[key] = { label: key, rows: [] }; grouped.push(byLabel[key]); }
    const tap = b.tap ? b.tap + ': ' : '';
    byLabel[key].rows.push(`${tap}${(b.between || []).join('  ↔  ')}`);
    connOut.push(`${(b.between||[])[0]}|${(b.between||[])[1]}`);
  });
  if (grouped.length) {
    const col = CLASS_COLOR['start-winding'];
    body.push(`<rect x="${M}" y="${f1(y)}" width="${WIDTH-2*M}" height="30" rx="6" fill="${col}" opacity="0.10"/>`);
    body.push(`<rect x="${M}" y="${f1(y)}" width="6" height="30" rx="3" fill="${col}"/>`);
    body.push(`<text x="${M+18}" y="${f1(y+20)}" font-size="14.5" font-weight="800" fill="${col}">RUN CAPACITORS &amp; OFF-RUNG PARTS</text>`);
    let cardX = M, cardY = y + 44, rowMaxH = 0;
    const COL_W = 372, PAD = 22;
    grouped.forEach((gp) => {
      const rows = gp.rows.slice(0, 4);
      const CARD_H = 44 + rows.length * 16;
      if (cardX + COL_W > WIDTH - M) { cardX = M; cardY += rowMaxH + PAD; rowMaxH = 0; }
      rowMaxH = Math.max(rowMaxH, CARD_H);
      body.push(`<rect x="${f1(cardX)}" y="${f1(cardY)}" width="${COL_W-PAD}" height="${CARD_H}" rx="9" fill="#fff" stroke="${col}" stroke-width="2.2"/>`);
      const sx = cardX + 34, sy = cardY + 30;
      body.push(`<line x1="${f1(sx-9)}" y1="${f1(sy-15)}" x2="${f1(sx-9)}" y2="${f1(sy+15)}" stroke="${col}" stroke-width="3.4"/>`);
      body.push(`<line x1="${f1(sx+9)}" y1="${f1(sy-15)}" x2="${f1(sx+9)}" y2="${f1(sy+15)}" stroke="${col}" stroke-width="3.4"/>`);
      body.push(`<line x1="${f1(sx-22)}" y1="${f1(sy)}" x2="${f1(sx-9)}" y2="${f1(sy)}" stroke="${col}" stroke-width="2"/>`);
      body.push(`<line x1="${f1(sx+9)}" y1="${f1(sy)}" x2="${f1(sx+22)}" y2="${f1(sy)}" stroke="${col}" stroke-width="2"/>`);
      body.push(`<text x="${f1(cardX+64)}" y="${f1(cardY+24)}" font-size="13.5" font-weight="800" fill="#0b0d10">${escapeXml(gp.label)}</text>`);
      let ty = cardY + 42;
      rows.forEach(txt => { body.push(`<text x="${f1(cardX+64)}" y="${f1(ty)}" font-size="11.5" fill="#444">${escapeXml(txt)}</text>`); ty += 16; });
      cardX += COL_W;
    });
    y = cardY + rowMaxH + 20;
  }

  const height = y + 30;
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${f1(height)}" viewBox="0 0 ${WIDTH} ${f1(height)}" font-family="ui-sans-serif,system-ui,Arial,sans-serif">`);
  out.push(`<rect x="0" y="0" width="${WIDTH}" height="${f1(height)}" fill="#ffffff"/>`);
  // machine-readable connection proof (hidden)
  out.push(`<metadata data-conns="${escapeXml(Array.from(new Set(connOut)).sort().join(';'))}"></metadata>`);
  out.push(body.join(''));
  out.push('</svg>');
  return out.join('');
}

module.exports = { renderLadderSVG, CLASS_COLOR, escapeXml };

if (require.main === module) {
  const fs = require('fs');
  const p = process.argv[2] || require('path').join(__dirname, 'ladder-sample.json');
  const ladder = JSON.parse(fs.readFileSync(p, 'utf8'));
  const svg = renderLadderSVG(ladder);
  const out = '/tmp/diagtest/ladder-out.svg';
  fs.writeFileSync(out, svg);
  console.log('rendered', p, '→', out, `(${(svg.length/1024).toFixed(1)} KB)`);
}

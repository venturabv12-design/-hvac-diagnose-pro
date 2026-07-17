#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * verifyRedraw(sourceNetlist, redraw) -> { state, score, mismatches }
 *
 * THE VERIFY GATE — the whole ballgame. A redraw is DRAFT (never trusted) until
 * it round-trips against the source. Fail-toward-distrust: any missing or
 * renamed connection fails the gate.
 *
 * This is the STRUCTURAL round-trip (deterministic, no AI, no network). It
 * derives a connection signature from the source netlist and from the redraw,
 * and asserts the redraw covers every source connection. `redraw` may be:
 *   - a netlist object (has .nets), OR
 *   - an SVG string produced by render-netlist-svg.js (parsed via its
 *     data-net/data-from/data-to attributes — the machine-readable proof of
 *     what was actually drawn).
 *
 * A "connection" is an unordered terminal pair {A,B} that shares a net. A net
 * with k endpoints contributes C(k,2) pairs. Comparing PAIRS (not raw net ids)
 * is rename-proof and catches a dropped endpoint even if the net still exists.
 *
 * SCORING:
 *   coverage    = (source pairs also present in redraw) / (source pairs)
 *   score       = coverage           // extra pairs in the redraw are tolerated
 *                                     // (we may intentionally draw one circuit),
 *                                     // but reported in mismatches for review.
 *   state       = 'verified' if score >= THRESHOLD (0.98) AND zero missing,
 *                 else 'draft'.
 *
 * Exported: verifyRedraw, THRESHOLD, connectionsFromNetlist, connectionsFromSvg.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const THRESHOLD = 0.98;

// Canonical unordered pair key for two terminal endpoints "COMP/TERM".
function pairKey(a, b) {
  return a < b ? a + '|' + b : b + '|' + a;
}

// Set of connection pairs from a netlist object. Each net's endpoints form a
// clique of pairs (a shared electrical node ties every endpoint to every other).
function connectionsFromNetlist(netlist) {
  const set = new Set();
  if (!netlist || !Array.isArray(netlist.nets)) return set;
  for (const net of netlist.nets) {
    const eps = Array.isArray(net.endpoints) ? net.endpoints : [];
    const keys = eps
      .filter(e => e && e.component != null && e.terminal != null)
      .map(e => String(e.component) + '/' + String(e.terminal));
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        set.add(pairKey(keys[i], keys[j]));
      }
    }
  }
  return set;
}

// Set of connection pairs recovered from a rendered SVG string. Reads every
// polyline's data-from / data-to (emitted by render-netlist-svg.js). A net drawn
// as a lane of consecutive segments (a-b, b-c) still recovers the full clique
// because we union all endpoints seen under the same data-net, then re-pair them.
function connectionsFromSvg(svg) {
  const set = new Set();
  if (typeof svg !== 'string') return set;
  const byNet = Object.create(null);   // netId -> Set(endpointKey)
  const re = /data-net="([^"]*)"[^>]*data-from="([^"]*)"[^>]*data-to="([^"]*)"/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    const net = m[1], from = m[2], to = m[3];
    if (!from || !to) continue;
    const s = byNet[net] || (byNet[net] = new Set());
    s.add(from); s.add(to);
  }
  for (const net in byNet) {
    const keys = Array.from(byNet[net]).sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        set.add(pairKey(keys[i], keys[j]));
      }
    }
  }
  return set;
}

function connectionsFrom(redraw) {
  if (typeof redraw === 'string') return connectionsFromSvg(redraw);
  return connectionsFromNetlist(redraw);
}

/**
 * verifyRedraw(sourceNetlist, redraw) -> { state, score, mismatches }
 *   state      : 'verified' | 'draft'
 *   score      : 0..1 coverage of source connections by the redraw
 *   mismatches : [{ kind:'missing'|'extra', pair:'A|B' }]  (missing = in source,
 *                not in redraw = disqualifying; extra = in redraw, not in source
 *                = tolerated, reported for review)
 */
function verifyRedraw(sourceNetlist, redraw) {
  const src = connectionsFromNetlist(sourceNetlist);
  const dst = connectionsFrom(redraw);

  const mismatches = [];
  let covered = 0;
  for (const pair of src) {
    if (dst.has(pair)) covered += 1;
    else mismatches.push({ kind: 'missing', pair });
  }
  for (const pair of dst) {
    if (!src.has(pair)) mismatches.push({ kind: 'extra', pair });
  }

  const total = src.size;
  const missing = mismatches.filter(x => x.kind === 'missing').length;
  const score = total === 0 ? 0 : covered / total;   // no source connections => can't verify
  const state = (total > 0 && missing === 0 && score >= THRESHOLD) ? 'verified' : 'draft';

  return { state, score, mismatches };
}

module.exports = { verifyRedraw, THRESHOLD, connectionsFromNetlist, connectionsFromSvg };

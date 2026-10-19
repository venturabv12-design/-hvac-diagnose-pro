'use strict';

// TRANE CERTIFICATE FALLBACK — the dealer-registration blind spot.
//
// `registrations/serial-number/search` (trane.js's primary call) only sees units the
// HOMEOWNER registered. A unit the DEALER registered answers 200 "Serial number not
// registered" with an empty registrations list — on a unit carrying a 10-year
// Residential Extended term. Verified live 2026-10-19 on a real unit: primary call
// said not-registered, while `registrations/certificate/search` returned the real
// term (Extended through 12/26/2030).
//
// The catch: certificate/search has no JSON shape — the coverage exists only inside
// the PDF certificate it returns (201, application/pdf). The PDF embeds Identity-H
// Lato subset fonts, so the text is CID-encoded and useless to `strings`/regex until
// each glyph is mapped back through the font's ToUnicode CMap. That is what the
// extractor below does: index the PDF objects, inflate the streams, build the
// code→unicode maps, walk the content streams' Tj/TJ text operators, and decode.
//
// Junk-serial guard: Trane's DB holds garbage records (a serial of all Z's returns a
// real-looking expired certificate), so the parsed Serial# must echo the serial we
// asked about or the whole certificate is discarded. The genuine-404 path in trane.js
// never reaches this module for the same reason.

const zlib = require('zlib');

function inflate(raw) {
  try { return zlib.inflateSync(raw); } catch (_) {}
  try { return zlib.inflateSync(raw, { finishFlush: zlib.constants.Z_SYNC_FLUSH }); } catch (_) {}
  return null;
}

// ── PDF text extraction (minimal: WinAnsi simple fonts + Identity-H via ToUnicode) ──

function indexObjects(latin1) {
  const objs = new Map();
  const re = /(\d+)\s+0\s+obj\b/g;
  let m;
  while ((m = re.exec(latin1))) {
    const end = latin1.indexOf('endobj', re.lastIndex);
    objs.set(Number(m[1]), latin1.slice(re.lastIndex, end > 0 ? end : latin1.length));
  }
  return objs;
}

function streamOf(body) {
  const m = /stream[\r\n]+/.exec(body);
  if (!m) return null;
  const start = m.index + m[0].length;
  const end = body.indexOf('endstream', start);
  const raw = Buffer.from(body.slice(start, end > 0 ? end : body.length), 'latin1');
  return inflate(raw);
}

function parseToUnicode(cmapBuf) {
  const out = new Map();
  if (!cmapBuf) return out;
  const txt = cmapBuf.toString('latin1');
  for (const blk of txt.match(/beginbfchar[\s\S]*?endbfchar/g) || []) {
    const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let m;
    while ((m = re.exec(blk))) {
      const b = Buffer.from(m[2], 'hex');
      let s = '';
      for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(b.readUInt16BE(i));
      out.set(parseInt(m[1], 16), s);
    }
  }
  for (const blk of txt.match(/beginbfrange[\s\S]*?endbfrange/g) || []) {
    const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let m;
    while ((m = re.exec(blk))) {
      const lo = parseInt(m[1], 16), hi = parseInt(m[2], 16), base = parseInt(m[3], 16);
      for (let i = lo; i <= hi; i++) out.set(i, String.fromCharCode(base + (i - lo)));
    }
  }
  return out;
}

function decodePiece(piece, kind, tu) {
  if (piece.startsWith('(')) {
    let raw = piece.slice(1, -1).replace(/\\([nrtbf()\\])/g, (_, c) =>
      ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[c] || c));
    if (kind === 'cid') {
      let s = '';
      for (let i = 0; i + 1 < raw.length; i += 2) {
        s += tu.get((raw.charCodeAt(i) << 8) | raw.charCodeAt(i + 1)) || '';
      }
      return s;
    }
    return raw;
  }
  const hx = piece.slice(1, -1).replace(/\s/g, '');
  const b = Buffer.from(hx.length % 2 ? hx + '0' : hx, 'hex');
  if (kind === 'cid') {
    let s = '';
    for (let i = 0; i + 1 < b.length; i += 2) s += tu.get(b.readUInt16BE(i)) || '';
    return s;
  }
  return b.toString('latin1');
}

function extractText(pdfBuf) {
  const latin1 = pdfBuf.toString('latin1');
  const objs = indexObjects(latin1);

  // font object → (kind, ToUnicode map)
  const fonts = new Map();
  for (const [num, body] of objs) {
    if (!/\/Type0|\/Type1|\/TrueType/.test(body)) continue;
    let tu = new Map();
    const m = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(body);
    if (m) tu = parseToUnicode(streamOf(objs.get(Number(m[1])) || ''));
    fonts.set(num, [body.includes('/Type0') ? 'cid' : 'simple', tu]);
  }

  // /Fn resource name → font object number
  const nameToObj = new Map();
  for (const [, body] of objs) {
    for (const fm of body.match(/\/Font\s*<<[\s\S]*?>>/g) || []) {
      const re = /\/([A-Za-z0-9]+)\s+(\d+)\s+0\s+R/g;
      let m;
      while ((m = re.exec(fm))) nameToObj.set(m[1], Number(m[2]));
    }
  }

  const TOKEN = /\/([A-Za-z0-9]+)\s+[\d.]+\s+Tf|\[((?:\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]*>|[^\[\]])*)\]\s*TJ|(\((?:\\[\s\S]|[^\\()])*\))\s*Tj|<([0-9A-Fa-f\s]*)>\s*Tj|(T\*|Td|TD|ET)/g;
  const STR = /\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]*>/g;

  let text = '';
  for (const [, body] of objs) {
    const s = streamOf(body);
    if (!s) continue;
    const content = s.toString('latin1');
    if (!content.includes('BT')) continue;
    let printable = 0;
    for (let i = 0; i < content.length; i++) {
      const c = content.charCodeAt(i);
      if ((c >= 32 && c < 127) || c === 9 || c === 10 || c === 13) printable++;
    }
    if (printable / content.length < 0.5) continue;

    let kind = 'simple', tu = new Map(), m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(content))) {
      if (m[1]) {
        [kind, tu] = fonts.get(nameToObj.get(m[1])) || ['simple', new Map()];
      } else if (m[2] !== undefined) {
        for (const p of m[2].match(STR) || []) text += decodePiece(p, kind, tu);
      } else if (m[3]) {
        text += decodePiece(m[3], kind, tu);
      } else if (m[4] !== undefined) {
        text += decodePiece('<' + m[4] + '>', kind, tu);
      } else if (m[5] && m[5] !== 'ET') {
        text += '\n';
      }
    }
  }
  return text;
}

// ── coverage lines out of the certificate text ──

function toISO(mdY) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(mdY);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function parseCertificate(pdfBuf, serial) {
  const text = extractText(pdfBuf).replace(/\s+/g, ' ');
  const key = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const want = key(serial);

  // e.g. "(Model# 4A7A4042L1000AA) (Serial# 20433G3K3F) (Residential Extended)
  //        Functional Parts : Term End Date is 12/26/2030 (10 Years )"
  const re = /\(Model#\s*([A-Z0-9-]+)\s*\)\s*\(Serial#\s*([A-Z0-9-]+)\s*\)\s*\(\s*([^)]+?)\s*\)\s*([A-Za-z /]+?)\s*:\s*Term End Date is\s*(\d{1,2}\/\d{1,2}\/\d{4})(?:\s*\(\s*([^)]*?)\s*\))?/g;

  const policies = [];
  let model = null;
  let m;
  while ((m = re.exec(text))) {
    if (key(m[2]) !== want) continue; // certificate can list sibling components
    model = m[1];
    const endDate = toISO(m[5]);
    const registered = /extended|registered/i.test(m[3]);
    policies.push({
      description: `${m[4].trim()} : Term End Date is ${m[5]}${m[6] ? ` (${m[6].trim()})` : ''}`,
      status: endDate && endDate >= new Date().toISOString().slice(0, 10) ? 'Active' : 'Expired',
      registered,
      termType: registered ? 'REGISTERED' : 'BASE',
      termLabel: m[3].trim(),
      startDate: null,
      endDate,
    });
  }

  if (!policies.length) return { found: false, reason: 'serial_not_in_registration' };

  const active = policies.filter(p => p.status === 'Active');
  const primary = active[0] || policies[0];

  return {
    found: true,
    model,
    category: null,
    installDate: null,
    registered: primary.registered,
    status: primary.status,
    termLabel: primary.termLabel,
    endDate: primary.endDate,
    coverage: policies,
    via: 'certificate',
    // The serial-only certificate is real but can be incomplete — component-specific
    // terms (e.g. compressor) may exist beyond what it prints. Mike must present this
    // as the confirmed term, not the exhaustive policy. Cross-check `model` against
    // the data plate: Trane's DB holds junk records, and a matching model is the
    // signal this certificate describes the unit in front of the tech.
    partial: true,
  };
}

// ── the in-page call: fetch the certificate PDF from inside Trane's session ──

async function fetchCertificate(page, serial, lastName) {
  const out = await page.evaluate(async ({ serialNumber, lastName }) => {
    const res = await fetch('/api/warranty-registration/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
      body: JSON.stringify({ service: 'registrations/certificate/search', lastName: lastName || '', serialNumber }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('pdf')) {
      let t = ''; try { t = await res.text(); } catch (_) {}
      return { status: res.status, ct, text: t.slice(0, 400) };
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return { status: res.status, ct, b64: btoa(bin) };
  }, { serialNumber: String(serial).trim(), lastName });

  if (!out.b64) return null; // no PDF = no certificate; caller keeps the primary answer
  return parseCertificate(Buffer.from(out.b64, 'base64'), serial);
}

module.exports = { fetchCertificate, _parseCertificate: parseCertificate, _extractText: extractText };

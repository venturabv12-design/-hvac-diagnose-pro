#!/usr/bin/env node
/* Regression test for the warranty manufacture-date guard.
 *
 * 2026-09-17: Rodolfo at F.H. Furr scanned an American Standard heat pump, serial
 * 22491USP4F. Mike read it as "week 22 of 2009", called the unit 15-16 years old and told
 * him it was "well past even the registered 10-year window". It is a 2022 unit — Trane and
 * American Standard read YEAR first from 2010 on — and almost certainly still inside its
 * 5-year base parts term. A tech was one step from charging a homeowner for a part the
 * manufacturer owed him.
 *
 * The prompts already said "never invent a date". He did not invent one; he decoded one and
 * read it backwards. Prompts cannot fix a confident wrong answer, so the rule lives in code
 * and this test is what keeps it honest.
 *
 * Run: node scripts/warranty-age-test.js
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function lift(name) {
  const i = src.indexOf('function ' + name + '(');
  if (i === -1) throw new Error('MISSING from public/index.html: ' + name + '()');
  // walk braces from the function's opening { to its matching close
  let b = src.indexOf('{', i), depth = 0, j = b;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(i, j + 1);
}
eval(lift('decodeUnitDate'));
eval(lift('stripUnverifiedAge'));

let failed = 0;
const eq = (label, got, want) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${label}  ->  ${got}${ok ? '' : `   (expected ${want})`}`);
};
const d = (brand, sn) => { const r = decodeUnitDate(brand, sn); return r ? `${r.year}w${r.week}` : 'null'; };

console.log('— decoder —');
eq('Rodolfo\'s unit, American Standard 22491USP4F', d('American Standard', '22491USP4F'), '2022w49');
eq('same serial, branded Trane',                    d('Trane', '22491USP4F'),             '2022w49');
eq('first year of the 2010+ scheme',                d('Trane', '1035ABCDE'),              '2010w35');
eq('decodes pre-2010, different scheme, refuse',    d('Trane', '0922ABCDE'),              'null');
eq('impossible week',                               d('Trane', '2299ABCDE'),              'null');
eq('future year',                                   d('Trane', '9912ABCDE'),              'null');
eq('brand with no published rule here',             d('Goodman', '1809876543'),           'null');
eq('Carrier is not decoded by this rule',           d('Carrier', '4521E12345'),           'null');
eq('empty serial',                                  d('Trane', ''),                       'null');

console.log('\n— strip, applied only when the date is unknown —');
const bad = "American Standard residential heat pump parts: 5 years base, 10 years registered.\n\n"
  + "That serial — 22491 reads as week 22 of 2009, so this one's around 15-16 years old. "
  + "That puts it well past even the registered 10-year window.";
const out = stripUnverifiedAge(bad);
eq('keeps the published terms',        /5 years base/.test(out),  true);
eq('removes the wrong year',           /2009/.test(out),          false);
eq('removes the coverage conclusion',  /well past/.test(out),     false);
eq('says why it went quiet',           /install date/.test(out),  true);

console.log(failed ? `\n${failed} FAILED` : '\nall green');
process.exit(failed ? 1 : 0);

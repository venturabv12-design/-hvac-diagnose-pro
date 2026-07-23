#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * renderIllustrationSVG(netlist) -> PICTORIAL connection diagram for APPRENTICES.
 *
 * For a brand-new apprentice, a mid/senior tech, or a homeowner the tech wants to
 * show: the ACTUAL PARTS drawn as recognizable pictures, with the REAL WIRE COLORS
 * routed cleanly — EVERY wire traced, every drawn terminal has a wire, the
 * transformer powered from the line. Nothing left hanging.
 *
 * Two-pass: (1) measure every part's terminal positions, (2) wire every net between
 * placed parts, then draw ONLY the terminals that actually carry a wire + each wire
 * on its own routed path. PURE + DETERMINISTIC. Wires carry data-conn for verify.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const WIRE_HEX = {
  black:'#1c1f26', blk:'#1c1f26', red:'#d92b1c', blue:'#2b6cd4', blu:'#2b6cd4',
  yellow:'#e6b400', yel:'#e6b400', brown:'#7a4a1e', brn:'#7a4a1e', violet:'#7a3fd0', vio:'#7a3fd0',
  orange:'#e07a1c', org:'#e07a1c', green:'#2a8a3e', grn:'#2a8a3e', white:'#aab0ba', gray:'#8a94a6', grey:'#8a94a6',
  pink:'#e56fa0', pnk:'#e56fa0', purple:'#7a3fd0', purp:'#7a3fd0',
};
function wireColor(c){ if(!c) return '#39404c'; const b=String(c).toLowerCase().split(/[\/ ]/)[0].trim(); return WIRE_HEX[b]||'#39404c'; }
function wireStripe(c){ if(!c||!String(c).includes('/')) return null; const p=String(c).toLowerCase().split('/')[1].trim(); return WIRE_HEX[p]||null; }
function escapeXml(s){ return String(s==null?'':s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;').split("'").join('&#39;'); }
const f1=(n)=>Number(n).toFixed(1);
const epKey=(c,t)=>`${c}/${t}`;

// ── PLAIN ENGLISH: turn HVAC shorthand in a wire's function into apprentice English.
//    Preferred source is net.plain (model-authored). This is the deterministic FALLBACK
//    so older netlists (no .plain) still read plain in the "what each wire does" guide.
//    Whole-phrase rules first (most specific), then standalone-token expansion.
const PLAIN_PHRASES = [
  [/fan.*start|start.*fan/i, 'Spins up the outdoor fan (start winding)'],
  [/fan.*run|run.*fan/i, 'Runs the outdoor fan'],
  [/compressor\s*run.*herm|herm.*compressor\s*run/i, 'Run capacitor to the compressor (run winding)'],
  [/compressor\s*start|comp.*start\s*winding/i, 'Kicks the compressor to start (start winding)'],
  [/compressor\s*run|comp.*run\s*winding/i, 'Powers the compressor to run'],
  [/contactor\s*coil/i, 'Energizes the contactor coil — pulls it in'],
  [/24\s*v?\s*(hot|call|control).*saf|saf.*24\s*v/i, '24-volt power through the safety switches'],
  [/24\s*v?\s*(hot|call|control|power)/i, '24-volt control power'],
  [/reversing\s*valve/i, 'Energizes the reversing valve (switches heat/cool)'],
  [/crankcase\s*heat/i, 'Powers the crankcase heater (keeps oil warm)'],
];
const PLAIN_TOKENS = [
  [/\bcap\s*herm\b/gi, 'run capacitor → compressor start winding'],
  [/\bcap\s*fan\b/gi, 'run capacitor → outdoor fan'],
  [/\bherm\b/gi, 'compressor start winding (off the run capacitor)'],
  [/\bofm\b/gi, 'outdoor fan motor'],
  [/\bidm\b/gi, 'indoor blower motor'],
  [/\blps\b/gi, 'low-pressure safety switch'],
  [/\bhps\b/gi, 'high-pressure safety switch'],
  [/\bdts\b/gi, 'discharge-temp safety switch'],
  [/\bctd\b/gi, 'compressor time-delay'],
  [/\bcch?\b/gi, 'crankcase heater'],
  [/\bchs\b/gi, 'crankcase-heater switch'],
  [/\blls\b/gi, 'liquid-line solenoid'],
  [/\btxv\b/gi, 'metering valve'],
  [/\brvs?\b/gi, 'reversing valve'],
  [/\bl1\b/gi, 'one leg of 240-volt power'],
  [/\bl2\b/gi, 'other leg of 240-volt power'],
  [/\b24\s*v(ac)?\b/gi, '24-volt control power'],
  [/\bcap\b/gi, 'run capacitor'],
];
function plainEnglish(label){
  const s = String(label||'').trim();
  if(!s) return 'Traced wire';
  for(const [re,txt] of PLAIN_PHRASES){ if(re.test(s)) return txt; }
  let out = s;
  for(const [re,txt] of PLAIN_TOKENS){ out = out.replace(re, txt); }
  out = out.replace(/\s+/g,' ').trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function roleOf(c){
  const k=(c.kind||'').toLowerCase(), id=(c.id||'').toUpperCase(), lbl=(c.label||'').toLowerCase();
  if(k==='contactor'||id==='CONT') return 'contactor';
  if(k==='compressor'||id==='COMP') return 'compressor';
  if(k==='capacitor'&&(id==='CAP'||lbl.includes('run'))) return 'runcap';
  if(k==='fan-motor'||id==='OFM'||/(outdoor|condenser) fan/.test(lbl)) return 'fan';
  // external 24V supply (straight-cool condensers get 24V from the indoor unit — NO onboard transformer)
  if(lbl.includes('indoor')||lbl.includes('from inside')||id==='IDU') return 'source';
  if((k==='transformer'||id==='XFMR')&&/external|24\s*-?\s*v/i.test(lbl)) return 'source';
  if(k==='transformer'||id==='XFMR') return 'xfmr';
  if(k==='terminal-block'&&(id==='PWR'||lbl.includes('power')||lbl.includes('l1'))) return 'power';
  if(k==='thermostat'||id==='TSTAT') return 'tstat';
  if((k==='switch'||k==='sensor')&&['LPS','DTS','HPS'].includes(id)) return 'switch';
  if(k==='board'&&(id==='CTD'||lbl.includes('delay'))) return 'ctd';
  if(id==='LLS'||lbl.includes('liquid line')) return 'solenoid';
  // heat-pump parts
  if(id==='RVS'||id==='RV'||/reversing/i.test(lbl)) return 'reversingvalve';
  if(k==='board'||/defrost|control board/i.test(lbl)) return 'controlboard';
  // OPTION A (Brandon): Mike draws what's ACTUALLY on the equipment. The factory-OPTIONAL asterisked (*)
  // accessories usually NOT installed on the base unit return null (not drawn), for a clean, consistent
  // standard across models: start-assist (SR/SC/ST), crankcase heater + its switch (CH/CHS), indoor fan
  // relay (IFR). Drawers are kept (pStartRelay/pStartCap/pStartThermistor/pIFR/pHeater) to flip on for a
  // unit that truly has them, but OFF by default.
  return null;
}

// ── PADS: a terminal is {key,x,y,dir,label,pad}. Pad drawing is CENTRAL so we can
//    render ONLY the terminals that actually carry a wire (no dangling pads). ─────
function padSvg(t, hasWire){
  const g=[];
  if(t.pad==='screw'){ g.push(`<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="7.5" fill="#c9ced6" stroke="#11141a" stroke-width="1.6"/>`); g.push(`<line x1="${f1(t.x-4)}" y1="${f1(t.y)}" x2="${f1(t.x+4)}" y2="${f1(t.y)}" stroke="#11141a" stroke-width="1.4"/>`); }
  else if(t.pad==='spade'){ g.push(`<rect x="${f1(t.x-7)}" y="${f1(t.dir==='up'?t.y:t.y-8)}" width="14" height="16" rx="2" fill="#b9bfc9" stroke="#11141a" stroke-width="1.4"/>`); }
  else if(t.pad==='dot'){ g.push(`<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="5.5" fill="#c9ced6" stroke="#11141a" stroke-width="1.5"/>`); }
  else if(t.pad==='small'){ g.push(`<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="4.5" fill="#c9ced6" stroke="#11141a" stroke-width="1.3"/>`); }
  if(t.label){ const lx=t.x+(t.ldx||0), ly=t.y+(t.ldy||0); const fs=t.lsize||11; const tw=String(t.label).length*fs*0.64+6, th=fs+4;
    const anc=t.lanchor||'middle'; const rx=anc==='end'?lx-tw+3:anc==='start'?lx-3:lx-tw/2;
    g.push(`<rect x="${f1(rx)}" y="${f1(ly-fs+1)}" width="${f1(tw)}" height="${f1(th)}" rx="3" fill="#ffffff" opacity="0.92"/>`);
    g.push(`<text x="${f1(lx)}" y="${f1(ly)}" text-anchor="${anc}" font-size="${fs}" font-weight="700" fill="#0b0d10">${escapeXml(t.label)}</text>`); }
  return g.join('');
}

// ── part bodies: return { body, terms:[{key,x,y,dir,label,pad,...}] } ────────────
function pContactor(x,y){
  // Drawn to look like the ACTUAL part a tech holds (a Packard-style DP contactor):
  //  • chunky black body with a silver armature cap on top (the pressable part),
  //  • heavy SCREW LUGS: LINE on the left (fed straight off the disconnect), LOAD on
  //    the right (out to compressor/fan) — power reads left→right, no guesswork,
  //  • single-pole: top leg switched (open-contact symbol), bottom leg a solid
  //    "always hot" bus,
  //  • two 24V COIL spade terminals on the bottom; the coil's electromagnet pulls the
  //    contacts in (dashed mechanical link — the key teaching cue).
  const w=188,h=164,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="12" fill="#23262d" stroke="#0c0e12" stroke-width="2"/>`);
  b.push(`<rect x="${f1(x+3)}" y="${f1(y+3)}" width="${w-6}" height="${h-6}" rx="10" fill="none" stroke="#3a3f47" stroke-width="1"/>`);
  // silver armature cap (the pressable top of a real contactor)
  b.push(`<rect x="${f1(x+30)}" y="${f1(y+8)}" width="${w-60}" height="16" rx="4" fill="#8b929c" stroke="#5b616b" stroke-width="1"/>`);
  b.push(`<rect x="${f1(x+w/2-14)}" y="${f1(y+11)}" width="28" height="10" rx="3" fill="#c9ced6"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+42)}" text-anchor="middle" font-size="15" font-weight="800" fill="#e8ecf2">CONTACTOR</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+55)}" text-anchor="middle" font-size="8.5" fill="#9aa3b2">the switch that powers the unit on</text>`);
  const tp=y+82, bp=y+112; // top pole / bottom pole rows (line left → load right)
  // side labels
  b.push(`<text x="${f1(x+12)}" y="${f1(y+70)}" font-size="8" font-weight="700" fill="#8b929c">LINE</text>`);
  b.push(`<text x="${f1(x+w-12)}" y="${f1(y+70)}" text-anchor="end" font-size="8" font-weight="700" fill="#8b929c">LOAD</text>`);
  // TOP pole (switched): L1 —[open contact]— T1
  b.push(`<line x1="${f1(x+6)}" y1="${f1(tp)}" x2="${f1(x+70)}" y2="${f1(tp)}" stroke="#e8ecf2" stroke-width="2.6" stroke-linecap="round"/>`);
  b.push(`<circle cx="${f1(x+70)}" cy="${f1(tp)}" r="3.2" fill="#e8ecf2"/>`);
  b.push(`<line x1="${f1(x+70)}" y1="${f1(tp)}" x2="${f1(x+90)}" y2="${f1(tp-12)}" stroke="#e8ecf2" stroke-width="2.6" stroke-linecap="round"/>`); // open arm
  b.push(`<circle cx="${f1(x+94)}" cy="${f1(tp)}" r="3.2" fill="#e8ecf2"/>`);
  b.push(`<line x1="${f1(x+94)}" y1="${f1(tp)}" x2="${f1(x+w-6)}" y2="${f1(tp)}" stroke="#e8ecf2" stroke-width="2.6" stroke-linecap="round"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(tp-16)}" text-anchor="middle" font-size="7.5" fill="#9aa3b2">switched</text>`);
  // BOTTOM pole (unswitched bus): L2 ———— T2, always hot
  b.push(`<line x1="${f1(x+6)}" y1="${f1(bp)}" x2="${f1(x+w-6)}" y2="${f1(bp)}" stroke="#e8ecf2" stroke-width="2.6" stroke-linecap="round"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(bp+12)}" text-anchor="middle" font-size="7.5" fill="#e0a24a">always hot (unswitched leg)</text>`);
  // 24V coil box + squiggle across the two bottom spade terminals
  const cbTop=y+126;
  b.push(`<rect x="${f1(x+36)}" y="${f1(cbTop)}" width="${w-72}" height="26" rx="6" fill="#0f8a7e" fill-opacity="0.20" stroke="#0f8a7e" stroke-width="1.5"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(cbTop+16)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0f8a7e">24V COIL</text>`);
  const cy2=y+h-4, cx1=x+56, cx2=x+128, seg=(cx2-cx1)/6;
  let d=`M ${f1(cx1)} ${f1(cy2)}`;
  for(let k=0;k<6;k++){ const sx=cx1+seg*k; d+=` Q ${f1(sx+seg/2)} ${f1(cy2-4)} ${f1(sx+seg)} ${f1(cy2)}`; }
  b.push(`<path d="${d}" fill="none" stroke="#0f8a7e" stroke-width="1.8" opacity="0.7"/>`);
  // dashed MECHANICAL link: coil pulls the switched contact in
  b.push(`<line x1="${f1(x+82)}" y1="${f1(tp+3)}" x2="${f1(x+w/2)}" y2="${f1(cbTop)}" stroke="#0f8a7e" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.8"/>`);
  const T=[
    {key:'L1',x:x,y:tp,dir:'left',pad:'screw',label:'L1',ldx:-14,ldy:4},
    {key:'L2',x:x,y:bp,dir:'left',pad:'screw',label:'L2',ldx:-14,ldy:4},
    {key:'LOAD1',x:x+w,y:tp,dir:'right',pad:'screw',label:'T1',ldx:14,ldy:4},
    {key:'LOAD2',x:x+w,y:bp,dir:'right',pad:'screw',label:'T2',ldx:14,ldy:4},
    {key:'COIL1',x:x+56,y:y+h,dir:'down',pad:'spade',label:'24V',ldy:17,lsize:8.5},
    {key:'COIL2',x:x+128,y:y+h,dir:'down',pad:'spade',label:'C',ldy:17,lsize:8.5},
  ];
  // aliases: OEM sheets vary — map the common terminal spellings onto the drawn poles.
  const al={'11':'L1','23':'L2','23a':'L2','1':'L1','3':'L2',
            '21':'LOAD1','22':'LOAD2','23b':'LOAD2','24':'LOAD2','2':'LOAD1','4':'LOAD2',
            'T1':'COIL1','T2':'COIL2','A1':'COIL1','A2':'COIL2','C1':'COIL1','C2':'COIL2'};
  return {body:b.join(''),terms:T,alias:al};
}
function pCompressor(x,y){
  const r=54,cx=x+r,cy=y+r,b=[];
  b.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="#3a3f47" stroke="#11141a" stroke-width="2.6"/>`);
  b.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r-8}" fill="none" stroke="#565c66" stroke-width="1.5"/>`);
  b.push(`<text x="${f1(cx)}" y="${f1(cy-8)}" text-anchor="middle" font-size="15" font-weight="800" fill="#e8ecf2">COMPRESSOR</text>`);
  b.push(`<text x="${f1(cx)}" y="${f1(cy+8)}" text-anchor="middle" font-size="9" fill="#9aa3b2">pumps the</text>`);
  b.push(`<text x="${f1(cx)}" y="${f1(cy+20)}" text-anchor="middle" font-size="9" fill="#9aa3b2">refrigerant</text>`);
  const T=[
    {key:'C',x:cx-r-1,y:cy-28,dir:'left',pad:'dot',label:'C',ldx:-13,ldy:4},
    {key:'R',x:cx-r-1,y:cy,dir:'left',pad:'dot',label:'R',ldx:-13,ldy:4},
    {key:'S',x:cx-r-1,y:cy+28,dir:'left',pad:'dot',label:'S',ldx:-13,ldy:4},
  ];
  return {body:b.join(''),terms:T};
}
function pRunCap(x,y){
  const w=126,h=98,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="30" fill="#eef1f5" stroke="#11141a" stroke-width="2.2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h-30)}" text-anchor="middle" font-size="12" font-weight="800" fill="#0b0d10">RUN CAPACITOR</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h-16)}" text-anchor="middle" font-size="8.5" fill="#66707d">helps the motors</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h-5)}" text-anchor="middle" font-size="8.5" fill="#66707d">start &amp; run smoothly</text>`);
  const names=['HERM','C','FAN'], T=[];
  names.forEach((s,i)=>{ const sx=x+(w*(i+1))/4; T.push({key:s,x:sx,y:y-15,dir:'up',pad:'spade',label:s,ldy:-18}); });
  return {body:b.join(''),terms:T,alias:{'H':'HERM','F':'FAN'}};
}
function pFan(x,y,netTerms){
  const r=48,cx=x+r,cy=y+r,b=[];
  b.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="#eef1f5" stroke="#11141a" stroke-width="2.3"/>`);
  for(let i=0;i<3;i++){ const a=(i*120)*Math.PI/180,bx=cx+Math.cos(a)*(r-12),by=cy+Math.sin(a)*(r-12); b.push(`<path d="M ${f1(cx)} ${f1(cy)} Q ${f1(cx+Math.cos(a+0.5)*r*0.7)} ${f1(cy+Math.sin(a+0.5)*r*0.7)} ${f1(bx)} ${f1(by)} Z" fill="#c4ccd6" stroke="#8a94a6" stroke-width="1"/>`); }
  b.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="8" fill="#565c66"/>`);
  b.push(`<text x="${f1(cx)}" y="${f1(y+2*r+16)}" text-anchor="middle" font-size="13" font-weight="800" fill="#0b0d10">FAN MOTOR</text>`);
  b.push(`<text x="${f1(cx)}" y="${f1(y+2*r+30)}" text-anchor="middle" font-size="9.5" fill="#66707d">spins to cool the coil</text>`);
  let leads=(netTerms&&netTerms.length)?netTerms.slice(0,3):['1','2']; const T=[];
  leads.forEach((k,i)=>{ T.push({key:k,x:cx-r-1,y:cy-12+i*20,dir:'left',pad:'dot'}); });
  return {body:b.join(''),terms:T};
}
function pXfmr(x,y){
  const w=104,h=80,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="9" fill="#dfe4ea" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2-3)}" text-anchor="middle" font-size="13" font-weight="800" fill="#0b0d10">TRANSFORMER</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2+13)}" text-anchor="middle" font-size="10" fill="#66707d">240V → 24V</text>`);
  b.push(`<text x="${f1(x-2)}" y="${f1(y-8)}" text-anchor="middle" font-size="9" fill="#66707d">240V</text>`);
  b.push(`<text x="${f1(x+w+2)}" y="${f1(y-8)}" text-anchor="middle" font-size="9" fill="#66707d">24V</text>`);
  const T=[
    {key:'H1',x:x,y:y+20,dir:'left',pad:'dot',label:'H1',ldx:-13,ldy:4},
    {key:'H2',x:x,y:y+h-20,dir:'left',pad:'dot',label:'H2',ldx:-13,ldy:4},
    {key:'R',x:x+w,y:y+20,dir:'right',pad:'dot',label:'R',ldx:13,ldy:4},
    {key:'C',x:x+w,y:y+h-20,dir:'right',pad:'dot',label:'C',ldx:13,ldy:4},
  ];
  return {body:b.join(''),terms:T};
}
function pPower(x,y){ // DISCONNECT — the real high-voltage source at the condenser
  const w=118,h=104,b=[],T=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="8" fill="#4a5058" stroke="#11141a" stroke-width="2.2"/>`);
  b.push(`<rect x="${f1(x+10)}" y="${f1(y+12)}" width="${w-20}" height="26" rx="3" fill="#2b2f37"/>`);
  b.push(`<rect x="${f1(x+w/2-9)}" y="${f1(y+16)}" width="18" height="18" rx="2" fill="#c9ced6" stroke="#11141a" stroke-width="1.4"/>`); // pull handle
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+58)}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">DISCONNECT</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+74)}" text-anchor="middle" font-size="9" fill="#c9ced6">pull to kill power</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-10)}" text-anchor="middle" font-size="10" font-weight="700" fill="#0b0d10">240V from panel</text>`);
  b.push(`<line x1="${f1(x+w/2-14)}" y1="${f1(y)}" x2="${f1(x+w/2-14)}" y2="${f1(y-6)}" stroke="#d92b1c" stroke-width="3"/><line x1="${f1(x+w/2+14)}" y1="${f1(y)}" x2="${f1(x+w/2+14)}" y2="${f1(y-6)}" stroke="#d92b1c" stroke-width="3"/>`);
  // Two output lugs aligned dead-level with the contactor LINE lugs (spacing 30) so the
  // two 240V legs run straight across, parallel — no crossing, no duplicate labels.
  ['L1','L2'].forEach((k,i)=>{ const ly=y+62+i*30; T.push({key:k,x:x+w,y:ly,dir:'right',pad:'screw'}); });
  return {body:b.join(''),terms:T};
}
function pSwitch(x,y,comp){
  const w=58,h=42,cx=x+w/2,cy=y+h/2,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="7" fill="#fff" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<circle cx="${f1(cx-9)}" cy="${f1(cy+4)}" r="2.4" fill="#11141a"/>`);
  b.push(`<line x1="${f1(cx-9)}" y1="${f1(cy+4)}" x2="${f1(cx+9)}" y2="${f1(cy-6)}" stroke="#11141a" stroke-width="2.2"/>`);
  b.push(`<circle cx="${f1(cx+9)}" cy="${f1(cy+4)}" r="2.4" fill="#11141a"/>`);
  b.push(`<text x="${f1(cx)}" y="${f1(y-7)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0b0d10">${escapeXml(comp.id)}</text>`);
  const desc=(comp.label||'').replace(/switch/i,'').replace(/\*/g,'').replace(/[()]/g,'').replace(/\s+/g,' ').trim();
  b.push(`<text x="${f1(cx)}" y="${f1(y+h+13)}" text-anchor="middle" font-size="9" fill="#66707d">${escapeXml(desc).slice(0,24)}</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x,y:cy,dir:'left',pad:'small'},{key:'2',x:x+w,y:cy,dir:'right',pad:'small'}]};
}
function pCtd(x,y){
  const w=92,h=76,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="7" fill="#eaf3f1" stroke="#0f8a7e" stroke-width="2.2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2-4)}" text-anchor="middle" font-size="12" font-weight="800" fill="#0f8a7e">CTD</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2+11)}" text-anchor="middle" font-size="8.5" fill="#4a8a82">time delay</text>`);
  // ALL terminals exit LEFT — the CTD sits at the right end of the string but everything it
  // wires to (HPS input, contactor coil, transformer) is to its left. Right-facing terminals
  // caused dangling stubs + wrap-around. Labels sit just inside the box.
  return {body:b.join(''),terms:[
    {key:'T1',x:x,y:y+13,dir:'left',pad:'small',label:'T1',ldx:12,ldy:3,lsize:8},
    {key:'T2',x:x,y:y+h/2,dir:'left',pad:'small',label:'T2',ldx:12,ldy:3,lsize:8},
    {key:'T3',x:x,y:y+h-13,dir:'left',pad:'small',label:'T3',ldx:12,ldy:3,lsize:8},
  ]};
}
function pTstat(x,y){
  const w=76,h=68,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+17)}" text-anchor="middle" font-size="11" font-weight="800" fill="#0b0d10">T-STAT</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+30)}" text-anchor="middle" font-size="8" fill="#66707d">thermostat</text>`);
  const T=[]; ['R','Y','G'].forEach((k,i)=>{ const py=y+40+i*11; T.push({key:k,x:x+w,y:py,dir:'right',pad:'small',label:k,ldx:12,ldy:3.5,lsize:9}); });
  return {body:b.join(''),terms:T};
}
function pHeater(x,y){
  const w=96,h=34,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="#11141a" stroke-width="2"/>`);
  for(let i=8;i<w-4;i+=11) b.push(`<line x1="${f1(x+i)}" y1="${f1(y)}" x2="${f1(x+i+7)}" y2="${f1(y+h)}" stroke="#11141a" stroke-width="1.4"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-7)}" text-anchor="middle" font-size="11" font-weight="800" fill="#0b0d10">CRANKCASE HTR</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x,y:y+h/2,dir:'left',pad:'small'},{key:'2',x:x+w,y:y+h/2,dir:'right',pad:'small'}]};
}
function pSolenoid(x,y,comp){
  const w=44,h=30,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="#0f8a7e" stroke-width="2.2"/>`);
  b.push(`<line x1="${f1(x)}" y1="${f1(y+h/2)}" x2="${f1(x+w)}" y2="${f1(y+h/2)}" stroke="#0f8a7e" stroke-width="1.4"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-7)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0b0d10">${escapeXml(comp.id)}</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x,y:y+h/2,dir:'left',pad:'small'},{key:'2',x:x+w,y:y+h/2,dir:'right',pad:'small'}]};
}

// ── START-ASSIST parts (help a compressor start under load; factory-optional) ──
function pStartRelay(x,y){
  const w=84,h=52,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="#7a4a1e" stroke-width="2.2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2-3)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0b0d10">START</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2+10)}" text-anchor="middle" font-size="8.5" fill="#66707d">relay</text>`);
  return {body:b.join(''),terms:[
    {key:'1',x:x,y:y+13,dir:'left',pad:'small',label:'1',ldx:11,ldy:3,lsize:8},
    {key:'2',x:x,y:y+h-13,dir:'left',pad:'small',label:'2',ldx:11,ldy:3,lsize:8},
    {key:'5',x:x+w,y:y+h/2,dir:'right',pad:'small',label:'5',ldx:-11,ldy:3,lsize:8},
  ]};
}
function pStartCap(x,y){
  const w=46,h=54,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="9" fill="#eef1f5" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<line x1="${f1(x+8)}" y1="${f1(y+22)}" x2="${f1(x+w-8)}" y2="${f1(y+22)}" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<line x1="${f1(x+8)}" y1="${f1(y+30)}" x2="${f1(x+w-8)}" y2="${f1(y+30)}" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-6)}" text-anchor="middle" font-size="9" font-weight="800" fill="#0b0d10">START CAP</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x+w/2,y:y,dir:'up',pad:'small'},{key:'2',x:x+w/2,y:y+h,dir:'down',pad:'small'}]};
}
function pStartThermistor(x,y){
  const w=52,h=40,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="#11141a" stroke-width="2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+h/2+1)}" text-anchor="middle" font-size="10" font-weight="800" fill="#0b0d10">PTC</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-6)}" text-anchor="middle" font-size="8.5" fill="#66707d">start thermistor</text>`);
  return {body:b.join(''),terms:[
    {key:'T1',x:x,y:y+h/2,dir:'left',pad:'small'},{key:'T2',x:x+w,y:y+h/2,dir:'right',pad:'small'}]};
}
function pIFR(x,y){
  const w=84,h=44,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="#0f8a7e" stroke-width="2"/>`);
  for(let i=8;i<w-6;i+=10) b.push(`<path d="M ${f1(x+i)} ${f1(y+h/2)} q 2.5 -5 5 0" fill="none" stroke="#0f8a7e" stroke-width="1.4"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-6)}" text-anchor="middle" font-size="9" font-weight="800" fill="#0b0d10">INDOOR FAN RELAY</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x,y:y+h/2,dir:'left',pad:'small'},{key:'2',x:x+w,y:y+h/2,dir:'right',pad:'small'}]};
}

// ── HEAT-PUMP parts ──────────────────────────────────────────────────────────
// Reversing valve solenoid — shifts the unit between heat and cool (energized by the O signal).
function pReversingValve(x,y){
  const w=64,h=40,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="6" fill="#eef4fb" stroke="#2b6cd4" stroke-width="2.2"/>`);
  // solenoid coil
  b.push(`<rect x="${f1(x+10)}" y="${f1(y+h/2-6)}" width="${w-20}" height="12" rx="3" fill="none" stroke="#2b6cd4" stroke-width="1.4"/>`);
  for(let i=x+14;i<x+w-10;i+=6) b.push(`<line x1="${f1(i)}" y1="${f1(y+h/2-6)}" x2="${f1(i)}" y2="${f1(y+h/2+6)}" stroke="#2b6cd4" stroke-width="1"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-16)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0b0d10">REVERSING VALVE</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y-5)}" text-anchor="middle" font-size="8" fill="#66707d">switches heat ↔ cool</text>`);
  return {body:b.join(''),terms:[{key:'1',x:x,y:y+h/2,dir:'left',pad:'small'},{key:'2',x:x+w,y:y+h/2,dir:'right',pad:'small'}]};
}
// Defrost / control board — runs the reversing valve + defrost cycle. Dynamic terminals from the netlist.
function pControlBoard(x,y,netTerms){
  const leads=(netTerms&&netTerms.length)?netTerms.slice(0,8):['1','2'];
  const h=Math.max(58, 22+leads.length*13), w=110, b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="7" fill="#eaf3f1" stroke="#0f8a7e" stroke-width="2.2"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+18)}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f8a7e">CONTROL</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+30)}" text-anchor="middle" font-size="8.5" fill="#4a8a82">board</text>`);
  const T=[]; leads.forEach((k,i)=>{ T.push({key:k,x:x+w,y:y+18+i*13,dir:'right',pad:'small',label:String(k).slice(0,3),ldx:-14,ldy:3,lsize:7.5}); });
  return {body:b.join(''),terms:T};
}

// 24V control power arriving FROM THE INDOOR UNIT (no onboard transformer on a straight-cool condenser).
function pSource(x,y){
  const w=140,h=56,b=[];
  b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="8" fill="#0f8a7e" fill-opacity="0.14" stroke="#0f8a7e" stroke-width="1.8"/>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+24)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#0b3d38">FROM INDOOR UNIT</text>`);
  b.push(`<text x="${f1(x+w/2)}" y="${f1(y+40)}" text-anchor="middle" font-size="9.5" fill="#0f8a7e">24V control power</text>`);
  const T=[
    {key:'R',x:x+34,y:y,dir:'up',pad:'small',label:'24V',ldy:-8,lsize:8.5},
    {key:'C',x:x+106,y:y,dir:'up',pad:'small',label:'C',ldy:-8,lsize:8.5},
  ];
  return {body:b.join(''),terms:T,alias:{'Y':'R','24V':'R','COM':'C','COMMON':'C'}};
}

const ROLE_BODY={ contactor:pContactor, compressor:pCompressor, runcap:pRunCap, fan:pFan, xfmr:pXfmr, power:pPower, switch:pSwitch, ctd:pCtd, tstat:pTstat, heater:pHeater, solenoid:pSolenoid, source:pSource, startrelay:pStartRelay, startcap:pStartCap, startsensor:pStartThermistor, ifr:pIFR, reversingvalve:pReversingValve, controlboard:pControlBoard };

const ZONES={
  power:{x:44,y:196}, contactor:{x:210,y:176}, runcap:{x:560,y:380}, compressor:{x:900,y:186}, fan:{x:906,y:404},
  xfmr:{x:250,y:632}, source:{x:60,y:690}, tstat:{x:60,y:690}, ctd:{x:856,y:664}, heater:{x:640,y:196}, solenoid:{x:512,y:812},
  startrelay:{x:120,y:456}, startcap:{x:264,y:452}, startsensor:{x:352,y:460}, ifr:{x:236,y:786},
  controlboard:{x:648,y:668}, reversingvalve:{x:432,y:806},
};
const CHS_POS={ x:470, y:200 };            // crankcase heater switch — line zone, next to its heater
const SWITCH_ROW={ startX:308, y:690, dx:188 };  // LPS / DTS / HPS row in the 24V control zone

function renderIllustrationSVG(netlist){
  if(!netlist||!Array.isArray(netlist.components)) throw new TypeError('netlist.components required');
  const WIDTH=1120, HEIGHT=1188;

  const netTermsByComp={};
  (netlist.nets||[]).forEach(net=>(net.endpoints||[]).forEach(e=>{ (netTermsByComp[e.component]=netTermsByComp[e.component]||new Set()).add(e.terminal); }));

  // ── PASS 1: place parts, collect body svg + terminal positions (+ aliases) ─────
  const bodies=[]; const termXY={}; const placed={};
  const usedRole={}; const switches=[];
  const place=(cid,role,pos,extra)=>{
    const r=ROLE_BODY[role](pos.x,pos.y,extra);
    bodies.push({cid,body:r.body,terms:r.terms});
    placed[cid]=role;
    r.terms.forEach(t=>{ termXY[epKey(cid,t.key)]={...t,comp:cid}; });
    if(r.alias) Object.keys(r.alias).forEach(a=>{ termXY[epKey(cid,a)]=termXY[epKey(cid,r.alias[a])]; });
  };
  netlist.components.forEach(c=>{
    const role=roleOf(c); if(!role) return;
    if(role==='switch'){
      if((c.id||'').toUpperCase()==='CHS'){ place(c.id,'switch',CHS_POS,c); }  // heater switch → line zone
      else switches.push(c);
      return;
    }
    if(usedRole[role]) return; usedRole[role]=true;
    if(!ZONES[role]) return;
    place(c.id,role,ZONES[role], (role==='fan'||role==='controlboard')?Array.from(netTermsByComp[c.id]||[]):c);
  });
  switches.slice(0,3).forEach((c,i)=>{ place(c.id,'switch',{x:SWITCH_ROW.startX+i*SWITCH_ROW.dx,y:SWITCH_ROW.y},c); });

  // ── PASS 2: build wires between placed parts; collect which terminals carry one ─
  const wires=[], connOut=[]; const liveTerm=new Set();
  (netlist.nets||[]).forEach(net=>{
    const eps=(net.endpoints||[]).filter(e=>placed[e.component]&&termXY[epKey(e.component,e.terminal)]);
    for(let i=0;i<eps.length-1;i++){
      const ak=epKey(eps[i].component,eps[i].terminal), bk=epKey(eps[i+1].component,eps[i+1].terminal);
      const A=termXY[ak], B=termXY[bk]; if(!A||!B) continue;
      wires.push({a:A,b:B,color:net.wire_color,label:net.label,plain:net.plain,vc:net.voltage_class}); connOut.push(`${ak}|${bk}`);
      liveTerm.add(ak); liveTerm.add(bk);
      // also mark the canonical (aliased) key
      liveTerm.add(epKey(A.comp,A.key)); liveTerm.add(epKey(B.comp,B.key));
    }
  });

  // ── NUMBER each distinct wire so it ties to the guide (the only reliable way to
  //    tell four same-colored yellow wires apart) ─────────────────────────────────
  const cleanFn=(s)=>String(s||'').replace(/\s+/g,' ').replace(/^ +| +$/g,'');
  const rowKey=(w)=>(w.color||'')+'|'+(w.label||w.plain||'');
  const rowNum={}; const rows=[];
  wires.forEach(w=>{ if(!(w.label||w.plain)) return; const k=rowKey(w); if(!(k in rowNum)){ rowNum[k]=rows.length+1; rows.push({n:rows.length+1,color:w.color||'—',fn:(w.plain?cleanFn(w.plain):plainEnglish(w.label))}); } });

  // ── FAN-OUT shared terminals: when 2+ wires land on one terminal, spread their
  //    landing points along the terminal edge so an apprentice sees each wire
  //    distinctly, then a junction dot shows they meet. ───────────────────────────
  const tid=(t)=>`${t.comp}/${t.key}`;
  const termWires={};
  wires.forEach((w,wi)=>{ const ka=tid(w.a),kb=tid(w.b); (termWires[ka]=termWires[ka]||[]).push({wi,end:'a'}); (termWires[kb]=termWires[kb]||[]).push({wi,end:'b'}); });
  const landing={};   // `${wi}_${end}` -> {x,y}
  const junctions=[];
  Object.keys(termWires).forEach(k=>{
    const list=termWires[k], n=list.length;
    const term=wires[list[0].wi][list[0].end];
    const SEP=24; // wide split where multiple wires share a terminal → the junction reads clearly, no parallel double-band
    list.forEach((it,idx)=>{
      const t=wires[it.wi][it.end];
      const off=(idx-(n-1)/2)*SEP;
      const pt=(t.dir==='up'||t.dir==='down') ? {x:t.x+off,y:t.y} : {x:t.x,y:t.y+off};
      landing[`${it.wi}_${it.end}`]=pt;
    });
    if(n>1){ // draw a short bus line across the fanned points + a junction dot at the true terminal
      const perpA=(term.dir==='up'||term.dir==='down');
      const half=((n-1)/2)*SEP;
      const p1=perpA?{x:term.x-half,y:term.y}:{x:term.x,y:term.y-half};
      const p2=perpA?{x:term.x+half,y:term.y}:{x:term.x,y:term.y+half};
      junctions.push({p1,p2,cx:term.x,cy:term.y});
    }
  });

  // ── router: each wire its own vertical trunk so none overlap ────────────────────
  const stub=(p,ex)=>{ const s=18+(ex||0); if(p.dir==='up')return{x:p.x,y:p.y-s}; if(p.dir==='down')return{x:p.x,y:p.y+s}; if(p.dir==='right')return{x:p.x+s,y:p.y}; return{x:p.x-s,y:p.y}; };
  const wireSvg=[]; const badgeSvg=[]; const N=wires.length;
  const usedTrunks=[]; // guarantee every wire gets its OWN vertical lane (no overlapping runs)
  const placedBadges=[]; // keep number badges from stacking on each other
  const placeBadge=(cx,cy)=>{ let x=cx,y=cy,k=0; while(placedBadges.some(p=>Math.hypot(p.x-x,p.y-y)<20)&&k<10){ k++; y=cy+(k%2?1:-1)*20*Math.ceil(k/2); } placedBadges.push({x,y}); return {x,y}; };
  wires.forEach((w,i)=>{
    const col=wireColor(w.color), stripe=wireStripe(w.color);
    const aPt=landing[`${i}_a`]||{x:w.a.x,y:w.a.y}, bPt=landing[`${i}_b`]||{x:w.b.x,y:w.b.y};
    const a={...aPt,dir:w.a.dir}, b={...bPt,dir:w.b.dir};
    const so=(i%6)*10; let aOut=stub(a,so), bOut=stub(b,so);
    // cross-zone wire (spans HIGH↔LOW voltage): drop its horizontal into a clear gutter
    // BELOW the high-voltage parts so it never knifes through a terminal cluster.
    if(Math.abs(a.y-b.y)>240){ const g=508+(i%4)*13;
      if(a.dir==='down'&&a.y<g-24) aOut={x:a.x,y:g};
      if(b.dir==='down'&&b.y<g-24) bOut={x:b.x,y:g}; }
    const lo=Math.min(aOut.x,bOut.x), hi=Math.max(aOut.x,bOut.x);
    let trunk = (hi-lo<40) ? (lo+hi)/2+((i%9)-4)*9 : lo+(hi-lo)*((i+1)/(N+1));
    while(usedTrunks.some(t=>Math.abs(t-trunk)<26)) trunk+=26; // wide lanes → wires clearly separated
    usedTrunks.push(trunk);
    const ptsO=[a,aOut,{x:trunk,y:aOut.y},{x:trunk,y:bOut.y},bOut,b];
    const pts=ptsO.map(p=>`${f1(p.x)} ${f1(p.y)}`);
    const path=`M ${pts.join(' L ')}`;
    wireSvg.push(`<path d="${path}" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.95" stroke-linejoin="round" stroke-linecap="round"/>`);
    wireSvg.push(`<path data-conn="${escapeXml(connOut[i]||'')}" d="${path}" fill="none" stroke="${col}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`);
    if(stripe) wireSvg.push(`<path d="${path}" fill="none" stroke="${stripe}" stroke-width="3.4" stroke-dasharray="3 9" stroke-linejoin="round" stroke-linecap="round"/>`);
    // numbered badge at the trunk midpoint → look this wire up in the guide below
    const n=rowNum[rowKey(w)];
    if(n){ // badge on the wire's LONGEST straight segment (on the wire, clear of parts/labels), drawn on the top layer
      let best={x:trunk,y:(aOut.y+bOut.y)/2}, bl=-1;
      for(let s=0;s<ptsO.length-1;s++){ const p=ptsO[s],q=ptsO[s+1]; const Ln=Math.hypot(q.x-p.x,q.y-p.y); if(Ln>bl){bl=Ln;best={x:(p.x+q.x)/2,y:(p.y+q.y)/2};} }
      const bp=placeBadge(best.x,best.y);
      badgeSvg.push(`<circle cx="${f1(bp.x)}" cy="${f1(bp.y)}" r="8.5" fill="#ffffff" stroke="${col}" stroke-width="2"/><text x="${f1(bp.x)}" y="${f1(bp.y+3.5)}" text-anchor="middle" font-size="10" font-weight="800" fill="#0b0d10">${n}</text>`); }
  });
  // junction dots — drawn LAST (on top of parts + labels) so a real splice is never hidden
  const junctionSvg=[];
  junctions.forEach(j=>{
    junctionSvg.push(`<line x1="${f1(j.p1.x)}" y1="${f1(j.p1.y)}" x2="${f1(j.p2.x)}" y2="${f1(j.p2.y)}" stroke="#11141a" stroke-width="2"/>`);
    junctionSvg.push(`<circle cx="${f1(j.cx)}" cy="${f1(j.cy)}" r="5.5" fill="#11141a" stroke="#ffffff" stroke-width="1.5"/>`);
  });

  // ── emit part bodies + ONLY the pads that carry a wire (no dangling terminals) ──
  //    Skip a part entirely if NONE of its terminals carry a wire — a fully-orphaned
  //    part (e.g. a safety switch whose 24V wasn't traced) is a floating box that reads
  //    as broken; better to omit it than draw it disconnected.
  const partSvg=[];
  bodies.forEach(p=>{
    if(!p.terms.some(t=>liveTerm.has(epKey(p.cid,t.key)))) return;
    partSvg.push(`<g data-part="${escapeXml(p.cid)}">${p.body}`);
    p.terms.forEach(t=>{ if(liveTerm.has(epKey(p.cid,t.key))) partSvg.push(padSvg(t,true)); });
    partSvg.push('</g>');
  });

  // header + zone labels
  const H=[];
  // zone tint bands (behind everything) + labels in the clear top-right of each band
  const zoneBg=[];
  zoneBg.push(`<rect x="24" y="116" width="${WIDTH-48}" height="480" rx="14" fill="#fdf4f3"/>`);
  zoneBg.push(`<rect x="24" y="612" width="${WIDTH-48}" height="252" rx="14" fill="#f0f8f6"/>`);
  const pretty=(mk)=>{ const [br,md]=String(mk||'').split(':'); const b=br?br.charAt(0)+br.slice(1).toLowerCase():''; return md?`${b} ${md}`:(b||'Wiring'); };
  H.push(`<text x="40" y="34" font-size="21" font-weight="800" fill="#0b0d10">${escapeXml(pretty(netlist.model_key))} — how it’s wired</text>`);
  H.push(`<text x="40" y="53" font-size="12.5" fill="#7a8390">A beginner-friendly map of the real parts and how the wires connect them. The real manual is one tap away.</text>`);
  // Two-voltage explainer — big, top-LEFT of each band (where the eye starts reading)
  H.push(`<text x="44" y="138" font-size="14" font-weight="800" fill="#d92b1c">HIGH VOLTAGE · 240V</text>`);
  H.push(`<text x="214" y="138" font-size="11" fill="#b06a62">— the power that actually runs the compressor &amp; fan</text>`);
  H.push(`<text x="44" y="628" font-size="14" font-weight="800" fill="#0f8a7e">LOW VOLTAGE · 24V</text>`);
  H.push(`<text x="205" y="628" font-size="11" fill="#5a9089">— the small signal from inside that switches it on</text>`);
  // ── BOTTOM REFERENCE PANEL: wire key (left) + letter glossary (right) ───────────
  const L=[]; const GY=HEIGHT-268;
  const panelH=288;
  L.push(`<rect x="24" y="${f1(GY-24)}" width="${WIDTH-48}" height="${panelH}" rx="12" fill="#f6f7f9" stroke="#e4e7ec" stroke-width="1"/>`);
  const GX=772; // divider between wire key (left) and glossary (right)
  const wtrunc=(s,n)=>{ s=String(s); if(s.length<=n) return s; let t=s.slice(0,n); const sp=t.lastIndexOf(' '); return (sp>n*0.55?t.slice(0,sp):t)+'…'; };
  L.push(`<line x1="${GX}" y1="${f1(GY-8)}" x2="${GX}" y2="${f1(GY-24+panelH-12)}" stroke="#e0e4e9" stroke-width="1"/>`);
  // wire key (left)
  L.push(`<text x="40" y="${f1(GY)}" font-size="14" font-weight="800" fill="#0b0d10">WHAT EACH WIRE DOES</text>`);
  L.push(`<text x="234" y="${f1(GY)}" font-size="10" fill="#8a94a6">match a wire’s number on the drawing · ● = wires joined</text>`);
  const cols=2, colW=366;
  rows.slice(0,20).forEach((r,i)=>{ const c=i%cols, rr=Math.floor(i/cols); const gx=40+c*colW, gy=GY+28+rr*24;
    const col=wireColor(r.color), st=wireStripe(r.color);
    L.push(`<circle cx="${f1(gx+8)}" cy="${f1(gy-3)}" r="8" fill="#ffffff" stroke="${col}" stroke-width="2"/><text x="${f1(gx+8)}" y="${f1(gy+0.5)}" text-anchor="middle" font-size="10" font-weight="800" fill="#0b0d10">${r.n}</text>`);
    L.push(`<line x1="${f1(gx+22)}" y1="${f1(gy-3)}" x2="${f1(gx+46)}" y2="${f1(gy-3)}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`);
    if(st) L.push(`<line x1="${f1(gx+22)}" y1="${f1(gy-3)}" x2="${f1(gx+46)}" y2="${f1(gy-3)}" stroke="${st}" stroke-width="5" stroke-dasharray="3 8" stroke-linecap="round"/>`);
    L.push(`<text x="${f1(gx+56)}" y="${f1(gy+1)}" font-size="9.5" fill="#333a42">${escapeXml(wtrunc(r.fn,58))}</text>`);
  });
  // letter glossary (right)
  const gloss=[
    ['L1 / L2','the two 240-volt power legs in'],
    ['T1 / T2','power leaving the contactor'],
    ['C · R · S','compressor: Common / Run / Start'],
    ['HERM','capacitor → compressor (“hermetic”)'],
    ['FAN','capacitor → the fan motor'],
    ['LPS · HPS','low / high-pressure safety switch'],
    ['DTS · CTD','discharge-temp switch · time-delay'],
  ];
  L.push(`<text x="${GX+20}" y="${f1(GY)}" font-size="14" font-weight="800" fill="#0b0d10">WHAT THE LETTERS MEAN</text>`);
  gloss.forEach((g,i)=>{ const gy=GY+28+i*24;
    L.push(`<text x="${GX+20}" y="${f1(gy)}" font-size="10.5" font-weight="800" fill="#0f5a52">${escapeXml(g[0])}</text>`);
    L.push(`<text x="${GX+118}" y="${f1(gy)}" font-size="10" fill="#4a5058">${escapeXml(g[1])}</text>`); });
  L.push(`<text x="${GX+20}" y="${f1(GY+28+gloss.length*24+6)}" font-size="9.5" font-style="italic" fill="#8a94a6">“C” = Common everywhere — but a different wire each place.</text>`);

  const out=[];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="ui-sans-serif,system-ui,Arial,sans-serif">`);
  out.push(`<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>`);
  out.push(`<metadata data-conns="${escapeXml(Array.from(new Set(connOut)).sort().join(';'))}"></metadata>`);
  out.push(zoneBg.join(''));
  out.push(H.join(''));
  out.push(wireSvg.join(''));
  out.push(partSvg.join(''));
  out.push(junctionSvg.join('')); // splices on top so a real junction is never hidden
  out.push(badgeSvg.join('')); // number badges on the very top → never hidden by a part or crossed by a wire
  out.push(L.join(''));
  out.push('</svg>');
  return out.join('');
}

module.exports={ renderIllustrationSVG, wireColor, plainEnglish, roleOf };

if(require.main===module){
  const fs=require('fs');
  const netlist=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  fs.writeFileSync('/tmp/diagtest/illustration-out.svg', renderIllustrationSVG(netlist));
  console.log('illustration → /tmp/diagtest/illustration-out.svg');
}

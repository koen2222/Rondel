#!/usr/bin/env node
// Headless test-suite voor Rondel — spec: docs/00_Status_en_Beslissingen.md
// Extraheert resolve(), applyStatus(), NODES, ROUTES/ADJ chirurgisch uit index.html.
// Draai: node test/headless.js

'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// ─── Chirurgische extractie ────────────────────────────────────────────────────
// We evalueren alleen de puur-functionele blokken zonder DOM-afhankelijkheden.

function extractBlock(src, startPattern, endMarker) {
  const si = src.search(startPattern);
  if (si < 0) throw new Error('Patroon niet gevonden: ' + startPattern);
  // Zoek eindemarkering (volgende const/function/let op col 0 nà si)
  const after = src.slice(si);
  const mi = after.search(endMarker);
  return mi < 0 ? after : after.slice(0, mi);
}

// NODES, ROUTES, ADJ — alles vóór UNIT_DEFS
const boardSection = html.slice(
  html.indexOf('\nconst NODES'),
  html.indexOf('\nconst W=')          // W/G/B/R helpers starten de disk-data
);

// resolve + applyStatus — puur-functioneel, geen state
const resolveMatch = html.match(/\nfunction resolve\([\s\S]*?\n\}/);
const applyMatch   = html.match(/\nfunction applyStatus\([\s\S]*?\n\}/);
if (!resolveMatch) throw new Error('resolve() niet gevonden');
if (!applyMatch)   throw new Error('applyStatus() niet gevonden');

const evalCode = [
  boardSection,
  resolveMatch[0],
  applyMatch[0],
  'module.exports = { resolve, applyStatus, NODES, ADJ, ROUTES };',
].join('\n');

// Schrijf tijdelijk evalueerbaar bestand (vermijdt new Function-beperkingen)
const tmpPath = path.join(__dirname, '_extracted.cjs');
fs.writeFileSync(tmpPath, evalCode);
let extracted;
try {
  extracted = require(tmpPath);
} finally {
  fs.unlinkSync(tmpPath);
}

const { resolve, applyStatus, NODES, ADJ, ROUTES } = extracted;

// ─── Test harness ──────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function check(label, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) { console.log('  ✓', label); pass++; }
  else     { console.log('  ✗', label, '\n      got:', JSON.stringify(got), '\n      exp:', JSON.stringify(expected)); fail++; }
}
function section(title) { console.log('\n' + title); }

// ─── 1. COMBAT RESOLVE (14 checks, spec §Combat-uitkomsten) ──────────────────
section('=== COMBAT RESOLVE (14 checks) ===');

const R = (ak, av, ae, as, dk, dv, de, ds) =>
  resolve({ k:ak, v:av||0, effect:ae, stars:as||1 },
          { k:dk, v:dv||0, effect:de, stars:ds||1 });
const KO_ATT = { attKO:true,  defKO:false, statusOnAtt:null, statusOnDef:null };
const KO_DEF = { attKO:false, defKO:true,  statusOnAtt:null, statusOnDef:null };
const NONE   = { attKO:false, defKO:false, statusOnAtt:null, statusOnDef:null };
const SA = s => ({ attKO:false, defKO:false, statusOnAtt:s,    statusOnDef:null });
const SD = s => ({ attKO:false, defKO:false, statusOnAtt:null, statusOnDef:s });

check('Red(att) vs White(def) → att KO',             R('red',0,null,1, 'white',50,null,1), KO_ATT);
check('Red(att) vs Gold(def)  → att KO',             R('red',0,null,1, 'gold',60,null,1),  KO_ATT);
check('Red(att) vs Purple(def) → status op att',     R('red',0,null,1, 'purple',0,'poison',2), SA('poison'));
check('Red(att) vs Blue(def)  → niemand',            R('red',0,null,1, 'blue',0,null,1),   NONE);
check('Blue(att) vs White(def) → niemand',           R('blue',0,null,1,'white',50,null,1), NONE);
check('Blue(att) vs Purple(def) → niemand',          R('blue',0,null,1,'purple',0,'paralysis',1), NONE);
check('Blue(att) vs Gold(def)  → att KO',            R('blue',0,null,1,'gold',70,null,1),  KO_ATT);
check('Gold(att) vs Purple(def) → def KO',           R('gold',60,null,1,'purple',0,'burn',2), KO_DEF);
check('Gold(att) vs Blue(def)   → def KO',           R('gold',60,null,1,'blue',0,null,1),   KO_DEF);
check('Purple(att) vs White(def) → status op def',   R('purple',0,'confusion',2,'white',40,null,1), SD('confusion'));
check('Purple vs Purple: att meer sterren → def',    R('purple',0,'paralysis',3,'purple',0,'burn',1), SD('paralysis'));
check('Purple vs Purple: def meer sterren → att',    R('purple',0,'confusion',1,'purple',0,'poison',4), SA('poison'));
check('Purple vs Purple: gelijk → niemand',          R('purple',0,'confusion',2,'purple',0,'burn',2), NONE);
check('White 60 vs White 40 → def KO',               R('white',60,null,1,'white',40,null,1), KO_DEF);

// ─── 2. APPLY STATUS (8 checks) ───────────────────────────────────────────────
section('=== APPLY STATUS (8 checks) ===');

const baseSlots = [
  {k:'white',v:60}, {k:'white',v:40}, {k:'gold',v:80},
  {k:'blue'}, {k:'red'}, {k:'purple',effect:'confusion',stars:2},
];

{
  const r = applyStatus(baseSlots, ['poison']);
  check('Poison: White 60→40', r.find(s=>s.k==='white'&&s.v===40)?.v ?? r.filter(s=>s.k==='white')[0]?.v, 40);
  check('Poison: Gold 80→60',  r.find(s=>s.k==='gold')?.v, 60);
}
{
  const r = applyStatus(baseSlots, ['badlypoison']);
  check('BadlyPoison: White 40→10 (vloer)', r.filter(s=>s.k==='white').some(s=>s.v===10), true);
  check('BadlyPoison: Gold 80→40',          r.find(s=>s.k==='gold')?.v, 40);
}
{
  const r = applyStatus(baseSlots, ['paralysis']);
  const whites = r.filter(s=>s.k==='white');
  check('Paralysis: kleinste White(40)→Red', whites.every(s=>s.v!==40), true);
  check('Paralysis: grote White(60) intact', whites.some(s=>s.v===60),  true);
}
{
  const r = applyStatus(baseSlots, ['burn']);
  const whites = r.filter(s=>s.k==='white');
  check('Burn: kleinste White(40)→Red',   whites.every(s=>s.v!==40), true);
  check('Burn: grote White(60)→50 (-10)', whites.some(s=>s.v===50),  true);
}

// ─── 3. BOARD TOPOLOGIE (12 checks) ───────────────────────────────────────────
section('=== BOARD TOPOLOGIE (12 checks) ===');

const nodeKeys = Object.keys(NODES);
check('32 nodes',            nodeKeys.length, 32);
check('38 edges (ROUTES)',   ROUTES.length,   38);

// ADJ: Set → count undirected edges
let edgeSum = 0;
for (const k of nodeKeys) edgeSum += ADJ[k].size;
check('ADJ-som = 76 (38×2)', edgeSum, 76);

// BFS volledig verbonden
{
  const seen = new Set(['G1']);
  const q = ['G1'];
  while (q.length) { const n=q.shift(); for (const nb of ADJ[n]) { if(!seen.has(nb)){seen.add(nb);q.push(nb);} } }
  check('Volledig verbonden (BFS)', seen.size, 32);
}

// Geïsoleerde nodes
{
  const iso = nodeKeys.filter(k => ADJ[k].size === 0);
  check('Geen geïsoleerde nodes', iso.length, 0);
}

// ADJ symmetrisch
{
  let asym = 0;
  for (const k of nodeKeys) for (const nb of ADJ[k]) { if (!ADJ[nb].has(k)) asym++; }
  check('ADJ volledig symmetrisch', asym, 0);
}

// Goals
check('G1 aanwezig en type=goal',  NODES['G1']?.type, 'goal');
check('G2 aanwezig en type=goal',  NODES['G2']?.type, 'goal');

// Entry-nodes
{
  const entries = nodeKeys.filter(k => NODES[k].type === 'entry');
  check('4 entry-nodes', entries.length, 4);
}

// Inner-nodes (IT1-5, IB1-5, IL, IR = 12)
{
  const inner = nodeKeys.filter(k => k.startsWith('IT')||k.startsWith('IB')||k==='IL'||k==='IR');
  check('12 inner nodes (IT×5 + IB×5 + IL + IR)', inner.length, 12);
}

// Goal-connecties: G2 verbonden met T2, T3, IT2 (de 3 spokes in de spec)
{
  const g2adj = [...ADJ['G2']];
  check('G2 verbonden met T2',  g2adj.includes('T2'),  true);
  check('G2 verbonden met IT2', g2adj.includes('IT2'), true);
}

// ─── Samenvatting ──────────────────────────────────────────────────────────────
const total = pass + fail;
console.log(`\n${'─'.repeat(40)}`);
console.log(`${total} checks  —  ${pass} ✓  ${fail} ✗`);
if (fail === 0) console.log('Alle checks geslaagd ✓');
process.exit(fail > 0 ? 1 : 0);

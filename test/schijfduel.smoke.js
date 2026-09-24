#!/usr/bin/env node
// Smoke-test voor Schijfduel in een echte browser. Vereist een server in de
// repo-root:  python3 -m http.server 8123
'use strict';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASIS = 'http://localhost:8123/schijfduel/proto/index.html';
const SNEL = '&snel=1';
let ok = 0, fout = 0;
const check = (naam, v) => { if (v) { ok++; console.log('  ✓ ' + naam); } else { fout++; console.log('  ✗ ' + naam); } };

// Laat rood door de AI spelen tot het potje klaar is; klikt duels weg.
async function speelUit(p, maxMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (await p.locator('#uitslag.aan').count()) return true;
    if (await p.locator('#duel-verder:visible').count()) { await p.click('#duel-verder'); continue; }
    await p.evaluate(() => { const g = window.__schijfduel; const st = g.pot && g.pot.st;
      if (!st || st.aanZet !== 'rood' || st.fase === 'klaar' || window.__bezig || g.bezig) return;
      window.__bezig = true; g.voerUit(SchijfduelAI.kies(g.M, st, 'normaal')).finally(() => window.__bezig = false); });
    await p.waitForTimeout(200);
  }
  return false;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fouten = []; p.on('pageerror', e => fouten.push(String(e)));
  p.on('dialog', d => d.accept());
  try {
    await p.goto(BASIS + '?seed=5' + SNEL); await p.waitForTimeout(900);
    console.log('\n=== MENU ===');
    check('Titel Schijfduel met tagline', (await p.locator('.titel').textContent()) === 'SCHIJFDUEL' && (await p.locator('.tagline').textContent()).includes('Verover het doel'));
    check('Nergens "Pokémon" in de pagina', !(await p.content()).toLowerCase().includes('pokémon') && !(await p.content()).toLowerCase().includes('pokemon'));
    check('Het bord draait achter het menu (28 knopen)', await p.locator('#menu-bord circle.knoop').count() === 28);

    console.log('\n=== STAL EN KANSEN ===');
    await p.click('#t-stal');
    check('Twaalf beesten in de stal', await p.locator('#stal-raster .beest-kaart').count() === 12);
    check('Zes in bezit bij een nieuw profiel', await p.locator('#stal-raster .beest-kaart:not(.dicht)').count() === 6);
    await p.locator('#stal-raster .beest-kaart').first().click();
    const pct = await p.locator('#info-odds b').allTextContents();
    const som = pct.reduce((a, t) => a + parseFloat(t), 0);
    check('Kansen in procenten, samen 100%', pct.length > 0 && Math.abs(som - 100) < 0.6);
    await p.click('#info-sluit'); await p.click('#stal .terug');

    console.log('\n=== HOTSEAT ===');
    await p.click('#t-hotseat'); await p.click('#team-willekeurig'); await p.click('#team-start');
    await p.click('#team-willekeurig'); await p.click('#team-start'); await p.waitForTimeout(300);
    check('Bord met 28 knopen', await p.locator('#bord circle.knoop').count() === 28);
    check('Zes beesten op elke bank', await p.locator('#bank-rood .bank-fig').count() === 6 && await p.locator('#bank-blauw .bank-fig').count() === 6);
    await p.locator('#bank-rood .bank-fig').first().click();
    const n = await p.locator('#bord .doelwit-tik').count();
    check('Inzetten toont waar hij heen kan', n >= 2);
    await p.locator('#bord .doelwit-tik').first().click(); await p.waitForTimeout(300);
    check('Na de zet is blauw aan de beurt', await p.evaluate(() => __schijfduel.pot.st.aanZet === 'blauw'));
    await p.click('#k-menu'); await p.waitForTimeout(200);

    console.log('\n=== CAMPAGNE ===');
    await p.click('#t-campagne');
    check('Twaalf hoofdstukken', await p.locator('#camp-lijst .camp-kaart').count() === 12);
    await p.locator('#camp-lijst .camp-bol.open').first().click();
    check('Vooraf zie je de zes tegenstanders', await p.locator('#vooraf-team .beest-kaart').count() === 6);
    await p.click('#vooraf-start');
    check('Met precies zes beesten staat je team al klaar', await p.locator('#team-raster .beest-kaart.gekozen').count() === 6);
    await p.click('#team-start');
    await p.waitForSelector('#spel.aan');
    check('Tegenstander is het team uit de vooruitblik', await p.evaluate(() => {
      const t = __schijfduel.V.campagneGevecht(0, 0, __schijfduel.M.VINYLS ? Object.keys(__schijfduel.M.VINYLS) : []);
      return JSON.stringify(Object.values(__schijfduel.pot.st.beesten).filter(b => b.kant === 'blauw').map(b => b.id).sort()) === JSON.stringify([...t.team].sort()); }));
    const klaar = await speelUit(p, 180000);
    check('Het campagnepotje komt tot een einde', klaar);
    await p.click('#uitslag-terug');

    console.log('\n=== LADDER ===');
    await p.click('#campagne .terug');
    await p.click('#t-ladder');
    check('Ladder begint in Brons III', (await p.locator('#ladder-naam').textContent()) === 'Brons III');
    await p.click('#ladder-zoek'); await p.click('#team-start');
    await p.waitForSelector('#spel.aan');
    const klaar2 = await speelUit(p, 180000);
    const uitslag = await p.evaluate(() => ({ w: __schijfduel.pot && __schijfduel.pot.st.winnaar, s: __schijfduel.P.ladder.sterren }));
    check('Ladderpotje afgerond, en de ster klopt met de uitslag',
      klaar2 && (uitslag.w === 'rood' ? uitslag.s === 1 : uitslag.s === 0));
  } catch (e) { fout++; console.log('FATAAL: ' + e.message); }
  check('Geen fouten in de pagina', fouten.length === 0);
  if (fouten.length) console.log(fouten.slice(0, 3));
  console.log(`\n${ok + fout} checks — ${ok} ✓  ${fout} ✗`);
  await b.close();
  process.exit(fout ? 1 : 0);
})();

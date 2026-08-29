#!/usr/bin/env node
// Smoke-test: boot de app headless in Chromium en klik alle schermen door.
// Vereist: python3 -m http.server draait op :8123 in de repo-root.
const path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const { chromium } = require(require('path').join('/opt/node22/lib/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 850 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // console-errors tellen mee, behalve netwerkfouten van externe hosts (fonts) — geen internet in de sandbox
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION|ERR_NAME|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

  const ok = (label, cond) => { console.log(cond ? '  ✓' : '  ✗', label); if (!cond) process.exitCode = 1; };

  await page.goto('http://localhost:8123/', { waitUntil: 'networkidle' });

  // 1. Home toont
  ok('Home-scherm actief na boot', await page.locator('#screen-home.active').count() === 1);
  ok('Beide valuta zichtbaar op home', (await page.locator('#home-valuta .cur').count()) === 2);
  {
    // De arena achter het menu wordt getekend uit dezelfde NODES en ROUTES als
    // het echte bord. Tellen bewijst dat: wijkt de geometrie af, dan klopt het
    // aantal niet meer en kijk je in het menu naar een ander bord dan je speelt.
    const verwacht = await page.evaluate(() => ({ lijnen: ROUTES.length, punten: Object.keys(NODES).length }));
    ok('Menu-arena tekent het echte bord',
      await page.locator('#ha-bord .ha-lijn').count() === verwacht.lijnen &&
      await page.locator('#ha-bord .ha-punt').count() === verwacht.punten);
    ok('Alle drie de arena-vloeren liggen klaar', await page.locator('#home-arena .ha-vloer').count() === 3);
  }

  // 2. Collectie
  await page.click('#tile-collection');
  ok('Collectie-scherm opent', await page.locator('#screen-collection.active').count() === 1);
  // Niet op een vast getal vastpinnen: het aantal figuren groeit (18 -> 54 in
  // sessie 41). Wat moet kloppen is dat de collectie ze ALLEMAAL laat zien.
  const aantalUnits = await page.evaluate(() => Object.keys(UNIT_DEFS).length);
  ok(`Alle ${aantalUnits} unit-kaarten in collectie`, await page.locator('#coll-grid .coll-card').count() === aantalUnits);

  // 3. Unit-detail met disk
  await page.locator('#coll-grid .coll-card:not(.locked)').first().click();
  await page.waitForSelector('#detail-overlay.active');
  ok('Detail-overlay opent', true);
  ok('Disk-preview gerenderd (16 slots → paths)', await page.locator('#disk-preview path, #disk-preview circle').count() > 5);
  ok('Upgrade-knop toont kosten of max', /upgrade|max/i.test(await page.locator('#btn-detail-upgrade').innerText()));
  await page.click('#btn-detail-close');

  // 4. Winkel
  await page.click('.btn-back');
  await page.click('#tile-store');
  ok('Winkel opent', await page.locator('#screen-store.active').count() === 1);
  ok('Koopbare kaarten aanwezig', await page.locator('#store-grid .price-chip').count() === aantalUnits);
  ok('Boosterkist zichtbaar in de winkel', await page.locator('#booster-card').count() === 1);
  ok('Alle kaarten staan ook in de winkel',
    await page.locator('#store-plates .price-chip').count() === await page.evaluate(() => Object.keys(PLATES).length));
  {
    // Munten wisselen voor diamantjes, anders is er niets te kopen
    const voorWissel = await page.evaluate(() => ({ m: profile.munten, d: profile.diamanten }));
    await page.locator('#bundel-rij .bundel').first().click();
    const naWissel = await page.evaluate(() => ({ m: profile.munten, d: profile.diamanten }));
    ok('Munten wisselen levert diamantjes op', naWissel.d > voorWissel.d && naWissel.m < voorWissel.m);
  }
  {
    // Een kaart kopen die je nog niet hebt
    const teKoop = page.locator('#store-plates .coll-card:not(.locked)').first();
    const hadKaarten = await page.evaluate(() => Object.keys(profile.ownedPlates).length);
    await page.evaluate(() => { profile.diamanten += 50; saveProfile(); renderStore(); });
    await teKoop.click();
    ok('Kaart kopen in de winkel werkt',
      await page.evaluate(() => Object.keys(profile.ownedPlates).length) === hadKaarten + 1);
  }
  {
    const snap = () => page.evaluate(() => ({ diamanten: profile.diamanten, units: Object.keys(profile.owned).length }));
    const before = await snap();
    await page.click('#booster-card');
    await page.waitForSelector('#booster-overlay.active');
    await page.waitForTimeout(1500);
    const after = await snap();
    // Je krijgt altijd iets: een nieuwe unit, of diamantjes terug bij een duplicaat
    const gotUnit = after.units > before.units;
    const gotRefund = after.diamanten > before.diamanten - 6;
    ok('Kist levert een unit of diamantjes terug', gotUnit || gotRefund);
    ok('Kist toont de naam van de unit', (await page.locator('#booster-name').innerText()).length > 2);
    await page.click('#btn-booster-close');
  }
  await page.click('.btn-back >> nth=1');

  // 5. Solo-flow: deck kiezen → game start
  await page.click('#tile-solo');
  await page.waitForSelector('#deck-overlay.active');
  ok('Deck-selectie opent', true);
  await page.click('#btn-deck-random');
  ok('Start-knop actief na random', await page.locator('#btn-deck-start:not([disabled])').count() === 1);
  ok('Drie team-slots zichtbaar', await page.locator('.slot-chip').count() === 3);
  await page.locator('.slot-chip[data-slot="0"] .slot-save').click();
  await page.waitForTimeout(200);
  {
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).decks[0]);
    const cost = await page.evaluate(() => plateCost(JSON.parse(localStorage.getItem('rondel_profile')).decks[0].plates));
    ok('Team bewaren werkt', !!saved && saved.units.length === 6 && saved.plates.length > 0);
    ok('Kaarten passen binnen het budget van 8', cost > 0 && cost <= 8);
  }
  {
    // Kaarten die je niet bezit staan grijs, net als figuren die je niet hebt
    const nietBezeten = await page.evaluate(() => Object.keys(PLATES).filter(k => !profile.ownedPlates[k]).length);
    ok('Niet-gekochte kaarten staan grijs in het deck-scherm',
      await page.locator('#deck-plates .deck-card.locked').count() === nietBezeten && nietBezeten > 0);
  }
  await page.click('#btn-deck-start');
  await page.waitForSelector('#screen-game.active');
  ok('Game-scherm actief', true);
  ok('Bord gerenderd met precies 28 punten (Duel: 26 + 2 doelen)', await page.locator('#board [data-node]').count() === 28);
  ok('Bench P1: 6 figuren naast het bord', await page.locator('#board g.bench-p1 g.bench-fig').count() === 6);
  ok('Bench P2: 6 figuren naast het bord', await page.locator('#board g.bench-p2 g.bench-fig').count() === 6);
  await page.waitForTimeout(600);
  ok('Schaakklok tikt (m:ss zichtbaar)', /⏱ [0-9]:[0-5][0-9]/.test(await page.locator('#turn-clock').innerText()));

  // 5a. Een figuur inzetten en z'n info-kaart openen (lang indrukken, Duel-gebaar)
  page.on('dialog', d => d.accept());
  const deployOne = async () => {
    const fig = page.locator('#board g.bench-p1 g.bench-fig').first();
    if (!await fig.count()) return false;
    await fig.click().catch(()=>{});
    await page.waitForTimeout(150);
    const glow = page.locator('#board .node-glow.active').first();
    if (!await glow.count()) return false;
    const gb = await glow.boundingBox();
    if (!gb) return false;
    await page.mouse.click(gb.x + gb.width/2, gb.y + gb.height/2);
    await page.waitForTimeout(700);
    return true;
  };
  await deployOne();
  const unit = page.locator('#board g.unit-fig').first();
  ok('Figuur staat op het bord na inzetten', await unit.count() === 1);
  {
    const box = await unit.boundingBox();
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
    await page.waitForTimeout(350);
  }
  ok('Lang indrukken opent de figuur-info', await page.locator('#info-overlay.active').count() === 1);
  ok('Info-kaart toont de schijf', await page.locator('#info-disk path').count() > 4);
  await page.click('#btn-info-close');

  // 5a2. Nog een paar beurten spelen zodat ability-hooks (deploy/combat/MP) echt draaien.
  // Onderweg meten we de bordhoogte: die mag NIET per beurt verspringen, anders
  // "herkalibreert" het scherm zichtbaar bij elke End Turn (klacht sessie 37).
  const hoogtes = [];
  const meetBord = async () => page.evaluate(() => Math.round(document.querySelector('.board-wrap').getBoundingClientRect().height));
  hoogtes.push(await meetBord());
  for (let t = 0; t < 5; t++) {
    if (await page.locator('#btn-end-turn').count()) await page.click('#btn-end-turn').catch(()=>{});
    await page.waitForTimeout(500); // AI-beurt
    await deployOne();
    hoogtes.push(await meetBord());
  }
  ok('Enkele beurten gespeeld zonder crash', errors.length === 0);
  ok('Bordhoogte blijft stabiel over de beurten heen', new Set(hoogtes).size === 1);
  if (new Set(hoogtes).size !== 1) console.log('    hoogtes:', hoogtes.join(', '));

  // 5a2b. Gevechtsanimatie: de twee poppetjes staan in beeld en er vliegt iets
  // van de een naar de ander. We forceren een gevecht met een vaste uitkomst.
  {
    const opgezet = await page.evaluate(() => {
      const uids = Object.keys(state.units);
      const mine = uids.find(u => state.units[u].owner === 'p1');
      const foe  = uids.find(u => state.units[u].owner === 'p2');
      if (!mine || !foe) return false;
      state.units[mine].node = 'B2'; state.units[foe].node = 'B3';
      state.units[mine].status = []; state.units[foe].status = [];
      state.bench.p1 = state.bench.p1.filter(u => u !== mine);
      state.bench.p2 = state.bench.p2.filter(u => u !== foe);
      state.locked = false; state.over = false;
      const wit = applyStatus(state.units[mine].slots, []).findIndex(s => s.k === 'white' || s.k === 'gold');
      const blauw = applyStatus(state.units[foe].slots, []).findIndex(s => s.k === 'blue');
      window.__wit = wit; window.__blauw = blauw;
      window.spin = (id) => new Promise(r => setTimeout(() => r(id === 'disk-bottom' ? wit : blauw), 200));
      runCombat(state.units[mine], state.units[foe]);
      return true;
    });
    ok('Gevecht kon geforceerd worden', opgezet);
    await page.waitForSelector('#combat-overlay.active');
    await page.waitForTimeout(240);
    ok('Beide vechters staan in het gevechtsscherm',
      await page.locator('#fighter-top img, #fighter-top svg').count() === 1 &&
      await page.locator('#fighter-bottom img, #fighter-bottom svg').count() === 1);
    // Wacht tot het projectiel onderweg is (spin duurt 200ms in deze test)
    let zagVlucht = false, zagSchild = false;
    for (let i = 0; i < 30 && !(zagVlucht && zagSchild); i++) {
      if (await page.locator('#attack-fx .fx-vlieg').count()) zagVlucht = true;
      if (await page.locator('#attack-fx .fx-badge .bd-schild').count()) zagSchild = true;
      await page.waitForTimeout(50);
    }
    ok('Er vliegt een aanval van de één naar de ander', zagVlucht);
    ok('Een blok toont een schild-icoon', zagSchild);
    // Het toneel: de twee moeten elkaar echt opzoeken, en de wielen wijken.
    ok('De twee staan op het dueltoneel',
      await page.locator('#duel-toneel.aan .dt-lijf img').count() === 2);
    ok('De wielen wijken tijdens de scène',
      await page.locator('#combat-overlay .disks-row.wijk').count() === 1);
    ok('Er is een scène gekozen die bij de uitkomst past',
      typeof (await page.evaluate(() => state.laatsteScene)) === 'string');
    // Overslaan: een filmpje dat je honderd keer ziet moet weg kunnen.
    const voorTik = Date.now();
    await page.locator('#duel-toneel').click({ position: { x: 30, y: 30 } });
    await page.waitForSelector('#btn-combat-continue:visible', { timeout: 8000 });
    ok('Tikken slaat de scène over', Date.now() - voorTik < 2500);
    // Het gedraaide vak licht op — en wel precies het vak waar de wijzer staat
    const mark = await page.evaluate(() => {
      const uit = [];
      for (const [id, idx] of [['disk-top', window.__blauw], ['disk-bottom', window.__wit]]) {
        const svg = document.getElementById(id);
        const waas = svg.querySelector('.slot-mark-waas');
        const rand = svg.querySelector('.slot-mark');
        if (!waas || !rand) { uit.push(false); continue; }
        const w = [...svg.querySelectorAll('path[data-start]')].find(p => p.getAttribute('d') === waas.getAttribute('d'));
        uit.push(!!w && idx >= +w.dataset.start && idx < +w.dataset.end);
      }
      return uit;
    });
    ok('Het gedraaide vak licht op onder de wijzer', mark.length === 2 && mark.every(Boolean));
    await page.click('#btn-combat-continue');
    await page.waitForTimeout(300);
  }

  // 5a2b2. Inzetpoort: op het startpunt scheurt een poort open waar het figuur
  // uit klimt (hemelpoort bij p1, duistere put bij p2).
  {
    const gestart = await page.evaluate(() => {
      const uid = state.bench.p1[0]; if (!uid) return false;
      // state.over stopt de AI-beurtketen, anders tekent die het bord tussendoor
      // opnieuw en veegt hij de animatie die we willen meten weg.
      state.turn = 'p1'; state.locked = false; state.over = true;
      doDeploy(state.units[uid], 'E2_TL');
      return true;
    });
    ok('Inzet kon geforceerd worden', gestart);
    await page.waitForTimeout(120);
    ok('Poort gaat open op het startpunt', await page.locator('#board g.portal').count() >= 1);
    await page.waitForTimeout(1400);
    // De poort dooft uit (CSS met fill:forwards); het lege groepje verdwijnt
    // vanzelf bij de eerstvolgende render van het bord.
    const dof = await page.evaluate(() => {
      const g = document.querySelector('#board g.portal');
      if (!g) return true;
      return [...g.children].every(c => parseFloat(getComputedStyle(c).opacity) < 0.05);
    });
    ok('Poort dooft weer uit', dof);
  }

  // 5a2b3. Level-up: gouden ringen en het nieuwe levelcijfer op het bord.
  // We lezen de FX in DEZELFDE evaluate uit: een render van de AI-beurt zou de
  // SVG anders tussendoor kunnen herbouwen en de meting onbetrouwbaar maken.
  {
    const lv = await page.evaluate(() => {
      const u = Object.values(state.units).find(x => x.owner === 'p1');
      if (!u) return null;
      u.node = 'IT2'; u.level = 1;
      state.bench.p1 = state.bench.p1.filter(x => x !== u.uid);
      levelUp(u); renderAll();
      const g = document.querySelector('#board g.lvlfx');
      return { aantal: document.querySelectorAll('#board g.lvlfx').length,
               tekst: g ? (g.querySelector('text') || {}).textContent : '',
               ringen: g ? g.querySelectorAll('ellipse').length : 0 };
    });
    ok('Level-up toont een flourish op het bord', !!lv && lv.aantal === 1 && lv.ringen >= 4);
    ok('Level-up noemt het nieuwe level', !!lv && /LV 2/.test(lv.tekst));
    await page.waitForTimeout(1500);
  }

  // 5a2c. Kaartanimatie: de gespeelde kaart vliegt groot in beeld
  {
    await page.evaluate(() => {
      const mine = Object.keys(state.units).find(u => state.units[u].owner === 'p1' && state.units[u].node);
      state.plates.p1 = ['xattack']; state.plateUsed = false; state.locked = false;
      window.__doel = mine; renderAll();
      usePlate('p1', 0, mine);
    });
    await page.waitForTimeout(320);
    ok('Gespeelde kaart vliegt in beeld', await page.locator('#kaart-fx .kaart-vlucht').count() === 1);
    ok('De kaart toont z\'n eigen naam', /Krachtstoot/.test(await page.locator('#kaart-fx .kv-naam').innerText().catch(()=>'')));
    await page.waitForTimeout(1200);
    ok('Kaartanimatie ruimt zichzelf op', await page.locator('#kaart-fx .kaart-vlucht').count() === 0);
  }

  // 5a2c2. Een verslagen figuur zweeft als ziel naar het Healing Center
  {
    const ziel = await page.evaluate(() => {
      const u = Object.values(state.units).find(x => x.owner === 'p2');
      if (!u) return null;
      u.node = 'IT2'; state.bench.p2 = state.bench.p2.filter(x => x !== u.uid);
      const vanaf = u.node;
      koUnit(u); zielNaarHC(u, vanaf); renderAll();
      const g = document.querySelector('#board g.zielfx');
      return { er: !!g, inHC: state.hc.p2.includes(u.uid),
               doel: g ? g.style.getPropertyValue('--x1') : '' };
    });
    ok('Verslagen figuur zweeft naar het Healing Center', !!ziel && ziel.er && ziel.inHC);
    ok('De ziel heeft een echte bestemming', !!ziel && /px$/.test(ziel.doel));
    await page.waitForTimeout(1200);
  }

  // 5a2c3. Statuseffecten zijn echte animaties, geen losse stipjes
  {
    const st = await page.evaluate(() => {
      const uits = {};
      const soorten = ['burn', 'poison', 'badlypoison', 'paralysis'];
      const punten = ['L1', 'L2', 'L3', 'R1'];
      const units = Object.values(state.units).slice(0, 4);
      units.forEach((u, i) => {
        u.node = punten[i]; u.status = [soorten[i]];
        state.bench[u.owner] = state.bench[u.owner].filter(x => x !== u.uid);
      });
      renderAll();
      // tel per figuur hoeveel bewegende onderdelen er omheen zitten
      const figs = [...document.querySelectorAll('#board g.unit-fig')];
      units.forEach((u, i) => {
        const g = figs.find(f => f.getAttribute('transform') &&
          f.getAttribute('transform').includes(`${NODES[punten[i]].x},`));
        uits[soorten[i]] = g ? g.querySelectorAll('.fx-anim, path, ellipse, circle').length : 0;
      });
      return uits;
    });
    ok('Brand is een vuur, geen paar sliertjes', (st.burn || 0) >= 14);
    ok('Vergiftigd heeft bellen en een plas', (st.poison || 0) >= 10);
    ok('Zwaar vergiftigd is nog voller dan gewoon gif', (st.badlypoison || 0) >= (st.poison || 0));
    ok('Verlamd knettert', (st.paralysis || 0) >= 10);
  }

  // 5a2c3b. Omsingeling: alleen de VIJAND kan je insluiten (Duel-regel).
  // Je eigen figuren eromheen betekent vastzitten, niet doodgaan.
  {
    const om = await page.evaluate(() => {
      const us = Object.values(state.units);
      const mij = us.filter(u => u.owner === 'p1');
      const vij = us.filter(u => u.owner === 'p2');
      if (mij.length < 4 || vij.length < 3) return null;
      const midden = 'IT2', buren = [...ADJ[midden]];
      const opstellen = (ring) => {
        for (const u of us) { u.node = null; state.bench[u.owner] = state.bench[u.owner].filter(x => x !== u.uid); }
        mij[0].node = midden;
        buren.forEach((n, i) => { if (ring[i]) ring[i].node = n; });
      };
      opstellen(mij.slice(1));           // eigen figuren eromheen
      checkSurround();
      const eigenOverleeft = mij[0].node === midden;
      opstellen(vij);                    // vijanden eromheen
      mij[0].node = midden;
      checkSurround();
      const vijandKO = mij[0].node === null;
      return { eigenOverleeft, vijandKO, buren: buren.length };
    });
    ok('Ingesloten door je EIGEN figuren is geen KO', !!om && om.eigenOverleeft);
    ok('Ingesloten door de VIJAND is wel een KO', !!om && om.vijandKO);
  }

  // 5a2c3c. Rond de doelen ligt een cirkel, geen ovaal
  {
    const ovalen = await page.evaluate(() => [...document.querySelectorAll('#board ellipse')]
      .filter(e => { const rx = +e.getAttribute('rx'), ry = +e.getAttribute('ry'); return rx > 40 && ry > 30 && rx !== ry; }).length);
    ok('Geen uitgerekte ovaal rond de doelpunten', ovalen === 0);
  }

  // 5a2c4. Omsingeld klapt van acht kanten dicht
  {
    const om = await page.evaluate(() => {
      const u = Object.values(state.units).find(x => x.node);
      if (!u) return null;
      queueFX(NODES[u.node].x, NODES[u.node].y, 'omsingeld');
      renderAll();
      const g = document.querySelector('#board g.omfx');
      return { er: !!g, punten: g ? g.querySelectorAll('.om-punt').length : 0 };
    });
    ok('Omsingeling klapt van acht kanten dicht', !!om && om.er && om.punten === 8);
    await page.waitForTimeout(1200);
  }

  // 5a2c5. Tijdnood: de klok klopt en de balk alarmeert
  {
    // over/locked staan uit eerdere blokken nog aan; de klok tikt dan niet
    await page.evaluate(() => { state.over = false; state.locked = false; state.turn = 'p1'; state.clock = state.clock || { p1: 0, p2: 0 }; state.clock.p1 = 8200; startClock(); });
    await page.waitForTimeout(500);
    const t = await page.evaluate(() => ({
      klok: document.getElementById('turn-clock').className,
      balk: document.getElementById('turn-banner').className,
    }));
    ok('Klok klopt onder de dertig seconden', /klok-krap/.test(t.klok));
    ok('Balk alarmeert onder de tien seconden', /tijdnood/.test(t.balk));
    await page.evaluate(() => { state.clock.p1 = 240000; });
    await page.waitForTimeout(400);
  }

  // 5a2d. Het doel bereiken barst open met stralen en de tekst DOEL!
  {
    const doel = await page.evaluate(() => {
      const u = Object.values(state.units).find(x => x.owner === 'p1');
      if (!u) return null;
      u.node = 'G2'; state.bench.p1 = state.bench.p1.filter(x => x !== u.uid);
      state.over = false;
      endMatch('p1', 'goal');
      const g = document.querySelector('#board g.goalfx');
      return { er: !!g, tekst: g ? (g.querySelector('text') || {}).textContent : '',
               stralen: g ? g.querySelectorAll('.goal-straal').length : 0 };
    });
    ok('Doelpunt barst open op het bord', !!doel && doel.er && doel.stralen >= 10);
    ok('Doelpunt roept DOEL!', !!doel && /DOEL/.test(doel.tekst));
    await page.waitForSelector('#result-overlay.active', { timeout: 4000 });
    ok('Eindscherm verschijnt na het doelpunt', true);
    await page.click('#btn-result-menu');
    await page.waitForTimeout(300);
    await page.click('#tile-solo');
    await page.waitForSelector('#deck-overlay.active');
    await page.click('#btn-deck-random');
    await page.click('#btn-deck-start');
    await page.waitForSelector('#screen-game.active');
    ok('Nieuw potje start weer op na het eindscherm', true);
  }

  // 5a2e. EVOLUTIE (Duel-regels): evolutie aanhangen in het team, en tijdens
  // een gevecht winnen zodat het keuzescherm komt.
  {
    await page.evaluate(() => {
      for (const k of Object.keys(UNIT_DEFS)) profile.owned[k] = profile.owned[k] || 1;
      saveProfile();
    });
    // Terug naar de deck-selectie via een nieuw potje
    if (await page.locator('#result-overlay.active').count()) { await page.click('#btn-result-menu'); await page.waitForTimeout(300); }
    if (await page.locator('#screen-game.active').count()) { await page.click('#btn-menu'); await page.waitForTimeout(300); }
    await page.click('#tile-solo');
    await page.waitForSelector('#deck-overlay.active');
    // Het team wordt automatisch gevuld zolang er niets te kiezen valt (je bezit
    // precies zes basisvormen). Begin dus met een schone lei.
    await page.evaluate(() => { deckSel.units = []; deckSel.evos = {}; renderDeckSelect(); });
    await page.locator('#deck-units .deck-card', { hasText: 'Einherjar' }).first().click();
    await page.waitForTimeout(150);
    // De hele keten hangt eronder: Einherjar -> Eir -> Odin = twee sleuven
    ok('De hele evolutieketen verschijnt onder een gekozen figuur',
      await page.locator('#deck-units .deck-card .evo-sleuf').count() === 2);
    await page.locator('#deck-units .deck-card .evo-sleuf').first().click();
    await page.waitForTimeout(150);
    ok('Evolutie aanhangen werkt', await page.evaluate(() => deckSel.evos.squire) === 'cleric');
    // De tweede stap kan pas als de eerste hangt
    await page.locator('#deck-units .deck-card .evo-sleuf').nth(1).click();
    await page.waitForTimeout(150);
    ok('Tweede stap van de keten kan erbij', await page.evaluate(() => deckSel.evos.cleric) === 'commander');
    // Een geëvolueerde vorm staat er wel, maar is niet kiesbaar
    const aantalEvo = await page.evaluate(() => Object.keys(UNIT_DEFS).filter(k => !isBasisvorm(k)).length);
    ok('Geëvolueerde vormen zijn niet rechtstreeks inzetbaar',
      await page.locator('#deck-units .deck-card.evo-only').count() === aantalEvo);
    ok('Aangehangen evolutie krijgt een blauw stipje',
      await page.locator('#deck-units .deck-card.evo-klaar').count() === 1);

    await page.evaluate(() => {
      deckSel.units = ['squire','scout','apprentice','skeleton','boar','imp'];
      deckSel.evos = { squire: 'cleric' };
      deckSel.plates = ['fullheal'];
      renderDeckSelect();
    });
    await page.click('#btn-deck-start');
    await page.waitForSelector('#screen-game.active');
    ok('Evolutie reist mee naar het bord', await page.evaluate(() =>
      Object.values(state.units).some(u => u.owner === 'p1' && u.defKey === 'squire' && u.evoKey === 'cleric')));

    // Gevecht forceren waarin p1 wint
    await page.evaluate(() => {
      const mine = Object.values(state.units).find(u => u.owner === 'p1' && u.defKey === 'squire');
      const foe = Object.values(state.units).find(u => u.owner === 'p2');
      mine.node = 'B2'; foe.node = 'B3'; mine.status = []; foe.status = [];
      state.bench.p1 = state.bench.p1.filter(x => x !== mine.uid);
      state.bench.p2 = state.bench.p2.filter(x => x !== foe.uid);
      state.locked = false; state.over = false;
      const aS = applyStatus(mine.slots, []), dS = applyStatus(foe.slots, []);
      const gouden = aS.findIndex(s => s.k === 'gold');
      const raak = gouden >= 0 ? gouden : aS.findIndex(s => s.k === 'white');
      const rood = dS.findIndex(s => s.k === 'red');
      window.spin = (id) => new Promise(r => setTimeout(() => r(id === 'disk-bottom' ? raak : rood), 120));
      window.__evoU = mine;
      runCombat(mine, foe);
    });
    await page.waitForSelector('#btn-combat-continue:visible', { timeout: 12000 });
    await page.click('#btn-combat-continue');
    await page.waitForSelector('#evo-overlay.active', { timeout: 6000 });
    ok('Winnen biedt de evolutie aan', true);
    ok('Het keuzescherm noemt beide vormen',
      /Einherjar/.test(await page.locator('#evo-van-naam').innerText()) &&
      /Eir/.test(await page.locator('#evo-naar-naam').innerText()));
    await page.click('#btn-evo-ja');
    await page.waitForTimeout(300);
    const ev = await page.evaluate(() => {
      const u = window.__evoU;
      const basis = UNIT_DEFS.cleric.slots;
      return {
        key: u.defKey, evolved: u.evolved, evoKey: u.evoKey,
        witBonus: u.slots.filter(s => s.k === 'white').every(s =>
          basis.some(b => b.k === 'white' && b.v + 10 === s.v)),
        sterBonus: u.slots.filter(s => s.k === 'purple').every(s =>
          basis.some(b => b.k === 'purple' && (b.stars || 1) + 1 === s.stars)),
        fx: document.querySelectorAll('#board g.evofx').length,
      };
    });
    ok('Figuur is echt geëvolueerd', !!ev && ev.key === 'cleric' && ev.evolved === true);
    ok('Evolutie kan daarna niet nog eens', !!ev && ev.evoKey === null);
    ok('Duel-bonus: +10 op wit', !!ev && ev.witBonus);
    ok('Duel-bonus: +1 ster op paars', !!ev && ev.sterBonus);
    ok('Evolutie barst open op het bord', !!ev && ev.fx === 1);
    // Het blauwe stipje hoort alleen op het BORD te staan, en alleen bij wie nog
    // een stap te gaan heeft
    const stip = await page.evaluate(() => {
      const opBord = Object.values(state.units).filter(u => u.node);
      return { stippen: document.querySelectorAll('#board .evo-stip').length,
               kunnen: opBord.filter(u => u.evoKey).length };
    });
    ok('Blauw stipje staat bij precies de figuren die nog kunnen evolueren',
      !!stip && stip.stippen === stip.kunnen);
    await page.waitForTimeout(1400);
  }

  // 5a3. Instellingen: geluid uitzetten en controleren dat het bewaard blijft.
  // Het geforceerde potje hierboven kan zijn afgelopen; het eindscherm komt met
  // 900ms vertraging, dus even wachten en wegklikken voor we verder navigeren.
  const sluitEinde = async () => {
    if (await page.locator('#result-overlay.active').count()) { await page.click('#btn-result-menu'); await page.waitForTimeout(350); }
  };
  await page.waitForTimeout(1100);
  await sluitEinde();
  if (await page.locator('#screen-game.active').count()) await page.click('#btn-menu');
  await page.waitForSelector('#screen-home.active');
  await page.click('#tile-settings');
  await page.waitForSelector('#screen-settings.active');
  ok('Instellingen-scherm opent', await page.locator('.set-group').count() >= 3);
  {
    // Duim-norm: elk bedienelement minstens 44px hoog (schakelaars tellen hun
    // opgerekte tikgebied mee, dat 9px boven en onder de pil uitsteekt)
    const small = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('.toggle, .seg button, .set-slider input')) {
        const r = el.getBoundingClientRect();
        const h = el.classList.contains('toggle') ? r.height + 18 : r.height;
        if (h < 44) bad.push((el.className || el.tagName) + ':' + Math.round(h));
      }
      return bad;
    });
    ok('Alle bedienelementen zijn duim-groot (>=44px)', small.length === 0);
    if (small.length) console.log('    te klein:', small.join(', '));
  }
  await page.locator('.toggle[data-setting="sfx"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).settings.sfx);
  ok('Instelling wordt direct opgeslagen', stored === false);
  await page.locator('.seg[data-setting="clockMinutes"] button', { hasText: 'Uit' }).click();
  const clk = await page.evaluate(() => JSON.parse(localStorage.getItem('rondel_profile')).settings.clockMinutes);
  ok('Bedenktijd kan uitgezet worden', clk === 0);
  await page.locator('.toggle[data-setting="sfx"]').click();   // weer aan voor de rest
  await page.click('#screen-settings .btn-back');

  // 5a4. Hoe speel je
  await page.click('#tile-help');
  await page.waitForSelector('#screen-help.active');
  ok('Uitlegscherm toont alle secties', await page.locator('.help-sec').count() >= 10);
  ok('Uitleg noemt de vijf schijfkleuren', await page.locator('.help-swatch').count() === 5);
  await page.click('#screen-help .btn-back');

  // 5b. Ability zichtbaar in collectie-detail
  await page.click('#tile-collection');
  await page.locator('#coll-grid .coll-card', { hasText: 'Hermes' }).click();
  await page.waitForSelector('#detail-overlay.active');
  ok('Ability getoond in unit-detail', /Sluipen/.test(await page.locator('#detail-slots').innerText()));
  await page.click('#btn-detail-close');

  // 6. Terug naar home
  await page.locator('.btn-back').first().click();
  await page.waitForSelector('#screen-home.active');
  ok('Menu-knop keert terug naar home', true);

  ok('Geen JS-runtime-errors', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
  console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
})().catch(e => { console.error('FATAAL:', e.message); process.exit(1); });

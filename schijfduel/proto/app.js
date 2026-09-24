/* SCHIJFDUEL — schermen en spelstroom. De regels zitten in game.js. */
(async function () {
  'use strict';
  const R = window.SchijfduelRender, V = window.SchijfduelVoortgang, AI = window.SchijfduelAI;
  const [board, vinyls] = await Promise.all([
    fetch('../board.json').then(r => r.json()), fetch('../vinyls.json').then(r => r.json())]);
  const M = window.Schijfduel.maakMotor(board, vinyls);
  const ALLE = vinyls.vinyls.map(v => v.id);
  const TOT = M.TIK_TOTAAL;
  const $ = id => document.getElementById(id);
  // Tempo: ?snel=1 in de link, of "minder beweging" in de telefooninstellingen,
  // maakt alle wachttijden en draaiingen veel korter.
  const TEMPO = new URLSearchParams(location.search).has('snel') ||
    (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 0.12 : 1;
  const wacht = ms => new Promise(r => setTimeout(r, Math.round(ms * TEMPO)));
  const naam = id => M.VINYLS[id].name;
  const PASSIEF = {
    axis_white_plus: 'Slaat 10 harder met wit als hij op de middenas staat.',
    phase_allies: 'Loopt door bevriende beesten heen (maar eindigt er niet op).',
    slow_return: 'Blijft na een knock-out een beurt langer in de wachtplaats.',
    rebirth: 'De eerste knock-out gaat hij naar de bank in plaats van de wachtplaats.',
    immovable: 'Kan niet geduwd of gewisseld worden.',
  };

  // ── profiel (eigen sleutel: het vorige spel heeft er een eigen) ─────────────
  const SLEUTEL = 'schijfduel_profiel';
  let P;
  try { P = V.migreer(JSON.parse(localStorage.getItem(SLEUTEL))); } catch (e) { P = V.freshProfiel(); }
  const bewaar = () => { try { localStorage.setItem(SLEUTEL, JSON.stringify(P)); } catch (e) {} };
  bewaar();

  function toon(id) {
    for (const s of document.querySelectorAll('.scherm')) s.classList.remove('aan');
    $(id).classList.add('aan'); window.scrollTo(0, 0);
  }
  function melding(t) { const m = $('melding'); m.textContent = t; m.classList.add('aan'); clearTimeout(melding.t); melding.t = setTimeout(() => m.classList.remove('aan'), 2200); }
  for (const b of document.querySelectorAll('[data-naar]')) b.addEventListener('click', () => { if (b.dataset.naar === 'menu') toonMenu(); else toon(b.dataset.naar); });

  // ── menu ─────────────────────────────────────────────────────────────────────
  R.tekenBord($('menu-bord'), M, null);
  function toonMenu() {
    const titel = V.TITELS[V.rang(P.ladder.hoogste || 0)];
    $('menu-titel').textContent = `${titel} · ${P.stal.length}/12 beesten`;
    toon('menu');
  }
  $('t-campagne').onclick = () => { tekenCampagne(); toon('campagne'); };
  $('t-ladder').onclick = () => { tekenLadder(); toon('ladder'); };
  $('t-vrij').onclick = () => kiesTeam({ titel: 'VRIJ SPEL', pool: P.stal, uitleg: 'Kies zes beesten uit je stal. Je speelt rood, de computer blauw.',
    dan: team => startPotje({ rood: team, blauw: willekeurig(ALLE, 6), ai: 'normaal', soort: 'vrij' }) });
  $('t-hotseat').onclick = () => kiesTeam({ titel: 'ROOD KIEST', pool: ALLE, uitleg: 'Speler rood: kies zes beesten.',
    dan: rood => kiesTeam({ titel: 'BLAUW KIEST', pool: ALLE, uitleg: 'Speler blauw: kies zes beesten.',
      dan: blauw => startPotje({ rood, blauw, ai: null, soort: 'hotseat' }) }) });
  $('t-stal').onclick = () => { tekenStal(); toon('stal'); };
  $('t-regels').onclick = () => toon('regels');

  function willekeurig(lijst, n) { const a = [...lijst], u = []; while (u.length < n && a.length) u.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return u; }
  function kaart(id, extra) {
    return `<div class="beest-kaart${extra || ''}" data-id="${id}"><div class="beeld">${R.beeldHtml(id, naam(id))}</div>
      <div class="naam">${naam(id)}</div><div class="mp">MP ${M.VINYLS[id].mp}</div></div>`;
  }

  // ── stal en info ─────────────────────────────────────────────────────────────
  function tekenStal() {
    $('stal-raster').innerHTML = ALLE.map(id => kaart(id, P.stal.includes(id) ? '' : ' dicht')).join('');
    for (const k of $('stal-raster').children) k.onclick = () => toonInfo(k.dataset.id);
  }
  function toonInfo(id) {
    const v = M.VINYLS[id];
    $('info-beeld').innerHTML = R.beeldHtml(id, v.name);
    $('info-naam').textContent = v.name;
    $('info-sub').textContent = `MP ${v.mp}` + (v.passive ? ' · ' + (PASSIEF[v.passive.id] || '') : '');
    R.tekenWiel($('info-wiel'), v, TOT);
    $('info-odds').innerHTML = R.oddsHtml(v, TOT);
    $('info').classList.add('aan');
  }
  $('info-sluit').onclick = () => $('info').classList.remove('aan');

  // ── team kiezen ──────────────────────────────────────────────────────────────
  function kiesTeam({ titel, pool, uitleg, dan, terug }) {
    let gekozen = pool.length === 6 ? [...pool] : (P.team && P.team.every(k => pool.includes(k)) && pool === P.stal ? [...P.team] : []);
    $('team-titel').textContent = titel; $('team-uitleg').textContent = uitleg + ' Tik op een gekozen beest om het weer weg te halen.';
    const teken = () => {
      $('team-raster').innerHTML = ALLE.map(id => kaart(id, (pool.includes(id) ? '' : ' dicht') + (gekozen.includes(id) ? ' gekozen' : ''))).join('');
      for (const k of $('team-raster').children) k.onclick = () => {
        const id = k.dataset.id;
        if (!pool.includes(id)) { melding('Dit beest verdien je in de campagne'); return; }
        if (gekozen.includes(id)) gekozen = gekozen.filter(x => x !== id);
        else if (gekozen.length < 6) gekozen.push(id); else melding('Je hebt er al zes');
        teken();
      };
      $('team-start').disabled = gekozen.length !== 6;
    };
    $('team-willekeurig').onclick = () => { gekozen = willekeurig(pool, 6); teken(); };
    $('team-start').onclick = () => { if (pool === P.stal) { P.team = [...gekozen]; bewaar(); } dan([...gekozen]); };
    $('team-terug').onclick = terug || toonMenu;
    teken(); toon('team');
  }

  // ── het potje ────────────────────────────────────────────────────────────────
  let pot = null, sel = null, bezig = false;
  function startPotje(o) {
    const url = new URLSearchParams(location.search).get('seed');
    const zaad = o.zaad || (url ? (+url >>> 0) : Math.floor(Math.random() * 1e9));
    pot = { ...o, zaad, st: M.nieuwPotje({ teams: { rood: o.rood, blauw: o.blauw }, seed: zaad, start: 'rood' }) };
    sel = null; bezig = false;
    toon('spel'); teken(); volgende();
  }
  const aiAanZet = () => pot && pot.ai && pot.st.aanZet === 'blauw' && pot.st.fase !== 'klaar';

  function teken() {
    const st = pot.st;
    let doelwitten = [], vijand = false;
    if (sel) doelwitten = [...new Set(sel.opties.filter(a => a.naar).map(a => a.naar))];
    if (st.fase === 'duel' && !aiAanZet()) { doelwitten = M.acties(st).filter(a => a.soort === 'duel').map(a => st.beesten[a.doel].knoop); vijand = true; }
    R.tekenBord($('bord'), M, st, { doelwitten, vijandDoel: vijand, gekozen: sel && sel.uid, opKnoop, opFiguur });
    for (const kant of ['rood', 'blauw']) {
      $('bank-' + kant).innerHTML = st.bank[kant].map(u => bankFig(st.beesten[u], '')).join('');
      $('wacht-' + kant).innerHTML = st.wachtplaats[kant].map(u => bankFig(st.beesten[u], `<span class="timer">${st.beesten[u].timer}</span>`)).join('');
      for (const f of $('rij-' + kant).querySelectorAll('.bank-fig')) f.onclick = () => opBank(f.dataset.uid);
    }
    const aan = st.aanZet;
    $('balk').className = 'balk' + (aan === 'blauw' ? ' blauw' : '');
    $('balk-tekst').textContent = st.fase === 'klaar' ? 'Afgelopen' : `${aan === 'rood' ? 'Rood' : 'Blauw'} aan zet${aiAanZet() ? ' (computer)' : ''}`;
    $('balk-fase').textContent = `beurt ${st.beurt}` + (st.fase === 'duel' ? ' · duel?' : '');
    $('k-pas').style.display = st.fase === 'actie' && !aiAanZet() ? '' : 'none';
    $('k-geenduel').style.display = st.fase === 'duel' && !aiAanZet() ? '' : 'none';
    if (aiAanZet()) hint('De computer denkt na…');
    else if (st.fase === 'duel') hint('Tik op een vijand om te duelleren — of kies Geen duel');
    else if (sel) hint(sel.blijf ? 'Tik op een lichtende knoop — of tik hem nog eens aan om te blijven staan en te duelleren' : 'Tik op een lichtende knoop');
    else if (st.fase === 'actie') hint('Kies een beest op je bank om in te zetten, of een beest op het veld om te lopen. Tik op een ander beest voor z\'n schijf.');
  }
  function bankFig(b, extra) { return `<div class="bank-fig ${b.kant}${sel && sel.uid === b.uid ? ' kies' : ''}" data-uid="${b.uid}">${R.beeldHtml(b.id, naam(b.id))}${extra}</div>`; }
  function hint(t) { $('hint').textContent = t; }

  function opBank(uid) {
    const st = pot.st, b = st.beesten[uid];
    if (bezig || aiAanZet() || st.fase !== 'actie' || b.kant !== st.aanZet || !st.bank[b.kant].includes(uid)) { toonInfo(b.id); return; }
    const opties = M.acties(st).filter(a => a.soort === 'inzet' && a.uid === uid);
    if (!opties.length) { melding('Geen vrije entry om in te zetten'); return; }
    sel = sel && sel.uid === uid ? null : { uid, opties }; teken();
  }
  function opFiguur(uid) {
    const st = pot.st, b = st.beesten[uid];
    if (bezig || aiAanZet()) { toonInfo(b.id); return; }
    if (st.fase === 'duel' && b.kant !== st.aanZet) {
      const a = M.acties(st).find(x => x.soort === 'duel' && x.doel === uid);
      if (a) { voerUit(a); return; }
    }
    if (st.fase === 'actie' && b.kant === st.aanZet) {
      if (b.rust) { melding(`${naam(b.id)} moet deze beurt wachten`); return; }
      if (sel && sel.uid === uid) { const blijf = sel.opties.find(a => a.soort === 'blijf'); sel = null; if (blijf) voerUit(blijf); else teken(); return; }
      const opties = M.acties(st).filter(a => (a.soort === 'loop' || a.soort === 'blijf') && a.uid === uid);
      sel = { uid, opties, blijf: opties.some(a => a.soort === 'blijf') }; teken(); return;
    }
    toonInfo(b.id);
  }
  function opKnoop(k) {
    if (!sel || bezig) return;
    const a = sel.opties.find(x => x.naar === k);
    if (a) { sel = null; voerUit(a); }
  }
  $('k-pas').onclick = () => { if (!bezig) { sel = null; voerUit({ soort: 'pas' }); } };
  $('k-geenduel').onclick = () => { if (!bezig) voerUit({ soort: 'geenDuel' }); };
  $('k-menu').onclick = () => { if (confirm('Potje stoppen en naar het menu?')) { pot = null; toonMenu(); } };

  async function voerUit(a) {
    if (bezig) return;
    bezig = true;
    const st = pot.st;
    let ev;
    try { ev = M.doe(st, a); } catch (e) { bezig = false; melding('Dat mag niet'); teken(); return; }
    const d = ev.find(e => e.soort === 'duel');
    if (d) await toonDuel(d, ev);
    for (const e of ev) {
      if (e.soort === 'ingesloten') melding(`${naam(st.beesten[e.uid].id)} is ingesloten — knock-out!`);
      if (e.soort === 'naarBank') {}
    }
    bezig = false; teken();
    volgende();
  }
  async function volgende() {
    if (!pot) return;
    if (pot.st.fase === 'klaar') { await wacht(500); return einde(); }
    if (aiAanZet()) {
      await wacht(pot.st.fase === 'duel' ? 350 : 700);
      if (!pot || !aiAanZet()) return;
      const a = AI.kies(M, pot.st, pot.ai, Math.random);
      return voerUit(a);
    }
  }

  // ── het duel ─────────────────────────────────────────────────────────────────
  async function toonDuel(d, ev) {
    const st = pot.st, A = st.beesten[d.aanvaller], D = st.beesten[d.verdediger];
    const kant = (el, b) => {
      el.className = 'duel-kant ' + b.kant;
      el.querySelector('.wie').textContent = `${naam(b.id)} (${b.kant})`;
      el.querySelector('.duel-fig').className = 'duel-fig';
      el.querySelector('.duel-fig').innerHTML = R.beeldHtml(b.id, naam(b.id));
      return R.tekenWiel(el.querySelector('svg'), M.VINYLS[b.id], TOT);
    };
    const wa = kant($('duel-a'), A), wd = kant($('duel-d'), D);
    $('duel-uitslag').innerHTML = ''; $('duel-verder').style.display = 'none';
    $('duel').classList.add('aan');
    await wacht(250);
    R.draaiNaar(wa, d.segA, Math.round(2000 * TEMPO), 4); R.draaiNaar(wd, d.segD, Math.round(2400 * TEMPO), 5);
    await wacht(2500);
    const sa = M.VINYLS[A.id].wheel[d.segA], sd = M.VINYLS[D.id].wheel[d.segD];
    const figA = $('duel-a').querySelector('.duel-fig'), figD = $('duel-d').querySelector('.duel-fig');
    const beat = (f, klas, kb) => { f.style.setProperty('--kb', kb); f.classList.remove(klas); void f.offsetWidth; f.classList.add(klas); };
    const label = (s, p) => s.color === 'DODGE' ? `Ontwijk${s.label ? ' (' + s.label + ')' : ''}` : s.color === 'MISS' ? 'Mis'
      : s.color === 'PURPLE' ? `${s.label || 'Paars'} ${'★'.repeat(s.stars)} ${R.effectTekst(s.effect)}` : `${s.label || ''} ${p}`;
    let tekst = `<div>${label(sa, d.krachtA)} <b>⚔</b> ${label(sd, d.krachtD)}</div>`;
    if (!d.winnaar) { beat(figA, 'uitval', 1); beat(figD, 'uitval', -1); tekst += '<div>Gelijk — er gebeurt niets</div>'; }
    else {
      const [wF, lF, wS] = d.winnaar === 'a' ? [figA, figD, sa] : [figD, figA, sd];
      const kb = d.winnaar === 'a' ? 1 : -1;
      if (wS.color === 'DODGE') { beat(wF, 'ontwijk', kb); tekst += `<div>${naam((d.winnaar === 'a' ? A : D).id)} ontwijkt</div>`; }
      else if (wS.color === 'PURPLE') { beat(wF, 'vloek', kb); setTimeout(() => beat(lF, 'geraakt', kb), 350); }
      else { beat(wF, 'uitval', kb); setTimeout(() => beat(lF, 'valt', kb), 250); }
    }
    for (const e of ev) {
      const n = e.uid ? naam(st.beesten[e.uid].id) : '';
      if (e.soort === 'ko') tekst += `<div class="ko">${n} is knock-out!</div>`;
      if (e.soort === 'herboren') tekst += `<div>${n} herrijst uit de as — terug naar de bank</div>`;
      if (e.soort === 'push') tekst += `<div>${n} wordt weggeduwd</div>`;
      if (e.soort === 'geenPush') tekst += `<div>${n} staat klem en blijft staan</div>`;
      if (e.soort === 'wissel') tekst += `<div>Ze wisselen van plek</div>`;
      if (e.soort === 'wacht') tekst += `<div>${n} moet ${e.n} beurt wachten</div>`;
      if (e.soort === 'pin') tekst += `<div>${n} is vastgepind: volgende beurt niet lopen</div>`;
      if (e.soort === 'terug') tekst += `<div>${n} gaat terug naar de bank</div>`;
      if (e.soort === 'entrylock') tekst += `<div>Een entry van ${e.kant} is een ronde dicht</div>`;
      if (e.soort === 'immuun') tekst += `<div>${n} is onverzettelijk</div>`;
    }
    $('duel-uitslag').innerHTML = tekst;
    await wacht(700);
    $('duel-verder').style.display = '';
    await new Promise(r => { $('duel-verder').onclick = r; if (aiAanZet() && pot.ai && pot.st.aanZet === 'blauw') setTimeout(r, Math.round(2600 * TEMPO)); });
    $('duel').classList.remove('aan');
  }

  // ── einde van het potje ──────────────────────────────────────────────────────
  function einde() {
    const st = pot.st, w = st.winnaar;
    const solo = !!pot.ai, jijWint = w === 'rood';
    $('uitslag-titel').textContent = !w ? 'GELIJKSPEL' : solo ? (jijWint ? 'OVERWINNING' : 'VERSLAGEN') : (w === 'rood' ? 'ROOD WINT' : 'BLAUW WINT');
    $('uitslag-reden').textContent = !w ? `Na ${st.beurt} beurten is er geen winnaar.` : `${w === 'rood' ? 'Rood' : 'Blauw'} zette een beest op het doel van de ander.`;
    let extra = `<p class="uitleg">Zaad ${pot.zaad} — speel dit potje na met <b>?seed=${pot.zaad}</b></p>`;
    let verder = null, terugNaar = toonMenu, terugTekst = 'Terug naar het menu';
    if (solo) { if (!w) P.stats.gelijk++; else if (jijWint) P.stats.gewonnen++; else P.stats.verloren++; }
    if (pot.soort === 'campagne') {
      const { h, g } = pot.ctx;
      if (jijWint) {
        const r = V.campagneWinst(P, h, g);
        if (r.beest) extra = `<div class="beeld" style="height:90px">${R.beeldHtml(r.beest, naam(r.beest))}</div><p><b>${naam(r.beest)}</b> sluit zich aan bij je stal!</p>` + extra;
        else if (r.hoofdstukKlaar) extra = `<p>Hoofdstuk ${h + 1} voltooid.</p>` + extra;
      }
      let vh = h, vg = g + (jijWint ? 1 : 0); if (vg >= V.GEVECHTEN) { vh++; vg = 0; }
      if (vh < V.CAMPAGNE.length && V.campagneOpen(P.campagne, vh, vg)) verder = { tekst: jijWint ? 'Volgend gevecht' : 'Opnieuw proberen', doe: () => toonVooraf(vh, vg) };
      terugNaar = () => { tekenCampagne(); toon('campagne'); }; terugTekst = 'Naar de campagne';
    } else if (pot.soort === 'ladder') {
      if (w) {
        const r = V.ladderNaUitslag(P.ladder, jijWint); P.ladder = r.ladder;
        extra = `<p>${jijWint ? '★ Ster erbij' : 'Ster eraf'} — nu ${V.ladderNaam(P.ladder.plek)}</p>` +
          (r.promotie ? `<p style="color:var(--gold)"><b>Promotie!</b></p>` : '') +
          (r.nieuweTitel ? `<p>Nieuwe titel: <b>${r.nieuweTitel}</b></p>` : '') + extra;
      }
      verder = { tekst: 'Nog een potje', doe: speelLadder };
      terugNaar = () => { tekenLadder(); toon('ladder'); }; terugTekst = 'Naar de ladder';
    } else if (pot.soort === 'vrij') verder = { tekst: 'Nog een potje', doe: () => startPotje({ ...pot, zaad: null, blauw: willekeurig(ALLE, 6) }) };
    else if (pot.soort === 'hotseat') verder = { tekst: 'Nog een potje', doe: () => startPotje({ ...pot, zaad: null }) };
    bewaar();
    $('uitslag-extra').innerHTML = extra;
    const kv = $('uitslag-verder');
    kv.style.display = verder ? '' : 'none'; if (verder) { kv.textContent = verder.tekst; kv.onclick = () => { $('uitslag').classList.remove('aan'); verder.doe(); }; }
    $('uitslag-terug').textContent = terugTekst;
    $('uitslag-terug').onclick = () => { $('uitslag').classList.remove('aan'); pot = null; terugNaar(); };
    $('uitslag').classList.add('aan');
  }

  // ── campagne ─────────────────────────────────────────────────────────────────
  function tekenCampagne() {
    const lijst = $('camp-lijst'); lijst.innerHTML = '';
    V.CAMPAGNE.forEach((id, h) => {
      const gedaan = P.campagne[id] || 0, open = V.campagneOpen(P.campagne, h, 0);
      const d = document.createElement('div');
      d.className = 'camp-kaart' + (open ? '' : ' dicht') + (gedaan >= V.GEVECHTEN ? ' klaar' : '');
      const bollen = [0, 1, 2].map(g => `<button class="camp-bol ${g < gedaan ? 'gewonnen' : V.campagneOpen(P.campagne, h, g) ? 'open' : ''}" data-g="${g}">${g === 2 ? '♛' : g + 1}</button>`).join('');
      d.innerHTML = `<div class="beeld">${R.beeldHtml(id, naam(id))}</div><div><div class="camp-nr">Hoofdstuk ${h + 1}</div>
        <div class="camp-naam">${naam(id)}</div><div class="uitleg" style="margin:2px 0">${!open ? 'Speel eerst het vorige hoofdstuk uit' : P.stal.includes(id) ? 'Al in je stal' : 'Uitspelen: ' + naam(id) + ' sluit zich aan'}</div>
        <div class="camp-bollen">${bollen}</div></div>`;
      for (const b of d.querySelectorAll('.camp-bol')) b.onclick = () => {
        const g = +b.dataset.g;
        if (!V.campagneOpen(P.campagne, h, g)) { melding('Win eerst het gevecht ervoor'); return; }
        toonVooraf(h, g);
      };
      lijst.appendChild(d);
    });
  }
  function toonVooraf(h, g) {
    const t = V.campagneGevecht(h, g, ALLE);
    $('vooraf-titel').textContent = `${naam(t.kern)} — ${t.baas ? 'baasgevecht' : 'gevecht ' + (g + 1)}`;
    $('vooraf-sub').textContent = `De computer speelt ${t.niveau}. Dit is z'n team:`;
    $('vooraf-team').innerHTML = t.team.map(id => kaart(id, '')).join('');
    $('vooraf-start').onclick = () => { $('vooraf').classList.remove('aan');
      kiesTeam({ titel: 'KIES JE TEAM', pool: P.stal, uitleg: `Tegen ${naam(t.kern)}.`, terug: () => { tekenCampagne(); toon('campagne'); },
        dan: team => startPotje({ rood: team, blauw: t.team, ai: t.niveau, soort: 'campagne', ctx: { h, g }, zaad: t.zaad }) }); };
    $('vooraf-terug').onclick = () => $('vooraf').classList.remove('aan');
    $('vooraf').classList.add('aan');
  }

  // ── ladder ───────────────────────────────────────────────────────────────────
  const RANG_KLEUR = ['#b45309', '#94a3b8', '#eab308', '#22d3ee', '#c026d3'];
  function tekenLadder() {
    const l = P.ladder, r = V.rang(l.plek);
    $('ladder-schild').setAttribute('fill', RANG_KLEUR[r]); $('ladder-schild').setAttribute('stroke', '#F3E6C8');
    $('ladder-naam').textContent = V.ladderNaam(l.plek);
    $('ladder-sterren').innerHTML = l.plek >= V.TOP ? `<span class="aan">★</span> ×${l.sterren}`
      : [0, 1, 2].map(i => `<span class="${i < l.sterren ? 'aan' : 'uit'}">★</span>`).join('');
    $('ladder-doel').textContent = `Titel: ${V.TITELS[V.rang(l.hoogste || 0)]}` + (l.plek < V.TOP ? ` · volgende rang: ${V.RANGEN[Math.min(4, r + 1)]}` : '');
    $('ladder-trap').innerHTML = V.RANGEN.map((n, i) => `<div class="trede${i === r ? ' nu' : ''}${i < r ? ' gehaald' : ''}"><span class="stip" style="background:${RANG_KLEUR[i]};border-radius:50%"></span>${n}</div>`).reverse().join('');
  }
  function speelLadder() {
    const t = V.ladderTegenstander(P.ladder.plek, ALLE, Math.floor(Math.random() * 1e9));
    kiesTeam({ titel: 'KIES JE TEAM', pool: P.stal, uitleg: `Ladder — ${V.ladderNaam(P.ladder.plek)}.`, terug: () => { tekenLadder(); toon('ladder'); },
      dan: team => startPotje({ rood: team, blauw: t.team, ai: t.niveau, soort: 'ladder' }) });
  }
  $('ladder-zoek').onclick = speelLadder;

  // Voor tests en foutzoeken: de toestand van buitenaf te lezen
  window.__schijfduel = { get pot() { return pot; }, get P() { return P; }, get bezig() { return bezig; }, M, V, startPotje, voerUit };
  // Offline spelen: dezelfde cache als de hoofdpagina (sw.js staat in de root)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('../../sw.js', { scope: '../../' }).catch(() => {});
  toonMenu();
})();

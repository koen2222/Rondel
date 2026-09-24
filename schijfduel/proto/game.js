/* SCHIJFDUEL — regelmotor
 *
 * Puur: geen scherm, geen geluid, geen tijd. Dezelfde code draait in de
 * browser en in Node (test/schijfduel.test.js). Bron van waarheid is
 * schijfduel/SCHIJFDUEL_CLAUDE_HANDOFF.md, met board.json en vinyls.json.
 *
 * Een potje is een toestand plus een lijst acties. `acties(st)` zegt wat er
 * mag, `doe(st, actie)` voert één actie uit en geeft terug wat er gebeurde.
 * Omdat elke zet een klein bericht is, kan hetzelfde later over een netwerk.
 */
(function (root) {
  'use strict';

  // ── willekeur met zaad: ?seed= geeft precies hetzelfde potje ────────────────
  function maakRng(zaad) {
    let t = (zaad >>> 0) || 1;
    return function () {
      t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const KANTEN = ['rood', 'blauw'];
  const ander = k => (k === 'rood' ? 'blauw' : 'rood');
  const MAX_BEURTEN = 200;          // vangnet van het proto: daarna gelijkspel

  function maakMotor(board, vinylData) {
    // ── bord ──────────────────────────────────────────────────────────────────
    const KNOPEN = {};
    for (const n of board.nodes) KNOPEN[n.id] = n;
    const BUREN = {};
    for (const id in KNOPEN) BUREN[id] = [];
    for (const [a, b] of board.edges) { BUREN[a].push(b); BUREN[b].push(a); }
    // Rood start zuid, blauw start noord (handoff §2).
    const kantVan = { red: 'rood', blue: 'blauw' };
    const DOEL = {}, ENTRIES = { rood: [], blauw: [] };
    for (const n of board.nodes) {
      const k = kantVan[n.owner];
      if (n.role === 'goal') DOEL[k] = n.id;
      if (n.role === 'entry') ENTRIES[k].push(n.id);
    }
    const VINYLS = {};
    for (const v of vinylData.vinyls) VINYLS[v.id] = v;
    const TIK_TOTAAL = vinylData.tickTotal || 24;

    // Afstand in stappen over de edges (bezetting telt niet mee)
    const AFSTAND = {};
    for (const s in KNOPEN) {
      const d = { [s]: 0 }, q = [s];
      while (q.length) { const n = q.shift(); for (const m of BUREN[n]) if (d[m] === undefined) { d[m] = d[n] + 1; q.push(m); } }
      AFSTAND[s] = d;
    }

    // ── toestand ──────────────────────────────────────────────────────────────
    function nieuwPotje(opts) {
      const st = {
        zaad: opts.seed >>> 0 || 1, rngStap: 0,
        beurt: 1, aanZet: opts.start || 'rood', start: opts.start || 'rood',
        fase: 'actie',            // 'actie' → 'duel' → (einde) ; 'klaar' als het voorbij is
        beesten: {}, bank: { rood: [], blauw: [] }, wachtplaats: { rood: [], blauw: [] },
        entryLock: { rood: null, blauw: null },   // { knoop, tot: beurtnummer }
        actief: null,             // uid van het beest dat deze beurt handelde
        winnaar: null, reden: null, log: [],
      };
      for (const kant of KANTEN) {
        let n = 0;                                   // r1..r6 en b1..b6
        for (const id of opts.teams[kant]) {
          if (!VINYLS[id]) throw new Error('Onbekend beest: ' + id);
          const uid = kant[0] + (++n);
          st.beesten[uid] = { uid, id, kant, knoop: null, wacht: 0, rust: false, pin: false, pinNu: false,
                              timer: 0, herboren: false };
          st.bank[kant].push(uid);
        }
      }
      startBeurt(st, []);
      return st;
    }
    function rng(st) {
      // Steeds opnieuw afgeleid van zaad + stap, zodat een toestand die als JSON
      // bewaard en teruggelezen wordt precies zo verder draait.
      const r = maakRng(st.zaad + 7919 * (++st.rngStap))();
      return r;
    }
    const beestOp = (st, knoop) => Object.values(st.beesten).find(b => b.knoop === knoop) || null;
    const opVeld = (st, kant) => Object.values(st.beesten).filter(b => b.knoop && (!kant || b.kant === kant));

    // ── MP en lopen ───────────────────────────────────────────────────────────
    function mp(st, b) {
      if (b.pinNu) return 0;                         // PIN: deze beurt MP 0
      let m = VINYLS[b.id].mp;
      if (st.beurt === 1 && b.kant === st.start) m -= 1;   // startspeler beurt 1: MP −1
      return Math.max(0, m);
    }
    const doorVrienden = b => !!(VINYLS[b.id].passive && VINYLS[b.id].passive.moveThroughAllies);
    // Alle knopen waar dit beest vanaf `van` binnen `budget` stappen kan eindigen.
    // Niet door bezette knopen (behalve Witte Wieven door vrienden), eindigen op leeg.
    function bereik(st, b, van, budget) {
      const uit = new Set(), gezien = { [van]: 0 }, q = [[van, 0]];
      while (q.length) {
        const [n, d] = q.shift();
        if (d >= budget) continue;
        for (const m of BUREN[n]) {
          if (gezien[m] !== undefined) continue;
          const o = beestOp(st, m);
          if (o && o !== b && !(doorVrienden(b) && o.kant === b.kant)) continue;
          gezien[m] = d + 1;
          if (!o || o === b) uit.add(m);
          q.push([m, d + 1]);
        }
      }
      uit.delete(van);
      return uit;
    }
    function vrijeEntries(st, kant) {
      const lock = st.entryLock[kant];
      return ENTRIES[kant].filter(e => !beestOp(st, e) && !(lock && lock.knoop === e));
    }

    // ── wat mag er? ───────────────────────────────────────────────────────────
    function acties(st) {
      if (st.fase === 'klaar') return [];
      const kant = st.aanZet, uit = [];
      if (st.fase === 'actie') {
        // Inzetten: bank → eigen vrije entry, daarna eventueel doorlopen
        for (const uid of st.bank[kant]) {
          const b = st.beesten[uid];
          for (const e of vrijeEntries(st, kant)) {
            uit.push({ soort: 'inzet', uid, entry: e, naar: e });
            const tijdelijk = { ...b, knoop: e };
            for (const n of bereik({ ...st, beesten: { ...st.beesten, [uid]: tijdelijk } }, tijdelijk, e, mp(st, b)))
              uit.push({ soort: 'inzet', uid, entry: e, naar: n });
          }
        }
        // Lopen met een beest dat al staat
        for (const b of opVeld(st, kant)) {
          if (b.rust) continue;
          for (const n of bereik(st, b, b.knoop, mp(st, b))) uit.push({ soort: 'loop', uid: b.uid, naar: n });
          uit.push({ soort: 'blijf', uid: b.uid });           // niet lopen, wel mogen duelleren
        }
        uit.push({ soort: 'pas' });
      } else if (st.fase === 'duel') {
        const b = st.beesten[st.actief];
        if (b && b.knoop && !b.rust)
          for (const n of BUREN[b.knoop]) { const o = beestOp(st, n); if (o && o.kant !== kant) uit.push({ soort: 'duel', doel: o.uid }); }
        uit.push({ soort: 'geenDuel' });
      }
      return uit;
    }
    // Dedupliceer inzet-acties die op dezelfde knoop uitkomen (via welke entry
    // maakt voor het eindresultaat niet uit) — handig voor de AI en het scherm.
    function unieke(actieLijst) {
      const zag = new Set();
      return actieLijst.filter(a => { const k = a.soort + '|' + (a.uid || '') + '|' + (a.naar || a.doel || '');
        if (zag.has(k)) return false; zag.add(k); return true; });
    }

    // ── de schijf ─────────────────────────────────────────────────────────────
    function trek(st, wiel) {
      let t = Math.floor(rng(st) * TIK_TOTAAL);
      for (let i = 0; i < wiel.length; i++) { if (t < wiel[i].ticks) return i; t -= wiel[i].ticks; }
      return wiel.length - 1;
    }
    function kracht(st, b, seg) {
      let p = seg.power || 0;
      const pas = VINYLS[b.id].passive;
      if (seg.color === 'WHITE' && pas && pas.whiteBonusOnAxis && pas.axisNodes.includes(b.knoop)) p += pas.whiteBonusOnAxis;
      return p;
    }
    // Wie wint? 'a', 'd' of null. Handoff §5, letterlijk:
    //   DODGE wint van alles; twee DODGE = niets.
    //   MISS verliest van alles behalve MISS.
    //   GOLD wint van PURPLE. PURPLE wint van WHITE. PURPLE vs PURPLE: sterren.
    //   WHITE/GOLD onderling: hoogste schade. Gelijk = niets.
    function beslis(a, d, pa, pd) {
      const A = a.color, D = d.color;
      if (A === 'DODGE' && D === 'DODGE') return null;
      if (A === 'DODGE') return 'a';
      if (D === 'DODGE') return 'd';
      if (A === 'MISS' && D === 'MISS') return null;
      if (A === 'MISS') return 'd';
      if (D === 'MISS') return 'a';
      if (A === 'PURPLE' && D === 'PURPLE') return (a.stars || 0) === (d.stars || 0) ? null : ((a.stars || 0) > (d.stars || 0) ? 'a' : 'd');
      if (A === 'GOLD' && D === 'PURPLE') return 'a';
      if (D === 'GOLD' && A === 'PURPLE') return 'd';
      if (A === 'PURPLE' && D === 'WHITE') return 'a';
      if (D === 'PURPLE' && A === 'WHITE') return 'd';
      // WHITE/GOLD onderling
      return pa === pd ? null : (pa > pd ? 'a' : 'd');
    }

    // ── gevolgen ──────────────────────────────────────────────────────────────
    function naarWachtplaats(st, b, ev) {
      const pas = VINYLS[b.id].passive || {};
      const knoop = b.knoop;
      b.knoop = null; b.wacht = 0; b.rust = false; b.pin = false; b.pinNu = false;
      if (pas.firstKoToBank && !b.herboren) {        // Phoenix: eerste KO → bank
        b.herboren = true; st.bank[b.kant].push(b.uid);
        ev.push({ soort: 'herboren', uid: b.uid, van: knoop }); return;
      }
      b.timer = 2 + (pas.waitBonus || 0);            // één volle eigen beurt (+1 Draugr)
      st.wachtplaats[b.kant].push(b.uid);
      ev.push({ soort: 'ko', uid: b.uid, van: knoop });
    }
    const immuun = (b, effect) => { const p = VINYLS[b.id].passive; return !!(p && p.immune && p.immune.includes(effect)); };
    function pasEffectToe(st, winnaar, verliezer, effect, ev) {
      if (!effect) return;
      const [naam, arg] = effect.split(':');
      if (immuun(verliezer, naam)) { ev.push({ soort: 'immuun', uid: verliezer.uid, effect: naam }); return; }
      if (naam === 'KO') return naarWachtplaats(st, verliezer, ev);
      if (naam === 'WAIT') { verliezer.wacht = Math.max(verliezer.wacht, +arg || 1); ev.push({ soort: 'wacht', uid: verliezer.uid, n: +arg || 1 }); return; }
      if (naam === 'PIN') { verliezer.pin = true; ev.push({ soort: 'pin', uid: verliezer.uid }); return; }
      if (naam === 'RETURN') { const van = verliezer.knoop; verliezer.knoop = null; verliezer.wacht = 0; st.bank[verliezer.kant].push(verliezer.uid); ev.push({ soort: 'terug', uid: verliezer.uid, van }); return; }
      if (naam === 'SWAP') { const t = winnaar.knoop; winnaar.knoop = verliezer.knoop; verliezer.knoop = t; ev.push({ soort: 'wissel', a: winnaar.uid, b: verliezer.uid }); return; }
      if (naam === 'PUSH') {
        // Eén knoop van de winnaar af, langs een edge, naar een lege knoop. Anders niets.
        const opties = BUREN[verliezer.knoop].filter(n => !beestOp(st, n) &&
          AFSTAND[winnaar.knoop][n] > AFSTAND[winnaar.knoop][verliezer.knoop]);
        if (!opties.length) { ev.push({ soort: 'geenPush', uid: verliezer.uid }); return; }
        opties.sort((x, y) => AFSTAND[winnaar.knoop][y] - AFSTAND[winnaar.knoop][x] || (x < y ? -1 : 1));
        const van = verliezer.knoop; verliezer.knoop = opties[0];
        ev.push({ soort: 'push', uid: verliezer.uid, van, naar: opties[0] }); return;
      }
      if (naam === 'ENTRYLOCK') {
        // Eén vijandelijke entry telt een ronde als bezet: de vrije entry het
        // dichtst bij het getroffen beest.
        const kant = verliezer.kant;
        const vrij = ENTRIES[kant].filter(e => !beestOp(st, e));
        if (!vrij.length) return;
        vrij.sort((x, y) => AFSTAND[verliezer.knoop][x] - AFSTAND[verliezer.knoop][y]);
        // "één ronde": tot en met de eerstvolgende beurt van de getroffen kant
        st.entryLock[kant] = { knoop: vrij[0], tot: st.beurt + (st.aanZet === kant ? 3 : 2) };
        ev.push({ soort: 'entrylock', kant, knoop: vrij[0] }); return;
      }
    }
    // Insluiten: alle buren vijandelijk bezet en degree ≥ 2 → directe KO.
    function insluiten(st, ev) {
      for (const kantEerst of [ander(st.aanZet), st.aanZet]) {     // eerst de tegenstander
        for (const b of opVeld(st, kantEerst)) {
          const bu = BUREN[b.knoop];
          if (bu.length < 2) continue;
          if (bu.every(n => { const o = beestOp(st, n); return o && o.kant !== b.kant; })) {
            ev.push({ soort: 'ingesloten', uid: b.uid, knoop: b.knoop });
            naarWachtplaats(st, b, ev);
          }
        }
      }
    }

    // ── beurtwissel ───────────────────────────────────────────────────────────
    function startBeurt(st, ev) {
      const kant = st.aanZet;
      // Wachtplaats: timer −1, op 0 terug naar de bank
      for (const uid of [...st.wachtplaats[kant]]) {
        const b = st.beesten[uid];
        if (--b.timer <= 0) {
          st.wachtplaats[kant] = st.wachtplaats[kant].filter(u => u !== uid);
          st.bank[kant].push(uid); ev.push({ soort: 'naarBank', uid });
        }
      }
      for (const b of opVeld(st, kant)) {
        b.rust = b.wacht > 0; if (b.wacht > 0) b.wacht--;      // WAIT: deze beurt niets
        b.pinNu = b.pin; b.pin = false;                          // PIN: deze beurt MP 0
      }
      const lock = st.entryLock[kant];
      if (lock && st.beurt >= lock.tot) st.entryLock[kant] = null;
      st.fase = 'actie'; st.actief = null;
    }
    function eindeBeurt(st, ev) {
      // Winst: eigen beest op het vijandelijke doel aan het EINDE van je beurt
      const kant = st.aanZet;
      const opDoel = opVeld(st, kant).find(b => b.knoop === DOEL[ander(kant)]);
      if (opDoel) { st.fase = 'klaar'; st.winnaar = kant; st.reden = 'doel'; ev.push({ soort: 'winst', kant, uid: opDoel.uid }); return; }
      if (st.beurt >= MAX_BEURTEN) { st.fase = 'klaar'; st.winnaar = null; st.reden = 'gelijkspel'; ev.push({ soort: 'gelijkspel' }); return; }
      for (const b of opVeld(st, kant)) { b.rust = false; b.pinNu = false; }
      st.aanZet = ander(kant); st.beurt++;
      ev.push({ soort: 'beurt', kant: st.aanZet, beurt: st.beurt });
      startBeurt(st, ev);
    }

    // ── één actie uitvoeren ───────────────────────────────────────────────────
    function doe(st, a) {
      const ev = [];
      const mag = acties(st).some(x => x.soort === a.soort && x.uid === a.uid && x.naar === a.naar &&
        x.doel === a.doel && (a.entry === undefined || x.entry === a.entry));
      if (!mag) throw new Error('Actie mag niet: ' + JSON.stringify(a));
      st.log.push({ beurt: st.beurt, kant: st.aanZet, ...a });
      const kant = st.aanZet;
      if (a.soort === 'inzet') {
        const b = st.beesten[a.uid];
        st.bank[kant] = st.bank[kant].filter(u => u !== a.uid);
        b.knoop = a.naar; st.actief = a.uid;
        ev.push({ soort: 'inzet', uid: a.uid, entry: a.entry, naar: a.naar });
      } else if (a.soort === 'loop') {
        const b = st.beesten[a.uid], van = b.knoop;
        b.knoop = a.naar; st.actief = a.uid;
        ev.push({ soort: 'loop', uid: a.uid, van, naar: a.naar });
      } else if (a.soort === 'blijf') {
        st.actief = a.uid;
      } else if (a.soort === 'pas') {
        insluiten(st, ev); eindeBeurt(st, ev); return ev;
      } else if (a.soort === 'duel') {
        ev.push(...duel(st, st.beesten[st.actief], st.beesten[a.doel]));
        insluiten(st, ev); eindeBeurt(st, ev); return ev;
      } else if (a.soort === 'geenDuel') {
        eindeBeurt(st, ev); return ev;
      }
      insluiten(st, ev);
      // Na de actie: duelleren mag, als er een vijand naast staat
      const b = st.beesten[st.actief];
      if (b && b.knoop && acties({ ...st, fase: 'duel' }).some(x => x.soort === 'duel')) st.fase = 'duel';
      else eindeBeurt(st, ev);
      return ev;
    }
    function duel(st, aanv, verd) {
      const ev = [];
      const wa = VINYLS[aanv.id].wheel, wd = VINYLS[verd.id].wheel;
      const ia = trek(st, wa), id = trek(st, wd);
      const sa = wa[ia], sd = wd[id];
      const pa = kracht(st, aanv, sa), pd = kracht(st, verd, sd);
      const w = beslis(sa, sd, pa, pd);
      ev.push({ soort: 'duel', aanvaller: aanv.uid, verdediger: verd.uid, segA: ia, segD: id, krachtA: pa, krachtD: pd, winnaar: w });
      if (!w) return ev;
      const [win, ver, seg] = w === 'a' ? [aanv, verd, sa] : [verd, aanv, sd];
      if (seg.color === 'WHITE' || seg.color === 'GOLD') pasEffectToe(st, win, ver, 'KO', ev);
      else if (seg.color === 'PURPLE') pasEffectToe(st, win, ver, seg.effect, ev);
      else if (seg.color === 'DODGE' && seg.effect) pasEffectToe(st, ver, win, seg.effect, ev);  // DODGE met WAIT op jezelf
      return ev;
    }

    // ── kansen, voor het scherm en de AI ──────────────────────────────────────
    function kansen(id) { return VINYLS[id].wheel.map(s => s.ticks / TIK_TOTAAL); }
    // Exacte verdeling van een duel: kans dat aanvaller wint / verdediger wint / niets.
    function duelKans(st, aanv, verd) {
      const wa = VINYLS[aanv.id].wheel, wd = VINYLS[verd.id].wheel;
      const uit = { a: 0, d: 0, niets: 0, aKO: 0, dKO: 0 };
      for (const sa of wa) for (const sd of wd) {
        const p = (sa.ticks / TIK_TOTAAL) * (sd.ticks / TIK_TOTAAL);
        const w = beslis(sa, sd, kracht(st, aanv, sa), kracht(st, verd, sd));
        if (!w) { uit.niets += p; continue; }
        uit[w] += p;
        const seg = w === 'a' ? sa : sd;
        if (seg.color === 'WHITE' || seg.color === 'GOLD') uit[w === 'a' ? 'dKO' : 'aKO'] += p;
      }
      return uit;
    }

    return { KNOPEN, BUREN, DOEL, ENTRIES, VINYLS, TIK_TOTAAL, AFSTAND, MAX_BEURTEN,
             nieuwPotje, acties, unieke, doe, beslis, kansen, duelKans, bereik, mp, beestOp, opVeld, ander, kracht };
  }

  const API = { maakMotor, maakRng, KANTEN, ander };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.Schijfduel = API;
})(this);

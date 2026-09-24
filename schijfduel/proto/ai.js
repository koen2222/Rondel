/* SCHIJFDUEL — greedy-AI (handoff §7, v1.1)
 *
 * Kijkt één beurt vooruit: probeert elke toegestane actie op een kopie van de
 * toestand, beoordeelt de stelling die dan ontstaat, en rekent bij een duel met
 * de ECHTE kansen van beide schijven (duelKans), niet met een gok.
 * Sterkte = hoeveel ruis er op die beoordeling zit.
 */
(function (root) {
  'use strict';
  const RUIS = { makkelijk: 45, normaal: 8, moeilijk: 0 };
  const kopie = st => JSON.parse(JSON.stringify(st));

  // Hoe goed staat `kant` ervoor?
  function waarde(M, st, kant) {
    if (st.fase === 'klaar') return st.winnaar === kant ? 1e6 : (st.winnaar ? -1e6 : 0);
    const vijand = M.ander(kant);
    const mijnDoel = M.DOEL[kant], hunDoel = M.DOEL[vijand];
    let w = 0;
    for (const b of Object.values(st.beesten)) {
      const eigen = b.kant === kant, doel = eigen ? hunDoel : mijnDoel;
      const teken = eigen ? 1 : -1;
      if (!b.knoop) { if (st.wachtplaats[b.kant].includes(b.uid)) w -= teken * 10; continue; }
      const d = M.AFSTAND[b.knoop][doel];
      w += teken * (12 + (10 - d) * 4);
      const mp = M.VINYLS[b.id].mp;
      // Kan hij volgende beurt het doel halen? Voor de vijand is dat bijna verlies.
      if (d <= mp && !M.beestOp(st, doel)) w += eigen ? 70 : -420;
      else if (d <= mp + 1) w += eigen ? 15 : -60;
    }
    // Verdedigen loont alleen als er dreiging IS. Zonder die voorwaarde parkeerden
    // beide AI's een beest op hun eigen doel en stond het potje 200 beurten
    // stil (gemeten: 18 van de 40 potjes gelijkspel).
    const dreiging = Object.values(st.beesten).some(b => b.knoop && b.kant === vijand && M.AFSTAND[b.knoop][mijnDoel] <= 3);
    const wachters = [mijnDoel, ...M.BUREN[mijnDoel]].filter(n => { const o = M.beestOp(st, n); return o && o.kant === kant; }).length;
    if (dreiging) w += Math.min(wachters, 2) * 22;
    else { const opDoel = M.beestOp(st, mijnDoel); if (opDoel && opDoel.kant === kant) w -= 25; }
    return w;
  }
  // Wat levert een duel naar verwachting op, voor de aanvaller?
  function duelWaarde(M, st, aanv, verd) {
    const k = M.duelKans(st, aanv, verd);
    // Hoe waardevol is dit beest? Hoe dichter bij het vijandelijke doel, hoe meer.
    // Een vijand die z'n EIGEN doel dichthoudt is een muur: die breken is veel waard.
    const gewicht = b => {
      let g = 40 + (10 - M.AFSTAND[b.knoop][M.DOEL[M.ander(b.kant)]]) * 8;
      if (b !== aanv && M.AFSTAND[b.knoop][M.DOEL[b.kant]] <= 1) g += 45;
      return g;
    };
    return k.dKO * gewicht(verd) - k.aKO * gewicht(aanv) + (k.a - k.dKO) * 10 - (k.d - k.aKO) * 10;
  }

  function kies(M, st, niveau, rand) {
    rand = rand || Math.random;
    const ruis = RUIS[niveau] !== undefined ? RUIS[niveau] : RUIS.normaal;
    const kant = st.aanZet;
    const opties = M.unieke(M.acties(st));
    let beste = null, besteW = -Infinity;
    for (const a of opties) {
      let w;
      if (st.fase === 'duel') {
        // Hoe langer het potje duurt, hoe eerder een twijfelachtig duel de moeite
        // waard is: stilstand is erger dan een gok.
        if (a.soort === 'geenDuel') w = -Math.min(25, st.beurt * 0.25);
        else w = duelWaarde(M, st, st.beesten[st.actief], st.beesten[a.doel]);
      } else {
        const t = kopie(st);
        M.doe(t, a);
        w = waarde(M, t, kant);
        if (t.fase === 'duel') {
          const beste = Math.max(0, ...M.acties(t).filter(x => x.soort === 'duel')
            .map(x => duelWaarde(M, t, t.beesten[t.actief], t.beesten[x.doel])));
          w += beste;
        }
      }
      w += (rand() - 0.5) * ruis;
      if (w > besteW) { besteW = w; beste = a; }
    }
    return beste;
  }

  const API = { kies, waarde, duelWaarde, RUIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SchijfduelAI = API;
})(this);

# Online tegen andere mensen spelen — wat is er nodig?

*Sessie 44. Onderzoek, geen code. Koen koos ervoor dit uit te zoeken en niet te bouwen.*

## Het korte antwoord

Het kan, maar niet binnen het huidige bestand alleen: je hebt **een server** nodig
die tussen de twee spelers in staat. Die hoeft niet zwaar te zijn — Rondel is
beurt-om-beurt, en per zet gaat er maar een handvol bytes heen en weer — maar hij
moet er wél zijn, en hij moet **scheidsrechter** zijn.

Mijn aanbeveling: **begin met "speel tegen een vriend via een code"**, op
**Cloudflare Workers met Durable Objects**. Pas als dat goed loopt: matchmaking
en een ranglijst.

## Waarom een scheidsrechter en niet gewoon "stuur je zet door"

Het draaien van de schijf is een dobbelsteen. Nu gooit elke telefoon z'n eigen
dobbelsteen met `Math.random()`. Online kan dat niet: dan kan een speler zijn
eigen app aanpassen en altijd z'n hoogste vak draaien, en jij ziet het verschil
niet.

Pokémon Duel loste dat op zoals elk serieus online spel: **de server draait**.
Jouw telefoon zegt "ik val aan met Odin op dat punt", de server controleert of
die zet mag, draait beide schijven, beslist de uitkomst en stuurt die naar
allebei. De telefoons laten alleen zien wat de server besliste.

Daar hoort één aanpassing aan de spelcode bij die we nu al kunnen voorbereiden:
de regels (`resolve`, `legalMoves`, `applyCondition`, de paarse effecten, de mega)
moeten los van het scherm kunnen draaien. Dat is voor een groot deel al zo — de
headless-tests trekken ze nu al los uit `index.html` en draaien ze zonder browser.

## De drie mogelijke opzetten

| | wat het is | voor | tegen |
|---|---|---|---|
| **A. Eigen server met WebSockets** (Node, bv. Colyseus) | een programma dat 24/7 draait op een VPS | volledige controle | je beheert zelf een server: updates, beveiliging, uitval |
| **B. Serverless met Durable Objects** (Cloudflare) | per potje één klein "object" dat de wedstrijd bijhoudt en scheidsrechter is | geen server om te beheren, schaalt vanzelf, WebSockets ingebouwd, goedkoop bij weinig spelers | nieuwe techniek om te leren; alleen Cloudflare |
| **C. Peer-to-peer** (WebRTC) | de twee telefoons praten rechtstreeks | bijna geen server nodig | **geen scheidsrechter** — valsspelen is niet te voorkomen. Alleen geschikt tussen vrienden die elkaar vertrouwen |

**Aanbeveling: B.** Eén Durable Object per potje is precies de vorm van dit spel:
twee spelers, één bord, één scheidsrechter, en na afloop verdwijnt hij weer.

Een hosted database (Firebase, Supabase) kan ook, maar daar zit de spellogica
niet vanzelf op de server — je krijgt een gedeelde lade waar beide telefoons in
schrijven. Voor een beurtspel met een dobbelsteen is dat de verkeerde vorm.

## Wat er gebouwd moet worden, in volgorde

1. **Regels los van het scherm.** Eén bestand `regels.js` met alles wat een zet
   beslist, dat zowel de app als de server laadt. Groot deel is er al.
2. **Zetten als berichten.** Elke handeling wordt een klein bericht:
   `{ soort:'beweeg', figuur:'u7', naar:'IT2' }`. De hotseat-modus werkt al met
   om-en-om beurten; dat is de naad waar dit tussen komt.
3. **De server-scheidsrechter.** Controleert, draait, beslist, stuurt door.
4. **Vriendenpotje via een code.** Speler A maakt een potje en krijgt een code van
   zes letters, speler B tikt hem in. Geen accounts nodig.
5. **Wegvallen en terugkomen.** Telefoon op slot of tunnel in: na terugkomen moet
   de stand weer kloppen. De schaakklok die er al is, beslist wie er verliest als
   iemand te lang wegblijft.
6. **Pas daarna:** accounts, matchmaking (willekeurige tegenstander), een ranglijst
   zoals de Liga in Duel.

## Wat het kost

Bij een handvol spelers is het vrijwel gratis: Cloudflare heeft een gratis laag,
en het betaalde Workers-abonnement begint rond de vijf dollar per maand met ruime
limieten. Een beurtspel verbruikt heel weinig. **Controleer de actuele prijzen op
de site van Cloudflare voordat je iets afsluit** — die veranderen, en dit document
is geen offerte.

De echte kosten zitten niet in de server maar in de tijd: stap 1 t/m 5 is
grofweg net zoveel werk als alles wat er sinds sessie 40 gebouwd is.

## Wat er niet in zit

- Een app-store-versie (iOS/Android). Het is en blijft een webapp (PWA); online
  spelen verandert daar niets aan.
- Chat tussen spelers. Bewust niet: dan moet je ook gaan modereren.
- Echt geld voor diamantjes. Juridisch een ander verhaal (betalingen, leeftijden).

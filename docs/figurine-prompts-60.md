# Prompts voor 42 nieuwe figuren — naar 60 in totaal

Je hebt er nu **18** (zes ketens van drie). Dit document levert **42 nieuwe**, in
**14 nieuwe ketens van drie**, samen dus **60**.

Elke keten is één factie met een eigen niche en een eigen kleurenpalet, zodat je
ze op een bord van 48 bij 66 pixels nog uit elkaar houdt. Binnen een keten moet
je zien dat het dezelfde soort is die groeit: stap 1 klein en simpel, stap 2
volgroeid, stap 3 de ontzagwekkende eindvorm.

> **Let op — de oude prompt klopte niet.** In `figurine-prompts.md` staat een
> master-prompt die om *chibi*-verhoudingen vraagt (groot hoofd, klein lijf).
> Je bestaande achttien figuren zijn dat helemaal niet: het zijn semi-realistische
> geschilderde miniaturen met normale verhoudingen. Gebruik voor nieuw werk dus
> de master-prompt hieronder, niet die oude.

## Werkwijze

1. Open een nieuw gesprek in Gemini.
2. **Sleep drie bestaande figuren mee als referentie**: `art/commander.png`
   (Odin, mens), `art/hellhound.png` (Cerberus, beest) en `art/wyrmling.png`
   (Quetzalcoatl, slang). Dat is veruit de betrouwbaarste manier om de stijl te
   pakken — beter dan welke beschrijving ook.
3. Plak de **MASTER-PROMPT**.
4. Plak per keten eerst het **ketenblok**, daarna de drie **figuurblokken**.
5. Sla op als PNG met de bestandsnaam uit het kopje, in `art/`.

Lukt een transparante achtergrond niet? Vraag dan een **egaal witte** achtergrond
en draai `python3 tools/cutout.py art-nieuw/*.png -o art/`. Dat script snijdt
het figuur eruit zonder het witte binnenin (botten, tanden, gewaden) te slopen.

---

## MASTER-PROMPT (eerst plakken, met de drie referentiebeelden erbij)

```
Ik maak figuren voor een fantasy-bordspel. De drie bijgevoegde beelden zijn de
bestaande figuren; jouw werk moet er exact bij passen alsof het uit dezelfde set
komt. De stijl is belangrijker dan hoe mooi één los figuur is, want ze staan
straks naast elkaar op hetzelfde bord.

STIJL — hou je hier strikt aan:
Een semi-realistische, met de hand geschilderde illustratie van een
verzamelfiguur, zoals de artwork op de kaarten van een tactisch bordspel. GEEN
chibi, GEEN cartoon, GEEN cel-shading, GEEN 3D-render, GEEN pixelart. Normale
anatomische verhoudingen, licht heroisch gedrongen. Zachte geairbrushte
schaduwen met warme highlights, rijke geschilderde texturen in stof, vacht,
leer en metaal. Verzadigde maar aardse kleuren. Duidelijke, gesloten omtrek.

ONDERWERP:
Goden, helden, geesten en beesten uit ECHTE mythologie en folklore — publiek
domein. Gebruik geen personages uit films, boeken, games of strips, en ook geen
ontwerpen die daarop lijken.

CAMERA:
Volledig figuur, driekwart aanzicht, ooghoogte tot licht van boven. Het figuur
staat of zweeft rechtop en vult het beeld verticaal.

COMPOSITIE — hier mag je niet van afwijken:
- Vierkant beeld, minimaal 1024x1024.
- Volledig TRANSPARANTE achtergrond. Geen wit vlak, geen geruit patroon, geen
  kleur, geen decor, geen omgeving.
- Geen sokkel, geen voetplaat, geen grond, geen slagschaduw, geen reflectie.
- Geen tekst, geen logo, geen kader, geen watermerk.
- Het figuur staat gecentreerd met een kleine marge rondom.

LICHT:
Zacht warm hoofdlicht van linksboven, koelere opvullichting rechtsonder, en een
dunne randlichtlijn langs de bovenkant zodat het figuur loskomt van de
achtergrond.

MAAT WAAROP HET GETOOND WORDT:
In het spel is het figuur ongeveer 48 bij 66 pixels. Houd het SILHOUET daarom
groot en herkenbaar: één duidelijke hoofdvorm, een kenmerkend attribuut dat ver
uitsteekt (hoorns, staf, vleugels, staart), en veel contrast tussen de delen.
Vermijd fijne details die op dat formaat toch verdwijnen.

Zeg "klaar" en wacht op mijn eerste opdracht.
```

---

## De 14 nieuwe ketens

Per keten: eerst het **ketenblok** (dat zet de factie neer), daarna de drie
figuren. Stap 1 is de basisvorm die je opstelt, stap 2 en 3 zijn evoluties.

---

### KETEN 1 — Zeediepte
*Palet: diep turkoois, parelwit, koraalrood. Niche: de oceaan.*

```
KETEN: Zeediepte — wezens uit de diepzee.
Gedeeld palet: diep turkoois en zeegroen, parelwit, accenten in koraalrood.
Gedeelde kenmerken: natte glans op de huid, vinnen en zwemvliezen, schelpen en
koraal als sieraad, slierten wier. Elke volgende vorm is groter en dieper uit
zee: van kust naar afgrond.
Dit zijn de eerste drie figuren. Ik vraag ze een voor een.
```

**Sirene** · `art/siren.png` — *stap 1, basisvorm*
```
Maak "Sirene" in de vastgelegde stijl, keten Zeediepte.
Een verleidelijke zeegeest: half vrouw, half vogel volgens de Griekse mythe.
Bleke huid met een parelmoerglans, verenmantel in turkoois en zeegroen, klauwen
in plaats van voeten, een schelphoorn in de hand, haar dat beweegt alsof het
onder water hangt. Slank en licht — dit is de kleinste van haar keten.
```

**Hydra** · `art/hydra.png` — *stap 2*
```
Maak "Hydra" in de vastgelegde stijl, keten Zeediepte.
Het veelkoppige moerasmonster uit de Griekse mythe. Vijf slangenkoppen op lange
halzen die uit één gedrongen reptiellijf komen, schubben in donker zeegroen met
turkooizen glans, druipend gif aan de tanden, één afgehakte hals waar twee nieuwe
koppen uit groeien. Breed en laag silhouet.
```

**Poseidon** · `art/poseidon.png` — *stap 3, eindvorm*
```
Maak "Poseidon" in de vastgelegde stijl, keten Zeediepte.
De Griekse god van de zee. Machtige gestalte met golvende witte baard en haar,
kroon van koraal, drietand van gepatineerd brons in de hand, mantel van water die
in schuim overgaat. Om zijn voeten kolkt de zee omhoog. Imposant en breed — dit
moet duidelijk de sterkste van de drie zijn.
```

---

### KETEN 2 — Stormhoogte
*Palet: wolkenwit, elektrisch blauw, oud goud. Niche: lucht en donder.*

```
KETEN: Stormhoogte — wezens van de hoge lucht en de donder.
Gedeeld palet: wolkenwit en grijs, elektrisch blauw, accenten in oud goud.
Gedeelde kenmerken: grote vleugels, wervelende wind om het lichaam, vonken en
statische ontladingen, veren die aan de randen oplichten. Elke volgende vorm
vliegt hoger en draagt meer storm met zich mee.
```

**Harpij** · `art/harpy.png` — *stap 1, basisvorm*
```
Maak "Harpij" in de vastgelegde stijl, keten Stormhoogte.
De Griekse windgeest: mager vrouwenlichaam met grote grijze roofvogelvleugels in
plaats van armen, gehavende veren, scherpe klauwen, wilde haren die door de wind
naar achteren worden geblazen. Mager en gehaast — de kleinste van de drie.
```

**Roc** · `art/roc.png` — *stap 2*
```
Maak "Roc" in de vastgelegde stijl, keten Stormhoogte.
De reusachtige roofvogel uit Arabische verhalen. Adelaarachtig, brede uitgespreide
vleugels met witte en grijze slagpennen, gouden snavel en klauwen groot genoeg om
een olifant te dragen, een enkele bliksemvonk tussen de veren. Breed silhouet,
vleugels vullen het beeld.
```

**Donderdvogel** · `art/thunderbird.png` — *stap 3, eindvorm*
```
Maak "Donderdvogel" in de vastgelegde stijl, keten Stormhoogte.
De donderdvogel uit inheems-Noord-Amerikaanse verhalen. Enorme adelaargestalte,
verenkleed dat van wit naar onweersgrijs verloopt, ogen als bliksem, elektrische
bogen die tussen de gespreide vleugels overspringen, wolken die zich om zijn
poten samenpakken. Ontzagwekkend groot — de eindvorm van deze keten.
```

---

### KETEN 3 — Zandrijk
*Palet: goud, lapis lazuli, zandsteen. Niche: het oude Egypte.*

```
KETEN: Zandrijk — de wachters van de Egyptische dodenstad.
Gedeeld palet: goud en zandsteen, diep lapis lazuli blauw, accenten in zwart.
Gedeelde kenmerken: gestreepte hoofddoek of kraag, hierogliefen in het goud
gekerfd, verweerd steen en verband, dierlijke koppen op menselijke lijven. Elke
volgende vorm is minder mens en meer god.
```

**Sjabti** · `art/shabti.png` — *stap 1, basisvorm*
```
Maak "Sjabti" in de vastgelegde stijl, keten Zandrijk.
Een tot leven gewekt grafbeeldje: klein gestalte van geglazuurd blauw faience en
zandsteen, armen over de borst gekruist met schepje en korf, hierogliefen over
het hele lichaam, barsten waar het steen is afgebrokkeld. Stijf en klein — de
eenvoudigste van de drie.
```

**Sfinx** · `art/sphinx.png` — *stap 2*
```
Maak "Sfinx" in de vastgelegde stijl, keten Zandrijk.
Leeuwenlichaam met mensenhoofd, gestreepte gouden nemes-hoofddoek, brede
valkenvleugels tegen de rug gevouwen, zandsteenkleurige vacht met gouden randen.
Zittend, kop rechtop, blik recht vooruit. Breed en zwaar silhouet.
```

**Anubis** · `art/anubis.png` — *stap 3, eindvorm*
```
Maak "Anubis" in de vastgelegde stijl, keten Zandrijk.
De Egyptische god van de balseming: gespierd mensenlichaam met de kop van een
zwarte jakhals, gouden kraag en armbanden, blauwe linnen rok, in de hand een
weegschaal of een was-scepter. Rechtop en dreigend, oren hoog. De eindvorm — hij
moet er goddelijk uitzien, niet dierlijk.
```

---

### KETEN 4 — Zonnetempel
*Palet: obsidiaan zwart, turkoois, offergoud. Niche: Azteeks/Maya.*

```
KETEN: Zonnetempel — krijgers en goden van de Azteekse zon.
Gedeeld palet: obsidiaan zwart, fel turkoois, offergoud, bloedrood.
Gedeelde kenmerken: mozaiek van turkooizen steentjes, obsidiaan messen,
verentooien, jaguarvlekken, gesneden steenpatronen. Elke volgende vorm is meer
god en minder mens.
```

**Jaguarkrijger** · `art/jaguarwarrior.png` — *stap 1, basisvorm*
```
Maak "Jaguarkrijger" in de vastgelegde stijl, keten Zonnetempel.
Azteekse elitekrijger in een jaguarpak: gevlekte vacht als mantel en helm met de
jaguarmuil open om zijn hoofd, houten zwaard bezet met obsidiaan scherven, rond
schild met verenrand, turkooizen oorschijven. Menselijk formaat, gehurkt klaar om
te springen.
```

**Ahuizotl** · `art/ahuizotl.png` — *stap 2*
```
Maak "Ahuizotl" in de vastgelegde stijl, keten Zonnetempel.
Het Azteekse waterbeest: hondachtig lijf met gladde zwarte vacht, apenhanden,
kleine oren, en een lange staart die eindigt in een extra MENSENHAND. Natte glans,
turkooizen glinstering op de rug, tanden ontbloot. Laag en gespierd silhouet, de
staart hoog opgeheven zodat die hand goed zichtbaar is.
```

**Tezcatlipoca** · `art/tezcatlipoca.png` — *stap 3, eindvorm*
```
Maak "Tezcatlipoca" in de vastgelegde stijl, keten Zonnetempel.
De Azteekse god van de rokende spiegel. Machtige gestalte, huid in zwarte en
gouden strepen beschilderd, verentooi in turkoois en zwart, een ronde obsidiaan
spiegel waar zijn ene voet zou zijn, rook die daaruit opstijgt. Om zijn schouders
een jaguarvel. Imposant en onheilspellend.
```

---

### KETEN 5 — Bamboewoud
*Palet: jadegroen, rode lak, inktzwart. Niche: Oost-Aziatische folklore.*

```
KETEN: Bamboewoud — geesten uit Japanse en Chinese verhalen.
Gedeeld palet: jadegroen, rode lak, inktzwart, accenten in bladgoud.
Gedeelde kenmerken: gelakte oppervlakken, papieren talismannen, bamboe en
esdoornblad, gestileerde golf- en wolkpatronen. Elke volgende vorm is ouder en
machtiger geworden.
```

**Kappa** · `art/kappa.png` — *stap 1, basisvorm*
```
Maak "Kappa" in de vastgelegde stijl, keten Bamboewoud.
De Japanse rivierdemon: klein groen wezen met schildpadschild op de rug,
zwemvliezen aan handen en voeten, een snavelachtige bek, en bovenop zijn kale
schedel een ondiepe schaal met water die hij niet mag morsen. Gehurkt, druipend.
Het kleinste figuur van de keten.
```

**Tengu** · `art/tengu.png` — *stap 2*
```
Maak "Tengu" in de vastgelegde stijl, keten Bamboewoud.
De Japanse bergdemon: mensachtige gestalte met een lange rode neus, zwarte
kraaienvleugels, hoogrode huid, een monnikspij over een gelakt harnas, en een
waaier van veren in de hand. Rechtop, arrogante houding, vleugels half gespreid.
```

**Ryujin** · `art/ryujin.png` — *stap 3, eindvorm*
```
Maak "Ryujin" in de vastgelegde stijl, keten Bamboewoud.
De Japanse drakengod van de zee. Lange slangachtige oosterse draak met jadegroene
schubben, gouden manen en snorharen, klauwen die een parel omklemmen, het lichaam
opgerold in golvende bochten. Geen vleugels. De eindvorm — hij moet het beeld
vullen.
```

---

### KETEN 6 — Diepe Woud
*Palet: mosgroen, berkenwit, aardebruin. Niche: Slavische bosfolklore.*

```
KETEN: Diepe Woud — geesten uit het Slavische woud.
Gedeeld palet: mosgroen, berkenwit, aardebruin, accenten in roestrood.
Gedeelde kenmerken: schors en mos als huid of kleding, geweven linnen met rode
borduursels, paddenstoelen, takken die uit het lichaam groeien. Elke volgende
vorm is meer bos en minder mens.
```

**Domovoj** · `art/domovoi.png` — *stap 1, basisvorm*
```
Maak "Domovoj" in de vastgelegde stijl, keten Diepe Woud.
De Slavische huisgeest: klein, gedrongen mannetje, helemaal behaard met grijsbruin
haar, geweven linnen hemd met rood borduursel, blote voeten, een pook of bezem in
de hand, glinsterende oogjes. Klein en knus — de eenvoudigste van de drie.
```

**Leshy** · `art/leshy.png` — *stap 2*
```
Maak "Leshy" in de vastgelegde stijl, keten Diepe Woud.
De Slavische woudheer: lange magere gestalte van schors en mos, baard van klimop,
takken als geweien uit zijn hoofd, ogen die groen oplichten in de holtes,
paddenstoelen op zijn schouders. Hij staat scheef als een boom in de wind.
```

**Baba Jaga** · `art/babayaga.png` — *stap 3, eindvorm*
```
Maak "Baba Jaga" in de vastgelegde stijl, keten Diepe Woud.
De Slavische heks. Krombuigende oude vrouw met ijzeren tanden, hoofddoek en
gelapte rokken, staand in een grote houten vijzel met een stamper in de hand,
botten en schedels aan haar gordel. Om haar heen krult mist. Onmiskenbaar de
machtigste van de drie.
```

---

### KETEN 7 — IJsvlakte
*Palet: gletsjerblauw, sneeuwwit, bevroren grijs. Niche: Noorse vorstreuzen.*

```
KETEN: IJsvlakte — de vorstwezens van het noorden.
Gedeeld palet: gletsjerblauw, sneeuwwit, bevroren steengrijs.
Gedeelde kenmerken: rijp op huid en haar, ijskristallen die uit het lichaam
groeien, adem die als damp zichtbaar is, vacht en huiden tegen de kou. Elke
volgende vorm is groter en kouder.
```

**Rijpgeest** · `art/frostwight.png` — *stap 1, basisvorm*
```
Maak "Rijpgeest" in de vastgelegde stijl, keten IJsvlakte.
Een klein verkleumd spookwezen: doorschijnend blauwwit lichaam, rijp op zijn
schouders, holle ogen die blauw gloeien, gescheurde vachtlappen om zich heen
geslagen, ijspegels aan zijn vingers. Gebogen en mager — de kleinste van de drie.
```

**Jotun** · `art/jotun.png` — *stap 2*
```
Maak "Jotun" in de vastgelegde stijl, keten IJsvlakte.
Een Noorse vorstreus: forse gestalte met blauwgrijze huid, ijs in zijn baard en
wenkbrauwen, een knots van bevroren steen, huiden van berenvacht over de
schouders, ijskristallen die langs zijn armen omhoog groeien. Zwaar en breed.
```

**Ymir** · `art/ymir.png` — *stap 3, eindvorm*
```
Maak "Ymir" in de vastgelegde stijl, keten IJsvlakte.
De oerreus uit wie de Noorse wereld werd gemaakt. Kolossale gestalte van levend
gletsjerijs en steen, een baard die in ijzige rivieren naar beneden hangt, ogen
als winterzonnen, rijp die van hem afdampt. Hij moet er oeroud en onvoorstelbaar
groot uitzien — de eindvorm.
```

---

### KETEN 8 — Berghart
*Palet: graniet grijs, koper, gloeiend oranje. Niche: onder de berg.*

```
KETEN: Berghart — de bewoners van de diepe bergen.
Gedeeld palet: granietgrijs, koper en brons, een gloeiend oranje aderpatroon.
Gedeelde kenmerken: steenhuid met scheuren waar gloed doorheen komt, kopergroene
sieraden, kristallen die uit de rug groeien, gereedschap en hamers. Elke volgende
vorm is meer berg en minder wezen.
```

**Gnoom** · `art/gnome.png` — *stap 1, basisvorm*
```
Maak "Gnoom" in de vastgelegde stijl, keten Berghart.
Een klein aardwezen uit Europese folklore: gedrongen figuurtje met leren schort,
gereedschapsriem, puntmuts van vilt, gebruinde gerimpelde huid, een lamp met
gloeiend kristal in de hand. Klein en handig — de eenvoudigste van de drie.
```

**Bergtrol** · `art/mountaintroll.png` — *stap 2*
```
Maak "Bergtrol" in de vastgelegde stijl, keten Berghart.
Een Scandinavische bergtrol: zware gestalte met knoestige granietgrijze huid, mos
en korstmos op zijn rug en schouders, een neus als een rots, kleine oogjes,
handen als kolenschoppen. Gebogen maar breed, hij vult het beeld in de breedte.
```

**Dovregubbe** · `art/mountainking.png` — *stap 3, eindvorm*
```
Maak "Dovregubbe" in de vastgelegde stijl, keten Berghart.
De Noorse bergkoning. Een reus wiens lichaam half uit de berg zelf bestaat: kroon
van ruwe kristallen, mantel van erts en koper, aderen van gloeiend oranje magma
die door de scheuren in zijn steenhuid lopen, een scepter van gepolijst graniet.
Vorstelijk en onbeweeglijk — de eindvorm.
```

---

### KETEN 9 — Woestijnwind
*Palet: zandbeige, violet vuur, messing. Niche: Arabische djinn.*

```
KETEN: Woestijnwind — de djinn van de woestijn.
Gedeeld palet: zandbeige en messing, violet en blauw vuur, diep indigo.
Gedeelde kenmerken: onderlichaam dat in rook of vuur overgaat, wapperende zijde,
messing sieraden en zegelringen, arabesk-patronen in de vlammen. Elke volgende
vorm is minder stoffelijk en meer vuur.
```

**Peri** · `art/peri.png` — *stap 1, basisvorm*
```
Maak "Peri" in de vastgelegde stijl, keten Woestijnwind.
Een Perzische windgeest: sierlijke gevleugelde gestalte, doorschijnende
vlindervleugels met zandkleurige aderen, wapperende sluiers van lichte zijde,
messing sieraden, voeten die in stuifzand oplossen. Licht en klein — de
eenvoudigste van de drie.
```

**Marid** · `art/marid.png` — *stap 2*
```
Maak "Marid" in de vastgelegde stijl, keten Woestijnwind.
De machtigste soort djinn uit Arabische verhalen: gespierd bovenlichaam met
blauwviolette huid, gouden armbanden en een zegelring, kaalgeschoren hoofd met een
tulband, en een onderlichaam dat in een wervelende rookkolom overgaat. Armen over
elkaar, zelfverzekerd.
```

**Ifrit** · `art/ifrit.png` — *stap 3, eindvorm*
```
Maak "Ifrit" in de vastgelegde stijl, keten Woestijnwind.
De vurige djinn. Grote gehoornde gestalte van gloeiende kool en violet vuur, huid
als zwart verkoold hout met gloeiende scheuren, ogen van wit vuur, een mantel van
vlammen die als rook naar boven trekt. Dreigend en breed — de eindvorm.
```

---

### KETEN 10 — Savanne
*Palet: oker, indigo, koperrood. Niche: West-Afrikaanse mythologie.*

```
KETEN: Savanne — goden en geesten uit West-Afrikaanse verhalen.
Gedeeld palet: oker en zandbruin, diep indigo, koperrood, accenten in wit krijt.
Gedeelde kenmerken: geweven stoffen met geometrische patronen, kralen en
kaurischelpen, gesneden houten maskers, koperen sieraden. Elke volgende vorm
staat hoger in de hemel.
```

**Anansi** · `art/anansi.png` — *stap 1, basisvorm*
```
Maak "Anansi" in de vastgelegde stijl, keten Savanne.
De spingod uit Ashanti-verhalen, in zijn kleine gedaante: een spin ter grootte van
een hond met een slim, bijna menselijk gezicht, acht poten met okerkleurige
strepen, een web van gouden draad tussen zijn poten, kralen om zijn voorpoten.
Laag en breed silhouet, poten wijd.
```

**Mami Wata** · `art/mamiwata.png` — *stap 2*
```
Maak "Mami Wata" in de vastgelegde stijl, keten Savanne.
De watergeest uit West-Afrikaanse verhalen: statige vrouwelijke gestalte met een
grote slang om haar schouders en armen gedrapeerd, geweven indigo doek, kaurie-
schelpen in het haar, een spiegel en een kam in de hand, huid met een natte glans.
Rechtop en waardig.
```

**Shango** · `art/shango.png` — *stap 3, eindvorm*
```
Maak "Shango" in de vastgelegde stijl, keten Savanne.
De Yoruba-god van donder en bliksem. Krachtige gestalte in rood en wit, een
dubbelkoppige bijl (oshe) hoog geheven, kralensnoeren over de borst, kroon van
kauri-schelpen, bliksem die van de bijl afspringt. Vlammend en vorstelijk — de
eindvorm.
```

---

### KETEN 11 — Nevelheuvels
*Palet: smaragdgroen, mistgrijs, bleek goud. Niche: Keltische folklore.*

```
KETEN: Nevelheuvels — het volk van de Keltische heuvels.
Gedeeld palet: smaragdgroen, mistgrijs, bleek elfengoud, accenten in bloedrood.
Gedeelde kenmerken: keltische knoopwerkpatronen, mist die om de enkels hangt,
gedroogde heide en klaver, bleek goud dat er oud uitziet. Elke volgende vorm is
minder dier en meer voorteken.
```

**Púca** · `art/puca.png` — *stap 1, basisvorm*
```
Maak "Púca" in de vastgelegde stijl, keten Nevelheuvels.
De Ierse vormveranderaar, hier als een kleine zwarte pony met gele ogen, ruige
manen met klitten, een gouden hoofdstel met keltisch knoopwerk, mist om zijn
hoeven. Ondeugende blik. Klein en licht — de eenvoudigste van de drie.
```

**Cú Sídhe** · `art/cusidhe.png` — *stap 2*
```
Maak "Cú Sídhe" in de vastgelegde stijl, keten Nevelheuvels.
De feeenhond uit Schotse verhalen: een reusachtige hond zo groot als een jonge
stier, ruige mosgroene vacht, een lange gevlochten staart die opgerold over zijn
rug ligt, poten zo breed als een mensenhand, groen gloeiende ogen. Laag, zwaar en
gespierd.
```

**Morrígan** · `art/morrigan.png` — *stap 3, eindvorm*
```
Maak "Morrígan" in de vastgelegde stijl, keten Nevelheuvels.
De Ierse godin van oorlog en voortekenen. Lange gestalte in een gescheurde zwarte
mantel die aan de randen in kraaienveren overgaat, bleek gezicht met rode
oorlogstekens, drie kraaien om haar heen, een speer in de hand. Mist en veren
wervelen om haar op. De eindvorm — onheilspellend.
```

---

### KETEN 12 — Sterrenhof
*Palet: lapisblauw, bladgoud, gebrande klei. Niche: Mesopotamië.*

```
KETEN: Sterrenhof — de wachters van Babylon en Sumer.
Gedeeld palet: diep lapisblauw, bladgoud, gebrande kleirood.
Gedeelde kenmerken: gevlochten vierkante baarden, gestapelde veren, spijkerschrift
in het goud gekerfd, gestileerde stierenhoorns, geglazuurde tegelpatronen. Elke
volgende vorm is ouder dan de vorige.
```

**Lamassu** · `art/lamassu.png` — *stap 1, basisvorm*
```
Maak "Lamassu" in de vastgelegde stijl, keten Sterrenhof.
De Assyrische poortwachter: stierenlichaam met adelaarsvleugels en een menselijk
hoofd met een lange gevlochten vierkante baard en een gehoornde tiara. Gebeeldhouwd
uit lapis-blauwe steen met gouden randen. Rustig staand, kop rechtop.
```

**Anzu** · `art/anzu.png` — *stap 2*
```
Maak "Anzu" in de vastgelegde stijl, keten Sterrenhof.
De Mesopotamische stormvogel: reusachtige adelaar met de kop van een leeuw,
verenkleed in lapisblauw en goud, klauwen die het tablet van het lot omklemmen,
onweerswolken die van zijn vleugels afrollen. Vleugels half gespreid, dreigend.
```

**Tiamat** · `art/tiamat.png` — *stap 3, eindvorm*
```
Maak "Tiamat" in de vastgelegde stijl, keten Sterrenhof.
De oerdraak van het zoute oerwater uit het Babylonische scheppingsverhaal. Enorme
slangendraak met meerdere gehoornde koppen op lange halzen, schubben in lapisblauw
met gouden randen, een lijf dat in kolkend donker water overgaat. Zij moet het
beeld helemaal vullen — de machtigste eindvorm van alle ketens.
```

---

### KETEN 13 — Titanenveld
*Palet: brons, olijfgroen, aardebruin. Niche: Griekse titanen en beesten.*

```
KETEN: Titanenveld — de oude beesten van Griekenland.
Gedeeld palet: verweerd brons, olijfgroen, aardebruin, accenten in wijnrood.
Gedeelde kenmerken: bronzen beslag en riemen, olijfblad, gebarsten marmer, dierlijke
onderlijven. Elke volgende vorm is minder mens en meer oerkracht.
```

**Faun** · `art/faun.png` — *stap 1, basisvorm*
```
Maak "Faun" in de vastgelegde stijl, keten Titanenveld.
Een jonge faun: menselijk bovenlichaam, geitenpoten met bruine vacht, kleine
gekrulde hoorns, een krans van olijfblad, een panfluit in de hand. Slank en
speels. De eenvoudigste van de drie.
```

**Minotaurus** · `art/minotaur.png` — *stap 2*
```
Maak "Minotaurus" in de vastgelegde stijl, keten Titanenveld.
De stiermens uit het labyrint: zwaar gespierd mensenlichaam met de kop van een
zwarte stier, brede hoorns met bronzen kappen, een neusring, een dubbele bijl in
de hand, leren riemen over de borst. Breed en dreigend, kop naar voren.
```

**Typhon** · `art/typhon.png` — *stap 3, eindvorm*
```
Maak "Typhon" in de vastgelegde stijl, keten Titanenveld.
Het monster dat zelfs de Griekse goden liet vluchten. Reusachtig bovenlichaam met
honderd slangenkoppen die als haren en vingers uit hem groeien, vleugels van
donkere rook, een onderlijf dat in twee enorme slangenstaarten overgaat, vuur
tussen de tanden. De eindvorm — chaotisch en overweldigend.
```

---

### KETEN 14 — Schemerwacht
*Palet: botwit, violet, oud bloedrood. Niche: Slavische nachtfolklore.*

```
KETEN: Schemerwacht — wat er in de Slavische nacht rondgaat.
Gedeeld palet: botwit en lijkbleek, violet, oud bloedrood, accenten in zwart ijzer.
Gedeelde kenmerken: doodshemden en grafkleding, water dat van het lichaam druipt,
kaarsvlammen zonder kaars, ijzeren kettingen. Elke volgende vorm is verder van
het leven af.
```

**Strigoi** · `art/strigoi.png` — *stap 1, basisvorm*
```
Maak "Strigoi" in de vastgelegde stijl, keten Schemerwacht.
De Roemeense ondode: magere gestalte in een vuil doodshemd, lijkbleke huid met
violette aderen, holle wangen, lange vingernagels, ogen die rood glimmen onder
warrig zwart haar. Gebogen en sluipend — de kleinste van de drie.
```

**Rusalka** · `art/rusalka.png` — *stap 2*
```
Maak "Rusalka" in de vastgelegde stijl, keten Schemerwacht.
De Slavische verdronken watergeest: bleke vrouwengestalte in een doorweekt wit
gewaad dat aan haar plakt, lang groenzwart haar waar water uit druipt, een krans
van waterlelies, voeten die niet helemaal de grond raken. Sierlijk en
onheilspellend tegelijk.
```

**Tsjernobog** · `art/chernobog.png` — *stap 3, eindvorm*
```
Maak "Tsjernobog" in de vastgelegde stijl, keten Schemerwacht.
De zwarte god uit Slavische verhalen. Enorme gehoornde gestalte van levende
duisternis, huid als koud zwart ijzer, een mantel van schaduw die in rook overgaat,
violette gloed diep in zijn oogkassen, ijzeren kettingen om zijn armen gewonden.
Hij moet aanvoelen als de nacht zelf — de eindvorm.
```

---

## Als alles binnen is

Lever de 42 PNG's aan in `art/` met precies de bestandsnamen hierboven. Dan kan
ik ze inbouwen: veertien nieuwe facties, veertien nieuwe evolutieketens,
zestig figuren in totaal. Dat is ook precies het moment waarop je team weer een
echte keuze wordt — met twintig basisvormen en zes teamplekken valt er dan wél
wat te kiezen.

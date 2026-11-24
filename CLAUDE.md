# Jõulupuu – interaktiivne 3D-gloobus

TalTechi logistikakursuse rühmatöö "Jõulupuu": kaardistame jõulupuude (elusad ja kunstpuud)
globaalset tarneahelat. 10 riikide tiimi koguvad andmeid, kasutaja (algaja programmeerija)
on visualiseerija. Leht läheb domeenile joulupuud.ee (GitHub Pages). Esitlus: 8. detsember 2026.
Päris andmed tulevad tiimidelt hiljem, praegu on kõik testandmed (`source` = "TESTANDMED").

## Töötamise reeglid
- Kasutaja on algaja: selgita lühidalt, mida teed, ja ütle otse, kui tema soov on halb mõte.
- Kõik kasutajale nähtavad tekstid on **eesti keeles**.
- Tee git commit pärast iga toimivat muudatust.
- Ära tee rohkem, kui küsiti. Ebaselguse korral küsi enne.

## Tehnika
- Puhas HTML + CSS + JavaScript, **ilma build-sammuta**.
- `globe.gl` (CDN) ja `papaparse` (CDN) CSV lugemiseks.
- Riigipiirid: Natural Earth GeoJSON (`data/world.geojson`, 110m admin_0_countries).
- **Riike seotakse välja `ADM0_A3` kaudu, MITTE `ISO_A3`** (ISO_A3 on nt Prantsusmaal ja Norras "-99").
- Testimiseks kohalik server (`npx serve`), sest `file://` pealt CSV-d ei laadi.
- GitHub Pages: failid peavad töötama ka alamteelt, kasuta suhtelisi teid (`data/...`).

## Andmed (kaust data/)
Andmeid **ei kirjutata kunagi koodi sisse**, kõik loetakse CSV-dest. Põhjalik seletus: `data/SCHEMA.md`.

Kood loeb veerge **nime järgi** (mitte järjekorra), uued veerud ei riku vana koodi.

`data/countries.csv` – üks rida = üks riik ühel aastal:
`iso3, country_et, year, is_forecast, live_trees, artificial_trees, main_species, live_growing_process, live_trend, artificial_production, artificial_material, artificial_footprint, artificial_disposal, top_fact, image_url, source, team`

`data/flows.csv` – üks rida = üks vool riigist riiki:
`from_iso3, to_iso3, year, tree_type (live/artificial/material), material, volume, unit (tk/tonni), note, source`

`data/places.csv` – farmid ja tehased (punktid kaardil):
`name, place_type (farm/factory), iso3, lat, lng, product, volume, unit, year, note, source, team`

`data/facts.csv` – mitu fakti riigi kohta (pop-up ja viktoriin):
`iso3, category (live/artificial/general), fact, image_url, image_credit, source, team`

`data/riigikoodid.csv` – kõik lubatud riigikoodid (ADM0_A3) inglise nimedega, tiimidele.

Kõik väljad peale kohustuslike võivad olla tühjad. Kohustuslikud: countries `iso3`, `year`;
flows `from_iso3`, `to_iso3`, `year`, `tree_type`; places `name`, `place_type`, `iso3`, `lat`, `lng`;
facts `iso3`, `fact`. Puuduv väärtus kuvatakse lehel kui "andmed puuduvad".

**Tiimid on regioonid** (Eesti, Euroopa I/II, Lähis-Ida, Aafrika, Aasia, Austraalia + Okeaania, USA,
Kanada + Mehhiko, Lõuna-Ameerika + Kariibid), iga tiim katab mitu riiki. Tähtaeg: tiimid koguvad
info 1. detsembriks, esitlus 8. detsembril.

Testandmete genereerija ei ole repos; kui vaja, muuda CSV-sid otse.

Kõik neli andmefaili on lehel kasutusel. `flows.csv` → kaared, `places.csv` → punktid,
`facts.csv` ja uued countries-veerud → riigi pop-up. Puuduvad valikulised failid (places, facts,
flows) ei riku lehte, vastav osa jääb tühjaks.

## Lehe eesmärk (lõplik)
1. 3D-gloobus, pööramine ja suumimine hiirega
2. Riigid värvitud puude koguarvu järgi (heledam = rohkem)
3. Riigile klikkides pop-up: nimi, elusad, kunstpuud, peamine sort, fakt, pilt, allikas
4. Kaared riikide vahel (elus = roheline, kunst = punane, paksus = maht, klikitavad)
5. Ajaliugur 2025 ja 2026 (2026 on prognoos ja peab olema nähtav)
6. Lüliti: elusad / kunstpuud / mõlemad
7. Kõik tekstid eesti keeles

## Staatus
- [x] 1–3 gloobus, värvid, riigi pop-up
- [x] 4 kaared (flows.csv; roheline = elusad, punane = kunst, kuldne = materjal; paksus = maht,
  klikitavad, vooluandmete pop-up)
- [x] 5 ajaliugur (aastad leitakse CSV-dest ise, esitusnuppu pole; prognoosiaasta = `is_forecast` true:
  silt "PROGNOOS", punktiirkaared, legendis "(prognoos)")
- [x] 6 lüliti elusad / kunstpuud (vt allpool kaks tarneahela nuppu; materjalivood kuuluvad
  "kunstpuude" alla; värviskaala maksimum on iga režiimi kohta kõigi aastate peale)
- [x] places.csv: farmid (lime) ja tehased (oranž) punktidena, klikitavad, lüliti ja aasta järgi
  (aasta: kuvatakse uusim rida, mis pole sellest aastast uuem)
- [x] riigi pop-up: kasvatus, trend, tootmine, materjal, jalajälg, utiliseerimine (lõigud järgivad
  lülitit) ja mitu fakti facts.csv-st (kategooria järgi, "general" alati)
- [x] Mitme lehega veeb (kliendi/kursuse mockup järgi): üleval paremal pergamentmenüü neljaga,
  hash-marsruutimine (`#/`, `#/tehispuu`, `#/loodus`, `#/meist`), `route()` app.js-is:
  - **Avaleht** = puhas gloobus (mode `both`), kaari ja punkte pole näha, riigile klikkides faktid
  - **Tehispuu tarneahel** = mode `artificial`: kunstpuude + materjali kaared + tehased
  - **Loodusliku jõulupuu tarneahel** = mode `live`: elusate kaared + puufarmid
  - **Meist** = tekstileht (gloobus peatatud)
  Režiim muudab ka riikide värvi, legendi ja pop-up'i lõike. Eraldi lüliti-nuppe enam pole.
- [x] Sisu hiljem ise kirjutada: **`sisu/avaleht.html`, `tehispuu.html`, `loodus.html`, `meist.html`**
  (HTML-lõigud; esimesed kolm on väike kaart gloobuse peal, tühi fail = kaarti pole;
  `meist.html` on terve leht). Failides on eestikeelne juhend kommentaaris. Uue lehe lisamiseks:
  nav `index.html`-is + `ROUTES` app.js-is + uus fail `sisu/`.
- [x] Jõulukujundus: tume öine taust + õrn lumesadu (`snow.js`, väljas kui "vähenda liikumist"),
  pergamentmenüü, kuldsed toonid, kuusk pealkirja kõrval. Fondid Google Fontsist (vajab internetti):
  **Fraunces** (pealkirjad) ja **Inter** (tekst); `--serif`/`--sans` style.css-is.
  TODO: fondid ja CDN-teegid repo sisse tõsta (offline-esitluseks, vajab kasutaja luba allalaadimiseks).
- [x] Avalehe sissejuhatus: täisekraani hero ("Jõulupuu" suure kuldse Fraunces-pealkirjaga), scrollides
  hajub pealkiri ja gloobus ilmub sujuvalt (fade + suum, `applyProgress()` app.js-is; `#scroller`
  on läbipaistev scrolliv kiht gloobuse peal). Kui gloobus on täielikult nähtav (p ≥ 0.995), saab
  scroller `pointer-events: none` ja gloobus on juhitav; tagasi hero juurde nupp "↑ Algusesse" või
  menüü "Avaleht". Teistel lehtedel (tarneahelad, Meist) hero'd pole.
  Menüü on avalehe esimesel ekraanil peidus ja liugub scrollides ülalt sisse (`body.nav-in`, lingid
  ilmuvad ükshaaval; CSS-i transition'id).
- [x] Kujukeste (farm/tehas) klikitav ala on ikoonist suurem: CSS padding + `markerAt()` app.js-is
  kontrollib klõpsu `onPolygonClick`/`onGlobeClick` sees, nii et klõps ikooni ligidal läheb alati
  farmile/tehasele, mitte riigile.
- [x] Meist-leht on praegu **tühi** (`sisu/meist.html` sisaldab ainult juhendi kommentaari);
  kuni sinna tekst kirjutatakse, näidatakse ainult menüüd.
- [x] Farm = kolmest kuusest koosnev metsatukk (`#ico-trees`, koosneb `#ico-tree`-dest), tehas =
  väike jõulumaja (`#ico-house`). SVG-sümbolid on index.html-is, gloobusel HTML-markeritena
  (`htmlElementsData`), legendis samad ikoonid.
- [x] Sujuv sisenemine: kaared kasvavad/tõusevad esile globe.gl-i enda üleminekuga
  (`ARC_DRAW_MS` app.js algul, praegu 2200 ms), kujukesed kasvavad CSS-animatsiooniga
  (`markerIn` style.css-is).
- [x] Klõpsamise parandus: gloobuse automaatne pöörlemine **peatub, kui hiir on kujukese 70 px
  lähedal** (`pointermove` app.js-is), muidu liikus kujuke klõpsu ajal ära. Pöörlemine peatub
  päriselt, kui kasutaja gloobust haarab. NB: vasakul üleval olev tutvustuskaart (`#info-card`)
  katab Põhja-Ameerika kujukesed, kuni selle sulged.
- [ ] GitHub Pages avaldamine (joulupuud.ee), pildid, esitluse läbiproov

## Failid
- `index.html`, `style.css`, `app.js` – leht
- `data/` – CSV-d, GeoJSON, SCHEMA.md
- Kujundus: tume öine taust, tumesinine gloobus, roheliste toonidega riigid, jõulune aga mitte kitšilik.

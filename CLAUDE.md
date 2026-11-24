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

**Kood ei kasuta veel** (andmeformaat valmis, joonistamine tegemata): `places.csv`, `facts.csv`,
uued countries-veerud (kasvatus, materjal, jalajälg, utiliseerimine). Riigi pop-up näitab praegu
ainult põhikomplekti. Kaared kasutavad `flows.csv`, aasta `year` järgi.

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
- [x] 5 ajaliugur (aastad leitakse CSV-dest ise, ▶ esitus; prognoosiaasta = `is_forecast` true:
  silt "PROGNOOS", punktiirkaared, legendis "(prognoos)")
- [ ] 6 lüliti elusad / kunstpuud / mõlemad
- [ ] places.csv (farmid, tehased), facts.csv, uued countries-veerud pop-up'is

## Failid
- `index.html`, `style.css`, `app.js` – leht
- `data/` – CSV-d, GeoJSON, SCHEMA.md
- Kujundus: tume öine taust, tumesinine gloobus, roheliste toonidega riigid, jõulune aga mitte kitšilik.

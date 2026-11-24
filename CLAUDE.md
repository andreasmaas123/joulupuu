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

`data/countries.csv` – üks rida = üks riik ühel aastal:
`iso3, country_et, year, is_forecast, live_trees, artificial_trees, main_species, top_fact, image_url, source, team`

`data/flows.csv` – üks rida = üks vool riigist riiki:
`from_iso3, to_iso3, year, tree_type (live/artificial), volume, unit, note, source`

Kõik väljad peale `iso3`, `year` (vooludel `from_iso3`, `to_iso3`, `year`, `tree_type`) võivad olla
tühjad. Puuduv väärtus kuvatakse lehel kui "andmed puuduvad".

## Lehe eesmärk (lõplik)
1. 3D-gloobus, pööramine ja suumimine hiirega
2. Riigid värvitud puude koguarvu järgi (heledam = rohkem)
3. Riigile klikkides pop-up: nimi, elusad, kunstpuud, peamine sort, fakt, pilt, allikas
4. Kaared riikide vahel (elus = roheline, kunst = punane, paksus = maht, klikitavad)
5. Ajaliugur 2025 ja 2026 (2026 on prognoos ja peab olema nähtav)
6. Lüliti: elusad / kunstpuud / mõlemad
7. Kõik tekstid eesti keeles

## Staatus
- [x] 1–3 (gloobus, värvid, pop-up) – praegu kuvatakse kindlalt 2025 (`YEAR` app.js-is)
- [ ] 4 kaared, 5 ajaliugur, 6 lüliti

## Failid
- `index.html`, `style.css`, `app.js` – leht
- `data/` – CSV-d, GeoJSON, SCHEMA.md
- Kujundus: tume öine taust, tumesinine gloobus, roheliste toonidega riigid, jõulune aga mitte kitšilik.

# Andmete vorming – Jõulupuu projekt

Tere! Siit leiad, mida meie jõulupuude gloobuse jaoks vaja on. Kõik, mille te kokku kogute,
jõuab hiljem interaktiivsele maailmakaardile.

**Kuidas saata:** CSV-failidena (Excelis: *Salvesta nimega → CSV UTF-8*). Esimene rida on alati
veergude nimed, täpselt nii nagu allpool kirjas. **Ära muuda veergude nimesid ega järjekorda.**
Veeru võid tühjaks jätta, aga veergu ei tohi ära kustutada.

## Üldised reeglid
- **Tühi lahter = ei tea.** Ära kirjuta "0", "-" ega "puudub", leht kirjutab ise "andmed puuduvad".
  (Number 0 tähendab, et puid oli tõesti null.)
- **Numbrid ilma tühikute ja komadeta:** `1500000`, mitte `1 500 000`.
- **Riik = 3-täheline kood** suurte tähtedega (EST, DEU). Kõik koodid on failis
  [`riigikoodid.csv`](riigikoodid.csv). Kui riiki seal pole, küsi visualiseerijalt.
- **Iga väärtuse kohta märgi allikas** (veerg `source`). See on kursuse töös oluline.
- **Aastad:** peamised on `2025` (tegelik) ja `2026` (prognoos, `is_forecast` = `true`).
  Kui sul on ka varasemad aastad (nt 2020–2024), lisa need samamoodi eraldi ridadena, need aitavad
  trende näidata.
- **Komaga tekst:** kui lahtri tekstis on koma, pane see jutumärkidesse. Excel teeb seda salvestades ise.
- **Veerg `team`:** kirjuta oma tiimi nimi täpselt nii: `Tiim Eesti`, `Tiim Euroopa I`,
  `Tiim Euroopa II`, `Tiim Lähis-Ida`, `Tiim Aafrika`, `Tiim Aasia`, `Tiim Austraalia + Okeaania`,
  `Tiim USA`, `Tiim Kanada + Mehhiko`, `Tiim Lõuna-Ameerika + Kariibid`.
- Iga tiim katab **mitu riiki**: lisa iga riigi kohta eraldi rida.

Kokku on **4 faili**. Esimesed kaks (riigid ja vood) on kõige olulisemad, ülejäänud kaks lisavad
kaardile kihte.

---

## Fail 1: `countries.csv` – andmed riigi kohta

**Üks rida = üks riik ühel aastal.** Eesti 2025 ja Eesti 2026 on kaks rida.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `iso3` | Riigi 3-täheline kood | `EST` | **Jah** |
| `country_et` | Riigi nimi eesti keeles | `Eesti` | ei |
| `year` | Aasta | `2025` | **Jah** |
| `is_forecast` | `false` = tegelik, `true` = prognoos | `false` | ei |
| `live_trees` | Elusate jõulupuude arv aastas (tk) | `250000` | ei |
| `artificial_trees` | Kunstjõulupuude arv (tk), mis riigis aastas müüakse või kasutatakse | `180000` | ei |
| `main_species` | Peamine elusate puude sort | `Nordmanni nulg` | ei |
| `live_growing_process` | Kuidas elusat jõulupuud kasvatatakse (kasvuaeg, istandus, hooldus) | `Kasvab 8–10 aastat istandustes.` | ei |
| `live_trend` | Trend: kas puude arv kasvab, kahaneb, miks | `Nõudlus kasvab aeglaselt.` | ei |
| `artificial_production` | Kunstpuid **toodetakse** selles riigis aastas (tk) | `180000000` | ei |
| `artificial_material` | Millest kunstpuid tehakse | `PVC, teras` | ei |
| `artificial_footprint` | Jalajälg (CO2, energia, vesi), vabas vormis | `Hinnanguliselt 40 kg CO2 ühe puu kohta.` | ei |
| `artificial_disposal` | Kuidas kunstpuud utiliseeritakse | `Enamasti prügila.` | ei |
| `top_fact` | Üks huvitav fakt riigi kohta (1–2 lauset) | `Taani on suurim nulupuude eksportija.` | ei |
| `image_url` | Pildi veebiaadress (algab `https://`), pilt peab olema vabalt kasutatav | `https://...jpg` | ei |
| `source` | Allikas | `Eurostat 2024` | ei, aga väga soovitatav |
| `team` | Sinu tiimi nimi | `Tiim Eesti` | ei |

**Näide (kaks rida, lühendatud):**

```
iso3,country_et,year,is_forecast,live_trees,artificial_trees,main_species,...,source,team
EST,Eesti,2025,false,250000,180000,Nordmanni nulg,...,Statistikaamet,Tiim Eesti
EST,Eesti,2026,true,262000,189000,Nordmanni nulg,...,Prognoos,Tiim Eesti
```
(Tegelikus failis on kõik veerud, nagu tabelis, järjekorras. Vaata näidisfaili `countries.csv`.)

---

## Fail 2: `flows.csv` – puude ja materjalide vood riikide vahel

**Üks rida = üks vool ühest riigist teise** ühe tüübi kohta ühel aastal. Kaardil joonistame
sellest noole.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `from_iso3` | Riik, kust vool algab | `DNK` | **Jah** |
| `to_iso3` | Riik, kuhu vool läheb | `DEU` | **Jah** |
| `year` | Aasta | `2025` | **Jah** |
| `tree_type` | Ainult üks neist: `live` (elusad puud), `artificial` (kunstpuud), `material` (materjal, millest kunstpuid tehakse) | `live` | **Jah** |
| `material` | Ainult siis, kui `tree_type` on `material`: mis materjal | `PVC` | ei |
| `volume` | Kui palju liigub (number) | `3500000` | ei |
| `unit` | Ühik: `tk` (tükki) või `tonni` | `tk` | ei |
| `note` | Vaba märkus | `Peamine eksporditee` | ei |
| `source` | Allikas | `Eurostat Comext` | ei, aga soovitatav |

**Näited:**

```
from_iso3,to_iso3,year,tree_type,material,volume,unit,note,source
DNK,DEU,2025,live,,3500000,tk,Peamine eksporditee,Eurostat Comext
CHN,USA,2025,artificial,,55000000,tk,,Tolliandmed
KOR,CHN,2025,material,PVC,30000,tonni,PVC-graanulid tehastele,Tööstusraport
```

---

## Fail 3: `places.csv` – farmid ja tehased (punktid kaardil)

**Üks rida = üks farm või tehas.** Nii saame kaardile märkida, kus puid kasvatatakse või
kunstpuid toodetakse.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `name` | Farmi või tehase nimi | `Mäe talu` | **Jah** |
| `place_type` | `farm` (puufarm) või `factory` (kunstpuutehas) | `farm` | **Jah** |
| `iso3` | Riigi kood | `EST` | **Jah** |
| `lat` | Laiuskraad (number, punktiga). Leiad Google Mapsist: paremklõps kohal → esimene number | `58.05` | **Jah** |
| `lng` | Pikkuskraad (number, punktiga), samast kohast | `27.05` | **Jah** |
| `product` | Sort (farm) või toode (tehas) | `Harilik kuusk` | ei |
| `volume` | Aastane maht | `20000` | ei |
| `unit` | Ühik | `tk` | ei |
| `year` | Aasta, mille kohta maht kehtib | `2025` | ei |
| `note` | Vaba märkus | `Pereettevõte` | ei |
| `source` | Allikas | `Ettevõtte koduleht` | ei |
| `team` | Tiimi nimi | `Tiim Eesti` | ei |

**Märkus:** kasuta komakohtade jaoks **punkti**, mitte koma (`58.05`, mitte `58,05`).

---

## Fail 4: `facts.csv` – faktid ja pildid (pop-up'i ja viktoriini jaoks)

**Üks rida = üks fakt.** Ühe riigi kohta võib olla nii palju fakte kui tahad. Seda faili kasutab ka
pereviktoriini tiim.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `iso3` | Riigi kood | `DNK` | **Jah** |
| `category` | `live` (elusad), `artificial` (kunst) või `general` (üldine) | `live` | ei |
| `fact` | Fakt 1–2 lausega | `Taani nulupuu kasvab müügiks 8–10 aastat.` | **Jah** |
| `image_url` | Pildi aadress (`https://`), kui faktil on pilt | `https://...jpg` | ei |
| `image_credit` | Pildi autor ja litsents | `Foto: Nimi, CC BY` | ei |
| `source` | Allikas | `Taani metsaliit` | ei, aga soovitatav |
| `team` | Tiimi nimi | `Tiim Euroopa I` | ei |

---

## Enne saatmist kontrolli
- [ ] Veergude nimed on täpselt nagu ülal
- [ ] Riigikoodid on suurte tähtedega ja `riigikoodid.csv` järgi
- [ ] Teadmata väärtused on lahtrid **tühjad**
- [ ] Numbrid on ilma tühikuteta
- [ ] `source` on täidetud
- [ ] Fail on salvestatud kui **CSV UTF-8** (muidu lähevad ä, ö, õ, ü katki)

Kui jääd hätta, küsi projekti visualiseerijalt.

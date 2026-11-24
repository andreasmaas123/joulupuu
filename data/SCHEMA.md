# Andmete vorming – Jõulupuu projekt

Tere! Siit leiad, mida meie jõulupuude gloobuse jaoks vaja on. Andmed saada **CSV-failina**
(Excelis: *Salvesta nimega → CSV UTF-8*). Esimene rida on alati veergude nimed, täpselt nii,
nagu allpool kirjas. **Ära muuda veergude nimesid ega nende järjekorda.**

**Üldised reeglid**
- Kui mõnda väärtust sa ei tea, jäta lahter **tühjaks**. Ära kirjuta "0", "-" ega "puudub" –
  leht kirjutab ise "andmed puuduvad". (Number 0 tähendab, et puid oli tõesti null.)
- Numbrid ilma tühikute, punktide ja komadeta tuhandete vahel: `1500000`, mitte `1 500 000`.
- Riigi tunnus on **kolmetäheline kood** (nt EST, DEU). Vaata allolevat tabelit.
- Iga väärtuse kohta märgi, kust see pärineb (veerg `source`).

---

## Fail 1: `countries.csv` – andmed riigi kohta

**Üks rida = üks riik ühel aastal.** Kui tahad anda nii 2025 kui 2026, on Eesti kohta kaks rida.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `iso3` | Riigi 3-täheline kood suurte tähtedega | `EST` | **Jah** |
| `country_et` | Riigi nimi eesti keeles | `Eesti` | ei |
| `year` | Aasta | `2025` | **Jah** |
| `is_forecast` | `false` = tegelikud andmed, `true` = prognoos (2026 puhul tavaliselt `true`) | `false` | ei |
| `live_trees` | Elusate jõulupuude arv aastas (tk) | `250000` | ei |
| `artificial_trees` | Kunstjõulupuude arv aastas (tk) | `180000` | ei |
| `main_species` | Peamine elusate puude sort | `Nordmanni nulg` | ei |
| `top_fact` | Üks huvitav fakt riigi kohta (1–2 lauset) | `Taani on Euroopa suurim nulupuude eksportija.` | ei |
| `image_url` | Pildi veebiaadress (algab `https://`). Pilt peab olema vabalt kasutatav | `https://commons.wikimedia.org/...jpg` | ei |
| `source` | Allikas, kust andmed on | `Eurostat 2024` | ei, aga väga soovitatav |
| `team` | Sinu tiimi nimi | `Tiim Eesti` | ei |

**Näide (kaks rida):**

```
iso3,country_et,year,is_forecast,live_trees,artificial_trees,main_species,top_fact,image_url,source,team
EST,Eesti,2025,false,250000,180000,Nordmanni nulg,Eestis müüakse palju kodumaiseid puid.,,Statistikaamet,Tiim Eesti
EST,Eesti,2026,true,262000,189000,Nordmanni nulg,Eestis müüakse palju kodumaiseid puid.,,Prognoos,Tiim Eesti
```

**Tähelepanu:** kui tekstis (nt faktis) on koma, pane kogu lahter jutumärkidesse:
`"Taani ekspordib puid Saksamaale, Poolasse ja Rootsi."` (Excel teeb seda salvestades ise.)

---

## Fail 2: `flows.csv` – puude vood riikide vahel

**Üks rida = üks vool ühest riigist teise** (ühe puutüübi kohta ühel aastal).
Taani → Saksamaa elusad puud on üks rida, Taani → Saksamaa kunstpuud teine rida.

| Veerg | Mis see on | Näide | Kohustuslik? |
|---|---|---|---|
| `from_iso3` | Riik, kust puud lähevad (kood) | `DNK` | **Jah** |
| `to_iso3` | Riik, kuhu puud lähevad (kood) | `DEU` | **Jah** |
| `year` | Aasta | `2025` | **Jah** |
| `tree_type` | Ainult `live` (elusad) või `artificial` (kunstpuud) | `live` | **Jah** |
| `volume` | Kui palju puid liigub (number) | `3500000` | ei |
| `unit` | Ühik. Eelistame `tk` (tükki). Kui on tonnides, kirjuta `tonni` | `tk` | ei |
| `note` | Vaba märkus | `Peamine eksporditee` | ei |
| `source` | Allikas | `Eurostat Comext 2024` | ei, aga soovitatav |

**Näide:**

```
from_iso3,to_iso3,year,tree_type,volume,unit,note,source
DNK,DEU,2025,live,3500000,tk,Peamine eksporditee,Eurostat Comext
CHN,USA,2025,artificial,55000000,tk,,Tolliandmed
```

---

## Riigikoodid (näited)

Kasuta **3-tähelist koodi**. Enamik on tuttavad ISO-koodid:

| Riik | Kood | | Riik | Kood |
|---|---|---|---|---|
| Eesti | `EST` | | Kanada | `CAN` |
| Saksamaa | `DEU` | | Brasiilia | `BRA` |
| Taani | `DNK` | | Austraalia | `AUS` |
| Ameerika Ühendriigid | `USA` | | Prantsusmaa | `FRA` |
| Hiina | `CHN` | | Norra | `NOR` |
| Poola | `POL` | | Rootsi | `SWE` |

Kui sa pole koodis kindel, küsi projekti visualiseerijalt.

## Enne saatmist kontrolli
- [ ] Veergude nimed on täpselt nagu ülal
- [ ] Riigi koodid on suurte tähtedega ja 3-tähelised
- [ ] Teadmata väärtused on lahtrid tühjad
- [ ] `source` on täidetud
- [ ] Fail on salvestatud kui **CSV UTF-8** (muidu rikuvad ä, ö, õ, ü tähed ära)

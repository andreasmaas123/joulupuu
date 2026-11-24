# Jõulupuu – interaktiivne jõulupuude gloobus

TalTechi logistikakursuse rühmatöö: elusate ja kunstjõulupuude globaalne tarneahel 3D-gloobusel.

- **Avalik leht:** https://andreasmaas123.github.io/joulupuu/
- **Projekt GitHubis:** https://github.com/andreasmaas123/joulupuu

---

## Kes mida teeb? Vali oma roll

| Mida sa tahad teha? | Mida vajad | Mine jaotisse |
|---|---|---|
| Lisada **andmeid** (riigid, vood, farmid, faktid) või **teksti** | Ainult GitHubi konto | **A** |
| Muuta **lehe välimust või koodi** oma Claude'iga | GitHubi konto, Git, Node.js, Claude | **B** |

---

## A. Andmete või teksti lisamine (ilma installimata)

1. Loo tasuta konto aadressil github.com ja ütle projekti haldajale (Andreas) oma kasutajanimi.
2. Võta vastu kutse (tuleb e-kirjaga, vajuta **Accept invitation**).
3. Ava repos fail, mida tahad muuta:
   - riikide andmed: `data/countries.csv`
   - vood riikide vahel: `data/flows.csv`
   - farmid ja tehased: `data/places.csv`
   - faktid ja pildid: `data/facts.csv`
   - tekstid lehel: kaust `sisu/` (nt `sisu/meist.html`)
4. Vajuta üleval paremal **pliiatsi-ikoonile**, muuda ja vajuta **Commit changes**.
5. Umbes minuti pärast on muudatus avalikul lehel.

**Enne kui andmeid lisad, loe** [`data/SCHEMA.md`](data/SCHEMA.md): seal on iga veeru seletus ja näited.
Riigikoodid leiad failist [`data/riigikoodid.csv`](data/riigikoodid.csv).

---

## B. Arendamine oma Claude'iga

### Ühekordne seadistus
1. **GitHubi konto** ja kutse (nagu A punktides 1–2).
2. Paigalda arvutisse **Git** (git-scm.com) ja **Node.js** (nodejs.org). Jäta vaikevalikud.
3. **Taaskäivita Claude'i rakendus**, et ta uued programmid leiaks.
4. Kontrolli terminalis, et mõlemad töötavad (kumbki peab näitama versiooninumbrit):

```powershell
git --version
```

```powershell
node -v
```

5. Lae projekt oma arvutisse (tee ainult üks kord):

```powershell
git clone https://github.com/andreasmaas123/joulupuu.git
```

6. Ütle Gitile, kes sa oled (ainult selle projekti jaoks, kirjuta oma nimi ja e-post):

```powershell
git config user.name "Sinu Nimi"
```

```powershell
git config user.email "sinu@epost.ee"
```

7. Ava Claude'is kaust `joulupuu`. Claude loeb ise faili `CLAUDE.md` ja saab aru, mis projekt see on.

### Iga kord, kui töötad: pull → töö → commit → push

| Samm | Mida see teeb | Mida kirjutad |
|---|---|---|
| **1. Pull** | Toob teiste tehtud muudatused sinu arvutisse | `git pull` |
| **2. Töö** | Muudad Claude'iga | Ütle Claude'ile, mida tahad |
| **3. Testi** | Vaatad, kas töötab | `npx serve -l 3000 .` ja ava `http://localhost:3000` |
| **4. Commit** | Salvestad muudatuse oma arvutis | Ütle Claude'ile: "tee commit" |
| **5. Push** | Saadad muudatuse GitHubi (teised näevad) | `git push` |

**Kuhu käsud kirjutada?** Kaks võimalust, kasuta kumba tahad:
- **Claude'i vestlusse tavalise lausena:** "tee git pull", "tee commit", "tee git push". Claude käivitab käsu sinu eest.
- **Terminali** (Claude'i rakenduses on Terminal-paneel, või Windowsi PowerShell), kui oled projekti kaustas `joulupuu`.

Käsud eraldi, kui tahad neid ise kirjutada:

```powershell
git pull
```

```powershell
git push
```

**Esimesel `git push`-il** avaneb brauseriaken: logi sisse oma GitHubi kontoga. Pärast seda jääb see meelde.

---

## Neli reeglit, et midagi ei läheks katki

1. **Alati `pull` enne tööd.** Muidu töötad vana versiooni peal.
2. **Alati testi enne `push`-i.** Pärast `push`-i muutub avalik leht umbes minuti pärast, ja keegi näeb vigu.
3. **Muuda ainult oma tiimi andmeid.** Nii ei lähe kaks inimest samas kohas vastuollu.
4. **Ära kustuta ega nimeta ümber faile**, mida teised kasutavad (`data/`, `sisu/`), ilma haldajaga rääkimata.

### Mis on "konflikt"?
Kui kaks inimest muudavad **sama faili sama kohta**, ütleb Git `pull` või `push` ajal, et on konflikt. Ära paanitse. Ütle Claude'ile: *"Git ütles, et on konflikt. Aita see lahendada ja ära kaota kummagi tööd."*

---

## Kust midagi leida

| Mida soovid muuta | Fail |
|---|---|
| Andmed | `data/*.csv` (juhend: `data/SCHEMA.md`) |
| Tekstid lehel (Meist, tutvustuskaardid) | `sisu/*.html` (juhend on faili alguses) |
| Välimus | `style.css` |
| Lehe käitumine | `app.js` |
| Lehe struktuur ja menüü | `index.html` |
| Projekti kirjeldus Claude'ile | `CLAUDE.md` |

## Kui jääd hätta
Küsi oma Claude'ilt (ta teab projekti `CLAUDE.md` kaudu) või projekti haldajalt Andreasilt.

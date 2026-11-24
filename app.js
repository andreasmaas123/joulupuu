// Jõulupuu gloobus – esimene versioon: gloobus, värvid, pop-up.
// Kõik andmed loetakse data/ kaustast, midagi pole siia sisse kirjutatud.

const YEAR = 2025;                 // praegu kindel aasta (ajaliugur tuleb hiljem)
const MISSING = 'andmed puuduvad'; // tekst puuduva väärtuse jaoks
const NO_DATA_COLOR = '#24323f';

const $ = (id) => document.getElementById(id);

// --- Abifunktsioonid ---------------------------------------------------

// Tühi lahter -> null, muidu arv
function toNumber(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clean(v) {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
}

function fmt(n) {
  return n.toLocaleString('et-EE');
}

function readCsv(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err),
    });
  });
}

// Värv: tume roheline -> hele roheline. sqrt-skaala, et väiksemad riigid ei jääks nähtamatuks.
const C_LOW = [31, 77, 54];
const C_HIGH = [182, 240, 192];
function colorFor(total, max) {
  if (total === null) return NO_DATA_COLOR;
  const t = Math.sqrt(Math.max(0, total) / max);
  const c = C_LOW.map((lo, i) => Math.round(lo + (C_HIGH[i] - lo) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Riigi ligikaudne keskpunkt (suurima piirkonna välisringi piirkasti keskkoht)
function centerOf(feature) {
  const g = feature.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  let best = polys[0];
  for (const p of polys) if (p[0].length > best[0].length) best = p;
  const lons = best[0].map((c) => c[0]);
  const lats = best[0].map((c) => c[1]);
  return {
    lng: (Math.min(...lons) + Math.max(...lons)) / 2,
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
  };
}

// --- Pop-up --------------------------------------------------------------

function setValue(el, text) {
  el.textContent = text ?? MISSING;
  el.classList.toggle('missing', text === null || text === undefined);
}

function showImage(url, alt) {
  const box = $('popup-image');
  box.textContent = '';
  // Lubame ainult https-aadressid
  if (url && /^https:\/\//i.test(url)) {
    const img = document.createElement('img');
    img.alt = alt;
    img.onerror = () => { box.textContent = 'pilt puudub'; };
    img.src = url;
    box.appendChild(img);
  } else {
    box.textContent = 'pilt puudub';
  }
}

function openPopup(feature, row) {
  const p = feature.properties;
  const name = (row && row.country_et) || p.NAME_ET || p.NAME;
  $('popup-name').textContent = name;
  setValue($('p-live'), row && row.live !== null ? fmt(row.live) + ' tk' : null);
  setValue($('p-art'), row && row.art !== null ? fmt(row.art) + ' tk' : null);
  setValue($('p-species'), row ? row.species : null);
  setValue($('p-fact'), row ? row.fact : null);
  setValue($('p-source'), row ? row.source : null);
  showImage(row ? row.image : null, name);
  $('popup').hidden = false;
}

// --- Käivitus ------------------------------------------------------------

async function init() {
  const status = $('status');
  let geo, rows;
  try {
    const [geoRes, csv] = await Promise.all([
      fetch('data/world.geojson').then((r) => {
        if (!r.ok) throw new Error('world.geojson');
        return r.json();
      }),
      readCsv('data/countries.csv'),
    ]);
    geo = geoRes;
    rows = csv;
  } catch (e) {
    status.textContent = 'Andmete laadimine ebaõnnestus. Kas leht avati kohaliku serveri kaudu (mitte faili otse)?';
    status.classList.add('error');
    console.error(e);
    return;
  }
  status.remove();

  // Valitud aasta read, võtmeks riigikood (ADM0_A3 = CSV veerg iso3)
  const byIso = {};
  let usesTestData = false;
  for (const r of rows) {
    if (toNumber(r.year) !== YEAR) continue;
    const iso = clean(r.iso3)?.toUpperCase();
    if (!iso) continue;
    const live = toNumber(r.live_trees);
    const art = toNumber(r.artificial_trees);
    if (clean(r.source) === 'TESTANDMED') usesTestData = true;
    byIso[iso] = {
      country_et: clean(r.country_et),
      live, art,
      total: live === null && art === null ? null : (live ?? 0) + (art ?? 0),
      species: clean(r.main_species),
      fact: clean(r.top_fact),
      image: clean(r.image_url),
      source: clean(r.source),
    };
  }

  const totals = Object.values(byIso).map((r) => r.total).filter((t) => t !== null);
  const max = Math.max(...totals, 1);

  const features = geo.features.filter((f) => f.properties.ADM0_A3 !== 'ATA');
  const rowOf = (f) => byIso[f.properties.ADM0_A3] || null;

  // Legend
  $('legend-year').textContent = YEAR;
  $('legend-max').textContent = fmt(max);
  $('legend').hidden = false;
  $('testbadge').hidden = !usesTestData;

  // Gloobus
  let hovered = null;
  let selected = null;
  const el = $('globe');
  const globe = Globe()(el)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#4f7fe0')
    .atmosphereAltitude(0.18)
    .polygonsData(features)
    .polygonCapColor((f) => (f === hovered || f === selected)
      ? '#f3d98b'
      : colorFor(rowOf(f)?.total ?? null, max))
    .polygonSideColor(() => 'rgba(10, 30, 60, 0.6)')
    .polygonStrokeColor(() => '#0a1d3d')
    .polygonAltitude((f) => (f === hovered || f === selected ? 0.04 : 0.012))
    .polygonsTransitionDuration(200)
    .polygonLabel((f) => {
      const r = rowOf(f);
      const name = (r && r.country_et) || f.properties.NAME_ET || f.properties.NAME;
      const total = r && r.total !== null ? fmt(r.total) + ' puud kokku' : MISSING;
      return `<div class="tip"><b>${name.replace(/</g, '&lt;')}</b><br>${total}</div>`;
    })
    .onPolygonHover((f) => {
      hovered = f;
      el.style.cursor = f ? 'pointer' : 'grab';
      refresh();
    })
    .onPolygonClick((f) => {
      selected = f;
      refresh();
      openPopup(f, rowOf(f));
      globe.pointOfView({ ...centerOf(f), altitude: 1.8 }, 900);
    });

  // Gloobuse pind tumesinine
  const mat = globe.globeMaterial();
  mat.color.set('#0a1f4d');
  mat.emissive.set('#06143a');
  mat.shininess = 5;

  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.35;
  // Pöörlemine peatub, kui kasutaja gloobust puudutab
  globe.controls().addEventListener('start', () => { globe.controls().autoRotate = false; });

  function refresh() {
    // globe.gl uuendab värve, kui accessor'id uuesti anda
    globe.polygonCapColor(globe.polygonCapColor())
         .polygonAltitude(globe.polygonAltitude());
  }

  function resize() { globe.width(window.innerWidth).height(window.innerHeight); }
  window.addEventListener('resize', resize);
  resize();

  $('popup-close').addEventListener('click', () => {
    $('popup').hidden = true;
    selected = null;
    refresh();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('popup-close').click();
  });
}

init();

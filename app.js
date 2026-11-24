// Jõulupuu gloobus: riigid, kaared (vood), ajaliugur ja pop-upid.
// Kõik andmed loetakse data/ kaustast, midagi pole siia sisse kirjutatud.

const MISSING = 'andmed puuduvad'; // tekst puuduva väärtuse jaoks
const NO_DATA_COLOR = '#24323f';
const PLAY_MS = 1800;              // mitu ms ühe aasta kohta esituses

const ARC_COLORS = { live: '#6df08a', artificial: '#ff5a5a', material: '#f3c969' };
const TYPE_NAMES = { live: 'Elusad puud', artificial: 'Kunstpuud', material: 'Materjal' };

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

const fmt = (n) => n.toLocaleString('et-EE');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

// --- Pop-upid ------------------------------------------------------------

function setValue(el, text) {
  el.textContent = text ?? MISSING;
  el.classList.toggle('missing', text === null || text === undefined);
}

function setYearLine(el, year, forecast) {
  el.textContent = forecast ? `${year} · prognoos` : String(year);
  el.classList.toggle('forecast', !!forecast);
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

// --- Käivitus ------------------------------------------------------------

async function init() {
  const status = $('status');
  let geo, countryRows, flowRows;
  try {
    const [geoRes, csv] = await Promise.all([
      fetch('data/world.geojson').then((r) => {
        if (!r.ok) throw new Error('world.geojson');
        return r.json();
      }),
      readCsv('data/countries.csv'),
    ]);
    geo = geoRes;
    countryRows = csv;
  } catch (e) {
    status.textContent = 'Andmete laadimine ebaõnnestus. Kas leht avati kohaliku serveri kaudu (mitte faili otse)?';
    status.classList.add('error');
    console.error(e);
    return;
  }
  // Vood on lisa: kui faili pole, näitame gloobust ilma kaarteta
  try {
    flowRows = await readCsv('data/flows.csv');
  } catch (e) {
    console.warn('flows.csv laadimine ebaõnnestus, kaari ei näidata', e);
    flowRows = [];
  }
  status.remove();

  let usesTestData = false;
  const forecastYears = new Set();
  const yearSet = new Set();

  // Riigid: byYear[aasta][iso3]
  const byYear = {};
  const names = {};
  for (const r of countryRows) {
    const year = toNumber(r.year);
    const iso = clean(r.iso3)?.toUpperCase();
    if (year === null || !iso) continue;
    yearSet.add(year);
    if (String(r.is_forecast).trim().toLowerCase() === 'true') forecastYears.add(year);
    if (clean(r.source) === 'TESTANDMED') usesTestData = true;
    const live = toNumber(r.live_trees);
    const art = toNumber(r.artificial_trees);
    names[iso] = names[iso] || clean(r.country_et);
    (byYear[year] ||= {})[iso] = {
      country_et: clean(r.country_et),
      live, art,
      total: live === null && art === null ? null : (live ?? 0) + (art ?? 0),
      species: clean(r.main_species),
      fact: clean(r.top_fact),
      image: clean(r.image_url),
      source: clean(r.source),
    };
  }

  // Vood: flowsByYear[aasta] = [...]
  const flowsByYear = {};
  const maxVolume = {}; // suurim maht ühiku kohta (kõigi aastate peale, et paksused oleksid võrreldavad)
  for (const r of flowRows) {
    const year = toNumber(r.year);
    const from = clean(r.from_iso3)?.toUpperCase();
    const to = clean(r.to_iso3)?.toUpperCase();
    const type = clean(r.tree_type)?.toLowerCase();
    if (year === null || !from || !to || !TYPE_NAMES[type]) continue;
    yearSet.add(year);
    if (clean(r.source) === 'TESTANDMED') usesTestData = true;
    const volume = toNumber(r.volume);
    const unit = clean(r.unit);
    if (volume !== null) maxVolume[unit] = Math.max(maxVolume[unit] || 0, volume);
    (flowsByYear[year] ||= []).push({
      from, to, year, type, volume, unit,
      material: clean(r.material), note: clean(r.note), source: clean(r.source),
    });
  }

  const years = [...yearSet].sort((a, b) => a - b);
  if (!years.length) {
    status.textContent = 'Andmefailides pole ühtegi aastat.';
    return;
  }
  // Riigi koguarvude suurim väärtus kõigi aastate peale, et värvid oleksid aastate vahel võrreldavad
  const allTotals = Object.values(byYear).flatMap((o) => Object.values(o)).map((r) => r.total).filter((t) => t !== null);
  const maxTotal = Math.max(...allTotals, 1);

  const features = geo.features.filter((f) => f.properties.ADM0_A3 !== 'ATA');
  const featureByIso = Object.fromEntries(features.map((f) => [f.properties.ADM0_A3, f]));
  const centers = {};
  for (const f of features) centers[f.properties.ADM0_A3] = centerOf(f);

  const nameOfIso = (iso) => names[iso] || featureByIso[iso]?.properties.NAME || iso;

  // Olek
  let year = years.find((y) => !forecastYears.has(y)) ?? years[0];
  let hovered = null;
  let selected = null;
  let selectedFlow = null;
  const rowOf = (f) => byYear[year]?.[f.properties.ADM0_A3] || null;

  // --- Gloobus ---
  const el = $('globe');
  const globe = Globe()(el)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#4f7fe0')
    .atmosphereAltitude(0.18)
    .polygonsData(features)
    .polygonCapColor((f) => (f === hovered || f === selected)
      ? '#f3d98b'
      : colorFor(rowOf(f)?.total ?? null, maxTotal))
    .polygonSideColor(() => 'rgba(10, 30, 60, 0.6)')
    .polygonStrokeColor(() => '#0a1d3d')
    .polygonAltitude((f) => (f === hovered || f === selected ? 0.04 : 0.012))
    .polygonsTransitionDuration(200)
    .polygonLabel((f) => {
      const r = rowOf(f);
      const name = (r && r.country_et) || nameOfIso(f.properties.ADM0_A3);
      const total = r && r.total !== null ? fmt(r.total) + ' puud kokku' : MISSING;
      return `<div class="tip"><b>${esc(name)}</b><br>${total}</div>`;
    })
    .onPolygonHover((f) => {
      hovered = f;
      el.style.cursor = f ? 'pointer' : 'grab';
      refresh();
    })
    .onPolygonClick((f) => {
      selected = f;
      closeFlow();
      refresh();
      renderCountryPopup();
      globe.pointOfView({ ...centerOf(f), altitude: 1.8 }, 900);
    })
    // Kaared
    .arcColor((d) => [ARC_COLORS[d.type], ARC_COLORS[d.type]])
    .arcStroke((d) => {
      const max = maxVolume[d.unit];
      if (d.volume === null || !max) return 0.4;
      // Alammäär on piisavalt paks, et kaarele oleks hiirega võimalik klikkida
      return 0.4 + 1.1 * Math.sqrt(d.volume / max);
    })
    .arcDashLength((d) => (d.forecast ? 0.35 : 1))
    .arcDashGap((d) => (d.forecast ? 0.2 : 0))
    .arcDashAnimateTime((d) => (d.forecast ? 4000 : 0))
    .arcAltitudeAutoScale(0.45)
    .arcsTransitionDuration(0)
    .arcLabel((d) => {
      const vol = d.volume !== null ? `${fmt(d.volume)} ${esc(d.unit || '')}` : MISSING;
      return `<div class="tip"><b>${esc(nameOfIso(d.from))} → ${esc(nameOfIso(d.to))}</b><br>`
        + `${TYPE_NAMES[d.type]}${d.material ? ' (' + esc(d.material) + ')' : ''}<br>${vol}</div>`;
    })
    .onArcHover((d) => { el.style.cursor = d ? 'pointer' : 'grab'; })
    .onArcClick((d) => {
      selected = null;
      $('popup').hidden = true;
      selectedFlow = d;
      refresh();
      renderFlowPopup();
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

  // --- Riigi pop-up ---
  function renderCountryPopup() {
    if (!selected) return;
    const row = rowOf(selected);
    const iso = selected.properties.ADM0_A3;
    const name = (row && row.country_et) || nameOfIso(iso);
    $('popup-name').textContent = name;
    setYearLine($('popup-year'), year, forecastYears.has(year));
    setValue($('p-live'), row && row.live !== null ? fmt(row.live) + ' tk' : null);
    setValue($('p-art'), row && row.art !== null ? fmt(row.art) + ' tk' : null);
    setValue($('p-species'), row ? row.species : null);
    setValue($('p-fact'), row ? row.fact : null);
    setValue($('p-source'), row ? row.source : null);
    showImage(row ? row.image : null, name);
    $('popup').hidden = false;
  }

  function closeCountry() {
    $('popup').hidden = true;
    selected = null;
    refresh();
  }

  // --- Voo pop-up ---
  function renderFlowPopup() {
    const d = selectedFlow;
    if (!d) return;
    $('flow-title').textContent = `${nameOfIso(d.from)} → ${nameOfIso(d.to)}`;
    setYearLine($('flow-year'), d.year, forecastYears.has(d.year));
    setValue($('f-type'), TYPE_NAMES[d.type] + (d.material ? ' (' + d.material + ')' : ''));
    setValue($('f-volume'), d.volume !== null ? `${fmt(d.volume)} ${d.unit || ''}`.trim() : null);
    setValue($('f-note'), d.note);
    setValue($('f-source'), d.source);
    $('flow-popup').hidden = false;
  }

  function closeFlow() {
    $('flow-popup').hidden = true;
    selectedFlow = null;
  }

  $('popup-close').addEventListener('click', closeCountry);
  $('flow-close').addEventListener('click', closeFlow);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCountry(); closeFlow(); }
  });

  // --- Aasta valimine ---
  function setYear(y) {
    year = y;
    const forecast = forecastYears.has(y);

    $('time-year').textContent = y;
    $('time-badge').hidden = !forecast;
    $('time-range').value = years.indexOf(y);
    $('legend-year').textContent = forecast ? `${y} (prognoos)` : y;

    // Kaared selle aasta kohta; need, mille otspunkti asukohta ei leia, jätame välja
    const arcs = (flowsByYear[y] || [])
      .filter((f) => {
        const ok = centers[f.from] && centers[f.to];
        if (!ok) console.warn('Voo riigikoodi ei leitud kaardilt:', f.from, f.to);
        return ok;
      })
      .map((f) => ({
        ...f,
        forecast,
        startLat: centers[f.from].lat, startLng: centers[f.from].lng,
        endLat: centers[f.to].lat, endLng: centers[f.to].lng,
      }));
    globe.arcsData(arcs)
         .arcStartLat('startLat').arcStartLng('startLng')
         .arcEndLat('endLat').arcEndLng('endLng');

    // Avatud voo pop-up: leia sama vool uuel aastal või sulge
    if (selectedFlow) {
      const s = selectedFlow;
      selectedFlow = arcs.find((a) => a.from === s.from && a.to === s.to && a.type === s.type
        && a.material === s.material) || null;
      if (selectedFlow) renderFlowPopup(); else closeFlow();
    }
    renderCountryPopup();
    refresh();
  }

  // --- Ajaliugur ---
  const range = $('time-range');
  range.max = years.length - 1;
  range.addEventListener('input', () => { stopPlay(); setYear(years[Number(range.value)]); });
  $('time-ticks').replaceChildren(...years.map((y) => {
    const s = document.createElement('span');
    s.textContent = y;
    if (forecastYears.has(y)) s.className = 'forecast';
    return s;
  }));

  let timer = null;
  function stopPlay() {
    clearInterval(timer);
    timer = null;
    $('play').textContent = '▶';
    $('play').setAttribute('aria-label', 'Esita aastad');
  }
  $('play').addEventListener('click', () => {
    if (timer) { stopPlay(); return; }
    $('play').textContent = '❚❚';
    $('play').setAttribute('aria-label', 'Peata');
    if (year === years[years.length - 1]) setYear(years[0]);
    timer = setInterval(() => {
      const i = years.indexOf(year);
      if (i >= years.length - 1) { stopPlay(); return; }
      setYear(years[i + 1]);
    }, PLAY_MS);
  });
  // Ühe aasta andmete puhul pole liugurit vaja
  $('timebar').hidden = years.length < 2;

  // --- Legend ja esimene joonistus ---
  $('legend-max').textContent = fmt(maxTotal);
  $('legend').hidden = false;
  $('testbadge').hidden = !usesTestData;
  setYear(year);
}

init();

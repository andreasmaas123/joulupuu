// Jõulupuu gloobus: riigid, kaared (vood), ajaliugur ja pop-upid.
// Kõik andmed loetakse data/ kaustast, midagi pole siia sisse kirjutatud.

const MISSING = 'andmed puuduvad'; // tekst puuduva väärtuse jaoks
const NO_DATA_COLOR = '#24323f';

const ARC_COLORS = { live: '#6df08a', artificial: '#ff5a5a', material: '#f3c969' };
const TYPE_NAMES = { live: 'Elusad puud', artificial: 'Kunstpuud', material: 'Materjal' };

// Lüliti: milliseid puid näidata. Materjalivood kuuluvad kunstpuude alla (nende tootmise sisend).
const MODE_LABELS = { both: 'Jõulupuid kokku', live: 'Elusaid puid', artificial: 'Kunstpuid' };
const MODE_UNITS = { both: 'puud kokku', live: 'elusat puud', artificial: 'kunstpuud' };
const MODE_FLOW_TYPES = {
  both: ['live', 'artificial', 'material'],
  live: ['live'],
  artificial: ['artificial', 'material'],
};

// Farmid ja tehased (places.csv). `mode` = millise lüliti valikuga need nähtavad on.
const PLACE_TYPES = {
  farm: { name: 'Puufarm', icon: 'ico-tree', view: '0 0 32 40', mode: 'live' },
  factory: { name: 'Kunstpuutehas', icon: 'ico-house', view: '0 0 40 36', mode: 'artificial' },
};
// Faktide kategooriad, mida igas režiimis näidatakse (üldised faktid alati)
const MODE_FACT_CATS = {
  both: ['live', 'artificial', 'general'],
  live: ['live', 'general'],
  artificial: ['artificial', 'general'],
};

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

function showImage(url, alt, credit) {
  const box = $('popup-image');
  box.textContent = '';
  // Lubame ainult https-aadressid
  if (url && /^https:\/\//i.test(url)) {
    const img = document.createElement('img');
    img.alt = alt;
    img.onerror = () => { box.textContent = 'pilt puudub'; };
    img.src = url;
    box.appendChild(img);
    if (credit) {
      const c = document.createElement('span');
      c.className = 'img-credit';
      c.textContent = credit;
      box.appendChild(c);
    }
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
  // Farmid ja faktid on samuti lisa: kui faili pole, jääb see osa lihtsalt tühjaks
  let placeRows = [];
  let factRows = [];
  try { placeRows = await readCsv('data/places.csv'); } catch (e) { console.warn('places.csv puudub', e); }
  try { factRows = await readCsv('data/facts.csv'); } catch (e) { console.warn('facts.csv puudub', e); }
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
      growing: clean(r.live_growing_process),
      trend: clean(r.live_trend),
      production: toNumber(r.artificial_production),
      material: clean(r.artificial_material),
      footprint: clean(r.artificial_footprint),
      disposal: clean(r.artificial_disposal),
      fact: clean(r.top_fact),
      image: clean(r.image_url),
      source: clean(r.source),
    };
  }

  // Faktid: factsByIso[iso3] = [{category, fact, image, credit, source}]
  const factsByIso = {};
  for (const r of factRows) {
    const iso = clean(r.iso3)?.toUpperCase();
    const fact = clean(r.fact);
    if (!iso || !fact) continue;
    if (clean(r.source) === 'TESTANDMED') usesTestData = true;
    const cat = clean(r.category)?.toLowerCase();
    (factsByIso[iso] ||= []).push({
      category: ['live', 'artificial'].includes(cat) ? cat : 'general',
      fact, image: clean(r.image_url), credit: clean(r.image_credit), source: clean(r.source),
    });
  }

  // Farmid ja tehased: placeRowsByKey[võti] = read eri aastate kohta.
  // Igal aastal näitame kõige uuemat rida, mis ei ole sellest aastast uuem (või aastata rida).
  const placeGroups = {};
  for (const r of placeRows) {
    const lat = toNumber(r.lat);
    const lng = toNumber(r.lng);
    const type = clean(r.place_type)?.toLowerCase();
    const name = clean(r.name);
    if (lat === null || lng === null || !PLACE_TYPES[type] || !name) {
      console.warn('places.csv rida jäeti vahele (puudub nimi, tüüp või koordinaat):', r);
      continue;
    }
    if (clean(r.source) === 'TESTANDMED') usesTestData = true;
    const iso = clean(r.iso3)?.toUpperCase() || null;
    const key = [name, iso, lat, lng, type].join('|');
    (placeGroups[key] ||= []).push({
      name, type, iso, lat, lng,
      product: clean(r.product), volume: toNumber(r.volume), unit: clean(r.unit),
      year: toNumber(r.year), note: clean(r.note), source: clean(r.source),
    });
  }
  const placeList = Object.values(placeGroups);
  for (const g of placeList) g.forEach((p) => { if (p.year !== null) yearSet.add(p.year); });
  function placesForYear(y) {
    const out = [];
    for (const g of placeList) {
      const sorted = g.filter((p) => p.year === null || p.year <= y)
        .sort((a, b) => (a.year ?? -Infinity) - (b.year ?? -Infinity));
      if (sorted.length) out.push(sorted[sorted.length - 1]);
    }
    return out;
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
  const allRows = Object.values(byYear).flatMap((o) => Object.values(o));
  const valueFor = (r, m) => (!r ? null : m === 'live' ? r.live : m === 'artificial' ? r.art : r.total);
  const maxByMode = {};
  for (const m of Object.keys(MODE_LABELS)) {
    maxByMode[m] = Math.max(...allRows.map((r) => valueFor(r, m)).filter((t) => t !== null), 1);
  }

  const features = geo.features.filter((f) => f.properties.ADM0_A3 !== 'ATA');
  const featureByIso = Object.fromEntries(features.map((f) => [f.properties.ADM0_A3, f]));
  const centers = {};
  for (const f of features) centers[f.properties.ADM0_A3] = centerOf(f);

  const nameOfIso = (iso) => names[iso] || featureByIso[iso]?.properties.NAME || iso;

  // Olek
  let year = years.find((y) => !forecastYears.has(y)) ?? years[0];
  let mode = 'both';
  let showChains = false; // põhivaade: ainult gloobus, tarneahelad (kaared ja punktid) peidus
  let hovered = null;
  let selected = null;
  let selectedFlow = null;
  let selectedPlace = null;
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
      : colorFor(valueFor(rowOf(f), mode), maxByMode[mode]))
    .polygonSideColor(() => 'rgba(10, 30, 60, 0.6)')
    .polygonStrokeColor(() => '#0a1d3d')
    .polygonAltitude((f) => (f === hovered || f === selected ? 0.04 : 0.012))
    .polygonsTransitionDuration(200)
    .polygonLabel((f) => {
      const r = rowOf(f);
      const name = (r && r.country_et) || nameOfIso(f.properties.ADM0_A3);
      const v = valueFor(r, mode);
      const total = v !== null ? `${fmt(v)} ${MODE_UNITS[mode]}` : MISSING;
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
      closePlace();
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
      closePlace();
      selectedFlow = d;
      refresh();
      renderFlowPopup();
    })
    // Farmid (kuusekesed) ja tehased (jõulumajad) HTML-markeritena
    .htmlLat('lat').htmlLng('lng')
    .htmlAltitude(0.01)
    .htmlTransitionDuration(0)
    .htmlElement((d) => makeMarker(d))
    // Gloobuse taha jäävad markerid peidame
    .htmlElementVisibilityModifier((node, visible) => {
      node.style.opacity = visible ? '1' : '0';
      node.style.pointerEvents = visible ? 'auto' : 'none';
    });

  function makeMarker(d) {
    const t = PLACE_TYPES[d.type];
    const node = document.createElement('div');
    node.className = `marker ${d.type}`;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${t.name}: ${d.name}`);
    node.title = `${d.name} · ${t.name}${d.volume !== null ? ' · ' + fmt(d.volume) + ' ' + (d.unit || '') : ''}`;
    node.innerHTML = `<svg viewBox="${t.view}" aria-hidden="true"><use href="#${t.icon}"/></svg>`;
    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selected = null;
      $('popup').hidden = true;
      closeFlow();
      selectedPlace = d;
      refresh();
      renderPlacePopup();
    });
    return node;
  }

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
    const tk = (n) => (n !== null && n !== undefined ? fmt(n) + ' tk' : null);

    // Lülitiga valitud tüübi lõigud
    $('sec-live').hidden = mode === 'artificial';
    $('sec-art').hidden = mode === 'live';
    setValue($('p-live'), tk(row?.live));
    setValue($('p-species'), row?.species);
    setValue($('p-growing'), row?.growing);
    setValue($('p-trend'), row?.trend);
    setValue($('p-art'), tk(row?.art));
    setValue($('p-production'), tk(row?.production));
    setValue($('p-material'), row?.material);
    setValue($('p-footprint'), row?.footprint);
    setValue($('p-disposal'), row?.disposal);
    setValue($('p-source'), row?.source);

    // Faktid: riigi enda fakt (countries.csv) + facts.csv read valitud kategooriatest
    const facts = [];
    if (row?.fact) facts.push({ fact: row.fact });
    const cats = MODE_FACT_CATS[mode];
    for (const f of factsByIso[iso] || []) {
      if (cats.includes(f.category) && !facts.some((x) => x.fact === f.fact)) facts.push(f);
    }
    const list = $('p-facts');
    list.replaceChildren(...(facts.length ? facts : [{ fact: MISSING, missing: true }]).map((f) => {
      const li = document.createElement('li');
      li.textContent = f.fact;
      if (f.missing) li.className = 'missing';
      return li;
    }));

    // Pilt: riigi oma pilt, muidu esimene faktipilt
    const withImage = (factsByIso[iso] || []).find((f) => f.image);
    if (row?.image) showImage(row.image, name);
    else if (withImage) showImage(withImage.image, name, withImage.credit);
    else showImage(null, name);
    $('popup').hidden = false;
  }

  // --- Farmi / tehase pop-up ---
  function renderPlacePopup() {
    const d = selectedPlace;
    if (!d) return;
    $('place-title').textContent = d.name;
    $('place-year').textContent = d.year !== null ? `Andmed: ${d.year}` : '';
    $('place-year').classList.toggle('forecast', d.year !== null && forecastYears.has(d.year));
    setValue($('pl-type'), PLACE_TYPES[d.type].name);
    setValue($('pl-country'), d.iso ? nameOfIso(d.iso) : null);
    setValue($('pl-product'), d.product);
    setValue($('pl-volume'), d.volume !== null ? `${fmt(d.volume)} ${d.unit || ''}`.trim() : null);
    setValue($('pl-note'), d.note);
    setValue($('pl-source'), d.source);
    $('place-popup').hidden = false;
  }

  function closePlace() {
    $('place-popup').hidden = true;
    selectedPlace = null;
  }

  // Punktid valitud aasta ja lüliti järgi
  function renderPoints() {
    const visible = (showChains ? placesForYear(year) : []).filter((p) => mode === 'both' || PLACE_TYPES[p.type].mode === mode);
    globe.htmlElementsData(visible);
    if (selectedPlace) {
      const s = selectedPlace;
      selectedPlace = visible.find((p) => p.name === s.name && p.lat === s.lat && p.lng === s.lng
        && p.type === s.type) || null;
      if (selectedPlace) renderPlacePopup(); else closePlace();
    }
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
  $('place-close').addEventListener('click', closePlace);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCountry(); closeFlow(); closePlace(); }
  });

  // --- Aasta valimine ---
  function setYear(y) {
    year = y;
    const forecast = forecastYears.has(y);

    $('time-year').textContent = y;
    $('time-badge').hidden = !forecast;
    $('time-range').value = years.indexOf(y);
    $('legend-year').textContent = forecast ? `${y} (prognoos)` : y;

    renderArcs();
    renderPoints();
    renderCountryPopup();
    refresh();
  }

  // Kaared valitud aasta ja lüliti järgi; need, mille otspunkti asukohta ei leia, jätame välja
  function renderArcs() {
    const forecast = forecastYears.has(year);
    const types = MODE_FLOW_TYPES[mode];
    const arcs = (showChains ? flowsByYear[year] || [] : [])
      .filter((f) => types.includes(f.type))
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

    // Avatud voo pop-up: leia sama vool uuesti või sulge
    if (selectedFlow) {
      const s = selectedFlow;
      selectedFlow = arcs.find((a) => a.from === s.from && a.to === s.to && a.type === s.type
        && a.material === s.material) || null;
      if (selectedFlow) renderFlowPopup(); else closeFlow();
    }
  }

  // --- Vaade: avaleht ('both'), tehispuu tarneahel ('artificial'), loodusliku puu tarneahel ('live') ---
  // Avalehel (mode = 'both') on puhas gloobus: ainult riikide värvid ja pop-up faktidega.
  function setMode(m) {
    mode = m;
    showChains = m !== 'both';
    $('legend-label').textContent = MODE_LABELS[m];
    $('legend-max').textContent = fmt(maxByMode[m]);
    // Legendis ainult valitud tarneahela read
    document.querySelector('.legend-arcs').hidden = !showChains;
    for (const d of document.querySelectorAll('.legend-arcs [data-for]')) d.hidden = d.dataset.for !== m;
    renderArcs();
    renderPoints();
    renderCountryPopup();
    refresh();
  }

  // --- Menüü ja lehtede vahetus (aadressi #-osa: #/, #/tehispuu, #/loodus, #/meist) ---
  const ROUTES = { avaleht: 'both', tehispuu: 'artificial', loodus: 'live', meist: null };
  const contentCache = {};
  const dismissedCards = new Set();
  let routeToken = 0;

  // Loeb sisu/<nimi>.html. Tagastab DocumentFragmendi või null, kui fail puudub või on tühi.
  async function loadContent(name) {
    if (!(name in contentCache)) {
      let html = '';
      try {
        const r = await fetch(`sisu/${name}.html`);
        if (r.ok) html = await r.text();
      } catch (e) { console.warn('Sisu laadimine ebaõnnestus:', name, e); }
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      tpl.content.querySelectorAll('script').forEach((s) => s.remove());
      const empty = !tpl.content.textContent.trim() && !tpl.content.querySelector('img');
      contentCache[name] = empty ? null : tpl.content;
    }
    return contentCache[name];
  }

  const routeName = () => {
    const n = location.hash.replace(/^#\/?/, '');
    return n in ROUTES ? n : 'avaleht';
  };

  // --- Avalehe sissejuhatus: suur pealkiri, gloobus ilmub scrollides sujuvalt ---
  const scroller = $('scroller');
  const hero = $('hero');
  let homeActive = false;
  let ticking = false;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const FINAL_ALTITUDE = 2.5;

  function applyProgress() {
    if (!homeActive) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? clamp01(scroller.scrollTop / max) : 1;
    const g = easeOut(clamp01((p - 0.25) / 0.65)); // gloobuse esiletulek

    hero.style.opacity = String(1 - clamp01(p * 1.7));
    hero.style.transform = `translateY(${-p * 90}px) scale(${1 + p * 0.12})`;

    el.style.opacity = String(g);
    el.style.transform = g >= 1 ? '' : `translateY(${(1 - g) * 10}vh) scale(${0.78 + 0.22 * g})`;
    globe.pointOfView({ altitude: 4.4 - (4.4 - FINAL_ALTITUDE) * g }, 0);

    document.body.style.setProperty('--ui', String(clamp01((p - 0.8) / 0.2)));
    document.body.classList.toggle('intro', p < 0.98);
    // Kui gloobus on täielikult nähtav, annab scroller hiirelt gloobusele kontrolli
    scroller.style.pointerEvents = p >= 0.995 ? 'none' : 'auto';
    $('to-top').hidden = p < 0.98;
  }

  function enterHome() {
    if (homeActive) return;
    homeActive = true;
    document.body.classList.add('home', 'intro');
    hero.hidden = false;
    scroller.hidden = false;
    scroller.scrollTop = 0;
    applyProgress();
  }

  function leaveHome() {
    homeActive = false;
    document.body.classList.remove('home', 'intro');
    hero.hidden = true;
    scroller.hidden = true;
    for (const prop of ['opacity', 'transform']) { el.style[prop] = ''; hero.style[prop] = ''; }
    document.body.style.removeProperty('--ui');
    $('to-top').hidden = true;
    globe.pointOfView({ altitude: FINAL_ALTITUDE }, 600);
  }

  scroller.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; applyProgress(); });
  });
  window.addEventListener('resize', applyProgress);
  const toTop = () => scroller.scrollTo({ top: 0, behavior: 'smooth' });
  $('to-top').addEventListener('click', toTop);
  // "Avaleht" menüüs viib gloobuse juurest tagasi pealkirjani
  document.querySelector('#nav a[data-route="avaleht"]').addEventListener('click', () => {
    if (homeActive && routeName() === 'avaleht') toTop();
  });

  async function route() {
    const name = routeName();
    const token = ++routeToken;
    for (const a of document.querySelectorAll('#nav a')) {
      if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const frag = await loadContent(name);
    if (token !== routeToken) return; // vahepeal vajutati mujale

    const isMeist = name === 'meist';
    document.body.classList.toggle('on-meist', isMeist);
    if (name === 'avaleht') enterHome(); else leaveHome();
    if (isMeist) {
      closeCountry(); closeFlow(); closePlace();
      globe.pauseAnimation(); // säästab arvuti jõudu, kui gloobust pole näha
      let content;
      if (frag) content = frag.cloneNode(true);
      else { content = document.createElement('p'); content.textContent = 'Sisu puudub.'; }
      $('meist-content').replaceChildren(content);
      $('page-meist').hidden = false;
      $('page-meist').scrollTop = 0;
      $('info-card').hidden = true;
      return;
    }
    $('page-meist').hidden = true;
    globe.resumeAnimation();
    setMode(ROUTES[name]);
    if (frag && !dismissedCards.has(name)) {
      $('info-content').replaceChildren(frag.cloneNode(true));
      $('info-card').hidden = false;
    } else {
      $('info-card').hidden = true;
    }
  }
  $('info-close').addEventListener('click', () => {
    dismissedCards.add(routeName());
    $('info-card').hidden = true;
  });
  window.addEventListener('hashchange', route);

  // --- Ajaliugur ---
  const range = $('time-range');
  range.max = years.length - 1;
  range.addEventListener('input', () => { setYear(years[Number(range.value)]); });
  $('time-ticks').replaceChildren(...years.map((y) => {
    const s = document.createElement('span');
    s.textContent = y;
    if (forecastYears.has(y)) s.className = 'forecast';
    return s;
  }));

  // Ühe aasta andmete puhul pole liugurit vaja
  $('timebar').hidden = years.length < 2;

  // --- Legend ja esimene joonistus ---
  $('legend').hidden = false;
  $('testbadge').hidden = !usesTestData;
  setYear(year);
  setMode(mode);
  route();
}

init();

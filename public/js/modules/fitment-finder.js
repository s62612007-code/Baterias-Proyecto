import { PRODUCTS, BRAND_FILTERS } from '../data/products.js';
import { formatPrice, buildWhatsAppLink } from '../utils/format.js';
import { resolveImage, imageWithFallback } from '../utils/images.js';

const FITMENT_BASE = 'js/data/fitment';
const BATTERY_BRANDS = BRAND_FILTERS.filter((b) => !['Todos', 'Estacionaria', 'Moto'].includes(b));

const BRAND_CLASS = {
  MAC: 'mac',
  WILLARD: 'willard',
  COEXITO: 'coexito',
  DUNCAN: 'duncan',
  VARTA: 'varta',
  Bosch: 'bosch',
  Rocket: 'rocket',
  'AC Delco': 'acdelco',
  Motorcraft: 'motorcraft',
  Hankook: 'hankook',
  Optima: 'optima',
  Beste: 'beste',
  Magna: 'magna',
  Yuasa: 'moto',
  Paccar: 'paccar',
  Kaise: 'stationary',
  CSB: 'stationary',
  'Max Power': 'stationary',
  Trojan: 'stationary',
};

function normRef(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function matchScore(productRef, code) {
  const ref = normRef(productRef);
  const c = normRef(code);
  if (!ref || !c) return 0;
  if (ref.includes(c) || c.includes(ref)) return c.length;
  const box = c.match(/^(NS\d+|42IST|48IST|47|48|27|31|34|36|LN\d|4D|8D|YTX|YTZ)/)?.[1];
  if (box && ref.includes(box)) return box.length;
  return 0;
}

function findProducts(codes, brandFilter) {
  const matches = [];
  PRODUCTS.forEach((product) => {
    const brand = product.category || product.brand;
    if (brandFilter && brandFilter !== 'Todos' && brand !== brandFilter) return;
    let best = 0;
    codes.forEach((code) => {
      best = Math.max(best, matchScore(product.reference, code));
    });
    if (best > 0) matches.push({ product, score: best });
  });

  matches.sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  const seen = new Set();
  const unique = [];
  matches.forEach(({ product }) => {
    const key = product.id;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(product);
  });
  return unique;
}

function createResultCard(product) {
  const brand = product.category || product.brand;
  const brandClass = BRAND_CLASS[brand] || 'mac';
  const offerBadge = product.offer ? '<span class="badge-discount">Oferta</span>' : '';
  const imageSrc = resolveImage(product.image);

  const card = document.createElement('article');
  card.className = 'fitment-result-card product-card';
  card.innerHTML = `
    <div class="product-card__image-wrap">
      <span class="product-card__brand product-card__brand--${brandClass}">${brand}</span>
      ${offerBadge}
      <img class="product-card__image" src="${imageSrc}" alt="${product.name}" loading="lazy" width="400" height="300" />
    </div>
    <div class="product-card__body">
      <h3 class="product-card__title">${product.name}</h3>
      <div class="product-card__meta">
        <span class="product-card__tag">Ref. ${product.reference}</span>
        <span class="product-card__tag">Pol. ${product.polarity}</span>
      </div>
      <p class="product-card__price">
        <span class="product-card__price-current">${formatPrice(product.price)}</span>
      </p>
      <a class="btn btn--whatsapp btn--sm" href="${buildWhatsAppLink(`Hola, para mi vehículo necesito ${product.name} (${product.reference}) por ${formatPrice(product.price)}.`)}"
        target="_blank" rel="noopener noreferrer">Pedir por WhatsApp</a>
    </div>
  `;
  if (product.image) {
    imageWithFallback(card.querySelector('.product-card__image'), product.image);
  }
  return card;
}

async function loadMakeData(slug) {
  const res = await fetch(`${FITMENT_BASE}/makes/${slug}.json`);
  if (!res.ok) throw new Error('No se pudo cargar la marca');
  return res.json();
}

function slugifyBrand(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getPresetMarca() {
  const params = new URLSearchParams(window.location.search);
  const fromSearch = params.get('marca');
  if (fromSearch) return fromSearch;

  const hash = window.location.hash.slice(1);
  const qIdx = hash.indexOf('?');
  if (qIdx >= 0) {
    return new URLSearchParams(hash.slice(qIdx + 1)).get('marca');
  }
  return null;
}

export async function initFitmentFinder() {
  const makeSelect = document.querySelector('#fitment-make');
  const modelSelect = document.querySelector('#fitment-model');
  const yearSelect = document.querySelector('#fitment-year');
  const brandSelect = document.querySelector('#fitment-battery-brand');
  const form = document.querySelector('#fitment-form');
  const results = document.querySelector('#fitment-results');
  const summary = document.querySelector('#fitment-summary');
  const meta = document.querySelector('#fitment-meta');

  if (!makeSelect || !form || !results) return;

  const presetBatteryBrand = getPresetMarca();

  let makeIndex = [];
  let currentMake = null;

  try {
    const [indexRes, metaRes] = await Promise.all([
      fetch(`${FITMENT_BASE}/makes-index.json`),
      fetch(`${FITMENT_BASE}/index.json`),
    ]);
    makeIndex = await indexRes.json();
    const metaData = await metaRes.json();
    if (meta) {
      meta.textContent = `${metaData.makes} marcas · ${metaData.models} modelos · años ${metaData.minYear}–${metaData.maxYear}`;
    }
  } catch {
    if (meta) meta.textContent = 'Base de compatibilidad no disponible.';
    return;
  }

  makeIndex.forEach(({ make, slug }) => {
    const opt = document.createElement('option');
    opt.value = slug;
    opt.textContent = make;
    makeSelect.appendChild(opt);
  });

  BATTERY_BRANDS.forEach((brand) => {
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    brandSelect?.appendChild(opt);
  });

  if (presetBatteryBrand && brandSelect) {
    const match = BATTERY_BRANDS.find((b) => slugifyBrand(b) === presetBatteryBrand.toLowerCase());
    if (match) brandSelect.value = match;
  }

  makeSelect.addEventListener('change', async () => {
    modelSelect.innerHTML = '<option value="">— Modelo —</option>';
    yearSelect.innerHTML = '<option value="">— Año —</option>';
    modelSelect.disabled = true;
    yearSelect.disabled = true;
    results.innerHTML = '';
    summary.textContent = '';

    const slug = makeSelect.value;
    if (!slug) return;

    try {
      currentMake = await loadMakeData(slug);
      currentMake.models
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.name;
          opt.textContent = m.name;
          opt.dataset.from = m.from;
          opt.dataset.to = m.to;
          opt.dataset.codes = JSON.stringify(m.batteryCodes);
          opt.dataset.polarity = m.polarity;
          modelSelect.appendChild(opt);
        });
      modelSelect.disabled = false;
    } catch {
      summary.textContent = 'Error al cargar modelos.';
    }
  });

  modelSelect.addEventListener('change', () => {
    yearSelect.innerHTML = '<option value="">— Año —</option>';
    yearSelect.disabled = true;
    results.innerHTML = '';
    summary.textContent = '';

    const opt = modelSelect.selectedOptions[0];
    if (!opt?.value) return;

    const from = Number(opt.dataset.from);
    const to = Number(opt.dataset.to);
    for (let y = to; y >= from; y -= 1) {
      const yearOpt = document.createElement('option');
      yearOpt.value = String(y);
      yearOpt.textContent = String(y);
      yearSelect.appendChild(yearOpt);
    }
    yearSelect.disabled = false;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    results.innerHTML = '';

    const makeName = makeSelect.selectedOptions[0]?.textContent || '';
    const modelOpt = modelSelect.selectedOptions[0];
    const year = yearSelect.value;
    const brandFilter = brandSelect?.value || 'Todos';

    if (!modelOpt?.value || !year) {
      summary.textContent = 'Seleccione marca, modelo y año.';
      return;
    }

    const codes = JSON.parse(modelOpt.dataset.codes || '[]');
    const polarity = modelOpt.dataset.polarity || 'Consultar';
    const products = findProducts(codes, brandFilter === 'Todos' ? null : brandFilter);

    summary.innerHTML = `
      <strong>${makeName} ${modelOpt.value} ${year}</strong>
      · Referencias compatibles: ${codes.join(', ')}
      · Polaridad sugerida: ${polarity}
      · ${products.length} batería${products.length === 1 ? '' : 's'} en catálogo
    `;

    if (products.length === 0) {
      results.innerHTML = '<p class="fitment-empty">Sin baterías en catálogo para esta selección. Cotice por WhatsApp con la referencia de su batería actual.</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'fitment-results-grid products-grid';
    grid.setAttribute('role', 'list');
    products.slice(0, 24).forEach((p) => grid.appendChild(createResultCard(p)));
    results.appendChild(grid);

    if (products.length > 24) {
      const note = document.createElement('p');
      note.className = 'fitment-more';
      note.textContent = `Mostrando 24 de ${products.length}. Filtre por marca de batería o vea el catálogo completo para comprar.`;
      results.appendChild(note);
    }
  });
}

import { PRODUCTS, REFERENCE_GROUPS, PRIORITY_BRANDS } from '../data/products.js';
import { formatPrice, buildWhatsAppLink } from '../utils/format.js';
import { resolveImage, imageWithFallback } from '../utils/images.js';

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
};

function productText(product) {
  return `${product.reference} ${product.name} ${product.brand}`;
}

function groupProducts(group) {
  return PRODUCTS.filter((p) => group.match(productText(p)));
}

function pickFeatured(products, brand) {
  const brandProducts = products.filter((p) => p.brand === brand);
  return brandProducts.sort((a, b) => a.price - b.price)[0] || null;
}

function createBrandCard(product, groupLabel) {
  const brand = product.category || product.brand;
  const brandClass = BRAND_CLASS[brand] || 'generic';
  const offerBadge = product.offer ? '<span class="badge-discount">Oferta</span>' : '';

  const card = document.createElement('article');
  card.className = `ref-brand-card ref-brand-card--${brandClass}`;
  card.innerHTML = `
    <div class="ref-brand-card__image-wrap">
      ${offerBadge}
      <img class="ref-brand-card__image" alt="Batería ${groupLabel} ${brand} — ${product.reference}" loading="lazy" width="280" height="210" />
      <span class="ref-brand-card__brand">${brand}</span>
    </div>
    <div class="ref-brand-card__body">
      <p class="ref-brand-card__line">${product.line || brand}</p>
      <h4 class="ref-brand-card__name">${product.name}</h4>
      <p class="ref-brand-card__ref">Ref. ${product.reference}</p>
      <p class="ref-brand-card__price">${formatPrice(product.price)}</p>
      <a class="btn btn--whatsapp btn--sm" href="${buildWhatsAppLink(`Hola, me interesa ${product.name} (${product.reference}) ref. ${groupLabel} por ${formatPrice(product.price)}.`)}"
        target="_blank" rel="noopener noreferrer">Cotizar</a>
    </div>
  `;

  const img = card.querySelector('.ref-brand-card__image');
  imageWithFallback(img, product.image);
  return card;
}

function createGroupSection(group) {
  const products = groupProducts(group);
  if (products.length === 0) return null;

  const featuredByBrand = PRIORITY_BRANDS.map((brand) => pickFeatured(products, brand)).filter(Boolean);

  const section = document.createElement('section');
  section.className = 'ref-group';
  section.id = `ref-${group.id}`;
  section.dataset.reference = group.label;

  section.innerHTML = `
    <header class="ref-group__header">
      <div class="ref-group__heading">
        <span class="ref-group__badge">${group.label}</span>
        <h3 class="ref-group__title">Referencia ${group.label}</h3>
        <p class="ref-group__desc">${group.description}</p>
      </div>
      <p class="ref-group__count">${products.length} productos · ${featuredByBrand.length} marcas</p>
    </header>
    <div class="ref-group__grid" role="list"></div>
    <details class="ref-group__all">
      <summary>Ver las ${products.length} referencias ${group.label} en catálogo completo</summary>
      <div class="ref-group__all-grid" role="list"></div>
    </details>
  `;

  const grid = section.querySelector('.ref-group__grid');
  featuredByBrand.forEach((product) => {
    grid.appendChild(createBrandCard(product, group.label));
  });

  const allGrid = section.querySelector('.ref-group__all-grid');
  products
    .sort((a, b) => a.brand.localeCompare(b.brand, 'es') || a.price - b.price)
    .forEach((product) => allGrid.appendChild(createMiniCard(product, group.label)));

  return section;
}

function createMiniCard(product, groupLabel) {
  const brand = product.category || product.brand;
  const card = document.createElement('article');
  card.className = 'ref-mini-card';
  card.innerHTML = `
    <img class="ref-mini-card__img" alt="" loading="lazy" width="80" height="60" />
    <div class="ref-mini-card__info">
      <strong>${brand}</strong>
      <span>${product.reference}</span>
      <em>${formatPrice(product.price)}</em>
    </div>
  `;
  imageWithFallback(card.querySelector('.ref-mini-card__img'), product.image);
  card.addEventListener('click', () => {
    window.location.hash = `marca-${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    document.querySelector('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
  });
  return card;
}

function createNavPills() {
  const nav = document.createElement('nav');
  nav.className = 'ref-nav';
  nav.setAttribute('aria-label', 'Referencias de batería');

  REFERENCE_GROUPS.forEach((group) => {
    const count = groupProducts(group).length;
    if (count === 0) return;
    const link = document.createElement('a');
    link.href = `#ref-${group.id}`;
    link.className = 'ref-nav__pill';
    link.textContent = group.label;
    link.title = `${count} productos`;
    nav.appendChild(link);
  });

  return nav;
}

export function initReferenceCatalog() {
  const container = document.querySelector('#reference-catalog');
  const navContainer = document.querySelector('#reference-nav');
  if (!container) return;

  if (navContainer) {
    navContainer.appendChild(createNavPills());
  }

  REFERENCE_GROUPS.forEach((group) => {
    const section = createGroupSection(group);
    if (section) container.appendChild(section);
  });

  const total = REFERENCE_GROUPS.reduce((sum, g) => sum + groupProducts(g).length, 0);
  const counter = document.querySelector('#reference-count');
  if (counter) {
    counter.textContent = `${REFERENCE_GROUPS.length} referencias · ${total} productos del catálogo bateriacarro.com.co`;
  }
}

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const API = 'https://bateriacarro.com.co/wp-json/wc/store/v1/products';
const CDN = 'https://bateriacarro.com.co';

const BRAND_MAP = {
  'AC-DELCO': 'AC Delco',
  ACDELCO: 'AC Delco',
  BOSCH: 'Bosch',
  MAC: 'MAC',
  VARTA: 'VARTA',
  DUNCAN: 'DUNCAN',
  WILLARD: 'WILLARD',
  COEXITO: 'COEXITO',
  ROCKET: 'Rocket',
  OPTIMA: 'Optima',
  MOTORCRAFT: 'Motorcraft',
  YUASA: 'Yuasa',
  MAGNA: 'Magna',
  CSB: 'CSB',
  'POWER TAXI': 'Power Taxi',
  KAISE: 'Estacionaria',
  TROJAN: 'Estacionaria',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

function detectBrand(product) {
  const cats = (product.categories || []).map((c) => c.name.toUpperCase());
  for (const cat of cats) {
    for (const [key, brand] of Object.entries(BRAND_MAP)) {
      if (cat.includes(key)) return brand;
    }
  }
  const name = product.name.toUpperCase();
  for (const [key, brand] of Object.entries(BRAND_MAP)) {
    if (name.includes(key.replace('-', '')) || name.includes(key)) return brand;
  }
  return 'Otras';
}

function detectLine(product, brand) {
  const cats = (product.categories || []).map((c) => c.name);
  const lineCat = cats.find((c) => !c.toUpperCase().startsWith(brand.toUpperCase()) && c !== brand);
  if (lineCat) return lineCat.replace(new RegExp(`^${brand}\\s*`, 'i'), '').trim();
  const match = product.name.match(new RegExp(`${brand}\\s+([A-Za-z\\s\\-]+?)\\s+\\d`, 'i'));
  return match ? match[1].trim() : brand;
}

function extractReference(name, brand) {
  const cleaned = name
    .replace(/^bater[ií]a\s+/i, '')
    .replace(new RegExp(`^${brand}\\s+`, 'i'), '')
    .trim();
  const refMatch = cleaned.match(
    /((?:NS\d+[A-Z0-9\-]*|\d{2}(?:IST|ST|RST|DLT)?[\s\-]?\d*[A-Z0-9\-]*|LN\d+|4D[\w\-]*|8D[\w\-]*|AGM[\w\s\-]*|EFB[\w\s\-]*|YTX[\w\-]+)[A-Z0-9\-]*)/i,
  );
  if (refMatch) return refMatch[1].replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 40);
}

function extractPolarity(description) {
  const match = (description || '').match(/Borde Positivo<\/b><\/td>\s*<td[^>]*>([^<]+)/i);
  return match ? match[1].trim() : 'Consultar';
}

function convertProduct(product) {
  const brand = detectBrand(product);
  const price = Number(product.prices?.price || 0);
  const regular = Number(product.prices?.regular_price || 0);
  const image = product.images?.[0]?.src || '';
  const line = detectLine(product, brand);

  return {
    id: product.slug || String(product.id),
    brand,
    line,
    name: product.name.replace(/\s+/g, ' ').trim(),
    reference: extractReference(product.name, brand),
    polarity: extractPolarity(product.description),
    price,
    originalPrice: regular > price ? regular : null,
    offer: Boolean(product.on_sale && regular > price),
    image,
    imageLocal: image ? `assets/images/products/${product.slug}${path.extname(new URL(image).pathname) || '.webp'}` : '',
    category: brand,
    permalink: product.permalink,
  };
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const batch = await fetchJson(`${API}?per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    process.stdout.write(`\r  ${all.length} productos…`);
    if (batch.length < 100) break;
    page += 1;
  }
  console.log(`\n✓ ${all.length} productos desde bateriacarro.com.co`);
  return all;
}

async function downloadFile(url, dest) {
  if (fs.existsSync(dest)) return true;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(dest, Buffer.concat(chunks));
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('Importando catálogo de bateriacarro.com.co…');
  const raw = await fetchAllProducts();
  const products = raw.map(convertProduct);

  const catalogDest = path.join(ROOT, 'public/js/data/catalog-mac.js');
  const catalogJs = `export const CATALOG_PRODUCTS = ${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(catalogDest, catalogJs);
  console.log('✓ catalog-mac.js actualizado');

  const imagesDir = path.join(ROOT, 'public/assets/images/products');
  fs.mkdirSync(imagesDir, { recursive: true });

  let ok = 0;
  let fail = 0;
  for (const product of products) {
    if (!product.image || !product.imageLocal) continue;
    const dest = path.join(ROOT, 'public', product.imageLocal);
    const success = await downloadFile(product.image, dest);
    if (success) {
      product.image = product.imageLocal;
      ok += 1;
    } else {
      fail += 1;
    }
    if ((ok + fail) % 50 === 0) process.stdout.write(`\r  imágenes ${ok + fail}/${products.length}`);
  }

  const finalJs = `export const CATALOG_PRODUCTS = ${JSON.stringify(products, null, 2)};\n`;
  fs.writeFileSync(catalogDest, finalJs);
  console.log(`\n✓ Imágenes: ${ok} descargadas, ${fail} con URL remota`);
  console.log('Importación completada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

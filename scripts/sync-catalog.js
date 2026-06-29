import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CDN = process.env.CATALOG_CDN || 'https://bateriascali.es';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const { status, body } = await fetch(url);
  if (status !== 200) return false;
  fs.writeFileSync(dest, body);
  return true;
}

async function main() {
  console.log(`Sincronizando catálogo desde ${CDN}…`);

  const catalogUrl = `${CDN}/js/data/catalog-mac.js`;
  const catalogDest = path.join(ROOT, 'public/js/data/catalog-mac.js');
  const { status, body } = await fetch(catalogUrl);
  if (status !== 200) {
    console.error('No se pudo descargar catalog-mac.js');
    process.exit(1);
  }
  fs.writeFileSync(catalogDest, body);
  console.log('✓ catalog-mac.js');

  const catalogText = body.toString('utf8');
  const products = eval(catalogText.replace(/^export const CATALOG_PRODUCTS = /, '').replace(/;\s*$/, ''));

  const images = [...new Set(products.map((p) => p.image).filter(Boolean))];
  console.log(`Descargando ${images.length} imágenes…`);

  let ok = 0;
  let fail = 0;
  for (const img of images) {
    const dest = path.join(ROOT, 'public', img);
    if (fs.existsSync(dest)) {
      ok += 1;
      continue;
    }
    const success = await downloadFile(`${CDN}/${img}`, dest);
    if (success) ok += 1;
    else fail += 1;
    if ((ok + fail) % 50 === 0) process.stdout.write(`  ${ok + fail}/${images.length}\r`);
  }

  console.log(`\n✓ Imágenes: ${ok} ok, ${fail} fallidas (CDN como respaldo)`);

  const fitmentFiles = ['index.json', 'makes-index.json'];
  const fitmentDir = path.join(ROOT, 'public/js/data/fitment');
  fs.mkdirSync(path.join(fitmentDir, 'makes'), { recursive: true });

  for (const file of fitmentFiles) {
    const dest = path.join(fitmentDir, file);
    const success = await downloadFile(`${CDN}/js/data/fitment/${file}`, dest);
    console.log(success ? `✓ fitment/${file}` : `✗ fitment/${file}`);
  }

  console.log('Sincronización completada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, '..', 'public/js/data/catalog-mac.js');

test('catálogo contiene productos', () => {
  const text = readFileSync(catalogPath, 'utf8');
  assert.match(text, /CATALOG_PRODUCTS/);
  assert.match(text, /"brand":/);
  assert.match(text, /"reference":/);
});

test('referencias principales presentes en catálogo', () => {
  const text = readFileSync(catalogPath, 'utf8').toUpperCase();
  const refs = ['NS40', 'NS60', '42', '27', '31', '48', '4D', '8D', 'AGM', 'START', 'EFB'];
  refs.forEach((ref) => assert.ok(text.includes(ref), `Falta referencia ${ref}`));
});

test('marcas principales presentes', () => {
  const text = readFileSync(catalogPath, 'utf8');
  ['MAC', 'VARTA', 'DUNCAN', 'Bosch', 'WILLARD'].forEach((brand) => {
    assert.ok(text.includes(`"${brand}"`), `Falta marca ${brand}`);
  });
});

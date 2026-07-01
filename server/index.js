import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');

app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Baterías Barracuda Taller Honda',
    catalogSource: process.env.CATALOG_CDN || 'https://bateriacarro.com.co',
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Baterías Barracuda Taller Honda → http://localhost:${PORT}`);
  console.log(`Catálogo: ${process.env.CATALOG_CDN || 'https://bateriacarro.com.co'}`);
});

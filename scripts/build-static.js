import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function writeHtaccess() {
  const htaccess = `# Baterías Barracuda Taller Honda — sitio estático seguro
DirectoryIndex index.html
Options -Indexes

# Forzar HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</IfModule>

# Cabeceras de seguridad
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()"
  Header always set X-XSS-Protection "0"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://bateriacarro.com.co; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self' https://wa.me; frame-ancestors 'self'; upgrade-insecure-requests"
</IfModule>

# Bloquear archivos sensibles si existieran en el servidor
<FilesMatch "(^\\.|\\.env|\\.git|package\\.json|package-lock\\.json|\\.md$)">
  <IfModule mod_authz_core.c>
    Require all denied
  </IfModule>
</FilesMatch>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
</IfModule>
`;
  fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess);
}

console.log('Construyendo sitio estático para www.bateriascali.es…');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
copyRecursive(SRC, DIST);
writeHtaccess();
console.log(`✓ dist/ listo (${fs.readdirSync(DIST).length} entradas en raíz)`);
console.log('  Suba el contenido de dist/ a www.bateriascali.es (FTP → html/)');

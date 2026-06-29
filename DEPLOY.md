# Despliegue — hondabateriacali.com

Sitio **100 % estático**: HTML, CSS, JS y catálogo JSON embebido. Sin Node.js en producción.

## Estructura publicada

1. **Landing** — hero con logo Honda Baterías Cali  
2. **Separador** — banda con logo Honda visible  
3. **Catálogo estático** — 12 baterías por página, **inicia en DUNCAN**, luego MAC, VARTA, etc.  
4. **Referencias** — NS40, NS60, 42, 4D, AGM…  
5. **Contacto** — WhatsApp y sede  

## Build local

```bash
npm run build
```

Genera la carpeta `dist/` lista para subir.

## Subir a hondabateriacali.com

### Opción A — FTP / cPanel (File Manager)

1. Ejecute `npm run build`
2. Comprima `dist/` en `honda-baterias.zip` o suba archivo por archivo
3. En el hosting, vacíe la raíz pública (`public_html/` o `www/`)
4. Suba **todo el contenido** de `dist/` (incluido `.htaccess`)
5. Verifique: https://hondabateriacali.com/#marca-duncan

### Opción B — rsync por SSH

```bash
npm run build
rsync -avz --delete dist/ usuario@servidor:/ruta/a/public_html/
```

### Opción C — GitHub Actions (opcional)

Conecte el repo a su hosting con deploy automático en cada push a `main`.

## URLs del catálogo

| Marca   | URL directa              |
|---------|--------------------------|
| DUNCAN  | `/#marca-duncan`         |
| MAC     | `/#marca-mac`            |
| VARTA   | `/#marca-varta`          |
| Pág. 2  | `/#marca-duncan-2`       |

## Actualizar catálogo antes de desplegar

```bash
npm run sync:catalog   # importa oferta bateriacarro.com.co
npm run build
# subir dist/ al servidor
```

## Comprobación post-despliegue

- [ ] Logo Honda visible en header y separador del catálogo  
- [ ] Catálogo abre en **DUNCAN** con 12 productos  
- [ ] Paginación Anterior / Siguiente funciona  
- [ ] Imágenes cargan desde bateriacarro.com.co  
- [ ] WhatsApp 314 769 1248 responde  

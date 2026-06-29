const CDN = 'https://bateriacarro.com.co';

export function resolveImage(src) {
  if (!src) return `${CDN}/wp-content/uploads/2025/03/baterias_banner.png`;
  if (src.startsWith('http')) return src;
  return src;
}

export function imageWithFallback(imgEl, src) {
  const local = resolveImage(src);
  imgEl.src = local;
  if (src?.startsWith('http')) return;
  imgEl.addEventListener(
    'error',
    () => {
      if (!imgEl.dataset.fallback && src) {
        imgEl.dataset.fallback = '1';
        imgEl.src = `${CDN}/${src.replace(/^\/+/, '')}`;
      }
    },
    { once: true },
  );
}

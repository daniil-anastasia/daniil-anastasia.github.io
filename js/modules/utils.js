/* Мелкие помощники. Без зависимостей. */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Значение по пути 'a.b.c' */
export function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/** Пусто ли значение: null, '', [], {} */
export function isEmpty(value) {
  if (value == null || value === false) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/** Рекурсивное слияние (для режима предпросмотра) */
export function merge(base, patch) {
  if (Array.isArray(patch)) return patch.slice();
  if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
    const out = { ...(base || {}) };
    for (const key of Object.keys(patch)) out[key] = merge(base ? base[key] : undefined, patch[key]);
    return out;
  }
  return patch;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

export const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

/**
 * Кадр с изображением.
 * photo: { src, alt, w, h, ratio, focus, sources: { avif, webp } }
 *   ratio — пропорции кадра, например '4/5'. Перебивает ритм секции:
 *           нужно, когда снимок нельзя резать под стандартный слот.
 *   focus — что не обрезать при кадрировании, например '50% 70%'.
 * Если фото нет — возвращается пустой кадр (мягкая бумага), без битой картинки.
 */
export function frame(photo, { eager = false, className = '' } = {}) {
  const box = el('div', { class: `frame ${className}`.trim() });

  if (!photo || !photo.src) {
    box.classList.add('frame--empty');
    return box;
  }

  if (photo.ratio) box.style.aspectRatio = photo.ratio;

  const image = el('img', {
    src: photo.src,
    alt: photo.alt || '',
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    fetchpriority: eager ? 'high' : 'auto',
    width: photo.w || null,
    height: photo.h || null,
    sizes: photo.sizes || null,
    srcset: photo.srcset || null
  });

  if (photo.focus) image.style.objectPosition = photo.focus;

  if (photo.sources && (photo.sources.avif || photo.sources.webp)) {
    const picture = el('picture');
    if (photo.sources.avif) picture.append(el('source', { type: 'image/avif', srcset: photo.sources.avif, sizes: photo.sizes || null }));
    if (photo.sources.webp) picture.append(el('source', { type: 'image/webp', srcset: photo.sources.webp, sizes: photo.sizes || null }));
    picture.append(image);
    box.append(picture);
  } else {
    box.append(image);
  }

  return box;
}

/** Ссылка на маршрут в Яндекс Картах */
export function routeUrl(place, city) {
  if (!place) return null;
  const point = Array.isArray(place.coords) && place.coords.length === 2
    ? `${place.coords[0]},${place.coords[1]}`
    : [city, place.name, place.address].filter(Boolean).join(', ');
  return `https://yandex.ru/maps/?mode=routes&rtext=~${encodeURIComponent(point)}&rtt=auto`;
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** rAF-троттлинг для скролла */
export function onFrame(callback) {
  let ticking = false;
  return () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      callback();
    });
  };
}

/* Scroll-driven анимация колец + розы.
   Спрайт-лист 6×4 (24 кадра) рисуется на canvas по прогрессу скролла.
   Кадр выбирается напрямую по прогрессу скролла: кольца остаются резкими
   и не двоятся при наложении соседних позиций.
   Кадр заполняет сцену целиком (cover, по центру), поэтому границы
   фотографии не проявляются на широких и узких экранах. */

const FRAMES  = 24;
const FRAME_W = 512;
const FRAME_H = 768;
const COLS    = 6;
const SPRITE  = 'assets/photos/rings-sprite.webp?v=12';

export function initRoseScroll() {
  const wrap   = document.querySelector('.rose-wrap');
  const stage  = document.getElementById('rose-stage');
  const canvas = document.querySelector('.rose-stage__rings');
  if (!wrap || !stage || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let sprite = null;
  let lastP  = -1;

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    sprite = img;
    syncSize();
    drawRings(lastP >= 0 ? lastP : 0);
    stage.classList.add('is-sprite-ready');
  };
  img.src = SPRITE;

  /* --- Размер холста с учётом плотности пикселей (резкость на retina) --- */
  const syncSize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round((canvas.clientWidth  | 0) * dpr);
    const h = Math.round((canvas.clientHeight | 0) * dpr);
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width  = w;
      canvas.height = h;
    }
  };

  /* Геометрия кадра (cover, по центру) в пикселях холста */
  const placement = () => {
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;
    return { cw, ch, dx: (cw - dw) / 2, dy: (ch - dh) / 2, dw, dh };
  };

  const blit = (i, box) => {
    const sx = (i % COLS) * FRAME_W;
    const sy = Math.floor(i / COLS) * FRAME_H;
    ctx.drawImage(sprite, sx, sy, FRAME_W, FRAME_H, box.dx, box.dy, box.dw, box.dh);
  };

  const drawRings = (p) => {
    if (!sprite) return;
    syncSize();
    const box = placement();
    if (!box.cw || !box.ch) return;
    ctx.clearRect(0, 0, box.cw, box.ch);

    const opacity = Math.min(1, p * 4);        // мягкое проявление из темноты
    if (opacity <= 0) return;

    /* ближайший кадр: без призрачного дублирования движущихся колец */
    const t  = p * (FRAMES - 1);
    const frame = Math.round(t);
    ctx.globalAlpha = opacity;
    blit(frame, box);
    ctx.globalAlpha = 1;
  };

  /* --- Уважение к prefers-reduced-motion: сразу финальный кадр --------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lastP = 1;
    const show = () => drawRings(1);
    if (sprite) show(); else img.addEventListener('load', show, { once: true });
    return;
  }

  /* --- Привязка к скроллу ---------------------------------------------- */
  let raf = null;

  const compute = () => {
    const scrollable = wrap.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    return Math.min(1, Math.max(0, (window.scrollY - wrap.offsetTop) / scrollable));
  };

  const setP = (p) => {
    if (Math.abs(p - lastP) < 0.0012 && p !== 0 && p !== 1) return;
    lastP = p;
    stage.style.setProperty('--rose-p', p.toFixed(3));
    drawRings(p);
  };

  const update = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; setP(compute()); });
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    syncSize();
    lastP = -1;
    update();
  }, { passive: true });

  update();
}

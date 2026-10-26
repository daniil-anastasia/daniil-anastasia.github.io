/* Появление блоков и микропараллакс галереи.
   Один наблюдатель на всё, один rAF-цикл на скролл. */

import { $$, prefersReducedMotion, onFrame } from './utils.js';

const TARGETS = [
  '.reveal', '.reveal-lines', '.rule',
  '.frame', '.swatch', '.shot', '.place',
  '.story__item', '.fact', '.tl', '.finale', '.band'
].join(', ');

export function initReveal() {
  const nodes = $$(TARGETS);

  // Стагger для финала — задаётся здесь, чтобы не держать магию в CSS
  $$('.finale__inner > *').forEach((node, index) => {
    node.style.setProperty('--d', `${index * 130}ms`);
  });

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-in'));
    return;
  }

  // Мутируемый набор ожидающих узлов — для scroll-fallback
  const pending = new Set(nodes);

  const reveal = (node) => {
    node.classList.add('is-in');
    observer.unobserve(node);
    pending.delete(node);
    if (!pending.size) window.removeEventListener('scroll', scrollCheck);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  nodes.forEach((node) => observer.observe(node));

  // Scroll-fallback для мобильных браузеров (iOS Safari и др.), где
  // clip-path на элементе мешает IntersectionObserver корректно
  // вычислять intersectionRatio — элементы никогда не получают is-in.
  let raf = null;
  const scrollCheck = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const limit = window.innerHeight * 0.93;
      for (const node of pending) {
        const rect = node.getBoundingClientRect();
        if (rect.top < limit && rect.bottom > 0) reveal(node);
      }
    });
  };

  window.addEventListener('scroll', scrollCheck, { passive: true });
  // Проверяем сразу и после load — чтобы элементы в верхней части
  // экрана появились без прокрутки
  scrollCheck();
  window.addEventListener('load', scrollCheck, { once: true });
}

/* Микропараллакс — только мышь + разрешённое движение. */
export function initParallax() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches) return;

  const shots = $$('.shot');
  if (!shots.length) return;

  let viewport = window.innerHeight;
  const items = [];

  const measure = () => {
    viewport = window.innerHeight;
    items.length = 0;
    shots.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      items.push({
        node,
        center: rect.top + window.scrollY + rect.height / 2,
        factor: index % 2 === 0 ? -16 : 24,
        visible: false
      });
    });
  };

  const paint = onFrame(() => {
    const mid = window.scrollY + viewport / 2;
    for (const item of items) {
      if (!item.visible) continue;
      const delta = (item.center - mid) / viewport;       // −1 … 1
      item.node.style.transform = `translate3d(0, ${(delta * item.factor).toFixed(2)}px, 0)`;
    }
  });

  measure();

  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = items.find((candidate) => candidate.node === entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
    paint();
  }, { rootMargin: '20% 0px' });

  shots.forEach((node) => watcher.observe(node));

  window.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', () => { measure(); paint(); }, { passive: true });
  window.addEventListener('load', () => { measure(); paint(); }, { once: true });
}

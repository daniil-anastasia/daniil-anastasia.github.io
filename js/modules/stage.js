/* Первый экран: полароиды, их падение и уход при скролле. */

import { $, prefersReducedMotion, onFrame } from './utils.js';

export function initStage(cfg) {
  const stage = $('.stage');
  const wrap  = $('.stage-wrap');
  if (!stage || !wrap) return;

  fillPolaroid($('[data-polaroid="groom"]'), cfg.couple.groom);
  fillPolaroid($('[data-polaroid="bride"]'), cfg.couple.bride);

  if (prefersReducedMotion()) return;

  /* Прогресс ухода сцены: 0 — сцена на месте, 1 — бумага её закрыла. */
  let viewport = window.innerHeight;
  let progress = -1;

  const update = onFrame(() => {
    const next = Math.min(1, Math.max(0, window.scrollY / viewport));
    if (Math.abs(next - progress) < 0.004 && next !== 0 && next !== 1) return;
    progress = next;
    stage.style.setProperty('--p', progress.toFixed(3));
  });

  const onResize = () => { viewport = window.innerHeight; progress = -1; update(); };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  update();
}

function fillPolaroid(node, person) {
  if (!node || !person) return;

  const img     = node.querySelector('img');
  const caption = node.querySelector('.polaroid__caption');

  if (caption) {
    caption.innerHTML = '';
    if (person.label) {
      const label = document.createElement('span');
      label.className = 'polaroid__label';
      label.textContent = person.label;
      caption.append(label);
    }
    const name = document.createElement('span');
    name.className = 'polaroid__name';
    name.textContent = person.name || '';
    caption.append(name);

    if (person.line) {                       // реплика, подписанная от руки
      const line = document.createElement('span');
      line.className = 'polaroid__line';
      line.textContent = person.line;
      caption.append(line);
    }
  }

  const photo = person.childhoodPhoto;
  if (!img || !photo || !photo.src) return;   // без фото остаётся чистая фотобумага

  img.alt = photo.alt || `${person.name} в детстве`;
  if (photo.w) img.width = photo.w;
  if (photo.h) img.height = photo.h;
  if (photo.focus) img.style.objectPosition = photo.focus;

  const reveal = () => node.classList.add('has-photo');
  img.addEventListener('load', reveal, { once: true });
  img.addEventListener('error', () => node.classList.remove('has-photo'), { once: true });
  img.src = photo.src;
  if (img.complete && img.naturalWidth) reveal();
}

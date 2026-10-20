/* Компактная плавающая навигация. */

import { $, el, onFrame } from './utils.js';

export function initNav(cfg) {
  const nav    = $('[data-nav]');
  const toggle = $('[data-nav-toggle]');
  const sheet  = $('[data-nav-sheet]');
  const list   = $('[data-nav-list]');
  if (!nav || !toggle || !sheet || !list) return;

  const items = (cfg.nav || []).filter((item) => document.getElementById(item.id));
  if (items.length < 2) { nav.remove(); return; }

  items.forEach((item) => {
    list.append(el('li', {}, [
      el('a', { href: `#${item.id}`, 'data-nav-link': item.id, text: item.label })
    ]));
  });

  /* --- открытие / закрытие --- */
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      sheet.hidden = false;
      sheet.classList.add('is-open');
    } else {
      sheet.classList.remove('is-open');
      sheet.hidden = true;
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  list.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!nav.contains(event.target) && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });

  /* --- появление после первого экрана --- */
  const check = onFrame(() => {
    const show = window.scrollY > window.innerHeight * 0.85;
    nav.classList.toggle('is-visible', show);
    if (!show && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
  window.addEventListener('scroll', check, { passive: true });
  check();

  /* --- текущий раздел --- */
  if (!('IntersectionObserver' in window)) return;
  const links = new Map(items.map((item) => [item.id, $(`[data-nav-link="${item.id}"]`)]));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link && link.classList.remove('is-current'));
      const link = links.get(entry.target.id);
      if (link) link.classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  items.forEach((item) => spy.observe(document.getElementById(item.id)));
}

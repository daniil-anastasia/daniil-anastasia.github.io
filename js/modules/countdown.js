/* Счётчик. Не таймер распродажи: обновляется раз в полминуты,
   без секунд, без мигания. */

import { $, el } from './utils.js';

export function initCountdown(cfg) {
  const box = $('[data-countdown]');
  const section = $('#countdown');
  if (!box || !section) return;

  const target = cfg.countdown.date || cfg.date;
  const time = target ? new Date(target).getTime() : NaN;

  if (!cfg.countdown.enabled || Number.isNaN(time) || time <= Date.now()) {
    section.remove();
    return;
  }

  const render = () => {
    const left = time - Date.now();
    if (left <= 0) { section.remove(); return; }

    const minutes = Math.floor(left / 60000);
    const parts = [
      { value: Math.floor(minutes / 1440), forms: ['день', 'дня', 'дней'] },
      { value: Math.floor(minutes / 60) % 24, forms: ['час', 'часа', 'часов'] },
      { value: minutes % 60, forms: ['минута', 'минуты', 'минут'] }
    ];

    box.innerHTML = '';
    parts.forEach((part, index) => {
      box.append(el('div', { class: 'count__unit reveal', style: `--d:${index * 110}ms` }, [
        el('span', { class: 'count__num', text: String(part.value).padStart(2, '0') }),
        el('span', { class: 'count__label', text: plural(part.value, part.forms) })
      ]));
    });
    box.querySelectorAll('.reveal').forEach((node) => node.classList.add('is-in'));
  };

  render();
  setInterval(render, 30000);
}

function plural(count, [one, few, many]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

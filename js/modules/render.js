/* Разметка из конфигурации. Пустые данные не рисуются. */

import { $, $$, el, get, isEmpty, frame, routeUrl } from './utils.js';

/* ---------- простые поля ---------- */

export function fillFields(cfg) {
  $$('[data-field]').forEach((node) => {
    const value = get(cfg, node.dataset.field);
    if (isEmpty(value)) { node.innerHTML = ''; return; }
    node.innerHTML = value;                 // тексты приходят из нашего же конфига
  });

  $$('[data-list]').forEach((node) => {
    const value = get(cfg, node.dataset.list);
    node.innerHTML = '';
    if (isEmpty(value)) return;
    [].concat(value).forEach((paragraph) => {
      if (isEmpty(paragraph)) return;
      node.append(el('p', { html: paragraph }));
    });
  });

  const heroLine = $('[data-hero-lines]');
  if (heroLine) {
    const lines = (cfg.hero && cfg.hero.lines) || [];
    heroLine.innerHTML = lines.filter(Boolean).join('<br>');
  }
}

/* ---------- одиночные кадры внутри блоков ---------- */

export function renderPhotos(cfg) {
  $$('[data-photo]').forEach((box) => {
    const photo = get(cfg, box.dataset.photo);
    box.innerHTML = '';
    if (!photo || !photo.src) return;
    box.append(frame(photo));
  });
}

/* ---------- полноширинные кадры между блоками ---------- */

export function renderBands(cfg) {
  const bands = cfg.bands || [];
  $$('[data-band]').forEach((node) => {
    const photo = bands[Number(node.dataset.band)];
    if (!photo || !photo.src) { node.remove(); return; }

    const image = el('img', {
      src: photo.src,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      width: photo.w || null,
      height: photo.h || null
    });
    if (photo.focus) image.style.objectPosition = photo.focus;
    node.append(image);
  });
}

/* ---------- имена ---------- */

export function renderNames(cfg) {
  const box = $('[data-names-media]');
  if (!box) return;
  const photos = (cfg.names.photos || [])
    .concat([cfg.couple.groom.portrait, cfg.couple.bride.portrait])
    .filter(Boolean)
    .slice(0, 2);
  box.innerHTML = '';
  photos.forEach((photo) => box.append(frame(photo)));
}

/* ---------- история ---------- */

export function renderStory(cfg) {
  const box = $('[data-story]');
  if (!box) return;
  box.innerHTML = '';

  (cfg.story.items || []).forEach((item, index) => {
    if (isEmpty(item) || (isEmpty(item.title) && isEmpty(item.text))) return;
    const node = el('li', { class: 'story__item reveal', style: `--d:${Math.min(index, 4) * 90}ms` });
    if (!isEmpty(item.when))  node.append(el('p', { class: 'story__when', text: item.when }));
    if (!isEmpty(item.title)) node.append(el('h3', { class: 'story__title', html: item.title }));
    if (!isEmpty(item.text))  node.append(el('p', { class: 'story__text', html: item.text }));
    if (item.photo)           node.append(frame(item.photo, { className: 'story__media' }));
    box.append(node);
  });
}

/* ---------- галерея ---------- */

export function renderGallery(cfg) {
  const box = $('[data-gallery]');
  if (!box) return;
  box.innerHTML = '';

  (cfg.gallery.photos || []).forEach((photo) => {
    if (!photo || !photo.src) return;
    const shot = el('figure', { class: 'shot' });
    shot.append(frame(photo));                 // галерея далеко внизу — только lazy
    if (photo.caption) shot.append(el('figcaption', { class: 'shot__cap', text: photo.caption }));
    box.append(shot);
  });
}

/* ---------- детали дня ---------- */

export function renderFacts(cfg) {
  const box = $('[data-facts]');
  if (!box || !cfg.event) return;      // блок «Детали дня» может быть удалён
  box.innerHTML = '';

  const facts = [];
  const dateText = cfg.dateLabel || formatDate(cfg.date);
  if (!isEmpty(dateText)) facts.push({ key: 'Дата', val: dateText });
  if (!isEmpty(cfg.event.guestArrival)) facts.push({ key: 'Сбор гостей', val: cfg.event.guestArrival });

  ['ceremony', 'restaurant'].forEach((slot) => {
    const place = cfg.locations[slot];
    if (!place || isEmpty(place.name)) return;
    facts.push({ key: place.kind, val: place.name, sub: place.address });
  });

  facts.forEach((fact, index) => {
    const node = el('div', { class: 'fact reveal', style: `--d:${index * 80}ms` });
    node.append(el('dt', { class: 'fact__key', text: fact.key }));
    node.append(el('dd', { class: 'fact__val', text: fact.val }));
    if (!isEmpty(fact.sub)) node.append(el('dd', { class: 'fact__sub', text: fact.sub }));
    box.append(node);
  });
}

function formatDate(iso) {
  if (isEmpty(iso)) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return null;
  }
}

/* ---------- программа ---------- */

export function renderSchedule(cfg) {
  const box = $('[data-schedule]');
  if (!box) return;
  box.innerHTML = '';

  (cfg.schedule.items || []).forEach((item, index) => {
    if (isEmpty(item) || (isEmpty(item.time) && isEmpty(item.title))) return;
    const node = el('li', { class: 'tl reveal', style: `--d:${Math.min(index, 5) * 80}ms` });
    node.append(el('p', { class: 'tl__time', text: item.time || '' }));

    const body = el('div', { class: 'tl__body' });
    if (!isEmpty(item.title)) body.append(el('h3', { class: 'tl__title', html: item.title }));
    if (!isEmpty(item.text))  body.append(el('p', { class: 'tl__text', html: item.text }));
    node.append(body);
    box.append(node);
  });
}

/* ---------- локации ---------- */

export function renderPlaces(cfg) {
  const box = $('[data-places]');
  if (!box) return;
  box.innerHTML = '';

  ['ceremony', 'restaurant'].forEach((slot, index) => {
    const place = cfg.locations[slot];
    if (!place || isEmpty(place.name)) return;

    const node = el('article', { class: 'place reveal', style: `--d:${index * 120}ms` });
    if (!isEmpty(place.kind)) node.append(el('p', { class: 'place__kind', text: place.kind }));
    if (place.photo) node.append(frame(place.photo, { className: 'place__media' }));
    node.append(el('h3', { class: 'place__name', text: place.name }));
    if (!isEmpty(place.address)) node.append(el('p', { class: 'place__addr', text: place.address }));
    if (!isEmpty(place.note))    node.append(el('p', { class: 'place__note', html: place.note }));

    const url = routeUrl(place, cfg.city);
    if (url) {
      node.append(el('div', { class: 'place__link' }, [
        el('a', {
          class: 'btn btn--line',
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': `${cfg.locations.mapLabel}: ${place.name}`
        }, [cfg.locations.mapLabel || 'Маршрут'])
      ]));
    }
    box.append(node);
  });
}

/* ---------- dress code ---------- */

export function renderDress(cfg) {
  const palette = $('[data-palette]');
  const looks   = $('[data-dress-looks]');
  const lists   = $('[data-dress-lists]');
  const dress   = cfg.dressCode || {};

  if (palette) {
    palette.innerHTML = '';
    const groups = (dress.groups || []).length
      ? dress.groups
      : [{ title: null, colors: dress.colors || [] }];

    groups.forEach((group) => {
      const colors = (group.colors || []).filter((color) => color && color.hex);
      if (!colors.length) return;

      const swatches = el('div', { class: 'dress-palette__swatches' });
      colors.forEach((color, index) => {
        swatches.append(el('div', { class: 'swatch', style: `--d:${index * 70}ms` }, [
          el('span', {
            class: 'swatch__dot',
            style: `background:${color.hex}`,
            title: color.name || color.hex
          }),
          el('span', { class: 'swatch__name', text: color.name || color.hex })
        ]));
      });

      const node = el('section', { class: 'dress-palette reveal' });
      if (!isEmpty(group.title)) {
        node.append(el('h3', { class: 'dress-palette__title', text: group.title }));
      }
      node.append(swatches);
      palette.append(node);
    });
  }

  if (looks) {
    looks.innerHTML = '';
    (dress.looks || []).forEach((photo) => {
      if (!photo || !photo.src) return;
      looks.append(frame(photo));
    });
  }

  if (lists) {
    lists.innerHTML = '';
    const blocks = [
      ['Желательно', dress.recommended],
      ['Лучше не выбирать', dress.avoid]
    ];
    blocks.forEach(([title, items]) => {
      if (isEmpty(items)) return;
      const node = el('div', { class: 'reveal' });
      node.append(el('p', { class: 'dlist__title', text: title }));
      node.append(el('ul', { class: 'dlist' }, items.map((line) => el('li', { html: line }))));
      lists.append(node);
    });
  }
}

/* ---------- подарки ---------- */

export function renderGifts(cfg) {
  const box = $('[data-gifts-details]');
  if (!box) return;
  box.innerHTML = '';
  if (isEmpty(cfg.gifts.details)) return;
  box.innerHTML = cfg.gifts.details;
}

/* ---------- финал ---------- */

export function renderFinal(cfg) {
  const media = $('[data-final-media]');
  if (media) {
    media.innerHTML = '';
    if (cfg.final.image && cfg.final.image.src) {
      const image = frame(cfg.final.image);
      image.classList.remove('frame');
      media.append(image.firstElementChild || image);
    }
  }

  const names = $('[data-final-names]');
  if (names) {
    names.textContent = [cfg.couple.groom.name, cfg.couple.bride.name].filter(Boolean).join(' · ');
  }
}

/* ---------- скрытие пустых секций и темы листов ---------- */

export function pruneSections(cfg) {
  $$('[data-requires]').forEach((section) => {
    const filled = section.dataset.requires
      .split('|')
      .some((path) => !isEmpty(get(cfg, path.trim())));
    if (!filled) section.remove();
  });
}

const THEMES = {
  invitation: 'paper',
  names:      'blush',
  story:      'paper',
  gallery:    'paper',
  schedule:   'wine',
  places:     'paper',
  dresscode:  'blush',
  countdown:  'blush',
  gifts:      'paper',
  rsvp:       'paper'
};

export function applyThemes() {
  let previous = 'paper';           // сама «бумага» уже кремовая
  $$('main .section, main .band').forEach((node) => {
    if (node.classList.contains('band')) {
      previous = 'band';            // после кадра следующий блок — новый лист
      return;
    }
    const theme = THEMES[node.id] || 'paper';
    node.classList.add(`theme-${theme}`);
    if (theme !== previous) node.classList.add('sheet');
    previous = theme;
  });
}

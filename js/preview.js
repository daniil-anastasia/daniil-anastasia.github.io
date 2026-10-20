/* =========================================================
   ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ — только для режима ?preview

   Этот файл НЕ влияет на боевой сайт: он загружается,
   только если в адресе есть ?preview. Нужен, чтобы увидеть,
   как выглядят блоки, которые пока не заполнены
   (история, галерея, dress code, счётчик, подарки, финал).

   Реальные данные вносите в config.js, а не сюда.
   ========================================================= */

const P = 'assets/placeholders';
const photo = (file, w, h, alt) => ({ src: `${P}/${file}`, w, h, alt });

// дата для демонстрации счётчика — всегда в будущем
const soon = new Date(Date.now() + 127 * 864e5).toISOString();

export const preview = {
  couple: {
    groom: { childhoodPhoto: photo('child-1.svg', 600, 600, 'Даниил в детстве'),
             portrait: photo('portrait-1.svg', 900, 1200, 'Даниил') },
    bride: { childhoodPhoto: photo('child-2.svg', 600, 600, 'Анастасия в детстве'),
             portrait: photo('portrait-2.svg', 1000, 1250, 'Анастасия') }
  },

  dateLabel: '22 августа',

  names: {
    note: 'Подпись под именами — например, сколько лет вы вместе или короткая фраза от вас.'
  },

  story: {
    items: [
      { when: 'Год', title: 'Знакомство', text: 'Короткий абзац о том, как всё началось.',
        photo: photo('story-1.svg', 1000, 1250, 'Момент истории') },
      { when: 'Год', title: 'Первая поездка', text: 'Ещё один момент, который стоит запомнить.' },
      { when: 'Год', title: 'Общий дом', text: 'Текст события.',
        photo: photo('story-2.svg', 1000, 1250, 'Момент истории') },
      { when: 'Год', title: 'Предложение', text: 'Как это было.' }
    ]
  },

  gallery: {
    photos: Array.from({ length: 12 }, (_, i) => {
      const sizes = [[1000, 1250], [900, 1200], [1400, 933], [1000, 1000], [1600, 1000], [1000, 1250]];
      const [w, h] = sizes[i % 6];
      return photo(`g-${String(i + 1).padStart(2, '0')}.svg`, w, h, `Фотография ${i + 1}`);
    })
  },

  schedule: {
    items: [
      { time: '14:15', title: 'Сбор гостей', text: null },
      { time: '15:00', title: 'Церемония', text: 'Пример события программы.' },
      { time: '17:00', title: 'Ужин', text: null },
      { time: '23:00', title: 'Завершение вечера', text: null }
    ]
  },

  locations: {
    ceremony:   { note: 'Примечание к месту: как пройти, где вход, где встречаемся.' },
    restaurant: { photo: photo('g-03.svg', 1400, 933, 'Ресторан') }
  },

  dressCode: {
    title: 'Название стиля',
    subtitle: 'Одна фраза, задающая настроение образа.',
    description: [
      'Абзац с описанием: что мы имеем в виду, насколько строго и что важнее всего.',
      'Второй абзац — про комфорт и про то, что главное всё-таки вы, а не ткань.'
    ],
    colors: [
      { name: 'Бордо',   hex: '#5E1020' },
      { name: 'Молочный', hex: '#FBF6EE' },
      { name: 'Пыльный розовый', hex: '#EFD2D2' },
      { name: 'Графит',  hex: '#2E2A2B' },
      { name: 'Золото',  hex: '#B08A52' }
    ],
    looks: [1, 2, 3, 4].map((i) => photo(`look-${i}.svg`, 900, 1200, `Пример образа ${i}`)),
    recommended: ['Пример пожелания к образу', 'Ещё одно пожелание', 'И третье'],
    avoid: ['Пример того, что лучше отложить', 'И ещё один пункт']
  },

  countdown: { enabled: true, date: soon },

  gifts: {
    enabled: true,
    title: 'Подарки',
    text: ['Здесь будет текст про подарки — в той формулировке, которая вам ближе.'],
    details: '<b>Строка с деталями</b><br>Например, реквизиты или пожелание.'
  },

  final: {
    eyebrow: 'До встречи',
    sub: 'Короткая строка под финальной фразой.',
    image: photo('final.svg', 1800, 1200, 'Даниил и Анастасия')
  },

  rsvp: {
    note: 'Пояснение к анкете: до какой даты ответить и почему это важно.',
    questions: [
      {
        id: 'attendance', type: 'radio', required: true, role: 'attendance',
        label: 'Сможете быть с нами?',
        options: ['Да, будем', 'К сожалению, не смогу']
      },
      {
        id: 'guests', type: 'number', label: 'Сколько вас будет?', role: 'guests',
        min: 1, max: 10, placeholder: '1',
        showIf: { id: 'attendance', in: ['Да, будем'] }
      },
      {
        id: 'drinks', type: 'checkbox', label: 'Что предпочитаете из напитков?',
        options: ['Вино красное', 'Вино белое', 'Шампанское', 'Крепкое', 'Безалкогольное'],
        showIf: { id: 'attendance', in: ['Да, будем'] }
      },
      {
        id: 'note', type: 'textarea', label: 'Есть что-то, что нам стоит знать?',
        placeholder: 'Аллергии, пожелания, что угодно'
      }
    ]
  }
};

export default preview;

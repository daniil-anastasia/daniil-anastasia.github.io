/* Анкета: схема из конфига → форма → отправка на серверный endpoint. */

import { $, el, isEmpty } from './utils.js';

export function initRsvp(cfg) {
  const form   = $('[data-rsvp-form]');
  const fields = $('[data-rsvp-fields]');
  const done   = $('[data-rsvp-success]');
  const error  = $('[data-rsvp-error]');
  const button = $('[data-rsvp-submit]');
  if (!form || !fields) return;

  const schema = [cfg.rsvp.nameQuestion, ...(cfg.rsvp.questions || [])]
    .filter((question) => question && question.id && question.type);

  const controls = schema.map((question) => buildField(question)).filter(Boolean);
  controls.forEach((control) => fields.append(control.node));

  /* --- условный показ --- */
  const values = () => {
    const map = {};
    controls.forEach((control) => { map[control.question.id] = control.value(); });
    return map;
  };

  const syncVisibility = () => {
    const current = values();
    controls.forEach((control) => {
      const rule = control.question.showIf;
      if (!rule) return;
      const answer = current[rule.id];
      const list = [].concat(answer == null ? [] : answer);
      let visible = true;
      if (rule.in)     visible = list.some((item) => rule.in.includes(item));
      if (rule.equals != null) visible = list.includes(rule.equals);
      control.node.hidden = !visible;
      if (!visible) control.clear();
    });
  };

  form.addEventListener('input', syncVisibility);
  form.addEventListener('change', syncVisibility);
  syncVisibility();

  /* --- отправка --- */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (error) { error.hidden = true; error.textContent = ''; }

    const visible = controls.filter((control) => !control.node.hidden);
    let firstInvalid = null;

    visible.forEach((control) => {
      const message = control.validate();
      control.setError(message);
      if (message && !firstInvalid) firstInvalid = control;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (form.querySelector('[name="company"]') && form.querySelector('[name="company"]').value) return;

    const payload = {
      name: (visible.find((control) => control.question.role === 'name') || {}).value?.() || null,
      answers: visible.map((control) => ({
        id: control.question.id,
        label: control.question.label || control.question.id,
        role: control.question.role || null,
        value: control.value()
      })),
      meta: {
        submittedAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null
      }
    };

    button && button.classList.add('is-busy');
    button && (button.disabled = true);

    try {
      await send(cfg, payload);
      form.classList.add('is-hidden');
      if (done) {
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus({ preventScroll: true });
      }
    } catch (sendError) {
      if (error) {
        error.textContent = 'Не получилось отправить ответ. Проверьте соединение и попробуйте ещё раз.';
        error.hidden = false;
      }
      console.error('[rsvp]', sendError);
    } finally {
      button && button.classList.remove('is-busy');
      button && (button.disabled = false);
    }
  });
}

/* ---------- отправка ---------- */

async function send(cfg, payload) {
  if (cfg.__preview) {                       // предпросмотр — без сети
    await new Promise((resolve) => setTimeout(resolve, 700));
    console.info('[rsvp] предпросмотр, данные не отправлены:', payload);
    return;
  }

  const endpoint = cfg.rsvp.endpoint;
  if (!endpoint) throw new Error('rsvp.endpoint не задан в config.js');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const direct = Boolean(cfg.rsvp.direct);
    const body = direct
      ? { ...payload, publicSite: 'daniil-anastasia.site' }
      : payload;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': direct ? 'text/plain;charset=utf-8' : 'application/json' },
      body: JSON.stringify(body),
      mode: direct ? 'no-cors' : 'cors',
      signal: controller.signal
    });
    // Apps Script отвечает через перенаправление на googleusercontent.com.
    // В режиме no-cors ответ непрозрачный, но успешное завершение fetch означает,
    // что браузер передал анкету веб-приложению.
    if (!direct && !response.ok) throw new Error(`HTTP ${response.status}`);
    if (direct) return { ok: true };
    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- поля ---------- */

function buildField(question) {
  const id = `f-${question.id}`;
  const required = Boolean(question.required);
  const group = ['radio', 'checkbox'].includes(question.type);

  const node = el(group ? 'fieldset' : 'div', { class: 'field' });
  const errorNode = el('p', { class: 'field__error', id: `${id}-error` });

  const labelText = [question.label || '', required ? '<span class="field__req"> *</span>' : ''].join('');
  node.append(el(group ? 'legend' : 'label', {
    class: 'field__label',
    html: labelText,
    for: group ? null : id
  }));

  if (question.hint) node.append(el('span', { class: 'field__hint', text: question.hint }));

  let read = () => null;
  let clear = () => {};
  let focus = () => {};

  if (group) {
    const options = normalize(question.options);
    const box = el('div', { class: 'options' });

    options.forEach((option, index) => {
      const inputId = `${id}-${index}`;
      const input = el('input', {
        type: question.type,
        name: question.type === 'radio' ? id : `${id}[]`,
        id: inputId,
        value: option.value,
        'aria-describedby': `${id}-error`
      });
      box.append(el('label', { class: `option${question.type === 'checkbox' ? ' option--check' : ''}`, for: inputId }, [
        input,
        el('span', { class: 'option__mark', 'aria-hidden': 'true' }),
        el('span', { class: 'option__text', text: option.label })
      ]));
    });

    node.append(box);

    read = () => {
      const checked = Array.from(box.querySelectorAll('input:checked')).map((input) => input.value);
      return question.type === 'radio' ? (checked[0] ?? null) : checked;
    };
    clear = () => box.querySelectorAll('input').forEach((input) => { input.checked = false; });
    focus = () => { const first = box.querySelector('input'); if (first) first.focus(); };

  } else if (question.type === 'select') {
    const select = el('select', { class: 'input', id, 'aria-describedby': `${id}-error` });
    select.append(el('option', { value: '', text: question.placeholder || '— выберите —' }));
    normalize(question.options).forEach((option) => {
      select.append(el('option', { value: option.value, text: option.label }));
    });
    node.append(select);
    read = () => select.value || null;
    clear = () => { select.value = ''; };
    focus = () => select.focus();

  } else {
    const tag = question.type === 'textarea' ? 'textarea' : 'input';
    const input = el(tag, {
      class: 'input',
      id,
      name: id,
      type: tag === 'input' ? (question.type === 'number' ? 'number' : 'text') : null,
      inputmode: question.type === 'number' ? 'numeric' : null,
      min: question.min ?? null,
      max: question.max ?? null,
      rows: question.type === 'textarea' ? 3 : null,
      maxlength: question.maxlength || 400,
      placeholder: question.placeholder || '',
      autocomplete: question.role === 'name' ? 'name' : 'off',
      'aria-describedby': `${id}-error`
    });
    node.append(input);
    read = () => (input.value || '').trim() || null;
    clear = () => { input.value = ''; };
    focus = () => input.focus();
  }

  node.append(errorNode);

  return {
    question,
    node,
    value: read,
    clear,
    focus,
    validate() {
      const value = read();
      if (required && isEmpty(value)) return 'Пожалуйста, ответьте на этот вопрос.';
      if (question.type === 'number' && value != null && Number.isNaN(Number(value))) return 'Введите число.';
      return null;
    },
    setError(message) {
      errorNode.textContent = message || '';
      node.classList.toggle('is-invalid', Boolean(message));
      const control = node.querySelector('.input');
      if (control) control.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  };
}

function normalize(options) {
  return (options || []).map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option
  ).filter((option) => option && option.value != null);
}

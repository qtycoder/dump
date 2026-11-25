// UI helpers. Everything is built with DOM nodes and textContent, never innerHTML
// with user data, so ticket text can never inject script (XSS-safe).

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  let value;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'value') value = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  if (value !== undefined) el.value = value;
  return el;
}

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  ticket: '<path d="M3 9a2 2 0 002-2V5h14v2a2 2 0 000 4v2a2 2 0 000 4v2H5v-2a2 2 0 00-2-2z"/><path d="M9 9h6M9 13h4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.4c2 .8 3.5 2.6 3.5 5.6"/>',
  building: '<path d="M4 21V5l8-3 8 3v16"/><path d="M2 21h20M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  pc: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  wifi: '<path d="M2 9a15 15 0 0120 0M5 12.5a10.5 10.5 0 0114 0M8.5 16a5.5 5.5 0 017 0"/><path d="M12 19.5h.01"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  camera: '<path d="M3 8h12v8H3z"/><path d="M15 11l6-3v8l-6-3"/>',
  db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  more: '<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
};

/** Icon name for a concern (category) by its name. */
function categoryIcon(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('printer')) return 'printer';
  if (n.includes('internet') || n.includes('wi-fi')) return 'wifi';
  if (n.includes('cctv')) return 'camera';
  if (n.includes('document')) return 'doc';
  if (n.includes('emr') || n.includes('system')) return 'db';
  if (n === 'pc' || n.includes('computer')) return 'pc';
  return 'more';
}

function icon(name, size = 20) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.8');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name] || ''; // static, trusted strings only
  return s;
}

// ---------- formatting ----------
const TZ = 'Asia/Manila';
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-PH', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });
}
function fmtDay(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' });
}
const STATUS = {
  OPEN: ['Open', 'b-blue'],
  IN_PROGRESS: ['In Progress', 'b-warn'],
  RESOLVED: ['Resolved', 'b-ok'],
  CLOSED: ['Closed', 'b-gray'],
};
const PRIORITY = {
  LOW: ['Low', 'b-gray'],
  NORMAL: ['Normal', 'b-blue'],
  HIGH: ['High', 'b-warn'],
  URGENT: ['Urgent', 'b-bad'],
};
const ROLE = {
  ADMIN: ['Admin', 'b-purple'],
  IT_STAFF: ['IT Staff', 'b-blue'],
  REQUESTER: ['Requester', 'b-gray'],
};
function badge(map, key) {
  const [text, cls] = map[key] || [key, 'b-gray'];
  return h('span', { class: 'badge ' + cls }, text);
}
function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

// ---------- toast ----------
function toast(message, type = 'ok') {
  const box = document.getElementById('toasts');
  const t = h('div', { class: 'toast ' + type, role: type === 'error' ? 'alert' : 'status' }, message);
  box.append(t);
  setTimeout(() => t.remove(), type === 'error' ? 6000 : 3500);
}

// ---------- modal ----------
function modal({ title, content, wide = false }) {
  const previous = document.activeElement;
  const overlay = h('div', { class: 'overlay', onmousedown: (e) => { if (e.target === overlay) close(); } });
  const dialog = h('div', { class: 'dialog glass' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'dialog-head' },
      h('h2', {}, title),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', onclick: () => close() }, icon('close'))),
    h('div', { class: 'dialog-body' }, content));
  overlay.append(dialog);
  document.body.append(overlay);

  function focusables() {
    return [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function close() {
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    if (previous && previous.focus) previous.focus();
  }
  document.addEventListener('keydown', onKey, true);
  const firstField = dialog.querySelector('input:not([type=checkbox]), select, textarea');
  (firstField || dialog.querySelector('button')).focus();
  return { close, el: dialog };
}

function confirmDialog(message, { confirmText = 'Delete', danger = true } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; m.close(); resolve(v); } };
    const m = modal({
      title: 'Please confirm',
      content: [
        h('p', {}, message),
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => finish(false) }, 'Cancel'),
          h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), type: 'button', onclick: () => finish(true) }, confirmText)),
      ],
    });
    // closing with X / Esc counts as "no"
    new MutationObserver((_, obs) => { if (!document.body.contains(m.el)) { obs.disconnect(); finish(false); } })
      .observe(document.body, { childList: true });
  });
}

// ---------- form controls ----------
let uid = 0;
const nextId = () => 'f' + (++uid);

function textField({ label, name, type = 'text', value = '', required, placeholder, hint, maxlength, autocomplete }) {
  const id = nextId();
  const input = h('input', { class: 'field', id, name, type, value, placeholder, maxlength, autocomplete, required, 'aria-required': required ? 'true' : null });
  const el = h('div', { class: 'field-wrap' },
    h('label', { for: id }, label, required ? h('span', { class: 'req' }, ' *') : null), input,
    hint ? h('span', { class: 'hint' }, hint) : null);
  return { el, input, get value() { return input.value; } };
}

function textArea({ label, name, value = '', required, placeholder, hint, maxlength = 4000, rows = 4 }) {
  const id = nextId();
  const input = h('textarea', { class: 'field', id, name, placeholder, maxlength, rows, required, 'aria-required': required ? 'true' : null });
  input.value = value || '';
  const el = h('div', { class: 'field-wrap' },
    h('label', { for: id }, label, required ? h('span', { class: 'req' }, ' *') : null), input,
    hint ? h('span', { class: 'hint' }, hint) : null);
  return { el, input, get value() { return input.value; } };
}

/** options: [[value, label], ...]. value '' means "none". */
function selectField({ label, name, options, value = '', required, hint, onChange }) {
  const id = nextId();
  const input = h('select', { class: 'field', id, name, required, 'aria-required': required ? 'true' : null, onchange: onChange });
  setOptions(input, options, value);
  const el = h('div', { class: 'field-wrap' },
    h('label', { for: id }, label, required ? h('span', { class: 'req' }, ' *') : null), input,
    hint ? h('span', { class: 'hint' }, hint) : null);
  return { el, input, get value() { return input.value; } };
}

function setOptions(select, options, value = '') {
  select.replaceChildren(...options.map(([v, l]) => h('option', { value: String(v) }, l)));
  select.value = String(value ?? '');
  if (select.value !== String(value ?? '')) select.value = '';
}

function switchField({ label, checked = false, name }) {
  const input = h('input', { type: 'checkbox', name, role: 'switch' });
  input.checked = !!checked;
  const el = h('label', { class: 'switch' }, input, h('span', { class: 'track' }), h('span', {}, label));
  return { el, input, get value() { return input.checked; } };
}

function checkboxField({ label, checked = false, name }) {
  const input = h('input', { type: 'checkbox', name });
  input.checked = !!checked;
  const el = h('label', { class: 'checkbox' }, input, h('span', { class: 'box' }, icon('check', 18)), h('span', {}, label));
  return { el, input, get value() { return input.checked; } };
}

function segmented(items, current, onPick) {
  const wrap = h('div', { class: 'segmented', role: 'group' });
  const draw = (cur) => wrap.replaceChildren(...items.map(([v, l]) =>
    h('button', { type: 'button', 'aria-pressed': String(v === cur), onclick: () => { draw(v); onPick(v); } }, l)));
  draw(current);
  return wrap;
}

/** Run an async action on a button: disables it, shows errors in `errBox`. */
async function withBusy(button, errBox, fn) {
  button.disabled = true;
  if (errBox) errBox.textContent = '';
  try {
    return await fn();
  } catch (e) {
    if (errBox) errBox.textContent = e.message;
    else toast(e.message, 'error');
    return undefined;
  } finally {
    button.disabled = false;
  }
}

const nameOf = (list, id, key = 'name') => (list.find((x) => x.id === id) || {})[key] || '';

/* Helpers: DOM, escaping, validation, toast, theme, page transitions */
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fullName = s => [s.first, s.middle, s.last].filter(Boolean).join(' ');
const calcAge = d => { const b = new Date(d), n = new Date(); if (isNaN(b)) return ''; let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };

function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400); }

/** Validate a student object. Returns {field: message}; empty object = valid. */
function validateStudent(s, editingLrn) {
  const e = {};
  ['lrn','first','last','age','birthdate','gender','grade','section','guardian','contact','address','enrolled']
    .forEach(k => { if (!String(s[k] ?? '').trim()) e[k] = 'Required'; });
  if (!e.lrn) {
    if (!/^\d{12}$/.test(s.lrn)) e.lrn = 'LRN must be exactly 12 digits';
    else if (s.lrn !== editingLrn && Store.where(s.lrn)) e.lrn = 'This LRN already exists' + (Store.where(s.lrn) === 'active' ? '' : ' (in ' + Store.where(s.lrn) + ')');
  }
  if (!e.contact && !/^(09|\+639)\d{9}$/.test(s.contact.replace(/[\s-]/g, ''))) e.contact = 'Use 09XXXXXXXXX format';
  if (!e.age && (s.age < 3 || s.age > 18)) e.age = 'Age must be 3–18';
  return e;
}

// Theme (dark mode) — applied immediately to avoid flash
const applyTheme = t => document.documentElement.dataset.theme = t;
applyTheme(localStorage.getItem('sps_theme') || 'light');

// Smooth page transitions for internal links
const goTo = url => { document.body.classList.add('leaving'); setTimeout(() => location.href = url, 250); };
document.addEventListener('click', e => {
  const a = e.target.closest('a[href*=".html"]');
  if (!a) return; e.preventDefault(); goTo(a.href);
});

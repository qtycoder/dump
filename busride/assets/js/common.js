/* Shared helpers for every page: API calls, nav, view toggle, toast, modal, ticket. */
window.BR = (() => {
  'use strict';

  const BASE = (document.querySelector('meta[name="br-base"]') || {}).content || '';
  const state = { user: null };

  /* ---------- tiny DOM builder (uses textContent, so user data can't inject HTML) ---------- */
  function el(tag, props, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
      else n.setAttribute(k, v === true ? '' : String(v));
    }
    const add = (kid) => {
      if (kid === null || kid === undefined || kid === false) return;
      if (Array.isArray(kid)) kid.forEach(add);
      else n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    };
    kids.forEach(add);
    return n;
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(text) {
    let t = document.getElementById('toast');
    if (!t) {
      t = el('div', { class: 'toast', id: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.append(t);
    }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- API ---------- */
  async function api(path, data) {
    const opts = { credentials: 'same-origin' };
    if (data !== undefined) {
      opts.method = 'POST';
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(data);
    }
    let res;
    try {
      res = await fetch(BASE + path, opts);
    } catch (_) {
      throw new Error('Cannot reach the server. Make sure PHP is running.');
    }
    let json = {};
    try { json = await res.json(); } catch (_) { /* not JSON */ }
    if (!res.ok) {
      const err = new Error(json.error || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return json;
  }

  /* ---------- formatting ---------- */
  const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseDate = (s) => new Date(String(s).replace(' ', 'T'));
  const fmtDay = (s) => parseDate(s).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (s) => parseDate(s).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const fmtDateTime = (s) => fmtDay(s) + ', ' + fmtTime(s);
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
  const duration = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    return (h ? h + 'h ' : '') + (m || !h ? m + 'm' : '').trim();
  };
  const PAY_LABEL = { cash: 'Cash on boarding', gcash: 'GCash (demo)', maya: 'Maya (demo)' };

  /* ---------- illustrated bus (no image files needed) ---------- */
  function busSVG(color) {
    const c = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#2fd6c8';
    let windows = '';
    for (let i = 0; i < 5; i++) windows += `<rect x="${26 + i * 40}" y="42" width="34" height="32" rx="7"/>`;
    return `<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bus">
      <ellipse cx="160" cy="138" rx="138" ry="8" fill="rgba(0,0,0,.2)"/>
      <rect x="10" y="24" width="300" height="96" rx="28" fill="${c}"/>
      <rect x="56" y="14" width="96" height="14" rx="7" fill="rgba(255,255,255,.7)"/>
      <rect x="10" y="86" width="300" height="12" fill="rgba(255,255,255,.55)"/>
      <g fill="#17303a" fill-opacity=".88">${windows}<path d="M232 40h58a12 12 0 0 1 12 12v22H232z"/></g>
      <rect x="298" y="94" width="8" height="12" rx="3" fill="#ffd88a"/>
      <circle cx="86" cy="120" r="20" fill="#1b1b1d"/><circle cx="86" cy="120" r="8" fill="#cfd3d6"/>
      <circle cx="244" cy="120" r="20" fill="#1b1b1d"/><circle cx="244" cy="120" r="8" fill="#cfd3d6"/>
    </svg>`;
  }

  /* ---------- Landscape / mobile toggle ---------- */
  const VIEW_KEY = 'busride:view';
  function applyView(mode, save) {
    const mobile = mode === 'mobile';
    document.body.classList.toggle('mode-mobile', mobile);
    const btn = document.getElementById('viewToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(mobile));
      const label = btn.querySelector('#viewLabel');
      if (label) label.textContent = mobile ? 'Landscape view' : 'Mobile view';
    }
    if (save) { try { localStorage.setItem(VIEW_KEY, mode); } catch (_) { /* ok */ } }
  }
  function initView() {
    let saved = null;
    try { saved = localStorage.getItem(VIEW_KEY); } catch (_) { /* ok */ }
    applyView(saved || (window.innerWidth <= 768 ? 'mobile' : 'landscape'), false);
    const btn = document.getElementById('viewToggle');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        applyView(document.body.classList.contains('mode-mobile') ? 'landscape' : 'mobile', true);
      });
    }
  }

  /* ---------- liquid-glass highlight that follows the pointer ---------- */
  document.addEventListener('pointermove', (e) => {
    const t = e.target.closest ? e.target.closest('.liquid') : null;
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- modal ---------- */
  function modal(content, opts = {}) {
    const back = el('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true' });
    const box = el('div', { class: 'modal gcard' }, content);
    back.append(box);
    function close() {
      back.remove();
      document.removeEventListener('keydown', onKey);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    return { close, box };
  }

  /* ---------- ticket ---------- */
  function badge(text, kind) { return el('span', { class: 'badge ' + (kind || ''), text }); }
  const PAY_KIND = { paid: 'ok', unpaid: 'warn', refunded: 'info' };

  function showTicket(b, extra) {
    const row = (k, v) => el('div', { class: 'trow' }, el('dt', { text: k }), el('dd', null, v));
    const bookMore = BASE + 'trips.html';
    let note = '';
    if (b.status === 'cancelled') note = 'This booking was cancelled.';
    else if (b.payment_method === 'cash') note = 'Pay ' + peso(b.amount) + ' in cash when you board. Please arrive 15 minutes early.';
    else note = 'Demo payment: no real money was charged. Show this code when you board.';
    if (extra && extra.note) note = extra.note;

    const m = modal(el('div', { class: 'ticket' },
      el('div', { class: 'ticket-head' },
        el('div', null, el('p', { class: 'k', text: 'Ticket' }), el('h2', { class: 'ticket-code', text: b.code })),
        badge(cap(b.status), b.status === 'confirmed' ? 'ok' : 'bad')
      ),
      el('dl', { class: 'tlist' },
        row('Passenger', b.passenger_name),
        row('Route', b.origin + ' → ' + b.destination),
        row('Departure', fmtDateTime(b.depart_at)),
        row('Bus', b.model_name + ' · ' + b.plate_no),
        row('Driver', b.driver_name),
        row('Seat', '#' + b.seat_no),
        row('Fare', b.fare_label),
        row('Amount', peso(b.amount)),
        row('Payment', [PAY_LABEL[b.payment_method] || b.payment_method, ' ', badge(cap(b.payment_status), PAY_KIND[b.payment_status])]),
        b.reference_no ? row('Reference', b.reference_no) : null
      ),
      el('p', { class: 'fine wide', text: note }),
      el('div', { class: 'btn-row' },
        extra && extra.primary ? extra.primary : null,
        el('button', { class: 'btn ghost', type: 'button', text: 'Close', on: { click: () => m.close() } })
      )
    ), { onClose: extra && extra.onClose });
    return m;
  }

  /* ---------- nav + auth guard ---------- */
  async function logout() {
    try { await api('api/logout.php', {}); } catch (_) { /* ignore */ }
    location.href = BASE + 'index.html';
  }

  function toggleButton() {
    const b = el('button', { class: 'view-toggle in-nav', id: 'viewToggle', type: 'button', 'aria-pressed': 'false' });
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg><span id="viewLabel">Mobile view</span>';
    return b;
  }

  async function mountNav(active) {
    const header = document.getElementById('topnav');
    let user = null;
    try { user = (await api('api/me.php')).user; } catch (_) { /* server not ready */ }
    state.user = user;

    const links = [['discover', 'Discover', 'discover.html'], ['trips', 'Trips', 'trips.html']];
    if (user && user.role === 'admin') links.push(['admin', 'Admin', 'admin/index.html']);
    else {
      links.push(['book', 'Book', 'book.html']);
      if (user) links.push(['dashboard', 'Dashboard', 'dashboard.html']);
    }

    if (header) {
      header.className = 'topnav liquid';
      header.replaceChildren(
        el('a', { class: 'brand', href: BASE + 'index.html', text: 'Busride_' }),
        el('nav', { class: 'links', 'aria-label': 'Main' },
          links.map(([k, label, href]) => el('a', { href: BASE + href, class: k === active ? 'on' : null, text: label }))),
        el('div', { class: 'nav-right' },
          user ? [el('span', { class: 'who', text: user.name }),
                  el('button', { class: 'btn sm ghost', type: 'button', text: 'Log out', on: { click: logout } })]
               : el('a', { class: 'btn sm', href: BASE + 'index.html', text: 'Log in' }),
          toggleButton())
      );
    }
    initView();
    return user;
  }

  function currentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    return (BASE ? 'admin/' : '') + page + location.search;
  }

  // Redirects to the login page when needed. Returns the user, or null if redirecting.
  async function requireUser(active, opts = {}) {
    const user = await mountNav(active);
    if (!user) {
      location.replace(BASE + 'index.html?next=' + encodeURIComponent(currentPage()));
      return null;
    }
    if (opts.admin && user.role !== 'admin') {
      location.replace(BASE + 'dashboard.html');
      return null;
    }
    if (opts.userOnly && user.role === 'admin') {
      location.replace(BASE + 'admin/index.html');
      return null;
    }
    return user;
  }

  return {
    BASE, state, el, toast, api, peso, parseDate, fmtDay, fmtTime, fmtDateTime, cap, duration,
    PAY_LABEL, PAY_KIND, busSVG, initView, modal, badge, showTicket, mountNav, requireUser, logout,
  };
})();

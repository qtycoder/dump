(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const body = document.body;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ---------- Landscape / Mobile toggle ---------- */
  const VIEW_KEY = 'busride:view';
  const toggleBtn = $('#viewToggle');
  const viewLabel = $('#viewLabel');

  function applyView(mode, save) {
    const mobile = mode === 'mobile';
    body.classList.toggle('mode-mobile', mobile);
    toggleBtn.setAttribute('aria-pressed', String(mobile));
    viewLabel.textContent = mobile ? 'Landscape view' : 'Mobile view';
    if (save) {
      try { localStorage.setItem(VIEW_KEY, mode); } catch (_) { /* ok lang */ }
    }
  }

  let saved = null;
  try { saved = localStorage.getItem(VIEW_KEY); } catch (_) { /* ok lang */ }
  applyView(saved || (window.innerWidth <= 768 ? 'mobile' : 'landscape'), false);

  toggleBtn.addEventListener('click', () => {
    applyView(body.classList.contains('mode-mobile') ? 'landscape' : 'mobile', true);
  });

  /* ---------- Petsa sa white card ---------- */
  (function fillDate() {
    const days   = ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'];
    const short  = ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis'];
    const months = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto',
                    'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'];
    const d = new Date();
    $('#dMonth').textContent = short[d.getMonth()];
    $('#dYear').textContent  = d.getFullYear();
    $('#dWeek').textContent  = days[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0');
    $('#dFull').textContent  = months[d.getMonth()] + ' ' + d.getFullYear();
  })();

  /* ---------- API helper ---------- */
  async function api(path, data) {
    const opts = { credentials: 'same-origin' };
    if (data) {
      opts.method = 'POST';
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(data);
    }
    let res;
    try {
      res = await fetch(path, opts);
    } catch (_) {
      throw new Error('Walang koneksyon sa server. Siguraduhing tumatakbo ang PHP.');
    }
    let json = {};
    try { json = await res.json(); } catch (_) { /* hindi JSON */ }
    if (!res.ok) throw new Error(json.error || 'May error. Subukan ulit.');
    return json;
  }

  /* ---------- Auth ---------- */
  const authGuest  = $('#authGuest');
  const authUser   = $('#authUser');
  const authForm   = $('#authForm');
  const authTitle  = $('#authTitle');
  const authMsg    = $('#authMsg');
  const switchBtn  = $('#switchBtn');
  const nameField  = $('#nameField');
  const nameInput  = $('#nameInput');
  const emailInput = $('#emailInput');
  const passInput  = $('#passInput');
  const submitBtn  = authForm.querySelector('.go');
  let mode = 'login';

  function setMsg(text, ok) {
    authMsg.textContent = text || '';
    authMsg.classList.toggle('ok', !!ok);
  }

  function setMode(next) {
    mode = next;
    const reg = mode === 'register';
    authTitle.textContent = reg ? 'Sign up' : 'Log in';
    switchBtn.textContent = reg ? 'Log in' : 'Sign up';
    nameField.hidden = !reg;
    passInput.autocomplete = reg ? 'new-password' : 'current-password';
    setMsg('');
  }

  function showUser(user) {
    if (user) {
      $('#userName').textContent = user.name;
      authGuest.hidden = true;
      authUser.hidden = false;
      switchBtn.hidden = true;
    } else {
      authGuest.hidden = false;
      authUser.hidden = true;
      switchBtn.hidden = false;
    }
  }

  switchBtn.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passInput.value;
    const name = nameInput.value.trim();

    if (!email || !password) return setMsg('Ilagay ang email at password.');
    if (mode === 'register' && name.length < 2) return setMsg('Ilagay ang pangalan mo.');
    if (mode === 'register' && password.length < 8) return setMsg('Dapat 8 characters pataas ang password.');

    submitBtn.disabled = true;
    setMsg('');
    try {
      const payload = mode === 'register' ? { name, email, password } : { email, password };
      const { user } = await api(mode === 'register' ? 'api/register.php' : 'api/login.php', payload);
      authForm.reset();
      showUser(user);
      toast(mode === 'register' ? 'Nagawa na ang account mo!' : 'Naka-log in ka na.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try {
      await api('api/logout.php', {});
      showUser(null);
      setMode('login');
      toast('Naka-log out ka na.');
    } catch (err) {
      toast(err.message);
    }
  });

  $('#forgotBtn').addEventListener('click', () => toast('Wala pang reset password. Gagawin pa ito.'));
  $('#pinBtn').addEventListener('click', () => toast('Pinterest login: malapit na.'));
  $('#clickBtn').addEventListener('click', () => $('#refCard').scrollIntoView({ behavior: 'smooth', block: 'center' }));

  // Tingnan kung naka-log in na (session)
  api('api/me.php').then((r) => showUser(r.user)).catch(() => { /* hindi pa naka-setup ang server */ });

  /* ---------- References panel ---------- */
  const panel = $('#refPanel');
  const list = $('#refList');

  function closePanel() { panel.hidden = true; }

  $('#discoverBtn').addEventListener('click', async () => {
    if (!panel.hidden) return closePanel();
    list.textContent = '';
    panel.hidden = false;
    try {
      const { items } = await api('api/references.php');
      if (!items.length) {
        const li = document.createElement('li');
        li.textContent = 'Wala pang laman.';
        list.append(li);
        return;
      }
      for (const it of items) {
        const li = document.createElement('li');
        const t = document.createElement('strong');
        const d = document.createElement('span');
        const s = document.createElement('em');
        t.textContent = it.title;
        d.textContent = it.description;
        s.textContent = it.source;
        li.append(t, d, s);
        list.append(li);
      }
    } catch (err) {
      closePanel();
      toast(err.message);
    }
  });

  $('#panelClose').addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
})();

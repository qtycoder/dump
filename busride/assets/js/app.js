/* Landing page: log in / sign up, then send people to the right dashboard. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const { api, toast } = BR;

  BR.initView();

  /* ---------- Today's date on the white card ---------- */
  (function fillDate() {
    const d = new Date();
    $('#dMonth').textContent = d.toLocaleDateString('en-US', { month: 'short' });
    $('#dYear').textContent  = d.getFullYear();
    $('#dWeek').textContent  = d.toLocaleDateString('en-US', { weekday: 'long' }) + ' ' + String(d.getDate()).padStart(2, '0');
    $('#dFull').textContent  = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  /* ---------- Where to go after logging in ---------- */
  // Only same-site .html pages are allowed in ?next=, so the login can't be used to bounce people elsewhere.
  function safeNext() {
    const n = new URLSearchParams(location.search).get('next') || '';
    return /^(?:admin\/)?[a-z0-9_-]+\.html(?:\?[a-z0-9_=&.-]*)?$/i.test(n) ? n : '';
  }
  function goAfterLogin(user) {
    if (user.role === 'admin') location.href = 'admin/index.html';
    else location.href = safeNext() || 'dashboard.html';
  }

  /* ---------- Form state ---------- */
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
  const confirmField = $('#confirmField');
  const confirmInput = $('#confirmInput');
  const toggleBtn  = $('#togglePass');
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
    confirmField.hidden = !reg;
    confirmInput.value = '';
    passInput.autocomplete = reg ? 'new-password' : 'current-password';
    setMsg('');
  }

  function showUser(user, welcome) {
    if (user) {
      const first = user.name.split(' ')[0];
      const next = safeNext();
      $('#welcomeBadge').hidden = !welcome;
      $('#userHeading').textContent = welcome ? 'Welcome to Busride, ' + first + '!' : 'Hi, ' + first;
      $('#userText').textContent = welcome
        ? 'Your account is ready. Explore our buses and routes, or book your first trip right now.'
        : 'You are logged in. Continue to your dashboard or book a trip.';
      const dash = $('#dashLink');
      if (welcome) {
        dash.href = next || 'trips.html';
        dash.textContent = next ? 'Continue booking' : 'Book your first trip';
      } else {
        dash.href = user.role === 'admin' ? 'admin/index.html' : 'dashboard.html';
        dash.textContent = user.role === 'admin' ? 'Go to admin dashboard' : 'Go to dashboard';
      }
      $('#exploreLink').hidden = !welcome;
      authGuest.hidden = true;
      authUser.hidden = false;
      switchBtn.hidden = true;
    } else {
      authGuest.hidden = false;
      authUser.hidden = true;
      switchBtn.hidden = false;
    }
  }

  /* ---------- Key icon: click to show / hide the password ---------- */
  toggleBtn.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    confirmInput.type = passInput.type;
    toggleBtn.classList.toggle('on', show);
    toggleBtn.setAttribute('aria-pressed', String(show));
    const label = show ? 'Hide password' : 'Show password';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.title = label;
    passInput.focus();
  });
  $('#passField').addEventListener('click', (e) => { if (!e.target.closest('button')) passInput.focus(); });

  switchBtn.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passInput.value;
    const name = nameInput.value.trim();

    if (!email || !password) return setMsg('Enter your email and password.');
    if (mode === 'register' && name.length < 2) return setMsg('Enter your full name.');
    if (mode === 'register' && password.length < 8) return setMsg('Password must be at least 8 characters.');
    if (mode === 'register' && password !== confirmInput.value) return setMsg('The two passwords do not match.');

    submitBtn.disabled = true;
    setMsg('');
    try {
      const payload = mode === 'register' ? { name, email, password } : { email, password };
      const { user } = await api(mode === 'register' ? 'api/register.php' : 'api/login.php', payload);
      authForm.reset();
      if (mode === 'register') {                 // new account: welcome them, let them choose where to go
        showUser(user, true);
        toast('Account created. Welcome!');
        submitBtn.disabled = false;
      } else {
        toast('Welcome back!');
        goAfterLogin(user);
      }
    } catch (err) {
      setMsg(err.message);
      submitBtn.disabled = false;
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try {
      await api('api/logout.php', {});
      showUser(null);
      setMode('login');
      toast('You are logged out.');
    } catch (err) {
      toast(err.message);
    }
  });

  $('#forgotBtn').addEventListener('click', () => toast('Password reset is not available yet. Ask an admin to reset it.'));

  // Already logged in? Show a shortcut instead of the form.
  api('api/setup_admin.php').then((r) => { if (r.available) $('#setupHint').hidden = false; }).catch(() => { /* ignore */ });
  api('api/me.php').then((r) => showUser(r.user)).catch(() => { /* server not set up yet */ });

  /* ---------- After booking: thank-you screen with the 3D bus ---------- */
  (async function arrival() {
    const code = new URLSearchParams(location.search).get('booked');
    if (!code) return;
    history.replaceState(null, '', location.pathname);        // a refresh won't show it again
    let b = null;
    try { b = (await api('api/my_bookings.php')).bookings.find((x) => x.code === code); } catch (_) { /* not logged in */ }
    if (!b) return;

    const { el, fmtDateTime, peso } = BR;
    const row = (k, v) => el('div', { class: 'trow' }, el('dt', { text: k }), el('dd', { text: v }));
    $('#arName').textContent = b.passenger_name.split(' ')[0];
    $('#arPhone').textContent = b.contact_phone || 'the contact details you gave';
    $('#arTicket').replaceChildren(
      row('Ticket code', b.code),
      row('Route', b.origin + ' → ' + b.destination),
      row('Departure', fmtDateTime(b.depart_at)),
      row('Seat', '#' + b.seat_no),
      row('Total', peso(b.amount) + (b.payment_method === 'cash' ? ' · pay on boarding' : ' · paid (demo)')));

    const box = $('#arrive');
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() { box.hidden = true; document.removeEventListener('keydown', onKey); }
    $('#arClose').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    box.hidden = false;
  })();
})();

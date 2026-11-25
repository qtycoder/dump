
const app = document.getElementById('app');
const ctx = {
  user: null,
  params: new URLSearchParams(),
  lookups: { departments: [], categories: [], issues: [], users: [] },
  refreshLookups,
};

// Employees and admin/IT staff get different dashboards (and employees only see their own tickets).
const ROUTES = {
  dashboard: { label: 'Dashboard', employeeLabel: 'Home', icon: 'home',
    render: (root, c) => (c.user.role === 'REQUESTER' ? renderEmployeeDashboard(root, c) : renderAdminDashboard(root, c)) },
  tickets: { label: 'Tickets', employeeLabel: 'My Tickets', icon: 'ticket', render: renderTickets },
  departments: { label: 'Departments', icon: 'building', render: renderDepartments, admin: true },
  concerns: { label: 'Concerns', icon: 'list', render: renderCatalog, admin: true },
  users: { label: 'Users', icon: 'users', render: renderUsers, admin: true },
};

async function refreshLookups() {
  const staff = ctx.user.role !== 'REQUESTER';
  const [departments, categories, issues, users] = await Promise.all([
    get('/departments'), get('/categories'), get('/issues'), staff ? get('/users') : Promise.resolve([]),
  ]);
  Object.assign(ctx.lookups, { departments, categories, issues, users });
}

// ------------------------------------------------------------------ boot
async function boot() {
  if (!session.token) return showPublic();
  try {
    ctx.user = await get('/auth/me');
    await refreshLookups();
    showShell();
  } catch {
    session.clear();
    showPublic();
  }
}

// Not signed in: homepage (#/), sign in (#/login), sign up (#/signup).
let pendingNotice = '';
function showPublic() {
  ctx.user = null;
  main = null;
  const notice = pendingNotice;
  pendingNotice = '';
  const page = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (page === 'login') renderLogin(app, afterAuth, notice);
  else if (page === 'signup') renderSignup(app, afterAuth);
  else renderHome(app);
  window.scrollTo(0, 0);
}

// After sign in or sign up: go to the dashboard that matches the role.
async function afterAuth(user) {
  ctx.user = user;
  await refreshLookups();
  location.hash = '#/dashboard';
  showShell();
}

window.addEventListener('hts:unauthorized', () => {
  pendingNotice = 'Your session has ended. Please sign in again.';
  if (location.hash === '#/login') showPublic(); else location.hash = '#/login';
});

// ------------------------------------------------------------------ shell
let main, nav, banner, routeToken = 0;

function showShell() {
  const search = h('input', { class: 'field', type: 'search', placeholder: 'Search tickets…', 'aria-label': 'Search tickets' });
  const searchBtn = h('button', { type: 'submit', 'aria-label': 'Search' }, icon('search', 18));

  const menu = h('div', { class: 'menu glass', hidden: true },
    h('div', { class: 'who' }, h('b', {}, ctx.user.fullName), h('span', {}, `${ROLE[ctx.user.role][0]} · @${ctx.user.username}`)),
    h('button', { type: 'button', onclick: () => { menu.hidden = true; changePasswordDialog(); } }, icon('key', 18), 'Change password'),
    ctx.user.role === 'ADMIN' ? h('button', { type: 'button', onclick: () => { menu.hidden = true; downloadBackup(); } }, icon('inbox', 18), 'Download backup') : null,
    ctx.user.role === 'ADMIN' ? h('button', { type: 'button', onclick: () => { menu.hidden = true; restoreBackup(); } }, icon('plus', 18), 'Restore backup') : null,
    ctx.user.role === 'ADMIN' ? h('p', { class: 'menu-note' }, 'Records are saved in this browser. Download a backup regularly.') : null,
    h('button', { type: 'button', onclick: signOut }, icon('logout', 18), 'Sign out'));
  const avatar = h('button', { class: 'avatar', type: 'button', 'aria-label': 'Account menu', 'aria-haspopup': 'true', onclick: () => { menu.hidden = !menu.hidden; } }, initials(ctx.user.fullName));
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.menu-wrap')) menu.hidden = true; });

  nav = h('nav', { class: 'tabs', 'aria-label': 'Main' },
    Object.entries(ROUTES).filter(([, r]) => !r.admin || ctx.user.role === 'ADMIN').map(([key, r]) =>
      h('a', { class: 'tab', href: '#/' + key, 'data-route': key }, icon(r.icon, 18),
        h('span', { class: 'lbl' }, ctx.user.role === 'REQUESTER' && r.employeeLabel ? r.employeeLabel : r.label))));

  banner = h('div');
  main = h('main', { id: 'main' });

  app.replaceChildren(h('div', { class: 'shell' },
    h('header', { class: 'topbar' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('pulse', 22)), h('span', {}, 'Hospital IT Help Desk', h('small', {}, { ADMIN: 'Admin console', IT_STAFF: 'IT staff console', REQUESTER: 'Employee portal' }[ctx.user.role]))),
      h('div', { class: 'header-segment' },
        h('form', { class: 'search-pill', role: 'search', onsubmit: (e) => { e.preventDefault(); location.hash = '#/tickets?q=' + encodeURIComponent(search.value.trim()); } }, search, searchBtn),
        h('div', { class: 'menu-wrap' }, avatar, menu))),
    nav, banner, main));
  drawBanner();
  route();
}

function drawBanner() {
  if (!ctx.user.mustChangePassword) { banner.replaceChildren(); return; }
  banner.replaceChildren(h('div', { class: 'banner glass', role: 'status' },
    h('span', {}, 'For security, please change your password now.'),
    h('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: changePasswordDialog }, 'Change password')));
}

async function signOut() {
  try { await post('/auth/logout'); } catch { /* ignore */ }
  session.clear();
  ctx.user = null;
  main = null;
  if (location.hash === '#/') showPublic(); else location.hash = '#/';
}

async function downloadBackup() {
  try {
    const text = await Backend.backup(session.token);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: `hospital-helpdesk-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup downloaded. Keep the file safe: it contains all records.');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function restoreBackup() {
  const input = h('input', { type: 'file', accept: '.json,application/json' });
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    if (!(await confirmDialog('Restore this backup? All current records in this browser will be replaced and everyone will be signed out.', { confirmText: 'Restore', danger: true }))) return;
    try {
      const res = await Backend.restore(session.token, await file.text());
      toast(`Restored ${res.users} users and ${res.tickets} tickets. Reloading…`);
      session.clear();
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      toast(e.message, 'error');
    }
  });
  input.click();
}

function changePasswordDialog() {
  const current = textField({ label: 'Current password', type: 'password', required: true, autocomplete: 'current-password' });
  const next = textField({ label: 'New password', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 8 characters.' });
  const again = textField({ label: 'Confirm new password', type: 'password', required: true, autocomplete: 'new-password' });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const save = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Update password');
  const m = modal({
    title: 'Change password',
    content: h('form', { novalidate: true, style: 'display:grid;gap:14px', onsubmit: async (e) => {
      e.preventDefault();
      if (next.value !== again.value) { error.textContent = 'The new passwords do not match.'; return; }
      await withBusy(save, error, async () => {
        ctx.user = await post('/auth/change-password', { currentPassword: current.value, newPassword: next.value });
        m.close(); drawBanner(); toast('Password updated');
      });
    } }, current.el, next.el, again.el, error,
      h('div', { class: 'dialog-actions' }, h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Cancel'), save)),
  });
}

// ------------------------------------------------------------------ router
async function route() {
  if (!ctx.user || !main) return;
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  let key = path || 'dashboard';
  if (!ROUTES[key] || (ROUTES[key].admin && ctx.user.role !== 'ADMIN')) key = 'dashboard';
  ctx.params = new URLSearchParams(qs || '');

  nav.querySelectorAll('.tab').forEach((a) => {
    if (a.dataset.route === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  const token = ++routeToken;
  main.replaceChildren(h('p', { class: 'loading' }, 'Loading…'));
  const holder = h('div');
  try {
    await ROUTES[key].render(holder, ctx);
    if (token === routeToken) main.replaceChildren(holder);
  } catch (e) {
    if (token === routeToken) main.replaceChildren(h('p', { class: 'empty glass' }, e.message));
  }
  document.title = `${ROUTES[key].label} · Hospital IT Help Desk`;
}

window.addEventListener('hashchange', () => { if (ctx.user) route(); else showPublic(); });
boot();

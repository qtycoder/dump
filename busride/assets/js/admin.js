(async () => {
  'use strict';
  const { el, api, peso, fmtDateTime, cap, badge } = BR;

  const root = document.getElementById('adminRoot');

  // The admin area has its own sign-in, so admins always have a clear place to log in.
  async function showGate(who) {
    let setupOpen = false;
    try { setupOpen = (await api('api/setup_admin.php')).available; } catch (_) { /* ignore */ }
    const msg = el('p', { class: 'msg-line', role: 'alert' });
    const logoutHere = async () => { try { await api('api/logout.php', {}); } catch (_) { /* ignore */ } location.reload(); };
    let inner;
    if (who) {                                    // signed in, but not as an admin
      inner = [
        el('h1', { style: 'font-size:26px;margin:4px 0', text: 'Admins only' }),
        el('p', { class: 'lead', text: 'You are signed in as ' + who.name + ', a passenger account. The admin dashboard needs an admin account.' }),
        el('div', { class: 'btn-row' },
          el('button', { class: 'btn', type: 'button', text: 'Log out and sign in as admin', on: { click: logoutHere } }),
          el('a', { class: 'btn ghost', href: '../dashboard.html', text: 'My dashboard' }))];
    } else {
      const email = el('input', { class: 'inp', type: 'email', autocomplete: 'username', placeholder: 'admin email', 'aria-label': 'Admin email' });
      const pass = el('input', { class: 'inp', type: 'password', autocomplete: 'current-password', placeholder: 'password', 'aria-label': 'Password' });
      const go = el('button', { class: 'btn block', type: 'submit', text: 'Log in to admin' });
      const form = el('form', { novalidate: true, style: 'margin-top:14px' },
        el('div', { class: 'fg' }, email), el('div', { class: 'fg' }, pass), go, msg);
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); msg.textContent = ''; go.disabled = true;
        try {
          const r = await api('api/login.php', { email: email.value.trim(), password: pass.value });
          if (r.user.role !== 'admin') {
            await api('api/logout.php', {});
            throw new Error('This account is not an admin. Passengers log in on the home page.');
          }
          location.reload();
        } catch (err) { msg.textContent = err.message; go.disabled = false; }
      });
      inner = [
        el('h1', { style: 'font-size:26px;margin:4px 0', text: 'Admin login' }),
        el('p', { class: 'lead', text: 'Sign in to manage trips, routes, buses, drivers, fares, bookings and users.' }),
        form,
        setupOpen ? el('div', { class: 'check', style: 'margin-top:14px' }, el('span', { class: 'ic warn', text: '!' }),
          el('div', null, 'No admin account exists yet.', el('small', null, el('a', { href: '../setup.html', text: 'Create the first admin' }), ' (works once, from this computer).'))) : null,
        el('div', { class: 'btn-row' }, el('a', { class: 'btn ghost sm', href: '../index.html', text: 'Back to home' }))];
    }
    root.replaceChildren(el('section', { style: 'max-width:460px;margin:6vh auto 0' }, el('div', { class: 'gcard liquid' },
      el('p', { class: 'k', text: 'Busride_ admin' }), inner)));
  }

  // Admins only. The API checks the role again on every request, so this is not only a screen check.
  const user = await BR.mountNav('admin');
  if (!user || user.role !== 'admin') { await showGate(user); return; }
  let entities = [];
  let tab = 'overview';
  const optionCache = {};

  try {
    entities = (await api('api/admin/meta.php')).entities;
  } catch (err) {
    root.replaceChildren(el('section', null, el('div', { class: 'gcard' }, el('p', { class: 'empty', text: err.message }))));
    return;
  }

  const STATUS_KIND = {
    confirmed: 'ok', paid: 'ok', active: 'ok', scheduled: 'info', completed: 'ok',
    unpaid: 'warn', maintenance: 'warn', cancelled: 'bad', refunded: 'info', admin: 'info', user: '',
  };

  /* ---------- shell ---------- */
  const body = el('div');
  function drawShell() {
    const items = [['overview', 'Overview'], ...entities.map((e) => [e.key, e.label])];
    root.replaceChildren(
      el('section', null, el('h1', { text: 'Admin dashboard' }),
        el('p', { class: 'lead', text: 'Signed in as ' + user.name + '. Add, edit and delete the records of every part of Busride.' })),
      el('section', { class: 'admin-wrap' },
        el('nav', { class: 'side gcard', 'aria-label': 'Admin sections' }, items.map(([k, label]) =>
          el('button', { type: 'button', class: k === tab ? 'on' : null, 'aria-current': k === tab ? 'page' : null, text: label,
            on: { click: () => { tab = k; drawShell(); } } }))),
        body));
    body.replaceChildren(el('p', { class: 'empty', text: 'Loading…' }));
    if (tab === 'overview') drawOverview(); else drawEntity(entities.find((e) => e.key === tab));
  }

  /* ---------- overview ---------- */
  async function drawOverview() {
    let s;
    try { s = await api('api/admin/stats.php'); }
    catch (err) { body.replaceChildren(el('p', { class: 'empty', text: err.message })); return; }
    const t = s.totals;
    const tile = (k, v, sub) => el('div', { class: 'tile liquid' }, el('span', { class: 'k', text: k }), el('div', { class: 'v', text: v }), sub ? el('div', { class: 's', text: sub }) : null);

    const max = Math.max(1, ...s.revenue_7d.map((d) => d.total));
    const bars = el('div', { class: 'bars' }, s.revenue_7d.map((d) => el('div', { class: 'bar' },
      el('b', { text: d.total ? '₱' + Math.round(d.total).toLocaleString('en-PH') : '' }),
      el('div', { class: 'col' }, el('i', { style: '--h:' + Math.max(2, (d.total / max) * 100).toFixed(1) + '%' })),
      el('span', { text: new Date(d.date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' }) }))));

    const topMax = Math.max(1, ...s.top_routes.map((r) => r.bookings));
    const top = s.top_routes.length
      ? s.top_routes.map((r) => el('div', { class: 'hbar' }, el('span', { text: r.label }), el('b', { text: String(r.bookings) }),
          el('div', { class: 'track' }, el('i', { style: 'width:' + (r.bookings / topMax * 100).toFixed(0) + '%' }))))
      : [el('p', { class: 'empty', text: 'No bookings yet.' })];

    const recent = s.recent.length
      ? el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' },
          el('thead', null, el('tr', null, ['Code', 'Passenger', 'Route', 'Amount', 'Payment', 'Status', 'Booked'].map((h) => el('th', { text: h })))),
          el('tbody', null, s.recent.map((r) => el('tr', null,
            el('td', null, el('b', { text: r.code })), el('td', { text: r.passenger_name }), el('td', { text: r.route }),
            el('td', { text: peso(r.amount) }),
            el('td', null, badge(cap(r.payment_status), STATUS_KIND[r.payment_status])),
            el('td', null, badge(cap(r.status), STATUS_KIND[r.status])),
            el('td', { text: fmtDateTime(r.created_at) }))))))
      : el('p', { class: 'empty', text: 'No bookings yet.' });

    body.replaceChildren(
      el('div', { class: 'tiles' },
        tile('Revenue', peso(t.revenue), 'Paid bookings (demo payments included)'),
        tile('Cash to collect', peso(t.cash_due), 'Unpaid cash bookings'),
        tile('Bookings', String(t.bookings), t.bookings_today + ' today'),
        tile('Seats filled', t.occupancy_pct + '%', t.seats_sold + ' of ' + t.seats_total + ' on upcoming trips'),
        tile('Upcoming trips', String(t.upcoming_trips)),
        tile('Passengers', String(t.passengers))),
      el('div', { class: 'dash-grid', style: 'margin-top:18px' },
        el('div', { class: 'gcard' }, el('h2', { text: 'Revenue, last 7 days' }), el('div', { style: 'margin-top:14px' }, bars)),
        el('div', { class: 'gcard' }, el('h2', { text: 'Top routes' }), top)),
      el('div', { class: 'gcard', style: 'margin-top:18px' }, el('h2', { text: 'Latest bookings' }), el('div', { style: 'margin-top:8px' }, recent))
    );
  }

  /* ---------- tables ---------- */
  function cell(ent, col, row) {
    const f = ent.fields[col];
    const v = row[col];
    if (!f) return el('td', { text: String(v ?? '') });                     // computed column
    if (f.type === 'ref') return el('td', { text: row[col + '__label'] ?? String(v ?? '') });
    if (f.type === 'bool') return el('td', null, badge(v ? 'Yes' : 'No', v ? 'ok' : 'warn'));
    if (f.type === 'color') return el('td', null, el('span', { class: 'swatch', style: 'background:' + (/^#[0-9a-f]{6}$/i.test(v) ? v : '#ccc') }));
    if (f.type === 'datetime') return el('td', { text: v ? fmtDateTime(v) : '' });
    if (f.type === 'select') return el('td', null, badge(cap(String(v)), STATUS_KIND[v]));
    if (col === 'amount' || col === 'base_fare') return el('td', { text: peso(v) });
    return el('td', { text: v === null || v === undefined ? '' : String(v) });
  }

  async function drawEntity(ent) {
    let rows;
    try { rows = (await api('api/admin/crud.php?entity=' + encodeURIComponent(ent.key))).rows; }
    catch (err) { body.replaceChildren(el('p', { class: 'empty', text: err.message })); return; }

    const head = (col) => (ent.fields[col] ? ent.fields[col].label : (ent.extra[col] || {}).label || col);
    const canEdit = ent.actions.update, canDelete = ent.actions.delete;
    const count = el('h2');
    const box = el('div', { style: 'margin-top:10px' });
    const search = el('input', { class: 'inp', type: 'search', placeholder: 'Search ' + ent.label.toLowerCase() + '…', 'aria-label': 'Search', style: 'max-width:260px;height:38px' });
    search.addEventListener('input', drawTable);

    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const shown = q ? rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))) : rows;
      count.textContent = ent.label + ' (' + shown.length + (q ? ' of ' + rows.length : '') + ')';
      if (!shown.length) {
        box.replaceChildren(el('p', { class: 'empty', text: rows.length ? 'No match.' : (ent.actions.create ? 'Nothing here yet. Press "Add new" to create the first one.' : 'Nothing here yet.') }));
        return;
      }
      box.replaceChildren(el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' },
        el('thead', null, el('tr', null, [...ent.list.map((c) => el('th', { text: head(c) })), (canEdit || canDelete) ? el('th') : null])),
        el('tbody', null, shown.map((row) => el('tr', null,
          ent.list.map((c) => cell(ent, c, row)),
          (canEdit || canDelete) ? el('td', { class: 'acts' },
            canEdit ? el('button', { class: 'btn sm ghost', type: 'button', text: 'Edit', on: { click: () => openForm(ent, row) } }) : null,
            canDelete ? el('button', { class: 'btn sm danger', type: 'button', text: 'Delete', on: { click: () => askDelete(ent, row) } }) : null) : null))))));
    }

    body.replaceChildren(el('div', { class: 'gcard' },
      el('div', { class: 'row between' }, count,
        el('div', { class: 'row' }, search,
          ent.actions.create ? el('button', { class: 'btn sm', type: 'button', text: '+ Add new', on: { click: () => openForm(ent, null) } }) : null)),
      box));
    drawTable();
  }

  /* ---------- form ---------- */
  async function refOptions(entKey) {
    if (!optionCache[entKey]) {
      optionCache[entKey] = (await api('api/admin/crud.php?options=1&entity=' + encodeURIComponent(entKey))).options;
    }
    return optionCache[entKey];
  }

  async function openForm(ent, row) {
    const editing = !!row;
    const inputs = {};
    const fields = [];

    for (const [name, f] of Object.entries(ent.fields)) {
      if (f.ro || (editing && f.create_only)) continue;
      const val = editing ? row[name] : null;
      let input;
      if (f.type === 'select') {
        input = el('select', { class: 'inp' }, f.options.map((o) => el('option', { value: o, text: cap(o) })));
        input.value = val ?? f.options[0];
      } else if (f.type === 'ref') {
        let opts = [];
        try { opts = await refOptions(f.ref); } catch (_) { /* shown empty */ }
        input = el('select', { class: 'inp' }, opts.map((o) => el('option', { value: o.id, text: o.label })));
        if (val) input.value = String(val);
      } else if (f.type === 'bool') {
        input = el('input', { type: 'checkbox', style: 'width:20px;height:20px;accent-color:#161515;margin-left:8px' });
        input.checked = !!Number(val);
      } else if (f.type === 'datetime') {
        input = el('input', { class: 'inp', type: 'datetime-local' });
        if (val) input.value = String(val).replace(' ', 'T').slice(0, 16);
      } else if (f.type === 'date') {
        input = el('input', { class: 'inp', type: 'date' });
        if (val) input.value = String(val).slice(0, 10);
      } else if (f.type === 'password') {
        input = el('input', { class: 'inp', type: 'password', autocomplete: 'new-password', placeholder: editing ? 'Leave blank to keep the current password' : '8 or more characters' });
      } else if (f.type === 'email') {
        input = el('input', { class: 'inp', type: 'email', autocomplete: 'off' });
        if (val) input.value = val;
      } else if (f.type === 'color') {
        input = el('input', { class: 'inp', type: 'color' });
        input.value = /^#[0-9a-f]{6}$/i.test(val || '') ? val : '#2fd6c8';
      } else if (f.type === 'number') {
        input = el('input', { class: 'inp', type: 'number', step: f.decimal ? 'any' : '1' });
        if (f.min !== undefined) input.min = f.min;
        if (f.max !== undefined) input.max = f.max;
        if (val !== null && val !== undefined) input.value = val;
      } else {
        input = el('input', { class: 'inp', type: 'text' });
        if (f.max) input.maxLength = f.max;
        if (val !== null && val !== undefined) input.value = val;
      }
      inputs[name] = { input, type: f.type };
      fields.push(el('div', { class: 'fg' }, el('label', { class: 'lbl', text: f.label + (f.type === 'password' ? (editing ? ' (blank = keep)' : '') : (f.optional ? ' (optional)' : '')) }), input));
    }

    const msg = el('p', { class: 'msg-line', role: 'alert' });
    const save = el('button', { class: 'btn', type: 'submit', text: editing ? 'Save changes' : 'Create' });
    const form = el('form', { novalidate: true }, el('h3', { text: (editing ? 'Edit' : 'New') + ' · ' + ent.label }), fields, msg,
      el('div', { class: 'btn-row' }, save, el('button', { class: 'btn ghost', type: 'button', text: 'Cancel', on: { click: () => m.close() } })));
    const m = BR.modal(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {};
      for (const [name, { input, type }] of Object.entries(inputs)) data[name] = type === 'bool' ? input.checked : input.value;
      save.disabled = true;
      msg.textContent = '';
      try {
        await api('api/admin/crud.php', editing
          ? { entity: ent.key, action: 'update', id: row[ent.pk], data }
          : { entity: ent.key, action: 'create', data });
        delete optionCache[ent.key];
        m.close();
        BR.toast(editing ? 'Saved.' : 'Created.');
        drawEntity(ent);
      } catch (err) {
        msg.textContent = err.message;
        save.disabled = false;
      }
    });
  }

  function askDelete(ent, row) {
    const m = BR.modal(el('div', null,
      el('h3', { text: 'Delete this record?' }),
      el('p', { class: 'lead', text: 'This cannot be undone. Records that are still used elsewhere (for example a bus with trips) cannot be deleted.' }),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn danger', type: 'button', text: 'Delete', on: { click: async (e) => {
          e.target.disabled = true;
          try {
            await api('api/admin/crud.php', { entity: ent.key, action: 'delete', id: row[ent.pk] });
            delete optionCache[ent.key];
            m.close(); BR.toast('Deleted.'); drawEntity(ent);
          } catch (err) { m.close(); BR.toast(err.message); }
        } } }),
        el('button', { class: 'btn ghost', type: 'button', text: 'Cancel', on: { click: () => m.close() } }))));
  }

  drawShell();
})();

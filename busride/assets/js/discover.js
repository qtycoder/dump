(async () => {
  'use strict';
  const { el, api, peso, duration } = BR;
  const user = await BR.mountNav('discover');
  const isAdmin = !!user && user.role === 'admin';

  const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2fd6c8');
  const fleetEl = document.getElementById('fleet');
  const routesEl = document.getElementById('routes');

  function modelCard(m) {
    const art = el('div', { class: 'art' });
    art.innerHTML = BR.busSVG(m.color);
    return el('article', { class: 'bus-card liquid' },
      el('span', { class: 'blob', style: '--c:' + safeColor(m.color) }),
      el('span', { class: 'blob b2' }),
      art,
      el('h3', { text: m.name }),
      el('p', { class: 'meta', text: [m.manufacturer, m.year, m.capacity + ' seats'].filter(Boolean).join(' · ') }),
      m.description ? el('p', { class: 'meta', text: m.description }) : null,
      el('div', { class: 'chips' }, m.amenities.map((a) => el('span', { class: 'chip', text: a }))),
      el('div', { class: 'foot' },
        BR.badge(m.buses_in_service + (m.buses_in_service === 1 ? ' bus' : ' buses') + ' in service', m.buses_in_service ? 'ok' : 'warn'))
    );
  }

  function routeCard(r) {
    return el('article', { class: 'route-card liquid' },
      el('span', { class: 'blob', style: '--c:#ffb347' }),
      el('span', { class: 'blob b2' }),
      el('div', { class: 'path' }, r.origin, el('small', { text: 'to' }), r.destination),
      el('p', { class: 'meta', text: r.distance_km + ' km · about ' + duration(r.duration_min) }),
      el('div', { class: 'price' }, peso(r.base_fare), el('small', { text: ' regular' })),
      el('div', { class: 'foot' },
        BR.badge(r.upcoming + (r.upcoming === 1 ? ' trip' : ' trips') + ' coming up', r.upcoming ? 'ok' : ''),
        el('a', { class: 'btn sm', href: 'trips.html?route=' + r.id, text: 'See trips' }))
    );
  }

  let routesData = [];
  let fareTypes = [];
  const priceOf = (base, pct) => Math.round(base * (100 - pct)) / 100;

  /* ---------- Fares: click a fare to see the price on every route. Admins can also edit. ---------- */
  function renderFares() {
    document.getElementById('faresHint').textContent = isAdmin
      ? 'Tap a fare to see its price on every route. As an admin you can edit a fare with the Edit button.'
      : 'Tap a fare to see its price on every route.';
    document.getElementById('fares').replaceChildren(...fareTypes.map((f) => {
      const open = () => openFare(f);
      return el('tr', { class: 'fare-row', tabindex: '0', role: 'button', 'aria-label': f.label + ' fare details',
        on: { click: open, keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } } },
        el('td', null, f.label, el('small', { text: f.note })),
        el('td', null, f.discount_pct ? f.discount_pct + '% off' : 'Full fare'),
        el('td', { class: 'fare-go' },
          isAdmin ? el('button', { class: 'btn sm ghost', type: 'button', text: 'Edit',
            on: { click: (e) => { e.stopPropagation(); editFare(f); } } }) : null,
          el('span', { 'aria-hidden': 'true', text: '›' })));
    }));
  }

  function openFare(f) {
    const filter = el('input', { class: 'inp', type: 'search', placeholder: 'Search a destination…', 'aria-label': 'Search routes' });
    const body = el('tbody');
    const draw = () => {
      const q = filter.value.trim().toLowerCase();
      const rows = routesData.filter((r) => !q || (r.origin + ' ' + r.destination).toLowerCase().includes(q));
      body.replaceChildren(...(rows.length ? rows.map((r) => el('tr', null,
        el('td', null, r.origin + ' → ' + r.destination, el('small', { text: r.distance_km + ' km · ' + duration(r.duration_min) })),
        el('td', { text: peso(priceOf(r.base_fare, f.discount_pct)) })))
        : [el('tr', null, el('td', { colspan: '2', class: 'empty', text: 'No route matches.' }))]));
    };
    filter.addEventListener('input', draw);
    draw();
    const m = BR.modal(el('div', null,
      el('div', { class: 'row between' }, el('h3', { text: f.label + ' fare' }),
        BR.badge(f.discount_pct ? f.discount_pct + '% off' : 'Full fare', f.discount_pct ? 'ok' : '')),
      el('p', { class: 'lead', text: f.note || 'Standard fare.' }),
      el('div', { class: 'fg', style: 'margin-top:12px' }, filter),
      el('table', { class: 'fare-tbl' }, body),
      el('div', { class: 'btn-row' },
        isAdmin ? el('button', { class: 'btn', type: 'button', text: 'Edit this fare', on: { click: () => { m.close(); editFare(f); } } }) : null,
        el('a', { class: 'btn ghost', href: 'trips.html', text: 'Find a trip' }),
        el('button', { class: 'btn ghost', type: 'button', text: 'Close', on: { click: () => m.close() } }))));
  }

  // Admin only. The server checks the role again, so this is not just a hidden button.
  function editFare(f) {
    if (!isAdmin) return;
    const label = el('input', { class: 'inp', id: 'fl', type: 'text', maxlength: '40', value: f.label });
    const pct = el('input', { class: 'inp', id: 'fp', type: 'number', min: '0', max: '100', step: '1', value: f.discount_pct });
    const note = el('input', { class: 'inp', id: 'fn', type: 'text', maxlength: '160', value: f.note });
    const msg = el('p', { class: 'msg-line', role: 'alert' });
    const save = el('button', { class: 'btn', type: 'submit', text: 'Save fare' });
    const form = el('form', { novalidate: true },
      el('h3', { text: 'Edit fare · ' + f.code }),
      el('div', { class: 'fg' }, el('label', { class: 'lbl', for: 'fl', text: 'Name' }), label),
      el('div', { class: 'fg' }, el('label', { class: 'lbl', for: 'fp', text: 'Discount (%) from the regular fare' }), pct),
      el('div', { class: 'fg' }, el('label', { class: 'lbl', for: 'fn', text: 'Note shown to passengers' }), note),
      msg,
      el('div', { class: 'btn-row' }, save, el('button', { class: 'btn ghost', type: 'button', text: 'Cancel', on: { click: () => m.close() } })));
    const m = BR.modal(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      save.disabled = true; msg.textContent = '';
      try {
        await api('api/admin/crud.php', { entity: 'fare_types', action: 'update', id: f.id,
          data: { label: label.value, discount_pct: pct.value, note: note.value } });
        const r = await api('api/routes.php');
        fareTypes = r.fare_types; routesData = r.routes; renderFares();
        m.close(); BR.toast('Fare updated.');
      } catch (err) { msg.textContent = err.message; save.disabled = false; }
    });
  }

  try {
    const [m, r] = await Promise.all([api('api/models.php'), api('api/routes.php')]);

    if (m.models.length) BR.carousel(fleetEl, m.models.map(modelCard), { label: 'Bus models' });
    else fleetEl.replaceChildren(el('p', { class: 'empty', text: 'No bus models yet.' }));

    if (r.routes.length) BR.carousel(routesEl, r.routes.map(routeCard), { label: 'Routes' });
    else routesEl.replaceChildren(el('p', { class: 'empty', text: 'No routes yet.' }));

    routesData = r.routes; fareTypes = r.fare_types; renderFares();
  } catch (err) {
    const msg = el('p', { class: 'empty', text: err.message });
    fleetEl.replaceChildren(msg);
    routesEl.replaceChildren(msg.cloneNode(true));
  }
})();

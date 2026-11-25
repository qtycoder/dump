(async () => {
  'use strict';
  const { el, api, peso, fmtDay, fmtTime, fmtDateTime, duration, badge } = BR;
  const user = await BR.mountNav('trips');

  const fromSel = document.getElementById('fromSel');
  const toSel   = document.getElementById('toSel');
  const dateInp  = document.getElementById('dateInp');
  const listEl   = document.getElementById('tripList');
  const detail   = document.getElementById('detail');

  const qs = new URLSearchParams(location.search);
  let trips = [];
  let selectedId = 0;
  let mapInst = null;

  /* ---------- filters: From and To ---------- */
  let routes = [];
  const uniq = (arr) => [...new Set(arr)].sort((x, y) => x.localeCompare(y));
  function fillTo(keep) {
    const dests = uniq(routes.filter((r) => !fromSel.value || r.origin === fromSel.value).map((r) => r.destination));
    toSel.replaceChildren(el('option', { value: '', text: 'Any destination' }), ...dests.map((d) => el('option', { value: d, text: d })));
    toSel.value = dests.includes(keep) ? keep : '';
  }
  try {
    routes = (await api('api/routes.php')).routes;
    fromSel.replaceChildren(el('option', { value: '', text: 'Anywhere' }),
      ...uniq(routes.map((r) => r.origin)).map((o) => el('option', { value: o, text: o })));
    const pre = routes.find((r) => String(r.id) === qs.get('route'));
    if (pre) fromSel.value = pre.origin;
    fillTo(pre ? pre.destination : '');
  } catch (_) { /* the list below shows the error */ }

  fromSel.addEventListener('change', () => { fillTo(toSel.value); load(); });
  toSel.addEventListener('change', load);
  dateInp.addEventListener('change', load);

  async function load() {
    const p = new URLSearchParams();
    if (dateInp.value) p.set('date', dateInp.value);
    listEl.replaceChildren(el('p', { class: 'empty', text: 'Loading…' }));
    try {
      trips = (await api('api/trips.php' + (p.toString() ? '?' + p : ''))).trips
        .filter((t) => (!fromSel.value || t.route.origin === fromSel.value) && (!toSel.value || t.route.destination === toSel.value));
    } catch (err) {
      listEl.replaceChildren(el('p', { class: 'empty', text: err.message }));
      return;
    }
    renderList();
    const keep = trips.find((t) => t.id === selectedId) || trips[0];
    if (keep) select(keep.id); else {
      selectedId = 0;
      destroyMap();
      detail.replaceChildren(el('p', { class: 'empty', text: 'No trips match. Try another date or route.' }));
    }
  }

  function renderList() {
    if (!trips.length) {
      listEl.replaceChildren(el('p', { class: 'empty', text: 'No upcoming trips found.' }));
      return;
    }
    listEl.replaceChildren(...trips.map((t) => {
      const full = t.seats_left === 0;
      return el('button', {
        type: 'button', class: 'trip-item' + (t.id === selectedId ? ' on' : ''), 'data-id': t.id,
        on: { click: () => select(t.id) },
      },
        el('div', { class: 'when' }, el('b', { text: fmtTime(t.depart_at) }), el('span', { text: fmtDay(t.depart_at) })),
        el('div', null,
          el('div', { class: 'path', text: t.route.origin + ' → ' + t.route.destination }),
          el('div', { class: 'sub', text: t.bus.model_name + ' · ' + (full ? 'Full' : t.seats_left + ' seats left') })),
        el('div', { class: 'price' }, peso(t.route.base_fare), el('small', { text: 'regular' }))
      );
    }));
  }

  function select(id) {
    selectedId = id;
    listEl.querySelectorAll('.trip-item').forEach((b) => b.classList.toggle('on', Number(b.dataset.id) === id));
    const t = trips.find((x) => x.id === id);
    if (t) renderDetail(t);
  }

  /* ---------- map ---------- */
  function destroyMap() {
    if (mapInst) { mapInst.remove(); mapInst = null; }
  }

  function drawMap(box, r) {
    if (!window.L) {
      box.append(el('div', { class: 'map-note' }, 'The map could not load (no internet?). You can still open the route in Google Maps below.'));
      return;
    }
    mapInst = L.map(box, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInst);
    const a = [r.origin_lat, r.origin_lng];
    const b = [r.dest_lat, r.dest_lng];
    L.marker(a).addTo(mapInst).bindTooltip(r.origin, { permanent: true, direction: 'top', className: 'pin-tip' });
    L.marker(b).addTo(mapInst).bindTooltip(r.destination, { permanent: true, direction: 'top', className: 'pin-tip' });
    L.polyline([a, b], { color: '#161515', weight: 3, dashArray: '6 8' }).addTo(mapInst);
    mapInst.fitBounds([a, b], { padding: [50, 50] });
    setTimeout(() => mapInst && mapInst.invalidateSize(), 60);
  }

  /* ---------- detail ---------- */
  function check(ok, title, sub) {
    return el('div', { class: 'check' },
      el('span', { class: 'ic ' + (ok ? 'ok' : 'warn'), text: ok ? '✓' : '!' }),
      el('div', null, title, el('small', { text: sub })));
  }

  function renderDetail(t) {
    destroyMap();
    const r = t.route, b = t.bus, d = t.driver;
    const mapBox = el('div', { id: 'map' });

    const checks = [
      check(d.verified, d.verified ? 'Identity verified' : 'Identity not verified yet',
        d.verified ? 'Name and ID checked by Busride' : 'Ask the operator before boarding'),
      check(d.background_check, d.background_check ? 'Background check cleared' : 'Background check pending',
        d.background_check ? 'No record that bars this driver from working' : 'Not completed yet'),
      check(d.license_valid, d.license_valid ? "Valid driver's license" : "Driver's license has expired",
        'No. ' + d.license_masked + ' · expires ' + d.license_expiry),
      check(b.inspection_ok, b.inspection_ok ? 'Bus inspected in the last 12 months' : 'Bus inspection is overdue',
        b.last_inspection ? 'Last inspected ' + b.last_inspection : 'No inspection on record'),
    ];
    const passed = checks.filter((c) => c.querySelector('.ic.ok')).length;

    const gmaps = 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
      + '&origin=' + r.origin_lat + ',' + r.origin_lng + '&destination=' + r.dest_lat + ',' + r.dest_lng;

    const canBook = t.seats_left > 0;
    const bookBtn = !canBook
      ? el('button', { class: 'btn', type: 'button', disabled: true, text: 'Sold out' })
      : (user && user.role === 'admin')
        ? el('button', { class: 'btn', type: 'button', text: 'Admins cannot book', on: { click: () => BR.toast('Log in with a passenger account to book a seat.') } })
        : el('button', { class: 'btn', type: 'button', text: 'Book this trip', on: { click: () => {
            const target = 'book.html?trip=' + t.id;
            location.href = user ? target : 'index.html?next=' + encodeURIComponent(target);
          } } });

    detail.replaceChildren(
      el('div', { class: 'row between' },
        el('div', null,
          el('h2', { text: r.origin + ' → ' + r.destination }),
          el('p', { class: 'k', text: fmtDateTime(t.depart_at) + ' · ' + duration(r.duration_min) + ' · ' + r.distance_km + ' km' })),
        badge(t.seats_left + ' / ' + t.seats_total + ' seats left', t.seats_left > 5 ? 'ok' : 'warn')),

      el('div', { style: 'margin-top:14px' }, mapBox),
      el('p', { class: 'k', style: 'margin-top:8px' },
        'Straight-line view of the two stops. ',
        el('a', { href: gmaps, target: '_blank', rel: 'noopener noreferrer', text: 'Open the road route in Google Maps' })),

      el('h3', { class: 'sec-title', text: 'Bus' }),
      el('div', { class: 'row between' },
        el('div', null,
          el('b', { text: b.model_name }),
          el('div', { class: 'k', text: [b.manufacturer, b.year, 'Plate ' + b.plate_no, b.capacity + ' seats'].filter(Boolean).join(' · ') }))),
      el('div', { class: 'chips', style: 'margin-top:8px' },
        b.amenities.split(',').map((x) => x.trim()).filter(Boolean).map((x) => el('span', { class: 'chip', text: x }))),

      el('h3', { class: 'sec-title', text: 'Your driver' }),
      el('div', { class: 'driver' },
        el('div', { class: 'avatar', 'aria-hidden': 'true', text: d.initials }),
        el('div', null,
          el('h4', { text: d.name }),
          el('div', { class: 'k', text: d.years_experience + ' years driving · ★ ' + d.rating.toFixed(1) + ' · ' + d.trips_completed.toLocaleString('en-PH') + ' trips' }),
          el('div', { style: 'margin-top:6px' }, badge(passed + ' of 4 safety checks passed', passed === 4 ? 'ok' : 'warn')))),
      el('div', { class: 'checks' }, checks),

      el('h3', { class: 'sec-title', text: 'Fare for this trip' }),
      el('table', { class: 'fare-tbl' }, t.fares.map((f) => el('tr', null,
        el('td', null, f.label, el('small', { text: f.discount_pct ? f.discount_pct + '% off · ' + f.note : f.note })),
        el('td', { text: peso(f.price) })))),

      el('div', { class: 'btn-row' }, bookBtn,
        el('a', { class: 'btn ghost', href: 'discover.html', text: 'Browse the fleet' }))
    );

    drawMap(mapBox, r);
  }

  load();
})();

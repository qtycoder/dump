(async () => {
  'use strict';
  const { el, api, peso, fmtDay, fmtTime, fmtDateTime, cap, badge, PAY_KIND } = BR;

  const user = await BR.requireUser('dashboard', { userOnly: true });
  if (!user) return;

  const root = document.getElementById('dash');
  let data = null;
  let tab = 'upcoming';

  function until(dateStr) {
    const ms = BR.parseDate(dateStr) - Date.now();
    if (ms <= 0) return 'Departing now';
    const min = Math.round(ms / 60000);
    if (min < 60) return 'Leaves in ' + min + ' min';
    const h = Math.floor(min / 60);
    if (h < 48) return 'Leaves in ' + h + 'h ' + (min % 60) + 'm';
    return 'Leaves in ' + Math.round(h / 24) + ' days';
  }

  function tile(label, value, sub) {
    return el('div', { class: 'tile liquid' }, el('span', { class: 'k', text: label }), el('div', { class: 'v', text: value }),
      sub ? el('div', { class: 's', text: sub }) : null);
  }

  function bookingRow(b) {
    const acts = [el('button', { class: 'btn sm ghost', type: 'button', text: 'Ticket', on: { click: () => BR.showTicket(b) } })];
    if (b.can_cancel) acts.push(el('button', { class: 'btn sm danger', type: 'button', text: 'Cancel', on: { click: () => askCancel(b) } }));
    return el('tr', null,
      el('td', null, el('b', { text: b.code })),
      el('td', { text: b.origin + ' → ' + b.destination }),
      el('td', { text: fmtDateTime(b.depart_at) }),
      el('td', { text: '#' + b.seat_no }),
      el('td', { text: b.fare_label }),
      el('td', { text: peso(b.amount) }),
      el('td', null, badge(cap(b.payment_status), PAY_KIND[b.payment_status])),
      el('td', { class: 'acts' }, acts));
  }

  function askCancel(b) {
    const m = BR.modal(el('div', null,
      el('h3', { text: 'Cancel this booking?' }),
      el('p', { class: 'lead', text: b.origin + ' → ' + b.destination + ' on ' + fmtDateTime(b.depart_at) + ', seat #' + b.seat_no + '. '
        + (b.payment_status === 'paid' ? 'Your demo payment will be marked as refunded.' : 'Nothing has been paid yet.') }),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn danger', type: 'button', text: 'Yes, cancel it', on: { click: async (e) => {
          e.target.disabled = true;
          try { await api('api/cancel.php', { booking_id: b.id }); m.close(); BR.toast('Booking cancelled.'); await load(); }
          catch (err) { BR.toast(err.message); e.target.disabled = false; }
        } } }),
        el('button', { class: 'btn ghost', type: 'button', text: 'Keep it', on: { click: () => m.close() } }))));
  }

  function chart(monthly) {
    const max = Math.max(1, ...monthly.map((m) => m.total));
    return el('div', { class: 'bars' }, monthly.map((m) => el('div', { class: 'bar' },
      el('b', { text: m.total ? '₱' + Math.round(m.total).toLocaleString('en-PH') : '' }),
      el('div', { class: 'col' }, el('i', { style: '--h:' + Math.max(2, (m.total / max) * 100).toFixed(1) + '%' })),
      el('span', { text: new Date(m.month + '-01T00:00:00').toLocaleDateString('en-PH', { month: 'short' }) }))));
  }

  function listFor(which) {
    const rows = data.bookings.filter((b) =>
      which === 'cancelled' ? b.status === 'cancelled'
        : which === 'upcoming' ? b.status === 'confirmed' && b.upcoming
        : b.status === 'confirmed' && !b.upcoming);
    if (!rows.length) return el('p', { class: 'empty', text: which === 'upcoming' ? 'No upcoming trips. Time to plan one!' : 'Nothing here yet.' });
    return el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' },
      el('thead', null, el('tr', null, ['Code', 'Trip', 'Departure', 'Seat', 'Fare', 'Amount', 'Payment', ''].map((h) => el('th', { text: h })))),
      el('tbody', null, rows.map(bookingRow))));
  }

  function render() {
    const s = data.stats;
    const n = data.next;

    const tabsEl = el('div', { class: 'tabs', role: 'tablist' }, [['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']].map(([k, label]) =>
      el('button', { type: 'button', role: 'tab', class: k === tab ? 'on' : null, 'aria-selected': String(k === tab), text: label,
        on: { click: () => { tab = k; render(); } } })));

    const soon = el('div', { class: 'car', id: 'soon' });

    root.replaceChildren(
      el('section', null,
        el('h1', { text: 'Hi, ' + user.name.split(' ')[0] }),
        el('p', { class: 'lead', text: 'Your trips, tickets and spending in one place.' })),

      el('section', { class: 'tiles' },
        tile('Upcoming trips', String(s.upcoming)),
        tile('Trips taken', String(s.past)),
        tile('Paid so far', peso(s.paid_total), 'Demo payments included'),
        tile('Cash to pay', peso(s.due_total), 'Pay the driver when you board')),

      el('section', { class: 'dash-grid' },
        el('div', { class: 'gcard liquid next-trip' },
          el('span', { class: 'blob', style: '--c:#2fd6c8' }), el('span', { class: 'blob b2' }),
          el('p', { class: 'k', text: 'Next trip' }),
          n ? [
            el('h3', { text: n.origin + ' → ' + n.destination }),
            el('p', { class: 'countdown', text: fmtDateTime(n.depart_at) + ' · ' + until(n.depart_at) }),
            el('div', { class: 'chips' }, [n.model_name, 'Seat #' + n.seat_no, 'Driver ' + n.driver_name].map((t) => el('span', { class: 'chip', text: t }))),
            el('div', { class: 'btn-row' },
              el('button', { class: 'btn', type: 'button', text: 'View ticket', on: { click: () => BR.showTicket(n) } }),
              el('a', { class: 'btn ghost', href: 'trips.html', text: 'Book another' }))
          ] : [
            el('h3', { text: 'No trip booked yet' }),
            el('p', { class: 'countdown', text: 'Pick a route and a seat to get started.' }),
            el('div', { class: 'btn-row' }, el('a', { class: 'btn', href: 'trips.html', text: 'Find a trip' }))
          ]),
        el('div', { class: 'gcard' }, el('h2', { text: 'Spending, last 6 months' }), el('div', { style: 'margin-top:14px' }, chart(data.monthly)))),

      el('section', null, el('div', { class: 'gcard' },
        el('div', { class: 'row between' }, el('h2', { text: 'My bookings' }), tabsEl),
        el('div', { style: 'margin-top:12px' }, listFor(tab)))),

      el('section', null, el('h2', { text: 'Leaving soon' }), soon)
    );

    loadSoon(soon);
  }

  let soonCache = null;
  async function loadSoon(box) {
    try {
      soonCache = soonCache || (await api('api/trips.php')).trips.slice(0, 8);
      if (!soonCache.length) { box.replaceChildren(el('p', { class: 'empty', text: 'No upcoming trips right now.' })); return; }
      BR.carousel(box, soonCache.map((t) => el('article', { class: 'route-card liquid' },
        el('span', { class: 'blob', style: '--c:#f6b6c4' }),
        el('div', { class: 'path' }, t.route.origin, el('small', { text: 'to' }), t.route.destination),
        el('p', { class: 'meta', text: fmtDay(t.depart_at) + ', ' + fmtTime(t.depart_at) + ' · ' + t.bus.model_name }),
        el('div', { class: 'price' }, peso(t.route.base_fare), el('small', { text: ' regular' })),
        el('div', { class: 'foot' },
          badge(t.seats_left + ' seats left', t.seats_left > 5 ? 'ok' : 'warn'),
          el('a', { class: 'btn sm', href: 'book.html?trip=' + t.id, text: 'Book' })))), { label: 'Trips leaving soon' });
    } catch (err) {
      box.replaceChildren(el('p', { class: 'empty', text: err.message }));
    }
  }

  async function load() {
    try {
      data = await api('api/my_bookings.php');
      render();
    } catch (err) {
      root.replaceChildren(el('section', null, el('div', { class: 'gcard' }, el('p', { class: 'empty', text: err.message }))));
    }
  }

  load();
})();

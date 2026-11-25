(async () => {
  'use strict';
  const { el, api, peso, fmtDateTime, duration, badge } = BR;

  // Passengers only. Not logged in goes to the login page and comes back here.
  const user = await BR.requireUser('book', { userOnly: true });
  if (!user) return;

  const root = document.getElementById('bookRoot');
  const tripId = Number(new URLSearchParams(location.search).get('trip')) || 0;

  const PAY = [
    { code: 'cash',  title: 'Cash',  note: 'Pay the driver when you board.' },
    { code: 'gcash', title: 'GCash', note: 'Demo payment. No real money is charged.' },
    { code: 'maya',  title: 'Maya',  note: 'Demo payment. No real money is charged.' },
  ];

  /* ---------- no trip chosen yet: let them pick one ---------- */
  async function showPicker() {
    const list = el('div', { class: 'trip-list' }, el('p', { class: 'empty', text: 'Loading…' }));
    root.replaceChildren(
      el('section', null, el('h1', { text: 'Book a seat' }),
        el('p', { class: 'lead', text: 'Choose a trip first. You can also compare buses and drivers on the Trips page.' })),
      el('section', null, el('div', { class: 'gcard' }, list))
    );
    try {
      const { trips } = await api('api/trips.php');
      if (!trips.length) { list.replaceChildren(el('p', { class: 'empty', text: 'No upcoming trips right now.' })); return; }
      list.replaceChildren(...trips.map((t) => el('a', { class: 'trip-item', href: 'book.html?trip=' + t.id },
        el('div', { class: 'when' }, el('b', { text: BR.fmtTime(t.depart_at) }), el('span', { text: BR.fmtDay(t.depart_at) })),
        el('div', null,
          el('div', { class: 'path', text: t.route.origin + ' → ' + t.route.destination }),
          el('div', { class: 'sub', text: t.bus.model_name + ' · ' + t.seats_left + ' seats left' })),
        el('div', { class: 'price' }, peso(t.route.base_fare), el('small', { text: 'regular' })))));
    } catch (err) {
      list.replaceChildren(el('p', { class: 'empty', text: err.message }));
    }
  }

  if (!tripId) return showPicker();

  /* ---------- load the trip ---------- */
  let trip;
  try {
    trip = (await api('api/trips.php?id=' + tripId)).trip;
  } catch (err) {
    root.replaceChildren(el('section', null, el('div', { class: 'gcard' },
      el('p', { class: 'empty', text: err.message }),
      el('div', { class: 'btn-row' }, el('a', { class: 'btn', href: 'trips.html', text: 'Choose another trip' })))));
    return;
  }

  const st = { seat: 0, fare: 'regular', pay: 'cash', ack: false };
  const fareOf = (code) => trip.fares.find((f) => f.code === code) || trip.fares[0];
  if (!trip.fares.some((f) => f.code === st.fare)) st.fare = trip.fares[0].code;

  /* ---------- seat map ---------- */
  const seatBox = el('div', { class: 'seats' });
  function drawSeats() {
    const taken = new Set(trip.taken_seats);
    const nodes = [];
    for (let i = 1; i <= trip.seats_total; i++) {
      if ((i - 1) % 4 === 2) nodes.push(el('span', { 'aria-hidden': 'true' }));   // aisle
      const isTaken = taken.has(i);
      nodes.push(el('button', {
        type: 'button', class: 'seat' + (isTaken ? ' taken' : '') + (st.seat === i ? ' sel' : ''),
        'aria-label': 'Seat ' + i + (isTaken ? ' (taken)' : ''), 'aria-pressed': String(st.seat === i),
        disabled: isTaken, text: i,
        on: { click: () => { st.seat = i; drawSeats(); drawSummary(); } },
      }));
    }
    seatBox.replaceChildren(...nodes);
  }

  /* ---------- fare + payment options ---------- */
  const fareBox = el('div', { class: 'opts' });
  const ackBox = el('label', { class: 'check-line', hidden: true });
  const ackInput = el('input', { type: 'checkbox', on: { change: () => { st.ack = ackInput.checked; } } });
  ackBox.append(ackInput, el('span', { id: 'ackText' }));

  function option(group, value, checked, title, price, note, onPick) {
    const input = el('input', { type: 'radio', name: group, value, checked: checked || null });
    const label = el('label', { class: 'opt' + (checked ? ' on' : '') }, input,
      el('span', { class: 't', text: title }),
      price ? el('span', { class: 'p', text: price }) : null,
      note ? el('span', { class: 'n', text: note }) : null);
    input.addEventListener('change', () => {
      label.parentElement.querySelectorAll('.opt').forEach((o) => o.classList.remove('on'));
      label.classList.add('on');
      onPick();
    });
    return label;
  }

  function drawFares() {
    fareBox.replaceChildren(...trip.fares.map((f) => option('fare', f.code, f.code === st.fare, f.label, peso(f.price),
      f.discount_pct ? f.discount_pct + '% off · ' + f.note : f.note,
      () => { st.fare = f.code; st.ack = false; ackInput.checked = false; drawAck(); drawSummary(); })));
    drawAck();
  }
  function drawAck() {
    const f = fareOf(st.fare);
    ackBox.hidden = !f.discount_pct;
    ackBox.querySelector('#ackText').textContent =
      'I will show a valid ' + f.label + ' ID when boarding. If I cannot, I may be asked to pay the regular fare.';
  }

  const payBox = el('div', { class: 'opts' });
  payBox.append(...PAY.map((p) => option('pay', p.code, p.code === st.pay, p.title, '', p.note, () => { st.pay = p.code; drawSummary(); })));

  /* ---------- passenger name ---------- */
  const nameInput = el('input', { class: 'inp', id: 'pname', type: 'text', maxlength: '80', autocomplete: 'name', value: user.name });
  nameInput.addEventListener('input', drawSummary);

  let savedPhone = '';
  try { savedPhone = localStorage.getItem('busride:phone') || ''; } catch (_) { /* ok */ }
  const phoneInput = el('input', { class: 'inp', id: 'pphone', type: 'tel', inputmode: 'tel', maxlength: '16',
    placeholder: '09XX XXX XXXX', autocomplete: 'tel', value: savedPhone });
  phoneInput.addEventListener('input', drawSummary);
  const cleanPhone = () => phoneInput.value.replace(/[\s\-()]/g, '');

  /* ---------- summary ---------- */
  const sumBox = el('div');
  const msg = el('p', { class: 'msg-line', role: 'alert' });
  const confirmBtn = el('button', { class: 'btn block', type: 'button', text: 'Confirm booking' });

  function drawSummary() {
    const f = fareOf(st.fare);
    const pay = PAY.find((p) => p.code === st.pay);
    const row = (k, v) => el('div', { class: 'sum-row' }, el('span', { text: k }), el('span', { text: v }));
    sumBox.replaceChildren(
      row('Route', trip.route.origin + ' → ' + trip.route.destination),
      row('Departure', fmtDateTime(trip.depart_at)),
      row('Bus', trip.bus.model_name),
      row('Driver', trip.driver.name),
      row('Seat', st.seat ? '#' + st.seat : 'Not chosen'),
      row('Passenger', nameInput.value.trim() || '—'),
      row('Contact', phoneInput.value.trim() || '—'),
      row('Fare', f.label + (f.discount_pct ? ' (' + f.discount_pct + '% off)' : '')),
      row('Payment', pay.title + (pay.code === 'cash' ? ' on boarding' : ' (demo)')),
      el('div', { class: 'sum-total' }, el('span', { class: 'k', text: 'Total' }), el('b', { text: peso(f.price) }))
    );
    msg.textContent = '';
  }

  confirmBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const f = fareOf(st.fare);
    if (!st.seat) { msg.textContent = 'Pick a seat first.'; return; }
    if (name.length < 2) { msg.textContent = 'Enter the passenger name.'; return; }
    const phone = cleanPhone();
    if (!/^(\+?63|0)9\d{9}$/.test(phone)) { msg.textContent = 'Enter a valid mobile number, for example 09171234567.'; return; }
    if (f.discount_pct && !st.ack) { msg.textContent = 'Please confirm that you will show a valid ID.'; return; }

    confirmBtn.disabled = true;
    msg.textContent = '';
    try {
      const res = await api('api/book.php', {
        trip_id: trip.id, seat_no: st.seat, passenger_name: name, contact_phone: phone,
        fare_type: st.fare, payment_method: st.pay, id_ack: st.ack,
      });
      try { localStorage.setItem('busride:phone', phone); } catch (_) { /* ok */ }
      location.href = 'index.html?booked=' + encodeURIComponent(res.booking.code);   // home shows the thank-you with the 3D bus
    } catch (err) {
      msg.textContent = err.message;
      if (err.status === 409) {                // seat taken: refresh the map
        try { trip = (await api('api/trips.php?id=' + trip.id)).trip; } catch (_) { /* keep old */ }
        st.seat = 0; drawSeats(); drawSummary(); msg.textContent = err.message;
      }
      confirmBtn.disabled = false;
    }
  });

  /* ---------- page ---------- */
  root.replaceChildren(
    el('section', null,
      el('h1', { text: 'Book your seat' }),
      el('p', { class: 'lead', text: trip.route.origin + ' → ' + trip.route.destination + ' · ' + fmtDateTime(trip.depart_at)
        + ' · ' + duration(trip.route.duration_min) })),

    el('section', { class: 'book-grid' },
      el('div', { class: 'stack' },
        el('div', { class: 'gcard' },
          el('h2', { text: '1. Choose a seat' }),
          el('div', { class: 'seatmap', style: 'margin-top:14px' },
            el('div', { class: 'front', text: 'Front · driver' }), seatBox,
            el('div', { class: 'legend' },
              el('span', null, el('i'), 'Free'), el('span', null, el('i', { class: 't' }), 'Taken'), el('span', null, el('i', { class: 's' }), 'Yours')))),

        el('div', { class: 'gcard' },
          el('h2', { text: '2. Passenger & fare' }),
          el('div', { class: 'fg', style: 'margin-top:14px' },
            el('label', { class: 'lbl', for: 'pname', text: 'Passenger name' }), nameInput),
          el('div', { class: 'fg' },
            el('label', { class: 'lbl', for: 'pphone', text: 'Mobile number (we will contact you here)' }), phoneInput),
          fareBox, ackBox),

        el('div', { class: 'gcard' },
          el('h2', { text: '3. Payment' }),
          el('div', { style: 'margin-top:14px' }, payBox),
          el('p', { class: 'demo-note', text: 'GCash and Maya are demo options in this project: choosing one marks the ticket as paid but does not connect to a real payment service.' }))),

      el('aside', { class: 'sticky' },
        el('div', { class: 'gcard liquid' },
          el('span', { class: 'blob', style: '--c:#ffb347' }),
          el('h2', { text: 'Summary' }),
          el('div', { style: 'margin-top:8px' }, sumBox),
          el('div', { style: 'margin-top:14px' }, confirmBtn), msg,
          el('div', { style: 'margin-top:10px' }, badge(trip.driver.verified && trip.driver.background_check ? 'Driver verified' : 'Driver checks incomplete',
            trip.driver.verified && trip.driver.background_check ? 'ok' : 'warn'))))
    )
  );

  drawSeats();
  drawFares();
  drawSummary();
})();

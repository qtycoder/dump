/* Swipe carousel: native touch swipe (scroll-snap), mouse drag, arrows, dots, keyboard. */
BR.carousel = function carousel(root, items, opts) {
  'use strict';
  opts = opts || {};
  const { el } = BR;

  root.classList.add('car');
  items.forEach((n) => n.classList.add('car-item'));

  const track = el('div', { class: 'car-track', tabindex: '0', role: 'group', 'aria-label': opts.label || 'Carousel' }, items);
  const prev = el('button', { class: 'car-btn prev', type: 'button', 'aria-label': 'Previous', text: '‹' });
  const next = el('button', { class: 'car-btn next', type: 'button', 'aria-label': 'Next', text: '›' });
  const dots = el('div', { class: 'car-dots' });
  root.replaceChildren(prev, track, next, dots);

  const cards = [...track.children];
  if (!cards.length) return;

  const centerOf = (i) => cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2;
  const go = (i) => {
    const n = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: centerOf(n), behavior: 'smooth' });
  };
  const nearest = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  cards.forEach((_, i) => dots.append(el('button', {
    type: 'button', 'aria-label': 'Go to item ' + (i + 1), on: { click: () => go(i) },
  })));

  let raf = 0;
  function update() {
    raf = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    cards.forEach((c) => {
      const d = Math.min(1, Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) / (c.offsetWidth * 1.1));
      c.style.setProperty('--s', (1 - d * 0.12).toFixed(3));
      c.style.setProperty('--o', (1 - d * 0.35).toFixed(3));
    });
    const n = nearest();
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === n));
    prev.disabled = n === 0;
    next.disabled = n === cards.length - 1;
  }
  track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);

  prev.addEventListener('click', () => go(nearest() - 1));
  next.addEventListener('click', () => go(nearest() + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(nearest() + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(nearest() - 1); }
  });

  // Mouse drag (touch screens already swipe natively)
  let drag = null, moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('drag'); }
    if (moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const wasDrag = moved;
    drag = null;
    if (wasDrag) { track.classList.remove('drag'); go(nearest()); }
    setTimeout(() => { moved = false; }, 0);   // lets the click that follows a drag be ignored
  });
  track.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  requestAnimationFrame(() => {
    track.scrollLeft = centerOf(Math.min(opts.start || 0, cards.length - 1));
    update();
  });
};

/* fx.js - bubble effects (decoration only, the app works the same without it).
 *  1. Click a floating background bubble: it pops, then a new one floats back in.
 *  2. Click a button, tab, tile or card: small bubbles rise from the click.
 *  3. Buttons and tiles get a bubble ripple.
 *  4. The background bubbles drift away from the mouse.
 * Everything is switched off for people who prefer reduced motion.
 */
(() => {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const fx = document.createElement('div');
  fx.id = 'fx';
  fx.setAttribute('aria-hidden', 'true');
  document.body.append(fx);

  const bubbles = [...document.querySelectorAll('#bubbles .bubble')];
  const rand = (a, b) => a + Math.random() * (b - a);
  const place = (dx, dy) => `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

  // clicks on these never pop a background bubble
  const SKIP = 'a, button, input, select, textarea, label, summary, table, .glass, .dialog, .overlay, .menu, [role="dialog"]';
  // clicks on these make rising bubbles
  const CLICKY = '.btn, .tab, .tile, .icon-btn, .dot, .avatar, .segmented button, .menu button, .switch, .checkbox, .info-card, .feature, .step, a, button';
  // these also get the ripple
  const RIPPLE = '.btn, .tile, .tab, .icon-btn, .segmented button, .menu button';

  const roomLeft = () => fx.childElementCount < 80; // never flood the page

  function make(cls, x, y, size) {
    const el = document.createElement('span');
    el.className = cls;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (size) { el.style.width = size + 'px'; el.style.height = size + 'px'; }
    fx.append(el);
    return el;
  }

  // ---- 2. small bubbles rising from a click
  function rise(x, y, count) {
    for (let i = 0; i < count && roomLeft(); i++) {
      const el = make('mini', x + rand(-10, 10), y + rand(-6, 6), rand(6, 17));
      const sway = rand(-28, 28);
      const up = rand(60, 140);
      el.animate([
        { transform: place(0, 0) + ' scale(.4)', opacity: 0 },
        { transform: place(sway * 0.4, -up * 0.3) + ' scale(1)', opacity: 0.95, offset: 0.2 },
        { transform: place(-sway * 0.5, -up * 0.65), opacity: 0.8, offset: 0.6 },
        { transform: place(sway, -up) + ' scale(.85)', opacity: 0 },
      ], { duration: rand(900, 1600), delay: rand(0, 140), easing: 'ease-out', fill: 'both' }).onfinish = () => el.remove();
    }
  }

  // ---- 3. ripple inside a button / tile
  function ripple(el, x, y) {
    if (el.disabled) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `left:${x - r.left}px;top:${y - r.top}px;width:${size}px;height:${size}px`;
    el.append(s);
    s.animate([
      { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.6 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
    ], { duration: 650, easing: 'ease-out' }).onfinish = () => s.remove();
  }

  // ---- 1. pop a floating bubble
  function bubbleAt(x, y) {
    let best = null;
    let bestR = Infinity;
    for (const b of bubbles) {
      if (b.dataset.busy) continue;
      const r = b.getBoundingClientRect();
      const rad = r.width / 2;
      if (Math.hypot(x - (r.left + rad), y - (r.top + r.height / 2)) <= rad && rad < bestR) { best = b; bestR = rad; }
    }
    return best;
  }

  function pop(b) {
    const r = b.getBoundingClientRect();
    const rad = r.width / 2;
    const cx = r.left + rad;
    const cy = r.top + r.height / 2;
    b.dataset.busy = '1';

    if (roomLeft()) {
      const ring = make('ring', cx, cy, rad * 2);
      ring.animate([
        { transform: 'translate(-50%, -50%) scale(.9)', opacity: 0.9 },
        { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
      ], { duration: 480, easing: 'ease-out' }).onfinish = () => ring.remove();
    }
    const n = Math.max(8, Math.min(18, Math.round(6 + rad / 10)));
    for (let i = 0; i < n && roomLeft(); i++) {
      const ang = (i / n) * Math.PI * 2 + rand(-0.3, 0.3);
      const d0 = rad * 0.9;
      const d1 = rad * rand(1.0, 1.7) + rand(10, 40);
      const el = make('drop', cx, cy, rand(4, 9) + rad / 28);
      el.animate([
        { transform: place(Math.cos(ang) * d0, Math.sin(ang) * d0), opacity: 1 },
        { transform: place(Math.cos(ang) * d1, Math.sin(ang) * d1 + 24) + ' scale(.2)', opacity: 0 },
      ], { duration: rand(520, 900), easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => el.remove();
    }

    const a = b.animate([{ scale: 1, opacity: 0.9 }, { scale: 1.35, opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    a.onfinish = () => {
      b.style.visibility = 'hidden';
      a.cancel();
      setTimeout(() => respawn(b), rand(1600, 3400));
    };
  }

  function respawn(b) {
    b.style.left = rand(2, 90) + '%';
    b.style.right = 'auto';
    b.style.top = rand(4, 84) + '%';
    b.style.visibility = 'visible';
    b._ox = 0; b._oy = 0; b.style.translate = '';
    b.animate([{ scale: 0, opacity: 0 }, { scale: 1.08, opacity: 0.9, offset: 0.7 }, { scale: 1, opacity: 0.9 }],
      { duration: 900, easing: 'ease-out' });
    delete b.dataset.busy;
  }

  // ---- clicks
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    let x = e.clientX;
    let y = e.clientY;
    const hit = t.closest(CLICKY);
    if (hit && (e.detail === 0 || (x === 0 && y === 0))) { // keyboard "click": use the element's centre
      const r = hit.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    if (!t.closest(SKIP)) {
      const b = bubbleAt(x, y);
      if (b) { pop(b); return; }
    }
    if (hit) {
      rise(x, y, 6);
      const rip = t.closest(RIPPLE);
      if (rip) ripple(rip, x, y);
    }
  }, true);

  // ---- 4. bubbles drift away from the mouse; pointer cursor over a poppable bubble
  let lastEvent = null;
  let frame = 0;
  function onFrame() {
    frame = 0;
    if (!lastEvent) return;
    const { clientX: mx, clientY: my, target } = lastEvent;
    for (const b of bubbles) {
      if (b.dataset.busy) continue;
      const r = b.getBoundingClientRect();
      const ox = b._ox || 0;
      const oy = b._oy || 0;
      const cx = r.left + r.width / 2 - ox; // centre without our own push
      const cy = r.top + r.height / 2 - oy;
      const dx = cx - mx;
      const dy = cy - my;
      const d = Math.hypot(dx, dy) || 1;
      const reach = r.width / 2 + 170;
      let nx = 0;
      let ny = 0;
      if (d < reach) {
        const f = (1 - d / reach) * 46;
        nx = (dx / d) * f;
        ny = (dy / d) * f;
      }
      if (Math.abs(nx - ox) > 0.5 || Math.abs(ny - oy) > 0.5) {
        b._ox = nx; b._oy = ny;
        b.style.translate = `${nx}px ${ny}px`;
      }
    }
    const over = target instanceof Element && !target.closest(SKIP) && !!bubbleAt(mx, my);
    document.documentElement.classList.toggle('over-bubble', over);
  }
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    lastEvent = e;
    if (!frame) frame = requestAnimationFrame(onFrame);
  }, { passive: true });
})();

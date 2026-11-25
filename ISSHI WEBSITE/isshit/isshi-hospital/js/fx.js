/* ==========================================================
   fx.js — liquid cursor, glass spotlight, parallax
   ========================================================== */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  if (reduce) return;

  let mx = innerWidth / 2, my = innerHeight / 2, seen = false;
  const liquid = document.getElementById("liquid");
  const dots = liquid ? [...liquid.children].map((el, i) => ({ el, x: mx, y: my, k: 0.34 - i * 0.07 })) : [];
  const meds = [...document.querySelectorAll(".med")].map((el) => ({ el, d: +el.dataset.depth || 20, x: 0, y: 0 }));

  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (!seen && liquid && fine) { seen = true; liquid.classList.add("on"); dots.forEach((d) => { d.x = mx; d.y = my; }); }
    root.style.setProperty("--px", (mx / innerWidth - 0.5).toFixed(3));
    root.style.setProperty("--py", (my / innerHeight - 0.5).toFixed(3));
    const g = e.target.closest && e.target.closest(".glass, .nav");
    if (g) {
      const r = g.getBoundingClientRect();
      g.style.setProperty("--mx", e.clientX - r.left + "px");
      g.style.setProperty("--my", e.clientY - r.top + "px");
    }
  }, { passive: true });

  document.addEventListener("pointerleave", () => liquid && liquid.classList.remove("on"));
  document.addEventListener("pointerenter", () => seen && liquid && liquid.classList.add("on"));

  (function tick() {
    dots.forEach((d) => {
      d.x += (mx - d.x) * d.k; d.y += (my - d.y) * d.k;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
    });
    const nx = mx / innerWidth - 0.5, ny = my / innerHeight - 0.5;
    meds.forEach((m) => {
      m.x += (nx * m.d - m.x) * 0.06; m.y += (ny * m.d - m.y) * 0.06;
      m.el.style.setProperty("--dx", m.x.toFixed(1) + "px");
      m.el.style.setProperty("--dy", m.y.toFixed(1) + "px");
    });
    requestAnimationFrame(tick);
  })();
})();

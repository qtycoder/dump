/* ==========================================================
   main.js — interactions: nav, scroll reveal, form, icons
   ========================================================== */

(function () {
  const $ = (id) => document.getElementById(id);

  // Icons (lucide loaded from CDN; page still works without them)
  try { window.lucide && lucide.createIcons(); } catch (e) {}

  // Mobile nav
  const nav = $("nav"), burger = $("burger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  // Header shadow + active link
  const header = document.querySelector(".site-header");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 12), { passive: true });

  const links = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((l) => { const s = document.querySelector(l.getAttribute("href")); s && spy.observe(s); });

    // Scroll reveal
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => {
      const i = [...el.parentNode.children].indexOf(el);
      el.style.transitionDelay = Math.min(i, 8) * 60 + "ms";
      io.observe(el);
    });
  }

  // Contact form → mailto (swap for a real endpoint when you have a backend)
  $("contact-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    location.href = "mailto:info@isshihospital.com?subject=" +
      encodeURIComponent("Website inquiry from " + d.get("name")) +
      "&body=" + encodeURIComponent(d.get("message") + "\n\n" + d.get("email"));
  });

  $("year").textContent = new Date().getFullYear();
})();

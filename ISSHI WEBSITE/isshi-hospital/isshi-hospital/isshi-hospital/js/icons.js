/* ==========================================================
   icons.js — local inline icons (no CDN needed).
   Use:  <i data-icon="phone"></i>   → replaced with an <svg>.
   Add new icons to the ICONS map (24×24, stroke style).
   ========================================================== */
(function () {
  const ICONS = {
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "calendar-check": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    "heart-handshake": '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/><path d="M12 8v6M9 11h6"/>',
    "shield-check": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    stethoscope: '<path d="M5 3H4a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1"/><path d="M8 14v1a5 5 0 0 0 10 0v-3"/><circle cx="18" cy="10" r="2"/>',
    "heart-pulse": '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/><path d="M3 12h4l2-3 3 6 2-3h3"/>',
    bone: '<path d="m6.5 17.5 11-11"/><circle cx="5" cy="16.5" r="2.5"/><circle cx="7.5" cy="19" r="2.2"/><circle cx="19" cy="7.5" r="2.5"/><circle cx="16.5" cy="5" r="2.2"/>',
    baby: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0M12 3c1.2 0 2 1 2 2"/>',
    brain: '<path d="M12 3H9.5A3.5 3.5 0 0 0 6 6.5 3.5 3.5 0 0 0 4 10c0 1 .4 1.9 1 2.5A3.5 3.5 0 0 0 6 17a3.5 3.5 0 0 0 3.5 4H12Z"/><path d="M12 3h2.5A3.5 3.5 0 0 1 18 6.5a3.5 3.5 0 0 1 2 3.5c0 1-.4 1.9-1 2.5A3.5 3.5 0 0 1 18 17a3.5 3.5 0 0 1-3.5 4H12"/><path d="M12 8v13"/>',
    ambulance: '<path d="M2 17V7a1 1 0 0 1 1-1h11v11M14 9h4l4 4v4h-3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 17h6M8 8.5v4M6 10.5h4"/>',
    microscope: '<path d="M6 18h8M3 22h18M14 22a7 7 0 0 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
    "building-2": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    wallet: '<path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2ZM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.9 4.9l.7.7"/>',
    "flask-conical": '<path d="M10 2v7.5L4.7 18.2A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.7-2.8L14 9.5V2M8.5 2h7M7 16h10"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
    "scan-line": '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    droplets: '<path d="M12 22a6 6 0 0 0 6-6c0-4-6-10-6-10S6 12 6 16a6 6 0 0 0 6 6Z"/>',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.2 10H20a2 2 0 0 1 1.9 2.6l-1.9 6A2 2 0 0 1 18.1 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H18a2 2 0 0 1 2 2v2"/>',
    receipt: '<path d="M4 2v20l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V2l-3 2-2.5-2-2.5 2-2.5-2L7 4Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    megaphone: '<path d="m3 11 18-8v18L3 13Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "map-pin": '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "arrow-up-right": '<path d="M7 17 17 7M8 7h9v9"/>',
  };

  window.renderIcons = function (root) {
    (root || document).querySelectorAll("i[data-icon]").forEach((el) => {
      const d = ICONS[el.dataset.icon];
      if (!d) return;
      el.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    });
  };
})();

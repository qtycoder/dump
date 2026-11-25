/* ==========================================================
   render.js — builds repeated markup from data.js
   ========================================================== */

(function () {
  const D = window.ISSHI;
  const $ = (id) => document.getElementById(id);
  const icon = (name) => `<i data-icon="${name}"></i>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Specialties
  $("spec-grid").innerHTML = D.specialties.map((s) => `
    <div class="spec glass leaf reveal ${s.emergency ? "spec--emergency" : ""}">
      <div class="icon-badge ${s.glyph ? "icon-badge--text" : ""}">${s.glyph || icon(s.icon)}</div>
      <span>${esc(s.name)}</span>
    </div>`).join("");

  // Services, HMOs
  $("svc-list").innerHTML = D.services.map((s) =>
    `<li><span class="tick">${icon("check")}</span>${esc(s)}</li>`).join("");
  $("hmo-grid").innerHTML = D.hmos.map((h) => `<div>${esc(h)}</div>`).join("");

  // Directory
  $("dir-grid").innerHTML = D.directory.map((d) => `
    <div class="dir-row glass reveal">
      <div class="icon-badge">${icon(d.icon)}</div>
      <b>${esc(d.name)}</b><span class="call">${icon("phone")}${D.phonePlaceholder}</span>
    </div>`).join("");

  // President (featured)
  const p = D.president;
  $("president").innerHTML = `
    <div class="president-photo"><img src="${p.photo}" alt="${esc(p.name)}, ${esc(p.creds)}" width="643" height="900"></div>
    <div class="president-body">
      <span class="chip"><span class="dot"></span>${esc(p.role)} · ${esc(p.term)}</span>
      <h3>${esc(p.name)}</h3>
      <div class="creds">${esc(p.creds)}</div>
      <div class="spec-line">${icon("stethoscope")}${esc(p.specialty)}</div>
    </div>`;

  // Person cards
  const person = (m, i, past) => `
    <figure class="person t${i % 4} ${past ? "person--past" : ""} reveal">
      <img src="${m.photo}" alt="${esc(m.name)}">
      <figcaption>
        <h4>${esc(m.name)}</h4>
        <div class="creds">${esc([m.creds, m.specialty].filter(Boolean).join(" · "))}</div>
        ${past ? `<div class="term">President ${esc(m.term)}</div>` : `<div class="role">${esc(m.role)}</div>`}
      </figcaption>
    </figure>`;

  $("officers").innerHTML = D.officers.map((m, i) => person(m, i)).join("");
  $("directors").innerHTML = D.directors.map((m, i) => person(m, i + 1)).join("");
  $("past").innerHTML = D.pastPresidents.map((m, i) => person(m, i + 2, true)).join("");

  if (window.renderIcons) renderIcons();

  // Counters used in hero
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set("stat-spec", D.specialties.length);
  set("stat-svc", D.services.length);
  set("stat-doc", 1 + D.officers.length + D.directors.length);
})();

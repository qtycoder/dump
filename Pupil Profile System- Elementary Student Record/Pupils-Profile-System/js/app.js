/* UI rendering: nav, dashboard, students page. Uses Store for data. */
const page = document.body.dataset.page;

/* ---------- Liquid navigation ---------- */
function renderNav() {
  const here = location.pathname.split('/').pop() || 'dashboard.html';
  const link = (h, t) => `<a href="${h}" class="${h === here ? 'active' : ''}">${t}</a>`;
  $('#nav').innerHTML = `<nav class="nav neo"><div class="nav-left"><img class="brand" src="images/logo.jpg" alt="EWCS logo"><div class="links"><span class="blob"></span>${link('dashboard.html','🏠 Dashboard')}${link('students.html','🎓 Students')}</div></div>
    <div class="nav-right"><button class="btn sm" id="theme" aria-label="Toggle dark mode">🌓</button><button class="btn sm" id="logout">Logout</button></div></nav>`;
  const links = $('.links'), blob = $('.blob'), home = $('.links a.active') || $('.links a');
  const move = el => { blob.classList.remove('moving'); void blob.offsetWidth; blob.classList.add('moving'); blob.style.width = el.offsetWidth + 'px'; blob.style.transform = `translateX(${el.offsetLeft}px)`; };
  links.querySelectorAll('a').forEach(a => a.addEventListener('mouseenter', () => move(a)));
  links.addEventListener('mouseleave', () => move(home));
  blob.style.transition = 'none'; move(home); setTimeout(() => blob.style.transition = '', 50);
  $('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); localStorage.setItem('sps_theme', t); };
  $('#logout').onclick = () => Auth.logout();
}

function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
const exportBackup = () => { download(`students-backup-${new Date().toISOString().slice(0,10)}.json`, Store.exportJSON()); toast('Backup downloaded'); };

/* ---------- Dashboard ---------- */
function dashboardPage() {
  let mode = 'activity'; // which panel is showing: activity | archive | trash
  const card = (n, l) => `<div class="neo stat"><b>${n}</b>${l}</div>`;
  function stats() {
    const all = Store.all(), cnt = f => all.filter(f).length;
    $('#stats').innerHTML = card(all.length, 'Total students') + card(cnt(s => s.gender === 'Male'), 'Male') + card(cnt(s => s.gender === 'Female'), 'Female')
      + [1,2,3,4,5,6].map(g => card(cnt(s => s.grade === 'Grade ' + g), 'Grade ' + g)).join('');
    $('#quick').textContent = `${all.length} students enrolled · ${cnt(s => s.gender === 'Male')} boys · ${cnt(s => s.gender === 'Female')} girls`;
  }
  const slides = [['📢 Welcome back!', 'Keep student records accurate and up to date. Data is saved on this device.'],
    ['🗓 Reminder', 'Export a JSON backup regularly so records are never lost.'], ['📊 Quick stats', '']];
  $('#track').innerHTML = slides.map(([h, p], i) => `<div class="slide"><h2>${h}</h2><p${i === 2 ? ' id="quick"' : ''}>${esc(p)}</p></div>`).join('');
  stats(); initCarousel($('#carousel'));

  /* Activity / Archive / Trash panel (toggle with the icons) */
  const when = t => t ? new Date(t).toLocaleString() : '';
  function panel() {
    document.querySelectorAll('.tog button').forEach(b => b.classList.toggle('on', b.dataset.p === mode));
    $('#cArc').textContent = Store.list('archive').length || ''; $('#cTrash').textContent = Store.list('trash').length || '';
    $('#panelTitle').textContent = { activity: 'Recent activity', archive: 'Archive', trash: 'Trash' }[mode];
    const ul = $('#activity'), foot = $('#panelFoot'); foot.innerHTML = '';
    if (mode === 'activity') {
      const act = Store.activity().slice(0, 6);
      ul.innerHTML = act.length ? act.map(a => `<li class="neo-in">${esc(a.msg)}<br><small class="muted">${when(a.t)}</small></li>`).join('') : '<li class="neo-in muted">No activity yet. Add your first student.</li>';
      return;
    }
    const items = Store.list(mode);
    ul.innerHTML = items.length ? items.map(s => `<li class="neo-in item"><div><b>${esc(fullName(s))}</b><br><small class="muted">${esc(s.lrn)} · ${esc(s.grade)} · ${mode === 'trash' ? 'Deleted' : 'Archived'} ${when(s._at)}</small></div>
      <div class="actions"><button class="btn sm" data-act="restore" data-id="${s.lrn}">↩ Restore</button>${mode === 'trash' ? `<button class="btn sm danger" data-act="purge" data-id="${s.lrn}">Delete forever</button>` : ''}</div></li>`).join('')
      : `<li class="neo-in muted">${mode === 'archive' ? 'Archive is empty.' : 'Trash is empty.'}</li>`;
    if (mode === 'trash' && items.length) foot.innerHTML = '<button class="btn sm danger" data-act="empty">Empty trash</button>';
  }
  $('.panel').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) { mode = b.dataset.p; return panel(); }
    const id = b.dataset.id, a = b.dataset.act;
    try {
      if (a === 'restore') { Store.restore(mode, id); toast('Student restored'); stats(); }
      if (a === 'purge' && confirm('Delete this student permanently? This cannot be undone.')) { Store.purge(id); toast('Deleted permanently'); }
      if (a === 'empty' && confirm('Permanently delete everything in Trash?')) { Store.emptyTrash(); toast('Trash emptied'); }
    } catch (err) { toast(err.message); }
    panel();
  };
  panel(); $('#qExport').onclick = exportBackup;
}

/* ---------- Students (CRUD) ---------- */
function studentsPage() {
  const form = $('#form'), FIELDS = ['lrn','first','middle','last','birthdate','age','gender','grade','section','guardian','contact','enrolled','address'];
  let current = []; // filtered list currently shown (used by exports)
  let editing = null; // LRN being edited, or null when adding
  const open = m => m.classList.add('open'), close = m => m.classList.remove('open');

  function render() {
    const all = Store.all(), cur = $('#fs').value, t = $('#q').value.trim().toLowerCase();
    $('#fs').innerHTML = '<option value="">All sections</option>' + [...new Set(all.map(s => s.section))].sort().map(x => `<option>${esc(x)}</option>`).join('');
    $('#fs').value = cur;
    const list = all.filter(s => (!$('#fg').value || s.grade === $('#fg').value) && (!$('#fs').value || s.section === $('#fs').value)
      && (!t || s.lrn.includes(t) || fullName(s).toLowerCase().includes(t)));
    current = list;
    $('#tbody').innerHTML = list.length ? list.map(s => `<tr><td>${esc(s.lrn)}</td><td>${esc(fullName(s))}</td><td>${esc(s.grade)}</td><td>${esc(s.section)}</td><td>${esc(s.guardian)}</td>
      <td><button class="btn sm" data-a="view" data-id="${s.lrn}">View</button> <button class="btn sm" data-a="edit" data-id="${s.lrn}">Edit</button> <button class="btn sm" data-a="arc" data-id="${s.lrn}">Archive</button> <button class="btn sm danger" data-a="del" data-id="${s.lrn}">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="6" class="muted">No students found. Add a student or import a backup.</td></tr>';
    $('#count').textContent = `Showing ${list.length} of ${all.length}`;
  }

  function openForm(lrn) {
    editing = lrn || null; form.reset(); form.querySelectorAll('.err').forEach(e => e.textContent = '');
    $('#formTitle').textContent = lrn ? 'Edit student' : 'Add student';
    if (lrn) { const s = Store.get(lrn); FIELDS.forEach(f => form.elements[f].value = s[f] ?? ''); }
    else form.elements.enrolled.value = new Date().toISOString().slice(0, 10);
    open($('#formModal'));
  }

  form.elements.birthdate.onchange = e => form.elements.age.value = calcAge(e.target.value);
  form.onsubmit = e => {
    e.preventDefault();
    const s = Object.fromEntries(FIELDS.map(f => [f, form.elements[f].value.trim()])); s.age = Number(s.age) || '';
    const errs = validateStudent(s, editing);
    form.querySelectorAll('[data-e]').forEach(el => el.textContent = errs[el.dataset.e] || '');
    if (Object.keys(errs).length) return;
    const wasEdit = !!editing;
    try { wasEdit ? Store.update(editing, s) : Store.add(s); } catch (err) { return toast('Could not save: ' + err.message); }
    close($('#formModal')); render(); toast(wasEdit ? 'Student updated' : 'Student added');
  };

  function showProfile(s) {
    const row = (k, v) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`;
    $('#printArea').innerHTML = `<div class="profile"><p class="muted">Student Profile</p><h2>${esc(fullName(s))}</h2><p class="muted">${esc(s.grade)} · ${esc(s.section)}</p><table class="ptable">
      ${row('LRN', s.lrn)}${row('Age', s.age)}${row('Birthdate', s.birthdate)}${row('Gender', s.gender)}${row('Guardian', s.guardian)}
      ${row('Contact', s.contact)}${row('Address', s.address)}${row('Date enrolled', s.enrolled)}</table></div>`;
    open($('#viewModal'));
  }

  $('#tbody').onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const id = b.dataset.id, s = Store.get(id);
    if (b.dataset.a === 'view') showProfile(s);
    if (b.dataset.a === 'edit') openForm(id);
    if (b.dataset.a === 'arc') { Store.archive(id); render(); toast('Archived. Restore it from the Dashboard.'); }
    if (b.dataset.a === 'del' && confirm(`Move ${fullName(s)} (LRN ${id}) to Trash? You can restore it from the Dashboard.`)) { Store.trash(id); render(); toast('Moved to Trash'); }
  };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close(b.closest('.modal')));
  document.querySelectorAll('.modal').forEach(m => m.onclick = e => { if (e.target === m) close(m); });
  ['q','fg','fs'].forEach(id => $('#' + id).addEventListener('input', render));
  $('#add').onclick = () => openForm(); $('#export').onclick = exportBackup;
  $('#xlsx').onclick = () => Exporter.excel(current); $('#docx').onclick = () => Exporter.word(current); $('#pdf').onclick = () => Exporter.pdf(current); $('#print').onclick = () => window.print();
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const r = await Importer.run(f); render(); toast(`Imported ${r.added + r.updated} student(s)`);
      if (r.bad.length || r.updated) alert(`Import finished.\nNew: ${r.added}\nUpdated (same LRN): ${r.updated}\nSkipped: ${r.bad.length}`
        + (r.bad.length ? '\n\n' + r.bad.slice(0, 10).join('\n') + (r.bad.length > 10 ? `\n…and ${r.bad.length - 10} more` : '') : ''));
    } catch (err) { alert('Import failed: ' + err.message); }
  };
  render(); if (new URLSearchParams(location.search).get('add')) openForm();
}

renderNav();
page === 'dashboard' ? dashboardPage() : studentsPage();

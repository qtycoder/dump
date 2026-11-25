
const STATUS_TABS = [['', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed']];
const PRIORITY_OPTS = Object.entries(PRIORITY).map(([k, v]) => [k, v[0]]);

async function renderTickets(root, ctx) {
  const isStaff = ctx.user.role !== 'REQUESTER';
  const state = { status: ctx.params.get('status') || '', q: ctx.params.get('q') || '', departmentId: '', priority: '' };
  const tbody = h('tbody');
  const count = h('p', {});

  async function load() {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v) qs.set(k, v);
    const rows = await get('/tickets' + (qs.toString() ? '?' + qs : ''));
    count.textContent = `${rows.length} ticket${rows.length === 1 ? '' : 's'}`;
    if (!rows.length) {
      tbody.replaceChildren(h('tr', {}, h('td', { colspan: 8, class: 'empty' }, 'No tickets match.')));
      return;
    }
    tbody.replaceChildren(...rows.map((t) => h('tr', {},
      h('td', { class: 'mono' }, t.ticketNo),
      h('td', {}, t.categoryName, t.issueName ? h('div', { class: 'sub' }, t.issueName) : (t.othersText ? h('div', { class: 'sub' }, t.othersText) : null)),
      h('td', {}, t.departmentName),
      h('td', {}, badge(PRIORITY, t.priority)),
      h('td', {}, badge(STATUS, t.status)),
      h('td', {}, t.assignedToName || h('span', { class: 'sub' }, 'Unassigned')),
      h('td', {}, fmtDate(t.createdAt)),
      h('td', { class: 'actions' }, h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => openDetail(t.id) }, 'View')))));
  }

  const reload = () => load().catch((e) => toast(e.message, 'error'));

  // ---- toolbar ----
  const search = h('input', { class: 'field', type: 'search', placeholder: 'Search ticket no., description, requester…', 'aria-label': 'Search tickets', value: state.q });
  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = search.value.trim(); reload(); }, 300); });

  const filters = [segmented(STATUS_TABS, state.status, (v) => { state.status = v; reload(); })];
  const prio = selectField({ label: '', options: [['', 'Any priority'], ...PRIORITY_OPTS], onChange: (e) => { state.priority = e.target.value; reload(); } });
  prio.el.querySelector('label').remove();
  const dept = selectField({ label: '', options: [['', 'All departments'], ...ctx.lookups.departments.map((d) => [d.id, d.name])], onChange: (e) => { state.departmentId = e.target.value; reload(); } });
  dept.el.querySelector('label').remove();

  root.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, isStaff ? 'Tickets' : 'My tickets'), count),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openNew() }, icon('plus', 18), 'Create Ticket')),
    h('div', { class: 'toolbar' }, ...filters),
    h('div', { class: 'toolbar' },
      h('div', { class: 'grow' }, search),
      h('div', {}, prio.el),
      isStaff ? h('div', {}, dept.el) : null),
    h('div', { class: 'glass table-wrap' },
      h('table', {},
        h('thead', {}, h('tr', {}, ['Ticket', 'Concern', 'Department', 'Priority', 'Status', 'Assigned to', 'Created', ''].map((c) => h('th', { scope: 'col' }, c)))),
        tbody)));

  await load();
  if (ctx.params.get('new')) openNew();
  if (ctx.params.get('open')) openDetail(Number(ctx.params.get('open')));

  // ---------------------------------------------------------------- new ticket
  function openNew() {
    const { departments, categories, issues } = ctx.lookups;
    const requester = textField({ label: 'Requester name', name: 'requesterName', value: ctx.user.fullName, maxlength: 120 });
    const deptSel = selectField({ label: 'Department / Location', name: 'departmentId', required: true,
      options: [['', 'Select department…'], ...departments.map((d) => [d.id, d.name])], value: ctx.user.departmentId ?? '' });
    const catSel = selectField({ label: 'Concern', name: 'categoryId', required: true,
      options: [['', 'Select concern…'], ...categories.map((c) => [c.id, c.name])], value: ctx.params.get('category') || '', onChange: syncIssues });
    const issueSel = selectField({ label: 'Issue', name: 'issueId', options: [['', '—']] });
    const others = textField({ label: 'Please specify', name: 'othersText', required: true, maxlength: 200, placeholder: 'What is the concern?' });
    const desc = textArea({ label: 'Describe the problem', name: 'description', required: true, placeholder: 'What happened? Any error message? Which PC / printer?' });
    const prio = selectField({ label: 'Priority', name: 'priority', options: PRIORITY_OPTS, value: 'NORMAL' });
    const error = h('p', { class: 'form-error', role: 'alert' });
    const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Submit Ticket');

    function syncIssues() {
      const cat = categories.find((c) => String(c.id) === catSel.value);
      const list = issues.filter((i) => cat && i.categoryId === cat.id);
      issueSel.el.hidden = list.length === 0;
      setOptions(issueSel.input, [['', 'Select issue…'], ...list.map((i) => [i.id, i.name])]);
      others.el.hidden = !(cat && cat.name.toLowerCase() === 'others');
    }
    syncIssues();

    const m = modal({
      title: 'New ticket',
      content: h('form', { novalidate: true, style: 'display:grid;gap:14px', onsubmit: async (e) => {
        e.preventDefault();
        await withBusy(submit, error, async () => {
          const body = {
            requesterName: requester.value || null,
            departmentId: deptSel.value || null,
            categoryId: catSel.value || null,
            issueId: issueSel.el.hidden ? null : (issueSel.value || null),
            othersText: others.el.hidden ? null : others.value,
            description: desc.value,
            priority: prio.value,
          };
          const t = await post('/tickets', body);
          m.close();
          toast(`Ticket ${t.ticketNo} submitted`);
          await load();
        });
      } },
        h('div', { class: 'form-grid' }, requester.el, deptSel.el, h('div', { class: 'full' }, catSel.el),
          h('div', { class: 'full' }, issueSel.el), h('div', { class: 'full' }, others.el),
          h('div', { class: 'full' }, desc.el), prio.el),
        error,
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Cancel'), submit)),
    });
  }

  // -------------------------------------------------------------- ticket detail
  async function openDetail(id) {
    let t;
    try { t = await get('/tickets/' + id); } catch (e) { toast(e.message, 'error'); return; }
    const kv = (k, v) => h('div', {}, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v));
    const concern = t.categoryName + (t.issueName ? ' › ' + t.issueName : '');

    const parts = [
      h('div', { class: 'kv' },
        kv('Ticket', t.ticketNo), kv('Status', badge(STATUS, t.status)), kv('Priority', badge(PRIORITY, t.priority)),
        kv('Department', t.departmentName), kv('Concern', concern), kv('Requester', t.requesterName || t.createdByName),
        kv('Created', fmtDate(t.createdAt)), kv('Assigned to', t.assignedToName || 'Unassigned'),
        t.resolvedAt ? kv('Resolved', fmtDate(t.resolvedAt)) : null),
      t.othersText ? h('div', {}, h('div', { class: 'label' }, 'Other concern'), h('div', { class: 'note' }, t.othersText)) : null,
      h('div', {}, h('div', { class: 'label' }, 'Description'), h('div', { class: 'note' }, t.description)),
      t.resolution && !isStaff ? h('div', {}, h('div', { class: 'label' }, 'Resolution'), h('div', { class: 'note ok' }, t.resolution)) : null,
    ];

    let m;
    if (isStaff) {
      const staffUsers = ctx.lookups.users.filter((u) => u.active && (u.role === 'ADMIN' || u.role === 'IT_STAFF'));
      const status = selectField({ label: 'Status', options: Object.entries(STATUS).map(([k, v]) => [k, v[0]]), value: t.status });
      const assignee = selectField({ label: 'Assigned to', options: [['', 'Unassigned'], ...staffUsers.map((u) => [u.id, u.fullName])], value: t.assignedTo ?? '' });
      const prio = selectField({ label: 'Priority', options: PRIORITY_OPTS, value: t.priority });
      const resolution = textArea({ label: 'Troubleshoot result / resolution', value: t.resolution || '', placeholder: 'What was done? e.g. "Cleared paper jam, cleaned rollers — troubleshoot successful."', hint: 'Required when marking a ticket Resolved or Closed.' });
      const error = h('p', { class: 'form-error', role: 'alert' });
      const save = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save changes');
      parts.push(h('hr', { class: 'sep' }),
        h('form', { novalidate: true, style: 'display:grid;gap:14px', onsubmit: async (e) => {
          e.preventDefault();
          await withBusy(save, error, async () => {
            await put('/tickets/' + t.id, {
              status: status.value, assignedTo: assignee.value || null, priority: prio.value, resolution: resolution.value || null,
            });
            m.close();
            toast('Ticket updated');
            await load();
          });
        } },
          h('div', { class: 'form-grid' }, status.el, assignee.el, prio.el, h('div', { class: 'full' }, resolution.el)),
          error,
          h('div', { class: 'dialog-actions' },
            ctx.user.role === 'ADMIN' ? h('button', { class: 'btn btn-danger', type: 'button', onclick: async () => {
              if (!(await confirmDialog(`Delete ticket ${t.ticketNo}? This cannot be undone.`))) return;
              try { await del('/tickets/' + t.id); m.close(); toast('Ticket deleted'); await load(); } catch (err) { toast(err.message, 'error'); }
            } }, icon('trash', 16), 'Delete') : null,
            h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Close'), save)));
    }

    if (t.history && t.history.length) {
      parts.push(h('div', {}, h('div', { class: 'label', style: 'margin-bottom:8px' }, 'Activity'),
        h('ul', { class: 'timeline' }, [...t.history].reverse().map((x) =>
          h('li', {}, h('span', {}, x.text), h('time', {}, `${x.byName} · ${fmtDate(x.at)}`))))));
    }
    if (!isStaff) parts.push(h('div', { class: 'dialog-actions' }, h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Close')));

    m = modal({ title: `Ticket ${t.ticketNo}`, wide: true, content: parts });
  }
}

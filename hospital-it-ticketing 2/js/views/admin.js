// Admin screens: Users, Departments, Concerns (+ issues). All use the generic CRUD view.

function renderUsers(root, ctx) {
  const L = ctx.lookups;
  return renderCrud(root, ctx, {
    title: 'Users',
    subtitle: 'Who can sign in: admins, IT staff and hospital staff who submit tickets.',
    path: '/users', singular: 'user', plural: 'users', searchPlaceholder: 'Search name, username, role…',
    rowLabel: (r) => r.fullName,
    afterChange: ctx.refreshLookups,
    columns: [
      { label: 'Name', text: (r) => r.fullName, cell: (r) => h('div', {}, h('b', {}, r.fullName), r.contact ? h('div', { class: 'sub' }, r.contact) : null) },
      { label: 'Username', key: 'username' },
      { label: 'Role', text: (r) => ROLE[r.role]?.[0] ?? r.role, cell: (r) => badge(ROLE, r.role) },
      { label: 'Department', text: (r) => nameOf(L.departments, r.departmentId), cell: (r) => nameOf(L.departments, r.departmentId) || '—' },
      { label: 'Concerns', text: (r) => String(r.ticketCount ?? 0),
        cell: (r) => (r.ticketCount
          ? h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => openUserConcerns(r) },
              `${r.ticketCount} ticket${r.ticketCount > 1 ? 's' : ''}${r.openCount ? ' · ' + r.openCount + ' open' : ''}`)
          : h('span', { class: 'sub' }, 'None')) },
      { label: 'Status', text: (r) => (r.active ? 'active' : 'inactive'), cell: (r) => h('span', { class: 'badge ' + (r.active ? 'b-ok' : 'b-gray') }, r.active ? 'Active' : 'Inactive') },
    ],
    fields: [
      { name: 'fullName', label: 'Full name', required: true, maxlength: 120, wide: false },
      { name: 'username', label: 'Username', required: true, maxlength: 32, hint: '3–32 letters, numbers, dot, dash or underscore.', wide: false },
      { name: 'password', label: 'Password', type: 'password', required: true, hint: 'At least 8 characters. The user must change it at first sign-in.', editHint: 'Leave blank to keep the current password.' },
      { name: 'role', label: 'Role', type: 'select', required: true, default: 'REQUESTER', wide: false,
        options: () => Object.entries(ROLE).map(([k, v]) => [k, v[0]]) },
      { name: 'departmentId', label: 'Department', type: 'select', number: true, wide: false,
        options: () => [['', '— none —'], ...L.departments.map((d) => [d.id, d.name])] },
      { name: 'contact', label: 'Contact (local no. / email)', maxlength: 120 },
      { name: 'active', label: 'Account is active', type: 'switch', default: true },
    ],
  });
}

function renderDepartments(root, ctx) {
  return renderCrud(root, ctx, {
    title: 'Departments',
    subtitle: 'Hospital areas that can request IT support.',
    path: '/departments', singular: 'department', plural: 'departments', searchPlaceholder: 'Search departments…',
    afterChange: ctx.refreshLookups,
    columns: [
      { label: 'Department', key: 'name', cell: (r) => h('b', {}, r.name) },
      { label: 'Description', key: 'description', cell: (r) => r.description || '—' },
    ],
    fields: [
      { name: 'name', label: 'Name', required: true, maxlength: 80 },
      { name: 'description', label: 'Description / location', type: 'textarea', placeholder: 'Optional' },
    ],
  });
}

async function renderCatalog(root, ctx) {
  const holder = h('div');
  const L = ctx.lookups;
  let tab = 'categories';

  async function show() {
    if (tab === 'categories') {
      await renderCrud(holder, ctx, {
        title: 'Concerns', subtitle: 'Main categories, e.g. PC, Printer, Internet Connection.',
        path: '/categories', singular: 'concern', plural: 'concerns', searchPlaceholder: 'Search concerns…',
        afterChange: ctx.refreshLookups,
        columns: [
          { label: 'Concern', key: 'name', cell: (r) => h('b', {}, r.name) },
          { label: 'Issues', text: (r) => L.issues.filter((i) => i.categoryId === r.id).map((i) => i.name).join(' '),
            cell: (r) => { const n = L.issues.filter((i) => i.categoryId === r.id).length; return n ? `${n} issue${n > 1 ? 's' : ''}` : '—'; } },
        ],
        fields: [
          { name: 'name', label: 'Name', required: true, maxlength: 80 },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional' },
        ],
      });
    } else {
      await renderCrud(holder, ctx, {
        title: 'Issues', subtitle: 'Specific problems under a concern, e.g. Paper Jam under Printer.',
        path: '/issues', singular: 'issue', plural: 'issues', searchPlaceholder: 'Search issues…',
        afterChange: ctx.refreshLookups,
        columns: [
          { label: 'Issue', key: 'name', cell: (r) => h('b', {}, r.name) },
          { label: 'Concern', text: (r) => nameOf(L.categories, r.categoryId), cell: (r) => nameOf(L.categories, r.categoryId) },
        ],
        fields: [
          { name: 'categoryId', label: 'Concern', type: 'select', required: true, number: true,
            options: () => [['', 'Select concern…'], ...L.categories.map((c) => [c.id, c.name])] },
          { name: 'name', label: 'Issue name', required: true, maxlength: 100 },
        ],
      });
    }
  }

  root.replaceChildren(
    h('div', { class: 'toolbar' }, segmented([['categories', 'Concerns'], ['issues', 'Issues']], tab, (v) => { tab = v; show(); })),
    holder);
  await show();
}

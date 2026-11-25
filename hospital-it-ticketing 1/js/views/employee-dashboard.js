// EMPLOYEE dashboard: report a concern quickly and follow my own tickets.

async function renderEmployeeDashboard(root, ctx) {
  const [stats, tickets] = await Promise.all([get('/stats'), get('/tickets')]);
  const s = stats.byStatus;
  const { categories, issues, departments } = ctx.lookups;
  const dept = nameOf(departments, ctx.user.departmentId);

  const tiles = categories.map((c) => {
    const sample = issues.filter((i) => i.categoryId === c.id).slice(0, 2).map((i) => i.name).join(', ');
    return h('a', { class: 'tile glass', href: `#/tickets?new=1&category=${c.id}` },
      h('span', { class: 'chip-icon' }, icon(categoryIcon(c.name), 22)),
      h('b', {}, c.name),
      h('span', { class: 'sub' }, sample || 'Tell us what is wrong'));
  });

  const latest = tickets.slice(0, 6);
  const list = latest.length
    ? h('div', { class: 'latest' }, latest.map((t) => h('div', { class: 'item' },
        h('div', { class: 't' },
          h('b', {}, `${t.ticketNo} · ${t.categoryName}${t.issueName ? ' › ' + t.issueName : ''}`),
          h('span', {}, t.status === 'RESOLVED' || t.status === 'CLOSED'
            ? `Resolved: ${(t.resolution || '').slice(0, 90)}`
            : `${t.assignedToName ? 'Handled by ' + t.assignedToName : 'Waiting for IT'} · ${fmtDate(t.createdAt)}`)),
        badge(STATUS, t.status),
        h('a', { class: 'btn btn-secondary btn-small', href: `#/tickets?open=${t.id}` }, 'View'))))
    : h('p', { class: 'empty' }, 'You have not sent any ticket yet. Pick a concern above to start.');

  root.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, `Hello, ${ctx.user.fullName.split(' ')[0]}`),
        h('p', {}, dept ? `${dept} · Employee portal` : 'Employee portal')),
      h('a', { class: 'btn btn-primary', href: '#/tickets?new=1' }, icon('plus', 18), 'Create Ticket')),
    h('section', { class: 'panel glass', style: 'margin-bottom:16px' },
      h('h2', {}, 'What do you need help with?'),
      h('div', { class: 'tiles' }, tiles)),
    h('div', { class: 'cards' },
      h('div', { class: 'info-card glass' }, h('div', { class: 'row' }, h('span', {}, 'Waiting'), h('span', { class: 'chip-icon' }, icon('inbox'))),
        h('div', { class: 'big' }, s.OPEN), h('div', { class: 'sub' }, 'Sent, not yet started')),
      h('div', { class: 'info-card glass' }, h('div', { class: 'row' }, h('span', {}, 'In progress'), h('span', { class: 'chip-icon' }, icon('clock'))),
        h('div', { class: 'big' }, s.IN_PROGRESS), h('div', { class: 'sub' }, 'IT is working on it')),
      h('div', { class: 'info-card glass' }, h('div', { class: 'row' }, h('span', {}, 'Resolved'), h('span', { class: 'chip-icon' }, icon('check'))),
        h('div', { class: 'big' }, s.RESOLVED + s.CLOSED), h('div', { class: 'sub' }, 'Troubleshoot successful'))),
    h('section', { class: 'panel glass' },
      h('div', { class: 'panel-head' }, h('h2', {}, 'My latest tickets'),
        h('a', { class: 'btn btn-secondary btn-small', href: '#/tickets' }, 'See all')),
      list));
}

// ADMIN / IT STAFF dashboard: whole-hospital numbers + who the employees are and what they reported.

function statCard(label, value, sub, ic) {
  return h('div', { class: 'info-card glass' },
    h('div', { class: 'row' }, h('span', {}, label), h('span', { class: 'chip-icon' }, icon(ic))),
    h('div', { class: 'big' }, value),
    h('div', { class: 'sub' }, sub));
}

function bars(rows, empty) {
  if (!rows.length) return h('p', { class: 'empty' }, empty);
  const max = Math.max(...rows.map((r) => r.count), 1);
  return h('div', {}, rows.map((r) => h('div', { class: 'bar-row' },
    h('span', { class: 'name', title: r.name }, r.name),
    h('div', { class: 'bar', 'aria-hidden': 'true' }, h('span', { style: `width:${Math.round((r.count / max) * 100)}%` })),
    h('span', { class: 'n' }, r.count))));
}

async function renderAdminDashboard(root, ctx) {
  const [stats, tickets, users] = await Promise.all([get('/stats'), get('/tickets'), get('/users')]);
  const s = stats.byStatus;
  const active = s.OPEN + s.IN_PROGRESS;
  const employees = users.filter((u) => u.role === 'REQUESTER');
  const isAdmin = ctx.user.role === 'ADMIN';

  const maxDay = Math.max(...stats.last7Days.map((d) => d.count), 1);
  const week = h('div', { class: 'days', role: 'img', 'aria-label': 'Tickets created in the last 7 days' },
    stats.last7Days.map((d) => h('div', { class: 'col' },
      h('b', {}, d.count),
      h('i', { style: `height:${Math.max(3, Math.round((d.count / maxDay) * 110))}px` }),
      h('span', {}, fmtDay(d.date)))));

  const statusRows = Object.entries(s).map(([k, v]) => ({ name: STATUS[k][0], count: v }));

  // ---- employees and their latest concern
  const latestBy = new Map();
  for (const t of tickets) if (!latestBy.has(t.createdBy)) latestBy.set(t.createdBy, t); // tickets are newest first
  const withTickets = employees.filter((u) => u.ticketCount > 0)
    .sort((a, b) => b.openCount - a.openCount || b.ticketCount - a.ticketCount).slice(0, 8);

  const concernRow = (u) => {
    const t = latestBy.get(u.id);
    return h('tr', {},
      h('td', {}, h('b', {}, u.fullName), h('div', { class: 'sub' }, nameOf(ctx.lookups.departments, u.departmentId) || '—')),
      h('td', {}, t ? [t.categoryName, t.issueName ? h('div', { class: 'sub' }, t.issueName) : null] : '—'),
      h('td', {}, t ? badge(STATUS, t.status) : '—'),
      h('td', { class: 'mono' }, `${u.openCount} / ${u.ticketCount}`),
      h('td', { class: 'actions' }, h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => openUserConcerns(u) }, 'View')));
  };

  const concernsPanel = h('section', { class: 'panel glass' },
    h('div', { class: 'panel-head' }, h('h2', {}, 'Employees and their concerns'),
      isAdmin ? h('a', { class: 'btn btn-secondary btn-small', href: '#/users' }, 'All users') : null),
    withTickets.length
      ? h('div', { class: 'table-wrap flat' }, h('table', { class: 'compact' },
          h('thead', {}, h('tr', {}, ['Employee', 'Latest concern', 'Status', 'Open / total', ''].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', {}, withTickets.map(concernRow))))
      : h('p', { class: 'empty' }, 'No employee has reported a concern yet.'));

  const recent = [...employees].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
  const signupsPanel = h('section', { class: 'panel glass' },
    h('h2', {}, 'Newest employees'),
    recent.length
      ? h('div', { class: 'latest' }, recent.map((u) => h('div', { class: 'item' },
          h('div', { class: 't' }, h('b', {}, u.fullName),
            h('span', {}, `${nameOf(ctx.lookups.departments, u.departmentId) || 'No department'} · joined ${fmtDate(u.createdAt)}`)),
          u.selfRegistered ? h('span', { class: 'badge b-blue' }, 'Self sign-up') : null,
          h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => openUserConcerns(u) },
            u.ticketCount ? `${u.ticketCount} concern${u.ticketCount > 1 ? 's' : ''}` : 'No concerns'))))
      : h('p', { class: 'empty' }, 'No employees yet. They can sign up from the homepage.'));

  const latest = tickets.slice(0, 5);

  root.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, `${isAdmin ? 'Admin' : 'IT'} dashboard`), h('p', {}, `Welcome, ${ctx.user.fullName}. Here is what is happening across the hospital.`)),
      h('a', { class: 'btn btn-primary', href: '#/tickets?new=1' }, icon('plus', 18), 'Create Ticket')),
    h('div', { class: 'cards' },
      statCard('Active tickets', active, `${s.OPEN} open · ${s.IN_PROGRESS} in progress`, 'inbox'),
      statCard('Resolved', s.RESOLVED + s.CLOSED, 'Troubleshoot successful', 'check'),
      statCard('Avg. resolution', stats.avgResolutionHours == null ? '—' : `${stats.avgResolutionHours} h`, 'From creation to resolved', 'clock'),
      statCard('Unassigned', stats.unassigned, 'Open tickets with no IT staff', 'users'),
      statCard('Employees', employees.length, 'Registered accounts', 'users')),
    h('div', { class: 'grid-2' }, concernsPanel, signupsPanel),
    h('div', { class: 'grid-2' },
      h('section', { class: 'panel glass' }, h('h2', {}, 'Created in the last 7 days'), week),
      h('section', { class: 'panel glass' }, h('h2', {}, 'By status'), bars(statusRows, 'No tickets yet'))),
    h('div', { class: 'grid-2' },
      h('section', { class: 'panel glass' }, h('h2', {}, 'Top departments'), bars(stats.byDepartment, 'No tickets yet')),
      h('section', { class: 'panel glass' }, h('h2', {}, 'By concern'), bars(stats.byCategory, 'No tickets yet'))),
    h('section', { class: 'panel glass' },
      h('h2', {}, 'Latest tickets'),
      latest.length
        ? h('div', { class: 'latest' }, latest.map((t) => h('div', { class: 'item' },
            h('div', { class: 't' },
              h('b', {}, `${t.ticketNo} · ${t.categoryName}${t.issueName ? ' › ' + t.issueName : ''}`),
              h('span', {}, `${t.requesterName || t.createdByName} · ${t.departmentName} · ${fmtDate(t.createdAt)}`)),
            badge(PRIORITY, t.priority), badge(STATUS, t.status),
            h('a', { class: 'btn btn-secondary btn-small', href: `#/tickets?open=${t.id}` }, 'View'))))
        : h('p', { class: 'empty' }, 'No tickets yet.')));
}

/** Pop-up listing everything one user has reported. Used by the dashboard and the Users page. */
async function openUserConcerns(user) {
  let list;
  try { list = await get('/tickets?createdBy=' + user.id); } catch (e) { toast(e.message, 'error'); return; }
  let m;
  const body = list.length
    ? h('div', { class: 'latest' }, list.map((t) => h('div', { class: 'item' },
        h('div', { class: 't' },
          h('b', {}, `${t.ticketNo} · ${t.categoryName}${t.issueName ? ' › ' + t.issueName : ''}`),
          h('span', {}, `${t.departmentName} · ${fmtDate(t.createdAt)}`)),
        badge(STATUS, t.status),
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => { m.close(); location.hash = `#/tickets?open=${t.id}`; } }, 'Open'))))
    : h('p', { class: 'empty' }, 'This user has not reported any concern yet.');
  m = modal({
    title: `${user.fullName}'s concerns`,
    wide: true,
    content: [
      h('p', { class: 'sub' }, `@${user.username} · ${nameOf(ctx.lookups.departments, user.departmentId) || 'No department'}${user.contact ? ' · ' + user.contact : ''}`),
      body,
      h('div', { class: 'dialog-actions' }, h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Close')),
    ],
  });
}

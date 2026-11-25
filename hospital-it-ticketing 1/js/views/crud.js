// Generic list + add/edit/delete screen used by Users, Departments and Concerns/Issues.

/**
 * cfg = {
 *   title, subtitle, path, singular, searchPlaceholder,
 *   columns: [{ label, cell(row) -> Node|string, text?(row) -> string }],
 *   fields:  [{ name, label, type: text|textarea|password|select|switch, required, hint, placeholder,
 *               options() -> [[value,label]], number, createOnly, editHint, default, wide, maxlength }],
 *   canDelete?(row) , afterChange?()
 * }
 */
async function renderCrud(root, ctx, cfg) {
  let rows = [];
  let filter = '';
  const tbody = h('tbody');
  const search = h('input', { class: 'field', type: 'search', placeholder: cfg.searchPlaceholder || 'Search…', 'aria-label': 'Search' });
  search.addEventListener('input', () => { filter = search.value.trim().toLowerCase(); draw(); });

  function draw() {
    const shown = rows.filter((r) => !filter || cfg.columns.some((c) => String(c.text ? c.text(r) : r[c.key] ?? '').toLowerCase().includes(filter)));
    if (!shown.length) {
      tbody.replaceChildren(h('tr', {}, h('td', { colspan: cfg.columns.length + 1, class: 'empty' }, rows.length ? 'Nothing matches your search.' : `No ${cfg.plural || 'records'} yet.`)));
      return;
    }
    tbody.replaceChildren(...shown.map((r) => h('tr', {},
      ...cfg.columns.map((c) => h('td', {}, c.cell ? c.cell(r) : r[c.key] ?? '')),
      h('td', { class: 'actions' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Edit ${cfg.singular}`, title: 'Edit', onclick: () => openForm(r) }, icon('edit', 18)),
        ' ',
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Delete ${cfg.singular}`, title: 'Delete', onclick: () => remove(r) }, icon('trash', 18))))));
  }

  async function load() {
    rows = await get(cfg.path);
    draw();
  }

  async function changed() {
    if (cfg.afterChange) await cfg.afterChange();
    await load();
  }

  async function remove(r) {
    const label = cfg.rowLabel ? cfg.rowLabel(r) : (r.name || r.fullName || r.id);
    if (!(await confirmDialog(`Delete ${cfg.singular} "${label}"?`))) return;
    try {
      await del(`${cfg.path}/${r.id}`);
      toast(`${cap(cfg.singular)} deleted`);
      await changed();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function openForm(row) {
    const editing = !!row;
    const controls = [];
    for (const f of cfg.fields) {
      if (f.createOnly && editing) continue;
      const initial = editing ? row[f.name] : (f.default ?? '');
      let c;
      const common = { label: f.label, name: f.name, required: f.required && !(f.type === 'password' && editing), hint: editing && f.editHint ? f.editHint : f.hint };
      if (f.type === 'select') c = selectField({ ...common, options: f.options(), value: initial ?? '' });
      else if (f.type === 'textarea') c = textArea({ ...common, value: initial ?? '', placeholder: f.placeholder });
      else if (f.type === 'switch') c = switchField({ label: f.label, checked: editing ? !!initial : (f.default ?? true), name: f.name });
      else c = textField({ ...common, type: f.type === 'password' ? 'password' : 'text', value: f.type === 'password' ? '' : (initial ?? ''),
        placeholder: f.placeholder, maxlength: f.maxlength, autocomplete: f.type === 'password' ? 'new-password' : 'off' });
      controls.push([f, c]);
    }
    const error = h('p', { class: 'form-error', role: 'alert' });
    const save = h('button', { class: 'btn btn-primary', type: 'submit' }, editing ? 'Save changes' : `Add ${cfg.singular}`);
    const m = modal({
      title: `${editing ? 'Edit' : 'New'} ${cfg.singular}`,
      content: h('form', { novalidate: true, style: 'display:grid;gap:14px', onsubmit: async (e) => {
        e.preventDefault();
        const body = {};
        for (const [f, c] of controls) {
          let v = c.value;
          if (f.type === 'password') { if (!v) continue; }
          else if (f.type === 'switch') v = !!v;
          else if (f.number) v = v === '' ? null : Number(v);
          else v = typeof v === 'string' ? (v.trim() || null) : v;
          body[f.name] = v;
        }
        await withBusy(save, error, async () => {
          if (editing) await put(`${cfg.path}/${row.id}`, body); else await post(cfg.path, body);
          m.close();
          toast(`${cap(cfg.singular)} ${editing ? 'updated' : 'added'}`);
          await changed();
        });
      } },
        h('div', { class: 'form-grid' }, controls.map(([f, c]) => h('div', { class: f.wide === false ? '' : 'full' }, c.el))),
        error,
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => m.close() }, 'Cancel'), save)),
    });
  }

  root.replaceChildren(
    h('div', { class: 'page-head' },
      h('div', {}, h('h1', {}, cfg.title), cfg.subtitle ? h('p', {}, cfg.subtitle) : null),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null) }, icon('plus', 18), `Add ${cfg.singular}`)),
    h('div', { class: 'toolbar' }, h('div', { class: 'grow' }, search)),
    h('div', { class: 'glass table-wrap' },
      h('table', {}, h('thead', {}, h('tr', {}, [...cfg.columns.map((c) => c.label), ''].map((l) => h('th', { scope: 'col' }, l)))), tbody)));
  await load();
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

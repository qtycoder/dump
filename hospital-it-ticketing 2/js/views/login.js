function renderLogin(root, onSuccess, notice) {
  const username = textField({ label: 'Username', name: 'username', required: true, autocomplete: 'username', placeholder: 'e.g. juan.delacruz' });
  const password = textField({ label: 'Password', name: 'password', type: 'password', required: true, autocomplete: 'current-password' });
  const error = h('p', { class: 'form-error', role: 'alert' }, notice || '');
  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Sign in');

  const form = h('form', {
    class: 'card glass',
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      await withBusy(submit, error, async () => {
        const res = await post('/auth/login', { username: username.value, password: password.value });
        session.set(res.token);
        await onSuccess(res.user);
      });
    },
  },
    h('div', { class: 'brand' },
      h('span', { class: 'brand-mark' }, icon('pulse', 22)),
      h('span', {}, 'Hospital IT Help Desk', h('small', {}, 'Sign in to submit or manage tickets'))),
    username.el, password.el, error, submit,
    h('p', { class: 'alt-link' }, 'New here? ', h('a', { href: '#/signup' }, 'Create an account')),
    h('p', { class: 'alt-link' }, h('a', { href: '#/' }, '← Back to home')));

  root.replaceChildren(h('main', { class: 'login' }, form));
  document.title = 'Sign in · Hospital IT Help Desk';
  username.input.focus();
}

async function renderSignup(root, onSuccess) {
  let departments = [];
  try { departments = (await get('/public/info')).departments; } catch { /* shown below */ }

  const fullName = textField({ label: 'Full name', name: 'fullName', required: true, maxlength: 120, autocomplete: 'name' });
  const dept = selectField({ label: 'Department', name: 'departmentId', required: true,
    options: [['', 'Select your department…'], ...departments.map((d) => [d.id, d.name])] });
  const username = textField({ label: 'Username', name: 'username', required: true, maxlength: 32, autocomplete: 'username',
    hint: '3–32 letters, numbers, dot, dash or underscore.' });
  const contact = textField({ label: 'Local no. / email (optional)', name: 'contact', maxlength: 120, autocomplete: 'off' });
  const password = textField({ label: 'Password', name: 'password', type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 8 characters.' });
  const again = textField({ label: 'Confirm password', name: 'again', type: 'password', required: true, autocomplete: 'new-password' });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Create account');

  const form = h('form', {
    class: 'card glass wide-card',
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      if (password.value !== again.value) { error.textContent = 'The passwords do not match.'; return; }
      await withBusy(submit, error, async () => {
        const res = await post('/auth/signup', {
          fullName: fullName.value, departmentId: dept.value || null, username: username.value,
          contact: contact.value || null, password: password.value,
        });
        session.set(res.token);
        await onSuccess(res.user);
      });
    },
  },
    h('div', { class: 'brand' },
      h('span', { class: 'brand-mark' }, icon('pulse', 22)),
      h('span', {}, 'Create your account', h('small', {}, 'For hospital staff to send IT tickets'))),
    h('div', { class: 'form-grid' },
      h('div', { class: 'full' }, fullName.el), h('div', { class: 'full' }, dept.el),
      username.el, contact.el, password.el, again.el),
    error, submit,
    h('p', { class: 'alt-link' }, 'Already have an account? ', h('a', { href: '#/login' }, 'Sign in')),
    h('p', { class: 'alt-link' }, h('a', { href: '#/' }, '← Back to home')));

  root.replaceChildren(h('main', { class: 'login' }, form));
  document.title = 'Sign up · Hospital IT Help Desk';
  fullName.input.focus();
}

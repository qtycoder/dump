(async () => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  BR.initView();

  try {
    const r = await BR.api('api/setup_admin.php');
    if (r.available) $('f').hidden = false;
    else $('note').textContent = r.reason === 'not_local'
      ? 'Setup only works from the computer that runs the server (open it as http://localhost/...).'
      : 'An admin account already exists. Log in from the home page to open the admin dashboard.';
  } catch (err) { $('note').textContent = err.message; return; }

  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const m = $('m'); m.textContent = '';
    if ($('p').value !== $('c').value) { m.textContent = 'The two passwords do not match.'; return; }
    $('go').disabled = true;
    try {
      await BR.api('api/setup_admin.php', { name: $('n').value.trim(), email: $('e').value.trim(), password: $('p').value });
      location.href = 'admin/index.html';
    } catch (err) { m.textContent = err.message; $('go').disabled = false; }
  });
})();

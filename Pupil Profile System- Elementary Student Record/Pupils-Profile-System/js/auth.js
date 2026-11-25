/* Simple client-side login (demo only — not real security). */
const Auth = {
  USER: 'admin', PASS: 'admin123', KEY: 'sps_session',
  login(u, p) { if (u === this.USER && p === this.PASS) { sessionStorage.setItem(this.KEY, '1'); return true; } return false; },
  isIn() { return sessionStorage.getItem(this.KEY) === '1'; },
  require() { if (!this.isIn()) location.replace('index.html'); },
  logout() { sessionStorage.removeItem(this.KEY); goTo('index.html'); }
};
if (document.body.dataset.page === 'login') {
  if (Auth.isIn()) location.replace('dashboard.html');
  const pass = $('#pass'), err = $('#loginErr'), form = $('#loginForm');
  $('#eye').onclick = () => { const show = pass.type === 'password'; pass.type = show ? 'text' : 'password'; $('#eye').textContent = show ? '🙈' : '👁'; };
  form.onsubmit = e => {
    e.preventDefault();
    if (!$('#user').value.trim() || !pass.value) err.textContent = 'Enter your username and password.';
    else if (!Auth.login($('#user').value.trim(), pass.value)) err.textContent = 'Incorrect username or password.';
    else return goTo('dashboard.html');
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
  };
} else Auth.require();

// Thin layer between the screens and the browser "backend" (db.js).
// The sign-in token lives in sessionStorage, so it is forgotten when the tab is closed.

const SESSION_KEY = 'hts_token';

const session = {
  get token() {
    try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
  },
  set(t) {
    try { sessionStorage.setItem(SESSION_KEY, t); } catch { /* ignore */ }
  },
  clear() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  },
};

async function api(method, path, body) {
  try {
    const res = await Backend.handle(method, path, body === undefined ? {} : body, session.token);
    return res.body ?? null;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401 && !path.startsWith('/auth/login')) {
        session.clear();
        window.dispatchEvent(new Event('hts:unauthorized'));
      }
      throw e;
    }
    console.error(e);
    throw new ApiError(500, 'Something went wrong');
  }
}

const get = (p) => api('GET', p);
const post = (p, b) => api('POST', p, b ?? {});
const put = (p, b) => api('PUT', p, b);
const del = (p) => api('DELETE', p);

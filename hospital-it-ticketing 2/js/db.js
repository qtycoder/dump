/* db.js - the whole "backend" lives here, in the browser.
 *
 * It answers the same requests the old Java API did (users, departments, concerns,
 * issues, tickets, stats, login) and keeps the records in the browser's localStorage.
 * The rest of the app talks to it through api.js, so no server is needed.
 *
 * Data is stored per browser on this PC. Use "Download backup" in the account menu.
 */

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const Backend = (() => {
  'use strict';

  const KEY = 'hts_db_v1';
  const TZ = 'Asia/Manila';
  const ROLES = ['ADMIN', 'IT_STAFF', 'REQUESTER'];
  const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const SESSION_MS = 12 * 60 * 60 * 1000;
  const MAX_FAILS = 5;
  const FAIL_WINDOW_MS = 5 * 60 * 1000;

  const bad = (m) => new ApiError(400, m);
  const unauthorized = () => new ApiError(401, 'Please sign in');
  const forbidden = () => new ApiError(403, 'You do not have permission to do that');
  const notFound = () => new ApiError(404, 'Not found');
  const conflict = (m) => new ApiError(409, m);
  const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
  const sameId = (a, id) => typeof a === 'number' && a === id;
  const iso = () => new Date().toISOString();
  const eq = (a, b) => (a ?? null) === (b ?? null);

  // =================================================================== storage
  let db = null;

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch { /* storage blocked */ }
    db = null;
    if (raw) {
      try {
        db = JSON.parse(raw);
      } catch {
        try { localStorage.setItem(KEY + '_damaged', raw); } catch { /* ignore */ }
      }
    }
    if (!db || typeof db !== 'object') db = {};
    db.collections = db.collections || {};
    db.sequences = db.sequences || {};
    db.sessions = db.sessions || {};
    db.fails = db.fails || {};
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      throw new ApiError(500, 'Cannot save data: browser storage is blocked or full.');
    }
  }

  const col = (c) => (db.collections[c] = db.collections[c] || []);
  const all = (c) => clone(col(c));
  const find = (c, id) => clone(col(c).find((m) => m.id === id) || null);

  function insert(c, doc) {
    const id = (db.sequences['id:' + c] = (db.sequences['id:' + c] || 0) + 1);
    const m = { id };
    for (const [k, v] of Object.entries(doc)) if (k !== 'id') m[k] = clone(v);
    col(c).push(m);
    save();
    return clone(m);
  }

  function replace(c, id, doc) {
    const list = col(c);
    const i = list.findIndex((m) => m.id === id);
    if (i < 0) return null;
    const m = { id };
    for (const [k, v] of Object.entries(doc)) if (k !== 'id') m[k] = clone(v);
    list[i] = m;
    save();
    return clone(m);
  }

  function remove(c, id) {
    const list = col(c);
    const i = list.findIndex((m) => m.id === id);
    if (i < 0) return false;
    list.splice(i, 1);
    save();
    return true;
  }

  function nextSeq(name) {
    db.sequences[name] = (db.sequences[name] || 0) + 1;
    save();
    return db.sequences[name];
  }

  // =================================================================== passwords
  const enc = new TextEncoder();
  const b64 = (u8) => btoa(String.fromCharCode(...u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');

  async function pbkdf2(password, salt) {
    if (!(window.crypto && crypto.subtle)) {
      throw new ApiError(500, 'This browser blocks secure password hashing. Open the app from the file itself or from http://localhost.');
    }
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
    return new Uint8Array(bits);
  }

  async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return b64(salt) + ':' + b64(await pbkdf2(password, salt));
  }

  async function verifyPassword(password, stored) {
    try {
      const [s, h] = stored.split(':');
      const got = await pbkdf2(password, unb64(s));
      const want = unb64(h);
      if (got.length !== want.length) return false;
      let diff = 0;
      for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
      return diff === 0;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      return false;
    }
  }

  let dummyHash = null; // so a wrong username takes as long as a wrong password

  // =================================================================== sessions
  function purgeSessions() {
    const now = Date.now();
    for (const [t, s] of Object.entries(db.sessions)) if (s.expires < now) delete db.sessions[t];
  }

  function newSession(userId) {
    purgeSessions();
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    db.sessions[token] = { userId, expires: Date.now() + SESSION_MS };
    save();
    return token;
  }

  function authenticate(token) {
    if (!token) return null;
    const s = db.sessions[token];
    if (!s) return null;
    const user = s.expires < Date.now() ? null : find('users', s.userId);
    if (!user || user.active !== true) {
      delete db.sessions[token];
      save();
      return null;
    }
    return user;
  }

  function revokeUser(userId, exceptToken) {
    for (const [t, s] of Object.entries(db.sessions)) {
      if (s.userId === userId && t !== exceptToken) delete db.sessions[t];
    }
  }

  function checkThrottle(username) {
    const f = db.fails[username];
    if (!f) return;
    if (Date.now() - f[1] > FAIL_WINDOW_MS) { delete db.fails[username]; return; }
    if (f[0] >= MAX_FAILS) throw new ApiError(429, 'Too many failed attempts. Try again in a few minutes.');
  }

  function recordFailure(username) {
    const f = db.fails[username];
    const now = Date.now();
    db.fails[username] = !f || now - f[1] > FAIL_WINDOW_MS ? [1, now] : [f[0] + 1, f[1]];
    save();
  }

  // =================================================================== request
  class Req {
    constructor(method, seg, query, body, user, token) {
      Object.assign(this, { method, seg, query, body, user, token });
    }
    isAdmin() { return !!this.user && this.user.role === 'ADMIN'; }
    isStaff() { return !!this.user && (this.user.role === 'ADMIN' || this.user.role === 'IT_STAFF'); }
    get userId() { return this.user.id; }
  }

  const publicUser = (u) => {
    const out = { ...u };
    delete out.passwordHash;
    return out;
  };

  // =================================================================== generic CRUD
  class Crud {
    /** fields: {name: 'str'|'text'|'long'|'bool'} */
    constructor(coll, fields, required, refs = {}, dependents = []) {
      this.coll = coll;
      this.fields = fields;
      this.required = required;
      this.refs = refs;
      this.dependents = dependents; // [collection, field, label]
      this.uniqueField = null;
      this.uniqueScope = null;
      this.extraFilters = []; // extra query fields allowed in list filters, e.g. ?createdBy=3
    }

    unique(field, scope = null) {
      this.uniqueField = field;
      this.uniqueScope = scope;
      return this;
    }

    // permissions (override)
    canRead(r) { return true; }
    canReadDoc(r, d) { return this.canRead(r); }
    canCreate(r) { return r.isAdmin(); }
    canUpdate(r, d) { return r.isAdmin(); }
    canDelete(r, d) { return r.isAdmin(); }
    // hooks (override)
    view(d) { return d; }
    sortList(l) { /* default order */ }
    async prepareCreate(r, doc) { /* none */ }
    async beforeUpdate(r, existing, merged) { /* none */ }
    async beforeDelete(r, existing) { /* none */ }

    list(r) {
      if (!this.canRead(r)) throw forbidden();
      const out = all(this.coll).filter((d) => this.canReadDoc(r, d) && this.matches(r, d));
      this.sortList(out);
      return { status: 200, body: out.map((d) => this.view(d)) };
    }

    get(r, id) {
      const d = find(this.coll, id);
      if (!d) throw notFound();
      if (!this.canReadDoc(r, d)) throw forbidden();
      return { status: 200, body: this.view(d) };
    }

    async create(r) {
      if (!this.canCreate(r)) throw forbidden();
      const doc = await this.sanitize(r, r.body, true);
      this.validate(r, doc, true);
      doc.createdAt = doc.updatedAt = iso();
      await this.prepareCreate(r, doc);
      return { status: 201, body: this.view(insert(this.coll, doc)) };
    }

    async update(r, id) {
      const existing = find(this.coll, id);
      if (!existing) throw notFound();
      if (!this.canUpdate(r, existing)) throw forbidden();
      const merged = { ...existing, ...(await this.sanitize(r, r.body, false)) };
      this.validate(r, merged, false);
      await this.beforeUpdate(r, existing, merged);
      merged.updatedAt = iso();
      return { status: 200, body: this.view(replace(this.coll, id, merged)) };
    }

    async remove(r, id) {
      const existing = find(this.coll, id);
      if (!existing) throw notFound();
      if (!this.canDelete(r, existing)) throw forbidden();
      for (const [coll, field, label] of this.dependents) {
        const n = col(coll).filter((o) => sameId(o[field], id)).length;
        if (n > 0) throw conflict(`Cannot delete: ${n} ${label} still use this. Reassign or deactivate instead.`);
      }
      await this.beforeDelete(r, existing);
      remove(this.coll, id);
      return { status: 204, body: null };
    }

    matches(r, d) {
      for (const [k, v] of Object.entries(r.query)) {
        if (k === 'q') {
          if (!v.trim()) continue;
          const needle = v.toLowerCase();
          if (!Object.values(d).some((x) => typeof x === 'string' && x.toLowerCase().includes(needle))) return false;
        } else if ((k in this.fields || this.extraFilters.includes(k)) && v !== '') {
          if (String(d[k]) !== v) return false;
        }
      }
      return true;
    }

    /** Keep only known fields from the request and check their types. */
    async sanitize(r, body, creating) {
      const out = {};
      for (const [name, type] of Object.entries(this.fields)) {
        if (Object.prototype.hasOwnProperty.call(body, name)) out[name] = this.coerce(name, type, body[name]);
      }
      return out;
    }

    label(field) {
      let s = field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
      if (s.endsWith(' id')) s = s.slice(0, -3);
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    coerce(name, type, v) {
      if (v === null || v === undefined) return null;
      if (type === 'str' || type === 'text') {
        if (typeof v !== 'string') throw bad(this.label(name) + ' must be text');
        const s = v.trim();
        const max = type === 'str' ? 300 : 4000;
        if (s.length > max) throw bad(`${this.label(name)} is too long (max ${max} characters)`);
        return s === '' ? null : s;
      }
      if (type === 'long') {
        if (typeof v === 'number' && Number.isInteger(v)) return v;
        if (typeof v === 'string' && v.trim() === '') return null;
        if (typeof v === 'string' && /^\d{1,15}$/.test(v)) return Number(v);
        throw bad(this.label(name) + ' must be a number');
      }
      if (type === 'bool') {
        if (typeof v === 'boolean') return v;
        throw bad(this.label(name) + ' must be true or false');
      }
      throw new Error('unknown type ' + type);
    }

    /** Called with the full record on both create and update. */
    validate(r, doc, creating) {
      for (const f of this.required) {
        if (doc[f] == null) throw bad(this.label(f) + ' is required');
      }
      for (const [field, coll] of Object.entries(this.refs)) {
        if (doc[field] != null && !find(coll, doc[field])) throw bad(this.label(field) + ' does not exist');
      }
      if (this.uniqueField && typeof doc[this.uniqueField] === 'string') {
        const val = doc[this.uniqueField].toLowerCase();
        for (const o of col(this.coll)) {
          if (doc.id != null && o.id === doc.id) continue;
          if (this.uniqueScope && !eq(o[this.uniqueScope], doc[this.uniqueScope])) continue;
          if (typeof o[this.uniqueField] === 'string' && o[this.uniqueField].toLowerCase() === val) {
            throw conflict(`${this.label(this.uniqueField)} "${doc[this.uniqueField]}" already exists`);
          }
        }
      }
    }
  }

  // =================================================================== users
  class Users extends Crud {
    constructor() {
      super('users',
        { username: 'str', fullName: 'str', role: 'str', departmentId: 'long', active: 'bool', contact: 'str' },
        ['username', 'fullName', 'role'],
        { departmentId: 'departments' },
        [['tickets', 'createdBy', 'ticket(s) were created by this user'],
         ['tickets', 'assignedTo', 'ticket(s) are assigned to this user']]);
      this.unique('username');
    }

    /** Adds ticket counts so the admin can see who has which concerns. */
    view(d) {
      const u = publicUser(d);
      const mine = col('tickets').filter((t) => t.createdBy === d.id);
      u.ticketCount = mine.length;
      u.openCount = mine.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
      u.lastTicketAt = mine.reduce((latest, t) => (!latest || t.createdAt > latest ? t.createdAt : latest), null);
      return u;
    }
    canRead(r) { return r.isStaff(); }
    canReadDoc(r, d) { return r.isStaff() || sameId(d.id, r.userId); }

    async sanitize(r, body, creating) {
      const out = await super.sanitize(r, body, creating);
      if (typeof out.username === 'string') out.username = out.username.toLowerCase();
      if (out.active === null) delete out.active;
      if (typeof body.password === 'string' && body.password) {
        if (body.password.length < 8 || body.password.length > 128) throw bad('Password must be 8 to 128 characters');
        out.passwordHash = await hashPassword(body.password);
        out.mustChangePassword = true;
      } else if (creating) {
        throw bad('Password is required');
      }
      if (creating && out.active === undefined) out.active = true;
      return out;
    }

    validate(r, doc, creating) {
      super.validate(r, doc, creating);
      if (!ROLES.includes(doc.role)) throw bad('Role must be ADMIN, IT_STAFF or REQUESTER');
      if (!/^[a-z0-9._-]{3,32}$/.test(doc.username)) {
        throw bad('Username must be 3-32 characters: letters, numbers, dot, dash or underscore');
      }
    }

    activeAdmins() {
      return col('users').filter((u) => u.role === 'ADMIN' && u.active === true).length;
    }

    async beforeUpdate(r, existing, merged) {
      const wasAdmin = existing.role === 'ADMIN' && existing.active === true;
      const isAdmin = merged.role === 'ADMIN' && merged.active === true;
      if (wasAdmin && !isAdmin && this.activeAdmins() <= 1) throw conflict('There must be at least one active administrator');
      if (merged.passwordHash !== existing.passwordHash || !isAdmin && wasAdmin || merged.active === false) {
        revokeUser(existing.id, existing.id === r.userId ? r.token : null);
      }
    }

    async beforeDelete(r, existing) {
      if (existing.id === r.userId) throw conflict('You cannot delete your own account');
      if (existing.role === 'ADMIN' && existing.active === true && this.activeAdmins() <= 1) {
        throw conflict('There must be at least one active administrator');
      }
      revokeUser(existing.id, null);
    }
  }

  // =================================================================== tickets
  function manilaDay(date) {
    return date.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
  }

  class Tickets extends Crud {
    constructor() {
      super('tickets',
        { departmentId: 'long', categoryId: 'long', issueId: 'long', othersText: 'str', description: 'text',
          priority: 'str', status: 'str', assignedTo: 'long', resolution: 'text', requesterName: 'str' },
        ['departmentId', 'categoryId', 'description'],
        { departmentId: 'departments', categoryId: 'categories', issueId: 'issues', assignedTo: 'users' },
        []);
      this.extraFilters = ['createdBy'];
    }

    canCreate(r) { return !!r.user; }
    canUpdate(r, d) { return r.isStaff(); }
    canReadDoc(r, d) { return r.isStaff() || sameId(d.createdBy, r.userId); }
    sortList(l) { l.sort((a, b) => b.id - a.id); }

    nameOf(coll, id, field) {
      if (typeof id !== 'number') return null;
      const m = find(coll, id);
      return m ? m[field] : null;
    }

    view(d) {
      return {
        ...d,
        departmentName: this.nameOf('departments', d.departmentId, 'name'),
        categoryName: this.nameOf('categories', d.categoryId, 'name'),
        issueName: this.nameOf('issues', d.issueId, 'name'),
        assignedToName: this.nameOf('users', d.assignedTo, 'fullName'),
        createdByName: this.nameOf('users', d.createdBy, 'fullName'),
      };
    }

    async sanitize(r, body, creating) {
      const out = await super.sanitize(r, body, creating);
      if (!r.isStaff()) { // requesters may describe the problem, not run the ticket
        delete out.status;
        delete out.assignedTo;
        delete out.resolution;
      } else if (Object.prototype.hasOwnProperty.call(body, 'report')) {
        out.report = this.cleanReport(body.report);
      }
      return out;
    }

    /** Service report: date, subject, works to be done, actions taken (with model), remarks. */
    cleanReport(v) {
      if (v === null) return null;
      if (typeof v !== 'object' || Array.isArray(v)) throw bad('The service report is not valid');
      const str = (x, max, name) => {
        if (x == null || x === '') return null;
        if (typeof x !== 'string') throw bad(`${name} must be text`);
        const t = x.trim();
        if (t.length > max) throw bad(`${name} is too long (max ${max} characters)`);
        return t || null;
      };
      const list = (x, name) => {
        if (x == null) return [];
        if (!Array.isArray(x) || x.length > 20) throw bad(`${name} must be a list of up to 20 lines`);
        return x;
      };
      const date = str(v.serviceDate, 10, 'Service date');
      if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) throw bad('Service date is not valid');
      return {
        serviceDate: date,
        subject: str(v.subject, 300, 'Subject to diagnose'),
        works: list(v.works, 'Works to be done').map((w) => str(w, 300, 'Work')).filter(Boolean),
        actions: list(v.actions, 'Actions taken').map((a) => {
          if (!a || typeof a !== 'object') throw bad('Each action taken must have text and an optional model');
          return { text: str(a.text, 300, 'Action taken'), model: str(a.model, 300, 'Model') };
        }).filter((a) => a.text || a.model),
        remarks: str(v.remarks, 2000, 'Remarks'),
        caps: v.caps !== false,
      };
    }

    validate(r, doc, creating) {
      super.validate(r, doc, creating);
      if (doc.priority != null && !PRIORITIES.includes(doc.priority)) throw bad('Priority must be LOW, NORMAL, HIGH or URGENT');
      if (doc.status != null && !STATUSES.includes(doc.status)) throw bad('Status must be OPEN, IN_PROGRESS, RESOLVED or CLOSED');

      const category = find('categories', doc.categoryId);
      if (doc.issueId != null) {
        const issue = find('issues', doc.issueId);
        if (issue && issue.categoryId !== doc.categoryId) throw bad('That issue does not belong to the selected concern');
      }
      if (category && String(category.name).toLowerCase() === 'others' && doc.othersText == null) {
        throw bad('Please describe the concern for "Others"');
      }
      if (doc.assignedTo != null) {
        const u = find('users', doc.assignedTo);
        if (u && u.role !== 'ADMIN' && u.role !== 'IT_STAFF') throw bad('Tickets can only be assigned to IT staff or admins');
      }
      if ((doc.status === 'RESOLVED' || doc.status === 'CLOSED') && doc.resolution == null) {
        throw bad('Please record what was done (troubleshoot result) before resolving a ticket');
      }
    }

    entry(r, text) {
      return { at: iso(), by: r.userId, byName: r.user.fullName, text };
    }

    async prepareCreate(r, doc) {
      const year = manilaDay(new Date()).slice(0, 4);
      const n = nextSeq('ticketNo:' + year);
      doc.ticketNo = `HT-${year}-${String(n).padStart(4, '0')}`;
      doc.status = 'OPEN';
      if (doc.priority == null) doc.priority = 'NORMAL';
      if (doc.requesterName == null) doc.requesterName = r.user.fullName;
      doc.createdBy = r.userId;
      doc.resolvedAt = null;
      doc.history = [this.entry(r, 'Ticket created')];
    }

    async beforeUpdate(r, existing, merged) {
      const history = Array.isArray(merged.history) ? merged.history : [];
      merged.history = history;

      const assignedNow = !eq(existing.assignedTo, merged.assignedTo);
      // assigning an open ticket starts the work
      if (assignedNow && merged.status === 'OPEN' && existing.status === merged.status && merged.assignedTo != null) {
        merged.status = 'IN_PROGRESS';
      }
      if (assignedNow) {
        const name = this.nameOf('users', merged.assignedTo, 'fullName');
        history.push(this.entry(r, name ? 'Assigned to ' + name : 'Unassigned'));
      }
      if (existing.status !== merged.status) history.push(this.entry(r, 'Status changed to ' + String(merged.status).replace('_', ' ')));
      if (existing.priority !== merged.priority) history.push(this.entry(r, 'Priority set to ' + merged.priority));
      if (!eq(existing.resolution, merged.resolution) && merged.resolution != null) history.push(this.entry(r, 'Resolution notes updated'));
      if (JSON.stringify(existing.report ?? null) !== JSON.stringify(merged.report ?? null)) history.push(this.entry(r, 'Service report updated'));

      const done = merged.status === 'RESOLVED' || merged.status === 'CLOSED';
      if (done && !merged.resolvedAt) merged.resolvedAt = iso();
      if (!done) merged.resolvedAt = null;
    }
  }

  // =================================================================== stats
  function computeStats(r) {
    const tickets = all('tickets').filter((t) => r.isStaff() || t.createdBy === r.userId);
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const byPriority = Object.fromEntries(PRIORITIES.map((s) => [s, 0]));
    const byDept = new Map();
    const byCat = new Map();

    const [y, m, d] = manilaDay(new Date()).split('-').map(Number);
    const perDay = new Map();
    for (let i = 6; i >= 0; i--) perDay.set(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10), 0);

    let minutes = 0, resolved = 0, unassigned = 0;
    for (const t of tickets) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byDept.set(t.departmentId, (byDept.get(t.departmentId) || 0) + 1);
      byCat.set(t.categoryId, (byCat.get(t.categoryId) || 0) + 1);
      if (t.assignedTo == null && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')) unassigned++;
      const day = manilaDay(new Date(t.createdAt));
      if (perDay.has(day)) perDay.set(day, perDay.get(day) + 1);
      if (t.resolvedAt) {
        minutes += (new Date(t.resolvedAt) - new Date(t.createdAt)) / 60000;
        resolved++;
      }
    }

    const top = (map, coll, field) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([id, count]) => ({ name: (find(coll, id) || { [field]: '(deleted)' })[field], count }));

    return {
      total: tickets.length,
      byStatus,
      byPriority,
      byDepartment: top(byDept, 'departments', 'name'),
      byCategory: top(byCat, 'categories', 'name'),
      last7Days: [...perDay.entries()].map(([date, count]) => ({ date, count })),
      avgResolutionHours: resolved === 0 ? null : Math.round((minutes / resolved / 60) * 10) / 10,
      unassigned,
    };
  }

  // =================================================================== first-run data
  const DEPARTMENTS = [
    'IT Department', 'Pharmacy', 'Billing/Cashier', 'OPD', 'Social Worker', "Doctor's Office",
    'Emergency Room', 'Operating Room', 'Dialysis', 'X-ray', 'Ultrasound', 'Laboratory',
    'Nurse Station 1', 'Nurse Station 2', 'Nurse Station 3', 'Chief Nurse Room', 'Medical Record',
    'Business Office', 'HR Office', 'PhilHealth', 'Central Supply Office', 'Dietary/Canteen',
  ];
  // concern, then its issues
  const CONCERNS = [
    ['PC', 'Hardware Problem', 'Software Problem'],
    ['Printer', 'End of Service Printer', 'No Printing Color', 'Paper Jam', 'Head Cleaning'],
    ['Internet Connection', 'Wi-Fi', 'Internet Cable', 'Password'],
    ['Documents', 'Forms'],
    ['Review CCTV'],
    ['EMR Hospital System', 'Bizbox Hospital Information System', 'Bizbox Material Management System',
      'Bizbox PhilHealth Information System', 'Bizbox Konsulta Information System'],
    ['Others'],
  ];

  async function ensureSeed() {
    const now = iso();
    if (col('departments').length === 0) {
      for (const name of DEPARTMENTS) insert('departments', { name, createdAt: now, updatedAt: now });
    }
    if (col('categories').length === 0) {
      for (const [name, ...issues] of CONCERNS) {
        const cat = insert('categories', { name, createdAt: now, updatedAt: now });
        for (const iname of issues) insert('issues', { categoryId: cat.id, name: iname, createdAt: now, updatedAt: now });
      }
    }
    if (col('users').length === 0) {
      const it = col('departments')[0];
      insert('users', {
        username: 'admin', fullName: 'System Administrator', role: 'ADMIN', departmentId: it.id,
        active: true, contact: null, passwordHash: await hashPassword('admin123'), mustChangePassword: true,
        createdAt: now, updatedAt: now,
      });
    }
  }

  // =================================================================== routing
  const cruds = {
    users: new Users(),
    departments: new Crud('departments', { name: 'str', description: 'str' }, ['name'], {},
      [['users', 'departmentId', 'user(s)'], ['tickets', 'departmentId', 'ticket(s)']]).unique('name'),
    categories: new Crud('categories', { name: 'str', description: 'str' }, ['name'], {},
      [['issues', 'categoryId', 'issue(s)'], ['tickets', 'categoryId', 'ticket(s)']]).unique('name'),
    issues: new Crud('issues', { categoryId: 'long', name: 'str' }, ['categoryId', 'name'],
      { categoryId: 'categories' }, [['tickets', 'issueId', 'ticket(s)']]).unique('name', 'categoryId'),
    tickets: new Tickets(),
  };

  async function auth(r) {
    const action = r.seg[1] || '';
    const method = (m) => { if (r.method !== m) throw new ApiError(405, 'Method not allowed'); };

    if (action === 'login') {
      method('POST');
      const username = typeof r.body.username === 'string' ? r.body.username.trim().toLowerCase() : '';
      const password = typeof r.body.password === 'string' ? r.body.password : '';
      if (!username || !password) throw bad('Enter your username and password');
      checkThrottle(username);
      const found = col('users').find((u) => u.username === username);
      if (!found && !dummyHash) dummyHash = await hashPassword('dummy-password-for-timing');
      const ok = await verifyPassword(password, found ? found.passwordHash : dummyHash);
      if (!found || !ok || found.active !== true) {
        recordFailure(username);
        throw new ApiError(401, 'Invalid username or password');
      }
      delete db.fails[username];
      const token = newSession(found.id);
      return { status: 200, body: { token, expiresAt: new Date(Date.now() + SESSION_MS).toISOString(), user: publicUser(clone(found)) } };
    }
    if (action === 'signup') {
      // Employees create their own account. It is always a REQUESTER, never an admin.
      method('POST');
      const b = r.body;
      const body = {
        username: b.username, fullName: b.fullName, contact: b.contact, departmentId: b.departmentId,
        password: b.password, role: 'REQUESTER', active: true,
      };
      const anon = new Req('POST', [], {}, body, null, null);
      const doc = await cruds.users.sanitize(anon, body, true);
      if (doc.departmentId == null) throw bad('Please choose your department');
      cruds.users.validate(anon, doc, true);
      doc.mustChangePassword = false; // they just chose it themselves
      doc.selfRegistered = true;
      doc.createdAt = doc.updatedAt = iso();
      const user = insert('users', doc);
      const token = newSession(user.id);
      return { status: 201, body: { token, expiresAt: new Date(Date.now() + SESSION_MS).toISOString(), user: publicUser(user) } };
    }
    if (action === 'me') {
      if (!r.user) throw unauthorized();
      return { status: 200, body: publicUser(r.user) };
    }
    if (action === 'logout') {
      if (r.token) { delete db.sessions[r.token]; save(); }
      return { status: 204, body: null };
    }
    if (action === 'change-password') {
      if (!r.user) throw unauthorized();
      method('POST');
      const current = typeof r.body.currentPassword === 'string' ? r.body.currentPassword : '';
      const next = typeof r.body.newPassword === 'string' ? r.body.newPassword : '';
      if (!(await verifyPassword(current, r.user.passwordHash))) throw bad('Current password is incorrect');
      if (next.length < 8 || next.length > 128) throw bad('New password must be 8 to 128 characters');
      if (next === current) throw bad('Choose a password different from the current one');
      const updated = { ...r.user, passwordHash: await hashPassword(next), mustChangePassword: false, updatedAt: iso() };
      replace('users', r.userId, updated);
      revokeUser(r.userId, r.token);
      save();
      return { status: 200, body: publicUser(updated) };
    }
    throw notFound();
  }

  async function route(r) {
    const s = r.seg;
    if (s.length === 0) throw notFound();
    if (s[0] === 'health' && s.length === 1) return { status: 200, body: { status: 'ok' } };
    if (s[0] === 'auth') return auth(r);
    if (s[0] === 'public' && s[1] === 'info' && s.length === 2) {
      // visible before sign-in: used by the homepage and the sign-up form
      const issues = all('issues');
      return {
        status: 200,
        body: {
          departments: all('departments').map((d) => ({ id: d.id, name: d.name })),
          categories: all('categories').map((c) => ({
            id: c.id, name: c.name, issues: issues.filter((i) => i.categoryId === c.id).map((i) => i.name),
          })),
        },
      };
    }
    if (!r.user) throw unauthorized();

    if (s[0] === 'stats' && s.length === 1) {
      if (r.method !== 'GET') throw new ApiError(405, 'Method not allowed');
      return { status: 200, body: computeStats(r) };
    }

    const crud = cruds[s[0]];
    if (!crud) throw notFound();
    if (s.length === 1) {
      if (r.method === 'GET') return crud.list(r);
      if (r.method === 'POST') return crud.create(r);
      throw new ApiError(405, 'Method not allowed');
    }
    if (s.length === 2) {
      if (!/^\d+$/.test(s[1])) throw notFound();
      const id = Number(s[1]);
      if (r.method === 'GET') return crud.get(r, id);
      if (r.method === 'PUT' || r.method === 'PATCH') return crud.update(r, id);
      if (r.method === 'DELETE') return crud.remove(r, id);
      throw new ApiError(405, 'Method not allowed');
    }
    throw notFound();
  }

  async function run(method, path, body, token) {
    load();
    await ensureSeed();
    const [p, qs] = path.split('?');
    const seg = p.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    const user = authenticate(token);
    return route(new Req(method.toUpperCase(), seg, query, body && typeof body === 'object' ? clone(body) : {}, user, token));
  }

  // =================================================================== backup / restore
  const BACKUP_COLLECTIONS = ['users', 'departments', 'categories', 'issues', 'tickets'];

  async function runBackup(token) {
    load();
    await ensureSeed();
    const u = authenticate(token);
    if (!u) throw unauthorized();
    if (u.role !== 'ADMIN') throw forbidden();
    return JSON.stringify({
      app: 'hospital-it-ticketing', version: 1, exportedAt: iso(),
      collections: db.collections, sequences: db.sequences,
    }, null, 1);
  }

  async function runRestore(token, text) {
    load();
    const u = authenticate(token);
    if (!u) throw unauthorized();
    if (u.role !== 'ADMIN') throw forbidden();
    let data;
    try { data = JSON.parse(text); } catch { throw bad('That file is not a valid backup (not JSON).'); }
    if (!data || data.app !== 'hospital-it-ticketing' || typeof data.collections !== 'object' || !data.collections) {
      throw bad('That file is not a Hospital IT Help Desk backup.');
    }
    for (const c of BACKUP_COLLECTIONS) {
      if (!Array.isArray(data.collections[c])) throw bad(`The backup is missing "${c}".`);
      for (const rec of data.collections[c]) {
        if (!rec || typeof rec !== 'object' || !Number.isInteger(rec.id)) throw bad(`The backup has a damaged "${c}" record.`);
      }
    }
    if (!data.collections.users.some((x) => x.role === 'ADMIN' && x.active === true && typeof x.passwordHash === 'string')) {
      throw bad('The backup has no active administrator, so nobody could sign in. Restore cancelled.');
    }
    const collections = {};
    for (const c of BACKUP_COLLECTIONS) collections[c] = data.collections[c];
    db.collections = collections;
    db.sequences = data.sequences && typeof data.sequences === 'object' ? data.sequences : {};
    db.sessions = {};
    db.fails = {};
    save();
    return { users: collections.users.length, tickets: collections.tickets.length };
  }

  // One request at a time, so two quick clicks can never overwrite each other.
  let chain = Promise.resolve();
  const queued = (fn) => (...args) => {
    const p = chain.then(() => fn(...args));
    chain = p.catch(() => {});
    return p;
  };

  return {
    handle: queued(run),
    backup: queued(runBackup),
    restore: queued(runRestore),
  };
})();

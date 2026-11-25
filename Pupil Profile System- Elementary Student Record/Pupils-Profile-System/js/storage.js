/* localStorage CRUD — no UI code here. Corrupt data falls back to an empty list. */
const Store = (() => {
  const KEY = 'sps_students', LOG = 'sps_log', ARC = 'sps_archive', TRASH = 'sps_trash';
  const read = k => {
    try { const d = JSON.parse(localStorage.getItem(k) || '[]'); if (!Array.isArray(d)) throw new Error('bad'); return d; }
    catch (err) { console.warn('Corrupt data in', k, '- resetting'); localStorage.setItem(k + '_corrupt', localStorage.getItem(k) || ''); localStorage.setItem(k, '[]'); return []; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v)); // auto-save on every change
  const log = msg => write(LOG, [{ msg, t: new Date().toISOString() }, ...read(LOG)].slice(0, 20));
  return {
    all: () => read(KEY),
    get: lrn => read(KEY).find(s => s.lrn === lrn),
    add(s) { if (this.get(s.lrn)) throw new Error('Duplicate LRN'); write(KEY, [...read(KEY), s]); log('Added ' + fullName(s)); },
    update(oldLrn, s) { write(KEY, read(KEY).map(x => x.lrn === oldLrn ? s : x)); log('Updated ' + fullName(s)); },
    /** Move a student between lists (active -> archive/trash) and stamp the time. */
    _move(from, to, lrn, verb) {
      const s = read(from).find(x => x.lrn === lrn); if (!s) return;
      write(from, read(from).filter(x => x.lrn !== lrn));
      write(to, [{ ...s, _at: new Date().toISOString() }, ...read(to).filter(x => x.lrn !== lrn)]); log(verb + ' ' + fullName(s));
    },
    archive(lrn) { this._move(KEY, ARC, lrn, 'Archived'); },
    trash(lrn) { this._move(KEY, TRASH, lrn, 'Moved to Trash:'); },
    list: kind => read(kind === 'archive' ? ARC : TRASH),
    /** Where does this LRN live? 'active' | 'archive' | 'trash' | null */
    where: lrn => read(KEY).some(x => x.lrn === lrn) ? 'active' : read(ARC).some(x => x.lrn === lrn) ? 'archive' : read(TRASH).some(x => x.lrn === lrn) ? 'trash' : null,
    restore(kind, lrn) {
      const src = kind === 'archive' ? ARC : TRASH, item = read(src).find(x => x.lrn === lrn); if (!item) return;
      if (this.get(lrn)) throw new Error('An active student already has this LRN');
      const { _at, ...s } = item; write(src, read(src).filter(x => x.lrn !== lrn)); write(KEY, [...read(KEY), s]); log('Restored ' + fullName(s));
    },
    purge(lrn) { const s = read(TRASH).find(x => x.lrn === lrn); write(TRASH, read(TRASH).filter(x => x.lrn !== lrn)); if (s) log('Deleted permanently ' + fullName(s)); },
    emptyTrash() { const n = read(TRASH).length; write(TRASH, []); if (n) log('Emptied Trash (' + n + ')'); },
    activity: () => read(LOG),
    exportJSON: () => JSON.stringify(read(KEY), null, 2),
    /** Merge imported records (by LRN). Returns number imported. */
    importJSON(text) {
      const data = JSON.parse(text);
      if (!Array.isArray(data) || data.some(s => !/^\d{12}$/.test(s?.lrn))) throw new Error('Invalid backup file');
      const map = new Map(read(KEY).map(s => [s.lrn, s])); data.forEach(s => map.set(s.lrn, s));
      write(KEY, [...map.values()]); log('Imported ' + data.length + ' students'); return data.length;
    }
  };
})();

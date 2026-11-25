/* Import students from Excel (.xlsx), Word (.docx), HTML-table .xls/.doc (our own exports), CSV, or a JSON backup.
   No libraries: .xlsx/.docx are zip files, unzipped with the browser's built-in DecompressionStream.
   The first table row must be the header; column names are matched flexibly (e.g. "Last Name", "lastname", "Surname"). */
const Importer = (() => {
  const ALIAS = {
    lrn: ['lrn', 'learnerreferencenumber'], last: ['last', 'lastname', 'surname', 'familyname'], first: ['first', 'firstname', 'givenname'],
    middle: ['middle', 'middlename', 'middleinitial'], age: ['age'], birthdate: ['birthdate', 'birthday', 'dob', 'dateofbirth'],
    gender: ['gender', 'sex'], grade: ['grade', 'gradelevel', 'level'], section: ['section'],
    guardian: ['guardian', 'parent', 'parentguardian', 'guardianname', 'parentguardianname', 'parentname'],
    contact: ['contact', 'contactnumber', 'guardiancontact', 'guardiancontactnumber', 'parentcontact', 'parentguardiancontact', 'parentguardiancontactnumber', 'phone', 'mobile'],
    address: ['address'], enrolled: ['enrolled', 'dateenrolled', 'enrollmentdate', 'dateofenrollment']
  };
  const norm = h => String(h).toLowerCase().replace(/[^a-z]/g, '');
  const pad = n => String(n).padStart(2, '0');
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  /** Strip tags + decode XML/HTML entities. */
  const dec = t => t.replace(/<[^>]+>/g, '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
    ENT[e.toLowerCase()] ?? (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : m)).trim();

  /* ---- zip reader (for .xlsx / .docx) ---- */
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf); let e = u8.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('This is not a valid .xlsx/.docx file');
    const files = {}; let p = dv.getUint32(e + 16, true);
    for (let n = dv.getUint16(e + 10, true); n--;) {
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true),
        xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), raw = u8.slice(start, start + size);
      files[name] = async () => new TextDecoder().decode(method === 8
        ? await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer() : raw);
      p += 46 + nl + xl + cl;
    }
    return files;
  }

  /* ---- readers: every one returns rows = array of arrays of strings ---- */
  const colIdx = L => L.split('').reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;
  async function xlsx(files) {
    const sheet = Object.keys(files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
    if (!sheet) throw new Error('No worksheet found in this Excel file');
    const shared = files['xl/sharedStrings.xml'] ? [...(await files['xl/sharedStrings.xml']()).matchAll(/<si>([\s\S]*?)<\/si>/g)]
      .map(m => dec([...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(''))) : [];
    const rows = [];
    for (const r of (await files[sheet]()).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\sr="([A-Z]+)\d+"/.exec(c[1]), type = /\st="(\w+)"/.exec(c[1])?.[1], body = c[2] || '';
        let v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '';
        v = type === 's' ? (shared[+v] ?? '') : type === 'inlineStr' ? dec([...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')) : dec(v);
        row[ref ? colIdx(ref[1]) : row.length] = v;
      }
      rows.push([...row].map(x => x ?? ''));
    }
    return rows;
  }
  async function docx(files) {
    if (!files['word/document.xml']) throw new Error('No document found in this Word file');
    const xml = await files['word/document.xml']();
    return [...xml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)].map(r => [...r[0].matchAll(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g)]
      .map(c => dec([...c[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(t => t[1]).join(''))));
  }
  const html = t => [...t.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(r => [...r[0].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => dec(c[1])));
  function csv(t) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',' || c === '\t') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    row.push(f); rows.push(row); return rows;
  }
  async function readRows(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx') return xlsx(await unzip(await file.arrayBuffer()));
    if (ext === 'docx') return docx(await unzip(await file.arrayBuffer()));
    const text = (await file.text()).replace(/^\ufeff/, '');
    if (ext === 'csv' || ext === 'txt') return csv(text);
    if (/<table/i.test(text)) return html(text);
    throw new Error('Unsupported file. Please save it as .xlsx, .docx or .csv and try again.');
  }

  /* ---- value cleaners ---- */
  function date(v) {
    if (!v) return '';
    if (/^\d{5}(\.\d+)?$/.test(v)) return new Date(Math.round((+v - 25569) * 864e5)).toISOString().slice(0, 10); // Excel serial date
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    let d = new Date(v);
    if (isNaN(d)) { const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(v); if (m) d = new Date(+m[3], +m[2] - 1, +m[1]); }
    return isNaN(d) ? v : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const gender = v => /^m/i.test(v) ? 'Male' : /^f/i.test(v) ? 'Female' : v;
  const grade = v => { const m = /([1-6])/.exec(v); return m ? 'Grade ' + m[1] : v; };
  const phone = v => { v = v.replace(/[\s-]/g, ''); return /^9\d{9}$/.test(v) ? '0' + v : v; };
  function splitName(n) {
    if (n.includes(',')) { const [l, r] = n.split(','); const w = r.trim().split(/\s+/); return { last: l.trim(), first: w.shift() || '', middle: w.join(' ') }; }
    const w = n.split(/\s+/); return { first: w.shift() || '', last: w.length ? w.pop() : '', middle: w.join(' ') };
  }

  /** rows -> {good: [students], bad: ['Row 5: ...']} */
  function toStudents(rows) {
    rows = rows.filter(r => r.some(c => String(c).trim()));
    if (rows.length < 2) throw new Error('No student rows found. Row 1 must be the header.');
    const head = rows[0].map(norm), idx = {};
    for (const [f, al] of Object.entries(ALIAS)) { const i = head.findIndex(h => al.includes(h)); if (i >= 0) idx[f] = i; }
    if (idx.lrn === undefined) throw new Error('No "LRN" column found in the first row.');
    const nameCol = head.findIndex(h => ['name', 'fullname', 'studentname', 'learnername'].includes(h));
    const today = new Date().toISOString().slice(0, 10), good = [], bad = [];
    rows.slice(1).forEach((r, n) => {
      const g = f => idx[f] === undefined ? '' : String(r[idx[f]] ?? '').trim();
      const s = { lrn: g('lrn').replace(/\.0+$/, '').replace(/\s/g, ''), first: g('first'), middle: g('middle'), last: g('last'), age: g('age'),
        birthdate: date(g('birthdate')), gender: gender(g('gender')), grade: grade(g('grade')), section: g('section'),
        guardian: g('guardian'), contact: phone(g('contact')), address: g('address'), enrolled: date(g('enrolled')) || today };
      if (nameCol >= 0 && !s.first && !s.last) Object.assign(s, splitName(String(r[nameCol] ?? '').trim()));
      if (!s.age && s.birthdate) s.age = calcAge(s.birthdate);
      s.age = Number(s.age) || s.age;
      const err = validateStudent(s, s.lrn); // same LRN is allowed here: existing students get updated
      Object.keys(err).length ? bad.push(`Row ${n + 2}: ` + Object.entries(err).map(([k, v]) => `${k} (${v})`).join(', ')) : good.push(s);
    });
    return { good, bad };
  }

  /** Import any supported file into the Store. */
  async function run(file) {
    if (/\.json$/i.test(file.name)) return { added: Store.importJSON(await file.text()), updated: 0, bad: [] };
    const parsed = toStudents(await readRows(file)), bad = parsed.bad, good = [];
    parsed.good.forEach(s => ['archive', 'trash'].includes(Store.where(s.lrn)) ? bad.push(`LRN ${s.lrn}: is in ${Store.where(s.lrn)} - restore it from the Dashboard first`) : good.push(s));
    const updated = good.filter(s => Store.get(s.lrn)).length;
    if (good.length) Store.importJSON(JSON.stringify(good));
    return { added: good.length - updated, updated, bad };
  }
  return { run, readRows, toStudents };
})();
if (typeof module !== 'undefined') module.exports = Importer; // for Node tests only

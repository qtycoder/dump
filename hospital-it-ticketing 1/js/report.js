/* report.js - SERVICE REPORT for a ticket.
 *
 *   SERVICE REPORT
 *   DATE/DAY/YEAR / DEPARTMENT / SUBJECT TO DIAGNOSE
 *   Works to be done:  Actions Taken (+ MODEL):  Remarks:
 *
 * IT fills it in on the ticket. It can be printed, or downloaded as a real Word (.docx) file.
 * The .docx is built here in plain JavaScript (no library, no server).
 */

const REPORT_TZ = 'Asia/Manila';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const manilaDate = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: REPORT_TZ }); // YYYY-MM-DD

function reportDefaults(t) {
  const saved = t.report || {};
  return {
    serviceDate: saved.serviceDate || manilaDate(t.resolvedAt || new Date()),
    subject: saved.subject || t.othersText || [t.categoryName, t.issueName].filter(Boolean).join(' - '),
    works: saved.works || [],
    actions: saved.actions || [],
    remarks: saved.remarks != null ? saved.remarks : (t.resolution || ''),
    caps: saved.caps !== false, // the form uses CAPITAL LETTERS unless turned off
  };
}

/** Everything the printed / Word report shows, already formatted. */
function reportModel(t, r) {
  const C = (s) => (r.caps ? String(s ?? '').toUpperCase() : String(s ?? ''));
  const [y, m, d] = (r.serviceDate || manilaDate(new Date())).split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  const dateLine = `${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} / ${day.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}`;
  return {
    ticketNo: t.ticketNo,
    dateLine: C(dateLine),
    department: C(t.departmentName || ''),
    subject: C(r.subject || ''),
    works: (r.works || []).map(C),
    actions: (r.actions || []).map((a) => ({ text: C(a.text || ''), model: C(a.model || '') })),
    remarks: C(r.remarks || ''),
    footer: `Ticket ${t.ticketNo}${t.assignedToName ? ' · Prepared by ' + t.assignedToName : ''}`,
  };
}

const BLANK = '______________________________'; // so a form with missing parts can be finished by hand

// =============================================================== on-screen / print layout
function reportNode(m) {
  const line = (label, value) => h('p', { class: 'line' }, h('b', {}, label + ': '), value || BLANK);
  const items = (rows) => h('ul', {}, rows.map((x) => h('li', {}, x)));
  const remarks = m.remarks ? m.remarks.split(/\r?\n/).filter((x) => x.trim()) : [BLANK, BLANK];

  return h('div', { class: 'sr' },
    h('h1', {}, 'SERVICE REPORT'),
    line('DATE/DAY/YEAR', m.dateLine),
    line('DEPARTMENT', m.department),
    line('SUBJECT TO DIAGNOSE', m.subject),
    h('h2', {}, 'Works to be done:'),
    items(m.works.length ? m.works : [BLANK]),
    h('h2', {}, 'Actions Taken:'),
    h('ul', {}, (m.actions.length ? m.actions : [{ text: '', model: '' }]).map((a) => h('li', {},
      a.text || BLANK, h('div', { class: 'model' }, 'MODEL: ' + (a.model || BLANK))))),
    h('h2', {}, 'Remarks:'),
    h('div', { class: 'remarks' }, remarks.map((x) => h('p', {}, x))),
    h('p', { class: 'foot' }, m.footer));
}

function printReport(m) {
  let area = document.getElementById('print-area');
  if (!area) {
    area = h('div', { id: 'print-area' });
    document.body.append(area);
  }
  area.replaceChildren(reportNode(m));
  document.body.classList.add('printing');
  const done = () => {
    document.body.classList.remove('printing');
    area.replaceChildren();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 60);
}

// =============================================================== Word (.docx)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** A .docx is a zip file. This writes one (stored, no compression). files: [{name, text}] */
function zipFiles(files) {
  const enc = new TextEncoder();
  const now = new Date();
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const parts = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8 names
    lh.setUint16(8, 0, true);      // stored
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: DOCX_MIME });
}

const xmlEsc = (s) => String(s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function docxBlob(m) {
  const run = (text, o = {}) =>
    `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}</w:rPr><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
  const para = (inner, o = {}) =>
    `<w:p><w:pPr>${o.keep ? '<w:keepNext/>' : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 80 : o.after}"/>${o.left != null ? `<w:ind w:left="${o.left}"${o.hanging ? ` w:hanging="${o.hanging}"` : ''}/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${inner}</w:p>`;
  const line = (label, value) => para(run(label + ': ', { b: true }) + run(value || BLANK));
  const heading = (text) => para(run(text, { b: true }), { before: 240, after: 80, keep: true });
  const bullet = (text) => para(run('•') + '<w:r><w:tab/></w:r>' + run(text || BLANK), { left: 720, hanging: 360 });

  const body = [
    para(run('SERVICE REPORT', { b: true, sz: 36 }), { jc: 'center', after: 360 }),
    line('DATE/DAY/YEAR', m.dateLine),
    line('DEPARTMENT', m.department),
    line('SUBJECT TO DIAGNOSE', m.subject),
    heading('Works to be done:'),
    ...(m.works.length ? m.works : ['']).map(bullet),
    heading('Actions Taken:'),
    ...(m.actions.length ? m.actions : [{ text: '', model: '' }]).flatMap((a) => [
      bullet(a.text),
      para(run('MODEL: ' + (a.model || BLANK)), { left: 720 }),
    ]),
    heading('Remarks:'),
    ...(m.remarks ? m.remarks.split(/\r?\n/).filter((x) => x.trim()) : [BLANK, BLANK]).map((x) => para(run(x))),
    para(run(m.footer, { sz: 18, color: '666666' }), { before: 480 }),
  ].join('');

  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipFiles([
    { name: '[Content_Types].xml', text: `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { name: '_rels/.rels', text: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/_rels/document.xml.rels', text: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'word/styles.xml', text: `${head}<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>` },
    { name: 'word/document.xml', text: `${head}<w:document ${W}><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>` },
  ]);
}

function downloadReportDocx(m) {
  const url = URL.createObjectURL(docxBlob(m));
  const a = h('a', { href: url, download: `Service-Report-${m.ticketNo}.docx` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// =============================================================== form + buttons
function reportButtons(getModel) {
  return h('div', { class: 'sr-buttons' },
    h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => printReport(getModel()) }, icon('printer', 16), 'Print report'),
    h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => downloadReportDocx(getModel()) }, icon('doc', 16), 'Download Word (.docx)'));
}

/** The "Service report" part of the ticket form (for IT staff). */
function reportEditor(t) {
  const r = reportDefaults(t);
  const date = textField({ label: 'Date of service', name: 'serviceDate', type: 'date', value: r.serviceDate });
  const subject = textField({ label: 'Subject to diagnose', name: 'subject', value: r.subject || '', maxlength: 300, placeholder: 'e.g. UPS not working' });
  const works = textArea({ label: 'Works to be done', name: 'works', value: (r.works || []).join('\n'), rows: 3,
    placeholder: 'Replacement of UPS', hint: 'One per line.' });
  const remarks = textArea({ label: 'Remarks', name: 'remarks', value: r.remarks || '', rows: 3,
    placeholder: 'The UPS is replaced and working properly.' });
  const caps = checkboxField({ label: 'Print in CAPITAL LETTERS', checked: r.caps, name: 'caps' });

  const rows = h('div', { class: 'sr-rows' });
  const addRow = (a = {}) => {
    const text = h('input', { class: 'field', type: 'text', maxlength: 300, placeholder: 'Installed new UPS', 'aria-label': 'Action taken', value: a.text || '' });
    const model = h('input', { class: 'field', type: 'text', maxlength: 300, placeholder: 'Model, e.g. UPS-650VA', 'aria-label': 'Model', value: a.model || '' });
    const row = h('div', { class: 'sr-row' }, text, model,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove this action', onclick: () => row.remove() }, icon('close', 16)));
    row._get = () => ({ text: text.value, model: model.value });
    rows.append(row);
  };
  (r.actions.length ? r.actions : [{}]).forEach(addRow);

  const payload = () => ({
    serviceDate: date.value || null,
    subject: subject.value,
    works: works.value.split(/\r?\n/),
    actions: [...rows.children].map((row) => row._get()),
    remarks: remarks.value,
    caps: caps.value,
  });
  // what the printout shows right now, even before "Save changes"
  const model = () => {
    const p = payload();
    const clean = {
      serviceDate: p.serviceDate, subject: p.subject.trim(), caps: p.caps, remarks: p.remarks.trim(),
      works: p.works.map((x) => x.trim()).filter(Boolean),
      actions: p.actions.map((a) => ({ text: a.text.trim(), model: a.model.trim() })).filter((a) => a.text || a.model),
    };
    return reportModel(t, clean);
  };

  const el = h('section', { class: 'sr-box' },
    h('h3', {}, 'Service report'),
    h('p', { class: 'sub' }, 'Fill this in when the work is done. Print it or download it as a Word file for the records.'),
    h('div', { class: 'form-grid' },
      date.el, h('div', {}, h('div', { class: 'label' }, 'Department'), h('div', { class: 'sr-dept' }, t.departmentName)),
      h('div', { class: 'full' }, subject.el),
      h('div', { class: 'full' }, works.el),
      h('div', { class: 'full' },
        h('div', { class: 'label' }, 'Actions taken'),
        rows,
        h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: () => addRow() }, icon('plus', 16), 'Add another action')),
      h('div', { class: 'full' }, remarks.el),
      h('div', { class: 'full' }, caps.el)),
    reportButtons(model));
  return { el, payload, model };
}

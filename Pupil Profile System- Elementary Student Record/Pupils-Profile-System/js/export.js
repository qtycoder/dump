/* Export the currently shown (filtered) list as an aligned table: Excel, Word, or PDF.
   No libraries: Excel/Word open HTML tables natively; PDF uses the browser's print-to-PDF. */
const Exporter = (() => {
  const COLS = [['LRN','lrn'],['Last name','last'],['First name','first'],['Middle name','middle'],['Age','age'],['Birthdate','birthdate'],
    ['Gender','gender'],['Grade','grade'],['Section','section'],['Guardian','guardian'],['Contact','contact'],['Address','address'],['Date enrolled','enrolled']];
  const CSS = `table{border-collapse:collapse;width:100%;table-layout:fixed;font:9pt Calibri,Arial,sans-serif}th,td{word-wrap:break-word;text-align:left}tr{page-break-inside:avoid}thead{display:table-header-group}th,td{border:1px solid #444;padding:4px 6px;vertical-align:top}
    th{background:#d9e2f3}td{mso-number-format:"\\@"}h2,p{font-family:Calibri,Arial,sans-serif}@page{size:landscape;margin:12mm}`;
  const W = [9,8,8,7,4,7,6,6,7,11,8,12,7]; // column widths (%), keeps columns aligned
  const day = () => new Date().toISOString().slice(0, 10);

  const table = list => `<h2>Student Masterlist</h2><p>Generated ${day()} · ${list.length} student(s)</p>
    <table><colgroup>${W.map(w => `<col style="width:${w}%">`).join('')}</colgroup><thead><tr>${COLS.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead>
    <tbody>${list.map(s => `<tr>${COLS.map(([, k]) => `<td>${esc(s[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  const wrap = (body, ns = '', head = '') => `<html ${ns}><head><meta charset="utf-8"><title>Student Masterlist</title>${head}<style>${CSS}</style></head><body>${body}</body></html>`;

  function save(name, mime, html) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + html], { type: mime + ';charset=utf-8' }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }
  const ok = list => { if (!list.length) { toast('Nothing to export'); return false; } return true; };

  return {
    excel(list) {
      if (!ok(list)) return;
      const head = '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Students</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
      save(`students-${day()}.xls`, 'application/vnd.ms-excel', wrap(table(list), 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"', head));
      toast('Excel file downloaded');
    },
    word(list) {
      if (!ok(list)) return;
      const head = '<style>@page WordSection1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:36pt}div.WordSection1{page:WordSection1}</style>';
      save(`students-${day()}.doc`, 'application/msword', wrap(`<div class="WordSection1">${table(list)}</div>`, 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"', head));
      toast('Word file downloaded');
    },
    pdf(list) { // opens the print dialog in a hidden frame -> choose "Save as PDF"
      if (!ok(list)) return;
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0';
      document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(wrap(table(list))); f.contentDocument.close();
      setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1500); }, 300);
    }
  };
})();

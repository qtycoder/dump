# Student Profile System

Elementary school student records manager. Pure HTML, CSS and vanilla JavaScript — no backend, no database server. Data is saved in the browser's `localStorage`.

## Gamitin
1. Buksan ang `index.html` sa browser (double-click, o gamit ang Live Server).
2. Mag-login: **admin / admin123** (palitan sa `js/auth.js`; demo login lang ito, hindi tunay na security).
3. **Students** page: Add, Search, Filter (grade/section), View, Edit, Delete.
4. **Export** = download ng JSON backup. **Import** = i-restore (nagme-merge by LRN).
5. May dark mode toggle (🌓) at Print sa student profile.

## Mahalagang paalala
- Ang data ay nasa **browser at device na ginamit** lang. Mag-export ng backup regularly.
- Kapag corrupt ang localStorage, awtomatikong magre-reset sa empty list (naka-save ang kopya sa `sps_students_corrupt`).

## I-deploy sa GitHub Pages
1. Gumawa ng GitHub repository at i-upload ang laman ng `student-profile-system/`.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. Buksan ang `https://<username>.github.io/<repo>/`.

## Structure
`index.html` (login) · `dashboard.html` · `students.html` · `css/` (style, neomorphic, animations) · `js/` (storage, auth, carousel, utils, app)

## Bago sa update
- **Background image:** `images/Classroom.jpg` (login at home, palitan lang ang file para magpalit ng bg). **Logo:** `images/logo.jpg` (naka-circle). May frosted-glass na neomorphic cards para readable.
- **Export sa table:** ⬇ Excel (.xls), ⬇ Word (.doc, landscape), ⬇ PDF. Ine-export ang kasalukuyang *filtered* list (kaya pwedeng per-grade/section).
  - Excel/Word: baka may babala na "format doesn't match extension" — i-click ang *Yes/Open*; normal ito para sa pure-HTML export.
  - PDF: bubukas ang print dialog → piliin ang **Save as PDF**.
- **Backup (JSON)** ay para sa restore/Import, hindi para sa Excel.

## Import (Excel / Word / CSV)
- Pindutin ang **⬆ Import** at pumili ng `.xlsx`, `.docx`, `.csv`, `.xls/.doc` (galing sa Export ng system) o `.json` backup.
- Dapat **header ang unang row** ng table. Kailangan ang LRN column; flexible ang pangalan ng columns (hal. "Last Name", "Surname", "Parent/Guardian Name").
- Kapag existing na ang LRN, ina-update ito. Ang mga invalid na row (hal. 11-digit LRN) ay sini-skip at nililista sa report.
- Mag-test gamit ang `samples/sample-students.xlsx` o `samples/sample-students.docx`.
- Old binary `.xls`/`.doc`: i-save muna bilang `.xlsx`/`.docx`.

## Archive at Trash
- Sa **Students** page: **Archive** = itinatabi ang estudyante (hal. lumipat/graduate), **Delete** = inililipat sa Trash (hindi pa permanente).
- Sa **Dashboard**, gamitin ang toggle icons sa panel: 🕘 Recent activity · 🗂 Archive · 🗑 Trash. Doon may **↩ Restore**, **Delete forever**, at **Empty trash**.
- Hindi kasama ang archived/trashed sa stats, list, at export. Hindi rin pwedeng gumamit ng LRN na nasa Archive/Trash.

# Troubleshooting (Student Profile System)

Una sa lahat: buksan ang **debug.html** (🛠 sa nav, o i-type sa address bar). Pindutin ang **Run health check**, tapos **Auto-fix** kung may nakita. Kung kailangan ng tulong, pindutin ang **📋 Copy report** at ipadala.

| Problema | Gawin |
|---|---|
| Blangko ang page / hindi gumagana ang buttons | I-press ang **F12 → Console** at tingnan ang pulang error. Buksan din ang debug.html → *Error log*. Subukan ang **Ctrl+F5** (hard refresh). |
| Hindi maka-login | Default: `admin` / `admin123` (nasa `js/auth.js`). Kung naka-stuck, sa Console: `sessionStorage.clear()` tapos i-refresh. |
| Nawala ang students | Debug → **Undo last fix**. Kung may JSON backup: Students → **Import**, o Debug → **Restore full backup**. Tingnan din ang Dashboard → 🗂 Archive at 🗑 Trash. |
| "Corrupt data" / kakaiba ang laman | Debug → **Auto-fix** (nase-save ang lumang text sa `sps_students_corrupt`). O i-edit sa **Data editor**. |
| Hindi gumagana ang Import ng Excel/Word | `.xlsx`/`.docx` lang (hindi lumang `.xls`/`.doc`). Dapat header ang unang row at may **LRN** column. Subukan ang Debug → **Self-test**. |
| Hindi nagda-download ang Export | Payagan ang downloads/pop-ups ng browser. Para sa PDF: piliin ang **Save as PDF** sa print dialog. |
| Hindi nakikita ang larawan/logo | Tiyaking nasa `images/` ang `Classroom.jpg` at `logo.jpg`, at buo ang folder structure. |
| Walang laman pagkatapos mag-deploy sa GitHub Pages | Iba ang browser/device = hiwalay ang data (localStorage). Mag-**Export/Import** ng backup. |
| Gusto mong magsimula ulit | Debug → **Clear ALL data…** (nagda-download muna ng backup). |

## Console commands (F12 → Console)
```js
JSON.parse(localStorage.sps_students)        // tingnan ang active students
Object.keys(localStorage)                    // lahat ng keys na gamit ng system
localStorage.removeItem('sps_errors')        // burahin ang error log
sessionStorage.setItem('sps_session','1')    // lusutan ang login (kung sira ang login page)
```
Mga key: `sps_students`, `sps_archive`, `sps_trash`, `sps_log`, `sps_errors`, `sps_theme`, `sps_backup_before_fix` (snapshot).

## Mga file
`js/storage.js` data · `js/app.js` UI · `js/utils.js` validation · `js/import.js` import · `js/export.js` export · `js/logger.js` error logger · `js/debug.js` + `debug.html` repair tools.

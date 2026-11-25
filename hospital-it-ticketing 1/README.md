# Hospital IT Help Desk (Ticketing)

IT ticketing system for a hospital: staff in any department report a problem (printer, PC,
internet, documents, CCTV review, EMR…), and IT staff track it until it is resolved
("troubleshoot successful").

**Pure HTML + CSS + JavaScript. No Java, no server, no install.**
All records and functions (users, departments, tickets, login, stats) are handled by JavaScript
in the browser and saved in the browser's localStorage.

## Run it

Double-click **`index.html`** (use Chrome or Edge).

- **Homepage** (what visitors see first): intro, an auto-sliding carousel (PC set-up, printers, network hardware,
  CCTV, EMR systems), the services list and how it works.
- **Employees** click **Sign up** (name, department, username, password) and land on their own *Employee portal*:
  quick tiles to report a concern, their ticket counts, and only their own tickets.
- **Admin** signs in and gets the *Admin dashboard*: all tickets, charts, **Employees and their concerns**
  (who reported what), newest sign-ups, and the Users page with a **Concerns** column per user.

First admin sign-in: user **`admin`**, password **`admin123`** – the app asks you to change it.
Sign-ups are always employee accounts (never admin). IT staff accounts are created by the admin in the Users tab.

## Important: where the data lives

Records are saved **inside the browser on that PC** (not on a server).

- Another PC, another browser, or a private/incognito window sees an **empty** help desk.
- Clearing the browser's site data deletes the records.
- So: use **one PC / one browser** for the help desk, and in the account menu (top right, admin) use
  **Download backup** regularly. **Restore backup** loads that file back (also how you move the data to another PC).
- Roles and passwords are enforced by the app, but anyone who can open this browser's developer tools on that
  PC can read the records. Fine for a single office PC; not a replacement for a real server.

If several PCs must share the same tickets, the data has to live on one server (a small Node.js server is
the JavaScript way to do it) – the screens here can stay the same.

## Folder structure

```
hospital-it-ticketing/
├── index.html
├── css/style.css            glass design (from the Figma dashboard sheet)
└── js/
    ├── db.js                the "database": users, departments, concerns, issues, tickets,
    │                        stats, login/passwords, backup & restore  (replaces the old Java API)
    ├── api.js               small bridge: screens call get/post/put/del like a normal API
    ├── ui.js                helpers: buttons, forms, modal, toast, icons
    ├── art.js               carousel illustrations (SVG)
    ├── app.js               layout, menu, routing (public pages vs. employee/admin portal)
    └── views/
        ├── home.js                  public homepage + carousel
        ├── login.js                 sign in + sign up
        ├── dashboard.js             ADMIN / IT dashboard
        ├── employee-dashboard.js    EMPLOYEE dashboard
        └── tickets.js · crud.js · admin.js   tickets, generic table+form, users/departments/concerns
```

Script order in `index.html` matters (db → api → ui → art → views → app).

**Use real photos in the carousel:** make an `img` folder next to `index.html`, put your photos there
(e.g. `img/pc-setup.jpg`) and in `js/views/home.js` set `image: 'img/pc-setup.jpg'` on that slide.
Add or remove slides by editing the `HOME_SLIDES` list. Speed: `SLIDE_INTERVAL_MS`.

## Roles

| Role | Can do |
|---|---|
| **ADMIN** | everything: users, departments, concerns/issues, all tickets (incl. delete), backup/restore |
| **IT_STAFF** | see all tickets, assign, change status, write resolution |
| **REQUESTER** | create tickets and see only their own |

Ticket status: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`. Resolving requires resolution notes.
Priorities: `LOW, NORMAL, HIGH, URGENT`. Ticket numbers look like `HT-2026-0001`.

## Calling the database from JS

Everything goes through `Backend.handle(method, path, body, token)` (see `js/db.js`); the screens use `api.js`:

```js
const tickets = await get('/tickets?status=OPEN');
await post('/tickets', { departmentId: 13, categoryId: 2, issueId: 5, description: 'Paper jam' });
await put('/tickets/1', { status: 'RESOLVED', resolution: 'Cleared jam. Troubleshoot successful.' });
await del('/departments/5');
```

Public (no sign-in): `/public/info` (departments + concerns), `/auth/signup`, `/auth/login`.
Routes: `/users`, `/departments`, `/categories`, `/issues`, `/tickets` (list/create, and `/{id}` get/update/delete),
`/stats`, `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/change-password`.

## Seeded data (from your list)

- **Departments:** Pharmacy, Billing/Cashier, OPD, Social Worker, Doctor's Office, Emergency Room, Operating Room,
  Dialysis, X-ray, Ultrasound, Laboratory, Nurse Station 1–3, Chief Nurse Room, Medical Record, Business Office,
  HR Office, PhilHealth, Central Supply Office, Dietary/Canteen (+ IT Department for IT staff accounts)
- **Concerns → issues:** PC (Hardware, Software) · Printer (End of Service, No Printing Color, Paper Jam, Head Cleaning) ·
  Internet Connection (Wi-Fi, Internet Cable, Password) · Documents (Forms) · Review CCTV ·
  EMR Hospital System (Bizbox Hospital / Material Management / PhilHealth / Konsulta Information System) · Others (free text)

All of these can be edited in the app (Departments and Concerns tabs).

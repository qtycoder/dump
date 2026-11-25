# Busride

Bus booking app in plain HTML, CSS, JavaScript, PHP and MySQL. Liquid-glass UI over a bus wallpaper, landscape by default with a toggle for mobile view.

## What is in it

| Page | Who | What it does |
|---|---|---|
| `index.html` | everyone | Log in / sign up. Admins go to the admin dashboard, passengers to their dashboard. |
| `discover.html` | everyone | Swipe carousels of bus models and routes, plus the fare table. |
| `trips.html` | everyone | Pick a route and departure. Map, bus details, **driver identity and safety checks**, fare for Regular / Student / Senior / PWD. |
| `book.html` | passengers | Seat map, passenger name, fare type, payment (Cash, GCash demo, Maya demo), ticket. |
| `dashboard.html` | passengers | Next trip, totals, spending chart, bookings (upcoming / past / cancelled), cancel, leaving-soon carousel. |
| `setup.html` | first admin | One-time page that creates the first admin account (localhost only). |
| `admin/index.html` | admins only | Stats overview and full management of trips, routes, buses, bus models, drivers, fare types, bookings and users. |

Passengers and admins are separate: the server checks the role on every request, and each side is redirected away from the other's pages.

## Folder structure

```
busride/
├── index.html  discover.html  trips.html  book.html  dashboard.html
├── admin/index.html
├── api/                 JSON endpoints used by the pages
│   └── admin/           admin-only endpoints
├── assets/
│   ├── css/  style.css (landing)  app.css (inner pages)
│   ├── js/   common.js  carousel.js  app.js  discover.js  trips.js  book.js  dashboard.js  admin.js
│   └── img/  bus-bg.jpg
├── config/config.php    ← MySQL credentials
├── database/            schema.sql (tables + sample data), create_admin.php
└── includes/            db, helpers, trips, bookings, crud, entities
```

## Setup (PHP 8.0+ with `pdo_mysql`, MySQL 5.7+ or MariaDB 10.3+)

1. Create the tables and sample data:
   ```
   mysql -u root -p < database/schema.sql
   ```
2. Put your MySQL user and password in `config/config.php`.
3. Create your admin account: open **http://localhost/busride/setup.html** (or `http://localhost:8000/setup.html`). It works only once, only from this computer, and only while no admin exists. It then opens the admin dashboard.
   Command-line alternative: `php database/create_admin.php "Your Name" you@example.com`
4. Run it from the project folder:
   ```
   php -S localhost:8000
   ```
   Open http://localhost:8000. With XAMPP or Laragon, copy the folder into `htdocs` / `www` instead.

Sign up on the landing page to make a passenger account. Public sign-up can never create an admin.

## Upgrading an older database

If you already imported the older `schema.sql`, do not drop anything. In phpMyAdmin select the `busride` database, then Import `database/upgrade_v3.sql` **once**. It adds the booking contact number column and 16 more destinations with sample trips.

## Things to know

- **Contact number:** every booking saves the passenger's mobile number and the admin can see it under Bookings. The thank-you screen says you will contact them, but this project does not send SMS or email by itself. That needs a provider (for example an SMTP mailer or an SMS service).

- **Payments are demo only.** GCash and Maya mark the ticket as paid with a `DEMO-` reference. Nothing is charged. A real gateway (PayMongo, Xendit, etc.) must be added before taking real money.
- **Fares are computed on the server** from the route price and the fare type discount, never from what the browser sends.
- **Student / Senior / PWD** passengers must tick a box confirming they will show a valid ID. The ID itself is checked by the driver or conductor when boarding.
- **Driver safety checks** shown to passengers: identity verified, background check, license not expired on the departure date, and bus inspection within 12 months. All of it comes from the database (admin → Drivers / Buses), so keep it accurate. The sample drivers and buses are made up.
- **Maps** use Leaflet and OpenStreetMap (no API key). The line is straight between the two stops; the link under the map opens the real road route in Google Maps. An embedded Google Map would need a Google API key.
- **Cancel** is allowed up to 2 hours before departure. Cancelled seats become free again.
- Fonts, Leaflet and map tiles load from the internet. Everything else works offline.
- The `.htaccess` files in `config`, `includes` and `database` block direct access on Apache. On Nginx, deny those folders in the server config.
- Not included yet: password reset, email or SMS tickets, driver photos.

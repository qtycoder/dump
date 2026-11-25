# Busride

HTML + CSS + JS + PHP + MySQL. Glass UI na may bus wallpaper, landscape by default at may toggle para sa mobile view.

## Folder structure

```
busride/
├── index.html
├── api/            login, register, logout, me, references (JSON)
├── assets/
│   ├── css/style.css
│   ├── js/app.js
│   └── img/bus-bg.jpg
├── config/config.php      ← ilagay dito ang MySQL credentials
├── database/schema.sql
└── includes/              db.php, helpers.php
```

## Setup

1. Gumawa ng database at tables:
   ```
   mysql -u root -p < database/schema.sql
   ```
2. Ayusin ang `config/config.php` (host, user, password).
3. Patakbuhin (PHP 8.0+ na may `pdo_mysql`):
   ```
   php -S localhost:8000
   ```
   Buksan ang http://localhost:8000. Kung XAMPP/Laragon, ilagay ang folder sa `htdocs` / `www`.

## Notes

- Ang button sa kanang itaas ang nagpapalit ng Landscape at Mobile view (naka-save sa browser).
- Ang `.htaccess` sa `config`, `includes` at `database` ay humaharang sa direktang access sa Apache. Kung Nginx ang gamit, i-block ang mga folder na iyon sa server config.
- Passwords ay naka-hash gamit ang `password_hash`. Walang email-sending, kaya ang "I forgot" at "Pinterest" ay placeholder pa lang.

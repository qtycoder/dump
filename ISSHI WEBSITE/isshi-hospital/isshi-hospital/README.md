# ISSHI Hospital Website

Static site — no build step. Open `index.html` in a browser (or serve with `python3 -m http.server`).

```
isshi-hospital/
├── index.html              ← page structure
├── css/
│   ├── base.css            ← colors, fonts, reset (edit design tokens here)
│   ├── layout.css          ← header, sections, footer, background
│   ├── components.css      ← buttons, glass cards, chips, animations
│   ├── sections.css        ← styles per section (hero, board, directory…)
│   └── responsive.css      ← tablet / mobile breakpoints
├── js/
│   ├── data.js             ← ALL content: doctors, services, HMOs, directory
│   ├── render.js           ← builds cards from data.js
│   └── main.js             ← nav, scroll animations, contact form
└── assets/images/
    ├── brand/              ← seal.png, logo-full.png
    ├── hospital/           ← building.jpg
    └── board/              ← doctor photos (transparent .webp)
```

## Common edits
- **Add / change a doctor:** put the photo in `assets/images/board/`, then edit the arrays in `js/data.js`.
- **Phone numbers:** replace `0917-XXX-XXXX` (`phonePlaceholder` in `data.js`) and `(078) XXX-XXXX` in `index.html`.
- **Colors:** change the variables at the top of `css/base.css`.

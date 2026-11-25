# ISSHI Hospital Website

Static site — no build step. Open `index.html` in a browser (or serve with `python3 -m http.server`).
Blue & white neo-glass theme; liquid cursor, floating pill / syringe / mask animations. Icons are inline (js/icons.js) — no CDN needed except Google Fonts.

```
isshi-hospital/
├── index.html
├── css/  base · layout · components · sections · fx (glass, liquid, medical animations) · responsive
├── js/   data.js (ALL content) · icons.js · render.js · main.js · fx.js
└── assets/images/  brand/ · hospital/ · board/
```

## Common edits
- **Doctors / services / HMOs / directory:** `js/data.js` (photos go in `assets/images/board/`).
- **Phone numbers:** replace `0917-XXX-XXXX` (`phonePlaceholder` in data.js) and `(078) XXX-XXXX` in index.html.
- **Colors:** variables at the top of `css/base.css`.
- **Turn off liquid cursor:** remove `<div class="liquid">` in index.html.

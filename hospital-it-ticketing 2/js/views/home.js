// Public homepage: hero, auto-sliding carousel, services, how it works.

// To show your own photos instead of the drawings: put the image files in an "img" folder
// next to index.html and set  image: 'img/pc-setup.jpg'  on the slide (art is then ignored).
const HOME_SLIDES = [
  { title: 'PC set-up', art: 'pc', image: null,
    text: 'Desktop installation, software and hardware troubleshooting for every nurse station and office.' },
  { title: 'Printers', art: 'printer', image: null,
    text: 'Paper jams, head cleaning, no color printing and end-of-service replacements.' },
  { title: 'Network hardware', art: 'network', image: null,
    text: 'Wi-Fi, internet cables and passwords for every department.' },
  { title: 'CCTV review', art: 'cctv', image: null,
    text: 'Need footage checked? Send a request and the IT office will review it.' },
  { title: 'EMR & hospital systems', art: 'emr', image: null,
    text: 'Bizbox Hospital, Material Management, PhilHealth and Konsulta information systems.' },
];
const SLIDE_INTERVAL_MS = 4500;

function buildCarousel() {
  const count = HOME_SLIDES.length;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;
  let hovering = false;
  let userPaused = reduceMotion; // people who prefer reduced motion start paused

  const slides = HOME_SLIDES.map((s, i) => {
    const art = h('div', { class: 'art' });
    if (s.image) art.append(h('img', { src: s.image, alt: s.title, loading: 'lazy' }));
    else art.innerHTML = ART[s.art] || ''; // static, trusted SVG from art.js
    return h('figure', { class: 'slide', role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${i + 1} of ${count}: ${s.title}`, 'aria-hidden': i === 0 ? null : 'true' },
      art, h('figcaption', {}, h('h3', {}, s.title), h('p', {}, s.text)));
  });
  const track = h('div', { class: 'slides' }, slides);

  const dots = HOME_SLIDES.map((s, i) =>
    h('button', { class: 'dot', type: 'button', 'aria-label': `Show slide ${i + 1}: ${s.title}`, onclick: () => { go(i); } }));

  const toggle = h('button', { class: 'icon-btn', type: 'button', onclick: () => { userPaused = !userPaused; syncToggle(); } });
  function syncToggle() {
    toggle.replaceChildren(icon(userPaused ? 'play' : 'pause', 16));
    toggle.setAttribute('aria-label', userPaused ? 'Start automatic sliding' : 'Pause automatic sliding');
  }

  function go(i) {
    index = (i + count) % count;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((el, k) => (k === index ? el.removeAttribute('aria-hidden') : el.setAttribute('aria-hidden', 'true')));
    dots.forEach((d, k) => (k === index ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
  }

  const root = h('section', { class: 'carousel glass', 'aria-roledescription': 'carousel', 'aria-label': 'What the IT team looks after' },
    track,
    h('div', { class: 'carousel-bar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous slide', onclick: () => go(index - 1) }, icon('left', 18)),
      h('div', { class: 'dots' }, dots),
      toggle,
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next slide', onclick: () => go(index + 1) }, icon('right', 18))));

  root.addEventListener('mouseenter', () => { hovering = true; });
  root.addEventListener('mouseleave', () => { hovering = false; });
  root.addEventListener('focusin', () => { hovering = true; });
  root.addEventListener('focusout', () => { hovering = false; });

  timer = setInterval(() => {
    if (!root.isConnected) { clearInterval(timer); return; } // page changed: stop the timer
    if (!hovering && !userPaused && !document.hidden) go(index + 1);
  }, SLIDE_INTERVAL_MS);

  syncToggle();
  go(0);
  return root;
}

async function renderHome(root) {
  let info = { departments: [], categories: [] };
  try { info = await get('/public/info'); } catch { /* the page still works without it */ }

  const toServices = () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const nav = h('header', { class: 'pub-nav glass' },
    h('a', { class: 'brand', href: '#/', 'aria-label': 'Hospital IT Help Desk home' },
      h('span', { class: 'brand-mark' }, icon('pulse', 22)),
      h('span', {}, 'Hospital IT Help Desk', h('small', {}, 'IT support for hospital staff'))),
    h('nav', { class: 'pub-links', 'aria-label': 'Site' },
      h('button', { class: 'btn btn-secondary btn-small hide-sm', type: 'button', onclick: toServices }, 'Services'),
      h('a', { class: 'btn btn-secondary btn-small', href: '#/login' }, 'Sign in'),
      h('a', { class: 'btn btn-primary btn-small', href: '#/signup' }, 'Sign up')));

  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-text' },
      h('span', { class: 'eyebrow' }, 'IT ticketing services'),
      h('h1', {}, 'Computer, printer or network down? Tell IT in a minute.'),
      h('p', {}, 'Report a concern from any department. The IT team picks it up, fixes it, and records what was done, so nothing gets lost.'),
      h('div', { class: 'hero-cta' },
        h('a', { class: 'btn btn-primary', href: '#/signup' }, 'Create an account'),
        h('a', { class: 'btn btn-secondary', href: '#/login' }, 'Sign in')),
      h('ul', { class: 'hero-points' },
        h('li', {}, icon('check', 18), 'Works for all departments: ER, OPD, Laboratory, Pharmacy and more'),
        h('li', {}, icon('check', 18), 'See the status of every ticket you send'),
        h('li', {}, icon('check', 18), 'IT records the troubleshooting result'))),
    buildCarousel());

  const services = info.categories.length ? h('section', { class: 'pub-section', id: 'services' },
    h('h2', {}, 'What we support'),
    h('p', { class: 'lead' }, 'Pick the concern that matches your problem when you create a ticket.'),
    h('div', { class: 'features' }, info.categories.map((c) => h('div', { class: 'feature glass' },
      h('span', { class: 'chip-icon' }, icon(categoryIcon(c.name), 22)),
      h('h3', {}, c.name),
      c.issues.length ? h('p', { class: 'sub' }, c.issues.slice(0, 4).join(' · ')) : null)))) : h('span', { id: 'services' });

  const steps = h('section', { class: 'pub-section' },
    h('h2', {}, 'How it works'),
    h('div', { class: 'steps' }, [
      ['1', 'Create your account', 'Sign up with your name, department and a password.'],
      ['2', 'Report the concern', 'Choose the concern and issue, describe it, and submit.'],
      ['3', 'IT takes care of it', 'Follow the status until it is resolved, with the notes from IT.'],
    ].map(([n, t, d]) => h('div', { class: 'step glass' }, h('span', { class: 'step-n' }, n), h('h3', {}, t), h('p', { class: 'sub' }, d)))));

  const footer = h('footer', { class: 'pub-footer' },
    h('span', {}, 'Hospital IT Help Desk'),
    h('span', {}, 'For hospital staff. Need urgent help? Contact the IT office directly.'));

  root.replaceChildren(h('div', { class: 'shell pub' }, nav, h('main', {}, hero, services, steps), footer));
  document.title = 'Hospital IT Help Desk';
}

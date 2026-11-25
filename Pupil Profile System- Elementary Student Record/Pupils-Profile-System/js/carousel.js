/* Auto-sliding carousel with arrows, dots and touch swipe. */
function initCarousel(root, interval = 5000) {
  const track = $('.track', root), n = track.children.length, dots = $('.dots', root);
  let i = 0, timer, x0 = 0;
  dots.innerHTML = '<i></i>'.repeat(n);
  const go = k => { i = (k + n) % n; track.style.transform = `translateX(-${i * 100}%)`; [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i)); };
  const play = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), interval); };
  $('.prev', root).onclick = () => { go(i - 1); play(); };
  $('.next', root).onclick = () => { go(i + 1); play(); };
  [...dots.children].forEach((d, j) => d.onclick = () => { go(j); play(); });
  root.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  root.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); play(); });
  root.onmouseenter = () => clearInterval(timer); root.onmouseleave = play;
  go(0); play();
}

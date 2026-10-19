/**
 * Scroll-triggered reveals (IntersectionObserver) and hero entrance.
 * The hidden "pre-reveal" state is only applied after this module runs, and it
 * is skipped entirely for users who prefer reduced motion.
 */
export function initAnimations() {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    root.classList.add('hero-in');
    return;
  }

  const items = [...document.querySelectorAll('.reveal')];
  // Elements already in view at load are revealed immediately (no flash)
  const vh = window.innerHeight;
  items.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-visible');
  });
  root.classList.add('anim-ready');

  // Stagger siblings inside the same grid row
  document.querySelectorAll('.row, .steps, .gallery, .logo-grid, .carousel-hyt__track').forEach((group) => {
    [...group.querySelectorAll(':scope > * .reveal, :scope > .reveal')].forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 70}ms`);
    });
  });

  // Elements that start clipped to nothing (image wipes use clip-path) never
  // report an intersection themselves, so their parent is observed instead.
  const targetOf = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        (targetOf.get(entry.target) || [entry.target]).forEach((el) => el.classList.add('is-visible'));
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => {
    if (el.classList.contains('is-visible')) return;
    const watch = el.classList.contains('media-frame') && el.parentElement ? el.parentElement : el;
    if (!targetOf.has(watch)) targetOf.set(watch, []);
    targetOf.get(watch).push(el);
    io.observe(watch);
  });

  // Safety net: never leave content hidden (e.g. print, unusual scroll containers)
  window.addEventListener('beforeprint', () => items.forEach((el) => el.classList.add('is-visible')));
  setTimeout(() => items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
  }), 2500);

  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('hero-in')));
  initCounters();
  initParallax();
}

/** Count-up for statistics such as "1,100+" or "1977" – keeps the original formatting. */
function initCounters() {
  const stats = document.querySelectorAll('.stat__value');
  if (!stats.length) return;
  const run = (el) => {
    const text = el.dataset.final || el.textContent.trim();
    el.dataset.final = text;
    const m = text.match(/^(\D*)([\d.,\u202f\u00a0 ]*\d)(.*)$/);
    if (!m) return;
    const [, pre, num, post] = m;
    const sep = (num.match(/[.,\u202f\u00a0 ]/) || [''])[0];
    const target = parseInt(num.replace(/\D/g, ''), 10);
    if (!Number.isFinite(target)) return;
    const from = target >= 1900 && target <= 2100 && !sep ? target - 60 : 0;
    const fmt = (n) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n));
    const start = performance.now();
    const dur = 1600;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.round(from + (target - from) * eased)) + post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  stats.forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim()); // screen readers get the final value
    io.observe(el);
  });
}

/** Gentle parallax on hero images (transform only – no layout work). */
function initParallax() {
  const layers = [...document.querySelectorAll('.hero-home__img, .page-hero__img')];
  if (!layers.length || window.matchMedia('(pointer: coarse)').matches) return;
  let ticking = false;
  const update = () => {
    layers.forEach((img) => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      img.style.setProperty('--parallax', `${Math.round(-box.top * 0.18)}px`);
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

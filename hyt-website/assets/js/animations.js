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

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => { if (!el.classList.contains('is-visible')) io.observe(el); });

  // Safety net: never leave content hidden (e.g. print, unusual scroll containers)
  window.addEventListener('beforeprint', () => items.forEach((el) => el.classList.add('is-visible')));
  setTimeout(() => items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
  }), 2500);

  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('hero-in')));
}

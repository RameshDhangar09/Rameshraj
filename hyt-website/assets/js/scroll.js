/**
 * Smooth, inertia-style page scrolling (Lenis 1.1.20, vendored locally) and
 * helpers used by other modules. Skipped for users who prefer reduced motion
 * and on touch devices, where native scrolling already feels right.
 */
let lenis = null;

export async function initSmoothScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduce || coarse) return null;
  try {
    const { default: Lenis } = await import('../vendor/lenis/lenis.mjs');
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.documentElement.classList.add('has-smooth-scroll');
  } catch (err) {
    console.warn('[hyt] smooth scrolling unavailable', err);
    lenis = null;
  }
  return lenis;
}

/** Height of everything sticky at the top (header bar + product sub-navigation). */
export function stickyOffset() {
  const bar = document.querySelector('.navbar-hyt');
  const sub = document.querySelector('[data-subnav]');
  return (bar ? bar.offsetHeight : 0) + (sub ? sub.offsetHeight : 0) + 16;
}

/** Scroll to an element, accounting for the sticky header. */
export function scrollToElement(el, { immediate = false } = {}) {
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis) {
    lenis.scrollTo(el, { offset: -stickyOffset(), immediate: immediate || reduce, duration: 1.1 });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY - stickyOffset();
    window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
  }
}

/** Pause page scrolling while a menu or dialog is open. */
export function lockScroll(state) {
  if (!lenis) return;
  if (state) lenis.stop(); else lenis.start();
}

/**
 * Facilities showcase: accessible tabs (WAI-ARIA tab pattern) with an
 * auto-advancing progress bar. Autoplay stops for good as soon as the visitor
 * interacts, pauses on hover/focus or when off-screen, and never runs for
 * reduced-motion users. Without JavaScript every panel is shown in sequence.
 */
const INTERVAL = 6000;

export function initFacilities() {
  document.querySelectorAll('[data-facilities]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    if (!tabs.length) return;
    root.dataset.ready = '';
    root.style.setProperty('--facility-interval', `${INTERVAL}ms`);
    let current = 0;
    let timer = null;
    let stopped = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let inView = false;
    let hovering = false;

    const select = (i, focus = false) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, j) => {
        const on = j === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        panels[j].classList.toggle('is-entering', on);
      });
      if (focus) tabs[current].focus();
      // restart the progress-bar animation
      const bar = tabs[current].querySelector('.facility-tab__bar');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      // keep the active tab visible in the horizontal tab strip (mobile) without scrolling the page
      const strip = tabs[current].parentElement;
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: tabs[current].offsetLeft - (strip.clientWidth - tabs[current].offsetWidth) / 2, behavior: 'smooth' });
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      const run = !stopped && inView && !hovering;
      root.classList.toggle('is-autoplay', run);
      if (run) timer = setTimeout(() => { select(current + 1); schedule(); }, INTERVAL);
    };
    const stop = () => { stopped = true; schedule(); };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stop(); select(i); });
      t.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (keys[e.key]) { e.preventDefault(); stop(); select(current + keys[e.key], true); }
        if (e.key === 'Home') { e.preventDefault(); stop(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); stop(); select(tabs.length - 1, true); }
      });
    });
    root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    root.addEventListener('focusin', stop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; schedule(); }, { threshold: 0.35 }).observe(root);
    }
    select(0);
  });
}

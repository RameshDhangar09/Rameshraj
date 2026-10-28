/**
 * Product image carousels inside text blocks (home page): cross-fading slides,
 * arrows, model tabs with an autoplay progress bar, swipe and keyboard support.
 * Autoplay pauses on hover, keyboard focus, when off-screen or in a hidden tab,
 * and never starts for visitors who prefer reduced motion.
 */
const INTERVAL = 5000;

export function initMediaCarousels() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-media-carousel]').forEach((root) => {
    const slides = [...root.querySelectorAll('.media-carousel__slide')];
    const tabs = [...root.querySelectorAll('[data-mc-go]')];
    const num = root.querySelector('[data-mc-num]');
    const toggle = root.querySelector('[data-mc-toggle]');
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;
    let userPaused = reduced;
    let hover = false;
    let visible = false;

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
        s.querySelector('a')?.setAttribute('tabindex', on ? '0' : '-1');
      });
      tabs.forEach((t, n) => {
        t.classList.toggle('is-active', n === index);
        if (n === index) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      if (num) num.textContent = String(index + 1).padStart(2, '0');
      restart();
    };
    const running = () => !userPaused && !hover && visible && !document.hidden;
    const restart = () => {
      clearTimeout(timer);
      root.classList.remove('is-running');
      void root.offsetWidth; // restart the CSS progress animation
      if (running()) {
        root.classList.add('is-running');
        timer = setTimeout(() => show(index + 1), INTERVAL);
      }
    };
    const setPaused = (p) => {
      userPaused = p;
      root.classList.toggle('is-paused', p);
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(p));
        toggle.setAttribute('aria-label', p ? toggle.dataset.labelPlay : toggle.dataset.labelPause);
        toggle.querySelector('.bi').className = `bi bi-${p ? 'play-fill' : 'pause-fill'}`;
      }
      restart();
    };

    root.querySelector('[data-mc-prev]')?.addEventListener('click', () => show(index - 1));
    root.querySelector('[data-mc-next]')?.addEventListener('click', () => show(index + 1));
    tabs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.mcGo))));
    toggle?.addEventListener('click', () => setPaused(!userPaused));
    root.addEventListener('pointerenter', () => { hover = true; restart(); });
    root.addEventListener('pointerleave', () => { hover = false; restart(); });
    root.addEventListener('focusin', () => { hover = true; restart(); });
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { hover = false; restart(); } });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    });
    // Swipe
    const vp = root.querySelector('.media-carousel__viewport');
    let x0 = null;
    vp.addEventListener('pointerdown', (e) => { x0 = e.clientX; }, { passive: true });
    vp.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', restart);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; restart(); }, { threshold: 0.35 }).observe(root);
    if (reduced) setPaused(true);
  });
}

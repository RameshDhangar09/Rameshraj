/**
 * Home hero slideshow: background slides (image, self-hosted video or an
 * embedded player such as Canva) that cross-fade every N seconds.
 *
 * Accessibility: one fixed <h1> (only the background changes), labelled slide
 * buttons with aria-current, previous/next and a pause/play button (WCAG
 * 2.2.2). Autoplay pauses while the hero is off-screen, the tab is hidden or
 * keyboard focus is inside the controls, and never starts for visitors who
 * prefer reduced motion. Videos and embedded players load only after the page
 * has finished loading, on top of a poster image, so they never delay the first
 * paint; phones get a lighter video file.
 */
export function initHeroCarousel() {
  const stage = document.querySelector('[data-hero-slides]');
  const nav = document.querySelector('[data-hero-nav]');
  if (!stage || !nav) return;
  const hero = stage.closest('.hero-home') || document.body;
  const slides = [...stage.querySelectorAll('[data-hero-slide]')];
  const dots = [...nav.querySelectorAll('[data-hero-goto]')];
  const captions = [...nav.querySelectorAll('[data-hero-caption]')];
  const toggle = nav.querySelector('[data-hero-toggle]');
  if (slides.length < 2) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const interval = (Number(nav.dataset.interval) || 10) * 1000;
  nav.style.setProperty('--interval', `${interval}ms`);
  hero.classList.add('is-carousel');

  let current = 0;
  let userPaused = reduce;
  let hidden = document.hidden;
  let offscreen = false;
  let focusInside = false;
  let timer = 0;
  let startedAt = 0;
  let remaining = interval;
  let pageLoaded = document.readyState === 'complete';

  const paused = () => userPaused || hidden || offscreen || focusInside;

  /* ---------- media ---------- */
  const loadMedia = (slide) => {
    const video = slide.querySelector('video[data-src]');
    // Videos start after the page has loaded (the poster image is the first paint),
    // never for reduced-motion users, and not when the visitor asked to save data.
    if (video && pageLoaded && !reduce && !saveData) {
      if (!video.src) {
        const small = window.matchMedia('(max-width: 767.98px)').matches;
        const d = video.dataset;
        const webm = d.srcWebm && video.canPlayType('video/webm; codecs="vp9"') === 'probably';
        const mp4 = video.canPlayType('video/mp4; codecs="avc1.640028"') !== '';
        const pick = webm || !mp4 && d.srcWebm
          ? (small && d.srcWebmSmall) || d.srcWebm
          : (small && d.srcSmall) || d.src;
        video.muted = true;
        video.src = pick;
        video.addEventListener('playing', () => slide.classList.add('media-ready'), { once: true });
      }
      video.play().catch(() => {});
    }
    const frame = slide.querySelector('iframe[data-src]');
    if (frame && !frame.src && pageLoaded) {
      frame.addEventListener('load', () => slide.classList.add('media-ready'), { once: true });
      frame.src = frame.dataset.src;
    }
  };
  const stopMedia = (slide) => {
    const video = slide.querySelector('video');
    if (video && !video.paused) video.pause();
  };
  const warmNext = (n) => {
    const img = slides[n]?.querySelector('img[loading="lazy"]');
    if (img) img.loading = 'eager';
  };

  /* ---------- timing ---------- */
  const schedule = () => {
    clearTimeout(timer);
    nav.classList.toggle('is-paused', paused());
    toggle?.setAttribute('aria-label', userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause);
    toggle?.setAttribute('aria-pressed', String(userPaused));
    if (paused()) return;
    startedAt = performance.now();
    timer = setTimeout(() => show(current + 1), remaining);
  };
  const hold = () => {
    if (!paused() && startedAt) remaining = Math.max(400, remaining - (performance.now() - startedAt));
  };
  const update = (fn) => { hold(); fn(); schedule(); };

  /* ---------- slide change ---------- */
  function show(n) {
    n = (n + slides.length) % slides.length;
    clearTimeout(timer);
    if (n !== current) {
      const prev = slides[current];
      prev.classList.remove('is-active');
      prev.setAttribute('aria-hidden', 'true');
      stopMedia(prev);
      captions[current]?.setAttribute('hidden', '');
      captions[current]?.classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      dots[current]?.removeAttribute('aria-current');
      current = n;
    }
    const slide = slides[current];
    slide.classList.add('is-active');
    slide.removeAttribute('aria-hidden');
    captions[current]?.removeAttribute('hidden');
    captions[current]?.classList.add('is-active');
    const dot = dots[current];
    if (dot) {
      // restart the progress bar animation
      dot.classList.remove('is-active');
      void dot.offsetWidth;
      dot.classList.add('is-active');
      dot.setAttribute('aria-current', 'true');
    }
    loadMedia(slide);
    warmNext((current + 1) % slides.length);
    remaining = interval;
    schedule();
  }

  /* ---------- controls ---------- */
  dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
  nav.querySelector('[data-hero-prev]')?.addEventListener('click', () => show(current - 1));
  nav.querySelector('[data-hero-next]')?.addEventListener('click', () => show(current + 1));
  toggle?.addEventListener('click', () => update(() => { userPaused = !userPaused; }));
  nav.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); dots[current]?.focus(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); dots[current]?.focus(); }
  });
  nav.addEventListener('focusin', () => update(() => { focusInside = true; }));
  nav.addEventListener('focusout', (e) => {
    if (!nav.contains(e.relatedTarget)) update(() => { focusInside = false; });
  });
  document.addEventListener('visibilitychange', () => update(() => { hidden = document.hidden; }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => update(() => { offscreen = !entry.isIntersecting; }), { threshold: 0.25 }).observe(hero);
  }

  // Swipe on touch screens
  let x0 = null; let y0 = 0;
  hero.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { x0 = e.clientX; y0 = e.clientY; } }, { passive: true });
  hero.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Embedded players wait for the page to finish loading
  const afterLoad = () => {
    pageLoaded = true;
    setTimeout(() => loadMedia(slides[current]), 600);
  };
  if (pageLoaded) afterLoad(); else window.addEventListener('load', afterLoad, { once: true });

  show(0);
}

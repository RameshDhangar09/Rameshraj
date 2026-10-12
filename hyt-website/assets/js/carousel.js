/**
 * Scroll-snap carousel. The track is a normal scrollable list, so it works
 * with touch, trackpads and keyboard without JS; the buttons simply scroll by
 * one card and are disabled at either end.
 */
export function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((c) => {
    const track = c.querySelector('.carousel-hyt__track');
    const prev = c.querySelector('[data-carousel-prev]');
    const next = c.querySelector('[data-carousel-next]');
    if (!track || !prev || !next) return;
    const step = () => (track.querySelector('.carousel-hyt__slide')?.getBoundingClientRect().width || 300) + 24;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      c.querySelector('.carousel-hyt__controls').hidden = max <= 0;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    window.addEventListener('resize', update);
    update();
  });
}

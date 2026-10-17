/** Customer logo marquee: CSS animation with an accessible pause/play toggle. */
export function initLogoMarquee() {
  document.querySelectorAll('[data-marquee]').forEach((m) => {
    const btn = m.querySelector('[data-marquee-toggle]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const paused = m.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(paused));
      btn.querySelector('.visually-hidden').textContent = paused ? btn.dataset.labelPlay : btn.dataset.labelPause;
      btn.querySelector('.bi').className = `bi bi-${paused ? 'play-fill' : 'pause-fill'}`;
    });
  });
}

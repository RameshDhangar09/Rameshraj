/**
 * Product videos. Self-hosted files use the native <video> element.
 * YouTube videos use a click-to-load facade: nothing is requested from
 * YouTube (and no cookies are set) until the visitor presses play, and the
 * privacy-enhanced youtube-nocookie.com domain is used.
 */
export function initVideos() {
  document.querySelectorAll('[data-youtube]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.youtube;
      if (!/^[\w-]{6,20}$/.test(id)) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = btn.getAttribute('aria-label') || 'Video';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.className = 'video-iframe';
      btn.replaceWith(iframe);
      iframe.focus();
    });
  });
  // Pause any playing video when it scrolls out of view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting && !e.target.paused) e.target.pause();
    }), { threshold: 0.1 });
    document.querySelectorAll('video.video-player').forEach((v) => io.observe(v));
  }
}

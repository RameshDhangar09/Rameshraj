/**
 * Lightweight image lightbox using the native <dialog> element.
 * Without JavaScript each thumbnail is a plain link to the full-size image.
 */
import { t } from './i18n.js';

export function initGallery(strings) {
  const dialog = document.querySelector('[data-lightbox]');
  const galleries = document.querySelectorAll('[data-gallery]');
  if (!dialog || !galleries.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('[data-lightbox-img]');
  const cap = dialog.querySelector('[data-lightbox-caption]');
  const counter = dialog.querySelector('[data-lightbox-counter]');
  let items = [];
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = (i + items.length) % items.length;
    const a = items[index];
    img.src = a.getAttribute('href');
    img.alt = a.querySelector('img')?.alt || '';
    cap.textContent = a.dataset.caption || '';
    counter.textContent = t(strings, 'gallery.counter', { current: index + 1, total: items.length });
    const single = items.length < 2;
    dialog.querySelector('[data-lightbox-prev]').hidden = single;
    dialog.querySelector('[data-lightbox-next]').hidden = single;
  };

  galleries.forEach((g) => {
    const links = [...g.querySelectorAll('[data-gallery-item]')];
    links.forEach((a, i) => a.addEventListener('click', (e) => {
      e.preventDefault();
      items = links;
      opener = a;
      show(i);
      dialog.showModal();
      dialog.querySelector('[data-lightbox-close]').focus();
    }));
  });

  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { img.removeAttribute('src'); opener?.focus(); });

  // Touch swipe
  let x0 = null;
  dialog.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

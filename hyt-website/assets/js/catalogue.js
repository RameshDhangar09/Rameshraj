/**
 * Catalogue download with lead form.
 * Every "Download catalogue" link points straight at the PDF, so it still
 * works without JavaScript. With JavaScript the link opens a short form in a
 * dialog; after a successful submission forms.js sends the visitor to the
 * localised thank-you page, where the download starts (handled below).
 */
import { lockScroll } from './scroll.js';

const SAFE_FILE = /^\/assets\/documents\/[\w\-/]+\.pdf$/;

export function initCatalogueGate() {
  const dialog = document.querySelector('[data-catalogue-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    let opener = null;
    const open = (trigger) => {
      opener = trigger;
      const file = new URL(trigger.getAttribute('href'), location.origin).pathname;
      dialog.querySelector('[data-catalogue-file]').value = SAFE_FILE.test(file) ? file : '';
      dialog.querySelector('[data-catalogue-product]').value = trigger.dataset.catalogueOpen || '';
      dialog.showModal();
      lockScroll(true);
      dialog.querySelector('input:not([type=hidden])')?.focus();
    };
    // Capture phase: runs before other click handlers (menus, smooth anchors)
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-catalogue-open]');
      if (!trigger || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.nav-main__item.is-open').forEach((i) => i.classList.remove('is-open'));
      open(trigger);
    }, true);
    dialog.querySelector('[data-catalogue-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { lockScroll(false); opener?.focus(); });
  }

  // Thank-you page: start the requested download
  const params = new URLSearchParams(location.search);
  const file = params.get('file');
  if (params.get('form') === 'catalogue' && file && SAFE_FILE.test(file) && document.documentElement.dataset.page === 'thank-you') {
    const panel = document.querySelector('[data-download-panel]');
    if (panel) {
      panel.hidden = false;
      panel.querySelector('[data-download-link]').href = file;
      if (params.get('sent') === '0') panel.querySelector('[data-download-preview]').hidden = false;
    }
    const a = document.createElement('a');
    a.href = file;
    a.download = '';
    document.body.appendChild(a);
    setTimeout(() => { a.click(); a.remove(); }, 600);
  }
}

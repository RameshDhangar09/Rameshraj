/**
 * Product hub filter. Category buttons show one product family at a time
 * (or all). The selected filter is reflected in the URL hash so that menu
 * links such as /products/#wheel-lathes open the right family directly.
 */
import { t } from './i18n.js';
import { scrollToElement } from './scroll.js';

export function initProductFilter(strings) {
  const wrap = document.querySelector('[data-product-filter]');
  if (!wrap) return;
  const buttons = [...wrap.querySelectorAll('[data-filter]')];
  const groups = [...wrap.querySelectorAll('[data-group]')];
  const status = wrap.querySelector('[data-filter-status]');
  const empty = wrap.querySelector('[data-filter-empty]');
  const valid = new Set(buttons.map((b) => b.dataset.filter));

  const apply = (filter, { scroll = false } = {}) => {
    if (!valid.has(filter)) filter = 'all';
    buttons.forEach((b) => {
      const on = b.dataset.filter === filter;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    let count = 0;
    groups.forEach((g) => {
      const show = filter === 'all' || g.dataset.group === filter;
      g.hidden = !show;
      if (show) count += g.querySelectorAll('[data-product]').length;
    });
    if (status) status.textContent = `${t(strings, 'categories.showing')} ${count} ${t(strings, 'categories.products_word')}`;
    if (empty) empty.hidden = count > 0;
    if (scroll) scrollToElement(groups.find((g) => !g.hidden) || wrap);
  };

  buttons.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    history.replaceState(null, '', f === 'all' ? location.pathname : `#${f}`);
    apply(f);
  }));

  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (valid.has(h)) apply(h, { scroll: true });
  };
  window.addEventListener('hashchange', fromHash);
  apply('all');
  fromHash();
}

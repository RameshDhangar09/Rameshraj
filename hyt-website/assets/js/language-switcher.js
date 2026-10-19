/**
 * Language & region switcher.
 * Each link already points to the equivalent page in the other language (the
 * build guarantees that every page exists in all six versions, so links can
 * never 404). This module adds keyboard/touch disclosure behaviour and keeps
 * the current #anchor and ?product= query when switching.
 */
export function initLanguageSwitcher() {
  const switchers = document.querySelectorAll('[data-lang-switch]');
  switchers.forEach((sw) => {
    const btn = sw.querySelector('.lang-switch__btn');
    const menu = sw.querySelector('.lang-switch__menu');
    if (!btn || !menu) return;
    const links = [...menu.querySelectorAll('a')];
    const setOpen = (state, focusFirst = false) => {
      sw.classList.toggle('is-open', state);
      btn.setAttribute('aria-expanded', String(state));
      if (state && focusFirst) (menu.querySelector('[aria-current]') || links[0])?.focus();
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!sw.classList.contains('is-open'));
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        if (e.key !== 'ArrowDown' && sw.classList.contains('is-open')) return;
        e.preventDefault();
        setOpen(true, true);
      }
    });
    menu.addEventListener('keydown', (e) => {
      const i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
      if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
    });
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sw.classList.contains('is-open')) { e.stopPropagation(); setOpen(false); btn.focus(); }
    });
    sw.addEventListener('focusout', (e) => { if (!sw.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', (e) => { if (!sw.contains(e.target)) setOpen(false); });
  });

  // Preserve the in-page anchor and product pre-selection across languages
  document.querySelectorAll('[data-lang-link]').forEach((a) => {
    a.addEventListener('click', () => {
      const params = new URLSearchParams(location.search);
      const keep = new URLSearchParams();
      if (params.get('product')) keep.set('product', params.get('product'));
      const url = new URL(a.href, location.origin);
      url.search = keep.toString();
      url.hash = location.hash;
      a.href = url.pathname + url.search + url.hash;
    });
  });
}

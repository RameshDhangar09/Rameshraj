import { lockScroll } from './scroll.js';

/** Instant filter for the HTML sitemap (/sitemap/). */
export function initSitemapSearch() {
  const input = document.querySelector('[data-sitemap-search]');
  const tree = document.querySelector('[data-sitemap]');
  if (!input || !tree) return;
  const items = [...tree.querySelectorAll('[data-sitemap-item]')];
  const empty = document.querySelector('[data-sitemap-empty]');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  input.addEventListener('input', () => {
    const q = norm(input.value.trim());
    let shown = 0;
    // Bottom-up so parents stay visible when a child matches
    [...items].reverse().forEach((li) => {
      const own = norm(li.querySelector(':scope > a').textContent);
      const childVisible = [...li.querySelectorAll(':scope > ul > li')].some((c) => !c.hidden);
      const match = !q || own.includes(q) || childVisible;
      li.hidden = !match;
      if (match && own.includes(q)) shown += 1;
    });
    if (empty) empty.hidden = shown > 0 || !q;
  });
}

/**
 * Site search overlay. The index (/search-index/<lang>.json) is generated at
 * build time from the same content as the pages and fetched only when search
 * is first opened. Without JavaScript the search link opens the HTML sitemap.
 */

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function highlight(text, terms) {
  let out = escHtml(text);
  terms.forEach((t) => {
    if (t.length < 2) return;
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    // match on the original (accented) text by testing normalised slices
    out = out.replace(/[^<>&]+/g, (chunk) => {
      const n = norm(chunk);
      let res = '';
      let i = 0;
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(n))) {
        res += chunk.slice(i, m.index) + '<mark>' + chunk.slice(m.index, m.index + m[0].length) + '</mark>';
        i = m.index + m[0].length;
      }
      return res + chunk.slice(i);
    });
  });
  return out;
}

export function initSiteSearch() {
  const dialog = document.querySelector('[data-search-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const input = dialog.querySelector('[data-search-input]');
  const list = dialog.querySelector('[data-search-results]');
  const status = dialog.querySelector('[data-search-status]');
  let index = null;
  let loading = null;

  const load = () => {
    if (!loading) {
      loading = fetch(dialog.dataset.index, { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((data) => { index = data.map((d) => ({ ...d, _t: norm(d.t + ' ' + d.h + ' ' + d.m), _d: norm(d.d), _k: norm(d.k + ' ' + d.s) })); })
        .catch(() => { index = []; });
    }
    return loading;
  };

  const render = () => {
    const q = input.value.trim();
    const terms = norm(q).split(/\s+/).filter(Boolean);
    list.innerHTML = '';
    if (!index || norm(q).length < 2) { status.textContent = ''; return; }
    const scored = [];
    index.forEach((d) => {
      let score = 0;
      for (const t of terms) {
        let s = 0;
        if (d._t.includes(t)) s += d._t.split(/\s+/).some((w) => w.startsWith(t)) ? 12 : 8;
        if (d._d.includes(t)) s += 3;
        if (d._k.includes(t)) s += 2;
        if (!s) return; // every term must match somewhere
        score += s;
      }
      scored.push([score, d]);
    });
    scored.sort((a, b) => b[0] - a[0] || a[1].t.length - b[1].t.length);
    const top = scored.slice(0, 12);
    status.textContent = top.length
      ? (scored.length === 1 ? dialog.dataset.msgOne : dialog.dataset.msgResults.replace('{count}', scored.length))
      : dialog.dataset.msgNone.replace('{q}', q);
    list.innerHTML = top.map(([, d]) => `<li><a class="search-hit" href="${escHtml(d.u)}">
      ${d.s ? `<span class="search-hit__section">${escHtml(d.s)}</span>` : ''}
      <span class="search-hit__title">${highlight(d.t, terms)}</span>
      <span class="search-hit__text">${highlight(d.d, terms)}</span></a></li>`).join('');
  };

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => load().then(render), 90); });
  dialog.querySelector('[data-search-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(timer);
    await load();
    render();
    const first = list.querySelector('a');
    if (first) window.location.assign(first.href);
  });

  // Arrow keys move between input and results
  dialog.addEventListener('keydown', (e) => {
    const links = [...list.querySelectorAll('a')];
    const i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0])?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) input.focus(); else links[i - 1].focus(); }
  });

  let opener = null;
  const open = (trigger) => {
    opener = trigger || document.activeElement;
    load();
    dialog.showModal();
    lockScroll(true);
    input.focus();
    input.select();
    if (input.value) load().then(render);
  };
  document.querySelectorAll('[data-search-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(a); }));
  dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { lockScroll(false); opener?.focus?.(); });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      if (dialog.open) return;
      e.preventDefault();
      open();
    }
  });
}

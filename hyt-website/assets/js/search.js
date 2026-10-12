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

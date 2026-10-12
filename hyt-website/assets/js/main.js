/**
 * HYT Engineering – entry point (ES module).
 * Every feature module is optional: if one fails, the rest still run and the
 * page content (rendered as static HTML) remains fully usable.
 */
import { initNavigation } from './navigation.js';
import { initLanguageSwitcher } from './language-switcher.js';
import { initAnimations } from './animations.js';
import { initAccordions } from './accordion.js';
import { initGallery } from './gallery.js';
import { initCarousels } from './carousel.js';
import { initProductFilter } from './products.js';
import { initForms } from './forms.js';
import { initSitemapSearch } from './search.js';
import { loadStrings } from './i18n.js';

const root = document.documentElement;

function safe(name, fn) {
  try { fn(); } catch (err) { console.warn(`[hyt] ${name} failed`, err); }
}

async function boot() {
  root.classList.add('js-ready');
  const strings = await loadStrings(root.dataset.lang || 'en');
  safe('navigation', () => initNavigation(strings));
  safe('language switcher', () => initLanguageSwitcher());
  safe('animations', () => initAnimations());
  safe('accordions', () => initAccordions());
  safe('gallery', () => initGallery(strings));
  safe('carousels', () => initCarousels());
  safe('product filter', () => initProductFilter(strings));
  safe('forms', () => initForms(strings));
  safe('sitemap search', () => initSitemapSearch());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

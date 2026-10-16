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
import { initSitemapSearch, initSiteSearch } from './search.js';
import { loadStrings } from './i18n.js';
import { initSmoothScroll, scrollToElement } from './scroll.js';
import { initCatalogueGate } from './catalogue.js';
import { initLogoMarquee } from './marquee.js';
import { initVideos } from './video.js';
import { initFacilities } from './facilities.js';
import { initHomeFx } from './home-fx.js';
import { initHeroCarousel } from './hero-carousel.js';
import { initAxiomLauncher } from './axiom-launcher.js';

const root = document.documentElement;

function safe(name, fn) {
  try { fn(); } catch (err) { console.warn(`[hyt] ${name} failed`, err); }
}

async function boot() {
  root.classList.add('js-ready');
  const [strings] = await Promise.all([loadStrings(root.dataset.lang || 'en'), initSmoothScroll().catch(() => null)]);
  safe('navigation', () => initNavigation(strings));
  safe('language switcher', () => initLanguageSwitcher());
  safe('hero carousel', () => initHeroCarousel());
  safe('axiom', () => initAxiomLauncher());
  safe('home effects', () => initHomeFx());
  safe('animations', () => initAnimations());
  safe('accordions', () => initAccordions());
  safe('gallery', () => initGallery(strings));
  safe('carousels', () => initCarousels());
  safe('product filter', () => initProductFilter(strings));
  safe('forms', () => initForms(strings));
  safe('sitemap search', () => initSitemapSearch());
  safe('site search', () => initSiteSearch());
  safe('catalogue form', () => initCatalogueGate(strings));
  safe('logo marquee', () => initLogoMarquee());
  safe('videos', () => initVideos());
  safe('facilities', () => initFacilities());
  // Land on #anchors reliably once fonts, collapsed FAQs and images have settled
  safe('initial anchor', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target || document.querySelector(`[data-group="${CSS.escape(id)}"]`)) return;
    const go = () => scrollToElement(target, { immediate: true });
    requestAnimationFrame(go);
    window.addEventListener('load', go, { once: true });
    document.fonts?.ready.then(go);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

/**
 * Header behaviour: sticky state, accessible dropdowns (desktop) and the
 * off-canvas menu (mobile/tablet), plus back-to-top and smooth in-page links.
 * Without JavaScript, dropdowns open on hover/focus and the mobile menu is
 * rendered as a plain list, so navigation never depends on this file.
 */
import { scrollToElement, lockScroll } from './scroll.js';

const DESKTOP = window.matchMedia('(min-width: 1200px)');

export function initNavigation(strings) {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const nav = document.querySelector('[data-nav]');
  const burger = document.querySelector('[data-nav-open]');
  if (!header || !nav) return;
  root.classList.add('nav-ready');

  /* ---- Sticky header state (with hysteresis so it never flickers) ---- */
  let ticking = false;
  const progress = document.querySelector('[data-scroll-progress]');
  const toTop = document.querySelector('[data-back-to-top]');
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > 80) header.classList.add('is-scrolled');
      else if (y < 10) header.classList.remove('is-scrolled');
      toTop?.classList.toggle('is-visible', y > 700);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
      // Close click-opened dropdowns once the user scrolls away
      if (DESKTOP.matches && Math.abs(y - lastY) > 60) { items.forEach((i) => { if (i.classList.contains('is-open')) close(i); }); lastY = y; }
      ticking = false;
    });
  };
  let lastY = window.scrollY;

  /* ---- Dropdowns ---- */
  const items = [...nav.querySelectorAll('[data-nav-item]')];
  const triggerOf = (item) => item.querySelector('.nav-main__toggle, .nav-main__link--button');

  const close = (item, focus = false) => {
    item.classList.remove('is-open');
    const trig = triggerOf(item);
    trig?.setAttribute('aria-expanded', 'false');
    if (DESKTOP.matches) item.classList.add('is-closed');
    if (focus) trig?.focus();
  };
  const open = (item) => {
    items.forEach((other) => other !== item && close(other));
    item.classList.remove('is-closed');
    item.classList.add('is-open');
    triggerOf(item)?.setAttribute('aria-expanded', 'true');
  };
  const closeAll = () => items.forEach((i) => close(i));

  items.forEach((item) => {
    const trig = triggerOf(item);
    trig?.addEventListener('click', (e) => {
      e.preventDefault();
      item.classList.contains('is-open') ? close(item) : open(item);
    });
    // Hover intent on desktop keeps aria-expanded truthful for pointer users
    item.addEventListener('mouseenter', () => { if (DESKTOP.matches) { item.classList.remove('is-closed'); } });
    item.addEventListener('mouseleave', () => { if (DESKTOP.matches && item.classList.contains('is-open')) close(item); });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (item.classList.contains('is-open') || item.contains(document.activeElement))) {
        e.stopPropagation();
        close(item, true);
      }
      if (!DESKTOP.matches) return;
      const links = [...item.querySelectorAll('.mega a')];
      const idx = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!item.classList.contains('is-open')) open(item);
        (links[idx + 1] || links[0])?.focus();
      } else if (e.key === 'ArrowUp' && idx > -1) {
        e.preventDefault();
        (links[idx - 1] || links[links.length - 1])?.focus();
      }
    });
    item.addEventListener('focusout', (e) => {
      if (DESKTOP.matches && !item.contains(e.relatedTarget)) close(item);
    });
  });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) closeAll(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Off-canvas menu ---- */
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }
  const label = burger?.querySelector('[data-label-open]');
  const setMenu = (state) => {
    root.classList.toggle('nav-open', state);
    lockScroll(state);
    burger?.setAttribute('aria-expanded', String(state));
    if (label) label.textContent = state ? label.dataset.labelClose : label.dataset.labelOpen;
    if (state) {
      nav.querySelector('a, button')?.focus();
    } else {
      closeAll();
    }
  };
  burger?.addEventListener('click', () => setMenu(!root.classList.contains('nav-open')));
  backdrop.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) { setMenu(false); burger?.focus(); }
    // Keep focus inside the open off-canvas panel
    if (e.key === 'Tab' && root.classList.contains('nav-open') && !DESKTOP.matches) {
      const focusables = [burger, ...nav.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el && el.offsetParent !== null);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  DESKTOP.addEventListener('change', () => { setMenu(false); items.forEach((i) => i.classList.remove('is-closed')); });

  /* ---- In-page anchors: smooth scroll below the sticky header, move focus ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash.length < 2) return;
    if (a.hasAttribute('data-gallery-item')) return;
    const id = decodeURIComponent(url.hash.slice(1));
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    closeAll();
    if (id === 'top') { scrollToElement(document.body); history.replaceState(null, '', location.pathname + location.search); return; }
    history.pushState(null, '', url.hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    scrollToElement(target);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), 650);
  });

  /* ---- Product sub-navigation scroll spy ---- */
  const subnav = document.querySelector('[data-subnav]');
  if (subnav && 'IntersectionObserver' in window) {
    const links = new Map([...subnav.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const a = links.get(entry.target.id);
        if (a) {
          a.classList.add('is-active');
          a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    links.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }
}

/**
 * Home page motion: word-by-word headline reveals, pointer-driven hero depth,
 * spotlight glow, 3D card tilt, magnetic buttons and a scroll-linked hero fade.
 * Everything here is decorative: it only runs on the home page, never for
 * users who prefer reduced motion, and pointer effects only on mouse/trackpad.
 */
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initHomeFx() {
  const body = document.body;
  const home = body.classList.contains('page-home');
  const product = body.classList.contains('tpl-product');
  if ((!home && !product) || reduce()) return;
  document.documentElement.classList.add('fx-on');
  splitHeadings();
  if (home) heroScroll();
  if (product) { readingProgress(); staggerRows(); }
  if (!finePointer()) return;
  heroPointer();
  spotlights();
  tilt();
  magnetic();
}

/** Wrap each word of the headings in a mask so it can slide up into view. */
function splitHeadings() {
  const heads = document.querySelectorAll('.hero-home__title, .product-hero__title, .page-home main .section-title, .tpl-product main .section-title, .cta-band__title');
  heads.forEach((h) => {
    // Only headings that a reveal (or the hero entrance) will bring back in
    if (h.dataset.split || (!h.closest('.reveal') && !h.matches('.hero-home__title, .product-hero__title'))) return;
    h.dataset.split = '1';
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const outer = document.createElement('span');
            outer.className = 'split-w';
            const inner = document.createElement('span');
            inner.className = 'split-i';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(h);
  });
}

/** Hero content drifts up and fades slightly as the visitor scrolls away. */
function heroScroll() {
  const hero = document.querySelector('[data-hero-fx]');
  if (!hero) return;
  let ticking = false;
  const update = () => {
    const h = hero.offsetHeight || 1;
    const p = Math.min(1, Math.max(0, window.scrollY / h));
    hero.style.setProperty('--hero-p', p.toFixed(3));
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/** Grid, wheel and image move at different depths with the pointer. */
function heroPointer() {
  const hero = document.querySelector('[data-hero-fx]');
  if (!hero) return;
  let raf = 0; let tx = 0; let ty = 0; let x = 0; let y = 0;
  const loop = () => {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    hero.style.setProperty('--mx', x.toFixed(4));
    hero.style.setProperty('--my', y.toFixed(4));
    raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(loop) : 0;
  };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
}

/** Soft light that follows the pointer on the dark/blue bands. */
function spotlights() {
  document.querySelectorAll('[data-hero-fx], .page-home .section--navy, .section--cta, .tpl-product .section--video').forEach((el) => {
    el.classList.add('has-spot');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', `${e.clientX - r.left}px`);
      el.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--sx'); el.style.removeProperty('--sy'); });
  });
}

/** Cards tilt towards the pointer with a moving glare. */
function tilt() {
  document.querySelectorAll('.page-home .card-hyt, .page-home .stat, .tpl-product .card-hyt').forEach((card) => {
    const max = card.classList.contains('stat') ? 4 : 6;
    let raf = 0;
    card.classList.add('is-tilt');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        card.classList.add('is-tilting');
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
    });
  });
}

/** Primary actions lean towards the pointer. */
function magnetic() {
  document.querySelectorAll('.hero-home .btn-hyt, .product-hero .btn-hyt, .section--cta .btn-hyt, .catalogue-panel .btn-hyt').forEach((btn) => {
    btn.classList.add('is-magnetic');
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.setProperty('--bx', `${(dx * 10).toFixed(1)}px`);
      btn.style.setProperty('--by', `${(dy * 8).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--bx', '0px');
      btn.style.setProperty('--by', '0px');
    });
  });
}

/** Product pages: a thin bar on the sticky "On this page" menu shows reading progress. */
function readingProgress() {
  const nav = document.querySelector('[data-subnav]');
  const main = document.querySelector('main');
  if (!nav || !main) return;
  const bar = document.createElement('span');
  bar.className = 'subnav__progress';
  bar.setAttribute('aria-hidden', 'true');
  nav.appendChild(bar);
  let ticking = false;
  const update = () => {
    const r = main.getBoundingClientRect();
    const total = Math.max(1, r.height - window.innerHeight);
    nav.style.setProperty('--read', Math.min(1, Math.max(0, -r.top / total)).toFixed(4));
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/** Specification rows and feature checklists cascade in one after another. */
function staggerRows() {
  const groups = document.querySelectorAll('.tpl-product .spec-table tbody, .tpl-product .check-list');
  if (!groups.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  groups.forEach((g) => {
    [...g.children].forEach((row, i) => row.style.setProperty('--row', Math.min(i, 12)));
    g.classList.add('cascade');
    const r = g.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) g.classList.add('is-in'); else io.observe(g);
  });
}

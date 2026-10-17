/**
 * Axiom – HYT Engineering's website assistant.
 *
 * Answers come only from this website: FAQ answers, page summaries and fixed
 * guided flows (machine finder, turnkey, service, careers, catalogue). Axiom
 * never states prices, delivery times or specifications of its own; commercial
 * questions are handed to the sales team.
 *
 * Optional AI mode: when /axiom/<lang>.json carries an "endpoint", free-text
 * questions are sent to HYT's server-side function (see
 * integrations/cloudflare-worker/axiom-chat.js), which holds the AI key and
 * grounds the answer on the same website content. If it fails, Axiom falls
 * back to the local answers – the chat never breaks.
 *
 * The conversation is kept in sessionStorage (this tab only) – nothing is
 * stored on a server by this script.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, ' ');
const STOP = new Set(('the and for are you your our with what which how can does from that this have has about into '
  + 'der die das und ist ein eine mit fur wie was kann ich sie ihr den dem des zum zur '
  + 'les des une est pour avec que qui dans sur vous nos pas par '
  + 'il la le gli che per con una sono come cosa del della dei '
  + 'het een van voor met wat hoe zijn kan ik u uw op aan bij').split(' '));
const stem = (w) => (w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
const terms = (s) => [...new Set(norm(s).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem))];
const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

// Guided machine finder → page ids (structure is language-independent)
const FINDER = {
  in_single: ['underfloor-wheel-lathe', 'underfloor-wheel-lathe-yugl', 'wheel-measuring-station'],
  in_tandem: ['tandem-underfloor-wheel-lathe', 'tandem-underfloor-wheel-lathe-yuglx'],
  out: ['surface-wheel-lathe', 'portal-wheel-lathe', 'roller-type-portal-wheel-lathe'],
  new: ['vertical-turning-boring-machine', 'axle-turning-lathe', 'wheel-presses', 'dynamic-wheel-balancing-machine'],
};
const TURNKEY = ['ts-wheel-shops', 'ts-maintenance-depots', 'ts-rolling-stock-facilities', 'ts-wheelset-plants', 'ts-wheel-machining-lines', 'ts-axle-machining-lines'];

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
  });
  kids.flat().forEach((c) => { if (c) n.append(c.nodeType ? c : document.createTextNode(c)); });
  return n;
}
const icon = (name) => el('i', { class: `bi bi-${name}`, 'aria-hidden': 'true' });

export function createAxiom(root, launcher) {
  const src = root.dataset.src;
  const key = `axiom:${src}`;
  let data = null;
  let panel; let log; let input; let form; let consentView; let chatView;
  let state = store.get(key) || { consent: false, items: [], history: [] };
  const save = () => { state.items = state.items.slice(-60); state.history = state.history.slice(-12); store.set(key, state); };
  const S = (k) => (data?.strings?.[k]) || '';
  const page = (id) => data.pages[id];

  /* ---------------- knowledge ---------------- */
  const hasAny = (text, list) => {
    const t = ` ${norm(text).replace(/\s+/g, ' ')} `;
    return (list || []).some((k) => { const n = norm(k).trim(); return n && (t.includes(` ${n} `) || (n.length > 4 && t.includes(n))); });
  };
  function faqMatch(q) {
    const qs = terms(q);
    if (qs.length < 2) return null;
    let best = null;
    data.faqs.forEach((f) => {
      const fq = norm(f.q); const fa = norm(f.a);
      let s = 0;
      qs.forEach((t) => { if (fq.includes(t)) s += 2; else if (fa.includes(t)) s += 0.6; });
      const score = s / (qs.length * 2);
      if (!best || score > best.score) best = { f, score };
    });
    return best && best.score >= 0.55 ? best.f : null;
  }
  function searchPages(q, n = 3) {
    const qs = terms(q);
    if (!qs.length) return [];
    const scored = Object.entries(data.pages).map(([id, p]) => {
      const t = norm(p.t); const d = norm(p.d);
      let s = 0;
      qs.forEach((w) => { if (t.includes(w)) s += 5; if (d.includes(w)) s += 2; });
      data.faqs.forEach((f) => { if (f.p === id && qs.some((w) => norm(f.q).includes(w))) s += 1; });
      return { id, s };
    }).filter((x) => x.s >= 4).sort((a, b) => b.s - a.s);
    return scored.slice(0, n);
  }

  /* ---------------- rendering ---------------- */
  const scrollEnd = () => { log.scrollTop = log.scrollHeight; };
  function renderItem(it) {
    if (it.role === 'user') {
      log.append(el('div', { class: 'axiom-msg axiom-msg--user' }, el('p', { text: it.text })));
      return;
    }
    const box = el('div', { class: 'axiom-msg axiom-msg--bot' });
    if (it.text) it.text.split('\n').forEach((line) => box.append(el('p', { text: line })));
    if (it.source) box.append(el('p', { class: 'axiom-msg__source' }, `${S('faq_source')} `, el('a', { href: page(it.source).u, text: page(it.source).t })));
    if (it.pages?.length) {
      box.append(el('ul', { class: 'axiom-cards' }, it.pages.filter(page).map((id) => el('li', {},
        el('a', { class: 'axiom-card', href: page(id).u }, el('strong', { text: page(id).t }), el('span', { text: page(id).d }), el('em', {}, S('open_page'), ' ', icon('arrow-right')))))));
    }
    if (it.links?.length) {
      box.append(el('ul', { class: 'axiom-cards' }, it.links.map((l) => el('li', {},
        el('a', { class: 'axiom-card', href: l.u }, el('strong', { text: l.t }), el('em', {}, S('open_page'), ' ', icon('arrow-right')))))));
    }
    if (it.contact) {
      const c = data.contact;
      const enquiry = page('contact-us');
      box.append(el('div', { class: 'axiom-contact' },
        el('a', { class: 'axiom-contact__btn axiom-contact__btn--primary', href: `${enquiry.u}${it.product ? `?product=${encodeURIComponent(it.product)}` : ''}#enquiry` }, icon('envelope-paper'), S('enquiry')),
        el('a', { class: 'axiom-contact__btn', href: `tel:${c.phone.replace(/\s/g, '')}` }, icon('telephone'), `${S('call')} ${c.phone}`),
        el('a', { class: 'axiom-contact__btn', href: `tel:${c.tollfree.replace(/\s/g, '')}` }, icon('headset'), `${S('tollfree')} ${c.tollfree}`),
        el('a', { class: 'axiom-contact__btn', href: `mailto:${it.email || c.email}` }, icon('envelope'), it.email || c.email)));
    }
    log.append(box);
    if (it.chips?.length && it === state.items[state.items.length - 1]) {
      log.append(el('div', { class: 'axiom-chips' }, it.chips.map((ch) => el('button', { type: 'button', class: 'axiom-chip', onclick: () => choose(ch) }, S(ch.label) || ch.text))));
    }
  }
  function renderAll() {
    log.replaceChildren();
    state.items.forEach(renderItem);
    scrollEnd();
  }
  function add(item, persist = true) {
    log.querySelectorAll('.axiom-chips').forEach((c) => c.remove()); // chips belong to the latest answer only
    state.items.push(item);
    if (persist) save();
    renderItem(item);
    scrollEnd();
  }
  async function botSay(item) {
    const typing = el('div', { class: 'axiom-typing', role: 'status' }, el('span'), el('span'), el('span'), el('em', { class: 'visually-hidden', text: S('typing') }));
    log.append(typing); scrollEnd();
    await new Promise((r) => setTimeout(r, reduce ? 150 : 550 + Math.min(700, (item.text || '').length * 4)));
    typing.remove();
    add({ role: 'bot', ...item });
  }
  const MAIN = [{ act: 'finder', label: 'quick_finder' }, { act: 'turnkey', label: 'quick_turnkey' }, { act: 'service', label: 'quick_service' },
    { act: 'catalogue', label: 'quick_catalogue' }, { act: 'careers', label: 'quick_careers' }, { act: 'human', label: 'quick_human' }];

  /* ---------------- flows ---------------- */
  function flow(act) {
    switch (act) {
      case 'welcome': return { text: S('welcome'), chips: MAIN };
      case 'finder': return { text: S('finder_q1'), chips: [{ act: 'f_in', label: 'finder_in' }, { act: 'f_out', label: 'finder_out' }, { act: 'f_new', label: 'finder_new' }] };
      case 'f_in': return { text: S('finder_q2'), chips: [{ act: 'f_single', label: 'finder_single' }, { act: 'f_tandem', label: 'finder_tandem' }] };
      case 'f_single': return { text: S('finder_result'), pages: FINDER.in_single, contact: true, product: FINDER.in_single[0], chips: [{ act: 'welcome', label: 'restart' }] };
      case 'f_tandem': return { text: S('finder_result'), pages: FINDER.in_tandem, contact: true, product: FINDER.in_tandem[0], chips: [{ act: 'welcome', label: 'restart' }] };
      case 'f_out': return { text: S('finder_result'), pages: FINDER.out, contact: true, product: FINDER.out[0], chips: [{ act: 'welcome', label: 'restart' }] };
      case 'f_new': return { text: S('finder_result'), pages: FINDER.new, contact: true, chips: [{ act: 'welcome', label: 'restart' }] };
      case 'turnkey': return { text: S('turnkey'), pages: TURNKEY, chips: [{ act: 'human', label: 'quick_human' }, { act: 'welcome', label: 'restart' }] };
      case 'service': return { text: S('service'), pages: ['service-centers', 'annual-maintenance-contract', 'spare-supply'], contact: true, chips: MAIN.filter((c) => c.act !== 'service') };
      case 'catalogue': return { text: S('catalogue'), pages: ['downloads', 'products'], chips: [{ act: 'finder', label: 'quick_finder' }, { act: 'human', label: 'quick_human' }] };
      case 'careers': return { text: S('careers'), pages: ['career'], contact: true, email: data.contact.careers_email, chips: [{ act: 'welcome', label: 'restart' }] };
      case 'human': return { text: S('human'), contact: true, chips: [{ act: 'welcome', label: 'restart' }] };
      case 'price': return { text: S('price'), contact: true, chips: [{ act: 'finder', label: 'quick_finder' }, { act: 'welcome', label: 'restart' }] };
      default: return { text: S('welcome'), chips: MAIN };
    }
  }
  function choose(ch) {
    add({ role: 'user', text: S(ch.label) });
    botSay(flow(ch.act));
  }

  function localAnswer(q) {
    const short = terms(q).length <= 2 && norm(q).split(/\s+/).length <= 4;
    if (short && hasAny(q, S('kw_greet'))) return { text: S('greet'), chips: MAIN };
    if (short && hasAny(q, S('kw_thanks'))) return { text: S('thanks'), chips: MAIN };
    if (hasAny(q, S('kw_price'))) return flow('price');
    const faq = faqMatch(q);
    if (faq) return { text: faq.a, source: faq.p, chips: [{ act: 'human', label: 'quick_human' }, { act: 'welcome', label: 'restart' }] };
    if (hasAny(q, S('kw_careers'))) return flow('careers');
    if (hasAny(q, S('kw_service'))) return flow('service');
    const hits = searchPages(q);
    const pagesAnswer = () => ({ text: S('found'), pages: hits.map((h) => h.id), chips: [{ act: 'human', label: 'quick_human' }, { act: 'welcome', label: 'restart' }] });
    // A question naming a specific page (two or more title words) is answered with that page first
    if (hits.length && hits[0].s >= 10) return pagesAnswer();
    if (hasAny(q, S('kw_catalogue'))) return flow('catalogue');
    if (hasAny(q, S('kw_finder'))) return flow('finder');
    if (hasAny(q, S('kw_turnkey'))) return flow('turnkey');
    if (hasAny(q, S('kw_human'))) return flow('human');
    if (hits.length) return pagesAnswer();
    return { text: S('none'), contact: true, chips: MAIN };
  }

  async function aiAnswer(q) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(data.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ lang: data.lang, page: location.pathname, messages: state.history.slice(-10) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const out = await res.json();
      if (typeof out.reply !== 'string' || !out.reply.trim()) throw new Error('empty');
      // Only same-site links are shown
      const links = (Array.isArray(out.links) ? out.links : []).filter((l) => l && typeof l.u === 'string' && /^\/[\w\-/]*$/.test(l.u) && typeof l.t === 'string').slice(0, 4);
      return { text: out.reply.slice(0, 2000), links, handover: Boolean(out.handover) };
    } finally {
      clearTimeout(timer);
    }
  }

  async function ask(q) {
    q = q.trim().slice(0, 500);
    if (!q) return;
    add({ role: 'user', text: q });
    state.history.push({ role: 'user', content: q });
    let answer;
    if (data.endpoint) {
      try {
        const ai = await aiAnswer(q);
        answer = { text: ai.text, links: ai.links, contact: ai.handover, chips: [{ act: 'human', label: 'quick_human' }] };
      } catch {
        const local = localAnswer(q);
        answer = { ...local, text: `${S('ai_unavailable')}\n${local.text}` };
      }
    } else {
      answer = localAnswer(q);
    }
    state.history.push({ role: 'assistant', content: answer.text });
    save();
    await botSay(answer);
  }

  /* ---------------- panel ---------------- */
  function build() {
    const restartBtn = el('button', { type: 'button', class: 'axiom-panel__icon', 'aria-label': S('restart'), title: S('restart'), onclick: () => { state.items = []; state.history = []; save(); renderAll(); botSay(flow('welcome')); } }, icon('arrow-counterclockwise'));
    const closeBtn = el('button', { type: 'button', class: 'axiom-panel__icon', 'aria-label': S('close'), title: S('close'), onclick: () => close() }, icon('x-lg'));
    log = el('div', { class: 'axiom-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
    input = el('input', { type: 'text', class: 'axiom-input', placeholder: S('placeholder'), 'aria-label': S('placeholder'), maxlength: '500', autocomplete: 'off', enterkeyhint: 'send' });
    form = el('form', { class: 'axiom-form', onsubmit: (e) => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); } },
      input, el('button', { type: 'submit', class: 'axiom-send', 'aria-label': S('send') }, icon('send-fill')));
    const privacy = el('div', { class: 'axiom-privacy__text' });
    privacy.innerHTML = S('privacy_html'); // generated at build time from HYT's own content
    consentView = el('div', { class: 'axiom-consent' },
      el('img', { class: 'axiom-consent__figure', src: '/assets/images/axiom/axiom-figure.webp', alt: '', width: '200', height: '242', loading: 'lazy' }),
      el('h3', { class: 'axiom-consent__title', text: S('privacy_title') }), privacy,
      el('button', { type: 'button', class: 'axiom-consent__btn', onclick: () => { state.consent = true; save(); showChat(); botSay(flow('welcome')); } }, S('accept')));
    chatView = el('div', { class: 'axiom-chat' }, log, form, el('p', { class: 'axiom-disclaimer', text: S('disclaimer') }));
    panel = el('section', { id: 'axiom-panel', class: 'axiom-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'axiom-title', hidden: true },
      el('div', { class: 'axiom-panel__head' },
        el('img', { class: 'axiom-panel__avatar', src: '/assets/images/axiom/axiom-avatar-96.webp', alt: '', width: '48', height: '48' }),
        el('div', { class: 'axiom-panel__who' }, el('h2', { id: 'axiom-title', text: S('name') }), el('p', {}, el('span', { class: 'axiom-dot', 'aria-hidden': 'true' }), S('role'))),
        restartBtn, closeBtn),
      consentView, chatView);
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    root.append(panel);
  }
  function showChat() {
    consentView.hidden = true; chatView.hidden = false;
    renderAll();
    setTimeout(() => input.focus(), 50);
  }

  async function ensure() {
    if (data) return;
    const res = await fetch(src, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Axiom data ${res.status}`);
    data = await res.json();
    build();
  }
  async function open(focus = true) {
    await ensure();
    panel.hidden = false;
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    try { sessionStorage.setItem('axiom-open', '1'); } catch { /* private mode */ }
    if (state.consent) {
      consentView.hidden = true; chatView.hidden = false; renderAll();
      if (!state.items.length) botSay(flow('welcome'));
      if (focus) setTimeout(() => input.focus(), 50);
    } else {
      chatView.hidden = true; consentView.hidden = false;
      if (focus) setTimeout(() => consentView.querySelector('button').focus(), 50);
    }
  }
  function close() {
    if (!panel) return;
    panel.hidden = true;
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    try { sessionStorage.setItem('axiom-open', '0'); } catch { /* private mode */ }
    launcher.focus();
  }
  return { open, close, toggle: () => (panel && !panel.hidden ? close() : open()) };
}

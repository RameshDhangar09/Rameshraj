/**
 * Form validation and submission.
 *
 * SECURITY: this file never contains credentials. Forms post to the endpoint
 * written into the form's `action` attribute at build time (src/config.json →
 * "form_endpoint"): a form-handling service or your own serverless function,
 * which must validate again server-side, apply spam protection and rate
 * limiting, and deliver the message to digitalmkt@hytengineering.com.
 * See docs/forms-integration.md.
 *
 * Success is only reported when the endpoint answers with a 2xx response.
 */
import { t } from './i18n.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()./-]{7,20}$/;
const CLIENT_RATE_MS = 30_000;

export function initForms(strings) {
  const forms = document.querySelectorAll('form[data-form]');
  if (!forms.length) return;
  prefillProduct();

  forms.forEach((form) => {
    const started = form.querySelector('[data-started-at]');
    if (started) started.value = String(Date.now());
    const summary = form.querySelector('[data-form-summary]');
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[data-submit]');

    const fields = [...form.querySelectorAll('input, select, textarea')].filter(
      (el) => el.type !== 'hidden' && el.name !== '_gotcha' && !el.closest('.cf-turnstile'),
    );

    const validateField = (el) => {
      const msg = check(el, strings);
      const err = form.querySelector(`[data-error-for="${el.id}"]`);
      el.classList.toggle('is-invalid', Boolean(msg));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
      return !msg;
    };

    fields.forEach((el) => {
      el.addEventListener('blur', () => { if (el.value || el.classList.contains('is-invalid')) validateField(el); });
      el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) validateField(el); });
      el.addEventListener('change', () => { if (el.type === 'checkbox' || el.type === 'file') validateField(el); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus(status, '', '');
      const invalid = fields.filter((el) => !validateField(el));
      if (invalid.length) {
        summary.hidden = false;
        summary.textContent = t(strings, 'form.errors.summary');
        invalid[0].focus();
        return;
      }
      summary.hidden = true;

      // Honeypot filled → silently stop (bots get no signal)
      if (form.querySelector('[name="_gotcha"]')?.value) return;

      const last = Number(sessionStorageGet(`hyt-form-${form.dataset.form}`) || 0);
      if (Date.now() - last < CLIENT_RATE_MS) {
        setStatus(status, 'error', t(strings, 'form.status.rate_limited'));
        return;
      }

      const endpoint = form.getAttribute('action');
      const isCatalogue = form.dataset.form === 'catalogue';
      const file = form.querySelector('[data-catalogue-file]')?.value || '';
      const thankYou = (sent) => {
        const q = new URLSearchParams({ form: form.dataset.form });
        if (isCatalogue && file) q.set('file', file);
        if (!sent) q.set('sent', '0');
        return `${form.dataset.thankYou}?${q}`;
      };
      if (!endpoint || endpoint === '#' || endpoint === location.pathname) {
        if (isCatalogue) {
          // Preview without a form service: be honest, but still provide the download
          setStatus(status, 'info', form.dataset.notConfiguredMsg || t(strings, 'form.status.not_configured'));
          setTimeout(() => window.location.assign(thankYou(false)), 2200);
          return;
        }
        setStatus(status, 'info', t(strings, 'form.status.not_configured'));
        return;
      }

      submit.classList.add('is-loading');
      submit.disabled = true;
      setStatus(status, '', t(strings, 'form.status.sending'));
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (res.status === 429) throw Object.assign(new Error('rate'), { rate: true });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        sessionStorageSet(`hyt-form-${form.dataset.form}`, String(Date.now()));
        setStatus(status, 'success', t(strings, 'form.status.success'));
        form.reset();
        if (form.dataset.thankYou) window.location.assign(thankYou(true));
      } catch (err) {
        setStatus(status, 'error', t(strings, err.rate ? 'form.status.rate_limited' : 'form.status.error'));
      } finally {
        submit.classList.remove('is-loading');
        submit.disabled = false;
      }
    });
  });
}

function check(el, strings) {
  const v = (el.value || '').trim();
  if (el.type === 'checkbox') return el.required && !el.checked ? t(strings, 'form.errors.privacy') : '';
  if (el.type === 'file') {
    const f = el.files && el.files[0];
    if (!f) return el.required ? t(strings, 'form.errors.required') : '';
    if (!/\.pdf$/i.test(f.name)) return t(strings, 'form.errors.file_type');
    if (f.size > Number(el.dataset.maxSize || 5242880)) return t(strings, 'form.errors.file_size');
    return '';
  }
  if (el.required && !v) return t(strings, 'form.errors.required');
  if (!v) return '';
  if (el.type === 'email' && !EMAIL.test(v)) return t(strings, 'form.errors.email');
  if (el.dataset.validate === 'phone' && !PHONE.test(v)) return t(strings, 'form.errors.phone');
  if (el.type === 'url' && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v)) return t(strings, 'form.errors.url');
  if (el.minLength > 0 && v.length < el.minLength) return t(strings, 'form.errors.min_message');
  return '';
}

function setStatus(el, kind, msg) {
  if (!el) return;
  el.className = `form-status${kind ? ` is-${kind}` : ''}`;
  el.textContent = msg;
}

/** /contact-us/?product=<page-id> pre-selects the product of interest. */
function prefillProduct() {
  const product = new URLSearchParams(location.search).get('product');
  if (!product) return;
  document.querySelectorAll('select[data-prefill-product]').forEach((sel) => {
    const opt = [...sel.options].find((o) => o.value === product || o.textContent.trim() === product);
    if (opt) {
      sel.value = opt.value;
      const subject = sel.form?.querySelector('[name="subject"]');
      if (subject && !subject.value) subject.value = opt.textContent.trim();
    }
  });
}

function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } }

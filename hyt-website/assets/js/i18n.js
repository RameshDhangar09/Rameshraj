/**
 * Localised UI strings. The build writes /translations/<code>.json from the
 * same source files that produce the HTML, so the interface and the page
 * content can never drift apart. Falls back to English defaults if the file
 * cannot be fetched (e.g. when a page is opened from disk).
 */
const FALLBACK = {
  form: {
    errors: {
      required: 'This field is required.',
      email: 'Please enter a valid email address.',
      phone: 'Please enter a valid phone number, including the country code.',
      min_message: 'Please write at least 20 characters so we can help.',
      privacy: 'Please accept the privacy statement to continue.',
      file_type: 'Please upload a PDF file.',
      file_size: 'The file is larger than 5 MB.',
      url: 'Please enter a valid web address starting with https://',
      summary: 'Please correct the highlighted fields.',
    },
    status: {
      sending: 'Sending your details…',
      success: 'Thank you – your submission was received.',
      error: 'Sorry, your submission could not be sent. Please try again or email info@hytengineering.com.',
      not_configured: 'Online submission is not active yet. Please email info@hytengineering.com – your message has not been sent.',
      rate_limited: 'Too many attempts. Please wait a minute and try again.',
    },
  },
  categories: { showing: 'Showing', products_word: 'products', no_results: 'No products match this filter.' },
  gallery: { counter: '{current} of {total}' },
  menu: { open: 'Open menu', close: 'Close menu' },
};

function merge(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base[k] || {}, v) : v;
  }
  return out;
}

export async function loadStrings(code) {
  const file = code === 'en' ? 'en' : code;
  try {
    const res = await fetch(`/translations/${file}.json`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(res.status);
    return merge(FALLBACK, await res.json());
  } catch {
    return FALLBACK;
  }
}

/** Read a dotted key, e.g. t(strings, 'form.errors.email') */
export function t(strings, key, vars = {}) {
  const val = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), strings);
  if (typeof val !== 'string') return key;
  return val.replace(/\{(\w+)\}/g, (_, v) => (vars[v] !== undefined ? vars[v] : `{${v}}`));
}

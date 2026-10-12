# Link, page and functional QA

Tests were run on the generated site served locally (`python3 -m http.server`)
with headless Chromium (Playwright) in the build environment. Results are for
the preview build of 12 October 2026. **No production scores are claimed** –
repeat the go-live checks on the real host.

## Automated checks – results

| Check | Tool | Result |
|-------|------|--------|
| 444 HTML pages generated (74 × 6) | `src/build.py` | ✅ 444 pages, 0 build warnings, 0 English fall-backs |
| Translation structure (44 files) | `src/check_translation.py` | ✅ all OK |
| Internal links, anchors, images, scripts, styles, downloads resolve | `tools/qa_check.py` | ✅ 0 errors |
| Every page: correct `lang`, one `<h1>`, no duplicate ids, all images have `alt` | `tools/qa_check.py` | ✅ |
| Self-canonical per language; 7 reciprocal hreflang links (6 + x-default) | `tools/qa_check.py` | ✅ |
| Unique `<title>` and meta description within each language | `tools/qa_check.py` | ✅ |
| Redirect sources are not published as pages | `tools/qa_check.py` | ✅ |
| `sitemap.xml` – 432 URLs (72 indexable pages × 6) with hreflang alternates; thank-you and 404 excluded | build | ✅ |
| Accessibility – axe-core 4.10 (WCAG 2.1 A/AA + best practice) on 14 representative pages in 3 languages | axe-core | ✅ 0 violations (after fixing orange-text contrast) |
| No horizontal scrolling at 390 px on 8 templates | Playwright | ✅ |
| Desktop menu labels fit on one line at 1200 px in all languages | Playwright | ✅ |
| Console errors / uncaught exceptions | Playwright | ✅ none (CDN blocked in the sandbox → local Bootstrap fallback loaded correctly) |
| Layout shift (CLS) on home and product pages | Chromium Performance API | ✅ 0 |
| Page weight, home (uncompressed, local) | Chromium | HTML 53 KB · CSS 370 KB (Bootstrap 230 KB + icons 86 KB; ≈45 KB gzipped) · fonts 238 KB · JS 29 KB · images 105–206 KB |

## Interaction tests (Playwright) – results

| Test | Result |
|------|--------|
| `/products/#depot-workshop-equipment` opens with only that family visible; "All" shows 4 families / 17 products | ✅ |
| FAQ accordion: first open, others collapsed; click toggles; `aria-expanded` correct | ✅ |
| Gallery lightbox opens, arrow keys navigate, Escape closes and returns focus | ✅ |
| Product "Enquire" button → `/contact-us/?product=<id>#enquiry`; product pre-selected and subject pre-filled | ✅ |
| Language switcher opens by click/keyboard; every link points to the equivalent page | ✅ |
| Empty form submit → error summary, `aria-invalid` on each required field | ✅ |
| Valid submit with no endpoint configured → honest "not active yet – not sent" message | ✅ |
| Mocked endpoint HTTP 500 → localised error (German tested); HTTP 200 → localised `/thank-you/` | ✅ |
| Mega menu opens with Enter on its toggle, closes with Escape | ✅ |
| Mobile off-canvas menu opens, submenus expand, focus is trapped, Escape closes | ✅ |
| HTML sitemap search filters pages | ✅ |
| Content readable with JavaScript disabled (menus via hover/focus, FAQ answers visible, mobile menu as list) | ✅ by design – re-check in a real browser |

## Go-live checklist (to run on the production host)

- [ ] All 66 redirects return **301** to the right URL (`docs/redirects.md`)
- [ ] `/products` → 301 → `/products/`; `/products/index.html` → 301 → `/products/`
- [ ] Unknown URL returns **404** with the custom page; `/de-de/xyz` shows the German 404
- [ ] HTTPS enforced; non-www canonical host redirect active
- [ ] Every language home opens directly: `/`, `/de-de/`, `/fr-fr/`, `/it-it/`, `/nl-nl/`, `/en-us/`
- [ ] Each form delivers to digitalmkt@hytengineering.com in every language (see `docs/forms-integration.md`)
- [ ] Catalogue PDF downloads from Downloads and from a product page
- [ ] Lighthouse (mobile + desktop) on Home, Products, one product, Contact – record scores here
- [ ] Google Rich Results Test on a product page (Product, BreadcrumbList, FAQPage)
- [ ] Search Console: submit sitemap.xml; check hreflang report after indexing
- [ ] Screen reader smoke test (NVDA/VoiceOver): menu, language switcher, form errors
- [ ] Real devices: iPhone Safari, Android Chrome, iPad, desktop Chrome/Edge/Firefox/Safari
- [ ] Build with `--production` (review notes hidden) and replace sample images/catalogue

## Re-run locally

```bash
python3 src/build.py
python3 tools/qa_check.py
for l in de-de fr-fr it-it nl-nl; do python3 src/check_translation.py $l; done
```

# HYT Engineering – multilingual corporate website

Static, six-language website for **HYT Engineering Company Pvt. Ltd.** (railway
machine tools, CNC wheel lathes, wheel & axle shop machines, turnkey workshop
projects and after-sales services).

* **Deployable site:** [`hyt-website/`](hyt-website/) – plain HTML5, CSS3, ES-module JavaScript, Bootstrap 5.3 CSS. No PHP, no Node.js runtime, no database.
* **Pages:** 73 pages from `HYT_Website_Sitemap_and_Page_Hierarchy_v2.xlsx` × 6 languages = **438 HTML pages** (the workbook's 74 rows minus the Annual Return page, removed at HYT's request on 14 Oct 2026).
* **Languages:** `/` English (Global) · `/de-de/` Deutsch · `/fr-fr/` Français · `/it-it/` Italiano · `/nl-nl/` Nederlands · `/en-us/` English (North America).

> **Status: pre-launch build.** Images and the catalogue are clearly labelled
> sample material. Items that need HYT input are listed in
> [`docs/outstanding-items.md`](docs/outstanding-items.md) and shown on the
> preview site as yellow "Content pending HYT approval" notes (hidden by
> `python3 src/build.py --production`).

---

## 1. Preview locally

**No Python needed (Windows):** double-click `start-website.bat` in the project
folder. It starts a small preview server (PowerShell, built into Windows) and
opens http://localhost:8080/ in your browser. Close the window to stop it.

**Visual Studio Code:** open the project folder, install the recommended
**Live Server** extension (VS Code offers it automatically), then click
**Go Live** in the status bar. The included `.vscode/settings.json` already sets
the web root to `hyt-website/`, so the site opens at http://127.0.0.1:5500/.

**With Python 3:**

```bash
cd hyt-website
python3 -m http.server 8080
# open http://localhost:8080/  (and /de-de/, /fr-fr/, /it-it/, /nl-nl/, /en-us/)
```

Python is only needed to *rebuild* pages after editing the JSON content – not to preview.
Use a local web server rather than opening files directly: root-relative links
(`/products/`) and ES modules need `http://`. Any static server works
(`npx serve hyt-website`, VS Code Live Server, Apache, nginx).

## 2. Edit content and rebuild

All page text lives in JSON, one folder per language:

```
src/
├── registry.py            page list, URLs, hierarchy, menus, redirects (from the workbook)
├── config.json            domain, form endpoint, CDN URLs, catalogue path
├── content/en/*.json      English master copy (British spelling)
├── content/de-de/*.json   German   ┐
├── content/fr-fr/*.json   French   │ translations – same structure as English
├── content/it-it/*.json   Italian  │ (validate with src/check_translation.py)
├── content/nl-nl/*.json   Dutch    ┘
├── en_us.py               derives en-US spelling from the English master
├── build.py               static generator (Python 3.9+, standard library only)
├── CONTENT-SCHEMA.md      block types and fields
├── WRITING-BRIEF.md       tone and accuracy rules for writers
└── TRANSLATION-BRIEF.md   terminology and rules for translators
```

```bash
python3 src/build.py                 # preview build (shows review notes)
python3 src/build.py --production    # launch build (hides review notes and the sample-material footer line)
python3 src/check_translation.py de-de   # validate a translation against English
python3 tools/qa_check.py            # link/anchor/asset/hreflang/metadata QA
```

**Template strategy.** Shared components (header, mega menu, footer, language
switcher, breadcrumbs, product template, forms) are defined once in
`src/build.py`; content is data. The build writes genuine, complete HTML for
every page – no page depends on JavaScript to render its content, and every
language folder can be opened directly. If a translated page is missing, the
build falls back to English for that page and prints a warning, so a language
folder is never empty or broken.

**North American English.** `/en-us/` is generated from the English master with
`src/en_us.py` (organisation → organization, centre → center, tyre → tire,
defence → defense, enquiry → inquiry …). No North American office, address or
phone number exists or is implied. To hand-edit a page for en-US, copy its file
into `src/content/en-us/` – it then overrides the derived version.

**URL policy.** URL slugs are identical in all languages (`/de-de/products/`,
`/fr-fr/products/` …), exactly as approved in the workbook, so the language
switcher always lands on the equivalent page.

## 3. Deploy

Upload the **contents** of `hyt-website/` to the web root.

| Host | Redirects & 404 | Notes |
|------|-----------------|-------|
| Apache / cPanel (typical Indian hosting) | `hyt-website/.htaccess` (generated) | 66 permanent 301s (10 workbook redirects + `/installation-and-commissioning/`, × 6 language folders), `/index.html` → `/`, trailing slashes, per-language 404 pages, security headers, caching, compression. Uncomment the HTTPS/non-www block once TLS is active. |
| Netlify / Cloudflare Pages | `hyt-website/_redirects` (generated) | Same 301s + per-language 404s. |
| nginx | `deploy/nginx-hyt.conf` (generated) | Paste into the server block. |

JavaScript redirects are **not** used: 301s must be issued by the server. After
deployment, verify each one with `curl -I https://hytengineering.com/epc-project/`
(expect `301` and `Location: …/turnkey-project/`). See `docs/redirects.md`.

Then submit `https://hytengineering.com/sitemap.xml` in Google Search Console
and Bing Webmaster Tools.

## 4. Features added after the first review

| Feature | How it works | Where to change it |
|---------|--------------|--------------------|
| **Graphite grey palette** | Navy was replaced by graphite grey (`--hyt-graphite #2E3338`, `--hyt-dark #1F2326`) at HYT's request; orange stays the accent | `hyt-website/assets/css/style.css` → `:root` tokens |
| **Smooth scrolling** | Lenis 1.1.20 (vendored in `assets/vendor/lenis/`) on mouse/trackpad devices; native scrolling on touch devices and for reduced-motion users. The sticky header now slides instead of changing height, so the page never jumps | `assets/js/scroll.js` |
| **Mega menu** | Full-width panels with intro text, link hover states, a feature card per menu and category images + catalogue/contact actions for Products | `src/registry.py` → `MENU` (`feature` = page shown as the card) |
| **Animations** | Scroll reveals, image wipe reveals, stat count-ups, eyebrow/step line draw-ins, icon pops, hero drift and parallax, button sheen, scroll progress bar – all disabled for `prefers-reduced-motion` | `assets/css/animations.css`, `assets/js/animations.js` |
| **Customer logo carousel** | Infinite marquee on the home page with pause button; pauses on hover/focus | Logos: `assets/images/clients/*.svg` (**placeholders** – replace with approved logos, same filenames); list: `src/registry.py` → `CLIENTS` |
| **Product video** | Every product page has a "See the machine in action" section (also in the page sub-navigation). Self-hosted MP4/WebM via `<video>`, or YouTube via a click-to-load facade on youtube-nocookie.com (no YouTube request until play) | `src/videos.json` – per product or `default`. Sample clip: `assets/videos/hyt-sample-machine-video.webm` (regenerate: `node tools/video/record.js`) |
| **Catalogue download form** | Every "Download catalogue" button opens a short form (name, company, email, phone, country, consent). After a confirmed submission the visitor lands on the localised thank-you page and the PDF downloads automatically. Without JavaScript the button is a direct PDF link. In preview (no form endpoint) the form says honestly that details were **not sent** and still provides the download | `assets/js/catalogue.js`, `assets/js/forms.js`; only PDFs under `/assets/documents/` can be served by the thank-you page |

## 5. Forms

Forms are fully built and validated in the browser, but **email delivery needs a
secure backend** (no credentials are ever placed in front-end code). Until
`form_endpoint` is set in `src/config.json`, forms tell the visitor that online
submission is not active yet and that nothing was sent. Full instructions and a
ready reference handler: [`docs/forms-integration.md`](docs/forms-integration.md),
[`integrations/`](integrations/).

## 6. Front-end architecture

```
hyt-website/
├── index.html, 404.html, sitemap.xml, robots.txt, .htaccess, _redirects
├── <page>/index.html … (73 pages)        English (Global)
├── de-de/ fr-fr/ it-it/ nl-nl/ en-us/    the same 73 pages per language
├── translations/{en,de-de,fr-fr,it-it,nl-nl,en-us}.json   UI strings loaded by JS
└── assets/
    ├── css/style.css          design tokens (CSS custom properties) + components
    ├── css/animations.css     reveal/hero motion, prefers-reduced-motion
    ├── css/responsive.css     breakpoints, desktop mega menu, mobile off-canvas
    ├── js/main.js             ES-module entry; each feature fails independently
    ├── js/navigation.js       sticky header, accessible mega menu, off-canvas, scroll-spy
    ├── js/language-switcher.js  disclosure menu; keeps #anchor and ?product=
    ├── js/animations.js       IntersectionObserver reveals
    ├── js/products.js         product family filter (+ #hash deep links)
    ├── js/forms.js            validation, honeypot, throttling, honest status
    ├── js/accordion.js, gallery.js, carousel.js, search.js, i18n.js
    ├── vendor/                local fallbacks for Bootstrap 5.3.3 CSS & Bootstrap Icons 1.11.3
    ├── fonts/                 self-hosted Inter & Barlow (SIL OFL; no Google Fonts request – GDPR-friendly)
    ├── images/                logo (vector, recreated from the supplied PNG) + sample illustrations
    └── documents/catalogue/   sample catalogue PDF
```

* **CDN:** Bootstrap CSS and Bootstrap Icons load from jsDelivr with pinned
  versions and SRI hashes; if the CDN fails, the local copies in
  `assets/vendor/` load automatically (`onerror` fallback). Bootstrap's
  JavaScript bundle is not needed – all interaction is lightweight vanilla JS.
* **Progressive enhancement:** without JavaScript, menus open on hover/focus,
  the mobile menu shows as a list, FAQ answers are visible, galleries link to
  full images and all content is readable. Reveal animations only hide content
  after `animations.js` has started, and never for `prefers-reduced-motion`.
* **SEO:** unique titles/descriptions, self-canonicals per language, reciprocal
  hreflang (6 + x-default), Open Graph, JSON-LD (Organization, WebSite,
  BreadcrumbList, Product, FAQPage), XML sitemap with hreflang alternates,
  `robots.txt`, `noindex` on thank-you and 404 pages.

## 7. Documentation

| File | Purpose |
|------|---------|
| [`docs/outstanding-items.md`](docs/outstanding-items.md) | Everything HYT must supply or decide before launch (content, workbook REVIEW items, configuration) |
| [`docs/verified-facts.md`](docs/verified-facts.md) | The only company facts used in the copy, with sources |
| [`docs/image-inventory.md`](docs/image-inventory.md) | Every sample image, where it appears, replacement spec |
| [`docs/translation-checklist.md`](docs/translation-checklist.md) | Translation status and native-speaker review checklist |
| [`docs/qa-checklist.md`](docs/qa-checklist.md) | Link/page QA results and the go-live test plan |
| [`docs/redirects.md`](docs/redirects.md) | Redirect map and verification commands |
| [`docs/forms-integration.md`](docs/forms-integration.md) | Secure form delivery to digitalmkt@hytengineering.com |
| [`docs/sitemap-audit.md`](docs/sitemap-audit.md) | Workbook analysis: pages, URLs, REVIEW items and how each was implemented |

## 8. Licences

Bootstrap, Bootstrap Icons and Lenis (MIT), Inter and Barlow fonts (SIL Open Font
Licence) – licence files are next to the vendored copies. Sample illustrations
were generated for this project (`tools/image-generator/`) and carry a
"SAMPLE IMAGE" label.

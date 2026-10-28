# HYT website – content schema (for writers and translators)

All visible text lives in `src/content/<lang>/*.json`. The build script
(`src/build.py`) combines it with the page registry (`src/registry.py`) and
writes static HTML into `hyt-website/`. Never put HTML in content strings.

## Files

| File | Contains |
|------|----------|
| `common.json` | navigation headings, UI labels, form labels and messages, footer, contact details, product category names |
| `home.json`, `about.json`, `products.json`, `projects.json`, `services.json`, `industries.json`, `media.json`, `work.json`, `legal.json` | `{"pages": {"<page-id>": {...}}}` – one object per page id from `registry.py` |

## Page object

```json
{
  "nav": "Short label used in menus, breadcrumbs and cards",
  "title": "Title tag text (max ~55 chars; ' | HYT Engineering' is appended automatically)",
  "description": "Meta description, 140–160 characters, unique per page",
  "eyebrow": "Small label above the H1 (optional)",
  "h1": "Page heading",
  "lede": "One or two sentences shown in the hero",
  "summary": "One or two sentences used on cards that link to this page",
  "blocks": [ ...see below... ]
}
```

## Inline formatting inside strings

* `**bold**`
* Internal link: `[link text](page:<page-id>)` or `[text](page:<page-id>#anchor)` – the build turns it into the right URL for each language. Translators translate the link text only and keep `page:<page-id>` unchanged.
* External link: `[text](https://example.com)`.

## Block types (`"type"` field)

Keys not listed as text (`type`, `id`, `icon`, `image`, `page`, `pages`, `href`, `file`, `layout`, `cols`, `variant`, `form`, `value` when numeric, `anchor`, `products`, `status_key`) are structural: **translators must not change them**.

| type | fields |
|------|--------|
| `text` | `eyebrow`, `heading`, `paragraphs` [str], `bullets` [str] (opt), `image` (opt, e.g. `products/wheel-press`), `image_alt`, `layout` (`image-right` default, `image-left`), `id` (opt anchor) |
| `features` | `eyebrow`, `heading`, `intro`, `cols` (2/3/4), `items` [{`icon` (Bootstrap Icons name without `bi-`), `title`, `text`}] |
| `specs` | `heading`, `intro`, `columns` [str] (first = "Parameter"), `rows` [[str,...]], `note` |
| `table` | same as `specs` but generic (comparisons) |
| `steps` | `eyebrow`, `heading`, `intro`, `items` [{`title`, `text`}] |
| `list` | `heading`, `intro`, `cols` (1/2), `items` [str] |
| `cards` | `eyebrow`, `heading`, `intro`, `cols`, `items` [{`page` (page id) **or** `href`, `title` (opt – defaults to page nav label), `text` (opt – defaults to page summary), `image` (opt), `icon` (opt), `anchor` (opt)}] |
| `related` | `heading`, `pages` [page ids] – image cards built from each page's `nav`/`summary`/image |
| `faq` | `heading`, `items` [{`q`, `a`}] |
| `stats` | `items` [{`value`, `label`}] |
| `cta` | `heading`, `text`, `primary` {`label`, `page`, `anchor`?}, `secondary` {...} (opt), `variant` (`navy` default / `light`) |
| `gallery` | `heading`, `items` [{`image`, `caption`}] |
| `timeline` | `heading`, `intro`, `items` [{`year`, `title`, `text`}] |
| `projects` | `heading`, `intro`, `items` [{`id` (anchor), `title`, `client`, `location`, `status_key` (`executed`/`under-execution`/`solution`), `image`, `scope` [str], `text`, `products` [page ids]}] |
| `news` | `heading`, `items` [{`title`, `date` (free text), `category`, `text`, `page` (opt)}] |
| `logos` | `heading`, `intro`, `items` [{`name`, `note`}] – text tiles (no third-party logos) |
| `notice` | `variant` (`info`/`review`), `text` – visible note, e.g. content awaiting approval |
| `prose` | `updated`, `sections` [{`heading`, `paragraphs` [str], `bullets` [str]}] – legal / policy text |
| `downloads` | `heading`, `items` [{`title`, `text`, `file`, `meta`}] |
| `form` | `form` (`enquiry` / `supplier` / `career` / `catalogue`), `heading`, `intro` |
| `contact` | `heading` – renders the contact-detail cards from `common.json` |
| `product_catalog` | `heading`, `intro` – the filterable product hub (structure from registry) |
| `sitemap` | `heading` – HTML sitemap tree with search |
| `split_cta` | `items` [{`heading`, `text`, `label`, `page`, `icon`}] – 2–3 side-by-side action panels |

### Optional on any block
* `link` {`label`, `page`, `anchor`?} – a text link shown under the block.
* `id` – HTML anchor for the section.
* `eyebrow` – small label above the heading.
* `news` also accepts `limit` (number of items shown).

### Product pages (`template: product`)
Product pages automatically get: breadcrumb, product hero with model code,
catalogue download panel, related machines and an enquiry CTA that pre-fills
the contact form. Their `blocks` should follow this order (omit any section
that would only be filler):
1. `text` – introduction / about the machine (id `overview`)
2. `features` – key advantages (id `advantages`)
3. `specs` – technical specifications (id `specifications`)
4. `steps` – machining process / operating principle (id `process`)
5. `list` – main features (id `features`)
6. `features` or `list` – customer applications (id `applications`)
7. `text` – service & support (id `support`)
8. `gallery` – project photographs (id `gallery`)
9. `faq` (id `faq`)
Products also carry `"related": [page ids]`.

## Accuracy rules

* Never invent statistics, customers, projects, awards, certifications or specifications.
* Verified facts that may be used are listed in `docs/verified-facts.md`.
* When a value is not verified, write "On request" (or the translation) in spec tables and describe capability qualitatively in prose.
* Keep machine model codes (YUL-08, YUL-12T, YPL-02, YSL-08 …), units, ISO standard names and company names unchanged in every language.

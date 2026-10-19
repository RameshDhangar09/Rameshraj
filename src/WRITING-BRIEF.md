# Writing brief – HYT Engineering website (English master copy)

## Read first
1. `src/CONTENT-SCHEMA.md` – JSON structure and block types (follow exactly).
2. `src/registry.py` – page ids, URLs, parents, templates, default images.
3. `docs/verified-facts.md` – the ONLY company facts you may state.
4. Reference examples: `src/content/en/home.json` and the `underfloor-wheel-lathe` entry in `src/content/en/products.json`. Match their tone, depth and structure.
5. `src/content/en/common.json` – shared labels (do not duplicate).

## Voice
* Premium industrial B2B. Confident, precise, calm. Short sentences, active voice, concrete nouns. Engineers and procurement managers at railways and metros are the readers.
* British English for the global master (organisation, centre, programme, metre, tyre, defence, colour). The en-US version is derived automatically – do not write it.
* Original writing only. Do not copy or closely paraphrase text from hytengineering.com, Danobat, DMG MORI, Hegenscheidt or any other site. Explain *why things matter* (availability, safety, wheel life, cost per kilometre) rather than piling adjectives. No clichés such as "state-of-the-art", "cutting-edge", "world-class", "one-stop shop", "leverage", "synergy", "unparalleled".
* Every page needs a unique `title` (≤ 55 chars, no brand suffix), a unique `description` (140–160 chars), an `h1` that states the subject clearly, a one/two-sentence `lede`, and a card `summary`.

## Accuracy (critical)
* Never invent figures, customers, project names, dates, awards, certifications, staff numbers, locations or specifications. Use only `docs/verified-facts.md`.
* Where a spec is unknown write "On request" (add `*` and the standard note if it depends on gauge/configuration). Describe capability qualitatively in prose ("sized to your wheel diameters") instead of numbers.
* Where an entire page depends on facts HYT has not supplied (e.g. group company names, award list, service-centre locations, job openings), write genuinely useful framing copy and include ONE `notice` block with `"variant": "review"` stating exactly what HYT must supply. Keep it factual and short.
* The workbook flags REVIEW items (see the "Remarks" notes quoted in your task). Respect the decisions already made there (e.g. labels, URLs, contract names: use **CMC** for Comprehensive Maintenance Contract; label "Life at HYT" for /memorialization/; "Careers" for /career/; "Training" not "Trainings"; "Rail cum Road Vehicle (Shunter)" everywhere).

## Mechanics
* Internal links: `[text](page:<id>)` or `[text](page:<id>#anchor)` – use them generously but naturally to cross-link related pages (products ↔ services ↔ industries ↔ projects).
* Images: use only names that exist in this list (folder/name, no extension):
  homepage/hero-wheel-lathe-workshop, homepage/engineering-technology,
  products/surface-wheel-lathe, products/underfloor-wheel-lathe-yul-08, products/underfloor-wheel-lathe-yugl, products/tandem-underfloor-wheel-lathe-yul-12t, products/tandem-underfloor-wheel-lathe-yuglx, products/portal-wheel-lathe, products/roller-type-portal-wheel-lathe, products/vertical-turning-boring-machine, products/axle-journal-turning-burnishing-lathe, products/axle-turning-lathe, products/wheel-press, products/wheel-measuring-station, products/dynamic-wheel-balancing-machine, products/multi-purpose-armature-machine, products/automated-train-washing-plant, products/rail-cum-road-vehicle-shunter, products/skc-partner-products, products/wheelset-profile-closeup,
  projects/railway-wheel-shop, projects/metro-depot, projects/emu-car-shed, projects/wheel-shop-automation-line, projects/installation-commissioning, projects/pit-foundation-civil-works,
  industries/railways, industries/metros, industries/rolling-stock-manufacturers, industries/defence, industries/heavy-engineering,
  company/manufacturing-facility, company/engineering-design, company/quality-inspection, company/training-session, company/service-maintenance, company/spare-parts, company/exhibition-stand, company/csr-community, company/life-at-hyt, company/corporate-office
  Every `image` needs an `image_alt` (on text blocks) or `caption` (gallery) that starts "Sample illustration of …" because current images are illustrations.
* Icons: Bootstrap Icons names without the `bi-` prefix. Check each one exists: `grep -c '\.bi-NAME::before' hyt-website/assets/vendor/bootstrap-icons/bootstrap-icons.min.css` must be ≥ 1.
* Validate your JSON with `python3 -c "import json;json.load(open('FILE'))"` and check every page id you link to exists in `registry.py`.
* Do not edit files other than the ones assigned to you. Do not run git commands.
* Length guide: hub pages 500–800 words; product and service pages 600–1,000 words; legal pages complete and practical; small pages at least 250 words. Quality beats length – no filler sections.

# Translation checklist

| Version | Folder | `lang` | Source files | Status | Validator |
|---------|--------|--------|--------------|--------|-----------|
| English (Global) | `/` | `en` | `src/content/en/` (master, British spelling) | ✅ complete – 79 pages | – |
| Deutsch | `/de-de/` | `de-DE` | `src/content/de-de/` (12 files) | ✅ complete – 79 pages | ✅ `check_translation.py de-de` |
| Français | `/fr-fr/` | `fr-FR` | `src/content/fr-fr/` (12 files) | ✅ complete – 79 pages | ✅ |
| Italiano | `/it-it/` | `it-IT` | `src/content/it-it/` (12 files) | ✅ complete – 79 pages | ✅ |
| Nederlands | `/nl-nl/` | `nl-NL` | `src/content/nl-nl/` (12 files) | ✅ complete – 79 pages | ✅ |
| English (North America) | `/en-us/` | `en-US` | derived by `src/en_us.py` | ✅ complete – 79 pages | – |

Scope translated in every language: navigation, menu headings, page titles and
H1s, body copy, product descriptions, specification labels, project and
industry pages, services, FAQs, forms (labels, options, validation and status
messages), CTAs, catalogue labels, footer, privacy/cookie/legal texts,
breadcrumbs, accessibility labels (ARIA, skip link, carousel/lightbox
controls), SEO titles and meta descriptions, country list.

`python3 src/check_translation.py <lang>` verifies for every file: identical
JSON structure, unchanged structural values (page ids, anchors, images, icons),
identical internal link targets, preserved model codes. Strings that remain
identical to English are listed for review – they are organisation names,
addresses, phone numbers, ISO lines and spec values such as "4 × 15 kW".

## Terminology used

| English | Deutsch | Français | Italiano | Nederlands |
|---------|---------|----------|----------|------------|
| Wheel lathe | Radsatzdrehmaschine | Tour à roues | Tornio per sale montate | Wielenbank |
| Underfloor wheel lathe | Unterflur-Radsatzdrehmaschine | Tour en fosse | Tornio in fossa (sottocassa) | Onderloopdraaibank |
| Surface wheel lathe | Überflur-Radsatzdrehmaschine | Tour à roues sur sol | Tornio a pavimento | Vloerwielenbank |
| Portal wheel lathe | Portal-Radsatzdrehmaschine | Tour à portique | Tornio a portale | Portaalwielenbank |
| Wheelset | Radsatz | Essieu monté | Sala montata | Wielstel |
| Re-profiling | Reprofilierung | Reprofilage | Riprofilatura | Herprofileren |
| Flange | Spurkranz | Boudin | Bordino | Flens |
| AMC | Jährlicher Wartungsvertrag (AMC) | Contrat de maintenance annuel (AMC) | Contratto di manutenzione annuale (AMC) | Jaarlijks onderhoudscontract (AMC) |
| CMC | Umfassender Wartungsvertrag (CMC) | Contrat de maintenance global (CMC) | Contratto di manutenzione completo (CMC) | Allesomvattend onderhoudscontract (CMC) |
| Commissioning | Inbetriebnahme | Mise en service | Messa in servizio | Inbedrijfstelling |
| On request | Auf Anfrage | Sur demande | Su richiesta | Op aanvraag |

Kept unchanged in all languages: model codes (YUL-08, YUL-12T, YUGL, YUGLX,
YPL-02, YPL-04, YSL-08/12/21, YVM-04, ATL-01), company and customer names,
ISO standard names, units, contact details, Indian legal references.

## en-US differences

Spelling and regional terms only (organisation → organization, centre →
center, programme → program, tyre → tire, defence → defense, catalogue →
catalog, enquiry → inquiry, metre → meter, …). URLs stay identical
(`/en-us/industries/defence/`). No North American office, phone number or
service network is stated or implied. To hand-edit an en-US page, copy its file
to `src/content/en-us/` (it overrides the derived version).

## Before launch – native-speaker review (owner: HYT marketing)

Translations were produced by specialist translation agents following
`src/TRANSLATION-BRIEF.md`; a native-speaker review by a rail/machine-tool
professional is still recommended.

- [ ] DE reviewer sign-off (focus: product names, contract terms, legal pages)
- [ ] FR reviewer sign-off (typography with narrow no-break spaces is applied)
- [ ] IT reviewer sign-off
- [ ] NL reviewer sign-off (note: both "wagons" and "goederenwagens" occur – choose one)
- [ ] en-US spot check (spelling conversions in context)
- [ ] Legal pages: confirm with counsel whether translated legal texts are binding or "English prevails" (the disclaimer currently says English prevails)
- [ ] Email subject lines quoted in the privacy policy ("Data protection") are intentionally left in English in some languages – confirm
- [ ] Re-run `python3 src/check_translation.py <lang>` after every edit; rebuild

# Translation brief – HYT Engineering website

Source: `src/content/en/<file>.json` (British English master).
Target: `src/content/<lang>/<file>.json` with **identical JSON structure**.

| Folder | Language | Register | Notes |
|--------|----------|----------|-------|
| `de-de` | German (Germany) | Formal "Sie" | Use established German rail/machine-tool terms: Radsatz, Radsatzdrehmaschine, Unterflur-Radsatzdrehmaschine, Portal-Radsatzdrehmaschine, Reprofilierung, Laufkreisdurchmesser, Spurkranz, Spurkranzhöhe/-dicke, Radscheibe, Achswelle, Achsschenkel/Lagersitz, Bremsscheibe, Instandhaltung, Betriebswerk/Werkstatt, Grube, Wartungsvertrag, Inbetriebnahme, Ersatzteile. Numbers: 1.100+, decimal comma. |
| `fr-fr` | French (France) | "vous" | Tour en fosse (tour à roues en fosse / tour sous plancher), essieu monté, reprofilage, diamètre de roulement, boudin (hauteur/épaisseur du boudin), disque de frein, fusée d'essieu, atelier de maintenance, mise en service, contrat de maintenance annuel, pièces de rechange. Numbers: 1 100+ (narrow space), decimal comma, space before : ; ? ! |
| `it-it` | Italian | "Lei"/impersonal formal | Tornio in fossa (tornio sottocassa), sala montata, riprofilatura, diametro di rotolamento, bordino, disco freno, fusello dell'asse, officina di manutenzione, messa in servizio, contratto di manutenzione annuale, ricambi. Numbers: 1.100+ |
| `nl-nl` | Dutch (Netherlands) | "u" | Onderloopdraaibank / putdraaibank (wielenbank), wielstel, herprofileren, loopcirkeldiameter, flens (flenshoogte/-dikte), remschijf, astap/lagerzitting, onderhoudswerkplaats, inbedrijfstelling, onderhoudscontract, reserveonderdelen. Numbers: 1.100+ |

## Rules
1. Translate **only text values**. Keep every key, and keep these values exactly as in English: `type`, `id`, `icon`, `image`, `page`, `pages`, `href`, `file`, `layout`, `cols`, `variant`, `form`, `anchor`, `products`, `status_key`, `related`, `limit`, `carousel`, and numeric values.
2. Inline links `[text](page:<id>#anchor)` – translate the text, never the target. Keep `**bold**` markers.
3. Never translate or alter: machine model codes (YUL-08, YUL-12T, YUGL, YUGLX, YPL-02, YPL-04, YSL-08, YSL-12, YSL-21, YVM-04, ATL-01), "HYT", "HYT Engineering Company Pvt. Ltd.", "SKC Gleittechnik", ISO standard names (ISO 9001:2015 …), "CNC", units (kW, mm, mm², kN, m/min), email addresses, phone numbers, the postal address lines, customer and organisation names (Indian Railways, Delhi Metro Rail Corporation (DMRC), National Capital Region Transport Corporation (NCRTC), State Railway of Thailand, Dun & Bradstreet …), exhibition names (Asia Pacific Rail, Middle East Rail, Africa Rail, AusRAIL), Indian legal references (Companies Act, 2013; DPDP Act 2023). Keep abbreviations AMC, CMC, O&M, MAAS, EPC, SPM and explain them in the target language where the English does (e.g. "Annual Maintenance Contract (AMC)" → "Jährlicher Wartungsvertrag (AMC)").
4. `countries` in common.json: translate country names into the target language and sort alphabetically, keeping "India" (translated) first and "Other" (translated) last.
5. Meta fields: `title` ≤ 60 characters, `description` 130–160 characters, both natural and keyword-rich in the target language (search terms buyers use there), not a word-for-word copy.
6. Write fluent, idiomatic, professional B2B copy as a native technical copywriter would – not literal machine translation. Keep the meaning and every factual limitation (e.g. "On request", review notices, "sample") precise. Do not add facts.
7. `"On request"` in spec tables → German "Auf Anfrage", French "Sur demande", Italian "Su richiesta", Dutch "Op aanvraag".
8. Legal pages (`legal.json`, code of conduct etc.): translate faithfully; keep the review notices; it is acceptable that the English version prevails (say so if the English text says so).
9. Typography: use the correct quotation marks for the language („…“ in German, « … » in French, “…” in Italian/Dutch), en dashes as in the source.
10. Validate each file you write: `python3 src/check_translation.py <lang> <file>` must report OK (it checks structure, structural values and link targets against English).

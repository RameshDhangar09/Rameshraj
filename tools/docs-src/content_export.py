"""Export the English website content, page by page in menu order, to JSON for the Word content document.

Usage: python3 tools/docs-src/content_export.py > content.json
"""
import json, re, sys, glob
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
import registry as R  # noqa: E402

C, common = {}, {}
for f in glob.glob(str(ROOT / "src/content/en/*.json")):
    d = json.load(open(f))
    if Path(f).stem == "common":
        common = d
    C.update(d.get("pages", {}))
CONFIG = json.load(open(ROOT / "src/config.json"))
PG = {p["id"]: p for p in R.P}


def t(key):
    cur = common
    for k in key.split("."):
        cur = cur.get(k, {}) if isinstance(cur, dict) else {}
    return cur if isinstance(cur, str) else key


def nav(pid):
    p = C.get(pid, {})
    return p.get("nav") or p.get("h1") or pid


def clean(s):
    """Inline markup -> plain text; **bold** is kept for the Word renderer."""
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", str(s))
    return s.strip()


def item_line(it):
    title = it.get("title") or (nav(it["page"]) if it.get("page") else "")
    text = it.get("text")
    if text is None and it.get("page"):
        text = C.get(it["page"], {}).get("summary", "")
    return f"**{clean(title)}** – {clean(text)}" if title and text else clean(title or text or "")


def block(b):
    """One website section -> list of (kind, value) elements."""
    out, typ = [], b["type"]
    if typ == "notice":
        return [("note", clean(b.get("text", "")))]
    if b.get("eyebrow"): out.append(("eyebrow", clean(b["eyebrow"])))
    if b.get("heading"): out.append(("h3", clean(b["heading"])))
    if b.get("intro"): out.append(("p", clean(b["intro"])))
    if typ == "quote_band":
        out += [("quote", clean(b.get("quote", b.get("text", "")))), ("p", "– " + clean(b.get("cite", "")))]
    for x in b.get("paragraphs", []): out.append(("p", clean(x)))
    if b.get("badge_value"): out.append(("p", f"Badge: **{b['badge_value']}** {clean(b.get('badge_label', ''))}"))
    if typ in ("text",) and b.get("text"): out.append(("p", clean(b["text"])))
    for x in b.get("bullets", []): out.append(("bullet", clean(x)))
    items = b.get("items", [])
    if typ in ("features", "benefits", "pillars", "cards", "chips"):
        out += [("bullet", item_line(it)) for it in items]
    elif typ == "related":
        out += [("bullet", item_line({"page": p})) for p in b.get("pages", [])]
    elif typ == "steps":
        out += [("bullet", f"**{i:02d}  {clean(it['title'])}** – {clean(it.get('text', ''))}") for i, it in enumerate(items, 1)]
    elif typ == "list":
        out += [("bullet", clean(x)) for x in items]
    elif typ == "faq":
        for it in items:
            out += [("q", clean(it["q"])), ("a", clean(it["a"]))]
    elif typ == "stats":
        out += [("bullet", f"**{it['value']}** – {clean(it['label'])}") for it in items]
    elif typ == "timeline":
        out += [("bullet", f"**{it['year']}** – {clean(it['title'])}: {clean(it.get('text', ''))}") for it in items]
    elif typ == "gallery":
        out += [("bullet", "Image: " + clean(it.get("caption", ""))) for it in items]
    elif typ == "facilities":
        for it in items:
            out += [("h4", clean(it["title"])), ("p", clean(it.get("text", "")))] + [("bullet", clean(x)) for x in it.get("bullets", [])]
    elif typ == "projects":
        for it in items:
            out.append(("h4", clean(it["title"])))
            for k, lab in (("client", "Client"), ("location", "Location")):
                if it.get(k): out.append(("p", f"**{lab}:** {clean(it[k])}"))
            if it.get("status_key"): out.append(("p", f"**Status:** {t('project_status.' + it['status_key'])}"))
            if it.get("text"): out.append(("p", clean(it["text"])))
            if it.get("scope"):
                out.append(("p", "**Scope of supply:**"))
                out += [("bullet", clean(x)) for x in it["scope"]]
            if isinstance(it.get("products"), list) and it["products"]:
                out.append(("p", "**Equipment:** " + ", ".join(nav(p) for p in it["products"])))
    elif typ == "news":
        for it in items:
            line = f"**{clean(it.get('title', ''))}**"
            if it.get("date"): line += f" ({it['date']})"
            out.append(("bullet", line + (" – " + clean(it["text"]) if it.get("text") else "")))
    elif typ in ("specs", "table"):
        cols = b.get("columns") or b.get("headers") or []
        rows = b.get("rows", [])
        out.append(("table", {"cols": [clean(c) for c in cols], "rows": [[clean(c) for c in r] for r in rows]}))
        if b.get("note"): out.append(("small", clean(b["note"])))
    elif typ == "prose":
        if b.get("updated"): out.append(("small", clean(b["updated"])))
        for sec in b.get("sections", []):
            if sec.get("heading"): out.append(("h4", clean(sec["heading"])))
            for x in sec.get("paragraphs", []): out.append(("p", clean(x)))
            for x in sec.get("bullets", []) + sec.get("items", []): out.append(("bullet", clean(x if isinstance(x, str) else x.get("text", ""))))
    elif typ in ("cta", "split_cta"):
        if typ == "cta" and b.get("text"): out.append(("p", clean(b["text"])))
        for k in ("primary", "secondary"):
            if b.get(k): out.append(("button", clean(b[k]["label"])))
        for it in items:
            out.append(("bullet", item_line(it)))
    elif typ == "form":
        out.append(("func", {"enquiry": "Enquiry form", "career": "Job application form (with CV upload)",
                             "supplier": "Supplier registration form"}.get(b.get("form", "enquiry"), "Form")))
    elif typ == "contact":
        out.append(("func", "Contact details block (address, telephone, toll-free, email, office hours, map link)"))
    elif typ == "downloads":
        out += [("bullet", f"Download: {clean(it.get('title', ''))}" + (f" – {clean(it['text'])}" if it.get("text") else "")) for it in items]
    elif typ == "product_catalog":
        out.append(("func", "Product catalogue with category filter (all product pages listed automatically)"))
    elif typ == "sitemap":
        out.append(("func", "Searchable list of all pages (generated automatically)"))
    elif typ in ("logo_carousel", "logos"):
        out.append(("func", "Customer logo carousel: " + ", ".join(c[1] for c in R.CLIENTS)))
    if b.get("link"): out.append(("button", clean(b["link"]["label"])))
    return out


# ----- page order: follow the menu, then the page hierarchy -----
order = []
for m in R.MENU:
    if m.get("id"): order.append(m["id"])
    for c in m["columns"]:
        for it in c["items"]:
            order.append(it[0] if isinstance(it, tuple) else it)
rank = {pid: i for i, pid in enumerate(order)}
kids = {}
for p in R.P:
    kids.setdefault(p["parent"], []).append(p)
for k in kids:
    kids[k].sort(key=lambda p: (rank.get(p["id"], 1000), p["sr"]))

pages = []


def walk(pid, depth):
    p, c = PG[pid], C.get(pid, {})
    els = []
    if pid == "home" and CONFIG.get("hero_slides"):
        labels = [t(s["label_key"]) if s.get("label_key") else nav(s["page"]) for s in CONFIG["hero_slides"]]
        els.append(("func", "Hero background video slideshow: " + " · ".join(labels)))
    for a in c.get("hero_actions", []):
        els.append(("button", clean(a["label"])))
    if pid == "home":
        els += [("button", t("buttons.explore_products")), ("button", t("buttons.discuss_requirement"))]
    for b in c.get("blocks", []):
        els.append(("section", b["type"]))
        els += block(b)
        if b.get("video", {}).get("title"):
            els.append(("func", "Video: " + clean(b["video"]["title"])))
    if p["template"] == "product":
        els += [("section", "template"), ("h3", t("product.video_heading")), ("p", t("product.video_text")),
                ("h3", t("product.catalogue_heading")), ("p", t("product.catalogue_text")), ("button", t("buttons.download_catalogue"))]
        if c.get("related"):
            els += [("h3", t("product.related_heading"))] + [("bullet", item_line({"page": r})) for r in c["related"]]
        els += [("h3", t("product.enquiry_heading")), ("p", t("product.enquiry_text")), ("button", t("buttons.enquire"))]
    pages.append({"id": pid, "depth": depth, "path": p["path"], "nav": nav(pid), "parent": nav(p["parent"]) if p["parent"] else "",
                  "template": p["template"], "title": c.get("title", ""), "description": c.get("description", ""),
                  "eyebrow": clean(c.get("eyebrow", "")), "h1": clean(c.get("h1", "")), "lede": clean(c.get("lede", "")),
                  "model": PG[pid].get("model", ""), "elements": els})
    for k in kids.get(pid, []):
        walk(k["id"], depth + 1)


walk("home", 0)
assert len(pages) == len(R.P)
f = common.get("footer", {})
shared = [("h3", "Footer"), ("p", clean(f.get("about", ""))), ("p", "**" + clean(f.get("cta_heading", "")) + "** " + clean(f.get("cta_text", ""))),
          ("p", clean(f.get("certified", ""))), ("p", clean(f.get("copyright", "")).replace("{year}", "2026")),
          ("h3", "Contact details"), ("p", " · ".join(common["contact"]["address_lines"])),
          ("p", f"Telephone {common['contact']['phone']} / {common['contact']['phone_alt']} · Toll-free {common['contact']['tollfree']} · {common['contact']['email']}"),
          ("p", clean(common["contact"]["hours"])),
          ("h3", "Catalogue download form"), ("p", clean(common["catalogue_form"]["intro"])),
          ("h3", "Form privacy consent"), ("p", clean(common["form"]["privacy"])),
          ("h3", "Top bar"), ("p", " · ".join([common["topbar"]["hours"], common["topbar"]["knowledge"], common["topbar"]["join"], common["topbar"]["next_event"], common["topbar"]["search"]]))]
json.dump({"pages": pages, "shared": shared, "tagline": common.get("tagline", "")}, sys.stdout, ensure_ascii=False, indent=1)

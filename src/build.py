#!/usr/bin/env python3
"""Static site generator for the HYT Engineering website.

    python3 src/build.py            # build all six languages into hyt-website/
    python3 src/build.py --production   # also hide internal REVIEW notices

Only the Python standard library is used. The output in hyt-website/ is plain
HTML/CSS/JS that can be uploaded to any static web host; nothing here runs on
the server. See README.md for the template strategy.
"""
import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "hyt-website"
sys.path.insert(0, str(SRC))

import registry as R  # noqa: E402
from en_us import americanize  # noqa: E402

CONFIG = json.loads((SRC / "config.json").read_text())
VIDEOS = json.loads((SRC / "videos.json").read_text())
PRODUCTION = "--production" in sys.argv
SHOW_REVIEW = CONFIG.get("show_review_notices", True) and not PRODUCTION
BASE = CONFIG["base_url"].rstrip("/")
ASSET_VERSION = date.today().strftime("%Y%m%d")
CONTENT_FILES = ["home", "about", "products", "projects", "turnkey", "services", "industries", "media", "work", "utility", "legal"]
MEDIA_IDS = {"news", "international-exhibitions", "domestic-exhibitions", "blog", "knowledge-centre", "downloads"}
WARNINGS = []

ICONS = set(re.findall(r"\.bi-([a-z0-9-]+)::before", (OUT / "assets/vendor/bootstrap-icons/bootstrap-icons.min.css").read_text()))


def warn(msg):
    WARNINGS.append(msg)


# --------------------------------------------------------------------------
# Content loading
# --------------------------------------------------------------------------
def load_lang(code):
    """Return (common, pages) for a language, falling back to English per page."""
    en_dir = SRC / "content" / "en"

    def read(folder, name):
        f = folder / f"{name}.json"
        return json.loads(f.read_text()) if f.exists() else None

    folder = SRC / "content" / code
    common_en = read(en_dir, "common")
    pages_en = {}
    for name in CONTENT_FILES:
        data = read(en_dir, name)
        if data:
            pages_en.update(data["pages"])

    if code == "en":
        return common_en, pages_en
    if code == "en-us":
        common = read(folder, "common") or americanize(common_en)
        pages = {}
        for name in CONTENT_FILES:
            data = read(folder, name)
            if data:
                pages.update(data["pages"])
        for pid, pdata in pages_en.items():
            pages.setdefault(pid, americanize(pdata))
        return common, pages

    common = read(folder, "common")
    if not common:
        warn(f"[{code}] common.json missing – using English")
        common = common_en
    pages = {}
    for name in CONTENT_FILES:
        data = read(folder, name)
        if data:
            pages.update(data["pages"])
    for pid, pdata in pages_en.items():
        if pid not in pages:
            warn(f"[{code}] page '{pid}' not translated – using English")
            pages[pid] = pdata
    return common, pages


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def esc(s):
    return html.escape(str(s), quote=True)


class Ctx:
    """Per-language rendering context."""

    def __init__(self, lang, common, pages):
        self.lang = lang
        self.c = common
        self.pages = pages
        self.page = None
        self.faq = []  # collected for FAQPage JSON-LD
        self.uid = 0

    def next_id(self, prefix):
        self.uid += 1
        return f"{prefix}-{self.uid}"

    def url(self, pid, anchor=None, absolute=False):
        p = R.PAGES[pid]
        path = self.lang["prefix"] + p["path"]
        if anchor:
            path += "#" + anchor
        return (BASE + path) if absolute else path

    def nav(self, pid):
        pg = self.pages.get(pid)
        if not pg:
            warn(f"[{self.lang['code']}] missing content for page '{pid}'")
            return pid
        return pg.get("nav") or pg.get("h1") or pid

    def summary(self, pid):
        pg = self.pages.get(pid, {})
        return pg.get("summary") or pg.get("lede") or ""

    def t(self, dotted, default=""):
        cur = self.c
        for part in dotted.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                warn(f"[{self.lang['code']}] missing UI string '{dotted}'")
                return default
        return cur


LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
MODEL_RE = re.compile(r"\b((?:YUL|YUGLX?|YPL|YSL|YVM|ATL)-?[0-9]*[A-Z]?)\b")


def fmt(escaped):
    """Bold markup + keep model codes such as YPL-02 on one line."""
    out = BOLD_RE.sub(r"<strong>\1</strong>", escaped)
    return MODEL_RE.sub(lambda m: f'<span class="text-nowrap">{m.group(1)}</span>' if "-" in m.group(1) else m.group(1), out)


def inline(ctx, text):
    """Escape text and convert **bold** and [links](page:id#anchor)."""
    if text is None:
        return ""
    out, pos = [], 0
    for m in LINK_RE.finditer(text):
        out.append(fmt(esc(text[pos:m.start()])))
        label, target = m.group(1), m.group(2)
        if target.startswith("page:"):
            ref = target[5:]
            pid, _, anchor = ref.partition("#")
            if pid not in R.PAGES:
                warn(f"[{ctx.lang['code']}] broken page link '{target}' on {ctx.page['id']}")
                out.append(esc(label))
            else:
                out.append(f'<a href="{esc(ctx.url(pid, anchor or None))}">{fmt(esc(label))}</a>')
        elif target.startswith("mailto:") or target.startswith("tel:"):
            out.append(f'<a href="{esc(target)}">{esc(label)}</a>')
        elif target.startswith("http"):
            out.append(f'<a href="{esc(target)}" target="_blank" rel="noopener">{esc(label)}<span class="visually-hidden"> {esc(ctx.t("a11y.opens_new_tab"))}</span></a>')
        else:
            out.append(f'<a href="{esc(target)}">{esc(label)}</a>')
        pos = m.end()
    out.append(fmt(esc(text[pos:])))
    return "".join(out)


def plain(text):
    """Strip inline markup (for meta tags and JSON-LD)."""
    if not text:
        return ""
    return BOLD_RE.sub(r"\1", LINK_RE.sub(r"\1", text))


def icon(name, extra=""):
    if not name:
        return ""
    if name not in ICONS:
        warn(f"unknown icon '{name}'")
        name = "dot"
    return f'<i class="bi bi-{name} {extra}" aria-hidden="true"></i>'


def img_exists(name, suffix=""):
    return (OUT / "assets/images" / f"{name}{suffix}.jpg").exists()


def picture(name, alt, sizes="(min-width: 992px) 50vw, 100vw", eager=False, cls="", hero=False):
    """Responsive <img> with srcset. Images are 16:10 (hero 2:1)."""
    if not name:
        return ""
    if not img_exists(name):
        warn(f"missing image {name}.jpg")
    w, h = (2400, 1200) if hero else (1600, 1000)
    small = "-1200" if hero else "-800"
    sw = 1200 if hero else 800
    src = f"/assets/images/{name}.jpg"
    srcset = f"/assets/images/{name}{small}.jpg {sw}w, {src} {w}w"
    loading = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img src="{src}" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" '
            f'alt="{esc(alt)}" {loading} decoding="async" class="{cls}">')


def heading_block(ctx, b, level=2, center=False, light=False):
    parts = []
    if b.get("eyebrow"):
        parts.append(f'<p class="eyebrow">{esc(b["eyebrow"])}</p>')
    if b.get("heading"):
        parts.append(f'<h{level} class="section-title">{inline(ctx, b["heading"])}</h{level}>')
    if b.get("intro"):
        parts.append(f'<p class="section-intro">{inline(ctx, b["intro"])}</p>')
    if not parts:
        return ""
    cls = "section-head" + (" text-center mx-auto" if center else "") + (" section-head--light" if light else "")
    return f'<div class="{cls} reveal">' + "".join(parts) + "</div>"


def block_link(ctx, b):
    lk = b.get("link")
    if not lk:
        return ""
    return (f'<p class="block-link reveal"><a class="link-arrow" href="{esc(ctx.url(lk["page"], lk.get("anchor")))}">'
            f'{esc(lk["label"])} {icon("arrow-right")}</a></p>')


def section(inner, b, cls=""):
    if not any(x in cls for x in ("muted", "cta", "stats", "navy", "form", "catalogue")):
        cls = (cls + " section--white").strip()
    sid = f' id="{esc(b["id"])}"' if b.get("id") else ""
    return f'<section class="section {cls}"{sid}><div class="container">{inner}</div></section>'


# --------------------------------------------------------------------------
# Blocks
# --------------------------------------------------------------------------
def b_text(ctx, b):
    paras = "".join(f"<p>{inline(ctx, p)}</p>" for p in b.get("paragraphs", []))
    bullets = ""
    if b.get("bullets"):
        bullets = '<ul class="check-list">' + "".join(f"<li>{inline(ctx, x)}</li>" for x in b["bullets"]) + "</ul>"
    head = ""
    if b.get("eyebrow"):
        head += f'<p class="eyebrow">{esc(b["eyebrow"])}</p>'
    if b.get("heading"):
        head += f'<h2 class="section-title">{inline(ctx, b["heading"])}</h2>'
    text = f'<div class="prose-block">{head}{paras}{bullets}{block_link(ctx, b)}</div>'
    if not b.get("image"):
        return section(f'<div class="row"><div class="col-lg-9 reveal">{text}</div></div>', b)
    img = f'<figure class="media-frame reveal">{picture(b["image"], b.get("image_alt", ""))}</figure>'
    left = b.get("layout") == "image-left"
    cols = (f'<div class="col-lg-6 {"order-lg-1" if left else "order-lg-2"}">{img}</div>'
            f'<div class="col-lg-6 {"order-lg-2" if left else "order-lg-1"} reveal">{text}</div>')
    return section(f'<div class="row align-items-center g-4 g-lg-5">{cols}</div>', b, "section--split")


def b_features(ctx, b):
    cols = int(b.get("cols", 3))
    colcls = {2: "col-md-6", 3: "col-md-6 col-lg-4", 4: "col-sm-6 col-lg-3"}.get(cols, "col-md-6 col-lg-4")
    items = "".join(
        f'<div class="{colcls}"><div class="feature reveal">{icon(it.get("icon"), "feature__icon")}'
        f'<h3 class="feature__title">{inline(ctx, it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p></div></div>'
        for it in b.get("items", []))
    return section(heading_block(ctx, b) + f'<div class="row g-4">{items}</div>' + block_link(ctx, b), b,
                   "section--muted" if b.get("variant") == "muted" else "")


def table_html(ctx, b, cls="spec-table"):
    cols = b.get("columns", [])
    head = "".join(f'<th scope="col">{esc(c)}</th>' for c in cols)
    rows = []
    for r in b.get("rows", []):
        cells = f'<th scope="row">{inline(ctx, r[0])}</th>' + "".join(f"<td>{inline(ctx, x)}</td>" for x in r[1:])
        rows.append(f"<tr>{cells}</tr>")
    cap = f'<caption class="visually-hidden">{esc(plain(b.get("heading", "")))}</caption>' if b.get("heading") else ""
    note = f'<p class="table-note">{inline(ctx, b["note"])}</p>' if b.get("note") else ""
    return (f'<div class="table-responsive table-wrap reveal" tabindex="0" role="region" aria-label="{esc(plain(b.get("heading", "")))}">'
            f'<table class="{cls}">{cap}<thead><tr>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>{note}')


def b_specs(ctx, b):
    return section(heading_block(ctx, b) + table_html(ctx, b), b, "section--muted")


def b_table(ctx, b):
    return section(heading_block(ctx, b) + table_html(ctx, b, "spec-table compare-table"), b)


def b_steps(ctx, b):
    items = "".join(
        f'<li class="step reveal"><span class="step__num" aria-hidden="true">{i:02d}</span>'
        f'<h3 class="step__title">{inline(ctx, it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p></li>'
        for i, it in enumerate(b.get("items", []), 1))
    return section(heading_block(ctx, b) + f'<ol class="steps steps--{min(len(b.get("items", [])), 6)}">{items}</ol>' + block_link(ctx, b), b,
                   "section--navy" if b.get("variant") == "navy" else "")


def b_list(ctx, b):
    cls = "check-list check-list--2" if int(b.get("cols", 1)) == 2 else "check-list"
    items = "".join(f"<li>{inline(ctx, x)}</li>" for x in b.get("items", []))
    return section(heading_block(ctx, b) + f'<ul class="{cls} reveal">{items}</ul>' + block_link(ctx, b), b)


def card_html(ctx, it, show_image=True, headtag="h3"):
    pid = it.get("page")
    href = ctx.url(pid, it.get("anchor")) if pid else it.get("href")
    title = it.get("title") or (ctx.nav(pid) if pid else "")
    text = it.get("text") if it.get("text") is not None else (ctx.summary(pid) if pid else "")
    image = it.get("image") if "image" in it else None
    media = ""
    if show_image and image:
        media = f'<div class="card-hyt__media">{picture(image, "", "(min-width: 992px) 33vw, (min-width: 576px) 50vw, 100vw")}</div>'
    ic = f'<span class="card-hyt__icon">{icon(it["icon"])}</span>' if it.get("icon") and not media else ""
    link_open = f'<a class="card-hyt__link stretched-link" href="{esc(href)}">' if href else "<span>"
    link_close = "</a>" if href else "</span>"
    more = f'<span class="card-hyt__more" aria-hidden="true">{esc(ctx.t("buttons.learn_more"))} {icon("arrow-right")}</span>' if href else ""
    return (f'<article class="card-hyt reveal">{media}<div class="card-hyt__body">{ic}'
            f'<{headtag} class="card-hyt__title">{link_open}{inline(ctx, title) if not href else fmt(esc(plain(title)))}{link_close}</{headtag}>'
            f'<p class="card-hyt__text">{esc(plain(text))}</p>{more}</div></article>')


def grid_cols(n):
    return {1: "col-12", 2: "col-md-6", 3: "col-md-6 col-lg-4", 4: "col-sm-6 col-lg-3", 5: "col-sm-6 col-lg"}.get(n, "col-md-6 col-lg-4")


def b_cards(ctx, b):
    items = b.get("items", [])
    cols = int(b.get("cols", 3))
    if b.get("carousel") or cols == 5:
        cid = ctx.next_id("carousel")
        slides = "".join(f'<li class="carousel-hyt__slide">{card_html(ctx, it)}</li>' for it in items)
        inner = (f'<div class="carousel-hyt" data-carousel>'
                 f'<div class="carousel-hyt__controls"><button type="button" class="btn-icon" data-carousel-prev aria-controls="{cid}" aria-label="{esc(ctx.t("carousel.prev"))}">{icon("arrow-left")}</button>'
                 f'<button type="button" class="btn-icon" data-carousel-next aria-controls="{cid}" aria-label="{esc(ctx.t("carousel.next"))}">{icon("arrow-right")}</button></div>'
                 f'<ul class="carousel-hyt__track" id="{cid}" tabindex="0" aria-label="{esc(plain(b.get("heading", ctx.t("carousel.label"))))}">{slides}</ul></div>')
    else:
        inner = '<div class="row g-4">' + "".join(f'<div class="{grid_cols(cols)}">{card_html(ctx, it)}</div>' for it in items) + "</div>"
    return section(heading_block(ctx, b) + inner + block_link(ctx, b), b, "section--muted" if b.get("variant") == "muted" else "")


def b_related(ctx, b):
    items = [{"page": pid, "image": R.PAGES[pid]["image"]} for pid in b.get("pages", []) if pid in R.PAGES]
    for pid in b.get("pages", []):
        if pid not in R.PAGES:
            warn(f"related: unknown page {pid}")
    n = len(items)
    inner = '<div class="row g-4">' + "".join(f'<div class="{grid_cols(min(n, 4))}">{card_html(ctx, it)}</div>' for it in items) + "</div>"
    hb = {"heading": b.get("heading") or ctx.t("related_heading"), "eyebrow": b.get("eyebrow")}
    return section(heading_block(ctx, hb) + inner, b, "section--muted")


def b_faq(ctx, b):
    aid = ctx.next_id("faq")
    items = []
    for i, it in enumerate(b.get("items", [])):
        ctx.faq.append(it)
        bid, pid = f"{aid}-q{i}", f"{aid}-a{i}"
        items.append(
            f'<div class="accordion-hyt__item"><h3 class="accordion-hyt__heading">'
            f'<button type="button" class="accordion-hyt__button" id="{bid}" aria-expanded="true" aria-controls="{pid}">'
            f'<span>{esc(plain(it["q"]))}</span>{icon("plus-lg", "accordion-hyt__icon")}</button></h3>'
            f'<div class="accordion-hyt__panel" id="{pid}" role="region" aria-labelledby="{bid}"><div class="accordion-hyt__inner"><p>{inline(ctx, it["a"])}</p></div></div></div>')
    inner = (f'<div class="row g-4 g-lg-5"><div class="col-lg-4">{heading_block(ctx, b)}</div>'
             f'<div class="col-lg-8"><div class="accordion-hyt reveal" data-accordion>{"".join(items)}</div></div></div>')
    return section(inner, b)


def b_stats(ctx, b):
    items = "".join(
        f'<div class="col-6 col-lg-3"><div class="stat reveal"><p class="stat__value">{esc(it["value"])}</p>'
        f'<p class="stat__label">{esc(it["label"])}</p></div></div>' for it in b.get("items", []))
    return section(f'<div class="row g-4 stats">{items}</div>', b, "section--stats")


def btn(ctx, d, cls):
    href = d["href"] if d.get("href") else ctx.url(d["page"], d.get("anchor"))
    ic = icon(d["icon"]) + " " if d.get("icon") else ""
    return f'<a class="btn-hyt {cls}" href="{esc(href)}">{ic}{esc(d["label"])}</a>'


def b_cta(ctx, b):
    light = b.get("variant") == "light"
    buttons = btn(ctx, b["primary"], "btn-hyt--primary") if b.get("primary") else ""
    if b.get("secondary"):
        buttons += btn(ctx, b["secondary"], "btn-hyt--ghost-dark" if light else "btn-hyt--ghost")
    inner = (f'<div class="cta-band reveal"><div class="cta-band__text"><h2 class="cta-band__title">{inline(ctx, b["heading"])}</h2>'
             f'<p>{inline(ctx, b.get("text", ""))}</p></div><div class="cta-band__actions">{buttons}</div></div>')
    return section(inner, b, "section--cta-light" if light else "section--cta")


def b_gallery(ctx, b):
    gid = ctx.next_id("gallery")
    items = "".join(
        f'<li class="gallery__item reveal"><a class="gallery__link" href="/assets/images/{esc(it["image"])}.jpg" data-gallery-item '
        f'data-caption="{esc(it.get("caption", ""))}" aria-label="{esc(ctx.t("a11y.enlarge"))}: {esc(it.get("caption", ""))}">'
        f'{picture(it["image"], it.get("caption", ""), "(min-width: 992px) 25vw, 50vw")}<span class="gallery__zoom">{icon("arrows-fullscreen")}</span></a>'
        f'<p class="gallery__caption">{esc(it.get("caption", ""))}</p></li>' for it in b.get("items", []))
    return section(heading_block(ctx, b) + f'<ul class="gallery" id="{gid}" data-gallery aria-label="{esc(ctx.t("a11y.image_gallery"))}">{items}</ul>', b)


def b_timeline(ctx, b):
    items = "".join(
        f'<li class="timeline__item reveal"><p class="timeline__year">{esc(it["year"])}</p>'
        f'<div><h3 class="timeline__title">{inline(ctx, it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p></div></li>'
        for it in b.get("items", []))
    return section(heading_block(ctx, b) + f'<ol class="timeline">{items}</ol>', b)


def b_projects(ctx, b):
    out = []
    lab = ctx.c.get("project_labels", {})
    for it in b.get("items", []):
        status = ctx.t("project_status." + it.get("status_key", "executed"))
        meta = []
        if it.get("client"):
            meta.append(f'<div><dt>{esc(lab.get("client", "Client"))}</dt><dd>{esc(it["client"])}</dd></div>')
        if it.get("location"):
            meta.append(f'<div><dt>{esc(lab.get("location", "Location"))}</dt><dd>{esc(it["location"])}</dd></div>')
        meta.append(f'<div><dt>{esc(lab.get("status", "Status"))}</dt><dd><span class="badge-status badge-status--{esc(it.get("status_key", "executed"))}">{esc(status)}</span></dd></div>')
        scope = ""
        if it.get("scope"):
            scope = f'<h4 class="project__sub">{esc(lab.get("scope", "Scope"))}</h4><ul class="check-list">' + "".join(f"<li>{inline(ctx, s)}</li>" for s in it["scope"]) + "</ul>"
        prods = ""
        if it.get("products"):
            prods = f'<h4 class="project__sub">{esc(lab.get("products", "Equipment"))}</h4><ul class="tag-list">' + "".join(
                f'<li><a href="{esc(ctx.url(p))}">{esc(ctx.nav(p))}</a></li>' for p in it["products"] if p in R.PAGES) + "</ul>"
        out.append(
            f'<article class="project reveal" id="{esc(it["id"])}"><div class="row g-4 g-lg-5 align-items-start">'
            f'<div class="col-lg-5"><figure class="media-frame">{picture(it.get("image"), it.get("image_alt", plain(it["title"])), "(min-width: 992px) 40vw, 100vw")}</figure></div>'
            f'<div class="col-lg-7"><h3 class="project__title">{inline(ctx, it["title"])}</h3><dl class="project__meta">{"".join(meta)}</dl>'
            f'<p>{inline(ctx, it.get("text", ""))}</p>{scope}{prods}</div></div></article>')
    return section(heading_block(ctx, b) + '<div class="projects">' + "".join(out) + "</div>", b)


def b_news(ctx, b):
    items = b.get("items", [])
    if b.get("limit"):
        items = items[: int(b["limit"])]
    cards = []
    for it in items:
        link = ""
        if it.get("page") and it["page"] != ctx.page["id"]:
            link = f'<a class="news-card__link stretched-link" href="{esc(ctx.url(it["page"], it.get("anchor")))}">{esc(ctx.t("buttons.read_more"))} {icon("arrow-right")}</a>'
        cards.append(
            f'<div class="col-md-6 col-lg-4"><article class="news-card reveal"><p class="news-card__meta"><span class="news-card__cat">{esc(it.get("category", ""))}</span>'
            f'{"<span>" + esc(it["date"]) + "</span>" if it.get("date") and it.get("date") != it.get("category") else ""}</p>'
            f'<h3 class="news-card__title">{inline(ctx, it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p>{link}</article></div>')
    return section(heading_block(ctx, b) + '<div class="row g-4">' + "".join(cards) + "</div>" + block_link(ctx, b), b, "section--muted")


def b_logos(ctx, b):
    items = "".join(f'<li class="logo-tile reveal"><span class="logo-tile__name">{esc(it["name"])}</span>'
                    f'{"<span class=logo-tile__note>" + esc(it["note"]) + "</span>" if it.get("note") else ""}</li>' for it in b.get("items", []))
    return section(heading_block(ctx, b) + f'<ul class="logo-grid">{items}</ul>', b)


def b_notice(ctx, b):
    if b.get("variant") == "review":
        if not SHOW_REVIEW:
            return ""
        text = re.sub(r"^\s*[^:.!?\[\]]{3,40}:\s+", "", b["text"])  # drop a leading "For HYT review:" style label
        text = text[:1].upper() + text[1:]
        return (f'<div class="container"><aside class="notice notice--review" data-review-note>'
                f'{icon("exclamation-triangle")}<div><strong>{esc(ctx.t("notice.review"))}:</strong> {inline(ctx, text)}</div></aside></div>')
    return f'<div class="container"><aside class="notice">{icon("info-circle")}<div>{inline(ctx, b["text"])}</div></aside></div>'


def b_prose(ctx, b):
    secs = []
    for s in b.get("sections", []):
        h = f'<h2>{inline(ctx, s["heading"])}</h2>' if s.get("heading") else ""
        ps = "".join(f"<p>{inline(ctx, p)}</p>" for p in s.get("paragraphs", []))
        bl = ("<ul>" + "".join(f"<li>{inline(ctx, x)}</li>" for x in s["bullets"]) + "</ul>") if s.get("bullets") else ""
        secs.append(h + ps + bl)
    upd = f'<p class="legal-updated">{esc(b["updated"])}</p>' if b.get("updated") else ""
    return section(f'<div class="row"><div class="col-lg-9 col-xl-8"><div class="legal-prose">{upd}{"".join(secs)}</div></div></div>', b)


def b_downloads(ctx, b):
    rows = []
    for it in b.get("items", []):
        f = it.get("file", "")
        exists = (OUT / f.lstrip("/")).exists()
        if not exists:
            warn(f"download file missing: {f}")
        rows.append(
            f'<li class="download reveal">{icon("file-earmark-pdf", "download__icon")}<div class="download__body">'
            f'<h3 class="download__title">{esc(it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p>'
            f'<p class="download__meta">{esc(it.get("meta", ""))}</p></div>'
            f'<a class="btn-hyt btn-hyt--outline" href="{esc(f)}" data-catalogue-open="downloads">{icon("download")} {esc(ctx.t("downloads.download"))}<span class="visually-hidden"> {esc(it["title"])}</span></a></li>')
    return section(heading_block(ctx, b) + f'<ul class="downloads">{"".join(rows)}</ul>', b)


def b_contact(ctx, b):
    c = ctx.c["contact"]
    addr = "<br>".join(esc(x) for x in c["address_lines"])
    tel = lambda n: "tel:" + re.sub(r"[^\d+]", "", n)
    cards = [
        (icon("geo-alt"), c["office_heading"], f'<address>{addr}</address><a class="link-arrow" href="{esc(CONFIG["maps_url"])}" target="_blank" rel="noopener">{esc(c["map_link"])} {icon("box-arrow-up-right")}<span class="visually-hidden"> {esc(ctx.t("a11y.opens_new_tab"))}</span></a>'),
        (icon("telephone"), c["phone_heading"], f'<p><a href="{tel(c["phone"])}">{esc(c["phone"])}</a><br><a href="{tel(c["phone_alt"])}">{esc(c["phone_alt"])}</a></p><p>{esc(ctx.t("topbar.tollfree_label"))}: <a href="{tel(c["tollfree"])}">{esc(c["tollfree"])}</a></p>'),
        (icon("envelope"), c["email_heading"], f'<p><a href="mailto:{esc(c["email"])}">{esc(c["email"])}</a></p><h4 class="contact-card__sub">{esc(c["hours_heading"])}</h4><p>{esc(c["hours"])}</p>'),
        (icon("headset"), c["service_heading"], f'<p>{esc(c["service_text"])}</p><p><a href="{tel(c["tollfree"])}">{esc(c["tollfree"])}</a></p>'),
    ]
    inner = '<div class="row g-4">' + "".join(
        f'<div class="col-sm-6 col-lg-3"><div class="contact-card reveal">{ic}<h3 class="contact-card__title">{esc(t)}</h3>{body}</div></div>'
        for ic, t, body in cards) + "</div>"
    return section(heading_block(ctx, {"heading": b.get("heading") or c["heading"], "intro": b.get("intro")}) + inner, b, "section--muted")


def b_split_cta(ctx, b):
    items = b.get("items", [])
    cols = grid_cols(len(items))
    inner = '<div class="row g-4">' + "".join(
        f'<div class="{cols}"><div class="panel-cta reveal">{icon(it.get("icon"), "panel-cta__icon")}'
        f'<h3 class="panel-cta__title">{inline(ctx, it["heading"])}</h3><p>{inline(ctx, it.get("text", ""))}</p>'
        f'<a class="link-arrow" href="{esc(ctx.url(it["page"], it.get("anchor")))}">{esc(it["label"])} {icon("arrow-right")}</a></div></div>'
        for it in items) + "</div>"
    return section(heading_block(ctx, b) + inner, b)


def b_product_catalog(ctx, b):
    cats = R.PRODUCT_CATEGORIES
    filters = [f'<button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true">{esc(ctx.t("categories.all"))}</button>']
    for c in cats:
        filters.append(f'<button type="button" class="filter-btn" data-filter="{c}" aria-pressed="false">{esc(ctx.t("categories." + c))}</button>')
    groups = []
    for c in cats:
        prods = [p for p in R.P if p.get("category") == c]
        cards = "".join(
            f'<div class="col-sm-6 col-lg-4 col-xl-3" data-product data-category="{c}">'
            + card_html(ctx, {"page": p["id"], "image": p["image"],
                              "title": ctx.nav(p["id"])}).replace('<p class="card-hyt__text">',
                                                                 (f'<p class="card-hyt__model">{esc(p["model"])}</p>' if p.get("model") else "") + '<p class="card-hyt__text">', 1)
            + "</div>" for p in prods)
        groups.append(
            f'<section class="product-group" id="{c}" data-group="{c}" aria-labelledby="{c}-title">'
            f'<div class="product-group__head reveal"><h2 class="section-title" id="{c}-title">{esc(ctx.t("categories." + c))}</h2>'
            f'<p class="section-intro">{esc(ctx.t("categories." + c + "_text"))}</p></div>'
            f'<div class="row g-4">{cards}</div></section>')
    inner = (heading_block(ctx, b) +
             f'<div class="product-filter" data-product-filter><div class="filter-bar" role="group" aria-label="{esc(ctx.t("categories.filter_label"))}">{"".join(filters)}</div>'
             f'<p class="filter-status" aria-live="polite" data-filter-status></p>{"".join(groups)}'
             f'<p class="filter-empty" hidden data-filter-empty>{esc(ctx.t("categories.no_results"))}</p></div>')
    return section(inner, b)


def sitemap_tree(ctx, parent):
    kids = [p for p in R.P if p["parent"] == parent and p["id"] not in ("thank-you", "404")]
    if not kids:
        return ""
    return "<ul>" + "".join(
        f'<li data-sitemap-item><a href="{esc(ctx.url(p["id"]))}">{esc(ctx.nav(p["id"]))}</a>{sitemap_tree(ctx, p["id"])}</li>'
        for p in kids) + "</ul>"


def b_sitemap(ctx, b):
    tree = f'<ul><li data-sitemap-item><a href="{esc(ctx.url("home"))}">{esc(ctx.t("home_label"))}</a>{sitemap_tree(ctx, "home")}</li></ul>'
    search = (f'<div class="sitemap-search"><label class="form-label" for="sitemap-q">{esc(ctx.t("sitemap.search_label"))}</label>'
              f'<input class="form-control" type="search" id="sitemap-q" placeholder="{esc(ctx.t("sitemap.search_placeholder"))}" data-sitemap-search autocomplete="off">'
              f'<p class="filter-empty" hidden data-sitemap-empty>{esc(ctx.t("sitemap.no_results"))}</p></div>')
    return section(heading_block(ctx, b) + search + f'<nav class="html-sitemap" aria-label="{esc(ctx.nav("sitemap"))}" data-sitemap>{tree}</nav>', b)


# ---- Forms ---------------------------------------------------------------
def field(ctx, kind, name, label, required=True, attrs="", col="col-md-6", hint=None, options=None):
    fid = f"{ctx.form_id}-{name}"
    req = " required" if required else ""
    star = ' <span class="req" aria-hidden="true">*</span>' if required else ""
    hint_html = f'<p class="form-hint" id="{fid}-hint">{esc(hint)}</p>' if hint else ""
    desc = f' aria-describedby="{fid}-hint {fid}-err"' if hint else f' aria-describedby="{fid}-err"'
    err = f'<p class="form-error" id="{fid}-err" data-error-for="{fid}"></p>'
    lab = f'<label class="form-label" for="{fid}">{esc(label)}{star}</label>'
    if kind == "textarea":
        ctl = f'<textarea class="form-control" id="{fid}" name="{name}" rows="6"{req}{desc} {attrs}></textarea>'
    elif kind == "select":
        ctl = f'<select class="form-select" id="{fid}" name="{name}"{req}{desc} {attrs}>{options}</select>'
    else:
        ctl = f'<input class="form-control" type="{kind}" id="{fid}" name="{name}"{req}{desc} {attrs}>'
    return f'<div class="{col}">{lab}{hint_html}{ctl}{err}</div>'


def options_list(items, placeholder):
    return f'<option value="">{esc(placeholder)}</option>' + "".join(f'<option>{esc(x)}</option>' for x in items)


def interest_options(ctx):
    f = ctx.c["form"]
    groups = []
    for c in R.PRODUCT_CATEGORIES:
        opts = "".join(f'<option value="{p["id"]}">{esc(ctx.nav(p["id"]))}</option>' for p in R.P if p.get("category") == c)
        groups.append(f'<optgroup label="{esc(ctx.t("categories." + c))}">{opts}</optgroup>')
    svc = ["turnkey-project", "wheel-shop-automation", "installation-commissioning", "maintenance", "annual-maintenance-contract",
           "comprehensive-annual-maintenance-contract", "spare-supply", "retro-fitment-upgradation", "repair", "shifting",
           "wet-leasing", "training"]
    groups.append(f'<optgroup label="{esc(ctx.nav("services"))}">' + "".join(f'<option value="{s}">{esc(ctx.nav(s))}</option>' for s in svc) + "</optgroup>")
    return f'<option value="">{esc(f["interest_placeholder"])}</option>' + "".join(groups) + f'<option value="other">{esc(f["interest_other"])}</option>'


def b_form(ctx, b):
    f = ctx.c["form"]
    kind = b.get("form", "enquiry")
    fid = ctx.form_id = ctx.next_id("form")
    fields = [
        field(ctx, "text", "name", f["name"], attrs='autocomplete="name" maxlength="120"'),
        field(ctx, "text", "company", f["company"], required=kind != "career", attrs='autocomplete="organization" maxlength="160"'),
        field(ctx, "email", "email", f["email"], attrs='autocomplete="email" maxlength="160"'),
        field(ctx, "tel", "phone", f["phone"], required=kind != "enquiry", attrs='autocomplete="tel" maxlength="30" data-validate="phone"'),
        field(ctx, "select", "country", f["country"], options=options_list(ctx.c["countries"], f["country_placeholder"]), attrs='autocomplete="country-name"'),
    ]
    enctype = ""
    if kind == "enquiry":
        fields.append(field(ctx, "select", "interest", f["interest"], options=interest_options(ctx), attrs="data-prefill-product"))
        fields.append(field(ctx, "text", "subject", f["subject"], col="col-12", attrs='maxlength="160"'))
        fields.append(field(ctx, "textarea", "message", f["message"], col="col-12", hint=f["message_hint"], attrs='minlength="20" maxlength="4000"'))
    elif kind == "supplier":
        fields.append(field(ctx, "text", "designation", f["designation"], required=False, attrs='autocomplete="organization-title"'))
        fields.append(field(ctx, "url", "website", f["website"], required=False, attrs='placeholder="https://" autocomplete="url"'))
        fields.append(field(ctx, "text", "gst", f["gst"], required=False, attrs='maxlength="30"'))
        fields.append(field(ctx, "select", "supply_category", f["supply_category"], options=options_list(f["supply_options"], f["interest_placeholder"])))
        fields.append(field(ctx, "number", "years", f["years"], required=False, attrs='min="0" max="200" inputmode="numeric"'))
        fields.append(field(ctx, "text", "certs", f["certs"], required=False, col="col-12"))
        fields.append(field(ctx, "textarea", "message", f["message"], col="col-12", required=False, attrs='maxlength="4000"'))
    elif kind == "career":
        fields.append(field(ctx, "select", "position", f["position"], options=options_list(f["position_options"], f["interest_placeholder"])))
        fields.append(field(ctx, "number", "experience", f["experience"], attrs='min="0" max="60" inputmode="numeric"'))
        fields.append(field(ctx, "file", "cv", f["cv"], required=False, attrs='accept="application/pdf,.pdf" data-max-size="5242880"'))
        fields.append(field(ctx, "url", "cv_link", f["cv_link"], required=False, attrs='placeholder="https://"'))
        fields.append(field(ctx, "textarea", "message", f["message"], col="col-12", required=False, attrs='maxlength="4000"'))
        enctype = ' enctype="multipart/form-data"'
    elif kind == "catalogue":
        fields.append(field(ctx, "select", "interest", f["catalogue_choice"], options=interest_options(ctx)))
    thank = ctx.url("thank-you", absolute=True)
    privacy = (f'<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="{fid}-privacy" name="privacy_consent" value="yes" required aria-describedby="{fid}-privacy-err">'
               f'<label class="form-check-label" for="{fid}-privacy">{inline(ctx, f["privacy"])} <span class="req" aria-hidden="true">*</span></label>'
               f'<p class="form-error" id="{fid}-privacy-err" data-error-for="{fid}-privacy"></p></div></div>')
    hp = (f'<div class="hp-field" aria-hidden="true"><label for="{fid}-hp">{esc(f["honeypot"])}</label>'
          f'<input type="text" id="{fid}-hp" name="_gotcha" tabindex="-1" autocomplete="off"></div>')
    turnstile = f'<div class="col-12"><div class="cf-turnstile" data-sitekey="{esc(CONFIG["turnstile_sitekey"])}"></div></div>' if CONFIG.get("turnstile_sitekey") else ""
    hidden = (f'<input type="hidden" name="form_type" value="{kind}"><input type="hidden" name="language" value="{ctx.lang["code"]}">'
              f'<input type="hidden" name="page" value="{esc(ctx.url(ctx.page["id"], absolute=True))}"><input type="hidden" name="_next" value="{esc(thank)}">'
              f'<input type="hidden" name="started_at" value="" data-started-at>')
    btn_label = {"enquiry": "buttons.send", "supplier": "buttons.submit_registration", "career": "buttons.submit_application", "catalogue": "buttons.request_catalogue"}[kind]
    action = CONFIG.get("form_endpoint") or ""
    body = "".join(fields)
    form = (f'<form class="form-hyt reveal" id="{fid}" method="post" action="{esc(action)}"{enctype} novalidate data-form="{kind}" '
            f'data-thank-you="{esc(ctx.url("thank-you"))}" data-provider="{esc(CONFIG.get("form_provider", "generic"))}">'
            f'<p class="form-required-note">{esc(f["required_note"])}</p>'
            f'<div class="form-summary" role="alert" tabindex="-1" hidden data-form-summary></div>'
            f'<div class="row g-3">{body}{privacy}{turnstile}</div>{hp}{hidden}'
            f'<div class="form-actions"><button type="submit" class="btn-hyt btn-hyt--primary" data-submit>'
            f'<span class="btn-label">{esc(ctx.t(btn_label))}</span><span class="spinner" aria-hidden="true"></span></button></div>'
            f'<div class="form-status" role="status" aria-live="polite" data-form-status></div></form>')
    head = heading_block(ctx, b)
    sid = b.get("id") or ("enquiry" if kind == "enquiry" else kind + "-form")
    return f'<section class="section section--form" id="{esc(sid)}"><div class="container"><div class="row g-4 g-lg-5"><div class="col-lg-4">{head}</div><div class="col-lg-8">{form}</div></div></div></section>'


def b_logo_carousel(ctx, b):
    cl = ctx.c.get("clients", {})
    one = "".join(
        f'<li class="marquee__item"><img src="/assets/images/clients/{slug}.svg" alt="{esc(name)}" width="320" height="96" loading="lazy"></li>'
        for slug, name in R.CLIENTS)
    dup = "".join(
        f'<li class="marquee__item" aria-hidden="true"><img src="/assets/images/clients/{slug}.svg" alt="" width="320" height="96" loading="lazy"></li>'
        for slug, _ in R.CLIENTS)
    head = heading_block(ctx, {"eyebrow": cl.get("eyebrow"), "heading": cl.get("heading")}, center=True)
    inner = (f'{head}<div class="marquee reveal" data-marquee style="--marquee-count:{len(R.CLIENTS)}">'
             f'<ul class="marquee__track" aria-label="{esc(cl.get("heading", ""))}">{one}{dup}{dup}{dup}</ul>'
             f'<button type="button" class="marquee__toggle" data-marquee-toggle aria-pressed="false" '
             f'data-label-pause="{esc(cl.get("pause", "Pause"))}" data-label-play="{esc(cl.get("play", "Play"))}">'
             f'{icon("pause-fill")}<span class="visually-hidden">{esc(cl.get("pause", "Pause"))}</span></button></div>'
             f'<p class="block-link text-center reveal"><a class="link-arrow" href="{esc(ctx.url("clientele"))}">{esc(cl.get("link", ""))} {icon("arrow-right")}</a></p>')
    return section(inner, b, "section--clients")


def video_section(ctx, pid):
    v = VIDEOS.get(pid) or VIDEOS.get("default")
    if not v:
        return ""
    p = R.PAGES[pid]
    poster = f'/assets/images/{v.get("poster") or p["image"]}.jpg'
    title = plain(ctx.pages[pid].get("nav", ""))
    if v["type"] == "youtube":
        player = (f'<button type="button" class="video-facade" data-youtube="{esc(v["id"])}" aria-label="{esc(ctx.t("product.play_video"))}: {esc(title)}">'
                  f'<img src="{poster}" alt="" width="1600" height="1000" loading="lazy"><span class="video-facade__play">{icon("play-fill")}</span></button>')
    else:
        if not (OUT / v["src"].lstrip("/")).exists():
            warn(f"video file missing: {v['src']}")
        player = (f'<video class="video-player" controls preload="none" playsinline poster="{poster}" title="{esc(title)}">'
                  f'<source src="{esc(v["src"])}" type="{esc(v.get("mime", "video/mp4"))}"></video>')
    note = f'<p class="video-note">{icon("info-circle")} {esc(ctx.t("product.video_sample"))}</p>' if v.get("sample") else ""
    return (f'<section class="section section--video" id="video"><div class="container"><div class="row g-4 g-lg-5 align-items-center">'
            f'<div class="col-lg-4 reveal"><p class="eyebrow">{esc(ctx.t("product.video_heading"))}</p>'
            f'<h2 class="section-title">{fmt(esc(title))}</h2><p class="section-intro">{esc(ctx.t("product.video_text"))}</p></div>'
            f'<div class="col-lg-8"><div class="video-frame reveal" data-video>{player}</div>{note}</div></div></div></section>')


def catalogue_dialog(ctx):
    f = ctx.c["form"]
    cf = ctx.c.get("catalogue_form", {})
    ctx.form_id = "catalogue-form"
    fields = [
        field(ctx, "text", "name", f["name"], attrs='autocomplete="name" maxlength="120"'),
        field(ctx, "text", "company", f["company"], attrs='autocomplete="organization" maxlength="160"'),
        field(ctx, "email", "email", f["email"], attrs='autocomplete="email" maxlength="160"'),
        field(ctx, "tel", "phone", f["phone"], attrs='autocomplete="tel" maxlength="30" data-validate="phone"'),
        field(ctx, "select", "country", f["country"], col="col-12", options=options_list(ctx.c["countries"], f["country_placeholder"]), attrs='autocomplete="country-name"'),
    ]
    action = CONFIG.get("form_endpoint") or ""
    return (f'<dialog class="modal-hyt" data-catalogue-dialog data-lenis-prevent aria-labelledby="catalogue-title">'
            f'<div class="modal-hyt__panel"><button type="button" class="modal-hyt__close" data-catalogue-close aria-label="{esc(cf.get("close", "Close"))}">{icon("x-lg")}</button>'
            f'<div class="modal-hyt__head"><span class="modal-hyt__icon">{icon("file-earmark-pdf")}</span>'
            f'<div><h2 class="modal-hyt__title" id="catalogue-title">{esc(cf.get("title", ""))}</h2><p class="modal-hyt__intro">{esc(cf.get("intro", ""))}</p></div></div>'
            f'<form class="form-hyt form-hyt--modal" id="catalogue-form" method="post" action="{esc(action)}" novalidate data-form="catalogue" '
            f'data-thank-you="{esc(ctx.url("thank-you"))}" data-provider="{esc(CONFIG.get("form_provider", "generic"))}" '
            f'data-not-configured-msg="{esc(cf.get("not_configured_dl", ""))}">'
            f'<div class="form-summary" role="alert" tabindex="-1" hidden data-form-summary></div>'
            f'<div class="row g-3">{"".join(fields)}'
            f'<div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="catalogue-form-privacy" name="privacy_consent" value="yes" required aria-describedby="catalogue-form-privacy-err">'
            f'<label class="form-check-label" for="catalogue-form-privacy">{inline(ctx, f["privacy"])} <span class="req" aria-hidden="true">*</span></label>'
            f'<p class="form-error" id="catalogue-form-privacy-err" data-error-for="catalogue-form-privacy"></p></div></div></div>'
            f'<div class="hp-field" aria-hidden="true"><label for="catalogue-form-hp">{esc(f["honeypot"])}</label><input type="text" id="catalogue-form-hp" name="_gotcha" tabindex="-1" autocomplete="off"></div>'
            f'<input type="hidden" name="form_type" value="catalogue"><input type="hidden" name="language" value="{ctx.lang["code"]}">'
            f'<input type="hidden" name="page" value="{esc(ctx.url(ctx.page["id"], absolute=True))}"><input type="hidden" name="interest" value="" data-catalogue-product>'
            f'<input type="hidden" name="catalogue" value="{esc(CONFIG["catalogue_pdf"])}" data-catalogue-file>'
            f'<input type="hidden" name="_next" value="{esc(ctx.url("thank-you", absolute=True))}?form=catalogue"><input type="hidden" name="started_at" value="" data-started-at>'
            f'<div class="form-actions"><button type="submit" class="btn-hyt btn-hyt--primary" data-submit>{icon("download")}'
            f'<span class="btn-label">{esc(cf.get("submit", ""))}</span><span class="spinner" aria-hidden="true"></span></button></div>'
            f'<div class="form-status" role="status" aria-live="polite" data-form-status></div></form></div></dialog>')


def search_dialog(ctx):
    sc = ctx.c.get("search", {})
    idx = "en" if ctx.lang["code"] == "en" else ctx.lang["code"]
    return (f'<dialog class="search-dialog" data-search-dialog data-lenis-prevent aria-label="{esc(sc.get("label", ""))}" '
            f'data-index="/search-index/{idx}.json?v={ASSET_VERSION}" data-msg-results="{esc(sc.get("results", ""))}" '
            f'data-msg-one="{esc(sc.get("one_result", ""))}" data-msg-none="{esc(sc.get("none", ""))}">'
            f'<div class="search-dialog__panel"><form class="search-dialog__form" role="search" action="{esc(ctx.url("sitemap"))}" data-search-form>'
            f'{icon("search", "search-dialog__icon")}<label class="visually-hidden" for="site-search-q">{esc(sc.get("label", ""))}</label>'
            f'<input id="site-search-q" class="search-dialog__input" type="search" name="q" autocomplete="off" spellcheck="false" '
            f'placeholder="{esc(sc.get("placeholder", ""))}" aria-describedby="site-search-hint site-search-status" data-search-input>'
            f'<button type="button" class="search-dialog__close" data-search-close aria-label="{esc(sc.get("close", ""))}">{icon("x-lg")}</button></form>'
            f'<p class="search-dialog__hint" id="site-search-hint">{esc(sc.get("hint", ""))}</p>'
            f'<p class="search-dialog__status" id="site-search-status" role="status" aria-live="polite" data-search-status></p>'
            f'<ul class="search-dialog__results" data-search-results></ul></div></dialog>')


def write_search_index(ctx):
    """Per-language JSON index for the client-side site search."""
    out = []
    for p in R.P:
        if p["id"] in ("404", "thank-you"):
            continue
        pg = ctx.pages.get(p["id"]) or {}
        heads = []
        for b in pg.get("blocks", []):
            for k in ("heading", "eyebrow"):
                if b.get(k):
                    heads.append(plain(b[k]))
            for it in b.get("items", []) if isinstance(b.get("items"), list) else []:
                if isinstance(it, dict):
                    for k in ("title", "q"):
                        if it.get(k):
                            heads.append(plain(it[k]))
        anc = ancestors(p["id"])
        section = ctx.nav(anc[1]) if len(anc) > 1 else (ctx.t("categories." + p["category"]) if p.get("category") else "")
        if p["id"] in MEDIA_IDS:
            section = ctx.t("menu.media")
        out.append({"t": plain(pg.get("nav", "")), "h": plain(pg.get("h1", "")), "u": ctx.url(p["id"]),
                    "d": plain(pg.get("summary") or pg.get("description", "")), "s": section,
                    "m": p.get("model") or "", "k": " · ".join(dict.fromkeys(heads))[:1200]})
    name = "en" if ctx.lang["code"] == "en" else ctx.lang["code"]
    (OUT / "search-index").mkdir(exist_ok=True)
    (OUT / "search-index" / f"{name}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))


def b_quote_band(ctx, b):
    cite = f'<p class="quote-band__cite">{inline(ctx, b["cite"])}</p>' if b.get("cite") else ""
    inner = (f'<figure class="quote-band reveal"><span class="quote-band__mark" aria-hidden="true">&ldquo;</span>'
             f'<blockquote class="quote-band__text">{inline(ctx, b["quote"])}</blockquote>{cite}</figure>')
    return section(inner, b, "section--quote")


def b_pillars(ctx, b):
    items = "".join(
        f'<li class="pillar reveal"><span class="pillar__num" aria-hidden="true">{i:02d}</span>'
        f'<span class="pillar__icon">{icon(it.get("icon"))}</span><div><h3 class="pillar__title">{inline(ctx, it["title"])}</h3>'
        f'<p>{inline(ctx, it.get("text", ""))}</p></div></li>' for i, it in enumerate(b.get("items", []), 1))
    badge = ""
    if b.get("badge_value"):
        badge = (f'<div class="pillars__badge"><span class="pillars__badge-value">{esc(b["badge_value"])}</span>'
                 f'<span class="pillars__badge-label">{esc(b.get("badge_label", ""))}</span></div>')
    media = (f'<div class="col-lg-5 pillars__col"><figure class="pillars__media media-frame reveal">'
             f'{picture(b.get("image"), b.get("image_alt", ""), "(min-width: 992px) 40vw, 100vw")}</figure>{badge}</div>') if b.get("image") else ""
    paras = "".join(f'<p class="section-intro">{inline(ctx, x)}</p>' for x in b.get("paragraphs", []))
    head = heading_block(ctx, {k: b.get(k) for k in ("eyebrow", "heading", "intro")})
    inner = (f'<div class="row g-4 g-lg-5 align-items-center">{media}<div class="{"col-lg-7" if media else "col-12"}">'
             f'{head}{paras}<ol class="pillars">{items}</ol></div></div>')
    return section(inner, b)


def b_benefits(ctx, b):
    items = "".join(
        f'<div class="col-sm-6 col-lg-4"><article class="benefit reveal"><span class="benefit__icon">{icon(it.get("icon"))}</span>'
        f'<h3 class="benefit__title">{inline(ctx, it["title"])}</h3><p class="benefit__text">{inline(ctx, it.get("text", ""))}</p></article></div>'
        for it in b.get("items", []))
    return section(heading_block(ctx, b, center=True) + f'<div class="row g-4">{items}</div>', b, "section--benefits")


def b_facilities(ctx, b):
    fid = ctx.next_id("facilities")
    tabs, panels = [], []
    for i, it in enumerate(b.get("items", [])):
        tid, pid_ = f"{fid}-tab{i}", f"{fid}-panel{i}"
        sel = "true" if i == 0 else "false"
        tabs.append(f'<button type="button" class="facility-tab" role="tab" id="{tid}" aria-controls="{pid_}" aria-selected="{sel}" tabindex="{0 if i == 0 else -1}">'
                    f'{icon(it.get("icon"), "facility-tab__icon")}<span>{inline(ctx, it["title"])}</span><span class="facility-tab__bar" aria-hidden="true"></span></button>')
        bullets = ("<ul class=\"check-list\">" + "".join(f"<li>{inline(ctx, x)}</li>" for x in it.get("bullets", [])) + "</ul>") if it.get("bullets") else ""
        panels.append(f'<div class="facility-panel" role="tabpanel" id="{pid_}" aria-labelledby="{tid}">'
                      f'<figure class="facility-panel__media">{picture(it.get("image"), it.get("image_alt", ""), "(min-width: 992px) 55vw, 100vw")}</figure>'
                      f'<div class="facility-panel__body"><h3 class="facility-panel__title">{inline(ctx, it["title"])}</h3><p>{inline(ctx, it.get("text", ""))}</p>{bullets}</div></div>')
    inner = (heading_block(ctx, b) + f'<div class="facilities reveal" data-facilities>'
             f'<div class="facilities__tabs" role="tablist" aria-label="{esc(plain(b.get("heading", "")))}">{"".join(tabs)}</div>'
             f'<div class="facilities__panels">{"".join(panels)}</div></div>')
    return section(inner, b, "section--muted")


def b_chips(ctx, b):
    items = "".join(f'<li class="chip-tile reveal">{icon(it.get("icon"), "chip-tile__icon")}<span>{inline(ctx, it["title"])}</span></li>'
                    for it in b.get("items", []))
    return section(heading_block(ctx, b) + f'<ul class="chip-grid">{items}</ul>' + block_link(ctx, b), b)


BLOCKS = {
    "text": b_text, "features": b_features, "specs": b_specs, "table": b_table, "steps": b_steps, "list": b_list,
    "cards": b_cards, "related": b_related, "faq": b_faq, "stats": b_stats, "cta": b_cta, "gallery": b_gallery,
    "timeline": b_timeline, "projects": b_projects, "news": b_news, "logos": b_logos, "notice": b_notice,
    "prose": b_prose, "downloads": b_downloads, "form": b_form, "contact": b_contact, "split_cta": b_split_cta,
    "product_catalog": b_product_catalog, "sitemap": b_sitemap, "logo_carousel": b_logo_carousel,
    "quote_band": b_quote_band, "pillars": b_pillars, "benefits": b_benefits, "facilities": b_facilities, "chips": b_chips,
}


# --------------------------------------------------------------------------
# Page chrome
# --------------------------------------------------------------------------
def lang_switcher(ctx, pid, variant):
    menu_id = f"lang-menu-{variant}"
    cur = ctx.lang
    items = []
    for L in R.LANGS:
        p = R.PAGES[pid]
        href = L["prefix"] + p["path"]
        current = ' aria-current="true"' if L["code"] == cur["code"] else ""
        items.append(f'<li><a class="lang-switch__link" href="{esc(href)}" hreflang="{L["hreflang"]}" lang="{L["html"]}"{current} data-lang-link>'
                     f'<span class="lang-switch__code" aria-hidden="true">{L["short"]}</span><span>{esc(L["name"])}</span>'
                     f'{icon("check2", "lang-switch__check") if current else ""}</a></li>')
    return (f'<div class="lang-switch lang-switch--{variant}" data-lang-switch>'
            f'<button type="button" class="lang-switch__btn" aria-expanded="false" aria-controls="{menu_id}" '
            f'aria-label="{esc(ctx.t("language.choose"))} – {esc(ctx.t("language.current"))}: {esc(cur["name"])}">'
            f'{icon("globe2")}<span class="lang-switch__current">{esc(cur["name"])}</span>{icon("chevron-down", "lang-switch__chev")}</button>'
            f'<ul class="lang-switch__menu" id="{menu_id}">{"".join(items)}</ul></div>')


def ancestors(pid):
    chain = []
    p = R.PAGES[pid]
    while p["parent"]:
        chain.append(p["parent"])
        p = R.PAGES[p["parent"]]
    return list(reversed(chain))


def active_top(pid):
    chain = ancestors(pid) + [pid]
    for item in R.MENU:
        if item["id"] and item["id"] in chain:
            return item["id"] or item.get("label")
        for col in item["columns"]:
            ids = [x[0] if isinstance(x, tuple) else x for x in col["items"]]
            if pid in ids:
                return item["id"] or item.get("label")
    return None


def cur_attr(pid, target):
    return ' aria-current="page"' if pid == target else ""


def next_event_url(ctx):
    ne = CONFIG.get("next_event") or {}
    return ctx.url(ne.get("page") or "international-exhibitions", ne.get("anchor"))


def social_links(ctx, cls="social"):
    soc = CONFIG.get("social") or {}
    items = [("linkedin", "linkedin"), ("youtube", "youtube")]
    lis = "".join(f'<li><a href="{esc(soc[k])}" target="_blank" rel="noopener" aria-label="{esc(ctx.t("social." + k))} {esc(ctx.t("a11y.opens_new_tab"))}" title="{esc(ctx.t("social." + k))}">{icon(ic)}</a></li>'
                  for k, ic in items if soc.get(k))
    return f'<ul class="{cls}">{lis}</ul>' if lis else ""


def header(ctx, pid):
    c = ctx.c
    cur_top = active_top(pid)
    lis = []
    for n, item in enumerate(R.MENU):
        top_id = item["id"]
        label = ctx.nav(top_id) if top_id else ctx.t("menu." + item["label"])
        sub_id = f"submenu-{n}"
        is_active = cur_top == (top_id or item.get("label"))
        cols = []
        for col in item["columns"]:
            h, thumb = "", ""
            if col.get("heading"):
                htxt = esc(ctx.t("menu." + col["heading"]))
                if col.get("anchor"):
                    h = f'<p class="mega__heading"><a href="{esc(ctx.url("products", col["anchor"]))}">{htxt}</a></p>'
                    first = next(p for p in R.P if p.get("category") == col["anchor"])
                    thumb = (f'<a class="mega__thumb" href="{esc(ctx.url("products", col["anchor"]))}" tabindex="-1" aria-hidden="true">'
                             f'<img src="/assets/images/{first["image"]}-800.jpg" alt="" width="800" height="500" loading="lazy" decoding="async"></a>')
                else:
                    h = f'<p class="mega__heading">{htxt}</p>'
            links = []
            for x in col["items"]:
                xid, lvl = (x if isinstance(x, tuple) else (x, 0))
                lab = ctx.t("menu.about_hyt") if xid == "about" else ctx.nav(xid)
                cur = ' aria-current="page"' if xid == pid else ""
                links.append(f'<li class="mega__item mega__item--l{lvl}"><a href="{esc(ctx.url(xid))}"{cur}>'
                             f'<span>{fmt(esc(lab))}</span>{icon("chevron-right", "mega__chev")}</a></li>')
            cols.append(f'<div class="mega__col">{thumb}{h}<ul class="mega__list">{"".join(links)}</ul></div>')
        intro = ""
        if top_id and not item.get("wide"):
            intro = (f'<div class="mega__intro"><p class="mega__intro-title">{esc(label)}</p>'
                     f'<p class="mega__intro-text">{esc(plain(ctx.summary(top_id)))}</p>'
                     f'<a class="link-arrow" href="{esc(ctx.url(top_id))}">{esc(ctx.t("menu.overview"))} {icon("arrow-right")}</a></div>')
        feature = ""
        if item.get("feature"):
            fp = item["feature"]
            feature = (f'<a class="mega__feature" href="{esc(ctx.url(fp))}"><span class="mega__feature-media">'
                       f'<img src="/assets/images/{R.PAGES[fp]["image"]}-800.jpg" alt="" width="800" height="500" loading="lazy" decoding="async"></span>'
                       f'<span class="mega__feature-body"><span class="mega__feature-title">{fmt(esc(ctx.nav(fp)))}</span>'
                       f'<span class="mega__feature-text">{esc(plain(ctx.summary(fp)))}</span>'
                       f'<span class="mega__feature-more">{esc(ctx.t("buttons.learn_more"))} {icon("arrow-right")}</span></span></a>')
        bar = ""
        if item.get("wide"):
            bar = (f'<div class="mega__bar"><a class="link-arrow" href="{esc(ctx.url(top_id))}">{esc(ctx.t("categories.all"))} {icon("arrow-right")}</a>'
                   f'<div class="mega__bar-actions"><a class="mega__bar-link" href="{esc(CONFIG["catalogue_pdf"])}" data-catalogue-open="{esc(top_id)}">'
                   f'{icon("file-earmark-pdf")} {esc(ctx.t("buttons.download_catalogue"))}</a>'
                   f'<a class="btn-hyt btn-hyt--primary btn-hyt--sm" href="{esc(ctx.url("contact-us"))}">{esc(ctx.t("buttons.discuss_requirement"))}</a></div></div>')
        kind = "mega--wide" if item.get("wide") else "mega--panel"
        panel = (f'<div class="mega {kind} mega--cols-{len(cols)}" id="{sub_id}"><div class="container mega__container">'
                 f'<div class="mega__grid">{intro}<div class="mega__cols">{"".join(cols)}</div>{feature}</div>{bar}</div></div>')
        act = " is-active" if is_active else ""
        if top_id:
            cur = ' aria-current="page"' if top_id == pid else ""
            top = (f'<a class="nav-main__link{act}" href="{esc(ctx.url(top_id))}"{cur}>{esc(label)}</a>'
                   f'<button type="button" class="nav-main__toggle" aria-expanded="false" aria-controls="{sub_id}">'
                   f'<span class="visually-hidden">{esc(ctx.t("menu.toggle_submenu"))} {esc(label)}</span>{icon("chevron-down")}</button>')
        else:
            top = (f'<button type="button" class="nav-main__link nav-main__link--button{act}" aria-expanded="false" aria-controls="{sub_id}">'
                   f'{esc(label)}{icon("chevron-down", "nav-main__chev")}</button>')
        lis.append(f'<li class="nav-main__item has-sub" data-nav-item>{top}{panel}</li>')

    tel = lambda n: "tel:" + re.sub(r"[^\d+]", "", n)
    con = c["contact"]
    topbar = (f'<div class="topbar"><div class="container topbar__inner">'
              f'<ul class="topbar__contact">'
              f'<li><a href="{tel(con["phone"])}">{icon("telephone")}<span class="visually-hidden">{esc(ctx.t("topbar.phone_label"))}: </span>{esc(con["phone"])}</a></li>'
              f'<li class="d-none d-md-list-item"><a href="{tel(con["tollfree"])}">{icon("headset")}<span>{esc(ctx.t("topbar.tollfree_label"))}: {esc(con["tollfree"])}</span></a></li>'
              f'<li class="d-none d-sm-list-item"><a href="mailto:{esc(con["email"])}">{icon("envelope")}<span class="visually-hidden">{esc(ctx.t("topbar.email_label"))}: </span>{esc(con["email"])}</a></li>'
              f'</ul><div class="topbar__right"><span class="topbar__hours d-none d-xxl-inline">{icon("clock")} {esc(ctx.t("topbar.hours"))}</span>'
              f'<ul class="topbar__links d-none d-lg-flex">'
              f'<li><a href="{esc(ctx.url("knowledge-centre"))}"{cur_attr(pid, "knowledge-centre")}>{icon("lightbulb")}{esc(ctx.t("topbar.knowledge"))}</a></li>'
              f'<li><a href="{esc(ctx.url("career"))}"{cur_attr(pid, "career")}>{icon("people")}{esc(ctx.t("topbar.join"))}</a></li>'
              f'<li><a class="topbar__event" href="{esc(next_event_url(ctx))}"><span class="topbar__event-dot" aria-hidden="true"></span>{icon("calendar-event")}{esc(ctx.t("topbar.next_event"))}</a></li></ul>'
              f'<a class="topbar__search" href="{esc(ctx.url("sitemap"))}" data-search-open aria-label="{esc(ctx.t("search.open"))}" title="{esc(ctx.t("search.shortcut"))}">{icon("search")}<span class="d-none d-md-inline">{esc(ctx.t("topbar.search"))}</span></a>'
              f'{lang_switcher(ctx, pid, "top")}</div></div></div>')
    contact_cur = ' aria-current="page"' if pid == "contact-us" else ""
    return (f'<header class="site-header" data-header>{topbar}'
            f'<div class="navbar-hyt"><div class="container navbar-hyt__inner">'
            f'<a class="brand" href="{esc(ctx.url("home"))}" aria-label="{esc(c["company_name"])} – {esc(ctx.t("home_label"))}">'
            f'<img src="/assets/images/logo/hyt-logo.svg" alt="{esc(c["company_name"])}" width="180" height="87" class="brand__logo"></a>'
            f'<button type="button" class="nav-burger" aria-expanded="false" aria-controls="primary-nav" data-nav-open>'
            f'<span class="nav-burger__bars" aria-hidden="true"><span></span><span></span><span></span></span>'
            f'<span class="visually-hidden" data-label-open="{esc(ctx.t("menu.open"))}" data-label-close="{esc(ctx.t("menu.close"))}">{esc(ctx.t("menu.open"))}</span></button>'
            f'<nav class="nav-main" id="primary-nav" data-lenis-prevent aria-label="{esc(ctx.t("menu.main_label"))}" data-nav>'
            f'<ul class="nav-main__list">{"".join(lis)}</ul>'
            f'<div class="nav-main__mobile-extra"><ul class="mobile-quick">'
            f'<li><a href="{esc(ctx.url("knowledge-centre"))}">{icon("lightbulb")} {esc(ctx.t("topbar.knowledge"))}</a></li>'
            f'<li><a href="{esc(ctx.url("career"))}">{icon("people")} {esc(ctx.t("topbar.join"))}</a></li>'
            f'<li><a class="mobile-quick__event" href="{esc(next_event_url(ctx))}">{icon("calendar-event")} {esc(ctx.t("topbar.next_event"))}</a></li></ul>'
            f'{lang_switcher(ctx, pid, "mobile")}{social_links(ctx, "social social--mobile")}</div></nav>'
            f'<a class="btn-hyt btn-hyt--primary btn-hyt--sm nav-cta" href="{esc(ctx.url("contact-us"))}"{contact_cur}>{esc(ctx.t("menu.contact_button"))}</a>'
            f'</div></div><div class="scroll-progress" aria-hidden="true"><span data-scroll-progress></span></div></header>')


def footer(ctx, pid):
    c = ctx.c
    con = c["contact"]
    tel = lambda n: "tel:" + re.sub(r"[^\d+]", "", n)
    arrow = icon("arrow-right", "footer__link-arrow")

    # 1. Contact card (orange brand band)
    tiles = [
        ("telephone", con["phone_heading"], con["phone"], tel(con["phone"])),
        ("headset", con["service_heading"], con["tollfree"], tel(con["tollfree"])),
        ("envelope", con["email_heading"], con["email"], f'mailto:{con["email"]}'),
    ]
    tiles_html = "".join(
        f'<li><a class="footer-tile" href="{esc(href)}"><span class="footer-tile__icon">{icon(ic)}</span>'
        f'<span class="footer-tile__text"><span class="footer-tile__label">{esc(label)}</span>'
        f'<span class="footer-tile__value">{esc(value)}</span></span></a></li>' for ic, label, value, href in tiles)
    band = (f'<div class="footer-band reveal"><div class="footer-band__intro">'
            f'<h2 class="footer-band__title">{esc(ctx.t("footer.cta_heading"))}</h2>'
            f'<p class="footer-band__text">{esc(ctx.t("footer.cta_text"))}</p></div>'
            f'<ul class="footer-band__tiles">{tiles_html}</ul>'
            f'<a class="btn-hyt footer-band__btn" href="{esc(ctx.url("contact-us"))}">{esc(ctx.t("menu.contact_button"))} {icon("arrow-right")}</a></div>')

    # 2. Brand column + link columns (pages marked "Footer" in the workbook)
    certs = "".join(f'<li>{icon("patch-check-fill")}<span>{esc(x.strip())}</span></li>' for x in ctx.t("footer.certified").split("·"))
    brand = (f'<div class="footer-brand"><a href="{esc(ctx.url("home"))}" class="footer-brand__logo">'
             f'<img src="/assets/images/logo/hyt-logo.svg" alt="{esc(c["company_name"])}" width="180" height="87" loading="lazy"></a>'
             f'<p class="footer-brand__about">{esc(ctx.t("footer.about"))}</p>'
             f'<address class="footer-brand__address">{icon("geo-alt")}<span>{"<br>".join(esc(x) for x in con["address_lines"][1:])}</span></address>'
             f'<ul class="footer-certs" aria-label="{esc(ctx.nav("certifications"))}">{certs}</ul>'
             f'<div class="footer-social"><p class="footer-social__label">{esc(ctx.t("social.heading"))}</p>{social_links(ctx)}</div></div>')
    cols = []
    for col in R.FOOTER:
        links = "".join(f'<li><a href="{esc(ctx.url(x))}">{arrow}<span>{fmt(esc(ctx.nav(x)))}</span></a></li>' for x in col["items"])
        cols.append(f'<div class="footer-col"><h2 class="footer__heading">{esc(ctx.t("footer." + col["heading"]))}</h2><ul class="footer__links">{links}</ul></div>')
    main = f'<div class="footer-main">{brand}<nav class="footer-cols" aria-label="{esc(ctx.t("footer.company"))}">{"".join(cols)}</nav></div>'

    # 3. Bottom strip: copyright, languages, legal
    langs = "".join(f'<li><a href="{esc(L["prefix"] + R.PAGES[pid]["path"])}" hreflang="{L["hreflang"]}" lang="{L["html"]}" title="{esc(L["name"])}"'
                    f'{" aria-current=true" if L["code"] == ctx.lang["code"] else ""} data-lang-link>{L["short"]}<span class="visually-hidden"> – {esc(L["name"])}</span></a></li>' for L in R.LANGS)
    legal = "".join(f'<li><a href="{esc(ctx.url(x))}">{esc(ctx.nav(x))}</a></li>' for x in R.LEGAL_FOOTER)
    sample = f'<p class="footer__sample">{icon("info-circle")} {esc(ctx.t("footer.sample_notice"))}</p>' if not PRODUCTION else ""
    bottom = (f'<div class="footer-bottom"><div class="container"><div class="footer-bottom__row">'
              f'<p class="footer-bottom__copy">{esc(ctx.t("footer.copyright").replace("{year}", str(date.today().year)))}</p>'
              f'<div class="footer-bottom__langs">{icon("globe2")}<ul class="footer-langs" aria-label="{esc(ctx.t("footer.language"))}">{langs}</ul></div>'
              f'<nav aria-label="{esc(ctx.t("footer.legal_label"))}"><ul class="footer-bottom__legal">{legal}</ul></nav></div>{sample}</div></div>')

    return (f'<footer class="site-footer"><div class="container">{band}{main}</div>{bottom}'
            f'<a href="#top" class="back-to-top" data-back-to-top aria-label="{esc(ctx.t("buttons.back_to_top"))}">{icon("arrow-up")}</a></footer>')


def breadcrumb(ctx, pid):
    if pid == "home":
        return "", []
    trail = [(ctx.t("home_label"), ctx.url("home"))]
    for a in ancestors(pid)[1:]:
        trail.append((ctx.nav(a), ctx.url(a)))
    p = R.PAGES[pid]
    if pid in MEDIA_IDS:
        trail.append((ctx.t("menu.media"), None))
    if p.get("category"):
        trail.append((ctx.t("categories." + p["category"]), ctx.url("products", p["category"])))
    trail.append((ctx.nav(pid), None))
    lis = []
    for i, (label, href) in enumerate(trail):
        last = i == len(trail) - 1
        if href and not last:
            lis.append(f'<li class="breadcrumb-hyt__item"><a href="{esc(href)}">{esc(label)}</a></li>')
        else:
            lis.append(f'<li class="breadcrumb-hyt__item"{" aria-current=page" if last else ""}>{esc(label)}</li>')
    html_ = f'<nav class="breadcrumb-hyt" aria-label="{esc(ctx.t("breadcrumb_label"))}"><ol>{"".join(lis)}</ol></nav>'
    ld = [{"name": label, "item": (BASE + href) if href else (BASE + ctx.url(pid) if i == len(trail) - 1 else None)}
          for i, (label, href) in enumerate(trail)]
    return html_, ld


# Decorative motion layer for the home hero: blueprint grid, a railway-wheel
# "dial" (tyre, flange, web, hub, measuring ticks) and a light sweep. Purely
# visual – hidden from assistive technology.
def _wheel_svg():
    ticks = "".join(
        f'<line x1="300" y1="{14 if i % 5 == 0 else 22}" x2="300" y2="34" transform="rotate({i * 6} 300 300)"/>'
        for i in range(60))
    spokes = "".join(f'<line x1="300" y1="168" x2="300" y2="236" transform="rotate({i * 45} 300 300)"/>' for i in range(8))
    return ('<svg class="hero-wheel" viewBox="0 0 600 600" focusable="false">'
            f'<g class="hero-wheel__ticks">{ticks}</g>'
            '<circle class="hero-wheel__ring hero-wheel__ring--dash" cx="300" cy="300" r="262"/>'
            '<circle class="hero-wheel__ring" cx="300" cy="300" r="228"/>'
            '<circle class="hero-wheel__ring hero-wheel__ring--thin" cx="300" cy="300" r="200"/>'
            f'<g class="hero-wheel__web">{spokes}<circle class="hero-wheel__ring hero-wheel__ring--dash2" cx="300" cy="300" r="150"/></g>'
            '<circle class="hero-wheel__ring" cx="300" cy="300" r="72"/>'
            '<circle class="hero-wheel__hub" cx="300" cy="300" r="34"/>'
            '<g class="hero-wheel__orbit"><circle class="hero-wheel__tool" cx="300" cy="38" r="7"/></g>'
            '<path class="hero-wheel__arc" d="M 300 72 A 228 228 0 0 1 528 300" pathLength="100"/>'
            '</svg>')


HERO_FX = ('<div class="hero-fx" aria-hidden="true"><div class="hero-fx__grid"></div>'
           '<div class="hero-fx__spot"></div><div class="hero-fx__wheel">' + _wheel_svg() + '</div>'
           '<span class="hero-fx__beam"></span><span class="hero-fx__rail"></span></div>')


def hero(ctx, pid, pg, crumbs):
    p = R.PAGES[pid]
    t = p["template"]
    eyebrow = f'<p class="eyebrow eyebrow--hero">{esc(pg.get("eyebrow"))}</p>' if pg.get("eyebrow") else ""
    lede = f'<p class="hero__lede">{inline(ctx, pg.get("lede", ""))}</p>' if pg.get("lede") else ""
    if t == "home":
        return (f'<section class="hero-home" aria-labelledby="page-title" data-hero-fx><div class="hero-home__media">'
                f'{picture(p["image"], "", "100vw", eager=True, cls="hero-home__img", hero=True)}</div>'
                f'{HERO_FX}'
                f'<div class="container hero-home__content"><div class="hero-home__text">{eyebrow}'
                f'<h1 class="hero-home__title" id="page-title">{inline(ctx, pg["h1"])}</h1>{lede}'
                f'<div class="hero__actions"><a class="btn-hyt btn-hyt--primary btn-hyt--lg" href="{esc(ctx.url("products"))}">{esc(ctx.t("buttons.explore_products"))}</a>'
                f'<a class="btn-hyt btn-hyt--ghost btn-hyt--lg" href="{esc(ctx.url("contact-us"))}">{esc(ctx.t("buttons.discuss_requirement"))}</a></div>'
                f'</div></div><a class="hero-home__scroll" href="#main-content-start" aria-label="{esc(ctx.t("skip_link"))}">{icon("chevron-down")}</a></section>'
                f'<span id="main-content-start"></span>')
    if t == "product":
        model = f'<p class="product-hero__model"><span>{esc(ctx.t("product.model"))}</span> {esc(p["model"])}</p>' if p.get("model") else ""
        enquire = ctx.url("contact-us") + f"?product={pid}#enquiry"
        return (f'<section class="product-hero" aria-labelledby="page-title" data-hero-fx>{HERO_FX}<div class="container">{crumbs}'
                f'<div class="row align-items-center g-4 g-lg-5"><div class="col-lg-6"><div class="product-hero__text">{eyebrow}'
                f'<h1 class="product-hero__title" id="page-title">{inline(ctx, pg["h1"])}</h1>{model}{lede}'
                f'<div class="hero__actions"><a class="btn-hyt btn-hyt--primary" href="{esc(enquire)}">{esc(ctx.t("buttons.enquire"))}</a>'
                f'<a class="btn-hyt btn-hyt--outline" href="{esc(CONFIG["catalogue_pdf"])}" data-catalogue-open="{esc(pid)}">{icon("file-earmark-pdf")} {esc(ctx.t("buttons.download_catalogue"))}</a></div></div></div>'
                f'<div class="col-lg-6"><div class="product-hero__stage"><figure class="product-hero__media hero-reveal">{picture(p["image"], plain(pg.get("h1", "")), "(min-width: 992px) 50vw, 100vw", eager=True)}'
                f'<span class="product-hero__scan" aria-hidden="true"></span></figure>'
                f'<span class="product-hero__corner product-hero__corner--tl" aria-hidden="true"></span><span class="product-hero__corner product-hero__corner--br" aria-hidden="true"></span></div></div>'
                f'</div></div></section>')
    if t in ("legal", "utility"):
        return (f'<section class="page-hero page-hero--plain" aria-labelledby="page-title" data-hero-fx>{HERO_FX}<div class="container page-hero__content">{crumbs}{eyebrow}'
                f'<h1 class="page-hero__title" id="page-title">{inline(ctx, pg["h1"])}</h1>{lede}</div></section>')
    img = p.get("image")
    media = f'<div class="page-hero__media">{picture(img, "", "100vw", eager=True, cls="page-hero__img")}</div>' if img else ""
    actions = ""
    if pg.get("hero_actions"):
        acts = pg["hero_actions"]
        actions = '<div class="hero__actions page-hero__actions">' + "".join(
            btn(ctx, a, "btn-hyt--primary" if i == 0 else "btn-hyt--ghost") for i, a in enumerate(acts)) + "</div>"
    big = " page-hero--tall" if pg.get("hero_actions") else ""
    return (f'<section class="page-hero{" page-hero--image" if img else ""}{big}" aria-labelledby="page-title" data-hero-fx>{media}{HERO_FX}'
            f'<div class="container page-hero__content">{crumbs}{eyebrow}'
            f'<h1 class="page-hero__title" id="page-title">{inline(ctx, pg["h1"])}</h1>{lede}{actions}</div></section>')


def subnav(ctx, pg):
    links = []
    for b in pg.get("blocks", []):
        if b.get("id") and b.get("heading") and b["type"] != "notice":
            label = plain(b.get("eyebrow") or b["heading"])
            if b["type"] == "specs":
                label = ctx.t("product.specs_heading")
            links.append(f'<li><a href="#{esc(b["id"])}">{esc(label)}</a></li>')
            if b["id"] == "advantages" and (VIDEOS.get(ctx.page["id"]) or VIDEOS.get("default")):
                links.append(f'<li><a href="#video">{esc(ctx.t("product.video_heading"))}</a></li>')
    links.append(f'<li><a href="#catalogue">{esc(ctx.t("product.catalogue_heading"))}</a></li>')
    return (f'<nav class="subnav" aria-label="{esc(ctx.t("product.on_this_page"))}" data-subnav><div class="container">'
            f'<p class="subnav__label">{esc(ctx.t("product.on_this_page"))}</p><ul class="subnav__list">{"".join(links)}</ul></div></nav>')


def catalogue_panel(ctx, pid):
    pdf = CONFIG["catalogue_pdf"]
    return (f'<section class="section section--catalogue" id="catalogue"><div class="container"><div class="catalogue-panel reveal">'
            f'<div class="catalogue-panel__icon">{icon("file-earmark-pdf")}</div><div class="catalogue-panel__text">'
            f'<h2 class="section-title">{esc(ctx.t("product.catalogue_heading"))}</h2><p>{esc(ctx.t("product.catalogue_text"))}</p></div>'
            f'<div class="catalogue-panel__actions"><a class="btn-hyt btn-hyt--primary" href="{esc(pdf)}" data-catalogue-open="{esc(pid)}">'
            f'{icon("download")} {esc(ctx.t("buttons.download_catalogue"))}<span class="visually-hidden"> ({esc(ctx.t("a11y.pdf"))})</span></a></div></div></div></section>')


def product_cta(ctx, pid):
    return b_cta(ctx, {"heading": ctx.t("product.enquiry_heading"), "text": ctx.t("product.enquiry_text"),
                       "primary": {"label": ctx.t("buttons.enquire"), "page": "contact-us"},
                       "secondary": {"label": ctx.t("buttons.all_products"), "page": "products"}}).replace(
        f'href="{esc(ctx.url("contact-us"))}"', f'href="{esc(ctx.url("contact-us"))}?product={pid}#enquiry"', 1)


# --------------------------------------------------------------------------
# <head>, structured data
# --------------------------------------------------------------------------
def org_ld(ctx):
    con = ctx.c["contact"]
    return {
        "@type": "Organization", "@id": BASE + "/#organization", "name": ctx.c["company_name"], "url": BASE + "/",
        "logo": BASE + "/assets/images/logo/hyt-logo.svg", "foundingDate": "1977", "email": con["email"],
        "telephone": con["phone"], "sameAs": [v for v in (CONFIG.get("social") or {}).values()],
        "address": {"@type": "PostalAddress", "streetAddress": "29/10, 29/10/1, 29/10/2, D-II Block, MIDC Chinchwad",
                    "addressLocality": "Pune", "addressRegion": "Maharashtra", "postalCode": "411019", "addressCountry": "IN"},
        "contactPoint": [{"@type": "ContactPoint", "telephone": con["phone"], "contactType": "sales", "email": con["email"],
                          "availableLanguage": ["English", "Hindi", "Marathi"]},
                         {"@type": "ContactPoint", "telephone": con["tollfree"], "contactType": "technical support", "areaServed": "IN"}],
    }


def head(ctx, pid, pg, crumbs_ld):
    p = R.PAGES[pid]
    title = plain(pg.get("title") or pg.get("h1"))
    full_title = f"{title} | {ctx.c['site_name']}"
    desc = plain(pg.get("description", ""))
    if len(desc) > 170:
        warn(f"[{ctx.lang['code']}] description long ({len(desc)}) on {pid}")
    noindex = not p["sitemap"]
    is404 = pid == "404"
    links = []
    if not is404:
        canonical = ctx.url(pid, absolute=True)
        links.append(f'<link rel="canonical" href="{canonical}">')
        if not noindex:
            for L in R.LANGS:
                links.append(f'<link rel="alternate" hreflang="{L["hreflang"]}" href="{BASE}{L["prefix"]}{p["path"]}">')
            links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}{p["path"]}">')
    img = p.get("image") or "homepage/hero-wheel-lathe-workshop"
    og_img = f"{BASE}/assets/images/{img}.jpg"
    og = [f'<meta property="og:type" content="{"website" if pid == "home" else "article"}">',
          f'<meta property="og:site_name" content="{esc(ctx.c["site_name"])}">',
          f'<meta property="og:title" content="{esc(title)}">', f'<meta property="og:description" content="{esc(desc)}">',
          f'<meta property="og:url" content="{ctx.url(pid, absolute=True)}">', f'<meta property="og:image" content="{og_img}">',
          '<meta property="og:image:width" content="1600">', '<meta property="og:image:height" content="1000">',
          f'<meta property="og:locale" content="{ctx.lang["og"]}">']
    og += [f'<meta property="og:locale:alternate" content="{L["og"]}">' for L in R.LANGS if L["code"] != ctx.lang["code"]]
    og.append('<meta name="twitter:card" content="summary_large_image">')

    graph = []
    if pid == "home":
        graph.append(org_ld(ctx))
        graph.append({"@type": "WebSite", "@id": BASE + "/#website", "url": BASE + ctx.lang["prefix"] + "/", "name": ctx.c["site_name"],
                      "inLanguage": ctx.lang["html"], "publisher": {"@id": BASE + "/#organization"}})
    elif pid == "contact-us":
        graph.append(org_ld(ctx))
    if crumbs_ld:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            dict({"@type": "ListItem", "position": i + 1, "name": c["name"]}, **({"item": c["item"]} if c["item"] else {}))
            for i, c in enumerate(crumbs_ld)]})
    if p["template"] == "product":
        prod = {"@type": "Product", "name": plain(pg.get("h1")), "description": plain(pg.get("summary") or desc),
                "image": og_img, "url": ctx.url(pid, absolute=True), "category": ctx.t("categories." + p["category"]),
                "brand": {"@type": "Brand", "name": "HYT"}, "manufacturer": {"@type": "Organization", "name": ctx.c["company_name"], "url": BASE + "/"}}
        if p.get("model"):
            prod["model"] = p["model"]
        if p["category"] == "partner-products":
            prod.pop("brand")
            prod.pop("manufacturer")
        graph.append(prod)
    if ctx.faq:
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": plain(f["q"]), "acceptedAnswer": {"@type": "Answer", "text": plain(f["a"])}} for f in ctx.faq]})
    ld = ""
    if graph:
        ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("</", "<\\/") + "</script>"

    v = ASSET_VERSION
    fonts = "".join(f'<link rel="preload" href="/assets/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>'
                    for f in ("inter-latin-400-normal", "barlow-latin-600-normal"))
    preload_img = ""
    if p["template"] == "home":
        preload_img = (f'<link rel="preload" as="image" href="/assets/images/{p["image"]}.jpg" '
                       f'imagesrcset="/assets/images/{p["image"]}-1200.jpg 1200w, /assets/images/{p["image"]}.jpg 2400w" imagesizes="100vw">')
    if CONFIG.get("turnstile_sitekey") and any(b.get("type") == "form" for b in pg.get("blocks", [])):
        preload_img += '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    robots = '<meta name="robots" content="noindex, follow">' if noindex else '<meta name="robots" content="index, follow, max-image-preview:large">'
    return f"""<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
{robots}
{''.join(links)}
{''.join(og)}
<meta name="theme-color" content="#184A72">
<link rel="icon" href="/assets/images/logo/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/images/logo/apple-touch-icon.png">
{fonts}{preload_img}
<link rel="stylesheet" href="{CONFIG['bootstrap_css_cdn']}" integrity="{CONFIG['bootstrap_css_sri']}" crossorigin="anonymous" onerror="this.onerror=null;this.removeAttribute('integrity');this.href='/assets/vendor/bootstrap/css/bootstrap.min.css'">
<link rel="stylesheet" href="{CONFIG['bootstrap_icons_cdn']}" integrity="{CONFIG['bootstrap_icons_sri']}" crossorigin="anonymous" onerror="this.onerror=null;this.removeAttribute('integrity');this.href='/assets/vendor/bootstrap-icons/bootstrap-icons.min.css'">
<link rel="stylesheet" href="/assets/vendor/lenis/lenis.css">
<link rel="stylesheet" href="/assets/css/style.css?v={v}">
<link rel="stylesheet" href="/assets/css/animations.css?v={v}">
<link rel="stylesheet" href="/assets/css/responsive.css?v={v}">
<script>document.documentElement.classList.add('js');</script>
{ld}
</head>"""


# --------------------------------------------------------------------------
# Page assembly
# --------------------------------------------------------------------------
def render_page(ctx, pid):
    p = R.PAGES[pid]
    pg = ctx.pages.get(pid)
    if not pg:
        warn(f"[{ctx.lang['code']}] NO CONTENT for {pid}")
        pg = {"nav": pid, "h1": pid, "title": pid, "description": "", "blocks": []}
    ctx.page, ctx.faq, ctx.uid = p, [], 0
    crumbs, crumbs_ld = breadcrumb(ctx, pid)
    blocks = pg.get("blocks", [])
    body = []
    if p["template"] == "product":
        body.append(subnav(ctx, pg))
    catalogue_done = False
    for b in blocks:
        fn = BLOCKS.get(b.get("type"))
        if not fn:
            warn(f"unknown block type {b.get('type')} on {pid}")
            continue
        if p["template"] == "product" and b["type"] == "faq" and not catalogue_done:
            body.append(catalogue_panel(ctx, pid))
            catalogue_done = True
        body.append(fn(ctx, b))
        if p["template"] == "product" and b.get("id") == "advantages":
            body.append(video_section(ctx, pid))
    if p["template"] == "product":
        if not catalogue_done:
            body.append(catalogue_panel(ctx, pid))
        rel = pg.get("related") or []
        if rel:
            body.append(b_related(ctx, {"heading": ctx.t("product.related_heading"), "pages": rel}))
        body.append(product_cta(ctx, pid))
    if pid == "thank-you":
        cf = ctx.c.get("catalogue_form", {})
        body.insert(0, f'<section class="section section--download" data-download-panel hidden><div class="container"><div class="download-panel">'
                       f'<span class="download-panel__icon">{icon("file-earmark-arrow-down")}</span><div>'
                       f'<h2 class="download-panel__title">{esc(cf.get("download_heading", ""))}</h2>'
                       f'<p>{esc(cf.get("download_started", ""))} <a href="#" data-download-link download>{esc(cf.get("download_link", ""))}</a></p>'
                       f'<p class="download-panel__note" data-download-preview hidden>{icon("info-circle")} {esc(cf.get("preview_note", ""))}</p>'
                       f'</div></div></div></section>')
    main_html = hero(ctx, pid, pg, crumbs) + "".join(body)
    head_html = head(ctx, pid, pg, crumbs_ld)
    return f"""<!doctype html>
<html lang="{ctx.lang['html']}" data-lang="{ctx.lang['code']}" data-page="{pid}" data-template="{p['template']}">
{head_html}
<body id="top" class="tpl-{p['template']} page-{pid}">
<a class="skip-link" href="#main">{esc(ctx.t('skip_link'))}</a>
{header(ctx, pid)}
<main id="main" tabindex="-1">
{main_html}
</main>
{footer(ctx, pid)}
<dialog class="lightbox" data-lightbox data-lenis-prevent aria-label="{esc(ctx.t('gallery.label'))}">
<figure class="lightbox__figure"><img class="lightbox__img" alt="" data-lightbox-img><figcaption class="lightbox__caption" data-lightbox-caption></figcaption></figure>
<p class="lightbox__counter" data-lightbox-counter></p>
<button type="button" class="lightbox__btn lightbox__close" data-lightbox-close aria-label="{esc(ctx.t('buttons.close'))}">{icon('x-lg')}</button>
<button type="button" class="lightbox__btn lightbox__prev" data-lightbox-prev aria-label="{esc(ctx.t('buttons.previous'))}">{icon('chevron-left')}</button>
<button type="button" class="lightbox__btn lightbox__next" data-lightbox-next aria-label="{esc(ctx.t('buttons.next'))}">{icon('chevron-right')}</button>
</dialog>
{catalogue_dialog(ctx) if pid != "thank-you" else ""}
{search_dialog(ctx)}
<script type="module" src="/assets/js/main.js?v={ASSET_VERSION}"></script>
</body>
</html>
"""


def out_path(lang, pid):
    p = R.PAGES[pid]
    if p["path"].endswith(".html"):
        return OUT / (lang["prefix"].lstrip("/")) / p["path"].lstrip("/")
    return OUT / (lang["prefix"].lstrip("/")) / p["path"].lstrip("/") / "index.html"


# --------------------------------------------------------------------------
# sitemap.xml, robots.txt, redirects
# --------------------------------------------------------------------------
def write_sitemap_xml():
    today = date.today().isoformat()
    urls = []
    for p in R.P:
        if not p["sitemap"]:
            continue
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{L["hreflang"]}" href="{BASE}{L["prefix"]}{p["path"]}"/>' for L in R.LANGS)
        alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{BASE}{p["path"]}"/>'
        for L in R.LANGS:
            pr = "1.0" if p["id"] == "home" else ("0.8" if p["template"] in ("product",) or p["parent"] == "home" else "0.6")
            urls.append(f"<url><loc>{BASE}{L['prefix']}{p['path']}</loc><lastmod>{today}</lastmod><priority>{pr}</priority>{alts}</url>")
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n")
    (OUT / "sitemap.xml").write_text(xml)
    return len(urls)


def write_robots():
    (OUT / "robots.txt").write_text(
        "# robots.txt – HYT Engineering\nUser-agent: *\nAllow: /\nDisallow: /thank-you/\n"
        + "".join(f"Disallow: {L['prefix']}/thank-you/\n" for L in R.LANGS if L["prefix"])
        + f"\nSitemap: {BASE}/sitemap.xml\n")


def all_redirects():
    pairs = []
    for old, new in R.REDIRECTS + R.EXTRA_REDIRECTS:
        for L in R.LANGS:
            pairs.append((L["prefix"] + old, L["prefix"] + new))
    return pairs


def write_redirects():
    pairs = all_redirects()
    # Apache (.htaccess)
    rules = []
    for old, new in pairs:
        pattern = "^" + re.escape(old.lstrip("/")).replace("\\/", "/").rstrip("/") + "/?$"
        rules.append(f"RewriteRule {pattern} {new} [R=301,L,NC]")
    err404 = "\n".join(
        f'<If "%{{REQUEST_URI}} =~ m#^{L["prefix"]}/#">\n    ErrorDocument 404 {L["prefix"]}/404.html\n</If>' for L in R.LANGS if L["prefix"])
    htaccess = f"""# HYT Engineering – Apache configuration (generated by src/build.py)
# Requires mod_rewrite, mod_headers, mod_expires and mod_deflate (standard on cPanel hosting).

Options -Indexes -MultiViews
DirectoryIndex index.html
DirectorySlash On
AddDefaultCharset UTF-8
AddType image/svg+xml .svg
AddType font/woff2 .woff2
AddType application/manifest+json .webmanifest

ErrorDocument 404 /404.html
{err404}

<IfModule mod_rewrite.c>
RewriteEngine On

# 1. Force HTTPS and the canonical host (no www) – uncomment after TLS is live.
# RewriteCond %{{HTTPS}} off [OR]
# RewriteCond %{{HTTP_HOST}} ^www\\. [NC]
# RewriteRule ^ https://hytengineering.com%{{REQUEST_URI}} [R=301,L,NE]

# 2. Permanent redirects from the Redirects tab of the sitemap workbook (all six language folders).
{chr(10).join(rules)}

# 3. Never expose /index.html – redirect to the clean directory URL.
RewriteCond %{{THE_REQUEST}} \\s/+(.*/)?index\\.html[\\s?] [NC]
RewriteRule ^(.*/)?index\\.html$ /$1 [R=301,L,NE]

# 4. Add the trailing slash to directory URLs (avoids duplicate URLs).
RewriteCond %{{REQUEST_FILENAME}} !-f
RewriteCond %{{REQUEST_FILENAME}}/index.html -f
RewriteRule ^(.*[^/])$ /$1/ [R=301,L]
</IfModule>

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
# Tighten connect-src/form-action to your form provider once chosen (see docs/forms-integration.md).
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self' https:; form-action 'self' https:; frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com; media-src 'self'; base-uri 'self'; object-src 'none'"
<FilesMatch "\\.(css|js|woff2|jpg|jpeg|png|svg|webp|pdf)$">
Header set Cache-Control "public, max-age=2592000"
</FilesMatch>
<FilesMatch "\\.(html|json|xml|txt)$">
Header set Cache-Control "public, max-age=600, must-revalidate"
</FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml application/xml text/plain
</IfModule>
"""
    (OUT / ".htaccess").write_text(htaccess)

    # Netlify / Cloudflare Pages (_redirects)
    lines = ["# HYT Engineering – Netlify / Cloudflare Pages redirects (generated by src/build.py)"]
    for old, new in pairs:
        lines.append(f"{old}  {new}  301")
        lines.append(f"{old.rstrip('/')}  {new}  301")
    for L in R.LANGS:
        if L["prefix"]:
            lines.append(f"{L['prefix']}/*  {L['prefix']}/404.html  404")
    lines.append("/*  /404.html  404")
    (OUT / "_redirects").write_text("\n".join(lines) + "\n")

    # nginx snippet (documentation)
    ng = ["# HYT Engineering – nginx server-block snippet (generated by src/build.py)",
          "# root /var/www/hyt-website;", "index index.html;", "error_page 404 /404.html;"]
    for L in R.LANGS:
        if L["prefix"]:
            ng.append(f"location ^~ {L['prefix']}/ {{ error_page 404 {L['prefix']}/404.html; try_files $uri $uri/ =404; }}")
    for old, new in pairs:
        ng.append(f"location = {old} {{ return 301 {new}; }}")
        ng.append(f"location = {old.rstrip('/')} {{ return 301 {new}; }}")
    ng.append("location / { try_files $uri $uri/ =404; }")
    (ROOT / "deploy").mkdir(exist_ok=True)
    (ROOT / "deploy" / "nginx-hyt.conf").write_text("\n".join(ng) + "\n")
    return len(pairs)


# --------------------------------------------------------------------------
def main():
    # Clean previously generated HTML (keep assets and translations sources)
    for L in R.LANGS:
        if L["prefix"]:
            shutil.rmtree(OUT / L["prefix"].lstrip("/"), ignore_errors=True)
    for p in R.P:
        if p["path"] not in ("/",) and not p["path"].endswith(".html"):
            top = p["path"].strip("/").split("/")[0]
            shutil.rmtree(OUT / top, ignore_errors=True)

    (OUT / "translations").mkdir(exist_ok=True)
    count = 0
    for L in R.LANGS:
        common, pages = load_lang(L["code"])
        tr_name = "en" if L["code"] == "en" else L["code"]
        (OUT / "translations" / f"{tr_name}.json").write_text(json.dumps(common, ensure_ascii=False, indent=2))
        ctx = Ctx(L, common, pages)
        write_search_index(ctx)
        for p in R.P:
            html_ = render_page(ctx, p["id"])
            dest = out_path(L, p["id"])
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(html_)
            count += 1
    n_urls = write_sitemap_xml()
    write_robots()
    n_red = write_redirects()
    print(f"Built {count} pages, {n_urls} sitemap URLs, {n_red} redirects.")
    uniq = sorted(set(WARNINGS))
    fallback = [w for w in uniq if "not translated" in w or "common.json missing" in w]
    other = [w for w in uniq if w not in fallback]
    if fallback:
        langs = sorted({w[1:w.index("]")] for w in fallback})
        print(f"{len(fallback)} pages fell back to English (untranslated) in: {', '.join(langs)}")
    if other:
        print(f"{len(other)} warnings:")
        for w in other:
            print("  -", w)


if __name__ == "__main__":
    main()

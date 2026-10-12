#!/usr/bin/env python3
"""Generate the SAMPLE HYT product catalogue (A4 PDF) from the site content.

    python3 tools/catalogue/make_catalogue.py

Output: hyt-website/assets/documents/catalogue/hyt-sample-catalogue.pdf
Text and specifications are read from src/content/en/products.json so the
catalogue never contradicts the website. Every page is marked
"SAMPLE CATALOGUE — FOR DESIGN AND TESTING".
"""
import json
import re
import sys
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
import registry as R  # noqa: E402

OUT = ROOT / "hyt-website/assets/documents/catalogue/hyt-sample-catalogue.pdf"
IMG = ROOT / "hyt-website/assets/images"
HERE = Path(__file__).resolve().parent
NAVY, ORANGE, CHAR, GREY, LIGHT, BORDER = (HexColor(c) for c in ("#142D4E", "#F58220", "#252525", "#6B7280", "#F4F5F6", "#E5E7EB"))
W, H = A4
M = 18 * mm
SAMPLE = "SAMPLE CATALOGUE — FOR DESIGN AND TESTING"

content = json.loads((ROOT / "src/content/en/products.json").read_text())["pages"]
common = json.loads((ROOT / "src/content/en/common.json").read_text())
LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")


def clean(s):
    return LINK.sub(r"\1", s or "").replace("**", "")


body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.2, leading=13.2, textColor=CHAR)
small = ParagraphStyle("small", parent=body, fontSize=7.6, leading=10, textColor=GREY)
cell = ParagraphStyle("cell", parent=body, fontSize=7.8, leading=10)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold", textColor=NAVY)


def image(c, name, x, y, w, h, fx=0.5):
    f = IMG / f"{name}.jpg"
    if f.exists():
        ir = ImageReader(str(f))
        iw, ih = ir.getSize()
        # cover-fit crop
        scale = max(w / iw, h / ih)
        dw, dh = iw * scale, ih * scale
        c.saveState()
        p = c.beginPath()
        p.rect(x, y, w, h)
        c.clipPath(p, stroke=0, fill=0)
        c.drawImage(ir, x - (dw - w) * fx, y - (dh - h) / 2, dw, dh)
        c.restoreState()
    else:
        c.setFillColor(LIGHT)
        c.rect(x, y, w, h, stroke=0, fill=1)
        c.setFillColor(GREY)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + w / 2, y + h / 2, f"[sample image: {name}]")


def para(c, text, style, x, y_top, w):
    p = Paragraph(text, style)
    _, h = p.wrap(w, 1000)
    p.drawOn(c, x, y_top - h)
    return y_top - h


def chrome(c, n, title=""):
    c.setFillColor(NAVY)
    c.rect(0, H - 14 * mm, W, 14 * mm, stroke=0, fill=1)
    c.drawImage(str(HERE / "hyt-logo-reversed.png"), M, H - 12.5 * mm, 22 * mm, 11 * mm, mask="auto")
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - M, H - 8.6 * mm, title.upper())
    c.setFillColor(ORANGE)
    c.rect(0, H - 14.8 * mm, 40 * mm, 0.8 * mm, stroke=0, fill=1)
    # footer
    c.setStrokeColor(BORDER)
    c.line(M, 14 * mm, W - M, 14 * mm)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(ORANGE)
    c.drawString(M, 9 * mm, SAMPLE)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    c.drawRightString(W - M, 9 * mm, f"HYT Engineering Company Pvt. Ltd.  ·  {n}")


def cover(c):
    image(c, "homepage/hero-wheel-lathe-workshop", 0, H * 0.38, W, H * 0.62, fx=0.66)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H * 0.38, stroke=0, fill=1)
    c.setFillColor(ORANGE)
    c.rect(0, H * 0.38 - 1.2 * mm, 60 * mm, 2.4 * mm, stroke=0, fill=1)
    c.drawImage(str(HERE / "hyt-logo-reversed.png"), M, 86 * mm, 44 * mm, 21.8 * mm, mask="auto")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(M, 73 * mm, "Product Catalogue")
    c.setFont("Helvetica", 13)
    c.setFillColor(HexColor("#C9D1DC"))
    c.drawString(M, 63 * mm, "CNC wheel lathes · Wheel & axle shop machines · Depot equipment")
    c.drawString(M, 56 * mm, "Turnkey railway workshops · Lifetime service")
    # sample band
    c.setFillColor(ORANGE)
    c.rect(M, 24 * mm, W - 2 * M, 16 * mm, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W / 2, 30.3 * mm, SAMPLE)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(HexColor("#9FB0C4"))
    c.drawString(M, 14 * mm, "Illustrations are generated sample images. Specifications are placeholders unless confirmed by HYT in a technical offer.")
    c.showPage()


def intro(c, n):
    chrome(c, n, "About HYT")
    y = H - 30 * mm
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(M, y, "COMPANY INTRODUCTION")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(M, y - 11 * mm, "Precision that keeps fleets moving")
    y -= 18 * mm
    text = [
        "HYT Engineering designs, builds, installs and maintains machines for railway wheel and axle work. "
        "The company traces its origins to 1977, when it began building small drilling machines and lathes in Pune, India, "
        "and was incorporated as HYT Engineering Company Pvt. Ltd. in 1989.",
        "Today the portfolio covers CNC underfloor, tandem, surface and portal wheel lathes; vertical turning and axle machining; "
        "wheel presses, measuring and balancing machines; depot equipment; and complete turnkey wheel shops – supported by "
        "installation, maintenance contracts, spare parts, retro-fitment and training.",
    ]
    for t in text:
        y = para(c, t, body, M, y, W - 2 * M - 70 * mm) - 3 * mm
    image(c, "company/manufacturing-facility", W - M - 64 * mm, H - 92 * mm, 64 * mm, 40 * mm)
    # facts
    y -= 6 * mm
    facts = [("1977", "Origins of the company"), ("1,100+*", "Machines delivered (company figure)"),
             ("ISO", "9001:2015 · 14001:2015 · 45001:2018"), ("Pune", "Design and manufacturing, India")]
    bw = (W - 2 * M) / 4
    for i, (v, l) in enumerate(facts):
        x = M + i * bw
        c.setFillColor(LIGHT)
        c.rect(x + 1, y - 26 * mm, bw - 2, 26 * mm, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(x + 5 * mm, y - 11 * mm, v)
        c.setFillColor(ORANGE)
        c.rect(x + 5 * mm, y - 14.5 * mm, 8 * mm, 0.8 * mm, stroke=0, fill=1)
        para(c, l, small, x + 5 * mm, y - 16.5 * mm, bw - 10 * mm)
    y -= 34 * mm
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(M, y, "Product families in this catalogue")
    y -= 7 * mm
    for cat in R.PRODUCT_CATEGORIES:
        names = ", ".join(content[p["id"]]["nav"] for p in R.P if p.get("category") == cat)
        y = para(c, f"<b>{common['categories'][cat]}</b> – {names}", body, M, y, W - 2 * M) - 2.5 * mm
    para(c, "* Figure to be confirmed by HYT before publication.", small, M, 24 * mm, W - 2 * M)
    c.showPage()


def product_block(c, pid, y_top):
    p = R.PAGES[pid]
    pg = content[pid]
    h = (y_top - 18 * mm - 6 * mm) if False else 118 * mm
    image(c, p["image"], M, y_top - 58 * mm, 72 * mm, 45 * mm)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(M, y_top - 6 * mm, common["categories"][p["category"]].upper())
    tx = M + 78 * mm
    tw = W - M - tx
    c.setFillColor(NAVY)
    y = para(c, f'<font name="Helvetica-Bold" size="13.5" color="#142D4E">{clean(pg["nav"])}</font>',
             ParagraphStyle("t", parent=body, leading=16), tx, y_top - 10 * mm, tw)
    if p.get("model"):
        y = para(c, f'<font name="Helvetica-Bold" color="#B4580F">Model: {p["model"]}</font>', body, tx, y - 1 * mm, tw)
    y = para(c, clean(pg.get("summary")), body, tx, y - 2 * mm, tw)
    specs = next((b for b in pg["blocks"] if b["type"] == "specs"), None)
    ty = y_top - 63 * mm
    if specs:
        rows = specs["rows"][:7]
        cols = specs["columns"]
        data = [[Paragraph(f"<b>{clean(x)}</b>", ParagraphStyle("h", parent=cell, textColor=white)) for x in cols]]
        data += [[Paragraph(clean(r[0]), cellb)] + [Paragraph(clean(v), cell) for v in r[1:]] for r in rows]
        first = 58 * mm
        rest = (W - 2 * M - first) / max(1, len(cols) - 1)
        t = Table(data, colWidths=[first] + [rest] * (len(cols) - 1))
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT]),
            ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        _, th = t.wrap(W - 2 * M, 1000)
        t.drawOn(c, M, ty - th)
        ty -= th + 2 * mm
        para(c, "Specification placeholder – values marked “On request” or * are confirmed in HYT's technical offer.", small, M, ty, W - 2 * M)


def products(c, n):
    ids = [p["id"] for p in R.P if p["template"] == "product"]
    for i in range(0, len(ids), 2):
        chrome(c, n, "Products")
        product_block(c, ids[i], H - 22 * mm)
        if i + 1 < len(ids):
            c.setStrokeColor(BORDER)
            c.line(M, H / 2 - 2 * mm, W - M, H / 2 - 2 * mm)
            product_block(c, ids[i + 1], H / 2 - 7 * mm)
        c.showPage()
        n += 1
    return n


def services_contact(c, n):
    chrome(c, n, "Services & contact")
    y = H - 30 * mm
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(M, y, "Support for the whole machine life")
    y -= 10 * mm
    items = [("Installation & commissioning", "Foundation checks, alignment, acceptance trials, documented handover."),
             ("AMC & CMC contracts", "Planned preventive maintenance with defined scope and response."),
             ("Spare parts & support", "Critical spares, tooling and consumables identified and supplied."),
             ("Retro-fitment & upgradation", "New CNC systems, drives and measuring technology for older machines."),
             ("Training", "Operators, programmers and maintenance teams trained on site."),
             ("MAAS – wet leasing", "HYT supplies machine and crew; the customer pays for output."),
             ("Turnkey (EPC) projects", "Complete wheel shops and depots, from layout to lifetime support.")]
    for t, d in items:
        c.setFillColor(ORANGE)
        c.rect(M, y - 1.2 * mm, 2.2 * mm, 2.2 * mm, stroke=0, fill=1)
        y = para(c, f"<b>{t}</b> – {d}", body, M + 6 * mm, y + 2 * mm, W - 2 * M - 6 * mm) - 3 * mm
    image(c, "company/service-maintenance", M, y - 62 * mm, W - 2 * M, 58 * mm)
    y -= 72 * mm
    c.setFillColor(NAVY)
    c.rect(M, y - 52 * mm, W - 2 * M, 52 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(M + 8 * mm, y - 11 * mm, "Contact (sample – verify before printing)")
    con = common["contact"]
    lines = con["address_lines"] + [f"Tel. {con['phone']} / {con['phone_alt']}  ·  Toll-free {con['tollfree']}",
                                     f"{con['email']}  ·  https://hytengineering.com"]
    c.setFont("Helvetica", 9.5)
    c.setFillColor(HexColor("#C9D1DC"))
    for i, ln in enumerate(lines):
        c.drawString(M + 8 * mm, y - 20 * mm - i * 5 * mm, ln)
    c.showPage()


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("HYT Product Catalogue – SAMPLE for design and testing")
    c.setAuthor("HYT Engineering Company Pvt. Ltd. (sample)")
    c.setSubject(SAMPLE)
    cover(c)
    intro(c, 2)
    n = products(c, 3)
    services_contact(c, n)
    c.save()
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

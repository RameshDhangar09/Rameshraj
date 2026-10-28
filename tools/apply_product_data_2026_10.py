"""One-off update of the English product pages from HYT's
"HYT Product Web Content (Corrected)" document, received 19 Oct 2026.

Replaces meta title/description, lede, overview, "Why choose" advantages and the
technical-data tables of 13 product pages, removes the "awaiting HYT data"
notices, and corrects FAQ / feature text that contradicted the new data.
Run once from the repository root:  python3 tools/apply_product_data_2026_10.py
"""
import json
from pathlib import Path

F = Path("src/content/en/products.json")
D = json.loads(F.read_text())
P = D["pages"]

SPEC_INTRO = "Technical data from HYT. Each machine is configured to your track gauge, wheel profiles and vehicles."
SPEC_NOTE = "Values that depend on track gauge are marked in the table. Final figures are confirmed in the technical offer."

# Shared row labels for the wheel-lathe tables
L = dict(cfg="Machine configuration", drive="Main drive capacity", vc="Cutting speed while profiling",
         feed="Tool post feed for wheel profiling", rapid="Tool post rapid speed, both axes",
         chip="Max. chip cross-section / stock removal while profiling", cycle="Cycle time per wheelset",
         gauge="Track gauge", dia="Wheel tread diameter, max. / min.", width="Wheel width",
         wb="Wheelbase distance, min. – max.", load="Max. axle load / wheelset weight",
         d2="Difference in diameter of both wheels", d4="Difference in diameter of four wheels in one bogie",
         prof="Accuracy of wheel profile against standard gauge", rad="Radial run-out of wheel",
         ax="Axial run-out of wheel", ra="Profile surface finish")

UF_COMMON = [  # identical for YUGL / YUGLX 30 and 15
    ("vc", "20–120 m/min (optional 20–300 m/min)"), ("feed", "0.1–2.5 mm/rev"),
    ("rapid", "Longitudinal carriage 5000 mm/min; vertical slide 3000 mm/min"),
]
TOL = [("d2", "< 0.10 mm"), ("d4", "< 0.3 mm"), ("prof", "< 0.2 mm"), ("rad", "< 0.10 mm"), ("ax", "< 0.15 mm"), ("ra", "< 12.5 μm Ra")]


def table(models, rows):
    """rows: list of (label-key-or-text, value-for-model-1, value-for-model-2, ...)"""
    out = []
    for r in rows:
        label = L.get(r[0], r[0])
        vals = list(r[1:])
        if len(vals) == 1 and len(models) > 1:
            vals = vals * len(models)
        out.append([label] + vals)
    return ["Parameter"] + models, out


def adv(items, icons):
    return [{"icon": ic, "title": t, "text": x} for (t, x), ic in zip(items, icons)]


def block(page, bid):
    return next(b for b in P[page]["blocks"] if b.get("id") == bid)


def drop_notices(page):
    P[page]["blocks"] = [b for b in P[page]["blocks"] if b["type"] != "notice"]


def faq(page, i, a=None, q=None):
    it = block(page, "faq")["items"][i]
    if q:
        it["q"] = q
    if a:
        it["a"] = a


def apply(pid, *, title, description, lede, what, paras, model_name, why, icons, models, rows,
          alt, intro=SPEC_INTRO, note=SPEC_NOTE):
    p = P[pid]
    p["title"], p["description"], p["lede"] = title, description, lede
    ov = block(pid, "overview")
    ov["eyebrow"] = "Product overview"
    ov["heading"] = what
    ov["paragraphs"] = paras
    ov["image_alt"] = alt
    a = block(pid, "advantages")
    a["eyebrow"] = "Key advantages"
    a["heading"] = f"Why choose the {model_name}?"
    a["items"] = adv(why, icons)
    a["cols"] = 2 if len(why) == 4 else 3
    s = block(pid, "specifications")
    s["heading"] = "Technical data"
    s["intro"] = intro
    s["columns"], s["rows"] = table(models, rows)
    s["note"] = note
    drop_notices(pid)
    g = block(pid, "gallery")["items"][0]
    g["caption"] = alt


# ---------------------------------------------------------------- YUGLX
apply("tandem-underfloor-wheel-lathe-yuglx",
      title="CNC Tandem Underfloor Wheel Lathe YUGLX",
      description="Two synchronised CNC underfloor wheel lathes reprofiling all wheelsets of a coach or locomotive simultaneously, without uncoupling the train set.",
      lede="Two synchronised underfloor wheel lathes working in tandem – reprofiling two wheelsets of a complete coach or locomotive without uncoupling from the train set.",
      what="What is the CNC Tandem Underfloor Wheel Lathe?",
      paras=[
          "The CNC Tandem Underfloor Wheel Lathe (Model YUGLX) is HYT's most advanced wheel reprofiling solution – a combination of two full CNC underfloor wheel lathes working in perfectly synchronised tandem mode to reprofile multiple wheelsets of an entire coach or locomotive simultaneously.",
          "One machine is fixed while the other is movable, driven by CNC-controlled linear motion guideways, to accommodate the varying wheelbase distances of different bogie configurations across coaches, locomotives, metro trains and EMUs.",
          "The tandem configuration is particularly valuable in train-set formations where coaches cannot be separated. The entire train can be brought in and wheel profiling of a complete coach carried out in under two hours, dramatically reducing the time the vehicle is held out of revenue service.",
      ],
      model_name="YUGLX",
      why=[("Independent CNC control", "Individual CNC systems synchronise seamlessly for efficient tandem machining."),
           ("Heavy-duty box-type construction", "A rigid cast structure ensures stability, vibration damping and machining accuracy."),
           ("Reduced train downtime", "Simultaneous machining cuts maintenance time by up to 50%, even when coaches cannot be separated."),
           ("Centralised machine control", "A single operator station manages measurement, machining and process monitoring."),
           ("Industry 4.0 ready", "Integrated smart diagnostics, real-time monitoring and digital connectivity for enhanced productivity.")],
      icons=["cpu", "bricks", "clock-history", "display", "diagram-3"],
      models=["YUGLX 30", "YUGLX 15"],
      rows=[("cfg", "Two synchronised underfloor lathes on a common supporting bed; one fixed, the other with longitudinal movement to suit the bogie",
             "Two synchronised underfloor lathes on a common supporting bed, for urban vehicles; one fixed, the other with longitudinal movement"),
            ("drive", "4 × 13.5 kW on friction rollers, for each machine", "4 × 9 kW on friction rollers, for each machine"),
            *UF_COMMON,
            ("chip", "10 mm²", "6 mm²"), ("cycle", "30 minutes"), ("gauge", "1000–1676 mm"),
            ("dia", "1600 mm / 580 mm", "1250 mm / 375 mm"), ("width", "75–155 mm"), ("wb", "1700–3200 mm"),
            ("load", "30 t (40 t on request)", "18 t"), *TOL],
      alt="HYT CNC Tandem Underfloor Wheel Lathe YUGLX – two synchronised underfloor lathes in a depot pit",
      note="Final figures are confirmed in the technical offer.")
faq("tandem-underfloor-wheel-lathe-yuglx", 0,
    a="Both are tandem underfloor lathes. On the YUGLX one machine is fixed and the other moves on CNC-controlled linear guideways; it is offered as the YUGLX 30 (tread diameters 580–1600 mm, 30 t axle load) and YUGLX 15 for urban vehicles, with a wheelbase range of 1700–3200 mm. The [YUL-12T](page:tandem-underfloor-wheel-lathe) has a 4 × 15 kW drive per machine, a standard centre distance of 1800–3100 mm and tread diameters of 540–1500 mm. Our engineers will recommend the model that suits your fleet.")

# ---------------------------------------------------------------- YUGL
apply("underfloor-wheel-lathe-yugl",
      title="CNC Underfloor Wheel Lathe YUGL",
      description="HYT's flagship underfloor wheel lathe reprofiles both wheels of a wheelset simultaneously, without removing the wheelset from the rolling stock.",
      lede="HYT's flagship wheel lathe – simultaneous reprofiling of both wheels of a wheelset without removing the wheelset from the rolling stock.",
      what="What is the CNC Underfloor Wheel Lathe?",
      paras=[
          "The CNC Underfloor Wheel Lathe (Model YUGL) is HYT's flagship product – an automatic machine designed for the simultaneous profiling of new or worn wheels of railway vehicles without removing the wheelsets from the rolling stock.",
          "Installed in a pit below track level, the machine lifts and centres each wheelset using synchronised drive rollers, then precisely reprofiles both wheels simultaneously using dual CNC tool posts, restoring the wheel tread profile to its original specification.",
          "Wheelsets of all types of rolling stock – locomotives, coaches, wagons, metro trains and EMUs – can be turned on this machine while in their assembled condition. A fully integrated pre- and post-machining measurement system ensures that every wheel is machined to exact tolerances, minimising material removal and extending wheel life.",
      ],
      model_name="YUGL",
      why=[("Heavy-duty dual column construction", "Built with close-grained cast iron for maximum rigidity and machining accuracy."),
           ("Synchronised wheelset lifting", "Four drive rollers automatically lift and centre the wheelset with precision feedback control."),
           ("Intelligent CNC wear measurement", "Optimises cutting depth for consistent wheel profiling and extended tool life."),
           ("Centralised machine control", "A single operator station manages measurement, machining and process monitoring."),
           ("Quick-change tooling system", "Reduces setup time and increases overall machine productivity.")],
      icons=["bricks", "arrows-collapse", "rulers", "display", "tools"],
      models=["YUGL 30", "YUGL 15"],
      rows=[("cfg", "Single underfloor lathe; wheelset reprofiled in situ, without disassembly",
             "Single underfloor lathe for urban vehicles; wheelset reprofiled in situ"),
            ("drive", "4 × 13.5 kW on friction rollers", "4 × 9 kW on friction rollers"),
            *UF_COMMON,
            ("chip", "10 mm²", "6 mm²"), ("cycle", "30 minutes"), ("gauge", "1000–1676 mm"),
            ("dia", "1600 mm / 580 mm", "1250 mm / 375 mm"), ("width", "75–155 mm"), ("Wheelset distance, min. – max.", "1700–3200 mm"),
            ("load", "30 t (40 t on request)", "18 t"), *TOL],
      alt="HYT CNC Underfloor Wheel Lathe YUGL with drive rollers and dual CNC tool posts",
      note="Final figures are confirmed in the technical offer.")
faq("underfloor-wheel-lathe-yugl", 0,
    a="Both are single-axle underfloor lathes that reprofile wheelsets in the vehicle. The YUGL is offered as the YUGL 30 (4 × 13.5 kW, tread diameters 580–1600 mm, 30 t axle load) and the YUGL 15 for urban vehicles. The [YUL-08](page:underfloor-wheel-lathe) has a 4 × 15 kW drive on individually floating rollers, tread diameters of 540–1500 mm and axle loads of 300 / 400 kN, and can also machine brake discs. Our engineers will recommend the model that suits your fleet.")

# ---------------------------------------------------------------- YUL-12T
apply("tandem-underfloor-wheel-lathe",
      title="CNC Tandem Underfloor Wheel Lathe YUL-12T",
      description="Two underfloor wheel lathes in tandem, reprofiling both wheelsets of a bogie simultaneously in situ. Centre distance adjustable from 1800 to 3100 mm.",
      lede="Two underfloor wheel lathes working as one – reprofiling two vehicle-mounted wheelsets at the same time, in situ, and cutting reprofiling time by up to half.",
      what="What is the CNC Tandem Underfloor Wheel Lathe?",
      paras=[
          "The CNC Tandem Underfloor Wheel Lathe (Model YUL-12T) is a pair of underfloor wheel lathes installed on a common foundation and shared infrastructure. Two vehicle-mounted wheelsets are reprofiled simultaneously in situ, without removing the wheelsets, the bogie brake gear, the axle box covers or any other component of the railway vehicle.",
          "One machine is fixed and the second is fixed or movable, so the pair accommodates the varying wheelbases of different bogies. The standard centre distance between the two machines ranges from 1800 to 3100 mm and can be changed to suit a specific requirement.",
          "The two CNC systems communicate with each other and exchange data, holding the difference in diameter across all four wheels of one bogie below 0.3 mm. The machines can also run under independent control, so a single wheelset can be machined when that is all that is required, and the brake discs of both wheelsets can be turned simultaneously.",
      ],
      model_name="YUL-12T",
      why=[("Two wheelsets in one cycle", "Reprofiling time is reduced by up to 50%, returning rolling stock to revenue service faster."),
           ("Adjustable centre distance", "1800 to 3100 mm as standard, covering the varying wheelbases of different bogies."),
           ("Synchronised or independent control", "The two CNC systems communicate and exchange data, and either machine can also work on its own."),
           ("Bogie-level accuracy", "The difference in diameter across the four wheels of one bogie is held below 0.3 mm."),
           ("Common infrastructure", "Both machines share a single foundation and services, simplifying installation."),
           ("Simultaneous brake disc machining", "The discs of both wheelsets can be turned in the same cycle using quick-change tooling."),
           ("Probe or laser measurement", "Automatic measurement of profile and diameter before and after turning, with data stored in the CNC system.")],
      icons=["clock-history", "arrows-expand", "diagram-3", "bullseye", "building", "disc", "rulers"],
      models=["YUL-12T"],
      rows=[("cfg", "Two underfloor lathes on a common foundation; centre distance 1800–3100 mm as standard"),
            ("drive", "4 × 15 kW on friction rollers, for each machine"),
            ("vc", "20–120 m/min (optional 20–300 m/min)"), ("feed", "0.1–2.5 mm/rev"), ("rapid", "3000 mm/min"),
            ("chip", "10 mm²"), ("cycle", "35 minutes"), ("gauge", "As required"),
            ("dia", "1500 mm / 540 mm (depends on track gauge)"), ("width", "75–155 mm"),
            ("Wheelset distance, min. – max.", "1800–3200 mm"), ("load", "300 / 400 kN axle load"), *TOL],
      alt="HYT CNC Tandem Underfloor Wheel Lathe YUL-12T – two underfloor lathes on a common foundation")
faq("tandem-underfloor-wheel-lathe", 3,
    a="Both are tandem underfloor lathes. The YUL-12T has a 4 × 15 kW drive per machine, a standard centre distance of 1800–3100 mm and tread diameters of 540–1500 mm. On the [YUGLX](page:tandem-underfloor-wheel-lathe-yuglx) the movable machine runs on CNC-controlled linear guideways; it covers a wheelbase range of 1700–3200 mm and, as the YUGLX 30, tread diameters up to 1600 mm. Our engineers will recommend the model that suits your fleet.")
faq("tandem-underfloor-wheel-lathe", 0,
    a="Machining both wheelsets of a bogie in one cycle reduces reprofiling time by up to 50% compared with a single underfloor machine. Actual savings depend on your vehicles and depot routine.")

# ---------------------------------------------------------------- YUL-08
apply("underfloor-wheel-lathe",
      title="CNC Underfloor Wheel Lathe YUL-08",
      description="In-situ CNC underfloor wheel lathe for railway wheelsets. Four 15 kW drive rollers, tread diameters to 1500 mm and axle loads up to 400 kN.",
      lede="Simultaneous reprofiling of both wheels of a wheelset in situ – without removing the wheelset, the bogie brake gear or the axle box covers from the vehicle.",
      what="What is the CNC Underfloor Wheel Lathe?",
      paras=[
          "The CNC Underfloor Wheel Lathe (Model YUL-08) is an automatic machine for the simultaneous re-profiling of new or worn wheels of railway vehicles in situ. Wheelsets of locomotives, coaches, wagons, trams and metro vehicles can be machined while still assembled in the rolling stock, and brake discs mounted on those wheelsets can be machined on the same machine.",
          "Installed in a pit below track level, the machine lifts and centres the wheelset on four synchronised drive rollers, then reprofiles both wheels simultaneously using two CNC tool posts. Each roller is connected to a 15 kW AC motor through a heavy-duty reduction gearbox, and digital variable speed drives give infinite speed variation so the machine can cut through hard spots and skid marks.",
          "The drive rollers float individually to compensate for wheel irregularities and maintain continuous contact, while an individual jack and hold-down device provides rigid support and clamping of the axle or bearing box. Contact-type probes measure profile and diameter before and after turning, and the CNC software uses that wear data to suggest the most economical depth of cut.",
      ],
      model_name="YUL-08",
      why=[("In-situ machining", "Reprofiles wheelsets without removing them from the vehicle, so the bogie brake gear and axle box covers stay in place."),
           ("Close-grained cast iron structure", "Gives dimensional and structural stability with efficient vibration damping."),
           ("Individually floating drive rollers", "Compensate for wheel irregularities and maintain continuous contact throughout the cut."),
           ("Electronic wear measurement", "The CNC software processes the wear data and suggests the most economical depth of cut."),
           ("Individual jack and hold-down device", "Rigid support and clamping of the axle or bearing box, suited to vehicles with higher axle loads."),
           ("Optional brake disc machining", "Quick-change tooling and adapters remove unevenness from both side brake discs in the same setup."),
           ("Remote diagnostics and teleservices", "Windows-based open architecture software supports remote maintenance from HYT headquarters.")],
      icons=["train-front", "bricks", "arrow-down-up", "rulers", "lock", "disc", "wifi"],
      models=["YUL-08"],
      rows=[("cfg", "Single underfloor lathe; wheelset machined in situ, including brake discs assembled on the wheelset"),
            ("drive", "4 × 15 kW on friction rollers"), ("vc", "20–120 m/min"), ("feed", "0.1–2.5 mm/rev"),
            ("rapid", "3000 mm/min"), ("chip", "10 mm²"), ("cycle", "35 minutes"), ("gauge", "As required"),
            ("dia", "1500 mm / 540 mm (depends on track gauge)"), ("width", "75–155 mm"),
            ("Wheelset distance, min. – max.", "1800–3200 mm"), ("load", "300 / 400 kN axle load"),
            ("d2", "< 0.10 mm"), ("d4", "< 0.3 mm"), ("prof", "< 0.2 mm"), ("rad", "< 0.1 mm"), ("ax", "< 0.15 mm"), ("ra", "< 12.5 μm Ra")],
      alt="HYT CNC Underfloor Wheel Lathe YUL-08 with a wheelset on its drive rollers")

# ---------------------------------------------------------------- YPL-04
apply("roller-type-portal-wheel-lathe",
      title="CNC Roller Type Portal Wheel Lathe YPL-04",
      description="Portal wheel lathe with six-roller friction drive and roll-through wheelset handling. Both wheels reprofiled in 12 to 16 minutes per wheelset.",
      lede="An automatic portal-construction wheel lathe with friction roller drive and roll-through wheelset handling – for simultaneous reprofiling of disassembled wheelsets.",
      what="What is the CNC Roller Type Portal Wheel Lathe?",
      paras=[
          "The CNC Roller Type Portal Wheel Lathe (Model YPL-04) is an automatic machine in portal construction with roller drives that allow roll-through movement of wheelsets. It is suitable for the simultaneous re-profiling of new or worn wheels once the wheelset has been disassembled from the vehicle, and it also supports wheelsets with a mounted gearbox.",
          "The wheelset is driven by six friction rollers, three per wheel, contacting the upper and lower tread flange areas. Each roller is housed in a spindle cartridge mounted on low-friction rocker arms, allowing vertical adjustment to accommodate wheel diameter variations and maintain consistent contact even on flat or oval surfaces. Controlled hydraulic pressure, regulated by a valve and nitrogen accumulator, keeps that contact stable, and the roller motors are synchronised through a master-slave control system.",
          "Loading and unloading are fully automatic, and roll-in and roll-out from the same direction can be arranged where space is constrained. Wheelsets with an external CTRB are centred and clamped by a hydraulically actuated clamping device, and wheel- and axle-mounted brake discs can be machined as an option.",
      ],
      model_name="YPL-04",
      why=[("Six-roller friction drive", "Three rollers per wheel in through-hardened ground steel at 58–63 HRC, reversible and re-machinable for extended service life."),
           ("Automatic roll-through handling", "Fully automatic loading and unloading, with same-direction roll-in and roll-out available where space is constrained."),
           ("Close-grained cast iron portal frame", "All load-bearing structures give dimensional and geometrical stability with efficient vibration damping."),
           ("CTRB centring and clamping", "Wheelsets with external cartridge bearings are centred and clamped by hydraulic cylinders."),
           ("Integrated wheel wear measurement", "Contact-type probe rollers measure profile, diameter, flange height and thickness, back-to-back distance and wheel width."),
           ("Cut optimisation software", "The CNC processes the wear data and suggests the most economical depth of cut, with all data stored for retrieval."),
           ("Optional brake disc turning", "A retractable case-hardened ram on the carriage machines wheel- and axle-mounted brake discs to below 2.5 μm Ra.")],
      icons=["gear-wide-connected", "arrow-left-right", "bricks", "lock", "rulers", "graph-up", "disc"],
      models=["YPL-04"],
      rows=[("cfg", "Portal construction, six friction rollers, roll-through wheelset handling"),
            ("drive", "Upper rollers 2 × 37 kW; lower rollers 2 × 18.5 kW"), ("vc", "25–80 m/min"),
            ("feed", "0.1–4 mm/rev"), ("rapid", "4500 mm/min"), ("chip", "10–18 mm²"), ("cycle", "12–16 min"),
            ("gauge", "As required"), ("dia", "1250 mm / 650 mm (depends on track gauge)"), ("width", "100–145 mm"),
            ("load", "50 kN wheelset weight"), ("d2", "< 0.1 mm"), ("prof", "< 0.2 mm"), ("rad", "< 0.1 mm"),
            ("ax", "< 0.2 mm"), ("ra", "< 12.5 μm Ra")],
      alt="HYT CNC Roller Type Portal Wheel Lathe YPL-04 with enclosed portal and operator console")
P["roller-type-portal-wheel-lathe"]["summary"] = "Portal wheel lathe with a six-roller friction drive and roll-through handling for reprofiling removed wheelsets in 12–16 minutes."
faq("roller-type-portal-wheel-lathe", 0,
    a="It describes how the wheelset is driven: by six friction rollers, three per wheel, contacting the upper and lower tread flange areas. The rollers sit on rocker arms that adjust vertically, so contact stays consistent even on flat or oval wheels.")
faq("roller-type-portal-wheel-lathe", 1,
    a="Both are portal lathes with roll-through handling for removed wheelsets. The YPL-04 drives the wheelset through six friction rollers (upper 2 × 37 kW, lower 2 × 18.5 kW), takes tread diameters from 650 mm and completes a wheelset in 12–16 minutes. The [YPL-02](page:portal-wheel-lathe) has a 2 × 55 kW main drive and a chip cross-section of 32–50 mm² for heavy cuts, with a cycle time of 8–12 minutes. We help you choose based on your wheelsets and workflow.")
faq("roller-type-portal-wheel-lathe", 2,
    a="Yes – the main data is in the table above. Values that depend on track gauge, and the configuration for your wheelsets, are confirmed in the technical offer.")

# ---------------------------------------------------------------- YPL-02
apply("portal-wheel-lathe",
      title="CNC Portal Wheel Lathe YPL-02",
      description="Portal-construction CNC wheel lathe with roll-through wheelset handling. Simultaneous reprofiling of both wheels in 8 to 12 minutes per wheelset.",
      lede="An automatic machine in portal construction with roll-through movement of wheelsets – engineered for the most demanding railway wheel reprofiling environments.",
      what="What is the CNC Portal Wheel Lathe?",
      paras=[
          "The HYT CNC Portal Wheel Lathe (YPL-02) is purpose-built for the simultaneous reprofiling of new or worn wheels across the complete range of railway vehicle types. Its portal architecture places the cutting heads above the wheelset, allowing roll-through loading of the wheelset.",
          "All load-bearing structures are built from high-strength, close-grained cast iron, delivering exceptional dimensional stability, geometric accuracy and vibration damping – critical for achieving the tight tolerances required in modern railway operations.",
      ],
      model_name="YPL-02",
      why=[("Robust portal construction", "Heavy-duty portal design ensures superior rigidity and machining stability."),
           ("Automatic wheelset handling", "An integrated roll-through system increases productivity and reduces handling time."),
           ("High-rigidity cast structure", "Close-grained cast iron construction delivers exceptional accuracy and vibration damping."),
           ("Intelligent wear measurement", "Electronic wear compensation maintains optimum cutting depth and consistent wheel profiles."),
           ("Enhanced operational safety", "Automatic tool retraction protects the machine during power failures and emergency stops.")],
      icons=["building", "arrow-left-right", "bricks", "rulers", "shield-check"],
      models=["YPL-02"],
      rows=[("cfg", "Portal construction with roll-through wheelset handling"), ("drive", "2 × 55 kW"),
            ("vc", "25–80 m/min"), ("feed", "0.1–4 mm/rev"), ("rapid", "4500 mm/min"), ("chip", "32–50 mm²"),
            ("cycle", "8–12 min"), ("gauge", "As required"), ("dia", "1250 mm / 750 mm (depends on track gauge)"),
            ("width", "75–145 mm"), ("load", "50 kN wheelset weight"), ("d2", "< 0.15 mm"), ("prof", "< 0.2 mm"),
            ("rad", "< 0.1 mm"), ("ax", "< 0.2 mm"), ("ra", "< 12.5 μm Ra")],
      alt="HYT CNC Portal Wheel Lathe YPL-02 with operator at the machine")
faq("portal-wheel-lathe", 3,
    a="Both are portal lathes with roll-through handling for removed wheelsets. The YPL-02 has a 2 × 55 kW main drive for heavy cuts and completes a wheelset in 8–12 minutes. The [YPL-04](page:roller-type-portal-wheel-lathe) drives the wheelset through six friction rollers and suits wheelsets with a mounted gearbox or external cartridge bearings. We recommend one or the other after reviewing your wheelsets and workflow.")

# ---------------------------------------------------------------- YSL series
pid = "surface-wheel-lathe"
YSL_COMMON = [("vc", "25–80 m/min"), ("feed", "0.1–3.5 mm/rev"), ("rapid", "3000 mm/min")]
apply(pid,
      title="CNC Surface Wheel Lathe YSL Series",
      description="CNC surface wheel lathes for reprofiling removed railway wheelsets to OEM tread profile, with integrated pre- and post-machining measurement.",
      lede="High-precision reprofiling of railway wheelsets that have been removed from the rolling stock – restoring the tread profile to exact OEM specification in a single automated cycle.",
      what="What is the CNC Surface Wheel Lathe?",
      paras=[
          "The CNC Surface Wheel Lathe is a high-precision machine designed for the reprofiling of railway wheelsets that have been disassembled from the rolling stock and are machined off the vehicle.",
          "As railway wheels run on track over time, their tread profiles wear unevenly, causing vibration, noise, reduced braking efficiency and safety risks. The CNC Surface Wheel Lathe restores each wheel's profile back to the exact OEM specification in a single, automated cycle.",
          "Wheelsets from all types of rolling stock – locomotives, coaches, wagons, metro trains and EMUs – can be machined on this lathe. A fully integrated pre- and post-machining measurement system ensures that every wheel is machined to exact tolerances, minimising material removal and extending wheel life.",
      ],
      model_name="YSL series",
      why=[("Automatic wheelset roll-in and roll-out", "An integrated traverser moves wheelsets in and out for higher productivity."),
           ("Heavy-duty close-grained cast iron construction", "Ensures maximum rigidity and vibration damping."),
           ("Intelligent CNC wear measurement", "Maintains optimum cutting depth for consistent machining accuracy."),
           ("Remote diagnostics", "Enable faster troubleshooting and expert technical support.")],
      icons=["arrow-left-right", "bricks", "rulers", "wifi"],
      models=["YSL-08", "YSL-12", "YSL-21"],
      rows=[("cfg", "Wheelset removed from the vehicle; both wheels reprofiled simultaneously",
             "Wheelset removed from the vehicle; both wheels reprofiled simultaneously",
             "Wheelset removed from the vehicle; single tool post"),
            ("drive", "2 × 45 or 55 kW", "2 × 37 kW", "1 × 22 kW"), *YSL_COMMON,
            ("chip", "20 mm²", "16 mm²", "10 mm²"),
            ("Cycle time per wheelset (floor to floor)", "14–16 min", "16–18 min", "50–60 min"),
            ("gauge", "As required"), ("dia", "1250 mm / 750 mm (depends on track gauge)"), ("width", "75–145 mm"),
            ("load", "50 kN wheelset weight", "50 kN wheelset weight", "–"),
            ("d2", "< 0.15 mm", "< 0.3 mm", "< 0.5 mm"), ("prof", "< 0.2 mm", "< 0.2 mm", "< 0.3 mm"),
            ("rad", "< 0.2 mm", "< 0.3 mm", "< 0.3 mm"), ("ax", "< 0.2 mm", "< 0.3 mm", "< 0.3 mm"),
            ("ra", "< 12.5 μm Ra")],
      alt="HYT CNC Surface Wheel Lathe YSL-08 with a wheelset in the machine",
      intro="Technical data for the three models of the range. Each machine is configured to your track gauge, wheel profiles and vehicles.",
      note="“–” means no value is published for that model. Final figures are confirmed in the technical offer.")
P[pid]["summary"] = "Floor-level CNC lathes for reprofiling removed wheelsets to OEM tread profile – models YSL-08, YSL-12 and YSL-21."
b = block(pid, "ysl-08")
b["paragraphs"] = ["The YSL-08 is the highest-output model of the range. Two tool posts reprofile both wheels simultaneously, driven by a main drive of 2 × 45 or 55 kW with a chip cross-section of up to 20 mm². A wheelset is completed in 14–16 minutes floor to floor, holding the difference in diameter of both wheels below 0.15 mm."]
b = block(pid, "ysl-12")
b["paragraphs"] = ["The YSL-12 also reprofiles both wheels simultaneously, with a 2 × 37 kW main drive and a chip cross-section of up to 16 mm². It covers the same tread diameters (750–1250 mm) and wheel widths (75–145 mm) as the YSL-08, with a floor-to-floor time of 16–18 minutes per wheelset."]
b["image"], b["image_alt"], b["layout"] = "products/surface-wheel-lathe-ysl-12", "HYT CNC Surface Wheel Lathe YSL-12 with a wheelset clamped between the headstocks", "image-right"
b = block(pid, "ysl-21")
b["paragraphs"] = ["The YSL-21 works with a single tool post and a 1 × 22 kW main drive, with a chip cross-section of up to 10 mm². It takes tread diameters of 750–1250 mm and wheel widths of 75–145 mm, with a floor-to-floor time of 50–60 minutes per wheelset."]
b["image"], b["image_alt"], b["layout"] = "products/surface-wheel-lathe-ysl-21", "HYT CNC Surface Wheel Lathe YSL-21", "image-left"
faq(pid, 1, a="Start with your largest tread diameter, heaviest wheelset and daily volume. All three models take tread diameters of 750–1250 mm (depending on track gauge) and wheel widths of 75–145 mm. The YSL-08 has the shortest cycle (14–16 minutes floor to floor), the YSL-12 follows at 16–18 minutes and the single-tool-post YSL-21 at 50–60 minutes. We confirm the right model with our recommendation.")
g = block(pid, "gallery")["items"]
g[1] = {"image": "products/surface-wheel-lathe-ysl-12", "caption": "HYT CNC Surface Wheel Lathe YSL-12"}
g[2] = {"image": "products/surface-wheel-lathe-ysl-21", "caption": "HYT CNC Surface Wheel Lathe YSL-21"}

# ---------------------------------------------------------------- YVM-04
apply("vertical-turning-boring-machine",
      title="CNC Vertical Turning & Boring Machine YVM-04",
      description="Vertical turning and boring machine for railway wheels. Complete wheel machining in a single clamping, with a 45 kW table drive and 12-station tool changer.",
      lede="The vertical turning and boring solution for railway workshops – complete wheel machining in a single clamping, from hub bore to tread profile.",
      what="What is the CNC Vertical Turning & Boring Machine?",
      paras=[
          "The HYT CNC Vertical Turning & Boring Machine (YVM-04) is purpose-engineered for the full range of railway wheel machining operations. Its vertical spindle orientation allows large-diameter, heavy railway wheels to be fixtured and machined with outstanding stability and accuracy, eliminating the distortion introduced by horizontal fixturing of heavy workpieces.",
          "The combination of a 45 kW table drive, large-diameter thrust bearing support, hardened box guideways and a 12-station automatic tool changer makes the YVM-04 a true single-setup machining centre for every profile on the railway wheel.",
      ],
      model_name="YVM-04",
      why=[("Heavy-duty cast iron structure", "Superior rigidity and vibration-free machining."),
           ("High-precision table assembly", "Thrust and taper roller bearings for maximum accuracy."),
           ("Flexible chuck options", "3-jaw hydraulic or 4-jaw independent chuck."),
           ("Fully enclosed machining area", "Enhanced operator safety."),
           ("Precision guideway system", "Smooth motion, rigidity and consistent accuracy."),
           ("12-station automatic tool changer", "Faster setup and higher productivity.")],
      icons=["bricks", "bullseye", "nut", "shield-check", "arrows-move", "tools"],
      models=["YVM-04"],
      rows=[("cfg", "Vertical turning & boring machine; complete wheel machining in a single clamping – plate, profile, rim and hub"),
            ("drive", "Table drive motor 45 kW"), ("Table speed", "3–300 rpm"), ("Rapid traverse rate", "Up to 8000 mm/min"),
            ("Turning / swing diameter", "1600 mm"), ("Table diameter", "1400 mm"), ("Turning height", "600 mm"),
            ("Vertical travel of the ram head", "700 mm"), ("Horizontal traverse of the ram head", "+900 / −50 mm"),
            ("Ram cross-section", "200 × 200 mm or 250 × 250 mm"), ("Workholding", "Three-jaw self-centring hydraulic chuck"),
            ("Tool changer", "12 stations as standard; 20 stations as a custom option"),
            ("Surface finish while boring", "Ra 0.8 μm"), ("Surface finish while turning", "Ra 1.6 μm"),
            ("Surface finish while facing", "Ra 1.6 μm")],
      alt="HYT CNC Vertical Turning & Boring Machine YVM-04",
      note="Final figures are confirmed in the technical offer.")
faq("vertical-turning-boring-machine", 0,
    a="Railway wheels and tyres – plate, tread profile, rim and hub bore – in a single clamping, and similar round components. The machine has a turning diameter of 1600 mm, a table diameter of 1400 mm and a turning height of 600 mm.")

# ---------------------------------------------------------------- ATL-01
apply("axle-turning-lathe",
      title="CNC Axle Turning Lathe ATL-01",
      description="Heavy-duty CNC lathe for roughing and finish machining of railway axles: 41 kW drive, 30–2500 rpm, 3000 mm between centres, 600 mm swing over the cross slide.",
      lede="A heavy-duty, high-precision CNC lathe for roughing and finish machining of railway axles – built for high-production requirements in maintenance depots and production workshops.",
      what="What is the CNC Axle Turning Lathe?",
      paras=[
          "The CNC Axle Turning Lathe (Model ATL-01) is a heavy-duty, high-precision CNC machine engineered specifically for the roughing and finish machining of railway axles. It is suited to high production requirements and is used in both maintenance depots and production workshops.",
          "The machine architecture ensures high rigidity, thermal stability and vibration damping, which keeps dimensional accuracy consistent throughout the machining cycle. Structural members subjected to cutting loads are made in close-grain cast iron, and a compact, stiff cross carriage carries the turret.",
          "In the automatic cycle the machine carries out complete turning of the axle and machining of the bearing seats. Burnishing, drilling and tapping, a retractable 3-jaw chuck with face drive, and complete finish machining of the axle in a single setup are all available on request.",
          "Dedicated control software with customised HMI screens handles the safety measures for easy and safe operation and displays fault messages. Remote maintenance support from HYT headquarters is available, and quick access to the parts that need attention keeps servicing time short. The machine integrates both Industry 4.0 and Industry 5.0 features.",
      ],
      model_name="ATL-01",
      why=[("Built for high-production axle machining", "Roughing and finish machining of railway axles in maintenance depots and production workshops."),
           ("Robust close-grain cast iron construction", "Structural members subjected to cutting loads are cast iron, giving high rigidity, thermal stability and vibration damping."),
           ("Sturdy 600 mm swing over the cross slide", "On a three-way bed, with a compact and stiff cross carriage to machine axles easily."),
           ("Infinite speed variation", "From 30 to 2500 rpm with 1200 Nm of spindle torque, covering both roughing and finishing passes."),
           ("8- or 12-position turret", "Live tooling on request, so drilling and tapping can be carried out without a second setup."),
           ("Optimal geometric accuracy", "In roundness, ovality, surface roughness and cylindricity of the machined axle."),
           ("Heavy-duty self-centring steady rest", "Reliable support of the axle through the cut."),
           ("Direct coolant supply through the turret", "Delivered to the cutting point for efficient cooling."),
           ("Fully enclosed noise-reduction cabin", "A quieter and safer working environment."),
           ("Siemens / Fanuc CNC system", "Customised HMI screens and remote maintenance support from HYT headquarters.")],
      icons=["speedometer2", "bricks", "arrows-expand", "sliders", "gear-wide-connected", "bullseye", "life-preserver", "droplet", "volume-mute", "cpu"],
      models=["ATL-01"],
      rows=[("cfg", "CNC axle turning lathe; roughing and finish machining of railway axles between centres"),
            ("Swing over cross slide", "0–600 mm"), ("Max. load between centres", "1.5 t"),
            ("Torque admitted by spindle", "1200 Nm"), ("Power", "41 kW"), ("Speed", "30–2500 rpm"),
            ("Distance between centres", "3000 mm"), ("Diameter of the quill", "160 mm"),
            ("Turret", "8-position or 12-position, with live tool on request"), ("CNC system", "Siemens / Fanuc with software")],
      alt="CNC Axle Turning Lathe ATL-01 – sample illustration",
      note="Final figures are confirmed in the technical offer.")
P["axle-turning-lathe"]["summary"] = "Heavy-duty CNC lathe for roughing and finish machining of railway axles, with 3000 mm between centres and a 41 kW drive."
block("axle-turning-lathe", "gallery")["items"][0]["caption"] = "Sample illustration of the ATL-01 axle turning lathe"
block("axle-turning-lathe", "overview")["image_alt"] = "Sample illustration of a CNC axle turning lathe"
faq("axle-turning-lathe", 0,
    a="The ATL-01 carries out roughing and finish machining of complete railway axles between centres. The [journal lathe](page:axle-journal-turning-burnishing-lathe) (YTB 04) turns and roller-burnishes the in-board and out-board bearing journals of wheelset axles during overhaul.")
faq("axle-turning-lathe", 1, q="Is the ATL-01 used in maintenance depots or only in production?",
    a="Both. The ATL-01 is built for high production requirements and is used in maintenance depots as well as production workshops. If your process also includes journal restoration on assembled wheelsets, see the [journal turning and burnishing lathe](page:axle-journal-turning-burnishing-lathe).")
faq("axle-turning-lathe", 2,
    a="Axles for locomotives, coaches, wagons and multiple units, within the machine's capacity: 3000 mm between centres, 1.5 t load between centres and 600 mm swing over the cross slide. We check the fit against your axle drawings.")
apps = block("axle-turning-lathe", "applications")["items"]
if not any(a["title"] == "Maintenance depots" for a in apps):
    apps.append({"icon": "wrench-adjustable", "title": "Maintenance depots", "text": "Roughing and finish machining of axles as part of in-house wheelset maintenance."})

# ---------------------------------------------------------------- YTB 04
apply("axle-journal-turning-burnishing-lathe",
      title="CNC Axle Journal Turning & Burnishing Lathe YTB 04",
      description="CNC lathe for turning and roller burnishing railway axle journals. Ovality and taper below 0.01 mm and a burnished finish under 0.2 μm Ra.",
      lede="A specialised CNC lathe that restores railway axle journals to their original geometry and delivers a burnished bearing-seat finish below 0.2 μm Ra.",
      what="What is the CNC Axle Journal Turning & Burnishing Lathe?",
      paras=[
          "The CNC Axle Journal Turning & Burnishing Lathe (Model YTB 04) is a specialised machine for the maintenance and manufacture of railway wheelsets. It restores and finishes the axle journals – the precision bearing-seat surfaces located at each end of a railway axle.",
          "These journal surfaces support the wheelset within the bogie bearings. Any wear, ovality, taper or surface damage can lead to premature bearing failure, excessive heat generation, increased maintenance costs and potential safety risks.",
          "The turning operation removes worn or damaged material from the axle journal, restoring its original geometry and dimensional accuracy. CNC-controlled machining corrects ovality, taper and surface wear to bring the journal back within specification, and roller burnishing then finishes the surface to the required quality.",
      ],
      model_name="YTB 04",
      why=[("Precision journal machining", "Accurate turning of in-board and out-board axle journals."),
           ("Superior roller burnishing", "An excellent surface finish and extended axle life."),
           ("Heavy-duty rigid bed", "Dual fixed tailstocks for maximum stability and precision."),
           ("Automatic axle length compensation", "A spring-loaded tailstock gives consistent burnishing performance.")],
      icons=["bullseye", "stars", "bricks", "arrows-expand"],
      models=["YTB 04"],
      rows=[("cfg", "Axle journal turning & burnishing lathe; in-board and out-board journals of wheelset axles"),
            ("drive", "Main drive motor 11 kW"), ("Cutting speed for axle turning & burnishing", "50–400 m/min"),
            ("Tool post feed for axle turning & burnishing", "0.1–2.5 mm/rev"), ("Max. depth of cut while axle turning", "2 mm"),
            ("dia", "1250 mm / 540 mm (depends on track gauge)"), ("width", "75–145 mm"),
            ("Axle length, max. / min.", "2750 mm / 1200 mm (depends on track gauge)"),
            ("Axle journal diameter, min. – max.", "70–320 mm"), ("Axle journal length, min. – max.", "110–480 mm"),
            ("Max. weight of wheelset", "50 kN"), ("Ovality of journal", "< 0.01 mm"),
            ("Taper of journal", "< 0.01 mm per 100 mm"), ("Surface finish of journal after burnishing", "< 0.2 μm Ra")],
      alt="HYT CNC Axle Journal Turning & Burnishing Lathe YTB 04 with a wheelset in the machine")
P["axle-journal-turning-burnishing-lathe"]["summary"] = "CNC lathe that turns and roller-burnishes railway axle journals, with ovality and taper below 0.01 mm and a finish under 0.2 μm Ra."
faq("axle-journal-turning-burnishing-lathe", 0,
    a="The YTB 04 turns and roller-burnishes the in-board and out-board bearing journals of wheelset axles. The [ATL-01](page:axle-turning-lathe) carries out roughing and finish machining of complete axles between centres. Many wheel shops need both.")
faq("axle-journal-turning-burnishing-lathe", 3,
    a="In-board and out-board journals of wheelset axles, with journal diameters of 70–320 mm and journal lengths of 110–480 mm, on axles of 1200–2750 mm (depending on track gauge) and wheelsets up to 50 kN.")

# ---------------------------------------------------------------- KRE 15 RCRV
pid = "rail-cum-road-vehicle-shunter"
apply(pid,
      title="Rail Cum Road Vehicle Shunter KRE 15 RCRV",
      description="Battery-powered dual-mode shunter for depots and workshops. 15 kN tractive effort, 135 t towing capacity and a two-minute rail-to-road changeover.",
      lede="A dual-mode, battery-powered shunter that moves locomotives, coaches, wagons and complete train sets on both rail and road – without a dedicated shunting locomotive.",
      what="What is the Rail Cum Road Vehicle Shunter?",
      paras=[
          "The HYT Rail Cum Road Vehicle Shunter is a versatile rail handling solution designed to move locomotives, coaches, wagons, metro cars and complete train sets safely and efficiently within depots, workshops, maintenance facilities and production plants.",
          "Unlike conventional shunting locomotives, the HYT Rail Cum Road Vehicle Shunter combines road mobility with rail traction capability, allowing operators to transfer rolling stock seamlessly between workshop bays, inspection lines, washing plants and storage tracks without the need for a dedicated rail locomotive.",
          "The shunter is equipped with advanced hydraulic and traction systems, providing smooth acceleration, controlled braking and accurate positioning of rolling stock during maintenance and assembly operations. This improves operational safety, reduces turnaround time and enhances overall workshop productivity.",
          "Designed for modern railway maintenance facilities, the HYT Rail Cum Road Vehicle Shunter offers a cost-effective and flexible alternative to traditional shunting methods, helping operators maximise asset utilisation while minimising operating costs and infrastructure requirements.",
      ],
      model_name="KRE 15 RCRV",
      why=[("Dual-mode operation", "Seamless movement on both rail track and road, with a changeover time of just two minutes."),
           ("Powerful shunting performance", "Up to 15 kN tractive effort and 135 t towing capacity."),
           ("Integrated winch option", "Efficient pulling and pushing operations."),
           ("360° rotation capability", "Exceptional manoeuvrability in confined depot areas."),
           ("Remote-controlled operation", "Enhanced safety, precision and operator convenience."),
           ("Battery-powered electric drive", "Clean, quiet and emission-free operation.")],
      icons=["signpost-split", "lightning-charge", "link-45deg", "arrow-repeat", "controller", "battery-charging"],
      models=["KRE 15 RCRV"],
      rows=[("cfg", "Dual-mode rail and road shunter; battery-powered electric drive"), ("Service weight", "6 t ± 10%"),
            ("Max. wheel load", "Approx. 1.5 t"), ("Gauge", "1676 mm / 1435 mm"),
            ("Max. speed", "V1 (loaded): 0–2 km/h; V2 (solo): 0–4 km/h"),
            ("Max. tractive effort", "15 kN at wheel rim, at adhesion μ = 0.5 dry (0.3 wet)"),
            ("Towing capacity", "135 t locomotive or other rolling stock, on gradients up to 2.5 ‰ (2.5 in 1000)"),
            ("Rail-to-road changeover time", "Approx. 2 min")],
      alt="HYT Rail Cum Road Vehicle Shunter KRE 15 RCRV",
      note="Final figures are confirmed in the technical offer.")
P[pid]["summary"] = "Battery-powered rail-and-road shunter with 15 kN tractive effort and 135 t towing capacity for moving rolling stock in depots and workshops."
steps = block(pid, "process")["items"]
steps[1]["text"] = "The shunter changes from road to rail mode in about two minutes and is aligned on the track."
steps[2]["text"] = "It couples to the rolling stock to be moved."
steps[3]["text"] = "Using the remote control, the operator moves the consist to the workshop road, wash plant or siding."
block(pid, "features")["items"] = [
    "Rail and road operation in one vehicle", "Rail-to-road changeover in approx. 2 minutes",
    "Up to 15 kN tractive effort at the wheel rim", "135 t towing capacity on gradients up to 2.5 ‰",
    "Remote-controlled operation", "360° rotation for confined depot areas",
    "Integrated winch option", "Battery-powered, emission-free electric drive"]
faq(pid, 0, a="A shunter that drives on roads and runs on rails, changing between the two modes in about two minutes. In shunting mode it couples to rolling stock and moves it along the track.")
faq(pid, 1, a="The KRE 15 RCRV moves up to 135 t of locomotives or other rolling stock on gradients up to 2.5 ‰, with a tractive effort of up to 15 kN. We check this against your heaviest regular movement and your depot gradients.")

# ---------------------------------------------------------------- Train washing plant
pid = "automated-train-washing-plant"
apply(pid,
      title="Automated Train Washing Plant",
      description="Drive-through automatic coach washing plant for Indian Railways. A 24-coach rake in under 15 minutes, using a maximum of 60 litres of fresh water per coach.",
      lede="A fully automated, drive-through exterior coach washing system engineered for Indian Railways – cleaning a full rake of 24 coaches in under 15 minutes, with minimal water consumption and no manual intervention.",
      what="What is the Automated Train Washing Plant?",
      paras=[
          "HYT's Automated Train Washing Plant removes the dependence on manual labour for coach cleaning – a critical hygiene and presentation requirement across Indian Railways depots and washing lines.",
          "The system is designed as a fixed installation through which rakes pass at low speed. As each coach travels through the plant it is sequentially pre-wetted, chemically treated, mechanically brushed, high-pressure rinsed and mopped, all without stopping. Water recycling through an integrated effluent treatment plant (ETP) further reduces operating costs.",
      ],
      model_name="Automated Train Washing Plant",
      why=[("Fully automated wash cycle", "Consistent, hands-free coach cleaning."),
           ("Water recycling system", "An integrated ETP limits fresh water use to just 60 litres per coach."),
           ("Laser-based speed detection", "Automatically synchronises the wash cycle with train movement."),
           ("Modular heavy-duty design", "Straightforward installation, relocation and low maintenance."),
           ("Centralised control system", "Real-time monitoring and fault diagnostics."),
           ("Remote diagnostics", "Faster technical support and reduced downtime.")],
      icons=["magic", "recycle", "speedometer", "boxes", "display", "wifi"],
      models=["Washing plant"],
      rows=[("cfg", "Drive-through automatic exterior coach washing plant"), ("Cycle time, 24-coach rake", "≤ 15 min"),
            ("Train wash speed", "3–5 km/h"), ("Final rinse pressure", "Approx. 10 kg/cm² (≈ 10 bar)"),
            ("Fresh water per coach", "Max. 60 L"), ("Water recovery", "Recycled through integrated ETP"),
            ("Speed detection", "Laser-based, synchronised to train movement")],
      alt="HYT Automated Train Washing Plant with brush units on both sides of the track",
      note="Final figures are confirmed in the technical offer.")
P[pid]["summary"] = "Drive-through automatic coach washing plant that cleans a 24-coach rake in under 15 minutes with a maximum of 60 litres of fresh water per coach."
block(pid, "process")["items"] = [
    {"title": "Detect", "text": "Laser-based speed detection registers the train and synchronises the wash cycle with its movement."},
    {"title": "Pre-wet", "text": "Each coach is wetted to loosen dirt as it enters the plant at 3–5 km/h."},
    {"title": "Chemical treatment", "text": "Cleaning agent is applied to the coach body."},
    {"title": "Brush", "text": "Rotating brushes scrub the coach mechanically."},
    {"title": "High-pressure rinse", "text": "A final rinse at approx. 10 bar removes detergent and loosened dirt."},
    {"title": "Mop & recycle", "text": "The coach is mopped, and wash water is recycled through the integrated ETP."}]
feats = block(pid, "features")["items"]
feats[:] = ["Drive-through operation – the train does not stop", "Laser-based speed detection",
            "Pre-wetting, chemical treatment, brushing, high-pressure rinse and mopping",
            "24-coach rake in 15 minutes or less", "Max. 60 litres of fresh water per coach",
            "Water recycling through an integrated ETP", "Centralised control with real-time monitoring",
            "Modular heavy-duty design"]
faq(pid, 0, a="No. The train passes through at 3–5 km/h while the washing stages operate in sequence; a 24-coach rake is washed in 15 minutes or less.")
faq(pid, 1, a="Yes. Wash water is recycled through an integrated effluent treatment plant (ETP), limiting fresh water use to a maximum of 60 litres per coach.")

# ---------------------------------------------------------------- YMM-04
pid = "multi-purpose-armature-machine"
apply(pid,
      title="Multipurpose Armature Machine YMM-04",
      description="Single-platform traction motor armature reconditioning: commutator turning and grinding, mica undercutting, banding, re-rolling and coil cut-off.",
      lede="A single platform for complete traction motor armature reconditioning – turning, grinding, mica undercutting, banding and coil cut-off in one machine.",
      what="What is the Multipurpose Armature Machine?",
      paras=[
          "The Multipurpose Armature Machine is a specialised maintenance and refurbishment system designed for the complete reconditioning of traction motor armatures used in electric locomotives, EMUs, metro coaches and other railway rolling stock.",
          "Instead of using multiple standalone machines for different operations, the HYT YMM-04 integrates several critical armature maintenance processes into a single platform, improving productivity, accuracy and workshop efficiency.",
          "The machine restores worn commutators and bearing journals to their original dimensions and surface finish. High-precision turning and grinding operations ensure improved electrical contact, reduced brush wear, smoother motor operation and extended component life. The YMM-04 maintains commutator ovality and taper below 0.015 mm.",
      ],
      model_name="YMM-04",
      why=[("Automatic mica undercutting", "Precise insulation removal."),
           ("Deburring and polishing", "A superior commutator surface finish."),
           ("Precision turning and grinding", "Of commutators and bearing journals."),
           ("Integrated armature processing", "Banding, re-rolling and coil cut-off operations on the same machine."),
           ("Heavy-duty cast iron headstock", "Exceptional rigidity and machining accuracy."),
           ("Remote diagnostics", "Faster troubleshooting and expert support from HYT.")],
      icons=["scissors", "stars", "bullseye", "layers", "bricks", "wifi"],
      models=["YMM-04"],
      rows=[("cfg", "Universal multi-purpose armature machine; mica undercutting, turning, grinding, banding, re-rolling and coil cut-off"),
            ("drive", "Main drive motor 15 kW"), ("Headstock spindle speed, infinitely variable", "1.5–300 rpm"),
            ("Carriage feed, longitudinal", "0–100 mm/min"), ("Carriage rapid traverse, longitudinal", "600 mm/min"),
            ("Max. depth of cut while commutator turning", "2.5 mm"), ("Max. banding tension for wire / tape banding", "300 kg"),
            ("Armature weight, max.", "30 kN"), ("Armature length, min. – max.", "500–1600 mm"),
            ("Armature diameter, min. – max.", "130–1500 mm"), ("Commutator diameter to be machined, min. – max.", "120–900 mm"),
            ("Commutator length to be machined, min. – max.", "75–450 mm"), ("Ovality of commutator turning", "< 0.015 mm"),
            ("Taper of commutator turning", "< 0.015 mm"), ("Uniformity of banding tension", "< ± 10 kg")],
      alt="HYT Multipurpose Armature Machine YMM-04 with a traction motor armature in the machine",
      note="Final figures are confirmed in the technical offer.")
P[pid]["summary"] = "Single platform for traction-motor armature reconditioning: commutator turning and grinding, mica undercutting, banding, re-rolling and coil cut-off."
steps = block(pid, "process")["items"]
steps[2] = {"title": "Turn & grind", "text": "The commutator and bearing journals are turned and ground true."}
steps[4] = {"title": "Deburr & polish", "text": "Segment edges are deburred and the commutator surface polished."}
block(pid, "features")["items"] = [
    "Commutator turning and grinding", "Automatic mica undercutting", "Deburring and polishing",
    "Turning and grinding of bearing journals", "Wire and tape banding up to 300 kg tension",
    "Re-rolling and coil cut-off", "Infinitely variable headstock speed, 1.5–300 rpm", "Heavy-duty cast iron headstock"]
faq(pid, 0, a="Commutator turning and grinding, mica undercutting, deburring and polishing, turning and grinding of bearing journals, wire and tape banding, re-rolling and coil cut-off – all on one machine.")
faq(pid, 3, a="Armatures up to 30 kN, 500–1600 mm long and 130–1500 mm in diameter, with commutator diameters of 120–900 mm and commutator lengths of 75–450 mm.")

F.write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n")
print("updated", F)

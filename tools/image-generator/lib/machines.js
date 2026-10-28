'use strict';
const E = require('./engine');
const P = require('./prims');
const K = require('./components');
const { MAT, add, sub, mul, norm, f1 } = E;
const { box, boxC, extrude, rbox, revolve, cyl, sphere, decal, pathOf, quadPath, line3, frame, tp, tv, ID, chamfer, rrect } = P;
const { PAL, L } = K;

// ---------------- screens (HMI content, drawn in s,t in [0,1], t up) ----------------
function profileCurve(n = 60, flangeLeft = true) {
  // wheel profile: flange hump + tread with slight cone, in [0,1]x[0,1]
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    let y = 0.25 + 0.06 * x; // tread cone
    const fx = 0.2; // flange centre
    y += 0.52 * Math.exp(-Math.pow((x - fx) / 0.085, 2)) * (x < fx ? 1 : 1);
    if (x < 0.08) y = 0.25 + 0.52 * Math.exp(-Math.pow((0.08 - fx) / 0.085, 2)) - (0.08 - x) * 3;
    pts.push([flangeLeft ? x : 1 - x, y]);
  }
  return pts;
}
function hmiScreen(variant = 0) {
  return (map) => {
    let svg = `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="#0e1f36"/>`;
    // header bar
    svg += `<path d="${quadPath(map, 0, 0.9, 1, 1)}" fill="#1b3a60"/>`;
    svg += `<path d="${quadPath(map, 0.03, 0.935, 0.2, 0.965)}" fill="#F58220"/>`;
    for (let i = 0; i < 4; i++) svg += `<path d="${quadPath(map, 0.55 + i * 0.11, 0.93, 0.63 + i * 0.11, 0.97)}" fill="#3d5f88"/>`;
    // graph panel
    const gx0 = 0.04, gx1 = variant === 1 ? 0.96 : 0.66, gy0 = 0.1, gy1 = 0.85;
    svg += `<path d="${quadPath(map, gx0, gy0, gx1, gy1)}" fill="#0a182b"/>`;
    let grid = '';
    for (let i = 1; i < 8; i++) { const x = gx0 + ((gx1 - gx0) * i) / 8; grid += pathOf(map, [[x, gy0], [x, gy1]], false); }
    for (let j = 1; j < 6; j++) { const y = gy0 + ((gy1 - gy0) * j) / 6; grid += pathOf(map, [[gx0, y], [gx1, y]], false); }
    svg += `<path d="${grid}" stroke="#23405f" stroke-width="0.8" fill="none"/>`;
    const toG = ([x, y]) => [gx0 + 0.04 + x * (gx1 - gx0 - 0.08), gy0 + 0.05 + y * (gy1 - gy0 - 0.12)];
    const prof = profileCurve(70).map(toG);
    const worn = profileCurve(70).map(([x, y]) => [x, y - 0.06 * Math.exp(-Math.pow((x - 0.45) / 0.2, 2)) - 0.03 * Math.exp(-Math.pow((x - 0.24) / 0.05, 2))]).map(toG);
    // filled area under target profile
    const fillPts = prof.concat([[toG([1, 0])[0], gy0 + 0.02], [toG([0, 0])[0], gy0 + 0.02]]);
    svg += `<path d="${pathOf(map, fillPts)}" fill="#F58220" fill-opacity="0.12"/>`;
    svg += `<path d="${pathOf(map, worn, false)}" fill="none" stroke="#7fb6e6" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    svg += `<path d="${pathOf(map, prof, false)}" fill="none" stroke="#F58220" stroke-width="2.2"/>`;
    if (variant !== 1) {
      // side panel with value bars (no text)
      for (let i = 0; i < 6; i++) {
        const y = 0.78 - i * 0.12;
        svg += `<path d="${quadPath(map, 0.7, y, 0.96, y + 0.08)}" fill="#132b49"/>`;
        svg += `<path d="${quadPath(map, 0.72, y + 0.025, 0.72 + 0.08 + ((i * 37) % 10) / 70, y + 0.055)}" fill="${i === 2 ? '#F58220' : '#6d8fb5'}"/>`;
        svg += `<path d="${quadPath(map, 0.9, y + 0.02, 0.94, y + 0.06)}" fill="${i % 3 === 0 ? '#4fbf7a' : '#3d5f88'}"/>`;
      }
    }
    return svg;
  };
}
function glassPanel(dark = '#26364a') {
  return (map) => {
    let svg = `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="${dark}" fill-opacity="0.92"/>`;
    svg += `<path d="${pathOf(map, [[0.05, 1], [0.32, 1], [0.12, 0], [0, 0], [0, 0.6]])}" fill="#ffffff" fill-opacity="0.10"/>`;
    svg += `<path d="${pathOf(map, [[0.4, 1], [0.48, 1], [0.3, 0], [0.22, 0]])}" fill="#ffffff" fill-opacity="0.06"/>`;
    svg += `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="none" stroke="#1a1d21" stroke-width="2"/>`;
    return svg;
  };
}
function stripe(color = PAL.orange) { return (map) => `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="${color}"/>`; }

// a machine guard: chamfered white housing with a window and an orange stripe, in local frame f
// spans min..max (local), window on +z face
function guard(s, min, max, o = {}) {
  const f = o.f || ID;
  const c = o.chamfer ?? 0.08;
  extrude(s, chamfer(min[0], min[1], max[0], max[1], c), min[2], max[2], o.color || PAL.guard, MAT.paint, { f, layer: o.layer, capColor: o.capColor, segW: o.segW });
  const W = max[0] - min[0], H = max[1] - min[1];
  if (o.window !== false) {
    const wx0 = min[0] + W * (o.wx0 ?? 0.18), wx1 = min[0] + W * (o.wx1 ?? 0.62), wy0 = min[1] + H * (o.wy0 ?? 0.38), wy1 = min[1] + H * (o.wy1 ?? 0.84);
    decal(s, { o: [wx0, wy0, max[2] + 0.004], u: [wx1 - wx0, 0, 0], v: [0, wy1 - wy0, 0] }, glassPanel(), { f, layer: o.layer });
  }
  if (o.stripe !== false) {
    const sy = min[1] + H * (o.sy ?? 0.16);
    decal(s, { o: [min[0] + c, sy, max[2] + 0.005], u: [W - 2 * c, 0, 0], v: [0, H * 0.035, 0] }, stripe(), { f, layer: o.layer });
  }
  if (o.navyBase) {
    decal(s, { o: [min[0] + c * 0.5, min[1], max[2] + 0.004], u: [W - c, 0, 0], v: [0, H * 0.1, 0] }, stripe(PAL.navy), { f, layer: o.layer });
  }
}

// control console: pedestal cabinet with tilted HMI screen. f frame, facing +z
function controlConsole(s, f, o = {}) {
  const lay = { f, layer: o.layer ?? L.obj };
  box(s, [-0.45, 0, -0.35], [0.45, 1.0, 0.35], PAL.guard, MAT.paint, lay);
  box(s, [-0.46, 0, -0.36], [0.46, 0.1, 0.36], PAL.navy, MAT.paint, lay);
  // tilted panel
  const tf = { o: tp(f, [0, 1.0, 0.1]), X: f.X, Y: norm(add(f.Y, mul(f.Z, 0.55))), Z: norm(sub(f.Z, mul(f.Y, 0.55))) };
  box(s, [-0.5, 0, -0.05], [0.5, 0.62, 0.05], '#2f3338', MAT.dark, { f: tf, layer: lay.layer });
  decal(s, { o: [-0.44, 0.08, 0.052], u: [0.88, 0, 0], v: [0, 0.5, 0] }, hmiScreen(o.variant || 0), { f: tf, layer: lay.layer });
  // e-stop & knobs
  cyl(s, tp(f, [0.3, 1.0, 0.36]), tp(f, [0.3, 1.0, 0.41]), 0.035, '#c0392b', MAT.gloss, { seg: 16 });
  cyl(s, tp(f, [-0.3, 0.85, 0.35]), tp(f, [-0.3, 0.85, 0.39]), 0.03, PAL.orange, MAT.gloss, { seg: 16 });
  decal(s, { o: [-0.45, 0.88, 0.352], u: [0.9, 0, 0], v: [0, 0.03, 0] }, stripe(), lay);
}

// electrical cabinet bank
function cabinets(s, f, n = 3, o = {}) {
  for (let i = 0; i < n; i++) {
    const x0 = i * 0.82;
    box(s, [x0, 0, 0], [x0 + 0.8, 2.0, 0.6], o.color || '#dfe3e7', MAT.paint, { f, layer: o.layer });
    box(s, [x0, 0, 0], [x0 + 0.8, 0.1, 0.6], PAL.char2, MAT.paint, { f, layer: o.layer });
    decal(s, { o: [x0 + 0.62, 1.0, 0.602], u: [0.04, 0, 0], v: [0, 0.18, 0] }, stripe('#5b6168'), { f });
    decal(s, { o: [x0 + 0.1, 1.75, 0.602], u: [0.25, 0, 0], v: [0, 0.12, 0] }, stripe('#c9ced3'), { f });
    if (i === 0) decal(s, { o: [x0, 1.9, 0.602], u: [0.8, 0, 0], v: [0, 0.03, 0] }, stripe(), { f });
  }
}

// ---------------- rolling stock ----------------
// bogie centred at x, track centre z, rail top y=0 (or o.y). axles along z.
function bogie(s, o) {
  const x = o.x, y = o.y || 0, zc = o.z || 0, R = o.R || 0.46, wb = o.wb || 2.6, gauge = o.gauge || 'BG';
  const g = K.GAUGE[gauge];
  const lay = { layer: o.layer ?? L.obj };
  const ay = y + R;
  const fr = o.frame || '#2c3035';
  for (const dx of [-wb / 2, wb / 2]) K.wheelset(s, { c: [x + dx, ay, zc], R, gauge, boxes: true, discs: o.discs ?? 2, layer: lay.layer, boxColor: '#30353b' });
  const sz = g.b2b + 0.34;
  for (const sg of [-1, 1]) {
    const z = zc + sg * sz;
    // side frame: profile in x-y extruded along z
    const t = 0.11; const top = ay + 0.42, low = ay + 0.12;
    const shape = [[-wb / 2 - 0.45, ay + 0.18], [-wb / 2 + 0.35, ay + 0.18], [-0.6, low - 0.08], [0.6, low - 0.08], [wb / 2 - 0.35, ay + 0.18], [wb / 2 + 0.45, ay + 0.18], [wb / 2 + 0.45, top], [0.7, top + 0.0], [0.5, top - 0.12], [-0.5, top - 0.12], [-0.7, top], [-wb / 2 - 0.45, top]].map(([a, b]) => [a + x, b]);
    extrude(s, shape, z - t, z + t, fr, MAT.dark, { ...lay });
    // springs on axle boxes
    for (const dx of [-wb / 2, wb / 2]) {
      for (const k of [-0.18, 0.18]) cyl(s, [x + dx + k, ay + 0.13, z], [x + dx + k, ay + 0.18, z], 0.08, '#44494f', MAT.dark, { seg: 14, ...lay });
    }
    // secondary springs (coil look via stacked rings)
    for (let i = 0; i < 6; i++) cyl(s, [x, top + i * 0.05, z], [x, top + i * 0.05 + 0.03, z], 0.15, '#3a3f45', MAT.dark, { seg: 18, ...lay });
    // damper (yellow-ish neutral)
    cyl(s, [x + 0.45, top - 0.05, z + sg * 0.14], [x + 0.75, top + 0.28, z + sg * 0.14], 0.04, '#6a6f75', MAT.steel, { seg: 12, ...lay });
  }
  // transoms
  for (const dx of [-0.45, 0.45]) boxC(s, [x + dx, ay + 0.22, zc], [0.22, 0.2, 2 * sz], fr, MAT.dark, { ...lay, seg: [1, 1, 3] });
  // brake units
  for (const dx of [-wb / 2 + 0.55, wb / 2 - 0.55]) for (const sg of [-1, 1]) boxC(s, [x + dx, ay - 0.05, zc + sg * 0.36], [0.22, 0.26, 0.2], '#3b4046', MAT.dark, lay);
  // bolster
  boxC(s, [x, ay + 0.75, zc], [0.6, 0.18, 2 * sz + 0.3], fr, MAT.dark, { ...lay, seg: [1, 1, 3] });
}

// coach body along x from x0 to x1. floor (body bottom) at yb, width w, track centre zc
function coach(s, o) {
  const { x0, x1 } = o; const zc = o.z || 0; const yb = o.yb ?? 1.25; const w = o.w || 3.2; const h = o.h || 2.85;
  const body = o.color || '#dfe3e7';
  const lay = { layer: o.layer ?? L.obj };
  const hw = w / 2;
  const prof = [];
  prof.push([zc - hw + 0.05, yb], [zc + hw - 0.05, yb], [zc + hw, yb + 0.12], [zc + hw, yb + h - 0.45]);
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); prof.push([zc + hw - 0.55 + 0.55 * Math.cos(a), yb + h - 0.45 + 0.45 * Math.sin(a) * (0.6 + 0.4 * Math.sin(a))]); }
  prof.push([zc - hw + 0.55, yb + h]);
  for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 + (i / 8) * (Math.PI / 2); prof.push([zc - hw + 0.55 + 0.55 * Math.cos(a), yb + h - 0.45 + 0.45 * Math.sin(a) * (0.6 + 0.4 * Math.sin(a))]); }
  prof.push([zc - hw, yb + 0.12]);
  const roofCol = o.roof || '#b8bec5';
  extrude(s, prof, x0, x1, body, MAT.paint, { axes: 'zy', smooth: true, crease: 30, segW: Math.max(2, Math.round((x1 - x0) / 2.2)), ...lay,
    edgeColor: (i) => (i >= 4 && i <= 21 ? roofCol : null), capColor: o.endColor || '#cdd2d7' });
  // side decals: window band & windows & doors, on +z side
  const sideZ = zc + hw + 0.006;
  for (const side of o.sides || [1]) {
    const sz = zc + side * (hw + 0.006);
    const pl = side > 0 ? { o: [x0, yb, sz], u: [x1 - x0, 0, 0], v: [0, h - 0.45, 0] } : { o: [x1, yb, sz], u: [x0 - x1, 0, 0], v: [0, h - 0.45, 0] };
    decal(s, pl, (map) => {
      const Lx = x1 - x0, Hh = h - 0.45;
      const sy = (m) => m / Hh, sx = (m) => m / Lx;
      let svg = '';
      // navy window band
      svg += `<path d="${quadPath(map, 0, sy(0.95), 1, sy(1.95))}" fill="${o.band || PAL.navy}"/>`;
      svg += `<path d="${quadPath(map, 0, sy(0.62), 1, sy(0.68))}" fill="${PAL.orange}"/>`;
      // windows
      const winW = o.winW || 1.15, pitch = o.winPitch || 1.55;
      for (let xm = (o.winStart || 1.6); xm < Lx - 1.2; xm += pitch) {
        if (o.doors && o.doors.some((d) => Math.abs(d - xm) < 1.0)) continue;
        svg += `<path d="${quadPath(map, sx(xm), sy(1.08), sx(xm + winW), sy(1.82))}" fill="#22303f"/>`;
        svg += `<path d="${pathOf(map, [[sx(xm + 0.1), sy(1.82)], [sx(xm + 0.45), sy(1.82)], [sx(xm + 0.2), sy(1.08)], [sx(xm + 0.05), sy(1.08)]])}" fill="#ffffff" fill-opacity="0.12"/>`;
      }
      for (const d of o.doors || []) {
        svg += `<path d="${quadPath(map, sx(d - 0.65), sy(0.08), sx(d + 0.65), sy(2.05))}" fill="${o.doorColor || '#c7ccd2'}" stroke="#7d848c" stroke-width="1"/>`;
        svg += `<path d="${pathOf(map, [[sx(d), sy(0.08)], [sx(d), sy(2.05)]], false)}" stroke="#7d848c" stroke-width="1.2"/>`;
        svg += `<path d="${quadPath(map, sx(d - 0.5), sy(1.15), sx(d - 0.08), sy(1.85))}" fill="#22303f"/><path d="${quadPath(map, sx(d + 0.08), sy(1.15), sx(d + 0.5), sy(1.85))}" fill="#22303f"/>`;
      }
      return svg;
    }, { ...lay, bias: 0.02, split: Math.max(2, Math.round((x1 - x0) / 2.2)) });
  }
  // underframe equipment
  if (o.underframe !== false) {
    const bx = o.bogies || [];
    const ux0 = x0 + 0.2, ux1 = x1 - 0.2;
    boxC(s, [(ux0 + ux1) / 2, yb - 0.12, zc], [ux1 - ux0, 0.24, w - 0.5], '#2f3338', MAT.dark, { ...lay, seg: [Math.round((ux1 - ux0) / 2), 1, 1] });
    const eq = o.equip || [];
    for (const [ea, eb] of eq) boxC(s, [(ea + eb) / 2, yb - 0.5, zc], [eb - ea, 0.55, w - 0.9], '#3a3f45', MAT.dark, { ...lay, seg: [Math.max(1, Math.round((eb - ea) / 2)), 1, 1] });
  }
  if (o.gangway) {
    for (const xe of o.gangway) { boxC(s, [xe, yb + 1.05, zc], [0.3, 1.9, 1.15], '#5d636a', MAT.rubber, lay); boxC(s, [xe + Math.sign(xe) * 0.16, yb + 1.15, zc], [0.04, 1.9, 1.0], '#55595f', MAT.dark, lay); }
  }
}

// ---------------- underfloor wheel lathe ----------------
// placed at axle position x (track centre z=zc). Machine in pit (layer L.pit) + above-floor parts.
function underfloorLathe(s, o) {
  const x = o.x, zc = o.z || 0, R = o.R || 0.55, g = K.GAUGE[o.gauge || 'BG'];
  const pitL = L.pit;
  const lay = { layer: pitL };
  const D = o.depth || 1.6;
  // base bed
  boxC(s, [x, -D + 0.35, zc], [2.8, 0.7, 3.6], PAL.navy, MAT.paint, lay);
  for (const sg of [-1, 1]) {
    const z = zc + sg * g.rail;
    // main housing per wheel side
    const zi = zc + sg * 0.42, zo = zc + sg * 1.5;
    const za = Math.min(zi, zo), zb = Math.max(zi, zo);
    extrude(s, chamfer(x - 1.1, -D + 0.7, x + 1.1, -0.22, 0.12), za, zb, PAL.guard, MAT.paint, { ...lay, capColor: '#dde1e5' });
    decal(s, { o: [x - 1.0, -0.62, zb + 0.004], u: [2.0, 0, 0], v: [0, 0.05, 0] }, stripe(), lay);
    decal(s, { o: [x - 0.7, -1.2, zb + 0.004], u: [0.9, 0, 0], v: [0, 0.4, 0] }, glassPanel(), lay);
    // roller carriers
    for (const dx of [-0.36, 0.36]) {
      const rc = [x + dx, R - Math.sqrt(Math.pow(R + 0.15, 2) - dx * dx), z];
      boxC(s, [rc[0], (rc[1] - 0.22 - 0.25) / 2 + 0.0, z], [0.36, rc[1] + 0.25, 0.34], '#2e3338', MAT.dark, lay);
      cyl(s, [rc[0], rc[1], z - 0.1], [rc[0], rc[1], z + 0.1], 0.15, '#aeb4ba', MAT.chrome, { seg: 28, ...lay });
      cyl(s, [rc[0], rc[1], z - 0.12], [rc[0], rc[1], z + 0.12], 0.06, '#5b6168', MAT.steel, { seg: 16, ...lay });
    }
    // tool slide (from below, field side)
    const tz = z + sg * 0.05;
    boxC(s, [x, -0.42, tz], [0.5, 0.36, 0.42], PAL.navy2, MAT.paint, lay);
    boxC(s, [x, -0.16, tz], [0.18, 0.2, 0.16], PAL.char, MAT.dark, lay);
    boxC(s, [x + 0.02, -0.03, tz], [0.05, 0.08, 0.05], '#d9a441', MAT.chrome, lay);
    // axle box holder arms (outboard)
    const az = zc + sg * (g.b2b + 0.36);
    boxC(s, [x, -0.25, zc + sg * 1.42], [0.34, 1.1, 0.3], PAL.navy, MAT.paint, lay);
    boxC(s, [x, o.armTop ?? R - 0.05, az + sg * 0.06], [0.22, 0.12, 0.24], PAL.orange, MAT.paint, { layer: L.obj });
    boxC(s, [x, ((o.armTop ?? R - 0.05) + 0.3) / 2 - 0.15, zc + sg * 1.42], [0.2, (o.armTop ?? R - 0.05) + 0.3, 0.2], PAL.navy, MAT.paint, { layer: L.obj });
  }
  if (o.probe) {
    for (const sg of [-1, 1]) {
      const z = zc + sg * g.rail;
      // measuring probe arm swinging up to the tread from the field side
      boxC(s, [x - 0.75, -0.3, z + sg * 0.25], [0.16, 0.5, 0.16], PAL.navy2, MAT.paint, { layer: L.obj });
      cyl(s, [x - 0.75, -0.05, z + sg * 0.25], [x - 0.55, R * 0.25, z + sg * 0.05], 0.035, '#c3c8ce', MAT.chrome, { seg: 12, layer: L.obj });
      boxC(s, [x - 0.53, R * 0.28, z], [0.09, 0.09, 0.09], '#e6e9ec', MAT.paint, { layer: L.obj });
      line3(s, [[x - 0.5, R * 0.28, z], [x - 0.28, R - Math.sqrt(R * R - 0.28 * 0.28) + 0.01, z]], { color: '#ff4a3d', width: 0.006 });
      // status beacon
      cyl(s, [x + 1.0, -0.22, zc + sg * 1.48], [x + 1.0, 0.25, zc + sg * 1.48], 0.04, '#5b6168', MAT.steel, { seg: 10, layer: L.obj });
      cyl(s, [x + 1.0, 0.25, zc + sg * 1.48], [x + 1.0, 0.36, zc + sg * 1.48], 0.05, '#4fbf7a', MAT.emit, { seg: 12, layer: L.obj });
    }
  }
  // chip conveyor channel
  boxC(s, [x + 1.6, -D + 0.25, zc], [1.2, 0.5, 0.9], '#3a3f45', MAT.dark, lay);
  // light inside the pit
  if (o.pitGlow !== false) s.light.points.push({ p: [x, -0.4, zc + 1.0], i: 0.25, r: 1.5, c: '#fff4e0' });
}

// support rails across a pit (rail on pedestal beam)
function pitRails(s, x0, x1, zc, gauge, o = {}) {
  const g = K.GAUGE[gauge || 'BG'];
  for (const sg of [-1, 1]) {
    const z = zc + sg * g.rail;
    if (o.gap) {
      K.rail(s, x0, o.gap[0], z, -0.17, { layer: L.obj });
      K.rail(s, o.gap[1], x1, z, -0.17, { layer: L.obj });
    } else K.rail(s, x0, x1, z, -0.17, { layer: L.obj });
    if (o.columns !== false) for (let x = x0 + 1; x < x1 - 0.5; x += 1.6) {
      if (o.gap && x > o.gap[0] - 0.4 && x < o.gap[1] + 0.4) continue;
      boxC(s, [x, -(o.depth || 1.4) / 2 - 0.17, z], [0.16, (o.depth || 1.4) - 0.34, 0.16], '#7a8088', MAT.paint, { layer: L.pit });
    }
  }
}

module.exports = { hmiScreen, glassPanel, stripe, guard, controlConsole, cabinets, bogie, coach, underfloorLathe, pitRails, profileCurve };

// ---------------- more rolling stock ----------------
// metro car body along x [x0,x1], cab nose at x0 if o.cab. SG gauge, floor yb.
function metroCar(s, o) {
  const { x0, x1 } = o; const zc = o.z || 0; const yb = o.yb ?? 1.1; const w = o.w || 2.9; const h = o.h || 2.6;
  const hw = w / 2; const lay = { layer: o.layer ?? L.obj };
  const body = o.color || '#cdd3d9';
  const xs = o.cab ? x0 + 1.5 : x0;
  const prof = [[zc - hw + 0.1, yb], [zc + hw - 0.1, yb], [zc + hw, yb + 0.25], [zc + hw, yb + h - 0.35]];
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); prof.push([zc + hw - 0.35 + 0.35 * Math.cos(a), yb + h - 0.35 + 0.35 * Math.sin(a)]); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + (i / 6) * (Math.PI / 2); prof.push([zc - hw + 0.35 + 0.35 * Math.cos(a), yb + h - 0.35 + 0.35 * Math.sin(a)]); }
  prof.push([zc - hw, yb + 0.25]);
  extrude(s, prof, xs, x1, body, MAT.gloss, { axes: 'zy', smooth: true, crease: 30, segW: Math.max(2, Math.round((x1 - xs) / 2.2)), ...lay, capColor: '#b9c0c7', edgeColor: (i) => (i >= 4 && i <= 15 ? '#bfc6cd' : null) });
  if (o.cab) {
    // nose: side profile extruded across width
    const nose = [[xs + 0.01, yb], [xs + 0.01, yb + h], [x0 + 0.9, yb + h - 0.05], [x0 + 0.25, yb + 1.25], [x0, yb + 0.85], [x0 + 0.05, yb]];
    extrude(s, nose, zc - hw + 0.08, zc + hw - 0.08, o.noseColor || PAL.navy, MAT.gloss, { ...lay, capColor: o.noseSide || '#cdd3d9' });
    // windscreen on slanted face
    const pA = [x0 + 0.27, yb + 1.32], pB = [x0 + 0.85, yb + h - 0.15];
    decal(s, { o: [pA[0], pA[1], zc + hw - 0.25], u: [0, 0, -(w - 0.5)], v: [pB[0] - pA[0], pB[1] - pA[1], 0] }, (map) => `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="#1c2633"/><path d="${pathOf(map, [[0.1, 0.0], [0.3, 0], [0.5, 1], [0.3, 1]])}" fill="#ffffff" fill-opacity="0.1"/>`, { ...lay, bias: 0.03, flip: true });
    // headlights + orange band on the nose
    decal(s, { o: [x0 + 0.02, yb + 0.55, zc + hw - 0.1], u: [0, 0, -(w - 0.2)], v: [0.0, 0.08, 0] }, (map) => `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="${PAL.orange}"/>`, { ...lay, bias: 0.03, two: true });
    for (const sg of [-1, 1]) sphere(s, [x0 + 0.03, yb + 0.75, zc + sg * 0.95], 0.07, '#ffffff', MAT.emit, { seg: 10, rings: 5, ...lay });
  }
  // side decals
  for (const side of o.sides || [1]) {
    const sz = zc + side * (hw + 0.006);
    const pl = side > 0 ? { o: [xs, yb, sz], u: [x1 - xs, 0, 0], v: [0, h - 0.35, 0] } : { o: [x1, yb, sz], u: [xs - x1, 0, 0], v: [0, h - 0.35, 0] };
    const Lx = x1 - xs, Hh = h - 0.35;
    decal(s, pl, (map) => {
      const sx = (m) => (side > 0 ? m / Lx : 1 - m / Lx), sy = (m) => m / Hh;
      let svg = `<path d="${quadPath(map, 0, sy(0.3), 1, sy(0.42))}" fill="${o.band || PAL.navy}"/><path d="${quadPath(map, 0, sy(0.42), 1, sy(0.47))}" fill="${PAL.orange}"/>`;
      const doors = o.doors || []; for (let d = 2.6; d < Lx - 1; d += 4.6) doors.push(d);
      for (let xm = 0.8; xm < Lx - 1.2; xm += 1.6) {
        if (doors.some((d) => Math.abs(d - xm - 0.6) < 1.2)) continue;
        svg += `<path d="${quadPath(map, sx(xm), sy(1.0), sx(xm + 1.2), sy(1.95))}" fill="#1f2a37"/>`;
      }
      for (const d of doors) {
        svg += `<path d="${quadPath(map, sx(d - 0.7), sy(0.05), sx(d + 0.7), sy(2.05))}" fill="#aab2ba" stroke="#6e7780" stroke-width="1"/>`;
        svg += `<path d="${quadPath(map, sx(d - 0.55), sy(1.0), sx(d - 0.06), sy(1.85))}" fill="#1f2a37"/><path d="${quadPath(map, sx(d + 0.06), sy(1.0), sx(d + 0.55), sy(1.85))}" fill="#1f2a37"/>`;
      }
      return svg;
    }, { ...lay, bias: 0.02, split: Math.max(2, Math.round(Lx / 2.2)) });
  }
  // underframe + bogies
  boxC(s, [(xs + x1) / 2, yb - 0.1, zc], [x1 - xs - 0.4, 0.2, w - 0.4], '#2f3338', MAT.dark, { ...lay, seg: [Math.round((x1 - xs) / 2), 1, 1] });
  for (const [ea, eb] of o.equip || []) boxC(s, [(ea + eb) / 2, yb - 0.4, zc], [eb - ea, 0.45, w - 0.8], '#3a3f45', MAT.dark, { ...lay, seg: [Math.max(1, Math.round((eb - ea) / 2)), 1, 1] });
  for (const bx of o.bogies || []) bogie(s, { x: bx, z: zc, R: 0.42, wb: 2.2, gauge: 'SG', layer: lay.layer, y: o.railY || 0 });
  if (o.panto) {
    const px = (xs + x1) / 2;
    line3(s, [[px - 0.6, yb + h + 0.1, zc], [px, yb + h + 0.7, zc - 0.3], [px + 0.5, yb + h + 0.75, zc]], { color: '#2a2d31', width: 0.04 });
    boxC(s, [px + 0.5, yb + h + 0.78, zc], [0.08, 0.05, 1.4], '#3a3f45', MAT.dark, lay);
  }
}

// electric locomotive (Co-Co) along x [x0,x1], BG
function loco(s, o) {
  const { x0, x1 } = o; const zc = o.z || 0; const yb = o.yb ?? 1.45; const w = o.w || 3.1; const h = o.h || 2.75; const hw = w / 2;
  const lay = { layer: o.layer ?? L.obj };
  const body = o.color || PAL.navy;
  // body: chamfered box profile extruded along x, with cabs (slanted ends)
  const prof = [[zc - hw, yb], [zc + hw, yb], [zc + hw, yb + h - 0.4], [zc + hw - 0.35, yb + h], [zc - hw + 0.35, yb + h], [zc - hw, yb + h - 0.4]];
  extrude(s, prof, x0 + 0.5, x1 - 0.5, body, MAT.gloss, { axes: 'zy', segW: Math.round((x1 - x0) / 2), ...lay, capColor: body });
  for (const [xa, dir] of [[x0, 1], [x1, -1]]) {
    // cab nose extruded across z
    const side = [[xa + dir * 0.5, yb], [xa + dir * 0.5, yb + h], [xa + dir * 0.35, yb + h], [xa + dir * 0.05, yb + 1.45], [xa, yb + 0.2], [xa + dir * 0.05, yb]];
    extrude(s, dir > 0 ? side : side.slice().reverse(), zc - hw, zc + hw, body, MAT.gloss, { ...lay });
  }
  // side band and grilles on +z
  decal(s, { o: [x0 + 0.5, yb, zc + hw + 0.006], u: [x1 - x0 - 1, 0, 0], v: [0, h - 0.4, 0] }, (map) => {
    let svg = `<path d="${quadPath(map, 0, 0.12, 1, 0.2)}" fill="#e9ecef"/><path d="${quadPath(map, 0, 0.2, 1, 0.225)}" fill="${PAL.orange}"/>`;
    for (let i = 0; i < 6; i++) { const a = 0.12 + i * 0.12; svg += `<path d="${quadPath(map, a, 0.42, a + 0.09, 0.82)}" fill="#0f2038"/>`; for (let k = 1; k < 8; k++) svg += `<path d="${quadPath(map, a, 0.42 + k * 0.05, a + 0.09, 0.425 + k * 0.05)}" fill="#2a4466"/>`; }
    svg += `<path d="${quadPath(map, 0.015, 0.45, 0.06, 0.85)}" fill="#1c2633"/><path d="${quadPath(map, 0.94, 0.45, 0.985, 0.85)}" fill="#1c2633"/>`;
    return svg;
  }, { ...lay, bias: 0.02, split: Math.round((x1 - x0) / 2.5) });
  // roof equipment
  boxC(s, [(x0 + x1) / 2, yb + h + 0.15, zc], [x1 - x0 - 5, 0.3, 1.6], '#5b6168', MAT.dark, { ...lay, seg: [4, 1, 1] });
  for (const px of [x0 + 3, x1 - 3]) {
    boxC(s, [px, yb + h + 0.36, zc], [0.8, 0.12, 0.8], '#3a3f45', MAT.dark, lay);
    line3(s, [[px - 0.3, yb + h + 0.4, zc], [px + 0.4, yb + h + 1.0, zc], [px - 0.1, yb + h + 1.5, zc]], { color: '#2a2d31', width: 0.04 });
    boxC(s, [px - 0.1, yb + h + 1.52, zc], [0.08, 0.05, 1.5], '#3a3f45', MAT.dark, lay);
  }
  // underframe, buffers
  boxC(s, [(x0 + x1) / 2, yb - 0.15, zc], [x1 - x0 - 0.2, 0.3, w - 0.2], '#26292d', MAT.dark, { ...lay, seg: [Math.round((x1 - x0) / 2), 1, 1] });
  for (const [xa, dir] of [[x0, -1], [x1, 1]]) for (const sg of [-1, 1]) cyl(s, [xa, yb - 0.25, zc + sg * 0.95], [xa + dir * 0.4, yb - 0.25, zc + sg * 0.95], 0.17, '#3a3f45', MAT.dark, { seg: 16, ...lay });
  // Co-Co bogies
  for (const bx of [x0 + 3.6, x1 - 3.6]) {
    for (const dx of [-1.9, 0, 1.9]) K.wheelset(s, { c: [bx + dx, (o.railY || 0) + 0.545, zc], R: 0.545, boxes: true, layer: lay.layer });
    for (const sg of [-1, 1]) {
      const z = zc + sg * 1.14;
      extrude(s, [[bx - 2.6, 0.75], [bx + 2.6, 0.75], [bx + 2.6, 1.3], [bx - 2.6, 1.3]].map(([a, b]) => [a, b + (o.railY || 0)]), z - 0.12, z + 0.12, '#2c3035', MAT.dark, { ...lay, segW: 1 });
      for (const dx of [-1.9, 0, 1.9]) for (let i = 0; i < 4; i++) cyl(s, [bx + dx, 1.3 + i * 0.04 + (o.railY || 0), z], [bx + dx, 1.32 + i * 0.04 + (o.railY || 0), z], 0.13, '#44494f', MAT.dark, { seg: 12, ...lay });
    }
    for (const dx of [-0.95, 0.95]) boxC(s, [bx + dx, 0.9 + (o.railY || 0), zc], [0.7, 0.55, 1.3], '#33373c', MAT.dark, lay);
  }
}

module.exports.metroCar = metroCar;
module.exports.loco = loco;

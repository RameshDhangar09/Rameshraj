'use strict';
// Product machines (each takes a local frame f: x = towards viewer/front, y up, z = machine long axis unless noted)
const E = require('./engine');
const P = require('./prims');
const K = require('./components');
const M = require('./machines');
const { MAT, add, sub, mul, norm } = E;
const { box, boxC, extrude, rbox, revolve, cyl, sphere, decal, pathOf, quadPath, line3, frame, tp, tv, chamfer, rrect } = P;
const { PAL, L } = K;

const B = (s, f, min, max, col, mat = MAT.paint, o = {}) => box(s, min, max, col, mat, { ...o, f });
const BC = (s, f, c, size, col, mat = MAT.paint, o = {}) => boxC(s, c, size, col, mat, { ...o, f });
const CY = (s, f, a, b, r, col, mat = MAT.steel, o = {}) => cyl(s, a, b, r, col, mat, { ...o, f });
const CH = (s, f, x0, y0, x1, y1, z0, z1, c, col, mat = MAT.paint, o = {}) => extrude(s, chamfer(x0, y0, x1, y1, c), z0, z1, col, mat, { ...o, f });
const D = (s, f, plane, fn, o = {}) => decal(s, plane, fn, { ...o, f });
const stripeZ = (s, f, x, y0, y1, z0, z1, col = PAL.orange) => D(s, f, { o: [x, y0, z1], u: [0, 0, z0 - z1], v: [0, y1 - y0, 0] }, M.stripe(col));
const stripeX = (s, f, z, y0, y1, x0, x1, col = PAL.orange) => D(s, f, { o: [x0, y0, z], u: [x1 - x0, 0, 0], v: [0, y1 - y0, 0] }, M.stripe(col));
// shadow of a local box footprint
function shadowBox(s, f, min, max, o = {}) {
  const pts = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) pts.push(tp(f, [x, y, z]));
  s.shadow(pts, { ...o, opacity: (o.opacity || 0.2) * 1.5 });
  s.contact(pts, { opacity: 0.35, blur: 5 });
}
// window panel on +x face (plane x = const)
function winX(s, f, x, y0, y1, z0, z1) { D(s, f, { o: [x, y0, z1], u: [0, 0, z0 - z1], v: [0, y1 - y0, 0] }, M.glassPanel()); }

// tool post with insert tip pointing toward -x (local), tip at p
function toolHolder(s, f, p, dir = [-1, 0, 0], o = {}) {
  const tf = { o: tp(f, p), X: norm(tv(f, mul(dir, -1))), Y: tv(f, [0, 1, 0]), Z: norm(E.cross(tv(f, mul(dir, -1)), tv(f, [0, 1, 0]))) };
  box(s, [0.03, -0.035, -0.035], [0.32, 0.035, 0.035], PAL.char, MAT.dark, { f: tf });
  box(s, [0.0, -0.022, -0.022], [0.04, 0.022, 0.022], '#d4a63c', MAT.chrome, { f: tf });
  box(s, [0.3, -0.09, -0.08], [0.52, 0.09, 0.08], '#3a3f45', MAT.dark, { f: tf });
}

// ---------------- CNC surface wheel lathe ----------------
function surfaceWheelLathe(s, f, o = {}) {
  const R = o.R || 0.5, cy = 1.15;
  // machine base
  B(s, f, [-1.3, 0, -3.1], [1.2, 0.45, 3.1], PAL.navy, MAT.paint, { seg: [1, 1, 4] });
  stripeX(s, f, 3.1001, 0.3, 0.34, -1.3, 1.2);
  // bed top steel ways along z for tool carriages
  for (const x of [0.55, 1.0]) B(s, f, [x - 0.06, 0.45, -2.6], [x + 0.06, 0.52, 2.6], '#aab0b7', MAT.chrome, { seg: [1, 1, 4] });
  // headstocks
  for (const sg of [-1, 1]) {
    const zi = sg * 1.6, zo = sg * 3.0;
    CH(s, f, -1.25, 0.45, 0.75, 2.45, Math.min(zi, zo), Math.max(zi, zo), 0.14, PAL.guard, MAT.paint, { capColor: '#e1e5e9' });
    D(s, f, { o: [0.751, 0.62, Math.max(zi, zo) - 0.05], u: [0, 0, -(1.3)], v: [0, 0.06, 0] }, M.stripe());
    D(s, f, { o: [0.752, 1.35, sg > 0 ? 2.75 : -1.85], u: [0, 0, sg > 0 ? -0.9 : 0.9], v: [0, 0.75, 0] }, M.glassPanel());
    // faceplate + drive
    CY(s, f, [0, cy, zi], [0, cy, zi - sg * 0.12], 0.46, '#5e656d', MAT.steel, { seg: 40 });
    CY(s, f, [0, cy, zi - sg * 0.12], [0, cy, zi - sg * 0.2], 0.2, '#868d95', MAT.steel, { seg: 28 });
    CY(s, f, [0, cy, zi - sg * 0.2], [0, cy, zi - sg * 0.3], 0.07, '#c3c8ce', MAT.chrome, { seg: 20, r1: 0.02 });
    for (const a of [0.6, 2.7, 4.8]) BC(s, f, [Math.cos(a) * 0.34, cy + Math.sin(a) * 0.34, zi - sg * 0.16], [0.1, 0.1, 0.1], PAL.orange, MAT.paint);
  }
  // wheelset between centres
  K.wheelset(s, { f, c: [0, cy, 0], R, boxes: false, discs: o.discs ?? 0, journal: true });
  // tool carriages (one per wheel) on the front
  for (const sg of [-1, 1]) {
    const z = sg * 0.87;
    BC(s, f, [0.78, 0.62, z], [0.75, 0.2, 0.7], PAL.navy2, MAT.paint);
    CH(s, f, 0.55, 0.72, 1.12, 1.08, z - 0.28, z + 0.28, 0.05, PAL.guard, MAT.paint);
    BC(s, f, [0.9, 1.15, z], [0.4, 0.14, 0.34], '#3a3f45', MAT.dark);
    toolHolder(s, f, [R + 0.02, cy, z + sg * 0.02]);
  }
  // rear enclosure + roof
  CH(s, f, -1.55, 0, -1.3, 3.1, -3.1, 3.1, 0.03, '#dfe3e7', MAT.paint, { segW: 4 });
  B(s, f, [-1.55, 3.1, -3.1], [0.4, 3.22, 3.1], '#e4e7ea', MAT.paint, { seg: [1, 1, 4] });
  D(s, f, { o: [0.401, 3.12, 3.1], u: [0, 0, -6.2], v: [0, 0.08, 0] }, M.stripe(PAL.navy));
  // chip conveyor out to the side
  B(s, f, [-0.9, 0, 3.1], [-0.3, 0.6, 4.4], '#3a3f45', MAT.dark);
  extrude(s, [[-0.9, 0.6], [-0.3, 0.6], [-0.3, 1.4], [-0.9, 1.4]].map(([a, b]) => [a, b]), 4.2, 4.6, '#3a3f45', MAT.dark, { f });
  // floor rails leading in
  if (o.rails !== false) for (const sg of [-1, 1]) K.rail(s, 1.4, 7, sg * 0.873, 0, { layer: L.surf, f });
  shadowBox(s, f, [-1.55, 0, -3.1], [1.2, 3.2, 3.1], { opacity: 0.18, blur: 14 });
}

// ---------------- Portal wheel lathe ----------------
function portalWheelLathe(s, f, o = {}) {
  const R = o.R || 0.5;
  const roller = !!o.roller;
  const cy = roller ? 0.95 : 1.25;
  // base
  B(s, f, [-1.6, 0, -2.9], [1.4, 0.5, 2.9], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
  stripeX(s, f, 2.9001, 0.34, 0.38, -1.6, 1.4);
  // portal uprights + crossbeam
  for (const sg of [-1, 1]) {
    const z0 = sg * 2.0, z1 = sg * 2.9;
    CH(s, f, -1.3, 0.5, 0.6, 3.8, Math.min(z0, z1), Math.max(z0, z1), 0.12, PAL.guard, MAT.paint, { capColor: '#e0e4e8' });
    D(s, f, { o: [0.601, 0.85, Math.max(z0, z1) - 0.08], u: [0, 0, -0.74], v: [0, 0.05, 0] }, M.stripe());
  }
  CH(s, f, -1.3, 3.8, 0.6, 4.7, -2.9, 2.9, 0.12, PAL.navy, MAT.paint, { segW: 4 });
  D(s, f, { o: [0.601, 4.1, 2.6], u: [0, 0, -5.2], v: [0, 0.06, 0] }, M.stripe());
  if (!roller) {
    // headstocks in the uprights with centres
    for (const sg of [-1, 1]) {
      const zi = sg * 2.0;
      CY(s, f, [-0.2, cy, zi], [-0.2, cy, zi - sg * 0.35], 0.42, '#5e656d', MAT.steel, { seg: 36 });
      CY(s, f, [-0.2, cy, zi - sg * 0.35], [-0.2, cy, zi - sg * 0.6], 0.1, '#c3c8ce', MAT.chrome, { seg: 18, r1: 0.03 });
    }
    K.wheelset(s, { f, c: [-0.2, cy, 0], R, boxes: o.boxes ?? false, discs: o.discs ?? 0, journal: true });
  } else {
    // drive rollers under each wheel
    for (const sg of [-1, 1]) {
      const z = sg * 0.87;
      for (const dx of [-0.42, 0.42]) {
        const ry = cy - Math.sqrt(Math.pow(R + 0.16, 2) - dx * dx);
        BC(s, f, [-0.2 + dx, (0.5 + ry) / 2, z], [0.3, ry - 0.5, 0.36], '#2e3338', MAT.dark);
        CY(s, f, [-0.2 + dx, ry, z - 0.13], [-0.2 + dx, ry, z + 0.13], 0.16, '#aeb4ba', MAT.chrome, { seg: 28 });
      }
      // axle box holders from above
      BC(s, f, [-0.2, cy + 0.9, sg * 1.45], [0.25, 1.6, 0.25], PAL.navy2, MAT.paint);
      BC(s, f, [-0.2, cy + 0.12, sg * 1.38], [0.28, 0.16, 0.34], PAL.orange, MAT.paint);
    }
    K.wheelset(s, { f, c: [-0.2, cy, 0], R, boxes: true, discs: o.discs ?? 2 });
  }
  // tool slides from the front, hanging from crossbeam side / on the base
  for (const sg of [-1, 1]) {
    const z = sg * 0.87;
    BC(s, f, [0.85, 0.75, z], [0.9, 0.5, 0.75], PAL.navy2, MAT.paint);
    CH(s, f, 0.5, 1.0, 1.25, cy + 0.12, z - 0.3, z + 0.3, 0.05, PAL.guard, MAT.paint);
    toolHolder(s, f, [-0.2 + R + 0.02, cy, z + sg * 0.03]);
  }
  // control pendant arm
  CY(s, f, [0.6, 4.25, 2.9], [1.6, 4.25, 3.3], 0.05, '#5b6168', MAT.steel, { seg: 12 });
  CY(s, f, [1.6, 4.25, 3.3], [1.6, 2.1, 3.3], 0.04, '#5b6168', MAT.steel, { seg: 12 });
  const pf = P.sub2frame(f, [1.6, 1.6, 3.3], -30);
  box(s, [-0.35, -0.45, -0.07], [0.35, 0.45, 0.07], '#2f3338', MAT.dark, { f: pf });
  decal(s, { o: [-0.3, -0.38, 0.072], u: [0.6, 0, 0], v: [0, 0.76, 0] }, M.hmiScreen(1), { f: pf });
  // rails through the machine (wheelset rolls in along x)
  if (o.rails !== false) for (const sg of [-1, 1]) K.rail(s, 1.5, 7, sg * 0.873, 0, { layer: L.surf, f });
  shadowBox(s, f, [-1.6, 0, -2.9], [1.4, 4.7, 2.9], { opacity: 0.18, blur: 14 });
}

// ---------------- Vertical turning & boring machine (VTL) ----------------
function vtl(s, f, o = {}) {
  const tableR = o.tableR || 1.0, workR = o.workR || 0.62;
  // base + table
  CH(s, f, -1.9, 0, 1.9, 0.75, -1.9, 1.9, 0.15, PAL.navy, MAT.paint, { axes: 'xy' });
  D(s, f, { o: [-1.75, 0.5, 1.9001], u: [3.5, 0, 0], v: [0, 0.05, 0] }, M.stripe());
  revolve(s, [[0.75, 0], [0.75, tableR], [0.95, tableR], [0.95, 0]].reverse(), { f, origin: [0, 0, 0], axis: [0, 1, 0], color: '#8d949c', mat: MAT.chrome, seg: 64, bias: -3 });
  // T-slots on the table (decal)
  D(s, f, { o: [-tableR, 0.952, tableR], u: [2 * tableR, 0, 0], v: [0, 0, -2 * tableR] }, (map) => {
    let d = '';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const c = Math.cos(a), sn = Math.sin(a); const p = (r) => [0.5 + c * r / (2 * tableR), 0.5 + sn * r / (2 * tableR)]; d += pathOf(map, [p(workR + 0.15), p(tableR - 0.06)], false); }
    return `<path d="${d}" stroke="#4a5058" stroke-width="2.5" fill="none"/>`;
  }, { bias: -2 });
  // jaws
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; BC(s, f, [Math.cos(a) * (workR + 0.1), 1.08, Math.sin(a) * (workR + 0.1)], [0.14, 0.26, 0.14], PAL.orange, MAT.paint); }
  // workpiece: railway wheel lying flat (axis y)
  if (o.work === 'ring') {
    revolve(s, [[0.95, workR - 0.25], [0.95, workR], [1.55, workR], [1.55, workR - 0.25]].reverse(), { f, origin: [0, 0, 0], axis: [0, 1, 0], color: '#9aa1a9', mat: MAT.chrome, seg: 72 });
    revolve(s, [[1.55, workR - 0.25], [1.55, workR + 0.15], [1.68, workR + 0.15], [1.68, workR - 0.25]].reverse(), { f, origin: [0, 0, 0], axis: [0, 1, 0], color: '#a8aeb5', mat: MAT.chrome, seg: 72 });
  } else {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; BC(s, f, [Math.cos(a) * (workR - 0.1), 1.0, Math.sin(a) * (workR - 0.1)], [0.12, 0.1, 0.12], '#3a3f45', MAT.dark); }
    K.wheel(s, tp(f, [0, 1.1, 0]), tv(f, [0, 1, 0]), 0.0, 1, workR, { seg: 72, body: '#7d848c', hub: '#8d949c' });
  }
  // columns + crossrail
  const colZ = -2.35;
  for (const sx of [-1, 1]) CH(s, f, sx * 1.75 - 0.4, 0, sx * 1.75 + 0.4, 4.6, colZ - 0.5, colZ + 0.5, 0.1, PAL.guard, MAT.paint, { capColor: '#e3e7ea' });
  B(s, f, [-2.4, 4.6, colZ - 0.6], [2.4, 5.2, colZ + 0.6], PAL.navy, MAT.paint, { seg: [3, 1, 1] });
  CH(s, f, -2.3, 3.0, 2.3, 3.7, colZ + 0.5, colZ + 1.05, 0.08, PAL.navy, MAT.paint, { segW: 1 });
  D(s, f, { o: [-2.2, 3.15, colZ + 1.0501], u: [4.4, 0, 0], v: [0, 0.05, 0] }, M.stripe());
  // saddle + ram
  const rx = o.ramX ?? (workR + 0.05);
  CH(s, f, rx - 0.4, 2.7, rx + 0.4, 3.8, colZ + 1.05, colZ + 1.55, 0.06, PAL.guard, MAT.paint);
  // ram moves toward table centre at z ~ 0: place ram over workpiece edge
  B(s, f, [rx - 0.16, 1.55, -0.25], [rx + 0.16, 3.6, 0.07], '#c5cad0', MAT.steel);
  B(s, f, [rx - 0.15, 3.4, colZ + 1.55], [rx + 0.15, 3.6, -0.25], '#c5cad0', MAT.steel);
  BC(s, f, [rx, 1.47, -0.09], [0.22, 0.16, 0.2], PAL.char, MAT.dark);
  BC(s, f, [rx - 0.04, 1.34, -0.09], [0.05, 0.12, 0.05], '#d4a63c', MAT.chrome);
  // turret (side head)
  B(s, f, [-1.25, 2.4, colZ + 1.05], [-0.85, 3.0, colZ + 1.45], '#3a3f45', MAT.dark);
  // guard fence (partial) - low panels around front
  if (o.fence) for (const [x0, x1, z0, z1] of [[-2.6, -2.5, -2.0, 0.6]]) {
    B(s, f, [x0, 0, z0], [x1, 2.0, z1], '#e8ebee', MAT.paint);
  }
  shadowBox(s, f, [-2.4, 0, -2.9], [2.4, 5.2, 1.9], { opacity: 0.18, blur: 14 });
}

// ---------------- Axle lathe (long bed) ----------------
function axleLathe(s, f, o = {}) {
  const len = 2.3; const cy = 1.15; // axle along z
  B(s, f, [-0.9, 0, -3.6], [0.9, 0.85, 3.6], PAL.navy, MAT.paint, { seg: [1, 1, 5] });
  D(s, f, { o: [0.901, 0.6, 3.5], u: [0, 0, -7.0], v: [0, 0.05, 0] }, M.stripe());
  // slanted bed ways
  for (const x of [-0.2, 0.45]) B(s, f, [x - 0.08, 0.85, -3.3], [x + 0.08, 0.95, 3.3], '#aab0b7', MAT.chrome, { seg: [1, 1, 5] });
  // headstock
  CH(s, f, -0.95, 0.85, 0.75, 2.2, -3.6, -2.4, 0.12, PAL.guard, MAT.paint, { capColor: '#e1e5e9' });
  D(s, f, { o: [0.751, 1.05, -2.45], u: [0, 0, -1.1], v: [0, 0.05, 0] }, M.stripe());
  CY(s, f, [0, cy, -2.4], [0, cy, -2.25], 0.38, '#5e656d', MAT.steel, { seg: 36 });
  for (const a of [0.5, 2.6, 4.7]) BC(s, f, [Math.cos(a) * 0.25, cy + Math.sin(a) * 0.25, -2.2], [0.14, 0.1, 0.12], PAL.orange, MAT.paint);
  // tailstock
  CH(s, f, -0.75, 0.95, 0.55, 1.75, 2.4, 3.3, 0.1, PAL.guard, MAT.paint);
  CY(s, f, [0, cy, 2.4], [0, cy, 2.2], 0.12, '#aab0b7', MAT.chrome, { seg: 20 });
  CY(s, f, [0, cy, 2.2], [0, cy, 2.12], 0.06, '#c3c8ce', MAT.chrome, { seg: 16, r1: 0.015 });
  // axle (bare)
  const ax = (z0, z1, r, col = '#a3aab1', mat = MAT.chrome) => CY(s, f, [0, cy, z0], [0, cy, z1], r, col, mat, { seg: 64 });
  ax(-2.2, -1.95, 0.075); ax(-1.95, -1.75, 0.09); ax(-1.75, -0.95, 0.105, '#b5bbc2'); ax(-0.95, 0.95, 0.095, '#8f969e', MAT.steel); ax(0.95, 1.75, 0.105, '#b5bbc2'); ax(1.75, 1.95, 0.09); ax(1.95, 2.12, 0.075);
  // carriage with tool or burnishing roller
  const cz = o.carriageZ ?? 1.3;
  B(s, f, [-0.35, 0.95, cz - (o.burnish ? 0.25 : 0.4)], [0.75, 1.0, cz + (o.burnish ? 0.25 : 0.4)], '#3a3f45', MAT.dark);
  if (!o.burnish) CH(s, f, 0.15, 1.0, 0.9, 1.35, cz - 0.3, cz + 0.3, 0.05, PAL.guard, MAT.paint);
  if (o.burnish) {
    BC(s, f, [0.5, cy, cz], [0.36, 0.16, 0.16], PAL.navy2, MAT.paint);
    BC(s, f, [0.3, cy, cz], [0.12, 0.05, 0.13], '#5b6168', MAT.steel);
    const rx = (o.rj || 0.105) + 0.085;
    CY(s, f, [rx, cy, cz - 0.05], [rx, cy, cz + 0.05], 0.085, '#d9dde1', MAT.chrome, { seg: 32 });
    CY(s, f, [rx, cy, cz - 0.07], [rx, cy, cz + 0.07], 0.02, '#5b6168', MAT.steel, { seg: 12 });
  } else {
    toolHolder(s, f, [0.11, cy, cz]);
    // chips (tiny curls) on the bed
    for (let i = 0; i < 18; i++) {
      const z = cz - 0.5 + (i * 0.37) % 1.0, x = -0.1 + ((i * 0.53) % 0.6);
      const pts = []; for (let k = 0; k < 14; k++) { const t = k / 13 * Math.PI * 3; pts.push(tp(f, [x + 0.03 * Math.cos(t), 0.96 + 0.025 * Math.sin(t) + 0.01, z + t * 0.008])); }
      line3(s, pts, { color: i % 3 ? '#b07a4a' : '#8b6b55', width: 0.006 });
    }
  }
  // splash guard back panel & sliding door (open)
  B(s, f, [-1.2, 0.85, -2.4], [-1.1, 2.6, 2.4], '#dfe3e7', MAT.paint, { seg: [1, 1, 3] });
  B(s, f, [-1.2, 2.6, -3.6], [0.6, 2.7, 3.3], '#e4e7ea', MAT.paint, { seg: [1, 1, 4] });
  // coolant nozzle
  line3(s, [tp(f, [-0.2, 2.5, cz]), tp(f, [-0.1, 1.9, cz]), tp(f, [0.05, 1.45, cz])], { color: '#5b6168', width: 0.03 });
  shadowBox(s, f, [-1.2, 0, -3.6], [1.0, 2.7, 3.6], { opacity: 0.18, blur: 14 });
}

// ---------------- Wheel press (horizontal) ----------------
function wheelPress(s, f, o = {}) {
  const cy = 1.15;
  // bed
  B(s, f, [-1.0, 0, -4.2], [1.0, 0.7, 4.2], PAL.navy, MAT.paint, { seg: [1, 1, 5] });
  D(s, f, { o: [1.001, 0.5, 4.1], u: [0, 0, -8.2], v: [0, 0.05, 0] }, M.stripe());
  // crossheads (end frames)
  for (const z of [-3.6, 2.6]) CH(s, f, -1.0, 0.7, 1.0, 2.2, z - 0.35, z + 0.35, 0.15, PAL.guard, MAT.paint, { capColor: '#e3e7ea' });
  // tie rods
  for (const x of [-0.7, 0.7]) for (const y of [0.95, 1.95]) CY(s, f, [x, y, -3.9], [x, y, 2.9], 0.08, '#c3c8ce', MAT.chrome, { seg: 20 });
  // nuts
  for (const x of [-0.7, 0.7]) for (const y of [0.95, 1.95]) for (const z of [-3.97, 2.97]) CY(s, f, [x, y, z - 0.06], [x, y, z + 0.06], 0.13, '#3a3f45', MAT.dark, { seg: 6 });
  // hydraulic cylinder
  CY(s, f, [0, cy, -4.9], [0, cy, -3.95], 0.55, '#2a4a75', MAT.paint, { seg: 56 });
  for (const z of [-4.85, -4.0]) CY(s, f, [0, cy, z - 0.05], [0, cy, z + 0.05], 0.6, '#3a3f45', MAT.dark, { seg: 56 });
  CY(s, f, [0, cy, -3.25], [0, cy, -2.3], 0.22, '#d5d9dd', MAT.chrome, { seg: 28 });
  // moving platen
  CH(s, f, -0.85, 0.75, 0.85, 1.85, -2.3, -2.0, 0.1, '#5e656d', MAT.steel);
  D(s, f, { o: [0.851, 1.0, -2.02], u: [0, 0, -0.26], v: [0, 0.6, 0] }, M.stripe(PAL.orange));
  // wheelset being pressed: axle + one wheel mounted + one wheel being pressed on
  CY(s, f, [0, cy, -1.95], [0, cy, 2.25], 0.095, '#b5bbc2', MAT.chrome, { seg: 30 });
  K.wheel(s, tp(f, [0, cy, 0]), tv(f, [0, 0, 1]), 0.8, 1, 0.5);
  K.wheel(s, tp(f, [0, cy, 0]), tv(f, [0, 0, 1]), -1.25, -1, 0.5);
  // wheel support trolley
  BC(s, f, [0, 0.6, -1.3], [0.9, 0.3, 0.4], '#3a3f45', MAT.dark);
  // hydraulic power pack
  const hp = P.sub2frame(f, [0.4, 0, -6.4]);
  B(s, hp, [-0.7, 0, -0.6], [0.7, 1.1, 0.6], '#dfe3e7', MAT.paint);
  CY(s, hp, [0.2, 1.1, 0], [0.2, 1.45, 0], 0.2, PAL.navy, MAT.gloss, { seg: 20 });
  // pressure gauge (dial) & hoses
  line3(s, [tp(f, [0.3, 1.1, -5.8]), tp(f, [0.5, 1.6, -5.2]), tp(f, [0.35, 1.5, -4.6])], { color: '#1f2226', width: 0.05 });
  shadowBox(s, f, [-1.0, 0, -7.0], [1.0, 2.2, 4.2], { opacity: 0.18, blur: 14 });
}

// ---------------- Wheel measuring station ----------------
function measuringStation(s, f, o = {}) {
  const cy = 0.95, R = 0.5;
  // base frame
  B(s, f, [-0.9, 0, -2.0], [0.9, 0.3, 2.0], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
  // V-support stands at journals
  for (const sg of [-1, 1]) {
    BC(s, f, [0, 0.6, sg * 1.25], [0.4, 0.62, 0.3], '#dfe3e7', MAT.paint);
    BC(s, f, [0, 0.86, sg * 1.25], [0.3, 0.1, 0.32], PAL.orange, MAT.paint);
  }
  K.wheelset(s, { f, c: [0, cy, 0], R, journal: true, discs: o.discs ?? 0 });
  // sensor gantry: arch over wheelset
  for (const sg of [-1, 1]) CH(s, f, -1.4, 0.3, -1.05, 2.4, sg * 1.9 - 0.18, sg * 1.9 + 0.18, 0.04, PAL.guard, MAT.paint);
  B(s, f, [-1.45, 2.4, -2.1], [-1.0, 2.7, 2.1], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
  // laser sensor heads aimed at each wheel tread
  for (const sg of [-1, 1]) {
    const z = sg * 0.87;
    BC(s, f, [-1.1, 1.6, z], [0.2, 0.9, 0.12], '#5b6168', MAT.steel);
    BC(s, f, [-0.85, 1.25, z], [0.3, 0.22, 0.22], '#e6e9ec', MAT.paint);
    BC(s, f, [-0.72, 1.25, z], [0.04, 0.14, 0.14], '#1b1d20', MAT.gloss);
    // laser lines (thin red) to tread
    line3(s, [tp(f, [-0.7, 1.25, z]), tp(f, [-0.42, cy + 0.28, z - 0.06]), tp(f, [-0.42, cy + 0.28, z + 0.06]), tp(f, [-0.7, 1.25, z])], { color: '#ff4a3d', width: 0.004, opacity: 0.85 });
    s.light.points.push({ p: tp(f, [-0.45, cy + 0.3, z]), i: 0.15, r: 0.25, c: '#ff6655' });
    // contact probe from below
    BC(s, f, [0.0, 0.35 + 0.0, z + sg * 0.05], [0.12, 0.12, 0.12], '#3a3f45', MAT.dark);
  }
  // screen stand
  const sf = P.sub2frame(f, [1.3, 0, 2.2], -35);
  CY(s, sf, [0, 0, 0], [0, 1.4, 0], 0.05, '#5b6168', MAT.steel, { seg: 12 });
  B(s, sf, [-0.25, 0, -0.25], [0.25, 0.05, 0.25], '#3a3f45', MAT.dark);
  box(s, [-0.5, 1.25, -0.04], [0.5, 1.9, 0.04], '#2f3338', MAT.dark, { f: sf });
  decal(s, { o: [-0.46, 1.29, 0.042], u: [0.92, 0, 0], v: [0, 0.57, 0] }, M.hmiScreen(0), { f: sf });
  shadowBox(s, f, [-1.45, 0, -2.1], [0.9, 2.7, 2.1], { opacity: 0.16, blur: 12 });
}

// ---------------- Dynamic wheel balancing machine ----------------
function balancingMachine(s, f, o = {}) {
  const cy = 1.05, R = 0.5;
  B(s, f, [-0.8, 0, -2.3], [0.8, 0.35, 2.3], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
  D(s, f, { o: [0.801, 0.2, 2.2], u: [0, 0, -4.4], v: [0, 0.04, 0] }, M.stripe());
  // pedestals with roller cradles
  for (const sg of [-1, 1]) {
    CH(s, f, -0.45, 0.35, 0.45, 0.85, sg * 1.3 - 0.22, sg * 1.3 + 0.22, 0.06, PAL.guard, MAT.paint);
    for (const dx of [-0.12, 0.12]) CY(s, f, [dx, 0.92, sg * 1.3 - 0.08], [dx, 0.92, sg * 1.3 + 0.08], 0.075, '#c3c8ce', MAT.chrome, { seg: 20 });
    BC(s, f, [0, 0.8, sg * 1.3], [0.5, 0.06, 0.3], PAL.orange, MAT.paint);
  }
  K.wheelset(s, { f, c: [0, cy, 0], R, journal: true, discs: o.discs ?? 2 });
  // drive: belt from motor under one wheel side to axle
  const mz = 0.25;
  BC(s, f, [0.0, 0.55, mz], [0.6, 0.4, 0.5], '#3a3f45', MAT.dark);
  CY(s, f, [0, 0.55, mz - 0.3], [0, 0.55, mz + 0.3], 0.18, '#5e656d', MAT.steel, { seg: 24 });
  // belt (two lines) from motor pulley to axle
  for (const k of [-1, 1]) {
    line3(s, [tp(f, [k * 0.18, 0.55, mz]), tp(f, [k * 0.095, cy, mz])], { color: '#1c1e21', width: 0.06 });
  }
  // safety guard frame (mesh) behind
  B(s, f, [-1.3, 0, -2.4], [-1.25, 1.9, 2.4], '#cfd4d9', MAT.paint, { seg: [1, 1, 3] });
  D(s, f, { o: [-1.249, 0.1, 2.35], u: [0, 0, -4.7], v: [0, 1.7, 0] }, (map) => {
    let d = ''; for (let i = 1; i < 30; i++) d += pathOf(map, [[i / 30, 0], [i / 30, 1]], false);
    for (let j = 1; j < 12; j++) d += pathOf(map, [[0, j / 12], [1, j / 12]], false);
    return `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="#3c4a5c" fill-opacity="0.35"/><path d="${d}" stroke="#8e98a3" stroke-width="0.8" fill="none"/>`;
  });
  // console
  M.controlConsole(s, P.sub2frame(f, [1.4, 0, -2.5], 35), { variant: 1 });
  shadowBox(s, f, [-0.8, 0, -2.3], [0.8, 1.6, 2.3], { opacity: 0.16, blur: 12 });
}

// ---------------- Armature machine ----------------
function armatureMachine(s, f, o = {}) {
  const cy = 1.15;
  B(s, f, [-0.8, 0, -2.4], [0.8, 0.85, 2.4], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
  D(s, f, { o: [0.801, 0.6, 2.3], u: [0, 0, -4.6], v: [0, 0.05, 0] }, M.stripe());
  CH(s, f, -0.85, 0.85, 0.65, 2.0, -2.4, -1.5, 0.1, PAL.guard, MAT.paint);
  CY(s, f, [0, cy, -1.5], [0, cy, -1.38], 0.3, '#5e656d', MAT.steel, { seg: 30 });
  CH(s, f, -0.6, 0.85, 0.5, 1.6, 1.55, 2.3, 0.08, PAL.guard, MAT.paint);
  CY(s, f, [0, cy, 1.55], [0, cy, 1.35], 0.08, '#c3c8ce', MAT.chrome, { seg: 16, r1: 0.02 });
  // armature: shaft, core (laminations), windings, commutator (copper bars)
  CY(s, f, [0, cy, -1.38], [0, cy, 1.35], 0.06, '#c3c8ce', MAT.chrome, { seg: 20 });
  CY(s, f, [0, cy, -0.75], [0, cy, 0.35], 0.36, '#4b5259', MAT.steel, { seg: 48 });
  // lamination slots: decal-less, use thin rings
  for (let z = -0.7; z < 0.33; z += 0.09) CY(s, f, [0, cy, z], [0, cy, z + 0.012], 0.362, '#2f3439', MAT.dark, { seg: 48 });
  // end windings (copper)
  CY(s, f, [0, cy, -1.0], [0, cy, -0.75], 0.31, '#a8653a', MAT.steel, { seg: 40, r1: 0.34 });
  CY(s, f, [0, cy, 0.35], [0, cy, 0.55], 0.34, '#a8653a', MAT.steel, { seg: 40, r1: 0.28 });
  // commutator: segmented copper drum
  const segs = 36;
  for (let i = 0; i < segs; i++) revolve(s, [[0.6, 0.0], [0.6, 0.2], [1.0, 0.2], [1.0, 0.0]].reverse(), { f, origin: [0, cy, 0], axis: [0, 0, 1], seg: 1, arc: [(i / segs) * Math.PI * 2, ((i + 0.82) / segs) * Math.PI * 2], color: i % 2 ? '#c27c45' : '#b8733e', mat: MAT.chrome });
  CY(s, f, [0, cy, 0.6], [0, cy, 1.0], 0.19, '#2a2016', MAT.dark, { seg: 36 });
  // undercutting / turning tool on carriage
  B(s, f, [-0.2, 0.85, 0.5], [0.75, 0.95, 1.2], '#3a3f45', MAT.dark);
  CH(s, f, 0.25, 0.95, 0.8, 1.25, 0.6, 1.1, 0.04, PAL.guard, MAT.paint);
  toolHolder(s, f, [0.205, cy, 0.8]);
  // hood
  B(s, f, [-1.1, 0.85, -2.4], [-1.0, 2.4, 2.4], '#dfe3e7', MAT.paint, { seg: [1, 1, 3] });
  B(s, f, [-1.1, 2.4, -2.4], [0.5, 2.5, 2.4], '#e4e7ea', MAT.paint, { seg: [1, 1, 3] });
  shadowBox(s, f, [-1.1, 0, -2.4], [0.8, 2.5, 2.4], { opacity: 0.16, blur: 12 });
}

module.exports = { B, BC, CY, CH, D, shadowBox, toolHolder, surfaceWheelLathe, portalWheelLathe, vtl, axleLathe, wheelPress, measuringStation, balancingMachine, armatureMachine, winX };

'use strict';
const E = require('../lib/engine');
const P = require('../lib/prims');
const K = require('../lib/components');
const M = require('../lib/machines');
const { MAT } = E;
const { PAL, L } = K;

// standard bright workshop interior
function shop(o) {
  const s = new E.Scene({ W: o.W || 1600, H: o.H || 1000, lightDir: o.lightDir || [0.35, 0.85, -0.25], fogDensity: o.fog ?? 0.01, fogColor: o.fogColor || '#dde3e9', amb: o.amb ?? 0.62, key: o.key ?? 0.7, sky: o.sky, ground: o.ground });
  s.setCamera(o.cam);
  const h = { x0: -30, x1: 30, z0: -14, z1: 14, h: 11, ...(o.hall || {}) };
  K.hall(s, h);
  if (o.shafts !== false) {
    const z = h.z0 + 0.1, q = [];
    const xs = o.shaftX || [-8, 0, 8];
    for (const x of xs) q.push([[x, h.h * 0.82, z], [x + 4.4, h.h * 0.82, z], [x + 4.4, h.h * 0.55, z], [x, h.h * 0.55, z]]);
    K.shafts(s, q, o.shaftDir || [-0.35, -0.85, 0.3], { op: o.shaftOp ?? 0.26 });
  }
  return s;
}
function finish(s, o = {}) {
  if (o.grade !== false) K.overlayGradient(s, [[0, '#0b1a2e', o.top ?? 0.12], [0.45, '#0b1a2e', 0], [1, '#0b1a2e', o.bottom ?? 0.06]], 0, 0, 0, 1);
  K.vignette(s, o.vig ?? 0.28);
  return s.toSVG();
}
// outdoor: sky, ground, horizon
function outdoor(o) {
  const s = new E.Scene({ W: o.W || 1600, H: o.H || 1000, lightDir: o.lightDir || [-0.5, 0.75, 0.45], fogDensity: o.fog ?? 0.006, fogColor: o.fogColor || '#dfe7ef', fogStart: 10, amb: 0.65, key: 0.8, sky: '#dfe9f5', ground: '#a3a39b' });
  s.setCamera(o.cam);
  K.bgGradient(s, o.skyStops || [[0, '#8fb0d2'], [0.45, '#c9d9e9'], [0.62, '#e9eff4'], [1, '#e9eff4']]);
  const g = o.ground || { x0: -300, x1: 300, z0: -300, z1: 60 };
  K.floorWithHoles(s, g.x0, g.x1, g.z0, g.z1, o.holes || [], o.groundColor || '#b7b5ad');
  return s;
}
// simple human silhouette (no face), standing at p, facing yaw deg
function person(s, p, yaw = 0, o = {}) {
  const f = P.frame(p, yaw); const col = o.color || '#3a4352'; const m = MAT.matte;
  const h = o.h || 1.75; const k = h / 1.75;
  for (const sx of [-0.09, 0.09]) P.cyl(s, [sx * k, 0, 0], [sx * k, 0.86 * k, 0], 0.07 * k, col, m, { f, seg: 10, r1: 0.085 * k });
  P.cyl(s, [0, 0.82 * k, 0], [0, 1.45 * k, 0], 0.19 * k, o.top || col, m, { f, seg: 14, r1: 0.21 * k });
  P.sphere(s, P.tp(f, [0, 1.6 * k, 0]), 0.11 * k, col, m, { seg: 12, rings: 8 });
  if (o.helmet) P.sphere(s, P.tp(f, [0, 1.65 * k, 0]), 0.125 * k, o.helmet, MAT.gloss, { seg: 12, rings: 6 });
  if (o.seated) {}
  s.contact([P.tp(f, [-0.25, 0, -0.2]), P.tp(f, [0.25, 0, -0.2]), P.tp(f, [0.25, 0, 0.2]), P.tp(f, [-0.25, 0, 0.2])], { opacity: 0.3 });
}
// low-poly tree
function tree(s, p, h = 6, o = {}) {
  P.cyl(s, p, [p[0], p[1] + h * 0.45, p[2]], 0.14 * h / 6, '#6b5a48', MAT.matte, { seg: 8 });
  const cols = o.cols || ['#5f7f4f', '#6d8f5a', '#58784a'];
  const r = h * 0.28;
  [[0, 0.62, 0, 1], [-0.25, 0.5, 0.15, 0.8], [0.25, 0.52, -0.1, 0.8], [0, 0.82, 0, 0.7]].forEach(([dx, dy, dz, sc], i) => {
    P.sphere(s, [p[0] + dx * h * 0.4, p[1] + dy * h, p[2] + dz * h * 0.4], r * sc, cols[i % cols.length], MAT.matte, { seg: 10, rings: 6 });
  });
}
module.exports = { shop, finish, outdoor, person, tree, E, P, K, M, MAT, PAL, L };

// city / campus building block with window grid on its faces
function building(s, x0, x1, z0, z1, h, o = {}) {
  const col = o.color || '#dfe3e7';
  P.box(s, [x0, 0, z0], [x1, h, z1], col, MAT.matte, { skip: ['bottom'] });
  const faces = [
    { o: [x0, 0, z1 + 0.01], u: [x1 - x0, 0, 0], v: [0, h, 0], w: x1 - x0 },
    { o: [x1 + 0.01, 0, z1], u: [0, 0, z0 - z1], v: [0, h, 0], w: z1 - z0 },
    { o: [x0 - 0.01, 0, z0], u: [0, 0, z1 - z0], v: [0, h, 0], w: z1 - z0 },
  ];
  for (const F of faces) {
    P.decal(s, { o: F.o, u: F.u, v: F.v }, (map) => {
      const fl = Math.max(1, Math.floor(h / (o.floorH || 3.6))); const nc = Math.max(1, Math.floor(F.w / (o.bay || 2.4)));
      let d = '';
      for (let i = 0; i < nc; i++) for (let j = 0; j < fl; j++) {
        const a = (i + 0.18) / nc, b = (i + 0.82) / nc, c = (j + 0.3) / fl, e = (j + 0.85) / fl;
        d += P.quadPath(map, a, c, b, e);
      }
      return `<path d="${d}" fill="${o.win || '#7f93aa'}"/>`;
    });
  }
}
module.exports.building = building;

// heavy road vehicle (olive) for transport scenes, frame f (x forward)
function heavyTruck(s, f, o = {}) {
  const col = o.color || '#5e6650';
  P.box(s, [-3.6, 0.7, -1.2], [3.4, 1.0, 1.2], '#2f3329', MAT.dark, { f });
  P.extrude(s, P.chamfer(2.0, 1.0, 3.6, 2.9, 0.2), -1.25, 1.25, col, MAT.paint, { f });
  P.decal(s, { o: [2.3, 2.0, 1.251], u: [1.1, 0, 0], v: [0, 0.65, 0] }, require('../lib/machines').glassPanel('#252a22'), { f });
  P.decal(s, { o: [3.601, 2.0, 1.0], u: [0, 0, -2.0], v: [0, 0.7, 0] }, require('../lib/machines').glassPanel('#252a22'), { f });
  P.extrude(s, P.chamfer(-3.6, 1.0, 1.8, 3.1, 0.06), -1.25, 1.25, o.box || '#6a7259', MAT.matte, { f });
  for (const x of [-2.6, -1.2, 2.6]) for (const sg of [-1, 1]) {
    P.cyl(s, [x, 0.55, sg * 0.95], [x, 0.55, sg * 1.3], 0.55, '#1f2120', MAT.rubber, { f, seg: 24 });
    P.cyl(s, [x, 0.55, sg * 1.3], [x, 0.55, sg * 1.32], 0.28, '#4a4f40', MAT.dark, { f, seg: 16 });
  }
}
module.exports.heavyTruck = heavyTruck;

// flat wagon along x centred at x, BG
function flatWagon(s, x, o = {}) {
  const L = o.len || 14; const y = o.y || 0.32;
  P.box(s, [x - L / 2, y + 1.0, -1.5], [x + L / 2, y + 1.25, 1.5], o.color || '#5a4e46', MAT.dark, { seg: [4, 1, 1] });
  P.box(s, [x - L / 2, y + 0.75, -1.3], [x + L / 2, y + 1.0, 1.3], '#2a2d31', MAT.dark, { seg: [4, 1, 1] });
  for (const bx of [x - L / 2 + 2.2, x + L / 2 - 2.2]) M.bogie(s, { x: bx, y, R: 0.46, wb: 2.0 });
}
module.exports.flatWagon = flatWagon;

// ---- interiors ----
function room(o) {
  const s = new E.Scene({ W: o.W || 1600, H: o.H || 1000, lightDir: o.lightDir || [-0.5, 0.75, 0.45], fogDensity: o.fog ?? 0.01, fogColor: o.fogColor || '#e6eaee', amb: o.amb ?? 0.7, key: o.key ?? 0.55, sky: o.sky || '#f2f4f7', ground: o.ground || '#b9b4ab', lightColor: o.lightColor });
  s.setCamera(o.cam);
  const { x0, x1, z0, z1, h } = { x0: -6, x1: 6, z0: -5, z1: 6, h: 3.2, ...o.box };
  K.floorWithHoles(s, x0, x1, z0, z1, [], o.floor || '#c8c3ba');
  const wall = o.wall || '#eef0f2';
  const W = (pts, n) => s.poly(pts, wall, MAT.matte, { layer: L.base, nHint: n, grad: true });
  W([[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], [0, 0, 1]);
  W([[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], [1, 0, 0]);
  W([[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], [-1, 0, 0]);
  s.poly([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], o.ceil || '#f4f5f6', MAT.matte, { layer: L.base, nHint: [0, -1, 0], grad: true });
  // ceiling light panels
  for (let x = x0 + 1.5; x < x1 - 1; x += 3) for (let z = z0 + 1.5; z < z1 - 1; z += 3)
    P.decal(s, { o: [x - 0.3, h - 0.005, z - 0.3], u: [0.6, 0, 0], v: [0, 0, 0.6] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#ffffff"/>`, { two: true, layer: L.surf, noHost: true });
  // window wall (left wall by default): large glazing with soft daylight
  if (o.windows !== false) {
    const wz0 = z0 + 0.6, wz1 = z1 - 0.6;
    P.decal(s, { o: [x0 + 0.01, 0.9, wz1], u: [0, 0, wz0 - wz1], v: [0, h - 1.2, 0] }, (map) => {
      let svg = `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#f6fbff"/>`;
      // hint of greenery & sky outside
      svg += `<path d="${P.quadPath(map, 0, 0, 1, 0.35)}" fill="#cfe0c8" fill-opacity="0.7"/>`;
      let m = ''; const n = Math.round((wz1 - wz0) / 1.2);
      for (let i = 1; i < n; i++) m += P.quadPath(map, i / n - 0.004, 0, i / n + 0.004, 1);
      return svg + `<path d="${m}" fill="#9aa3ad"/>`;
    }, { layer: L.surf, two: true, noHost: true });
    K.shafts(s, [[[x0 + 0.02, h - 0.4, wz0 + 1], [x0 + 0.02, h - 0.4, wz1 - 1], [x0 + 0.02, 1.0, wz1 - 1], [x0 + 0.02, 1.0, wz0 + 1]]], [0.8, -0.5, 0.15], { op: 0.18, blur: 14, patchOp: 0.3 });
  }
  return s;
}
function desk(s, f, o = {}) {
  const top = o.top || '#e9e6e1';
  P.box(s, [-0.8, 0.72, -0.4], [0.8, 0.76, 0.4], top, MAT.paint, { f });
  for (const x of [-0.75, 0.75]) P.box(s, [x - 0.03, 0, -0.35], [x + 0.03, 0.72, 0.35], '#3a3f45', MAT.dark, { f });
}
function chair(s, f, o = {}) {
  const col = o.color || '#2f3e52';
  P.cyl(s, [0, 0.05, 0], [0, 0.45, 0], 0.03, '#5b6168', MAT.steel, { f, seg: 8 });
  P.cyl(s, [0, 0.0, 0], [0, 0.05, 0], 0.28, '#3a3f45', MAT.dark, { f, seg: 10 });
  P.rbox(s, [-0.24, 0.45, -0.24], [0.24, 0.53, 0.24], 0.04, col, MAT.matte, { f, axes: 'xz' });
  P.rbox(s, [-0.22, 0.6, -0.26], [0.22, 1.05, -0.2], 0.05, col, MAT.matte, { f });
}
function monitor(s, f, w, h, content, o = {}) {
  P.box(s, [-w / 2, 0.0, -0.025], [w / 2, h, 0.025], '#1f2226', MAT.dark, { f });
  P.decal(s, { o: [-w / 2 + 0.015, 0.015, 0.0255], u: [w - 0.03, 0, 0], v: [0, h - 0.03, 0] }, content, { f });
  if (o.stand !== false) { P.box(s, [-0.03, -0.25, -0.05], [0.03, 0.05, -0.02], '#5b6168', MAT.steel, { f }); P.box(s, [-0.14, -0.27, -0.15], [0.14, -0.25, 0.05], '#5b6168', MAT.steel, { f }); }
}
// isometric CAD drawing of a portal-style machine, drawn into a decal map
function cadDrawing(o = {}) {
  const boxes = o.boxes || [
    [[-1.6, 0, -2.9], [1.4, 0.5, 2.9], 0], [[-1.3, 0.5, -2.9], [0.6, 3.8, -2.0], 1], [[-1.3, 0.5, 2.0], [0.6, 3.8, 2.9], 1], [[-1.3, 3.8, -2.9], [0.6, 4.7, 2.9], 0],
    [[0.4, 0.5, -1.2], [1.3, 1.3, -0.5], 1], [[0.4, 0.5, 0.5], [1.3, 1.3, 1.2], 1],
  ];
  const iso = (p) => [(p[0] - p[2]) * 0.866, -(p[0] + p[2]) * 0.5 - p[1]];
  const all = []; boxes.forEach(([a, b]) => { for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) all.push(iso([x, y, z])); });
  const mnx = Math.min(...all.map((p) => p[0])), mxx = Math.max(...all.map((p) => p[0])), mny = Math.min(...all.map((p) => p[1])), mxy = Math.max(...all.map((p) => p[1]));
  const sc = Math.min(0.8 / (mxx - mnx), 0.75 / (mxy - mny));
  const N = ([x, y]) => [0.1 + (x - mnx) * sc + (0.8 - (mxx - mnx) * sc) / 2, 0.88 - (y - mny) * sc];
  return (map) => {
    let svg = `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="${o.bg || '#1d2633'}"/>`;
    if (o.ui !== false) { svg += `<path d="${P.quadPath(map, 0, 0.93, 1, 1)}" fill="#2a3646"/><path d="${P.quadPath(map, 0, 0, 0.06, 0.93)}" fill="#253040"/>`; for (let i = 0; i < 8; i++) svg += `<path d="${P.quadPath(map, 0.012, 0.85 - i * 0.07, 0.048, 0.89 - i * 0.07)}" fill="#3d4c60"/>`; }
    let faces = '', edges = '';
    boxes.forEach(([a, b, t]) => {
      const c = (x, y, z) => N(iso([x, y, z]));
      const top = [c(a[0], b[1], a[2]), c(b[0], b[1], a[2]), c(b[0], b[1], b[2]), c(a[0], b[1], b[2])];
      const fr = [c(b[0], a[1], a[2]), c(b[0], b[1], a[2]), c(b[0], b[1], b[2]), c(b[0], a[1], b[2])];
      const sd = [c(a[0], a[1], b[2]), c(b[0], a[1], b[2]), c(b[0], b[1], b[2]), c(a[0], b[1], b[2])];
      const P2 = (q) => 'M' + q.map((p) => { const m = map(p[0], p[1]); return m[0].toFixed(1) + ' ' + m[1].toFixed(1); }).join('L') + 'Z';
      const colT = t ? (o.c1 || '#c9d3de') : (o.c0 || '#4f78a8');
      faces += `<path d="${P2(top)}" fill="${colT}" fill-opacity="0.9"/><path d="${P2(fr)}" fill="${colT}" fill-opacity="0.65"/><path d="${P2(sd)}" fill="${colT}" fill-opacity="0.45"/>`;
      edges += P2(top) + P2(fr) + P2(sd);
    });
    svg += faces + `<path d="${edges}" fill="none" stroke="${o.edge || '#e9f1fa'}" stroke-width="0.9" stroke-opacity="0.8"/>`;
    // orange highlight of a selected part
    svg += `<path d="${P.quadPath(map, 0.78, 0.08, 0.95, 0.2)}" fill="#F58220" fill-opacity="0.85"/>`;
    return svg;
  };
}
function drawingSheet() {
  return (map) => {
    let svg = `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#f7f7f4"/>`;
    svg += `<path d="${P.quadPath(map, 0.03, 0.04, 0.97, 0.96)}" fill="none" stroke="#2b3d57" stroke-width="1"/>`;
    svg += `<path d="${P.quadPath(map, 0.65, 0.04, 0.97, 0.2)}" fill="none" stroke="#2b3d57" stroke-width="0.8"/>`;
    let d = '';
    d += P.quadPath(map, 0.1, 0.35, 0.55, 0.8) + P.quadPath(map, 0.15, 0.45, 0.3, 0.7);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, b = ((i + 1) / 24) * Math.PI * 2; d += P.pathOf(map, [[0.78 + 0.1 * Math.cos(a), 0.6 + 0.16 * Math.sin(a)], [0.78 + 0.1 * Math.cos(b), 0.6 + 0.16 * Math.sin(b)]], false); }
    d += P.pathOf(map, [[0.1, 0.28], [0.55, 0.28]], false) + P.pathOf(map, [[0.6, 0.6], [0.96, 0.6]], false);
    return svg + `<path d="${d}" fill="none" stroke="#2b3d57" stroke-width="0.9"/>`;
  };
}
// seated figure (no face)
function seated(s, p, yaw = 0, o = {}) {
  const f = P.frame(p, yaw); const col = o.color || '#3a4352';
  P.cyl(s, [0, 0.45, -0.05], [0, 1.05, -0.1], 0.18, o.top || col, MAT.matte, { f, seg: 12, r1: 0.2 });
  P.sphere(s, P.tp(f, [0, 1.2, -0.1]), 0.1, col, MAT.matte, { seg: 10, rings: 6 });
  for (const sx of [-0.1, 0.1]) { P.cyl(s, [sx, 0.47, -0.05], [sx, 0.47, 0.35], 0.07, col, MAT.matte, { f, seg: 8 }); P.cyl(s, [sx, 0.47, 0.35], [sx, 0.0, 0.38], 0.06, col, MAT.matte, { f, seg: 8 }); }
}
Object.assign(module.exports, { room, desk, chair, monitor, cadDrawing, drawingSheet, seated });

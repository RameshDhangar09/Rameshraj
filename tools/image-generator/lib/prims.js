'use strict';
const E = require('./engine');
const { MAT, add, sub, mul, dot, cross, norm, len, f1 } = E;

// A frame maps local coords to world: o + x*X + y*Y + z*Z
function frame(o = [0, 0, 0], yawDeg = 0, pitchDeg = 0, k = 1) {
  if (k !== 1) { const f0 = frame(o, yawDeg, pitchDeg); return { o, X: mul(f0.X, k), Y: mul(f0.Y, k), Z: mul(f0.Z, k), k }; }
  const a = (yawDeg * Math.PI) / 180, b = (pitchDeg * Math.PI) / 180;
  // yaw about Y, then pitch about local X
  const X = [Math.cos(a), 0, -Math.sin(a)];
  const Z0 = [Math.sin(a), 0, Math.cos(a)];
  const Y = add(mul([0, 1, 0], Math.cos(b)), mul(Z0, -Math.sin(b)));
  const Z = add(mul(Z0, Math.cos(b)), mul([0, 1, 0], Math.sin(b)));
  return { o, X, Y, Z };
}
const ID = frame();
const tp = (f, p) => add(f.o, add(add(mul(f.X, p[0]), mul(f.Y, p[1])), mul(f.Z, p[2])));
const tv = (f, v) => add(add(mul(f.X, v[0]), mul(f.Y, v[1])), mul(f.Z, v[2]));
function sub2frame(f, p, yawDeg = 0) { // child frame at local point p with extra yaw
  const c = frame([0, 0, 0], yawDeg);
  return { o: tp(f, p), X: tv(f, c.X), Y: tv(f, c.Y), Z: tv(f, c.Z), k: f.k };
}

// ---------------- box ----------------
// box(s, min, max, color, mat, o) ; o.f frame, o.seg [nx,ny,nz] subdivisions, o.skip set of faces, o.colors per face
function box(s, min, max, color, mat = MAT.paint, o = {}) {
  const f = o.f || ID; const [x0, y0, z0] = min, [x1, y1, z1] = max;
  const seg = o.seg || [1, 1, 1];
  const faces = {
    top: { n: [0, 1, 0], o: [x0, y1, z0], u: [x1 - x0, 0, 0], v: [0, 0, z1 - z0], su: seg[0], sv: seg[2] },
    bottom: { n: [0, -1, 0], o: [x0, y0, z0], u: [x1 - x0, 0, 0], v: [0, 0, z1 - z0], su: seg[0], sv: seg[2] },
    front: { n: [0, 0, 1], o: [x0, y0, z1], u: [x1 - x0, 0, 0], v: [0, y1 - y0, 0], su: seg[0], sv: seg[1] },
    back: { n: [0, 0, -1], o: [x0, y0, z0], u: [x1 - x0, 0, 0], v: [0, y1 - y0, 0], su: seg[0], sv: seg[1] },
    right: { n: [1, 0, 0], o: [x1, y0, z0], u: [0, 0, z1 - z0], v: [0, y1 - y0, 0], su: seg[2], sv: seg[1] },
    left: { n: [-1, 0, 0], o: [x0, y0, z0], u: [0, 0, z1 - z0], v: [0, y1 - y0, 0], su: seg[2], sv: seg[1] },
  };
  for (const [k, F] of Object.entries(faces)) {
    if (o.skip && o.skip.includes(k)) continue;
    const col = (o.colors && o.colors[k]) || color;
    const nW = tv(f, F.n);
    for (let i = 0; i < F.su; i++) for (let j = 0; j < F.sv; j++) {
      const P = (a, b) => tp(f, add(F.o, add(mul(F.u, a / F.su), mul(F.v, b / F.sv))));
      s.poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], col, (o.mats && o.mats[k]) || mat, { ...o, nHint: nW });
    }
  }
}
const boxC = (s, c, size, color, mat, o) => box(s, [c[0] - size[0] / 2, c[1] - size[1] / 2, c[2] - size[2] / 2], [c[0] + size[0] / 2, c[1] + size[1] / 2, c[2] + size[2] / 2], color, mat, o);

// ---------------- extrude ----------------
// shape: [[u,v],...] in local plane spanned by axes U,V; extruded along W from w0 to w1.
// o.axes: 'xy' (extrude along z), 'zy' (along x), 'xz' (along y)
function extrude(s, shape, w0, w1, color, mat = MAT.paint, o = {}) {
  const f = o.f || ID;
  const ax = o.axes || 'xy';
  const L = (u, v, w) => (ax === 'xy' ? [u, v, w] : ax === 'zy' ? [w, v, u] : [u, w, v]);
  const map = (u, v, w) => tp(f, L(u, v, w));
  const n = shape.length;
  let area = 0; for (let i = 0; i < n; i++) { const a = shape[i], b = shape[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const ccw = area > 0 ? 1 : -1;
  const en = []; // outward edge normals (2D)
  for (let i = 0; i < n; i++) { const a = shape[i], b = shape[(i + 1) % n]; const d = [b[0] - a[0], b[1] - a[1]]; const l = Math.hypot(d[0], d[1]) || 1; en.push([(d[1] / l) * ccw, (-d[0] / l) * ccw]); }
  const toW = (nu, nv) => tv(f, L(nu, nv, 0));
  const crease = Math.cos(((o.crease ?? 35) * Math.PI) / 180);
  const segW = o.segW || 1;
  for (let i = 0; i < n; i++) {
    if (o.openEdges && o.openEdges.includes(i)) continue;
    const a = shape[i], b = shape[(i + 1) % n];
    const ne = en[i];
    let na = ne, nb = ne;
    if (o.smooth) {
      const pa = en[(i - 1 + n) % n], nbN = en[(i + 1) % n];
      if (pa[0] * ne[0] + pa[1] * ne[1] > crease) na = norm([pa[0] + ne[0], pa[1] + ne[1], 0]);
      if (nbN[0] * ne[0] + nbN[1] * ne[1] > crease) nb = norm([nbN[0] + ne[0], nbN[1] + ne[1], 0]);
    }
    const col = o.edgeColor ? o.edgeColor(i) || color : color;
    const mt = o.edgeMat ? o.edgeMat(i) || mat : mat;
    for (let k = 0; k < segW; k++) {
      const wa = w0 + ((w1 - w0) * k) / segW, wb = w0 + ((w1 - w0) * (k + 1)) / segW;
      const pts = [map(a[0], a[1], wa), map(b[0], b[1], wa), map(b[0], b[1], wb), map(a[0], a[1], wb)];
      const normals = o.smooth ? [toW(na[0], na[1]), toW(nb[0], nb[1]), toW(nb[0], nb[1]), toW(na[0], na[1])] : undefined;
      s.poly(pts, col, mt, { ...o, nHint: toW(ne[0], ne[1]), normals });
    }
  }
  if (!o.noCaps) {
    const wn = tv(f, L(0, 0, 1));
    const capCol = o.capColor || color;
    s.poly(shape.map((p) => map(p[0], p[1], w1)), capCol, o.capMat || mat, { ...o, nHint: wn, normals: undefined });
    s.poly(shape.map((p) => map(p[0], p[1], w0)), o.capColor0 || capCol, o.capMat || mat, { ...o, nHint: mul(wn, -1), normals: undefined });
  }
}

// rounded rectangle shape
function rrect(x0, y0, x1, y1, r, n = 4) {
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  if (r <= 0) return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  corner(x1 - r, y0 + r, -Math.PI / 2); corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI);
  return pts;
}
function chamfer(x0, y0, x1, y1, c) { return [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]]; }
// rounded / chamfered box (rounded in the xy profile, extruded along z)
function rbox(s, min, max, r, color, mat, o = {}) {
  const ax = o.axes || 'xy';
  let shape, w0, w1;
  if (ax === 'xy') { shape = rrect(min[0], min[1], max[0], max[1], r, o.rn ?? 3); w0 = min[2]; w1 = max[2]; }
  else if (ax === 'zy') { shape = rrect(min[2], min[1], max[2], max[1], r, o.rn ?? 3); w0 = min[0]; w1 = max[0]; }
  else { shape = rrect(min[0], min[2], max[0], max[2], r, o.rn ?? 3); w0 = min[1]; w1 = max[1]; }
  extrude(s, shape, w0, w1, color, mat, { smooth: true, ...o, axes: ax });
}

// ---------------- revolve ----------------
// profile: [[a, r], ...] closed loop (a along axis, r radius). origin/axis in world (after frame).
function revolve(s, profile, o) {
  const f = o.f || ID;
  const origin = tp(f, o.origin || [0, 0, 0]);
  const axis = norm(tv(f, o.axis || [0, 0, 1]));
  if (f.k && f.k !== 1) profile = profile.map(([a, r]) => [a * f.k, r * f.k]);
  const ref = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm(cross(axis, ref)), e2 = cross(axis, e1);
  const seg = o.seg || 48;
  const t0 = o.arc ? o.arc[0] : 0, t1 = o.arc ? o.arc[1] : Math.PI * 2;
  const closed = o.closed !== false;
  const n = profile.length;
  let area = 0; for (let i = 0; i < n; i++) { const a = profile[i], b = profile[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const ccw = area > 0 ? 1 : -1;
  const P = (a, r, t) => add(origin, add(mul(axis, a), add(mul(e1, r * Math.cos(t)), mul(e2, r * Math.sin(t)))));
  const rad = (t) => add(mul(e1, Math.cos(t)), mul(e2, Math.sin(t)));
  const edges = closed ? n : n - 1;
  for (let i = 0; i < edges; i++) {
    const a = profile[i], b = profile[(i + 1) % n];
    const d = [b[0] - a[0], b[1] - a[1]]; const l = Math.hypot(d[0], d[1]); if (l < 1e-6) continue;
    const ne = [(d[1] / l) * ccw, (-d[0] / l) * ccw]; // (na, nr)
    const col = o.colorFn ? o.colorFn(i) : o.color;
    const mt = o.matFn ? o.matFn(i) : o.mat || MAT.steel;
    if (col === null) continue;
    const isDisc = Math.abs(ne[1]) < 0.02; // flat face perpendicular to axis
    const sg = isDisc ? Math.max(12, Math.round(seg / 2)) : seg;
    for (let j = 0; j < sg; j++) {
      const ta = t0 + ((t1 - t0) * j) / sg, tb = t0 + ((t1 - t0) * (j + 1)) / sg;
      const pts = [P(a[0], a[1], ta), P(b[0], b[1], ta), P(b[0], b[1], tb), P(a[0], a[1], tb)];
      const nn = (t) => norm(add(mul(axis, ne[0]), mul(rad(t), ne[1])));
      const tm = (ta + tb) / 2;
      const clean = []; const nrm = [];
      const nl = [nn(ta), nn(ta), nn(tb), nn(tb)];
      pts.forEach((p, k) => { if (!clean.length || len(sub(clean[clean.length - 1], p)) > 1e-6) { clean.push(p); nrm.push(nl[k]); } });
      if (clean.length > 3 && len(sub(clean[0], clean[clean.length - 1])) < 1e-6) { clean.pop(); nrm.pop(); }
      if (clean.length < 3) continue;
      s.poly(clean, col, mt, { ...o, nHint: nn(tm), normals: isDisc ? undefined : nrm, flat: isDisc ? true : o.flat });
    }
  }
}
// cylinder from p0 to p1 (world, or local within o.f)
function cyl(s, p0, p1, r, color, mat = MAT.steel, o = {}) {
  const f = o.f || ID;
  const a = tp(f, p0), b = tp(f, p1);
  const ax = sub(b, a); const L = len(ax);
  const kk = f.k || 1; r *= kk;
  const r1 = (o.r1 ?? r / kk) * kk;
  if (o.tube) o = { ...o, tube: o.tube * kk };
  const prof = o.tube ? [[0, o.tube], [0, r], [L, r1], [L, o.tube]] : [[0, 0], [0, r], [L, r1], [L, 0]];
  revolve(s, prof.slice().reverse(), { ...o, f: ID, origin: a, axis: ax, color, mat, seg: o.seg || 36, colorFn: o.capColor ? (i) => (i === 1 ? color : o.capColor) : undefined });
}
function sphere(s, c, r, color, mat = MAT.paint, o = {}) {
  const prof = []; const n = o.rings || 10;
  for (let i = 0; i <= n; i++) { const t = Math.PI - (i / n) * Math.PI; prof.push([r * Math.cos(t), r * Math.sin(t)]); }
  revolve(s, prof, { ...o, origin: c, axis: [0, 1, 0], color, mat, seg: o.seg || 20, closed: false });
}

// ---------------- decals / 2D-on-plane ----------------
// plane: {o, u, v} in world; draw(map, scene) returns svg; map(s,t)->[x,y]
function decal(s, plane, draw, o = {}) {
  const f = o.f || ID;
  const O = tp(f, plane.o), U = tv(f, plane.u), Vv = tv(f, plane.v);
  const n = norm(cross(U, Vv));
  const split = o.split || 1;
  for (let k = 0; k < split; k++) {
    const a0 = k / split, a1 = (k + 1) / split;
    const center = add(O, add(mul(U, (a0 + a1) / 2), mul(Vv, 0.5)));
    s.rawAt(center, (sc) => {
      const W3 = (a, b) => add(O, add(mul(U, a), mul(Vv, b)));
      for (const [a, b] of [[a0, 0], [a1, 0], [a1, 1], [a0, 1]]) if (sc.cam.toCam(W3(a, b))[2] < 0.1) return '';
      const map = (a, b) => sc.cam.project(W3(a, b));
      if (split === 1) return draw(map, sc);
      const id = 'dc' + (sc.gid++);
      sc.defs.push(`<clipPath id="${id}"><path d="${quadPath(map, a0 - 0.002, -0.05, a1 + 0.002, 1.05)}"/></clipPath>`);
      return `<g clip-path="url(#${id})">${draw(map, sc)}</g>`;
    }, { layer: o.layer ?? 3, bias: o.bias ?? 0.01, facing: o.two ? null : { n: o.flip ? mul(n, -1) : n }, plane: o.noHost ? null : { c: center, n } });
  }
}
const pathOf = (map, pts, close = true) => 'M' + pts.map(([a, b]) => { const p = map(a, b); return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + (close ? 'Z' : '');
function quadPath(map, a0, b0, a1, b1) { return pathOf(map, [[a0, b0], [a1, b0], [a1, b1], [a0, b1]]); }

// 3D polyline with metric width
function line3(s, pts, o = {}) {
  const mid = pts[Math.floor(pts.length / 2)];
  s.rawAt(mid, (sc) => {
    const cam = sc.cam;
    const cs = pts.map((p) => cam.toCam(p)).filter((c) => c[2] > 0.05);
    if (cs.length < 2) return '';
    const sp = cs.map((c) => cam.projC(c));
    const dpt = cs.reduce((a, c) => a + c[2], 0) / cs.length;
    const w = o.px ?? Math.max(0.4, ((o.width || 0.02) * cam.focal) / dpt);
    return `<path d="M${sp.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L')}" fill="none" stroke="${o.color || '#333'}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round"${o.opacity ? ` stroke-opacity="${o.opacity}"` : ''}${o.filter ? ` filter="url(#${o.filter})"` : ''}/>`;
  }, { layer: o.layer ?? 3, bias: o.bias || 0 });
}

module.exports = { frame, ID, tp, tv, sub2frame, box, boxC, extrude, rrect, chamfer, rbox, revolve, cyl, sphere, decal, pathOf, quadPath, line3 };

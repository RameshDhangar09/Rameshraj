'use strict';
// Minimal 3D -> SVG "illustrated render" engine.
// World units are metres, y is up. Polygons are projected with a pinhole camera,
// shaded (hemisphere + key light + specular + fake environment reflection for
// metals + distance haze) and painted back-to-front into an SVG string.

// ---------- vector helpers ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// ---------- colour helpers (sRGB hex <-> linear) ----------
function hex2lin(h) {
  if (Array.isArray(h)) return h;
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
  return v.map((c) => Math.pow(c, 2.2));
}
function lin2hex(c) {
  return '#' + c.map((v) => {
    const s = Math.round(clamp(Math.pow(clamp(v), 1 / 2.2)) * 255);
    return s.toString(16).padStart(2, '0');
  }).join('');
}
const C = hex2lin;

// ---------- materials ----------
// rough: 0..1 (spec spread), spec: specular strength, metal: 0..1 env reflection mix
const MAT = {
  paint: { spec: 0.18, shin: 40, metal: 0.0 },
  gloss: { spec: 0.35, shin: 80, metal: 0.08 },
  matte: { spec: 0.04, shin: 10, metal: 0 },
  steel: { spec: 0.55, shin: 60, metal: 0.55 },
  chrome: { spec: 0.9, shin: 120, metal: 0.85 },
  dark: { spec: 0.15, shin: 30, metal: 0.1 },
  glass: { spec: 0.9, shin: 150, metal: 0.6 },
  floor: { spec: 0.22, shin: 18, metal: 0.12 },
  emit: { emissive: 1 },
  rubber: { spec: 0.05, shin: 8, metal: 0 },
};

class Camera {
  constructor({ pos, target, fov = 40, W, H, up = [0, 1, 0], shift = [0, 0] }) {
    Object.assign(this, { pos, target, fov, W, H, shift });
    this.f = norm(sub(target, pos));
    this.r = norm(cross(this.f, up));
    this.u = cross(this.r, this.f);
    this.focal = (H / 2) / Math.tan((fov * Math.PI) / 360);
  }
  toCam(p) { const d = sub(p, this.pos); return [dot(d, this.r), dot(d, this.u), dot(d, this.f)]; }
  projC(c) {
    return [this.W / 2 + (c[0] * this.focal) / c[2] + this.shift[0] * this.W,
      this.H / 2 - (c[1] * this.focal) / c[2] + this.shift[1] * this.H];
  }
  project(p) { return this.projC(this.toCam(p)); }
}

const NEAR = 0.05;
function clipNear(cs) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length];
    const ia = a.c[2] >= NEAR, ib = b.c[2] >= NEAR;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (NEAR - a.c[2]) / (b.c[2] - a.c[2]);
      out.push({ c: lerp3(a.c, b.c, t), w: lerp3(a.w, b.w, t), n: a.n && b.n ? norm(lerp3(a.n, b.n, t)) : a.n, col: a.col });
    }
  }
  return out;
}

function newell(pts) {
  let n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm(n);
}

const f1 = (v) => (Math.round(v * 10) / 10).toString();

class Scene {
  constructor(opts) {
    this.W = opts.W; this.H = opts.H;
    this.items = [];
    this.defs = [];
    this.gid = 0;
    this.light = {
      dir: norm(opts.lightDir || [-0.45, 0.8, 0.4]),
      color: C(opts.lightColor || '#fff6ea'),
      key: opts.key ?? 0.85,
      sky: C(opts.sky || '#e9eef5'), ground: C(opts.ground || '#9a9a96'), amb: opts.amb ?? 0.55,
      fill: norm(opts.fillDir || [0.6, 0.3, 0.7]), fillI: opts.fillI ?? 0.15,
      points: opts.points || [],
    };
    this.env = opts.env || { horizon: 0.95, sky: 1.0, ground: 0.25, band: 1.4 };
    this.fog = { color: C(opts.fogColor || '#dfe4ea'), density: opts.fogDensity ?? 0.012, start: opts.fogStart ?? 4 };
    this.layerClips = {};
    this.raw = { pre: [], post: [] };
    this.cam = null;
  }
  setCamera(o) { this.cam = new Camera({ W: this.W, H: this.H, ...o }); return this.cam; }

  // generic polygon; pts: array of [x,y,z]; normals: optional per-vertex normals
  poly(pts, color, mat = MAT.paint, o = {}) {
    if (pts.length < 3) return;
    this.items.push({ pts, normals: o.normals, nHint: o.nHint, color: C(color), mat, layer: o.layer ?? 3,
      two: o.two, opacity: o.opacity ?? 1, bias: o.bias || 0, stroke: o.stroke, noFog: o.noFog, flat: o.flat,
      filter: o.filter, grad: o.grad, noCull: o.noCull });
  }
  // raw svg item positioned in depth by a world point
  rawAt(p, fn, o = {}) { this.items.push({ raw: fn, at: p, layer: o.layer ?? 3, bias: o.bias || 0, facing: o.facing, plane: o.plane }); }

  // ----- shading -----
  shade(base, mat, P, N) {
    const L = this.light, cam = this.cam.pos;
    const Vd = norm(sub(cam, P));
    if (mat.emissive) return base.map((c) => c * mat.emissive);
    const hemiT = 0.5 + 0.5 * N[1];
    const hemi = lerp3(L.ground, L.sky, hemiT);
    const diff = Math.max(0, dot(N, L.dir));
    const fill = Math.max(0, dot(N, L.fill)) * L.fillI;
    let col = [0, 1, 2].map((i) => base[i] * (hemi[i] * L.amb + L.color[i] * diff * L.key + fill));
    for (const pl of L.points) {
      const d = sub(pl.p, P); const dist = len(d); const ld = mul(d, 1 / dist);
      const a = Math.max(0, dot(N, ld)) * pl.i / (1 + (dist * dist) / (pl.r * pl.r));
      const pc = C(pl.c || '#ffffff');
      col = col.map((v, i) => v + base[i] * pc[i] * a);
    }
    const Hh = norm(add(L.dir, Vd));
    const spec = Math.pow(Math.max(0, dot(N, Hh)), mat.shin || 30) * (mat.spec || 0) * (diff > 0 ? 1 : 0.2);
    if (mat.metal) {
      const R = sub(mul(N, 2 * dot(N, Vd)), Vd);
      const e = this.env;
      let env;
      if (R[1] > 0) env = lerp(e.horizon, e.sky, smooth(0, 0.6, R[1])) + e.band * Math.exp(-Math.pow((R[1] - 0.18) / 0.07, 2));
      else env = lerp(e.horizon * 0.6, e.ground, smooth(0, 0.3, -R[1]));
      const ec = [0, 1, 2].map((i) => base[i] * 0.5 + 0.5 * Math.sqrt(base[i]) * 0.6);
      col = col.map((v, i) => lerp(v, ec[i] * env, mat.metal));
    }
    return col.map((v) => v + spec * 0.9);
  }
  fogIt(col, P) {
    const d = len(sub(P, this.cam.pos));
    const f = 1 - Math.exp(-Math.max(0, d - this.fog.start) * this.fog.density);
    return lerp3(col, this.fog.color, f);
  }

  // projected path string of a world polygon (near-clipped)
  pathOf3(pts) {
    let cs = pts.map((p) => ({ c: this.cam.toCam(p), w: p }));
    cs = clipNear(cs); if (cs.length < 3) return '';
    return 'M' + cs.map((v) => { const q = this.cam.projC(v.c); return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + 'Z';
  }
  // shaded colour of a horizontal/any surface point
  shadeHex(color, mat, P, N) { return lin2hex(this.fogIt(this.shade(C(color), mat, P, N), P)); }
  // ----- helper builders available on scene -----
  shadow(pts3, o = {}) {
    // project points along light dir onto plane y=floorY, convex hull -> soft polygon
    const fy = o.floorY ?? 0; const Ld = o.dir ? norm(o.dir) : this.light.dir;
    const pr = pts3.map((p) => { const t = (p[1] - fy) / Ld[1]; return [p[0] - Ld[0] * t, fy + 0.003, p[2] - Ld[2] * t]; });
    const hull = convexHullXZ(pr);
    this.poly(hull, o.color || '#2b3038', MAT.emit, { layer: o.layer ?? 2, opacity: o.opacity ?? 0.28, noFog: true, filter: `blur${o.blur ?? 8}`, two: true, flat: true });
  }
  contact(pts3, o = {}) { this.shadow(pts3.map((p) => [p[0], o.floorY ?? 0, p[2]]), { opacity: 0.4, blur: 4, ...o }); }

  // ----- render -----
  toSVG(extra = {}) {
    const cam = this.cam; const W = this.W, H = this.H;
    const out = [];
    const blurs = new Set();
    // attach decals to the coplanar polygon they sit on, so they sort with their host
    const polys = this.items.filter((it) => !it.raw);
    for (const d of this.items) {
      if (!d.raw || !d.plane) continue;
      let best = null, bestOff = 0.025;
      for (const p of polys) {
        if (p.opacity < 1) continue;
        const n = p._n || (p._n = p.nHint ? norm(p.nHint) : newell(p.pts));
        if (Math.abs(dot(n, d.plane.n)) < 0.995) continue;
        const off = Math.abs(dot(n, sub(d.plane.c, p.pts[0])));
        if (off > bestOff) continue;
        if (!pointInPoly3(d.plane.c, p.pts, n)) continue;
        best = p; bestOff = off;
      }
      d.host = best;
    }
    const ordered = polys.concat(this.items.filter((it) => it.raw));
    for (const it of ordered) {
      if (it.raw) {
        const c = cam.toCam(it.at); if (c[2] < NEAR) continue;
        if (it.facing) { const fn = it.facing; if (dot(fn.n, sub(cam.pos, it.at)) <= 0) continue; }
        if (it.host) {
          if (it.host._depth === undefined) continue; // host culled
          out.push({ layer: it.host.layer, depth: it.host._depth - 0.0005, svg: it.raw(this) });
        } else out.push({ layer: it.layer, depth: c[2] - it.bias, svg: it.raw(this) });
        continue;
      }
      const pts = it.pts;
      let n = it.nHint ? norm(it.nHint) : newell(pts);
      const cen = mul(pts.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / pts.length);
      const toCam = sub(cam.pos, cen);
      let facing = dot(n, toCam) > 0;
      if (!facing) { if (it.two || it.noCull) { n = mul(n, -1); } else continue; }
      let cs = pts.map((p, i) => ({ c: cam.toCam(p), w: p, n: it.normals ? it.normals[i] : null }));
      cs = clipNear(cs);
      if (cs.length < 3) continue;
      const sp = cs.map((v) => cam.projC(v.c));
      // screen bounds cull
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const p of sp) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
      if (maxx < -50 || minx > W + 50 || maxy < -50 || miny > H + 50) continue;
      let area = 0; for (let i = 0; i < sp.length; i++) { const a = sp[i], b = sp[(i + 1) % sp.length]; area += a[0] * b[1] - b[0] * a[1]; }
      area = Math.abs(area / 2);
      const depth = cs.reduce((a, v) => a + v.c[2], 0) / cs.length - it.bias;
      it._depth = depth;
      const shadeAt = (w, nn) => {
        let nv = nn || n; if (dot(nv, sub(cam.pos, w)) < 0 && nn) nv = nn; // keep
        let col = it.mat.emissive ? it.color.map((c) => c * it.mat.emissive) : this.shade(it.color, it.mat, w, nv);
        if (!it.noFog) col = this.fogIt(col, w);
        return col;
      };
      let fill, stroke;
      const useGrad = !it.flat && (area > 900 || it.grad) && cs.length >= 3;
      if (useGrad) {
        const cols = cs.map((v) => shadeAt(v.w, v.n && (facing ? v.n : mul(v.n, -1))));
        // pick the pair of vertices with the largest luminance difference
        const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
        let pA, pB, cA, cB;
        if (cs.length === 4) {
          // edge-midpoint gradient: consistent across strips of quads
          const mid = (i, j) => [(sp[i][0] + sp[j][0]) / 2, (sp[i][1] + sp[j][1]) / 2];
          const avg = (i, j) => lerp3(cols[i], cols[j], 0.5);
          const o1 = [mid(0, 1), mid(2, 3), avg(0, 1), avg(2, 3)], o2 = [mid(1, 2), mid(3, 0), avg(1, 2), avg(3, 0)];
          const d1 = Math.abs(lum(o1[2]) - lum(o1[3])), d2 = Math.abs(lum(o2[2]) - lum(o2[3]));
          [pA, pB, cA, cB] = d1 >= d2 ? o1 : o2;
        } else {
          let lo = 0, hi = 0; cols.forEach((c, i) => { if (lum(c) < lum(cols[lo])) lo = i; if (lum(c) > lum(cols[hi])) hi = i; });
          pA = sp[lo]; pB = sp[hi]; cA = cols[lo]; cB = cols[hi];
        }
        if (Math.abs(lum(cB) - lum(cA)) > 0.003 && Math.hypot(pB[0] - pA[0], pB[1] - pA[1]) > 2) {
          const id = 'g' + (this.gid++);
          this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(pA[0])}" y1="${f1(pA[1])}" x2="${f1(pB[0])}" y2="${f1(pB[1])}"><stop offset="0" stop-color="${lin2hex(cA)}"/><stop offset="1" stop-color="${lin2hex(cB)}"/></linearGradient>`);
          fill = `url(#${id})`;
          stroke = lin2hex(lerp3(cA, cB, 0.5));
        } else { fill = lin2hex(lerp3(cA, cB, 0.5)); stroke = fill; }
      } else {
        const nn = it.normals ? norm(cs.reduce((a, v) => add(a, v.n || n), [0, 0, 0])) : null;
        const col = shadeAt(cen, nn ? (facing ? nn : mul(nn, -1)) : null);
        fill = lin2hex(col); stroke = fill;
      }
      const d = 'M' + sp.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
      let attrs = `d="${d}" fill="${fill}"`;
      if (it.opacity < 1) attrs += ` fill-opacity="${it.opacity}"`;
      else if (it.stroke !== false) attrs += ` stroke="${stroke}" stroke-width="0.45" stroke-linejoin="round"`;
      if (it.filter) { attrs += ` filter="url(#${it.filter})"`; blurs.add(it.filter); }
      out.push({ layer: it.layer, depth, svg: `<path ${attrs}/>` });
    }
    out.sort((a, b) => (a.layer - b.layer) || (b.depth - a.depth));
    let body = ''; let curLayer = null; let open = false;
    for (const o of out) {
      if (o.layer !== curLayer) {
        if (open) { body += '</g>'; open = false; }
        curLayer = o.layer;
        const clip = this.layerClips[curLayer];
        if (clip) { body += `<g clip-path="url(#clipL${curLayer})">`; open = true; }
      }
      body += o.svg;
    }
    if (open) body += '</g>';
    for (const [l, pts] of Object.entries(this.layerClips)) {
      const polys = (Array.isArray(pts[0][0]) ? pts : [pts]).map((pp) => {
        const sp = pp.map((p) => cam.project(p));
        return `<path d="M${sp.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L')}Z"/>`;
      }).join('');
      this.defs.push(`<clipPath id="clipL${l}">${polys}</clipPath>`);
    }
    const pre = this.raw.pre.map((f) => (typeof f === 'function' ? f(this) : f)).join('');
    const post = this.raw.post.map((f) => (typeof f === 'function' ? f(this) : f)).join('');
    for (const m of ((pre + body + post).matchAll(/url\(#(blur[\d.]+)\)/g))) blurs.add(m[1]);
    for (const b of blurs) { const s = b.replace('blur', ''); this.defs.push(`<filter id="${b}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`); }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${this.defs.join('')}${extra.defs || ''}</defs>${pre}${body}${post}</svg>`;
  }
}

function pointInPoly3(c, pts, n) {
  const ax = Math.abs(n[0]) > Math.abs(n[1]) ? (Math.abs(n[0]) > Math.abs(n[2]) ? 0 : 2) : (Math.abs(n[1]) > Math.abs(n[2]) ? 1 : 2);
  const i0 = ax === 0 ? 1 : 0, i1 = ax === 2 ? 1 : 2;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a[i1] > c[i1]) !== (b[i1] > c[i1]) && c[i0] < ((b[i0] - a[i0]) * (c[i1] - a[i1])) / (b[i1] - a[i1]) + a[i0]) inside = !inside;
  }
  return inside;
}
function convexHullXZ(pts) {
  const P = pts.map((p) => p).sort((a, b) => a[0] - b[0] || a[2] - b[2]);
  const crossz = (o, a, b) => (a[0] - o[0]) * (b[2] - o[2]) - (a[2] - o[2]) * (b[0] - o[0]);
  const lower = []; for (const p of P) { while (lower.length >= 2 && crossz(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = []; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (upper.length >= 2 && crossz(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}
function hull2D(pts) {
  const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = []; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}

module.exports = { Scene, Camera, MAT, C, hex2lin, lin2hex, add, sub, mul, dot, cross, len, norm, lerp, lerp3, clamp, smooth, convexHullXZ, hull2D, f1, newell };

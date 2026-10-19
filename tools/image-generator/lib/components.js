'use strict';
const E = require('./engine');
const P = require('./prims');
const { MAT, add, sub, mul, norm, f1 } = E;
const { box, boxC, extrude, rbox, revolve, cyl, sphere, decal, pathOf, quadPath, line3, frame, tp, tv, ID } = P;

const PAL = {
  navy: '#142D4E', navy2: '#1d3c63', orange: '#F58220', char: '#252525', char2: '#33373c',
  white: '#eef0f2', guard: '#e6e9ec', lgrey: '#d4d8dc', mgrey: '#a9afb6', steel: '#9aa1a9', bright: '#c7ccd2',
  floor: '#b3b8be', wall: '#eceef0', yellow: '#e8b923', glass: '#2a3a4c', copper: '#b8733e', green: '#6f8f5a',
};

// Layers
const L = { pitIn: -1, base: 0, surf: 1, shadow: 2, pit: 2.5, obj: 3, fx: 5 };

// ---------------- railway wheelset ----------------
const GAUGE = { BG: { rail: 0.873, b2b: 0.80 }, SG: { rail: 0.7525, b2b: 0.68 }, MG: { rail: 0.535, b2b: 0.465 } };

function wheelProfile(R) {
  return [
    [-0.045, 0.095], [0.175, 0.095], [0.175, 0.165], [0.10, 0.19], [0.085, R - 0.075], [0.135, R - 0.062],
    [0.135, R - 0.008], [0.127, R], [0.035, R + 0.004], [0.018, R + 0.016], [0.010, R + 0.030], [0.002, R + 0.026],
    [0.0, R + 0.012], [0.0, R - 0.062], [0.035, R - 0.075], [0.05, 0.215], [-0.045, 0.17],
  ];
}
// segment indices of the profile that are machined (tread/flange) -> bright
const TREAD_SEGS = new Set([6, 7, 8, 9, 10, 11]);

// wheel at axle centre c, axis dir ax (unit), inner face at signed distance d along axis, side sign
function wheel(s, c, ax, d, side, R, o = {}) {
  const prof = wheelProfile(R).map(([a, r]) => [d + side * a, r]);
  const body = o.body || '#3b4047';
  revolve(s, prof, {
    origin: c, axis: ax, seg: o.seg || 56, layer: o.layer,
    colorFn: (i) => (TREAD_SEGS.has(i) ? (o.tread || '#c9ced4') : i <= 2 || i >= 15 ? (o.hub || '#4a5058') : body),
    matFn: (i) => (TREAD_SEGS.has(i) ? MAT.chrome : MAT.dark),
  });
}

// wheelset: c = axle centre (world), axis along 'z' by default
function wheelset(s, o) {
  const g = GAUGE[o.gauge || 'BG'];
  const R = o.R || 0.5;
  const ax = o.f ? norm(tv(o.f, o.axis || [0, 0, 1])) : (o.axis || [0, 0, 1]);
  const c = o.f ? tp(o.f, o.c) : o.c;
  const half = g.b2b + 0.135 + (o.journal ? 0.32 : 0.22);
  const A = (t) => add(c, mul(ax, t));
  const lay = { layer: o.layer };
  // axle
  cyl(s, A(-g.b2b - 0.17), A(g.b2b + 0.17), 0.095, o.axleColor || '#8d949c', MAT.steel, { seg: 28, ...lay });
  // journals
  cyl(s, A(-half), A(-g.b2b - 0.17), 0.072, '#c3c8ce', MAT.chrome, { seg: 24, ...lay });
  cyl(s, A(g.b2b + 0.17), A(half), 0.072, '#c3c8ce', MAT.chrome, { seg: 24, ...lay });
  wheel(s, c, ax, g.b2b, 1, R, { ...o, layer: o.layer });
  wheel(s, c, ax, -g.b2b, -1, R, { ...o, layer: o.layer });
  if (o.discs) {
    const pos = o.discs === 3 ? [-0.42, 0, 0.42] : [-0.36, 0.36];
    for (const p of pos) {
      revolve(s, [[p - 0.06, 0.12], [p + 0.06, 0.12], [p + 0.06, R * 0.62], [p - 0.06, R * 0.62]].reverse(), { origin: c, axis: ax, seg: 40, color: '#7d848c', mat: MAT.steel, ...lay });
      revolve(s, [[p - 0.09, 0.095], [p + 0.09, 0.095], [p + 0.09, 0.15], [p - 0.09, 0.15]].reverse(), { origin: c, axis: ax, seg: 24, color: '#50565e', mat: MAT.dark, ...lay });
    }
  }
  if (o.boxes) {
    for (const sg of [-1, 1]) {
      cyl(s, A(sg * (g.b2b + 0.2)), A(sg * (g.b2b + 0.48)), 0.15, o.boxColor || '#2f3338', MAT.dark, { seg: 28, ...lay });
      cyl(s, A(sg * (g.b2b + 0.48)), A(sg * (g.b2b + 0.5)), 0.11, '#5b6168', MAT.dark, { seg: 24, ...lay });
    }
  }
  return { R, g };
}

// ---------------- rails ----------------
function railProfile() {
  return [[-0.07, 0], [0.07, 0], [0.07, 0.012], [0.012, 0.03], [0.009, 0.12], [0.035, 0.13], [0.035, 0.17], [-0.035, 0.17], [-0.035, 0.13], [-0.009, 0.12], [-0.012, 0.03], [-0.07, 0.012]];
}
// rail along x between x0..x1, centre z, base at y
function rail(s, x0, x1, z, y = 0, o = {}) {
  const shape = railProfile().map(([u, v]) => [u + z, v + y]);
  extrude(s, shape, x0, x1, o.color || '#7e858c', MAT.steel, {
    axes: 'zy', segW: o.segW || Math.max(1, Math.round((x1 - x0) / 1.5)), layer: o.layer ?? L.obj, f: o.f,
    edgeColor: (i) => (i >= 5 && i <= 7 ? '#c6cbd0' : null), edgeMat: (i) => (i >= 5 && i <= 7 ? MAT.chrome : null),
  });
}
// flush embedded rail: rail head visible in floor
function embeddedRail(s, x0, x1, z, o = {}) {
  const w = 0.072;
  for (let x = x0; x < x1; x += 3) {
    const xb = Math.min(x1, x + 3);
    s.poly([[x, 0.004, z - w / 2 - 0.03], [xb, 0.004, z - w / 2 - 0.03], [xb, 0.004, z + w / 2 + 0.03], [x, 0.004, z + w / 2 + 0.03]], '#6b7078', MAT.floor, { layer: L.surf, nHint: [0, 1, 0], flat: true });
    s.poly([[x, 0.006, z - w / 2], [xb, 0.006, z - w / 2], [xb, 0.006, z + w / 2], [x, 0.006, z + w / 2]], '#d2d6da', MAT.chrome, { layer: L.surf, nHint: [0, 1, 0], bias: 0.02 });
  }
}
// track with sleepers on ballast (outdoor)
function track(s, x0, x1, zc, o = {}) {
  const g = GAUGE[o.gauge || 'BG'];
  const by = o.y ?? 0;
  // ballast bed
  extrude(s, [[zc - 2.2, by - 0.02], [zc + 2.2, by - 0.02], [zc + 1.7, by + 0.22], [zc - 1.7, by + 0.22]], x0, x1, o.ballast || '#8c8a86', MAT.matte, { axes: 'zy', segW: Math.round((x1 - x0) / 3), layer: L.surf, noCaps: true });
  for (let x = x0 + 0.3; x < x1; x += 0.65) boxC(s, [x, by + 0.27, zc], [0.26, 0.1, 2.75], o.sleeper || '#a7a39d', MAT.matte, { layer: L.surf, skip: ['bottom'] });
  for (const sg of [-1, 1]) rail(s, x0, x1, zc + sg * g.rail, by + 0.32, { layer: L.surf, segW: Math.round((x1 - x0) / 2) });
}

// ---------------- building ----------------
// floor with rectangular holes (pits). holes: [[xa,xb,za,zb],...]
function floorWithHoles(s, x0, x1, z0, z1, holes = [], color = PAL.floor, y = 0, o = {}) {
  // single even-odd path: outer rectangle minus pits; screen-space gradient sampled along view depth
  s.rawAt([(x0 + x1) / 2, y, (z0 + z1) / 2], (sc) => {
    const outer = sc.pathOf3([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
    const hs = holes.map((h) => sc.pathOf3([[h[0], y, h[2]], [h[1], y, h[2]], [h[1], y, h[3]], [h[0], y, h[3]]])).join('');
    // sample the floor colour at points along camera forward projected to the floor
    const cam = sc.cam; const stops = [];
    const N = 7;
    for (let i = 0; i < N; i++) {
      const sy = sc.H * (0.0 + (i / (N - 1)) * 1.0);
      // ray through screen centre column at sy
      const cy = -(sy - sc.H / 2 - cam.shift[1] * sc.H) / cam.focal;
      const dir = norm(add(cam.f, add(mul(cam.u, cy), mul(cam.r, 0))));
      if (dir[1] >= -0.002 && cam.pos[1] > y) { stops.push([i / (N - 1), sc.shadeHex(color, MAT.floor, add(cam.pos, mul(dir, 400)), [0, 1, 0])]); continue; }
      const t = (y - cam.pos[1]) / dir[1];
      const P = add(cam.pos, mul(dir, Math.min(t, 400)));
      P[0] = Math.max(x0, Math.min(x1, P[0])); P[2] = Math.max(z0, Math.min(z1, P[2]));
      stops.push([i / (N - 1), sc.shadeHex(color, MAT.floor, P, [0, 1, 0])]);
    }
    const id = 'fl' + (sc.gid++);
    sc.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${sc.H}">${stops.map(([of, c]) => `<stop offset="${of.toFixed(3)}" stop-color="${c}"/>`).join('')}</linearGradient>`);
    return `<path d="${outer}${hs}" fill="url(#${id})" fill-rule="evenodd"/>`;
  }, { layer: L.base, bias: -1000 });
}

// pit: rectangular hole [xa,xb,za,zb] depth d. Adds interior faces and returns clip polygon for contents
function pit(s, h, d, o = {}) {
  const [xa, xb, za, zb] = h;
  const wc = o.wall || '#b7bcc1', fc = o.floor || '#9ea4aa';
  const lay = { layer: L.pitIn, grad: true };
  s.poly([[xa, -d, za], [xb, -d, za], [xb, -d, zb], [xa, -d, zb]], fc, MAT.floor, { ...lay, nHint: [0, 1, 0] });
  s.poly([[xa, -d, za], [xb, -d, za], [xb, 0, za], [xa, 0, za]], wc, MAT.paint, { ...lay, nHint: [0, 0, 1] });
  s.poly([[xa, -d, zb], [xb, -d, zb], [xb, 0, zb], [xa, 0, zb]], wc, MAT.paint, { ...lay, nHint: [0, 0, -1] });
  s.poly([[xa, -d, za], [xa, -d, zb], [xa, 0, zb], [xa, 0, za]], wc, MAT.paint, { ...lay, nHint: [1, 0, 0] });
  s.poly([[xb, -d, za], [xb, -d, zb], [xb, 0, zb], [xb, 0, za]], wc, MAT.paint, { ...lay, nHint: [-1, 0, 0] });
  // steel edge angle around the rim
  if (o.rim !== false) {
    const t = 0.06;
    s.poly([[xa - t, 0.002, za - t], [xb + t, 0.002, za - t], [xb + t, 0.002, za], [xa - t, 0.002, za]], '#8f969d', MAT.steel, { layer: L.surf, nHint: [0, 1, 0] });
    s.poly([[xa - t, 0.002, zb], [xb + t, 0.002, zb], [xb + t, 0.002, zb + t], [xa - t, 0.002, zb + t]], '#8f969d', MAT.steel, { layer: L.surf, nHint: [0, 1, 0] });
    s.poly([[xa - t, 0.002, za], [xa, 0.002, za], [xa, 0.002, zb], [xa - t, 0.002, zb]], '#8f969d', MAT.steel, { layer: L.surf, nHint: [0, 1, 0] });
    s.poly([[xb, 0.002, za], [xb + t, 0.002, za], [xb + t, 0.002, zb], [xb, 0.002, zb]], '#8f969d', MAT.steel, { layer: L.surf, nHint: [0, 1, 0] });
  }
  if (o.hatch !== false) hatchBorder(s, xa - (o.hb || 0.5), xb + (o.hb || 0.5), za - (o.hb || 0.5), zb + (o.hb || 0.5), 0.18);
  // depth shading: dark gradient inside pit
  return { clip: pitClip(h, o.lift ?? 6), floorY: -d };
}
function pitClip(h, lift) {
  const [xa, xb, za, zb] = h;
  return [[xa, 0, za], [xb, 0, za], [xb, 0, zb], [xa, 0, zb], [xa, lift, zb], [xa, lift, za], [xb, lift, za], [xb, lift, zb]];
}
// sets a clip for the pit-content layer: convex hull of projected points (call after camera set)
function setPitClip(s, clips) {
  s.layerClips[L.pit] = clips.map((c) => hullProjected(s, c));
}
function hullProjected(s, pts) {
  // returns world points whose projection forms the convex hull (approximate by projecting & mapping back)
  const sp = pts.map((p) => ({ p, s: s.cam.project(p) }));
  const h = E.hull2D(sp.map((q) => [q.s[0], q.s[1], q.p]));
  return h.map((q) => q[2]);
}

// yellow/black hatch frame around a rectangle on the floor
function hatchBorder(s, xa, xb, za, zb, w = 0.15, o = {}) {
  const strips = [[xa, xb, za, za + w], [xa, xb, zb - w, zb], [xa, xa + w, za + w, zb - w], [xb - w, xb, za + w, zb - w]];
  for (const [x0, x1, z0, z1] of strips) {
    decal(s, { o: [x0, 0.003, z1], u: [x1 - x0, 0, 0], v: [0, 0, z0 - z1] }, (map) => {
      const Lx = x1 - x0, Lz = z1 - z0;
      let p = `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="#1f2226"/>`;
      const along = Lx > Lz; const Ltot = along ? Lx : Lz; const n = Math.ceil(Ltot / 0.18);
      let d = '';
      for (let i = 0; i < n; i++) {
        const a = i / n, b = (i + 0.5) / n, k = (0.12 / Ltot);
        if (along) d += pathOf(map, [[a, 0], [b, 0], [Math.min(1, b + k), 1], [Math.min(1, a + k), 1]]);
        else d += pathOf(map, [[0, a], [0, b], [1, Math.min(1, b + k)], [1, Math.min(1, a + k)]]);
      }
      return p + `<path d="${d}" fill="${PAL.yellow}" fill-opacity="0.9"/>`;
    }, { layer: L.surf, bias: 0.05, two: true });
  }
}
// yellow line on floor along x or z
function floorLine(s, a, b, w = 0.1, color = PAL.yellow, o = {}) {
  const d = norm(sub(b, a)); const n = [-d[2], 0, d[0]];
  const p0 = add(a, mul(n, -w / 2)), p1 = add(b, mul(n, -w / 2)), p2 = add(b, mul(n, w / 2)), p3 = add(a, mul(n, w / 2));
  const seg = Math.max(1, Math.round(E.len(sub(b, a)) / 4));
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg;
    s.poly([E.lerp3(p0, p1, t0), E.lerp3(p0, p1, t1), E.lerp3(p3, p2, t1), E.lerp3(p3, p2, t0)].map((p) => [p[0], 0.003, p[2]]), color, MAT.paint, { layer: L.surf, nHint: [0, 1, 0], opacity: o.opacity ?? 0.9, flat: true });
  }
}

// workshop hall
function hall(s, o) {
  const { x0, x1, z0, z1, h } = o;
  const wall = o.wallColor || PAL.wall;
  floorWithHoles(s, x0, x1, z0, z1, o.holes || [], o.floorColor || PAL.floor);
  const walls = o.walls || ['back', 'left', 'right'];
  const dado = o.dado ?? 1.4;
  const wy = o.winY || [h * 0.52, h * 0.86];
  const wallFace = (pts, n, key) => {
    // split vertically for dado band
    s.poly(pts, wall, MAT.matte, { layer: L.base, nHint: n, grad: true });
  };
  const bands = (axis, fixed, a0, a1, n) => {
    const mk = (y0, y1, col, mat) => {
      for (let a = a0; a < a1; a += 1e6) {
        const b = a1;
        const pts = axis === 'x' ? [[a, y0, fixed], [b, y0, fixed], [b, y1, fixed], [a, y1, fixed]] : [[fixed, y0, a], [fixed, y0, b], [fixed, y1, b], [fixed, y1, a]];
        s.poly(pts, col, mat, { layer: L.base, nHint: n, grad: true });
      }
    };
    mk(0, dado, o.dadoColor || '#c3c8ce', MAT.paint);
    mk(dado, h, wall, MAT.matte);
    // window band
    if (o.windows !== false) {
      for (let a = a0 + 1; a < a1 - 1; a += o.winPitch || 6) {
        const b = Math.min(a1 - 0.5, a + (o.winW || 4.6));
        const pl = axis === 'x' ? { o: [a, wy[0], fixed], u: [b - a, 0, 0], v: [0, wy[1] - wy[0], 0] } : { o: [fixed, wy[0], a], u: [0, 0, b - a], v: [0, wy[1] - wy[0], 0] };
        const off = mul(n, 0.02); pl.o = add(pl.o, off);
        decal(s, pl, (map) => {
          let svg = `<path d="${quadPath(map, -0.02, -0.03, 1.02, 1.03)}" fill="#9aa3ad"/>`;
          svg += `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="${o.winColor || '#f7fbff'}"/>`;
          const cols = 5, rows = 3; let m = '';
          for (let i = 1; i < cols; i++) m += pathOf(map, [[i / cols - 0.006, 0], [i / cols + 0.006, 0], [i / cols + 0.006, 1], [i / cols - 0.006, 1]]);
          for (let j = 1; j < rows; j++) m += pathOf(map, [[0, j / rows - 0.012], [1, j / rows - 0.012], [1, j / rows + 0.012], [0, j / rows + 0.012]]);
          return svg + `<path d="${m}" fill="#8e98a3"/>`;
        }, { layer: L.surf, two: true });
      }
    }
  };
  if (walls.includes('back')) bands('x', z0, x0, x1, [0, 0, 1]);
  if (walls.includes('left')) bands('z', x0, z0, z1, [1, 0, 0]);
  if (walls.includes('right')) bands('z', x1, z0, z1, [-1, 0, 0]);
  // ceiling
  if (o.ceiling !== false) {
    { const x = x0, z = z0, xb = x1, zb = z1;
      s.poly([[x, h + 1.2, z], [xb, h + 1.2, z], [xb, h + 1.2, zb], [x, h + 1.2, zb]], o.ceilColor || '#d8dce0', MAT.matte, { layer: L.base, nHint: [0, -1, 0], grad: true });
    }
    // skylight strips
    if (o.skylights !== false) for (let x = x0 + 3; x < x1 - 2; x += 6) {
      for (let z = z0 + 1; z < z1 - 1.5; z += 3) decal(s, { o: [x - 0.9, h + 1.18, z], u: [1.8, 0, 0], v: [0, 0, 2.6] }, (map) => `<path d="${quadPath(map, 0, 0, 1, 1)}" fill="#ffffff"/>`, { layer: L.surf, two: true });
    }
    // roof trusses
    for (let x = x0 + 6; x < x1; x += 6) {
      boxC(s, [x, h + 1.0, (z0 + z1) / 2], [0.25, 0.35, z1 - z0], o.trussColor || '#c4c9cf', MAT.paint, { seg: [1, 1, Math.round((z1 - z0) / 3)], layer: L.obj, skip: ['top'] });
    }
  }
  // columns
  if (o.columns !== false) {
    const colC = o.colColor || PAL.navy;
    const colAt = (x, z) => {
      boxC(s, [x, h / 2, z], [0.42, h, 0.06], colC, MAT.paint, { seg: [1, 3, 1], layer: L.obj });
      boxC(s, [x, h / 2, z], [0.06, h, 0.5], colC, MAT.paint, { seg: [1, 3, 1], layer: L.obj });
      boxC(s, [x, h - 2.0, z + (z < (z0 + z1) / 2 ? 0.45 : -0.45)], [0.35, 0.3, 0.9], colC, MAT.paint, { layer: L.obj });
    };
    if (walls.includes('back') || o.colsBack) for (let x = x0 + (o.colOff ?? 6); x < x1; x += 6) colAt(x, z0 + 0.3);
    if (o.colsFront) for (let x = x0 + (o.colOff ?? 6); x < x1; x += 6) colAt(x, z1 - 0.3);
  }
  // crane runway & bridge
  if (o.crane !== false) {
    const ry = h - 1.6;
    const runZ = [z0 + 0.75, z1 - 0.75];
    for (const z of runZ) boxC(s, [(x0 + x1) / 2, ry, z], [x1 - x0, 0.8, 0.35], o.runwayColor || '#2b3a4f', MAT.paint, { seg: [Math.round((x1 - x0) / 3), 1, 1], layer: L.obj });
    const cx = o.craneX ?? (x0 + x1) / 2 + 4;
    for (const dz of [-0.9, 0.9]) boxC(s, [cx + dz, ry + 0.85, (z0 + z1) / 2], [0.55, 0.9, z1 - z0 - 1.0], o.craneColor || '#e1a72a', MAT.paint, { seg: [1, 1, Math.round((z1 - z0) / 2.5)], layer: L.obj });
    for (const z of runZ) boxC(s, [cx, ry + 0.6, z], [3.0, 0.6, 0.6], '#2a2d31', MAT.dark, { layer: L.obj });
    const tz = o.trolleyZ ?? (z0 + z1) / 2;
    boxC(s, [cx, ry + 1.45, tz], [2.4, 0.7, 1.8], '#3a3f45', MAT.dark, { layer: L.obj });
    const hookY = o.hookY ?? ry - 2.5;
    line3(s, [[cx - 0.08, ry + 1.1, tz], [cx - 0.08, hookY + 0.4, tz]], { color: '#5a5f66', width: 0.03 });
    line3(s, [[cx + 0.08, ry + 1.1, tz], [cx + 0.08, hookY + 0.4, tz]], { color: '#5a5f66', width: 0.03 });
    boxC(s, [cx, hookY + 0.2, tz], [0.4, 0.5, 0.25], PAL.yellow, MAT.paint, { layer: L.obj });
    boxC(s, [cx, hookY + 0.2, tz + 0.13], [0.41, 0.12, 0.01], '#222', MAT.paint, { layer: L.obj });
  }
}

// light shafts from window rectangles: quad in world, dir points from window to floor
function shafts(s, quads, dir, o = {}) {
  const d = norm(dir);
  for (const q of quads) {
    const floorPts = q.map((p) => { const t = (p[1] - (o.floorY || 0)) / -d[1]; return add(p, mul(d, t)); });
    const all = q.concat(floorPts);
    s.rawAt(E.lerp3(q[0], floorPts[2], 0.5), (sc) => {
      const sp = all.map((p) => sc.cam.project(p));
      const hh = E.hull2D(sp);
      const top = sc.cam.project(E.lerp3(q[0], q[2], 0.5)), bot = sc.cam.project(E.lerp3(floorPts[0], floorPts[2], 0.5));
      const id = 'sh' + (sc.gid++);
      sc.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(top[0])}" y1="${f1(top[1])}" x2="${f1(bot[0])}" y2="${f1(bot[1])}"><stop offset="0" stop-color="#fffaf0" stop-opacity="${o.op ?? 0.32}"/><stop offset="0.75" stop-color="#fffaf0" stop-opacity="${(o.op ?? 0.32) * 0.35}"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/></linearGradient>`);
      return `<path d="M${hh.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L')}Z" fill="url(#${id})" filter="url(#blur${o.blur ?? 10})"/>`;
    }, { layer: L.fx });
    // light patch on floor
    if (o.patch !== false) s.poly(floorPts.map((p) => [p[0], (o.floorY || 0) + 0.004, p[2]]), '#fff7e8', MAT.emit, { layer: L.surf, opacity: o.patchOp ?? 0.35, filter: 'blur6', noFog: true, two: true, flat: true, bias: -1 });
  }
}

// ---------------- 2D post effects ----------------
function vignette(s, strength = 0.35, color = '#0b1626') {
  s.raw.post.push((sc) => `<defs><radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity="${strength}"/></radialGradient></defs><rect width="${sc.W}" height="${sc.H}" fill="url(#vig)"/>`);
}
function bgGradient(s, stops, dir = 'v') {
  s.raw.pre.push((sc) => {
    const id = 'bg' + sc.gid++;
    const g = dir === 'v' ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
    return `<defs><linearGradient id="${id}" ${g}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${sc.W}" height="${sc.H}" fill="url(#${id})"/>`;
  });
}
function overlayGradient(s, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0) {
  s.raw.post.push((sc) => {
    const id = 'ov' + sc.gid++;
    return `<defs><linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient></defs><rect width="${sc.W}" height="${sc.H}" fill="url(#${id})"/>`;
  });
}
function glow(s, x, y, r, color = '#ffffff', op = 0.5) {
  s.raw.post.push((sc) => { const id = 'gl' + sc.gid++; return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${x * sc.W}" cy="${y * sc.H}" r="${r * sc.W}" fill="url(#${id})"/>`; });
}

module.exports = { PAL, L, GAUGE, wheel, wheelset, wheelProfile, rail, embeddedRail, track, floorWithHoles, pit, pitClip, setPitClip, hatchBorder, floorLine, hall, shafts, vignette, bgGradient, overlayGradient, glow };

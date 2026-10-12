'use strict';
const C = require('./common');
const { E, P, K, M, MAT, PAL, L } = C;
const M2 = require('../lib/machines2');
const F = (x, z, yaw = -90) => P.frame([x, 0, z], yaw);

const scenes = {};
const add = (name, build) => { scenes[name] = { folder: 'products', build }; };

add('surface-wheel-lathe', () => {
  const s = C.shop({ cam: { pos: [6.8, 3.0, 8.4], target: [-0.3, 1.3, 0], fov: 40 }, hall: { craneX: -10 } });
  M2.surfaceWheelLathe(s, F(0, 0));
  M.controlConsole(s, P.frame([4.4, 0, 1.6], 30));
  K.floorLine(s, [-30, 0, 4.6], [30, 0, 4.6]);
  K.wheelset(s, { c: [-6, 0.5, 4.2], R: 0.5, axis: [0, 0, 1] });
  return C.finish(s);
});

add('portal-wheel-lathe', () => {
  const s = C.shop({ cam: { pos: [-6.5, 2.6, 8.6], target: [0.2, 1.8, 0], fov: 42 }, hall: { craneX: 6 } });
  M2.portalWheelLathe(s, F(0, 0), { boxes: false });
  M.cabinets(s, P.frame([3.8, 0, -1.2], 0), 3);
  K.floorLine(s, [-30, 0, 5.0], [30, 0, 5.0]);
  return C.finish(s);
});

add('roller-type-portal-wheel-lathe', () => {
  const s = C.shop({ cam: { pos: [7.4, 3.6, 7.6], target: [0, 1.5, 0], fov: 40 }, hall: { craneX: -8 }, shaftX: [-12, -4, 4] });
  M2.portalWheelLathe(s, F(0, 0), { roller: true });
  M.controlConsole(s, P.frame([-3.8, 0, 2.2], -25));
  for (const sg of [-1, 1]) K.embeddedRail(s, -30, -3, sg * 0.873);
  return C.finish(s);
});

add('vertical-turning-boring-machine', () => {
  const s = C.shop({ cam: { pos: [3.1, 3.1, 3.7], target: [-0.1, 1.35, -0.5], fov: 48 }, hall: { craneX: 10 } });
  M2.vtl(s, P.frame([0, 0, 0], 0), { workR: 0.55 });
  M.controlConsole(s, P.frame([3.3, 0, 1.8], 35));
  K.hatchBorder(s, -2.9, 2.9, -3.2, 2.3, 0.14);
  return C.finish(s);
});

add('axle-journal-turning-burnishing-lathe', () => {
  const s = C.shop({ cam: { pos: [-1.2, 1.8, 1.05], target: [-1.95, 1.1, 0.1], fov: 46 }, hall: { craneX: -8 }, fog: 0.012 });
  M2.axleLathe(s, F(0, 0), { burnish: true, carriageZ: 2.03, rj: 0.075 });
  return C.finish(s);
});

add('axle-turning-lathe', () => {
  const s = C.shop({ cam: { pos: [-5.8, 3.4, 6.8], target: [0.3, 1.1, 0], fov: 40 }, hall: { craneX: 8 } });
  M2.axleLathe(s, F(0, 0), { carriageZ: 0.2 });
  // axles waiting on a rack
  for (let i = 0; i < 3; i++) P.cyl(s, [4.5 - 1.1, 0.35, 2.4 + i * 0.35], [4.5 + 1.1, 0.35, 2.4 + i * 0.35], 0.1, '#9aa1a9', MAT.chrome, { seg: 24 });
  P.boxC(s, [4.5, 0.12, 2.75], [2.6, 0.24, 1.3], PAL.navy, MAT.paint);
  return C.finish(s);
});

add('wheel-press', () => {
  const s = C.shop({ cam: { pos: [6.5, 3.2, 7.4], target: [-0.6, 1.1, 0], fov: 42 }, hall: { craneX: -12 } });
  M2.wheelPress(s, F(0, 0));
  return C.finish(s);
});

add('wheel-measuring-station', () => {
  const s = C.shop({ cam: { pos: [4.6, 2.5, 5.2], target: [-0.2, 1.05, 0], fov: 42 }, hall: { craneX: 8 } });
  M2.measuringStation(s, F(0, 0));
  for (const sg of [-1, 1]) K.embeddedRail(s, 2.1, 30, sg * 0.873);
  return C.finish(s);
});

add('dynamic-wheel-balancing-machine', () => {
  const s = C.shop({ cam: { pos: [-5.0, 2.6, 5.6], target: [0.2, 1.0, 0], fov: 42 }, hall: { craneX: 6 } });
  M2.balancingMachine(s, F(0, 0));
  return C.finish(s);
});

add('multi-purpose-armature-machine', () => {
  const s = C.shop({ cam: { pos: [3.8, 2.3, 4.3], target: [-0.2, 1.15, 0], fov: 40 }, hall: { craneX: 8 } });
  M2.armatureMachine(s, F(0, 0));
  // traction motor stator on a stand nearby
  P.cyl(s, [4.0, 0.9, -1.5], [4.0, 0.9, -0.3], 0.55, '#3a3f45', MAT.dark, { seg: 36, tube: 0.38 });
  P.boxC(s, [4.0, 0.2, -0.9], [1.1, 0.4, 1.4], PAL.navy, MAT.paint);
  return C.finish(s);
});

module.exports = scenes;

// ---------- underfloor lathes ----------
function ufl(o) {
  const s = C.shop({ cam: o.cam, hall: { holes: [o.pit], craneX: o.craneX ?? -12, ...(o.hall || {}) }, shaftX: o.shaftX, fog: o.fog });
  const pt = K.pit(s, o.pit, o.depth || 1.7, { wall: '#8a9097', floor: '#6f757c' });
  K.setPitClip(s, [pt.clip]);
  const gauge = o.gauge || 'BG';
  const g = K.GAUGE[gauge];
  for (const sg of [-1, 1]) { K.embeddedRail(s, -30, o.pit[0], sg * g.rail); K.embeddedRail(s, o.pit[1], 30, sg * g.rail); }
  const xs = o.machines;
  M.pitRails(s, o.pit[0], o.pit[1], 0, gauge, { gap: [Math.min(...xs) - 1.25, Math.max(...xs) + 1.25], depth: o.depth || 1.7 });
  for (const x of xs) M.underfloorLathe(s, { x, R: o.R, depth: o.depth || 1.7, gauge, probe: o.probe });
  M.controlConsole(s, P.frame(o.console || [xs[0] + 2.6, 0, 3.2], o.consoleYaw ?? 25), { variant: 0 });
  K.floorLine(s, [-30, 0, 4.4], [30, 0, 4.4]);
  K.floorLine(s, [-30, 0, -4.4], [30, 0, -4.4]);
  return s;
}

add('underfloor-wheel-lathe-yul-08', () => {
  const s = ufl({ pit: [-5, 5, -2.2, 2.2], machines: [0], R: 0.545, cam: { pos: [4.2, 1.9, 5.0], target: [-0.4, 0.35, 0], fov: 46 }, console: [3.2, 0, -3.0], consoleYaw: 10 });
  M.loco(s, { x0: -18.3, x1: 1.7 });
  return C.finish(s);
});

add('underfloor-wheel-lathe-yugl', () => {
  const s = ufl({ pit: [-4.5, 5.5, -2.3, 2.3], machines: [0], R: 0.46, probe: true, cam: { pos: [-3.8, 2.5, 4.8], target: [0.3, 0.1, 0.2], fov: 46 }, craneX: 6, console: [-3.6, 0, -3.2], consoleYaw: -15 });
  M.bogie(s, { x: 1.3, R: 0.46, wb: 2.6 });
  M.coach(s, { x0: -1.2, x1: 24, yb: 1.3, doors: [1.1] });
  return C.finish(s);
});

add('tandem-underfloor-wheel-lathe-yul-12t', () => {
  const s = ufl({ pit: [-6, 6, -2.3, 2.3], machines: [-1.3, 1.3], R: 0.46, cam: { pos: [7.2, 3.6, 6.6], target: [-0.3, 0.2, 0], fov: 44 }, console: [4.2, 0, 3.4], consoleYaw: 35 });
  M.bogie(s, { x: 0, R: 0.46, wb: 2.6 });
  M.coach(s, { x0: -22, x1: 2.5, yb: 1.3, doors: [1.0], gangway: [2.6] });
  return C.finish(s);
});

add('tandem-underfloor-wheel-lathe-yuglx', () => {
  const s = ufl({ pit: [-6.5, 7, -2.1, 2.1], machines: [-1.1, 1.1], gauge: 'SG', R: 0.42, cam: { pos: [-8.6, 2.1, 3.4], target: [0, 0.4, 0], fov: 42 }, craneX: 4, console: [-4.6, 0, 3.0], consoleYaw: -30, shaftX: [-4, 4, 12] });
  M.metroCar(s, { x0: -3.6, x1: 18, yb: 1.05, cab: true, bogies: [0, 15], equip: [[3, 6.5], [8, 12]] });
  return C.finish(s);
});

// ---------- train washing plant ----------
add('automated-train-washing-plant', () => {
  const s = C.outdoor({ cam: { pos: [-11.5, 3.0, 8.4], target: [0.8, 1.9, 0], fov: 42 }, groundColor: '#9fa4a8', lightDir: [-0.3, 0.8, 0.5] });
  // concrete wash apron + rails
  for (const sg of [-1, 1]) K.embeddedRail(s, -60, 60, sg * 0.7525);
  K.floorLine(s, [-60, 0, 3.4], [60, 0, 3.4], 0.12);
  K.floorLine(s, [-60, 0, -3.4], [60, 0, -3.4], 0.12);
  // canopy structure
  for (const x of [-6, 0, 6, 12]) P.boxC(s, [x, 3.6, -4.2], [0.3, 7.2, 0.3], '#d5d9dd', MAT.paint);
  for (const x of [-6, 0, 6, 12]) P.boxC(s, [x, 7.3, 0], [0.4, 0.4, 8.8], '#d5d9dd', MAT.paint, { seg: [1, 1, 3] });
  P.box(s, [-7, 7.5, -4.6], [13, 7.7, 4.6], '#eef0f2', MAT.paint, { seg: [6, 1, 2] });
  // train
  M.metroCar(s, { x0: -3.2, x1: 18, yb: 1.05, cab: true, bogies: [0.2, 15], equip: [[3, 6.5], [8, 12]], panto: false });
  // brush gantries
  const gantry = (x, brushes) => {
    for (const sg of [-1, 1]) P.boxC(s, [x, 2.4, sg * 2.9], [0.3, 4.8, 0.3], PAL.navy, MAT.paint);
    P.boxC(s, [x, 4.9, 0], [0.35, 0.35, 6.2], PAL.navy, MAT.paint, { seg: [1, 1, 3] });
    P.boxC(s, [x, 4.75, 2.9], [0.4, 0.1, 0.4], PAL.orange, MAT.paint);
    if (brushes) for (const sg of [-1, 1]) {
      const z = sg * (1.45 + 0.42);
      P.cyl(s, [x + 0.6, 4.6, z], [x + 0.6, 4.75, z], 0.12, '#5b6168', MAT.steel, { seg: 12 });
      for (let i = 0; i < 16; i++) {
        const y0 = 0.35 + i * 0.25;
        P.cyl(s, [x + 0.6, y0, z], [x + 0.6, y0 + 0.23, z], 0.46, i % 2 ? '#2f6aa3' : '#3f7fbd', MAT.matte, { seg: 26 });
      }
      P.cyl(s, [x + 0.6, 0.35, z], [x + 0.6, 4.6, z], 0.06, '#9aa1a9', MAT.steel, { seg: 10 });
    }
    // spray bars with water fans
    for (const sg of [-1, 1]) {
      const z = sg * 2.6;
      P.cyl(s, [x - 0.5, 0.4, z], [x - 0.5, 4.3, z], 0.04, '#c3c8ce', MAT.chrome, { seg: 10 });
      for (let k = 0; k < 7; k++) {
        const y = 0.6 + k * 0.58;
        s.rawAt([x - 0.5, y, z - sg * 0.5], (sc) => {
          const a = sc.cam.project([x - 0.5, y, z]);
          const b = sc.cam.project([x - 0.5, y + 0.28, z - sg * 1.0]);
          const c = sc.cam.project([x - 0.5, y - 0.28, z - sg * 1.0]);
          return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}Z" fill="#ffffff" fill-opacity="0.22" filter="url(#blur7)"/>`;
        }, { layer: L.fx });
      }
    }
  };
  gantry(-1.2, true); gantry(4.0, true); gantry(9.0, false);
  // mist & droplets
  s.raw.post.push((sc) => {
    let d = ''; let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 260; i++) {
      const p = sc.cam.project([-2.5 + rnd() * 9, 0.3 + rnd() * 4.3, 1.5 + rnd() * 1.3]);
      d += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(0.8 + rnd() * 1.8).toFixed(1)}"/>`;
    }
    return `<g fill="#ffffff" fill-opacity="0.55">${d}</g>`;
  });
  // wet ground sheen
  K.overlayGradient(s, [[0, '#ffffff', 0], [0.7, '#ffffff', 0], [1, '#6c8199', 0.18]], 0, 0, 0, 1);
  return C.finish(s, { grade: false });
});

// ---------- rail-cum-road vehicle shunter ----------
function shunter(s, f) {
  const B = (min, max, col, mat = MAT.paint, o = {}) => P.box(s, min, max, col, mat, { ...o, f });
  // chassis
  B([-2.6, 0.55, -1.1], [2.6, 0.95, 1.1], '#26292d', MAT.dark);
  // engine hood (front, +x)
  P.extrude(s, P.chamfer(0.6, 0.95, 2.7, 2.15, 0.18), -1.05, 1.05, '#e9ecef', MAT.gloss, { f });
  // cab
  P.extrude(s, P.chamfer(-2.6, 0.95, 0.6, 3.25, 0.12), -1.2, 1.2, PAL.navy, MAT.gloss, { f });
  // cab windows
  for (const sg of [-1, 1]) {
    P.decal(s, sg > 0 ? { o: [-2.3, 2.0, 1.201], u: [2.6, 0, 0], v: [0, 1.05, 0] } : { o: [0.3, 2.0, -1.201], u: [-2.6, 0, 0], v: [0, 1.05, 0] }, require('../lib/machines').glassPanel('#1f2b3a'), { f });
    P.decal(s, sg > 0 ? { o: [-2.6, 1.1, 1.202], u: [5.3, 0, 0], v: [0, 0.07, 0] } : { o: [2.7, 1.1, -1.202], u: [-5.3, 0, 0], v: [0, 0.07, 0] }, M.stripe(), { f });
  }
  P.decal(s, { o: [0.601, 2.15, 1.0], u: [0, 0, -2.0], v: [0, 0.95, 0] }, M.glassPanel('#1f2b3a'), { f });
  // roof beacons
  for (const z of [-0.8, 0.8]) P.cyl(s, [-1.0, 3.25, z], [-1.0, 3.42, z], 0.09, PAL.orange, MAT.gloss, { f, seg: 14 });
  // tyres on rail heads + steel guide wheels
  for (const x of [-1.6, 1.7]) for (const sg of [-1, 1]) {
    const z = sg * 0.873;
    P.cyl(s, [x, 0.6, z - sg * 0.18], [x, 0.6, z + sg * 0.22], 0.6, '#1d1f22', MAT.rubber, { f, seg: 32 });
    P.cyl(s, [x, 0.6, z + sg * 0.22], [x, 0.6, z + sg * 0.24], 0.32, '#8d949c', MAT.steel, { f, seg: 24 });
  }
  for (const x of [-2.85, 2.95]) {
    P.box(s, [x - 0.15, 0.25, -1.0], [x + 0.15, 0.6, 1.0], '#3a3f45', MAT.dark, { f });
    for (const sg of [-1, 1]) P.cyl(s, [x, 0.27, sg * 0.84], [x, 0.27, sg * 0.98], 0.27, '#9aa1a9', MAT.chrome, { f, seg: 24 });
  }
  // buffer beams in orange
  B([2.7, 0.45, -1.15], [2.85, 0.95, 1.15], PAL.orange, MAT.paint);
  B([-2.85, 0.45, -1.15], [-2.7, 0.95, 1.15], PAL.orange, MAT.paint);
  // coupling bar to coach
  P.cyl(s, [-2.85, 0.75, 0], [-3.8, 0.95, 0], 0.07, '#5b6168', MAT.steel, { f, seg: 12 });
  // headlights
  for (const z of [-0.75, 0.75]) P.sphere(s, P.tp(f, [2.72, 1.6, z]), 0.08, '#fffbe8', MAT.emit, { seg: 10, rings: 5 });
  s.shadow([P.tp(f, [-2.8, 0, -1.2]), P.tp(f, [2.9, 0, -1.2]), P.tp(f, [2.9, 0, 1.2]), P.tp(f, [-2.8, 0, 1.2]), P.tp(f, [-2.6, 3.2, 0]), P.tp(f, [0.6, 3.2, 0])], { opacity: 0.3, blur: 10, floorY: 0.32 });
}
add('rail-cum-road-vehicle-shunter', () => {
  const s = C.outdoor({ cam: { pos: [12.5, 2.6, 9.6], target: [0.5, 1.5, 0], fov: 40 }, lightDir: [0.5, 0.75, 0.45], groundColor: '#a8a49b' });
  // tracks on ballast
  for (const z of [0, -6, -12]) K.track(s, -80, 60, z, { y: 0 });
  shunter(s, P.frame([4, 0.32, 0], 0));
  M.coach(s, { x0: -23.6, x1: 0.2, yb: 1.62, doors: [-1.4], equip: [[-15, -11], [-9, -5]] });
  M.bogie(s, { x: -2.6, y: 0.32, R: 0.46, wb: 2.6 });
  M.bogie(s, { x: -21, y: 0.32, R: 0.46, wb: 2.6 });
  // depot shed in background
  P.box(s, [-60, 0, -40], [10, 12, -22], '#e3e6e9', MAT.matte, { seg: [6, 1, 1] });
  P.box(s, [-60, 12, -40], [10, 13, -21.5], '#8e98a3', MAT.paint, { seg: [6, 1, 1] });
  for (const x of [-45, -30, -15, 0]) P.decal(s, { o: [x - 3, 0, -21.99], u: [6, 0, 0], v: [0, 7.5, 0] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#3b4656"/>`);
  for (const x of [-70, -55, 18, 30, 42]) C.tree(s, [x, 0, -34], 9);
  return C.finish(s, { grade: false });
});

// ---------- SKC partner products (studio still life) ----------
add('skc-partner-products', () => {
  const s = new E.Scene({ W: 1600, H: 1000, lightDir: [-0.35, 0.85, 0.35], fogDensity: 0.0, amb: 0.7, key: 0.65, sky: '#f4f6f8', ground: '#b5b8bb', env: { horizon: 1.0, sky: 1.1, ground: 0.35, band: 1.6 } });
  s.env = { horizon: 1.0, sky: 1.1, ground: 0.35, band: 1.6 };
  s.setCamera({ pos: [0.12, 0.42, 0.62], target: [0.01, 0.0, -0.07], fov: 30 });
  K.bgGradient(s, [[0, '#e9ecef'], [1, '#c9ced3']]);
  K.floorWithHoles(s, -3, 3, -3, 1.5, [], '#d9dcdf');
  const bronze = '#b8925a', steel = '#aeb4bb';
  // slideway plates with oil grooves
  const plate = (x, z, l, w, t, col, yaw) => {
    const f = P.frame([x, 0, z], yaw);
    P.box(s, [-l / 2, 0, -w / 2], [l / 2, t, w / 2], col, MAT.steel, { f });
    P.decal(s, { o: [-l / 2 + 0.02, t + 0.0005, w / 2 - 0.01], u: [l - 0.04, 0, 0], v: [0, 0, -(w - 0.02)] }, (map) => {
      let d = ''; for (let i = 0; i < 6; i++) { const a = i / 6 + 0.04; d += P.pathOf(map, [[a, 0.1], [a + 0.12, 0.9]], false) + P.pathOf(map, [[a + 0.12, 0.1], [a, 0.9]], false); }
      return `<path d="${d}" stroke="#6b5434" stroke-opacity="0.55" stroke-width="2" fill="none"/>`;
    }, { f });
    for (const k of [-0.35, 0, 0.35]) P.cyl(s, [k * l, t, 0], [k * l, t + 0.0008, 0], 0.008, '#4b4f55', MAT.dark, { f, seg: 12 });
  };
  plate(-0.12, -0.12, 0.34, 0.09, 0.016, bronze, 8);
  plate(0.13, -0.17, 0.3, 0.07, 0.014, steel, -12);
  plate(-0.02, -0.28, 0.42, 0.06, 0.012, bronze, 2);
  // bushes (plain + flanged)
  const bush = (x, z, r, l, col, flange) => {
    P.cyl(s, [x, 0, z], [x, l, z], r, col, MAT.steel, { tube: r * 0.72, seg: 40 });
    if (flange) P.cyl(s, [x, 0, z], [x, 0.008, z], r * 1.45, col, MAT.steel, { tube: r * 0.72, seg: 40 });
    P.cyl(s, [x, 0.0005, z], [x, l - 0.001, z], r * 0.72, '#4a3c2a', MAT.dark, { seg: 30 });
  };
  bush(0.03, 0.06, 0.03, 0.05, bronze, true);
  bush(0.12, 0.03, 0.022, 0.04, bronze, false);
  bush(-0.08, 0.08, 0.026, 0.06, steel, true);
  bush(0.2, 0.1, 0.018, 0.03, bronze, false);
  // guide strip
  P.box(s, [-0.3, 0, 0.0], [-0.12, 0.006, 0.018], '#3b4148', MAT.dark, { f: P.frame([0, 0, 0], -20) });
  // contact shadows
  s.raw.post.push('');
  return C.finish(s, { grade: false, vig: 0.22 });
});

// ---------- wheel profile close-up ----------
add('wheelset-profile-closeup', () => {
  const s = new E.Scene({ W: 1600, H: 1000, lightDir: [0.4, 0.75, 0.5], fogDensity: 0.05, fogColor: '#1b2738', fogStart: 1.5, amb: 0.45, key: 0.9, sky: '#c9d5e3', ground: '#3a4250' });
  s.env = { horizon: 0.7, sky: 0.9, ground: 0.12, band: 1.8 };
  s.setCamera({ pos: [1.02, 0.78, 0.5], target: [0.47, 0.5, 0.03], fov: 34 });
  K.bgGradient(s, [[0, '#24344a'], [0.6, '#152238'], [1, '#0e1828']]);
  // bokeh
  s.raw.pre.push((sc) => { let g = ''; const pts = [[0.12, 0.2, 60], [0.25, 0.35, 34], [0.08, 0.6, 46], [0.85, 0.12, 50], [0.7, 0.3, 28], [0.35, 0.12, 40]]; for (const [x, y, r] of pts) g += `<circle cx="${x * sc.W}" cy="${y * sc.H}" r="${r}" fill="#9fb8d6" fill-opacity="0.12"/>`; return `<g filter="url(#blur6)">${g}</g>`; });
  K.wheel(s, [0, 0.5, 0], [0, 0, 1], 0, 1, 0.5, { seg: 120, tread: '#d3d8dd' });
  E && P.cyl(s, [0, 0.5, -0.4], [0, 0.5, 0.25], 0.1, '#8d949c', MAT.steel, { seg: 30 });
  // tool holder at tread (tip near x=0.5, y=0.5)
  const M2b = require('../lib/machines2');
  const f = P.frame([0, 0, 0], 0);
  M2b.toolHolder(s, f, [0.505, 0.5, 0.075], [-1, 0, 0]);
  P.boxC(s, [0.98, 0.5, 0.075], [0.32, 0.26, 0.26], PAL.navy, MAT.paint);
  P.boxC(s, [0.98, 0.6, 0.075], [0.322, 0.012, 0.262], PAL.orange, MAT.paint);
  // chips: helical ribbons leaving the cutting point
  const cols = ['#9a7048', '#5d6f96', '#b08656'];
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i < 70; i++) {
      const t = i / 69; const a = t * Math.PI * 16;
      const r = 0.006 + t * 0.01;
      const base = [0.512 + t * (0.05 + k * 0.03), 0.515 + t * (0.11 - k * 0.025), 0.075 + t * (0.03 - k * 0.045)];
      pts.push([base[0] + r * Math.cos(a) * 0.5, base[1] + r * Math.sin(a), base[2] + r * Math.cos(a)]);
    }
    P.line3(s, pts, { color: cols[k], width: 0.006, layer: 4 });
    P.line3(s, pts, { color: '#f3e6d3', width: 0.0012, layer: 4, opacity: 0.6 });
  }
  // coolant mist glow at cutting point
  s.rawAt([0.5, 0.5, 0.075], (sc) => { const p = sc.cam.project([0.5, 0.5, 0.075]); return `<circle cx="${p[0]}" cy="${p[1]}" r="38" fill="#ffd9a0" fill-opacity="0.35" filter="url(#blur12)"/>`; }, { layer: 5 });
  return C.finish(s, { grade: false, vig: 0.4 });
});

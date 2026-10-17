'use strict';
const C = require('./common');
const { E, P, K, M, MAT, PAL, L } = C;
const M2 = require('../lib/machines2');
const scenes = {};
const add = (name, build, folder = 'projects') => { scenes[name] = { folder, build }; };

add('railway-wheel-shop', () => {
  const s = C.shop({ cam: { pos: [13, 4.6, 9.5], target: [1, 1.0, -5], fov: 52 }, hall: { x0: -40, x1: 40, z0: -14, z1: 16, craneX: -14, h: 12 }, shaftX: [-14, -4, 6, 16] });
  const F = (x, z, yaw = -90) => P.frame([x, 0, z], yaw);
  M2.surfaceWheelLathe(s, F(-16, -6), { rails: false });
  M2.vtl(s, P.frame([-5, 0, -7], 0), { fence: false });
  M2.measuringStation(s, F(4, -6));
  M2.wheelPress(s, F(13, -6.5));
  M2.axleLathe(s, F(24, -6));
  // transport track with wheelsets
  for (const sg of [-1, 1]) K.embeddedRail(s, -40, 40, 1.5 + sg * 0.873);
  for (const x of [-20, -17.6, -9, 6.5, 9]) K.wheelset(s, { c: [x, 0.5, 1.5], R: 0.5, discs: x > 0 ? 2 : 0 });
  K.floorLine(s, [-40, 0, -1.6], [40, 0, -1.6], 0.12);
  K.floorLine(s, [-40, 0, 4.6], [40, 0, 4.6], 0.12);
  M.controlConsole(s, P.frame([-11.5, 0, -3.2], 0));
  M.cabinets(s, P.frame([17.5, 0, -13.2], 0), 5);
  return C.finish(s);
});

add('metro-depot', () => {
  const lines = [-7, 0, 7];
  const holes = lines.map((z) => [-45, 30, z - 0.5, z + 0.5]);
  const s = C.shop({ cam: { pos: [26, 4.2, 3.6], target: [0, 1.6, -0.5], fov: 48 }, hall: { x0: -45, x1: 30, z0: -13, z1: 13, h: 10, holes, craneX: -30, walls: ['back', 'left', 'right'] }, fog: 0.014, shaftX: [-20, -8, 4] });
  for (const z of lines) {
    K.pit(s, [-45, 30, z - 0.5, z + 0.5], 1.4, { wall: '#8a9097', floor: '#6f757c', hatch: false });
    for (const sg of [-1, 1]) K.embeddedRail(s, -45, 30, z + sg * 0.7525);
    s.light.points.push({ p: [10, -0.5, z], i: 0.2, r: 3 });
  }
  M.metroCar(s, { x0: 2.5, x1: 22, z: -7, yb: 1.05, cab: false, bogies: [5, 19.5], equip: [[8, 12], [13, 17]], sides: [1] });
  M.metroCar(s, { x0: -20, x1: 0.5, z: -7, yb: 1.05, bogies: [-17.5, -2], equip: [[-14, -6]] });
  // second train with cab facing camera (cab at x0) -> build reversed by putting cab at far end using x0 < x1 with nose toward -x... use frame trick: place cab end near camera by mirroring positions
  M.metroCar(s, { x0: -16, x1: 4, z: 7, yb: 1.05, bogies: [-13.5, 1.5], equip: [[-10, -4]], sides: [-1, 1] });
  // walkway platforms between lines
  for (const z of [-3.5, 3.5]) {
    P.boxC(s, [-8, 0.55, z], [70, 1.1, 2.2], '#cfd4d9', MAT.paint, { seg: [14, 1, 1] });
    K.floorLine(s, [-43, 1.11, z + 1.0], [27, 1.11, z + 1.0], 0.08);
    for (let x = -42; x < 28; x += 3) P.cyl(s, [x, 1.1, z - 1.0], [x, 2.1, z - 1.0], 0.025, PAL.yellow, MAT.paint, { seg: 8 });
    P.line3(s, [[-42, 2.1, z - 1.0], [27, 2.1, z - 1.0]], { color: PAL.yellow, width: 0.04 });
  }
  return C.finish(s);
});

add('emu-car-shed', () => {
  const s = C.outdoor({ cam: { pos: [26, 3.4, 16], target: [0, 3.0, -4], fov: 46 }, lightDir: [0.6, 0.7, 0.4] });
  // shed building with three open bays
  const sx0 = -40, sx1 = -2, sz0 = -16, sz1 = 8, sh = 9;
  P.box(s, [sx0, 0, sz0], [sx1, sh, sz1], '#e4e7ea', MAT.matte, { seg: [6, 1, 3], skip: ['right'] });
  // gable front (x = sx1) with door openings
  P.decal(s, { o: [sx1 + 0.01, 0, sz1], u: [0, 0, sz0 - sz1], v: [0, sh, 0] }, (map) => {
    let svg = `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#e9ecef"/>`;
    for (const zc of [4, -4, -12]) { const a = (sz1 - zc - 2.6) / (sz1 - sz0), b = (sz1 - zc + 2.6) / (sz1 - sz0); svg += `<path d="${P.quadPath(map, a, 0, b, 6.2 / sh)}" fill="#2a3442"/>`; }
    svg += `<path d="${P.quadPath(map, 0, 0.9, 1, 1)}" fill="${PAL.navy}"/><path d="${P.quadPath(map, 0, 0.88, 1, 0.9)}" fill="${PAL.orange}"/>`;
    return svg;
  }, { two: true, noHost: true, bias: -0.05 });
  P.extrude(s, [[sz0 - 0.5, sh], [sz1 + 0.5, sh], [(sz0 + sz1) / 2, sh + 3]], sx0, sx1 + 0.3, '#9aa3ad', MAT.paint, { axes: 'zy', segW: 6 });
  for (const zc of [4, -4, -12]) {
    for (const sg of [-1, 1]) for (let x = -40; x < 60; x += 4) { /* sleepers via track below */ }
    K.track(s, -40, 70, zc, { y: 0 });
  }
  // EMU rakes
  const emu = { color: '#d9dee3', band: '#2b5d93', cab: true, yb: 1.6, w: 3.6, h: 2.9, railY: 0.32 };
  M.metroCar(s, { ...emu, x0: 6, x1: 27, z: 4, bogies: [9, 24] });
  M.metroCar(s, { ...emu, x0: -18, x1: 5.6, z: 4, cab: false, bogies: [-15, 2.5] });
  M.metroCar(s, { ...emu, x0: -6, x1: 15, z: -4, bogies: [-3, 12] });
  M.metroCar(s, { ...emu, x0: -30, x1: -6.4, z: -12, cab: false, bogies: [-27, -9.5] });
  // overhead catenary masts on the far side with cantilevers
  for (let x = 6; x < 70; x += 14) {
    P.boxC(s, [x, 3.8, -16], [0.3, 7.6, 0.3], '#7d848c', MAT.steel);
    P.boxC(s, [x, 7.3, -6], [0.18, 0.2, 20], '#7d848c', MAT.steel, { seg: [1, 1, 3] });
  }
  for (const zc of [4, -4, -12]) P.line3(s, [[0, 6.2, zc], [70, 6.2, zc]], { color: '#3a3f45', width: 0.02 });
  for (const x of [40, 52, 64]) C.tree(s, [x, 0, -30], 10);
  for (const x of [-60, -50]) C.tree(s, [x, 0, -26], 11);
  return C.finish(s, { grade: false });
});

add('wheel-shop-automation-line', () => {
  const s = C.shop({ cam: { pos: [15, 8.5, 12], target: [0, 0.6, -1], fov: 46 }, hall: { craneX: -20 }, shaftX: [-10, 0, 10] });
  // main line along x at z=0 with wheelsets
  for (const sg of [-1, 1]) K.rail(s, -30, 30, sg * 0.873, 0, { layer: L.surf });
  for (const x of [-15, -11.5, -4, 3.5, 7, 13]) K.wheelset(s, { c: [x, 0.5 + 0.17, 0], R: 0.5, discs: 2 });
  // transfer car on cross rails at x = 0
  for (const sg of [-1, 1]) K.embeddedRail(s, -1.5, 1.5, 0) ;
  for (const sg of [-1, 1]) P.extrude(s, [[-0.04, 0], [0.04, 0], [0.04, 0.02], [-0.04, 0.02]], -10, 10, '#c3c8ce', MAT.chrome, { axes: 'xy', f: P.frame([sg * 1.2, 0, 0], 0) });
  P.box(s, [-1.6, 0, -2.0], [1.6, 0.17, 2.0], PAL.navy, MAT.paint);
  P.box(s, [-1.6, 0.17, -2.0], [1.6, 0.2, 2.0], '#3a3f45', MAT.dark);
  // gantry loader spanning the line
  for (const x of [-8, 2]) for (const sg of [-1, 1]) P.boxC(s, [x, 2.6, sg * 3], [0.4, 5.2, 0.4], PAL.guard, MAT.paint);
  for (const sg of [-1, 1]) P.boxC(s, [-3, 5.4, sg * 3], [10.6, 0.5, 0.5], PAL.navy, MAT.paint, { seg: [4, 1, 1] });
  P.boxC(s, [-4, 5.75, 0], [1.2, 0.4, 6.5], PAL.guard, MAT.paint, { seg: [1, 1, 2] });
  P.boxC(s, [-4, 4.2, 0], [0.35, 2.8, 0.35], '#c5cad0', MAT.steel);
  P.boxC(s, [-4, 2.7, 0], [0.5, 0.3, 2.6], '#3a3f45', MAT.dark);
  for (const sg of [-1, 1]) { P.boxC(s, [-4, 2.1, sg * 1.25], [0.25, 1.0, 0.12], PAL.orange, MAT.paint); }
  K.wheelset(s, { c: [-4, 1.62, 0], R: 0.5 });
  // stations along the line
  M2.measuringStation(s, P.frame([-22, 0, -0.0], -90));
  M2.surfaceWheelLathe(s, P.frame([12, 0, -6.5], -90), { rails: false });
  M2.balancingMachine(s, P.frame([-12, 0, -7], -90));
  K.hatchBorder(s, -9, 3, -3.6, 3.6, 0.15);
  return C.finish(s);
});

add('installation-commissioning', () => {
  const pitR = [-3.5, 3.5, -2.0, 2.0];
  const s = C.shop({ cam: { pos: [6.8, 4.8, 7.2], target: [0, 0.6, 0], fov: 48 }, hall: { holes: [pitR], craneX: 0, hookY: 4.8, trolleyZ: 0 } });
  const pt = K.pit(s, pitR, 1.8, { wall: '#9aa0a6', floor: '#848a90' });
  K.setPitClip(s, [pt.clip]);
  // foundation bolts in pit floor
  for (const x of [-2.2, -1.2, 1.2, 2.2]) for (const z of [-1.3, -0.4, 0.4, 1.3]) P.cyl(s, [x, -1.8, z], [x, -1.5, z], 0.03, '#c3c8ce', MAT.chrome, { seg: 8, layer: L.pit });
  // levelling plates
  for (const x of [-2.2, 2.2]) for (const z of [-1.3, 1.3]) P.boxC(s, [x, -1.78, z], [0.35, 0.04, 0.35], '#5b6168', MAT.steel, { layer: L.pit });
  // machine module hanging from crane
  const my = 1.6;
  P.extrude(s, P.chamfer(-1.6, my, 1.6, my + 1.2, 0.12), -1.1, 1.1, PAL.guard, MAT.paint);
  P.box(s, [-1.65, my - 0.25, -1.15], [1.65, my, 1.15], PAL.navy, MAT.paint);
  P.decal(s, { o: [-1.5, my + 0.25, 1.101], u: [3.0, 0, 0], v: [0, 0.06, 0] }, M.stripe());
  for (const dx of [-0.6, 0.6]) for (const sg of [-1, 1]) P.cyl(s, [dx, 0.6 + my, 0], [dx, 0.6 + my, sg * 0.3], 0.1, '#aeb4ba', MAT.chrome, { seg: 20 });
  // slings
  for (const [x, z] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) P.line3(s, [[x, my + 1.2, z], [0, 4.8, 0]], { color: '#e0b030', width: 0.04 });
  // shadow of the hanging module on pit floor
  s.shadow([[-1.6, -1.8, -1.1], [1.6, -1.8, -1.1], [1.6, -1.8, 1.1], [-1.6, -1.8, 1.1]], { floorY: -1.8, opacity: 0.25, blur: 16, layer: L.pit });
  // safety barriers around pit
  const posts = [[-4.3, -2.8], [0, -2.8], [4.3, -2.8], [4.3, 0], [4.3, 2.8], [0, 2.8], [-4.3, 2.8], [-4.3, 0]];
  for (const [x, z] of posts) { P.cyl(s, [x, 0, z], [x, 1.0, z], 0.04, PAL.yellow, MAT.paint, { seg: 10 }); P.cyl(s, [x, 0, z], [x, 0.05, z], 0.15, '#222', MAT.dark, { seg: 12 }); }
  for (let i = 0; i < posts.length; i++) { const a = posts[i], b = posts[(i + 1) % posts.length]; const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([a[0] + (b[0] - a[0]) * t, 0.95 - 0.12 * Math.sin(Math.PI * t), a[1] + (b[1] - a[1]) * t]); } P.line3(s, pts, { color: i % 2 ? '#d9a91f' : '#2a2a2a', width: 0.025 }); }
  C.person(s, [-5.2, 0, 1.5], 60, { helmet: '#f2f2f2', top: '#2b4c7e' });
  C.person(s, [5.4, 0, -1.2], -110, { helmet: PAL.orange, top: '#3a4352' });
  // tools / parts staged on floor
  P.boxC(s, [-6.5, 0.4, -3.5], [1.6, 0.8, 1.0], PAL.navy, MAT.paint);
  P.boxC(s, [-6.5, 0.85, -3.5], [1.2, 0.1, 0.8], '#3a3f45', MAT.dark);
  return C.finish(s);
});

add('pit-foundation-civil-works', () => {
  const pitR = [-4.5, 4.5, -2.4, 2.4];
  const s = C.shop({ cam: { pos: [7.2, 5.6, 7.6], target: [0, -0.6, 0], fov: 48 }, hall: { holes: [pitR], craneX: -12, floorColor: '#a7a39b', columns: true }, shaftX: [-6, 2, 10] });
  const pt = K.pit(s, pitR, 2.0, { wall: '#a9a7a1', floor: '#8f8b84', hatch: false, rim: false });
  K.setPitClip(s, [pt.clip]);
  // rebar mesh on pit floor and walls (rusty)
  const rb = '#8a5a3a';
  for (let x = -4.3; x <= 4.3; x += 0.3) P.line3(s, [[x, -1.9, -2.3], [x, -1.9, 2.3]], { color: rb, width: 0.02, layer: L.pit });
  for (let z = -2.2; z <= 2.2; z += 0.3) P.line3(s, [[-4.4, -1.88, z], [4.4, -1.88, z]], { color: rb, width: 0.02, layer: L.pit });
  // far wall rebar cage (wall under construction, formwork on half)
  for (let x = -4.3; x <= 4.3; x += 0.25) P.line3(s, [[x, -1.9, -2.25], [x, 0.6, -2.25]], { color: rb, width: 0.02, layer: L.pit });
  for (let y = -1.8; y <= 0.6; y += 0.3) P.line3(s, [[-4.4, y, -2.22], [4.4, y, -2.22]], { color: rb, width: 0.02, layer: L.pit });
  // formwork panels (plywood) on left wall + props
  for (let z = -2.3; z < 2.3; z += 1.2) P.box(s, [-4.45, -1.9, z], [-4.38, 0.0, z + 1.15], '#c9a46a', MAT.matte, { layer: L.pit });
  for (const z of [-1.7, -0.5, 0.7, 1.9]) P.cyl(s, [-4.38, -0.6, z], [-3.2, -1.9, z], 0.04, '#d0b030', MAT.paint, { seg: 8, layer: L.pit });
  // rail anchor plates / embedded steel along pit rim
  for (let x = -4.2; x <= 4.2; x += 0.7) for (const sg of [-1, 1]) P.boxC(s, [x, 0.02, sg * 2.6], [0.25, 0.04, 0.35], '#6d737a', MAT.steel);
  for (let x = -4.2; x <= 4.2; x += 0.7) for (const sg of [-1, 1]) for (const d of [-0.08, 0.08]) P.cyl(s, [x + d, 0.04, sg * 2.6], [x + d, 0.2, sg * 2.6], 0.018, '#c3c8ce', MAT.chrome, { seg: 6 });
  // concrete pump hose & site items
  P.line3(s, [[8, 0.3, -5], [5, 0.25, -3.2], [3, 0.2, -2.6], [1.5, -0.6, -1.8]], { color: '#262626', width: 0.14 });
  P.boxC(s, [-7, 0.5, -4.5], [2.2, 1.0, 1.2], '#d0b030', MAT.paint);
  for (let i = 0; i < 6; i++) P.cyl(s, [-7.5, 0.06 + (i % 3) * 0.05, 3.2 + i * 0.1], [-2.5, 0.06 + (i % 3) * 0.05, 3.2 + i * 0.1], 0.02, rb, MAT.dark, { seg: 6 });
  // barricade posts
  for (let x = -5; x <= 5; x += 2.5) for (const sg of [-1, 1]) { P.cyl(s, [x, 0, sg * 3.3], [x, 1.0, sg * 3.3], 0.04, PAL.yellow, MAT.paint, { seg: 8 }); }
  for (const sg of [-1, 1]) P.line3(s, [[-5, 0.95, sg * 3.3], [5, 0.95, sg * 3.3]], { color: '#d9a91f', width: 0.03 });
  C.person(s, [-2.5, -2.0, 0.8], 40, { helmet: '#f2f2f2', top: '#e07a1f' });
  C.person(s, [6.2, 0, 1.0], -100, { helmet: '#f2f2f2', top: '#2b4c7e' });
  return C.finish(s);
});

module.exports = scenes;

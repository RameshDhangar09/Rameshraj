'use strict';
const C = require('./common');
const { E, P, K, M, MAT, PAL, L } = C;
const M2 = require('../lib/machines2');
const scenes = {};
const add = (name, build) => { scenes[name] = { folder: 'industries', build }; };

function catenary(s, x0, x1, zs, zMast, step = 45) {
  for (let x = x0; x < x1; x += step) {
    P.boxC(s, [x, 4.2, zMast], [0.32, 8.4, 0.32], '#7d848c', MAT.steel);
    const zEnd = zs[zs.length - 1];
    P.boxC(s, [x, 7.6, (zMast + zEnd) / 2], [0.16, 0.18, Math.abs(zEnd - zMast) + 0.6], '#7d848c', MAT.steel);
  }
  for (const z of zs) { P.line3(s, [[x0, 7.0, z], [x1, 7.0, z]], { color: '#3a3f45', width: 0.025 }); P.line3(s, [[x0, 6.0, z], [x1, 6.0, z]], { color: '#3a3f45', width: 0.02 }); }
}

add('railways', () => {
  const s = C.outdoor({ cam: { pos: [14, 2.4, 9.5], target: [-2, 2.6, -1], fov: 46 }, lightDir: [0.55, 0.7, 0.5], groundColor: '#aaa69c' });
  for (const z of [0, -5.5, -11]) K.track(s, -180, 60, z);
  M.loco(s, { x0: -9.4, x1: 10.6, railY: 0.32, yb: 1.77 });
  for (let i = 0; i < 4; i++) {
    const x1 = -9.6 - i * 24.2, x0 = x1 - 24;
    M.coach(s, { x0, x1, yb: 1.62, doors: [x0 + 1.4, x1 - 1.4], color: '#d8dde2' });
    M.bogie(s, { x: x1 - 2.6, y: 0.32, R: 0.46 }); M.bogie(s, { x: x0 + 2.6, y: 0.32, R: 0.46 });
  }
  // wagons on the far track
  for (let i = 0; i < 6; i++) { const x = 30 - i * 16; P.box(s, [x - 7.5, 1.4, -12.4], [x + 7.5, 3.9, -9.6], i % 2 ? '#6b5a50' : '#5f6670', MAT.matte, { seg: [3, 1, 1] }); M.bogie(s, { x: x - 5, y: 0.32, z: -11, R: 0.46, wb: 2.0 }); M.bogie(s, { x: x + 5, y: 0.32, z: -11, R: 0.46, wb: 2.0 }); }
  catenary(s, -180, 60, [0, -5.5, -11], 3.2);
  for (const x of [-120, -90, -60, -30, 0, 25, 45]) C.tree(s, [x, 0, -40 - (x % 7)], 10 + (x % 3));
  return C.finish(s, { grade: false });
});

add('metros', () => {
  const s = C.outdoor({ cam: { pos: [24, 3.0, 30], target: [-2, 9.5, 0], fov: 48 }, lightDir: [0.5, 0.75, 0.55] });
  // viaduct
  for (let x = -150; x <= 60; x += 25) {
    P.cyl(s, [x, 0, 0], [x, 8.6, 0], 1.0, '#c9c6bf', MAT.matte, { seg: 24 });
    P.boxC(s, [x, 8.9, 0], [2.2, 0.8, 7.0], '#c4c1ba', MAT.matte);
  }
  P.extrude(s, [[-4.6, 9.3], [4.6, 9.3], [4.9, 10.6], [4.6, 10.6], [4.4, 9.9], [-4.4, 9.9], [-4.6, 10.6], [-4.9, 10.6]], -160, 70, '#d4d1ca', MAT.matte, { axes: 'zy', segW: 40 });
  K.track(s, -160, 70, 1.9, { y: 9.9, gauge: 'SG', ballast: '#9a9890' });
  M.metroCar(s, { x0: -6, x1: 15, z: 1.9, yb: 9.9 + 0.32 + 1.05, cab: true, bogies: [-2.5, 12], railY: 10.22, equip: [[3, 8]] });
  M.metroCar(s, { x0: 15.4, x1: 36, z: 1.9, yb: 9.9 + 0.32 + 1.05, bogies: [18, 33], railY: 10.22 });
  // city
  const bl = [[-80, -60, -60, -40, 38], [-55, -38, -70, -50, 52], [-30, -10, -64, -44, 30], [-6, 14, -80, -58, 64], [20, 40, -60, -42, 26], [45, 70, -72, -52, 44], [-110, -88, -50, -32, 24]];
  bl.forEach(([a, b, c, d, h], i) => C.building(s, a, b, c, d, h, { color: i % 2 ? '#e3e6ea' : '#d6dbe1', win: i % 3 ? '#8aa0b8' : '#6f87a2' }));
  // road below
  P.decal(s, { o: [-160, 0.01, 8], u: [230, 0, 0], v: [0, 0, -7] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#6e7276"/>`, { two: true, noHost: true, layer: 1 });
  for (let x = -150; x < 70; x += 12) C.tree(s, [x + 6, 0, 10.5], 6);
  return C.finish(s, { grade: false });
});

add('rolling-stock-manufacturers', () => {
  const s = C.shop({ cam: { pos: [16, 6.5, 13], target: [0, 2.0, -2], fov: 48 }, hall: { x0: -45, x1: 30, z0: -16, z1: 16, h: 13, craneX: -6 } });
  const shell = (z, x0, x1) => {
    M.metroCar(s, { x0, x1, z, yb: 1.6, color: '#c3cad1', band: '#aeb6bf', sides: [1], underframe: false });
    for (let x = x0 + 2; x < x1; x += 5) for (const sg of [-1, 1]) { P.boxC(s, [x, 0.8, z + sg * 1.1], [0.4, 1.6, 0.4], PAL.navy, MAT.paint); P.boxC(s, [x, 1.5, z + sg * 1.1], [0.42, 0.06, 0.42], PAL.orange, MAT.paint); }
  };
  shell(-8, -20, 2); shell(-1, -24, -2); shell(6, -14, 8);
  // welding / assembly gantry
  for (const x of [5, 12]) for (const sg of [-1, 1]) P.boxC(s, [x, 3.2, -1 + sg * 2.8], [0.35, 6.4, 0.35], PAL.guard, MAT.paint);
  for (const sg of [-1, 1]) P.boxC(s, [8.5, 6.6, -1 + sg * 2.8], [7.6, 0.45, 0.45], PAL.navy, MAT.paint, { seg: [3, 1, 1] });
  P.boxC(s, [8.5, 6.9, -1], [0.9, 0.35, 6.0], PAL.guard, MAT.paint);
  P.boxC(s, [8.5, 5.4, -1], [0.25, 2.6, 0.25], '#c5cad0', MAT.steel);
  // underframe on stands (bare)
  P.box(s, [-0, 1.0, 5], [16, 1.25, 7], '#3a3f45', MAT.dark, { seg: [4, 1, 1] });
  for (const x of [2, 8, 14]) for (const z of [5.4, 6.6]) P.boxC(s, [x, 0.5, z], [0.3, 1.0, 0.3], PAL.navy, MAT.paint);
  // bogies waiting
  M.bogie(s, { x: 10, z: 11, R: 0.46 }); M.bogie(s, { x: 2, z: 11, R: 0.46 });
  K.floorLine(s, [-45, 0, 9.2], [30, 0, 9.2], 0.12);
  return C.finish(s);
});

add('defence', () => {
  const s = C.outdoor({ cam: { pos: [16, 3.2, 12], target: [-3, 2.0, -1], fov: 44 }, lightDir: [0.5, 0.7, 0.5], groundColor: '#a49f92' });
  for (const z of [0, -6]) K.track(s, -150, 60, z);
  for (let i = 0; i < 4; i++) {
    const x = 6 - i * 15;
    C.flatWagon(s, x, { len: 14 });
    C.heavyTruck(s, P.frame([x - 0.5, 1.57, 0], 0), { color: i % 2 ? '#5a6350' : '#636b56' });
    // tie-down chains
    for (const dx of [-3.4, 3.2]) for (const sg of [-1, 1]) P.line3(s, [[x - 0.5 + dx, 2.4, sg * 1.25], [x - 0.5 + dx * 1.12, 1.6, sg * 1.45]], { color: '#2a2a2a', width: 0.03 });
  }
  // container-type shelters on far track
  for (let i = 0; i < 5; i++) { const x = 20 - i * 15; C.flatWagon(s, x, { len: 14 }); }
  for (let i = 0; i < 5; i++) { const x = 20 - i * 15; P.box(s, [x - 6, 1.57, -7.2], [x + 6, 4.1, -4.8], '#6a705e', MAT.matte); }
  for (const x of [-100, -70, -40, -10, 30]) C.tree(s, [x, 0, -32], 9);
  C.building(s, -60, -20, -60, -45, 12, { color: '#d9d6cf', win: '#7d8a78' });
  return C.finish(s, { grade: false });
});

add('heavy-engineering', () => {
  const s = C.shop({ cam: { pos: [7.5, 6.2, 9.5], target: [0, 2.2, -1], fov: 48 }, hall: { craneX: 2, hookY: 7, trolleyZ: -1, wallColor: '#e2e5e8', dadoColor: '#aab0b7' }, amb: 0.55, fog: 0.012 });
  M2.vtl(s, P.frame([0, 0, 0], 0, 0, 1.7), { work: 'ring', workR: 0.98, fence: false, ramX: 1.0 });
  // big castings / flanges staged
  P.cyl(s, [-8, 0, 3], [-8, 0.5, 3], 1.6, '#7d848c', MAT.steel, { tube: 1.1, seg: 48 });
  P.cyl(s, [-8, 0.5, 3], [-8, 0.9, 3], 1.3, '#868d95', MAT.steel, { tube: 1.1, seg: 48 });
  P.boxC(s, [7.5, 0.6, 2.5], [2.6, 1.2, 1.8], '#5e656d', MAT.steel);
  P.cyl(s, [7.5, 1.2, 2.5], [7.5, 1.9, 2.5], 0.7, '#7d848c', MAT.steel, { seg: 32 });
  M.controlConsole(s, P.frame([5.2, 0, 2.6], 35));
  K.hatchBorder(s, -4.5, 4.5, -5.5, 3.6, 0.18);
  return C.finish(s, { top: 0.2, vig: 0.35 });
});

module.exports = scenes;

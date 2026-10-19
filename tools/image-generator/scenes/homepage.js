'use strict';
const E = require('../lib/engine');
const P = require('../lib/prims');
const K = require('../lib/components');
const M = require('../lib/machines');
const { MAT } = E;
const { PAL, L } = K;

function hero() {
  const s = new E.Scene({ W: 2400, H: 1200, lightDir: [0.35, 0.85, -0.25], fogDensity: 0.008, fogColor: '#d9dfe6', amb: 0.6, key: 0.7 });
  s.setCamera({ pos: [13.2, 3.3, 8.6], target: [2.6, 1.0, -1.2], fov: 40 });
  const pitR = [-1.5, 10.5, -2.3, 2.3];
  K.hall(s, { x0: -40, x1: 22, z0: -13, z1: 12, h: 11, holes: [pitR], craneX: -6, hookY: 6 });
  const pt = K.pit(s, pitR, 1.7, { wall: '#7a8188', floor: '#5d636a' });
  K.setPitClip(s, [pt.clip]);
  for (const sg of [-1, 1]) { K.embeddedRail(s, -40, pitR[0], sg * 0.873); K.embeddedRail(s, pitR[1], 22, sg * 0.873); }
  M.pitRails(s, pitR[0], pitR[1], 0, 'BG', { gap: [5.5, 8.1], depth: 1.7 });
  const bx = 4.2 + 1.3; // bogie centre so that inner axle sits at x=4.2
  M.underfloorLathe(s, { x: 6.8, R: 0.46, depth: 1.7 });
  M.bogie(s, { x: bx, R: 0.46, wb: 2.6 });
  M.bogie(s, { x: -14, R: 0.46, wb: 2.6 });
  M.coach(s, { x0: -17, x1: 8.2, yb: 1.3, doors: [-15.6, 6.8], equip: [[-10, -6], [-4.5, 0.5]], gangway: [8.3] });
  M.controlConsole(s, P.frame([7.2, 0, -3.4], 15));
  for (let x = -12; x < 6; x += 3.2) P.boxC(s, [x, 4.25, 0], [2.2, 0.3, 1.4], '#c3c8ce', MAT.paint);
  s.shadow([[-17, 1.3, -1.6], [8.2, 1.3, -1.6], [8.2, 1.3, 1.6], [-17, 1.3, 1.6], [-17, 4.1, 0], [8.2, 4.1, 0]], { opacity: 0.22, blur: 14 });
  M.cabinets(s, P.frame([12.5, 0, -6], 0), 4);
  K.floorLine(s, [-40, 0, 4.2], [22, 0, 4.2], 0.1);
  K.floorLine(s, [-40, 0, -4.2], [22, 0, -4.2], 0.1);
  K.shafts(s, [[[ -6, 9, -12.9], [-1, 9, -12.9], [-1, 6, -12.9], [-6, 6, -12.9]], [[2, 9, -12.9], [7, 9, -12.9], [7, 6, -12.9], [2, 6, -12.9]], [[10, 9, -12.9], [15, 9, -12.9], [15, 6, -12.9], [10, 6, -12.9]]], [-0.35, -0.85, 0.25], { op: 0.3 });
  K.glow(s, 0.6, 0.74, 0.07, '#ffd9a0', 0.22);
  K.overlayGradient(s, [[0, '#0b1a2e', 0.78], [0.3, '#0f223a', 0.55], [0.5, '#142D4E', 0.12], [0.62, '#142D4E', 0]]);
  K.vignette(s, 0.3);
  return s.toSVG();
}

module.exports = {
  'hero-wheel-lathe-workshop': { folder: 'homepage', sizes: [[2400, 1200, ''], [1200, 600, '-1200']], build: hero },
};

function engTech() {
  const C = require('./common');
  const s = C.shop({ cam: { pos: [1.15, 1.75, 1.7], target: [-0.35, 1.45, -0.2], fov: 40 }, fog: 0.05, hall: { craneX: 4 } });
  // machine guard with window to the left
  const f = P.frame([-1.6, 0, -1.2], 20);
  P.extrude(s, P.chamfer(-1.5, 0, 1.2, 2.6, 0.1), -0.4, 0.4, PAL.guard, MAT.paint, { f });
  P.decal(s, { o: [-1.25, 1.0, 0.401], u: [1.6, 0, 0], v: [0, 1.2, 0] }, M.glassPanel('#2a3a4f'), { f });
  P.decal(s, { o: [-1.4, 0.55, 0.402], u: [2.5, 0, 0], v: [0, 0.06, 0] }, M.stripe(), { f });
  P.decal(s, { o: [-1.5, 0, 0.402], u: [2.7, 0, 0], v: [0, 0.3, 0] }, M.stripe(PAL.navy), { f });
  // control pendant (large HMI) on swivel arm
  const pf = P.frame([0.0, 0, 0.0], -28);
  P.cyl(s, [-0.9, 2.5, -0.9], [-0.1, 2.4, -0.1], 0.05, '#7d848c', MAT.steel, { seg: 12 });
  P.cyl(s, [-0.1, 2.4, -0.1], [-0.05, 1.95, -0.05], 0.05, '#7d848c', MAT.steel, { seg: 12 });
  P.rbox(s, [-0.42, 0.95, -0.06], [0.42, 1.95, 0.06], 0.04, '#2f3338', MAT.dark, { f: pf });
  P.decal(s, { o: [-0.37, 1.32, 0.061], u: [0.74, 0, 0], v: [0, 0.56, 0] }, M.hmiScreen(0), { f: pf });
  // buttons
  const btn = (x, y, col, r = 0.025) => P.cyl(s, P.tp(pf, [x, y, 0.06]), P.tp(pf, [x, y, 0.085]), r, col, MAT.gloss, { seg: 16 });
  btn(0.3, 1.13, '#c0392b', 0.04); btn(-0.3, 1.13, PAL.orange); btn(-0.2, 1.13, '#4fbf7a'); btn(-0.1, 1.13, '#d5d9dd');
  for (let i = 0; i < 6; i++) btn(-0.3 + i * 0.07, 1.04, '#6b737c', 0.018);
  P.cyl(s, P.tp(pf, [0.12, 1.12, 0.06]), P.tp(pf, [0.12, 1.12, 0.1]), 0.045, '#1f2226', MAT.dark, { seg: 20 });
  // soft screen glow
  s.light.points.push({ p: P.tp(pf, [0, 1.6, 0.4]), i: 0.25, r: 0.6, c: '#7fb6e6' });
  return C.finish(s, { vig: 0.35 });
}
module.exports['engineering-technology'] = { folder: 'homepage', build: engTech };

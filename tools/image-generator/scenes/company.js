'use strict';
const C = require('./common');
const { E, P, K, M, MAT, PAL, L } = C;
const M2 = require('../lib/machines2');
const scenes = {};
const add = (name, build) => { scenes[name] = { folder: 'company', build }; };

add('manufacturing-facility', () => {
  const s = C.shop({ cam: { pos: [15, 6.0, 12], target: [0, 1.8, -3], fov: 50 }, hall: { x0: -40, x1: 30, z0: -15, z1: 15, h: 12, craneX: 1, hookY: 6.5, trolleyZ: -2 } });
  // portal frame being assembled (uprights only + crossbeam hanging from crane)
  const f1 = P.frame([0, 0, -2], -90);
  M2.B(s, f1, [-1.6, 0, -2.9], [1.4, 0.5, 2.9], PAL.navy, MAT.paint);
  for (const sg of [-1, 1]) P.extrude(s, P.chamfer(-1.3, 0.5, 0.6, 3.8, 0.12), Math.min(sg * 2, sg * 2.9), Math.max(sg * 2, sg * 2.9), PAL.guard, MAT.paint, { f: f1 });
  P.extrude(s, P.chamfer(-1.3, 5.6, 0.6, 6.4, 0.12), -2.9, 2.9, PAL.navy, MAT.paint, { f: f1 });
  for (const [x, z] of [[-2.4, -2.3], [2.4, -2.3], [-2.4, -1.7], [2.4, -1.7]]) P.line3(s, [[x, 6.4, z], [1, 6.5 + 0.0, -2]], { color: '#e0b030', width: 0.03 });
  // machines in assembly bays
  M2.surfaceWheelLathe(s, P.frame([-14, 0, -4], -90), { rails: false });
  M2.vtl(s, P.frame([13, 0, -6], 0), { fence: false });
  // bed castings / subassemblies on stands
  for (const [x, z] of [[-6, 5], [3, 6], [9, 4.5]]) { P.boxC(s, [x, 0.5, z], [3.2, 0.7, 1.4], PAL.navy, MAT.paint); P.boxC(s, [x, 0.08, z], [3.0, 0.16, 1.2], '#3a3f45', MAT.dark); }
  P.boxC(s, [3, 1.2, 6], [1.2, 0.7, 1.0], PAL.guard, MAT.paint);
  K.floorLine(s, [-40, 0, 2.2], [30, 0, 2.2], 0.12);
  K.floorLine(s, [-40, 0, 9], [30, 0, 9], 0.12);
  C.person(s, [5.5, 0, 1.0], -60, { helmet: '#f2f2f2', top: '#2b4c7e' });
  C.person(s, [-9.5, 0, 0.5], 30, { helmet: PAL.orange, top: '#2b4c7e' });
  return C.finish(s);
});

add('engineering-design', () => {
  const s = C.room({ cam: { pos: [1.3, 1.55, 2.0], target: [-0.15, 1.0, -0.55], fov: 44 }, box: { x0: -4, x1: 4, z0: -1.6, z1: 4, h: 3 } });
  C.desk(s, P.frame([0, 0, -0.9], 0), {});
  P.box(s, [-1.6, 0.72, -1.3], [1.6, 0.76, -0.5], '#e9e6e1', MAT.paint);
  C.monitor(s, P.frame([-0.15, 1.05, -1.05], 8), 1.0, 0.58, C.cadDrawing());
  C.monitor(s, P.frame([0.95, 1.05, -0.95], -28), 0.62, 0.38, C.cadDrawing({ bg: '#f2f4f7', edge: '#2b3d57', c0: '#9fb4cc', c1: '#dfe6ee', ui: false, boxes: [[[-1, 0, -1], [1, 0.3, 1], 0], [[-0.3, 0.3, -0.3], [0.3, 1.6, 0.3], 1], [[-0.8, 1.6, -0.4], [0.8, 1.9, 0.4], 0]] }));
  // drawings on desk
  P.decal(s, { o: [-1.35, 0.762, -0.35], u: [0.75, 0, 0.12], v: [0.08, 0, -0.5] }, C.drawingSheet(), { two: true, noHost: true, bias: 0.05 });
  P.decal(s, { o: [-0.95, 0.765, -0.45], u: [0.6, 0, -0.08], v: [-0.05, 0, -0.42] }, C.drawingSheet(), { two: true, noHost: true, bias: 0.06 });
  // keyboard, mouse, mug
  P.box(s, [-0.45, 0.76, -0.62], [0.15, 0.78, -0.45], '#2b2e33', MAT.dark);
  P.box(s, [0.3, 0.76, -0.58], [0.37, 0.785, -0.5], '#2b2e33', MAT.dark);
  P.cyl(s, [0.7, 0.76, -0.5], [0.7, 0.86, -0.5], 0.04, PAL.navy, MAT.gloss, { seg: 16 });
  C.chair(s, P.frame([0.0, 0, 0.1], 180));
  // shelf & plant
  P.box(s, [2.6, 0, -1.5], [3.9, 2.0, -1.1], '#dfe3e7', MAT.paint);
  for (let i = 0; i < 4; i++) P.box(s, [2.6, 0.45 + i * 0.45, -1.1], [3.9, 0.48 + i * 0.45, -1.09], '#c8cdd2', MAT.paint);
  C.tree(s, [-2.6, 0, -1.0], 1.6, { cols: ['#5f7f4f', '#6d8f5a'] });
  P.cyl(s, [-2.6, 0, -1.0], [-2.6, 0.4, -1.0], 0.2, '#e9ecef', MAT.paint, { seg: 16 });
  return C.finish(s, { grade: false, vig: 0.25 });
});

add('quality-inspection', () => {
  const s = C.room({ cam: { pos: [3.0, 2.1, 3.2], target: [0.5, 1.0, -0.6], fov: 50 }, box: { x0: -5, x1: 5, z0: -3, z1: 5, h: 3.4 }, floor: '#cfd3d7', wall: '#f1f3f5' });
  // granite table on supports
  for (const [x, z] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) P.boxC(s, [x, 0.3, z], [0.25, 0.6, 0.25], '#5b6168', MAT.paint);
  P.box(s, [-1.4, 0.6, -0.9], [1.4, 0.9, 0.9], '#3b3e43', MAT.gloss, { seg: [5, 1, 4] });
  // bridge
  const bx = 0.1;
  for (const z of [-0.85, 0.85]) P.box(s, [bx - 0.1, 0.9, z - 0.06], [bx + 0.1, 2.0, z + 0.06], '#d9dde2', MAT.paint);
  P.box(s, [bx - 0.12, 2.0, -0.95], [bx + 0.12, 2.18, 0.95], '#e6e9ec', MAT.paint);
  P.decal(s, { o: [bx - 0.12, 2.06, 0.951], u: [0.24, 0, 0], v: [0, 0.04, 0] }, M.stripe());
  P.box(s, [bx - 0.12, 1.85, 0.1], [bx + 0.12, 2.3, 0.35], '#cfd4d9', MAT.paint);
  P.box(s, [bx - 0.05, 1.25, 0.18], [bx + 0.05, 1.9, 0.27], '#b9bfc5', MAT.chrome);
  P.cyl(s, [bx, 1.25, 0.225], [bx, 1.12, 0.225], 0.03, '#2b2e33', MAT.dark, { seg: 12 });
  P.cyl(s, [bx, 1.12, 0.225], [bx, 1.04, 0.225], 0.006, '#c3c8ce', MAT.chrome, { seg: 8 });
  P.sphere(s, [bx, 1.035, 0.225], 0.012, '#d0342c', MAT.gloss, { seg: 10, rings: 6 });
  // machined part: flange
  P.cyl(s, [0.0, 0.9, 0.0], [0.0, 0.98, 0.0], 0.42, '#b7bdc4', MAT.chrome, { tube: 0.12, seg: 56 });
  P.cyl(s, [0.0, 0.98, 0.0], [0.0, 1.03, 0.0], 0.24, '#c3c8ce', MAT.chrome, { tube: 0.12, seg: 48 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; P.cyl(s, [Math.cos(a) * 0.33, 0.981, Math.sin(a) * 0.33], [Math.cos(a) * 0.33, 0.982, Math.sin(a) * 0.33], 0.025, '#2f3338', MAT.dark, { seg: 12 }); }
  // workstation with monitor
  C.desk(s, P.frame([2.8, 0, -2.0], -20));
  C.monitor(s, P.frame([2.8, 1.05, -2.2], -20), 0.8, 0.48, M.hmiScreen(1));
  return C.finish(s, { grade: false, vig: 0.25 });
});

add('training-session', () => {
  const s = C.room({ cam: { pos: [2.2, 2.0, 5.2], target: [-0.3, 1.3, -2.0], fov: 50 }, box: { x0: -5, x1: 5, z0: -3.5, z1: 6, h: 3.4 } });
  // large display on front wall
  P.box(s, [-1.9, 0.9, -3.49], [1.9, 3.0, -3.42], '#1f2226', MAT.dark);
  P.decal(s, { o: [-1.85, 0.95, -3.415], u: [3.7, 0, 0], v: [0, 2.0, 0] }, C.cadDrawing({ bg: '#f2f4f7', edge: '#20324c', c0: '#2b5c93', c1: '#d6e0eb', ui: false }));
  // presenter + lectern
  C.person(s, [2.6, 0, -2.6], -150, { top: PAL.navy });
  P.boxC(s, [3.2, 0.55, -2.4], [0.6, 1.1, 0.5], '#dfe3e7', MAT.paint);
  P.decal(s, { o: [2.9, 0.85, -2.149], u: [0.6, 0, 0], v: [0, 0.05, 0] }, M.stripe());
  // rows of chairs with seated trainees (seen from behind)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const x = -2.8 + c * 1.1 + (r % 2) * 0.1, z = -1.0 + r * 1.25;
    C.chair(s, P.frame([x, 0, z], 180), { color: '#2b3d57' });
    if ((r * 5 + c) % 3 !== 1) C.seated(s, [x, 0, z - 0.05], 180, { color: '#3d4553', top: (r + c) % 2 ? '#4c5a6e' : '#59657a' });
  }
  return C.finish(s, { grade: false, vig: 0.28 });
});

add('service-maintenance', () => {
  const s = C.shop({ cam: { pos: [1.4, 1.5, 2.2], target: [-0.4, 1.1, -0.6], fov: 46 }, fog: 0.04, hall: { craneX: 6 } });
  // control cabinet with doors open
  const f = P.frame([-0.6, 0, -1.1], 15);
  P.box(s, [-0.8, 0.1, -0.3], [0.8, 2.1, -0.28], '#dfe3e7', MAT.paint, { f });
  P.box(s, [-0.8, 0.1, -0.28], [-0.78, 2.1, 0.3], '#dfe3e7', MAT.paint, { f });
  P.box(s, [0.78, 0.1, -0.28], [0.8, 2.1, 0.3], '#dfe3e7', MAT.paint, { f });
  P.box(s, [-0.8, 2.08, -0.28], [0.8, 2.1, 0.3], '#dfe3e7', MAT.paint, { f });
  P.box(s, [-0.8, 0, -0.3], [0.8, 0.1, 0.3], PAL.char2, MAT.dark, { f });
  P.decal(s, { o: [-0.75, 0.15, -0.2795], u: [1.5, 0, 0], v: [0, 1.9, 0] }, (map) => {
    let svg = `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#e3e6e9"/>`;
    const cols = ['#9aa3ad', '#3b6ea8', '#4fbf7a', '#d9dde1', '#5b6168'];
    for (let r = 0; r < 4; r++) {
      const y = 0.8 - r * 0.22;
      svg += `<path d="${P.quadPath(map, 0.03, y + 0.14, 0.97, y + 0.18)}" fill="#a9b0b8"/>`; // cable duct
      svg += `<path d="${P.quadPath(map, 0.03, y - 0.005, 0.97, y + 0.005)}" fill="#7d848c"/>`; // DIN rail
      let x = 0.05; let i = r;
      while (x < 0.93) { const w = 0.03 + ((i * 7) % 5) * 0.012; svg += `<path d="${P.quadPath(map, x, y - 0.06, Math.min(0.95, x + w), y + 0.1)}" fill="${cols[i % cols.length]}" stroke="#4a5058" stroke-width="0.5"/>`; x += w + 0.008; i += 3; }
    }
    svg += `<path d="${P.quadPath(map, 0.03, 0.03, 0.97, 0.08)}" fill="#c9a24a"/>`;
    return svg;
  }, { f });
  // open doors
  const d1 = P.sub2frame(f, [-0.8, 0, 0.3], 110);
  P.box(s, [0, 0.12, -0.02], [0.8, 2.08, 0.0], '#e6e9ec', MAT.paint, { f: d1 });
  P.decal(s, { o: [0.1, 1.6, 0.001], u: [0.6, 0, 0], v: [0, 0.04, 0] }, M.stripe(), { f: d1 });
  // workbench with laptop & toolkit
  const bf = P.frame([0.9, 0, -0.4], -25);
  P.box(s, [-0.7, 0.85, -0.4], [0.7, 0.9, 0.4], '#5e656d', MAT.steel, { f: bf });
  P.box(s, [-0.68, 0, -0.38], [0.68, 0.85, 0.38], PAL.navy, MAT.paint, { f: bf });
  for (let i = 0; i < 3; i++) P.decal(s, { o: [-0.6, 0.15 + i * 0.25, 0.381], u: [1.2, 0, 0], v: [0, 0.02, 0] }, M.stripe('#2f4b72'), { f: bf });
  const lf = P.sub2frame(bf, [-0.25, 0.9, 0.05], 10);
  P.box(s, [-0.2, 0, -0.14], [0.2, 0.02, 0.14], '#2b2e33', MAT.dark, { f: lf });
  const sf = { o: P.tp(lf, [0, 0.02, -0.14]), X: lf.X, Y: E.norm(E.add(lf.Y, E.mul(lf.Z, -0.25))), Z: E.norm(E.sub(lf.Z, E.mul(lf.Y, -0.25))) };
  P.box(s, [-0.2, 0, -0.01], [0.2, 0.27, 0.0], '#2b2e33', MAT.dark, { f: sf });
  P.decal(s, { o: [-0.185, 0.015, 0.001], u: [0.37, 0, 0], v: [0, 0.24, 0] }, M.hmiScreen(1), { f: sf });
  // toolkit case (open)
  const tf = P.sub2frame(bf, [0.35, 0.9, 0.05], -15);
  P.box(s, [-0.22, 0, -0.15], [0.22, 0.08, 0.15], PAL.orange, MAT.paint, { f: tf, skip: ['top'] });
  P.box(s, [-0.2, 0.02, -0.13], [0.2, 0.075, 0.13], '#2a2d31', MAT.dark, { f: tf, skip: ['bottom'] });
  for (let i = 0; i < 5; i++) P.box(s, [-0.17 + i * 0.07, 0.076, -0.1], [-0.15 + i * 0.07, 0.085, 0.1], i % 2 ? '#c3c8ce' : '#d9a441', MAT.chrome, { f: tf });
  P.box(s, [-0.22, 0.08, -0.17], [0.22, 0.38, -0.15], PAL.orange, MAT.paint, { f: tf });
  // multimeter probe cable into cabinet
  P.line3(s, [P.tp(tf, [0, 0.08, 0]), [0.2, 1.3, -0.6], P.tp(f, [0.2, 1.2, -0.25])], { color: '#c0392b', width: 0.008 });
  return C.finish(s, { vig: 0.32 });
});

add('spare-parts', () => {
  const s = C.shop({ cam: { pos: [1.2, 1.7, 7.5], target: [0, 1.5, -4], fov: 50 }, hall: { craneX: 30, h: 9 }, fog: 0.02, shafts: false });
  const rack = (x, face) => {
    for (let z = -12; z <= 5; z += 2.6) for (const dx of [-0.45, 0.45]) P.boxC(s, [x + dx, 2.0, z], [0.08, 4.0, 0.08], PAL.navy, MAT.paint);
    for (let lvl = 0; lvl < 4; lvl++) {
      const y = 0.15 + lvl * 1.0;
      for (const dx of [-0.45, 0.45]) P.boxC(s, [x + dx, y, -3.5], [0.06, 0.1, 17], PAL.orange, MAT.paint, { seg: [1, 1, 6] });
      P.box(s, [x - 0.45, y + 0.04, -12], [x + 0.45, y + 0.05, 5], '#aab0b7', MAT.steel, { seg: [1, 1, 6] });
      for (let z = -11.6; z < 4.8; z += 0.55) {
        const k = Math.round((z + 20) * 3 + lvl * 7 + x) % 7;
        if (lvl === 0 && k % 3 === 0) { P.cyl(s, [x, y + 0.2, z - 0.2], [x, y + 0.2, z + 0.2], 0.15, '#9aa1a9', MAT.chrome, { tube: 0.07, seg: 20 }); continue; }
        if (lvl === 0 && k % 3 === 1) { P.cyl(s, [x - 0.4, y + 0.12, z], [x + 0.4, y + 0.12, z], 0.07, '#b5bbc2', MAT.chrome, { seg: 16 }); continue; }
        P.box(s, [x - 0.38, y + 0.05, z - 0.24], [x + 0.38, y + 0.36, z + 0.24], k % 2 ? '#3b6ea8' : '#5d7fa6', MAT.matte);
        P.decal(s, { o: [x + face * 0.381, y + 0.18, z + face * 0.1], u: [0, 0, -face * 0.2], v: [0, 0.08, 0] }, M.stripe('#f2f2f2'));
      }
    }
  };
  rack(-1.6, 1); rack(1.6, -1); rack(-4.4, 1); rack(4.4, -1);
  K.floorLine(s, [-0.9, 0, 6], [-0.9, 0, -14], 0.08); K.floorLine(s, [0.9, 0, 6], [0.9, 0, -14], 0.08);
  // trolley with bearings
  P.box(s, [-0.4, 0.3, 2.0], [0.4, 0.35, 2.9], '#5e656d', MAT.steel);
  for (const [x, z] of [[-0.35, 2.05], [0.35, 2.05], [-0.35, 2.85], [0.35, 2.85]]) P.cyl(s, [x, 0.08, z], [x, 0.3, z], 0.02, '#5b6168', MAT.steel, { seg: 6 });
  for (const [x, z] of [[-0.15, 2.25], [0.15, 2.3], [0, 2.65]]) P.cyl(s, [x, 0.35, z], [x, 0.43, z], 0.12, '#c3c8ce', MAT.chrome, { tube: 0.06, seg: 24 });
  return C.finish(s, { vig: 0.32 });
});

add('exhibition-stand', () => {
  const s = C.room({ cam: { pos: [7.5, 3.2, 8.5], target: [0, 1.4, 0], fov: 46 }, box: { x0: -20, x1: 20, z0: -10, z1: 15, h: 9 }, floor: '#8d939a', wall: '#cdd2d8', ceil: '#3a4250', windows: false, amb: 0.6, fogColor: '#c7ced6', fog: 0.02 });
  // booth platform & carpet
  P.box(s, [-5, 0, -4], [5, 0.08, 4], '#3e4652', MAT.matte);
  P.decal(s, { o: [-5, 0.081, 4], u: [10, 0, 0], v: [0, 0, -8] }, (map) => `<path d="${P.pathOf(map, [[0, 0], [1, 0], [1, 0.03], [0, 0.03]])}" fill="${PAL.orange}"/>`, { two: true });
  // back walls (L shape)
  P.box(s, [-5, 0.08, -4], [5, 4.2, -3.8], '#f4f5f6', MAT.matte);
  P.box(s, [-5, 0.08, -3.8], [-4.8, 4.2, 2], '#f4f5f6', MAT.matte);
  P.decal(s, { o: [-4.6, 0.6, -3.799], u: [4.0, 0, 0], v: [0, 3.2, 0] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="${PAL.navy}"/><path d="${P.pathOf(map, [[0, 0.15], [1, 0.45], [1, 0.52], [0, 0.22]])}" fill="${PAL.orange}"/><path d="${P.pathOf(map, [[0, 0.3], [1, 0.75], [1, 0.78], [0, 0.33]])}" fill="#2c5a8f"/>`);
  P.decal(s, { o: [0.6, 1.6, -3.799], u: [3.6, 0, 0], v: [0, 2.0, 0] }, M.hmiScreen(0));
  P.decal(s, { o: [-4.799, 0.6, 1.6], u: [0, 0, -5], v: [0, 0.12, 0] }, M.stripe());
  // overhead truss
  for (const z of [-3.5, 3.5]) P.cyl(s, [-5, 5.0, z], [5, 5.0, z], 0.12, '#c3c8ce', MAT.chrome, { seg: 12 });
  for (const x of [-5, 5]) P.cyl(s, [x, 5.0, -3.5], [x, 5.0, 3.5], 0.12, '#c3c8ce', MAT.chrome, { seg: 12 });
  P.cyl(s, [-4.9, 0.08, 3.5], [-4.9, 5.0, 3.5], 0.12, '#c3c8ce', MAT.chrome, { seg: 12 });
  // spotlights
  for (const [x, z] of [[-2, 3.5], [1, 3.5], [3.5, 3.5], [-2, -3.5], [2, -3.5]]) { P.cyl(s, [x, 4.95, z], [x, 4.6, z - Math.sign(z) * 0.2], 0.09, '#2b2e33', MAT.dark, { seg: 10 }); }
  s.light.points.push({ p: [0, 4.2, 1.5], i: 0.5, r: 3, c: '#fff4e0' });
  // plinth with scaled machine model (portal lathe)
  P.box(s, [-1.6, 0.08, -1.5], [1.8, 0.9, 1.5], '#f4f5f6', MAT.paint);
  P.decal(s, { o: [-1.6, 0.75, 1.501], u: [3.4, 0, 0], v: [0, 0.05, 0] }, M.stripe());
  M2.portalWheelLathe(s, P.frame([0.0, 0.9, 0], -90, 0, 0.42), { rails: false });
  // reception counter
  P.rbox(s, [2.4, 0.08, 1.6], [4.4, 1.1, 2.4], 0.1, PAL.navy, MAT.gloss);
  P.box(s, [2.35, 1.1, 1.55], [4.45, 1.15, 2.45], '#f4f5f6', MAT.paint);
  C.person(s, [3.3, 0.08, 1.1], -160, { top: '#2b3d57' });
  C.person(s, [5.8, 0, 3.4], -120, { top: '#5a6578' });
  C.person(s, [-2.5, 0.08, 2.4], 130, { top: '#4a5568' });
  // neighbouring stands (simple)
  P.box(s, [-16, 0, -9], [-8, 3.5, -8.8], '#dde1e6', MAT.matte); P.box(s, [9, 0, -9], [17, 3.5, -8.8], '#e1dcd3', MAT.matte);
  return C.finish(s, { grade: false, vig: 0.38 });
});

add('csr-community', () => {
  const s = C.outdoor({ cam: { pos: [14, 2.2, 16], target: [0, 2.2, -2], fov: 48 }, lightDir: [0.7, 0.45, 0.4], groundColor: '#8fa66f', skyStops: [[0, '#9fbbd6'], [0.5, '#e7e6dc'], [0.62, '#f2e8d6'], [1, '#f2e8d6']] });
  s.light.color = E.C('#ffe7c4'); s.fog.color = E.C('#efe7da');
  C.building(s, -18, 4, -14, -6, 7.5, { color: '#f1ece2', win: '#7d93a8', floorH: 3.6, bay: 2.8 });
  P.extrude(s, [[-14.6, 7.5], [-5.4, 7.5], [-10, 9.2]], -18.5, 4.5, '#b9644a', MAT.matte, { axes: 'zy', segW: 4 });
  // paved path
  P.decal(s, { o: [-2, 0.01, 18], u: [3, 0, 0], v: [-4, 0, -24] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#cfc6b6"/>`, { two: true, noHost: true, layer: 1 });
  // saplings with stakes in rows
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const x = 4 + i * 2.2, z = 2 + j * 3;
    P.cyl(s, [x, 0, z], [x, 1.0, z], 0.02, '#8b6b4a', MAT.matte, { seg: 6 });
    P.sphere(s, [x, 1.0, z], 0.32, j ? '#6f9a52' : '#7aa85b', MAT.matte, { seg: 10, rings: 6 });
    P.cyl(s, [x, 0, z], [x, 0.04, z], 0.35, '#7a5e43', MAT.matte, { seg: 12 });
    P.cyl(s, [x + 0.12, 0, z], [x + 0.12, 1.3, z], 0.015, '#d4c4a0', MAT.matte, { seg: 5 });
  }
  for (const [x, z, h] of [[-24, -4, 9], [10, -10, 8], [18, -4, 10], [-22, 8, 7], [24, 6, 9]]) C.tree(s, [x, 0, z], h);
  // watering can (simple)
  P.cyl(s, [8.5, 0, 6.5], [8.5, 0.35, 6.5], 0.15, '#3b8a6e', MAT.gloss, { seg: 14 });
  return C.finish(s, { grade: false, vig: 0.25 });
});

add('life-at-hyt', () => {
  const s = C.room({ cam: { pos: [6, 2.4, 9], target: [0, 1.8, -2], fov: 50 }, box: { x0: -12, x1: 12, z0: -6, z1: 12, h: 6 }, floor: '#b9a993', wall: '#efe9e0', windows: false, lightColor: '#fff0dc', amb: 0.62, fogColor: '#efe6da' });
  // stage + backdrop
  P.box(s, [-6, 0, -6], [6, 0.6, -3.5], '#2b2e33', MAT.dark);
  P.box(s, [-6, 0.6, -6], [6, 4.8, -5.8], PAL.navy, MAT.matte);
  P.decal(s, { o: [-6, 0.6, -5.799], u: [12, 0, 0], v: [0, 4.2, 0] }, (map) => {
    let svg = '';
    for (let i = 0; i < 4; i++) svg += `<path d="${P.pathOf(map, [[0, 0.2 + i * 0.12], [0.5, 0.35 + i * 0.1], [1, 0.25 + i * 0.13], [1, 0.28 + i * 0.13], [0.5, 0.38 + i * 0.1], [0, 0.23 + i * 0.12]])}" fill="${i === 1 ? '#F58220' : '#2c5a8f'}" fill-opacity="${i === 1 ? 0.95 : 0.6}"/>`;
    return svg;
  });
  // hanging banners (no text)
  for (const x of [-9, -7.5, 7.5, 9]) { P.box(s, [x - 0.5, 2.0, -5.9], [x + 0.5, 5.2, -5.85], x < 0 ? PAL.navy : '#f4f5f6', MAT.matte); P.decal(s, { o: [x - 0.5, 2.3, -5.849], u: [1, 0, 0], v: [0, 0.12, 0] }, M.stripe()); }
  // string lights
  for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([-11 + 22 * t, 5.4 - 0.6 * Math.sin(Math.PI * t), -4 + k * 5]); } P.line3(s, pts, { color: '#3a3020', width: 0.01 }); s.raw.post.push((sc) => pts.filter((_, i) => i % 2 === 0).map((p) => { const q = sc.cam.project(p); return `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="5" fill="#ffd28a" fill-opacity="0.9"/><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="16" fill="#ffcf7a" fill-opacity="0.25"/>`; }).join('')); }
  // round tables
  for (const [x, z] of [[-6, 3], [5, 2.5], [-1, 6.5]]) { P.cyl(s, [x, 0.72, z], [x, 0.78, z], 0.8, '#fbfaf7', MAT.paint, { seg: 28 }); P.cyl(s, [x, 0, z], [x, 0.72, z], 0.75, '#f3f0ea', MAT.paint, { seg: 28, r1: 0.8 }); }
  // groups of people (silhouettes)
  const ppl = [[-3, 0.5, 30], [-2.4, 1.0, -150], [-3.5, 1.2, 80], [1.5, 0.0, -20], [2.2, 0.6, -170], [2.8, -0.2, 110], [-0.5, -1.8, 0], [0.3, -2.0, 160], [4.0, 4.6, -90], [-7.5, 5.5, 45], [-6.8, 6.2, -120], [7.8, 0.2, -60]];
  ppl.forEach(([x, z, y], i) => C.person(s, [x, 0, z], y, { top: ['#2b3d57', '#5a6578', '#7a4f3a', '#3d5a4a', '#6b5b7a'][i % 5], color: '#3a3f4a', h: 1.62 + (i % 4) * 0.06 }));
  C.person(s, [0.5, 0.6, -4.6], 180, { top: PAL.navy });
  return C.finish(s, { grade: false, vig: 0.35 });
});

add('corporate-office', () => {
  const s = C.outdoor({ cam: { pos: [26, 1.7, 24], target: [0, 6, -2], fov: 50 }, lightDir: [0.55, 0.7, 0.55], groundColor: '#8fa66f' });
  // plaza paving
  P.decal(s, { o: [-30, 0.01, 12], u: [60, 0, 0], v: [0, 0, -16] }, (map) => `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#c9c4bb"/>`, { two: true, noHost: true, layer: 1 });
  // main block: glass curtain wall
  const x0 = -22, x1 = 14, z0 = -10, z1 = -2, h = 16;
  P.box(s, [x0, 0, z0], [x1, h, z1], '#5f7d9c', MAT.glass, { seg: [4, 2, 1] });
  const glass = (w, hh) => (map) => {
    let svg = `<defs><linearGradient id="gl${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c3dd"/><stop offset="0.6" stop-color="#5f7f9f"/><stop offset="1" stop-color="#3f5a77"/></linearGradient></defs>`;
    svg += `<path d="${P.quadPath(map, 0, 0, 1, 1)}" fill="#55728f"/>`;
    svg += `<path d="${P.pathOf(map, [[0.05, 1], [0.35, 1], [0.15, 0], [0, 0], [0, 0.4]])}" fill="#ffffff" fill-opacity="0.12"/>`;
    let m = ''; const nc = Math.round(w / 1.5), nr = Math.round(hh / 4);
    for (let i = 1; i < nc; i++) m += P.quadPath(map, i / nc - 0.002, 0, i / nc + 0.002, 1);
    for (let j = 1; j < nr; j++) m += P.quadPath(map, 0, j / nr - 0.006, 1, j / nr + 0.006);
    return svg + `<path d="${m}" fill="#dfe6ee"/>`;
  };
  P.decal(s, { o: [x0, 0, z1 + 0.02], u: [x1 - x0, 0, 0], v: [0, h, 0] }, glass(x1 - x0, h), { split: 4 });
  P.decal(s, { o: [x1 + 0.02, 0, z1], u: [0, 0, z0 - z1], v: [0, h, 0] }, glass(z1 - z0, h));
  // white frame / fascia & navy fins
  P.box(s, [x0 - 0.4, h, z0 - 0.4], [x1 + 0.4, h + 1.2, z1 + 0.4], '#f2f3f4', MAT.paint, { seg: [4, 1, 1] });
  P.box(s, [x0 - 0.4, 0, z1], [x0, h, z1 + 0.4], '#f2f3f4', MAT.paint);
  for (let x = x0 + 3; x < x1; x += 3) P.box(s, [x - 0.12, 0.5, z1 + 0.02], [x + 0.12, h, z1 + 0.7], PAL.navy, MAT.paint);
  P.decal(s, { o: [x0 - 0.4, h + 0.3, z1 + 0.41], u: [x1 - x0 + 0.8, 0, 0], v: [0, 0.12, 0] }, M.stripe());
  // lower wing (white) with entrance canopy
  P.box(s, [x1 - 2, 0, z1], [x1 + 10, 6, z1 + 8], '#f2f3f4', MAT.paint, { seg: [2, 1, 2] });
  P.decal(s, { o: [x1 - 1, 0.2, z1 + 8.02], u: [10, 0, 0], v: [0, 4.5, 0] }, glass(10, 4.5));
  P.box(s, [x1 - 1, 4.4, z1 + 8], [x1 + 9, 4.7, z1 + 11], '#f2f3f4', MAT.paint);
  for (const x of [x1, x1 + 8]) P.cyl(s, [x, 0, z1 + 10.6], [x, 4.4, z1 + 10.6], 0.12, '#c3c8ce', MAT.chrome, { seg: 12 });
  // landscaping
  for (const [x, z, hh] of [[-26, 6, 8], [-12, 9, 6], [2, 10, 7], [30, 4, 9], [32, -8, 10], [-30, -6, 9]]) C.tree(s, [x, 0, z], hh);
  for (let x = -20; x < 12; x += 1.4) P.sphere(s, [x, 0.3, z1 + 1.4], 0.45, '#6d8f5a', MAT.matte, { seg: 10, rings: 5 });
  return C.finish(s, { grade: false, vig: 0.25 });
});

module.exports = scenes;

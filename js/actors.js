'use strict';
/* ===== MAD CITY 3D — actors: humans, cars, traffic, damage/explosions ===== */

// ---------- humans ----------
const humanGeoCache = new Map();
const HAIR = [0x1b1b1b, 0x3b2a1a, 0x7a5530, 0xc9a14a, 0x777777];
function shade(c, f) { const k = new THREE.Color(c); k.multiplyScalar(f); return k.getHex(); }
function buildHumanGeos(style, shirt, pants, skin, hatC, gun, v) {
  const hairC = HAIR[v % 5], longSleeve = style !== 'civ' || v % 2 === 0;
  const shoeC = style === 'civ' ? [0x222222, 0x5a3a22, 0xeeeeee][v % 3] : 0x111111;
  const sleeveFore = longSleeve ? shirt : skin, hand = style === 'crook' ? 0x111111 : skin;
  const T = [
    cyl(0.19, 0.165, 0.48, 0, 0.27, 0, shirt, 1, 0.62, 10), cyl(0.17, 0.17, 0.2, 0, 0.0, 0, pants, 1, 0.68, 10),
    sph(0.066, -0.2, 0.5, 0, shirt), sph(0.066, 0.2, 0.5, 0, shirt), cyl(0.05, 0.056, 0.1, 0, 0.6, 0, skin),
    sph(0.115, 0, 0.745, 0, skin, 1, 1.15, 1.05, 10), sph(0.025, -0.118, 0.74, 0, skin), sph(0.025, 0.118, 0.74, 0, skin),
    sph(0.014, -0.042, 0.765, 0.108, 0x111111, 1, 1, 1, 6), sph(0.014, 0.042, 0.765, 0.108, 0x111111, 1, 1, 1, 6),
    bxp(0.02, 0.03, 0.025, 0, 0.735, 0.123, shade(skin, 0.88)), bxp(0.045, 0.008, 0.01, 0, 0.695, 0.11, 0x7a3a3a)
  ];
  const cap = (col, visor) => { T.push(sph(0.126, 0, 0.785, -0.004, col, 1, 0.72, 1.06, 10), bxp(0.2, 0.012, 0.11, 0, 0.757, 0.15, visor ?? col)); };
  if (style === 'cop') {
    cap(hatC || 0x0e1b44, 0x080808); T.push(bxp(0.05, 0.055, 0.012, 0.075, 0.42, 0.12, 0xd4af37), bxp(0.034, 0.2, 0.01, 0, 0.3, 0.121, 0x111111), cyl(0.172, 0.172, 0.05, 0, 0.1, 0, 0x111111, 1, 0.68, 10),
      bxp(0.07, 0.15, 0.1, 0.19, 0.0, 0.02, 0x111111), bxp(0.045, 0.07, 0.03, -0.17, 0.5, 0.08, 0x222222), bxp(0.13, 0.034, 0.02, 0, 0.77, 0.112, 0x0a0a0a));
  } else if (style === 'guard') {
    cap(hatC || 0x232b22, 0x111111); T.push(cyl(0.172, 0.172, 0.05, 0, 0.1, 0, 0x111111, 1, 0.68, 10), bxp(0.05, 0.055, 0.012, 0.075, 0.42, 0.12, 0xb0b0b0), bxp(0.06, 0.1, 0.05, -0.19, 0.02, 0, 0x888888));
  } else if (style === 'crook') {
    T.push(sph(0.123, 0, 0.745, 0, 0x111111, 1, 1.15, 1.06, 10), bxp(0.13, 0.034, 0.02, 0, 0.767, 0.116, skin), sph(0.014, -0.042, 0.767, 0.12, 0xffffff, 1, 1, 1, 6), sph(0.014, 0.042, 0.767, 0.12, 0xffffff, 1, 1, 1, 6));
  } else if (style === 'thug') {
    cap(hatC || 0x8b0000, 0x6b0000); T.push(sph(0.1, 0, 0.55, -0.12, shirt, 1, 0.9, 0.9)); // hood
  } else if (style === 'prisoner') {
    T.push(sph(0.122, 0, 0.78, -0.01, 0x2b2b2b, 1, 0.8, 1.04, 10), bxp(0.12, 0.08, 0.01, 0, 0.35, 0.121, 0xffffff), bxp(0.08, 0.03, 0.012, 0, 0.35, 0.123, 0x111111));
  } else {
    const hs = v % 4;
    if (hs === 0 || hs === 1) T.push(sph(0.122, 0, 0.778, -0.012, hairC, 1, 0.85, 1.06, 10));
    if (hs === 1) T.push(sph(0.12, 0, 0.69, -0.06, hairC, 1, 1.5, 0.72, 10));
    if (hs === 3) cap(pick([0x2a6bd6, 0xc0392b, 0x222222, 0xf1c40f]), undefined);
  }
  const armL = [cyl(0.052, 0.044, 0.34, 0, -0.17, 0, shirt, 1, 1, 8), cyl(0.044, 0.037, 0.27, 0, -0.43, 0, sleeveFore, 1, 1, 8), sph(0.042, 0, -0.59, 0, hand, 1, 1, 1, 7)];
  const armR = [armL[0], armL[1], armL[2]];
  if (gun) armR.push(bxp(0.032, 0.2, 0.05, 0, -0.71, 0.0, 0x151515), bxp(0.03, 0.1, 0.04, 0, -0.64, -0.055, 0x151515));
  const legU = [cyl(0.095, 0.078, 0.46, 0, -0.23, 0, pants, 1, 1, 8)];
  const legD = [cyl(0.072, 0.056, 0.4, 0, -0.2, 0, pants, 1, 1, 8), bxp(0.115, 0.075, 0.27, 0, -0.41, 0.06, shoeC)];
  return { torso: mergeParts(T), armL: mergeParts(armL), armR: mergeParts(armR), legU: mergeParts(legU), legD: mergeParts(legD) };
}
function makeHuman(shirt, pants, skin, hat, gun, style = 'civ') {
  const v = rint(0, 5), key = [style, shirt, pants, skin, hat, gun, v].join('|');
  let G = humanGeoCache.get(key); if (!G) { G = buildHumanGeos(style, shirt, pants, skin, hat, !!gun, v); humanGeoCache.set(key, G); }
  const g = new THREE.Group();
  const mesh = geo => { const m = new THREE.Mesh(geo, vcMat); m.castShadow = true; return m; };
  const torso = new THREE.Group(); torso.position.y = 0.92; torso.add(mesh(G.torso)); g.add(torso);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.235, 0.5, 0); armR.position.set(0.235, 0.5, 0);
  armL.add(mesh(G.armL)); armR.add(mesh(G.armR)); torso.add(armL, armR);
  const leg = (x) => { const hip = new THREE.Group(); hip.position.set(x, 0.92, 0); hip.add(mesh(G.legU)); const knee = new THREE.Group(); knee.position.y = -0.46; knee.add(mesh(G.legD)); hip.add(knee); g.add(hip); return [hip, knee]; };
  const [legL, kneeL] = leg(-0.1), [legR, kneeR] = leg(0.1);
  g.add(makeBlob(1.1, 1.1));
  return { group: g, parts: { legL, legR, kneeL, kneeR, armL, armR, torso }, hit: [] };
}
function animHuman(e, speed, dt, aim) {
  const p = e.parts; e.phase += dt * speed * 1.5;
  const k = Math.min(1, speed / 5), run = clamp((speed - 5.5) / 4, 0, 1), sw = Math.sin(e.phase) * k * (0.7 + 0.4 * run);
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
  p.kneeL.rotation.x = Math.max(0, -sw) * (1.0 + run * 0.9); p.kneeR.rotation.x = Math.max(0, sw) * (1.0 + run * 0.9);
  p.torso.position.y = 0.92 + Math.abs(Math.cos(e.phase)) * 0.035 * k; p.torso.rotation.x = 0.04 * k + 0.14 * run;
  p.armL.rotation.z = p.armR.rotation.z = 0;
  if (e.up) { p.armL.rotation.x = p.armR.rotation.x = -2.9; p.armL.rotation.z = -0.25; p.armR.rotation.z = 0.25; }
  else if (aim) { p.armR.rotation.x = -1.5; p.armL.rotation.x = -1.35; p.armL.rotation.z = 0.12; }
  else { p.armL.rotation.x = -sw * 1.0; p.armR.rotation.x = sw * 1.0; }
}

// ---------- cars ----------
const CAR_STATS = {
  sedan: { max: 38, acc: 15, hp: 100 }, taxi: { max: 38, acc: 15, hp: 100 }, muscle: { max: 58, acc: 27, hp: 120 },
  sport: { max: 66, acc: 28, hp: 95 }, super: { max: 88, acc: 36, hp: 90 }, truck: { max: 28, acc: 9, hp: 180 }, police: { max: 52, acc: 23, hp: 140 }
};
const cars = [];
const CAR_COLORS = [0xc0392b, 0x2e86de, 0x27ae60, 0xf1c40f, 0x7f8c8d, 0x34495e, 0xe67e22, 0x8e44ad, 0xecf0f1, 0x1a1a1a];
const burntMat = new THREE.MeshLambertMaterial({ color: 0x151515 });

const wheelGeo = mergeParts([cyl(0.39, 0.39, 0.26, 0, 0, 0, 0x151515, 1, 1, 16, 0, Math.PI / 2), cyl(0.25, 0.25, 0.28, 0, 0, 0, 0xcfcfcf, 1, 1, 12, 0, Math.PI / 2), cyl(0.07, 0.07, 0.3, 0, 0, 0, 0x333333, 1, 1, 8, 0, Math.PI / 2), bxp(0.28, 0.5, 0.06, 0, 0, 0, 0x9a9a9a)]);
const PROFILES = {
  sedan: { L: 4.5, wid: 1.85, body: [[0, .42], [1, .42], [1, .80], [.96, .92], [.64, .98], [.52, 1.42], [.2, 1.44], [.08, 1.0], [0, .95]], glass: [[[.60, 1.0], [.51, 1.38], [.37, 1.40], [.37, 1.0]], [[.32, 1.0], [.32, 1.40], [.21, 1.40], [.11, 1.02]]], belt: 1.0 },
  sport: { L: 4.4, wid: 1.9, body: [[0, .38], [1, .38], [1, .62], [.9, .75], [.66, .82], [.5, 1.18], [.32, 1.22], [.1, .95], [0, .9]], glass: [[[.62, .84], [.52, 1.14], [.40, 1.17], [.40, .84]], [[.36, .84], [.34, 1.16], [.2, 1.0], [.2, .86]]], belt: 0.84 },
  super: { L: 4.6, wid: 2.0, body: [[0, .35], [1, .35], [1, .52], [.88, .66], [.6, .74], [.46, 1.08], [.28, 1.1], [.05, .8], [0, .75]], glass: [[[.58, .76], [.47, 1.04], [.34, 1.07], [.34, .76]], [[.30, .76], [.28, 1.06], [.12, .84], [.14, .78]]], belt: 0.76 },
  truck: { L: 5.4, wid: 2.0, body: [[0, .55], [1, .55], [1, 1.0], [.93, 1.12], [.66, 1.15], [.56, 1.65], [.34, 1.67], [.32, 1.18], [0, 1.18]], glass: [[[.62, 1.2], [.55, 1.6], [.38, 1.62], [.38, 1.2]]], belt: 1.18 }
};
const PROF_OF = { sedan: 'sedan', taxi: 'sedan', police: 'sedan', muscle: 'sedan', sport: 'sport', super: 'super', truck: 'truck' };
const polyCache = new Map();
function extrudePoly(pts, L, depth, bevel) {
  const sh = new THREE.Shape(); pts.forEach(([u, y], i) => { const z = (u - 0.5) * L; if (i) sh.lineTo(z, y); else sh.moveTo(z, y); });
  const g = new THREE.ExtrudeGeometry(sh, bevel ? { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 2, curveSegments: 1 } : { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0); return g;
}
function cachedPoly(key, pts, L, depth, bevel) { let g = polyCache.get(key); if (!g) { g = extrudePoly(pts, L, depth, bevel); polyCache.set(key, g); } return g; }

function makeCarMesh(kind, color) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const pk = PROF_OF[kind], pr = PROFILES[pk], L = kind === 'muscle' ? 4.8 : pr.L, wid = kind === 'muscle' ? 1.95 : pr.wid;
  const bodyC = kind === 'police' ? 0xf2f2f2 : kind === 'taxi' ? 0xf5c518 : color, glassC = 0x0f1a26;
  const parts = [{ g: cachedPoly(kind + 'b', pr.body, L, wid - 0.16, true), m: new THREE.Matrix4(), c: bodyC }];
  pr.glass.forEach((poly, i) => parts.push({ g: cachedPoly(kind + 'g' + i, poly, L, wid + 0.04, false), m: new THREE.Matrix4(), c: glassC }));
  const hw = wid / 2, front = L / 2, low = pr.body[0][1];
  parts.push(bxp(wid + 0.04, 0.22, 0.28, 0, low + 0.12, front - 0.05, 0x2a2a2a), bxp(wid + 0.04, 0.22, 0.28, 0, low + 0.12, -front + 0.05, 0x2a2a2a),
    bxp(wid * 0.55, 0.14, 0.04, 0, low + 0.32, front + 0.03, 0x111111),
    bxp(0.42, 0.13, 0.08, -hw * 0.68, low + 0.38, front - 0.02, 0xfff4c8), bxp(0.42, 0.13, 0.08, hw * 0.68, low + 0.38, front - 0.02, 0xfff4c8),
    bxp(0.4, 0.12, 0.07, -hw * 0.68, low + 0.4, -front + 0.02, 0xc01010), bxp(0.4, 0.12, 0.07, hw * 0.68, low + 0.4, -front + 0.02, 0xc01010),
    bxp(0.42, 0.12, 0.02, 0, low + 0.14, front + 0.1, 0xf4f4f4), bxp(0.42, 0.12, 0.02, 0, low + 0.14, -front - 0.1, 0xf4f4f4),
    bxp(0.1, 0.07, 0.14, -hw - 0.07, pr.belt + 0.02, (0.6 - 0.5) * L, shade(bodyC, 0.7)), bxp(0.1, 0.07, 0.14, hw + 0.07, pr.belt + 0.02, (0.6 - 0.5) * L, shade(bodyC, 0.7)));
  for (const sx of [-1, 1]) for (const u of [0.36, 0.63]) parts.push(bxp(0.014, pr.belt - low - 0.14, 0.014, sx * (hw + 0.004), (low + pr.belt) / 2 + 0.02, (u - 0.5) * L, shade(bodyC, 0.55)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(cyl(0.47, 0.47, 0.05, sx * (hw - 0.01), 0.43, sz * L * 0.31, 0x0c0c0c, 1, 1, 14, 0, Math.PI / 2));
  if (kind === 'sport' || kind === 'super') parts.push(bxp(wid - 0.15, 0.06, 0.45, 0, pr.belt + 0.42, -front + 0.25, 0x111111), bxp(0.06, 0.2, 0.1, -hw * 0.6, pr.belt + 0.3, -front + 0.3, 0x111111), bxp(0.06, 0.2, 0.1, hw * 0.6, pr.belt + 0.3, -front + 0.3, 0x111111));
  if (kind === 'muscle') parts.push(bxp(0.7, 0.07, 0.9, 0, 1.03, front * 0.45, 0x111111), bxp(0.04, 0.0 + 0.45, L * 0.7, 0, 1.0, 0, 0x1a1a1a)); // hood scoop + stripe
  if (kind === 'truck') parts.push(bxp(wid - 0.2, 0.05, L * 0.3, 0, 1.2, -front + L * 0.16, 0x222222), bxp(0.1, 0.5, 0.1, -hw + 0.1, 1.4, -front + 0.2, bodyC));
  if (kind === 'police') {
    for (const sx of [-1, 1]) parts.push(bxp(0.012, 0.36, 2.1, sx * (hw + 0.006), 0.8, 0.1, 0x1a1a1a), bxp(0.012, 0.1, 1.2, sx * (hw + 0.006), 0.8, 0.1, 0x2050c0));
    parts.push(bxp(1.3, 0.1, 0.34, 0, 1.46, 0.14, 0x1a1a1a));
  }
  if (kind === 'taxi') parts.push(bxp(0.55, 0.18, 0.26, 0, 1.52, 0.14, 0xfff6a0));
  const bm = new THREE.Mesh(mergeParts(parts), carMat); bm.castShadow = true; bm.receiveShadow = true; body.add(bm);
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sx * (hw - 0.05), 0.4, sz * L * 0.31); g.add(pv);
    const w = new THREE.Mesh(wheelGeo, vcMat); w.castShadow = true; pv.add(w); wheels.push({ pv, w, front: sz > 0 });
  }
  let lights = null;
  if (kind === 'police') {
    const r = new THREE.MeshBasicMaterial({ color: 0xff2020 }), b = new THREE.MeshBasicMaterial({ color: 0x2060ff }), bg = new THREE.BoxGeometry(0.62, 0.14, 0.3);
    const m1 = new THREE.Mesh(bg, r); m1.position.set(-0.34, 1.56, 0.14); const m2 = new THREE.Mesh(bg, b); m2.position.set(0.34, 1.56, 0.14); body.add(m1, m2); lights = [r, b];
  }
  const beam = new THREE.Mesh(carBeamGeo, new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(0, 0.8, front); g.add(beam);
  g.add(makeBlob(wid * 1.5, L * 1.25));
  scene.add(g);
  return { g, body, wheels, lights, beam, len: L };
}
const carBeamGeo = new THREE.ConeGeometry(2.4, 12, 12, 1, true).translate(0, -6, 0).rotateX(-Math.PI / 2);

function newCar(kind, x, z, h, mode, color) {
  const col = color ?? pick(CAR_COLORS), mesh = makeCarMesh(kind, col), st = CAR_STATS[kind];
  const c = {
    kind, x, z, h, speed: 0, mode, mesh: mesh.g, body: mesh.body, wheels: mesh.wheels, lights: mesh.lights, beam: mesh.beam,
    stun: 0, hitCool: 0, rev: 0, stuck: 0, cruise: rnd(11, 18), axis: 'x', dir: 1, road: 0, next: 0, flash: rnd(0, 1),
    hp: st.hp, maxHp: st.hp, wreck: false, burn: 0, smokeT: 0, spin: 0, prevSpeed: 0, prevH: h, pitch: 0, roll: 0, steerVis: 0, hits: 0, getaway: false, siren: false
  };
  mesh.g.position.set(x, 0, z); mesh.g.rotation.y = h;
  cars.push(c); return c;
}
function removeCar(c) { scene.remove(c.mesh); const i = cars.indexOf(c); if (i >= 0) cars.splice(i, 1); }
const carForward = c => [Math.sin(c.h), Math.cos(c.h)];
const carRight = c => [-Math.cos(c.h), Math.sin(c.h)];

function damageCar(c, n, byPlayer) {
  if (c.wreck || n <= 0) return;
  c.hp -= n; if (c.hp <= 0) explodeCar(c, byPlayer);
}
function explodeCar(c, byPlayer) {
  if (c.wreck) return;
  c.wreck = true; c.hp = 0; c.burn = 18; c.speed = 0; c.siren = false;
  if (c.mode === 'chase' || c.mode === 'traffic') c.mode = 'idle';
  explosionFx(c.x, c.z);
  if (Math.hypot(c.x - P.x, c.z - P.z) < 200) sfx.boom();
  c.mesh.traverse(m => { if (m.isMesh && (m.material === carMat || m.material === vcMat)) m.material = burntMat; });
  c.beam.visible = false;
  if (P.car === c) { const [rx, rz] = carRight(c); exitCar(); P.x = c.x + rx * 4; P.z = c.z + rz * 4; hurt(55); }
  else if (!P.car && Math.hypot(c.x - P.x, c.z - P.z) < 8) hurt(70 * (1 - Math.hypot(c.x - P.x, c.z - P.z) / 9));
  for (const list of [peds, cops, crooks, guards]) for (const e of list) {
    if (e.dead || Math.hypot(e.x - c.x, e.z - c.z) > 7.5) continue;
    killHuman(e);
  }
  for (const o of cars) if (o !== c && !o.wreck && Math.hypot(o.x - c.x, o.z - c.z) < 7) damageCar(o, 45, byPlayer);
  if (c.getaway && c.crook) crookLeaveCar(c.crook, c);
  if (byPlayer && state.team === 'crim' && c.kind === 'police') setWanted(state.wanted + 1, 'تدمير سيارة شرطة');
  if (byPlayer && state.team === 'crim' && c.mode !== 'chase' && c.kind !== 'police' && Math.random() < 0.5) setWanted(Math.max(state.wanted, 1), 'تفجير سيارة');
}

// ---------- traffic on the road grid ----------
const baseH = (axis, dir) => axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
const laneOff = (axis, dir) => axis === 'x' ? (dir > 0 ? 4.4 : -4.4) : (dir > 0 ? -4.4 : 4.4);
function nextCrossing(pos, dir) { const k = pos / S + N / 2; return dir > 0 ? Math.floor(k + 1e-6) + 1 : Math.ceil(k - 1e-6) - 1; }

function spawnTraffic(farFrom) {
  for (let tries = 0; tries < 14; tries++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', dir = Math.random() < 0.5 ? 1 : -1, road = rint(0, N);
    const nxt = rint(0, N); if (nxt - dir < 0 || nxt - dir > N) continue;
    const along = rc(nxt) - dir * rnd(14, S - 14), lane = rc(road) + laneOff(axis, dir);
    const x = axis === 'x' ? along : lane, z = axis === 'x' ? lane : along;
    if (farFrom && Math.hypot(x - farFrom.x, z - farFrom.z) < 90) continue;
    const r = Math.random(), kind = r < 0.1 ? 'police' : r < 0.2 ? 'truck' : r < 0.3 ? 'sport' : r < 0.36 ? 'muscle' : r < 0.5 ? 'taxi' : 'sedan';
    const c = newCar(kind, x, z, baseH(axis, dir), 'traffic');
    Object.assign(c, { axis, dir, road, next: nxt, speed: c.cruise });
    if (kind === 'sport' || kind === 'muscle') c.cruise = rnd(16, 24);
    return c;
  }
}
function spawnParked(farFrom) {
  for (let tries = 0; tries < 14; tries++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', dir = Math.random() < 0.5 ? 1 : -1, road = rint(0, N), seg = rint(0, N - 1);
    const along = rc(seg) + S / 2 + rnd(-S / 2 + 18, S / 2 - 18), off = dir * 7.4;
    const x = axis === 'x' ? along : rc(road) + off, z = axis === 'x' ? rc(road) + off : along;
    if (farFrom && Math.hypot(x - farFrom.x, z - farFrom.z) < 40) continue;
    if (cars.some(o => Math.hypot(o.x - x, o.z - z) < 6)) continue;
    const r = Math.random(), kind = r < 0.12 ? 'sport' : r < 0.2 ? 'muscle' : r < 0.3 ? 'truck' : 'sedan';
    return newCar(kind, x, z, baseH(axis, -dir), 'parked');
  }
}
function joinGrid(c, axis, dir) { // put a car onto the traffic grid at its current position
  const pos = axis === 'x' ? c.x : c.z, perp = axis === 'x' ? c.z : c.x;
  let road = Math.round(perp / S + N / 2); road = clamp(road, 0, N);
  let nxt = nextCrossing(pos, dir); if (nxt < 0 || nxt > N) { dir = -dir; nxt = nextCrossing(pos, dir); }
  Object.assign(c, { axis, dir, road, next: clamp(nxt, 0, N), mode: 'traffic' });
}

function updateTraffic(c, dt) {
  const st = CAR_STATS[c.kind];
  const ctrl = c.axis === 'x' ? c.x : c.z, tgtC = rc(c.next), remain = (tgtC - ctrl) * c.dir;
  let target = Math.min(c.cruise, st.max);
  if (remain < 14) target = Math.min(target, 9);
  if (remain > 9 && remain < 34) { const sg = signalState(c.axis); if (sg === 'r' || (sg === 'y' && remain > 17)) target = Math.min(target, Math.max(0, (remain - 10.5) * 0.8)); }
  if (c.stun > 0) { c.stun -= dt; target = 0; }
  const [fx, fz] = carForward(c), [rx, rz] = carRight(c);
  for (const o of cars) {
    if (o === c) continue;
    const ox = o.x - c.x, oz = o.z - c.z; if (ox * ox + oz * oz > 400) continue;
    const along = ox * fx + oz * fz, lat = ox * rx + oz * rz;
    if (along > 0 && along < 15 && Math.abs(lat) < 2.8) target = Math.min(target, Math.max(0, (along - 5) * 1.2));
  }
  if (!P.car) { const ox = P.x - c.x, oz = P.z - c.z, along = ox * fx + oz * fz, lat = ox * rx + oz * rz; if (along > 0 && along < 14 && Math.abs(lat) < 2.4) target = Math.min(target, Math.max(0, (along - 4) * 1.2)); }
  c.speed += clamp(target - c.speed, -22 * dt, st.acc * 0.7 * dt);
  const move = c.speed * dt;
  if (c.axis === 'x') c.x += c.dir * move; else c.z += c.dir * move;
  const lane = rc(c.road) + laneOff(c.axis, c.dir), k = Math.min(1, 3.2 * dt);
  if (c.axis === 'x') c.z += (lane - c.z) * k; else c.x += (lane - c.x) * k;
  c.h += angDiff(c.h, baseH(c.axis, c.dir)) * Math.min(1, 5 * dt);
  if ((((c.axis === 'x' ? c.x : c.z) - tgtC) * c.dir) >= 0) {
    const opts = [];
    if (c.next + c.dir >= 0 && c.next + c.dir <= N) opts.push('s', 's');
    if (c.road - 1 >= 0) opts.push('a');
    if (c.road + 1 <= N) opts.push('b');
    const ch = pick(opts) || 's';
    if (ch === 's') c.next += c.dir;
    else { const nd = ch === 'a' ? -1 : 1, nroad = c.next, nnext = c.road + nd; c.axis = c.axis === 'x' ? 'z' : 'x'; c.dir = nd; c.road = nroad; c.next = nnext; }
  }
}

function updateIdleCar(c, dt) {
  if (Math.abs(c.speed) > 0.1) {
    c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 9 * dt);
    const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt; carWorldCollide(c);
  }
}
function carWorldCollide(c) {
  let hitAny = false; const [fx, fz] = carForward(c);
  for (const off of [1.5, -1.5]) {
    const px = c.x + fx * off, pz = c.z + fz * off, r = resolveCircle(px, pz, 1.25);
    if (r.hit) { c.x += r.x - px; c.z += r.z - pz; hitAny = true; }
  }
  if (hitAny && c.hitCool <= 0) {
    c.hitCool = 0.3; const v = Math.abs(c.speed);
    if (v > 9) { damageCar(c, (v - 9) * 2.4, c === P.car); if (c === P.car) sfx.crash(); }
    c.speed *= -0.3;
  }
  return hitAny;
}

function drivePlayerCar(c, dt) {
  const st = CAR_STATS[c.kind];
  const thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  if (thr > 0) { if (c.speed < 0) c.speed += st.acc * 2.5 * dt; else c.speed += st.acc * (1 - Math.pow(clamp(c.speed / st.max, 0, 1), 2)) * dt; }
  else if (thr < 0) { if (c.speed > 0.5) c.speed -= st.acc * 2.2 * dt; else c.speed = Math.max(c.speed - st.acc * 0.6 * dt, -st.max * 0.35); }
  else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (3 + Math.abs(c.speed) * 0.12) * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 32 * dt);
  const steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
  c.steerVis += (steer * 0.5 - c.steerVis) * Math.min(1, 10 * dt);
  c.h += steer * dt * 2.2 * clamp(c.speed / 7, -1, 1) * (1 - 0.55 * clamp(Math.abs(c.speed) / st.max, 0, 1)) * (keys.Space ? 1.5 : 1);
  const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt;
  carWorldCollide(c);
  if (c.kind === 'police' && pressed.KeyX) { c.siren = !c.siren; sfx.click(); }
}

function updateChase(c, dt) {
  const st = CAR_STATS[c.kind];
  const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
  let diff = angDiff(c.h, want); const onFoot = !P.car;
  let target = d > 16 ? st.max * 0.82 * (1 - Math.min(Math.abs(diff), 1.3) * 0.5) : Math.max((P.car ? Math.abs(P.car.speed) : 0) - 2, 5);
  if (onFoot && d < 10) target = 0;
  if (c.stun > 0) { c.stun -= dt; target = 0; }
  if (c.rev > 0) { c.rev -= dt; target = -9; diff = -diff; }
  else if (Math.abs(c.speed) < 2.5 && d > 14 && c.stun <= 0) { c.stuck += dt; if (c.stuck > 1.4) { c.rev = 1.1; c.stuck = 0; } } else c.stuck = 0;
  c.speed += clamp(target - c.speed, -26 * dt, st.acc * dt);
  c.steerVis += (clamp(diff, -1, 1) * 0.45 - c.steerVis) * Math.min(1, 8 * dt);
  c.h += clamp(diff, -1, 1) * 2.3 * dt * clamp(Math.abs(c.speed) / 7, 0.25, 1) * (c.speed < 0 ? -1 : 1);
  const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt; carWorldCollide(c);
  if (state.wanted >= 2 && d < 38 && !state.dead) {
    c.shootCd = (c.shootCd ?? rnd(1, 2)) - dt;
    if (c.shootCd <= 0) { c.shootCd = rnd(1.2, 2.2); if (lineOfSight(c.x, 1.5, c.z, P.x, 1.2, P.z)) npcShoot(c.x, 1.5, c.z, clamp(0.35 - d / 120, 0.05, 0.3), 5 + state.wanted); }
  }
  if (onFoot && d < 14 && state.wanted > 0 && c.disTimer === undefined) c.disTimer = rnd(0.3, 1.2);
  if (c.disTimer !== undefined) {
    c.disTimer -= dt;
    if (c.disTimer <= 0) {
      c.disTimer = undefined;
      if (onFoot && cops.filter(o => o.state === 'chase').length < 4 + state.wanted) {
        const [rx, rz] = carRight(c); const cp = spawnCop(c.x + rx * 2.6, c.z + rz * 2.6); cp.state = 'chase';
        if (Math.random() < 0.5) c.mode = 'idle';
      }
    }
  }
}

function separateCars() {
  const R2 = 2.15;
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
    const A = cars[a], Bc = cars[b];
    const sA = A.mode === 'parked' || A.wreck || (A.mode === 'idle' && Math.abs(A.speed) < 0.5);
    const sB = Bc.mode === 'parked' || Bc.wreck || (Bc.mode === 'idle' && Math.abs(Bc.speed) < 0.5);
    if (sA && sB) continue;
    const dx = Bc.x - A.x, dz = Bc.z - A.z; if (Math.abs(dx) > 5 || Math.abs(dz) > 5) continue;
    const d = Math.hypot(dx, dz), min = R2 * 2; if (d >= min || d < 1e-4) continue;
    const nx = dx / d, nz = dz / d, pen = min - d, wa = sA ? 0 : sB ? 1 : 0.5, wb = sB ? 0 : sA ? 1 : 0.5;
    A.x -= nx * pen * wa; A.z -= nz * pen * wa; Bc.x += nx * pen * wb; Bc.z += nz * pen * wb;
    const impact = Math.abs(A.speed) + Math.abs(Bc.speed);
    for (const [u, o] of [[A, Bc], [Bc, A]]) {
      if (impact > 12 && u.hitCool <= 0) { u.hitCool = 0.4; damageCar(u, (impact - 10) * 1.1, o.mode === 'player' || u.mode === 'player'); if (u.getaway && o.mode === 'player') u.hits++; }
      if (u.mode === 'traffic' || u.mode === 'chase') { u.stun = Math.max(u.stun, 0.8); u.speed *= 0.5; }
      if (u.mode === 'player') {
        if (impact > 14 && !u.crashSnd) { u.crashSnd = 0.3; sfx.crash(); }
        u.speed *= -0.2;
        if (o.mode === 'traffic' && state.team === 'crim' && impact > 12 && Math.random() < 0.3) setWanted(Math.max(state.wanted, 1), 'تصادم!');
      }
    }
  }
}

// visual sync (suspension tilt, wheel spin, smoke, lights)
function syncCar(c, dt) {
  c.mesh.position.set(c.x, 0, c.z); c.mesh.rotation.y = c.h;
  if (c.crashSnd) c.crashSnd = Math.max(0, c.crashSnd - dt);
  const acc = dt > 0 ? (c.speed - c.prevSpeed) / dt : 0, yaw = dt > 0 ? angDiff(c.prevH, c.h) / dt : 0;
  c.prevSpeed = c.speed; c.prevH = c.h;
  c.pitch += (clamp(-acc * 0.0035, -0.06, 0.06) - c.pitch) * Math.min(1, 8 * dt);
  c.roll += (clamp(yaw * c.speed * 0.0016, -0.08, 0.08) - c.roll) * Math.min(1, 8 * dt);
  c.body.rotation.x = c.pitch; c.body.rotation.z = c.roll;
  c.spin += c.speed * dt / 0.43;
  const sv = c.mode === 'player' || c.mode === 'chase' ? c.steerVis : clamp(yaw * 0.25, -0.4, 0.4);
  for (const w of c.wheels) { w.w.rotation.x = c.spin; if (w.front) w.pv.rotation.y = sv; }
  const on = (c.mode === 'chase' && state.wanted > 0) || c.siren;
  if (c.lights) {
    const ph = Math.floor((state.time + c.flash) * 6) % 2;
    c.lights[0].color.setHex(on ? (ph ? 0xff2020 : 0x300808) : 0x7a1010); c.lights[1].color.setHex(on ? (ph ? 0x081030 : 0x2a6cff) : 0x10204a);
  }
  if (!c.wreck) c.beam.material.opacity = (c.mode === 'parked' || c.mode === 'idle') ? 0 : env.night * 0.18;
  // damage smoke / fire
  const frac = c.hp / c.maxHp;
  c.smokeT -= dt;
  if (c.smokeT <= 0) {
    if (c.wreck && c.burn > 0) { c.smokeT = 0.12; c.burn -= 0.12; spawnFx(c.x + rnd(-1, 1), 1.2, c.z + rnd(-1, 1), rnd(-0.4, 0.4), rnd(2, 4), rnd(-0.4, 0.4), 1.4, 0.6, 2, 0xff7a1a, 0.7); spawnFx(c.x, 1.6, c.z, 0, rnd(2, 3.5), 0, 2, 0.8, 2.6, 0x222222, 0.5); }
    else if (!c.wreck && frac < 0.4) {
      c.smokeT = 0.1; const [fx, fz] = carForward(c);
      spawnFx(c.x + fx * 1.6, 1.2, c.z + fz * 1.6, rnd(-0.3, 0.3), rnd(1.5, 3), rnd(-0.3, 0.3), 1.3, 0.4, 1.6, frac < 0.2 ? 0x1a1a1a : 0x888888, 0.55);
      if (frac < 0.2) spawnFx(c.x + fx * 1.6, 1, c.z + fz * 1.6, rnd(-0.3, 0.3), rnd(1.5, 3), rnd(-0.3, 0.3), 0.6, 0.3, 0.9, 0xff8a1a, 0.7);
    }
  }
}

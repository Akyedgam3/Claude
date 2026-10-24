'use strict';
/* ===== MAD CITY 3D — actors: humans, cars, traffic, damage/explosions ===== */

// ---------- humans ----------
const humanGeoCache = new Map();
function makeHuman(shirt, pants, skin, hat, gun) {
  const key = [shirt, pants, skin, hat, gun].join('|');
  let G = humanGeoCache.get(key);
  if (!G) {
    const body = [bp(0.7, 0.85, 0.4, 0, 1.35, 0, shirt), bp(0.42, 0.42, 0.42, 0, 1.98, 0, skin)]; if (hat) body.push(bp(0.5, 0.16, 0.5, 0, 2.25, 0, hat));
    const armR = [bp(0.25, 0.8, 0.25, 0, -0.4, 0, shirt)]; if (gun) armR.push(bp(0.1, 0.14, 0.4, 0, -0.8, 0.22, 0x111111));
    G = { body: mergeParts(body), leg: mergeParts([bp(0.3, 0.9, 0.3, 0, -0.45, 0, pants)]), armL: mergeParts([bp(0.25, 0.8, 0.25, 0, -0.4, 0, shirt)]), armR: mergeParts(armR) };
    humanGeoCache.set(key, G);
  }
  const g = new THREE.Group();
  const add = (geo, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const m = new THREE.Mesh(geo, vcMat); m.castShadow = true; pv.add(m); g.add(pv); return pv; };
  const bm = new THREE.Mesh(G.body, vcMat); bm.castShadow = true; g.add(bm);
  const legL = add(G.leg, -0.19, 0.92), legR = add(G.leg, 0.19, 0.92), armL = add(G.armL, -0.5, 1.72), armRp = add(G.armR, 0.5, 1.72);
  return { group: g, parts: { legL, legR, armL, armR: armRp }, hit: [] };
}
function animHuman(e, speed, dt, aim) {
  e.phase += dt * speed * 1.7;
  const sw = Math.sin(e.phase) * Math.min(1, speed / 5) * 0.9, p = e.parts;
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw; p.armL.rotation.x = -sw * 0.8;
  p.armR.rotation.x = aim ? -1.5 : sw * 0.8;
  if (e.up) p.armL.rotation.x = p.armR.rotation.x = Math.PI;
}

// ---------- cars ----------
const CAR_STATS = {
  sedan: { max: 38, acc: 15, hp: 100 }, taxi: { max: 38, acc: 15, hp: 100 }, muscle: { max: 58, acc: 27, hp: 120 },
  sport: { max: 66, acc: 28, hp: 95 }, super: { max: 88, acc: 36, hp: 90 }, truck: { max: 28, acc: 9, hp: 180 }, police: { max: 52, acc: 23, hp: 140 }
};
const cars = [];
const CAR_COLORS = [0xc0392b, 0x2e86de, 0x27ae60, 0xf1c40f, 0x7f8c8d, 0x34495e, 0xe67e22, 0x8e44ad, 0xecf0f1, 0x1a1a1a];
const burntMat = new THREE.MeshLambertMaterial({ color: 0x151515 });

const wheelGeo = mergeParts([{ g: new THREE.CylinderGeometry(0.43, 0.43, 0.32, 14).rotateZ(Math.PI / 2), m: new THREE.Matrix4(), c: 0x111111 }, bp(0.36, 0.5, 0.12, 0, 0, 0, 0xbbbbbb)]);
function makeCarMesh(kind, color) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const len = { truck: 5.6, muscle: 4.8, super: 4.5, sport: 4.3 }[kind] || 4.4;
  const low = kind === 'super' ? 0.55 : kind === 'sport' ? 0.65 : 0.75, wid = kind === 'super' ? 2.1 : 2;
  const bodyC = kind === 'police' ? 0xf4f4f4 : kind === 'taxi' ? 0xf5c518 : color;
  const cabLen = kind === 'super' ? 1.6 : kind === 'sport' ? 1.8 : kind === 'truck' ? 1.6 : 2.4, cabZ = kind === 'truck' ? 1.4 : -0.2, cabY = 0.5 + low + 0.3;
  const parts = [bp(wid, low, len, 0, 0.5 + low / 2, 0, bodyC), bp(wid - 0.16, 0.6, cabLen, 0, cabY, cabZ, 0x172431), bp(wid - 0.2, 0.1, cabLen - 0.1, 0, cabY + 0.33, cabZ, bodyC)];
  if (kind === 'truck') parts.push(bp(2.05, 1.5, 3.0, 0, 1.7, -1.2, 0xd9d9d9));
  if (kind === 'super' || kind === 'sport') parts.push(bp(wid - 0.2, 0.08, 0.5, 0, cabY + 0.2, -len / 2 + 0.2, 0x111111));
  if (kind === 'police') parts.push(bp(2.02, 0.3, 1.2, 0, 0.82, 0.9, 0x111111), bp(2.02, 0.3, 1.2, 0, 0.82, -1.2, 0x111111));
  if (kind === 'taxi') parts.push(bp(0.6, 0.2, 0.3, 0, 1.96, cabZ, 0xffffaa));
  for (const sx of [-0.7, 0.7]) parts.push(bp(0.4, 0.2, 0.08, sx, 0.5 + low * 0.7, len / 2, 0xfff4c8), bp(0.4, 0.2, 0.08, sx, 0.5 + low * 0.7, -len / 2, 0xc01010));
  const bm = new THREE.Mesh(mergeParts(parts), vcMat); bm.castShadow = true; body.add(bm);
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sx * (wid / 2), 0.43, sz * len * 0.32); g.add(pv);
    const w = new THREE.Mesh(wheelGeo, vcMat); pv.add(w); wheels.push({ pv, w, front: sz > 0 });
  }
  let lights = null;
  if (kind === 'police') {
    const r = new THREE.MeshBasicMaterial({ color: 0xff2020 }), b = new THREE.MeshBasicMaterial({ color: 0x2060ff }), bg = new THREE.BoxGeometry(0.8, 0.18, 0.4);
    const m1 = new THREE.Mesh(bg, r); m1.position.set(-0.45, 1.98, cabZ); const m2 = new THREE.Mesh(bg, b); m2.position.set(0.45, 1.98, cabZ); body.add(m1, m2); lights = [r, b];
  }
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(carBeamGeo, beamMat); beam.position.set(0, 0.9, len / 2); g.add(beam);
  scene.add(g);
  return { g, body, wheels, lights, beam, len };
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
  c.mesh.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type !== 'ConeGeometry') m.material = burntMat; });
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

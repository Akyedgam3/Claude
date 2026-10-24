'use strict';
/* ===== MAD CITY 3D — gameplay: state, weapons, items, police, prison & escape, shops, HUD ===== */

// ---------- state ----------
const WEAPONS = {
  pistol: { name: 'مسدس', dmg: 34, cd: 0.24, mag: 12, reload: 1.3, auto: false, spread: 0.004, snd: 'shot', pellets: 1 },
  smg: { name: 'رشاش', dmg: 17, cd: 0.085, mag: 30, reload: 1.9, auto: true, spread: 0.02, snd: 'smg', pellets: 1 },
  shotgun: { name: 'شوتغن', dmg: 15, cd: 0.9, mag: 6, reload: 2.6, auto: false, spread: 0.065, snd: 'shotgun', pellets: 8 },
  taser: { name: 'صاعق', dmg: 0, cd: 1.4, mag: 1, reload: 0, auto: false, spread: 0, snd: 'taser', pellets: 1 }
};
const WORDER = ['pistol', 'smg', 'shotgun', 'taser'];
const ITEM_NAMES = { lockpick: 'قفل بيك', drill: 'مثقاب (شحنات)', cutters: 'قاطع أسلاك', medkit: 'علبة إسعاف', spoon: 'ملعقة', keycard: 'بطاقة حارس' };

const state = {
  started: false, paused: false, ui: null, team: null, cash: 500, xp: 0, wanted: 0, wantedTimer: 0, dead: false, bustT: 0, regen: 0, time: 0,
  hold: null, arrests: 0, escapes: 0, robberies: 0, jail: null, saved: null, armor: 0, cur: 'pistol', dispatch: 0, spawn: 0, saveT: 10, uniform: false,
  weapons: {}, items: {}
};
function freshInventory(team) {
  state.weapons = { pistol: { own: true, mag: 12, res: 48 }, smg: { own: false, mag: 0, res: 0 }, shotgun: { own: false, mag: 0, res: 0 }, taser: { own: team === 'cop', mag: 1, res: 0 } };
  state.items = { lockpick: 0, drill: 0, cutters: 0, medkit: 1, spoon: 0, keycard: 0 }; state.armor = 0; state.cur = 'pistol';
}
const cam = { yaw: 0, pitch: 0.35, dist: 7.5 };
const P = { x: 0, z: 0, y: 0, vy: 0, rot: 0, hp: 100, car: null, mesh: null, parts: null, phase: 0, aimT: 0, speed: 0, fireCd: 0, reload: 0, isPlayer: true };
const cops = [], crooks = [], peds = [], guards = [];
let locked = false, lastMouseMove = 0, promptText = '', heli = null;

// ---------- save / load ----------
const saveKey = t => 'madcity_save_' + t;
function saveGame() {
  if (!state.team) return;
  try { localStorage.setItem(saveKey(state.team), JSON.stringify({ cash: state.cash, xp: state.xp, arrests: state.arrests, escapes: state.escapes, robberies: state.robberies, weapons: state.saved ? state.saved.weapons : state.weapons, items: state.saved ? state.saved.items : state.items, armor: state.armor })); } catch (e) { }
}
function loadGame(team) {
  freshInventory(team); state.cash = 500; state.xp = 0; state.arrests = state.escapes = state.robberies = 0;
  try {
    const s = JSON.parse(localStorage.getItem(saveKey(team)) || 'null'); if (!s) return false;
    Object.assign(state, { cash: s.cash, xp: s.xp, arrests: s.arrests, escapes: s.escapes, robberies: s.robberies, armor: s.armor || 0 });
    if (s.weapons) state.weapons = s.weapons; if (s.items) state.items = s.items; return true;
  } catch (e) { return false; }
}
const level = () => 1 + Math.floor(Math.sqrt(state.xp / 150));
function addXp(n) { const l = level(); state.xp += n; if (level() > l) toast(`🎖 ترقية! المستوى ${level()}`, 'rgba(120,80,0,.9)'); }

// ---------- player ----------
function buildPlayer(team, uniform) {
  if (P.mesh) scene.remove(P.mesh);
  const hm = uniform ? makeHuman(0xff7a1a, 0xe56a10, 0xe0b890, null, false)
    : team === 'cop' ? makeHuman(0x1d3b8b, 0x14213d, 0xf0c8a0, 0x0e1b44, true) : makeHuman(0x222222, 0x3a3a3a, 0xe0b890, 0x8b0000, true);
  P.mesh = hm.group; P.parts = hm.parts; scene.add(P.mesh);
}

// ---------- NPC humans ----------
function ringPos(i, j, t) {
  const per = RING * 8, s = ((t % per) + per) % per, side = Math.floor(s / (RING * 2)), u = s % (RING * 2) - RING, bx = bc(i), bz = bc(j);
  if (side === 0) return [bx + u, bz - RING]; if (side === 1) return [bx + RING, bz + u]; if (side === 2) return [bx - u, bz + RING]; return [bx - RING, bz - u];
}
function initHuman(type, hm, x, z) {
  const e = { type, x, z, y: 0, rot: rnd(0, TAU), hp: 100, dead: false, speed: 0, mesh: hm.group, parts: hm.parts, hit: hm.hit, state: 'walk', t: 0, cd: rnd(0.5, 2), phase: rnd(0, 6), up: false, stunT: 0, scared: 0 };
  hm.group.position.set(x, 0, z); scene.add(hm.group); return e;
}
function spawnPed() {
  const hm = makeHuman(pick([0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0xecf0f1, 0x1abc9c]), pick([0x2c3e50, 0x34495e, 0x6b4f3a, 0x555555]), pick([0xf0c8a0, 0xd9a577, 0x8d5a3b, 0xffdbac]));
  const e = initHuman('ped', hm, 0, 0);
  e.ring = { i: rint(0, N - 1), j: rint(0, N - 1), t: rnd(0, RING * 8), dir: Math.random() < 0.5 ? 1 : -1 }; e.walk = rnd(1.4, 2.2); peds.push(e); return e;
}
function spawnCop(x, z, patrol) {
  const hm = makeHuman(0x1d3b8b, 0x14213d, 0xf0c8a0, 0x0e1b44, true);
  const e = initHuman('cop', hm, x ?? 0, z ?? 0); e.state = patrol ? 'patrol' : 'chase'; e.walk = 2;
  if (patrol) e.ring = { i: rint(0, N - 1), j: rint(0, N - 1), t: rnd(0, RING * 8), dir: Math.random() < 0.5 ? 1 : -1 };
  cops.push(e); return e;
}
function spawnCrook() {
  const s = pick(spots), hm = makeHuman(0xb32020, 0x1e1e1e, 0xe0b890, 0x111111, true);
  const e = initHuman('crook', hm, s.x + rnd(-6, 6), s.z + rnd(2, 9));
  e.state = 'robbing'; e.t = 26; e.spot = s; e.value = Math.round((s.reward[0] + s.reward[1]) / 4); e.carT = 0;
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  arrow.rotation.x = Math.PI; arrow.position.y = 3.1; e.mesh.add(arrow); e.arrow = arrow; crooks.push(e);
  if (state.team === 'cop') { toast(`🚨 سطو مسلح على ${s.name}! تحقق من الخريطة`, 'rgba(180,20,20,.85)'); sfx.tone(700, 0.15, 0.1, 'square'); sfx.tone(900, 0.15, 0.1, 'square', 0.18); }
  return e;
}
function spawnGuard(def, route) {
  const hm = makeHuman(0x3b4a3a, 0x2a3328, 0xf0c8a0, 0x232b22, true);
  const e = initHuman('guard', hm, def ? def.x : route[0].x, def ? def.z : route[0].z);
  e.tower = !!def; e.y = def ? def.y : 0; e.route = route; e.wp = 0; e.walk = 2.1; e.pickT = 0; e.catchT = 0;
  if (e.tower) e.rot = Math.atan2(prison.x - e.x, prison.z - e.z);
  guards.push(e); return e;
}
function killHuman(e) {
  e.dead = true; e.state = 'dead'; e.t = 6; e.mesh.rotation.x = -Math.PI / 2; e.mesh.visible = true;
  if (e.arrow) e.arrow.visible = false;
  if (e.car) crookLeaveCar(e, e.car, true);
}
function removeHuman(e, list) { scene.remove(e.mesh); const i = list.indexOf(e); if (i >= 0) list.splice(i, 1); }
function moveHuman(e, dx, dz, spd, dt) {
  const l = Math.hypot(dx, dz); if (l < 1e-4) { e.speed = 0; return; }
  dx /= l; dz /= l;
  const r = resolveCircle(e.x + dx * spd * dt, e.z + dz * spd * dt, 0.5); e.x = r.x; e.z = r.z;
  e.rot += angDiff(e.rot, Math.atan2(dx, dz)) * Math.min(1, 12 * dt); e.speed = spd;
}
function walkRing(e, dt) {
  const r = e.ring, sp = e.walk * (e.scared > 0 ? 3.2 : 1); r.t += r.dir * sp * dt;
  const [x, z] = ringPos(r.i, r.j, r.t), [x2, z2] = ringPos(r.i, r.j, r.t + r.dir * 0.5);
  e.x = x; e.z = z; e.rot += angDiff(e.rot, Math.atan2(x2 - x, z2 - z)) * Math.min(1, 10 * dt); e.speed = sp;
}
const tracers = [];
function tracer(ax, ay, az, bx, by, bz, color = 0xffee88) {
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz)]);
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color })); scene.add(l); tracers.push({ l, t: 0.07 });
}
function npcShoot(ox, oy, oz, acc, dmg) {
  const tx = P.x, ty = (P.car ? 1.2 : 1.1) + P.y, tz = P.z;
  tracer(ox, oy, oz, tx + rnd(-1, 1), ty, tz + rnd(-1, 1), 0xffaa44); sfx.npcShot();
  if (Math.random() < acc) hurt(dmg);
}

// getaway cars for fleeing robbers
function crookLeaveCar(e, car, dead) {
  if (!e.car) return; e.car = null; car.getaway = false; car.crook = null; if (!car.wreck) car.mode = 'idle';
  e.mesh.visible = true; const [rx, rz] = carRight(car); e.x = car.x + rx * 2.6; e.z = car.z + rz * 2.6; e.mesh.position.set(e.x, 0, e.z);
  if (!dead) { e.state = 'flee'; e.t = 50; e.cd = 1.5; if (state.team === 'cop') toast('🏃 المجرم ترك السيارة وهرب سيراً!'); }
}
function startGetaway(e) {
  const s = specials[e.spot.key], dir = Math.random() < 0.5 ? 1 : -1, road = clamp(s.j + 1, 0, N);
  const car = newCar(pick(['sedan', 'sport', 'muscle']), s.x + rnd(-9, 9), rc(road) + laneOff('x', dir), baseH('x', dir), 'idle', pick([0x111111, 0x6b1a1a, 0x1a3a6b]));
  car.getaway = true; car.crook = e; e.car = car; e.state = 'tocar'; e.t = 12; car.cruise = 30;
  car.dirTmp = dir;
}

function updatePeds(dt) {
  for (const e of peds) { if (e.dead) { e.t -= dt; continue; } e.scared = Math.max(0, e.scared - dt); walkRing(e, dt); }
}

function updateCops(dt) {
  const crim = state.team === 'crim';
  for (const e of cops) {
    if (e.dead) { e.t -= dt; continue; }
    if (e.stunT > 0) { e.stunT -= dt; e.speed = 0; continue; }
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz);
    if (e.state === 'patrol') { walkRing(e, dt); if (crim && state.wanted >= 1 && d < 110 && !state.jail) e.state = 'chase'; }
    else if (e.state === 'chase') {
      if (!crim || state.wanted === 0 || state.jail) { e.state = 'leave'; e.t = 6; continue; }
      const aim = d < 32;
      if (d > 2.0) moveHuman(e, dx, dz, 6.4, dt); else e.speed = 0;
      e.cd -= dt;
      if (aim) e.rot += angDiff(e.rot, Math.atan2(dx, dz)) * Math.min(1, 10 * dt);
      if (aim && e.cd <= 0 && state.wanted >= 2 && !state.dead) {
        e.cd = rnd(0.9, 1.6);
        if (lineOfSight(e.x, 1.5, e.z, P.x, 1.2, P.z)) npcShoot(e.x, 1.5, e.z, clamp(0.5 - d / 80, 0.1, 0.45), 6 + state.wanted);
      }
      if (d < 2.6 && !P.car) state.bustT += dt;
    } else if (e.state === 'leave') { e.t -= dt; moveHuman(e, -dx, -dz, 3, dt); if (e.t <= 0 || d > 150) removeHuman(e, cops); }
  }
}

function updateCrooks(dt) {
  for (let i = crooks.length - 1; i >= 0; i--) {
    const e = crooks[i];
    if (e.dead) { e.t -= dt; continue; }
    if (e.arrow) { e.arrow.position.y = 3.1 + Math.sin(state.time * 5) * 0.15; e.arrow.rotation.y += dt * 3; }
    if (e.stunT > 0) { e.stunT -= dt; e.speed = 0; e.mesh.rotation.x = -1.2; if (e.stunT <= 0) e.mesh.rotation.x = 0; continue; }
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
    if (e.state === 'robbing') {
      e.t -= dt; e.speed = 0;
      if (e.t <= 0 || (state.team === 'cop' && d < 38)) { if (Math.random() < 0.55) startGetaway(e); else { e.state = 'flee'; e.t = 60; e.cd = 2; } }
    } else if (e.state === 'tocar') {
      const c = e.car; if (!c) { e.state = 'flee'; continue; }
      e.t -= dt; moveHuman(e, c.x - e.x, c.z - e.z, 8, dt);
      if (Math.hypot(c.x - e.x, c.z - e.z) < 2.6 || e.t <= 0) {
        e.state = 'incar'; e.mesh.visible = false; joinGrid(c, 'x', c.dirTmp); c.speed = 8; e.stuck = 0; e.fleeT = 0;
      }
    } else if (e.state === 'incar') {
      const c = e.car; if (!c || c.wreck) { if (c) crookLeaveCar(e, c); continue; }
      e.x = c.x; e.z = c.z; e.fleeT += dt;
      e.stuck = Math.abs(c.speed) < 1.5 ? e.stuck + dt : 0;
      if (c.hits >= 3 || e.stuck > 2.5 || c.hp < c.maxHp * 0.25) { crookLeaveCar(e, c); continue; }
      if (d > 260 && e.fleeT > 30) { removeCar(c); removeHuman(e, crooks); if (state.team === 'cop') toast('😤 المجرم هرب من المدينة!'); }
    } else if (e.state === 'flee') {
      e.t -= dt; e.cd -= dt;
      let ang = Math.atan2(dx, dz) + Math.sin(state.time * 0.7 + e.phase) * 0.8;
      moveHuman(e, Math.sin(ang), Math.cos(ang), d < 80 ? 7 : 3, dt);
      if (state.team === 'cop' && d < 22 && e.cd <= 0 && !state.dead && lineOfSight(e.x, 1.5, e.z, P.x, 1.2, P.z)) { e.cd = rnd(1.4, 2.4); npcShoot(e.x, 1.5, e.z, 0.25, 6); }
      if (e.t <= 0 && d > 80) removeHuman(e, crooks);
    } else if (e.state === 'arrested') { e.up = true; e.t -= dt; e.speed = 0; if (e.t <= 0) removeHuman(e, crooks); }
  }
}

// ---------- prison ----------
function guardSees(e) {
  const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz); if (d > 28) return false;
  if ((dx * Math.sin(e.rot) + dz * Math.cos(e.rot)) / d < Math.cos(1.0)) return false;
  return lineOfSight(e.x, e.y + 1.6, e.z, P.x, 1.2 + P.y, P.z);
}
function raiseAlarm(why) {
  const j = state.jail; if (!j) return;
  if (j.alarm <= 0) { toast('🚨 إنذار السجن! الحراس رأوك!', 'rgba(180,20,20,.9)', 3500); flash('🚨 إنذار', '#ff4d4d', 1200); }
  j.alarm = 25;
}
function updateGuards(dt) {
  const j = state.jail, lockdown = env.time >= 22 || env.time < 5.5;
  for (const e of guards) {
    if (e.dead) { e.t -= dt; continue; }
    e.scan = (e.scan || 0) - dt; e.cd -= dt; e.pickT = Math.max(0, e.pickT - dt);
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz);
    if (j && e.scan <= 0) {
      e.scan = 0.3;
      if (guardSees(e)) {
        const sus = (state.hold && state.hold.sus) || (lockdown && !prison.inCellBlock(P.x, P.z)) || j.suspicious > 0;
        if (sus) raiseAlarm(); else if (j.alarm > 0) j.alarm = 25;
      }
    }
    if (j && j.alarm > 0 && !state.dead) {
      if (!e.tower) {
        if (d > 2.0) moveHuman(e, dx, dz, 6.4, dt); else e.speed = 0;
        if (d < 2.4) { e.catchT += dt; if (e.catchT > 1.2) { solitary(); return; } } else e.catchT = Math.max(0, e.catchT - dt);
      }
      e.rot += angDiff(e.rot, Math.atan2(dx, dz)) * Math.min(1, 10 * dt);
      if (d < 34 && e.cd <= 0 && lineOfSight(e.x, e.y + 1.5, e.z, P.x, 1.2, P.z)) { e.cd = rnd(1, 1.8); npcShoot(e.x, e.y + 1.5, e.z, clamp(0.45 - d / 90, 0.08, 0.4), 6); }
    } else if (!e.tower) {
      const wp = e.route[e.wp], tx = wp.x - e.x, tz = wp.z - e.z;
      if (Math.hypot(tx, tz) < 1.5) e.wp = (e.wp + 1) % e.route.length; else moveHuman(e, tx, tz, e.walk, dt);
      e.catchT = 0;
    } else e.speed = 0;
  }
}
function solitary() {
  const j = state.jail; if (!j) return;
  j.t += 30; j.alarm = 0; j.suspicious = 0; state.hold = null;
  state.items.spoon = state.items.cutters = state.items.keycard = 0; prison.setMarkersVisible(true); updateStashMarkers();
  P.x = prison.cell.x; P.z = prison.cell.z; P.y = 0; P.hp = Math.max(P.hp, 50);
  flash('⛓ زنزانة انفرادية +30 ث', '#ff9d2e', 2200); toast('🔒 الحراس أمسكوا بك! أُضيفت 30 ثانية وصودرت أدواتك', 'rgba(150,60,0,.9)', 4000);
}
function updateStashMarkers() {
  const m = prison.markers;
  m.spoon.visible = !!state.jail && !state.items.spoon; m.cutters.visible = !!state.jail && !state.items.cutters;
  m.loose.visible = m.fence.visible = m.gate.visible = !!state.jail;
}
function sendToJail(sentence, reason) {
  if (P.car) { P.car.mode = 'idle'; P.car = null; }
  clearPolice(); state.wanted = 0; state.bustT = 0; state.hold = null;
  state.saved = { weapons: state.weapons, items: state.items, armor: state.armor };
  state.weapons = {}; state.items = { lockpick: 0, drill: 0, cutters: 0, medkit: 0, spoon: 0, keycard: 0 }; state.armor = 0;
  state.jail = { t: sentence, alarm: 0, suspicious: 0, total: sentence, gateWarn: 0 };
  state.uniform = true; buildPlayer(state.team, true);
  prison.resetFence(); prison.setGate(false);
  prison.markers.cutters.position.set(0, 0, 0); const sp = pick(prison.stashPoints); prison.markers.cutters.position.set(sp.x, 0, sp.z); prison.stash = sp;
  prison.setMarkersVisible(true); updateStashMarkers();
  P.x = prison.cell.x; P.z = prison.cell.z; P.y = 0; P.hp = 100; P.mesh.visible = true; cam.yaw = 0;
  flash(reason || '⛓ السجن', '#ff9d2e', 2500);
  toast(`⛓ حُكمت ${Math.round(sentence)} ثانية. انتظر، أو خطّط للهروب!`, 'rgba(150,60,0,.9)', 5000);
}
function releaseFromJail() {
  const j = state.jail; if (!j) return;
  state.weapons = state.saved.weapons; state.items = state.saved.items; state.armor = state.saved.armor; state.saved = null; state.jail = null;
  state.uniform = false; buildPlayer(state.team, false);
  prison.setMarkersVisible(false); prison.setGate(true); prison.gate.t = 12; prison.gate.mesh.position.y = 2.55;
  P.x = prison.release.x; P.z = prison.release.z; P.rot = 0; cam.yaw = 0;
  toast('🔓 انتهت مدة حكمك. أنت حرّ!', 'rgba(10,110,50,.9)', 4000); flash('🔓 أُفرج عنك', '#4dff9a', 2000);
}
function escapePrison(how) {
  state.jail = null; state.hold = null;
  state.weapons = state.saved.weapons; state.items = { lockpick: 0, drill: 0, cutters: 0, medkit: 0, spoon: 0, keycard: 0 };
  state.weapons = { pistol: { own: true, mag: 12, res: 24 }, smg: { own: false, mag: 0, res: 0 }, shotgun: { own: false, mag: 0, res: 0 }, taser: { own: false, mag: 1, res: 0 } };
  state.saved = null; state.armor = 0; state.escapes++; addXp(600); prison.setMarkersVisible(false);
  toast(`🔥 هربت من السجن (${how})! الشرطة تبحث عنك`, 'rgba(180,80,0,.95)', 5000); flash('🔥 هروب!', '#ffb347', 2200);
  state.wanted = 3; state.wantedTimer = 25; saveGame();
}

// ---------- weapons & items ----------
function reloadWeapon() {
  const w = WEAPONS[state.cur], inv = state.weapons[state.cur]; if (!inv || P.reload > 0 || state.cur === 'taser' || inv.mag >= w.mag || inv.res <= 0) return;
  P.reload = w.reload; P.reloadFor = state.cur; sfx.reload();
}
function finishReload() {
  const w = WEAPONS[P.reloadFor], inv = state.weapons[P.reloadFor]; if (!inv) return;
  const need = w.mag - inv.mag, take = Math.min(need, inv.res); inv.mag += take; inv.res -= take;
}
function selectWeapon(k) { if (state.jail || !state.weapons[k] || !state.weapons[k].own) return; state.cur = k; P.reload = 0; sfx.click(); }
function traceShot(ox, oy, oz, dx, dy, dz, w) {
  let best = rayWorld(ox, oy, oz, dx, dy, dz, 140), hitE = null, hitC = null, head = false;
  for (const list of [cops, crooks, peds, guards]) for (const e of list) {
    if (e.dead || e.state === 'arrested' || e.state === 'incar' || Math.abs(e.x - ox) > 150 || Math.abs(e.z - oz) > 150) continue;
    const by = e.y || 0, standing = !(e.stunT > 0);
    let t = raySphere(ox, oy, oz, dx, dy, dz, e.x, by + (standing ? 2.0 : 0.4), e.z, 0.32);
    if (t !== null && t < best) { best = t; hitE = e; hitC = null; head = standing; continue; }
    t = raySphere(ox, oy, oz, dx, dy, dz, e.x, by + (standing ? 1.3 : 0.4), e.z, 0.55);
    if (t === null) t = raySphere(ox, oy, oz, dx, dy, dz, e.x, by + 0.5, e.z, 0.5);
    if (t !== null && t < best) { best = t; hitE = e; hitC = null; head = false; }
  }
  for (const c of cars) {
    if (c.mode === 'player') continue;
    const t = raySphere(ox, oy, oz, dx, dy, dz, c.x, 1, c.z, 2.3); if (t !== null && t < best) { best = t; hitC = c; hitE = null; }
  }
  const px = ox + dx * best, py = oy + dy * best, pz = oz + dz * best;
  if (hitE || hitC) { const ch = $('crosshair'); ch.classList.add('hit'); setTimeout(() => ch.classList.remove('hit'), 90); }
  if (hitE) {
    const e = hitE;
    if (state.cur === 'taser') {
      e.stunT = 7; e.speed = 0; if (e.type === 'crook') e.mesh.rotation.x = -1.2; toast('⚡ تم تخديره! اعتقله الآن (E)', 'rgba(20,80,160,.9)', 1800);
    } else {
      e.hp -= w.dmg * (head ? 3 : 1); e.hit && 0;
      if (e.type === 'ped') { setWanted(Math.max(state.wanted, 1), 'اعتداء على مدني'); }
      if (e.type === 'cop' || e.type === 'guard') { if (e.type === 'cop') setWanted(Math.max(state.wanted, 2), 'اعتداء على شرطي'); else if (state.jail) raiseAlarm(); }
      spawnFx(px, py, pz, rnd(-1, 1), rnd(0.5, 2), rnd(-1, 1), 0.5, 0.15, 0.5, 0xaa1111, 0.8);
      if (e.hp <= 0) {
        if (e.type === 'cop') { setWanted(state.wanted + 1, 'قتل شرطي'); killHuman(e); }
        else if (e.type === 'crook') { killHuman(e); const r = Math.round(e.value * 0.4); state.cash += r; addXp(40); toast(`🎯 تمت تصفية مجرم +$${r}`, 'rgba(10,110,50,.9)'); sfx.cash(); }
        else killHuman(e);
      } else if (e.type === 'cop' && state.team === 'crim') e.state = 'chase';
    }
  } else if (hitC && state.cur !== 'taser') {
    damageCar(hitC, w.dmg * 0.7, true); spawnFx(px, py, pz, 0, 1, 0, 0.3, 0.15, 0.4, 0xffcc44, 0.8);
    if (state.team === 'crim' && hitC.kind === 'police') setWanted(Math.max(state.wanted, 2), 'إطلاق نار على سيارة شرطة');
    else if (state.team === 'crim' && hitC.mode === 'traffic' && Math.random() < 0.3) setWanted(Math.max(state.wanted, 1), 'إطلاق نار');
  } else if (state.cur !== 'taser') spawnFx(px, py, pz, 0, 0.3, 0, 0.25, 0.1, 0.35, 0xdddddd, 0.6);
  return [px, py, pz];
}
function fireWeapon() {
  if (P.fireCd > 0 || P.car || state.dead || state.jail || P.reload > 0 || state.ui) return;
  const w = WEAPONS[state.cur], inv = state.weapons[state.cur]; if (!inv || !inv.own) return;
  if (state.cur !== 'taser') { if (inv.mag <= 0) { if (inv.res > 0) reloadWeapon(); else sfx.click(); P.fireCd = 0.3; return; } inv.mag--; }
  P.fireCd = w.cd; P.aimT = 1.2; sfx[w.snd]();
  const base = new THREE.Vector3(); camera.getWorldDirection(base);
  const right = new THREE.Vector3().crossVectors(base, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, base).normalize();
  const o = camera.position, mz = new THREE.Vector3(P.x + Math.sin(P.rot) * 0.7, 1.55 + P.y, P.z + Math.cos(P.rot) * 0.7);
  for (let k = 0; k < w.pellets; k++) {
    const sp = w.spread * (mouse.right ? 0.5 : 1) * (P.speed > 1 ? 1.6 : 1), d = base.clone().addScaledVector(right, rnd(-sp, sp)).addScaledVector(up, rnd(-sp, sp)).normalize();
    const [px, py, pz] = traceShot(o.x, o.y, o.z, d.x, d.y, d.z, w);
    tracer(mz.x, mz.y, mz.z, px, py, pz, state.cur === 'taser' ? 0x66aaff : 0xffee88);
  }
  spawnFx(mz.x, mz.y, mz.z, 0, 0, 0, 0.06, 0.25, 0.5, 0xffdd66, 0.9);
  cam.pitch = clamp(cam.pitch - 0.012 * (state.cur === 'shotgun' ? 3 : 1), -0.25, 1.25);
  if (state.cur !== 'taser') for (const p of peds) if (!p.dead && Math.hypot(p.x - P.x, p.z - P.z) < 40) p.scared = 8;
  if (state.team === 'crim' && state.cur !== 'taser' && cops.some(c => !c.dead && Math.hypot(c.x - P.x, c.z - P.z) < 30)) setWanted(Math.max(state.wanted, 1), 'إطلاق نار');
  if (inv.mag <= 0 && inv.res > 0 && state.cur !== 'taser') reloadWeapon();
}
function useMedkit() {
  if (state.items.medkit > 0 && P.hp < 100 && !state.dead) { state.items.medkit--; P.hp = Math.min(100, P.hp + 60); toast('💊 استخدمت علبة إسعاف', 'rgba(10,110,50,.9)', 1500); sfx.click(); }
}

// ---------- damage / wanted / death ----------
function hurt(n) {
  if (state.dead || !state.started || state.jail && n > 0 && state.ui) return;
  if (state.armor > 0) { const a = Math.min(state.armor, n * 0.65); state.armor -= a; n -= a; }
  P.hp -= n; state.regen = 7;
  const d = $('damage'); d.style.opacity = clamp(n / 18, 0.25, 0.9); setTimeout(() => d.style.opacity = 0, 120);
  if (P.hp <= 0) wasted();
}
function setWanted(n, why) {
  if (state.team !== 'crim' || state.jail) return;
  n = clamp(n, 0, 5);
  if (n > state.wanted) { state.wanted = n; if (why) toast(`⭐ مستوى المطلوب ${n} — ${why}`, 'rgba(180,120,0,.9)'); }
  state.wantedTimer = 22;
}
function flash(text, color, ms = 1800) { const f = $('flash'); f.textContent = text; f.style.color = color; f.classList.add('show'); setTimeout(() => f.classList.remove('show'), ms); }
function toast(text, bg = 'rgba(14,21,34,.85)', ms = 3200) {
  const t = document.createElement('div'); t.className = 'toast panel'; t.textContent = text; t.style.background = bg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), ms); while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}
function clearPolice() {
  for (const c of cars.filter(c => c.mode === 'chase')) c.mode = 'idle';
  for (const e of cops.filter(e => e.state === 'chase')) { e.state = 'leave'; e.t = 4; }
}
function respawnAt(x, z) {
  if (P.car) { P.car.mode = 'idle'; P.car = null; }
  state.dead = false; P.hp = 100; P.vy = 0; P.y = 0; state.bustT = 0; state.hold = null; P.mesh.visible = true; P.mesh.rotation.x = 0; P.x = x; P.z = z; P.rot = 0; cam.yaw = 0; P.reload = 0;
}
function respawn(reason, withCar) {
  const s = specials[state.team === 'cop' ? 'police' : 'hideout'];
  respawnAt(s.x, s.doorZ + 10); state.wanted = 0; clearPolice();
  if (withCar) newCar(state.team === 'cop' ? 'police' : 'sedan', s.x + 11, s.doorZ + 9, Math.PI / 2, 'idle', 0x6b1a1a);
  if (reason) flash(reason, '#fff');
}
function wasted() {
  state.dead = true; state.regen = 0; flash('💀 لقد متّ', '#ff4d4d', 2600);
  P.mesh.visible = false; if (P.car) { P.car.mode = 'idle'; P.car = null; }
  setTimeout(() => {
    if (state.jail) { state.jail.t += 20; state.jail.alarm = 0; P.x = prison.cell.x; P.z = prison.cell.z; state.dead = false; P.hp = 100; P.mesh.visible = true; toast('🏥 عولجت وأُعدت إلى زنزانتك +20 ث'); return; }
    const bill = Math.min(state.cash, 250); state.cash -= bill; const h = specials.hospital; respawnAt(h.x, h.doorZ + 8);
    state.wanted = 0; clearPolice(); toast(`🏥 تم علاجك في المستشفى (-$${bill})`);
  }, 2800);
}
function busted() {
  const lose = Math.round(state.cash * 0.15); state.cash -= lose;
  sendToJail(40 + state.wanted * 25, '🚔 تم القبض عليك');
  toast(`🚔 قُبض عليك! غرامة $${lose}`, 'rgba(20,50,140,.9)', 4000);
}

// ---------- cars: enter / exit ----------
function enterCar(c) { if (c.wreck) return; P.car = c; c.mode = 'player'; c.speed = c.speed || 0; P.mesh.visible = false; c.disTimer = undefined; c.getaway = false; c.beam.visible = true; }
function exitCar() {
  const c = P.car; if (!c) return;
  const [rx, rz] = carRight(c); let ok = false;
  for (const side of [-1, 1]) for (const dist of [2.8, 4]) {
    const x = c.x + rx * side * dist, z = c.z + rz * side * dist, r = resolveCircle(x, z, 0.6);
    if (!r.hit) { P.x = x; P.z = z; ok = true; break; }
  }
  if (!ok) { P.x = c.x + rx * 3; P.z = c.z + rz * 3; }
  if (!c.wreck) c.mode = 'idle'; P.car = null; P.mesh.visible = true; P.rot = c.h; P.y = 0;
}
const nearestCar = maxD => { let best = null, bd = maxD; for (const c of cars) { if (c.mode === 'player' || c.wreck) continue; const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < bd) { bd = d; best = c; } } return best; };
const nearestCrook = maxD => { let best = null, bd = maxD; for (const e of crooks) { if (e.dead || e.state === 'arrested' || e.state === 'incar') continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; best = e; } } return best; };
function arrestCrook(e) {
  e.state = 'arrested'; e.t = 2.5; e.up = true; e.arrow.visible = false; e.mesh.rotation.x = 0;
  const bonus = e.stunT > 0 ? 150 : 0, total = e.value + bonus; e.stunT = 0;
  state.cash += total; state.arrests++; addXp(120); sfx.cash(); toast(`✅ اعتقال ناجح! +$${total}`, 'rgba(10,110,50,.9)'); saveGame();
}

// ---------- wanted / police dispatch ----------
function updateWanted(dt) {
  if (state.team !== 'crim' || state.wanted === 0 || state.jail) return;
  let nearest = 1e9;
  for (const c of cars) if (c.mode === 'chase') nearest = Math.min(nearest, Math.hypot(c.x - P.x, c.z - P.z));
  for (const e of cops) if (e.state === 'chase') nearest = Math.min(nearest, Math.hypot(e.x - P.x, e.z - P.z));
  if (heli) nearest = Math.min(nearest, Math.hypot(heli.x - P.x, heli.z - P.z) * 0.5);
  if (nearest > 75) state.wantedTimer -= dt; else state.wantedTimer = Math.max(state.wantedTimer, 8);
  if (state.wantedTimer <= 0) {
    state.wanted--; state.wantedTimer = 14;
    if (state.wanted === 0) { toast('✔ نجحت بالهروب من الشرطة', 'rgba(10,110,50,.9)'); addXp(150); clearPolice(); if (state.uniform) { state.uniform = false; buildPlayer(state.team, false); toast('👕 غيّرت ملابسك'); } }
    else toast(`⭐ انخفض مستوى المطلوب إلى ${state.wanted}`);
  }
  const want = Math.min(state.wanted + 1, 6), chasing = cars.filter(c => c.mode === 'chase' && !c.wreck);
  state.dispatch -= dt;
  if (chasing.length < want && state.dispatch <= 0) {
    state.dispatch = 4;
    for (let t = 0; t < 16; t++) {
      const ix = rint(0, N), iz = rint(0, N), x = rc(ix), z = rc(iz), d = Math.hypot(x - P.x, z - P.z);
      if (d < 120 || d > 260) continue;
      const c = newCar('police', x, z, Math.atan2(P.x - x, P.z - z), 'chase'); c.speed = 12; break;
    }
  }
  let near = 0; for (const c of chasing) if (Math.hypot(c.x - P.x, c.z - P.z) < 7.5) near++;
  if (P.car) { if (near >= 2 && Math.abs(P.car.speed) < 3.5) state.bustT += dt; else state.bustT = Math.max(0, state.bustT - dt); }
  else state.bustT = Math.max(0, state.bustT - dt * 0.7);
  if (state.bustT >= (P.car ? 2.5 : 1.6)) busted();
}

// police helicopter (wanted >= 4)
function spawnHeli() {
  const g = new THREE.Group(), mk = (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, lam(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const body = mk(new THREE.SphereGeometry(1.6, 12, 10), 0x1a2433, 0, 0, 0); body.scale.set(1, 0.9, 1.9);
  mk(new THREE.BoxGeometry(0.35, 0.35, 4.5), 0x1a2433, 0, 0.2, -3.8); mk(new THREE.BoxGeometry(2.6, 0.12, 0.12), 0x333333, 0, -1.6, 0.4);
  const rotor = new THREE.Group(); rotor.position.y = 1.7; g.add(rotor);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 0.4), lam(0x222222)), b2 = b1.clone(); b2.rotation.y = Math.PI / 2; rotor.add(b1, b2);
  const cgeo = new THREE.ConeGeometry(1, 1, 16, 1, true).translate(0, -0.5, 0).rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(cgeo, new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  scene.add(g, cone); heli = { g, rotor, cone, x: P.x + 220, z: P.z, y: 46, ang: rnd(0, TAU), cd: 2, leave: false };
}
function updateHeli(dt) {
  const want = state.started && state.team === 'crim' && state.wanted >= 4 && !state.jail;
  if (want && !heli) spawnHeli();
  if (!heli) return;
  const h = heli; h.leave = !want;
  h.ang += dt * 0.45;
  const tx = h.leave ? P.x + Math.cos(h.ang) * 500 : P.x + Math.cos(h.ang) * 28, tz = h.leave ? P.z + Math.sin(h.ang) * 500 : P.z + Math.sin(h.ang) * 28;
  const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(d, 32 * dt);
  h.x += dx / d * sp; h.z += dz / d * sp; h.y += ((h.leave ? 120 : 42) - h.y) * Math.min(1, dt);
  h.g.position.set(h.x, h.y, h.z); h.g.rotation.y = Math.atan2(dx, dz); h.rotor.rotation.y += dt * 35;
  const len = Math.hypot(P.x - h.x, P.z - h.z, h.y);
  h.cone.visible = !h.leave; h.cone.position.set(h.x, h.y - 1, h.z); h.cone.lookAt(P.x, 0, P.z); h.cone.scale.set(6, 6, len); h.cone.material.opacity = 0.08 + env.night * 0.14;
  h.cd -= dt;
  if (!h.leave && h.cd <= 0 && !state.dead && Math.hypot(P.x - h.x, P.z - h.z) < 60) { h.cd = rnd(1, 1.7); if (lineOfSight(h.x, h.y, h.z, P.x, 1.2, P.z)) npcShoot(h.x, h.y - 1, h.z, 0.25, 5 + state.wanted); }
  if (h.leave && Math.hypot(h.x - P.x, h.z - P.z) > 380) { scene.remove(h.g, h.cone); heli = null; }
}

// ---------- spots / markers ----------
function updateSpots(dt) {
  for (const s of spots) {
    s.cd = Math.max(0, s.cd - dt);
    const u = s.marker.userData, ready = s.cd <= 0 && state.team === 'crim';
    u.ring.material.color.set(s.cd <= 0 ? 0xffd23f : 0x666666); u.beam.visible = ready; s.marker.visible = true;
    u.ring.scale.setScalar(1 + Math.sin(state.time * 4) * 0.05);
  }
  const showShop = { hideout: state.team === 'crim', police: state.team === 'cop', dealer: true, hospital: true };
  for (const k in showShop) specials[k].marker.visible = showShop[k] && !state.jail;
  for (const m of [specials.dealer.marker, specials.hideout.marker, specials.police.marker, specials.hospital.marker]) m.userData.ring.scale.setScalar(1 + Math.sin(state.time * 4) * 0.05);
  const pr = prison;
  if (pr.gate.open) { pr.gate.t -= dt; if (pr.gate.t <= 0) { pr.setGate(false); } }
  const gy = pr.gate.open ? 7.2 : 2.55; pr.gate.mesh.position.y += (gy - pr.gate.mesh.position.y) * Math.min(1, 3 * dt);
}

// ---------- shops ----------
const SHOPS = {
  black: { title: '🕶 السوق السوداء', items: [
    { id: 'lockpick', name: 'قفل بيك — يسرّع السرقة 30%', price: 300, give: s => s.items.lockpick++ },
    { id: 'drill', name: 'مثقاب خزائن (3 شحنات) — يسرّع السرقة 50%', price: 1500, give: s => s.items.drill += 3 },
    { id: 'cutters', name: 'قاطع أسلاك (للسجن)', price: 700, give: s => s.items.cutters++ , hidden: true },
    { id: 'medkit', name: 'علبة إسعاف (Q)', price: 250, give: s => s.items.medkit++ },
    { id: 'armor', name: 'سترة واقية', price: 900, give: s => s.armor = 100 },
    { id: 'pa', name: 'ذخيرة مسدس (+36)', price: 60, give: s => s.weapons.pistol.res += 36 },
    { id: 'smg', name: 'رشاش SMG + ذخيرة', price: 2500, give: s => { s.weapons.smg.own = true; s.weapons.smg.res += 60; } },
    { id: 'sa', name: 'ذخيرة رشاش (+90)', price: 180, give: s => s.weapons.smg.res += 90, need: s => s.weapons.smg.own },
    { id: 'sg', name: 'شوتغن + ذخيرة', price: 1800, give: s => { s.weapons.shotgun.own = true; s.weapons.shotgun.res += 16; } },
    { id: 'sga', name: 'خرطوش شوتغن (+16)', price: 150, give: s => s.weapons.shotgun.res += 16, need: s => s.weapons.shotgun.own }
  ] },
  armory: { title: '🛡 مخزن الشرطة', items: [
    { id: 'medkit', name: 'علبة إسعاف (Q)', price: 120, give: s => s.items.medkit++ },
    { id: 'armor', name: 'سترة واقية', price: 400, give: s => s.armor = 100 },
    { id: 'pa', name: 'ذخيرة مسدس (+36)', price: 30, give: s => s.weapons.pistol.res += 36 },
    { id: 'smg', name: 'رشاش SMG + ذخيرة', price: 1250, give: s => { s.weapons.smg.own = true; s.weapons.smg.res += 60; } },
    { id: 'sa', name: 'ذخيرة رشاش (+90)', price: 90, give: s => s.weapons.smg.res += 90, need: s => s.weapons.smg.own },
    { id: 'sg', name: 'شوتغن + ذخيرة', price: 900, give: s => { s.weapons.shotgun.own = true; s.weapons.shotgun.res += 16; } },
    { id: 'sga', name: 'خرطوش شوتغن (+16)', price: 75, give: s => s.weapons.shotgun.res += 16, need: s => s.weapons.shotgun.own }
  ] },
  dealer: { title: '🏎 معرض السيارات', items: [
    { id: 'muscle', name: 'ماسل كار — 210 km/h', price: 2500, car: 'muscle' },
    { id: 'sport', name: 'سيارة رياضية — 240 km/h', price: 4000, car: 'sport' },
    { id: 'super', name: 'سوبر كار — 315 km/h', price: 12000, car: 'super' }
  ] }
};
let shopKind = null;
function openShop(kind) {
  shopKind = kind; state.ui = 'shop'; document.exitPointerLock(); renderShop(); $('shop').classList.remove('hidden');
}
function closeShop() { $('shop').classList.add('hidden'); state.ui = null; shopKind = null; if (state.started) tryLock(); }
function renderShop() {
  const sh = SHOPS[shopKind]; $('shoptitle').textContent = sh.title; $('shopcash').textContent = '$' + Math.round(state.cash).toLocaleString('en-US');
  const list = $('shoplist'); list.innerHTML = '';
  for (const it of sh.items) {
    if (it.need && !it.need(state)) continue;
    const row = document.createElement('div'); row.className = 'shoprow';
    row.innerHTML = `<span>${it.name}</span><button class="btn small" ${state.cash < it.price ? 'disabled' : ''}>$${it.price.toLocaleString('en-US')}</button>`;
    row.querySelector('button').onclick = () => {
      if (state.cash < it.price) return; state.cash -= it.price; sfx.cash();
      if (it.car) { const dl = specials.dealer, c = newCar(it.car, dl.sx + 9, dl.sz + 4, Math.PI / 2, 'idle', pick([0xd62828, 0x1d70d6, 0xf4a300, 0x111111, 0xecf0f1])); closeShop(); toast('🏎 تم الشراء! سيارتك جاهزة', 'rgba(10,110,50,.9)'); enterCar(c); }
      else { it.give(state); toast('✅ تم الشراء: ' + it.name.split('—')[0], 'rgba(10,110,50,.9)', 1800); renderShop(); }
      saveGame();
    };
    list.appendChild(row);
  }
}
$('shopclose').onclick = closeShop;

// ---------- interaction ----------
function interact(dt) {
  promptText = ''; let holding = false; const rw = $('robwrap');
  const hold = (id, secs, label, sus, done, verb = 'اضغط مطولاً E') => {
    promptText = `${verb}: ${label}`;
    if (keys.KeyE) {
      holding = true; if (!state.hold || state.hold.id !== id) state.hold = { id, t: 0, sus };
      const h = state.hold; h.t += dt; h.sus = sus; rw.style.display = 'block'; $('robbar').style.width = clamp(h.t / secs * 100, 0, 100) + '%'; $('robtext').textContent = label;
      if (h.t >= secs) { state.hold = null; done(); }
    }
  };
  if (state.dead) { rw.style.display = 'none'; return; }
  if (P.car) {
    promptText = 'E: النزول  ·  H: منبّه' + (P.car.kind === 'police' ? '  ·  X: سارينة' : '');
    if (pressed.KeyE) exitCar(); if (pressed.KeyH) sfx.horn(); rw.style.display = 'none'; state.hold = null; return;
  }
  const at = (p, r) => Math.hypot(P.x - p.x, P.z - p.z) < r, j = state.jail;
  if (j) {
    const it = state.items;
    if (!it.spoon && at(prison.spoonSpot, 3)) hold('spoon', 2.5, 'خذ ملعقة من المطبخ', false, () => { it.spoon = 1; updateStashMarkers(); sfx.cash(); toast('🥄 حصلت على ملعقة! استخدمها للحفر عند الجدار المتصدّع', undefined, 3500); });
    else if (!it.cutters && prison.stash && at(prison.stash, 3)) hold('cut_stash', 2.5, 'ابحث في المخبأ', false, () => { it.cutters = 1; updateStashMarkers(); sfx.cash(); toast('✂️ حصلت على قاطع أسلاك! اقطع السياج الشرقي', undefined, 3500); });
    else if (at(prison.loose, 2.8)) {
      if (it.spoon) hold('tunnel', 12, 'احفر نفقاً بالملعقة', true, () => { P.x = prison.tunnelExit.x; P.z = prison.tunnelExit.z; flash('🕳 خرجت من النفق', '#fff', 1500); });
      else promptText = '🧱 جدار متصدّع — تحتاج ملعقة (المطبخ)';
    } else if (at(prison.fenceSpot, 3) && !prison.fence.cut) {
      if (it.cutters) hold('fence', 6, 'اقطع السياج', true, () => { prison.cutFence(); j.suspicious = 6; toast('✂️ فُتحت فجوة في السياج! اهرب!', undefined, 2500); });
      else promptText = '🔗 سياج — تحتاج قاطع أسلاك (مخبأ في الساحة)';
    } else if (at(prison.gateSpot, 3.5) && !prison.gate.open) {
      if (it.keycard) hold('gate', 3, 'افتح البوابة بالبطاقة', true, () => { prison.setGate(true); prison.gate.t = 20; j.suspicious = 8; sfx.cash(); });
      else promptText = '🚪 البوابة — تحتاج بطاقة حارس (اسرقها من ظهره)';
    } else {
      let g = null, bd = 2.2; for (const e of guards) { if (e.dead || e.tower) continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; g = e; } }
      if (g && !it.keycard && j.alarm <= 0 && g.pickT <= 0) {
        promptText = 'E: اسرق بطاقة الحارس (من الخلف أفضل)';
        if (pressed.KeyE) {
          const behind = ((P.x - g.x) * Math.sin(g.rot) + (P.z - g.z) * Math.cos(g.rot)) < 0; g.pickT = 6;
          if (behind && Math.random() < 0.8) { it.keycard = 1; sfx.cash(); toast('💳 حصلت على بطاقة الحارس! اذهب إلى البوابة الجنوبية', undefined, 3500); }
          else if (Math.random() < 0.35 || !behind) raiseAlarm(); else toast('😅 كاد يلاحظك...');
        }
      } else if (j.alarm > 0) promptText = '🚨 إنذار! اهرب من الحراس أو اختبئ في الزنزانة';
    }
    if (!holding) { state.hold = null; rw.style.display = 'none'; }
    return;
  }
  if (state.team === 'cop') {
    const cr = nearestCrook(3.4);
    if (cr) { promptText = 'E: اعتقال المجرم' + (cr.stunT > 0 ? ' (مُخدَّر +$150)' : ''); if (pressed.KeyE) arrestCrook(cr); rw.style.display = 'none'; return; }
  }
  const shopSpot = (key, kind, label) => { const s = specials[key]; if (at({ x: s.sx, z: s.sz }, 4.8)) { promptText = `E: ${label}`; if (pressed.KeyE) openShop(kind); return true; } return false; };
  if (shopSpot('dealer', 'dealer', 'معرض السيارات')) { rw.style.display = 'none'; return; }
  if (state.team === 'crim' && shopSpot('hideout', 'black', 'السوق السوداء')) { rw.style.display = 'none'; return; }
  if (state.team === 'cop' && shopSpot('police', 'armory', 'مخزن الشرطة')) { rw.style.display = 'none'; return; }
  const hs = specials.hospital;
  if (at({ x: hs.sx, z: hs.sz }, 4.8)) {
    promptText = 'E: علاج كامل ($100)'; if (pressed.KeyE) { if (state.cash >= 100 && P.hp < 100) { state.cash -= 100; P.hp = 100; sfx.cash(); toast('💊 تم علاجك'); } else if (P.hp >= 100) toast('أنت بصحة جيدة'); else toast('❌ لا يوجد رصيد كافٍ'); }
    rw.style.display = 'none'; return;
  }
  if (state.team === 'crim') {
    const s = spots.find(s => s.cd <= 0 && at(s, 4.6));
    if (s) {
      const mult = s.drill && state.items.drill > 0 ? 0.5 : state.items.lockpick > 0 ? 0.7 : 1;
      hold('rob_' + s.key, s.time * mult, `سرقة ${s.name}`, false, () => {
        const amt = rint(s.reward[0], s.reward[1]); state.cash += amt; s.cd = 150; sfx.cash(); state.robberies++; addXp(200 + s.wanted * 60);
        if (s.drill && state.items.drill > 0) state.items.drill--; else if (state.items.lockpick > 0) state.items.lockpick--;
        setWanted(Math.max(state.wanted, s.wanted), null); state.wantedTimer = 25;
        toast(`💰 سرقت ${s.name}! +$${amt}`, 'rgba(10,110,50,.9)', 4000); saveGame();
      });
      if (state.hold && state.hold.id === 'rob_' + s.key) {
        if (state.hold.t > 0.6) setWanted(Math.max(state.wanted, Math.floor(s.wanted / 2)), `سرقة ${s.name}`);
      }
      if (!holding) { state.hold = null; rw.style.display = 'none'; }
      return;
    }
  }
  if (!holding) { state.hold = null; rw.style.display = 'none'; }
  const c = nearestCar(4.2);
  if (c) { promptText = 'E: ركوب السيارة'; if (pressed.KeyE) enterCar(c); }
}

// ---------- player on foot ----------
function updateOnFoot(dt) {
  const fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), str = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = -Math.cos(cam.yaw), rz = Math.sin(cam.yaw);
  let mx = fx * fwd + rx * str, mz = fz * fwd + rz * str; const l = Math.hypot(mx, mz);
  const spd = keys.ShiftLeft || keys.ShiftRight ? 9.4 : 5.4;
  if (l > 0) { mx /= l; mz /= l; }
  const r = resolveCircle(P.x + mx * spd * dt, P.z + mz * spd * dt, 0.5); P.x = r.x; P.z = r.z; P.speed = l > 0 ? spd : 0;
  if (pressed.Space && P.y <= 0.01) P.vy = 7.5;
  P.vy -= 22 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) P.vy = 0;
  P.aimT = Math.max(0, P.aimT - dt); P.fireCd = Math.max(0, P.fireCd - dt);
  if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) finishReload(); }
  const armed = !state.jail, aiming = armed && (P.aimT > 0 || mouse.right || mouse.down);
  P.rot += angDiff(P.rot, aiming ? cam.yaw : (l > 0 ? Math.atan2(mx, mz) : P.rot)) * Math.min(1, 14 * dt);
  const w = WEAPONS[state.cur];
  if (armed && !state.ui && ((mouse.down && w.auto) || pressed.Mouse0)) fireWeapon();
  animHuman(P, P.speed, dt, aiming);
  P.mesh.position.set(P.x, P.y, P.z); P.mesh.rotation.y = P.rot;
  for (const c of cars) {
    if (c.mode === 'parked' || Math.abs(c.speed) < 5 || c.wreck) continue;
    if (Math.hypot(c.x - P.x, c.z - P.z) < 2.2 && c.hitCool <= 0) { c.hitCool = 0.6; hurt(Math.abs(c.speed) * 1.2); const [fx2, fz2] = carForward(c); P.x += fx2 * 1.5; P.z += fz2 * 1.5; }
  }
  for (const c of cars) { const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz); if (d < 2.0 && d > 0.01) { P.x = c.x + dx / d * 2.0; P.z = c.z + dz / d * 2.0; } }
}

// ---------- camera ----------
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
function updateCamera(dt) {
  if (!state.started) { cam.yaw += dt * 0.12; camera.position.set(Math.sin(cam.yaw) * 95, 58, Math.cos(cam.yaw) * 95); camera.lookAt(0, 10, 0); return; }
  const inCar = !!P.car, subj = inCar ? P.car : P;
  if (inCar && performance.now() - lastMouseMove > 1400 && Math.abs(P.car.speed) > 3) cam.yaw += angDiff(cam.yaw, P.car.speed >= 0 ? P.car.h : P.car.h + Math.PI) * Math.min(1, 2.2 * dt);
  if (keys.ArrowLeft) cam.yaw += 1.8 * dt; if (keys.ArrowRight) cam.yaw -= 1.8 * dt;
  cam.dist += ((inCar ? 12.5 : (mouse.right ? 4.2 : 7)) - cam.dist) * Math.min(1, 6 * dt);
  const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = -Math.cos(cam.yaw), rz = Math.sin(cam.yaw), sh = inCar ? 0 : 0.9;
  camTarget.set(subj.x + rx * sh, (subj.y || 0) + (inCar ? 1.8 : 1.7), subj.z + rz * sh);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const dx = -fx * cp, dy = sp, dz = -fz * cp; let dist = cam.dist;
  const t = rayWorld(camTarget.x, camTarget.y, camTarget.z, dx, dy, dz, dist + 0.6); if (t < dist + 0.6) dist = Math.max(1.2, t - 0.6);
  camPos.set(camTarget.x + dx * dist, Math.max(0.6, camTarget.y + dy * dist), camTarget.z + dz * dist); camera.position.copy(camPos);
  camera.lookAt(camTarget.x + fx * 12, camTarget.y - sp * 3 + 0.4, camTarget.z + fz * 12);
}

// ---------- HUD ----------
const mm = $('minimap').getContext('2d'), bigCanvas = $('bigmap');
function updateHUD() {
  $('cash').textContent = '$' + Math.max(0, Math.round(state.cash)).toLocaleString('en-US');
  $('hpbar').style.width = clamp(P.hp, 0, 100) + '%'; $('armorbar').style.width = clamp(state.armor, 0, 100) + '%';
  $('teamlabel').textContent = (state.team === 'cop' ? '🚔 شرطي' : '🦹 مجرم') + ' · المستوى ' + level();
  $('teamlabel').style.color = state.team === 'cop' ? 'var(--blue)' : 'var(--red)';
  let s = ''; for (let i = 0; i < 5; i++) s += `<span class="${i < state.wanted ? 'on' : 'off'}">★</span>`;
  $('stars').innerHTML = state.team === 'crim' ? s : `<span style="font-size:14px;opacity:.8">اعتقالات: ${state.arrests}</span>`;
  const p = $('prompt'); p.style.display = promptText ? 'block' : 'none'; p.textContent = promptText;
  $('crosshair').style.display = (!P.car && !state.jail && state.started && !state.ui) ? 'block' : 'none';
  const sp = $('speedo'); sp.style.display = P.car ? 'block' : 'none';
  if (P.car) { $('speedv').textContent = Math.round(Math.abs(P.car.speed) * 3.6); $('carhp').style.width = clamp(P.car.hp / P.car.maxHp * 100, 0, 100) + '%'; }
  // weapons
  const inv = state.weapons[state.cur], w = WEAPONS[state.cur], showW = !state.jail && inv;
  $('ammo').style.display = showW && !P.car ? 'block' : 'none';
  if (showW) {
    $('wname').textContent = w.name + (P.reload > 0 ? ' — إعادة التعبئة...' : '');
    $('wammo').textContent = state.cur === 'taser' ? '⚡' : `${inv.mag} / ${inv.res}`;
    let hb = ''; WORDER.forEach((k, i) => { const x = state.weapons[k]; if (x && x.own) hb += `<span class="${k === state.cur ? 'sel' : ''}">${i + 1}</span>`; }); $('hotbar').innerHTML = hb;
  }
  const items = Object.entries(state.items).filter(([k, v]) => v > 0).map(([k, v]) => `${ITEM_NAMES[k]} ×${v}`).join(' · ');
  $('items').textContent = items; $('items').style.display = items ? 'block' : 'none';
  const hh = Math.floor(env.time), mi = Math.floor((env.time - hh) * 60);
  $('clock').textContent = `${env.rain > 0.3 ? '🌧' : env.night > 0.5 ? '🌙' : '☀️'} ${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  // jail box
  const jb = $('jailbox'); jb.style.display = state.jail ? 'block' : 'none';
  if (state.jail) {
    const t = Math.max(0, Math.ceil(state.jail.t)); $('jailtime').textContent = `⛓ المتبقي: ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    $('jailhint').innerHTML = (state.jail.alarm > 0 ? '<b style="color:#ff6a6a">🚨 إنذار! الحراس يطاردونك</b><br>' : '') +
      'طرق الهروب:<br>🥄 ملعقة (المطبخ) ← احفر الجدار المتصدّع في زنزانتك<br>✂️ قاطع أسلاك (مخبأ مضيء) ← السياج الشرقي<br>💳 بطاقة حارس ← البوابة الجنوبية<br><span style="opacity:.7">احذر: الحراس يرونك في الليل أو أثناء الحفر.</span>';
  }
  $('objective').style.display = state.jail ? 'none' : 'block';
  $('objective').textContent = state.team === 'cop'
    ? 'المهمة: اعتقل المجرمين (الدوائر الحمراء على الخريطة). اقترب واضغط E، أو خدّرهم بالصاعق (4). حطّم سياراتهم لإيقافهم.'
    : (state.wanted > 0 ? '🚨 الشرطة تطاردك! اهرب أو اختبئ حتى ينخفض مستوى المطلوب. (القبض عليك = السجن)' : 'المهمة: اسرق البنك أو الكازينو أو المجوهرات (الدوائر الصفراء). اشترِ أدوات من السوق السوداء (المخبأ).');
  drawMinimap(mm, 190, 170, true);
  if (state.ui === 'map') drawBigMap();
}
function drawMinimap(g, W, view, rotate) {
  const sc = W / view, px = P.car ? P.car.x : P.x, pz = P.car ? P.car.z : P.z, yaw = rotate ? cam.yaw : 0;
  g.save(); g.fillStyle = '#222'; g.fillRect(0, 0, W, W);
  g.translate(W / 2, W / 2); g.rotate(yaw + Math.PI); g.scale(sc, sc); g.translate(-px, -pz);
  g.drawImage(mapStatic, -MAPM, -MAPM, MAPM * 2, MAPM * 2);
  const dot = (x, z, c, r = 3.2) => { g.fillStyle = c; g.beginPath(); g.arc(x, z, r * (view > 300 ? 2.2 : 1), 0, TAU); g.fill(); };
  for (const s of spots) dot(s.x, s.z, s.cd <= 0 ? '#ffd23f' : '#777', 4);
  dot(specials.dealer.sx, specials.dealer.sz, '#4dff9a', 4);
  if (state.team === 'cop') for (const e of crooks) if (!e.dead && e.state !== 'arrested') dot(e.x, e.z, Math.floor(state.time * 3) % 2 ? '#ff3030' : '#ff9090', 4.5);
  if (state.team === 'crim') {
    for (const c of cars) if (c.mode === 'chase' && !c.wreck) dot(c.x, c.z, Math.floor(state.time * 4) % 2 ? '#3d7bff' : '#ff3030', 4);
    for (const e of cops) if (e.state === 'chase') dot(e.x, e.z, '#3d7bff', 2.6);
    if (heli) dot(heli.x, heli.z, '#fff', 4);
  }
  if (state.jail) for (const e of guards) if (!e.dead) dot(e.x, e.z, '#ff9d2e', 2.4);
  g.restore();
  g.save(); g.translate(W / 2, W / 2);
  const rel = (P.car ? P.car.h : P.rot) - yaw; g.rotate(Math.PI - rel + Math.PI);
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 9); g.lineTo(-6, -7); g.lineTo(0, -3); g.lineTo(6, -7); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function drawBigMap() { const g = bigCanvas.getContext('2d'); drawMinimap(g, bigCanvas.width, 520, false); }

// ---------- main update ----------
const clock = new THREE.Clock();
function update(dt) {
  state.time += dt;
  const cullH = settings.quality === 'low' ? 80 : 130, cullC = settings.quality === 'low' ? 160 : 230;
  const active = state.started && !state.paused && !state.ui, playing = active && !state.dead;
  for (const c of cars) {
    c.hitCool = Math.max(0, c.hitCool - dt);
    if (c.wreck) { updateIdleCar(c, dt); continue; }
    if (c.mode === 'traffic') updateTraffic(c, dt);
    else if (c.mode === 'chase') { if (state.started && state.team === 'crim' && !state.jail) updateChase(c, dt); else updateIdleCar(c, dt); }
    else if (c.mode === 'idle') updateIdleCar(c, dt);
    else if (c.mode === 'player') { if (playing) drivePlayerCar(c, dt); else updateIdleCar(c, dt); }
  }
  separateCars();
  for (const c of cars) { syncCar(c, dt); c.mesh.visible = c.mode === 'player' || (Math.abs(c.x - camera.position.x) < cullC && Math.abs(c.z - camera.position.z) < cullC); }
  for (let i = cars.length - 1; i >= 0; i--) if (cars[i].wreck && cars[i].burn <= 0 && (cars[i].wreckT = (cars[i].wreckT || 0) + dt) > 25) removeCar(cars[i]);

  if (active) {
    if (!state.dead) {
      if (P.car) { P.x = P.car.x; P.z = P.car.z; P.y = 0; P.speed = P.car.speed; }
      else updateOnFoot(dt);
      interact(dt);
      if (state.regen > 0) state.regen -= dt; else if (P.hp < 100) P.hp = Math.min(100, P.hp + 6 * dt);
      for (let k = 0; k < WORDER.length; k++) if (pressed['Digit' + (k + 1)]) selectWeapon(WORDER[k]);
      if (mouse.wheel) { const own = WORDER.filter(k => state.weapons[k] && state.weapons[k].own); if (own.length && !state.jail) { const i = own.indexOf(state.cur); selectWeapon(own[(i + Math.sign(mouse.wheel) + own.length) % own.length]); } }
      if (pressed.KeyR) reloadWeapon(); if (pressed.KeyQ) useMedkit();
      if (pressed.KeyM) { state.ui = 'map'; document.exitPointerLock(); $('bigmapwrap').classList.remove('hidden'); }
    }
    if (state.jail) {
      const j = state.jail; j.t -= dt; j.suspicious = Math.max(0, j.suspicious - dt); if (j.alarm > 0) j.alarm -= dt;
      if (j.t <= 0 && !state.dead) releaseFromJail();
      else if (!prison.inside(P.x, P.z) && !state.dead) escapePrison(prison.fence.cut ? 'السياج' : prison.gate.open ? 'البوابة' : 'النفق');
    }
    updateWanted(dt); updateSpots(dt);
    state.saveT -= dt; if (state.saveT <= 0) { state.saveT = 12; saveGame(); }
  } else if (state.ui === 'map' && (pressed.KeyM || pressed.Escape)) { state.ui = null; $('bigmapwrap').classList.add('hidden'); tryLock(); }
  if (state.ui === 'shop' && pressed.Escape) closeShop();
  updatePeds(dt); updateCops(dt); updateCrooks(dt); updateGuards(dt); updateHeli(dt);
  for (const list of [peds, cops, crooks, guards]) for (const e of list) {
    if (e.state === 'incar') continue;
    e.mesh.visible = Math.abs(e.x - camera.position.x) < cullH && Math.abs(e.z - camera.position.z) < cullH;
    e.mesh.position.set(e.x, e.dead ? (e.y || 0) + 0.35 : (e.y || 0), e.z); e.mesh.rotation.y = e.rot;
    if (!e.dead) animHuman(e, e.speed, dt, (e.type === 'cop' && e.state === 'chase') || (e.type === 'crook' && (e.state === 'flee')) || (e.type === 'guard' && state.jail && state.jail.alarm > 0));
  }
  for (const list of [peds, cops, crooks, guards]) for (let i = list.length - 1; i >= 0; i--) if (list[i].dead && list[i].t <= 0) removeHuman(list[i], list);
  for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].t -= dt; if (tracers[i].t <= 0) { scene.remove(tracers[i].l); tracers.splice(i, 1); } }
  updateFx(dt);

  state.spawn -= dt;
  if (state.spawn <= 0) {
    state.spawn = 1.2; const ref = state.started ? P : null;
    if (cars.filter(c => c.mode === 'traffic' && !c.getaway).length < 40) spawnTraffic(ref);
    const idle = cars.filter(c => c.mode === 'idle' || c.mode === 'parked');
    if (idle.length > 70) removeCar(idle.sort((a, b) => Math.hypot(b.x - P.x, b.z - P.z) - Math.hypot(a.x - P.x, a.z - P.z))[0]);
    if (peds.filter(e => !e.dead).length < 50) spawnPed();
    if (cops.filter(e => e.state === 'patrol').length < 12) spawnCop(0, 0, true);
    if (state.started && state.team === 'cop' && !state.jail) { const alive = crooks.filter(e => !e.dead).length; if (alive < 3 + (state.arrests > 5 ? 1 : 0) + (state.arrests > 12 ? 1 : 0) && Math.random() < 0.5) spawnCrook(); }
  }

  const nearChase = state.wanted > 0 && cars.some(c => c.mode === 'chase' && !c.wreck && Math.hypot(c.x - P.x, c.z - P.z) < 120);
  sfx.update(!!P.car, P.car ? clamp(Math.abs(P.car.speed) / CAR_STATS[P.car.kind].max, 0, 1) : 0, (nearChase || (P.car && P.car.siren)) ? 1 : 0, state.time, state.jail && state.jail.alarm > 0, heli && !heli.leave ? 1 : 0);
  updateCamera(dt);
  updateEnv(dt, state.started ? new THREE.Vector3(P.x, 0, P.z) : new THREE.Vector3(0, 0, 0));
  if (pressed.KeyT) env.rainTarget = env.rainTarget > 0 ? 0 : 1;
  mouse.wheel = 0; for (const k in pressed) pressed[k] = false;
  if (state.started) updateHUD();
}
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(state.paused ? 0 : dt); renderer.render(scene, camera);
}

// ---------- mouse / pointer lock ----------
function tryLock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
canvas.addEventListener('mousedown', e => {
  if (!state.started || state.ui) return;
  if (!locked && !state.paused) tryLock();
  if (e.button === 0) { mouse.down = true; pressed.Mouse0 = true; } if (e.button === 2) mouse.right = true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; if (e.button === 2) mouse.right = false; });
addEventListener('mousemove', e => {
  if (!state.started || state.paused || state.ui) return;
  if (locked || mouse.down) { cam.yaw -= (e.movementX || 0) * 0.0026; cam.pitch = clamp(cam.pitch + (e.movementY || 0) * 0.0026, -0.25, 1.25); lastMouseMove = performance.now(); }
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && state.started && !state.dead && !state.ui) setPaused(true);
});
function setPaused(v) { state.paused = v; $('pause').classList.toggle('hidden', !v); if (!v) tryLock(); }
$('resume').onclick = () => setPaused(false);
document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => setQuality(b.dataset.q));
$('bigmapclose').onclick = () => { state.ui = null; $('bigmapwrap').classList.add('hidden'); tryLock(); };

// ---------- start ----------
function startGame(team) {
  sfx.init(); state.team = team; state.started = true; state.wanted = 0; state.jail = null; state.saved = null; state.uniform = false;
  const loaded = loadGame(team); buildPlayer(team, false);
  for (const e of crooks.splice(0)) scene.remove(e.mesh);
  for (const c of cars.filter(c => c.mode === 'chase' || c.getaway)) removeCar(c);
  respawn(null, true);
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden'); tryLock();
  toast(loaded ? '💾 تم تحميل تقدّمك السابق' : (team === 'cop' ? '🚔 أهلاً أيها الشرطي! اركب سيارتك (E) وابحث عن اللصوص' : '🦹 أهلاً! توجّه إلى الدوائر الصفراء لتبدأ السرقة'), undefined, 5000);
}
document.querySelectorAll('.card').forEach(c => c.onclick = () => startGame(c.dataset.team));
$('resetsave').onclick = () => { try { localStorage.removeItem(saveKey('cop')); localStorage.removeItem(saveKey('crim')); } catch (e) { } toast('تم مسح التقدّم المحفوظ'); };

// ---------- boot ----------
setQuality(settings.quality);
buildCity(); renderStaticMap();
for (const r of prison.routes.slice(0, 4)) spawnGuard(null, r);
for (const d of prison.guardsDef) spawnGuard(d, null);
for (let i = 0; i < 40; i++) spawnTraffic(null);
for (let i = 0; i < 50; i++) spawnParked(null);
for (let i = 0; i < 40; i++) spawnPed();
for (let i = 0; i < 12; i++) spawnCop(0, 0, true);
buildPlayer('cop'); P.mesh.visible = false;
frame();
window.__game = { state, P, cars, cops, crooks, peds, guards, spots, specials, prison, startGame, cam, keys, env, sendToJail, escapePrison, WEAPONS };

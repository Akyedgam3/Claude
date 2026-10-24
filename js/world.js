'use strict';
/* ===== MAD CITY 3D — world: city, districts, landmarks, prison, minimap ===== */

const PALETTE = ['#b9b4a8', '#8d98a6', '#c4a484', '#9aa8a0', '#a67c6d', '#7f8c9a', '#d0c8b8', '#6f7f8f'];
const roofMat = lam(0x55595f);
const spots = [];          // robbery spots
const specials = {};
let prison = null;
const treePos = [], lampPos = [], houses = [];

// ---------- facades (day map + night emissive map) ----------
const facadeCache = new Map();
function facadeMat(ci) {
  const key = ci;
  if (facadeCache.has(key)) return facadeCache.get(key);
  const S2 = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = S2; return c; };
  const a = mk(), e = mk(), g = a.getContext('2d'), h = e.getContext('2d');
  const base = new THREE.Color(PALETTE[ci]);
  g.fillStyle = PALETTE[ci]; g.fillRect(0, 0, S2, S2);
  for (let n = 0; n < 900; n++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`; g.fillRect(Math.random() * S2, Math.random() * S2, 2 + Math.random() * 6, 1 + Math.random() * 3); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, S2 - 6, S2, 6); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, S2 - 10, S2, 3);
  h.fillStyle = '#000'; h.fillRect(0, 0, S2, S2);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
    const x = 16 + k * 60, y = 18 + r * 116, w = 40, hh = 80, lit = Math.random() < 0.4;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 4, y - 4, w + 8, hh + 8);                 // frame shadow
    const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, '#6f93b8'); gr.addColorStop(0.45, '#2b4059'); gr.addColorStop(1, '#17222f');
    g.fillStyle = gr; g.fillRect(x, y, w, hh);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.55, y); g.lineTo(x, y + hh * 0.5); g.fill(); // reflection
    g.fillStyle = '#d6d6d0'; g.fillRect(x + w / 2 - 1, y, 2, hh); g.fillRect(x, y + hh * 0.5 - 1, w, 2);      // mullions
    g.fillStyle = '#e7e4dc'; g.fillRect(x - 5, y + hh, w + 10, 5);                                           // sill
    if (Math.random() < 0.25) { g.fillStyle = '#9aa0a6'; g.fillRect(x + 6, y + hh + 6, 26, 14); g.fillStyle = '#6c7278'; g.fillRect(x + 6, y + hh + 6, 26, 3); } // AC unit
    if (lit) { h.fillStyle = pick(['#ffe9a8', '#ffd98a', '#fff4cf', '#bcdcff']); h.fillRect(x, y, w, hh); if (Math.random() < 0.5) { g.fillStyle = 'rgba(235,225,200,.55)'; g.fillRect(x, y, w, hh * 0.6); } }
  }
  const t1 = new THREE.CanvasTexture(a), t2 = new THREE.CanvasTexture(e);
  for (const t of [t1, t2]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  const m = new THREE.MeshLambertMaterial({ map: t1, emissiveMap: t2, emissive: 0xffffff, emissiveIntensity: 0 });
  env.facadeMats.push(m); facadeCache.set(key, m); return m;
}
function signTexture(text, bg, fg, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.font = 'bold 60px system-ui, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function roadTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#2b2d33'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(Math.random() * 64, Math.random() * 64, 1.5, 1.5); }
  g.fillStyle = '#e9e9e9'; g.fillRect(2, 0, 2, 64); g.fillRect(60, 0, 2, 64);
  g.fillStyle = '#f2c200'; g.fillRect(30, 4, 4, 28);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// ---------- building helpers ----------
function addBuilding(cx, cz, w, d, h, ci, tint) {
  let mat = facadeMat(ci);
  if (tint) { mat = mat.clone(); mat.color.set(tint); env.facadeMats.push(mat); }
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, ry = Math.max(1, Math.round(h / 8));
  const rxd = Math.max(1, Math.round(d / 8)), rxw = Math.max(1, Math.round(w / 8));
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f < 2) uv.setXY(i, uv.getX(i) * rxd, uv.getY(i) * ry);
    else if (f < 4) uv.setXY(i, 0.03, 0.5);
    else uv.setXY(i, uv.getX(i) * rxw, uv.getY(i) * ry);
  }
  const m = new THREE.Mesh(geo, mat);
  m.position.set(cx, h / 2 + 0.3, cz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, h + 0.3);
  if (h > 70) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 5), lam(0xbb2222)); an.position.set(cx, h + 7.3, cz); scene.add(an); }
  return m;
}
function addSign(text, bg, fg, x, y, z, w = 18) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: signTexture(text, bg, fg) }));
  p.position.set(x, y, z); scene.add(p);
}
function addSpecial(key, i, j, o) {
  const bx = bc(i), bz = bc(j), cz = bz - 6;
  addBuilding(bx, cz, o.w, o.d, o.h, o.ci, o.tint);
  const front = cz + o.d / 2;
  addSign(o.title, o.bg, o.fg, bx, Math.min(o.h - 2.5, 7.5), front + 0.1, Math.min(o.w - 4, 20));
  const door = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), new THREE.MeshBasicMaterial({ color: 0x151a22 }));
  door.position.set(bx, 2.4, front + 0.08); scene.add(door);
  specials[key] = { i, j, x: bx, z: bz, front, doorZ: front + 6 };
}
function makeMarker(color) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.12, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
  ring.position.y = 0.4;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 22, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }));
  beam.position.y = 11; g.add(ring, beam); g.userData = { ring, beam };
  scene.add(g); return g;
}
function placeMarker(color, x, z, r = 1) { const m = makeMarker(color); m.position.set(x, 0, z); m.scale.set(r, 1, r); return m; }

// ---------- prison ----------
function buildPrison(i, j) {
  const px = bc(i), pz = bc(j);
  const pr = { x: px, z: pz, i, j, markers: {}, stashes: [], guardsDef: [] };
  const wallMat = lam(0x8a8a86), darkMat = lam(0x55565a);
  const W = (x0, z0, x1, z1, h, mat = wallMat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), mat);
    m.position.set(px + (x0 + x1) / 2, h / 2 + 0.3, pz + (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; scene.add(m);
    return { mesh: m, col: addCollider(px + x0, px + x1, pz + z0, pz + z1, h + 0.3) };
  };
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(56, 56).rotateX(-Math.PI / 2), lam(0x78756c));
  yard.position.set(px, 0.32, pz); yard.receiveShadow = true; scene.add(yard);
  // perimeter
  W(-29, -29, 29, -27, 5); W(-29, 27, -4, 29, 5); W(4, 27, 29, 29, 5); W(-29, -29, -27, 29, 5);
  W(27, -29, 29, -7, 5); W(27, 7, 29, 29, 5);
  // electric wire along the top
  for (const [x0, z0, x1, z1] of [[-29, -28.5, 29, -27.5], [-29, 27.5, 29, 28.5], [-28.5, -29, -27.5, 29], [27.5, -29, 28.5, 29]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.25, z1 - z0), lam(0x222222)); m.position.set(px + (x0 + x1) / 2, 5.6, pz + (z0 + z1) / 2); scene.add(m);
  }
  // fence section (east) — cuttable
  const fc = document.createElement('canvas'); fc.width = fc.height = 64; const fg = fc.getContext('2d');
  fg.strokeStyle = '#cfd3d8'; fg.lineWidth = 2; for (let k = -64; k < 128; k += 12) { fg.beginPath(); fg.moveTo(k, 0); fg.lineTo(k + 64, 64); fg.stroke(); fg.beginPath(); fg.moveTo(k + 64, 0); fg.lineTo(k, 64); fg.stroke(); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 1.4);
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.4), new THREE.MeshBasicMaterial({ map: ft, transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 }));
  fence.rotation.y = Math.PI / 2; fence.position.set(px + 28, 2.5, pz); scene.add(fence);
  pr.fence = { mesh: fence, col: addCollider(px + 27.6, px + 28.4, pz - 7, pz + 7, 4.7), cut: false };
  // gate
  const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 0.6), lam(0x3b4048)); gate.position.set(px, 2.55, pz + 28); gate.castShadow = true; scene.add(gate);
  pr.gate = { mesh: gate, col: addCollider(px - 4, px + 4, pz + 27.7, pz + 28.3, 4.8), open: false, t: 0 };
  pr.setGate = open => {
    const g = pr.gate; if (g.open === open) return; g.open = open;
    if (open) removeCollider(g.col); else if (!colliders.includes(g.col)) colliders.push(g.col);
  };
  pr.cutFence = () => { if (pr.fence.cut) return; pr.fence.cut = true; removeCollider(pr.fence.col); pr.fence.mesh.visible = false; };
  pr.resetFence = () => { if (!pr.fence.cut) return; pr.fence.cut = false; colliders.push(pr.fence.col); pr.fence.mesh.visible = true; };
  // towers
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tx = sx * 23.5, tz = sz * 23.5;
    const t = new THREE.Mesh(new THREE.BoxGeometry(5, 11, 5), darkMat); t.position.set(px + tx, 5.8, pz + tz); t.castShadow = true; scene.add(t);
    const r = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.2, 4), lam(0x7a2222)); r.rotation.y = Math.PI / 4; r.position.set(px + tx, 12.4, pz + tz); scene.add(r);
    addCollider(px + tx - 2.5, px + tx + 2.5, pz + tz - 2.5, pz + tz + 2.5, 11.3);
    pr.guardsDef.push({ tower: true, x: px + tx - sx * 2.8, z: pz + tz - sz * 2.8, y: 11.4 });
  }
  // cell block
  W(-16, -24.4, 16, -23.6, 4.5); W(-16, -10.4, -3, -9.6, 4.5); W(3, -10.4, 16, -9.6, 4.5); W(-16.4, -24, -15.6, -10, 4.5); W(15.6, -24, 16.4, -10, 4.5);
  for (const x of [-8, 0, 8]) W(x - 0.3, -24, x + 0.3, -17, 4.5, lam(0x9c9c98));
  const roof = new THREE.Mesh(new THREE.BoxGeometry(33.4, 0.4, 15.4), lam(0x4b4c52)); roof.position.set(px, 5.1, pz - 17); roof.castShadow = true; scene.add(roof);
  for (const cx of [-12, -4, 4, 12]) {
    const bunk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 3.2), lam(0x4a5a7a)); bunk.position.set(px + cx - 2.6, 0.8, pz - 21.5); scene.add(bunk);
    const pill = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.6), lam(0xe8e8e0)); pill.position.set(px + cx - 2.6, 1.35, pz - 22.6); scene.add(pill);
  }
  // cafeteria
  const caf = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 8), lam(0xb3a58a)); caf.position.set(px + 18, 2.8, pz + 8); caf.castShadow = true; scene.add(caf);
  addCollider(px + 12, px + 24, pz + 4, pz + 12, 5.3);
  // spots (relative coordinates)
  pr.cell = { x: px - 4, z: pz - 19.5 };
  pr.release = { x: px, z: pz + 34 };
  pr.tunnelExit = { x: px - 4, z: pz - 31.5 };
  pr.loose = { x: px - 4, z: pz - 22.6 };
  pr.spoonSpot = { x: px + 18, z: pz + 15 };
  pr.stashPoints = [{ x: px - 20, z: pz + 8 }, { x: px - 12, z: pz + 20 }, { x: px + 18, z: pz - 4 }];
  pr.fenceSpot = { x: px + 24.5, z: pz };
  pr.gateSpot = { x: px, z: pz + 24 };
  pr.markers.loose = placeMarker(0xc08040, pr.loose.x, pr.loose.z, 0.7);
  pr.markers.spoon = placeMarker(0xffffff, pr.spoonSpot.x, pr.spoonSpot.z, 0.7);
  pr.markers.cutters = placeMarker(0xb0ff60, pr.stashPoints[0].x, pr.stashPoints[0].z, 0.7);
  pr.markers.fence = placeMarker(0x40e0ff, pr.fenceSpot.x, pr.fenceSpot.z, 0.8);
  pr.markers.gate = placeMarker(0x40ff80, pr.gateSpot.x, pr.gateSpot.z, 0.9);
  pr.setMarkersVisible = v => { for (const k in pr.markers) pr.markers[k].visible = v; };
  pr.setMarkersVisible(false);
  pr.inside = (x, z) => Math.abs(x - px) < 28.5 && Math.abs(z - pz) < 28.5;
  pr.inCellBlock = (x, z) => x > px - 16 && x < px + 16 && z > pz - 24 && z < pz - 10;
  // guard routes
  const rel = (a) => a.map(([x, z]) => ({ x: px + x, z: pz + z }));
  pr.routes = [rel([[-22, -5], [22, -5], [22, 22], [-22, 22]]), rel([[-9, 2], [9, 2], [9, 19], [-9, 19]]), rel([[-12, -13.5], [12, -13.5]]), rel([[-22, 22], [22, 22], [22, -5], [-22, -5]])];
  return pr;
}

// ---------- city ----------
const specialDefs = {
  police: { at: [4, 5], o: { w: 44, d: 30, h: 16, ci: 5, tint: '#c9d6ff', title: 'POLICE | شرطة', bg: '#10306b', fg: '#ffffff' } },
  bank: { at: [5, 4], o: { w: 44, d: 34, h: 24, ci: 6, tint: '#ffffff', title: 'BANK | بنك', bg: '#3a2a08', fg: '#ffd23f' } },
  jewel: { at: [3, 3], o: { w: 34, d: 26, h: 14, ci: 4, tint: '#e8d4ff', title: 'JEWELRY | مجوهرات', bg: '#3b1458', fg: '#f6c7ff' } },
  gas: { at: [6, 6], o: { w: 26, d: 18, h: 8, ci: 1, tint: '#ffe0c0', title: 'GAS | وقود', bg: '#7a2a05', fg: '#ffffff' } },
  dealer: { at: [3, 6], o: { w: 38, d: 26, h: 10, ci: 7, tint: '#cfe9ff', title: 'CARS | معرض سيارات', bg: '#0b3d2a', fg: '#7dffb8' } },
  hideout: { at: [7, 2], o: { w: 36, d: 28, h: 12, ci: 7, tint: '#7d6a6a', title: 'HIDEOUT | المخبأ', bg: '#2a0b0b', fg: '#ff6a6a' } },
  hospital: { at: [6, 3], o: { w: 40, d: 30, h: 20, ci: 6, tint: '#ffffff', title: 'HOSPITAL | مستشفى', bg: '#ffffff', fg: '#d02020' } },
  market: { at: [8, 6], o: { w: 36, d: 24, h: 9, ci: 3, tint: '#d4ffd9', title: 'MARKET | سوبرماركت', bg: '#0f4d1c', fg: '#ffffff' } },
  casino: { at: [4, 2], o: { w: 42, d: 32, h: 26, ci: 4, tint: '#ffd0f0', title: 'CASINO | كازينو', bg: '#2a0033', fg: '#ffcc33' } }
};
const PRISON_AT = [9, 0];
const PARKS = [[1, 4], [8, 4], [5, 8], [1, 1], [7, 8], [5, 1], [9, 9], [0, 7]];

function buildCity() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshLambertMaterial({ color: 0x4f7a43 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
  // mountains on the horizon
  for (let k = 0; k < 30; k++) {
    const a = k / 30 * TAU + rnd(-0.1, 0.1), r = rnd(1250, 1500), h = rnd(160, 420);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(220, 380), h, 7), new THREE.MeshLambertMaterial({ color: pick([0x5d6b52, 0x6e7a6a, 0x566350, 0x7b7f78]), fog: false }));
    m.position.set(Math.cos(a) * r, h / 2 - 20, Math.sin(a) * r); scene.add(m);
  }

  // roads
  const Ltot = N * S + R, tex = roadTexture();
  for (let k = 0; k <= N; k++) for (const axis of ['x', 'z']) {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(1, Ltot / 16);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R, Ltot).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: t }));
    m.receiveShadow = true;
    if (axis === 'z') m.position.set(rc(k), 0.02, 0); else { m.rotation.y = Math.PI / 2; m.position.set(0, 0.02, rc(k)); }
    scene.add(m);
  }
  const isect = new THREE.MeshLambertMaterial({ color: 0x2b2d33 }), zebra = new THREE.MeshBasicMaterial({ color: 0xe6e6e6 });
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R, R).rotateX(-Math.PI / 2), isect); m.position.set(rc(a), 0.04, rc(b)); m.receiveShadow = true; scene.add(m);
  }
  // crosswalks (instanced stripes)
  const stripes = []; 
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) for (const [dx, dz, ax] of [[0, 1, 'x'], [0, -1, 'x'], [1, 0, 'z'], [-1, 0, 'z']]) for (let s = -3; s <= 3; s++) {
    const x = rc(a) + (ax === 'x' ? s * 2.2 : dx * (R / 2 + 1.4)), z = rc(b) + (ax === 'x' ? dz * (R / 2 + 1.4) : s * 2.2);
    if (Math.abs(x) > WORLD - 10 || Math.abs(z) > WORLD - 10) continue; stripes.push([x, z, ax]);
  }
  const zi = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 3).rotateX(-Math.PI / 2), zebra, stripes.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  stripes.forEach(([x, z, ax], k) => { m4.compose(new THREE.Vector3(x, 0.06, z), ax === 'x' ? q : qy, new THREE.Vector3(1, 1, 1)); zi.setMatrixAt(k, m4); }); scene.add(zi);

  const isSpecial = (i, j) => Object.values(specialDefs).some(v => v.at[0] === i && v.at[1] === j) || (i === PRISON_AT[0] && j === PRISON_AT[1]);
  const isPark = (i, j) => PARKS.some(v => v[0] === i && v[1] === j);
  const zoneOf = (i, j) => { const d = Math.hypot(i - 4.5, j - 4.5); if ((i <= 2 || i >= 7) && j >= 7) return 'ind'; return d < 2.4 ? 'down' : d < 4.3 ? 'mid' : 'sub'; };

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const bx = bc(i), bz = bc(j), park = isPark(i, j);
    const side = new THREE.Mesh(new THREE.BoxGeometry(B, 0.3, B), lam(park ? 0x4c8f3d : 0x9d9d98));
    side.position.set(bx, 0.15, bz); side.receiveShadow = true; scene.add(side);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      lampPos.push([bx + sx * (B / 2 - 1), bz + sz * (B / 2 - 1)]);
      treePos.push([bx + sx * (B / 2 - 3.5), bz + sz * (B / 2 - 12)]);
    }
    if (park) {
      for (let k = 0; k < 24; k++) treePos.push([bx + rnd(-26, 26), bz + rnd(-26, 26)]);
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.1, 24), new THREE.MeshLambertMaterial({ color: 0x3a8fd6 })); pond.position.set(bx, 0.33, bz); scene.add(pond); continue;
    }
    if (isSpecial(i, j)) continue;
    const z = zoneOf(i, j);
    if (z === 'down') {
      if (Math.random() < 0.35) addBuilding(bx, bz, 44, 44, rnd(70, 150), rint(0, 7));
      else for (const a of [-1, 1]) for (const b of [-1, 1]) { if (Math.random() < 0.08) continue; addBuilding(bx + a * 13.5, bz + b * 13.5, rnd(17, 22), rnd(17, 22), rnd(35, 110), rint(0, 7)); }
    } else if (z === 'mid') {
      if (Math.random() < 0.2) addBuilding(bx, bz, 46, 46, rnd(18, 40), rint(0, 7));
      else for (const a of [-1, 1]) for (const b of [-1, 1]) { if (Math.random() < 0.1) continue; addBuilding(bx + a * 13.5, bz + b * 13.5, rnd(16, 22), rnd(16, 22), rnd(14, 42), rint(0, 7)); }
    } else if (z === 'ind') {
      addBuilding(bx - 14, bz - 8, 24, 38, rnd(9, 13), 7); addBuilding(bx + 14, bz - 8, 22, 34, rnd(9, 13), 1);
      for (let k = 0; k < 7; k++) {
        const cx = bx - 20 + (k % 4) * 13, cz = bz + 17 + Math.floor(k / 4) * 5, cm = new THREE.Mesh(new THREE.BoxGeometry(11, 2.7, 2.6), lam(pick([0xc0392b, 0x2980b9, 0xd68910, 0x27ae60, 0x7f8c8d])));
        cm.position.set(cx, 1.65, cz); cm.castShadow = true; scene.add(cm); addCollider(cx - 5.5, cx + 5.5, cz - 1.3, cz + 1.3, 3);
      }
    } else {
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) {
        if (Math.random() < 0.12) continue;
        const w = rnd(11, 14), d = rnd(10, 13), hx = bx + a * 19, hz = bz + b * 19;
        houses.push({ x: hx, z: hz, w, d, h: rnd(5, 7), body: pick([0xe8dcc0, 0xd9b99b, 0xb8c4d0, 0xcfd8c0, 0xe0c3c3, 0xf2efe6, 0xc9b79c]), roof: pick([0x7a3b2e, 0x5b4636, 0x3e4a57, 0x8a4a2a]) });
        addCollider(hx - w / 2, hx + w / 2, hz - d / 2, hz + d / 2, 7);
        if (Math.random() < 0.6) treePos.push([hx + rnd(-8, 8), hz + (b >= 0 ? 8.5 : -8.5)]);
      }
    }
  }

  for (const [k, v] of Object.entries(specialDefs)) addSpecial(k, v.at[0], v.at[1], v.o);
  prison = buildPrison(PRISON_AT[0], PRISON_AT[1]);
  specials.prison = { x: prison.x, z: prison.z, doorZ: prison.z + 30 };
  const pSign = signTexture('PRISON | سجن', '#222', '#ff9d2e'); const ps = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshBasicMaterial({ map: pSign })); ps.position.set(prison.x, 7, prison.z + 29.3); scene.add(ps);

  // robbery spots
  const defs = [
    { key: 'bank', name: 'البنك', reward: [4000, 7000], time: 14, wanted: 4, drill: true },
    { key: 'casino', name: 'الكازينو', reward: [5500, 9000], time: 16, wanted: 5, drill: true },
    { key: 'jewel', name: 'محل المجوهرات', reward: [2000, 3500], time: 10, wanted: 3, drill: true },
    { key: 'market', name: 'السوبرماركت', reward: [900, 1700], time: 7, wanted: 2 },
    { key: 'gas', name: 'محطة الوقود', reward: [600, 1200], time: 5, wanted: 2 }
  ];
  for (const d of defs) { const s = specials[d.key]; spots.push({ ...d, x: s.x, z: s.doorZ, cd: 0, marker: placeMarker(0xffd23f, s.x, s.doorZ) }); }
  specials.dealer.sx = specials.dealer.x; specials.dealer.sz = specials.dealer.doorZ; specials.dealer.marker = placeMarker(0x4dff9a, specials.dealer.sx, specials.dealer.sz);
  specials.hideout.marker = placeMarker(0xff6a6a, specials.hideout.x, specials.hideout.doorZ); specials.hideout.sx = specials.hideout.x; specials.hideout.sz = specials.hideout.doorZ;
  specials.police.marker = placeMarker(0x4da3ff, specials.police.x, specials.police.doorZ); specials.police.sx = specials.police.x; specials.police.sz = specials.police.doorZ;
  specials.hospital.marker = placeMarker(0xffffff, specials.hospital.x, specials.hospital.doorZ); specials.hospital.sx = specials.hospital.x; specials.hospital.sz = specials.hospital.doorZ;

  // border fences
  const fenceMat = lam(0xd96a1a);
  for (const [x, z, w, d] of [[0, -WORLD, 2 * WORLD, 1], [0, WORLD, 2 * WORLD, 1], [-WORLD, 0, 1, 2 * WORLD], [WORLD, 0, 1, 2 * WORLD]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), fenceMat); f.position.set(x, 1.1, z); scene.add(f); }

  // instanced houses
  if (houses.length) {
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), houses.length);
    const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), new THREE.MeshLambertMaterial({ color: 0xffffff }), houses.length);
    const col = new THREE.Color();
    houses.forEach((h, k) => {
      m4.compose(new THREE.Vector3(h.x, 0.3 + h.h / 2, h.z), q, new THREE.Vector3(h.w, h.h, h.d)); bodies.setMatrixAt(k, m4); bodies.setColorAt(k, col.setHex(h.body));
      const rh = 3.6; m4.compose(new THREE.Vector3(h.x, 0.3 + h.h + rh / 2, h.z), q, new THREE.Vector3(h.w * 0.78, rh, h.d * 0.78)); roofs.setMatrixAt(k, m4); roofs.setColorAt(k, col.setHex(h.roof));
    });
    bodies.castShadow = roofs.castShadow = true; bodies.receiveShadow = true; scene.add(bodies, roofs);
  }
  // traffic lights (visual, driven by signalState) + street props
  const sigHousing = [], sigPos = { x: [], z: [] };
  for (let a2 = 0; a2 <= N; a2++) for (let b2 = 0; b2 <= N; b2++) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = rc(a2) + sx * 10.2, z = rc(b2) + sz * 10.2;
    if (Math.abs(x) > WORLD - 8 || Math.abs(z) > WORLD - 8) continue;
    sigPos[sx * sz > 0 ? 'x' : 'z'].push([x - sx * 1.1, z - sz * 1.1]);
  }
  const housingGeo = new THREE.BoxGeometry(0.5, 1.5, 0.45), lampGeo = new THREE.BoxGeometry(0.28, 0.28, 0.1), darkM = lam(0x1a1a1a);
  window.signalMats = {};
  for (const ax of ['x', 'z']) {
    const list = sigPos[ax], hs = new THREE.InstancedMesh(housingGeo, darkM, list.length);
    const lamps = { r: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xff2020 }), list.length), y: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xffc020 }), list.length), g: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x20ff60 }), list.length) };
    list.forEach(([x, z], k) => {
      m4.makeTranslation(x, 5.4, z); hs.setMatrixAt(k, m4);
      const rot = new THREE.Matrix4().makeRotationY(ax === 'x' ? 0 : Math.PI / 2);
      for (const [key, dy] of [['r', 0.45], ['y', 0], ['g', -0.45]]) { const lm = new THREE.Matrix4().makeTranslation(x, 5.4 + dy, z + 0.24); lamps[key].setMatrixAt(k, lm); }
    });
    scene.add(hs, lamps.r, lamps.y, lamps.g); window.signalMats[ax] = { r: lamps.r.material, y: lamps.y.material, g: lamps.g.material };
  }
  const hyd = [], bins = [], benches = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const bx = bc(i), bz = bc(j);
    for (let k = 0; k < 4; k++) {
      const side = k, t = rnd(-20, 20), x = side < 2 ? bx + t : bx + (side === 2 ? 28.5 : -28.5), z = side < 2 ? bz + (side === 0 ? 28.5 : -28.5) : bz + t;
      (k === 0 ? hyd : k === 1 ? bins : benches).push([x, z, side < 2 ? 0 : Math.PI / 2]);
    }
  }
  const qq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  const mkInst = (geo, mat, arr, y) => { const im = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach(([x, z, r], k) => { m4.compose(new THREE.Vector3(x, y, z), qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r), one); im.setMatrixAt(k, m4); }); im.castShadow = true; scene.add(im); };
  mkInst(new THREE.CylinderGeometry(0.16, 0.2, 0.75, 8), lam(0xc0281c), hyd, 0.7);
  mkInst(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), lam(0x4b5560), bins, 0.75);
  mkInst(new THREE.BoxGeometry(1.8, 0.45, 0.5), lam(0x7a5230), benches, 0.55);
  // instanced trees + lamps + light pools
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 3, 6), lam(0x6b4a2b), treePos.length);
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4, 0), lam(0x2f7a35), treePos.length);
  treePos.forEach(([x, z], k) => {
    const s = rnd(0.9, 1.5);
    m4.compose(new THREE.Vector3(x, 1.8, z), q, new THREE.Vector3(s, s, s)); trunks.setMatrixAt(k, m4);
    m4.compose(new THREE.Vector3(x, 4.6 * s, z), q, new THREE.Vector3(s, s, s)); leaves.setMatrixAt(k, m4);
  });
  trunks.castShadow = leaves.castShadow = true; scene.add(trunks, leaves);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 6), lam(0x3a3f47), lampPos.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), lampPos.length);
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gg = gc.getContext('2d'), gr = gg.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,225,150,1)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
  const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(22, 22).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), lampPos.length);
  lampPos.forEach(([x, z], k) => {
    m4.makeTranslation(x, 3.8, z); poles.setMatrixAt(k, m4); m4.makeTranslation(x, 7.3, z); heads.setMatrixAt(k, m4);
    m4.makeTranslation(x - Math.sign(x) * 0, 0.4, z); glow.setMatrixAt(k, m4);
  });
  glow.frustumCulled = false; env.glow = glow; scene.add(poles, heads, glow);
}

// ---------- minimap (static layer) ----------
const MAPM = Math.ceil(WORLD + 10);
const mapStatic = document.createElement('canvas'); mapStatic.width = mapStatic.height = MAPM * 4;
function renderStaticMap() {
  const g = mapStatic.getContext('2d'), s = 2, X = v => (v + MAPM) * s;
  g.fillStyle = '#35693a'; g.fillRect(0, 0, MAPM * 4, MAPM * 4);
  g.fillStyle = '#4b4e55';
  for (let k = 0; k <= N; k++) { g.fillRect(X(rc(k) - R / 2), X(-WORLD), R * s, 2 * WORLD * s); g.fillRect(X(-WORLD), X(rc(k) - R / 2), 2 * WORLD * s, R * s); }
  g.fillStyle = '#8e8e88'; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#3d7a37'; for (const [i, j] of PARKS) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#c8ccd2'; for (const c of colliders) g.fillRect(X(c.x0), X(c.z0), (c.x1 - c.x0) * s, (c.z1 - c.z0) * s);
  const lab = (key, col, txt) => { const p = specials[key]; g.fillStyle = col; g.fillRect(X(p.x - 13), X(p.z - 20), 26 * s, 26 * s); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(txt, X(p.x), X(p.z) - 4); };
  lab('police', '#1d4fb8', 'P'); lab('bank', '#b8860b', '$'); lab('jewel', '#8a3bb8', '◆'); lab('gas', '#b84a1d', 'G'); lab('dealer', '#1d9a5a', 'C');
  lab('hideout', '#a01d1d', 'H'); lab('hospital', '#d02020', '+'); lab('market', '#1d7a2d', 'M'); lab('casino', '#8a1db8', '♠');
  g.fillStyle = '#222'; g.fillRect(X(prison.x - 29), X(prison.z - 29), 58 * s, 58 * s); g.fillStyle = '#c8ccd2'; for (const c of colliders) if (Math.abs(c.x0 - prison.x) < 30 && Math.abs(c.z0 - prison.z) < 30) g.fillRect(X(c.x0), X(c.z0), (c.x1 - c.x0) * s, (c.z1 - c.z0) * s);
  g.fillStyle = '#ff9d2e'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('⛓', X(prison.x), X(prison.z) + 10);
}

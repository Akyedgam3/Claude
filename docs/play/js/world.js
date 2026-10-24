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
// ---------- chunked static geometry (few draw calls) ----------
const CHN = 4, buckets = new Map();
const chunkKey = (x, z) => Math.floor((x + WORLD) / (CHN * S)) + ',' + Math.floor((z + WORLD) / (CHN * S));
function bucketAdd(x, z, id, mat, geo, shadow = true) { const k = chunkKey(x, z) + '|' + id; let b = buckets.get(k); if (!b) buckets.set(k, b = { mat, geos: [], shadow }); b.geos.push(geo); }
function flushBuckets() {
  for (const b of buckets.values()) { const m = new THREE.Mesh(mergeBuffers(b.geos), b.mat); m.castShadow = b.shadow; m.receiveShadow = b.shadow; scene.add(m); }
  buckets.clear();
}
function addBuilding(cx, cz, w, d, h, ci, tint) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, ry = Math.max(1, Math.round(h / 8));
  const rxd = Math.max(1, Math.round(d / 8)), rxw = Math.max(1, Math.round(w / 8));
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f < 2) uv.setXY(i, uv.getX(i) * rxd, uv.getY(i) * ry); else if (f < 4) uv.setXY(i, 0.03, 0.5); else uv.setXY(i, uv.getX(i) * rxw, uv.getY(i) * ry);
  }
  geo.translate(cx, h / 2 + 0.3, cz);
  if (tint) { const mat = facadeMat(ci).clone(); mat.color.set(tint); env.facadeMats.push(mat); const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; scene.add(m); }
  else bucketAdd(cx, cz, 'f' + ci, facadeMat(ci), geo);
  addCollider(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, h + 0.3);
  if (h > 110) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 5), lam(0xbb2222)); an.position.set(cx, h + 7.3, cz); scene.add(an); }
}
// sign atlas: 4 x 16 cells of 512x128
const atlas = { c: document.createElement('canvas'), cells: new Map(), next: 0, tex: null };
atlas.c.width = atlas.c.height = 2048; atlas.tex = new THREE.CanvasTexture(atlas.c); atlas.tex.anisotropy = 8;
const signMat = new THREE.MeshBasicMaterial({ map: atlas.tex }), doorMat = new THREE.MeshBasicMaterial({ color: 0x1a2230 });
function signCell(key, text, bg, fg) {
  if (atlas.cells.has(key)) return atlas.cells.get(key);
  const idx = Math.min(atlas.next++, 63), col = idx % 4, row = Math.floor(idx / 4), g = atlas.c.getContext('2d'), x = col * 512, y = row * 128;
  g.fillStyle = bg; g.fillRect(x, y, 512, 128); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(x + 6, y + 6, 500, 116);
  g.fillStyle = fg; g.font = 'bold 54px system-ui, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + 256, y + 68);
  atlas.tex.needsUpdate = true; atlas.cells.set(key, idx); return idx;
}
function addSignQuad(idx, x, y, z, nx, nz, w, h) {
  const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv, col = idx % 4, row = Math.floor(idx / 4);
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / 4, 1 - (row + 1 - uv.getY(k)) / 16);
  g.rotateY(Math.atan2(nx, nz)); g.translate(x, y, z); bucketAdd(x, z, 'sign', signMat, g, false);
}
function addDoorQuad(x, z, nx, nz) { const g = new THREE.PlaneGeometry(2.8, 3.4); g.rotateY(Math.atan2(nx, nz)); g.translate(x, 2.0, z); bucketAdd(x, z, 'door', doorMat, g, false); }
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
    if (open) removeCollider(g.col); else restoreCollider(g.col);
  };
  pr.cutFence = () => { if (pr.fence.cut) return; pr.fence.cut = true; removeCollider(pr.fence.col); pr.fence.mesh.visible = false; };
  pr.resetFence = () => { if (!pr.fence.cut) return; pr.fence.cut = false; restoreCollider(pr.fence.col); pr.fence.mesh.visible = true; };
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
  const roof = new THREE.Mesh(new THREE.BoxGeometry(33.4, 0.4, 15.4), lam(0x4b4c52)); roof.position.set(px, 5.1, pz - 17); scene.add(roof); pr.roof = roof;
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


// ---------- bank with a real interior and vault ----------
let bank = null;
function buildBank(i, j) {
  const bx = bc(i), bz = bc(j), cz = bz - 6, front = cz + 17, back = cz - 17, H = 12, ci = 6;
  const wall = (x0, z0, x1, z1, h = H) => addBuilding((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, h, ci, '#f4efe2');
  wall(bx - 22, back, bx + 22, back + 0.8); wall(bx - 22, back, bx - 21.2, front); wall(bx + 21.2, back, bx + 22, front);
  wall(bx - 22, front - 0.8, bx - 3, front); wall(bx + 3, front - 0.8, bx + 22, front);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6, H - 4.6, 0.8), lam(0xd9d3c4)); lintel.position.set(bx, 4.6 + (H - 4.6) / 2 + 0.3, front - 0.4); scene.add(lintel);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(44.4, 0.5, 34.4), lam(0x6a6e75)); roof.position.set(bx, H + 0.55, cz); scene.add(roof);
  // marble floor
  const fc = document.createElement('canvas'); fc.width = fc.height = 128; const fg = fc.getContext('2d');
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { fg.fillStyle = (a + b) % 2 ? '#d8d4cc' : '#aaa59b'; fg.fillRect(a * 32, b * 32, 32, 32); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(11, 8.5); ft.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(43, 33).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: ft })); floor.position.set(bx, 0.32, cz); floor.receiveShadow = true; scene.add(floor);
  // counter + glass
  const cnt = new THREE.Mesh(new THREE.BoxGeometry(26, 1.1, 1.6), lam(0x5a3b24)); cnt.position.set(bx, 0.85, cz + 3); cnt.castShadow = true; scene.add(cnt); addCollider(bx - 13, bx + 13, cz + 2.2, cz + 3.8, 1.4);
  const top = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.08, 1.8), lam(0xd9d2c4)); top.position.set(bx, 1.43, cz + 3); scene.add(top);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(26, 1.1, 0.05), new THREE.MeshPhongMaterial({ color: 0x9fc4d8, transparent: true, opacity: 0.25, shininess: 90 })); glass.position.set(bx, 2.1, cz + 3); scene.add(glass);
  // vault wall + steel door
  wall(bx - 22, cz - 9.4, bx - 2.5, cz - 8.6); wall(bx + 2.5, cz - 9.4, bx + 22, cz - 8.6);
  const door = new THREE.Group(); const slab = new THREE.Mesh(new THREE.BoxGeometry(5, 4.4, 0.6), new THREE.MeshPhongMaterial({ color: 0x8a9099, shininess: 80 })); slab.castShadow = true; door.add(slab);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 6, 16), lam(0xcfa04a)); wheel.position.z = 0.35; door.add(wheel);
  for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.07), lam(0xcfa04a)); sp.position.z = 0.35; sp.rotation.z = k * Math.PI / 4; door.add(sp); }
  door.position.set(bx, 2.5, cz - 9); scene.add(door);
  const vault = { door, col: addCollider(bx - 2.5, bx + 2.5, cz - 9.3, cz - 8.7, 4.7), open: false };
  // cash piles + deposit boxes inside the vault
  const piles = [];
  const cashG = new THREE.BoxGeometry(1.1, 0.55, 0.7), cashM = new THREE.MeshLambertMaterial({ color: 0x3f8f4a }), goldM = new THREE.MeshPhongMaterial({ color: 0xe0b030, shininess: 90 });
  for (let k = 0; k < 8; k++) {
    const x = bx - 14 + k * 4, z = cz - 14, m = new THREE.Mesh(cashG, k % 3 === 0 ? goldM : cashM); m.position.set(x, 0.6, z); m.castShadow = true; scene.add(m);
    piles.push({ mesh: m, x, z, taken: false, value: rint(450, 950) });
  }
  const boxG = new THREE.BoxGeometry(6, 2.4, 0.5);
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(boxG, lam(0x6d7680)); m.position.set(bx + sx * 12, 1.5, back + 1.2); scene.add(m); }
  // security cameras, benches, plants, ATMs
  const cams = [];
  for (const [x, z] of [[bx - 20.5, front - 2], [bx + 20.5, front - 2], [bx, cz - 8]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.7), lam(0x222222)); c.position.set(x, H - 1.2, z); scene.add(c); const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.position.set(x, H - 1.2, z + 0.4); scene.add(led); cams.push(led); }
  for (const x of [-12, 12]) { const b = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 1), lam(0x3a4a66)); b.position.set(bx + x, 0.6, cz + 10); scene.add(b); addCollider(bx + x - 2, bx + x + 2, cz + 9.5, cz + 10.5, 0.9); }
  for (const x of [-19, 19]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.8, 8), lam(0x8a4a2a)); p.position.set(bx + x, 0.7, front - 3); scene.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), lam(0x2f7a35)); l.position.set(bx + x, 1.8, front - 3); scene.add(l); }
  addSign('BANK | بنك', '#3a2a08', '#ffd23f', bx, 8.4, front + 0.1, 20);
  bank = { x: bx, z: cz, front, back, roof, vault, piles, cams, spotX: bx, spotZ: cz - 5.6, exitX: bx, exitZ: front + 9, inside: (x, z) => Math.abs(x - bx) < 22 && z > back && z < front };
  specials.bank = { i, j, x: bx, z: bz, front, doorZ: front + 6 };
}

// ---------- city ----------
// every building is a working place: kind -> Arabic name, icon, sign colours, name pool
const SVC = {
  restaurant: { ar: 'مطعم', ic: '🍔', bg: '#7a1f0a', fg: '#ffe9a8', names: ['برجر ستار', 'بيتزا نابولي', 'شاورما الأصيل'], min: [16, 18], h: [8, 14] },
  cafe: { ar: 'مقهى', ic: '☕', bg: '#3b2414', fg: '#f6dcb8', names: ['كافيه الورد', 'قهوة المساء', 'ستار كوفي'], min: [14, 16], h: [7, 12] },
  market: { ar: 'سوبرماركت', ic: '🛒', bg: '#0f4d1c', fg: '#ffffff', names: ['سوبرماركت الأمل', 'ميني ماركت', 'هايبر سيتي'], min: [18, 20], h: [8, 12], rob: { reward: [900, 1700], time: 7, wanted: 2 } },
  pharmacy: { ar: 'صيدلية', ic: '💊', bg: '#0b5d3a', fg: '#e8fff2', names: ['صيدلية الشفاء', 'صيدلية الحياة', 'فارما بلس'], min: [14, 16], h: [8, 12] },
  clothing: { ar: 'ملابس', ic: '👕', bg: '#3a1b5a', fg: '#ffd6f5', names: ['أزياء ستايل', 'مودرن واير', 'بوتيك الأناقة'], min: [16, 18], h: [8, 13] },
  gunstore: { ar: 'متجر أسلحة', ic: '🔫', bg: '#222a22', fg: '#d6e8c8', names: ['أمو سيتي', 'غن زون', 'ذخيرة وسلاح'], min: [14, 16], h: [7, 10] },
  gym: { ar: 'نادي رياضي', ic: '🏋️', bg: '#12274d', fg: '#9fd0ff', names: ['فيت زون', 'نادي القوة', 'بودي ماكس'], min: [18, 20], h: [9, 13] },
  bank: { ar: 'بنك', ic: '🏦', bg: '#3a2a08', fg: '#ffd23f', names: ['بنك المدينة', 'البنك الأهلي', 'بنك الخليج'], min: [20, 22], h: [12, 18], rob: { reward: [1800, 3200], time: 10, wanted: 3 } },
  jewelry: { ar: 'مجوهرات', ic: '💎', bg: '#3b1458', fg: '#f6c7ff', names: ['مجوهرات الماس', 'ذهب وفضة', 'لؤلؤة'], min: [14, 16], h: [8, 11], rob: { reward: [2000, 3500], time: 10, wanted: 3 } },
  gas: { ar: 'محطة وقود', ic: '⛽', bg: '#7a2a05', fg: '#ffffff', names: ['وقود المدينة', 'غاز ستيشن', 'بترول إكسبرس'], min: [20, 18], h: [6, 8], rob: { reward: [600, 1200], time: 5, wanted: 2 } },
  garage: { ar: 'ورشة ومرآب', ic: '🔧', bg: '#2a2f36', fg: '#ffd23f', names: ['ورشة السرعة', 'مرآب المدينة', 'كار كير'], min: [22, 20], h: [7, 10] },
  hotel: { ar: 'فندق', ic: '🛏', bg: '#3a1f3f', fg: '#ffe1a8', names: ['فندق جراند', 'برج الراحة', 'رويال إن'], min: [20, 20], h: [26, 55] },
  apartments: { ar: 'شقق سكنية', ic: '🏢', bg: '#243040', fg: '#cfe3ff', names: ['برج السلام', 'أبراج المدينة', 'ريزيدنس'], min: [18, 18], h: [22, 60] },
  office: { ar: 'مركز أعمال', ic: '💼', bg: '#1b2a3b', fg: '#aee0ff', names: ['مركز الوظائف', 'برج الأعمال', 'جوب سنتر'], min: [20, 20], h: [30, 90] },
  mall: { ar: 'مول', ic: '🛍', bg: '#4a1f3a', fg: '#ffe1f2', names: ['سيتي مول', 'جراند مول', 'بلازا'], min: [44, 40], h: [14, 20] },
  parking: { ar: 'مواقف وكراج', ic: '🅿', bg: '#1d3b8b', fg: '#ffffff', names: ['مواقف السيارات', 'باركنج بلس', 'كراج المدينة'], min: [30, 26], h: [10, 14] },
  warehouse: { ar: 'مستودع شحن', ic: '📦', bg: '#4a3a1a', fg: '#ffe9a8', names: ['شحن إكسبرس', 'مستودع المدينة', 'كارجو'], min: [30, 30], h: [10, 14] },
  factory: { ar: 'مصنع', ic: '🏭', bg: '#2e2e34', fg: '#ffb86b', names: ['مصنع الحديد', 'مصنع السيارات', 'صناعات المدينة'], min: [32, 32], h: [12, 18] },
  scrap: { ar: 'سكراب سيارات', ic: '♻️', bg: '#3b2e1a', fg: '#e8d6a8', names: ['سكراب أبو سعيد', 'تشليح المدينة', 'ريسايكل كار'], min: [28, 22], h: [6, 9] }
};
const services = [];       // {kind,name,x,z,nx,nz,r,bj}
const SVC_COLOR = { restaurant: '#ff7a3d', cafe: '#c9915a', market: '#3dd16f', pharmacy: '#3de0a0', clothing: '#d36bff', gunstore: '#9aa89a', gym: '#4da3ff', bank: '#ffd23f', jewelry: '#ff6bd6', gas: '#ff9d2e', garage: '#aab4c0', hotel: '#ffb86b', apartments: '#7fb2ff', office: '#6bd3ff', mall: '#ff8ac8', parking: '#6b8bff', warehouse: '#c8a050', factory: '#ff9060', scrap: '#b8a070', police: '#4da3ff', hospital: '#ff4d4d', dealer: '#4dff9a', casino: '#d46bff', hideout: '#ff6a6a' };
const ringList = [], sellHouses = [];

function pickWeighted(tbl) { let t = 0; for (const k in tbl) t += tbl[k]; let r = Math.random() * t; for (const k in tbl) { if ((r -= tbl[k]) < 0) return k; } return Object.keys(tbl)[0]; }
function registerService(kind, name, x, z, nx, nz, bj, extra = {}) {
  const sv = { kind, name, x, z, nx, nz, r: 4.2, bj, ...extra }; services.push(sv); ringList.push([x, z, SVC_COLOR[kind] || '#ffffff']); return sv;
}
// place a purposeful building: sign + door + ring + service entry (+ robbery spot if the type is robbable)
function makeServiceBuilding(kind, bx, bz, cx, cz, w, d, h, ci) {
  const t = SVC[kind]; addBuilding(cx, cz, w, d, h, ci);
  const dE = (bx + 30) - (cx + w / 2), dW = (cx - w / 2) - (bx - 30), dS = (bz + 30) - (cz + d / 2), dN = (cz - d / 2) - (bz - 30), m = Math.min(dE, dW, dS, dN);
  let nx = 0, nz = 1, fx = cx, fz = cz + d / 2, fw = w;
  if (m === dE) { nx = 1; nz = 0; fx = cx + w / 2; fz = cz; fw = d; } else if (m === dW) { nx = -1; nz = 0; fx = cx - w / 2; fz = cz; fw = d; } else if (m === dN) { nx = 0; nz = -1; fx = cx; fz = cz - d / 2; fw = w; }
  const v = rint(0, 2), name = t.names[v], idx = signCell(kind + v, `${t.ic} ${name}`, t.bg, t.fg), sw = Math.min(16, fw - 2);
  addSignQuad(idx, fx + nx * 0.06, Math.min(h - 1.6, 6.2), fz + nz * 0.06, nx, nz, sw, sw / 4); addDoorQuad(fx + nx * 0.06, fz + nz * 0.06, nx, nz);
  const dx = fx + nx * 3.2, dz = fz + nz * 3.2, sv = registerService(kind, name, dx, dz, nx, nz, Math.round(bz / S + (N - 1) / 2));
  sv.h = h;
  if (t.rob) spots.push({ key: 'r' + spots.length, name, reward: t.rob.reward, time: t.rob.time, wanted: t.rob.wanted, drill: kind === 'bank' || kind === 'jewelry', x: dx, z: dz, ex: dx + nx * 6, ez: dz + nz * 6, bj: sv.bj, cd: 0, marker: placeMarker(0xffd23f, dx, dz), generic: true });
  return sv;
}

const specialDefs = {
  police: { at: [7, 8], o: { w: 44, d: 30, h: 16, ci: 5, tint: '#c9d6ff', title: 'POLICE | شرطة', bg: '#10306b', fg: '#ffffff' } },
  police2: { at: [3, 4], kind: 'police', o: { w: 36, d: 26, h: 12, ci: 5, tint: '#c9d6ff', title: 'POLICE | مركز فرعي', bg: '#10306b', fg: '#ffffff' } },
  police3: { at: [12, 11], kind: 'police', o: { w: 36, d: 26, h: 12, ci: 5, tint: '#c9d6ff', title: 'POLICE | مركز فرعي', bg: '#10306b', fg: '#ffffff' } },
  bank: { at: [8, 7], o: {} },
  casino: { at: [7, 6], o: { w: 42, d: 32, h: 26, ci: 4, tint: '#ffd0f0', title: 'CASINO | كازينو', bg: '#2a0033', fg: '#ffcc33' }, rob: { name: 'الكازينو', reward: [5500, 9000], time: 16, wanted: 5, drill: true } },
  hospital: { at: [9, 9], o: { w: 40, d: 30, h: 20, ci: 6, tint: '#ffffff', title: 'HOSPITAL | مستشفى', bg: '#ffffff', fg: '#d02020' } },
  hospital2: { at: [4, 11], kind: 'hospital', o: { w: 36, d: 28, h: 16, ci: 6, tint: '#ffffff', title: 'HOSPITAL | مستشفى', bg: '#ffffff', fg: '#d02020' } },
  dealer: { at: [6, 9], o: { w: 38, d: 26, h: 10, ci: 7, tint: '#cfe9ff', title: 'CARS | معرض سيارات', bg: '#0b3d2a', fg: '#7dffb8' } },
  dealer2: { at: [11, 13], kind: 'dealer', o: { w: 38, d: 26, h: 10, ci: 7, tint: '#cfe9ff', title: 'CARS | معرض سيارات', bg: '#0b3d2a', fg: '#7dffb8' } },
  hideout: { at: [12, 2], o: { w: 36, d: 28, h: 12, ci: 7, tint: '#7d6a6a', title: 'HIDEOUT | المخبأ', bg: '#2a0b0b', fg: '#ff6a6a' } }
};
const PRISON_AT = [15, 0];
const PARKS = [];
function buildCity() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x4f7a43 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
  for (let k = 0; k < 36; k++) {
    const a = k / 36 * TAU + rnd(-0.08, 0.08), r = rnd(1650, 2000), h = rnd(220, 560);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(260, 460), h, 7), new THREE.MeshLambertMaterial({ color: pick([0x5d6b52, 0x6e7a6a, 0x566350, 0x7b7f78]), fog: false }));
    m.position.set(Math.cos(a) * r, h / 2 - 20, Math.sin(a) * r); scene.add(m);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), one = new THREE.Vector3(1, 1, 1);
  // roads
  const Ltot = N * S + R, tex = roadTexture();
  for (let k = 0; k <= N; k++) for (const axis of ['x', 'z']) {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(1, Ltot / 16);
    const rm = new THREE.MeshPhongMaterial({ map: t, specular: 0x111111, shininess: 20 }); env.roadMats.push(rm);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R, Ltot).rotateX(-Math.PI / 2), rm); m.receiveShadow = true;
    if (axis === 'z') m.position.set(rc(k), 0.02, 0); else { m.rotation.y = Math.PI / 2; m.position.set(0, 0.02, rc(k)); }
    scene.add(m);
  }
  const isectI = new THREE.InstancedMesh(new THREE.PlaneGeometry(R, R).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2b2d33 }), (N + 1) * (N + 1));
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) { m4.makeTranslation(rc(a), 0.04, rc(b)); isectI.setMatrixAt(a * (N + 1) + b, m4); }
  isectI.receiveShadow = true; scene.add(isectI);
  const stripes = [];
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) for (const [dx, dz, ax] of [[0, 1, 'x'], [0, -1, 'x'], [1, 0, 'z'], [-1, 0, 'z']]) for (let s = -3; s <= 3; s++) {
    const x = rc(a) + (ax === 'x' ? s * 2.2 : dx * (R / 2 + 1.4)), z = rc(b) + (ax === 'x' ? dz * (R / 2 + 1.4) : s * 2.2);
    if (Math.abs(x) > WORLD - 10 || Math.abs(z) > WORLD - 10) continue; stripes.push([x, z, ax]);
  }
  const zi = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe6e6e6 }), stripes.length);
  stripes.forEach(([x, z, ax], k) => { m4.compose(new THREE.Vector3(x, 0.06, z), ax === 'x' ? q : qy, one); zi.setMatrixAt(k, m4); }); scene.add(zi);

  // ----- decide what every block is -----
  const cI = (N - 1) / 2, treePos = [], lampPos = [], benchPos = [], houseList = [];
  const taken = new Map();
  for (const [k, v] of Object.entries(specialDefs)) taken.set(v.at.join(','), k);
  taken.set(PRISON_AT.join(','), 'prison');
  const zoneOf = (i, j) => { const d = Math.hypot(i - cI, j - cI); if ((i <= 3 || i >= N - 4) && j >= N - 5 && d > 6) return 'ind'; return d < 3.4 ? 'down' : d < 6.2 ? 'mid' : 'sub'; };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { if (!taken.has(i + ',' + j) && zoneOf(i, j) !== 'ind' && ((i * 7 + j * 3) % 13 === 0 || (i * 5 + j * 11) % 17 === 0) && Math.hypot(i - cI, j - cI) > 2) { taken.set(i + ',' + j, 'park'); PARKS.push([i, j]); } }
  const sideI = new THREE.InstancedMesh(new THREE.BoxGeometry(B, 0.3, B), lam(0x9d9d98), N * N), grassI = new THREE.InstancedMesh(new THREE.BoxGeometry(B, 0.3, B), lam(0x4c8f3d), PARKS.length + 1);
  let si = 0, gi = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const bx = bc(i), bz = bc(j), t = taken.get(i + ',' + j), park = t === 'park';
    m4.makeTranslation(bx, 0.15, bz); if (park) grassI.setMatrixAt(gi++, m4); else sideI.setMatrixAt(si++, m4);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { lampPos.push([bx + sx * (B / 2 - 1), bz + sz * (B / 2 - 1)]); treePos.push([bx + sx * (B / 2 - 3.5), bz + sz * (B / 2 - 12)]); }
    if (park) {
      for (let k = 0; k < 24; k++) treePos.push([bx + rnd(-26, 26), bz + rnd(-26, 26)]);
      for (const [dx, dz, r] of [[-12, 0, 0], [12, 0, 0], [0, -12, 1.57], [0, 12, 1.57]]) benchPos.push([bx + dx, bz + dz, r, 'park']);
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.1, 24), new THREE.MeshLambertMaterial({ color: 0x3a8fd6 })); pond.position.set(bx, 0.33, bz); scene.add(pond); continue;
    }
    if (t) continue;
    const z = zoneOf(i, j), bj = j;
    const lot = (kind, ox, oz, w, d) => { const T = SVC[kind], h = rnd(T.h[0], T.h[1]) * (z === 'down' ? 1.0 : 1); makeServiceBuilding(kind, bx, bz, bx + ox, bz + oz, w, d, h, rint(0, 7)); };
    const big = (kind) => { const T = SVC[kind]; makeServiceBuilding(kind, bx, bz, bx, bz, Math.max(T.min[0], 40), Math.max(T.min[1], 40), rnd(T.h[0], T.h[1]), rint(0, 7)); };
    if (z === 'down') {
      if (Math.random() < 0.22) big(pickWeighted({ apartments: 3, office: 3, hotel: 1.5, mall: 1.2 }));
      else for (const a of [-1, 1]) for (const b of [-1, 1]) { const k = pickWeighted({ apartments: 3, office: 3, hotel: 1.6, bank: 1.2, restaurant: 1, jewelry: 0.6, parking: 0.8, clothing: 0.7, cafe: 0.7 }); lot(k, a * 13.5, b * 13.5, rnd(17, 22), rnd(17, 22)); }
    } else if (z === 'mid') {
      if (Math.random() < 0.12) big(pickWeighted({ mall: 1, parking: 1, apartments: 2 }));
      else for (const a of [-1, 1]) for (const b of [-1, 1]) { const k = pickWeighted({ restaurant: 3, cafe: 2, market: 2.2, clothing: 1.4, pharmacy: 1.2, gym: 1.2, bank: 1.2, jewelry: 0.8, gunstore: 1, garage: 1.2, apartments: 3, office: 1, gas: 0.8, hotel: 0.6 }); lot(k, a * 13.5, b * 13.5, rnd(16, 22), rnd(16, 22)); }
    } else if (z === 'ind') {
      const k1 = pickWeighted({ warehouse: 3, factory: 2.5, scrap: 1.5, garage: 1.2 }), k2 = pickWeighted({ warehouse: 3, factory: 2.5, scrap: 1.5, garage: 1.2 });
      makeServiceBuilding(k1, bx, bz, bx - 14, bz - 6, 26, 36, rnd(9, 14), 7); makeServiceBuilding(k2, bx, bz, bx + 14, bz - 6, 22, 34, rnd(9, 14), 1);
      for (let k = 0; k < 6; k++) { const cx = bx - 20 + (k % 3) * 14, cz = bz + 20 + Math.floor(k / 3) * 5, cm = new THREE.Mesh(new THREE.BoxGeometry(11, 2.7, 2.6), lam(pick([0xc0392b, 0x2980b9, 0xd68910, 0x27ae60, 0x7f8c8d]))); cm.position.set(cx, 1.65, cz); cm.castShadow = true; scene.add(cm); addCollider(cx - 5.5, cx + 5.5, cz - 1.3, cz + 1.3, 3); }
    } else {
      // residential: houses (some for sale) + one or two neighbourhood shops per block
      const shops = Math.random() < 0.55 ? [rint(0, 8)] : []; if (Math.random() < 0.15) shops.push((shops[0] + 4) % 9);
      let n = 0;
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) {
        const idx = n++, hx = bx + a * 19, hz = bz + b * 19;
        if (shops.includes(idx)) { const k = pickWeighted({ market: 3, cafe: 2, pharmacy: 1.3, restaurant: 2, gas: 1.4, garage: 1, gym: 0.7, clothing: 0.6 }), T = SVC[k]; makeServiceBuilding(k, bx, bz, hx, hz, Math.min(T.min[0], 16), Math.min(T.min[1], 15), rnd(T.h[0], T.h[1]), rint(0, 7)); continue; }
        if (Math.random() < 0.08) continue;
        const w = rnd(11, 14), d = rnd(10, 13), forSale = Math.random() < 0.1;
        houseList.push({ x: hx, z: hz, w, d, h: rnd(5, 7), body: pick([0xe8dcc0, 0xd9b99b, 0xb8c4d0, 0xcfd8c0, 0xe0c3c3, 0xf2efe6, 0xc9b79c]), roof: pick([0x7a3b2e, 0x5b4636, 0x3e4a57, 0x8a4a2a]) });
        addCollider(hx - w / 2, hx + w / 2, hz - d / 2, hz + d / 2, 7);
        if (forSale) { const sv = registerService('house', 'منزل للبيع', hx, hz + d / 2 + 2.5, 0, 1, bj, { price: Math.round(rnd(14000, 32000) / 500) * 500 }); sellHouses.push(sv); }
        if (Math.random() < 0.6) treePos.push([hx + rnd(-8, 8), hz + (b >= 0 ? 8.5 : -8.5)]);
      }
    }
  }
  sideI.count = si; grassI.count = gi; sideI.receiveShadow = grassI.receiveShadow = true; scene.add(sideI, grassI);

  // landmarks (unique big buildings)
  const addLandmark = (key, def) => {
    const kind = def.kind || key.replace(/\d+$/, '');
    if (key === 'bank') { buildBank(def.at[0], def.at[1]); return; }
    addSpecial(key, def.at[0], def.at[1], def.o); const s = specials[key];
    const sv = registerService(kind, { police: 'مركز الشرطة', hospital: 'مستشفى', dealer: 'معرض سيارات', casino: 'الكازينو', hideout: 'المخبأ' }[kind], s.x, s.doorZ, 0, 1, def.at[1]); s.sx = s.x; s.sz = s.doorZ; s.service = sv;
    if (def.rob) spots.push({ key: 'casino', name: def.rob.name, reward: def.rob.reward, time: def.rob.time, wanted: def.rob.wanted, drill: true, x: s.x, z: s.doorZ, ex: s.x, ez: s.doorZ + 6, bj: def.at[1], cd: 0, marker: placeMarker(0xffd23f, s.x, s.doorZ), generic: false });
  };
  for (const [k, v] of Object.entries(specialDefs)) addLandmark(k, v);
  const bsv = registerService('bank', 'البنك الرئيسي', bank.exitX, bank.front + 3.2, 0, 1, specialDefs.bank.at[1], { main: true });
  spots.push({ key: 'bank', name: 'البنك الرئيسي (الخزنة)', reward: [4000, 7000], time: 14, wanted: 4, drill: true, x: bank.spotX, z: bank.spotZ, ex: bank.exitX, ez: bank.exitZ, bj: specialDefs.bank.at[1], cd: 0, marker: placeMarker(0xffd23f, bank.spotX, bank.spotZ), generic: false });
  prison = buildPrison(PRISON_AT[0], PRISON_AT[1]);
  specials.prison = { x: prison.x, z: prison.z, doorZ: prison.z + 30 };
  { const idx = signCell('prison', '⛓ سجن', '#222222', '#ff9d2e'); addSignQuad(idx, prison.x, 7, prison.z + 29.3, 0, 1, 16, 4); }
  for (const k of ['dealer', 'hideout', 'police', 'hospital']) specials[k].marker = placeMarker(SVC_COLOR[k] ? parseInt(SVC_COLOR[k].slice(1), 16) : 0xffffff, specials[k].sx, specials[k].sz);

  // border fences
  const fenceMat = lam(0xd96a1a);
  for (const [x, z, w, d] of [[0, -WORLD, 2 * WORLD, 1], [0, WORLD, 2 * WORLD, 1], [-WORLD, 0, 1, 2 * WORLD], [WORLD, 0, 1, 2 * WORLD]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), fenceMat); f.position.set(x, 1.1, z); scene.add(f); }
  flushBuckets();

  // houses (instanced)
  if (houseList.length) {
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), houseList.length);
    const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4), new THREE.MeshLambertMaterial({ color: 0xffffff }), houseList.length), col = new THREE.Color();
    houseList.forEach((h, k) => {
      m4.compose(new THREE.Vector3(h.x, 0.3 + h.h / 2, h.z), q, new THREE.Vector3(h.w, h.h, h.d)); bodies.setMatrixAt(k, m4); bodies.setColorAt(k, col.setHex(h.body));
      const rh = 3.6; m4.compose(new THREE.Vector3(h.x, 0.3 + h.h + rh / 2, h.z), q, new THREE.Vector3(h.w * 0.78, rh, h.d * 0.78)); roofs.setMatrixAt(k, m4); roofs.setColorAt(k, col.setHex(h.roof));
    });
    bodies.castShadow = roofs.castShadow = true; bodies.receiveShadow = true; scene.add(bodies, roofs);
  }
  // service door rings
  { const rg = new THREE.InstancedMesh(new THREE.RingGeometry(1.5, 2.1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7, depthWrite: false }), services.length + ringList.length); const col = new THREE.Color();
    ringList.forEach(([x, z, c], k) => { m4.makeTranslation(x, 0.36, z); rg.setMatrixAt(k, m4); rg.setColorAt(k, col.set(c)); }); rg.count = ringList.length; rg.frustumCulled = false; scene.add(rg); }
  // trees, lamps, light pools
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 3, 6), lam(0x6b4a2b), treePos.length);
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4, 0), lam(0x2f7a35), treePos.length);
  treePos.forEach(([x, z], k) => { const s = rnd(0.9, 1.5); m4.compose(new THREE.Vector3(x, 1.8, z), q, new THREE.Vector3(s, s, s)); trunks.setMatrixAt(k, m4); m4.compose(new THREE.Vector3(x, 4.6 * s, z), q, new THREE.Vector3(s, s, s)); leaves.setMatrixAt(k, m4); });
  trunks.castShadow = leaves.castShadow = true; scene.add(trunks, leaves);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 6), lam(0x3a3f47), lampPos.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), lampPos.length);
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gg = gc.getContext('2d'), gr = gg.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,225,150,1)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
  const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(22, 22).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), lampPos.length);
  lampPos.forEach(([x, z], k) => { m4.makeTranslation(x, 3.8, z); poles.setMatrixAt(k, m4); m4.makeTranslation(x, 7.3, z); heads.setMatrixAt(k, m4); m4.makeTranslation(x, 0.4, z); glow.setMatrixAt(k, m4); });
  glow.frustumCulled = false; env.glow = glow; scene.add(poles, heads, glow);
  // traffic lights + street props
  const sigPos = { x: [], z: [] };
  for (let a2 = 0; a2 <= N; a2++) for (let b2 = 0; b2 <= N; b2++) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = rc(a2) + sx * 10.2, z = rc(b2) + sz * 10.2; if (Math.abs(x) > WORLD - 8 || Math.abs(z) > WORLD - 8) continue; sigPos[sx * sz > 0 ? 'x' : 'z'].push([x - sx * 1.1, z - sz * 1.1]);
  }
  const housingGeo = new THREE.BoxGeometry(0.5, 1.5, 0.45), lampGeo = new THREE.BoxGeometry(0.28, 0.28, 0.1), darkM = lam(0x1a1a1a);
  window.signalMats = {};
  for (const ax of ['x', 'z']) {
    const list = sigPos[ax], hs = new THREE.InstancedMesh(housingGeo, darkM, list.length);
    const lamps = { r: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xff2020 }), list.length), y: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xffc020 }), list.length), g: new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x20ff60 }), list.length) };
    list.forEach(([x, z], k) => { m4.makeTranslation(x, 5.4, z); hs.setMatrixAt(k, m4); for (const [key, dy] of [['r', 0.45], ['y', 0], ['g', -0.45]]) { lamps[key].setMatrixAt(k, new THREE.Matrix4().makeTranslation(x, 5.4 + dy, z + 0.24)); } });
    scene.add(hs, lamps.r, lamps.y, lamps.g); window.signalMats[ax] = { r: lamps.r.material, y: lamps.y.material, g: lamps.g.material };
  }
  const hyd = [], bins = [], benches = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const bx = bc(i), bz = bc(j);
    for (let k = 0; k < 4; k++) { const t = rnd(-20, 20), x = k < 2 ? bx + t : bx + (k === 2 ? 28.5 : -28.5), z = k < 2 ? bz + (k === 0 ? 28.5 : -28.5) : bz + t; (k === 0 ? hyd : k === 1 ? bins : benches).push([x, z, k < 2 ? 0 : Math.PI / 2]); if (k === 3) benchPos.push([x, z, 0, 'street']); } }
  const mkInst = (geo, mat, arr, y) => { const im = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach(([x, z, r], k) => { m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r), one); im.setMatrixAt(k, m4); }); im.castShadow = true; scene.add(im); };
  mkInst(new THREE.CylinderGeometry(0.16, 0.2, 0.75, 8), lam(0xc0281c), hyd, 0.7); mkInst(new THREE.CylinderGeometry(0.3, 0.26, 0.9, 8), lam(0x4b5560), bins, 0.75); mkInst(new THREE.BoxGeometry(1.8, 0.45, 0.5), lam(0x7a5230), benches.concat(benchPos.filter(b => b[3] === 'park').map(b => [b[0], b[1], b[2]])), 0.55);
  window.benchSpots = benchPos.map(b => ({ x: b[0], z: b[1] }));
}

// ---------- minimap (static layer) ----------
const MAPM = Math.ceil(WORLD + 10);
const mapStatic = document.createElement('canvas'); mapStatic.width = mapStatic.height = MAPM * 2 * 2;
function renderStaticMap() {
  const g = mapStatic.getContext('2d'), s = 2, X = v => (v + MAPM) * s;
  g.fillStyle = '#35693a'; g.fillRect(0, 0, MAPM * 4, MAPM * 4);
  g.fillStyle = '#4b4e55';
  for (let k = 0; k <= N; k++) { g.fillRect(X(rc(k) - R / 2), X(-WORLD), R * s, 2 * WORLD * s); g.fillRect(X(-WORLD), X(rc(k) - R / 2), 2 * WORLD * s, R * s); }
  g.fillStyle = '#8e8e88'; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#3d7a37'; for (const [i, j] of PARKS) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#c8ccd2'; for (const c of colliders) g.fillRect(X(c.x0), X(c.z0), (c.x1 - c.x0) * s, (c.z1 - c.z0) * s);
  g.fillStyle = '#222'; g.fillRect(X(prison.x - 29), X(prison.z - 29), 58 * s, 58 * s); g.fillStyle = '#c8ccd2'; for (const c of colliders) if (Math.abs(c.x0 - prison.x) < 30 && Math.abs(c.z0 - prison.z) < 30) g.fillRect(X(c.x0), X(c.z0), (c.x1 - c.x0) * s, (c.z1 - c.z0) * s);
  g.fillStyle = '#ff9d2e'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('⛓', X(prison.x), X(prison.z) + 10);
}

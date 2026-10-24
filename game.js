'use strict';
/* ===== MAD CITY 3D — open-world cops & robbers (Three.js) ===== */

// ---------- helpers ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const $ = id => document.getElementById(id);

// ---------- world layout ----------
const N = 6, B = 60, R = 18, S = B + R;
const WORLD = N * S / 2 + R / 2 + 8;
const rc = k => (k - N / 2) * S;            // road centre of road k (0..N)
const bc = i => (i - (N - 1) / 2) * S;      // block centre of block i (0..N-1)
const RING = 27;

// ---------- renderer / scene ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const SKY = 0x8fbcf0;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 140, 420);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.3, 700);
scene.add(new THREE.HemisphereLight(0xdbe9ff, 0x4d5a45, 0.75));
const sun = new THREE.DirectionalLight(0xfff0d6, 0.95);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 420 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
});

const lam = (() => { const m = new Map(); return c => { if (!m.has(c)) m.set(c, new THREE.MeshLambertMaterial({ color: c })); return m.get(c); }; })();

// ---------- collision data ----------
const colliders = [];       // {x0,x1,z0,z1}
const solidMeshes = [];     // for raycasts (camera, bullets, line of sight)

function resolveCircle(x, z, r) {
  let hit = false;
  for (const c of colliders) {
    if (x + r < c.x0 || x - r > c.x1 || z + r < c.z0 || z - r > c.z1) continue;
    const nx = clamp(x, c.x0, c.x1), nz = clamp(z, c.z0, c.z1);
    const dx = x - nx, dz = z - nz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 1e-6) { const d = Math.sqrt(d2); x = nx + dx / d * r; z = nz + dz / d * r; }
      else {
        const l = x - c.x0, rr = c.x1 - x, t = z - c.z0, b = c.z1 - z, m = Math.min(l, rr, t, b);
        if (m === l) x = c.x0 - r; else if (m === rr) x = c.x1 + r; else if (m === t) z = c.z0 - r; else z = c.z1 + r;
      }
    }
  }
  const W = WORLD - r;
  if (Math.abs(x) > W || Math.abs(z) > W) { hit = true; x = clamp(x, -W, W); z = clamp(z, -W, W); }
  return { x, z, hit };
}

const raycaster = new THREE.Raycaster();
function lineOfSight(ax, ay, az, bx, by, bz) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az);
  const len = dir.length(); dir.normalize();
  raycaster.set(new THREE.Vector3(ax, ay, az), dir); raycaster.far = len;
  return raycaster.intersectObjects(solidMeshes, false).length === 0;
}

// ---------- textures ----------
function facadeTexture(base, variant) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 124, 128, 4);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
    const lit = ((k * 7 + r * 3 + variant * 5) % 5) === 0;
    g.fillStyle = lit ? '#ffe9a8' : '#26384d'; g.fillRect(8 + k * 30, 10 + r * 58, 20, 40);
    if (!lit) { g.fillStyle = 'rgba(150,200,255,.35)'; g.fillRect(8 + k * 30, 10 + r * 58, 20, 14); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function signTexture(text, bg, fg, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.font = 'bold 64px system-ui, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function stripTexture(horizontal) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#2b2d33'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#e9e9e9'; g.fillRect(2, 0, 2, 64); g.fillRect(60, 0, 2, 64);
  g.fillStyle = '#f2c200'; g.fillRect(30, 4, 4, 28);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// ---------- build the city ----------
const PALETTE = ['#b9b4a8', '#8d98a6', '#c4a484', '#9aa8a0', '#a67c6d', '#7f8c9a', '#d0c8b8', '#6f7f8f'];
const facades = PALETTE.map((p, i) => facadeTexture(p, i));
const roofMat = lam(0x55595f);
const spots = [];          // robbery spots
const specials = {};
let treePos = [], lampPos = [];

function addBuilding(cx, cz, w, d, h, ci) {
  const tx = facades[ci].clone(); tx.needsUpdate = true; tx.repeat.set(d / 8, Math.max(1, Math.round(h / 8)));
  const tz = facades[ci].clone(); tz.needsUpdate = true; tz.repeat.set(w / 8, Math.max(1, Math.round(h / 8)));
  const mx = new THREE.MeshLambertMaterial({ map: tx }), mz = new THREE.MeshLambertMaterial({ map: tz });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mx, mx, roofMat, roofMat, mz, mz]);
  m.position.set(cx, h / 2 + 0.3, cz); m.castShadow = true; m.receiveShadow = true;
  scene.add(m); solidMeshes.push(m);
  colliders.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 });
  return m;
}
function addSign(text, bg, fg, x, y, z, w = 18) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: signTexture(text, bg, fg) }));
  p.position.set(x, y, z); scene.add(p);
}
function addSpecial(key, i, j, o) {
  const bx = bc(i), bz = bc(j), cz = bz - 6;
  const m = addBuilding(bx, cz, o.w, o.d, o.h, o.ci);
  m.material[4].color.set(o.tint); m.material[5].color.set(o.tint);
  const front = cz + o.d / 2;
  addSign(o.title, o.bg, o.fg, bx, 7.5, front + 0.1, Math.min(o.w - 4, 20));
  const door = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), new THREE.MeshBasicMaterial({ color: 0x151a22 }));
  door.position.set(bx, 2.4, front + 0.08); scene.add(door);
  specials[key] = { i, j, x: bx, z: bz, front, doorZ: front + 6 };
}

function makeMarker(color) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.12, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }));
  ring.position.y = 0.4;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 22, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 }));
  beam.position.y = 11;
  g.add(ring, beam); g.userData = { ring, beam };
  return g;
}

function buildCity() {
  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshLambertMaterial({ color: 0x4f7a43 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);

  // road strips
  const L = N * S + R;
  const tex = stripTexture();
  for (let k = 0; k <= N; k++) {
    for (const axis of ['x', 'z']) {
      const t = tex.clone(); t.needsUpdate = true; t.repeat.set(1, L / 16);
      const geo = new THREE.PlaneGeometry(R, L); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: t }));
      m.receiveShadow = true;
      if (axis === 'z') m.position.set(rc(k), 0.02, 0); else { m.rotation.y = Math.PI / 2; m.position.set(0, 0.02, rc(k)); }
      scene.add(m);
    }
  }
  const isect = new THREE.MeshLambertMaterial({ color: 0x2b2d33 });
  for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R, R).rotateX(-Math.PI / 2), isect);
    m.position.set(rc(a), 0.04, rc(b)); m.receiveShadow = true; scene.add(m);
  }

  // special blocks
  const sp = {
    police: [2, 3], bank: [3, 2], jewel: [1, 1], gas: [4, 4], dealer: [1, 4], hideout: [4, 1]
  };
  const parks = [[0, 2], [5, 3], [3, 0], [2, 5], [0, 0], [5, 5]];
  const isSpecial = (i, j) => Object.values(sp).some(v => v[0] === i && v[1] === j);
  const isPark = (i, j) => parks.some(v => v[0] === i && v[1] === j);

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const bx = bc(i), bz = bc(j), park = isPark(i, j);
    const side = new THREE.Mesh(new THREE.BoxGeometry(B, 0.3, B), lam(park ? 0x4c8f3d : 0x9d9d98));
    side.position.set(bx, 0.15, bz); side.receiveShadow = true; scene.add(side);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      lampPos.push([bx + sx * (B / 2 - 1), bz + sz * (B / 2 - 1)]);
      treePos.push([bx + sx * (B / 2 - 3.5), bz + sz * (B / 2 - 12)]);
    }
    if (park) {
      for (let k = 0; k < 22; k++) treePos.push([bx + rnd(-26, 26), bz + rnd(-26, 26)]);
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.1, 24), new THREE.MeshLambertMaterial({ color: 0x3a8fd6 }));
      pond.position.set(bx, 0.33, bz); scene.add(pond);
      continue;
    }
    if (isSpecial(i, j)) continue;
    const downtown = Math.hypot(i - 2.5, j - 2.5) < 2.2;
    if (Math.random() < 0.22) {
      addBuilding(bx, bz, 46, 46, downtown ? rnd(40, 90) : rnd(18, 42), rint(0, PALETTE.length - 1));
    } else {
      for (const a of [-1, 1]) for (const b of [-1, 1]) {
        if (Math.random() < 0.1) continue;
        addBuilding(bx + a * 13.5, bz + b * 13.5, rnd(16, 22), rnd(16, 22), downtown ? rnd(25, 75) : rnd(12, 34), rint(0, PALETTE.length - 1));
      }
    }
  }

  addSpecial('police', ...sp.police, { w: 44, d: 30, h: 16, ci: 5, tint: '#c9d6ff', title: 'POLICE | شرطة', bg: '#10306b', fg: '#ffffff' });
  addSpecial('bank', ...sp.bank, { w: 44, d: 34, h: 24, ci: 6, tint: '#ffffff', title: 'BANK | بنك', bg: '#3a2a08', fg: '#ffd23f' });
  addSpecial('jewel', ...sp.jewel, { w: 34, d: 26, h: 14, ci: 4, tint: '#e8d4ff', title: 'JEWELRY | مجوهرات', bg: '#3b1458', fg: '#f6c7ff' });
  addSpecial('gas', ...sp.gas, { w: 26, d: 18, h: 8, ci: 1, tint: '#ffe0c0', title: 'GAS | وقود', bg: '#7a2a05', fg: '#ffffff' });
  addSpecial('dealer', ...sp.dealer, { w: 38, d: 26, h: 10, ci: 7, tint: '#cfe9ff', title: 'CARS | معرض سيارات', bg: '#0b3d2a', fg: '#7dffb8' });
  addSpecial('hideout', ...sp.hideout, { w: 36, d: 28, h: 12, ci: 7, tint: '#7d6a6a', title: 'HIDEOUT | المخبأ', bg: '#2a0b0b', fg: '#ff6a6a' });

  // robbery spots
  const defs = [
    { key: 'bank', name: 'البنك', reward: [3500, 6000], time: 9, wanted: 4 },
    { key: 'jewel', name: 'محل المجوهرات', reward: [1800, 3200], time: 7, wanted: 3 },
    { key: 'gas', name: 'محطة الوقود', reward: [600, 1200], time: 5, wanted: 2 }
  ];
  for (const d of defs) {
    const s = specials[d.key];
    const marker = makeMarker(0xffd23f); marker.position.set(s.x, 0, s.doorZ); scene.add(marker);
    spots.push({ ...d, x: s.x, z: s.doorZ, cd: 0, marker });
  }
  specials.police.marker = null;
  const dm = makeMarker(0x4dff9a); dm.position.set(specials.dealer.x, 0, specials.dealer.doorZ); scene.add(dm);
  specials.dealer.marker = dm; specials.dealer.sx = specials.dealer.x; specials.dealer.sz = specials.dealer.doorZ;

  // border fences
  const fenceMat = lam(0xd96a1a);
  for (const [x, z, w, d] of [[0, -WORLD, 2 * WORLD, 1], [0, WORLD, 2 * WORLD, 1], [-WORLD, 0, 1, 2 * WORLD], [WORLD, 0, 1, 2 * WORLD]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), fenceMat); f.position.set(x, 1.1, z); scene.add(f);
  }

  // instanced trees + lamps
  const trunkG = new THREE.CylinderGeometry(0.35, 0.45, 3, 6), leafG = new THREE.IcosahedronGeometry(2.4, 0);
  const trunks = new THREE.InstancedMesh(trunkG, lam(0x6b4a2b), treePos.length);
  const leaves = new THREE.InstancedMesh(leafG, lam(0x2f7a35), treePos.length);
  const m4 = new THREE.Matrix4();
  treePos.forEach(([x, z], k) => {
    const s = rnd(0.9, 1.4);
    m4.compose(new THREE.Vector3(x, 1.8, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); trunks.setMatrixAt(k, m4);
    m4.compose(new THREE.Vector3(x, 4.6 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); leaves.setMatrixAt(k, m4);
  });
  trunks.castShadow = leaves.castShadow = true; scene.add(trunks, leaves);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.15, 7, 6), lam(0x3a3f47), lampPos.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), lampPos.length);
  lampPos.forEach(([x, z], k) => {
    m4.makeTranslation(x, 3.8, z); poles.setMatrixAt(k, m4);
    m4.makeTranslation(x, 7.3, z); heads.setMatrixAt(k, m4);
  });
  scene.add(poles, heads);
}

// ---------- minimap (static layer) ----------
const MAPM = 260;
const mapStatic = document.createElement('canvas'); mapStatic.width = mapStatic.height = MAPM * 4;
function renderStaticMap() {
  const g = mapStatic.getContext('2d'), s = 2;
  const X = v => (v + MAPM) * s;
  g.fillStyle = '#35693a'; g.fillRect(0, 0, MAPM * 4, MAPM * 4);
  g.fillStyle = '#4b4e55';
  for (let k = 0; k <= N; k++) {
    g.fillRect(X(rc(k) - R / 2), X(-WORLD), R * s, 2 * WORLD * s);
    g.fillRect(X(-WORLD), X(rc(k) - R / 2), 2 * WORLD * s, R * s);
  }
  g.fillStyle = '#8e8e88';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#3d7a37';
  for (const [i, j] of [[0, 2], [5, 3], [3, 0], [2, 5], [0, 0], [5, 5]]) g.fillRect(X(bc(i) - B / 2), X(bc(j) - B / 2), B * s, B * s);
  g.fillStyle = '#c8ccd2';
  for (const c of colliders) g.fillRect(X(c.x0), X(c.z0), (c.x1 - c.x0) * s, (c.z1 - c.z0) * s);
  const lab = (key, col, txt) => { const p = specials[key]; g.fillStyle = col; g.fillRect(X(p.x - 14), X(p.z - 20), 28 * s, 28 * s); g.fillStyle = '#fff'; g.font = 'bold 36px sans-serif'; g.textAlign = 'center'; g.fillText(txt, X(p.x), X(p.z) - 4); };
  lab('police', '#1d4fb8', 'P'); lab('bank', '#b8860b', '$'); lab('jewel', '#8a3bb8', '◆');
  lab('gas', '#b84a1d', 'G'); lab('dealer', '#1d9a5a', 'C'); lab('hideout', '#a01d1d', 'H');
}

// ---------- humans ----------
function makeHuman(shirt, pants, skin, hat, gun) {
  const g = new THREE.Group(), hit = [];
  const box = (w, h, d, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.castShadow = true; return m; };
  const torso = box(0.7, 0.85, 0.4, shirt); torso.position.y = 1.35;
  const head = box(0.42, 0.42, 0.42, skin); head.position.y = 1.98;
  const mkLimb = (w, h, c, x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = box(w, h, w, c); m.position.y = -h / 2; p.add(m); hit.push(m); return p; };
  const legL = mkLimb(0.3, 0.9, pants, -0.19, 0.92), legR = mkLimb(0.3, 0.9, pants, 0.19, 0.92);
  const armL = mkLimb(0.25, 0.8, shirt, -0.5, 1.72), armR = mkLimb(0.25, 0.8, shirt, 0.5, 1.72);
  g.add(torso, head, legL, legR, armL, armR); hit.push(torso, head);
  if (hat) { const h = box(0.5, 0.16, 0.5, hat); h.position.y = 2.25; g.add(h); }
  if (gun) { const w = box(0.1, 0.14, 0.4, 0x111111); w.position.set(0, -0.8, 0.22); armR.add(w); }
  return { group: g, parts: { legL, legR, armL, armR }, hit };
}
function animHuman(e, speed, dt, aim) {
  e.phase += dt * speed * 1.7;
  const sw = Math.sin(e.phase) * Math.min(1, speed / 5) * 0.9, p = e.parts;
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw; p.armL.rotation.x = -sw * 0.8;
  p.armR.rotation.x = aim ? -1.5 : sw * 0.8;
  if (e.up) { p.armL.rotation.x = p.armR.rotation.x = Math.PI; }
}

// ---------- cars ----------
const CAR_STATS = {
  sedan: { max: 38, acc: 15 }, taxi: { max: 38, acc: 15 }, sport: { max: 66, acc: 27 },
  truck: { max: 28, acc: 9 }, police: { max: 52, acc: 23 }
};
const cars = [];
const CAR_COLORS = [0xc0392b, 0x2e86de, 0x27ae60, 0xf1c40f, 0x7f8c8d, 0x34495e, 0xe67e22, 0x8e44ad, 0xecf0f1, 0x1a1a1a];

function makeCarMesh(kind, color) {
  const g = new THREE.Group(), len = kind === 'truck' ? 5.6 : 4.4;
  const mk = (geo, mat, x, y, z, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; g.add(m); return m; };
  const bodyC = kind === 'police' ? 0xf4f4f4 : kind === 'taxi' ? 0xf5c518 : color;
  mk(new THREE.BoxGeometry(2, 0.75, len), lam(bodyC), 0, 0.68, 0);
  const cabLen = kind === 'sport' ? 1.8 : kind === 'truck' ? 1.6 : 2.4;
  const cabZ = kind === 'truck' ? 1.4 : -0.2;
  mk(new THREE.BoxGeometry(1.84, 0.6, cabLen), lam(0x172431), 0, 1.3, cabZ);
  mk(new THREE.BoxGeometry(1.8, 0.1, cabLen - 0.1), lam(bodyC), 0, 1.64, cabZ);
  if (kind === 'truck') mk(new THREE.BoxGeometry(2.05, 1.5, 3.0), lam(0xd9d9d9), 0, 1.5, -1.2);
  if (kind === 'police') {
    mk(new THREE.BoxGeometry(2.02, 0.3, 1.2), lam(0x111111), 0, 0.7, 0.9, false);
    mk(new THREE.BoxGeometry(2.02, 0.3, 1.2), lam(0x111111), 0, 0.7, -1.2, false);
  }
  const wg = new THREE.CylinderGeometry(0.43, 0.43, 0.32, 14); wg.rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mk(wg, lam(0x111111), sx * 1.0, 0.43, sz * len * 0.32);
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff4c8 }), tl = new THREE.MeshBasicMaterial({ color: 0xc01010 });
  for (const sx of [-0.7, 0.7]) { mk(new THREE.BoxGeometry(0.4, 0.2, 0.08), hl, sx, 0.8, len / 2, false); mk(new THREE.BoxGeometry(0.4, 0.2, 0.08), tl, sx, 0.8, -len / 2, false); }
  let lights = null;
  if (kind === 'police') {
    const r = new THREE.MeshBasicMaterial({ color: 0xff2020 }), b = new THREE.MeshBasicMaterial({ color: 0x2060ff });
    mk(new THREE.BoxGeometry(0.8, 0.18, 0.4), r, -0.45, 1.78, cabZ, false);
    mk(new THREE.BoxGeometry(0.8, 0.18, 0.4), b, 0.45, 1.78, cabZ, false);
    lights = [r, b];
  }
  if (kind === 'taxi') mk(new THREE.BoxGeometry(0.6, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffaa }), 0, 1.76, cabZ, false);
  scene.add(g);
  return { g, lights };
}

function newCar(kind, x, z, h, mode, color) {
  const col = color ?? pick(CAR_COLORS);
  const { g, lights } = makeCarMesh(kind, col);
  const c = { kind, x, z, h, speed: 0, mode, mesh: g, lights, stun: 0, hitCool: 0, rev: 0, stuck: 0, cruise: rnd(11, 18), axis: 'x', dir: 1, road: 0, next: 0, flash: rnd(0, 1) };
  g.position.set(x, 0, z); g.rotation.y = h;
  cars.push(c); return c;
}
function removeCar(c) { scene.remove(c.mesh); const i = cars.indexOf(c); if (i >= 0) cars.splice(i, 1); }
function carForward(c) { return [Math.sin(c.h), Math.cos(c.h)]; }
function carRight(c) { return [-Math.cos(c.h), Math.sin(c.h)]; }

// traffic on the road grid
const baseH = (axis, dir) => axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
const laneOff = (axis, dir) => axis === 'x' ? (dir > 0 ? 4.4 : -4.4) : (dir > 0 ? -4.4 : 4.4);

function spawnTraffic(farFrom) {
  for (let tries = 0; tries < 12; tries++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', dir = Math.random() < 0.5 ? 1 : -1, road = rint(0, N);
    let nxt = rint(0, N); if (nxt - dir < 0 || nxt - dir > N) continue;
    const along = rc(nxt) - dir * rnd(14, S - 14), lane = rc(road) + laneOff(axis, dir);
    const x = axis === 'x' ? along : lane, z = axis === 'x' ? lane : along;
    if (farFrom && Math.hypot(x - farFrom.x, z - farFrom.z) < 90) continue;
    const r = Math.random(), kind = r < 0.1 ? 'police' : r < 0.2 ? 'truck' : r < 0.3 ? 'sport' : r < 0.45 ? 'taxi' : 'sedan';
    const c = newCar(kind, x, z, baseH(axis, dir), 'traffic');
    Object.assign(c, { axis, dir, road, next: nxt, speed: c.cruise });
    if (kind === 'sport') c.cruise = rnd(16, 24);
    return c;
  }
}
function spawnParked(farFrom) {
  for (let tries = 0; tries < 12; tries++) {
    const axis = Math.random() < 0.5 ? 'x' : 'z', dir = Math.random() < 0.5 ? 1 : -1, road = rint(0, N), seg = rint(0, N - 1);
    const along = rc(seg) + S / 2 + rnd(-S / 2 + 18, S / 2 - 18), off = dir * 7.4;
    const x = axis === 'x' ? along : rc(road) + off, z = axis === 'x' ? rc(road) + off : along;
    if (farFrom && Math.hypot(x - farFrom.x, z - farFrom.z) < 40) continue;
    if (cars.some(o => Math.hypot(o.x - x, o.z - z) < 6)) continue;
    const kind = Math.random() < 0.15 ? 'sport' : Math.random() < 0.15 ? 'truck' : 'sedan';
    return newCar(kind, x, z, baseH(axis, -dir) + (axis === 'x' ? 0 : 0), 'parked');
  }
}

function updateTraffic(c, dt) {
  const st = CAR_STATS[c.kind];
  const ctrl = c.axis === 'x' ? c.x : c.z, tgtC = rc(c.next), remain = (tgtC - ctrl) * c.dir;
  let target = Math.min(c.cruise, st.max);
  if (remain < 14) target = Math.min(target, 9);
  if (c.stun > 0) { c.stun -= dt; target = 0; }
  const [fx, fz] = carForward(c), [rx, rz] = carRight(c);
  const others = cars.concat([P]);
  for (const o of others) {
    if (o === c) continue;
    const ox = o.x - c.x, oz = o.z - c.z, along = ox * fx + oz * fz, lat = ox * rx + oz * rz;
    if (along > 0 && along < 15 && Math.abs(lat) < 2.8 && !(o.car === c)) { target = Math.min(target, Math.max(0, (along - 5) * 1.2)); }
  }
  const diff = target - c.speed;
  c.speed += clamp(diff, -22 * dt, st.acc * 0.7 * dt);
  const move = c.speed * dt;
  if (c.axis === 'x') c.x += c.dir * move; else c.z += c.dir * move;
  const lane = rc(c.road) + laneOff(c.axis, c.dir), k = Math.min(1, 3.2 * dt);
  if (c.axis === 'x') c.z += (lane - c.z) * k; else c.x += (lane - c.x) * k;
  const bh = baseH(c.axis, c.dir);
  c.h += angDiff(c.h, bh) * Math.min(1, 5 * dt);
  // arrive at crossing → choose direction
  if ((((c.axis === 'x' ? c.x : c.z) - tgtC) * c.dir) >= 0) {
    const opts = [];
    if (c.next + c.dir >= 0 && c.next + c.dir <= N) opts.push('s', 's');
    if (c.road - 1 >= 0) opts.push('a');
    if (c.road + 1 <= N) opts.push('b');
    const ch = pick(opts) || 's';
    if (ch === 's') c.next += c.dir;
    else {
      const nd = ch === 'a' ? -1 : 1, nroad = c.next, nnext = c.road + nd;
      c.axis = c.axis === 'x' ? 'z' : 'x'; c.dir = nd; c.road = nroad; c.next = nnext;
    }
  }
}

function updateIdleCar(c, dt) {
  if (Math.abs(c.speed) > 0.1) {
    c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 9 * dt);
    const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt;
    carWorldCollide(c);
  }
}

function carWorldCollide(c) {
  let hitAny = false;
  const [fx, fz] = carForward(c);
  for (const off of [1.5, -1.5]) {
    const px = c.x + fx * off, pz = c.z + fz * off, r = resolveCircle(px, pz, 1.25);
    if (r.hit) { c.x += r.x - px; c.z += r.z - pz; hitAny = true; }
  }
  if (hitAny && c.hitCool <= 0) {
    c.hitCool = 0.3;
    const v = Math.abs(c.speed);
    if (c === P.car && v > 12) { hurt((v - 12) * 1.1); sfx.crash(); }
    c.speed *= -0.3;
  }
  return hitAny;
}

function drivePlayerCar(c, dt) {
  const st = CAR_STATS[c.kind];
  const thr = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  if (thr > 0) {
    if (c.speed < 0) c.speed += st.acc * 2.5 * dt;
    else c.speed += st.acc * (1 - Math.pow(clamp(c.speed / st.max, 0, 1), 2)) * dt;
  } else if (thr < 0) {
    if (c.speed > 0.5) c.speed -= st.acc * 2.2 * dt;
    else c.speed = Math.max(c.speed - st.acc * 0.6 * dt, -st.max * 0.35);
  } else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (3 + Math.abs(c.speed) * 0.12) * dt);
  if (keys.Space) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 32 * dt);
  const steer = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0);
  c.h += steer * dt * 2.2 * clamp(c.speed / 7, -1, 1) * (1 - 0.55 * clamp(Math.abs(c.speed) / st.max, 0, 1)) * (keys.Space ? 1.5 : 1);
  const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt;
  carWorldCollide(c);
}

function updateChase(c, dt) {
  const st = CAR_STATS[c.kind];
  const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz);
  const want = Math.atan2(dx, dz);
  let diff = angDiff(c.h, want);
  const onFoot = !P.car;
  let target = d > 16 ? st.max * 0.82 * (1 - Math.min(Math.abs(diff), 1.3) * 0.5) : Math.max((P.car ? Math.abs(P.car.speed) : 0) - 2, 5);
  if (onFoot && d < 10) target = 0;
  if (c.stun > 0) { c.stun -= dt; target = 0; }
  if (c.rev > 0) { c.rev -= dt; target = -9; diff = -diff; }
  else if (Math.abs(c.speed) < 2.5 && d > 14 && c.stun <= 0) { c.stuck += dt; if (c.stuck > 1.4) { c.rev = 1.1; c.stuck = 0; } } else c.stuck = 0;
  c.speed += clamp(target - c.speed, -26 * dt, st.acc * dt);
  c.h += clamp(diff, -1, 1) * 2.3 * dt * clamp(Math.abs(c.speed) / 7, 0.25, 1) * (c.speed < 0 ? -1 : 1);
  const [fx, fz] = carForward(c); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt;
  carWorldCollide(c);
  // police dismount near an on-foot suspect
  if (onFoot && d < 14 && state.wanted > 0 && c.disTimer === undefined) c.disTimer = rnd(0.3, 1.2);
  if (c.disTimer !== undefined) {
    c.disTimer -= dt;
    if (c.disTimer <= 0) {
      c.disTimer = undefined;
      if (onFoot && cops.filter(o => o.state === 'chase').length < 4 + state.wanted) {
        const [rx, rz] = carRight(c); const cp = spawnCop(c.x + rx * 2.6, c.z + rz * 2.6); cp.state = 'chase';
        if (Math.random() < 0.5) { c.mode = 'idle'; }
      }
    }
  }
}

function separateCars(dt) {
  const R2 = 2.15;
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
    const A = cars[a], Bc = cars[b];
    const staticA = A.mode === 'parked' || (A.mode === 'idle' && Math.abs(A.speed) < 0.5);
    const staticB = Bc.mode === 'parked' || (Bc.mode === 'idle' && Math.abs(Bc.speed) < 0.5);
    if (staticA && staticB) continue;
    const dx = Bc.x - A.x, dz = Bc.z - A.z; if (Math.abs(dx) > 5 || Math.abs(dz) > 5) continue;
    const d = Math.hypot(dx, dz), min = R2 * 2; if (d >= min || d < 1e-4) continue;
    const nx = dx / d, nz = dz / d, pen = min - d;
    const wa = staticA ? 0 : staticB ? 1 : 0.5, wb = staticB ? 0 : staticA ? 1 : 0.5;
    A.x -= nx * pen * wa; A.z -= nz * pen * wa; Bc.x += nx * pen * wb; Bc.z += nz * pen * wb;
    const impact = Math.abs(A.speed) + Math.abs(Bc.speed);
    for (const [u, o] of [[A, Bc], [Bc, A]]) {
      if (u.mode === 'traffic' || u.mode === 'chase') { u.stun = Math.max(u.stun, 0.8); u.speed *= 0.5; }
      if (u.mode === 'player') {
        if (u.hitCool <= 0) { u.hitCool = 0.35; if (impact > 14) { hurt((impact - 12) * 0.5); sfx.crash(); } }
        u.speed *= -0.2;
        if (o.mode === 'traffic' && state.team === 'crim' && impact > 12 && Math.random() < 0.3) setWanted(Math.max(state.wanted, 1), 'تصادم!');
      }
    }
  }
}

// ---------- audio ----------
const sfx = {
  ac: null, init() {
    if (this.ac) return;
    try {
      const ac = this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.eng = ac.createOscillator(); this.eng.type = 'sawtooth'; this.engG = ac.createGain(); this.engG.gain.value = 0;
      this.eng.connect(this.engG).connect(ac.destination); this.eng.start();
      this.sir = ac.createOscillator(); this.sir.type = 'sine'; this.sirG = ac.createGain(); this.sirG.gain.value = 0;
      this.sir.connect(this.sirG).connect(ac.destination); this.sir.start();
    } catch (e) { this.ac = null; }
  },
  noise(dur, vol, lp) {
    if (!this.ac) return; const ac = this.ac, n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = ac.createBufferSource(); s.buffer = buf; const g = ac.createGain(); g.gain.value = vol;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; s.connect(f).connect(g).connect(ac.destination); s.start();
  },
  tone(f, dur, vol, type = 'sine', delay = 0) {
    if (!this.ac) return; const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    const t = ac.currentTime + delay; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
  },
  shot() { this.noise(0.18, 0.35, 3500); }, npcShot() { this.noise(0.15, 0.12, 2000); },
  crash() { this.noise(0.4, 0.4, 900); }, horn() { this.tone(330, 0.35, 0.12, 'square'); this.tone(415, 0.35, 0.1, 'square'); },
  cash() { this.tone(880, 0.12, 0.15, 'triangle'); this.tone(1320, 0.2, 0.15, 'triangle', 0.1); },
  update(inCar, ratio, sirenLevel, t) {
    if (!this.ac) return;
    this.engG.gain.value = inCar ? 0.025 + ratio * 0.03 : 0; this.eng.frequency.value = 45 + ratio * 150;
    this.sirG.gain.value = sirenLevel * 0.03; this.sir.frequency.value = 650 + 250 * Math.sin(t * 6);
  }
};

// ---------- input ----------
const keys = {}, pressed = {};
let mouseDown = false, mouseRight = false, locked = false, lastMouseMove = 0;
addEventListener('keydown', e => {
  if (e.repeat) { if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); return; }
  keys[e.code] = true; pressed[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; });
canvas.addEventListener('mousedown', e => {
  if (!state.started) return;
  if (!locked && !state.paused) tryLock();
  if (e.button === 0) mouseDown = true; if (e.button === 2) mouseRight = true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; if (e.button === 2) mouseRight = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => {
  if (!state.started || state.paused) return;
  if (locked || mouseDown) {
    cam.yaw -= (e.movementX || 0) * 0.0026; cam.pitch = clamp(cam.pitch + (e.movementY || 0) * 0.0026, -0.25, 1.25);
    lastMouseMove = performance.now();
  }
});
function tryLock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && state.started && !state.dead) setPaused(true);
});
function setPaused(v) { state.paused = v; $('pause').classList.toggle('hidden', !v); if (!v) tryLock(); }
$('resume').onclick = () => setPaused(false);

// ---------- game state ----------
const state = {
  started: false, paused: false, team: null, cash: 500, wanted: 0, wantedTimer: 0, dead: false,
  bustT: 0, regen: 0, time: 0, rob: null, arrests: 0
};
const cam = { yaw: 0, pitch: 0.35, dist: 7.5 };
const P = { x: 0, z: 0, y: 0, vy: 0, rot: 0, hp: 100, car: null, mesh: null, parts: null, phase: 0, aimT: 0, speed: 0, fireCd: 0, isPlayer: true };

const cops = [], crooks = [], peds = [];

function buildPlayer(team) {
  if (P.mesh) scene.remove(P.mesh);
  const hm = team === 'cop' ? makeHuman(0x1d3b8b, 0x14213d, 0xf0c8a0, 0x0e1b44, true) : makeHuman(0x222222, 0x3a3a3a, 0xe0b890, 0x8b0000, true);
  P.mesh = hm.group; P.parts = hm.parts; scene.add(P.mesh);
}

// ---------- NPC humans ----------
function ringPos(i, j, t) {
  const per = RING * 8, s = ((t % per) + per) % per, side = Math.floor(s / (RING * 2)), u = s % (RING * 2) - RING;
  const bx = bc(i), bz = bc(j);
  if (side === 0) return [bx + u, bz - RING]; if (side === 1) return [bx + RING, bz + u];
  if (side === 2) return [bx - u, bz + RING]; return [bx - RING, bz - u];
}
function initHuman(type, hm, x, z) {
  const e = { type, x, z, y: 0, rot: rnd(0, TAU), hp: 100, dead: false, speed: 0, mesh: hm.group, parts: hm.parts, hit: hm.hit, state: 'walk', t: 0, cd: rnd(0.5, 2), phase: rnd(0, 6), up: false, bust: 0 };
  hm.hit.forEach(m => m.userData.owner = e);
  hm.group.position.set(x, 0, z); scene.add(hm.group);
  return e;
}
function spawnPed() {
  const hm = makeHuman(pick([0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0xecf0f1, 0x1abc9c]), pick([0x2c3e50, 0x34495e, 0x6b4f3a, 0x555555]), pick([0xf0c8a0, 0xd9a577, 0x8d5a3b, 0xffdbac]));
  const e = initHuman('ped', hm, 0, 0);
  e.ring = { i: rint(0, N - 1), j: rint(0, N - 1), t: rnd(0, RING * 8), dir: Math.random() < 0.5 ? 1 : -1 }; e.walk = rnd(1.4, 2.2);
  peds.push(e); return e;
}
function spawnCop(x, z, patrol) {
  const hm = makeHuman(0x1d3b8b, 0x14213d, 0xf0c8a0, 0x0e1b44, true);
  const e = initHuman('cop', hm, x ?? 0, z ?? 0); e.state = patrol ? 'patrol' : 'chase'; e.hp = 100;
  if (patrol) e.ring = { i: rint(0, N - 1), j: rint(0, N - 1), t: rnd(0, RING * 8), dir: Math.random() < 0.5 ? 1 : -1 };
  cops.push(e); return e;
}
function spawnCrook() {
  const s = pick(spots), hm = makeHuman(0xb32020, 0x1e1e1e, 0xe0b890, 0x111111, true);
  const e = initHuman('crook', hm, s.x + rnd(-6, 6), s.z + rnd(2, 9));
  e.state = 'robbing'; e.t = 28; e.spot = s; e.value = Math.round((s.reward[0] + s.reward[1]) / 4);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  arrow.rotation.x = Math.PI; arrow.position.y = 3.1; e.mesh.add(arrow); e.arrow = arrow;
  crooks.push(e);
  if (state.team === 'cop') toast(`🚨 سطو مسلح على ${s.name}! تحقق من الخريطة`, 'rgba(180,20,20,.85)');
  return e;
}
function killHuman(e, list) {
  e.dead = true; e.state = 'dead'; e.t = 6; e.mesh.rotation.x = -Math.PI / 2; e.mesh.position.y = 0.35;
  if (e.arrow) e.arrow.visible = false;
}
function removeHuman(e, list) { scene.remove(e.mesh); const i = list.indexOf(e); if (i >= 0) list.splice(i, 1); }

function moveHuman(e, dx, dz, spd, dt) {
  const l = Math.hypot(dx, dz); if (l < 1e-4) { e.speed = 0; return; }
  dx /= l; dz /= l;
  const r = resolveCircle(e.x + dx * spd * dt, e.z + dz * spd * dt, 0.5);
  e.x = r.x; e.z = r.z; e.rot += angDiff(e.rot, Math.atan2(dx, dz)) * Math.min(1, 12 * dt); e.speed = spd;
}
function walkRing(e, dt) {
  const r = e.ring; r.t += r.dir * e.walk * dt;
  const [x, z] = ringPos(r.i, r.j, r.t), [x2, z2] = ringPos(r.i, r.j, r.t + r.dir * 0.5);
  e.x = x; e.z = z; e.rot += angDiff(e.rot, Math.atan2(x2 - x, z2 - z)) * Math.min(1, 10 * dt); e.speed = e.walk;
}

function npcShoot(e, acc, dmg) {
  const ox = e.x, oy = 1.5, oz = e.z, tx = P.x, ty = (P.car ? 1.2 : 1.1) + P.y, tz = P.z;
  tracer(ox, oy, oz, tx + rnd(-1, 1), ty, tz + rnd(-1, 1), 0xffaa44);
  sfx.npcShot();
  if (Math.random() < acc) hurt(dmg);
}
const tracers = [];
function tracer(ax, ay, az, bx, by, bz, color = 0xffee88) {
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz)]);
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color })); scene.add(l); tracers.push({ l, t: 0.07 });
}

function updatePeds(dt) {
  for (const e of peds) {
    if (e.dead) { e.t -= dt; continue; }
    walkRing(e, dt);
  }
}

function updateCops(dt) {
  const crim = state.team === 'crim';
  for (const e of cops) {
    if (e.dead) { e.t -= dt; continue; }
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz);
    if (e.state === 'patrol') {
      walkRing(e, dt);
      if (crim && state.wanted >= 1 && d < 110) e.state = 'chase';
    } else if (e.state === 'chase') {
      if (!crim || state.wanted === 0) { e.state = 'leave'; e.t = 6; continue; }
      const aim = d < 32;
      if (d > 2.0) moveHuman(e, dx, dz, 6.4, dt); else e.speed = 0;
      e.cd -= dt;
      if (aim) e.rot += angDiff(e.rot, Math.atan2(dx, dz)) * Math.min(1, 10 * dt);
      if (aim && e.cd <= 0 && state.wanted >= 2 && !state.dead) {
        e.cd = rnd(0.9, 1.6);
        if (lineOfSight(e.x, 1.5, e.z, P.x, 1.2, P.z)) npcShoot(e, clamp(0.5 - d / 80, 0.1, 0.45), 6 + state.wanted);
      }
      if (d < 2.6 && !P.car) { state.bustT += dt; } 
    } else if (e.state === 'leave') {
      e.t -= dt; moveHuman(e, -dx, -dz, 3, dt);
      if (e.t <= 0 || d > 150) { e.dead = true; e.t = 0; removeHuman(e, cops); }
    }
  }
}

function updateCrooks(dt) {
  for (const e of crooks) {
    if (e.dead) { e.t -= dt; continue; }
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
    if (e.arrow) { e.arrow.position.y = 3.1 + Math.sin(state.time * 5) * 0.15; e.arrow.rotation.y += dt * 3; }
    if (e.state === 'robbing') {
      e.t -= dt; e.speed = 0;
      if (e.t <= 0 || (state.team === 'cop' && d < 38)) { e.state = 'flee'; e.t = 60; e.fleeDir = Math.atan2(dx, dz); e.cd = 2; }
    } else if (e.state === 'flee') {
      e.t -= dt; e.cd -= dt;
      let ang = Math.atan2(dx, dz) + Math.sin(state.time * 0.7 + e.phase) * 0.8;
      if (d > 120 && e.t < 40) ang += Math.PI; // wander back toward the player's area if left alone for long
      moveHuman(e, Math.sin(ang), Math.cos(ang), d < 80 ? 7 : 3, dt);
      if (state.team === 'cop' && d < 22 && e.cd <= 0 && !state.dead && lineOfSight(e.x, 1.5, e.z, P.x, 1.2, P.z)) {
        e.cd = rnd(1.4, 2.4); npcShoot(e, 0.25, 6);
      }
      if (e.t <= 0 && d > 80) { removeHuman(e, crooks); }
    } else if (e.state === 'arrested') {
      e.up = true; e.t -= dt; e.speed = 0; if (e.t <= 0) removeHuman(e, crooks);
    }
  }
}

// ---------- gameplay actions ----------
function hurt(n) {
  if (state.dead || !state.started) return;
  P.hp -= n; state.regen = 7;
  const d = $('damage'); d.style.opacity = clamp(n / 18, 0.25, 0.9); setTimeout(() => d.style.opacity = 0, 120);
  if (P.hp <= 0) wasted();
}
function setWanted(n, why) {
  if (state.team !== 'crim') return;
  n = clamp(n, 0, 5);
  if (n > state.wanted) { state.wanted = n; if (why) toast(`⭐ مستوى المطلوب ${n} — ${why}`, 'rgba(180,120,0,.9)'); }
  state.wantedTimer = 22;
}
function flash(text, color, ms = 1800) {
  const f = $('flash'); f.textContent = text; f.style.color = color; f.classList.add('show');
  setTimeout(() => f.classList.remove('show'), ms);
}
function toast(text, bg = 'rgba(14,21,34,.85)', ms = 3200) {
  const t = document.createElement('div'); t.className = 'toast panel'; t.textContent = text; t.style.background = bg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), ms);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}

function clearPolice() {
  for (const c of cars.filter(c => c.mode === 'chase')) c.mode = 'idle';
  for (const e of cops.filter(e => e.state === 'chase')) { e.state = 'leave'; e.t = 4; }
}

function respawn(reason) {
  if (P.car) { P.car.mode = 'idle'; P.car = null; }
  state.dead = false; P.hp = 100; P.vy = 0; P.y = 0; state.bustT = 0; state.rob = null;
  const s = specials[state.team === 'cop' ? 'police' : 'hideout'];
  P.x = s.x; P.z = s.doorZ + 10; P.rot = 0; cam.yaw = 0;
  P.mesh.visible = true; P.mesh.rotation.x = 0;
  state.wanted = 0; clearPolice();
  const car = newCar(state.team === 'cop' ? 'police' : 'sedan', s.x + 11, s.doorZ + 9, Math.PI / 2, 'idle', 0x6b1a1a);
  if (reason) flash(reason, '#fff');
}
function wasted() {
  state.dead = true; const lose = Math.round(state.cash * 0.2);
  state.cash -= lose; flash('💀 لقد متّ', '#ff4d4d', 2600);
  P.mesh.visible = false; if (P.car) { P.car.mode = 'idle'; P.car = null; }
  setTimeout(() => respawn(), 2800);
}
function busted() {
  const lose = Math.round(state.cash * 0.3); state.cash -= lose;
  toast(`🚔 تم القبض عليك! خسرت $${lose}`, 'rgba(20,50,140,.9)', 4000);
  respawn('🚔 تم القبض عليك'); state.dead = false;
}

function enterCar(c) {
  P.car = c; c.mode = 'player'; c.speed = c.speed || 0; P.mesh.visible = false; c.disTimer = undefined;
}
function exitCar() {
  const c = P.car; if (!c) return;
  const [rx, rz] = carRight(c); let ok = false;
  for (const side of [-1, 1]) for (const dist of [2.8, 4]) {
    const x = c.x + rx * side * dist, z = c.z + rz * side * dist, r = resolveCircle(x, z, 0.6);
    if (!r.hit) { P.x = x; P.z = z; ok = true; break; }
  }
  if (!ok) { P.x = c.x + rx * 3; P.z = c.z + rz * 3; }
  c.mode = 'idle'; P.car = null; P.mesh.visible = true; P.rot = c.h; P.y = 0;
}

function nearestCar(maxD) {
  let best = null, bd = maxD;
  for (const c of cars) { if (c.mode === 'player') continue; const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < bd) { bd = d; best = c; } }
  return best;
}
function nearestCrook(maxD) {
  let best = null, bd = maxD;
  for (const e of crooks) { if (e.dead || e.state === 'arrested') continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; best = e; } }
  return best;
}

function arrest(e) {
  e.state = 'arrested'; e.t = 2.5; e.up = true; e.arrow.visible = false;
  state.cash += e.value; state.arrests++; sfx.cash();
  toast(`✅ اعتقال ناجح! +$${e.value}`, 'rgba(10,110,50,.9)');
}

function doShoot() {
  if (P.fireCd > 0 || P.car || state.dead) return;
  P.fireCd = 0.24; P.aimT = 1.2; sfx.shot();
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const origin = camera.position.clone();
  raycaster.set(origin, dir); raycaster.far = 120;
  const targets = [];
  for (const l of [cops, crooks, peds]) for (const e of l) if (!e.dead && e.state !== 'arrested') targets.push(...e.hit);
  const hits = raycaster.intersectObjects(targets.concat(solidMeshes), false);
  let end = origin.clone().addScaledVector(dir, 90);
  if (hits.length) {
    end = hits[0].point; const e = hits[0].object.userData.owner;
    if (e) {
      const head = hits[0].object === e.hit[e.hit.length - 1];
      e.hp -= head ? 100 : 34; const ch = $('crosshair'); ch.classList.add('hit'); setTimeout(() => ch.classList.remove('hit'), 90);
      if (e.type === 'ped') setWanted(Math.max(state.wanted, 1), 'اعتداء على مدني');
      if (e.type === 'cop') setWanted(Math.max(state.wanted, 2), 'اعتداء على شرطي');
      if (e.hp <= 0) {
        if (e.type === 'cop') { setWanted(state.wanted + 1, 'قتل شرطي'); killHuman(e); }
        else if (e.type === 'crook') { killHuman(e); state.cash += Math.round(e.value * 0.4); toast(`🎯 تمت تصفية مجرم +$${Math.round(e.value * 0.4)}`, 'rgba(10,110,50,.9)'); sfx.cash(); }
        else { killHuman(e); }
      } else if (e.type === 'cop' && state.team === 'crim') { e.state = 'chase'; }
    }
  }
  const mz = new THREE.Vector3(P.x + Math.sin(P.rot) * 0.7, 1.55 + P.y, P.z + Math.cos(P.rot) * 0.7);
  tracer(mz.x, mz.y, mz.z, end.x, end.y, end.z);
}

function updateWanted(dt) {
  if (state.team !== 'crim' || state.wanted === 0) return;
  let nearest = 1e9;
  for (const c of cars) if (c.mode === 'chase') nearest = Math.min(nearest, Math.hypot(c.x - P.x, c.z - P.z));
  for (const e of cops) if (e.state === 'chase') nearest = Math.min(nearest, Math.hypot(e.x - P.x, e.z - P.z));
  if (nearest > 75) state.wantedTimer -= dt; else state.wantedTimer = Math.max(state.wantedTimer, 8);
  if (state.wantedTimer <= 0) {
    state.wanted--; state.wantedTimer = 14;
    if (state.wanted === 0) { toast('✔ نجحت بالهروب من الشرطة', 'rgba(10,110,50,.9)'); clearPolice(); } else toast(`⭐ انخفض مستوى المطلوب إلى ${state.wanted}`);
  }
  // dispatch
  const want = Math.min(state.wanted + 1, 5), chasing = cars.filter(c => c.mode === 'chase');
  state.dispatch = (state.dispatch || 0) - dt;
  if (chasing.length < want && state.dispatch <= 0) {
    state.dispatch = 4;
    for (let t = 0; t < 14; t++) {
      const ix = rint(0, N), iz = rint(0, N), x = rc(ix), z = rc(iz), d = Math.hypot(x - P.x, z - P.z);
      if (d < 120 || d > 260) continue;
      const c = newCar('police', x, z, Math.atan2(P.x - x, P.z - z), 'chase'); c.speed = 12; break;
    }
  }
  // bust check
  let near = 0; for (const c of chasing) if (Math.hypot(c.x - P.x, c.z - P.z) < 7.5) near++;
  if (P.car) { if (near >= 2 && Math.abs(P.car.speed) < 3.5) state.bustT += dt; else state.bustT = Math.max(0, state.bustT - dt); }
  else {
    // on-foot: increments done in updateCops; decay otherwise
    state.bustT = Math.max(0, state.bustT - dt * 0.7);
  }
  const limit = P.car ? 2.5 : 1.6;
  if (state.bustT >= limit) busted();
}

function updateSpots(dt) {
  for (const s of spots) {
    s.cd = Math.max(0, s.cd - dt);
    const ready = s.cd <= 0, u = s.marker.userData;
    u.ring.material.color.set(ready ? 0xffd23f : 0x666666); u.beam.visible = ready;
    u.ring.scale.setScalar(1 + Math.sin(state.time * 4) * 0.05);
  }
  specials.dealer.marker.userData.ring.scale.setScalar(1 + Math.sin(state.time * 4) * 0.05);
}

// ---------- interaction ----------
let promptText = '';
function interact(dt) {
  promptText = '';
  if (state.dead) return;
  const robWrap = $('robwrap');
  if (P.car) {
    promptText = 'E: النزول من السيارة  ·  H: منبّه';
    if (pressed.KeyE) exitCar();
    if (pressed.KeyH) sfx.horn();
    robWrap.style.display = 'none'; state.rob = null; return;
  }
  // arrest
  if (state.team === 'cop') {
    const cr = nearestCrook(3.4);
    if (cr) { promptText = 'E: اعتقال المجرم'; if (pressed.KeyE) { arrest(cr); } robWrap.style.display = 'none'; return; }
  }
  // dealership
  const dl = specials.dealer;
  if (Math.hypot(P.x - dl.sx, P.z - dl.sz) < 5) {
    promptText = 'F: شراء سيارة رياضية ($4000)';
    if (pressed.KeyF) {
      if (state.cash >= 4000) {
        state.cash -= 4000; sfx.cash();
        const c = newCar('sport', dl.sx + 8, dl.sz + 4, Math.PI / 2, 'idle', pick([0xd62828, 0x1d70d6, 0xf4a300, 0x111111]));
        toast('🏎 تم شراء السيارة الرياضية!', 'rgba(10,110,50,.9)'); enterCar(c);
      } else toast('❌ رصيدك لا يكفي', 'rgba(150,20,20,.9)');
    }
  }
  // robbery
  if (state.team === 'crim') {
    const s = spots.find(s => s.cd <= 0 && Math.hypot(P.x - s.x, P.z - s.z) < 4.6);
    if (s) {
      promptText = `اضغط مطولاً E لسرقة ${s.name}`;
      if (keys.KeyE) {
        if (!state.rob || state.rob.spot !== s) state.rob = { spot: s, t: 0 };
        const r = state.rob; r.t += dt;
        if (r.t > 0.6) setWanted(Math.max(state.wanted, Math.floor(s.wanted / 2)), `سرقة ${s.name}`);
        robWrap.style.display = 'block'; $('robbar').style.width = (r.t / s.time * 100) + '%';
        if (r.t >= s.time) {
          const amt = rint(s.reward[0], s.reward[1]); state.cash += amt; s.cd = 150; state.rob = null; sfx.cash();
          setWanted(Math.max(state.wanted, s.wanted), null); state.wantedTimer = 25;
          toast(`💰 سرقت ${s.name}! +$${amt}`, 'rgba(10,110,50,.9)', 4000); robWrap.style.display = 'none';
        }
      } else { state.rob = null; robWrap.style.display = 'none'; }
      return;
    }
  }
  state.rob = null; robWrap.style.display = 'none';
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
  const r = resolveCircle(P.x + mx * spd * dt, P.z + mz * spd * dt, 0.5); P.x = r.x; P.z = r.z;
  P.speed = l > 0 ? spd : 0;
  if (pressed.Space && P.y <= 0.01) P.vy = 7.5;
  P.vy -= 22 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) P.vy = 0;
  P.aimT = Math.max(0, P.aimT - dt); P.fireCd = Math.max(0, P.fireCd - dt);
  const aiming = P.aimT > 0 || mouseRight || mouseDown;
  const want = aiming ? cam.yaw : (l > 0 ? Math.atan2(mx, mz) : P.rot);
  P.rot += angDiff(P.rot, want) * Math.min(1, 14 * dt);
  if (mouseDown) doShoot();
  animHuman(P, P.speed, dt, aiming);
  P.mesh.position.set(P.x, P.y, P.z); P.mesh.rotation.y = P.rot;
  // cars hit pedestrian-player
  for (const c of cars) {
    if (c.mode === 'parked' || Math.abs(c.speed) < 5) continue;
    if (Math.hypot(c.x - P.x, c.z - P.z) < 2.2 && c.hitCool <= 0) { c.hitCool = 0.6; hurt(Math.abs(c.speed) * 1.2); const [fx2, fz2] = carForward(c); P.x += fx2 * 1.5; P.z += fz2 * 1.5; }
  }
  // standing cars are solid
  for (const c of cars) {
    const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz); if (d < 2.0 && d > 0.01) { P.x = c.x + dx / d * 2.0; P.z = c.z + dz / d * 2.0; }
  }
}

// ---------- camera ----------
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3();
function updateCamera(dt) {
  if (!state.started) {
    cam.yaw += dt * 0.12;
    const cx = Math.sin(cam.yaw) * 90, cz = Math.cos(cam.yaw) * 90;
    camera.position.set(cx, 55, cz); camera.lookAt(0, 8, 0); return;
  }
  const inCar = !!P.car, subj = inCar ? P.car : P;
  if (inCar && performance.now() - lastMouseMove > 1400 && Math.abs(P.car.speed) > 3) {
    const tgt = P.car.speed >= 0 ? P.car.h : P.car.h + Math.PI;
    cam.yaw += angDiff(cam.yaw, tgt) * Math.min(1, 2.2 * dt);
  }
  if (keys.ArrowLeft) cam.yaw += 1.8 * dt; if (keys.ArrowRight) cam.yaw -= 1.8 * dt;
  const tgtDist = inCar ? 12.5 : (mouseRight ? 4.2 : 7);
  cam.dist += (tgtDist - cam.dist) * Math.min(1, 6 * dt);
  const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = -Math.cos(cam.yaw), rz = Math.sin(cam.yaw);
  const shoulder = inCar ? 0 : 0.9, hy = inCar ? 1.8 : 1.7;
  camTarget.set(subj.x + rx * shoulder, (subj.y || 0) + hy, subj.z + rz * shoulder);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  let dist = cam.dist;
  const dir = new THREE.Vector3(-fx * cp, sp, -fz * cp).normalize();
  raycaster.set(camTarget, dir); raycaster.far = dist + 0.5;
  const hit = raycaster.intersectObjects(solidMeshes, false);
  if (hit.length) dist = Math.max(1.2, hit[0].distance - 0.6);
  camPos.copy(camTarget).addScaledVector(dir, dist); camPos.y = Math.max(camPos.y, 0.6);
  camera.position.copy(camPos);
  camera.lookAt(camTarget.x + fx * 12, camTarget.y - sp * 3 + 0.4, camTarget.z + fz * 12);
}

// ---------- HUD ----------
const mm = $('minimap').getContext('2d');
function updateHUD() {
  $('cash').textContent = '$' + Math.max(0, Math.round(state.cash)).toLocaleString('en-US');
  $('hpbar').style.width = clamp(P.hp, 0, 100) + '%';
  $('teamlabel').textContent = state.team === 'cop' ? '🚔 شرطي' : '🦹 مجرم';
  $('teamlabel').style.color = state.team === 'cop' ? 'var(--blue)' : 'var(--red)';
  let s = ''; for (let i = 0; i < 5; i++) s += `<span class="${i < state.wanted ? 'on' : 'off'}">★</span>`;
  $('stars').innerHTML = state.team === 'crim' ? s : `<span style="font-size:14px;opacity:.8">اعتقالات: ${state.arrests}</span>`;
  const p = $('prompt'); p.style.display = promptText ? 'block' : 'none'; p.textContent = promptText;
  $('crosshair').style.display = (!P.car && state.started) ? 'block' : 'none';
  const sp = $('speedo'); sp.style.display = P.car ? 'block' : 'none'; if (P.car) $('speedv').textContent = Math.round(Math.abs(P.car.speed) * 3.6);
  $('objective').textContent = state.team === 'cop'
    ? 'المهمة: اعتقل المجرمين (الدوائر الحمراء على الخريطة). اقترب منهم واضغط E، أو أطلق النار.'
    : (state.wanted > 0 ? '🚨 الشرطة تطاردك! اهرب بعيداً عنهم حتى ينخفض مستوى المطلوب.' : 'المهمة: اسرق البنك أو المجوهرات أو المحطة (الدوائر الصفراء)، ثم اشترِ سيارة من المعرض.');
  drawMinimap();
}
function drawMinimap() {
  const g = mm, W = 190, view = 170, sc = W / view, px = P.car ? P.car.x : P.x, pz = P.car ? P.car.z : P.z;
  g.save(); g.fillStyle = '#222'; g.fillRect(0, 0, W, W);
  g.translate(W / 2, W / 2); g.rotate(cam.yaw + Math.PI); g.scale(sc, sc); g.translate(-px, -pz);
  g.drawImage(mapStatic, -MAPM, -MAPM, MAPM * 2, MAPM * 2);
  const dot = (x, z, c, r = 3.2) => { g.fillStyle = c; g.beginPath(); g.arc(x, z, r, 0, TAU); g.fill(); };
  for (const s of spots) dot(s.x, s.z, s.cd <= 0 ? '#ffd23f' : '#777', 4);
  dot(specials.dealer.sx, specials.dealer.sz, '#4dff9a', 4);
  for (const e of crooks) if (!e.dead && (state.team === 'cop')) dot(e.x, e.z, Math.floor(state.time * 3) % 2 ? '#ff3030' : '#ff9090', 4.5);
  if (state.team === 'crim') {
    for (const c of cars) if (c.mode === 'chase') dot(c.x, c.z, Math.floor(state.time * 4) % 2 ? '#3d7bff' : '#ff3030', 4);
    for (const e of cops) if (e.state === 'chase') dot(e.x, e.z, '#3d7bff', 2.6);
  }
  g.restore();
  g.save(); g.translate(W / 2, W / 2);
  const rel = (P.car ? P.car.h : P.rot) - cam.yaw; g.rotate(Math.PI - rel + Math.PI);
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 9); g.lineTo(-6, -7); g.lineTo(0, -3); g.lineTo(6, -7); g.closePath(); g.fill(); g.stroke(); g.restore();
}

// ---------- main update ----------
const clock = new THREE.Clock();
function update(dt) {
  state.time += dt;
  const active = state.started && !state.paused;
  const playing = active && !state.dead;

  // world simulation runs on menu too, so the backdrop feels alive
  for (const c of cars) {
    c.hitCool = Math.max(0, c.hitCool - dt);
    if (c.mode === 'traffic') updateTraffic(c, dt);
    else if (c.mode === 'chase') { if (state.started && state.team === 'crim') updateChase(c, dt); else updateIdleCar(c, dt); }
    else if (c.mode === 'idle') updateIdleCar(c, dt);
    else if (c.mode === 'player') { if (playing) drivePlayerCar(c, dt); else updateIdleCar(c, dt); }
  }
  separateCars(dt);
  for (const c of cars) {
    c.mesh.position.set(c.x, 0, c.z); c.mesh.rotation.y = c.h;
    if (c.lights) {
      const on = (c.mode === 'chase' && state.wanted > 0) || (c.mode === 'traffic' && false);
      const ph = Math.floor((state.time + c.flash) * 6) % 2;
      c.lights[0].color.setHex(on ? (ph ? 0xff2020 : 0x300808) : 0x7a1010);
      c.lights[1].color.setHex(on ? (ph ? 0x081030 : 0x2a6cff) : 0x10204a);
    }
  }

  if (active) {
    if (!state.dead) {
      if (P.car) { P.x = P.car.x; P.z = P.car.z; P.y = 0; P.speed = P.car.speed; }
      else updateOnFoot(dt);
      interact(dt);
      if (state.regen > 0) state.regen -= dt; else if (P.hp < 100) P.hp = Math.min(100, P.hp + 6 * dt);
    }
    updateWanted(dt);
    updateSpots(dt);
  }
  updatePeds(dt); updateCops(dt); updateCrooks(dt);
  for (const list of [peds, cops, crooks]) {
    for (const e of list) {
      e.mesh.position.set(e.x, e.dead ? 0.35 : 0, e.z); e.mesh.rotation.y = e.rot;
      if (!e.dead) animHuman(e, e.speed, dt, e.type !== 'ped' && e.state !== 'patrol' && e.state !== 'robbing' ? true : false);
    }
  }
  for (const list of [peds, cops]) for (let i = list.length - 1; i >= 0; i--) if (list[i].dead && list[i].t <= 0) removeHuman(list[i], list);
  for (let i = crooks.length - 1; i >= 0; i--) if (crooks[i].dead && crooks[i].t <= 0) removeHuman(crooks[i], crooks);
  for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].t -= dt; if (tracers[i].t <= 0) { scene.remove(tracers[i].l); tracers.splice(i, 1); } }

  // population control
  state.spawn = (state.spawn || 0) - dt;
  if (state.spawn <= 0) {
    state.spawn = 1.5;
    const ref = state.started ? P : null;
    if (cars.filter(c => c.mode === 'traffic').length < 22) spawnTraffic(ref);
    const idle = cars.filter(c => c.mode === 'idle' || c.mode === 'parked');
    if (idle.length > 40) { const far = idle.sort((a, b) => Math.hypot(b.x - P.x, b.z - P.z) - Math.hypot(a.x - P.x, a.z - P.z))[0]; removeCar(far); }
    if (peds.filter(e => !e.dead).length < 26) spawnPed();
    if (cops.filter(e => e.state === 'patrol').length < 7) spawnCop(0, 0, true);
    if (state.started && state.team === 'cop' && crooks.filter(e => !e.dead).length < 3 + (state.arrests > 4 ? 1 : 0) && Math.random() < 0.5) spawnCrook();
    if (state.started && !crooks.length && state.team === 'cop') spawnCrook();
  }

  // audio / camera / sun
  const nearChase = state.wanted > 0 && cars.some(c => c.mode === 'chase' && Math.hypot(c.x - P.x, c.z - P.z) < 120);
  sfx.update(!!P.car, P.car ? clamp(Math.abs(P.car.speed) / CAR_STATS[P.car.kind].max, 0, 1) : 0, nearChase ? 1 : 0, state.time);
  updateCamera(dt);
  const sx = state.started ? P.x : 0, sz = state.started ? P.z : 0;
  sun.position.set(sx + 70, 140, sz + 40); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();
  for (const k in pressed) pressed[k] = false;
  if (state.started) updateHUD();
}

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(state.paused ? 0 : dt);
  renderer.render(scene, camera);
}

// ---------- start ----------
function startGame(team) {
  sfx.init(); state.team = team; state.started = true; state.cash = 500; state.wanted = 0; state.arrests = 0;
  buildPlayer(team);
  for (const e of crooks.splice(0)) scene.remove(e.mesh);
  respawn();
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden');
  tryLock();
  toast(team === 'cop' ? '🚔 أهلاً بك أيها الشرطي! اركب سيارتك (E) وابحث عن اللصوص' : '🦹 أهلاً بك! توجّه إلى الدوائر الصفراء لتبدأ السرقة', undefined, 5000);
}
document.querySelectorAll('.card').forEach(c => c.onclick = () => startGame(c.dataset.team));

buildCity();
renderStaticMap();
for (let i = 0; i < 22; i++) spawnTraffic(null);
for (let i = 0; i < 28; i++) spawnParked(null);
for (let i = 0; i < 24; i++) spawnPed();
for (let i = 0; i < 7; i++) spawnCop(0, 0, true);
buildPlayer('cop'); P.mesh.visible = false;
frame();

// debug hooks (used for automated testing)
window.__game = { state, P, cars, cops, crooks, peds, spots, specials, startGame, cam, keys };

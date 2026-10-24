'use strict';
/* ===== MAD CITY 3D — core: helpers, renderer, sky/weather, collision, fx, audio, input ===== */

const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const $ = id => document.getElementById(id);

// ---------- world layout ----------
const N = 10, B = 60, R = 18, S = B + R;
const WORLD = N * S / 2 + R / 2 + 8;
const rc = k => (k - N / 2) * S;            // centre of road k (0..N)
const bc = i => (i - (N - 1) / 2) * S;      // centre of block i (0..N-1)
const RING = 27;

// ---------- renderer / scene ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9cc4f0, 150, 650);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.3, 2400);
const hemi = new THREE.HemisphereLight(0xdbe9ff, 0x4d5a45, 0.75);
const sun = new THREE.DirectionalLight(0xfff0d6, 0.95);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 500 });
sun.shadow.bias = -0.0006;
scene.add(hemi, sun, sun.target);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
});

const settings = { quality: 'med' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('madcity_settings') || '{}')); } catch (e) { }
function setQuality(q) {
  settings.quality = q;
  try { localStorage.setItem('madcity_settings', JSON.stringify(settings)); } catch (e) { }
  const pr = { low: 0.75, med: 1, high: Math.min(devicePixelRatio, 1.5) }[q];
  renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
  sun.castShadow = q !== 'low';
  const ms = q === 'high' ? 2048 : 1024;
  if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  scene.fog.far = q === 'low' ? 420 : 650;
  document.querySelectorAll('[data-q]').forEach(b => b.classList.toggle('sel', b.dataset.q === q));
}

const lam = (() => { const m = new Map(); return c => { if (!m.has(c)) m.set(c, new THREE.MeshLambertMaterial({ color: c })); return m.get(c); }; })();

// ---------- sky, sun/moon, stars, clouds, rain ----------
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color(0x4a90e2) }, bot: { value: new THREE.Color(0xbfdcff) } },
  vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, clamp(h*1.5,0.0,1.0)),1.0); }',
  side: THREE.BackSide, depthWrite: false, fog: false
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 16), skyMat); skyDome.renderOrder = -10; scene.add(skyDome);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false, depthWrite: false }));
const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(38, 24), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, fog: false, depthWrite: false }));
scene.add(sunDisc, moonDisc);
const starGeo = new THREE.BufferGeometry(), sp = [];
for (let i = 0; i < 700; i++) { const a = rnd(0, TAU), e = Math.acos(rnd(0.02, 1)), r = 1700; sp.push(Math.sin(e) * Math.cos(a) * r, Math.cos(e) * r, Math.sin(e) * Math.sin(a) * r); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 5, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
scene.add(stars);
const clouds = [];
(function makeClouds() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rnd(160, 340), rnd(90, 170)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(rnd(-900, 900), rnd(200, 280), rnd(-900, 900)); scene.add(m); clouds.push(m);
  }
})();
const rain = (() => {
  const n = 1400, pos = new Float32Array(n * 6), base = [];
  for (let i = 0; i < n; i++) base.push([rnd(-45, 45), rnd(0, 40), rnd(-45, 45)]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xaecbe8, transparent: true, opacity: 0.45, fog: true }));
  m.frustumCulled = false; m.visible = false; scene.add(m);
  return { m, pos, base, n };
})();

const env = { time: 9.5, night: 0, sunH: 1, rain: 0, rainTarget: 0, rainTimer: rnd(120, 300), facadeMats: [], roadMats: [], glow: null };
const COL = {
  dayTop: new THREE.Color(0x3f86de), dayBot: new THREE.Color(0xbcd9ff), duskTop: new THREE.Color(0x35406e), duskBot: new THREE.Color(0xff9d5c),
  nightTop: new THREE.Color(0x02040c), nightBot: new THREE.Color(0x0c1530), grey: new THREE.Color(0x7d8794)
};
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function updateEnv(dt, focus) {
  env.time = (env.time + dt / 75) % 24;                   // 1 game hour = 75s (full day = 30 min)
  const el = (env.time - 6) / 12 * Math.PI, sunH = Math.sin(el); env.sunH = sunH;
  const day = smooth(-0.05, 0.3, sunH), dusk = smooth(-0.25, 0, sunH) * (1 - smooth(0.05, 0.4, sunH));
  env.night = 1 - smooth(-0.12, 0.12, sunH);
  _c1.copy(COL.nightTop).lerp(COL.duskTop, smooth(-0.25, 0, sunH)).lerp(COL.dayTop, day);
  _c2.copy(COL.nightBot).lerp(COL.duskBot, dusk).lerp(COL.dayBot, day);
  env.rain += (env.rainTarget - env.rain) * Math.min(1, dt * 0.25);
  const gray = env.rain * 0.7;
  _c1.lerp(COL.grey.clone().multiplyScalar(0.4 + 0.6 * (1 - env.night)), gray); _c2.lerp(COL.grey.clone().multiplyScalar(0.45 + 0.55 * (1 - env.night)), gray);
  skyMat.uniforms.top.value.copy(_c1); skyMat.uniforms.bot.value.copy(_c2);
  scene.fog.color.copy(_c2);
  scene.fog.near = lerp(150, 40, env.rain); scene.fog.far = (settings.quality === 'low' ? 420 : 650) * lerp(1, 0.45, env.rain);
  hemi.intensity = lerp(0.18, 0.78, 1 - env.night) * lerp(1, 0.75, env.rain);
  const lowSun = 1 - smooth(0.05, 0.5, sunH);
  const dir = new THREE.Vector3(Math.cos(el), Math.max(Math.sin(el), -0.2), 0.35);
  const moon = sunH < -0.04;
  if (moon) dir.set(-Math.cos(el), Math.max(-Math.sin(el), 0.2), -0.35);
  dir.normalize();
  sun.color.setHex(moon ? 0x8aa4ff : 0xffffff).lerp(new THREE.Color(0xffa860), moon ? 0 : lowSun * 0.7);
  sun.intensity = (moon ? 0.22 : lerp(0.15, 1.0, smooth(-0.05, 0.4, sunH))) * lerp(1, 0.45, env.rain);
  sun.position.copy(focus).addScaledVector(dir, 220); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  skyDome.position.copy(focus);
  const sd = new THREE.Vector3(Math.cos(el), Math.sin(el), 0.35).normalize(), md = sd.clone().negate();
  sunDisc.position.copy(focus).addScaledVector(sd, 1500); sunDisc.lookAt(focus); sunDisc.visible = sunH > -0.08 && env.rain < 0.7;
  moonDisc.position.copy(focus).addScaledVector(md, 1500); moonDisc.lookAt(focus); moonDisc.visible = sunH < 0.1 && env.rain < 0.7;
  stars.position.copy(focus); stars.material.opacity = env.night * (1 - env.rain);
  for (const c of clouds) { c.position.x += dt * 6; if (c.position.x > 1000) c.position.x = -1000; c.material.opacity = lerp(0.8, 0.95, env.rain) * (1 - env.night * 0.75); c.material.color.setScalar(lerp(1, 0.55, env.rain)); }
  for (const m of env.facadeMats) m.emissiveIntensity = env.night * 0.95;
  if (env.glow) env.glow.material.opacity = env.night * 0.5;
  for (const m of env.roadMats) { m.shininess = 20 + env.rain * 70; m.specular.setScalar(0.07 + env.rain * 0.5); m.color.setScalar(1 - env.rain * 0.3); }
  // rain
  env.rainTimer -= dt;
  if (env.rainTimer <= 0) { env.rainTarget = env.rainTarget > 0 ? 0 : (Math.random() < 0.55 ? 1 : 0); env.rainTimer = rnd(90, 260); }
  rain.m.visible = env.rain > 0.05;
  if (rain.m.visible) {
    rain.m.position.copy(camera.position); rain.m.material.opacity = 0.5 * env.rain;
    const p = rain.pos;
    for (let i = 0; i < rain.n; i++) {
      const b = rain.base[i]; b[1] -= 55 * dt; if (b[1] < 0) b[1] += 40;
      p[i * 6] = b[0]; p[i * 6 + 1] = b[1] - 20; p[i * 6 + 2] = b[2]; p[i * 6 + 3] = b[0] - 0.15; p[i * 6 + 4] = b[1] - 20 - 1.4; p[i * 6 + 5] = b[2] - 0.1;
    }
    rain.m.geometry.attributes.position.needsUpdate = true;
  }
}

// ---------- collision ----------
const colliders = [];       // {x0,x1,z0,z1,h}
function addCollider(x0, x1, z0, z1, h) { const c = { x0, x1, z0, z1, h }; colliders.push(c); return c; }
function removeCollider(c) { const i = colliders.indexOf(c); if (i >= 0) colliders.splice(i, 1); }

function resolveCircle(x, z, r, noWorld) {
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
  if (!noWorld) {
    const W = WORLD - r;
    if (Math.abs(x) > W || Math.abs(z) > W) { hit = true; x = clamp(x, -W, W); z = clamp(z, -W, W); }
  }
  return { x, z, hit };
}
// analytic ray vs. all collider boxes (cheap replacement for mesh raycasting)
function rayWorld(ox, oy, oz, dx, dy, dz, maxT) {
  let best = maxT;
  for (const c of colliders) {
    let t0 = 0, t1 = best;
    if (Math.abs(dx) < 1e-9) { if (ox < c.x0 || ox > c.x1) continue; } else { let a = (c.x0 - ox) / dx, b = (c.x1 - ox) / dx; if (a > b) { const t = a; a = b; b = t; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    if (Math.abs(dy) < 1e-9) { if (oy < 0 || oy > c.h) continue; } else { let a = -oy / dy, b = (c.h - oy) / dy; if (a > b) { const t = a; a = b; b = t; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    if (Math.abs(dz) < 1e-9) { if (oz < c.z0 || oz > c.z1) continue; } else { let a = (c.z0 - oz) / dz, b = (c.z1 - oz) / dz; if (a > b) { const t = a; a = b; b = t; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    if (t0 < best) best = t0;
  }
  return best;
}
function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const mx = ox - cx, my = oy - cy, mz = oz - cz, b = mx * dx + my * dy + mz * dz, c = mx * mx + my * my + mz * mz - r * r;
  if (c > 0 && b > 0) return null; const disc = b * b - c; if (disc < 0) return null;
  const t = -b - Math.sqrt(disc); return t < 0 ? 0 : t;
}
function lineOfSight(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz);
  return rayWorld(ax, ay, az, dx / len, dy / len, dz / len, len) >= len - 0.01;
}

// ---------- particle fx ----------
const fxPool = [], fxLive = [];
const fxGeo = new THREE.IcosahedronGeometry(1, 0);
for (let i = 0; i < 160; i++) {
  const m = new THREE.Mesh(fxGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); m.visible = false; scene.add(m); fxPool.push(m);
}
function spawnFx(x, y, z, vx, vy, vz, life, s0, s1, color, op = 0.8) {
  const m = fxPool.pop(); if (!m) return;
  m.visible = true; m.position.set(x, y, z); m.material.color.setHex(color); m.material.opacity = op;
  fxLive.push({ m, vx, vy, vz, life, max: life, s0, s1, op });
}
function updateFx(dt) {
  for (let i = fxLive.length - 1; i >= 0; i--) {
    const f = fxLive[i]; f.life -= dt;
    if (f.life <= 0) { f.m.visible = false; fxPool.push(f.m); fxLive.splice(i, 1); continue; }
    const k = 1 - f.life / f.max; f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt;
    f.m.scale.setScalar(lerp(f.s0, f.s1, k)); f.m.material.opacity = f.op * (1 - k);
  }
}
function explosionFx(x, z) {
  for (let i = 0; i < 14; i++) spawnFx(x + rnd(-1, 1), rnd(0.5, 1.5), z + rnd(-1, 1), rnd(-6, 6), rnd(2, 9), rnd(-6, 6), rnd(0.7, 1.4), 1, rnd(3, 5), pick([0xff7a1a, 0xffc13a, 0xff4a1a]), 0.9);
  for (let i = 0; i < 12; i++) spawnFx(x + rnd(-1, 1), rnd(1, 2), z + rnd(-1, 1), rnd(-3, 3), rnd(3, 8), rnd(-3, 3), rnd(1.6, 2.8), 1.5, rnd(4, 7), 0x2b2b2b, 0.6);
}

// ---------- audio ----------
const sfx = {
  ac: null, init() {
    if (this.ac) return;
    try {
      const ac = this.ac = new (window.AudioContext || window.webkitAudioContext)(), out = ac.destination;
      const loopNoise = () => { const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; };
      // engine: two detuned oscillators through a low-pass
      this.e1 = ac.createOscillator(); this.e1.type = 'sawtooth'; this.e2 = ac.createOscillator(); this.e2.type = 'square';
      this.engF = ac.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 400; this.engG = ac.createGain(); this.engG.gain.value = 0;
      this.e1.connect(this.engF); this.e2.connect(this.engF); this.engF.connect(this.engG).connect(out); this.e1.start(); this.e2.start();
      // tyre squeal / wind / rain / city rumble (looped noise through filters)
      const mkBand = (type, f, q) => { const n = loopNoise(), fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; const g = ac.createGain(); g.gain.value = 0; n.connect(fl).connect(g).connect(out); return g; };
      this.tireG = mkBand('bandpass', 1500, 6); this.windG = mkBand('lowpass', 700, 0.7); this.rainG = mkBand('highpass', 2500, 0.5); this.cityG = mkBand('lowpass', 180, 0.7); this.cityG.gain.value = 0.02;
      this.sir = ac.createOscillator(); this.sir.type = 'sine'; this.sirG = ac.createGain(); this.sirG.gain.value = 0; this.sir.connect(this.sirG).connect(out); this.sir.start();
      this.alm = ac.createOscillator(); this.alm.type = 'square'; this.almG = ac.createGain(); this.almG.gain.value = 0; this.alm.connect(this.almG).connect(out); this.alm.start();
      this.heli = ac.createOscillator(); this.heli.type = 'sawtooth'; this.heli.frequency.value = 22; this.heliG = ac.createGain(); this.heliG.gain.value = 0; this.heli.connect(this.heliG).connect(out); this.heli.start();
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
  shot() { this.noise(0.18, 0.35, 3500); }, smg() { this.noise(0.1, 0.28, 3000); }, shotgun() { this.noise(0.35, 0.5, 2200); },
  npcShot() { this.noise(0.15, 0.1, 2000); }, crash() { this.noise(0.4, 0.4, 900); }, step() { this.noise(0.07, 0.05, 500); },
  boom() { this.noise(1.2, 0.8, 500); }, taser() { this.tone(1800, 0.25, 0.1, 'square'); this.tone(2400, 0.2, 0.08, 'square', 0.05); },
  click() { this.tone(900, 0.04, 0.08, 'square'); }, reload() { this.tone(300, 0.08, 0.1, 'square'); this.tone(500, 0.08, 0.1, 'square', 0.45); },
  horn() { this.tone(330, 0.35, 0.12, 'square'); this.tone(415, 0.35, 0.1, 'square'); }, pop() { this.noise(0.25, 0.5, 1800); },
  cash() { this.tone(880, 0.12, 0.15, 'triangle'); this.tone(1320, 0.2, 0.15, 'triangle', 0.1); },
  update(o) {
    if (!this.ac) return; const t = this.ac.currentTime, set = (g, v) => g.gain.setTargetAtTime(v, t, 0.08);
    this.e1.frequency.setTargetAtTime(36 + o.rpm * 105, t, 0.05); this.e2.frequency.setTargetAtTime((36 + o.rpm * 105) * 1.503, t, 0.05);
    this.engF.frequency.setTargetAtTime(220 + o.thr * 900 + o.rpm * 700, t, 0.06); set(this.engG, o.inCar ? 0.025 + o.thr * 0.03 + o.rpm * 0.02 : 0);
    set(this.tireG, clamp(o.slip, 0, 1) * 0.1); set(this.windG, (o.inCar ? 0.06 : 0.02) * o.speedRatio); set(this.rainG, o.rain * 0.05); set(this.cityG, 0.02 * (1 - o.rain * 0.3));
    set(this.sirG, o.siren * 0.035); this.sir.frequency.value = 650 + 250 * Math.sin(o.t * 6);
    this.almG.gain.value = o.alarm ? 0.025 : 0; this.alm.frequency.value = Math.floor(o.t * 3) % 2 ? 880 : 620; this.heliG.gain.value = o.heli * 0.05;
  }
};

// ---------- skid marks ----------
const skid = { max: 700, i: 0, mesh: null };
function initSkids() {
  const mat = new THREE.MeshBasicMaterial({ color: 0x0b0b0b, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  skid.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 1.0).rotateX(-Math.PI / 2), mat, skid.max);
  const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let k = 0; k < skid.max; k++) skid.mesh.setMatrixAt(k, z);
  skid.mesh.frustumCulled = false; scene.add(skid.mesh);
}
const _sq = new THREE.Quaternion(), _sm = new THREE.Matrix4(), _sy = new THREE.Vector3(0, 1, 0), _s1 = new THREE.Vector3(1, 1, 1);
function addSkid(x, z, h) {
  if (!skid.mesh) initSkids();
  _sm.compose(new THREE.Vector3(x, 0.075, z), _sq.setFromAxisAngle(_sy, h), _s1); skid.mesh.setMatrixAt(skid.i, _sm); skid.i = (skid.i + 1) % skid.max; skid.mesh.instanceMatrix.needsUpdate = true;
}
let camShake = 0;

// ---------- input ----------
const keys = {}, pressed = {};
const mouse = { down: false, right: false, wheel: 0 };
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true; pressed[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; mouse.right = false; });
addEventListener('wheel', e => { mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ---------- geometry merging (keeps draw calls low) ----------
const vcMat = new THREE.MeshLambertMaterial({ vertexColors: true });
function bp(w, h, d, x, y, z, c) { return { g: new THREE.BoxGeometry(w, h, d), m: new THREE.Matrix4().makeTranslation(x, y, z), c }; }
function mergeParts(parts) {
  const pos = [], nor = [], col = [], c = new THREE.Color(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g, A = g.attributes.position, Nn = g.attributes.normal; nm.getNormalMatrix(p.m); c.setHex(p.c);
    for (let i = 0; i < A.count; i++) {
      v.fromBufferAttribute(A, i).applyMatrix4(p.m); pos.push(v.x, v.y, v.z);
      v.fromBufferAttribute(Nn, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

const carMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x555555 });
const _V3 = THREE.Vector3;
function tf(x, y, z, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) { return new THREE.Matrix4().compose(new _V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new _V3(sx, sy, sz)); }
const sph = (r, x, y, z, c, sx = 1, sy = 1, sz = 1, seg = 9) => ({ g: new THREE.SphereGeometry(r, seg, seg - 2), m: tf(x, y, z, 0, 0, sx, sy, sz), c });
const cyl = (rt, rb, h, x, y, z, c, sx = 1, sz = 1, seg = 9, rx = 0, rz = 0) => ({ g: new THREE.CylinderGeometry(rt, rb, h, seg), m: tf(x, y, z, rx, rz, sx, 1, sz), c });
const bxp = (w, h, d, x, y, z, c, rx = 0) => ({ g: new THREE.BoxGeometry(w, h, d), m: tf(x, y, z, rx), c });
const blobTex = (() => { const k = document.createElement('canvas'); k.width = k.height = 64; const g = k.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(k); })();
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function makeBlob(sx, sz) { const m = new THREE.Mesh(blobGeo, blobMat); m.scale.set(sx, 1, sz); m.position.y = 0.06; m.renderOrder = 1; return m; }
// global traffic signal cycle (22s): x green 0-9, yellow 9-11 | z green 11-20, yellow 20-22
function signalState(axis) {
  const t = (state.time || 0) % 22;
  if (axis === 'x') return t < 9 ? 'g' : t < 11 ? 'y' : 'r';
  return t < 11 ? 'r' : t < 20 ? 'g' : 'y';
}

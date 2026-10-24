'use strict';
/* ===== MAD CITY 3D — life layer: needs, services (every building has a job), home, garage, jobs, waypoint ===== */

const outlaw = () => state.team !== 'cop';
const life = {
  food: 85, energy: 90, stamina: 100, staminaLvl: 1, bank: 0, home: null, garage: [], outfit: null, mask: false, gold: 0, goldPrice: 2800,
  job: null, wp: null, exhausted: false, sprinting: false, casino: '', warned: {}, goldT: 0, owned: 0
};
const maxStamina = () => 100 + (life.staminaLvl - 1) * 15;
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const KIND_BASE_PRICE = { sedan: 900, taxi: 700, sport: 2200, super: 6000, muscle: 1500, suv: 1400, van: 1000, bus: 2500, truck: 1800, police: 500, ambulance: 600 };
const OUTFITS = [
  { n: 'كاجوال أزرق', shirt: 0x2a6bd6, pants: 0x2c3e50, hat: null, p: 80 }, { n: 'أسود رياضي', shirt: 0x1d1d1d, pants: 0x2a2a2a, hat: 0x222222, p: 100 },
  { n: 'أخضر كاجوال', shirt: 0x2aa65a, pants: 0x4a4030, hat: null, p: 90 }, { n: 'أحمر ستريت', shirt: 0xc0392b, pants: 0x1c1c24, hat: 0xc0392b, p: 120 },
  { n: 'بدلة رسمية', shirt: 0x24262e, pants: 0x1a1c22, hat: null, p: 250 }, { n: 'أبيض صيفي', shirt: 0xe8e8e0, pants: 0x9aa8b8, hat: 0xe8e8e0, p: 110 }
];
const FOODS = {
  restaurant: [['برجر', 12, 35, 8], ['بيتزا', 18, 45, 10], ['شاورما', 15, 40, 8], ['وجبة عائلية', 40, 80, 20], ['مشروب غازي', 4, 5, 10]],
  cafe: [['قهوة', 5, 2, 28], ['ساندويتش', 9, 25, 6], ['كيك', 7, 15, 4], ['عصير طازج', 6, 8, 12]],
  market: [['ماء', 2, 3, 2], ['وجبة خفيفة', 4, 18, 3], ['مشروب طاقة', 6, 0, 30], ['وجبة جاهزة', 14, 40, 0]]
};
const GUNS = [
  { name: 'مسدس + ذخيرة', price: 600, show: s => !s.weapons.pistol.own, act: s => { s.weapons.pistol.own = true; s.weapons.pistol.res += 36; } },
  { name: 'ذخيرة مسدس (+36)', price: 50, act: s => { s.weapons.pistol.res += 36; }, show: s => s.weapons.pistol.own },
  { name: 'رشاش SMG + ذخيرة', price: 2800, show: s => !s.weapons.smg.own, act: s => { s.weapons.smg.own = true; s.weapons.smg.res += 60; } },
  { name: 'ذخيرة رشاش (+90)', price: 200, show: s => s.weapons.smg.own, act: s => { s.weapons.smg.res += 90; } },
  { name: 'شوتغن + خرطوش', price: 2000, show: s => !s.weapons.shotgun.own, act: s => { s.weapons.shotgun.own = true; s.weapons.shotgun.res += 16; } },
  { name: 'خرطوش شوتغن (+16)', price: 160, show: s => s.weapons.shotgun.own, act: s => { s.weapons.shotgun.res += 16; } },
  { name: 'سترة واقية', price: 850, act: s => { s.armor = 100; } }
];

// ---------- persistence ----------
function lifeSave() { return { food: life.food, energy: life.energy, staminaLvl: life.staminaLvl, bank: life.bank, home: life.home, garage: life.garage, outfit: life.outfit, mask: life.mask, gold: life.gold, tod: env.time }; }
function lifeLoad(o) {
  Object.assign(life, { food: 85, energy: 90, stamina: 100, staminaLvl: 1, bank: 0, home: null, garage: [], outfit: null, mask: false, gold: 0, job: null, wp: null });
  if (o) { for (const k of ['food', 'energy', 'staminaLvl', 'bank', 'home', 'garage', 'outfit', 'mask', 'gold']) if (o[k] !== undefined) life[k] = o[k]; if (o.tod !== undefined) env.time = o.tod; }
  life.stamina = maxStamina();
}

// ---------- needs ----------
function footSpeed() {
  const want = keys.ShiftLeft || keys.ShiftRight;
  if (life.stamina <= 0) life.exhausted = true; else if (life.stamina > 20) life.exhausted = false;
  life.sprinting = !!want && !life.exhausted; let s = life.sprinting ? 9.4 : 5.4; if (life.energy <= 0) s *= 0.7; return s;
}
function updateNeeds(dt) {
  if (!state.started || state.paused || state.ui || state.jail || state.dead) return;
  const run = life.sprinting && !P.car && P.speed > 6;
  life.food = Math.max(0, life.food - dt * 0.055); life.energy = Math.max(0, life.energy - dt * (0.04 + (run ? 0.05 : 0)));
  if (run) life.stamina = Math.max(0, life.stamina - dt * (24 - life.staminaLvl * 2)); else life.stamina = Math.min(maxStamina(), life.stamina + dt * (life.food > 0 ? 11 + life.staminaLvl * 2 : 2));
  if (life.food <= 0 && P.hp > 8) P.hp -= dt * 1.4;
  const w = (k, cond, msg) => { if (cond && !life.warned[k]) { life.warned[k] = true; toast(msg, 'rgba(150,100,0,.9)', 3500); } else if (!cond) life.warned[k] = false; };
  w('food', life.food < 20, '🍔 أنت جائع! اشترِ أكلاً من مطعم أو سوبرماركت'); w('energy', life.energy < 15, '😴 أنت متعب! نم في فندق أو شقتك أو اجلس على مقعد');
  life.goldT -= dt; if (life.goldT <= 0) { life.goldT = 20; life.goldPrice = Math.round(clamp(life.goldPrice * (1 + rnd(-0.06, 0.065)), 1800, 4200)); }
}

// ---------- generic menu modal ----------
let menuBuild = null;
function openMenu(build) { menuBuild = build; state.ui = 'shop'; document.exitPointerLock(); renderMenu(); $('shop').classList.remove('hidden'); }
function closeShop() { $('shop').classList.add('hidden'); state.ui = null; menuBuild = null; if (state.started) tryLock(); }
function renderMenu() {
  if (!menuBuild) return; const m = menuBuild(); $('shoptitle').textContent = m.title; $('shopcash').textContent = fmt(state.cash) + (life.bank ? '  ·  البنك ' + fmt(life.bank) : '');
  $('shopsub').textContent = m.sub || ''; const list = $('shoplist'); list.innerHTML = '';
  for (const r of m.rows) {
    if (r.h) { const h = document.createElement('div'); h.className = 'shophead'; h.textContent = r.h; list.appendChild(h); continue; }
    const row = document.createElement('div'); row.className = 'shoprow';
    const label = document.createElement('span'); label.innerHTML = `${r.t}${r.d ? `<small>${r.d}</small>` : ''}`; row.appendChild(label);
    const b = document.createElement('button'); b.className = 'btn small'; b.textContent = r.p !== undefined ? (r.p === 0 ? 'مجاني' : fmt(r.p)) : (r.b || 'تنفيذ');
    if (r.off || (r.p !== undefined && state.cash < r.p)) b.disabled = true;
    b.onclick = () => { if (r.p) { if (state.cash < r.p) return; state.cash -= r.p; sfx.cash(); } const keep = r.act(); saveGame(); if (keep === 'close') closeShop(); else renderMenu(); };
    row.appendChild(b); list.appendChild(row);
  }
}
$('shopclose').onclick = closeShop;

// ---------- shops that existed before (black market / armory / dealership) ----------
const SHOPS = {
  black: { title: '🕶 السوق السوداء', items: [
    { name: 'قفل بيك — يسرّع السرقة 30%', p: 300, act: () => { state.items.lockpick++; } }, { name: 'مثقاب خزائن (3 شحنات) — يسرّع السرقة 50%', p: 1500, act: () => { state.items.drill += 3; } },
    { name: 'قاطع أسلاك (للسجن)', p: 700, act: () => { state.items.cutters++; } }, { name: 'قناع أسود — الشهود لا يبلّغون عنك', p: 400, act: () => { life.mask = true; buildPlayer(state.team, state.uniform); toast('🎭 ارتديت القناع'); } },
    { name: 'علبة إسعاف (Q)', p: 250, act: () => { state.items.medkit++; } }, { name: 'سترة واقية', p: 900, act: () => { state.armor = 100; } },
    { name: 'رشاش SMG + ذخيرة', p: 2500, act: () => { state.weapons.smg.own = true; state.weapons.smg.res += 60; } }, { name: 'شوتغن + ذخيرة', p: 1800, act: () => { state.weapons.shotgun.own = true; state.weapons.shotgun.res += 16; } }] },
  armory: { title: '🛡 مخزن الشرطة', items: [
    { name: 'علبة إسعاف (Q)', p: 120, act: () => { state.items.medkit++; } }, { name: 'سترة واقية', p: 400, act: () => { state.armor = 100; } },
    { name: 'ذخيرة مسدس (+36)', p: 30, act: () => { state.weapons.pistol.res += 36; } }, { name: 'رشاش SMG + ذخيرة', p: 1250, act: () => { state.weapons.smg.own = true; state.weapons.smg.res += 60; } },
    { name: 'شوتغن + ذخيرة', p: 900, act: () => { state.weapons.shotgun.own = true; state.weapons.shotgun.res += 16; } }] }
};
const DEALER_CARS = [['sedan', 'سيدان عائلية — 150 km/h', 1800], ['suv', 'دفع رباعي SUV — 165 km/h', 3200], ['van', 'فان شحن — 145 km/h', 2800], ['muscle', 'ماسل كار — 210 km/h', 5200], ['sport', 'سيارة رياضية — 240 km/h', 9000], ['super', 'سوبر كار — 315 km/h', 24000]];

// ---------- services ----------
function nearestService(maxD = 4.4) {
  let best = null, bd = maxD;
  for (const s of services) { const dx = s.x - P.x; if (dx > maxD || dx < -maxD) continue; const d = Math.hypot(dx, s.z - P.z); if (d < bd) { bd = d; best = s; } }
  return best;
}
function nearestCarTo(x, z, maxD) { let b = null, bd = maxD; for (const c of cars) { if (c.wreck) continue; const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; b = c; } } return b; }
function sleepNow(cost, where) {
  state.hold = null; closeShop(); flash('💤 جاري النوم...', '#9fd0ff', 1800);
  setTimeout(() => { env.time = 7; life.energy = 100; life.food = Math.max(25, life.food - 18); P.hp = 100; life.stamina = maxStamina(); saveGame(); toast(`🌅 صباح الخير! نمت في ${where} — تم الحفظ`, 'rgba(10,110,50,.9)', 4000); }, 1200);
}
function buyHome(sv, price, label) {
  if (life.home) { const refund = Math.round(life.home.price * 0.7); state.cash += refund; toast(`🏠 بعت منزلك القديم بـ ${fmt(refund)}`); }
  life.home = { id: sv.id || (sv.id = 'h' + Math.round(sv.x) + '_' + Math.round(sv.z)), x: sv.x, z: sv.z, nx: sv.nx, nz: sv.nz, name: label, price }; sfx.cash(); toast(`🏠 مبروك! أصبح ${label} منزلك — تظهر هنا بعد الموت وتستطيع النوم والحفظ`, 'rgba(10,110,50,.9)', 5000);
}
function outfitRows(free) { return OUTFITS.map(o => ({ t: '👕 ' + o.n, d: free ? 'إرتداء' : 'تغيير الملابس', p: free ? undefined : o.p, b: 'ارتدِ', act: () => { life.outfit = o; buildPlayer(state.team, state.uniform); toast('👕 ' + o.n); } })); }
function foodRows(kind) { return (FOODS[kind] || FOODS.market).map(([n, p, f, e]) => ({ t: '🍽 ' + n, d: `جوع +${f}  ·  طاقة +${e}`, p, act: () => { life.food = Math.min(100, life.food + f); life.energy = Math.min(100, life.energy + e); } })); }
function gunRows() { return GUNS.filter(g => !g.show || g.show(state)).map(g => ({ t: '🔫 ' + g.name, p: state.team === 'cop' ? Math.round(g.price / 2) : g.price, act: () => g.act(state) })); }
function garageRows(sv, repair) {
  const rows = [];
  if (repair) { const c = nearestCarTo(sv.x, sv.z, 16); if (c) { const cost = Math.ceil((c.maxHp - c.hp) * 2.5); rows.push({ t: '🔧 إصلاح السيارة (' + c.kind + ')', d: `${Math.round(c.hp / c.maxHp * 100)}% — إصلاح كامل`, p: cost, off: cost === 0, act: () => { c.hp = c.maxHp; c.flat = false; c.wreck = false; } }); rows.push({ t: '⛽ تعبئة الوقود مع الصيانة', p: Math.ceil((1 - c.fuel) * 90), off: c.fuel > 0.97, act: () => { c.fuel = 1; } }); } else rows.push({ t: 'أحضر سيارتك قرب باب الورشة للإصلاح', off: true, b: '—', act: () => { } }); }
  const cur = nearestCarTo(sv.x, sv.z, 16);
  if (cur && cur.owned && life.garage.length < 8) rows.push({ t: '🅿 تخزين السيارة في مرآبك', d: 'تُحفظ في ملفك', p: 0, act: () => { life.garage.push({ kind: cur.kind, color: cur.ownedColor }); removeCar(cur); if (P.car === cur) { exitCar(); } toast('تم التخزين'); } });
  life.garage.forEach((g, i) => rows.push({ t: '🚘 استخراج: ' + g.kind, d: 'سيارتك المخزّنة', p: 0, act: () => { const c = newCar(g.kind, sv.x + sv.nx * 7 + sv.nz * 2, sv.z + sv.nz * 7 + sv.nx * 2, Math.atan2(sv.nx, sv.nz), 'idle', g.color); c.owned = true; c.ownedColor = g.color; c.fuel = 1; life.garage.splice(i, 1); return 'close'; } }));
  return rows;
}
function bankRows() {
  return [{ t: '🏧 الرصيد في الحساب: ' + fmt(life.bank), d: 'أموال البنك محمية من الغرامات والموت', off: true, b: '—', act: () => { } },
    { t: 'إيداع كل ما معك', off: state.cash <= 0, b: 'إيداع', act: () => { life.bank += Math.floor(state.cash); state.cash -= Math.floor(state.cash); sfx.cash(); } },
    { t: 'إيداع $1,000', off: state.cash < 1000, b: 'إيداع', act: () => { life.bank += 1000; state.cash -= 1000; sfx.cash(); } },
    { t: 'سحب $1,000', off: life.bank < 1000, b: 'سحب', act: () => { life.bank -= 1000; state.cash += 1000; sfx.cash(); } },
    { t: 'سحب $5,000', off: life.bank < 5000, b: 'سحب', act: () => { life.bank -= 5000; state.cash += 5000; sfx.cash(); } },
    { t: 'سحب كل الرصيد', off: life.bank <= 0, b: 'سحب', act: () => { state.cash += life.bank; life.bank = 0; sfx.cash(); } }];
}
function casinoRows() {
  const rows = [{ h: life.casino || 'جرّب حظك — اللعب يعتمد على الحظ فقط' }];
  const play = (bet, kind) => () => {
    if (kind === 'slot') { const r = Math.random(); const mult = r < 0.678 ? 0 : r < 0.898 ? 2 : r < 0.978 ? 3 : 10; const sy = ['🍒', '🍋', '🔔', '💎', '7️⃣']; const s = [pick(sy), pick(sy), pick(sy)].join(' ');
      state.cash += bet * mult; life.casino = mult ? `${s} — ربحت ${fmt(bet * mult)} (x${mult})` : `${s} — خسرت ${fmt(bet)}`; if (mult) sfx.cash(); else sfx.click(); }
    else { const win = Math.random() < 18 / 37; const colr = win === (kind === 'red') ? '🔴' : '⚫'; if (win) { state.cash += bet * 2; life.casino = `${colr} فزت ${fmt(bet * 2)}`; sfx.cash(); } else { life.casino = `${colr} خسرت ${fmt(bet)}`; sfx.click(); } }
    addXp(2);
  };
  for (const bet of [100, 500, 2000]) rows.push({ t: `🎰 سلوت ${fmt(bet)}`, d: 'جوائز x2 / x3 / x10', p: bet, b: 'لف', act: play(bet, 'slot') });
  for (const bet of [100, 500, 2000]) rows.push({ t: `🎡 روليت أحمر ${fmt(bet)}`, d: 'ربح x2', p: bet, b: 'أحمر', act: play(bet, 'red') });
  return rows;
}
function jobRows(sv, only) {
  const rows = []; if (life.job) rows.push({ t: '🛑 إنهاء الوظيفة الحالية: ' + life.job.name, b: 'إنهاء', act: () => { endJob(true); } });
  const add = (type, t, d) => { if (!only || only.includes(type)) rows.push({ t, d, b: 'ابدأ', off: !!life.job, act: () => { startJob(type, sv); return 'close'; } }); };
  add('taxi', '🚕 سائق تاكسي', 'اجلب الركاب من النقاط الزرقاء ووصّلهم — الأجرة حسب المسافة'); add('delivery', '🍕 توصيل طلبات', 'وصّل الطلبات لعناوين المنازل بسرعة — بقشيش للسرعة');
  add('cargo', '🚛 شاحنة بضائع', 'انقل البضاعة إلى المتاجر الكبرى — أجر مرتفع، لا تصدم الشاحنة'); return rows;
}
function goldRows() {
  return [{ h: `سعر سبيكة الذهب الآن: ${fmt(life.goldPrice)} (يتغير كل 20 ثانية)  ·  تملك ${life.gold} سبيكة` },
    { t: '🥇 شراء سبيكة ذهب', p: life.goldPrice, act: () => { life.gold++; } },
    { t: '💰 بيع كل السبائك', d: life.gold ? `${life.gold} × ${fmt(life.goldPrice)}` : 'لا تملك سبائك', off: life.gold === 0, b: 'بيع', act: () => { state.cash += life.gold * life.goldPrice; sfx.cash(); toast(`💰 بعت ${life.gold} سبيكة`); life.gold = 0; } }];
}
function homeRows() {
  return [{ t: '🛏 النوم حتى الصباح', d: 'يستعيد الطاقة والصحة ويحفظ التقدم', p: 0, b: 'نم', act: () => { sleepNow(0, 'منزلك'); return 'close'; } },
    { t: '💾 حفظ اللعبة', p: 0, b: 'حفظ', act: () => { saveGame(); toast('💾 تم الحفظ'); } }, { h: 'خزانة الملابس (مجاناً)' }, ...outfitRows(true),
    { h: 'مرآب المنزل' }, ...garageRows(life.home ? { x: life.home.x, z: life.home.z, nx: life.home.nx || 0, nz: life.home.nz || 1 } : { x: P.x, z: P.z, nx: 0, nz: 1 }, false),
    { h: '' }, { t: '🏷 بيع المنزل', d: 'تسترد 70% من ثمنه', b: 'بيع', act: () => { state.cash += Math.round(life.home.price * 0.7); life.home = null; toast('تم بيع المنزل'); return 'close'; } }];
}
function serviceMenu(sv) {
  const k = sv.kind, T = SVC[k] || {}, title = `${T.ic || ''} ${sv.name}`; const rows = [];
  const add = (...r) => rows.push(...r);
  switch (k) {
    case 'restaurant': case 'cafe': add(...foodRows(k)); break;
    case 'market': add({ h: 'المنتجات' }, ...foodRows('market')); break;
    case 'gas': { const c = nearestCarTo(sv.x, sv.z, 18);
      add({ h: c ? `سيارتك: وقود ${Math.round(c.fuel * 100)}%` : 'ادخل بسيارتك قرب المحطة لتعبئتها' });
      if (c) { add({ t: '⛽ تعبئة +25%', p: 18, off: c.fuel > 0.97, act: () => { c.fuel = Math.min(1, c.fuel + 0.25); } }, { t: '⛽ تعبئة كاملة', p: Math.ceil((1 - c.fuel) * 70), off: c.fuel > 0.97, act: () => { c.fuel = 1; } }); }
      add({ h: 'متجر المحطة' }, ...foodRows('market')); break; }
    case 'pharmacy': add({ t: '💊 علبة إسعاف', d: 'تُستخدم بزر Q', p: 60, act: () => { state.items.medkit++; } }, { t: '💉 مسكّن', d: 'يعالج 25 فوراً', p: 25, act: () => { P.hp = Math.min(100, P.hp + 25); } }, { t: '🧪 فيتامينات', d: 'طاقة +15 وتحمّل كامل', p: 40, act: () => { life.energy = Math.min(100, life.energy + 15); life.stamina = maxStamina(); } }); break;
    case 'clothing': add({ h: 'الملابس' }, ...outfitRows(false)); if (outlaw()) add({ h: 'أكسسوارات' }, { t: '🎭 قناع أسود', d: 'الشهود لا يعرفون هويتك فلا يبلّغون', p: 400, off: life.mask, act: () => { life.mask = true; buildPlayer(state.team, state.uniform); } }, { t: '🙂 خلع القناع', p: 0, off: !life.mask, b: 'اخلع', act: () => { life.mask = false; buildPlayer(state.team, state.uniform); } }); break;
    case 'gunstore': add(...gunRows()); break;
    case 'gym': add({ h: `مستوى التحمّل: ${life.staminaLvl}/6` }, { t: '🏋️ تدريب — رفع التحمّل', d: 'ركض أطول وتعافٍ أسرع', p: 300 * life.staminaLvl, off: life.staminaLvl >= 6, b: 'تدرّب', act: () => { life.staminaLvl++; life.stamina = maxStamina(); toast('💪 ارتفع تحمّلك!'); } }, { t: '🥤 مشروب بروتين', p: 15, act: () => { life.energy = Math.min(100, life.energy + 12); life.food = Math.min(100, life.food + 10); } }); break;
    case 'hotel': add({ t: '🛏 غرفة لليلة', d: 'نوم حتى 7 صباحاً + حفظ', p: 60, b: 'احجز', act: () => { sleepNow(60, 'الفندق'); return 'close'; } }); break;
    case 'apartments': {
      const price = Math.round((4000 + (sv.h || 25) * 160) / 100) * 100;
      if (life.home && life.home.id === (sv.id || '')) add(...homeRows());
      else add({ t: '🏢 شراء شقة هنا', d: `منزلك الجديد — ${fmt(price)}`, p: price, b: 'اشترِ', act: () => { buyHome(sv, price, sv.name); return 'close'; } }, { t: '🛏 استئجار غرفة لليلة', p: 45, b: 'استأجر', act: () => { sleepNow(45, sv.name); return 'close'; } });
      break; }
    case 'house': if (life.home && life.home.id === sv.id) add(...homeRows()); else add({ t: '🏠 شراء هذا المنزل', d: fmt(sv.price), p: sv.price, b: 'اشترِ', act: () => { buyHome(sv, sv.price, 'منزل في الحي'); return 'close'; } }); break;
    case 'office': add(...jobRows(sv)); break;
    case 'warehouse': case 'factory': add({ h: 'مركز التشغيل' }, ...jobRows(sv, ['cargo'])); break;
    case 'bank': add(...bankRows()); break;
    case 'jewelry': add(...goldRows()); break;
    case 'casino': add(...casinoRows()); break;
    case 'garage': add(...garageRows(sv, true)); break;
    case 'parking': add(...garageRows(sv, false)); break;
    case 'scrap': { const c = nearestCarTo(sv.x, sv.z, 18);
      if (c && c !== P.car) { const price = Math.round(KIND_BASE_PRICE[c.kind] * (0.25 + 0.5 * c.hp / c.maxHp)); add({ t: `♻️ بيع السيارة (${c.kind})`, d: `حالتها ${Math.round(c.hp / c.maxHp * 100)}%`, b: 'بيع', act: () => { state.cash += price; sfx.cash(); toast(`💵 +${fmt(price)}`); if (c.owned) life.owned--; removeCar(c); } }); add({ h: `عرض السعر: ${fmt(price)}` }); }
      else add({ t: 'أحضر سيارة (خارج السيارة) قرب باب المشتل لبيعها', off: true, b: '—', act: () => { } }); break; }
    case 'hospital': add({ t: '🏥 علاج كامل', d: 'صحة 100%', p: 100, off: P.hp >= 100, b: 'عالج', act: () => { P.hp = 100; } }, { t: '💧 محلول وريدي', d: 'طاقة +50 وجوع +20', p: 80, act: () => { life.energy = Math.min(100, life.energy + 50); life.food = Math.min(100, life.food + 20); } }); break;
    case 'police':
      if (state.team === 'cop') { openArmory = true; add(...SHOPS.armory.items.map(i => ({ t: i.name, p: Math.round(i.p), act: i.act }))); }
      else { add({ h: state.wanted > 0 ? `مستوى المطلوب الحالي: ${state.wanted}★` : 'لا توجد بلاغات ضدك' });
        add({ t: '🏳 تسليم نفسي للشرطة', d: 'سجن فوري بحكم أخف', b: 'سلّم', off: state.wanted === 0, act: () => { closeShop(); sendToJail(25 + state.wanted * 15, '🏳 سلّمت نفسك'); } },
          { t: '💶 دفع غرامة', d: 'تزيل المطلوب ★1-2 فقط', p: state.wanted * 1500, off: state.wanted === 0 || state.wanted > 2, act: () => { state.wanted = 0; clearPolice(); toast('✔ دُفعت الغرامة'); } }); }
      break;
    case 'hideout': if (state.team === 'crim') add(...SHOPS.black.items.map(i => ({ t: i.name, p: i.p, act: i.act }))); else add({ t: 'مكان مشبوه... لا يدخله إلا أصحابه', off: true, b: '—', act: () => { } }); break;
    case 'dealer': add(...DEALER_CARS.map(([kd, nm, pr]) => ({ t: '🚗 ' + nm, p: pr, b: 'اشترِ', act: () => { buyCar(kd, sv, pr); return 'close'; } }))); break;
    case 'mall': add({ h: 'الملابس' }, ...outfitRows(false).slice(0, 4), { h: 'مطاعم المول' }, ...foodRows('restaurant').slice(0, 3), { h: 'صيدلية المول' }, { t: '💊 علبة إسعاف', p: 65, act: () => { state.items.medkit++; } }); break;
    default: add({ t: 'لا توجد خدمات', off: true, b: '—', act: () => { } });
  }
  return { title, sub: T.ar ? `${T.ar}` : '', rows };
}
let openArmory = false;
function openService(sv) { openMenu(() => serviceMenu(sv)); }
function buyCar(kind, sv, price) {
  const col = pick([0xd62828, 0x1d70d6, 0xf4a300, 0x111111, 0xecf0f1, 0x2aa65a]), c = newCar(kind, sv.x + 9, sv.z + 4, Math.PI / 2, 'idle', col);
  c.owned = true; c.ownedColor = col; c.fuel = 1; toast('🏎 تم الشراء! سيارتك جاهزة', 'rgba(10,110,50,.9)'); enterCar(c);
}
function openShop(kind) { openMenu(() => ({ title: SHOPS[kind].title, rows: SHOPS[kind].items.map(i => ({ t: i.name, p: i.p, act: i.act })) })); }

// ---------- jobs ----------
const jobMarker = (() => { const m = makeMarker(0x4dc3ff); m.visible = false; return m; })(), wpMarker = (() => { const m = makeMarker(0x4dff9a); m.visible = false; return m; })();
function randomStreetPoint(minD, maxD) {
  for (let t = 0; t < 40; t++) {
    const i = rint(0, N - 1), j = rint(0, N - 1), [x, z] = ringPos(i, j, rnd(0, RING * 8)), d = Math.hypot(x - P.x, z - P.z);
    if (d >= minD && d <= maxD) return { x, z };
  }
  const [x, z] = ringPos(rint(0, N - 1), rint(0, N - 1), 0); return { x, z };
}
function startJob(type, sv) {
  const names = { taxi: 'سائق تاكسي', delivery: 'توصيل طلبات', cargo: 'شاحنة بضائع' };
  const kind = { taxi: 'taxi', delivery: 'van', cargo: 'truck' }[type], col = type === 'delivery' ? 0xff7a1a : undefined;
  const c = newCar(kind, sv.x + sv.nx * 7 + sv.nz * 3, sv.z + sv.nz * 7 + sv.nx * 3, Math.atan2(sv.nx, sv.nz), 'idle', col); c.fuel = 1; c.jobCar = true; enterCar(c);
  life.job = { type, name: names[type], car: c, stage: type === 'taxi' ? 'pickup' : 'dropoff', earned: 0, n: 0, hp0: c.hp };
  nextJobTarget(); toast(`💼 بدأت العمل: ${names[type]} — اتبع الإشارة على الخريطة`, 'rgba(10,90,140,.9)', 4500);
}
function nextJobTarget() {
  const j = life.job; if (!j) return; const t = j.type;
  if (t === 'taxi') { j.stage = 'pickup'; Object.assign(j, randomStreetPoint(120, 420)); j.t = 0; j.wait = 0; }
  else if (t === 'delivery') { Object.assign(j, randomStreetPoint(150, 520)); j.dist = Math.hypot(j.x - P.x, j.z - P.z); j.t = j.dist / 7 + 30; j.tmax = j.t; j.stage = 'dropoff'; }
  else { const mk = services.filter(s => (s.kind === 'market' || s.kind === 'mall') && Math.hypot(s.x - P.x, s.z - P.z) > 400 && Math.hypot(s.x - P.x, s.z - P.z) < 1100); const s = mk.length ? pick(mk) : { x: 0, z: 0 }; j.x = s.x; j.z = s.z; j.dist = Math.hypot(j.x - P.x, j.z - P.z); j.t = j.dist / 10 + 45; j.tmax = j.t; j.stage = 'dropoff'; }
  j.hp0 = j.car ? j.car.hp : 100; jobMarker.position.set(j.x, 0, j.z); jobMarker.visible = true;
}
function endJob(quit) { const j = life.job; if (!j) return; life.job = null; jobMarker.visible = false; if (j.car && j.car.jobCar) j.car.jobCar = false; toast(quit ? `🛑 انتهت الوظيفة — كسبت ${fmt(j.earned)}` : '', undefined, 3500); }
function updateJob(dt) {
  const j = life.job; if (!j || state.dead || state.jail) return; const d = Math.hypot(j.x - P.x, j.z - P.z), speed = P.car ? Math.abs(P.car.speed) : P.speed;
  jobMarker.userData.ring.scale.setScalar(1 + Math.sin(state.time * 5) * 0.08);
  if (j.stage === 'dropoff') { j.t -= dt; if (j.t <= 0) { toast('⌛ انتهى الوقت! لم تُدفع الأجرة', 'rgba(150,40,20,.9)'); nextJobTarget(); return; } }
  if (j.stage === 'pickup') {
    if (d < 8 && P.car && speed < 4) { j.wait += dt; if (j.wait > 1.4) { j.stage = 'dropoff'; const p2 = randomStreetPoint(250, 800); j.x = p2.x; j.z = p2.z; j.dist = Math.hypot(j.x - P.x, j.z - P.z); j.t = j.dist / 9 + 25; j.tmax = j.t; j.hp0 = P.car.hp; jobMarker.position.set(j.x, 0, j.z); sfx.click(); toast('🧍 صعد الراكب — وصّله إلى الوجهة', 'rgba(10,90,140,.9)'); } } else j.wait = 0;
    return;
  }
  const near = d < (j.type === 'cargo' ? 11 : 8) && (j.type === 'delivery' ? true : P.car && speed < 6);
  if (near) {
    const car = P.car, dmg = car && j.hp0 ? Math.max(0, j.hp0 - car.hp) : 0, mult = Math.max(0.4, 1 - dmg / (car ? car.maxHp * 0.7 : 100)), tip = clamp(j.t / j.tmax, 0, 1);
    const base = j.type === 'taxi' ? 60 + j.dist * 0.24 : j.type === 'delivery' ? 40 + j.dist * 0.2 : 150 + j.dist * 0.34, pay = Math.round(base * mult * (1 + tip * 0.4));
    state.cash += pay; j.earned += pay; j.n++; addXp(25 + j.n * 3); sfx.cash(); toast(`💵 ${fmt(pay)}${tip > 0.5 ? ' (بقشيش!)' : ''}${dmg > 5 ? ' — خصم للأضرار' : ''}`, 'rgba(10,110,50,.9)', 3200); saveGame(); nextJobTarget();
  }
}

// ---------- waypoint ----------
function setWaypoint(x, z) { life.wp = { x, z }; wpMarker.position.set(x, 0, z); wpMarker.visible = true; toast('📍 تم تحديد الوجهة على الخريطة', undefined, 1800); }
function clearWaypoint() { life.wp = null; wpMarker.visible = false; }
function updateWaypoint(dt) { if (life.wp && Math.hypot(life.wp.x - P.x, life.wp.z - P.z) < 12) { toast('✅ وصلت إلى وجهتك'); clearWaypoint(); } }

// ---------- misc life helpers ----------
function benchNear() { if (!window.benchSpots || P.car) return null; for (const b of window.benchSpots) if (Math.abs(b.x - P.x) < 2.2 && Math.abs(b.z - P.z) < 2.2) return b; return null; }
function spawnPointFor(team) {
  if (team === 'cop') { const s = specials.police; return { x: s.x, z: s.doorZ + 10, carKind: 'police' }; }
  if (life.home) return { x: life.home.x + (life.home.nx || 0) * 3, z: life.home.z + (life.home.nz || 1) * 3, carKind: null };
  if (team === 'crim') { const s = specials.hideout; return { x: s.x, z: s.doorZ + 10, carKind: 'sedan' }; }
  const s = specials.dealer; return { x: s.x, z: s.doorZ + 10, carKind: 'sedan' };
}

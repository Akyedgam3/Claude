# زياد سنتر — موقع مطبعة + نظام إدارة ومحاسبة

React + Vite + Tailwind + Framer Motion + Firebase (Auth/Firestore/Hosting — الخطة المجانية) + Cloudflare Worker (بوت تلغرام).

## المزايا
- عربي/إنكليزي (زر تبديل + RTL/LTR) وعملة ل.س/$ (سعر الصرف من الإعدادات).
- كتالوج مع خيارات وسعر لحظي وخصم كميات وعروض فلاش بعدّاد.
- تسجيل بـ Google والإيميل.
- دفع شام كاش: QR (يرفعه المدير) + رفع الإيصال → بوت تلغرام بزرّي ✅ تأكيد / ❌ رفض → تُحدَّث حالة الزبون فوراً.
- تتبع الطلب للزبون (استلام ← تصميم ← طباعة ← تغليف ← توصيل ← مكتمل).
- لوحة إدارة بأدوار (admin/designer/press/packing/accountant): الطلبات والمراحل، المحاسبة (إيرادات تلقائية عند تأكيد الدفع + مصاريف + CSV)، المنتجات، الإعدادات والفريق.

## الإعداد
1. **Firebase**: أنشئ مشروعاً → فعّل Authentication (Google + Email/Password) و Firestore → انسخ الـ web config إلى `.env` (انظر `.env.example`).
2. `npm i && npm run build && npx firebase deploy --only hosting,firestore:rules`
3. **أول مدير**: افتح `https://موقعك/setup` وأنت مسجّل دخول واضغط «اجعلني المدير» — تُحمَّل المنتجات الافتراضية أيضاً وتُقفل الصفحة بعدها. باقي الفريق تغيّر أدوارهم من الإعدادات.
4. **بوت تلغرام**: أنشئ بوتاً من @BotFather، وأرسل له `/start` من حسابك، واعرف chat id (مثلاً @userinfobot).
5. **Worker** (مجلد `worker/`): عدّل `wrangler.toml`، ثم:
   ```bash
   cd worker
   npx wrangler secret put TG_BOT_TOKEN
   npx wrangler secret put TG_WEBHOOK_SECRET   # أي نص عشوائي
   npx wrangler secret put SA_JSON             # ملف Service Account كامل (Firebase → Project settings → Service accounts)
   npx wrangler deploy
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://<worker>.workers.dev/tg" -d "secret_token=<TG_WEBHOOK_SECRET>"
   ```
   ضع رابط الـ Worker في `VITE_WORKER_URL` وأعد البناء والنشر.
6. من لوحة الإدارة → الإعدادات: ارفع صورة QR شام كاش، وحدد سعر الصرف. ومن المنتجات اضغط Seed لتحميل المنتجات الافتراضية.

## ملاحظات
- Firebase Storage غير مستخدم (يتطلب خطة مدفوعة); الإيصالات وملفات التصميم تُحفظ في تلغرام، وصورة QR تُضغط وتُخزَّن في Firestore.
- تغيير حالة الدفع يتم فقط عبر الـ Worker (أو المدير يدوياً للدفع النقدي)، والزبون لا يستطيع تعديله بسبب قواعد Firestore.

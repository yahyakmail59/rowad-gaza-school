/* ============================================================
 * Service Worker — يجعل نظام المدرسة يعمل فعلياً بلا إنترنت.
 * كان مفقوداً: البيانات في IndexedDB محلية أصلاً، لكن ملفات
 * التطبيق نفسها كانت تُطلب من الشبكة، ففتح الصفحة بلا اتصال
 * كان يعطي صفحة بيضاء رغم أن كل البيانات موجودة على الجهاز.
 *
 * عند تعديل أي ملف: ارفع رقم CACHE_VERSION لتصل النسخة الجديدة.
 * ============================================================ */

const CACHE_VERSION = 'rowad-v1';

const SHELL = [
  './',
  './index.html',
  './assets/styles.css',
  './src/app.js',
  './manifest.webmanifest',
  './assets/fonts/amiri/amiri-ar-400.woff2',
  './assets/fonts/amiri/amiri-ar-700.woff2',
  './assets/images/ruwad-gaza-school-logo.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll يفشل كلياً لو سقط ملف واحد — نضيف كلاً على حدة ليبقى الباقي
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const NET_TIMEOUT_MS = 4000;

/** الشبكة أولاً مع مهلة، ثم الكاش. يضمن وصول التحديثات فوراً. */
async function networkFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NET_TIMEOUT_MS)),
    ]);
    if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw new Error('offline');
  }
}

/** الكاش أولاً — للخطوط والصور فقط، فهي لا تتغير. */
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (/\.(woff2|jpg|png|svg|ico)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
    return;
  }

  // كود التطبيق وصفحاته: الشبكة أولاً، وإلا بقي الجهاز على نسخة قديمة بعد كل نشر.
  e.respondWith(networkFirst(req));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/**
 * طبقة المزامنة — تحويل IndexedDB من مصدر الحقيقة إلى ذاكرة مؤقتة.
 *
 * قبل هذه الطبقة كانت المدرسة تعيش على جهاز واحد: كل شيء في متصفح واحد،
 * ولا وجود لها على جهاز آخر. الآن D1 هي مصدر الحقيقة، والمتصفح يحتفظ بنسخة
 * كاملة ليواصل العمل دون إنترنت ثم يزامن عند العودة.
 *
 * حالة المزامنة تعيش في قاعدة مستقلة (`AtharSchoolSync`) لا داخل قاعدة
 * التطبيق: بذلك لا يتغيّر مخطط بيانات المدرسة، ولا يدخل صندوق الصادر في
 * النسخ الاحتياطي ولا في إعادة الضبط.
 */

const SYNC_DB_NAME = 'AtharSchoolSync';
const SYNC_DB_VERSION = 1;
const TOKEN_KEY = 'athar_school_token';
const SCHOOL_KEY = 'athar_school_id';
const PUSH_BATCH = 200;
const AUTO_SYNC_MS = 45_000;

/** يُزامَن كل ما عدا هذين: الحسابات يملكها الخادم، والتدقيق المحلي محلي. */
const NON_SYNCED_STORES = new Set(['users', 'auditLogs']);

const request = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const txDone = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onabort = () => reject(tx.error);
  tx.onerror = () => reject(tx.error);
});

let syncDb = null;

async function openSyncDb() {
  if (syncDb) return syncDb;
  const req = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VERSION);
  req.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('outbox')) {
      db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('meta')) {
      db.createObjectStore('meta', { keyPath: 'key' });
    }
  };
  syncDb = await request(req);
  return syncDb;
}

async function metaGet(key, fallback = null) {
  const db = await openSyncDb();
  const row = await request(db.transaction('meta', 'readonly').objectStore('meta').get(key));
  return row ? row.value : fallback;
}

async function metaSet(key, value) {
  const db = await openSyncDb();
  const tx = db.transaction('meta', 'readwrite');
  tx.objectStore('meta').put({ key, value });
  await txDone(tx);
}

export const Sync = {
  status: 'offline',
  lastError: '',
  listeners: new Set(),

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  setStatus(status, error = '') {
    this.status = status;
    this.lastError = error;
    for (const listener of this.listeners) listener(status, error);
  },

  get token() { return localStorage.getItem(TOKEN_KEY) || ''; },
  get schoolId() { return localStorage.getItem(SCHOOL_KEY) || ''; },
  isLinked() { return Boolean(this.token && this.schoolId); },

  /** معرّف المدرسة من الرابط: `?school=ATH_...` يملأ الحقل للعميل. */
  schoolIdFromUrl() {
    return new URLSearchParams(window.location.search).get('school') || '';
  },

  async login(schoolId, username, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: schoolId.trim(),
        username: username.trim().toLowerCase(),
        password,
        device_id: await this.deviceId(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      const messages = {
        INVALID_CREDENTIALS: 'رمز المدرسة أو اسم المستخدم أو كلمة المرور غير صحيحة.',
        SUBSCRIPTION_SUSPENDED: 'اشتراك المدرسة موقوف. تواصل مع أثر ميديا.',
        LOCKED: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
      };
      throw new Error(messages[payload.error] || payload.message || 'تعذر ربط الجهاز.');
    }
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(SCHOOL_KEY, payload.school.id);
    await metaSet('cursor', 0);
    await metaSet('remoteUser', payload.user);
    await metaSet('plan', payload.school.plan_code);
    return payload;
  },

  async logout() {
    const token = this.token;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SCHOOL_KEY);
    if (token) {
      // الخروج من الخادم مجرد تنظيف؛ فشله لا يمنع فك ربط الجهاز محليًا.
      await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {});
    }
    this.setStatus('offline');
  },

  async deviceId() {
    let id = await metaGet('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      await metaSet('deviceId', id);
    }
    return id;
  },

  /**
   * تسجيل تغيير محلي في صندوق الصادر. يُستدعى من طبقة الكتابة نفسها،
   * فلا يمكن أن ينسى مسار في التطبيق أن يُبلّغ عن تعديله.
   */
  async queue(store, id, doc, deleted = false) {
    if (!this.isLinked() || NON_SYNCED_STORES.has(store) || !id) return;
    const db = await openSyncDb();
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').put({ store, id: String(id), doc: deleted ? null : doc, deleted, at: Date.now() });
    await txDone(tx);
  },

  async pendingCount() {
    if (!this.isLinked()) return 0;
    const db = await openSyncDb();
    return request(db.transaction('outbox', 'readonly').objectStore('outbox').count());
  },

  async authed(path, init = {}) {
    const response = await fetch(path, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${this.token}` },
    });
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('انتهت جلسة الجهاز. أعد ربطه.');
    }
    if (response.status === 403) {
      throw new Error('اشتراك المدرسة موقوف. تواصل مع أثر ميديا.');
    }
    return response;
  },

  /**
   * إرسال الصادر. لا يُحذف عنصر إلا بعد قبول الخادم له، فانقطاع الشبكة
   * في المنتصف يعيد المحاولة لاحقًا ولا يفقد تعديلاً.
   */
  async push() {
    const db = await openSyncDb();
    const rows = await request(db.transaction('outbox', 'readonly').objectStore('outbox').getAll());
    if (!rows.length) return { pushed: 0, rejected: [] };

    // آخر تعديل لكل سجل يكفي: إرسال التاريخ كاملاً يضاعف الحجم بلا فائدة.
    const latest = new Map();
    for (const row of rows) latest.set(`${row.store}|${row.id}`, row);
    const changes = [...latest.values()].slice(0, PUSH_BATCH);

    const response = await this.authed('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        changes: changes.map((c) => ({ store: c.store, id: c.id, doc: c.doc, deleted: c.deleted })),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.message || 'تعذر رفع التعديلات.');

    const sent = new Set(changes.map((c) => `${c.store}|${c.id}`));
    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    for (const row of rows) {
      if (sent.has(`${row.store}|${row.id}`) && row.at <= latest.get(`${row.store}|${row.id}`).at) {
        store.delete(row.seq);
      }
    }
    await txDone(tx);
    return { pushed: payload.accepted, rejected: payload.rejected || [] };
  },

  /**
   * سحب ما تغيّر منذ المؤشر، على دفعات حتى `complete`.
   * `apply` يكتب في قاعدة التطبيق دون أن يعيد إدراج التغيير في الصادر.
   */
  async pull(apply) {
    let cursor = await metaGet('cursor', 0);
    let received = 0;
    for (let guard = 0; guard < 100; guard += 1) {
      const response = await this.authed(`/api/pull?since=${cursor}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'تعذر جلب التحديثات.');
      await apply(payload);
      received += Object.values(payload.stores).reduce((sum, rows) => sum + rows.length, 0);
      cursor = payload.cursor;
      await metaSet('cursor', cursor);
      await metaSet('plan', payload.plan_code);
      if (payload.complete) break;
    }
    return { received, cursor };
  },

  /** دورة كاملة: الرفع أولًا حتى لا يدهس السحبُ تعديلاً محليًا لم يُرسل بعد. */
  async run(apply) {
    if (!this.isLinked()) return null;
    if (!navigator.onLine) { this.setStatus('offline'); return null; }
    this.setStatus('syncing');
    try {
      const pushed = await this.push();
      const pulled = await this.pull(apply);
      await metaSet('lastSyncAt', Date.now());
      this.setStatus('synced');
      return { ...pushed, ...pulled };
    } catch (error) {
      this.setStatus('error', error.message);
      throw error;
    }
  },

  async lastSyncAt() { return metaGet('lastSyncAt', 0); },
  async plan() { return metaGet('plan', ''); },

  start(apply) {
    if (!this.isLinked()) return;
    const tick = () => this.run(apply).catch(() => {});
    tick();
    window.clearInterval(this.timer);
    this.timer = window.setInterval(tick, AUTO_SYNC_MS);
    window.addEventListener('online', tick);
  },

  stop() {
    window.clearInterval(this.timer);
  },
};

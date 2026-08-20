-- ============================================================
-- محرك المدارس — مخطط D1 متعدد المستأجرين
-- ============================================================
-- كل صف تشغيلي يحمل school_id، وكل استعلام يقيّده من الجلسة لا من الطلب.
--
-- قرار معماري: كيانات المدرسة العشرون تُحفظ في جدول مستندات واحد
-- (`records`) لا في عشرين جدولًا. السبب أن التطبيق الحالي يعمل على مخازن
-- IndexedDB مستندية، ومنطق العمل كله في المتصفح. تحويلها إلى جداول علائقية
-- يعني إعادة كتابة التطبيق بالكامل، لا ترحيل بيانات.
--
-- ما نكسبه: عزل مفروض في مكان واحد، ومزامنة بمؤشر `updated_at` وهي ما
-- يحتاجه العمل دون إنترنت، وفهرس مركّب يمنع المسح الكامل.
-- ما نخسره: لا تكامل مرجعي ولا تحقق على مستوى الحقل داخل D1؛ يبقى التحقق
-- في التطبيق وفي طبقة القبول داخل الـWorker.
--
-- الاستثناء: المستخدمون والجلسات لا تدخل `records` إطلاقًا. تجزئة كلمة
-- المرور يجب ألا تكون في مستند يُزامن إلى متصفح.

-- ---------- المدارس (المستأجرون) ----------
CREATE TABLE IF NOT EXISTS schools (
  school_id         TEXT PRIMARY KEY,
  control_tenant_id TEXT,
  slug              TEXT NOT NULL,
  name              TEXT NOT NULL,
  environment       TEXT NOT NULL DEFAULT 'production'
                    CHECK (environment IN ('demo', 'production')),
  plan_code         TEXT NOT NULL DEFAULT 'basic'
                    CHECK (plan_code IN ('basic', 'full')),
  trial_expires_at  TEXT,
  lifecycle_status  TEXT NOT NULL DEFAULT 'active'
                    CHECK (lifecycle_status IN ('active', 'suspended', 'archived')),
  is_active         INTEGER NOT NULL DEFAULT 1,
  profile_json      TEXT NOT NULL DEFAULT '{}',
  seed_version      TEXT NOT NULL DEFAULT '',
  provisioned_at    INTEGER,
  created_at        INTEGER NOT NULL DEFAULT 0,
  updated_at        INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_control_tenant
  ON schools (control_tenant_id)
  WHERE control_tenant_id IS NOT NULL AND control_tenant_id != '';

-- ---------- المستخدمون ----------
-- خارج `records` عمدًا: التجزئة والملح لا يخرجان من الخادم أبدًا.
CREATE TABLE IF NOT EXISTS school_users (
  id                  TEXT PRIMARY KEY,
  school_id           TEXT NOT NULL,
  username            TEXT NOT NULL,
  display_name        TEXT NOT NULL DEFAULT '',
  role                TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'guardian')),
  -- يربط الحساب بسجل المعلم أو الطالب أو ولي الأمر داخل `records`.
  profile_id          TEXT NOT NULL DEFAULT '',
  password_hash       TEXT NOT NULL,
  password_salt       TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          INTEGER NOT NULL DEFAULT 0,
  updated_at          INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_users_username
  ON school_users (school_id, username);
CREATE INDEX IF NOT EXISTS idx_school_users_school
  ON school_users (school_id, updated_at);

-- ---------- الجلسات ----------
-- نخزّن تجزئة التوكن لا التوكن: تسريب القاعدة لا يمنح جلسة حيّة.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL,
  profile_id TEXT NOT NULL DEFAULT '',
  device_id  TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_school ON sessions (school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);

-- ---------- محاولات الدخول ----------
CREATE TABLE IF NOT EXISTS login_attempts (
  key          TEXT PRIMARY KEY,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);

-- ---------- كيانات المدرسة ----------
-- `store` هو اسم المخزن كما في التطبيق (students, enrollments, ...).
-- المفتاح مركّب من المستأجر والمخزن والمعرّف، فتصادم معرّف بين مدرستين مستحيل.
CREATE TABLE IF NOT EXISTS records (
  school_id  TEXT NOT NULL,
  store      TEXT NOT NULL,
  id         TEXT NOT NULL,
  doc_json   TEXT NOT NULL,
  -- الحذف منطقي: المزامنة تحتاج أن ترى أن السجل حُذف، لا أن يختفي بصمت.
  deleted    INTEGER NOT NULL DEFAULT 0,
  -- عدّاد تعارض: كل كتابة ترفعه، ويُستخدم لكشف التعديل المتزامن.
  version    INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (school_id, store, id)
);

-- المؤشر الأساسي للمزامنة: «أعطني ما تغيّر في هذا المخزن بعد هذا الوقت».
-- يبدأ بـschool_id فلا يمكن لخطة استعلام أن تقرأ صفوف مدرسة أخرى.
CREATE INDEX IF NOT EXISTS idx_records_sync
  ON records (school_id, store, updated_at);

-- مؤشر عام لكل المخازن معًا عند سحب أول مزامنة كاملة.
CREATE INDEX IF NOT EXISTS idx_records_school_updated
  ON records (school_id, updated_at);

-- ---------- سجل التدقيق ----------
CREATE TABLE IF NOT EXISTS school_audit (
  id         TEXT PRIMARY KEY,
  school_id  TEXT NOT NULL,
  at         INTEGER NOT NULL,
  user_id    TEXT NOT NULL DEFAULT '',
  user_name  TEXT NOT NULL DEFAULT '',
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL DEFAULT '',
  entity_id  TEXT NOT NULL DEFAULT '',
  detail     TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_school_audit_school ON school_audit (school_id, at);

-- ---------- طلبات المحوّل ----------
CREATE TABLE IF NOT EXISTS adapter_requests (
  request_id    TEXT PRIMARY KEY,
  action        TEXT NOT NULL,
  tenant_id     TEXT NOT NULL,
  request_hash  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'succeeded', 'failed')),
  response_json TEXT NOT NULL DEFAULT '{}',
  error_code    TEXT NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL,
  completed_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_adapter_requests_tenant
  ON adapter_requests (tenant_id, created_at);

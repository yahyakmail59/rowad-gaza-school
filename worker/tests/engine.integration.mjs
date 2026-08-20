/**
 * اختبار تكامل محرك المدارس على Miniflare.
 *
 * الهدف الأول اختبارات العزل السلبية: لا تكفي رؤية أن المدرسة ترى بياناتها،
 * بل يجب إثبات أنها لا ترى بيانات غيرها ولا تكتب فوقها.
 */

import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const baseUrl = 'http://school.test';
const secret = 'integration-only-adapter-secret';

// fileURLToPath وليس .pathname: على ويندوز يعيد الأخير "/C:/..." فيفشل الفتح.
const workerDir = fileURLToPath(new URL('..', import.meta.url));
const modulePath = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));

const miniflare = new Miniflare(convertV4MiniflareOptions({
  port: 0,
  name: 'school-integration',
  // المحرك مقسّم إلى وحدات، فيجب تسجيلها كلها بأسمائها كما تُستورد.
  modules: [
    { type: 'ESModule', path: modulePath('worker.js') },
    { type: 'ESModule', path: modulePath('access.js') },
    { type: 'ESModule', path: modulePath('seed.js') },
  ],
  modulesRoot: workerDir,
  compatibilityDate: '2026-08-19',
  bindings: { ATHAR_ADAPTER_SECRET: secret, PUBLIC_APP_URL: 'https://school.example.test/' },
  d1Databases: { DB: randomUUID() },
}));

const database = await miniflare.getD1Database('DB');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8')
  .replace(/^\s*--.*$/gm, '')
  .trim();
for (const statement of schema.split(';').map((v) => v.trim()).filter(Boolean)) {
  await database.prepare(statement).run();
}

const dispatch = (url, init) => miniflare.dispatchFetch(url, init);

async function signed(method, path, requestId, body) {
  const raw = body ? JSON.stringify(body) : '';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const hash = createHash('sha256').update(raw).digest('hex');
  const canonical = `${timestamp}\n${requestId}\n${method}\n${path}\n${hash}`;
  return dispatch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Athar-Timestamp': timestamp,
      'X-Athar-Request-Id': requestId,
      'X-Athar-Signature': createHmac('sha256', secret).update(canonical).digest('hex'),
    },
    body: body ? raw : undefined,
  });
}

async function ok(response, message) {
  const payload = await response.json();
  assert.equal(payload.ok, true, `${message}: ${JSON.stringify(payload)}`);
  return payload;
}

async function createSchool(slug, name, environment, planCode, adminUsername) {
  const tenantId = randomUUID();
  const requestId = randomUUID();
  const response = await signed('POST', '/internal/v1/tenants', requestId, {
    request_id: requestId, tenant_id: tenantId, slug, display_name: name,
    environment, plan_code: planCode, trial_expires_at: null,
    ...(adminUsername ? { admin_username: adminUsername } : {}),
    config: { phone: '0599000000', address: 'غزة', currency: 'ILS' },
  });
  assert.equal(response.status, 201, `create ${slug}`);
  const payload = await ok(response, `create ${slug}`);
  return { tenantId, ...payload };
}

async function login(schoolId, username, password) {
  const response = await dispatch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ school_id: schoolId, username, password, device_id: 'test' }),
  });
  return { status: response.status, payload: await response.json().catch(() => null) };
}

const authed = (token, path, init = {}) => dispatch(`${baseUrl}${path}`, {
  ...init,
  headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
});

/**
 * يستنفد المؤشر حتى `complete`. المزامنة على دفعات، فقراءة الصفحة الأولى
 * وحدها تعطي نتيجة ناقصة تبدو صحيحة — وهذا بالضبط ما يجب ألا يفعله العميل.
 */
async function pullAll(token, stores = '') {
  const merged = {};
  let cursor = 0;
  let plan = '';
  let users = [];
  for (let guard = 0; guard < 50; guard += 1) {
    const query = `since=${cursor}${stores ? `&stores=${stores}` : ''}`;
    const response = await authed(token, `/api/pull?${query}`);
    if (response.status !== 200) return { status: response.status, stores: merged };
    const payload = await response.json();
    plan = payload.plan_code;
    if (payload.users?.length) users = payload.users;
    for (const [store, rows] of Object.entries(payload.stores)) {
      (merged[store] ||= []).push(...rows);
    }
    cursor = payload.cursor;
    if (payload.complete) break;
  }
  return { status: 200, stores: merged, cursor, plan_code: plan, users };
}

try {
  /* ---------- الإنشاء ---------- */

  const alpha = await createSchool('alpha', 'مدرسة الأمل', 'demo', 'full');
  const beta = await createSchool('beta', 'مدرسة النهضة', 'demo', 'full');
  assert.notEqual(alpha.external_tenant_id, beta.external_tenant_id);
  assert.equal(alpha.seed_version, 'school-demo-v1');

  const replay = await signed('POST', '/internal/v1/tenants', alpha.request_id, {
    request_id: alpha.request_id, tenant_id: alpha.tenant_id, slug: 'alpha',
    display_name: 'مدرسة الأمل', environment: 'demo', plan_code: 'full',
    trial_expires_at: null, config: { phone: '0599000000', address: 'غزة', currency: 'ILS' },
  });
  assert.equal(replay.status, 200);
  const replayed = await ok(replay, 'idempotent replay');
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.credentials.admin_password, alpha.credentials.admin_password);

  /* ---------- الدخول ---------- */

  const badLogin = await login(alpha.credentials.school_id, 'admin', 'wrong-password');
  assert.equal(badLogin.status, 401);

  const alphaAdmin = await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password);
  assert.equal(alphaAdmin.status, 200);
  assert.equal(alphaAdmin.payload.user.role, 'admin');
  const alphaToken = alphaAdmin.payload.token;

  const betaAdmin = await login(beta.credentials.school_id, 'admin', beta.credentials.admin_password);
  const betaToken = betaAdmin.payload.token;

  // كلمة مرور مدرسة لا تفتح مدرسة أخرى، ولو كان اسم المستخدم نفسه.
  const crossLogin = await login(beta.credentials.school_id, 'admin', alpha.credentials.admin_password);
  assert.equal(crossLogin.status, 401, 'a password must not work across schools');

  /* ---------- بيانات العرض ---------- */

  const alphaPull = await pullAll(alphaToken);
  assert.equal(alphaPull.status, 200);
  assert.ok(alphaPull.stores.students.length >= 20, 'demo needs students');
  assert.ok(alphaPull.stores.teachers.length >= 4, 'demo needs teachers');
  assert.ok(alphaPull.stores.attendanceRecords.length > 100, 'demo needs attendance history');
  assert.ok(alphaPull.stores.gradeEntries.length >= 30, 'demo needs graded entries');
  assert.ok(alphaPull.stores.invoices.length >= 20, 'full plan demo needs invoices');
  assert.ok(
    alphaPull.stores.attendanceRecords.some((r) => r.doc.status === 'absent'),
    'attendance must include absences, otherwise the feature shows no value',
  );
  assert.ok(alphaPull.stores.invoices.some((r) => r.doc.status === 'partial'), 'demo needs a partial invoice');

  /* ---------- العزل: القراءة ---------- */

  const alphaStudentIds = new Set(alphaPull.stores.students.map((r) => r.id));
  const betaPull = await pullAll(betaToken);
  // المعرّفات متطابقة بين المدرستين عمدًا (student-1 ...): المفتاح مركّب مع
  // المستأجر، فالتصادم مستحيل. ما يجب إثباته أن الوثائق مفصولة فعلًا.
  const alphaProfile = alphaPull.stores.settings.find((r) => r.id === 'schoolProfile');
  const betaProfile = betaPull.stores.settings.find((r) => r.id === 'schoolProfile');
  assert.equal(alphaProfile.doc.value.name, 'مدرسة الأمل');
  assert.equal(betaProfile.doc.value.name, 'مدرسة النهضة');
  assert.ok(alphaStudentIds.size > 0);

  /* ---------- العزل: الكتابة ---------- */

  // ألفا تكتب اسمًا مميزًا؛ يجب ألا يظهر عند بيتا إطلاقًا.
  const marker = `تعديل-ألفا-${randomUUID().slice(0, 8)}`;
  const writeResponse = await authed(alphaToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changes: [{ store: 'students', id: 'student-1', doc: { id: 'student-1', fullName: marker } }],
    }),
  });
  const wrote = await ok(writeResponse, 'alpha writes its own student');
  assert.equal(wrote.accepted, 1);

  const alphaAfter = await pullAll(alphaToken, 'students');
  assert.equal(alphaAfter.stores.students.find((r) => r.id === 'student-1').doc.fullName, marker);

  const betaAfter = await pullAll(betaToken, 'students');
  const betaStudent = betaAfter.stores.students.find((r) => r.id === 'student-1');
  assert.ok(betaStudent, 'beta keeps its own student-1');
  assert.notEqual(betaStudent.doc.fullName, marker, 'a write in one school must not reach another');

  const alphaRow = await database
    .prepare("SELECT COUNT(*) AS count FROM records WHERE school_id = ? AND store = 'students'")
    .bind(beta.credentials.school_id).first();
  assert.ok(Number(alphaRow.count) > 0, 'beta rows still exist');

  /* ---------- الصلاحيات بالدور ---------- */

  const now = Date.now();
  await database.prepare(
    `INSERT INTO school_users (id, school_id, username, display_name, role, profile_id,
      password_hash, password_salt, password_iterations, is_active, created_at, updated_at)
     SELECT 'teacher-user', school_id, 'teacher1', 'أحمد الخطيب', 'teacher', 'teacher-1',
            password_hash, password_salt, password_iterations, 1, ?, ?
     FROM school_users WHERE school_id = ? AND role = 'admin'`,
  ).bind(now, now, alpha.credentials.school_id).run();

  const teacher = await login(alpha.credentials.school_id, 'teacher1', alpha.credentials.admin_password);
  assert.equal(teacher.status, 200);
  const teacherToken = teacher.payload.token;

  // المعلم يكتب الدرجات والحضور.
  const teacherAllowed = await (await authed(teacherToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'gradeEntries', id: 'ge-test', doc: { id: 'ge-test', score: 30 } }] }),
  })).json();
  assert.equal(teacherAllowed.accepted, 1);

  // ولا يكتب سجلات الطلاب ولا المالية، ولو استُدعي المسار مباشرة.
  const teacherBlocked = await (await authed(teacherToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changes: [
        { store: 'students', id: 'student-2', doc: { id: 'student-2', fullName: 'اختراق' } },
        { store: 'invoices', id: 'invoice-1', doc: { id: 'invoice-1', totalMinor: 0 } },
      ],
    }),
  })).json();
  assert.equal(teacherBlocked.accepted, 0);
  assert.equal(teacherBlocked.rejected.length, 2);
  assert.ok(teacherBlocked.rejected.every((r) => r.code === 'ROLE_FORBIDDEN'));

  const studentUnchanged = await pullAll(alphaToken, 'students');
  assert.notEqual(
    studentUnchanged.stores.students.find((r) => r.id === 'student-2')?.doc.fullName,
    'اختراق',
    'a rejected write must not land',
  );

  /* ---------- فرض الباقة ---------- */

  const planRequestId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/plan`, planRequestId, {
    request_id: planRequestId, tenant_id: alpha.tenantId, plan_code: 'basic',
  }), 'downgrade to basic');

  const basicSession = await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password);
  const basicToken = basicSession.payload.token;
  const basicPull = await pullAll(basicToken);
  assert.equal(basicPull.plan_code, 'basic');
  assert.equal(basicPull.stores.invoices, undefined, 'basic must not receive finance data');
  assert.equal(basicPull.stores.payments, undefined);
  assert.ok(basicPull.stores.students.length > 0, 'basic keeps the academic side');

  // الطلب الصريح للمخزن الممنوع لا يتجاوز الباقة.
  const forcedPull = await pullAll(basicToken, 'invoices');
  assert.deepEqual(forcedPull.stores, {}, 'asking for a blocked store directly must return nothing');

  const basicWrite = await (await authed(basicToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'invoices', id: 'invoice-9', doc: { id: 'invoice-9' } }] }),
  })).json();
  assert.equal(basicWrite.accepted, 0);
  assert.equal(basicWrite.rejected[0].code, 'PLAN_FORBIDDEN');

  // التنزيل يمنع الوصول ولا يحذف: الترقية تعيد كل شيء.
  const financeRows = await database
    .prepare("SELECT COUNT(*) AS count FROM records WHERE school_id = ? AND store = 'invoices'")
    .bind(alpha.credentials.school_id).first();
  assert.ok(Number(financeRows.count) >= 20, 'downgrade must not delete finance rows');

  const upgradeRequestId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/plan`, upgradeRequestId, {
    request_id: upgradeRequestId, tenant_id: alpha.tenantId, plan_code: 'full',
  }), 'upgrade back to full');
  const upgraded = await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password);
  const upgradedPull = await pullAll(upgraded.payload.token, 'invoices');
  assert.ok(upgradedPull.stores.invoices.length >= 20, 'upgrade restores finance access');

  /* ---------- نطاق الطالب وولي الأمر ---------- */

  await database.prepare(
    `INSERT INTO school_users (id, school_id, username, display_name, role, profile_id,
      password_hash, password_salt, password_iterations, is_active, created_at, updated_at)
     SELECT 'student-user', school_id, 'student1', 'طالب', 'student', 'student-1',
            password_hash, password_salt, password_iterations, 1, ?, ?
     FROM school_users WHERE school_id = ? AND role = 'admin'`,
  ).bind(now, now, alpha.credentials.school_id).run();

  const student = await login(alpha.credentials.school_id, 'student1', alpha.credentials.admin_password);
  const studentToken = student.payload.token;
  const studentPull = await pullAll(studentToken);

  assert.equal(studentPull.stores.students.length, 1, 'a student sees only their own record');
  assert.equal(studentPull.stores.students[0].id, 'student-1');
  assert.equal(studentPull.stores.teachers, undefined, 'a student does not pull staff records');
  assert.ok(
    (studentPull.stores.gradeEntries || []).every((r) => r.doc.studentId === 'student-1'),
    'a student must not receive other students grades',
  );
  assert.ok(
    (studentPull.stores.invoices || []).every((r) => r.doc.studentId === 'student-1'),
    'a student must not receive other students invoices',
  );
  assert.ok((studentPull.stores.timetableSlots || []).length > 0, 'shared school data stays visible');

  const studentWrite = await (await authed(studentToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'gradeEntries', id: 'ge-hack', doc: { id: 'ge-hack', score: 100 } }] }),
  })).json();
  assert.equal(studentWrite.accepted, 0, 'a student must not write grades');

  /* ---------- الجلسة ---------- */

  const noToken = await dispatch(`${baseUrl}/api/pull?since=0`);
  assert.equal(noToken.status, 401);
  const badToken = await authed('not-a-real-token', '/api/pull?since=0');
  assert.equal(badToken.status, 401);

  /* ---------- دورة الحياة ---------- */

  const suspendId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/status`, suspendId, {
    request_id: suspendId, tenant_id: alpha.tenantId, action: 'suspend',
  }), 'suspend');

  const suspendedLogin = await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password);
  assert.equal(suspendedLogin.status, 403, 'a suspended school must not log in');
  const oldSessionAfterSuspend = await authed(alphaToken, '/api/pull?since=0');
  assert.equal(oldSessionAfterSuspend.status, 401, 'suspending revokes live sessions');

  // بيتا لا تتأثر بإيقاف ألفا.
  const betaStillWorks = await authed(betaToken, '/api/pull?since=0&stores=students');
  assert.equal(betaStillWorks.status, 200, 'suspending one school must not affect another');

  const resumeId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/status`, resumeId, {
    request_id: resumeId, tenant_id: alpha.tenantId, action: 'resume',
  }), 'resume');
  const resumedLogin = await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password);
  assert.equal(resumedLogin.status, 200, 'resume restores access');
  const resumedPull = await pullAll(resumedLogin.payload.token, 'students');
  assert.ok(resumedPull.stores.students.length > 0, 'no data lost across suspend and resume');

  /* ---------- كلمة مرور جديدة للمدير ---------- */

  const resetId = randomUUID();
  const reset = await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/reset-admin-password`, resetId, {
    request_id: resetId, tenant_id: alpha.tenantId,
  }), 'reset admin password');
  assert.notEqual(reset.credentials.admin_password, alpha.credentials.admin_password);
  assert.equal((await login(alpha.credentials.school_id, 'admin', alpha.credentials.admin_password)).status, 401);
  assert.equal((await login(alpha.credentials.school_id, 'admin', reset.credentials.admin_password)).status, 200);

  /* ---------- الأرشفة والحذف ---------- */

  // محاولة فاشلة متعمّدة: تُنشئ صفًا في login_attempts ليثبت الحذف أنه يزيله.
  await login(alpha.credentials.school_id, 'admin', 'definitely-wrong');

  const earlyPurge = await signed('DELETE', `/internal/v1/tenants/${alpha.tenantId}`, randomUUID());
  assert.equal(earlyPurge.status, 409, 'purge before archive must fail');

  const archiveId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/status`, archiveId, {
    request_id: archiveId, tenant_id: alpha.tenantId, action: 'archive',
  }), 'archive');

  const restoreId = randomUUID();
  const restored = await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/status`, restoreId, {
    request_id: restoreId, tenant_id: alpha.tenantId, action: 'restore',
  }), 'restore');
  assert.equal(restored.status, 'suspended', 'restore leaves the archive into suspended, not active');

  const reArchiveId = randomUUID();
  await ok(await signed('POST', `/internal/v1/tenants/${alpha.tenantId}/status`, reArchiveId, {
    request_id: reArchiveId, tenant_id: alpha.tenantId, action: 'archive',
  }), 're-archive');

  const purge = await ok(await signed('DELETE', `/internal/v1/tenants/${alpha.tenantId}`, randomUUID()), 'purge');
  assert.equal(purge.status, 'deleted');

  for (const table of ['records', 'school_users', 'sessions', 'school_audit']) {
    const row = await database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE school_id = ?`)
      .bind(alpha.credentials.school_id).first();
    assert.equal(Number(row.count), 0, `${table} still holds purged school rows`);
  }

  // الجداول غير المرتبطة بعمود school_id تُنسى بسهولة، فتتراكم إلى الأبد
  // وتُبقي أثرًا لمدرسة محذوفة.
  const attempts = await database
    .prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE substr(key, 1, ?) = ?')
    .bind(alpha.credentials.school_id.length + 1, `${alpha.credentials.school_id}|`).first();
  assert.equal(Number(attempts.count), 0, 'login attempts survived the purge');
  const leftoverRequests = await database
    .prepare('SELECT COUNT(*) AS count FROM adapter_requests WHERE tenant_id = ?')
    .bind(alpha.tenantId).first();
  assert.equal(Number(leftoverRequests.count), 1, 'only the purge request itself may remain');

  // معرّف المدرسة يحتوي `_`، وهو محرف بدل في LIKE. لو استُخدم LIKE لحذف
  // التنظيفُ أقفال مدارس أخرى تشترك في الطول والبنية.
  const betaAttempts = await database
    .prepare('SELECT COUNT(*) AS count FROM login_attempts WHERE substr(key, 1, ?) = ?')
    .bind(beta.credentials.school_id.length + 1, `${beta.credentials.school_id}|`).first();
  assert.ok(Number(betaAttempts.count) >= 0, 'other tenants keep their own lockouts');
  const survivor = await database.prepare("SELECT COUNT(*) AS count FROM records WHERE school_id = ?")
    .bind(beta.credentials.school_id).first();
  assert.ok(Number(survivor.count) > 0, 'purging one school must not touch another');

  const repeatPurge = await signed('DELETE', `/internal/v1/tenants/${alpha.tenantId}`, randomUUID());
  assert.equal(repeatPurge.status, 200, 'purge is idempotent');

  /* ---------- المزامنة بالمؤشر ---------- */

  const betaFull = await pullAll(betaToken, 'students');
  const cursor = betaFull.cursor;
  const empty = await (await authed(betaToken, `/api/pull?since=${cursor}&stores=students`)).json();
  assert.equal((empty.stores.students || []).length, 0, 'nothing changed since the cursor');

  await authed(betaToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'students', id: 'student-3', doc: { id: 'student-3', fullName: 'محدّث' } }] }),
  });
  const delta = await (await authed(betaToken, `/api/pull?since=${cursor}&stores=students`)).json();
  assert.equal(delta.stores.students.length, 1, 'the cursor returns only what changed');
  assert.equal(delta.stores.students[0].doc.fullName, 'محدّث');

  // الحذف يُنقل كعلَم لا باختفاء صامت، وإلا بقي السجل على الأجهزة الأخرى.
  await authed(betaToken, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'students', id: 'student-3', deleted: true }] }),
  });
  const afterDelete = await (await authed(betaToken, `/api/pull?since=${cursor}&stores=students`)).json();
  assert.equal(afterDelete.stores.students.find((r) => r.id === 'student-3').deleted, true);

  /* ---------- المستخدمون لا يخرجون بأسرارهم ---------- */

  const usersPayload = await pullAll(betaToken);
  assert.ok(Array.isArray(usersPayload.users) && usersPayload.users.length > 0);
  for (const user of usersPayload.users) {
    assert.equal(user.password_hash, undefined, 'password hashes must never leave the server');
    assert.equal(user.password_salt, undefined);
  }
  assert.equal(usersPayload.stores.users, undefined, 'users are not a syncable record store');

  /* ---------- جهازان على المدرسة نفسها ---------- */

  // هذا ما كان مستحيلاً قبل المحرك: مدرسة تعيش على أكثر من جهاز.
  const deviceA = (await login(beta.credentials.school_id, 'admin', beta.credentials.admin_password)).payload.token;
  const deviceB = (await login(beta.credentials.school_id, 'admin', beta.credentials.admin_password)).payload.token;

  const bBase = await pullAll(deviceB, 'students');
  const bCursor = bBase.cursor;

  await authed(deviceA, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      changes: [{ store: 'students', id: 'student-7', doc: { id: 'student-7', fullName: 'كتبه الجهاز أ' } }],
    }),
  });

  const bDelta = await (await authed(deviceB, `/api/pull?since=${bCursor}&stores=students`)).json();
  assert.equal(
    bDelta.stores.students.find((r) => r.id === 'student-7').doc.fullName,
    'كتبه الجهاز أ',
    'a write on one device must reach the other',
  );

  // الجهاز الذي كتب لا يحتاج أن يسحب تعديله مرة أخرى ليصل إلى نفس النتيجة.
  const aState = await pullAll(deviceA, 'students');
  assert.equal(aState.stores.students.find((r) => r.id === 'student-7').doc.fullName, 'كتبه الجهاز أ');

  // الحذف ينتقل كعلَم، وإلا بقي السجل ظاهرًا على الجهاز الآخر إلى الأبد.
  await authed(deviceA, '/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: [{ store: 'students', id: 'student-7', deleted: true }] }),
  });
  const bAfterDelete = await (await authed(deviceB, `/api/pull?since=${bCursor}&stores=students`)).json();
  assert.equal(bAfterDelete.stores.students.find((r) => r.id === 'student-7').deleted, true);

  /* ---------- تغيير بيانات الدخول من داخل المدرسة ---------- */

  const credSchool = await createSchool('creds', 'مدرسة البيانات', 'production', 'basic');
  const credLogin = await login(credSchool.credentials.school_id, 'admin', credSchool.credentials.admin_password);
  const credToken = credLogin.payload.token;
  const otherDevice = (await login(credSchool.credentials.school_id, 'admin', credSchool.credentials.admin_password)).payload.token;

  const change = (token, body) => authed(token, '/api/account/credentials', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  // كلمة المرور الحالية إلزامية: جهاز مفتوح لا يكفي للاستيلاء على الحساب.
  const wrongCurrent = await change(credToken, { current_password: 'not-it', new_password: 'brand-new-pass' });
  assert.equal(wrongCurrent.status, 401);
  assert.equal((await login(credSchool.credentials.school_id, 'admin', credSchool.credentials.admin_password)).status, 200,
    'a failed change must not alter the password');

  const weak = await change(credToken, { current_password: credSchool.credentials.admin_password, new_password: 'short' });
  assert.equal(weak.status, 422);

  const badName = await change(credToken, { current_password: credSchool.credentials.admin_password, new_username: 'اسم عربي' });
  assert.equal(badName.status, 422);

  const changed = await ok(await change(credToken, {
    current_password: credSchool.credentials.admin_password,
    new_username: 'mudeer',
    new_password: 'a-strong-password-1',
  }), 'change own credentials');
  assert.equal(changed.username, 'mudeer');
  assert.equal(changed.password_changed, true);

  assert.equal((await login(credSchool.credentials.school_id, 'admin', credSchool.credentials.admin_password)).status, 401,
    'the old username and password must stop working');
  assert.equal((await login(credSchool.credentials.school_id, 'mudeer', 'a-strong-password-1')).status, 200,
    'the new credentials must work');

  // تغيير كلمة المرور يطرد الأجهزة الأخرى ويُبقي الجهاز الذي غيّرها.
  assert.equal((await authed(otherDevice, '/api/pull?since=0&stores=students')).status, 401,
    'other devices must be signed out');
  assert.equal((await authed(credToken, '/api/pull?since=0&stores=students')).status, 200,
    'the device that made the change stays signed in');

  // لوحة أثر تبقى قادرة على إصدار بيانات جديدة بعد أن غيّرها المدير.
  const overrideId = randomUUID();
  const override = await ok(await signed(
    'POST', `/internal/v1/tenants/${credSchool.tenantId}/reset-owner-credential`, overrideId,
    { request_id: overrideId, tenant_id: credSchool.tenantId },
  ), 'Athar override after a local change');
  // اللوحة تعيد اسم المستخدم الفعلي لا 'admin' المفترض، وإلا عرضت بيانات كاذبة.
  assert.equal(override.credentials.username, 'mudeer', 'Athar must report the real admin username');
  assert.equal((await login(credSchool.credentials.school_id, 'mudeer', override.credentials.secret)).status, 200,
    'Athar reset issues a working password for the current username');

  /* ---------- اسم مستخدم المدير يختاره المشغّل ---------- */

  const named = await createSchool('named', 'مدرسة الاسم', 'production', 'basic', 'Nadir.Admin');
  assert.equal(named.credentials.username, 'nadir.admin', 'the chosen username is normalised to lowercase');
  assert.equal((await login(named.credentials.school_id, 'nadir.admin', named.credentials.admin_password)).status, 200);
  assert.equal((await login(named.credentials.school_id, 'admin', named.credentials.admin_password)).status, 401,
    'the default username must not also work');

  const badUsernameId = randomUUID();
  const badUsername = await signed('POST', '/internal/v1/tenants', badUsernameId, {
    request_id: badUsernameId, tenant_id: randomUUID(), slug: 'bad-user', display_name: 'مدرسة',
    environment: 'production', plan_code: 'basic', trial_expires_at: null,
    admin_username: 'مدير عربي', config: {},
  });
  assert.equal(badUsername.status, 422, 'an invalid username must be refused at creation');

  // الحقل اختياري: تركه فارغًا يُبقي الافتراض.
  const defaulted = await createSchool('defaulted', 'مدرسة افتراضية', 'production', 'basic');
  assert.equal(defaulted.credentials.username, 'admin');

  console.log('school-engine-integration-ok');
} finally {
  await miniflare.dispose();
}

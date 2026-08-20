/**
 * محرك المدارس — Worker متعدد المستأجرين.
 *
 * ثلاث مسؤوليات لا رابعة:
 *  1. `/internal/v1/*` — محوّل لوحة أثر، موقّع بـHMAC.
 *  2. `/api/login` و`/api/logout` — جلسات المدرسة.
 *  3. `/api/pull` و`/api/push` — مزامنة الكيانات، مقيّدة بالمستأجر والدور والباقة.
 *
 * المبدأ الحاكم: `school_id` يأتي من الجلسة دائمًا، ولا يُقرأ من جسم الطلب
 * ولا من ترويسة. المتصفح لا يستطيع اختيار المدرسة التي يقرأ منها.
 */

import {
  canRead,
  canWrite,
  isKnownStore,
  readableStores,
  rowVisibleTo,
} from './access.js';
import { demoSeedStatements, DEMO_SEED_VERSION } from './seed.js';

const PBKDF2_ITER = 100000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_STEPS_MS = [60e3, 5 * 60e3, 15 * 60e3, 60 * 60e3];
const ADAPTER_MAX_BODY_BYTES = 64 * 1024;
const API_MAX_BODY_BYTES = 512 * 1024;
const ADAPTER_CLOCK_SKEW_SECONDS = 5 * 60;
const PULL_LIMIT = 1000;
const PUSH_LIMIT = 500;

const enc = (s) => new TextEncoder().encode(s);
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(bytes) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

async function sha256b64(text) {
  return b64(await crypto.subtle.digest('SHA-256', enc(text)));
}

async function hmacBytes(secret, text) {
  const key = await crypto.subtle.importKey(
    'raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc(text)));
}

const hmacHex = async (secret, text) => bytesToHex(await hmacBytes(secret, text));

async function derivePassword(password, saltB64, iterations = PBKDF2_ITER) {
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', enc(password), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256,
  ));
}

const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));
const newToken = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

/** مقارنة ثابتة الزمن: الخروج المبكر يسرّب طول التطابق. */
function safeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

const jsonHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...extra } });

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

const str = (value, max = 200) => (value == null ? '' : String(value).slice(0, max));
const num = (value) => (Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);

async function readBoundedBody(request, limit) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > limit) throw new HttpError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel('body too large');
      throw new HttpError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/* ==================== محوّل لوحة أثر ==================== */

async function verifyAdapterRequest(request, env) {
  const secret = env.ATHAR_ADAPTER_SECRET;
  if (!secret) throw new HttpError(500, 'ADAPTER_NOT_CONFIGURED', 'Product adapter is not configured.');

  const timestamp = request.headers.get('X-Athar-Timestamp') || '';
  const requestId = request.headers.get('X-Athar-Request-Id') || '';
  const signature = (request.headers.get('X-Athar-Signature') || '').toLowerCase();
  if (!/^\d{10}$/.test(timestamp) || !/^[0-9a-f-]{36}$/.test(requestId) || !/^[0-9a-f]{64}$/.test(signature)) {
    throw new HttpError(401, 'ADAPTER_UNAUTHORIZED', 'Adapter authentication failed.');
  }
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > ADAPTER_CLOCK_SKEW_SECONDS) {
    throw new HttpError(401, 'ADAPTER_TIMESTAMP_EXPIRED', 'Adapter request timestamp is outside the accepted window.');
  }

  const bodyBytes = await readBoundedBody(request, ADAPTER_MAX_BODY_BYTES);
  const requestHash = await sha256Hex(bodyBytes);
  const pathname = new URL(request.url).pathname;
  const canonical = `${timestamp}\n${requestId}\n${request.method.toUpperCase()}\n${pathname}\n${requestHash}`;
  if (!safeEqual(await hmacHex(secret, canonical), signature)) {
    throw new HttpError(401, 'ADAPTER_UNAUTHORIZED', 'Adapter authentication failed.');
  }

  let body = {};
  if (bodyBytes.byteLength) {
    try {
      body = JSON.parse(new TextDecoder().decode(bodyBytes));
    } catch {
      throw new HttpError(400, 'INVALID_JSON', 'Adapter request JSON is invalid.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpError(400, 'INVALID_JSON', 'Adapter request JSON must be an object.');
    }
    if (body.request_id !== requestId) {
      throw new HttpError(400, 'REQUEST_ID_MISMATCH', 'Body and header request IDs must match.');
    }
  }
  return { requestId, requestHash, body };
}

function adapterRequired(value, code, max = 160) {
  const normalized = str(value, max + 1).trim();
  if (!normalized || normalized.length > max) {
    throw new HttpError(422, code, 'A required adapter field is invalid.');
  }
  return normalized;
}

async function beginAdapterRequest(db, requestId, action, tenantId, requestHash) {
  const existing = await db.prepare(
    'SELECT request_hash, status, response_json FROM adapter_requests WHERE request_id = ?',
  ).bind(requestId).first();
  if (existing) {
    if (!safeEqual(String(existing.request_hash), requestHash)) {
      throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This request ID was already used for different data.');
    }
    if (existing.status === 'succeeded') {
      return { replay: true, result: JSON.parse(existing.response_json || '{}') };
    }
    if (existing.status === 'pending') {
      throw new HttpError(409, 'REQUEST_IN_PROGRESS', 'This adapter request is already in progress.');
    }
    await db.prepare(
      "UPDATE adapter_requests SET status = 'pending', error_code = '', completed_at = NULL WHERE request_id = ?",
    ).bind(requestId).run();
    return { replay: false };
  }
  const claimed = await db.prepare(
    `INSERT OR IGNORE INTO adapter_requests
     (request_id, action, tenant_id, request_hash, status, response_json, error_code, created_at)
     VALUES (?, ?, ?, ?, 'pending', '{}', '', ?)`,
  ).bind(requestId, action, tenantId, requestHash, Date.now()).run();
  if (Number(claimed.meta?.changes || 0) === 0) {
    return beginAdapterRequest(db, requestId, action, tenantId, requestHash);
  }
  return { replay: false };
}

async function markAdapterFailed(db, requestId, code) {
  await db.prepare(
    "UPDATE adapter_requests SET status = 'failed', error_code = ?, completed_at = ? WHERE request_id = ?",
  ).bind(code, Date.now(), requestId).run();
}

async function externalSchoolId(slug, tenantId) {
  const suffix = (await sha256Hex(enc(tenantId))).slice(0, 8);
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 19) || 'school';
  return `ATH_${safeSlug}_${suffix}`.toUpperCase();
}

/**
 * كلمة مرور المدير الأولى، مشتقة من السر ومعرّف الطلب. إعادة الطلب نفسه
 * تعيد الكلمة نفسها، فلا تُقفل المدرسة على مديرها عند إعادة محاولة.
 */
async function adminPassword(secret, requestId, tenantId) {
  const bytes = await hmacBytes(secret, `credential\n${requestId}\n${tenantId}`);
  return bytesToHex(bytes).slice(0, 12);
}

function publicSchoolUrl(env, schoolId) {
  const base = str(env.PUBLIC_APP_URL, 300).trim();
  if (!base) return '';
  try {
    const url = new URL(base);
    url.searchParams.set('school', schoolId);
    return url.toString();
  } catch {
    return '';
  }
}

const planCodeOf = (raw) => {
  const value = str(raw, 40).toLowerCase();
  if (value.includes('full')) return 'full';
  return 'basic';
};

async function provisionFromAthar(env, signed) {
  const db = env.DB;
  const body = signed.body;
  const tenantId = adapterRequired(body.tenant_id, 'INVALID_TENANT_ID', 80);
  const slug = adapterRequired(body.slug, 'INVALID_SLUG', 40);
  const displayName = adapterRequired(body.display_name, 'INVALID_DISPLAY_NAME', 160);
  const environment = body.environment === 'demo' ? 'demo'
    : body.environment === 'production' ? 'production' : '';
  if (!environment) throw new HttpError(422, 'INVALID_ENVIRONMENT', 'Environment must be demo or production.');
  const planCode = planCodeOf(adapterRequired(body.plan_code, 'INVALID_PLAN_CODE', 80));
  const config = body.config && typeof body.config === 'object' && !Array.isArray(body.config) ? body.config : {};

  const started = await beginAdapterRequest(db, signed.requestId, 'create', tenantId, signed.requestHash);
  const password = await adminPassword(env.ATHAR_ADAPTER_SECRET, signed.requestId, tenantId);
  if (started.replay) {
    return json({
      ...started.result,
      credentials: { school_id: started.result.external_tenant_id, admin_username: 'admin', admin_password: password },
      replayed: true,
    });
  }

  try {
    const mapped = await db.prepare('SELECT school_id FROM schools WHERE control_tenant_id = ?')
      .bind(tenantId).first();
    if (mapped) throw new HttpError(409, 'TENANT_ALREADY_EXISTS', 'This Athar tenant is already mapped to a school.');

    const schoolId = await externalSchoolId(slug, tenantId);
    const salt = newSalt();
    const hash = await derivePassword(password, salt);
    const now = Date.now();
    const seedVersion = environment === 'demo' ? DEMO_SEED_VERSION : '';
    const profile = {
      name: displayName,
      shortName: displayName,
      plan: planCode,
      phone: str(config.phone, 40),
      address: str(config.address, 300),
      currency: str(config.currency, 8) || 'ILS',
      timezone: str(config.timezone, 60) || 'Asia/Hebron',
    };
    const result = {
      ok: true,
      request_id: signed.requestId,
      tenant_id: tenantId,
      external_tenant_id: schoolId,
      status: 'active',
      environment,
      seed_version: seedVersion,
      public_url: publicSchoolUrl(env, schoolId),
    };

    const statements = [
      db.prepare(
        `INSERT INTO schools
         (school_id, control_tenant_id, slug, name, environment, plan_code, trial_expires_at,
          lifecycle_status, is_active, profile_json, seed_version, provisioned_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?, ?)`,
      ).bind(
        schoolId, tenantId, slug, displayName, environment, planCode,
        body.trial_expires_at || null, JSON.stringify(profile), seedVersion, now, now, now,
      ),
      db.prepare(
        `INSERT INTO school_users
         (id, school_id, username, display_name, role, profile_id, password_hash, password_salt,
          password_iterations, is_active, created_at, updated_at)
         VALUES (?, ?, 'admin', ?, 'admin', '', ?, ?, ?, 1, ?, ?)`,
      ).bind(`admin_${schoolId}`, schoolId, `مدير ${displayName}`, hash, salt, PBKDF2_ITER, now, now),
      db.prepare(
        `INSERT INTO records (school_id, store, id, doc_json, deleted, version, updated_at, updated_by)
         VALUES (?, 'settings', 'schoolProfile', ?, 0, 1, ?, 'system')`,
      ).bind(schoolId, JSON.stringify({ id: 'schoolProfile', key: 'schoolProfile', value: profile }), now),
    ];
    if (environment === 'demo') statements.push(...demoSeedStatements(db, schoolId, now));
    statements.push(
      db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(result), now, signed.requestId),
    );
    await db.batch(statements);
    console.log(JSON.stringify({ event: 'adapter.provision', request_id: signed.requestId, tenant_id: tenantId, status: 'succeeded' }));
    return json({
      ...result,
      credentials: { school_id: schoolId, admin_username: 'admin', admin_password: password },
    }, 201);
  } catch (error) {
    await markAdapterFailed(db, signed.requestId, error instanceof HttpError ? error.code : 'PROVISIONING_FAILED');
    throw error;
  }
}

async function changeTenantStatus(env, signed, tenantIdFromPath) {
  const db = env.DB;
  const tenantId = adapterRequired(tenantIdFromPath, 'INVALID_TENANT_ID', 80);
  const action = str(signed.body.action, 40);
  if (!['suspend', 'resume', 'archive', 'restore'].includes(action)) {
    throw new HttpError(422, 'INVALID_ACTION', 'Lifecycle action is invalid.');
  }
  const started = await beginAdapterRequest(db, signed.requestId, action, tenantId, signed.requestHash);
  if (started.replay) return json({ ...started.result, replayed: true });

  try {
    const school = await db.prepare(
      'SELECT school_id, lifecycle_status FROM schools WHERE control_tenant_id = ?',
    ).bind(tenantId).first();
    if (!school) throw new HttpError(404, 'TENANT_NOT_FOUND', 'Product tenant was not found.');
    const current = String(school.lifecycle_status || 'active');
    if (current === 'archived' && action !== 'archive' && action !== 'restore') {
      throw new HttpError(409, 'TENANT_ARCHIVED', 'An archived tenant must be restored before other changes.');
    }
    if (action === 'restore' && current !== 'archived') {
      throw new HttpError(409, 'TENANT_NOT_ARCHIVED', 'Only an archived tenant can be restored.');
    }
    // الاستعادة تُخرج من الأرشيف وتترك المدرسة موقوفة؛ عودة الخدمة قرار منفصل.
    const next = action === 'resume' ? 'active'
      : action === 'suspend' || action === 'restore' ? 'suspended' : 'archived';
    const active = next === 'active' ? 1 : 0;
    const now = Date.now();
    const result = {
      ok: true, request_id: signed.requestId, tenant_id: tenantId,
      external_tenant_id: school.school_id, status: next,
    };
    const statements = [
      db.prepare('UPDATE schools SET is_active = ?, lifecycle_status = ?, updated_at = ? WHERE control_tenant_id = ?')
        .bind(active, next, now, tenantId),
      db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(result), now, signed.requestId),
    ];
    // الإيقاف يقطع الجلسات القائمة، وإلا بقي جهاز مفتوح يزامن بعد التوقف.
    if (!active) statements.push(db.prepare('DELETE FROM sessions WHERE school_id = ?').bind(school.school_id));
    await db.batch(statements);
    console.log(JSON.stringify({ event: `adapter.${action}`, request_id: signed.requestId, tenant_id: tenantId, status: 'succeeded' }));
    return json(result);
  } catch (error) {
    await markAdapterFailed(db, signed.requestId, error instanceof HttpError ? error.code : 'LIFECYCLE_FAILED');
    throw error;
  }
}

async function changeTenantPlan(env, signed, tenantIdFromPath) {
  const db = env.DB;
  const tenantId = adapterRequired(tenantIdFromPath, 'INVALID_TENANT_ID', 80);
  const planCode = planCodeOf(adapterRequired(signed.body.plan_code, 'INVALID_PLAN_CODE', 80));
  const started = await beginAdapterRequest(db, signed.requestId, 'change_plan', tenantId, signed.requestHash);
  if (started.replay) return json({ ...started.result, replayed: true });

  try {
    const school = await db.prepare('SELECT school_id FROM schools WHERE control_tenant_id = ?')
      .bind(tenantId).first();
    if (!school) throw new HttpError(404, 'TENANT_NOT_FOUND', 'Product tenant was not found.');
    const now = Date.now();
    const result = {
      ok: true, request_id: signed.requestId, tenant_id: tenantId,
      external_tenant_id: school.school_id, plan_code: planCode,
    };
    // النزول من full إلى basic يمنع الوصول ولا يحذف صفًا واحدًا.
    // الترقية لاحقًا تعيد الظهور كما كانت.
    await db.batch([
      db.prepare('UPDATE schools SET plan_code = ?, updated_at = ? WHERE control_tenant_id = ?')
        .bind(planCode, now, tenantId),
      db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(result), now, signed.requestId),
    ]);
    return json(result);
  } catch (error) {
    await markAdapterFailed(db, signed.requestId, error instanceof HttpError ? error.code : 'PLAN_CHANGE_FAILED');
    throw error;
  }
}

async function resetAdminPassword(env, signed, tenantIdFromPath) {
  const db = env.DB;
  const tenantId = adapterRequired(tenantIdFromPath, 'INVALID_TENANT_ID', 80);
  const started = await beginAdapterRequest(db, signed.requestId, 'reset_admin_password', tenantId, signed.requestHash);
  const password = await adminPassword(env.ATHAR_ADAPTER_SECRET, signed.requestId, tenantId);
  if (started.replay) {
    return json({
      ...started.result,
      credentials: { school_id: started.result.external_tenant_id, admin_username: 'admin', admin_password: password },
      replayed: true,
    });
  }
  try {
    const school = await db.prepare(
      'SELECT school_id, lifecycle_status FROM schools WHERE control_tenant_id = ?',
    ).bind(tenantId).first();
    if (!school) throw new HttpError(404, 'TENANT_NOT_FOUND', 'Product tenant was not found.');
    if (String(school.lifecycle_status) === 'archived') {
      throw new HttpError(409, 'TENANT_ARCHIVED', 'An archived tenant cannot receive a new password.');
    }
    const salt = newSalt();
    const hash = await derivePassword(password, salt);
    const now = Date.now();
    const result = {
      ok: true, request_id: signed.requestId, tenant_id: tenantId,
      external_tenant_id: school.school_id, status: 'password_reset',
    };
    await db.batch([
      db.prepare(
        `UPDATE school_users SET password_hash = ?, password_salt = ?, password_iterations = ?,
         is_active = 1, updated_at = ? WHERE school_id = ? AND role = 'admin'`,
      ).bind(hash, salt, PBKDF2_ITER, now, school.school_id),
      db.prepare('DELETE FROM sessions WHERE school_id = ?').bind(school.school_id),
      db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(result), now, signed.requestId),
    ]);
    return json({
      ...result,
      credentials: { school_id: school.school_id, admin_username: 'admin', admin_password: password },
    });
  } catch (error) {
    await markAdapterFailed(db, signed.requestId, error instanceof HttpError ? error.code : 'PASSWORD_RESET_FAILED');
    throw error;
  }
}

// كل جدول يحمل school_id. الحذف النهائي يمر على القائمة كاملة ثم يحذف المدرسة.
const SCHOOL_SCOPED_TABLES = ['sessions', 'records', 'school_users', 'school_audit'];

async function purgeTenant(env, signed, tenantIdFromPath) {
  const db = env.DB;
  const tenantId = adapterRequired(tenantIdFromPath, 'INVALID_TENANT_ID', 80);
  const started = await beginAdapterRequest(db, signed.requestId, 'purge', tenantId, signed.requestHash);
  if (started.replay) return json({ ...started.result, replayed: true });

  try {
    const school = await db.prepare(
      'SELECT school_id, lifecycle_status FROM schools WHERE control_tenant_id = ?',
    ).bind(tenantId).first();
    if (!school) {
      // الحذف idempotent: غياب السجل يعني أن عملية سابقة أتمت المهمة.
      const done = { ok: true, request_id: signed.requestId, tenant_id: tenantId, external_tenant_id: '', status: 'deleted' };
      await db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(done), Date.now(), signed.requestId).run();
      return json(done);
    }
    if (String(school.lifecycle_status) !== 'archived') {
      throw new HttpError(409, 'TENANT_NOT_ARCHIVED', 'A tenant must be archived before it is purged.');
    }
    const now = Date.now();
    const result = {
      ok: true, request_id: signed.requestId, tenant_id: tenantId,
      external_tenant_id: school.school_id, status: 'deleted',
    };
    const statements = SCHOOL_SCOPED_TABLES.map((table) =>
      db.prepare(`DELETE FROM ${table} WHERE school_id = ?`).bind(school.school_id));
    statements.push(
      db.prepare('DELETE FROM schools WHERE control_tenant_id = ?').bind(tenantId),
      db.prepare(
        `UPDATE adapter_requests SET status = 'succeeded', response_json = ?, error_code = '', completed_at = ?
         WHERE request_id = ?`,
      ).bind(JSON.stringify(result), now, signed.requestId),
    );
    await db.batch(statements);
    console.log(JSON.stringify({ event: 'adapter.purge', request_id: signed.requestId, tenant_id: tenantId, status: 'succeeded' }));
    return json(result);
  } catch (error) {
    await markAdapterFailed(db, signed.requestId, error instanceof HttpError ? error.code : 'PURGE_FAILED');
    throw error;
  }
}

async function tenantHealth(env, requestId, tenantIdFromPath) {
  const tenantId = adapterRequired(tenantIdFromPath, 'INVALID_TENANT_ID', 80);
  const school = await env.DB.prepare(
    'SELECT school_id, environment, plan_code, lifecycle_status, is_active FROM schools WHERE control_tenant_id = ?',
  ).bind(tenantId).first();
  if (!school) throw new HttpError(404, 'TENANT_NOT_FOUND', 'Product tenant was not found.');
  return json({
    ok: true, request_id: requestId, tenant_id: tenantId,
    external_tenant_id: school.school_id, environment: school.environment,
    plan_code: school.plan_code, status: school.lifecycle_status,
    active: Boolean(school.is_active), checked_at: new Date().toISOString(),
  });
}

async function handleAdapter(request, env) {
  let signed;
  try {
    signed = await verifyAdapterRequest(request, env);
    const path = new URL(request.url).pathname;
    const method = request.method;
    if (path === '/internal/v1/tenants' && method === 'POST') return await provisionFromAthar(env, signed);

    const statusMatch = path.match(/^\/internal\/v1\/tenants\/([^/]+)\/status$/);
    if (statusMatch && method === 'POST') return await changeTenantStatus(env, signed, decodeURIComponent(statusMatch[1]));

    const planMatch = path.match(/^\/internal\/v1\/tenants\/([^/]+)\/plan$/);
    if (planMatch && method === 'POST') return await changeTenantPlan(env, signed, decodeURIComponent(planMatch[1]));

    const passwordMatch = path.match(/^\/internal\/v1\/tenants\/([^/]+)\/reset-admin-password$/);
    if (passwordMatch && method === 'POST') return await resetAdminPassword(env, signed, decodeURIComponent(passwordMatch[1]));

    const healthMatch = path.match(/^\/internal\/v1\/tenants\/([^/]+)\/health$/);
    if (healthMatch && method === 'GET') return await tenantHealth(env, signed.requestId, decodeURIComponent(healthMatch[1]));

    const purgeMatch = path.match(/^\/internal\/v1\/tenants\/([^/]+)$/);
    if (purgeMatch && method === 'DELETE') return await purgeTenant(env, signed, decodeURIComponent(purgeMatch[1]));

    throw new HttpError(404, 'NOT_FOUND', 'Adapter route was not found.');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'SERVER_ERROR';
    const message = error instanceof HttpError ? error.message : 'Unexpected product adapter failure.';
    console.error(JSON.stringify({
      event: 'adapter.error',
      request_id: signed?.requestId || '',
      code,
      status,
      error_name: error instanceof Error ? error.name : 'UnknownError',
      error_message: String(error instanceof Error ? error.message : error).slice(0, 300),
    }));
    return json({ ok: false, error: code, message, request_id: signed?.requestId || '' }, status);
  }
}

/* ==================== محاولات الدخول ==================== */

async function checkLock(db, key) {
  const row = await db.prepare('SELECT fails, locked_until FROM login_attempts WHERE key = ?').bind(key).first();
  if (!row) return 0;
  const remaining = Number(row.locked_until || 0) - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

async function noteFail(db, key) {
  const row = await db.prepare('SELECT fails FROM login_attempts WHERE key = ?').bind(key).first();
  const fails = Number(row?.fails || 0) + 1;
  const step = Math.min(Math.max(fails - MAX_FAILS, 0), LOCK_STEPS_MS.length - 1);
  const lockedUntil = fails >= MAX_FAILS ? Date.now() + LOCK_STEPS_MS[step] : 0;
  await db.prepare(
    `INSERT INTO login_attempts (key, fails, locked_until) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until`,
  ).bind(key, fails, lockedUntil).run();
}

const clearFails = (db, key) => db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();

/* ==================== الجلسات ==================== */

/**
 * الجلسة هي مصدر `school_id` الوحيد. لا يوجد مسار يقرأ المدرسة من الطلب،
 * فلا يستطيع متصفح أن يطلب بيانات مدرسة ليست له مهما عدّل الجسم أو الترويسات.
 */
async function requireSession(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.');
  const session = await env.DB.prepare(
    `SELECT s.school_id, s.user_id, s.role, s.profile_id, s.expires_at,
            sc.plan_code, sc.is_active, sc.lifecycle_status
     FROM sessions s JOIN schools sc ON sc.school_id = s.school_id
     WHERE s.token_hash = ?`,
  ).bind(await sha256b64(token)).first();
  if (!session) throw new HttpError(401, 'UNAUTHORIZED', 'Session is invalid.');
  if (Number(session.expires_at) < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256b64(token)).run();
    throw new HttpError(401, 'SESSION_EXPIRED', 'Session has expired.');
  }
  if (!Number(session.is_active)) {
    throw new HttpError(403, 'SUBSCRIPTION_SUSPENDED', 'This school is currently suspended.');
  }
  return session;
}

async function login(request, env) {
  const bytes = await readBoundedBody(request, 4096);
  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request JSON is invalid.');
  }
  const schoolId = str(body.school_id, 80).trim();
  const username = str(body.username, 60).trim().toLowerCase();
  const password = str(body.password, 200);
  if (!schoolId || !username || !password) {
    throw new HttpError(400, 'BAD_REQUEST', 'School, username, and password are required.');
  }

  const ip = request.headers.get('CF-Connecting-IP') || '0';
  const lockKey = `${schoolId}|${username}|${ip}`;
  const locked = await checkLock(env.DB, lockKey);
  if (locked) throw new HttpError(429, 'LOCKED', `Too many attempts. Retry in ${locked}s.`);

  const school = await env.DB.prepare(
    'SELECT school_id, is_active, plan_code, environment FROM schools WHERE school_id = ?',
  ).bind(schoolId).first();
  if (!school) {
    await noteFail(env.DB, lockKey);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
  }
  if (!Number(school.is_active)) {
    throw new HttpError(403, 'SUBSCRIPTION_SUSPENDED', 'This school is currently suspended.');
  }

  const user = await env.DB.prepare(
    `SELECT id, username, display_name, role, profile_id, password_hash, password_salt, password_iterations
     FROM school_users WHERE school_id = ? AND username = ? AND is_active = 1`,
  ).bind(schoolId, username).first();
  if (!user) {
    await noteFail(env.DB, lockKey);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
  }
  const derived = await derivePassword(password, user.password_salt, Number(user.password_iterations) || PBKDF2_ITER);
  if (!safeEqual(derived, user.password_hash)) {
    await noteFail(env.DB, lockKey);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
  }
  await clearFails(env.DB, lockKey);

  const token = newToken();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, school_id, user_id, role, profile_id, device_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    await sha256b64(token), schoolId, user.id, user.role, user.profile_id,
    str(body.device_id, 60), now, now + SESSION_TTL_MS,
  ).run();

  return json({
    ok: true,
    token,
    expires_at: now + SESSION_TTL_MS,
    school: { id: schoolId, plan_code: school.plan_code, environment: school.environment },
    user: { id: user.id, username: user.username, name: user.display_name, role: user.role, profile_id: user.profile_id },
  });
}

/* ==================== نطاق الطالب وولي الأمر ==================== */

/**
 * الطلاب الذين يحق للجلسة رؤيتهم. الطالب نفسه؛ وولي الأمر أبناؤه عبر
 * `studentGuardians`. يُحسب من الخادم لا من قيمة يرسلها المتصفح.
 */
async function resolveScope(env, session) {
  const scope = { userId: session.user_id, profileId: session.profile_id, studentIds: new Set() };
  if (session.role === 'admin' || session.role === 'teacher') return scope;
  if (!session.profile_id) return scope;

  if (session.role === 'student') {
    scope.studentIds.add(String(session.profile_id));
    return scope;
  }
  const links = await env.DB.prepare(
    "SELECT doc_json FROM records WHERE school_id = ? AND store = 'studentGuardians' AND deleted = 0",
  ).bind(session.school_id).all();
  for (const row of links.results || []) {
    try {
      const doc = JSON.parse(row.doc_json);
      if (String(doc.guardianId) === String(session.profile_id)) scope.studentIds.add(String(doc.studentId));
    } catch { /* مستند تالف يُتجاهل ولا يوسّع النطاق */ }
  }
  return scope;
}

/* ==================== المزامنة ==================== */

async function pull(request, env, session) {
  const url = new URL(request.url);
  const since = num(url.searchParams.get('since'));
  const requested = str(url.searchParams.get('stores'), 600);
  const allowed = readableStores(session.role, session.plan_code);
  const stores = requested
    ? requested.split(',').map((s) => s.trim()).filter((s) => allowed.includes(s))
    : allowed;
  if (!stores.length) return json({ ok: true, since, cursor: since, stores: {}, complete: true });

  const scope = await resolveScope(env, session);
  const placeholders = stores.map(() => '?').join(',');
  // الاستعلام يبدأ بـschool_id من الجلسة. لا مسار يمرر مدرسة من الطلب.
  const rows = await env.DB.prepare(
    `SELECT store, id, doc_json, deleted, version, updated_at
     FROM records
     WHERE school_id = ? AND store IN (${placeholders}) AND updated_at > ?
     ORDER BY updated_at, store, id
     LIMIT ?`,
  ).bind(session.school_id, ...stores, since, PULL_LIMIT + 1).all();

  const all = rows.results || [];
  const page = all.slice(0, PULL_LIMIT);
  const grouped = {};
  let cursor = since;
  for (const row of page) {
    cursor = Math.max(cursor, Number(row.updated_at));
    let doc;
    try {
      doc = JSON.parse(row.doc_json);
    } catch {
      continue;
    }
    if (!rowVisibleTo(session.role, row.store, doc, scope)) continue;
    (grouped[row.store] ||= []).push({
      id: row.id,
      deleted: Number(row.deleted) === 1,
      version: Number(row.version),
      updated_at: Number(row.updated_at),
      doc,
    });
  }

  // قائمة المستخدمين تُبنى من `school_users` بلا تجزئة ولا ملح.
  // لو كانت في `records` لخرجت أسرار الدخول إلى كل متصفح يزامن.
  let users = [];
  if (session.role === 'admin') {
    const userRows = await env.DB.prepare(
      `SELECT id, username, display_name, role, profile_id, is_active, updated_at
       FROM school_users WHERE school_id = ? AND updated_at > ? ORDER BY updated_at LIMIT 500`,
    ).bind(session.school_id, since).all();
    users = userRows.results || [];
  }

  return json({
    ok: true,
    since,
    cursor,
    first_sync: since === 0,
    stores: grouped,
    users,
    plan_code: session.plan_code,
    // المزامنة على دفعات: العميل يعيد الطلب بالمؤشر الجديد حتى يكتمل.
    complete: all.length <= PULL_LIMIT,
  });
}

async function push(request, env, session) {
  const bytes = await readBoundedBody(request, API_MAX_BODY_BYTES);
  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request JSON is invalid.');
  }
  const changes = Array.isArray(body.changes) ? body.changes : [];
  if (changes.length > PUSH_LIMIT) {
    throw new HttpError(413, 'TOO_MANY_CHANGES', `Send at most ${PUSH_LIMIT} changes per request.`);
  }

  const now = Date.now();
  const statements = [];
  const rejected = [];
  const accepted = [];

  for (const change of changes) {
    const store = str(change?.store, 60);
    const id = str(change?.id, 120);
    if (!isKnownStore(store) || !id) {
      rejected.push({ store, id, code: 'UNKNOWN_STORE' });
      continue;
    }
    if (!canWrite(session.role, session.plan_code, store)) {
      // نفرّق بين «ليست في باقتك» و«ليست من صلاحيتك» ليعرف المشغّل ما يفعل.
      rejected.push({
        store,
        id,
        code: canWrite('admin', session.plan_code, store) ? 'ROLE_FORBIDDEN' : 'PLAN_FORBIDDEN',
      });
      continue;
    }
    const deleted = change?.deleted === true;
    let doc = change?.doc;
    if (!deleted && (!doc || typeof doc !== 'object' || Array.isArray(doc))) {
      rejected.push({ store, id, code: 'INVALID_DOC' });
      continue;
    }
    doc = deleted ? { id } : { ...doc, id };
    const payload = JSON.stringify(doc);
    if (payload.length > 64 * 1024) {
      rejected.push({ store, id, code: 'DOC_TOO_LARGE' });
      continue;
    }

    // آخر كتابة تفوز، لكن العدّاد يرتفع دائمًا فيستطيع العميل كشف التعارض.
    statements.push(env.DB.prepare(
      `INSERT INTO records (school_id, store, id, doc_json, deleted, version, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)
       ON CONFLICT(school_id, store, id) DO UPDATE SET
         doc_json = excluded.doc_json,
         deleted = excluded.deleted,
         version = records.version + 1,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    ).bind(session.school_id, store, id, payload, deleted ? 1 : 0, now, session.user_id));
    accepted.push({ store, id });
  }

  if (statements.length) await env.DB.batch(statements);
  return json({ ok: true, accepted: accepted.length, rejected, cursor: now });
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/health' && request.method === 'GET') {
    return json({ ok: true, service: 'athar-school', version: '1.0.0' });
  }
  if (path === '/api/login' && request.method === 'POST') return login(request, env);

  const session = await requireSession(request, env);
  if (path === '/api/logout' && request.method === 'POST') {
    const token = (request.headers.get('Authorization') || '').slice(7);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256b64(token)).run();
    return json({ ok: true });
  }
  if (path === '/api/pull' && request.method === 'GET') return pull(request, env, session);
  if (path === '/api/push' && request.method === 'POST') return push(request, env, session);

  throw new HttpError(404, 'NOT_FOUND', 'Route was not found.');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/internal/v1/')) return handleAdapter(request, env);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
    try {
      return await handleApi(request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ ok: false, error: error.code, message: error.message }, error.status);
      }
      console.error(JSON.stringify({
        event: 'request.error',
        path: url.pathname,
        error_name: error instanceof Error ? error.name : 'UnknownError',
        error_message: String(error instanceof Error ? error.message : error).slice(0, 300),
      }));
      return json({ ok: false, error: 'SERVER_ERROR', message: 'Unexpected failure.' }, 500);
    }
  },
};

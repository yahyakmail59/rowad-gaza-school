const APP_VERSION = '1.4.0';
const DB_NAME = 'AlSalamSchoolDB';
const DB_VERSION = 1;
const DEMO_PASSWORD = 'Salam@123';
const SCHOOL_NAME = 'مدرسة رواد غزة الثانوية';
const SCHOOL_SHORT_NAME = 'رواد غزة الثانوية';
const SCHOOL_LOGO = 'assets/images/ruwad-gaza-school-logo.jpg';
const BACKUP_FORMAT = 'ruwad-gaza-secondary-school-backup';
const LEGACY_BACKUP_FORMAT = 'al-salam-school-backup';

const ROLES = {
  admin: { label: 'مدير النظام', short: 'مدير', initial: 'م', avatar: 'avatar--blue' },
  teacher: { label: 'مدرس', short: 'مدرس', initial: 'ع', avatar: 'avatar--green' },
  student: { label: 'طالب', short: 'طالب', initial: 'ط', avatar: 'avatar--red' },
  guardian: { label: 'ولي أمر', short: 'ولي أمر', initial: 'و', avatar: 'avatar--navy' },
};

const SCHEMA = {
  settings: { indexes: [['key', 'key', { unique: true }]] },
  users: { indexes: [['username', 'username', { unique: true }], ['role', 'role'], ['status', 'status'], ['profileId', 'profileId']] },
  academicYears: { indexes: [['isActive', 'isActive'], ['name', 'name']] },
  gradeLevels: { indexes: [['code', 'code', { unique: true }], ['order', 'order'], ['status', 'status']] },
  sections: { indexes: [['academicYearId', 'academicYearId'], ['gradeLevelId', 'gradeLevelId'], ['status', 'status']] },
  students: { indexes: [['admissionNo', 'admissionNo', { unique: true }], ['fullNameNormalized', 'fullNameNormalized'], ['status', 'status']] },
  guardians: { indexes: [['phone', 'phone'], ['fullNameNormalized', 'fullNameNormalized'], ['status', 'status']] },
  studentGuardians: { indexes: [['studentId', 'studentId'], ['guardianId', 'guardianId']] },
  enrollments: { indexes: [['studentId', 'studentId'], ['sectionId', 'sectionId'], ['academicYearId', 'academicYearId'], ['status', 'status']] },
  teachers: { indexes: [['employeeNo', 'employeeNo', { unique: true }], ['fullNameNormalized', 'fullNameNormalized'], ['status', 'status']] },
  subjects: { indexes: [['code', 'code', { unique: true }], ['status', 'status']] },
  teachingAssignments: { indexes: [['teacherId', 'teacherId'], ['subjectId', 'subjectId'], ['sectionId', 'sectionId'], ['academicYearId', 'academicYearId']] },
  timetableSlots: { indexes: [['teacherId', 'teacherId'], ['sectionId', 'sectionId'], ['dayOfWeek', 'dayOfWeek'], ['status', 'status']] },
  attendanceSessions: { indexes: [['date', 'date'], ['sectionId', 'sectionId'], ['status', 'status']] },
  attendanceRecords: { indexes: [['sessionId', 'sessionId'], ['studentId', 'studentId'], ['status', 'status']] },
  assessments: { indexes: [['sectionId', 'sectionId'], ['subjectId', 'subjectId'], ['teacherId', 'teacherId'], ['status', 'status']] },
  gradeEntries: { indexes: [['assessmentId', 'assessmentId'], ['studentId', 'studentId'], ['entryStatus', 'entryStatus']] },
  feePlans: { indexes: [['academicYearId', 'academicYearId'], ['gradeLevelId', 'gradeLevelId'], ['status', 'status']] },
  invoices: { indexes: [['invoiceNo', 'invoiceNo', { unique: true }], ['studentId', 'studentId'], ['dueDate', 'dueDate'], ['status', 'status']] },
  payments: { indexes: [['receiptNo', 'receiptNo', { unique: true }], ['invoiceId', 'invoiceId'], ['studentId', 'studentId'], ['status', 'status']] },
  certificates: { indexes: [['certificateNo', 'certificateNo', { unique: true }], ['studentId', 'studentId'], ['status', 'status']] },
  notifications: { indexes: [['userId', 'userId'], ['isRead', 'isRead'], ['createdAt', 'createdAt']] },
  auditLogs: { indexes: [['userId', 'userId'], ['entityType', 'entityType'], ['entityId', 'entityId'], ['createdAt', 'createdAt']] },
};

const NAVIGATION = [
  { section: 'الرئيسية', items: [
    { route: 'dashboard', label: 'لوحة التحكم', icon: '⌂', roles: ['admin', 'teacher', 'student', 'guardian'] },
  ]},
  { section: 'الإدارة الأكاديمية', items: [
    { route: 'students', label: 'الطلاب', icon: '♙', roles: ['admin', 'teacher', 'student', 'guardian'] },
    { route: 'guardians', label: 'أولياء الأمور', icon: '♧', roles: ['admin'] },
    { route: 'teachers', label: 'المعلمون', icon: '♜', roles: ['admin', 'teacher', 'student', 'guardian'] },
    { route: 'academics', label: 'الفصول والمواد', icon: '▦', roles: ['admin', 'teacher'] },
    { route: 'timetable', label: 'الجدول الدراسي', icon: '▤', roles: ['admin', 'teacher', 'student', 'guardian'] },
    { route: 'attendance', label: 'الحضور والغياب', icon: '✓', roles: ['admin', 'teacher', 'student', 'guardian'] },
    { route: 'grades', label: 'الدرجات والتقييمات', icon: '◇', roles: ['admin', 'teacher', 'student', 'guardian'] },
    { route: 'certificates', label: 'الشهادات', icon: '▱', roles: ['admin', 'teacher', 'student', 'guardian'] },
  ]},
  { section: 'المالية والتقارير', items: [
    { route: 'finance', label: 'الرسوم والمدفوعات', icon: '₪', roles: ['admin', 'student', 'guardian'] },
    { route: 'reports', label: 'التقارير والتحليلات', icon: '⌁', roles: ['admin', 'teacher'] },
  ]},
  { section: 'النظام', items: [
    { route: 'users', label: 'المستخدمون', icon: '⚿', roles: ['admin'] },
    { route: 'settings', label: 'الإعدادات والنسخ', icon: '⚙', roles: ['admin'] },
  ]},
];

const ROUTE_META = Object.fromEntries(NAVIGATION.flatMap(group => group.items).map(item => [item.route, item]));
ROUTE_META.profile = { route: 'profile', label: 'الملف الشخصي', roles: Object.keys(ROLES) };
ROUTE_META.notifications = { route: 'notifications', label: 'الإشعارات', roles: Object.keys(ROLES) };

const state = {
  db: null,
  user: null,
  route: 'dashboard',
  modalReturnFocus: null,
  filters: {},
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const nowIso = () => new Date().toISOString();
const uid = (prefix = 'id') => `${prefix}-${crypto.randomUUID()}`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const normalizeArabic = value => String(value ?? '').trim().toLowerCase()
  .normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const formatDate = (value, options = {}) => value ? new Intl.DateTimeFormat('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric', ...options }).format(new Date(value)) : '—';
const formatTime = value => value ? new Intl.DateTimeFormat('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
const formatNumber = value => new Intl.NumberFormat('ar-EG-u-nu-latn').format(Number(value || 0));
const formatMoney = minor => new Intl.NumberFormat('ar-EG-u-nu-latn', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(Number(minor || 0) / 100);
const roleInfo = role => ROLES[role] || ROLES.student;
const statusLabel = status => ({ active: 'نشط', archived: 'مؤرشف', suspended: 'موقوف', present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'بعذر', passed: 'ناجح', failed: 'يحتاج متابعة', draft: 'مسودة', submitted: 'للمراجعة', approved: 'معتمد', published: 'منشور', unpaid: 'غير مدفوعة', partial: 'جزئية', paid: 'مدفوعة', overdue: 'متأخرة', posted: 'مرحلة', voided: 'ملغاة', open: 'مفتوحة', closed: 'مغلقة' })[status] || status || '—';
const statusClass = status => ({ active: 'success', present: 'success', passed: 'success', paid: 'success', posted: 'success', approved: 'success', published: 'info', draft: 'neutral', submitted: 'warning', partial: 'warning', late: 'warning', failed: 'danger', unpaid: 'danger', overdue: 'danger', absent: 'danger', suspended: 'danger', voided: 'danger', archived: 'neutral', excused: 'info', open: 'info', closed: 'neutral' })[status] || 'neutral';
const statusBadge = status => `<span class="status status--${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>`;

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('فشلت عملية قاعدة البيانات'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error('أُلغيت المعاملة'));
    transaction.onerror = () => reject(transaction.error || new Error('فشلت المعاملة'));
  });
}

async function openDatabase() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = event => {
    const db = event.target.result;
    for (const [storeName, config] of Object.entries(SCHEMA)) {
      const store = db.objectStoreNames.contains(storeName)
        ? event.target.transaction.objectStore(storeName)
        : db.createObjectStore(storeName, { keyPath: 'id' });
      for (const [indexName, keyPath, options = {}] of config.indexes) {
        if (!store.indexNames.contains(indexName)) store.createIndex(indexName, keyPath, options);
      }
    }
  };
  state.db = await requestPromise(request);
  state.db.onversionchange = () => state.db.close();
  return state.db;
}

async function dbGet(storeName, id) {
  const tx = state.db.transaction(storeName, 'readonly');
  return requestPromise(tx.objectStore(storeName).get(id));
}

async function dbGetAll(storeName) {
  const tx = state.db.transaction(storeName, 'readonly');
  return requestPromise(tx.objectStore(storeName).getAll());
}

async function dbIndexAll(storeName, indexName, value) {
  const tx = state.db.transaction(storeName, 'readonly');
  return requestPromise(tx.objectStore(storeName).index(indexName).getAll(value));
}

async function dbPut(storeName, record) {
  const tx = state.db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(record);
  await transactionDone(tx);
  return record;
}

async function dbBulkPut(storeName, records) {
  if (!records.length) return;
  const tx = state.db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const record of records) store.put(record);
  await transactionDone(tx);
}

async function dbCount(storeName) {
  const tx = state.db.transaction(storeName, 'readonly');
  return requestPromise(tx.objectStore(storeName).count());
}

async function atomicWrite(storeNames, work) {
  const tx = state.db.transaction(storeNames, 'readwrite');
  const stores = Object.fromEntries(storeNames.map(name => [name, tx.objectStore(name)]));
  await work(stores, tx);
  await transactionDone(tx);
}

function auditRecord(action, entityType, entityId, beforeSummary = null, afterSummary = null, reason = null) {
  return {
    id: uid('audit'), userId: state.user?.id || 'system', action, entityType, entityId,
    beforeSummary, afterSummary, reason, createdAt: nowIso(), sessionId: sessionStorage.getItem('school_session_id') || 'system',
  };
}

async function audit(action, entityType, entityId, before = null, after = null, reason = null) {
  const redact = value => {
    if (!value) return null;
    const copy = { ...value };
    for (const key of ['passwordHash', 'passwordSalt', 'passwordIterations']) delete copy[key];
    return copy;
  };
  await dbPut('auditLogs', auditRecord(action, entityType, entityId, redact(before), redact(after), reason));
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function derivePassword(password, saltBase64 = null, iterations = 120000) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return { hash: bytesToBase64(bits), salt: bytesToBase64(salt), iterations };
}

async function verifyPassword(password, user) {
  const derived = await derivePassword(password, user.passwordSalt, user.passwordIterations);
  return derived.hash === user.passwordHash;
}

function baseRecord(id, extra = {}) {
  const time = nowIso();
  return { id, createdAt: time, createdBy: 'system', updatedAt: time, updatedBy: 'system', status: 'active', archivedAt: null, archivedBy: null, ...extra };
}

async function ensureSeedData() {
  const existing = (await dbIndexAll('settings', 'key', 'seedVersion'))[0];
  if (existing?.value === 1) return;

  const password = await derivePassword(DEMO_PASSWORD);
  const year = baseRecord('year-2026', { name: '2026 / 2027', startsOn: '2026-08-20', endsOn: '2027-06-15', isActive: true, terms: [
    { id: 'term-1', name: 'الفصل الأول', startsOn: '2026-08-20', endsOn: '2027-01-15' },
    { id: 'term-2', name: 'الفصل الثاني', startsOn: '2027-01-25', endsOn: '2027-06-15' },
  ]});
  const grades = [
    baseRecord('grade-7', { code: 'G07', name: 'الصف السابع', stage: 'المرحلة الأساسية العليا', order: 7 }),
    baseRecord('grade-8', { code: 'G08', name: 'الصف الثامن', stage: 'المرحلة الأساسية العليا', order: 8 }),
    baseRecord('grade-9', { code: 'G09', name: 'الصف التاسع', stage: 'المرحلة الأساسية العليا', order: 9 }),
  ];
  const teachers = [
    baseRecord('teacher-1', { employeeNo: 'T-1001', fullName: 'أحمد الخطيب', fullNameNormalized: normalizeArabic('أحمد الخطيب'), phone: '0599001001', email: 'ahmad@alsalam.local', specialty: 'الرياضيات', hiredOn: '2020-08-15' }),
    baseRecord('teacher-2', { employeeNo: 'T-1002', fullName: 'سارة منصور', fullNameNormalized: normalizeArabic('سارة منصور'), phone: '0599001002', email: 'sara@alsalam.local', specialty: 'اللغة العربية', hiredOn: '2019-08-20' }),
    baseRecord('teacher-3', { employeeNo: 'T-1003', fullName: 'خالد سالم', fullNameNormalized: normalizeArabic('خالد سالم'), phone: '0599001003', email: 'khaled@alsalam.local', specialty: 'العلوم', hiredOn: '2021-01-10' }),
    baseRecord('teacher-4', { employeeNo: 'T-1004', fullName: 'ليان عودة', fullNameNormalized: normalizeArabic('ليان عودة'), phone: '0599001004', email: 'layan@alsalam.local', specialty: 'اللغة الإنجليزية', hiredOn: '2022-08-15' }),
  ];
  const sections = [
    baseRecord('section-7a', { academicYearId: year.id, gradeLevelId: 'grade-7', name: 'السابع أ', capacity: 30, homeroomTeacherId: 'teacher-1', room: 'A-07' }),
    baseRecord('section-7b', { academicYearId: year.id, gradeLevelId: 'grade-7', name: 'السابع ب', capacity: 30, homeroomTeacherId: 'teacher-2', room: 'B-07' }),
    baseRecord('section-8a', { academicYearId: year.id, gradeLevelId: 'grade-8', name: 'الثامن أ', capacity: 28, homeroomTeacherId: 'teacher-3', room: 'A-08' }),
    baseRecord('section-9a', { academicYearId: year.id, gradeLevelId: 'grade-9', name: 'التاسع أ', capacity: 28, homeroomTeacherId: 'teacher-4', room: 'A-09' }),
  ];
  const subjects = [
    baseRecord('subject-math', { code: 'MATH', name: 'الرياضيات', gradeLevelIds: grades.map(g => g.id), maxScore: 100, passScore: 50, color: '#155EEF' }),
    baseRecord('subject-arabic', { code: 'ARAB', name: 'اللغة العربية', gradeLevelIds: grades.map(g => g.id), maxScore: 100, passScore: 50, color: '#079455' }),
    baseRecord('subject-science', { code: 'SCI', name: 'العلوم', gradeLevelIds: grades.map(g => g.id), maxScore: 100, passScore: 50, color: '#D92D20' }),
    baseRecord('subject-english', { code: 'ENG', name: 'اللغة الإنجليزية', gradeLevelIds: grades.map(g => g.id), maxScore: 100, passScore: 50, color: '#7F56D9' }),
    baseRecord('subject-social', { code: 'SOC', name: 'الدراسات الاجتماعية', gradeLevelIds: grades.map(g => g.id), maxScore: 100, passScore: 50, color: '#F79009' }),
  ];

  const firstNames = ['يوسف', 'مريم', 'عمر', 'لينا', 'محمد', 'نور', 'آدم', 'جنى', 'رامي', 'سلمى', 'يزن', 'تالا', 'أيهم', 'رنا', 'مالك', 'شهد', 'كرم', 'دانا', 'سامر', 'فرح', 'أنس', 'ريم', 'سيف', 'هبة'];
  const lastNames = ['حمدان', 'النجار', 'سالم', 'عودة', 'شاهين', 'أبو عيشة', 'منصور', 'الخطيب'];
  const students = firstNames.map((name, index) => baseRecord(`student-${index + 1}`, {
    admissionNo: `AS-${String(2026001 + index)}`,
    fullName: `${name} ${lastNames[index % lastNames.length]}`,
    fullNameNormalized: normalizeArabic(`${name} ${lastNames[index % lastNames.length]}`),
    gender: index % 2 ? 'female' : 'male',
    birthDate: `${2012 + Math.floor(index / 16)}-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 24) + 1).padStart(2, '0')}`,
    phone: `05991${String(index).padStart(5, '0')}`,
    address: ['رام الله', 'البيرة', 'بيتونيا', 'بيرزيت'][index % 4],
  }));
  const guardians = Array.from({ length: 12 }, (_, index) => baseRecord(`guardian-${index + 1}`, {
    fullName: `${index % 2 ? 'أم' : 'أب'} ${students[index * 2]?.fullName || students[index].fullName}`,
    fullNameNormalized: normalizeArabic(`${index % 2 ? 'أم' : 'أب'} ${students[index * 2]?.fullName || students[index].fullName}`),
    phone: `05988${String(index).padStart(5, '0')}`,
    email: `guardian${index + 1}@example.local`,
    relation: index % 2 ? 'الأم' : 'الأب',
    address: ['رام الله', 'البيرة', 'بيتونيا'][index % 3],
  }));
  const studentGuardians = students.map((student, index) => baseRecord(`sg-${index + 1}`, {
    studentId: student.id, guardianId: `guardian-${Math.floor(index / 2) + 1}`, relation: index % 2 ? 'الأم' : 'الأب', isPrimary: index % 2 === 0, canCollect: true, receivesNotices: true,
  }));
  const enrollments = students.map((student, index) => baseRecord(`enrollment-${index + 1}`, {
    studentId: student.id, academicYearId: year.id, sectionId: sections[Math.floor(index / 6) % sections.length].id, enrolledOn: '2026-08-20', rollNo: (index % 6) + 1,
  }));
  const assignments = [
    ['assignment-1','teacher-1','subject-math','section-7a'], ['assignment-2','teacher-1','subject-math','section-7b'],
    ['assignment-3','teacher-2','subject-arabic','section-7a'], ['assignment-4','teacher-2','subject-arabic','section-7b'],
    ['assignment-5','teacher-3','subject-science','section-8a'], ['assignment-6','teacher-4','subject-english','section-9a'],
    ['assignment-7','teacher-3','subject-science','section-7a'], ['assignment-8','teacher-4','subject-english','section-7a'],
  ].map(([id, teacherId, subjectId, sectionId]) => baseRecord(id, { academicYearId: year.id, termId: 'term-1', teacherId, subjectId, sectionId, startsOn: year.startsOn, endsOn: year.endsOn }));

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timetable = [];
  for (let day = 0; day < 5; day += 1) {
    for (let period = 1; period <= 4; period += 1) {
      const assignment = assignments[(day * 4 + period - 1) % assignments.length];
      timetable.push(baseRecord(`slot-${day + 1}-${period}`, {
        academicYearId: year.id, termId: 'term-1', dayOfWeek: day + 1, dayName: dayNames[day], periodNo: period,
        startsAt: `${String(7 + period).padStart(2, '0')}:00`, endsAt: `${String(7 + period).padStart(2, '0')}:45`,
        sectionId: assignment.sectionId, subjectId: assignment.subjectId, teacherId: assignment.teacherId,
        roomId: sections.find(s => s.id === assignment.sectionId)?.room, status: 'published', publishedAt: nowIso(),
      }));
    }
  }

  const attendanceSessions = [];
  const attendanceRecords = [];
  for (let offset = 12; offset >= 0; offset -= 1) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    if ([5, 6].includes(date.getDay())) continue;
    for (const section of sections) {
      const sessionId = `attendance-${section.id}-${date.toISOString().slice(0, 10)}`;
      attendanceSessions.push(baseRecord(sessionId, { date: date.toISOString().slice(0, 10), sectionId: section.id, timetableSlotId: null, mode: 'daily', status: 'closed', openedAt: date.toISOString(), closedAt: date.toISOString(), closedBy: 'user-admin' }));
      const sectionEnrollments = enrollments.filter(e => e.sectionId === section.id);
      for (const enrollment of sectionEnrollments) {
        const n = Number(enrollment.studentId.split('-')[1]);
        const attStatus = (n + offset) % 13 === 0 ? 'absent' : (n + offset) % 9 === 0 ? 'late' : 'present';
        attendanceRecords.push(baseRecord(`ar-${sessionId}-${enrollment.studentId}`, { sessionId, studentId: enrollment.studentId, status: attStatus, lateMinutes: attStatus === 'late' ? 10 : 0, reasonCode: null, note: '' }));
      }
    }
  }

  const assessments = assignments.slice(0, 6).map((assignment, index) => baseRecord(`assessment-${index + 1}`, {
    academicYearId: year.id, termId: 'term-1', sectionId: assignment.sectionId, subjectId: assignment.subjectId, teacherId: assignment.teacherId,
    name: index % 2 ? 'واجب الوحدة الأولى' : 'اختبار الشهر الأول', type: index % 2 ? 'assignment' : 'exam', date: '2026-09-25', maxScore: index % 2 ? 20 : 40,
    weightBasisPoints: index % 2 ? 2000 : 4000, status: 'published', submittedAt: nowIso(), approvedAt: nowIso(), publishedAt: nowIso(),
  }));
  const gradeEntries = [];
  for (const assessment of assessments) {
    const sectionStudents = enrollments.filter(e => e.sectionId === assessment.sectionId);
    for (const enrollment of sectionStudents) {
      const n = Number(enrollment.studentId.split('-')[1]);
      const score = Math.max(0, assessment.maxScore - ((n * 3 + Number(assessment.id.split('-')[1])) % Math.ceil(assessment.maxScore * .45)));
      gradeEntries.push(baseRecord(`ge-${assessment.id}-${enrollment.studentId}`, { assessmentId: assessment.id, studentId: enrollment.studentId, score, entryStatus: 'graded', note: '' }));
    }
  }

  const feePlans = grades.map((grade, index) => baseRecord(`fee-plan-${index + 1}`, { academicYearId: year.id, gradeLevelId: grade.id, name: `رسوم ${grade.name}`, items: [
    { code: 'TUITION', label: 'القسط الدراسي', amountMinor: 180000 + index * 10000 },
    { code: 'ACTIVITY', label: 'الأنشطة', amountMinor: 20000 },
  ], totalMinor: 200000 + index * 10000 }));
  const invoices = students.map((student, index) => {
    const enrollment = enrollments[index];
    const section = sections.find(s => s.id === enrollment.sectionId);
    const gradeIndex = grades.findIndex(g => g.id === section.gradeLevelId);
    const totalMinor = feePlans[gradeIndex].totalMinor;
    const paidMinor = index % 4 === 0 ? totalMinor : index % 3 === 0 ? Math.floor(totalMinor / 2) : 0;
    const balanceMinor = totalMinor - paidMinor;
    return baseRecord(`invoice-${index + 1}`, { invoiceNo: `INV-2026-${String(index + 1).padStart(4,'0')}`, studentId: student.id, academicYearId: year.id, feePlanId: feePlans[gradeIndex].id, items: feePlans[gradeIndex].items, subtotalMinor: totalMinor, discountMinor: 0, adjustmentsMinor: 0, totalMinor, paidMinor, balanceMinor, dueDate: index % 5 === 0 ? '2026-08-31' : '2026-10-15', status: balanceMinor === 0 ? 'paid' : paidMinor > 0 ? 'partial' : 'unpaid' });
  });
  const payments = invoices.filter(invoice => invoice.paidMinor > 0).map((invoice, index) => baseRecord(`payment-${index + 1}`, { receiptNo: `REC-2026-${String(index + 1).padStart(4,'0')}`, invoiceId: invoice.id, studentId: invoice.studentId, amountMinor: invoice.paidMinor, method: index % 2 ? 'bank_transfer' : 'cash', reference: index % 2 ? `TRX-${1000 + index}` : '', paidAt: '2026-08-25T09:00:00.000Z', status: 'posted' }));

  const users = [
    baseRecord('user-admin', { username: 'admin.demo', passwordHash: password.hash, passwordSalt: password.salt, passwordIterations: password.iterations, role: 'admin', profileId: null, displayName: `مدير ${SCHOOL_NAME}`, lastLoginAt: null, failedAttempts: 0, lockedUntil: null }),
    baseRecord('user-teacher', { username: 'teacher.demo', passwordHash: password.hash, passwordSalt: password.salt, passwordIterations: password.iterations, role: 'teacher', profileId: 'teacher-1', displayName: 'أحمد الخطيب', lastLoginAt: null, failedAttempts: 0, lockedUntil: null }),
    baseRecord('user-student', { username: 'student.demo', passwordHash: password.hash, passwordSalt: password.salt, passwordIterations: password.iterations, role: 'student', profileId: 'student-1', displayName: students[0].fullName, lastLoginAt: null, failedAttempts: 0, lockedUntil: null }),
    baseRecord('user-guardian', { username: 'guardian.demo', passwordHash: password.hash, passwordSalt: password.salt, passwordIterations: password.iterations, role: 'guardian', profileId: 'guardian-1', displayName: guardians[0].fullName, lastLoginAt: null, failedAttempts: 0, lockedUntil: null }),
  ];

  const notifications = [
    { id: 'notification-1', userId: 'user-admin', type: 'attendance', title: 'ملخص حضور اليوم', body: 'بلغت نسبة الحضور 92% حتى الآن.', entityType: 'attendance', entityId: null, isRead: false, createdAt: nowIso() },
    { id: 'notification-2', userId: 'user-teacher', type: 'grade', title: 'درجات تحتاج مراجعة', body: 'يوجد تقييم واحد ما زال في المسودة.', entityType: 'assessment', entityId: 'assessment-1', isRead: false, createdAt: nowIso() },
    { id: 'notification-3', userId: 'user-student', type: 'grade', title: 'تم نشر نتيجة جديدة', body: 'نُشرت نتيجة اختبار الشهر الأول.', entityType: 'assessment', entityId: 'assessment-1', isRead: false, createdAt: nowIso() },
    { id: 'notification-4', userId: 'user-guardian', type: 'finance', title: 'تذكير بالرصيد', body: 'يوجد رصيد مستحق لأحد الأبناء.', entityType: 'invoice', entityId: 'invoice-1', isRead: false, createdAt: nowIso() },
  ];

  const seedSets = {
    academicYears: [year], gradeLevels: grades, sections, teachers, subjects, students, guardians, studentGuardians,
    enrollments, teachingAssignments: assignments, timetableSlots: timetable, attendanceSessions, attendanceRecords,
    assessments, gradeEntries, feePlans, invoices, payments, users, notifications,
    settings: [
      { id: 'setting-seed', key: 'seedVersion', value: 1, updatedAt: nowIso(), updatedBy: 'system' },
      { id: 'setting-school', key: 'schoolProfile', value: { name: SCHOOL_NAME, shortName: SCHOOL_SHORT_NAME, logoPath: SCHOOL_LOGO, phone: '02-0000000', address: 'غزة، فلسطين', currency: 'ILS', timezone: 'Asia/Hebron' }, updatedAt: nowIso(), updatedBy: 'system' },
      { id: 'setting-brand', key: 'brandIdentityVersion', value: 1, updatedAt: nowIso(), updatedBy: 'system' },
      { id: 'setting-policy', key: 'schoolPolicy', value: { attendanceMode: 'daily', lateWeight: .5, passScore: 50, sessionTimeoutMinutes: 45, workDays: [0,1,2,3,4] }, updatedAt: nowIso(), updatedBy: 'system' },
    ],
    auditLogs: [auditRecord('SEED_CREATED', 'system', 'seed-v1', null, { version: 1 })],
  };

  for (const [storeName, records] of Object.entries(seedSets)) await dbBulkPut(storeName, records);
}

async function ensureBrandIdentity() {
  const brandSetting = (await dbIndexAll('settings', 'key', 'brandIdentityVersion'))[0];
  if (Number(brandSetting?.value || 0) >= 1) return;

  const schoolSetting = (await dbIndexAll('settings', 'key', 'schoolProfile'))[0] || { id: 'setting-school', key: 'schoolProfile', value: {} };
  const previousSchool = schoolSetting.value || {};
  await dbPut('settings', {
    ...schoolSetting,
    value: { ...previousSchool, name: SCHOOL_NAME, shortName: SCHOOL_SHORT_NAME, logoPath: SCHOOL_LOGO, address: previousSchool.address === 'فلسطين' ? 'غزة، فلسطين' : previousSchool.address },
    updatedAt: nowIso(), updatedBy: 'system',
  });

  const admin = await dbGet('users', 'user-admin');
  if (admin) await dbPut('users', { ...admin, displayName: `مدير ${SCHOOL_NAME}`, updatedAt: nowIso(), updatedBy: 'system' });
  await dbPut('settings', { id: 'setting-brand', key: 'brandIdentityVersion', value: 1, updatedAt: nowIso(), updatedBy: 'system' });
  await dbPut('auditLogs', auditRecord('BRAND_IDENTITY_UPDATED', 'settings', 'schoolProfile', { name: previousSchool.name || null }, { name: SCHOOL_NAME, logoPath: SCHOOL_LOGO }));
}

async function signIn(username, password) {
  const typedUsername = username.trim();
  let matches = await dbIndexAll('users', 'username', typedUsername);
  if (!matches.length && typedUsername !== typedUsername.toLowerCase()) matches = await dbIndexAll('users', 'username', typedUsername.toLowerCase());
  const user = matches[0];
  const genericError = new Error('بيانات الدخول غير صحيحة. تحقق وحاول مرة أخرى.');
  if (!user || user.status !== 'active') throw genericError;
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) throw genericError;
  const ok = await verifyPassword(password, user);
  if (!ok) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    user.updatedAt = nowIso();
    await dbPut('users', user);
    await audit('LOGIN_FAILED', 'user', user.id, null, { username: user.username });
    throw genericError;
  }
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = nowIso();
  user.updatedAt = nowIso();
  await dbPut('users', user);
  state.user = user;
  const sessionId = uid('session');
  sessionStorage.setItem('school_session_user', user.id);
  sessionStorage.setItem('school_session_id', sessionId);
  sessionStorage.setItem('school_session_at', nowIso());
  await audit('LOGIN_SUCCESS', 'user', user.id, null, { role: user.role });
  return user;
}

async function restoreSession() {
  const userId = sessionStorage.getItem('school_session_user');
  if (!userId) return null;
  const user = await dbGet('users', userId);
  if (!user || user.status !== 'active') {
    sessionStorage.clear();
    return null;
  }
  state.user = user;
  return user;
}

async function signOut(reason = 'manual') {
  if (state.user) await audit('LOGOUT', 'user', state.user.id, null, { reason });
  sessionStorage.removeItem('school_session_user');
  sessionStorage.removeItem('school_session_id');
  sessionStorage.removeItem('school_session_at');
  state.user = null;
  location.hash = '';
  showAuth();
}

function canAccessRoute(route) {
  return !!state.user && (ROUTE_META[route]?.roles || []).includes(state.user.role);
}

async function getScopedStudentIds(user = state.user) {
  if (!user) return [];
  if (user.role === 'admin') return (await dbGetAll('students')).filter(s => s.status === 'active').map(s => s.id);
  if (user.role === 'student') return [user.profileId];
  if (user.role === 'guardian') return (await dbIndexAll('studentGuardians', 'guardianId', user.profileId)).filter(link => link.status === 'active').map(link => link.studentId);
  if (user.role === 'teacher') {
    const assignments = await dbIndexAll('teachingAssignments', 'teacherId', user.profileId);
    const sectionIds = new Set(assignments.filter(a => a.status === 'active').map(a => a.sectionId));
    return (await dbGetAll('enrollments')).filter(e => e.status === 'active' && sectionIds.has(e.sectionId)).map(e => e.studentId);
  }
  return [];
}

function showToast(title, message = '', type = 'info', timeout = 3600) {
  const region = $('#toast-region');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(message)}</small></span><button type="button" aria-label="إغلاق">×</button>`;
  region.append(toast);
  $('button', toast).addEventListener('click', () => toast.remove());
  setTimeout(() => toast.remove(), timeout);
}

function openModal({ title, kicker = '', body = '', footer = '', size = '650px', onOpen = null }) {
  state.modalReturnFocus = document.activeElement;
  $('#modal-title').textContent = title;
  $('#modal-kicker').textContent = kicker;
  $('#modal-body').innerHTML = body;
  $('#modal-footer').innerHTML = footer;
  $('#modal').style.width = `min(100%, ${size})`;
  $('#modal-layer').hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => $('[data-modal-close]', $('#modal'))?.focus());
  if (onOpen) onOpen($('#modal'));
}

function closeModal() {
  $('#modal-layer').hidden = true;
  document.body.style.overflow = '';
  state.modalReturnFocus?.focus?.();
}

function renderEmpty(title, description, actionHtml = '') {
  return `<div class="empty-state"><span class="empty-state__icon">◇</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><div>${actionHtml}</div></div>`;
}

function renderPageHeader(title, description, actions = '') {
  return `<header class="page-header"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><div class="page-actions">${actions}</div></header>`;
}

function userAvatarMarkup(user, id = '') {
  const info = roleInfo(user.role);
  return `<span class="avatar ${info.avatar}"${id ? ` id="${id}"` : ''}>${escapeHtml(info.initial)}</span>`;
}

function setAvatarElement(element, user) {
  const info = roleInfo(user.role);
  element.className = `avatar ${info.avatar}`;
  element.textContent = info.initial;
}

async function buildNavigation() {
  const nav = $('#main-nav');
  nav.innerHTML = NAVIGATION.map(group => {
    const visible = group.items.filter(item => item.roles.includes(state.user.role));
    if (!visible.length) return '';
    return `<p class="nav-section-label">${escapeHtml(group.section)}</p>${visible.map(item => `<button class="nav-item${state.route === item.route ? ' is-active' : ''}" type="button" data-route="${item.route}"><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${escapeHtml(item.label)}</span></button>`).join('')}`;
  }).join('');
}

function updateUserChrome() {
  const info = roleInfo(state.user.role);
  for (const id of ['sidebar-avatar', 'top-avatar', 'popover-avatar']) setAvatarElement($(`#${id}`), state.user);
  $('#sidebar-user-name').textContent = state.user.displayName;
  $('#top-user-name').textContent = state.user.displayName;
  $('#popover-name').textContent = state.user.displayName;
  $('#sidebar-user-role').textContent = info.label;
  $('#top-user-role').textContent = info.label;
  $('#popover-username').textContent = `@${state.user.username}`;
}

function showAuth() {
  $('#auth-screen').hidden = false;
  $('#app-shell').hidden = true;
  $('#user-popover').hidden = true;
  setTimeout(() => $('#username')?.focus(), 20);
}

async function showApp() {
  $('#auth-screen').hidden = true;
  $('#app-shell').hidden = false;
  updateUserChrome();
  const year = (await dbGetAll('academicYears')).find(item => item.isActive);
  $('#active-year-label').textContent = year?.name || 'غير محددة';
  await updateNotificationDot();
  const requested = location.hash.replace('#/', '') || 'dashboard';
  await navigate(canAccessRoute(requested) ? requested : 'dashboard', { updateHash: requested !== 'dashboard' });
}

async function updateNotificationDot() {
  const list = await dbIndexAll('notifications', 'userId', state.user.id);
  $('#notification-dot').hidden = !list.some(item => !item.isRead);
}

async function navigate(route, { updateHash = true } = {}) {
  if (!canAccessRoute(route)) {
    showToast('غير مصرح', 'لا يملك حسابك صلاحية فتح هذه الصفحة.', 'error');
    route = 'dashboard';
  }
  state.route = route;
  if (updateHash && location.hash !== `#/${route}`) history.pushState(null, '', `#/${route}`);
  const meta = ROUTE_META[route] || ROUTE_META.dashboard;
  $('#page-title').textContent = meta.label;
  $('#breadcrumb').textContent = `${SCHOOL_NAME} / ${meta.label}`;
  await buildNavigation();
  closeSidebar();
  $('#page-loading').hidden = false;
  $('#view-root').innerHTML = '';
  try {
    const renderer = ROUTE_RENDERERS[route] || renderDashboard;
    await renderer();
  } catch (error) {
    console.error(error);
    $('#view-root').innerHTML = `<div class="page">${renderEmpty('تعذر تحميل الصفحة', error.message || 'حدث خطأ غير متوقع.', '<button class="button button--secondary" data-action="retry-route">إعادة المحاولة</button>')}</div>`;
  } finally {
    $('#page-loading').hidden = true;
    $('#main-content').focus({ preventScroll: true });
  }
}

function openSidebar() {
  $('#sidebar').classList.add('is-open');
  $('#mobile-overlay').classList.add('is-open');
}

function closeSidebar() {
  $('#sidebar').classList.remove('is-open');
  $('#mobile-overlay').classList.remove('is-open');
}

async function setupGlobalEvents() {
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const username = $('#username');
    const password = $('#password');
    $('#username-error').textContent = username.value.trim() ? '' : 'اسم المستخدم مطلوب.';
    $('#password-error').textContent = password.value ? '' : 'كلمة المرور مطلوبة.';
    username.setAttribute('aria-invalid', String(!username.value.trim()));
    password.setAttribute('aria-invalid', String(!password.value));
    if (!username.value.trim() || !password.value) return;
    const button = $('#login-submit');
    button.disabled = true;
    button.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px"></span><span>جارٍ التحقق…</span>';
    $('#login-message').textContent = '';
    try {
      await signIn(username.value.trim(), password.value);
      await showApp();
      showToast('تم تسجيل الدخول', `مرحبًا ${state.user.displayName}`, 'success');
    } catch (error) {
      $('#login-message').textContent = error.message;
    } finally {
      button.disabled = false;
      button.innerHTML = '<span>دخول إلى النظام</span><span aria-hidden="true">←</span>';
    }
  });

  $('#toggle-password').addEventListener('click', () => {
    const input = $('#password');
    input.type = input.type === 'password' ? 'text' : 'password';
    $('#toggle-password').setAttribute('aria-label', input.type === 'password' ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور');
  });
  $('#show-demo').addEventListener('click', () => { $('#demo-accounts').hidden = !$('#demo-accounts').hidden; });
  $$('#demo-accounts [data-demo-user]').forEach(button => button.addEventListener('click', () => {
    $('#username').value = button.dataset.demoUser;
    $('#password').value = DEMO_PASSWORD;
    $('#demo-accounts').hidden = true;
  }));

  $('#main-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-route]');
    if (button) navigate(button.dataset.route);
  });
  $('#menu-button').addEventListener('click', openSidebar);
  $('#sidebar-close').addEventListener('click', closeSidebar);
  $('#mobile-overlay').addEventListener('click', closeSidebar);
  $('#top-user-button').addEventListener('click', event => toggleUserPopover(event.currentTarget));
  $('#user-menu-button').addEventListener('click', event => toggleUserPopover(event.currentTarget));
  $('#notification-button').addEventListener('click', () => navigate('notifications'));

  $('#user-popover').addEventListener('click', async event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    $('#user-popover').hidden = true;
    if (action === 'logout') await signOut();
    if (action === 'lock') {
      await signOut('locked');
      $('#login-message').textContent = 'تم قفل الجلسة. سجل الدخول للمتابعة.';
    }
    if (action === 'profile') navigate('profile');
  });

  $('#modal-layer').addEventListener('click', event => { if (event.target.matches('[data-modal-close]')) closeModal(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!$('#modal-layer').hidden) closeModal();
      else if (!$('#user-popover').hidden) $('#user-popover').hidden = true;
      else closeSidebar();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#global-search')?.focus();
    }
  });
  window.addEventListener('hashchange', () => {
    if (!state.user) return;
    const route = location.hash.replace('#/', '') || 'dashboard';
    if (route !== state.route) navigate(route, { updateHash: false });
  });
  document.addEventListener('click', async event => {
    if (!event.target.closest('#user-popover,#top-user-button,#user-menu-button')) $('#user-popover').hidden = true;
    const retry = event.target.closest('[data-action="retry-route"]');
    if (retry) navigate(state.route, { updateHash: false });
  });
}

function toggleUserPopover(anchor) {
  const popover = $('#user-popover');
  popover.hidden = !popover.hidden;
  if (!popover.hidden) {
    const rect = anchor.getBoundingClientRect();
    popover.style.top = `${Math.min(window.innerHeight - popover.offsetHeight - 10, rect.bottom + 8)}px`;
  }
}

const ROUTE_RENDERERS = {};

async function bootstrap() {
  $('#app-version').textContent = APP_VERSION;
  try {
    await openDatabase();
    await ensureSeedData();
    await ensureBrandIdentity();
    await setupGlobalEvents();
    const user = await restoreSession();
    if (user) await showApp(); else showAuth();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<main style="max-width:650px;margin:80px auto;padding:30px;font-family:'Amiri',Tahoma,serif;direction:rtl"><h1>تعذر تشغيل النظام</h1><p>${escapeHtml(error.message)}</p><p>تأكد من أن المتصفح يدعم IndexedDB وأن مساحة التخزين متاحة، ثم أعد تحميل الصفحة.</p></main>`;
  }
}

// View renderers are registered below. bootstrap() is invoked at the end of the file.

async function dashboardData() {
  const scopedIds = new Set(await getScopedStudentIds());
  const [studentsAll, enrollments, sections, attendanceSessions, attendanceRecords, assessments, gradeEntries, invoicesAll, payments, auditLogs, slots, subjects, teachers] = await Promise.all([
    dbGetAll('students'), dbGetAll('enrollments'), dbGetAll('sections'), dbGetAll('attendanceSessions'), dbGetAll('attendanceRecords'),
    dbGetAll('assessments'), dbGetAll('gradeEntries'), dbGetAll('invoices'), dbGetAll('payments'), dbGetAll('auditLogs'), dbGetAll('timetableSlots'), dbGetAll('subjects'), dbGetAll('teachers'),
  ]);
  const students = studentsAll.filter(s => scopedIds.has(s.id) && s.status === 'active');
  const records = attendanceRecords.filter(r => scopedIds.has(r.studentId));
  const presentLike = records.filter(r => ['present', 'late'].includes(r.status)).length;
  const attendanceRate = records.length ? Math.round(presentLike / records.length * 100) : 0;
  const entries = gradeEntries.filter(e => scopedIds.has(e.studentId) && e.entryStatus === 'graded');
  const assessmentMap = new Map(assessments.map(a => [a.id, a]));
  const gradePercentages = entries.map(e => {
    const assessment = assessmentMap.get(e.assessmentId);
    return assessment?.maxScore ? e.score / assessment.maxScore * 100 : null;
  }).filter(v => v !== null);
  const gradeAverage = gradePercentages.length ? Math.round(gradePercentages.reduce((a,b) => a+b, 0) / gradePercentages.length) : 0;
  const invoices = invoicesAll.filter(i => scopedIds.has(i.studentId));
  const outstanding = invoices.reduce((sum, item) => sum + Math.max(0, item.balanceMinor || 0), 0);
  const today = new Date().getDay();
  const todaySlots = slots.filter(slot => slot.dayOfWeek === today && slot.status === 'published');
  const scopedSlots = state.user.role === 'teacher' ? todaySlots.filter(s => s.teacherId === state.user.profileId)
    : ['student', 'guardian'].includes(state.user.role)
      ? todaySlots.filter(slot => {
          const sectionIds = new Set(enrollments.filter(e => scopedIds.has(e.studentId)).map(e => e.sectionId));
          return sectionIds.has(slot.sectionId);
        }) : todaySlots;
  return { students, scopedIds, enrollments, sections, records, attendanceRate, gradeAverage, invoices, payments, outstanding, auditLogs, slots: scopedSlots, subjects, teachers, assessments, gradeEntries };
}

async function renderDashboard() {
  const data = await dashboardData();
  const role = roleInfo(state.user.role);
  const todayLabel = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
  const isAdmin = state.user.role === 'admin';
  const stats = [
    { label: state.user.role === 'student' ? 'ملف الطالب' : 'الطلاب ضمن نطاقك', value: data.students.length, icon: '♙', color: '', trend: isAdmin ? 'بيانات المدرسة النشطة' : 'بيانات محدثة' },
    { label: 'نسبة الحضور', value: `${data.attendanceRate}%`, icon: '✓', color: 'green', trend: data.attendanceRate >= 90 ? 'ضمن الهدف' : 'تحتاج متابعة' },
    { label: 'متوسط الأداء', value: `${data.gradeAverage}%`, icon: '◇', color: 'amber', trend: data.gradeAverage >= 75 ? 'أداء جيد' : 'راجع النتائج' },
    { label: 'الرصيد المستحق', value: formatMoney(data.outstanding), icon: '₪', color: 'red', trend: data.outstanding ? 'رصيد قائم' : 'لا مستحقات' },
  ];
  const recentAudit = [...data.auditLogs].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const subjectMap = new Map(data.subjects.map(item => [item.id, item]));
  const teacherMap = new Map(data.teachers.map(item => [item.id, item]));
  const sectionMap = new Map(data.sections.map(item => [item.id, item]));
  const attendanceBars = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0,10);
    const sessionIds = new Set((await dbIndexAll('attendanceSessions', 'date', key)).map(s => s.id));
    const rows = data.records.filter(r => sessionIds.has(r.sessionId));
    const rate = rows.length ? Math.round(rows.filter(r => ['present','late'].includes(r.status)).length / rows.length * 100) : 0;
    attendanceBars.push({ label: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'short' }).format(date), value: rate });
  }

  $('#view-root').innerHTML = `<div class="page">
    <section class="welcome-banner">
      <div class="welcome-banner__copy"><p class="eyebrow" style="color:#BFD2FF">${escapeHtml(role.label)}</p><h2>${greeting}، ${escapeHtml(state.user.displayName.split(' ')[0])}</h2><p>${isAdmin ? 'هذه نظرة سريعة على نبض المدرسة اليوم. ركّزنا لك المؤشرات التي تحتاج قرارًا.' : 'إليك ملخصك اليومي والمعلومات المتاحة لك حسب دورك.'}</p></div>
      <div class="welcome-date"><strong>${escapeHtml(todayLabel.split('،')[0])}</strong><small>${escapeHtml(todayLabel.split('،').slice(1).join('،'))}</small></div>
    </section>
    <section class="grid grid--4" aria-label="المؤشرات الرئيسية">${stats.map(stat => `<article class="card stat-card ${stat.color}"><span class="stat-icon" aria-hidden="true">${stat.icon}</span><div class="stat-copy"><small>${escapeHtml(stat.label)}</small><strong>${typeof stat.value === 'number' ? formatNumber(stat.value) : escapeHtml(stat.value)}</strong><span class="trend${stat.color === 'red' ? ' down' : ''}">${escapeHtml(stat.trend)}</span></div></article>`).join('')}</section>
    <section class="grid grid--dashboard" style="margin-top:16px">
      <article class="card span-8"><header class="card__header"><div><h3>اتجاه الحضور</h3><p>آخر سبعة أيام متاحة ضمن نطاقك</p></div><button class="card__action" data-route-link="attendance">عرض التفاصيل</button></header><div class="bar-list">${attendanceBars.map(item => `<div class="bar-row"><span>${escapeHtml(item.label)}</span><div class="bar-track"><div class="bar-fill ${item.value >= 90 ? 'green' : item.value < 75 ? 'red' : ''}" style="width:${item.value}%"></div></div><strong>${item.value}%</strong></div>`).join('')}</div></article>
      <article class="card span-4"><header class="card__header"><div><h3>حالة الرسوم</h3><p>الفواتير ضمن نطاق الحساب</p></div></header>${renderInvoiceDonut(data.invoices)}</article>
      <article class="card span-7"><header class="card__header"><div><h3>جدول اليوم</h3><p>${escapeHtml(todayLabel)}</p></div><button class="card__action" data-route-link="timetable">الجدول الكامل</button></header><div class="schedule-list">${data.slots.length ? data.slots.slice(0,6).map(slot => `<div class="schedule-item"><span class="activity-icon">${slot.periodNo}</span><span class="activity-copy"><strong>${escapeHtml(subjectMap.get(slot.subjectId)?.name || 'مادة')}</strong><small>${escapeHtml(sectionMap.get(slot.sectionId)?.name || '')} · ${escapeHtml(teacherMap.get(slot.teacherId)?.fullName || '')}</small></span><span class="activity-time">${escapeHtml(slot.startsAt)}</span></div>`).join('') : renderEmpty('لا حصص اليوم', 'لا توجد حصص منشورة ضمن نطاقك لهذا اليوم.')}</div></article>
      <article class="card span-5"><header class="card__header"><div><h3>آخر النشاطات</h3><p>أحداث النظام المسجلة حديثًا</p></div></header><div class="activity-list">${recentAudit.length ? recentAudit.map(item => `<div class="activity-item"><span class="activity-icon">${auditIcon(item.action)}</span><span class="activity-copy"><strong>${escapeHtml(auditActionLabel(item.action))}</strong><small>${escapeHtml(item.entityType)} · ${escapeHtml(item.userId)}</small></span><span class="activity-time">${formatTime(item.createdAt)}</span></div>`).join('') : renderEmpty('لا نشاطات بعد', 'ستظهر العمليات المسجلة هنا.')}</div></article>
    </section>
  </div>`;
  $$('[data-route-link]', $('#view-root')).forEach(button => button.addEventListener('click', () => navigate(button.dataset.routeLink)));
}

function renderInvoiceDonut(invoices) {
  if (!invoices.length) return renderEmpty('لا توجد فواتير', 'لا توجد بيانات مالية ضمن نطاقك.');
  const counts = invoices.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
  const paid = counts.paid || 0;
  const partial = counts.partial || 0;
  const due = invoices.length - paid - partial;
  const paidPct = Math.round(paid / invoices.length * 100);
  const partialPct = Math.round(partial / invoices.length * 100);
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(var(--green-600) 0 ${paidPct}%,var(--blue-600) ${paidPct}% ${paidPct + partialPct}%,var(--red-600) ${paidPct + partialPct}% 100%)"><div class="donut__center"><strong>${paidPct}%</strong><small>مدفوع بالكامل</small></div></div><div class="legend"><span><i style="background:var(--green-600)"></i>مدفوعة (${paid})</span><span><i style="background:var(--blue-600)"></i>جزئية (${partial})</span><span><i style="background:var(--red-600)"></i>مستحقة (${due})</span></div></div>`;
}

function auditIcon(action) {
  if (action.includes('LOGIN')) return '⚿';
  if (action.includes('CREATE') || action.includes('ADD')) return '+';
  if (action.includes('UPDATE')) return '↻';
  if (action.includes('PAYMENT')) return '₪';
  return '•';
}

function auditActionLabel(action) {
  return ({ LOGIN_SUCCESS: 'تسجيل دخول ناجح', LOGIN_FAILED: 'محاولة دخول غير ناجحة', LOGOUT: 'تسجيل خروج', SEED_CREATED: 'إنشاء بيانات العرض', STUDENT_CREATED: 'إضافة طالب', STUDENT_UPDATED: 'تحديث بيانات طالب', TEACHER_CREATED: 'إضافة معلم', ATTENDANCE_SAVED: 'حفظ سجل حضور', GRADES_SAVED: 'حفظ درجات', PAYMENT_POSTED: 'تسجيل دفعة' })[action] || action.replaceAll('_',' ');
}

async function studentContext() {
  const scopedIds = new Set(await getScopedStudentIds());
  const [students, enrollments, sections, grades, guardians, links, users] = await Promise.all([
    dbGetAll('students'), dbGetAll('enrollments'), dbGetAll('sections'), dbGetAll('gradeLevels'), dbGetAll('guardians'), dbGetAll('studentGuardians'), dbGetAll('users'),
  ]);
  return {
    students: students.filter(student => scopedIds.has(student.id)), enrollments, sections, grades, guardians, links, users,
    sectionMap: new Map(sections.map(item => [item.id,item])), gradeMap: new Map(grades.map(item => [item.id,item])), guardianMap: new Map(guardians.map(item => [item.id,item])),
    accountMap: new Map(users.filter(user => user.profileId).map(user => [`${user.role}:${user.profileId}`, user])),
  };
}

async function renderStudents() {
  const context = await studentContext();
  const canManage = state.user.role === 'admin';
  const action = canManage ? '<button class="button button--primary" id="add-student"><span aria-hidden="true">＋</span>إضافة طالب</button>' : '';
  $('#view-root').innerHTML = `<div class="page">${renderPageHeader(state.user.role === 'student' ? 'ملفي الدراسي' : state.user.role === 'guardian' ? 'أبنائي' : 'إدارة الطلاب', state.user.role === 'admin' ? 'سجلات الطلاب وتسجيلهم في الفصول وربط أولياء الأمور.' : 'الطلاب المتاحون ضمن نطاق حسابك.', action)}
    <div class="toolbar"><div class="toolbar__group"><label class="search-control"><span>⌕</span><input id="students-search" type="search" placeholder="بحث بالاسم أو رقم القبول"></label><select class="filter-select" id="students-section"><option value="">كل الفصول</option>${context.sections.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div><div class="toolbar__group"><span class="metric-chip"><small>عدد السجلات</small><strong id="students-count">${context.students.length}</strong></span></div></div>
    <section class="card data-card"><div class="table-wrap"><table class="data-table"><caption>قائمة الطلاب المتاحة لهذا الحساب</caption><thead><tr><th>الطالب</th><th>رقم القبول</th><th>الفصل</th><th>ولي الأمر</th><th>الهاتف</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody id="students-tbody"></tbody></table></div><div class="pagination"><p>يتم عرض جميع النتائج المطابقة ضمن نطاق الحساب</p><div class="pagination__buttons"><button class="is-active">1</button></div></div></section>
  </div>`;
  const renderRows = () => {
    const query = normalizeArabic($('#students-search').value);
    const sectionId = $('#students-section').value;
    const filtered = context.students.filter(student => {
      const enrollment = context.enrollments.find(e => e.studentId === student.id && e.status === 'active');
      return (!query || student.fullNameNormalized.includes(query) || student.admissionNo.toLowerCase().includes(query)) && (!sectionId || enrollment?.sectionId === sectionId);
    });
    $('#students-count').textContent = filtered.length;
    $('#students-tbody').innerHTML = filtered.length ? filtered.map(student => studentRow(student, context, canManage)).join('') : `<tr><td colspan="7">${renderEmpty('لا توجد نتائج', 'غيّر كلمة البحث أو الفلتر.')}</td></tr>`;
    $$('[data-view-student]', $('#students-tbody')).forEach(button => button.addEventListener('click', () => openStudentDetails(button.dataset.viewStudent, context)));
    $$('[data-edit-student]', $('#students-tbody')).forEach(button => button.addEventListener('click', () => openStudentForm(context, button.dataset.editStudent)));
    $$('[data-account-student]', $('#students-tbody')).forEach(button => button.addEventListener('click', () => {
      const student = context.students.find(item => item.id === button.dataset.accountStudent);
      openUserForm({ role: 'student', profileId: student.id, displayName: student.fullName });
    }));
    $$('[data-guardian-student]', $('#students-tbody')).forEach(button => button.addEventListener('click', () => openGuardianForm({ studentId: button.dataset.guardianStudent })));
  };
  renderRows();
  $('#students-search').addEventListener('input', renderRows);
  $('#students-section').addEventListener('change', renderRows);
  $('#add-student')?.addEventListener('click', () => openStudentForm(context));
}

function studentRow(student, context, canManage) {
  const enrollment = context.enrollments.find(e => e.studentId === student.id && e.status === 'active');
  const section = context.sectionMap.get(enrollment?.sectionId);
  const link = context.links.find(item => item.studentId === student.id && item.isPrimary) || context.links.find(item => item.studentId === student.id);
  const guardian = context.guardianMap.get(link?.guardianId);
  const initial = student.fullName.trim().charAt(0);
  const hasAccount = context.accountMap.has(`student:${student.id}`);
  return `<tr><td data-label="الطالب"><div class="cell-person"><span class="avatar ${student.gender === 'female' ? 'avatar--red' : 'avatar--blue'}">${escapeHtml(initial)}</span><span><strong>${escapeHtml(student.fullName)}</strong><small>${escapeHtml(student.address || 'لا عنوان')}</small></span></div></td><td data-label="رقم القبول">${escapeHtml(student.admissionNo)}</td><td data-label="الفصل">${escapeHtml(section?.name || 'غير مسجل')}</td><td data-label="ولي الأمر">${escapeHtml(guardian?.fullName || 'غير مرتبط')}</td><td data-label="الهاتف" dir="ltr">${escapeHtml(student.phone || '—')}</td><td data-label="الحالة">${statusBadge(student.status)}</td><td data-label="إجراءات"><div class="table-actions"><button class="icon-button" type="button" data-view-student="${student.id}" aria-label="عرض ${escapeHtml(student.fullName)}">◉</button>${canManage ? `<button class="icon-button" type="button" data-edit-student="${student.id}" aria-label="تعديل ${escapeHtml(student.fullName)}">✎</button><button class="icon-button" type="button" data-guardian-student="${student.id}" aria-label="ربط ولي أمر بـ${escapeHtml(student.fullName)}">♧</button>${hasAccount ? '<span class="status status--success">له حساب</span>' : `<button class="icon-button" type="button" data-account-student="${student.id}" aria-label="إنشاء حساب للطالب ${escapeHtml(student.fullName)}">⚿</button>`}` : ''}</div></td></tr>`;
}

function openStudentDetails(studentId, context) {
  const student = context.students.find(item => item.id === studentId);
  const enrollment = context.enrollments.find(e => e.studentId === studentId && e.status === 'active');
  const section = context.sectionMap.get(enrollment?.sectionId);
  const studentLinks = context.links.filter(item => item.studentId === studentId);
  const guardianHtml = studentLinks.map(link => {
    const guardian = context.guardianMap.get(link.guardianId);
    return guardian ? `<div class="metric-chip"><small>${escapeHtml(link.relation || 'ولي أمر')}</small><strong>${escapeHtml(guardian.fullName)}</strong><small dir="ltr">${escapeHtml(guardian.phone || '')}</small></div>` : '';
  }).join('');
  openModal({ title: student.fullName, kicker: `رقم القبول ${student.admissionNo}`, body: `<div class="grid grid--2"><div class="card"><h3>البيانات الأساسية</h3><p><strong>الفصل:</strong> ${escapeHtml(section?.name || 'غير مسجل')}</p><p><strong>تاريخ الميلاد:</strong> ${formatDate(student.birthDate)}</p><p><strong>الهاتف:</strong> <span dir="ltr">${escapeHtml(student.phone || '—')}</span></p><p><strong>العنوان:</strong> ${escapeHtml(student.address || '—')}</p></div><div class="card"><h3>أولياء الأمور</h3><div class="metric-strip">${guardianHtml || '<p class="muted">لا يوجد ولي أمر مرتبط.</p>'}</div></div></div>`, footer: '<button class="button button--secondary" data-modal-close>إغلاق</button>' });
}

function openStudentForm(context, studentId = null) {
  const existing = studentId ? context.students.find(item => item.id === studentId) : null;
  const enrollment = existing ? context.enrollments.find(e => e.studentId === existing.id && e.status === 'active') : null;
  const body = `<form id="student-form" class="form-grid" novalidate>
    <div class="field"><label for="student-name">الاسم الكامل *</label><input id="student-name" name="fullName" required value="${escapeHtml(existing?.fullName || '')}"></div>
    <div class="field"><label for="student-admission">رقم القبول *</label><input id="student-admission" name="admissionNo" required value="${escapeHtml(existing?.admissionNo || '')}" ${existing ? 'readonly' : ''}></div>
    <div class="field"><label for="student-gender">الجنس</label><select id="student-gender" name="gender"><option value="male" ${existing?.gender === 'male' ? 'selected' : ''}>ذكر</option><option value="female" ${existing?.gender === 'female' ? 'selected' : ''}>أنثى</option></select></div>
    <div class="field"><label for="student-birth">تاريخ الميلاد</label><input id="student-birth" name="birthDate" type="date" value="${escapeHtml(existing?.birthDate || '')}"></div>
    <div class="field"><label for="student-phone">الهاتف</label><input id="student-phone" name="phone" dir="ltr" value="${escapeHtml(existing?.phone || '')}"></div>
    <div class="field"><label for="student-section">الفصل *</label><select id="student-section" name="sectionId" required><option value="">اختر الفصل</option>${context.sections.filter(s => s.status === 'active').map(s => `<option value="${s.id}" ${enrollment?.sectionId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}</select></div>
    <div class="field field--full"><label for="student-address">العنوان</label><textarea id="student-address" name="address">${escapeHtml(existing?.address || '')}</textarea></div>
    ${existing ? '' : '<label class="selection-option field--full"><input type="checkbox" name="createAccount" value="yes"><span>إنشاء حساب دخول للطالب بعد الحفظ<small>يمكن أيضاً إنشاؤه لاحقاً من زر الحساب في قائمة الطلاب.</small></span></label><div class="field"><label>اسم المستخدم</label><input name="username" dir="ltr" placeholder="مثال: student.2026"></div><div class="field"><label>كلمة المرور</label><input name="password" type="password" minlength="8" autocomplete="new-password"></div>'}
    <p class="form-message field--full" id="student-form-message" role="alert"></p>
  </form>`;
  openModal({ title: existing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد', kicker: 'إدارة الطلاب', body, footer: `<button class="button button--primary" id="save-student">${existing ? 'حفظ التغييرات' : 'إضافة الطالب'}</button><button class="button button--secondary" data-modal-close>إلغاء</button>`, onOpen: () => {
    $('#save-student').addEventListener('click', async () => {
      const form = $('#student-form');
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      if (!existing && values.createAccount === 'yes' && (!values.username?.trim() || !values.password)) {
        $('#student-form-message').textContent = 'أدخل اسم المستخدم وكلمة مرور من 8 أحرف على الأقل، أو ألغِ خيار إنشاء الحساب.';
        return;
      }
      if (!existing && values.createAccount === 'yes') {
        try { await validateNewAccountCredentials(values.username, values.password); }
        catch (error) { $('#student-form-message').textContent = error.message; return; }
      }
      const button = $('#save-student'); button.disabled = true;
      try {
        const time = nowIso();
        const targetSection = context.sections.find(section => section.id === values.sectionId && section.status === 'active');
        if (!targetSection) throw new Error('الشعبة المحددة غير متاحة.');
        const occupiedSeats = context.enrollments.filter(item => item.status === 'active' && item.sectionId === targetSection.id && item.studentId !== existing?.id).length;
        if (occupiedSeats >= Number(targetSection.capacity || 0)) throw new Error(`الشعبة ${targetSection.name} مكتملة السعة (${targetSection.capacity}).`);
        if (existing) {
          const before = { ...existing };
          const updated = { ...existing, fullName: values.fullName.trim(), fullNameNormalized: normalizeArabic(values.fullName), gender: values.gender, birthDate: values.birthDate, phone: values.phone.trim(), address: values.address.trim(), updatedAt: time, updatedBy: state.user.id };
          await atomicWrite(['students', 'enrollments', 'auditLogs'], async stores => {
            stores.students.put(updated);
            if (enrollment && enrollment.sectionId !== values.sectionId) stores.enrollments.put({ ...enrollment, sectionId: values.sectionId, updatedAt: time, updatedBy: state.user.id });
            stores.auditLogs.put(auditRecord('STUDENT_UPDATED', 'student', updated.id, { fullName: before.fullName, sectionId: enrollment?.sectionId }, { fullName: updated.fullName, sectionId: values.sectionId }));
          });
        } else {
          const admissionNo = values.admissionNo.trim().toUpperCase();
          const duplicate = (await dbIndexAll('students', 'admissionNo', admissionNo))[0];
          if (duplicate) throw new Error('رقم القبول مستخدم لطالب آخر.');
          const student = baseRecord(uid('student'), { admissionNo, fullName: values.fullName.trim(), fullNameNormalized: normalizeArabic(values.fullName), gender: values.gender, birthDate: values.birthDate, phone: values.phone.trim(), address: values.address.trim(), createdBy: state.user.id, updatedBy: state.user.id });
          const activeYear = (await dbGetAll('academicYears')).find(y => y.isActive);
          if (!activeYear) throw new Error('لا توجد سنة دراسية نشطة لتسجيل الطالب.');
          const newEnrollment = baseRecord(uid('enrollment'), { studentId: student.id, academicYearId: activeYear.id, sectionId: values.sectionId, enrolledOn: new Date().toISOString().slice(0,10), rollNo: null, createdBy: state.user.id, updatedBy: state.user.id });
          await atomicWrite(['students','enrollments','auditLogs'], async stores => { stores.students.put(student); stores.enrollments.put(newEnrollment); stores.auditLogs.put(auditRecord('STUDENT_CREATED','student',student.id,null,{ admissionNo: student.admissionNo, sectionId: values.sectionId })); });
        }
        if (!existing && values.createAccount === 'yes') {
          const newStudent = (await dbIndexAll('students', 'admissionNo', values.admissionNo.trim().toUpperCase()))[0];
          await createLinkedUser({ role: 'student', profileId: newStudent.id, displayName: newStudent.fullName, username: values.username, password: values.password });
        }
        closeModal(); showToast('تم الحفظ', existing ? 'تم تحديث بيانات الطالب.' : values.createAccount === 'yes' ? 'تمت إضافة الطالب وإنشاء حساب دخوله.' : 'تمت إضافة الطالب وتسجيله.', 'success'); await renderStudents();
      } catch (error) { $('#student-form-message').textContent = error.message; }
      finally { button.disabled = false; }
    });
  }});
}

async function renderGuardians() {
  const [guardians, students, links, users] = await Promise.all([dbGetAll('guardians'), dbGetAll('students'), dbGetAll('studentGuardians'), dbGetAll('users')]);
  const studentMap = new Map(students.map(student => [student.id, student]));
  const accountProfileIds = new Set(users.filter(user => user.role === 'guardian' && user.profileId).map(user => user.profileId));
  const activeGuardians = guardians.filter(guardian => guardian.status === 'active');
  $('#view-root').innerHTML = `<div class="page">${renderPageHeader('أولياء الأمور','إنشاء ملفات أولياء الأمور وربطهم بالطلاب ثم إنشاء حساب دخول لكل ولي أمر.','<button class="button button--primary" id="add-guardian">＋ إضافة ولي أمر</button>')}
    <div class="toolbar"><label class="search-control"><span>⌕</span><input id="guardians-search" type="search" placeholder="بحث بالاسم أو الهاتف"></label><span class="metric-chip"><small>أولياء الأمور</small><strong>${activeGuardians.length}</strong></span></div>
    <section class="card data-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>ولي الأمر</th><th>صلة القرابة</th><th>الطلاب المرتبطون</th><th>الهاتف</th><th>الحساب</th><th>إجراءات</th></tr></thead><tbody id="guardians-body">${activeGuardians.map(guardian => {
      const guardianLinks = links.filter(link => link.guardianId === guardian.id);
      const linkedStudents = guardianLinks.map(link => studentMap.get(link.studentId)?.fullName).filter(Boolean);
      const hasAccount = accountProfileIds.has(guardian.id);
      return `<tr data-guardian-row><td data-label="ولي الأمر"><strong>${escapeHtml(guardian.fullName)}</strong><small style="display:block;color:var(--muted)">${escapeHtml(guardian.email || 'دون بريد')}</small></td><td data-label="صلة القرابة">${escapeHtml(guardian.relation || guardianLinks[0]?.relation || 'ولي أمر')}</td><td data-label="الطلاب">${escapeHtml(linkedStudents.join('، ') || 'غير مرتبط')}</td><td data-label="الهاتف" dir="ltr">${escapeHtml(guardian.phone || '—')}</td><td data-label="الحساب">${hasAccount ? '<span class="status status--success">موجود</span>' : '<span class="status status--warning">غير منشأ</span>'}</td><td data-label="إجراءات"><div class="table-actions"><button class="button button--secondary" data-edit-guardian="${guardian.id}">تعديل وربط</button>${hasAccount ? '' : `<button class="button button--primary" data-account-guardian="${guardian.id}">إنشاء حساب</button>`}</div></td></tr>`;
    }).join('')}</tbody></table></div></section>
  </div>`;
  const filter = () => {
    const query = normalizeArabic($('#guardians-search').value);
    $$('[data-guardian-row]', $('#guardians-body')).forEach(row => { row.hidden = Boolean(query) && !normalizeArabic(row.textContent).includes(query); });
  };
  $('#guardians-search').addEventListener('input', filter);
  $('#add-guardian').addEventListener('click', () => openGuardianForm());
  $$('[data-edit-guardian]').forEach(button => button.addEventListener('click', () => openGuardianForm({ guardianId: button.dataset.editGuardian })));
  $$('[data-account-guardian]').forEach(button => button.addEventListener('click', () => {
    const guardian = guardians.find(item => item.id === button.dataset.accountGuardian);
    openUserForm({ role: 'guardian', profileId: guardian.id, displayName: guardian.fullName });
  }));
}

async function openGuardianForm({ guardianId = null, studentId = null } = {}) {
  const [guardians, students, links] = await Promise.all([dbGetAll('guardians'), dbGetAll('students'), dbGetAll('studentGuardians')]);
  const existing = guardianId ? guardians.find(item => item.id === guardianId) : null;
  const linkedStudentIds = new Set(links.filter(link => link.guardianId === guardianId).map(link => link.studentId));
  if (studentId) linkedStudentIds.add(studentId);
  openModal({
    title: existing ? 'تعديل ولي الأمر والطلاب المرتبطين' : 'إضافة ولي أمر',
    kicker: 'أولياء الأمور',
    size: '760px',
    body: `<form id="guardian-form" class="form-grid">
      <div class="field"><label>الاسم الكامل *</label><input name="fullName" required value="${escapeHtml(existing?.fullName || '')}"></div>
      <div class="field"><label>صلة القرابة *</label><select name="relation" required><option value="الأب" ${existing?.relation === 'الأب' ? 'selected' : ''}>الأب</option><option value="الأم" ${existing?.relation === 'الأم' ? 'selected' : ''}>الأم</option><option value="الجد" ${existing?.relation === 'الجد' ? 'selected' : ''}>الجد</option><option value="الجدة" ${existing?.relation === 'الجدة' ? 'selected' : ''}>الجدة</option><option value="وصي" ${existing?.relation === 'وصي' ? 'selected' : ''}>وصي</option></select></div>
      <div class="field"><label>الهاتف *</label><input name="phone" required dir="ltr" value="${escapeHtml(existing?.phone || '')}"></div>
      <div class="field"><label>البريد</label><input name="email" type="email" value="${escapeHtml(existing?.email || '')}"></div>
      <div class="field field--full"><label>العنوان</label><textarea name="address">${escapeHtml(existing?.address || '')}</textarea></div>
      <fieldset class="field field--full"><legend>الطلاب المرتبطون *</legend><div class="selection-grid">${students.filter(item => item.status === 'active').map(student => `<label class="selection-option"><input type="checkbox" name="studentIds" value="${student.id}" ${linkedStudentIds.has(student.id) ? 'checked' : ''}><span>${escapeHtml(student.fullName)}<small>${escapeHtml(student.admissionNo)}</small></span></label>`).join('')}</div></fieldset>
      <p class="form-message field--full" id="guardian-message"></p>
    </form>`,
    footer: `<button class="button button--primary" id="save-guardian">${existing ? 'حفظ التغييرات' : 'إضافة وربط'}</button><button class="button button--secondary" data-modal-close>إلغاء</button>`,
    onOpen: () => {
      $('#save-guardian').addEventListener('click', async () => {
        const form = $('#guardian-form');
        if (!form.reportValidity()) return;
        const formData = new FormData(form);
        const selectedStudentIds = formData.getAll('studentIds');
        if (!selectedStudentIds.length) {
          $('#guardian-message').textContent = 'اختر طالباً واحداً على الأقل لربطه بولي الأمر.';
          return;
        }
        const duplicatePhone = guardians.find(item => item.status === 'active' && item.id !== existing?.id && item.phone === String(formData.get('phone')).trim());
        if (duplicatePhone) {
          $('#guardian-message').textContent = 'رقم الهاتف مرتبط بولي أمر آخر.';
          return;
        }
        const guardian = existing ? { ...existing } : baseRecord(uid('guardian'));
        Object.assign(guardian, {
          fullName: String(formData.get('fullName')).trim(),
          fullNameNormalized: normalizeArabic(formData.get('fullName')),
          relation: formData.get('relation'),
          phone: String(formData.get('phone')).trim(),
          email: String(formData.get('email') || '').trim(),
          address: String(formData.get('address') || '').trim(),
          updatedAt: nowIso(),
          updatedBy: state.user.id,
        });
        const previousLinks = links.filter(link => link.guardianId === guardian.id);
        await atomicWrite(['guardians', 'studentGuardians', 'auditLogs'], async stores => {
          stores.guardians.put(guardian);
          previousLinks.filter(link => !selectedStudentIds.includes(link.studentId)).forEach(link => stores.studentGuardians.delete(link.id));
          selectedStudentIds.forEach(selectedId => {
            const previous = previousLinks.find(link => link.studentId === selectedId);
            const otherPrimary = links.some(link => link.studentId === selectedId && link.guardianId !== guardian.id && link.isPrimary && link.status === 'active');
            stores.studentGuardians.put(previous ? { ...previous, relation: guardian.relation, updatedAt: nowIso(), updatedBy: state.user.id } : baseRecord(uid('student-guardian'), { studentId: selectedId, guardianId: guardian.id, relation: guardian.relation, isPrimary: !otherPrimary, canCollect: true, receivesNotices: true, createdBy: state.user.id, updatedBy: state.user.id }));
          });
          stores.auditLogs.put(auditRecord(existing ? 'GUARDIAN_UPDATED' : 'GUARDIAN_CREATED', 'guardian', guardian.id, existing ? { fullName: existing.fullName, studentIds: previousLinks.map(link => link.studentId) } : null, { fullName: guardian.fullName, studentIds: selectedStudentIds }));
        });
        closeModal();
        showToast('تم حفظ ولي الأمر', 'اكتمل ربط الملف بالطلاب. يمكنك الآن إنشاء حساب دخول له.', 'success');
        if (state.route === 'guardians') await renderGuardians(); else if (state.route === 'students') await renderStudents();
      });
    },
  });
}

async function renderTeachers() {
  const [teachers, assignments, subjects, sections, users, years] = await Promise.all([dbGetAll('teachers'), dbGetAll('teachingAssignments'), dbGetAll('subjects'), dbGetAll('sections'), dbGetAll('users'), dbGetAll('academicYears')]);
  let visible = teachers.filter(t => t.status === 'active');
  if (state.user.role === 'teacher') visible = visible.filter(t => t.id === state.user.profileId);
  if (['student','guardian'].includes(state.user.role)) {
    const studentIds = new Set(await getScopedStudentIds());
    const enrollments = await dbGetAll('enrollments');
    const sectionIds = new Set(enrollments.filter(e => studentIds.has(e.studentId)).map(e => e.sectionId));
    const teacherIds = new Set(assignments.filter(a => sectionIds.has(a.sectionId)).map(a => a.teacherId));
    visible = visible.filter(t => teacherIds.has(t.id));
  }
  const subjectMap = new Map(subjects.map(s => [s.id,s]));
  const sectionMap = new Map(sections.map(s => [s.id,s]));
  const canManage = state.user.role === 'admin';
  const accountProfileIds = new Set(users.filter(user => user.role === 'teacher' && user.profileId).map(user => user.profileId));
  const activeYear = years.find(year => year.isActive);
  $('#view-root').innerHTML = `<div class="page">${renderPageHeader('المعلمون', canManage ? 'إدارة ملفات المعلمين وتخصصاتهم وتكليفاتهم.' : 'المعلمون المرتبطون بموادك أو فصولك.', canManage ? '<button class="button button--primary" id="add-teacher">＋ إضافة معلم</button>' : '')}
    <div class="toolbar"><label class="search-control"><span>⌕</span><input id="teachers-search" type="search" placeholder="بحث باسم المعلم أو الرقم الوظيفي"></label><span class="metric-chip"><small>المعلمون الظاهرون</small><strong>${visible.length}</strong></span></div>
    <section class="grid grid--3" id="teachers-grid">${visible.map(teacher => {
      const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id && a.status === 'active');
      const hasAccount = accountProfileIds.has(teacher.id);
      return `<article class="card"><div class="card__header"><div class="cell-person">${userAvatarMarkup({role:'teacher'})}<span><strong>${escapeHtml(teacher.fullName)}</strong><small>${escapeHtml(teacher.employeeNo)}</small></span></div>${statusBadge(teacher.status)}</div><p><strong>التخصص:</strong> ${escapeHtml(teacher.specialty || '—')}</p><p><strong>الهاتف:</strong> <span dir="ltr">${escapeHtml(teacher.phone || '—')}</span></p><div class="metric-strip">${teacherAssignments.slice(0,3).map(a => `<span class="metric-chip"><small>${escapeHtml(sectionMap.get(a.sectionId)?.name || '')}</small><strong>${escapeHtml(subjectMap.get(a.subjectId)?.name || '')}</strong></span>`).join('') || '<small>لا تكليفات نشطة</small>'}</div>${canManage ? `<div class="page-actions" style="margin-top:14px"><button class="button button--secondary" data-edit-teacher="${teacher.id}">تعديل الملف</button><button class="button button--secondary" data-assign-teacher="${teacher.id}">إضافة مادة وشعبة</button>${hasAccount ? '<span class="status status--success">له حساب</span>' : `<button class="button button--primary" data-account-teacher="${teacher.id}">إنشاء حساب</button>`}</div>` : ''}</article>`;
    }).join('')}</section></div>`;
  const filter = () => {
    const q = normalizeArabic($('#teachers-search').value);
    $$('#teachers-grid > article').forEach(card => { card.hidden = q && !normalizeArabic(card.textContent).includes(q); });
  };
  $('#teachers-search').addEventListener('input', filter);
  $('#add-teacher')?.addEventListener('click', () => openTeacherForm(null));
  $$('[data-edit-teacher]').forEach(button => button.addEventListener('click', () => openTeacherForm(teachers.find(t => t.id === button.dataset.editTeacher))));
  $$('[data-assign-teacher]').forEach(button => button.addEventListener('click', () => openTeachingAssignmentForm({ activeYear, teachers, subjects, sections, assignments, teacherId: button.dataset.assignTeacher, onSaved: renderTeachers })));
  $$('[data-account-teacher]').forEach(button => button.addEventListener('click', () => {
    const teacher = teachers.find(item => item.id === button.dataset.accountTeacher);
    openUserForm({ role: 'teacher', profileId: teacher.id, displayName: teacher.fullName });
  }));
}

function openTeacherForm(existing) {
  openModal({ title: existing ? 'تعديل ملف المعلم' : 'إضافة معلم', kicker: 'المعلمون', body: `<form id="teacher-form" class="form-grid"><div class="field"><label>الاسم الكامل *</label><input name="fullName" required value="${escapeHtml(existing?.fullName || '')}"></div><div class="field"><label>الرقم الوظيفي *</label><input name="employeeNo" required value="${escapeHtml(existing?.employeeNo || '')}" ${existing ? 'readonly' : ''}></div><div class="field"><label>التخصص *</label><input name="specialty" required value="${escapeHtml(existing?.specialty || '')}"></div><div class="field"><label>تاريخ التعيين</label><input name="hiredOn" type="date" value="${escapeHtml(existing?.hiredOn || '')}"></div><div class="field"><label>الهاتف</label><input name="phone" dir="ltr" value="${escapeHtml(existing?.phone || '')}"></div><div class="field"><label>البريد</label><input name="email" type="email" value="${escapeHtml(existing?.email || '')}"></div>${existing ? '' : '<label class="selection-option field--full"><input type="checkbox" name="createAccount" value="yes"><span>إنشاء حساب دخول للمعلم بعد الحفظ<small>يمكن إنشاؤه لاحقاً من بطاقة المعلم.</small></span></label><div class="field"><label>اسم المستخدم</label><input name="username" dir="ltr" placeholder="مثال: teacher.ahmad"></div><div class="field"><label>كلمة المرور</label><input name="password" type="password" minlength="8" autocomplete="new-password"></div>'}<p class="form-message field--full" id="teacher-form-message"></p></form>`, footer: `<button class="button button--primary" id="save-teacher">حفظ</button><button class="button button--secondary" data-modal-close>إلغاء</button>`, onOpen: () => {
    $('#save-teacher').addEventListener('click', async () => {
      const form = $('#teacher-form'); if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      try {
        if (!existing && data.createAccount === 'yes' && (!data.username?.trim() || !data.password)) throw new Error('أدخل اسم المستخدم وكلمة مرور من 8 أحرف على الأقل، أو ألغِ خيار إنشاء الحساب.');
        if (!existing && data.createAccount === 'yes') await validateNewAccountCredentials(data.username, data.password);
        const employeeNo = data.employeeNo.trim().toUpperCase();
        if (!existing && (await dbIndexAll('teachers','employeeNo',employeeNo))[0]) throw new Error('الرقم الوظيفي مستخدم بالفعل.');
        const teacher = existing ? { ...existing } : baseRecord(uid('teacher'));
        Object.assign(teacher, { fullName: data.fullName.trim(), fullNameNormalized: normalizeArabic(data.fullName), employeeNo, specialty: data.specialty.trim(), hiredOn: data.hiredOn, phone: data.phone.trim(), email: data.email.trim(), updatedAt: nowIso(), updatedBy: state.user.id });
        await atomicWrite(['teachers','auditLogs'], async stores => { stores.teachers.put(teacher); stores.auditLogs.put(auditRecord(existing ? 'TEACHER_UPDATED':'TEACHER_CREATED','teacher',teacher.id,existing ? {fullName:existing.fullName}:null,{fullName:teacher.fullName,employeeNo:teacher.employeeNo})); });
        if (!existing && data.createAccount === 'yes') await createLinkedUser({ role: 'teacher', profileId: teacher.id, displayName: teacher.fullName, username: data.username, password: data.password });
        closeModal(); showToast('تم الحفظ', data.createAccount === 'yes' ? 'تم حفظ المعلم وإنشاء حساب دخوله.' : 'تم حفظ ملف المعلم بنجاح.','success'); await renderTeachers();
      } catch(error) { $('#teacher-form-message').textContent = error.message; }
    });
  }});
}

async function renderAcademics() {
  const [years, grades, sections, subjects, teachers, assignments] = await Promise.all([dbGetAll('academicYears'),dbGetAll('gradeLevels'),dbGetAll('sections'),dbGetAll('subjects'),dbGetAll('teachers'),dbGetAll('teachingAssignments')]);
  const activeYear = years.find(y => y.isActive);
  const gradeMap = new Map(grades.map(g => [g.id,g]));
  const teacherMap = new Map(teachers.map(t => [t.id,t]));
  const subjectMap = new Map(subjects.map(subject => [subject.id, subject]));
  const sectionMap = new Map(sections.map(section => [section.id, section]));
  const visibleAssignments = state.user.role === 'teacher' ? assignments.filter(assignment => assignment.teacherId === state.user.profileId) : assignments;
  $('#view-root').innerHTML = `<div class="page">${renderPageHeader('الفصول والمواد','إعداد الهيكل الأكاديمي والمواد والتكليفات للسنة النشطة.', state.user.role === 'admin' ? '<button class="button button--primary" id="add-assignment">＋ تكليف معلم</button><button class="button button--secondary" id="add-section">＋ شعبة جديدة</button><button class="button button--secondary" id="add-subject">＋ مادة جديدة</button>' : '')}
    <section class="card" style="margin-bottom:16px"><div class="metric-strip"><div class="metric-chip"><small>السنة النشطة</small><strong>${escapeHtml(activeYear?.name || '—')}</strong></div><div class="metric-chip"><small>الصفوف</small><strong>${grades.filter(g=>g.status==='active').length}</strong></div><div class="metric-chip"><small>الشعب</small><strong>${sections.filter(s=>s.status==='active').length}</strong></div><div class="metric-chip"><small>المواد</small><strong>${subjects.filter(s=>s.status==='active').length}</strong></div><div class="metric-chip"><small>التكليفات</small><strong>${visibleAssignments.filter(a=>a.status==='active').length}</strong></div></div></section>
    <section class="grid grid--2"><article class="card"><header class="card__header"><div><h3>الشعب الدراسية</h3><p>السعة والمربي والغرفة</p></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>الشعبة</th><th>الصف</th><th>السعة</th><th>المربي</th></tr></thead><tbody>${sections.filter(s=>s.status==='active').map(s=>`<tr><td data-label="الشعبة"><strong>${escapeHtml(s.name)}</strong><small style="display:block;color:var(--muted)">${escapeHtml(s.room||'')}</small></td><td data-label="الصف">${escapeHtml(gradeMap.get(s.gradeLevelId)?.name||'')}</td><td data-label="السعة">${s.capacity}</td><td data-label="المربي">${escapeHtml(teacherMap.get(s.homeroomTeacherId)?.fullName||'غير محدد')}</td></tr>`).join('')}</tbody></table></div></article>
    <article class="card"><header class="card__header"><div><h3>المواد الدراسية</h3><p>الدرجات وحد النجاح</p></div></header><div class="bar-list">${subjects.filter(s=>s.status==='active').map(s=>`<div class="bar-row" style="grid-template-columns:110px 1fr 70px"><span><i style="display:inline-block;width:8px;height:8px;background:${escapeHtml(s.color)};border-radius:3px;margin-inline-end:5px"></i>${escapeHtml(s.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${s.passScore}%;background:${escapeHtml(s.color)}"></div></div><strong>${s.passScore}/${s.maxScore}</strong></div>`).join('')}</div></article></section>
    <section class="card data-card" style="margin-top:16px"><header class="card__header"><div><h3>تكليفات المعلمين</h3><p>الرابط الرسمي بين المعلم والمادة والشعبة؛ ومنه تُنشأ الحصص والتقييمات والصلاحيات.</p></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>المعلم</th><th>المادة</th><th>الشعبة</th><th>الفصل</th><th>الحالة</th></tr></thead><tbody>${visibleAssignments.filter(assignment => assignment.status === 'active').map(assignment => `<tr><td data-label="المعلم">${escapeHtml(teacherMap.get(assignment.teacherId)?.fullName || '—')}</td><td data-label="المادة">${escapeHtml(subjectMap.get(assignment.subjectId)?.name || '—')}</td><td data-label="الشعبة">${escapeHtml(sectionMap.get(assignment.sectionId)?.name || '—')}</td><td data-label="الفصل">${escapeHtml(activeYear?.terms?.find(term => term.id === assignment.termId)?.name || '—')}</td><td data-label="الحالة">${statusBadge(assignment.status)}</td></tr>`).join('') || `<tr><td colspan="5">${renderEmpty('لا توجد تكليفات','أضف تكليفاً لربط المعلم بالمادة والشعبة.')}</td></tr>`}</tbody></table></div></section>
  </div>`;
  $('#add-assignment')?.addEventListener('click', () => openTeachingAssignmentForm({ activeYear, teachers, subjects, sections, assignments, onSaved: renderAcademics }));
  $('#add-section')?.addEventListener('click', () => openSectionForm({ activeYear, grades, teachers }));
  $('#add-subject')?.addEventListener('click', openSubjectForm);
}

function openTeachingAssignmentForm({ activeYear, teachers, subjects, sections, assignments, teacherId = '', onSaved = renderAcademics }) {
  if (!activeYear) {
    showToast('لا توجد سنة نشطة', 'فعّل سنة دراسية قبل إضافة التكليف.', 'error');
    return;
  }
  const availableSections = sections.filter(item => item.status === 'active' && item.academicYearId === activeYear.id);
  openModal({
    title: 'تكليف معلم بمادة وشعبة',
    kicker: 'الترابط الأكاديمي',
    body: `<form id="assignment-form" class="form-grid">
      <div class="field"><label>المعلم *</label><select name="teacherId" required><option value="">اختر المعلم</option>${teachers.filter(item => item.status === 'active').map(item => `<option value="${item.id}" ${item.id === teacherId ? 'selected' : ''}>${escapeHtml(item.fullName)} · ${escapeHtml(item.employeeNo)}</option>`).join('')}</select></div>
      <div class="field"><label>المادة *</label><select name="subjectId" required><option value="">اختر المادة</option>${subjects.filter(item => item.status === 'active').map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</select></div>
      <div class="field"><label>الشعبة *</label><select name="sectionId" required><option value="">اختر الشعبة</option>${availableSections.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</select></div>
      <div class="field"><label>الفصل الدراسي *</label><select name="termId" required>${(activeYear.terms || []).map(term => `<option value="${term.id}">${escapeHtml(term.name)}</option>`).join('')}</select></div>
      <p class="form-message field--full" id="assignment-message"></p>
    </form>`,
    footer: '<button class="button button--primary" id="save-assignment">حفظ التكليف</button><button class="button button--secondary" data-modal-close>إلغاء</button>',
    onOpen: () => {
      $('#save-assignment').addEventListener('click', async () => {
        const form = $('#assignment-form');
        if (!form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form));
        const duplicate = assignments.find(item => item.status === 'active' && item.academicYearId === activeYear.id && item.termId === data.termId && item.teacherId === data.teacherId && item.subjectId === data.subjectId && item.sectionId === data.sectionId);
        if (duplicate) {
          $('#assignment-message').textContent = 'هذا التكليف موجود بالفعل للفصل الدراسي المحدد.';
          return;
        }
        const selectedSection = sections.find(item => item.id === data.sectionId);
        const selectedSubject = subjects.find(item => item.id === data.subjectId);
        if (selectedSubject?.gradeLevelIds?.length && !selectedSubject.gradeLevelIds.includes(selectedSection?.gradeLevelId)) {
          $('#assignment-message').textContent = 'هذه المادة غير مفعلة لصف الشعبة المحددة.';
          return;
        }
        const term = activeYear.terms?.find(item => item.id === data.termId);
        const assignment = baseRecord(uid('assignment'), {
          academicYearId: activeYear.id,
          termId: data.termId,
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          sectionId: data.sectionId,
          startsOn: term?.startsOn || activeYear.startsOn,
          endsOn: term?.endsOn || activeYear.endsOn,
          createdBy: state.user.id,
          updatedBy: state.user.id,
        });
        await atomicWrite(['teachingAssignments', 'auditLogs'], async stores => {
          stores.teachingAssignments.put(assignment);
          stores.auditLogs.put(auditRecord('TEACHING_ASSIGNMENT_CREATED', 'teachingAssignment', assignment.id, null, data));
        });
        closeModal();
        showToast('تم حفظ التكليف', 'أصبح المعلم مرتبطاً بالمادة والشعبة ويمكن إنشاء حصص وتقييمات له.', 'success');
        await onSaved();
      });
    },
  });
}

function openSectionForm({ activeYear, grades, teachers }) {
  openModal({ title:'إضافة شعبة دراسية', kicker:'الهيكل الأكاديمي', body:`<form id="section-form" class="form-grid"><div class="field"><label>اسم الشعبة *</label><input name="name" required placeholder="مثال: السابع ج"></div><div class="field"><label>الصف *</label><select name="gradeLevelId" required><option value="">اختر الصف</option>${grades.filter(g=>g.status==='active').map(g=>`<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}</select></div><div class="field"><label>السعة *</label><input name="capacity" type="number" min="1" max="60" required value="30"></div><div class="field"><label>الغرفة</label><input name="room" placeholder="A-10"></div><div class="field field--full"><label>مربي الشعبة</label><select name="homeroomTeacherId"><option value="">غير محدد</option>${teachers.filter(t=>t.status==='active').map(t=>`<option value="${t.id}">${escapeHtml(t.fullName)}</option>`).join('')}</select></div><p class="form-message field--full" id="section-message"></p></form>`, footer:'<button class="button button--primary" id="save-section">إضافة الشعبة</button><button class="button button--secondary" data-modal-close>إلغاء</button>', onOpen:()=>{
    $('#save-section').addEventListener('click',async()=>{ const form=$('#section-form'); if(!form.reportValidity())return; const data=Object.fromEntries(new FormData(form)); const duplicate=(await dbGetAll('sections')).find(s=>s.academicYearId===activeYear.id&&normalizeArabic(s.name)===normalizeArabic(data.name)); if(duplicate){$('#section-message').textContent='اسم الشعبة موجود في السنة الحالية.';return;} const section=baseRecord(uid('section'),{academicYearId:activeYear.id,gradeLevelId:data.gradeLevelId,name:data.name.trim(),capacity:Number(data.capacity),room:data.room.trim(),homeroomTeacherId:data.homeroomTeacherId||null,createdBy:state.user.id,updatedBy:state.user.id}); await dbPut('sections',section); await audit('SECTION_CREATED','section',section.id,null,{name:section.name}); closeModal();showToast('تمت الإضافة','أضيفت الشعبة الجديدة.','success');renderAcademics(); });
  }});
}

function openSubjectForm() {
  openModal({title:'إضافة مادة دراسية',kicker:'المواد',body:`<form id="subject-form" class="form-grid"><div class="field"><label>اسم المادة *</label><input name="name" required></div><div class="field"><label>الرمز *</label><input name="code" required dir="ltr"></div><div class="field"><label>الدرجة القصوى *</label><input name="maxScore" type="number" min="1" required value="100"></div><div class="field"><label>درجة النجاح *</label><input name="passScore" type="number" min="0" required value="50"></div><div class="field field--full"><label>لون المادة</label><input name="color" type="color" value="#155EEF"></div><p class="form-message field--full" id="subject-message"></p></form>`,footer:'<button class="button button--primary" id="save-subject">إضافة المادة</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#save-subject').addEventListener('click',async()=>{const form=$('#subject-form');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));if(Number(data.passScore)>Number(data.maxScore)){ $('#subject-message').textContent='درجة النجاح لا يمكن أن تتجاوز الدرجة القصوى.';return;}if((await dbIndexAll('subjects','code',data.code.trim().toUpperCase()))[0]){$('#subject-message').textContent='رمز المادة مستخدم.';return;}const subject=baseRecord(uid('subject'),{name:data.name.trim(),code:data.code.trim().toUpperCase(),maxScore:Number(data.maxScore),passScore:Number(data.passScore),color:data.color,gradeLevelIds:[],createdBy:state.user.id,updatedBy:state.user.id});await dbPut('subjects',subject);await audit('SUBJECT_CREATED','subject',subject.id,null,{name:subject.name});closeModal();showToast('تمت الإضافة','أضيفت المادة بنجاح.','success');renderAcademics();});}});
}

async function timetableContext() {
  const [slots, sections, subjects, teachers, assignments, enrollments] = await Promise.all([dbGetAll('timetableSlots'),dbGetAll('sections'),dbGetAll('subjects'),dbGetAll('teachers'),dbGetAll('teachingAssignments'),dbGetAll('enrollments')]);
  let visible = slots.filter(s => s.status === 'published' || state.user.role === 'admin');
  if (state.user.role === 'teacher') visible = visible.filter(s => s.teacherId === state.user.profileId);
  if (['student','guardian'].includes(state.user.role)) {
    const studentIds = new Set(await getScopedStudentIds());
    const sectionIds = new Set(enrollments.filter(e=>studentIds.has(e.studentId)&&e.status==='active').map(e=>e.sectionId));
    visible = visible.filter(s=>sectionIds.has(s.sectionId));
  }
  return { slots:visible, allSlots:slots, sections, subjects, teachers, assignments, sectionMap:new Map(sections.map(x=>[x.id,x])),subjectMap:new Map(subjects.map(x=>[x.id,x])),teacherMap:new Map(teachers.map(x=>[x.id,x])) };
}

async function renderTimetable() {
  const ctx = await timetableContext();
  const days = [{id:1,name:'الأحد'},{id:2,name:'الاثنين'},{id:3,name:'الثلاثاء'},{id:4,name:'الأربعاء'},{id:5,name:'الخميس'}];
  const periods = [1,2,3,4,5,6];
  const canManage = state.user.role === 'admin';
  $('#view-root').innerHTML = `<div class="page">${renderPageHeader('الجدول الدراسي','الحصص الأسبوعية المنشورة ضمن نطاق حسابك.',canManage?'<button class="button button--primary" id="add-slot">＋ إضافة حصة</button><button class="button button--secondary" id="print-timetable">طباعة الجدول</button>':'<button class="button button--secondary" id="print-timetable">طباعة الجدول</button>')}
    <div class="toolbar"><div class="toolbar__group"><select id="schedule-section-filter" class="filter-select"><option value="">كل الشعب</option>${ctx.sections.filter(s=>s.status==='active').map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select><select id="schedule-teacher-filter" class="filter-select"><option value="">كل المعلمين</option>${ctx.teachers.filter(t=>t.status==='active').map(t=>`<option value="${t.id}">${escapeHtml(t.fullName)}</option>`).join('')}</select></div><span class="metric-chip"><small>الحصص الظاهرة</small><strong id="schedule-count">${ctx.slots.length}</strong></span></div>
    <section class="card data-card"><div class="table-wrap"><table class="data-table schedule-table"><caption>الجدول الأسبوعي — الفترات من اليمين إلى اليسار</caption><thead><tr><th>اليوم</th>${periods.map(p=>`<th>الحصة ${p}</th>`).join('')}</tr></thead><tbody id="schedule-body"></tbody></table></div></section>
  </div>`;
  const draw = () => {
    const sectionId=$('#schedule-section-filter').value, teacherId=$('#schedule-teacher-filter').value;
    const filtered=ctx.slots.filter(s=>(!sectionId||s.sectionId===sectionId)&&(!teacherId||s.teacherId===teacherId));
    $('#schedule-count').textContent=filtered.length;
    $('#schedule-body').innerHTML=days.map(day=>`<tr><td data-label="اليوم"><strong>${day.name}</strong></td>${periods.map(period=>{const slots=filtered.filter(s=>s.dayOfWeek===day.id&&s.periodNo===period);return `<td data-label="الحصة ${period}">${slots.length?slots.map(slot=>`<button class="schedule-cell" type="button" data-slot="${slot.id}" style="background:${ctx.subjectMap.get(slot.subjectId)?.color||'#155EEF'}12;border-color:${ctx.subjectMap.get(slot.subjectId)?.color||'#155EEF'}40"><strong>${escapeHtml(ctx.subjectMap.get(slot.subjectId)?.name||'')}</strong><small>${escapeHtml(ctx.sectionMap.get(slot.sectionId)?.name||'')} · ${escapeHtml(slot.startsAt)}</small></button>`).join(''):'<span style="color:var(--subtle)">—</span>'}</td>`}).join('')}</tr>`).join('');
    $$('[data-slot]').forEach(button=>button.addEventListener('click',()=>openSlotDetails(ctx,button.dataset.slot)));
  };
  draw();
  $('#schedule-section-filter').addEventListener('change',draw);$('#schedule-teacher-filter').addEventListener('change',draw);
  $('#add-slot')?.addEventListener('click',()=>openSlotForm(ctx));
  $('#print-timetable').addEventListener('click',()=>window.print());
}

function openSlotDetails(ctx,id){const slot=ctx.allSlots.find(s=>s.id===id);openModal({title:ctx.subjectMap.get(slot.subjectId)?.name||'حصة',kicker:`${slot.dayName} · الحصة ${slot.periodNo}`,body:`<div class="grid grid--2"><div class="metric-chip"><small>الشعبة</small><strong>${escapeHtml(ctx.sectionMap.get(slot.sectionId)?.name||'')}</strong></div><div class="metric-chip"><small>المعلم</small><strong>${escapeHtml(ctx.teacherMap.get(slot.teacherId)?.fullName||'')}</strong></div><div class="metric-chip"><small>الوقت</small><strong>${escapeHtml(slot.startsAt)} – ${escapeHtml(slot.endsAt)}</strong></div><div class="metric-chip"><small>الغرفة</small><strong>${escapeHtml(slot.roomId||'غير محددة')}</strong></div></div>`,footer:'<button class="button button--secondary" data-modal-close>إغلاق</button>'});}

function openSlotForm(ctx){
  const activeAssignments = ctx.assignments.filter(assignment => assignment.status === 'active');
  if (!activeAssignments.length) {
    showToast('لا توجد تكليفات', 'أضف تكليف معلم بمادة وشعبة من صفحة الفصول والمواد أولاً.', 'error');
    return;
  }
  openModal({title:'إضافة حصة للجدول',kicker:'الجدول الدراسي',body:`<form id="slot-form" class="form-grid"><div class="field field--full"><label>تكليف المعلم *</label><select name="assignmentId" required><option value="">اختر المعلم والمادة والشعبة</option>${activeAssignments.map(assignment => `<option value="${assignment.id}">${escapeHtml(ctx.teacherMap.get(assignment.teacherId)?.fullName || '')} — ${escapeHtml(ctx.subjectMap.get(assignment.subjectId)?.name || '')} — ${escapeHtml(ctx.sectionMap.get(assignment.sectionId)?.name || '')}</option>`).join('')}</select><small>تُعرض التكليفات المنشأة في صفحة الفصول والمواد فقط.</small></div><div class="field"><label>اليوم *</label><select name="dayOfWeek" required><option value="1">الأحد</option><option value="2">الاثنين</option><option value="3">الثلاثاء</option><option value="4">الأربعاء</option><option value="5">الخميس</option></select></div><div class="field"><label>الحصة *</label><input name="periodNo" type="number" min="1" max="8" value="1" required></div><div class="field"><label>الغرفة</label><input name="roomId"></div><div class="field"><label>البداية *</label><input name="startsAt" type="time" value="08:00" required></div><div class="field"><label>النهاية *</label><input name="endsAt" type="time" value="08:45" required></div><p class="form-message field--full" id="slot-message"></p></form>`,footer:'<button class="button button--primary" id="save-slot">حفظ الحصة</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{
    $('#save-slot').addEventListener('click',async()=>{const form=$('#slot-form');if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form));const assignment=activeAssignments.find(item=>item.id===d.assignmentId);if(!assignment){$('#slot-message').textContent='التكليف المحدد غير موجود أو غير نشط.';return;}delete d.assignmentId;Object.assign(d,{teacherId:assignment.teacherId,subjectId:assignment.subjectId,sectionId:assignment.sectionId,termId:assignment.termId});d.periodNo=Number(d.periodNo);d.dayOfWeek=Number(d.dayOfWeek);d.roomId=d.roomId.trim()||ctx.sectionMap.get(d.sectionId)?.room||'';if(d.startsAt>=d.endsAt){$('#slot-message').textContent='وقت النهاية يجب أن يكون بعد البداية.';return;}const overlap=ctx.allSlots.find(s=>{if(s.status==='archived'||s.dayOfWeek!==d.dayOfWeek)return false;const sameResource=s.teacherId===d.teacherId||s.sectionId===d.sectionId;const samePeriod=s.periodNo===d.periodNo&&sameResource;const timeOverlap=d.startsAt<s.endsAt&&s.startsAt<d.endsAt&&(sameResource||(d.roomId&&s.roomId===d.roomId));return samePeriod||timeOverlap;});if(overlap){const reasons=[];if(overlap.teacherId===d.teacherId)reasons.push('المعلم');if(overlap.sectionId===d.sectionId)reasons.push('الشعبة');if(d.roomId&&overlap.roomId===d.roomId)reasons.push('الغرفة');$('#slot-message').textContent=`يوجد تعارض في ${[...new Set(reasons)].join(' و')}. اختر فترة أو وقتًا آخر.`;return;}const dayName=['','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'][d.dayOfWeek];const activeYear=(await dbGetAll('academicYears')).find(y=>y.isActive);if(!activeYear){$('#slot-message').textContent='لا توجد سنة دراسية نشطة.';return;}const slot=baseRecord(uid('slot'),{...d,dayName,academicYearId:activeYear.id,status:'published',publishedAt:nowIso(),createdBy:state.user.id,updatedBy:state.user.id});await dbPut('timetableSlots',slot);await audit('TIMETABLE_SLOT_CREATED','timetableSlot',slot.id,null,{dayName,periodNo:d.periodNo,sectionId:d.sectionId,assignmentId:assignment.id});closeModal();showToast('تمت إضافة الحصة','تم إنشاء الحصة من تكليف أكاديمي صحيح ودون تعارض.','success');renderTimetable();});
  }});
}

async function attendanceContext(){
  const [sessions,records,students,enrollments,sections]=await Promise.all([dbGetAll('attendanceSessions'),dbGetAll('attendanceRecords'),dbGetAll('students'),dbGetAll('enrollments'),dbGetAll('sections')]);
  const scopedIds=new Set(await getScopedStudentIds());
  return {sessions,records:records.filter(r=>scopedIds.has(r.studentId)),allRecords:records,students:students.filter(s=>scopedIds.has(s.id)),allStudents:students,enrollments,sections,studentMap:new Map(students.map(s=>[s.id,s])),sectionMap:new Map(sections.map(s=>[s.id,s]))};
}

async function renderAttendance(){
  const ctx=await attendanceContext();const canManage=['admin','teacher'].includes(state.user.role);const today=new Date().toISOString().slice(0,10);
  if(!canManage){return renderAttendanceReadOnly(ctx);}
  let allowedSections=ctx.sections.filter(s=>s.status==='active');
  if(state.user.role==='teacher'){const assignments=await dbIndexAll('teachingAssignments','teacherId',state.user.profileId);const ids=new Set(assignments.filter(a=>a.status==='active').map(a=>a.sectionId));allowedSections=allowedSections.filter(s=>ids.has(s.id));}
  $('#view-root').innerHTML=`<div class="page">${renderPageHeader('الحضور والغياب','سجل الحضور بسرعة ثم راجع الملخص قبل الحفظ.','')}
    <section class="card"><div class="toolbar"><div class="toolbar__group"><label class="field compact-field"><span>التاريخ</span><input id="attendance-date" type="date" value="${today}"></label><label class="field compact-field"><span>الشعبة</span><select id="attendance-section"><option value="">اختر الشعبة</option>${allowedSections.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></label></div><div class="page-actions"><button class="button button--primary" id="save-attendance" disabled>حفظ السجل</button><button class="button button--secondary" id="close-attendance" disabled>إغلاق الجلسة</button></div></div><div id="attendance-roster">${renderEmpty('اختر الشعبة','حدد تاريخًا وشعبة لعرض قائمة الطلاب.')}</div></section>
  </div>`;
  const load=async()=>{const sectionId=$('#attendance-section').value,date=$('#attendance-date').value;if(!sectionId){$('#attendance-roster').innerHTML=renderEmpty('اختر الشعبة','حدد شعبة لعرض الطلاب.');return;}const enrollmentRows=ctx.enrollments.filter(e=>e.sectionId===sectionId&&e.status==='active');const roster=ctx.allStudents.filter(s=>enrollmentRows.some(e=>e.studentId===s.id)&&s.status==='active');const session=ctx.sessions.find(s=>s.date===date&&s.sectionId===sectionId);const saved=new Map((session?ctx.allRecords.filter(r=>r.sessionId===session.id):[]).map(r=>[r.studentId,r]));$('#save-attendance').disabled=session?.status==='closed';$('#close-attendance').disabled=!session||session.status==='closed';$('#attendance-roster').dataset.sessionId=session?.id||'';$('#attendance-roster').innerHTML=roster.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>الطالب</th><th>الحالة</th><th>دقائق التأخير</th><th>السبب/الملاحظة</th></tr></thead><tbody>${roster.map(student=>{const row=saved.get(student.id);const status=row?.status||'present';return `<tr data-attendance-student="${student.id}"><td data-label="الطالب"><div class="cell-person"><span class="avatar ${student.gender==='female'?'avatar--red':'avatar--blue'}">${escapeHtml(student.fullName[0])}</span><span><strong>${escapeHtml(student.fullName)}</strong><small>${escapeHtml(student.admissionNo)}</small></span></div></td><td data-label="الحالة"><select class="filter-select attendance-status" ${session?.status==='closed'?'disabled':''}><option value="present" ${status==='present'?'selected':''}>حاضر</option><option value="absent" ${status==='absent'?'selected':''}>غائب</option><option value="late" ${status==='late'?'selected':''}>متأخر</option><option value="excused" ${status==='excused'?'selected':''}>غياب بعذر</option></select></td><td data-label="التأخير"><input class="attendance-late" type="number" min="0" max="60" value="${row?.lateMinutes||0}" style="width:80px" ${session?.status==='closed'?'disabled':''}></td><td data-label="الملاحظة"><input class="attendance-note" value="${escapeHtml(row?.note||'')}" placeholder="سبب أو ملاحظة" ${session?.status==='closed'?'disabled':''}></td></tr>`}).join('')}</tbody></table></div>${session?.status==='closed'?'<div class="confirm-box" style="margin-top:12px;color:var(--ink-soft);background:var(--surface-alt);border-color:var(--line)">هذه الجلسة مغلقة ولا يمكن تعديلها من هذا الدور.</div>':''}`:renderEmpty('لا طلاب في الشعبة','لا يوجد تسجيل نشط لهذه الشعبة.');};
  $('#attendance-section').addEventListener('change',load);$('#attendance-date').addEventListener('change',load);
  $('#save-attendance').addEventListener('click',async()=>{const sectionId=$('#attendance-section').value,date=$('#attendance-date').value;const rows=$$('[data-attendance-student]');if(!rows.length)return;const values=rows.map(row=>({studentId:row.dataset.attendanceStudent,status:$('.attendance-status',row).value,lateMinutes:Number($('.attendance-late',row).value||0),note:$('.attendance-note',row).value.trim()}));const invalid=values.find(v=>v.status==='excused'&&!v.note);if(invalid){showToast('بيانات ناقصة','الغياب بعذر يحتاج سببًا أو ملاحظة.','error');return;}let sessionId=$('#attendance-roster').dataset.sessionId;const session=sessionId?await dbGet('attendanceSessions',sessionId):baseRecord(uid('attendance'),{date,sectionId,timetableSlotId:null,mode:'daily',status:'open',openedAt:nowIso(),closedAt:null,closedBy:null,createdBy:state.user.id,updatedBy:state.user.id});sessionId=session.id;const existing=ctx.allRecords.filter(r=>r.sessionId===sessionId);await atomicWrite(['attendanceSessions','attendanceRecords','auditLogs'],async stores=>{stores.attendanceSessions.put(session);for(const value of values){const old=existing.find(r=>r.studentId===value.studentId);stores.attendanceRecords.put(old?{...old,...value,updatedAt:nowIso(),updatedBy:state.user.id}:baseRecord(uid('attendance-record'),{sessionId,...value,reasonCode:value.status==='excused'?'EXCUSED':null,createdBy:state.user.id,updatedBy:state.user.id}));}stores.auditLogs.put(auditRecord('ATTENDANCE_SAVED','attendanceSession',sessionId,null,{date,sectionId,count:values.length}));});showToast('تم حفظ الحضور',`حُفظت حالة ${values.length} طالبًا.`,'success');ctx.sessions=await dbGetAll('attendanceSessions');ctx.allRecords=await dbGetAll('attendanceRecords');await load();});
  $('#close-attendance').addEventListener('click',async()=>{const id=$('#attendance-roster').dataset.sessionId;if(!id)return;const session=await dbGet('attendanceSessions',id);session.status='closed';session.closedAt=nowIso();session.closedBy=state.user.id;session.updatedAt=nowIso();await atomicWrite(['attendanceSessions','auditLogs'],async stores=>{stores.attendanceSessions.put(session);stores.auditLogs.put(auditRecord('ATTENDANCE_CLOSED','attendanceSession',id,null,{closedAt:session.closedAt}));});showToast('أُغلقت الجلسة','أصبح السجل للعرض فقط.','success');renderAttendance();});
}

async function renderAttendanceReadOnly(ctx){
  const sessionsMap=new Map(ctx.sessions.map(s=>[s.id,s]));const sectionMap=ctx.sectionMap;const rows=[...ctx.records].sort((a,b)=>(sessionsMap.get(b.sessionId)?.date||'').localeCompare(sessionsMap.get(a.sessionId)?.date||''));const total=rows.length,present=rows.filter(r=>['present','late'].includes(r.status)).length,rate=total?Math.round(present/total*100):0;
  $('#view-root').innerHTML=`<div class="page">${renderPageHeader('سجل الحضور','الحضور والغياب المسجل للطلاب ضمن حسابك.')}
  <section class="grid grid--3" style="margin-bottom:16px"><article class="card stat-card green"><span class="stat-icon">✓</span><div class="stat-copy"><small>نسبة الحضور</small><strong>${rate}%</strong><span class="trend">${present} من ${total}</span></div></article><article class="card stat-card red"><span class="stat-icon">!</span><div class="stat-copy"><small>حالات الغياب</small><strong>${rows.filter(r=>r.status==='absent').length}</strong></div></article><article class="card stat-card amber"><span class="stat-icon">◷</span><div class="stat-copy"><small>حالات التأخير</small><strong>${rows.filter(r=>r.status==='late').length}</strong></div></article></section>
  <section class="card data-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>الطالب</th><th>التاريخ</th><th>الشعبة</th><th>الحالة</th><th>الملاحظة</th></tr></thead><tbody>${rows.slice(0,100).map(row=>{const student=ctx.studentMap.get(row.studentId),session=sessionsMap.get(row.sessionId);return`<tr><td data-label="الطالب">${escapeHtml(student?.fullName||'')}</td><td data-label="التاريخ">${formatDate(session?.date)}</td><td data-label="الشعبة">${escapeHtml(sectionMap.get(session?.sectionId)?.name||'')}</td><td data-label="الحالة">${statusBadge(row.status)}</td><td data-label="الملاحظة">${escapeHtml(row.note||'—')}</td></tr>`}).join('')}</tbody></table></div></section></div>`;
}

async function gradingContext(){
  const [assessments,entries,students,enrollments,sections,subjects,teachers,assignments]=await Promise.all([dbGetAll('assessments'),dbGetAll('gradeEntries'),dbGetAll('students'),dbGetAll('enrollments'),dbGetAll('sections'),dbGetAll('subjects'),dbGetAll('teachers'),dbGetAll('teachingAssignments')]);
  const scopedIds=new Set(await getScopedStudentIds());
  let visibleAssessments=assessments;
  if(state.user.role==='teacher')visibleAssessments=assessments.filter(a=>a.teacherId===state.user.profileId);
  if(['student','guardian'].includes(state.user.role)){const sectionIds=new Set(enrollments.filter(e=>scopedIds.has(e.studentId)).map(e=>e.sectionId));visibleAssessments=assessments.filter(a=>a.status==='published'&&sectionIds.has(a.sectionId));}
  return{assessments:visibleAssessments,allAssessments:assessments,entries:entries.filter(e=>scopedIds.has(e.studentId)||['admin','teacher'].includes(state.user.role)),students,enrollments,sections,subjects,teachers,assignments,scopedIds,studentMap:new Map(students.map(x=>[x.id,x])),sectionMap:new Map(sections.map(x=>[x.id,x])),subjectMap:new Map(subjects.map(x=>[x.id,x])),teacherMap:new Map(teachers.map(x=>[x.id,x]))};
}

function assessmentAverage(assessment,entries){const rows=entries.filter(e=>e.assessmentId===assessment.id&&e.entryStatus==='graded');return rows.length?Math.round(rows.reduce((s,e)=>s+e.score/assessment.maxScore*100,0)/rows.length):0;}

async function renderGrades(){
  const ctx=await gradingContext();const canManage=['admin','teacher'].includes(state.user.role);
  if(!canManage)return renderGradesReadOnly(ctx);
  $('#view-root').innerHTML=`<div class="page">${renderPageHeader('الدرجات والتقييمات','أنشئ التقييم، أدخل الدرجات، ثم أرسلها للاعتماد والنشر.', '<button class="button button--primary" id="add-assessment">＋ تقييم جديد</button>')}
    <div class="toolbar"><label class="search-control"><span>⌕</span><input id="assessment-search" type="search" placeholder="بحث باسم التقييم أو المادة"></label><select class="filter-select" id="assessment-status"><option value="">كل الحالات</option><option value="draft">مسودة</option><option value="submitted">للمراجعة</option><option value="approved">معتمد</option><option value="published">منشور</option></select></div>
    <section class="grid grid--3" id="assessment-grid">${ctx.assessments.map(a=>assessmentCard(a,ctx)).join('')||renderEmpty('لا تقييمات','أضف أول تقييم لمادة وشعبة.')}</section></div>`;
  const filter=()=>{const q=normalizeArabic($('#assessment-search').value),status=$('#assessment-status').value;$$('[data-assessment-card]').forEach(card=>card.hidden=(q&&!normalizeArabic(card.textContent).includes(q))||(status&&card.dataset.status!==status));};
  $('#assessment-search').addEventListener('input',filter);$('#assessment-status').addEventListener('change',filter);
  $('#add-assessment').addEventListener('click',()=>openAssessmentForm(ctx));
  $$('[data-enter-grades]').forEach(b=>b.addEventListener('click',()=>openGradebook(ctx,b.dataset.enterGrades)));
  $$('[data-assessment-action]').forEach(b=>b.addEventListener('click',()=>transitionAssessment(ctx,b.dataset.assessmentAction,b.dataset.assessmentId)));
}

function assessmentCard(a,ctx){const avg=assessmentAverage(a,ctx.entries),count=ctx.entries.filter(e=>e.assessmentId===a.id&&e.entryStatus==='graded').length;let action='';if(a.status==='draft')action=`<button class="button button--primary" data-enter-grades="${a.id}">إدخال الدرجات</button><button class="button button--secondary" data-assessment-action="submit" data-assessment-id="${a.id}">إرسال للمراجعة</button>`;if(a.status==='submitted'&&state.user.role==='admin')action=`<button class="button button--success" data-assessment-action="approve" data-assessment-id="${a.id}">اعتماد</button>`;if(a.status==='approved'&&state.user.role==='admin')action=`<button class="button button--primary" data-assessment-action="publish" data-assessment-id="${a.id}">نشر النتائج</button>`;return`<article class="card" data-assessment-card data-status="${a.status}"><header class="card__header"><div><h3>${escapeHtml(a.name)}</h3><p>${escapeHtml(ctx.subjectMap.get(a.subjectId)?.name||'')} · ${escapeHtml(ctx.sectionMap.get(a.sectionId)?.name||'')}</p></div>${statusBadge(a.status)}</header><div class="metric-strip"><div class="metric-chip"><small>الدرجة القصوى</small><strong>${a.maxScore}</strong></div><div class="metric-chip"><small>المتوسط</small><strong>${avg}%</strong></div><div class="metric-chip"><small>المدخل</small><strong>${count}</strong></div></div><p class="card-meta">التاريخ: ${formatDate(a.date)} · الوزن: ${a.weightBasisPoints/100}%</p><div class="page-actions">${action||'<button class="button button--secondary" data-enter-grades="'+a.id+'">عرض الدرجات</button>'}</div></article>`;}

function openAssessmentForm(ctx){
  let availableAssignments=ctx.assignments.filter(a=>a.status==='active');if(state.user.role==='teacher')availableAssignments=availableAssignments.filter(a=>a.teacherId===state.user.profileId);
  openModal({title:'إنشاء تقييم جديد',kicker:'التقييمات',body:`<form id="assessment-form" class="form-grid"><div class="field field--full"><label>التكليف *</label><select name="assignmentId" required><option value="">اختر المادة والشعبة</option>${availableAssignments.map(a=>`<option value="${a.id}">${escapeHtml(ctx.subjectMap.get(a.subjectId)?.name||'')} — ${escapeHtml(ctx.sectionMap.get(a.sectionId)?.name||'')}</option>`).join('')}</select></div><div class="field"><label>اسم التقييم *</label><input name="name" required placeholder="اختبار الشهر الثاني"></div><div class="field"><label>النوع</label><select name="type"><option value="exam">اختبار</option><option value="assignment">واجب</option><option value="activity">نشاط</option></select></div><div class="field"><label>التاريخ *</label><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>الدرجة القصوى *</label><input name="maxScore" type="number" min="1" value="20" required></div><div class="field"><label>الوزن % *</label><input name="weight" type="number" min="0.01" max="100" step="0.01" value="20" required></div><p class="form-message field--full" id="assessment-message"></p></form>`,footer:'<button class="button button--primary" id="save-assessment">إنشاء التقييم</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#save-assessment').addEventListener('click',async()=>{const form=$('#assessment-form');if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form)),assignment=availableAssignments.find(a=>a.id===d.assignmentId);if(!assignment){$('#assessment-message').textContent='التكليف المحدد غير موجود أو غير نشط.';return;}const weight=Math.round(Number(d.weight)*100);const used=ctx.allAssessments.filter(a=>a.sectionId===assignment.sectionId&&a.subjectId===assignment.subjectId&&a.termId===assignment.termId&&a.status!=='archived').reduce((s,a)=>s+a.weightBasisPoints,0);if(used+weight>10000){$('#assessment-message').textContent=`مجموع الأوزان سيصبح ${(used+weight)/100}%، والحد 100%.`;return;}const assessment=baseRecord(uid('assessment'),{academicYearId:assignment.academicYearId,termId:assignment.termId,sectionId:assignment.sectionId,subjectId:assignment.subjectId,teacherId:assignment.teacherId,name:d.name.trim(),type:d.type,date:d.date,maxScore:Number(d.maxScore),weightBasisPoints:weight,status:'draft',submittedAt:null,approvedAt:null,publishedAt:null,createdBy:state.user.id,updatedBy:state.user.id});await dbPut('assessments',assessment);await audit('ASSESSMENT_CREATED','assessment',assessment.id,null,{name:assessment.name,assignmentId:assignment.id});closeModal();showToast('تم إنشاء التقييم','يمكنك الآن إدخال درجات الطلاب.','success');renderGrades();});}});
}

function openGradebook(ctx,assessmentId){const a=ctx.allAssessments.find(x=>x.id===assessmentId);const enrollmentRows=ctx.enrollments.filter(e=>e.sectionId===a.sectionId&&e.status==='active');const students=ctx.students.filter(s=>enrollmentRows.some(e=>e.studentId===s.id)&&s.status==='active');const entries=ctx.entries.filter(e=>e.assessmentId===a.id);const editable=a.status==='draft'&&(['admin','teacher'].includes(state.user.role));openModal({title:a.name,kicker:`${ctx.subjectMap.get(a.subjectId)?.name||''} · ${ctx.sectionMap.get(a.sectionId)?.name||''}`,size:'850px',body:`<div class="table-wrap"><table class="data-table"><thead><tr><th>الطالب</th><th>الحالة</th><th>الدرجة / ${a.maxScore}</th><th>ملاحظة</th></tr></thead><tbody id="gradebook-body">${students.map(student=>{const e=entries.find(x=>x.studentId===student.id);return`<tr data-grade-student="${student.id}"><td data-label="الطالب">${escapeHtml(student.fullName)}</td><td data-label="الحالة"><select class="filter-select grade-status" ${editable?'':'disabled'}><option value="graded" ${(!e||e.entryStatus==='graded')?'selected':''}>مرصودة</option><option value="absent" ${e?.entryStatus==='absent'?'selected':''}>غائب</option><option value="excused" ${e?.entryStatus==='excused'?'selected':''}>معفى</option><option value="missing" ${e?.entryStatus==='missing'?'selected':''}>ناقصة</option></select></td><td data-label="الدرجة"><input class="grade-score" type="number" min="0" max="${a.maxScore}" step="0.5" value="${e?.score??''}" ${editable?'':'disabled'} style="width:90px"></td><td data-label="ملاحظة"><input class="grade-note" value="${escapeHtml(e?.note||'')}" ${editable?'':'disabled'}></td></tr>`}).join('')}</tbody></table></div><p class="form-message" id="gradebook-message"></p>`,footer:`${editable?'<button class="button button--primary" id="save-gradebook">حفظ الدرجات</button>':''}<button class="button button--secondary" data-modal-close>إغلاق</button>`,onOpen:()=>{$('#save-gradebook')?.addEventListener('click',async()=>{const rows=$$('[data-grade-student]');const values=rows.map(row=>({studentId:row.dataset.gradeStudent,entryStatus:$('.grade-status',row).value,score:$('.grade-score',row).value===''?null:Number($('.grade-score',row).value),note:$('.grade-note',row).value.trim()}));const invalid=values.find(v=>v.entryStatus==='graded'&&(v.score===null||v.score<0||v.score>a.maxScore));if(invalid){$('#gradebook-message').textContent=`كل درجة مرصودة يجب أن تكون بين 0 و${a.maxScore}.`;return;}await atomicWrite(['gradeEntries','auditLogs'],async stores=>{for(const v of values){const old=entries.find(e=>e.studentId===v.studentId);stores.gradeEntries.put(old?{...old,...v,updatedAt:nowIso(),updatedBy:state.user.id}:baseRecord(uid('grade'),{assessmentId:a.id,...v,createdBy:state.user.id,updatedBy:state.user.id}));}stores.auditLogs.put(auditRecord('GRADES_SAVED','assessment',a.id,null,{count:values.length}));});closeModal();showToast('تم حفظ الدرجات',`حُفظت درجات ${values.length} طالبًا.`,'success');renderGrades();});}});}

async function transitionAssessment(ctx,action,id){const a=ctx.allAssessments.find(x=>x.id===id);const map={submit:{from:'draft',to:'submitted'},approve:{from:'submitted',to:'approved'},publish:{from:'approved',to:'published'}},rule=map[action];if(!rule||a.status!==rule.from){showToast('تعذر الانتقال','حالة التقييم الحالية لا تسمح بهذا الإجراء.','error');return;}if(['approve','publish'].includes(action)&&state.user.role!=='admin'){showToast('غير مصرح','هذا الإجراء للمدير فقط.','error');return;}const entries=(await dbIndexAll('gradeEntries','assessmentId',a.id));if(action==='submit'){const enrolledIds=ctx.enrollments.filter(enrollment=>enrollment.sectionId===a.sectionId&&enrollment.status==='active').map(enrollment=>enrollment.studentId);const complete=enrolledIds.every(studentId=>entries.some(entry=>entry.studentId===studentId&&['graded','absent','excused','missing'].includes(entry.entryStatus)));if(!enrolledIds.length||!complete){showToast('الدرجات ناقصة','يجب حفظ حالة كل طالب في الشعبة قبل الإرسال للمراجعة.','error');return;}}a.status=rule.to;a.updatedAt=nowIso();a.updatedBy=state.user.id;if(action==='submit')a.submittedAt=nowIso();if(action==='approve')a.approvedAt=nowIso();if(action==='publish')a.publishedAt=nowIso();await dbPut('assessments',a);await audit(`ASSESSMENT_${rule.to.toUpperCase()}`,'assessment',a.id,{status:rule.from},{status:rule.to});showToast('تم تحديث الحالة',`أصبح التقييم: ${statusLabel(rule.to)}.`,'success');renderGrades();}

async function renderGradesReadOnly(ctx){const rows=[];for(const entry of ctx.entries.filter(e=>ctx.scopedIds.has(e.studentId))){const assessment=ctx.assessments.find(a=>a.id===entry.assessmentId);if(!assessment||assessment.status!=='published')continue;rows.push({entry,assessment,student:ctx.studentMap.get(entry.studentId)});}const graded=rows.filter(r=>r.entry.entryStatus==='graded');const avg=graded.length?Math.round(graded.reduce((s,r)=>s+r.entry.score/r.assessment.maxScore*100,0)/graded.length):0;const isPassing=row=>row.entry.entryStatus==='graded'&&row.entry.score/row.assessment.maxScore*100>=(ctx.subjectMap.get(row.assessment.subjectId)?.passScore??50);$('#view-root').innerHTML=`<div class="page">${renderPageHeader('النتائج الدراسية','الدرجات المنشورة فقط للطلاب ضمن حسابك.')}
  <section class="grid grid--3" style="margin-bottom:16px"><article class="card stat-card green"><span class="stat-icon">◇</span><div class="stat-copy"><small>متوسط النتائج</small><strong>${avg}%</strong></div></article><article class="card stat-card"><span class="stat-icon">▤</span><div class="stat-copy"><small>التقييمات المنشورة</small><strong>${rows.length}</strong></div></article><article class="card stat-card amber"><span class="stat-icon">✓</span><div class="stat-copy"><small>الناجحة</small><strong>${rows.filter(isPassing).length}</strong></div></article></section>
  <section class="card data-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>الطالب</th><th>المادة</th><th>التقييم</th><th>الدرجة</th><th>النسبة</th><th>الحالة</th></tr></thead><tbody>${rows.map(r=>{const pct=r.entry.entryStatus==='graded'?Math.round(r.entry.score/r.assessment.maxScore*100):null;return`<tr><td data-label="الطالب">${escapeHtml(r.student?.fullName||'')}</td><td data-label="المادة">${escapeHtml(ctx.subjectMap.get(r.assessment.subjectId)?.name||'')}</td><td data-label="التقييم">${escapeHtml(r.assessment.name)}</td><td data-label="الدرجة">${r.entry.entryStatus==='graded'?`${r.entry.score} / ${r.assessment.maxScore}`:'—'}</td><td data-label="النسبة"><strong>${pct===null?'—':pct+'%'}</strong></td><td data-label="الحالة">${pct===null?statusBadge(r.entry.entryStatus):statusBadge(isPassing(r)?'passed':'failed')}</td></tr>`}).join('')||`<tr><td colspan="6">${renderEmpty('لا نتائج منشورة','ستظهر النتائج بعد اعتمادها ونشرها.')}</td></tr>`}</tbody></table></div></section></div>`;}

async function renderCertificates(){const [certificates,students]=await Promise.all([dbGetAll('certificates'),dbGetAll('students')]);const scoped=new Set(await getScopedStudentIds());const visible=certificates.filter(c=>scoped.has(c.studentId)||state.user.role==='admin');const studentMap=new Map(students.map(s=>[s.id,s]));$('#view-root').innerHTML=`<div class="page">${renderPageHeader('الشهادات وكشوف الدرجات','إصدارات ثابتة من النتائج المعتمدة والمنشورة.',state.user.role==='admin'?'<button class="button button--primary" id="issue-certificate">＋ إصدار شهادة</button>':'')}
  <section class="grid grid--3">${visible.map(c=>`<article class="card"><header class="card__header"><div><h3>${escapeHtml(studentMap.get(c.studentId)?.fullName||'')}</h3><p>${escapeHtml(c.certificateNo)}</p></div>${statusBadge(c.status)}</header><p><strong>الفصل:</strong> ${escapeHtml(c.snapshot?.termName||'الفصل الأول')}</p><p><strong>المعدل:</strong> ${c.snapshot?.average??0}%</p><p><strong>النتيجة:</strong> ${c.snapshot?.result||'—'}</p><div class="page-actions"><button class="button button--secondary" data-view-certificate="${c.id}">عرض وطباعة</button></div></article>`).join('')||renderEmpty('لا توجد شهادات','لم تصدر شهادة ضمن نطاق حسابك بعد.')}</section></div>`;
  $('#issue-certificate')?.addEventListener('click',()=>openCertificateIssuer(students));$$('[data-view-certificate]').forEach(b=>b.addEventListener('click',()=>openCertificate(visible.find(c=>c.id===b.dataset.viewCertificate),studentMap.get(visible.find(c=>c.id===b.dataset.viewCertificate)?.studentId))));}

function openCertificateIssuer(students){openModal({title:'إصدار شهادة',kicker:'الشهادات',body:`<form id="certificate-form" class="form-grid"><div class="field field--full"><label>الطالب *</label><select name="studentId" required><option value="">اختر الطالب</option>${students.filter(s=>s.status==='active').map(s=>`<option value="${s.id}">${escapeHtml(s.fullName)} — ${escapeHtml(s.admissionNo)}</option>`).join('')}</select></div><p class="form-message field--full" id="certificate-message"></p></form>`,footer:'<button class="button button--primary" id="save-certificate">إصدار الشهادة</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#save-certificate').addEventListener('click',async()=>{const form=$('#certificate-form');if(!form.reportValidity())return;const studentId=new FormData(form).get('studentId');const assessments=(await dbGetAll('assessments')).filter(a=>a.status==='published'),entries=(await dbIndexAll('gradeEntries','studentId',studentId)).filter(e=>e.entryStatus==='graded'),subjects=await dbGetAll('subjects');const subjectMap=new Map(subjects.map(s=>[s.id,s]));const rows=[];for(const a of assessments){const e=entries.find(x=>x.assessmentId===a.id),subject=subjectMap.get(a.subjectId);if(e)rows.push({subjectId:a.subjectId,subjectName:subject?.name||'',assessment:a.name,score:e.score,maxScore:a.maxScore,percentage:Math.round(e.score/a.maxScore*100),passScore:subject?.passScore??50});}if(!rows.length){$('#certificate-message').textContent='لا توجد نتائج منشورة لهذا الطالب.';return;}const existing=(await dbIndexAll('certificates','studentId',studentId)).find(item=>item.status==='active');if(existing){$('#certificate-message').textContent=`توجد شهادة نشطة بالفعل برقم ${existing.certificateNo}. يجب إضافة دورة الإلغاء والاستبدال قبل إصدار نسخة جديدة.`;return;}const average=Math.round(rows.reduce((s,r)=>s+r.percentage,0)/rows.length),passed=rows.every(row=>row.percentage>=row.passScore);const count=await dbCount('certificates');const activeYear=(await dbGetAll('academicYears')).find(year=>year.isActive);const certificate=baseRecord(uid('certificate'),{certificateNo:`RGS-2026-${String(count+1).padStart(4,'0')}`,studentId,academicYearId:activeYear?.id||'year-2026',termId:'term-1',snapshot:{termName:activeYear?.terms?.find(term=>term.id==='term-1')?.name||'الفصل الأول',rows,average,result:passed?'ناجح':'يحتاج متابعة'},issuedAt:nowIso(),issuedBy:state.user.id,status:'active',supersedesId:null,voidReason:null,createdBy:state.user.id,updatedBy:state.user.id});await dbPut('certificates',certificate);await audit('CERTIFICATE_ISSUED','certificate',certificate.id,null,{certificateNo:certificate.certificateNo,studentId});closeModal();showToast('تم إصدار الشهادة',certificate.certificateNo,'success');renderCertificates();});}});}

async function openCertificate(certificate, student) {
  const school = (await getSetting('schoolProfile'))?.value || { name: SCHOOL_NAME, logoPath: SCHOOL_LOGO };
  const schoolName = school.name || SCHOOL_NAME;
  const logoPath = school.logoPath || SCHOOL_LOGO;
  openModal({
    title: 'كشف الدرجات',
    kicker: certificate.certificateNo,
    size: '800px',
    body: `<section id="certificate-print" class="certificate-sheet">
      <header class="certificate-brand">
        <img class="certificate-logo" src="${escapeHtml(logoPath)}" alt="شعار ${escapeHtml(schoolName)}">
        <h2 class="certificate-school-name">${escapeHtml(schoolName)}</h2>
        <p class="certificate-subtitle">كشف الدرجات الرسمي</p>
      </header>
      <h3 class="certificate-title">${escapeHtml(certificate.snapshot.termName)}</h3>
      <p class="certificate-student">${escapeHtml(student?.fullName || '')} · ${escapeHtml(student?.admissionNo || '')}</p>
      <table class="data-table"><thead><tr><th>المادة</th><th>التقييم</th><th>الدرجة</th><th>النسبة</th></tr></thead><tbody>${certificate.snapshot.rows.map(row => `<tr><td>${escapeHtml(row.subjectName)}</td><td>${escapeHtml(row.assessment)}</td><td>${row.score} / ${row.maxScore}</td><td>${row.percentage}%</td></tr>`).join('')}</tbody></table>
      <div class="metric-strip" style="margin-top:20px;justify-content:center"><div class="metric-chip"><small>المعدل</small><strong>${certificate.snapshot.average}%</strong></div><div class="metric-chip"><small>النتيجة</small><strong>${escapeHtml(certificate.snapshot.result)}</strong></div><div class="metric-chip"><small>تاريخ الإصدار</small><strong>${formatDate(certificate.issuedAt)}</strong></div></div>
    </section>`,
    footer: '<button class="button button--primary" id="print-certificate">طباعة الشهادة</button><button class="button button--secondary" data-modal-close>إغلاق</button>',
    onOpen: () => {
      $('#print-certificate').addEventListener('click', () => {
        document.body.classList.add('certificate-printing');
        const cleanup = () => document.body.classList.remove('certificate-printing');
        window.addEventListener('afterprint', cleanup, { once: true });
        window.print();
        setTimeout(cleanup, 1500);
      });
    },
  });
}

async function financeContext(){const [invoices,payments,students,enrollments,sections,feePlans]=await Promise.all([dbGetAll('invoices'),dbGetAll('payments'),dbGetAll('students'),dbGetAll('enrollments'),dbGetAll('sections'),dbGetAll('feePlans')]);const scoped=new Set(await getScopedStudentIds());return{invoices:invoices.filter(i=>scoped.has(i.studentId)),allInvoices:invoices,payments:payments.filter(p=>scoped.has(p.studentId)),students:students.filter(s=>scoped.has(s.id)||state.user.role==='admin'),allStudents:students,enrollments,sections,feePlans,studentMap:new Map(students.map(s=>[s.id,s]))};}

function calculateInvoiceStatus(invoice){if(invoice.status==='voided')return'voided';if(invoice.balanceMinor<=0)return'paid';if(invoice.paidMinor>0)return'partial';if(new Date(invoice.dueDate)<new Date(new Date().toISOString().slice(0,10)))return'overdue';return'unpaid';}

async function renderFinance(){const ctx=await financeContext();const canManage=state.user.role==='admin';for(const invoice of ctx.invoices)invoice.status=calculateInvoiceStatus(invoice);const total=ctx.invoices.reduce((s,i)=>s+i.totalMinor,0),paid=ctx.invoices.reduce((s,i)=>s+i.paidMinor,0),balance=ctx.invoices.reduce((s,i)=>s+i.balanceMinor,0);$('#view-root').innerHTML=`<div class="page">${renderPageHeader('الرسوم والمدفوعات',canManage?'إدارة الفواتير وتسجيل الدفعات وإصدار الإيصالات.':'الفواتير والمدفوعات للطلاب ضمن حسابك.',canManage?'<button class="button button--primary" id="new-invoice">＋ فاتورة جديدة</button><button class="button button--success" id="new-payment">＋ تسجيل دفعة</button>':'')}
  <section class="grid grid--3" style="margin-bottom:16px"><article class="card stat-card"><span class="stat-icon">₪</span><div class="stat-copy"><small>إجمالي الرسوم</small><strong>${formatMoney(total)}</strong></div></article><article class="card stat-card green"><span class="stat-icon">✓</span><div class="stat-copy"><small>المحصل</small><strong>${formatMoney(paid)}</strong><span class="trend">${total?Math.round(paid/total*100):0}% من الإجمالي</span></div></article><article class="card stat-card red"><span class="stat-icon">!</span><div class="stat-copy"><small>المتبقي</small><strong>${formatMoney(balance)}</strong></div></article></section>
  <div class="toolbar"><label class="search-control"><span>⌕</span><input id="finance-search" type="search" placeholder="بحث بالطالب أو رقم الفاتورة"></label><select class="filter-select" id="finance-status"><option value="">كل الحالات</option><option value="paid">مدفوعة</option><option value="partial">جزئية</option><option value="unpaid">غير مدفوعة</option><option value="overdue">متأخرة</option></select></div>
  <section class="card data-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>الفاتورة</th><th>الطالب</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الاستحقاق</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody id="finance-body"></tbody></table></div></section></div>`;
  const draw=()=>{const q=normalizeArabic($('#finance-search').value),status=$('#finance-status').value;const rows=ctx.invoices.filter(i=>(!q||normalizeArabic(ctx.studentMap.get(i.studentId)?.fullName).includes(q)||i.invoiceNo.toLowerCase().includes(q))&&(!status||i.status===status));$('#finance-body').innerHTML=rows.map(i=>`<tr><td data-label="الفاتورة"><strong>${escapeHtml(i.invoiceNo)}</strong></td><td data-label="الطالب">${escapeHtml(ctx.studentMap.get(i.studentId)?.fullName||'')}</td><td data-label="الإجمالي">${formatMoney(i.totalMinor)}</td><td data-label="المدفوع">${formatMoney(i.paidMinor)}</td><td data-label="المتبقي"><strong>${formatMoney(i.balanceMinor)}</strong></td><td data-label="الاستحقاق">${formatDate(i.dueDate)}</td><td data-label="الحالة">${statusBadge(i.status)}</td><td data-label="إجراءات"><div class="table-actions"><button class="icon-button" data-view-invoice="${i.id}" aria-label="عرض الفاتورة">◉</button>${canManage&&i.balanceMinor>0?`<button class="icon-button" data-pay-invoice="${i.id}" aria-label="تسجيل دفعة">₪</button>`:''}</div></td></tr>`).join('')||`<tr><td colspan="8">${renderEmpty('لا توجد فواتير','لا توجد نتائج مطابقة.')}</td></tr>`;$$('[data-view-invoice]').forEach(b=>b.addEventListener('click',()=>openInvoiceDetails(ctx,b.dataset.viewInvoice)));$$('[data-pay-invoice]').forEach(b=>b.addEventListener('click',()=>openPaymentForm(ctx,b.dataset.payInvoice)));};draw();$('#finance-search').addEventListener('input',draw);$('#finance-status').addEventListener('change',draw);$('#new-invoice')?.addEventListener('click',()=>openInvoiceForm(ctx));$('#new-payment')?.addEventListener('click',()=>openPaymentForm(ctx));}

function openInvoiceDetails(ctx,id){const i=ctx.allInvoices.find(x=>x.id===id),student=ctx.studentMap.get(i.studentId),payments=ctx.payments.filter(p=>p.invoiceId===i.id);openModal({title:`فاتورة ${i.invoiceNo}`,kicker:student?.fullName||'',body:`<div class="grid grid--3"><div class="metric-chip"><small>الإجمالي</small><strong>${formatMoney(i.totalMinor)}</strong></div><div class="metric-chip"><small>المدفوع</small><strong>${formatMoney(i.paidMinor)}</strong></div><div class="metric-chip"><small>المتبقي</small><strong>${formatMoney(i.balanceMinor)}</strong></div></div><h3>البنود</h3><div class="table-wrap"><table class="data-table"><tbody>${(i.items||[]).map(item=>`<tr><td>${escapeHtml(item.label)}</td><td>${formatMoney(item.amountMinor)}</td></tr>`).join('')}</tbody></table></div><h3>الدفعات</h3>${payments.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>الإيصال</th><th>المبلغ</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>${payments.map(p=>`<tr><td>${escapeHtml(p.receiptNo)}</td><td>${formatMoney(p.amountMinor)}</td><td>${formatDate(p.paidAt)}</td><td>${statusBadge(p.status)}</td></tr>`).join('')}</tbody></table></div>`:renderEmpty('لا دفعات','لم تسجل دفعات لهذه الفاتورة.')}`,footer:'<button class="button button--secondary" data-modal-close>إغلاق</button><button class="button button--primary" id="print-invoice">طباعة</button>',onOpen:()=>{$('#print-invoice').addEventListener('click',()=>window.print());}});}

function openInvoiceForm(ctx){openModal({title:'إنشاء فاتورة',kicker:'المالية',body:`<form id="invoice-form" class="form-grid"><div class="field field--full"><label>الطالب *</label><select name="studentId" required><option value="">اختر الطالب</option>${ctx.allStudents.filter(s=>s.status==='active').map(s=>`<option value="${s.id}">${escapeHtml(s.fullName)} — ${escapeHtml(s.admissionNo)}</option>`).join('')}</select></div><div class="field"><label>المبلغ الأساسي *</label><input name="subtotal" type="number" min="0.01" step="0.01" required value="2000"></div><div class="field"><label>الخصم</label><input name="discount" type="number" min="0" step="0.01" value="0"></div><div class="field"><label>الاستحقاق *</label><input name="dueDate" type="date" required value="${new Date(Date.now()+30*86400000).toISOString().slice(0,10)}"></div><div class="field"><label>وصف البند</label><input name="label" value="القسط الدراسي"></div><p class="form-message field--full" id="invoice-message"></p></form>`,footer:'<button class="button button--primary" id="save-invoice">إصدار الفاتورة</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#save-invoice').addEventListener('click',async()=>{const form=$('#invoice-form');if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form)),subtotal=Math.round(Number(d.subtotal)*100),discount=Math.round(Number(d.discount||0)*100);if(discount>subtotal){$('#invoice-message').textContent='الخصم لا يمكن أن يتجاوز المبلغ الأساسي.';return;}const count=await dbCount('invoices'),total=subtotal-discount;const invoice=baseRecord(uid('invoice'),{invoiceNo:`INV-2026-${String(count+1).padStart(4,'0')}`,studentId:d.studentId,academicYearId:'year-2026',feePlanId:null,items:[{code:'CUSTOM',label:d.label.trim()||'رسوم مدرسية',amountMinor:subtotal}],subtotalMinor:subtotal,discountMinor:discount,adjustmentsMinor:0,totalMinor:total,paidMinor:0,balanceMinor:total,dueDate:d.dueDate,status:'unpaid',createdBy:state.user.id,updatedBy:state.user.id});await dbPut('invoices',invoice);await audit('INVOICE_ISSUED','invoice',invoice.id,null,{invoiceNo:invoice.invoiceNo,totalMinor:total,studentId:d.studentId});closeModal();showToast('تم إصدار الفاتورة',invoice.invoiceNo,'success');renderFinance();});}});}

function openPaymentForm(ctx,invoiceId=''){const unpaid=ctx.allInvoices.filter(i=>i.balanceMinor>0&&i.status!=='voided');openModal({title:'تسجيل دفعة',kicker:'المدفوعات',body:`<form id="payment-form" class="form-grid"><div class="field field--full"><label>الفاتورة *</label><select name="invoiceId" id="payment-invoice" required><option value="">اختر الفاتورة</option>${unpaid.map(i=>`<option value="${i.id}" ${i.id===invoiceId?'selected':''}>${escapeHtml(i.invoiceNo)} — ${escapeHtml(ctx.studentMap.get(i.studentId)?.fullName||'')} — متبقي ${formatMoney(i.balanceMinor)}</option>`).join('')}</select></div><div class="field"><label>المبلغ *</label><input name="amount" id="payment-amount" type="number" min="0.01" step="0.01" required></div><div class="field"><label>الطريقة</label><select name="method"><option value="cash">نقدي</option><option value="bank_transfer">تحويل بنكي</option><option value="local_card">بطاقة محلية</option><option value="other">أخرى</option></select></div><div class="field field--full"><label>المرجع</label><input name="reference"></div><p class="form-message field--full" id="payment-message"></p></form>`,footer:'<button class="button button--success" id="save-payment">تسجيل وإصدار إيصال</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{const sync=()=>{const i=unpaid.find(x=>x.id===$('#payment-invoice').value);if(i)$('#payment-amount').value=(i.balanceMinor/100).toFixed(2);};$('#payment-invoice').addEventListener('change',sync);sync();$('#save-payment').addEventListener('click',async()=>{const form=$('#payment-form');if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form)),invoice=unpaid.find(i=>i.id===d.invoiceId),amount=Math.round(Number(d.amount)*100);if(!invoice){$('#payment-message').textContent='اختر فاتورة صحيحة.';return;}if(amount<=0||amount>invoice.balanceMinor){$('#payment-message').textContent=`المبلغ يجب أن يكون أكبر من صفر ولا يتجاوز ${formatMoney(invoice.balanceMinor)}.`;return;}const count=await dbCount('payments'),payment=baseRecord(uid('payment'),{receiptNo:`REC-2026-${String(count+1).padStart(4,'0')}`,invoiceId:invoice.id,studentId:invoice.studentId,amountMinor:amount,method:d.method,reference:d.reference.trim(),paidAt:nowIso(),status:'posted',voidReason:null,voidedAt:null,voidedBy:null,createdBy:state.user.id,updatedBy:state.user.id}),updated={...invoice,paidMinor:invoice.paidMinor+amount,balanceMinor:invoice.balanceMinor-amount,updatedAt:nowIso(),updatedBy:state.user.id};updated.status=calculateInvoiceStatus(updated);await atomicWrite(['payments','invoices','auditLogs'],async stores=>{stores.payments.put(payment);stores.invoices.put(updated);stores.auditLogs.put(auditRecord('PAYMENT_POSTED','payment',payment.id,null,{receiptNo:payment.receiptNo,amountMinor:amount,invoiceId:invoice.id}));});closeModal();showToast('تم تسجيل الدفعة',`رقم الإيصال ${payment.receiptNo}`,'success');renderFinance();});}});}

async function renderReports(){const data=await dashboardData();const sectionMap=new Map(data.sections.map(s=>[s.id,s]));const alerts=[];if(data.attendanceRate<85)alerts.push({type:'danger',title:'انخفاض في الحضور',body:`بلغت نسبة الحضور ${data.attendanceRate}% ضمن نطاق العرض، وهي أقل من حد المتابعة 85%.`,action:'راجع سجلات الغياب',route:'attendance'});if(data.outstanding>0)alerts.push({type:'warning',title:'أرصدة تحتاج متابعة',body:`إجمالي الرصيد المستحق ${formatMoney(data.outstanding)}. هذا التنبيه مالي فقط ولا يدخل في تقييم الطلاب.`,action:'افتح التقرير المالي',route:'finance'});if(data.gradeAverage<65)alerts.push({type:'danger',title:'متوسط أداء منخفض',body:`متوسط النتائج المنشورة ${data.gradeAverage}% ويستحسن مراجعة التقييمات الناقصة.`,action:'راجع الدرجات',route:'grades'});if(!alerts.length)alerts.push({type:'success',title:'المؤشرات ضمن النطاق المتوقع',body:'لا توجد قواعد متابعة حرجة وفق البيانات الحالية.',action:'عرض لوحة التحكم',route:'dashboard'});const sectionAttendance=data.sections.map(section=>{const studentIds=new Set(data.enrollments.filter(e=>e.sectionId===section.id).map(e=>e.studentId));const rows=data.records.filter(r=>studentIds.has(r.studentId));return{name:section.name,value:rows.length?Math.round(rows.filter(r=>['present','late'].includes(r.status)).length/rows.length*100):0};});$('#view-root').innerHTML=`<div class="page">${renderPageHeader('التقارير والتحليلات','مؤشرات مبنية على البيانات المحلية مع تفسير مصدر كل تنبيه.','<button class="button button--secondary" id="export-report">تصدير CSV</button>')}
  <section class="grid grid--dashboard"><article class="card span-7"><header class="card__header"><div><h3>الحضور حسب الشعبة</h3><p>النسبة تشمل حاضر ومتأخر ضمن الجلسات المسجلة</p></div></header><div class="bar-list">${sectionAttendance.map(s=>`<div class="bar-row"><span>${escapeHtml(s.name)}</span><div class="bar-track"><div class="bar-fill ${s.value>=90?'green':s.value<75?'red':''}" style="width:${s.value}%"></div></div><strong>${s.value}%</strong></div>`).join('')}</div></article><article class="card span-5"><header class="card__header"><div><h3>ملخص المؤشرات</h3><p>القيم الداخلة في التحليل</p></div></header><div class="metric-strip" style="flex-wrap:wrap"><div class="metric-chip"><small>الطلاب</small><strong>${data.students.length}</strong></div><div class="metric-chip"><small>الحضور</small><strong>${data.attendanceRate}%</strong></div><div class="metric-chip"><small>الأداء</small><strong>${data.gradeAverage}%</strong></div><div class="metric-chip"><small>المتأخرات</small><strong>${formatMoney(data.outstanding)}</strong></div></div></article><article class="card span-12"><header class="card__header"><div><h3>اقتراحات المتابعة الذكية</h3><p>قواعد محلية مفسرة — لا تغيّر أي سجل تلقائيًا</p></div></header><div class="grid grid--3">${alerts.map(a=>`<div class="alert-card is-${a.type}"><span class="alert-card__icon">${a.type==='success'?'✓':'!'}</span><div class="alert-card__copy"><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.body)}</p><button data-alert-route="${a.route}">${escapeHtml(a.action)} ←</button></div></div>`).join('')}</div></article></section></div>`;$$('[data-alert-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.alertRoute)));$('#export-report').addEventListener('click',()=>downloadCsv('school-report.csv',[['المؤشر','القيمة'],['الطلاب',data.students.length],['الحضور',`${data.attendanceRate}%`],['متوسط الأداء',`${data.gradeAverage}%`],['الرصيد',data.outstanding/100],...sectionAttendance.map(s=>[`حضور ${s.name}`,`${s.value}%`])]));}

function downloadCsv(filename,rows){const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function renderUsers(){
  const users=await dbGetAll('users');
  $('#view-root').innerHTML=`<div class="page">${renderPageHeader('المستخدمون والصلاحيات','إدارة الحسابات المحلية وربط كل حساب بملف واحد.','<button class="button button--primary" id="add-user">＋ حساب جديد</button>')}
    <div class="alert-card is-warning" style="margin-bottom:16px"><span class="alert-card__icon">!</span><div class="alert-card__copy"><h4>الحسابات محلية لهذا المتصفح</h4><p>لأن النظام يستخدم IndexedDB، لن يظهر الحساب أو بياناته على جهاز آخر. جرّب الأدوار في المتصفح نفسه، أو انقل نسخة احتياطية. التشغيل متعدد الأجهزة يحتاج قاعدة بيانات وخادماً مركزياً.</p></div></div>
    <section class="card data-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>المستخدم</th><th>اسم الدخول</th><th>الدور</th><th>الملف المرتبط</th><th>آخر دخول</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${users.map(user=>`<tr><td data-label="المستخدم"><div class="cell-person">${userAvatarMarkup(user)}<span><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(user.id)}</small></span></div></td><td data-label="اسم الدخول" dir="ltr">${escapeHtml(user.username)}</td><td data-label="الدور">${escapeHtml(roleInfo(user.role).label)}</td><td data-label="الملف">${user.role==='admin'?'إداري':user.profileId?'<span class="status status--success">مرتبط</span>':'<span class="status status--danger">غير مرتبط</span>'}</td><td data-label="آخر دخول">${user.lastLoginAt?formatDate(user.lastLoginAt)+' '+formatTime(user.lastLoginAt):'لم يدخل بعد'}</td><td data-label="الحالة">${statusBadge(user.status)}</td><td data-label="إجراءات"><div class="table-actions"><button class="icon-button" data-reset-password="${user.id}" title="تغيير كلمة المرور">⚿</button>${user.id!==state.user.id?`<button class="icon-button" data-toggle-user="${user.id}" title="${user.status==='active'?'إيقاف':'تفعيل'}">${user.status==='active'?'⊘':'✓'}</button>`:''}</div></td></tr>`).join('')}</tbody></table></div></section></div>`;
  $('#add-user').addEventListener('click',()=>openUserForm());
  $$('[data-reset-password]').forEach(button=>button.addEventListener('click',()=>openPasswordReset(users.find(user=>user.id===button.dataset.resetPassword))));
  $$('[data-toggle-user]').forEach(button=>button.addEventListener('click',async()=>{const user=users.find(item=>item.id===button.dataset.toggleUser),before={status:user.status};user.status=user.status==='active'?'suspended':'active';user.updatedAt=nowIso();user.updatedBy=state.user.id;await dbPut('users',user);await audit(user.status==='active'?'USER_REACTIVATED':'USER_SUSPENDED','user',user.id,before,{status:user.status});showToast('تم تحديث الحساب',`أصبحت الحالة: ${statusLabel(user.status)}.`,'success');renderUsers();}));
}

async function validateNewAccountCredentials(username, password) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  if (!cleanUsername || !/^[a-z0-9._-]{3,40}$/.test(cleanUsername)) throw new Error('اسم المستخدم يجب أن يكون 3–40 حرفاً إنجليزياً أو رقماً، ويمكن استخدام النقطة والشرطة.');
  if (String(password || '').length < 8) throw new Error('كلمة المرور يجب ألا تقل عن 8 أحرف.');
  if ((await dbIndexAll('users','username',cleanUsername))[0]) throw new Error('اسم المستخدم موجود بالفعل.');
  return cleanUsername;
}

async function createLinkedUser({ role, profileId = null, displayName, username, password }) {
  const cleanUsername = await validateNewAccountCredentials(username, password);
  if (role !== 'admin' && !profileId) throw new Error('يجب اختيار الملف المرتبط لهذا الدور.');
  if (profileId && (await dbIndexAll('users','profileId',profileId))[0]) throw new Error('الملف المحدد مرتبط بحساب آخر بالفعل.');
  const derived = await derivePassword(password);
  const user=baseRecord(uid('user'),{username:cleanUsername,passwordHash:derived.hash,passwordSalt:derived.salt,passwordIterations:derived.iterations,role,profileId:profileId||null,displayName:String(displayName).trim(),lastLoginAt:null,failedAttempts:0,lockedUntil:null,createdBy:state.user.id,updatedBy:state.user.id});
  await atomicWrite(['users','auditLogs'],async stores=>{stores.users.put(user);stores.auditLogs.put(auditRecord('USER_CREATED','user',user.id,null,{username:user.username,role:user.role,profileId:user.profileId}));});
  return user;
}

async function openUserForm(preset={}){
  const [teachers,students,guardians,users]=await Promise.all([dbGetAll('teachers'),dbGetAll('students'),dbGetAll('guardians'),dbGetAll('users')]);
  const linkedIds=new Set(users.filter(user=>user.profileId).map(user=>user.profileId));
  openModal({title:'إنشاء حساب محلي',kicker:'المستخدمون',body:`<form id="user-form" class="form-grid"><div class="field"><label>الدور *</label><select name="role" id="new-user-role" required><option value="teacher" ${preset.role==='teacher'?'selected':''}>مدرس</option><option value="student" ${preset.role==='student'?'selected':''}>طالب</option><option value="guardian" ${preset.role==='guardian'?'selected':''}>ولي أمر</option><option value="admin" ${preset.role==='admin'?'selected':''}>مدير</option></select></div><div class="field"><label>الملف المرتبط *</label><select name="profileId" id="new-user-profile"></select></div><div class="field"><label>الاسم الظاهر *</label><input name="displayName" id="new-user-display" required value="${escapeHtml(preset.displayName||'')}"></div><div class="field"><label>اسم المستخدم *</label><input name="username" required dir="ltr" pattern="[A-Za-z0-9._-]{3,40}" placeholder="teacher.name"></div><div class="field field--full"><label>كلمة المرور *</label><input name="password" type="password" minlength="8" required autocomplete="new-password"><small>8 أحرف على الأقل. سلّمها للمستخدم بطريقة آمنة.</small></div><p class="form-message field--full" id="user-message"></p></form>`,footer:'<button class="button button--primary" id="save-user">إنشاء الحساب</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{
    const role=$('#new-user-role'),profile=$('#new-user-profile'),display=$('#new-user-display');
    const refresh=()=>{const list=role.value==='teacher'?teachers:role.value==='student'?students:role.value==='guardian'?guardians:[];if(role.value==='admin'){profile.innerHTML='<option value="">حساب إداري دون ملف</option>';profile.required=false;}else{const available=list.filter(item=>item.status==='active'&&(!linkedIds.has(item.id)||item.id===preset.profileId));profile.innerHTML='<option value="">اختر الملف</option>'+available.map(item=>`<option value="${item.id}" ${item.id===preset.profileId?'selected':''}>${escapeHtml(item.fullName)}</option>`).join('');profile.required=true;}syncDisplay();};
    const syncDisplay=()=>{if(role.value==='admin')return;const list=role.value==='teacher'?teachers:role.value==='student'?students:guardians;const selected=list.find(item=>item.id===profile.value);if(selected)display.value=selected.fullName;};
    role.addEventListener('change',refresh);profile.addEventListener('change',syncDisplay);refresh();
    $('#save-user').addEventListener('click',async()=>{const form=$('#user-form');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));try{const user=await createLinkedUser(data);closeModal();showToast('تم إنشاء الحساب',`اسم الدخول: ${user.username}`,'success');if(state.route==='users')await renderUsers();else if(state.route==='teachers')await renderTeachers();else if(state.route==='students')await renderStudents();else if(state.route==='guardians')await renderGuardians();}catch(error){$('#user-message').textContent=error.message;}});
  }});
}

function openPasswordReset(user){
  openModal({title:'تغيير كلمة المرور',kicker:`@${user.username}`,body:'<form id="password-reset-form" class="form-grid"><div class="field field--full"><label>كلمة المرور الجديدة *</label><input name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field field--full"><label>تأكيد كلمة المرور *</label><input name="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></div><p class="form-message field--full" id="password-reset-message"></p></form>',footer:'<button class="button button--primary" id="save-password">حفظ كلمة المرور</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#save-password').addEventListener('click',async()=>{const form=$('#password-reset-form');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));if(data.password!==data.confirmPassword){$('#password-reset-message').textContent='كلمتا المرور غير متطابقتين.';return;}const derived=await derivePassword(data.password);const before={passwordChangedAt:user.passwordChangedAt||null};Object.assign(user,{passwordHash:derived.hash,passwordSalt:derived.salt,passwordIterations:derived.iterations,passwordChangedAt:nowIso(),failedAttempts:0,lockedUntil:null,updatedAt:nowIso(),updatedBy:state.user.id});await dbPut('users',user);await audit('USER_PASSWORD_RESET','user',user.id,before,{passwordChangedAt:user.passwordChangedAt});closeModal();showToast('تم تغيير كلمة المرور',`الحساب @${user.username} جاهز للدخول.`,'success');});}});
}

async function getSetting(key){return(await dbIndexAll('settings','key',key))[0]||null;}

function stableStringify(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

async function canonicalChecksum(payload){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stableStringify(payload)));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}

async function createBackupPayload(){const stores={};for(const name of Object.keys(SCHEMA))stores[name]=await dbGetAll(name);const payload={format:BACKUP_FORMAT,formatVersion:1,schemaVersion:DB_VERSION,exportedAt:nowIso(),schoolId:'ruwad-gaza-secondary-school',stores,counts:Object.fromEntries(Object.entries(stores).map(([name,rows])=>[name,rows.length]))};payload.checksum=await canonicalChecksum(payload);return payload;}

async function downloadBackup(){const payload=await createBackupPayload(),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ruwad-gaza-school-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);await audit('BACKUP_EXPORTED','system','database',null,{counts:payload.counts});showToast('تم إنشاء النسخة','احفظ الملف في مكان آمن؛ فهو يحتوي بيانات حساسة.','success');}

async function validateBackup(payload){if(!payload||![BACKUP_FORMAT,LEGACY_BACKUP_FORMAT].includes(payload.format))throw new Error(`هذا الملف ليس نسخة معتمدة لنظام ${SCHOOL_NAME}.`);if(payload.schemaVersion>DB_VERSION)throw new Error('النسخة أُنشئت بإصدار أحدث من التطبيق.');const suppliedChecksum=payload.checksum;if(!suppliedChecksum)throw new Error('النسخة لا تحتوي بصمة تحقق.');const checkPayload={...payload};delete checkPayload.checksum;const calculated=await canonicalChecksum(checkPayload);if(calculated!==suppliedChecksum)throw new Error('بصمة النسخة غير مطابقة؛ ربما تعرض الملف للتلف أو التعديل.');for(const name of Object.keys(SCHEMA)){if(!Array.isArray(payload.stores?.[name]))throw new Error(`المخزن ${name} مفقود من النسخة.`);if(payload.counts?.[name]!==payload.stores[name].length)throw new Error(`عدد سجلات ${name} لا يطابق بيانات النسخة.`);}const studentIds=new Set(payload.stores.students.map(x=>x.id));if(payload.stores.enrollments.some(e=>!studentIds.has(e.studentId)))throw new Error('النسخة تحتوي تسجيل طالب غير موجود.');return true;}

async function restoreBackup(payload){await validateBackup(payload);const names=Object.keys(SCHEMA);const tx=state.db.transaction(names,'readwrite');for(const name of names){const store=tx.objectStore(name);store.clear();for(const row of payload.stores[name])store.put(row);}await transactionDone(tx);sessionStorage.clear();}

async function renderSettings(){const school=(await getSetting('schoolProfile'))?.value||{},policy=(await getSetting('schoolPolicy'))?.value||{},counts=Object.fromEntries(await Promise.all(Object.keys(SCHEMA).map(async name=>[name,await dbCount(name)])));const total=Object.values(counts).reduce((s,n)=>s+n,0);$('#view-root').innerHTML=`<div class="page">${renderPageHeader('الإعدادات والنسخ الاحتياطي','بيانات المدرسة والسياسات وحماية استمرارية البيانات.')}
  <section class="grid grid--2"><article class="card"><header class="card__header"><div class="school-profile-heading"><img class="school-profile-logo" src="${escapeHtml(school.logoPath||SCHOOL_LOGO)}" alt="شعار ${escapeHtml(school.name||SCHOOL_NAME)}"><div><h3>بيانات المدرسة</h3><p>تظهر في الشهادات والتقارير</p></div></div></header><form id="school-settings" class="form-grid"><div class="field field--full"><label>اسم المدرسة</label><input name="name" value="${escapeHtml(school.name||SCHOOL_NAME)}"></div><div class="field"><label>الهاتف</label><input name="phone" value="${escapeHtml(school.phone||'')}"></div><div class="field"><label>العملة</label><select name="currency"><option value="ILS" selected>شيكل إسرائيلي (ILS)</option></select></div><div class="field field--full"><label>العنوان</label><input name="address" value="${escapeHtml(school.address||'')}"></div><div class="field field--full"><button class="button button--primary" type="submit">حفظ بيانات المدرسة</button></div></form></article>
  <article class="card"><header class="card__header"><div><h3>سياسات التشغيل</h3><p>تطبق على السجلات الجديدة</p></div></header><form id="policy-settings" class="form-grid"><div class="field"><label>نمط الحضور</label><select name="attendanceMode"><option value="daily" ${policy.attendanceMode==='daily'?'selected':''}>يومي</option><option value="period" ${policy.attendanceMode==='period'?'selected':''}>لكل حصة</option></select></div><div class="field"><label>وزن التأخير</label><input name="lateWeight" type="number" min="0" max="1" step="0.1" value="${policy.lateWeight??.5}"></div><div class="field"><label>حد النجاح %</label><input name="passScore" type="number" min="0" max="100" value="${policy.passScore??50}"></div><div class="field"><label>قفل الجلسة (دقيقة)</label><input name="sessionTimeoutMinutes" type="number" min="5" max="240" value="${policy.sessionTimeoutMinutes??45}"></div><div class="field field--full"><button class="button button--primary" type="submit">حفظ السياسات</button></div></form></article>
  <article class="card"><header class="card__header"><div><h3>النسخ الاحتياطي</h3><p>${formatNumber(total)} سجلًا في ${Object.keys(SCHEMA).length} مخزنًا محليًا</p></div></header><div class="alert-card is-warning"><span class="alert-card__icon">!</span><div class="alert-card__copy"><h4>البيانات مرتبطة بهذا المتصفح</h4><p>احفظ نسخة دورية. ملف النسخة حساس ويحتوي بيانات المدرسة.</p></div></div><div class="page-actions" style="margin-top:15px"><button class="button button--primary" id="export-backup">تنزيل نسخة JSON</button><label class="button button--secondary" for="import-backup" style="cursor:pointer">استعادة نسخة<input id="import-backup" type="file" accept="application/json" hidden></label></div></article>
  <article class="card"><header class="card__header"><div><h3>صيانة بيانات العرض</h3><p>إعادة القاعدة إلى بياناتها التجريبية الأولى</p></div></header><div class="confirm-box">هذا الإجراء يحذف كل التعديلات المحلية ويعيد بيانات العرض. خذ نسخة قبل المتابعة.</div><button class="button button--danger" id="reset-demo" style="margin-top:15px">إعادة ضبط بيانات العرض</button></article></section></div>`;
  $('#school-settings').addEventListener('submit',async e=>{e.preventDefault();const value={...school,...Object.fromEntries(new FormData(e.currentTarget)),timezone:'Asia/Hebron'};const setting=(await getSetting('schoolProfile'))||{id:'setting-school',key:'schoolProfile'};await dbPut('settings',{...setting,value,updatedAt:nowIso(),updatedBy:state.user.id});await audit('SETTINGS_UPDATED','settings','schoolProfile',school,value);showToast('تم الحفظ','تم تحديث بيانات المدرسة.','success');});
  $('#policy-settings').addEventListener('submit',async e=>{e.preventDefault();const raw=Object.fromEntries(new FormData(e.currentTarget)),value={...policy,attendanceMode:raw.attendanceMode,lateWeight:Number(raw.lateWeight),passScore:Number(raw.passScore),sessionTimeoutMinutes:Number(raw.sessionTimeoutMinutes)};const setting=(await getSetting('schoolPolicy'))||{id:'setting-policy',key:'schoolPolicy'};await dbPut('settings',{...setting,value,updatedAt:nowIso(),updatedBy:state.user.id});await audit('POLICY_UPDATED','settings','schoolPolicy',policy,value);showToast('تم الحفظ','ستطبق السياسة على العمليات الجديدة.','success');});
  $('#export-backup').addEventListener('click',downloadBackup);
  $('#import-backup').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const payload=JSON.parse(await file.text());await validateBackup(payload);openModal({title:'تأكيد استعادة النسخة',kicker:'إجراء حساس',body:`<div class="confirm-box"><strong>سيتم استبدال البيانات الحالية.</strong><p>تاريخ النسخة: ${formatDate(payload.exportedAt)} · إجمالي السجلات: ${Object.values(payload.counts).reduce((s,n)=>s+n,0)}</p><p>سيتم تنزيل نسخة تلقائية من الحالة الحالية أولًا.</p></div>`,footer:'<button class="button button--danger" id="confirm-restore">تنزيل الحالية ثم الاستعادة</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#confirm-restore').addEventListener('click',async()=>{await downloadBackup();await restoreBackup(payload);location.reload();});}});}catch(error){showToast('نسخة غير صالحة',error.message,'error',6000);}finally{e.target.value='';}});
  $('#reset-demo').addEventListener('click',()=>openModal({title:'إعادة ضبط بيانات العرض',kicker:'إجراء غير قابل للتراجع',body:'<div class="confirm-box">سيتم حذف البيانات المحلية الحالية وإعادة إنشاء بيانات العرض. اكتب <strong>إعادة ضبط</strong> للتأكيد.</div><div class="field" style="margin-top:15px"><input id="reset-confirm-text" placeholder="إعادة ضبط"></div>',footer:'<button class="button button--danger" id="confirm-reset">تأكيد إعادة الضبط</button><button class="button button--secondary" data-modal-close>إلغاء</button>',onOpen:()=>{$('#confirm-reset').addEventListener('click',async()=>{if($('#reset-confirm-text').value.trim()!=='إعادة ضبط'){showToast('التأكيد غير مطابق','اكتب العبارة كما هي.','error');return;}await downloadBackup();const tx=state.db.transaction(Object.keys(SCHEMA),'readwrite');for(const name of Object.keys(SCHEMA))tx.objectStore(name).clear();await transactionDone(tx);await ensureSeedData();sessionStorage.clear();location.reload();});}}));}

async function renderNotifications(){const list=(await dbIndexAll('notifications','userId',state.user.id)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$('#view-root').innerHTML=`<div class="page">${renderPageHeader('الإشعارات','التحديثات الأكاديمية والمالية المتاحة لحسابك.',list.some(n=>!n.isRead)?'<button class="button button--secondary" id="mark-all-read">تعليم الكل كمقروء</button>':'')}
  <section class="card"><div class="notice-list">${list.map(n=>`<div class="notice-item" style="${n.isRead?'opacity:.65':''}"><span class="activity-icon">${n.type==='finance'?'₪':n.type==='grade'?'◇':'✓'}</span><span class="activity-copy"><strong>${escapeHtml(n.title)} ${n.isRead?'':'<span class="status status--info">جديد</span>'}</strong><small>${escapeHtml(n.body)}</small></span><span class="activity-time">${formatDate(n.createdAt)}<br>${formatTime(n.createdAt)}</span></div>`).join('')||renderEmpty('لا إشعارات','لا توجد إشعارات لهذا الحساب.')}</div></section></div>`;$('#mark-all-read')?.addEventListener('click',async()=>{for(const n of list){if(!n.isRead){n.isRead=true;n.readAt=nowIso();await dbPut('notifications',n);}}await updateNotificationDot();renderNotifications();});}

async function renderProfile(){const info=roleInfo(state.user.role);let profile=null;if(state.user.profileId){const store=state.user.role==='teacher'?'teachers':state.user.role==='student'?'students':state.user.role==='guardian'?'guardians':null;if(store)profile=await dbGet(store,state.user.profileId);}$('#view-root').innerHTML=`<div class="page">${renderPageHeader('الملف الشخصي','بيانات حسابك المحلي والملف المرتبط به.')}
  <section class="grid grid--2"><article class="card"><div style="display:flex;align-items:center;gap:15px">${userAvatarMarkup(state.user)}<div><h2 style="margin:0">${escapeHtml(state.user.displayName)}</h2><p style="margin:2px 0;color:var(--muted)">${escapeHtml(info.label)} · @${escapeHtml(state.user.username)}</p></div></div><div class="metric-strip" style="margin-top:20px"><div class="metric-chip"><small>الحالة</small><strong>${statusLabel(state.user.status)}</strong></div><div class="metric-chip"><small>آخر دخول</small><strong>${state.user.lastLoginAt?formatDate(state.user.lastLoginAt):'—'}</strong></div></div></article><article class="card"><header class="card__header"><div><h3>البيانات المرتبطة</h3><p>من ملف المدرسة</p></div></header>${profile?`<p><strong>الاسم:</strong> ${escapeHtml(profile.fullName)}</p><p><strong>الهاتف:</strong> <span dir="ltr">${escapeHtml(profile.phone||'—')}</span></p><p><strong>${state.user.role==='teacher'?'التخصص':'العنوان'}:</strong> ${escapeHtml(profile.specialty||profile.address||'—')}</p>`:'<p style="color:var(--muted)">حساب إداري دون ملف شخص منفصل.</p>'}</article></section></div>`;}

async function globalSearch(query){const q=normalizeArabic(query);if(!q)return;const [students,teachers,subjects]=await Promise.all([dbGetAll('students'),dbGetAll('teachers'),dbGetAll('subjects')]);const scoped=new Set(await getScopedStudentIds());const results=[...students.filter(x=>scoped.has(x.id)&&normalizeArabic(x.fullName+' '+x.admissionNo).includes(q)).slice(0,5).map(x=>({type:'طالب',title:x.fullName,sub:x.admissionNo,route:'students'})),...teachers.filter(x=>normalizeArabic(x.fullName+' '+x.employeeNo).includes(q)).slice(0,4).map(x=>({type:'معلم',title:x.fullName,sub:x.specialty,route:'teachers'})),...subjects.filter(x=>normalizeArabic(x.name+' '+x.code).includes(q)).slice(0,4).map(x=>({type:'مادة',title:x.name,sub:x.code,route:'academics'}))];openModal({title:'نتائج البحث',kicker:`بحث عن: ${query}`,body:results.length?`<div class="activity-list">${results.map((r,i)=>`<button class="activity-item" data-search-result="${i}" style="width:100%;border:0;background:transparent;text-align:start;cursor:pointer"><span class="activity-icon">⌕</span><span class="activity-copy"><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.type)} · ${escapeHtml(r.sub||'')}</small></span><span>←</span></button>`).join('')}</div>`:renderEmpty('لا نتائج','جرّب اسمًا أو رقمًا مختلفًا.'),footer:'<button class="button button--secondary" data-modal-close>إغلاق</button>',onOpen:()=>{$$('[data-search-result]').forEach(b=>b.addEventListener('click',()=>{const r=results[Number(b.dataset.searchResult)];closeModal();navigate(r.route);}));}});}

Object.assign(ROUTE_RENDERERS,{dashboard:renderDashboard,students:renderStudents,guardians:renderGuardians,teachers:renderTeachers,academics:renderAcademics,timetable:renderTimetable,attendance:renderAttendance,grades:renderGrades,certificates:renderCertificates,finance:renderFinance,reports:renderReports,users:renderUsers,settings:renderSettings,notifications:renderNotifications,profile:renderProfile});

$('#global-search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();globalSearch(event.currentTarget.value.trim());}});

let lastActivityAt=Date.now();
for(const eventName of ['click','keydown','touchstart'])document.addEventListener(eventName,()=>{lastActivityAt=Date.now();if(state.user)sessionStorage.setItem('school_session_at',nowIso());},{passive:true});
setInterval(async()=>{if(!state.user)return;const setting=await getSetting('schoolPolicy');const timeout=(setting?.value?.sessionTimeoutMinutes||45)*60*1000;if(Date.now()-lastActivityAt>timeout){showToast('انتهت الجلسة','سجل الدخول مرة أخرى للمتابعة.','error');await signOut('timeout');}},60000);

bootstrap();

/**
 * طبقة القبول: أي مخزن يُقرأ، وأي مخزن يُكتب، ومن يملك ذلك.
 *
 * فُصلت في ملف مستقل لأنها المكان الوحيد الذي يقرر الصلاحية. أي قاعدة
 * تُكتب هنا فقط، فلا تتفرق نسخ منها في المسارات ثم تختلف.
 *
 * مبدأ ثابت: المنع على الخادم لا في الواجهة. إخفاء زر لا يمنع طلبًا مباشرًا.
 */

/** المخازن العشرون التي يزامنها التطبيق. أي اسم خارجها يُرفض. */
export const STORES = [
  'settings',
  'academicYears',
  'gradeLevels',
  'sections',
  'students',
  'guardians',
  'studentGuardians',
  'enrollments',
  'teachers',
  'subjects',
  'teachingAssignments',
  'timetableSlots',
  'attendanceSessions',
  'attendanceRecords',
  'assessments',
  'gradeEntries',
  'feePlans',
  'invoices',
  'payments',
  'certificates',
  'notifications',
];

const STORE_SET = new Set(STORES);

/**
 * مخازن الباقة الكاملة وحدها. الباقة الأساسية لا تُخفيها في الواجهة فقط،
 * بل يرفضها الخادم قراءةً وكتابةً حتى لو استُدعي المسار مباشرة.
 */
export const FULL_PLAN_STORES = new Set(['feePlans', 'invoices', 'payments']);

/**
 * ما يستطيع كل دور كتابته. المدير كل شيء؛ المعلم ما يخص التدريس فقط؛
 * الطالب وولي الأمر لا يكتبان شيئًا سوى حالة قراءة الإشعار.
 */
const WRITABLE_BY_ROLE = {
  admin: new Set(STORES),
  teacher: new Set([
    'attendanceSessions',
    'attendanceRecords',
    'assessments',
    'gradeEntries',
    'notifications',
  ]),
  student: new Set(['notifications']),
  guardian: new Set(['notifications']),
};

/**
 * ما يستطيع كل دور قراءته. الطالب وولي الأمر لا يريان المعلمين أو أولياء
 * أمور غيرهم؛ والقراءة تُقيَّد بعد ذلك على مستوى الصف بـ`rowVisibleTo`.
 */
const READABLE_BY_ROLE = {
  admin: new Set(STORES),
  teacher: new Set(STORES.filter((store) => !FULL_PLAN_STORES.has(store) || false)),
  student: new Set([
    'settings', 'academicYears', 'gradeLevels', 'sections', 'subjects',
    'timetableSlots', 'students', 'enrollments', 'attendanceRecords',
    'assessments', 'gradeEntries', 'certificates', 'notifications',
    'invoices', 'payments',
  ]),
  guardian: new Set([
    'settings', 'academicYears', 'gradeLevels', 'sections', 'subjects',
    'timetableSlots', 'students', 'guardians', 'studentGuardians', 'enrollments',
    'attendanceRecords', 'assessments', 'gradeEntries', 'certificates',
    'notifications', 'invoices', 'payments',
  ]),
};

export const isKnownStore = (store) => STORE_SET.has(store);

export function planAllows(planCode, store) {
  if (FULL_PLAN_STORES.has(store)) return planCode === 'full';
  return true;
}

export function canRead(role, planCode, store) {
  if (!isKnownStore(store)) return false;
  if (!planAllows(planCode, store)) return false;
  return (READABLE_BY_ROLE[role] || new Set()).has(store);
}

export function canWrite(role, planCode, store) {
  if (!isKnownStore(store)) return false;
  if (!planAllows(planCode, store)) return false;
  return (WRITABLE_BY_ROLE[role] || new Set()).has(store);
}

/** المخازن التي يجوز للدور سحبها، بعد تصفية الباقة. */
export function readableStores(role, planCode) {
  return STORES.filter((store) => canRead(role, planCode, store));
}

/**
 * تقييد على مستوى الصف للطالب وولي الأمر.
 *
 * المدير والمعلم يريان كل صفوف مدرستهم. الطالب يرى ما يخصه، وولي الأمر يرى
 * ما يخص أبناءه. بدون هذا يستطيع طالب أن يسحب درجات كل زملائه من مسار
 * المزامنة نفسه رغم أن الواجهة لا تعرضها له.
 *
 * @param scope.studentIds معرّفات الطلاب المسموح بها (نفسه أو أبناؤه)
 */
export function rowVisibleTo(role, store, doc, scope) {
  if (role === 'admin' || role === 'teacher') return true;
  const students = scope?.studentIds;
  if (!students || students.size === 0) {
    // لا نطاق معروف: نمنع بدل أن نكشف. الفشل يجب أن يكون مغلقًا.
    return !['students', 'enrollments', 'attendanceRecords', 'gradeEntries',
      'invoices', 'payments', 'certificates', 'studentGuardians'].includes(store);
  }
  switch (store) {
    case 'students':
      return students.has(String(doc.id));
    case 'enrollments':
    case 'attendanceRecords':
    case 'gradeEntries':
    case 'invoices':
    case 'certificates':
    case 'studentGuardians':
      return students.has(String(doc.studentId));
    case 'payments':
      return students.has(String(doc.studentId));
    case 'guardians':
      return role === 'guardian' && String(doc.id) === String(scope.profileId);
    case 'notifications':
      return String(doc.userId) === String(scope.userId);
    default:
      // بيانات المدرسة العامة: الجدول والمواد والصفوف — لا تخص شخصًا بعينه.
      return true;
  }
}

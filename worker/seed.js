/**
 * بيانات العرض لمدرسة تجريبية.
 *
 * ثابتة البذرة: كل نسخة عرض متطابقة، فيمكن تجهيز العرض التقديمي مسبقًا.
 * وهي مصمّمة لتُظهر قيمة النظام لا لتملأ الشاشة: غياب وتأخير حقيقيان في
 * الحضور، ودرجات متفاوتة فيها راسبون، وفواتير مدفوعة وجزئية ومتأخرة.
 */

export const DEMO_SEED_VERSION = 'school-demo-v1';

const DAY_MS = 24 * 60 * 60 * 1000;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const FIRST_NAMES = [
  'يوسف', 'مريم', 'عمر', 'لينا', 'محمد', 'نور', 'آدم', 'جنى',
  'رامي', 'سلمى', 'يزن', 'تالا', 'أيهم', 'رنا', 'مالك', 'شهد',
  'كرم', 'دانا', 'سامر', 'فرح', 'أنس', 'ريم', 'سيف', 'هبة',
];
const LAST_NAMES = ['حمدان', 'النجار', 'سالم', 'عودة', 'شاهين', 'أبو عيشة', 'منصور', 'الخطيب'];

const TEACHERS = [
  ['teacher-1', 'T-1001', 'أحمد الخطيب', 'الرياضيات'],
  ['teacher-2', 'T-1002', 'سارة منصور', 'اللغة العربية'],
  ['teacher-3', 'T-1003', 'خالد سالم', 'العلوم'],
  ['teacher-4', 'T-1004', 'ليان عودة', 'اللغة الإنجليزية'],
];

const SUBJECTS = [
  ['subject-math', 'MATH', 'الرياضيات', '#155EEF'],
  ['subject-arabic', 'ARAB', 'اللغة العربية', '#079455'],
  ['subject-science', 'SCI', 'العلوم', '#D92D20'],
  ['subject-english', 'ENG', 'اللغة الإنجليزية', '#7F56D9'],
  ['subject-social', 'SOC', 'الدراسات الاجتماعية', '#F79009'],
];

const GRADES = [
  ['grade-7', 'G07', 'الصف السابع', 7],
  ['grade-8', 'G08', 'الصف الثامن', 8],
  ['grade-9', 'G09', 'الصف التاسع', 9],
];

const SECTIONS = [
  ['section-7a', 'grade-7', 'السابع أ', 'teacher-1', 'A-07'],
  ['section-7b', 'grade-7', 'السابع ب', 'teacher-2', 'B-07'],
  ['section-8a', 'grade-8', 'الثامن أ', 'teacher-3', 'A-08'],
  ['section-9a', 'grade-9', 'التاسع أ', 'teacher-4', 'A-09'],
];

const ASSIGNMENTS = [
  ['assignment-1', 'teacher-1', 'subject-math', 'section-7a'],
  ['assignment-2', 'teacher-1', 'subject-math', 'section-7b'],
  ['assignment-3', 'teacher-2', 'subject-arabic', 'section-7a'],
  ['assignment-4', 'teacher-2', 'subject-arabic', 'section-7b'],
  ['assignment-5', 'teacher-3', 'subject-science', 'section-8a'],
  ['assignment-6', 'teacher-4', 'subject-english', 'section-9a'],
  ['assignment-7', 'teacher-3', 'subject-science', 'section-7a'],
  ['assignment-8', 'teacher-4', 'subject-english', 'section-7a'],
];

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

/** يطابق شكل السجل في التطبيق حتى لا تحتاج الواجهة تحويلًا. */
function baseDoc(id, iso, extra = {}) {
  return {
    id,
    createdAt: iso,
    createdBy: 'system',
    updatedAt: iso,
    updatedBy: 'system',
    status: 'active',
    archivedAt: null,
    archivedBy: null,
    ...extra,
  };
}

const normalizeArabic = (value) => String(value ?? '').trim().toLowerCase()
  .normalize('NFKD').replace(/[ً-ٰٟ]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

export function demoSeedStatements(db, schoolId, now) {
  const random = seededRandom(20260820);
  const iso = new Date(now).toISOString();
  const docs = [];
  const put = (store, doc) => docs.push([store, doc]);

  const year = baseDoc('year-2026', iso, {
    name: '2026 / 2027',
    startsOn: '2026-08-20',
    endsOn: '2027-06-15',
    isActive: true,
    terms: [
      { id: 'term-1', name: 'الفصل الأول', startsOn: '2026-08-20', endsOn: '2027-01-15' },
      { id: 'term-2', name: 'الفصل الثاني', startsOn: '2027-01-25', endsOn: '2027-06-15' },
    ],
  });
  put('academicYears', year);

  for (const [id, code, name, order] of GRADES) {
    put('gradeLevels', baseDoc(id, iso, { code, name, stage: 'المرحلة الأساسية العليا', order }));
  }
  for (const [id, employeeNo, fullName, specialty] of TEACHERS) {
    put('teachers', baseDoc(id, iso, {
      employeeNo, fullName, fullNameNormalized: normalizeArabic(fullName),
      phone: `05990010${employeeNo.slice(-2)}`, email: '', specialty, hiredOn: '2020-08-15',
    }));
  }
  for (const [id, gradeLevelId, name, homeroomTeacherId, room] of SECTIONS) {
    put('sections', baseDoc(id, iso, {
      academicYearId: year.id, gradeLevelId, name, capacity: 30, homeroomTeacherId, room,
    }));
  }
  for (const [id, code, name, color] of SUBJECTS) {
    put('subjects', baseDoc(id, iso, {
      code, name, gradeLevelIds: GRADES.map((g) => g[0]), maxScore: 100, passScore: 50, color,
    }));
  }

  const students = FIRST_NAMES.map((first, index) => {
    const fullName = `${first} ${LAST_NAMES[index % LAST_NAMES.length]}`;
    return baseDoc(`student-${index + 1}`, iso, {
      admissionNo: `AS-${2026001 + index}`,
      fullName,
      fullNameNormalized: normalizeArabic(fullName),
      gender: index % 2 ? 'female' : 'male',
      birthDate: `${2012 + Math.floor(index / 16)}-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 24) + 1).padStart(2, '0')}`,
      phone: `05991${String(index).padStart(5, '0')}`,
      address: ['غزة', 'خان يونس', 'رفح', 'دير البلح'][index % 4],
    });
  });
  for (const student of students) put('students', student);

  const guardians = Array.from({ length: 12 }, (_, index) => {
    const child = students[index * 2] || students[index];
    const fullName = `${index % 2 ? 'أم' : 'أبو'} ${child.fullName.split(' ')[0]}`;
    return baseDoc(`guardian-${index + 1}`, iso, {
      fullName,
      fullNameNormalized: normalizeArabic(fullName),
      phone: `05988${String(index).padStart(5, '0')}`,
      email: '',
      relation: index % 2 ? 'الأم' : 'الأب',
      address: ['غزة', 'خان يونس', 'رفح'][index % 3],
    });
  });
  for (const guardian of guardians) put('guardians', guardian);

  students.forEach((student, index) => {
    put('studentGuardians', baseDoc(`sg-${index + 1}`, iso, {
      studentId: student.id,
      guardianId: `guardian-${Math.floor(index / 2) + 1}`,
      relation: index % 2 ? 'الأم' : 'الأب',
      isPrimary: index % 2 === 0,
      canCollect: true,
      receivesNotices: true,
    }));
  });

  const enrollments = students.map((student, index) => baseDoc(`enrollment-${index + 1}`, iso, {
    studentId: student.id,
    academicYearId: year.id,
    sectionId: SECTIONS[Math.floor(index / 6) % SECTIONS.length][0],
    enrolledOn: '2026-08-20',
    rollNo: (index % 6) + 1,
  }));
  for (const enrollment of enrollments) put('enrollments', enrollment);

  for (const [id, teacherId, subjectId, sectionId] of ASSIGNMENTS) {
    put('teachingAssignments', baseDoc(id, iso, {
      academicYearId: year.id, termId: 'term-1', teacherId, subjectId, sectionId,
      startsOn: year.startsOn, endsOn: year.endsOn,
    }));
  }

  for (let day = 0; day < 5; day += 1) {
    for (let period = 1; period <= 4; period += 1) {
      const assignment = ASSIGNMENTS[(day * 4 + period - 1) % ASSIGNMENTS.length];
      put('timetableSlots', baseDoc(`slot-${day + 1}-${period}`, iso, {
        academicYearId: year.id, termId: 'term-1', dayOfWeek: day + 1, dayName: DAY_NAMES[day],
        periodNo: period,
        startsAt: `${String(7 + period).padStart(2, '0')}:00`,
        endsAt: `${String(7 + period).padStart(2, '0')}:45`,
        sectionId: assignment[3], subjectId: assignment[2], teacherId: assignment[1],
        roomId: SECTIONS.find((s) => s[0] === assignment[3])?.[4],
        status: 'published', publishedAt: iso,
      }));
    }
  }

  // حضور أسبوعين. الغياب والتأخير مقصودان: سجل حضور كامل لا يُظهر قيمة المتابعة.
  for (let offset = 12; offset >= 0; offset -= 1) {
    const date = new Date(now - offset * DAY_MS);
    if ([5, 6].includes(date.getUTCDay())) continue;
    const dayKey = date.toISOString().slice(0, 10);
    for (const [sectionId] of SECTIONS) {
      const sessionId = `attendance-${sectionId}-${dayKey}`;
      put('attendanceSessions', baseDoc(sessionId, iso, {
        date: dayKey, sectionId, timetableSlotId: null, mode: 'daily', status: 'closed',
        openedAt: date.toISOString(), closedAt: date.toISOString(), closedBy: 'admin',
      }));
      for (const enrollment of enrollments.filter((e) => e.sectionId === sectionId)) {
        const n = Number(enrollment.studentId.split('-')[1]);
        const state = (n + offset) % 13 === 0 ? 'absent' : (n + offset) % 9 === 0 ? 'late' : 'present';
        put('attendanceRecords', baseDoc(`ar-${sessionId}-${enrollment.studentId}`, iso, {
          sessionId, studentId: enrollment.studentId, status: state,
          lateMinutes: state === 'late' ? 10 : 0, reasonCode: null, note: '',
        }));
      }
    }
  }

  const assessments = ASSIGNMENTS.slice(0, 6).map(([, teacherId, subjectId, sectionId], index) =>
    baseDoc(`assessment-${index + 1}`, iso, {
      academicYearId: year.id, termId: 'term-1', sectionId, subjectId, teacherId,
      name: index % 2 ? 'واجب الوحدة الأولى' : 'اختبار الشهر الأول',
      type: index % 2 ? 'assignment' : 'exam',
      date: '2026-09-25', maxScore: index % 2 ? 20 : 40,
      weightBasisPoints: index % 2 ? 2000 : 4000,
      status: 'published', submittedAt: iso, approvedAt: iso, publishedAt: iso,
    }));
  for (const assessment of assessments) put('assessments', assessment);

  for (const assessment of assessments) {
    for (const enrollment of enrollments.filter((e) => e.sectionId === assessment.sectionId)) {
      const score = Math.round(assessment.maxScore * (0.45 + random() * 0.55));
      put('gradeEntries', baseDoc(`ge-${assessment.id}-${enrollment.studentId}`, iso, {
        assessmentId: assessment.id, studentId: enrollment.studentId,
        score: Math.min(score, assessment.maxScore), entryStatus: 'graded', note: '',
      }));
    }
  }

  // المالية جزء من الباقة الكاملة. تُبذر دائمًا: تنزيل الباقة يمنع الوصول
  // ولا يحذف البيانات، والترقية تعيدها كما كانت.
  const feePlans = GRADES.map(([gradeId, , gradeName], index) => baseDoc(`fee-plan-${index + 1}`, iso, {
    academicYearId: year.id, gradeLevelId: gradeId, name: `رسوم ${gradeName}`,
    items: [
      { code: 'TUITION', label: 'القسط الدراسي', amountMinor: 180000 + index * 10000 },
      { code: 'ACTIVITY', label: 'الأنشطة', amountMinor: 20000 },
    ],
    totalMinor: 200000 + index * 10000,
  }));
  for (const plan of feePlans) put('feePlans', plan);

  const invoices = students.map((student, index) => {
    const enrollment = enrollments[index];
    const section = SECTIONS.find((s) => s[0] === enrollment.sectionId);
    const gradeIndex = GRADES.findIndex((g) => g[0] === section[1]);
    const totalMinor = feePlans[gradeIndex].totalMinor;
    const paidMinor = index % 4 === 0 ? totalMinor : index % 3 === 0 ? Math.floor(totalMinor / 2) : 0;
    return baseDoc(`invoice-${index + 1}`, iso, {
      invoiceNo: `INV-2026-${String(index + 1).padStart(4, '0')}`,
      studentId: student.id, academicYearId: year.id, feePlanId: feePlans[gradeIndex].id,
      items: feePlans[gradeIndex].items, subtotalMinor: totalMinor, discountMinor: 0,
      adjustmentsMinor: 0, totalMinor, paidMinor, balanceMinor: totalMinor - paidMinor,
      dueDate: index % 5 === 0 ? '2026-08-31' : '2026-10-15',
      status: totalMinor === paidMinor ? 'paid' : paidMinor > 0 ? 'partial' : 'unpaid',
    });
  });
  for (const invoice of invoices) put('invoices', invoice);

  invoices.filter((invoice) => invoice.paidMinor > 0).forEach((invoice, index) => {
    put('payments', baseDoc(`payment-${index + 1}`, iso, {
      receiptNo: `REC-2026-${String(index + 1).padStart(4, '0')}`,
      invoiceId: invoice.id, studentId: invoice.studentId, amountMinor: invoice.paidMinor,
      method: index % 2 ? 'bank_transfer' : 'cash',
      reference: index % 2 ? `TRX-${1000 + index}` : '',
      paidAt: new Date(now - 5 * DAY_MS).toISOString(), status: 'posted',
    }));
  });

  put('settings', {
    id: 'schoolPolicy', key: 'schoolPolicy',
    value: { attendanceMode: 'daily', lateWeight: 0.5, passScore: 50, sessionTimeoutMinutes: 45, workDays: [0, 1, 2, 3, 4] },
  });
  put('settings', { id: 'seedVersion', key: 'seedVersion', value: DEMO_SEED_VERSION });

  return docs.map(([store, doc]) => db.prepare(
    `INSERT INTO records (school_id, store, id, doc_json, deleted, version, updated_at, updated_by)
     VALUES (?, ?, ?, ?, 0, 1, ?, 'system')`,
  ).bind(schoolId, store, doc.id, JSON.stringify(doc), now));
}

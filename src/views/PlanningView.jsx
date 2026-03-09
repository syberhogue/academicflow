import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, User, XCircle } from 'lucide-react';
import { Card, ProgressBar } from '../ui';

const TERM_KEYS = ['Fall', 'Winter', 'Spring/Summer'];
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STUDENT_CAP_PRESETS = [25, 50, 100, 150, 200];
const DEFAULT_SECTION_CAP = 100;
const DEFAULT_LAB_CAP = 25;
const DEFAULT_TUTORIAL_CAP = 50;
const ROOM_SIZE_OPTIONS = [
  { value: '25', label: '25 seats', cap: 25 },
  { value: '50', label: '50 seats', cap: 50 },
  { value: '100', label: '100 seats', cap: 100 },
  { value: '150', label: '150 seats', cap: 150 },
  { value: '150+', label: '>150 seats', cap: 200 }
];

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createDefaultScheduleBlocks = (prefix) => [
  {
    id: createId(`${prefix}_sched`),
    day: '',
    durationHours: 3
  }
];

const getAcademicYearLabel = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
};

const parseYearStart = (label) => {
  const match = String(label || '').trim().match(/^(\d{4})\/(\d{2})$/);
  if (!match) return null;
  return Number(match[1]);
};

const normalizeYearLabel = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalizedSlash = raw.replace('-', '/');
  if (/^\d{4}\/\d{2}$/.test(normalizedSlash)) {
    return normalizedSlash;
  }
  if (/^\d{4}$/.test(raw)) {
    const start = Number(raw);
    return `${start}/${String(start + 1).slice(-2)}`;
  }
  return '';
};

const getRoomCap = (roomSize) => ROOM_SIZE_OPTIONS.find((option) => option.value === roomSize)?.cap || 50;
const getRoomSizeLabel = (roomSize) => ROOM_SIZE_OPTIONS.find((option) => option.value === roomSize)?.label || '50 seats';
const normalizeCourseCodeKey = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');

const normalizePlanningTerm = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'fall') return 'Fall';
  if (raw === 'winter') return 'Winter';
  if (raw === 'spring/summer' || raw === 'spring summer' || raw === 'spring' || raw === 'summer') {
    return 'Spring/Summer';
  }
  return null;
};

const getPlanningYearLabelForTermYear = (term, yearValue) => {
  const normalizedTerm = normalizePlanningTerm(term);
  const year = Number.parseInt(String(yearValue || '').trim(), 10);
  if (!normalizedTerm || !Number.isFinite(year)) return null;
  const startYear = normalizedTerm === 'Fall' ? year : year - 1;
  if (!Number.isFinite(startYear)) return null;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
};

const collectProgramCourseCodeKeys = (program) => {
  const codes = new Set();
  const register = (course) => {
    const codeKey = normalizeCourseCodeKey(course?.code || course?.courseCode);
    if (!codeKey) return;
    codes.add(codeKey);
  };
  (program?.semesters || []).forEach((semester) => {
    (semester?.courses || []).forEach((course) => register(course));
  });
  (program?.specializationBlocks || []).forEach((block) => {
    (block?.courses || []).forEach((course) => register(course));
  });
  Object.values(program?.electiveSuggestionMaps || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      (row?.courses || []).forEach((course) => register(course));
    });
  });
  return codes;
};

const normalizeScheduleBlocks = (blocks, prefix) => {
  const normalized = (Array.isArray(blocks) ? blocks : [])
    .map((block) => ({
      id: String(block?.id || createId(`${prefix}_sched`)).trim(),
      day: WEEK_DAYS.includes(String(block?.day || '').trim()) ? String(block.day).trim() : '',
      durationHours: Math.max(0.5, Number(block?.durationHours || 3))
    }))
    .filter((block) => block.id);
  return normalized.length > 0 ? normalized : createDefaultScheduleBlocks(prefix);
};

const getRoomSizeValueForCap = (cap) => {
  if (cap <= 25) return '25';
  if (cap <= 50) return '50';
  if (cap <= 100) return '100';
  if (cap <= 150) return '150';
  return '150+';
};

const distributeStudentsAcrossComponents = (totalStudents, components, prioritizeIndex = null) => {
  const normalizedTotal = Math.max(0, Number(totalStudents || 0));
  const next = (components || []).map((component) => ({
    ...component,
    assignedStudents: 0
  }));
  if (next.length === 0) return next;
  const visitOrder = [];
  if (Number.isInteger(prioritizeIndex) && prioritizeIndex >= 0 && prioritizeIndex < next.length) {
    visitOrder.push(prioritizeIndex);
  }
  for (let index = 0; index < next.length; index += 1) {
    if (!visitOrder.includes(index)) {
      visitOrder.push(index);
    }
  }
  let remaining = normalizedTotal;
  visitOrder.forEach((index) => {
    const capacity = getRoomCap(next[index]?.roomSize);
    const assigned = Math.min(remaining, capacity);
    next[index] = {
      ...next[index],
      assignedStudents: assigned
    };
    remaining -= assigned;
  });
  return next;
};

const reconcileCourseAssignments = (course, prioritize = {}) => {
  const normalizedCourse = { ...course };
  normalizedCourse.sections = distributeStudentsAcrossComponents(
    normalizedCourse.numStudents,
    normalizedCourse.sections || [],
    prioritize.sections
  );
  normalizedCourse.labs = distributeStudentsAcrossComponents(
    normalizedCourse.numStudents,
    normalizedCourse.labs || [],
    prioritize.labs
  );
  normalizedCourse.tutorials = distributeStudentsAcrossComponents(
    normalizedCourse.numStudents,
    normalizedCourse.tutorials || [],
    prioritize.tutorials
  );
  return normalizedCourse;
};

const resizePlanningComponents = (items, targetCount, prefix, label, roomSize) => {
  const current = Array.isArray(items) ? items : [];
  const desired = Math.max(0, Number(targetCount || 0));
  const next = Array.from({ length: desired }, (_, index) => {
    const existing = current[index];
    return {
      id: String(existing?.id || createId(prefix)),
      name: String(existing?.name || `${label} ${index + 1}`).trim() || `${label} ${index + 1}`,
      roomSize: String(existing?.roomSize || roomSize),
      assignedStudents: Math.max(0, Number(existing?.assignedStudents || 0)),
      scheduleBlocks: normalizeScheduleBlocks(existing?.scheduleBlocks, `${prefix}_${index}`)
    };
  });
  return next.map((item, index) => ({
    ...item,
    name: `${label} ${index + 1}`,
    roomSize
  }));
};

const autoPlanComponentsForStudents = ({
  items,
  totalStudents,
  defaultCap,
  prefix,
  label,
  minimumCount = 0
}) => {
  const normalizedStudents = Math.max(0, Number(totalStudents || 0));
  const current = Array.isArray(items) ? items : [];
  const next = [];
  let coveredStudents = 0;

  for (let index = 0; index < current.length; index += 1) {
    const existing = current[index];
    const normalizedItem = {
      id: String(existing?.id || createId(prefix)),
      name: String(existing?.name || `${label} ${index + 1}`).trim() || `${label} ${index + 1}`,
      roomSize: String(existing?.roomSize || getRoomSizeValueForCap(defaultCap)),
      assignedStudents: Math.max(0, Number(existing?.assignedStudents || 0)),
      scheduleBlocks: normalizeScheduleBlocks(existing?.scheduleBlocks, `${prefix}_${index}`)
    };
    const stillNeeded =
      next.length < minimumCount || coveredStudents < normalizedStudents;
    if (!stillNeeded) {
      break;
    }
    next.push(normalizedItem);
    coveredStudents += getRoomCap(normalizedItem.roomSize);
  }

  while (next.length < minimumCount || coveredStudents < normalizedStudents) {
    const nextIndex = next.length + 1;
    const roomSize = getRoomSizeValueForCap(defaultCap);
    next.push({
      id: createId(prefix),
      name: `${label} ${nextIndex}`,
      roomSize,
      assignedStudents: 0,
      scheduleBlocks: createDefaultScheduleBlocks(prefix)
    });
    coveredStudents += getRoomCap(roomSize);
  }

  return next.map((item, index) => ({
    ...item,
    name: `${label} ${index + 1}`
  }));
};

const getWorkloadTone = (utilizationPercent) => {
  if (utilizationPercent >= 100) return 'border-red-300 bg-red-100 text-red-900';
  if (utilizationPercent >= 75) return 'border-rose-300 bg-rose-100 text-rose-900';
  if (utilizationPercent >= 50) return 'border-amber-300 bg-amber-100 text-amber-900';
  return 'border-emerald-300 bg-emerald-100 text-emerald-900';
};

const getScheduleBlockTone = (ownerType) => {
  if (ownerType === 'sections') return 'brightness-[0.98] saturate-100';
  if (ownerType === 'labs') return 'brightness-105 saturate-90';
  if (ownerType === 'tutorials') return 'brightness-110 saturate-75';
  return '';
};

const yearIdFromLabel = (label) => `plan_year_${String(label || '').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;

const createEmptyYear = (label) => ({
  id: yearIdFromLabel(label),
  label,
  terms: {
    Fall: [],
    Winter: [],
    'Spring/Summer': []
  }
});

const normalizePlanningCourse = (course) => ({
  id: String(course?.id || createId('plan_course')),
  courseCode: String(course?.courseCode || '').trim(),
  courseTitle: String(course?.courseTitle || '').trim(),
  courseColor: String(course?.courseColor || 'bg-slate-200').trim() || 'bg-slate-200',
  credits: Number(course?.credits || 3),
  discipline: String(course?.discipline || '').trim(),
  numStudents: Math.max(0, Number(course?.numStudents || 0)),
  instructorId: String(course?.instructorId || '').trim(),
  sourceType: String(course?.sourceType || '').trim(),
  sourceKey: String(course?.sourceKey || '').trim(),
  scheduleBlocks: normalizeScheduleBlocks(course?.scheduleBlocks, `course_${course?.id || 'main'}`),
  sections: (Array.isArray(course?.sections) ? course.sections : []).map((section, index) => ({
    id: String(section?.id || createId('plan_section')),
    name: String(section?.name || `Section ${index + 1}`).trim() || `Section ${index + 1}`,
    roomSize: String(section?.roomSize || '50'),
    assignedStudents: Math.max(0, Number(section?.assignedStudents || 0)),
    scheduleBlocks: normalizeScheduleBlocks(section?.scheduleBlocks, `section_${section?.id || index}`)
  })),
  labs: (Array.isArray(course?.labs) ? course.labs : []).map((lab, index) => ({
    id: String(lab?.id || createId('plan_lab')),
    name: String(lab?.name || `Lab ${index + 1}`).trim() || `Lab ${index + 1}`,
    roomSize: String(lab?.roomSize || '50'),
    assignedStudents: Math.max(0, Number(lab?.assignedStudents || 0)),
    scheduleBlocks: normalizeScheduleBlocks(lab?.scheduleBlocks, `lab_${lab?.id || index}`)
  })),
  tutorials: (Array.isArray(course?.tutorials) ? course.tutorials : []).map((tutorial, index) => ({
    id: String(tutorial?.id || createId('plan_tutorial')),
    name: String(tutorial?.name || `Tutorial ${index + 1}`).trim() || `Tutorial ${index + 1}`,
    roomSize: String(tutorial?.roomSize || '50'),
    assignedStudents: Math.max(0, Number(tutorial?.assignedStudents || 0)),
    scheduleBlocks: normalizeScheduleBlocks(tutorial?.scheduleBlocks, `tutorial_${tutorial?.id || index}`)
  }))
});

const normalizePlanningYear = (year) => {
  const normalizedTerms = TERM_KEYS.reduce((acc, term) => {
    acc[term] = (Array.isArray(year?.terms?.[term]) ? year.terms[term] : []).map((course) =>
      normalizePlanningCourse(course)
    );
    return acc;
  }, {});
  return {
    id: String(year?.id || yearIdFromLabel(year?.label || getAcademicYearLabel())),
    label: normalizeYearLabel(year?.label) || getAcademicYearLabel(),
    terms: normalizedTerms
  };
};

const normalizePlanningState = (planningData) => {
  const normalizedYears = (Array.isArray(planningData?.years) ? planningData.years : [])
    .map((year) => normalizePlanningYear(year))
    .sort((a, b) => (parseYearStart(a.label) || 0) - (parseYearStart(b.label) || 0));
  if (normalizedYears.length > 0) {
    return { years: normalizedYears };
  }
  return { years: [createEmptyYear(getAcademicYearLabel())] };
};

const buildPlanningCourseFromCatalog = (course) => ({
  id: createId('plan_course'),
  courseCode: String(course?.code || '').trim(),
  courseTitle: String(course?.title || '').trim(),
  courseColor: String(course?.color || 'bg-slate-200').trim() || 'bg-slate-200',
  credits: Number(course?.credits || 3),
  discipline: String(course?.discipline || '').trim(),
  numStudents: 0,
  instructorId: '',
  sourceType: '',
  sourceKey: '',
  scheduleBlocks: createDefaultScheduleBlocks('course'),
  sections: [],
  labs: [],
  tutorials: []
});

export function PlanningView({
  planningData,
  onUpdatePlanningData,
  globalCourses,
  facultyDirectory,
  programs
}) {
  const normalizedPlanning = useMemo(() => normalizePlanningState(planningData), [planningData]);
  const [selectedYearId, setSelectedYearId] = useState(normalizedPlanning.years[0]?.id || '');
  const [newYearInput, setNewYearInput] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [termAddModal, setTermAddModal] = useState(null);
  const [termCourseSearch, setTermCourseSearch] = useState('');
  const [termCourseDisciplineFilter, setTermCourseDisciplineFilter] = useState('All');
  const [dragState, setDragState] = useState(null);
  const [scheduleDragState, setScheduleDragState] = useState(null);
  const [selectedScheduleItemKey, setSelectedScheduleItemKey] = useState('');
  const [selectedScheduleCourseId, setSelectedScheduleCourseId] = useState('');
  const [selectedCourseRef, setSelectedCourseRef] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [instructorPicker, setInstructorPicker] = useState(null);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [termDetail, setTermDetail] = useState(null);
  const [highlightFilters, setHighlightFilters] = useState({
    unassignedCourses: false,
    sessionalInstructors: false,
    multipleSections: false,
    labs: false,
    tutorials: false
  });

  useEffect(() => {
    const hasSelected = normalizedPlanning.years.some((year) => year.id === selectedYearId);
    if (!hasSelected) {
      setSelectedYearId(normalizedPlanning.years[0]?.id || '');
    }
  }, [normalizedPlanning, selectedYearId]);

  const selectedYear = useMemo(
    () => normalizedPlanning.years.find((year) => year.id === selectedYearId) || normalizedPlanning.years[0],
    [normalizedPlanning, selectedYearId]
  );

  const selectedYearTerms = selectedYear?.terms || { Fall: [], Winter: [], 'Spring/Summer': [] };
  const programOptions = useMemo(
    () =>
      [...(programs || [])]
        .map((program) => {
          const shortName = String(
            program?.shortName ||
              program?.shortForm ||
              program?.programInfo?.programShortName ||
              program?.programInfo?.shortFormName ||
              ''
          ).trim();
          return {
            id: String(program?.id || '').trim(),
            label: shortName ? `${shortName} - ${program?.name || 'Program'}` : String(program?.name || 'Program')
          };
        })
        .filter((program) => program.id)
        .sort((left, right) => left.label.localeCompare(right.label)),
    [programs]
  );
  const selectedProgram = useMemo(
    () => (programs || []).find((program) => String(program?.id || '').trim() === selectedProgramId) || null,
    [programs, selectedProgramId]
  );
  const selectedProgramCourseCodeKeys = useMemo(
    () => (selectedProgram ? collectProgramCourseCodeKeys(selectedProgram) : null),
    [selectedProgram]
  );
  useEffect(() => {
    if (!selectedProgramId) return;
    const isValid = programOptions.some((program) => program.id === selectedProgramId);
    if (!isValid) {
      setSelectedProgramId('');
    }
  }, [selectedProgramId, programOptions]);

  const updatePlanningState = (updater) => {
    if (typeof onUpdatePlanningData !== 'function') return;
    onUpdatePlanningData((current) => updater(normalizePlanningState(current)));
  };

  const updateSelectedYear = (yearUpdater) => {
    updatePlanningState((current) => ({
      ...current,
      years: current.years.map((year, index) => {
        const targetId = selectedYearId || current.years[0]?.id;
        const shouldUpdate = targetId ? year.id === targetId : index === 0;
        return shouldUpdate ? yearUpdater(year) : year;
      })
    }));
  };

  const addPlanningYear = () => {
    const normalized = normalizeYearLabel(newYearInput);
    if (!normalized) return;
    const existing = normalizedPlanning.years.find((year) => year.label === normalized);
    if (existing) {
      setSelectedYearId(existing.id);
      setNewYearInput('');
      return;
    }
    const newYear = createEmptyYear(normalized);
    updatePlanningState((current) => ({
      ...current,
      years: [...current.years, newYear].sort((a, b) => (parseYearStart(a.label) || 0) - (parseYearStart(b.label) || 0))
    }));
    setSelectedYearId(newYear.id);
    setNewYearInput('');
  };

  const courseOptions = useMemo(
    () =>
      [...(globalCourses || [])]
        .filter((course) => String(course?.code || '').trim())
        .sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''))),
    [globalCourses]
  );
  const courseOptionByCode = useMemo(() => {
    const byCode = new Map();
    courseOptions.forEach((course) => {
      const key = normalizeCourseCodeKey(course.code);
      if (!key || byCode.has(key)) return;
      byCode.set(key, course);
    });
    return byCode;
  }, [courseOptions]);
  const facultyPlanningSeedEntries = useMemo(() => {
    const entriesByKey = new Map();
    (facultyDirectory || []).forEach((faculty) => {
      const facultyId = String(faculty?.id || '').trim();
      if (!facultyId) return;
      const pushEntry = (rawCourseCode, rawCourseTitle, rawTerm, rawYear) => {
        const code = String(rawCourseCode || '').trim();
        if (!code) return;
        const term = normalizePlanningTerm(rawTerm);
        const year = String(rawYear || '').trim();
        const yearLabel = getPlanningYearLabelForTermYear(term, year);
        if (!term || !yearLabel) return;
        const sourceKey = `${facultyId}|${normalizeCourseCodeKey(code)}|${term}|${year}`;
        if (entriesByKey.has(sourceKey)) return;
        const catalogCourse = courseOptionByCode.get(normalizeCourseCodeKey(code));
        entriesByKey.set(sourceKey, {
          sourceKey,
          yearLabel,
          term,
          course: {
            id: createId('plan_course'),
            courseCode: catalogCourse?.code || code,
            courseTitle: catalogCourse?.title || String(rawCourseTitle || '').trim(),
            courseColor: catalogCourse?.color || 'bg-slate-200',
            credits: Number(catalogCourse?.credits || 3),
            discipline: String(catalogCourse?.discipline || '').trim(),
            numStudents: 0,
            instructorId: facultyId,
            sourceType: 'faculty_assignment',
            sourceKey,
            sections: [],
            labs: [],
            tutorials: []
          }
        });
      };
      (Array.isArray(faculty?.teachingHistory) ? faculty.teachingHistory : []).forEach((entry) => {
        pushEntry(entry?.courseCode, entry?.courseTitle, entry?.term, entry?.year);
      });
      const currentTerm = normalizePlanningTerm(faculty?.currentTerm);
      const currentYear = String(faculty?.currentYear || '').trim();
      (Array.isArray(faculty?.currentCourses) ? faculty.currentCourses : []).forEach((entry) => {
        pushEntry(entry?.code, entry?.title, currentTerm, currentYear);
      });
    });
    return Array.from(entriesByKey.values());
  }, [facultyDirectory, courseOptionByCode]);
  const termCourseDisciplineOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        courseOptions.map((course) => String(course.discipline || 'Uncategorized').trim() || 'Uncategorized')
      )
    ).sort((a, b) => a.localeCompare(b));
    return ['All', ...values];
  }, [courseOptions]);
  const filteredTermCourseOptions = useMemo(() => {
    const query = String(termCourseSearch || '').trim().toLowerCase();
    return courseOptions.filter((course) => {
      const discipline = String(course.discipline || 'Uncategorized').trim() || 'Uncategorized';
      const matchesDiscipline = termCourseDisciplineFilter === 'All' || discipline === termCourseDisciplineFilter;
      const matchesProgram =
        !selectedProgramCourseCodeKeys ||
        selectedProgramCourseCodeKeys.has(normalizeCourseCodeKey(course.code));
      const matchesQuery =
        query.length === 0 ||
        String(course.code || '').toLowerCase().includes(query) ||
        String(course.title || '').toLowerCase().includes(query) ||
        discipline.toLowerCase().includes(query);
      return matchesDiscipline && matchesProgram && matchesQuery;
    });
  }, [courseOptions, termCourseSearch, termCourseDisciplineFilter, selectedProgramCourseCodeKeys]);

  useEffect(() => {
    if (typeof onUpdatePlanningData !== 'function' || facultyPlanningSeedEntries.length === 0) return;
    onUpdatePlanningData((currentRaw) => {
      const current = normalizePlanningState(currentRaw);
      const yearsByLabel = new Map();
      current.years.forEach((year) => {
        yearsByLabel.set(year.label, {
          ...year,
          terms: TERM_KEYS.reduce((acc, term) => {
            acc[term] = [...(year.terms?.[term] || [])];
            return acc;
          }, {})
        });
      });
      let didChange = false;
      facultyPlanningSeedEntries.forEach((seed) => {
        if (!seed?.yearLabel || !TERM_KEYS.includes(seed.term)) return;
        let year = yearsByLabel.get(seed.yearLabel);
        if (!year) {
          year = createEmptyYear(seed.yearLabel);
          yearsByLabel.set(seed.yearLabel, year);
          didChange = true;
        }
        const termCourses = year.terms[seed.term] || [];
        const alreadyExists = termCourses.some((course) => {
          const sourceKeyMatch = String(course?.sourceKey || '').trim() === seed.sourceKey;
          if (sourceKeyMatch) return true;
          return (
            normalizeCourseCodeKey(course?.courseCode) === normalizeCourseCodeKey(seed.course?.courseCode) &&
            String(course?.instructorId || '').trim() === String(seed.course?.instructorId || '').trim()
          );
        });
        if (alreadyExists) return;
        termCourses.push(normalizePlanningCourse(seed.course));
        year.terms[seed.term] = termCourses;
        didChange = true;
      });
      if (!didChange) {
        return currentRaw;
      }
      return {
        years: Array.from(yearsByLabel.values()).sort(
          (left, right) => (parseYearStart(left.label) || 0) - (parseYearStart(right.label) || 0)
        )
      };
    });
  }, [facultyPlanningSeedEntries, onUpdatePlanningData]);

  const addCourseToSpecificTerm = (term, code) => {
    if (!TERM_KEYS.includes(term) || !code) return false;
    const found = courseOptions.find((course) => course.code === code);
    if (!found) return false;
    const newCourse = buildPlanningCourseFromCatalog(found);
    updateSelectedYear((year) => ({
      ...year,
      terms: {
        ...year.terms,
        [term]: [...(year.terms[term] || []), newCourse]
      }
    }));
    return true;
  };

  const moveCourse = (fromTerm, courseId, toTerm, beforeCourseId = null) => {
    if (!selectedYear || !TERM_KEYS.includes(fromTerm) || !TERM_KEYS.includes(toTerm)) return;
    if (!courseId) return;
    updateSelectedYear((year) => {
      const source = [...(year.terms[fromTerm] || [])];
      const destination = fromTerm === toTerm ? source : [...(year.terms[toTerm] || [])];
      const sourceIndex = source.findIndex((course) => course.id === courseId);
      if (sourceIndex === -1) return year;
      const [moved] = source.splice(sourceIndex, 1);
      if (!moved) return year;
      let insertIndex = destination.length;
      if (beforeCourseId) {
        const beforeIndex = destination.findIndex((course) => course.id === beforeCourseId);
        if (beforeIndex >= 0) {
          insertIndex = beforeIndex;
        }
      }
      if (fromTerm === toTerm) {
        destination.splice(insertIndex, 0, moved);
        return {
          ...year,
          terms: {
            ...year.terms,
            [fromTerm]: destination
          }
        };
      }
      destination.splice(insertIndex, 0, moved);
      return {
        ...year,
        terms: {
          ...year.terms,
          [fromTerm]: source,
          [toTerm]: destination
        }
      };
    });
    setSelectedCourseRef((current) =>
      current && current.courseId === courseId ? { ...current, term: toTerm } : current
    );
  };

  const updateCourse = (term, courseId, updater) => {
    updateSelectedYear((year) => ({
      ...year,
      terms: {
        ...year.terms,
        [term]: (year.terms[term] || []).map((course) =>
          course.id === courseId ? reconcileCourseAssignments(updater(course)) : course
        )
      }
    }));
  };

  const setCourseStudentCap = (term, courseId, cap) => {
    updateCourse(term, courseId, (course) => ({
      ...course,
      numStudents: Math.max(0, Number(cap || 0))
    }));
  };

  const setTermStudentCap = (term, cap) => {
    if (!TERM_KEYS.includes(term)) return;
    const targetCap = Math.max(0, Number(cap || 0));
    updateSelectedYear((year) => ({
      ...year,
      terms: {
        ...year.terms,
        [term]: (year.terms[term] || []).map((course) => {
          const matchesProgram =
            !selectedProgramCourseCodeKeys ||
            selectedProgramCourseCodeKeys.has(normalizeCourseCodeKey(course?.courseCode));
          if (!matchesProgram) return course;
          return reconcileCourseAssignments({
            ...course,
            numStudents: targetCap
          });
        })
      }
    }));
  };

  const autoPlanCourses = () => {
    updateSelectedYear((year) => ({
      ...year,
      terms: TERM_KEYS.reduce(
        (acc, term) => {
          acc[term] = (year.terms[term] || []).map((course) => {
            const matchesProgram =
              !selectedProgramCourseCodeKeys ||
              selectedProgramCourseCodeKeys.has(normalizeCourseCodeKey(course?.courseCode));
            if (!matchesProgram) return course;
            const studentCount = Math.max(0, Number(course?.numStudents || 0));
            const hasLabs = (course?.labs || []).length > 0;
            const hasTutorials = (course?.tutorials || []).length > 0;
            const nextCourse = {
              ...course,
              sections: autoPlanComponentsForStudents({
                items: course.sections,
                totalStudents: studentCount,
                defaultCap: DEFAULT_SECTION_CAP,
                prefix: 'plan_section',
                label: 'Section',
                minimumCount: 1
              }),
              labs: hasLabs
                ? autoPlanComponentsForStudents({
                    items: course.labs,
                    totalStudents: studentCount,
                    defaultCap: DEFAULT_LAB_CAP,
                    prefix: 'plan_lab',
                    label: 'Lab',
                    minimumCount: 1
                  })
                : [],
              tutorials: hasTutorials
                ? autoPlanComponentsForStudents({
                    items: course.tutorials,
                    totalStudents: studentCount,
                    defaultCap: DEFAULT_TUTORIAL_CAP,
                    prefix: 'plan_tutorial',
                    label: 'Tutorial',
                    minimumCount: 1
                  })
                : []
            };
            return reconcileCourseAssignments(nextCourse);
          });
          return acc;
        },
        {}
      )
    }));
  };

  const addCourseComponent = (term, courseId, componentType) => {
    if (!TERM_KEYS.includes(term)) return;
    if (!['sections', 'labs', 'tutorials'].includes(componentType)) return;
    updateSelectedYear((year) => ({
      ...year,
      terms: {
        ...year.terms,
        [term]: (year.terms[term] || []).map((course) => {
          if (course.id !== courseId) return course;
          const next = [...(course[componentType] || [])];
          const nextIndex = next.length + 1;
          const defaultCap =
            componentType === 'sections'
              ? DEFAULT_SECTION_CAP
              : componentType === 'labs'
              ? DEFAULT_LAB_CAP
              : DEFAULT_TUTORIAL_CAP;
          if (componentType === 'sections') {
            next.push({
              id: createId('plan_section'),
              name: `Section ${nextIndex}`,
              roomSize: getRoomSizeValueForCap(defaultCap),
              assignedStudents: 0,
              scheduleBlocks: createDefaultScheduleBlocks('section')
            });
          } else if (componentType === 'labs') {
            next.push({
              id: createId('plan_lab'),
              name: `Lab ${nextIndex}`,
              roomSize: getRoomSizeValueForCap(defaultCap),
              assignedStudents: 0,
              scheduleBlocks: createDefaultScheduleBlocks('lab')
            });
          } else {
            next.push({
              id: createId('plan_tutorial'),
              name: `Tutorial ${nextIndex}`,
              roomSize: getRoomSizeValueForCap(defaultCap),
              assignedStudents: 0,
              scheduleBlocks: createDefaultScheduleBlocks('tutorial')
            });
          }
          return reconcileCourseAssignments(
            {
              ...course,
              [componentType]: next
            },
            { [componentType]: next.length - 1 }
          );
        })
      }
    }));
  };

  const updateScheduleOwner = (term, courseId, ownerType, ownerId, updater) => {
    updateCourse(term, courseId, (course) => {
      if (ownerType === 'course') {
        return {
          ...course,
          scheduleBlocks: updater([...(course.scheduleBlocks || createDefaultScheduleBlocks('course'))])
        };
      }
      if (!['sections', 'labs', 'tutorials'].includes(ownerType)) {
        return course;
      }
      return {
        ...course,
        [ownerType]: (course[ownerType] || []).map((item) =>
          item.id === ownerId
            ? {
                ...item,
                scheduleBlocks: updater([...(item.scheduleBlocks || createDefaultScheduleBlocks(ownerType))])
              }
            : item
        )
      };
    });
  };

  const moveScheduleBlock = (term, courseId, ownerType, ownerId, blockId, nextDay) => {
    updateScheduleOwner(term, courseId, ownerType, ownerId, (blocks) =>
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              day: WEEK_DAYS.includes(nextDay) ? nextDay : ''
            }
          : block
      )
    );
  };

  const splitScheduleBlock = (term, courseId, ownerType, ownerId, blockId, pieces) => {
    updateScheduleOwner(term, courseId, ownerType, ownerId, (blocks) => {
      const target = blocks.find((block) => block.id === blockId);
      if (!target) return blocks;
      if (pieces === 1) {
        return [
          {
            id: createId('sched_merge'),
            day: target.day || '',
            durationHours: 3
          }
        ];
      }
      if (![2, 3].includes(pieces)) return blocks;
      const replacement = Array.from({ length: pieces }, () => ({
        id: createId('sched_split'),
        day: target.day || '',
        durationHours: Number((3 / pieces).toFixed(2))
      }));
      return blocks.flatMap((block) => (block.id === blockId ? replacement : [block]));
    });
  };

  const removeCourse = (term, courseId) => {
    updateSelectedYear((year) => ({
      ...year,
      terms: {
        ...year.terms,
        [term]: (year.terms[term] || []).filter((course) => course.id !== courseId)
      }
    }));
    setSelectedCourseRef((current) =>
      current && current.courseId === courseId ? null : current
    );
  };

  const getCourseByRef = (ref) => {
    if (!ref || !selectedYear) return null;
    const termCourses = selectedYear.terms?.[ref.term] || [];
    return termCourses.find((course) => course.id === ref.courseId) || null;
  };

  const selectedCourse = useMemo(
    () => getCourseByRef(selectedCourseRef),
    [selectedCourseRef, selectedYear]
  );
  const selectedCourseInstructor = useMemo(() => {
    const instructorId = String(selectedCourse?.instructorId || '').trim();
    if (!instructorId || instructorId === '__sessional__') return null;
    return facultyDirectory.find((faculty) => String(faculty.id || '').trim() === instructorId) || null;
  }, [selectedCourse, facultyDirectory]);
  const selectedCourseIsSessional = useMemo(
    () => String(selectedCourse?.instructorId || '').trim() === '__sessional__',
    [selectedCourse]
  );
  const yearTermsForDisplay = useMemo(
    () =>
      TERM_KEYS.reduce((acc, term) => {
        acc[term] = (selectedYearTerms[term] || []).filter((course) => {
          if (!selectedProgramCourseCodeKeys) return true;
          return selectedProgramCourseCodeKeys.has(normalizeCourseCodeKey(course?.courseCode));
        });
        return acc;
      }, {}),
    [selectedYearTerms, selectedProgramCourseCodeKeys]
  );
  const termDetailCourses = useMemo(() => {
    if (!termDetail?.term || !TERM_KEYS.includes(termDetail.term)) return [];
    return yearTermsForDisplay[termDetail.term] || [];
  }, [termDetail, yearTermsForDisplay]);
  const termDetailScheduleItems = useMemo(() => {
    return termDetailCourses.flatMap((course) => {
      const sectionItems = (course.sections || []).flatMap((section) =>
        (section.scheduleBlocks || []).map((block) => ({
          key: `${course.id}_section_${section.id}_${block.id}`,
          courseId: course.id,
          ownerType: 'sections',
          ownerId: section.id,
          blockId: block.id,
          day: block.day || '',
          durationHours: block.durationHours,
          title: course.courseCode,
          subtitle: section.name,
          color: course.courseColor || 'bg-slate-200'
        }))
      );
      const labItems = (course.labs || []).flatMap((lab) =>
        (lab.scheduleBlocks || []).map((block) => ({
          key: `${course.id}_lab_${lab.id}_${block.id}`,
          courseId: course.id,
          ownerType: 'labs',
          ownerId: lab.id,
          blockId: block.id,
          day: block.day || '',
          durationHours: block.durationHours,
          title: course.courseCode,
          subtitle: lab.name,
          color: course.courseColor || 'bg-slate-200'
        }))
      );
      const tutorialItems = (course.tutorials || []).flatMap((tutorial) =>
        (tutorial.scheduleBlocks || []).map((block) => ({
          key: `${course.id}_tutorial_${tutorial.id}_${block.id}`,
          courseId: course.id,
          ownerType: 'tutorials',
          ownerId: tutorial.id,
          blockId: block.id,
          day: block.day || '',
          durationHours: block.durationHours,
          title: course.courseCode,
          subtitle: tutorial.name,
          color: course.courseColor || 'bg-slate-200'
        }))
      );
      return [...sectionItems, ...labItems, ...tutorialItems];
    });
  }, [termDetailCourses]);
  const hasActiveHighlightFilters = useMemo(
    () => Object.values(highlightFilters).some(Boolean),
    [highlightFilters]
  );
  const doesCourseMatchHighlightFilters = (course) => {
    const checks = [];
    if (highlightFilters.unassignedCourses) {
      checks.push(!String(course?.instructorId || '').trim());
    }
    if (highlightFilters.sessionalInstructors) {
      checks.push(String(course?.instructorId || '').trim() === '__sessional__');
    }
    if (highlightFilters.multipleSections) {
      checks.push((course?.sections || []).length > 1);
    }
    if (highlightFilters.labs) {
      checks.push((course?.labs || []).length > 0);
    }
    if (highlightFilters.tutorials) {
      checks.push((course?.tutorials || []).length > 0);
    }
    if (checks.length === 0) return true;
    return checks.some(Boolean);
  };

  useEffect(() => {
    if (!selectedCourseRef || !selectedProgramCourseCodeKeys) return;
    const course = getCourseByRef(selectedCourseRef);
    if (!course) return;
    if (!selectedProgramCourseCodeKeys.has(normalizeCourseCodeKey(course.courseCode))) {
      setSelectedCourseRef(null);
    }
  }, [selectedProgramCourseCodeKeys, selectedCourseRef, selectedYear]);
  useEffect(() => {
    if (!termDetail?.term || !TERM_KEYS.includes(termDetail.term)) return;
    if (!selectedYear) {
      setTermDetail(null);
    }
  }, [termDetail, selectedYear]);
  useEffect(() => {
    if (termDetail) return;
    setSelectedScheduleItemKey('');
    setSelectedScheduleCourseId('');
  }, [termDetail]);

  const planningAssignedByFaculty = useMemo(() => {
    const counts = new Map();
    TERM_KEYS.forEach((term) => {
      (selectedYearTerms[term] || []).forEach((course) => {
        const facultyId = String(course?.instructorId || '').trim();
        if (!facultyId) return;
        counts.set(facultyId, (counts.get(facultyId) || 0) + 1);
      });
    });
    return counts;
  }, [selectedYearTerms]);

  const facultyStatsById = useMemo(() => {
    const stats = new Map();
    (facultyDirectory || []).forEach((faculty) => {
      const facultyId = String(faculty.id || '').trim();
      if (!facultyId) return;
      const baseLoad = Math.max(0, Number(faculty.teachingLoad || 0));
      const overloads = Math.max(0, Number(faculty.overloads || 0));
      const releases = Math.max(0, Number(faculty.courseReleases || 0));
      const capacity = Math.max(0, baseLoad + overloads - releases);
      const currentAssigned = Array.isArray(faculty.currentCourses) ? faculty.currentCourses.length : 0;
      const planningAssigned = planningAssignedByFaculty.get(facultyId) || 0;
      const totalAssigned = currentAssigned + planningAssigned;
      const remaining = Math.max(0, capacity - totalAssigned);
      const utilizationPercent = capacity > 0 ? Math.round((totalAssigned / capacity) * 100) : 100;
      stats.set(facultyId, {
        ...faculty,
        capacity,
        currentAssigned,
        planningAssigned,
        totalAssigned,
        remaining,
        utilizationPercent
      });
    });
    return stats;
  }, [facultyDirectory, planningAssignedByFaculty]);

  const openInstructorProfile = (facultyId, event) => {
    const normalizedId = String(facultyId || '').trim();
    if (!normalizedId) return;
    setContextMenu(null);
    setInstructorPicker(null);
    const x = event?.clientX ?? 0;
    const y = event?.clientY ?? 0;
    setInstructorProfile({
      facultyId: normalizedId,
      x,
      y
    });
  };

  const openRoomSizeMenu = (event, term, courseId, componentType, componentId) => {
    event.preventDefault();
    event.stopPropagation();
    setInstructorPicker(null);
    setInstructorProfile(null);
    setContextMenu({
      kind: 'component',
      x: event.clientX,
      y: event.clientY,
      term,
      courseId,
      componentType,
      componentId
    });
  };

  const openComponentActionsMenu = (event, term, courseId, componentType) => {
    event.preventDefault();
    event.stopPropagation();
    setInstructorPicker(null);
    setInstructorProfile(null);
    setContextMenu({
      kind: 'componentActions',
      x: event.clientX,
      y: event.clientY,
      term,
      courseId,
      componentType
    });
  };

  const openInstructorPicker = (event, term, courseId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!term || !courseId) return;
    setContextMenu(null);
    setInstructorProfile(null);
    setInstructorPicker({
      x: event.clientX,
      y: event.clientY,
      term,
      courseId
    });
  };

  const openScheduleBlockMenu = (event, scheduleItem) => {
    event.preventDefault();
    event.stopPropagation();
    setInstructorPicker(null);
    setInstructorProfile(null);
    setContextMenu({
      kind: 'scheduleBlock',
      x: event.clientX,
      y: event.clientY,
      ...scheduleItem
    });
  };

  const instructorChoices = useMemo(() => {
    const currentCourse = instructorPicker ? getCourseByRef({ term: instructorPicker.term, courseId: instructorPicker.courseId }) : null;
    const currentInstructorId = String(currentCourse?.instructorId || '').trim();
    return [...facultyStatsById.values()]
      .map((faculty) => {
        const facultyId = String(faculty.id || '').trim();
        const adjustedPlanningAssigned =
          currentInstructorId && currentInstructorId === facultyId
            ? Math.max(0, faculty.planningAssigned - 1)
            : faculty.planningAssigned;
        const totalAssigned = faculty.currentAssigned + adjustedPlanningAssigned;
        const remaining = Math.max(0, faculty.capacity - totalAssigned);
        const utilizationPercent = faculty.capacity > 0 ? Math.round((totalAssigned / faculty.capacity) * 100) : 100;
        return {
          ...faculty,
          totalAssigned,
          remaining,
          utilizationPercent,
          atCapacity: remaining <= 0
        };
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [facultyStatsById, instructorPicker, selectedYear]);

  const instructorProfileData = useMemo(() => {
    const facultyId = String(instructorProfile?.facultyId || '').trim();
    if (!facultyId) return null;
    return facultyStatsById.get(facultyId) || null;
  }, [facultyStatsById, instructorProfile]);

  const courseCompletion = useMemo(() => {
    if (!selectedCourse) {
      return null;
    }
    const totalStudents = Math.max(0, Number(selectedCourse.numStudents || 0));
    const sectionCaps = (selectedCourse.sections || []).map((section) => getRoomCap(section.roomSize));
    const sectionCapacity = sectionCaps.reduce((sum, cap) => sum + cap, 0);
    const sectionRemaining = totalStudents - sectionCapacity;

    const labCount = (selectedCourse.labs || []).length;
    const tutorialCount = (selectedCourse.tutorials || []).length;
    const labCaps = (selectedCourse.labs || []).map((lab) => getRoomCap(lab.roomSize));
    const tutorialCaps = (selectedCourse.tutorials || []).map((tutorial) => getRoomCap(tutorial.roomSize));
    const labCapacity = labCaps.reduce((sum, cap) => sum + cap, 0);
    const tutorialCapacity = tutorialCaps.reduce((sum, cap) => sum + cap, 0);
    const labRemaining = labCount > 0 ? totalStudents - labCapacity : 0;
    const tutorialRemaining = tutorialCount > 0 ? totalStudents - tutorialCapacity : 0;

    const sectionPct = totalStudents > 0 ? Math.min(100, Math.round((sectionCapacity / totalStudents) * 100)) : 100;
    const labPct = labCount > 0 && totalStudents > 0 ? Math.min(100, Math.round((labCapacity / totalStudents) * 100)) : 100;
    const tutorialPct = tutorialCount > 0 && totalStudents > 0 ? Math.min(100, Math.round((tutorialCapacity / totalStudents) * 100)) : 100;
    const overallPct = Math.min(sectionPct, labPct, tutorialPct);
    const complete = sectionRemaining <= 0 && labRemaining <= 0 && tutorialRemaining <= 0;

    const suggestions = [];
    if ((selectedCourse.sections || []).length === 0) {
      suggestions.push('Create at least one Section.');
    } else if (sectionRemaining > 0) {
      suggestions.push('Add a new Section or increase Section room sizes.');
    }
    if (labCount > 0 && labRemaining > 0) {
      suggestions.push('Add a Lab section or increase Lab room sizes.');
    }
    if (tutorialCount > 0 && tutorialRemaining > 0) {
      suggestions.push('Add a Tutorial section or increase Tutorial room sizes.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Capacity targets are satisfied for this course.');
    }

    return {
      totalStudents,
      sectionCaps,
      sectionCapacity,
      sectionRemaining,
      labCount,
      tutorialCount,
      labCaps,
      tutorialCaps,
      labCapacity,
      tutorialCapacity,
      labRemaining,
      tutorialRemaining,
      overallPct,
      complete,
      suggestions
    };
  }, [selectedCourse]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Planning</h1>
        <p className="text-slate-500">Operational planning workspace for term delivery, sections, labs, tutorials, and instructor coverage.</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Planning Year</label>
            <select
              value={selectedYear?.id || ''}
              onChange={(event) => setSelectedYearId(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {normalizedPlanning.years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Add Year</label>
            <div className="flex gap-2">
              <input
                value={newYearInput}
                onChange={(event) => setNewYearInput(event.target.value)}
                placeholder="e.g. 2026/27"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
              <button
                type="button"
                onClick={addPlanningYear}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
              >
                + Year
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Program / Specialization</label>
            <select
              value={selectedProgramId}
              onChange={(event) => setSelectedProgramId(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Programs</option>
              {programOptions.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={highlightFilters.unassignedCourses}
              onChange={(event) =>
                setHighlightFilters((current) => ({ ...current, unassignedCourses: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Unassigned Courses
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={highlightFilters.sessionalInstructors}
              onChange={(event) =>
                setHighlightFilters((current) => ({ ...current, sessionalInstructors: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Sessional Instructors
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={highlightFilters.multipleSections}
              onChange={(event) =>
                setHighlightFilters((current) => ({ ...current, multipleSections: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Multiple Sections
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={highlightFilters.labs}
              onChange={(event) =>
                setHighlightFilters((current) => ({ ...current, labs: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Labs
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={highlightFilters.tutorials}
              onChange={(event) =>
                setHighlightFilters((current) => ({ ...current, tutorials: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Tutorials
          </label>
          <button
            type="button"
            onClick={autoPlanCourses}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Auto Plan
          </button>
          <button
            type="button"
            onClick={() =>
              setHighlightFilters({
                unassignedCourses: false,
                sessionalInstructors: false,
                multipleSections: false,
                labs: false,
                tutorials: false
              })
            }
            className="ml-auto px-3 py-1.5 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            Deselect All
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {TERM_KEYS.map((term) => (
            <Card
              key={term}
              className="p-3 min-h-[24rem]"
              onDoubleClick={() => setTermDetail({ term })}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!dragState) return;
                moveCourse(dragState.fromTerm, dragState.courseId, term, null);
                setDragState(null);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{term}</h3>
                <span className="text-xs text-slate-500">{(yearTermsForDisplay[term] || []).length} courses</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                {STUDENT_CAP_PRESETS.map((cap) => (
                  <button
                    key={`${term}_cap_${cap}`}
                    type="button"
                    onClick={() => setTermStudentCap(term, cap)}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {cap}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(yearTermsForDisplay[term] || []).map((course) => {
                  const isSelected =
                    selectedCourseRef?.term === term && selectedCourseRef?.courseId === course.id;
                  const sectionCapacity = (course.sections || []).reduce((sum, section) => sum + getRoomCap(section.roomSize), 0);
                  const hasNoSections = (course.sections || []).length === 0;
                  const matchesHighlight = doesCourseMatchHighlightFilters(course);
                  const shouldDim = hasActiveHighlightFilters && !matchesHighlight;
                  const shouldHighlight = hasActiveHighlightFilters && matchesHighlight && !isSelected;
                  const instructorId = String(course.instructorId || '').trim();
                  const isSessionalInstructor = instructorId === '__sessional__';
                  const assignedInstructor = instructorId && !isSessionalInstructor
                    ? facultyDirectory.find((faculty) => String(faculty.id || '').trim() === instructorId)
                    : null;
                  return (
                    <div
                      key={course.id}
                      draggable
                      onDragStart={() => setDragState({ fromTerm: term, courseId: course.id })}
                      onDragEnd={() => setDragState(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!dragState) return;
                        moveCourse(dragState.fromTerm, dragState.courseId, term, course.id);
                        setDragState(null);
                      }}
                      onClick={() => setSelectedCourseRef({ term, courseId: course.id })}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setInstructorPicker(null);
                        setInstructorProfile(null);
                        setContextMenu({
                          kind: 'course',
                          x: event.clientX,
                          y: event.clientY,
                          term,
                          courseId: course.id
                        });
                      }}
                      className={`rounded-lg border p-2 cursor-pointer transition-colors ${course.courseColor || 'bg-slate-200'} ${
                        isSelected
                          ? 'ring-2 ring-indigo-500'
                          : shouldHighlight
                          ? 'ring-2 ring-emerald-500 border-emerald-400'
                          : hasNoSections
                          ? 'ring-2 ring-amber-500 border-amber-400'
                          : 'border-slate-300/70'
                      } ${shouldDim ? 'opacity-45 saturate-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{course.courseCode}</div>
                          <div className="text-[11px] text-slate-800 truncate">{course.courseTitle}</div>
                        </div>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeCourse(term, course.id);
                            }}
                            className="text-slate-700/70 hover:text-slate-900"
                            title="Remove course"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px]">
                        {isSessionalInstructor ? (
                          <span className="font-semibold text-amber-800">Assigned Instructor: Sessional</span>
                        ) : assignedInstructor ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openInstructorProfile(assignedInstructor.id, event);
                            }}
                            className="font-semibold text-indigo-900 hover:text-indigo-700"
                          >
                            Assigned Instructor: {assignedInstructor.name}
                          </button>
                        ) : (
                          <span className="font-semibold text-red-800">Assigned Instructor: Unassigned</span>
                        )}
                      </div>
                      {hasNoSections && (
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                          No sections assigned
                        </div>
                      )}
                      {isSelected && (
                        <>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                            <label className="flex items-center gap-1">
                              <span className="font-semibold">Students</span>
                              <input
                                type="number"
                                min={0}
                                value={course.numStudents}
                                onChange={(event) => {
                                  const value = Math.max(0, Number(event.target.value) || 0);
                                  updateCourse(term, course.id, (current) => ({
                                    ...current,
                                    numStudents: value
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 rounded border border-slate-300 bg-white/80 text-[11px]"
                                onClick={(event) => event.stopPropagation()}
                              />
                            </label>
                            <div className="text-right font-semibold">
                              Sec Cap: {sectionCapacity}
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {STUDENT_CAP_PRESETS.map((cap) => (
                              <button
                                key={`${course.id}_cap_${cap}`}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setCourseStudentCap(term, course.id, cap);
                                }}
                                className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {cap}
                              </button>
                            ))}
                          </div>
                          <div className="mt-1.5 space-y-1 text-[10px]">
                            <button
                              type="button"
                              onClick={(event) => openComponentActionsMenu(event, term, course.id, 'sections')}
                              className="w-full text-left px-2 py-1 rounded border border-blue-300 bg-blue-100/80 text-blue-900 hover:bg-blue-100"
                            >
                              Sections: {(course.sections || []).length}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openComponentActionsMenu(event, term, course.id, 'labs')}
                              className="w-full text-left px-2 py-1 rounded border border-emerald-300 bg-emerald-100/80 text-emerald-900 hover:bg-emerald-100"
                            >
                              Labs: {(course.labs || []).length}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => openComponentActionsMenu(event, term, course.id, 'tutorials')}
                              className="w-full text-left px-2 py-1 rounded border border-violet-300 bg-violet-100/80 text-violet-900 hover:bg-violet-100"
                            >
                              Tutorials: {(course.tutorials || []).length}
                            </button>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(course.sections || []).map((section) => (
                              <button
                                key={section.id}
                                type="button"
                                onClick={(event) => openRoomSizeMenu(event, term, course.id, 'sections', section.id)}
                                className="px-1.5 py-0.5 rounded border border-slate-300 bg-white/70 text-[10px] text-slate-700 hover:bg-white"
                                title="Click to set section room size"
                              >
                                {section.name}: {section.assignedStudents || 0}/{getRoomCap(section.roomSize)}
                              </button>
                            ))}
                            {(course.labs || []).map((lab) => (
                              <button
                                key={lab.id}
                                type="button"
                                onClick={(event) => openRoomSizeMenu(event, term, course.id, 'labs', lab.id)}
                                className="px-1.5 py-0.5 rounded border border-slate-300 bg-white/70 text-[10px] text-slate-700 hover:bg-white"
                                title="Click to set lab room size"
                              >
                                {lab.name}: {lab.assignedStudents || 0}/{getRoomCap(lab.roomSize)}
                              </button>
                            ))}
                            {(course.tutorials || []).map((tutorial) => (
                              <button
                                key={tutorial.id}
                                type="button"
                                onClick={(event) => openRoomSizeMenu(event, term, course.id, 'tutorials', tutorial.id)}
                                className="px-1.5 py-0.5 rounded border border-slate-300 bg-white/70 text-[10px] text-slate-700 hover:bg-white"
                                title="Click to set tutorial room size"
                              >
                                {tutorial.name}: {tutorial.assignedStudents || 0}/{getRoomCap(tutorial.roomSize)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {(yearTermsForDisplay[term] || []).length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTermAddModal({ term });
                      setTermCourseSearch('');
                      setTermCourseDisciplineFilter('All');
                    }}
                    className="w-full border border-dashed border-slate-300 rounded-lg h-24 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors flex items-center justify-center"
                    title={`Add course to ${term}`}
                  >
                    <Plus size={24} />
                  </button>
                )}
                {(yearTermsForDisplay[term] || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTermAddModal({ term });
                      setTermCourseSearch('');
                      setTermCourseDisciplineFilter('All');
                    }}
                    className="w-full border border-dashed border-slate-300 rounded-lg h-12 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors flex items-center justify-center"
                    title={`Add course to ${term}`}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Info Sidebar</h3>
          {!selectedCourse || !courseCompletion ? (
            <p className="text-sm text-slate-500">Select a course from a term to view operational planning details.</p>
          ) : (
            <>
              <div>
                <div className="font-bold text-slate-900">{selectedCourse.courseCode}</div>
                <div className="text-sm text-slate-600">{selectedCourse.courseTitle}</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm">
                {selectedCourseIsSessional ? (
                  <button
                    type="button"
                    onClick={(event) => openInstructorPicker(event, selectedCourseRef?.term, selectedCourse.id)}
                    className="font-semibold text-amber-800 hover:text-amber-700"
                  >
                    Assigned Instructor: Sessional
                  </button>
                ) : selectedCourseInstructor ? (
                  <button
                    type="button"
                    onClick={(event) => openInstructorProfile(selectedCourseInstructor.id, event)}
                    className="font-semibold text-indigo-900 hover:text-indigo-700"
                  >
                    Assigned Instructor: {selectedCourseInstructor.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => openInstructorPicker(event, selectedCourseRef?.term, selectedCourse.id)}
                    className="font-semibold text-red-800 hover:text-red-700"
                  >
                    Assigned Instructor: Unassigned
                  </button>
                )}
              </div>
              <div className="space-y-1 text-[11px]">
                <button
                  type="button"
                  onClick={(event) => openInstructorPicker(event, selectedCourseRef?.term, selectedCourse.id)}
                  className="w-full text-left px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  {selectedCourseInstructor || selectedCourseIsSessional ? 'Change Instructor' : 'Assign Instructor'}
                </button>
                <button
                  type="button"
                  onClick={(event) =>
                    openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'sections')
                  }
                  className="w-full text-left px-2 py-1 rounded border border-blue-300 bg-blue-100/80 text-blue-900 hover:bg-blue-100"
                >
                  Sections
                </button>
                <button
                  type="button"
                  onClick={(event) =>
                    openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'labs')
                  }
                  className="w-full text-left px-2 py-1 rounded border border-emerald-300 bg-emerald-100/80 text-emerald-900 hover:bg-emerald-100"
                >
                  Labs
                </button>
                <button
                  type="button"
                  onClick={(event) =>
                    openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'tutorials')
                  }
                  className="w-full text-left px-2 py-1 rounded border border-violet-300 bg-violet-100/80 text-violet-900 hover:bg-violet-100"
                >
                  Tutorials
                </button>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Students</span>
                  <span className="font-semibold">{courseCompletion.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sections</span>
                  <button
                    type="button"
                    onClick={(event) =>
                      openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'sections')
                    }
                    className="font-semibold text-indigo-900 hover:text-indigo-700"
                  >
                    {(selectedCourse.sections || []).length} ({courseCompletion.sectionCapacity} cap)
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Labs</span>
                  <button
                    type="button"
                    onClick={(event) =>
                      openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'labs')
                    }
                    className="font-semibold text-indigo-900 hover:text-indigo-700"
                  >
                    {courseCompletion.labCount} ({courseCompletion.labCapacity} cap)
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tutorials</span>
                  <button
                    type="button"
                    onClick={(event) =>
                      openComponentActionsMenu(event, selectedCourseRef?.term, selectedCourse.id, 'tutorials')
                    }
                    className="font-semibold text-indigo-900 hover:text-indigo-700"
                  >
                    {courseCompletion.tutorialCount} ({courseCompletion.tutorialCapacity} cap)
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {STUDENT_CAP_PRESETS.map((cap) => (
                  <button
                    key={`sidebar_cap_${cap}`}
                    type="button"
                    onClick={() => setCourseStudentCap(selectedCourseRef?.term, selectedCourse.id, cap)}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {cap}
                  </button>
                ))}
              </div>
              {(selectedCourse.sections || []).length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Sections</div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCourse.sections || []).map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={(event) =>
                          openRoomSizeMenu(
                            event,
                            selectedCourseRef?.term,
                            selectedCourse.id,
                            'sections',
                            section.id
                          )
                        }
                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                        title={`Room size: ${getRoomSizeLabel(section.roomSize)}`}
                      >
                        {section.name}: {section.assignedStudents || 0}/{getRoomCap(section.roomSize)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(selectedCourse.labs || []).length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Labs</div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCourse.labs || []).map((lab) => (
                      <button
                        key={lab.id}
                        type="button"
                        onClick={(event) =>
                          openRoomSizeMenu(event, selectedCourseRef?.term, selectedCourse.id, 'labs', lab.id)
                        }
                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                        title={`Room size: ${getRoomSizeLabel(lab.roomSize)}`}
                      >
                        {lab.name}: {lab.assignedStudents || 0}/{getRoomCap(lab.roomSize)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(selectedCourse.tutorials || []).length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Tutorials</div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedCourse.tutorials || []).map((tutorial) => (
                      <button
                        key={tutorial.id}
                        type="button"
                        onClick={(event) =>
                          openRoomSizeMenu(
                            event,
                            selectedCourseRef?.term,
                            selectedCourse.id,
                            'tutorials',
                            tutorial.id
                          )
                        }
                        className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                        title={`Room size: ${getRoomSizeLabel(tutorial.roomSize)}`}
                      >
                        {tutorial.name}: {tutorial.assignedStudents || 0}/{getRoomCap(tutorial.roomSize)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={`rounded-lg border px-2 py-1.5 text-sm ${courseCompletion.complete ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {courseCompletion.complete ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  Remaining (Sections): {courseCompletion.sectionRemaining}
                </div>
                {courseCompletion.labCount > 0 && (
                  <div className="text-xs mt-1">Remaining (Labs): {courseCompletion.labRemaining}</div>
                )}
                {courseCompletion.tutorialCount > 0 && (
                  <div className="text-xs mt-1">Remaining (Tutorials): {courseCompletion.tutorialRemaining}</div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Placement Progress</span>
                  <span>{courseCompletion.overallPct}%</span>
                </div>
                <ProgressBar
                  percentage={courseCompletion.overallPct}
                  color={courseCompletion.complete ? 'bg-emerald-500' : 'bg-red-500'}
                  height="h-2"
                />
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1.5">Suggestions</div>
                <div className="space-y-1">
                  {courseCompletion.suggestions.map((suggestion, index) => (
                    <p key={`suggestion_${index}`} className="text-xs text-slate-700">
                      {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {termDetail && (
        <div className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm p-4 overflow-auto">
          <div className="max-w-[96rem] mx-auto">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedYear?.label || 'Planning Year'} • {termDetail.term} Schedule
                  </h3>
                  <p className="text-sm text-slate-500">
                    Drag blocks between Unassigned and the week columns. Right-click a block to split or return it to Unassigned.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTermDetail(null);
                    setScheduleDragState(null);
                    setSelectedScheduleItemKey('');
                    setSelectedScheduleCourseId('');
                  }}
                  className="px-3 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-3">
                {['', ...WEEK_DAYS].map((dayKey) => {
                  const label = dayKey || 'Unassigned';
                  const blocks = termDetailScheduleItems.filter((item) => (item.day || '') === dayKey);
                  return (
                    <div
                      key={`schedule_day_${label}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 min-h-[28rem] flex flex-col"
                      onClick={() => {
                        setSelectedScheduleItemKey('');
                        setSelectedScheduleCourseId('');
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!scheduleDragState) return;
                        moveScheduleBlock(
                          termDetail.term,
                          scheduleDragState.courseId,
                          scheduleDragState.ownerType,
                          scheduleDragState.ownerId,
                          scheduleDragState.blockId,
                          dayKey
                        );
                        setScheduleDragState(null);
                      }}
                    >
                      <div className="px-3 py-2 border-b border-slate-200">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-700">{label}</div>
                        <div className="text-[11px] text-slate-500">{blocks.length} blocks</div>
                      </div>
                      <div className="p-2 space-y-2 flex-1">
                        {blocks.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            draggable
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedScheduleItemKey(item.key);
                              setSelectedScheduleCourseId(item.courseId);
                            }}
                            onDragStart={() => setScheduleDragState(item)}
                            onDragEnd={() => setScheduleDragState(null)}
                            onContextMenu={(event) => openScheduleBlockMenu(event, item)}
                            className={`w-full rounded-lg border border-slate-300 px-2 py-2 text-left shadow-sm hover:brightness-[0.98] ${item.color} ${getScheduleBlockTone(item.ownerType)} ${
                              selectedScheduleCourseId
                                ? item.courseId === selectedScheduleCourseId
                                  ? item.key === selectedScheduleItemKey
                                    ? 'ring-2 ring-indigo-600 border-indigo-400'
                                    : 'ring-2 ring-emerald-500 border-emerald-400'
                                  : 'opacity-35 saturate-50'
                                : ''
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900">{item.title}</div>
                            <div className="text-[11px] text-slate-800">{item.subtitle}</div>
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                              {item.durationHours} hour{item.durationHours === 1 ? '' : 's'}
                            </div>
                          </button>
                        ))}
                        {blocks.length === 0 && (
                          <div className="h-16 rounded-lg border border-dashed border-slate-300 bg-white/60" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {termAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-base font-bold text-slate-900">Add Course to {termAddModal.term}</h4>
              <button
                type="button"
                onClick={() => setTermAddModal(null)}
                className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <XCircle size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input
                type="text"
                value={termCourseSearch}
                onChange={(event) => setTermCourseSearch(event.target.value)}
                placeholder="Search code/title/discipline..."
                className="md:col-span-2 px-3 py-2 rounded border border-slate-300 text-sm bg-white"
              />
              <select
                value={termCourseDisciplineFilter}
                onChange={(event) => setTermCourseDisciplineFilter(event.target.value)}
                className="px-3 py-2 rounded border border-slate-300 text-sm bg-white"
              >
                {termCourseDisciplineOptions.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>
            <div className="border border-slate-200 rounded-lg max-h-[55vh] overflow-y-auto">
              {filteredTermCourseOptions.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">No courses match current filters.</div>
              ) : (
                filteredTermCourseOptions.map((course) => (
                  <button
                    key={`plan_add_${course.id}`}
                    type="button"
                    onClick={() => {
                      const added = addCourseToSpecificTerm(termAddModal.term, course.code);
                      if (added) {
                        setTermAddModal(null);
                      }
                    }}
                    className="w-full px-3 py-2 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="text-sm font-semibold text-slate-900">{course.code}</div>
                    <div className="text-xs text-slate-600">{course.title}</div>
                    <div className="text-[11px] text-indigo-700 font-medium">{course.discipline || 'Uncategorized'}</div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <Card
            className="w-64 p-2"
            style={{
              position: 'fixed',
              left: Math.max(8, Math.min(contextMenu.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 280)),
              top: Math.max(8, Math.min(contextMenu.y + 8, (typeof window !== 'undefined' ? window.innerHeight : 800) - 220))
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {contextMenu.kind === 'course' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    addCourseComponent(contextMenu.term, contextMenu.courseId, 'sections');
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Create a Section
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInstructorPicker({
                      x: contextMenu.x,
                      y: contextMenu.y,
                      term: contextMenu.term,
                      courseId: contextMenu.courseId
                    });
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Assign/Change Instructor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addCourseComponent(contextMenu.term, contextMenu.courseId, 'labs');
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Add Lab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addCourseComponent(contextMenu.term, contextMenu.courseId, 'tutorials');
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Add Tutorial
                </button>
              </div>
            )}
            {contextMenu.kind === 'componentActions' && (
              <div className="space-y-1">
                <p className="px-2.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {contextMenu.componentType === 'sections'
                    ? 'Sections'
                    : contextMenu.componentType === 'labs'
                    ? 'Labs'
                    : 'Tutorials'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    addCourseComponent(contextMenu.term, contextMenu.courseId, contextMenu.componentType);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  + Add{' '}
                  {contextMenu.componentType === 'sections'
                    ? 'Section'
                    : contextMenu.componentType === 'labs'
                    ? 'Lab'
                    : 'Tutorial'}
                </button>
                {(() => {
                  const targetCourse = getCourseByRef({ term: contextMenu.term, courseId: contextMenu.courseId });
                  const components = targetCourse?.[contextMenu.componentType] || [];
                  if (components.length === 0) return null;
                  return components.map((component) => (
                    <button
                      key={component.id}
                      type="button"
                      onClick={(event) =>
                        openRoomSizeMenu(
                          event,
                          contextMenu.term,
                          contextMenu.courseId,
                          contextMenu.componentType,
                          component.id
                        )
                      }
                      className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                    >
                      {component.name}: {component.assignedStudents || 0}/{getRoomCap(component.roomSize)}
                    </button>
                  ));
                })()}
              </div>
            )}
            {contextMenu.kind === 'component' && (
              <div className="space-y-1">
                <p className="px-2.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Room Size</p>
                {ROOM_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateCourse(contextMenu.term, contextMenu.courseId, (course) => ({
                        ...course,
                        [contextMenu.componentType]: (course[contextMenu.componentType] || []).map((component) =>
                          component.id === contextMenu.componentId ? { ...component, roomSize: option.value } : component
                        )
                      }));
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {contextMenu.kind === 'scheduleBlock' && (
              <div className="space-y-1">
                <p className="px-2.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Schedule Block</p>
                <button
                  type="button"
                  onClick={() => {
                    splitScheduleBlock(
                      termDetail?.term || contextMenu.term,
                      contextMenu.courseId,
                      contextMenu.ownerType,
                      contextMenu.ownerId,
                      contextMenu.blockId,
                      2
                    );
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Split into 2 x 1.5 hour blocks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    splitScheduleBlock(
                      termDetail?.term || contextMenu.term,
                      contextMenu.courseId,
                      contextMenu.ownerType,
                      contextMenu.ownerId,
                      contextMenu.blockId,
                      3
                    );
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  Split into 3 x 1 hour blocks
                </button>
                {Number(contextMenu.durationHours || 3) < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      splitScheduleBlock(
                        termDetail?.term || contextMenu.term,
                        contextMenu.courseId,
                        contextMenu.ownerType,
                        contextMenu.ownerId,
                        contextMenu.blockId,
                        1
                      );
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm"
                  >
                    Convert back to 1 x 3 hour block
                  </button>
                )}
                {contextMenu.day && (
                  <button
                    type="button"
                    onClick={() => {
                      moveScheduleBlock(
                        termDetail?.term || contextMenu.term,
                        contextMenu.courseId,
                        contextMenu.ownerType,
                        contextMenu.ownerId,
                        contextMenu.blockId,
                        ''
                      );
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-slate-100 text-sm text-red-700"
                  >
                    Return to Unassigned
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {instructorPicker && (
        <div className="fixed inset-0 z-50" onClick={() => setInstructorPicker(null)}>
          <Card
            className="w-72 p-2"
            style={{
              position: 'fixed',
              left: Math.max(8, Math.min(instructorPicker.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 300)),
              top: Math.max(8, Math.min(instructorPicker.y + 8, (typeof window !== 'undefined' ? window.innerHeight : 800) - 300))
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2.5 py-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Assign Instructor</h4>
              <button
                type="button"
                onClick={() => {
                  updateCourse(instructorPicker.term, instructorPicker.courseId, (course) => ({ ...course, instructorId: '' }));
                  setInstructorPicker(null);
                }}
                className="text-[11px] px-2 py-0.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto p-1">
              {instructorChoices.length === 0 ? (
                <p className="text-xs text-slate-500 px-2 py-1">No faculty records available.</p>
              ) : (
                instructorChoices.map((faculty) => (
                  <button
                    key={faculty.id}
                    type="button"
                    disabled={faculty.atCapacity}
                    onClick={() => {
                      updateCourse(instructorPicker.term, instructorPicker.courseId, (course) => ({
                        ...course,
                        instructorId: faculty.id
                      }));
                      setInstructorPicker(null);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded border ${getWorkloadTone(faculty.utilizationPercent)} ${
                      faculty.atCapacity ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-[0.97]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{faculty.name}</span>
                      <span className="text-[10px] font-bold">{faculty.totalAssigned}/{faculty.capacity || 0}</span>
                    </div>
                    <div className="text-[11px] flex items-center gap-1.5">
                      <User size={11} />
                      Remaining: {faculty.remaining}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {instructorProfile && instructorProfileData && (
        <div className="fixed inset-0 z-50" onClick={() => setInstructorProfile(null)}>
          <Card
            className="w-80 p-3"
            style={{
              position: 'fixed',
              left: Math.max(8, Math.min(instructorProfile.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 340)),
              top: Math.max(8, Math.min(instructorProfile.y + 8, (typeof window !== 'undefined' ? window.innerHeight : 800) - 260))
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{instructorProfileData.name}</h4>
                <p className="text-xs text-slate-600">{instructorProfileData.type || 'Instructor'}</p>
              </div>
              <button
                type="button"
                onClick={() => setInstructorProfile(null)}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <XCircle size={14} />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Teaching Load Capacity</span>
                <span className="font-semibold">{instructorProfileData.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned (Current + Planning)</span>
                <span className="font-semibold">{instructorProfileData.totalAssigned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining</span>
                <span className={`font-semibold ${instructorProfileData.remaining <= 0 ? 'text-red-700' : 'text-slate-900'}`}>
                  {instructorProfileData.remaining}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Load Progress</span>
                <span>{Math.max(0, Math.round(instructorProfileData.utilizationPercent))}%</span>
              </div>
              <ProgressBar
                percentage={Math.max(0, Math.min(100, Math.round(instructorProfileData.utilizationPercent)))}
                color={instructorProfileData.remaining <= 0 ? 'bg-red-500' : 'bg-indigo-500'}
                height="h-2"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

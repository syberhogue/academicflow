import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, GraduationCap, LayoutDashboard, Menu, Settings, Star, Users, X } from 'lucide-react';
import { COURSE_COLORS, INITIAL_COURSES, INITIAL_DATA, getDefaultProgramColor } from './src/data';
import { getTodayIsoDate, normalizeProgramInfo } from './src/programInfo';
import { CreateProgramView } from './src/views/CreateProgramView';
import { DashboardView } from './src/views/DashboardView';
import { FacultyView } from './src/views/FacultyView';
import { GlobalCoursesView } from './src/views/GlobalCoursesView';
import { PlanningView } from './src/views/PlanningView';
import { ProgramDetailView } from './src/views/ProgramDetailView';
import {
  createGlobalCourseFromForm,
  createProgramFromForm,
  insertCourseInProgram,
  removeCourseFromProgram,
  swapCoursesAcrossSemesters
} from './src/programActions';

const PROGRAMS_STORAGE_KEY = 'academicflow.programs.v1';
const MAP_SAVED_AT_STORAGE_KEY = 'academicflow.mapSavedAt.v1';
const FAVORITE_PROGRAM_IDS_STORAGE_KEY = 'academicflow.favoriteProgramIds.v1';
const COURSE_CATEGORIES_STORAGE_KEY = 'academicflow.courseCategories.v1';
const FACULTY_DIRECTORY_STORAGE_KEY = 'academicflow.facultyDirectory.v1';
const PLANNING_STORAGE_KEY = 'academicflow.planning.v1';
const DEFAULT_MAP_COLUMNS = 5;
const MAX_MAP_COLUMNS = 6;
const FACULTY_TERM_OPTIONS = ['Fall', 'Winter', 'Spring/Summer'];
const createCourseInstanceId = () => `ci_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const NON_SHARED_PLACEHOLDER_CODES = new Set(['ELEC', 'OPEN', 'BUSI-ELEC', 'GAME-ELEC', 'SPEC']);

const inferCurrentFacultyTerm = (date = new Date()) => {
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 12) return 'Fall';
  if (month >= 1 && month <= 4) return 'Winter';
  return 'Spring/Summer';
};

const getSharedCoursePoolId = (course, courseInstanceId) => {
  const existingGlobalId = String(course?.courseGlobalId || course?.globalCourseId || '').trim();
  if (existingGlobalId) {
    return existingGlobalId;
  }

  const explicitCourseId = String(course?.id || '').trim();
  if (explicitCourseId) {
    return `gcid_${explicitCourseId}`;
  }

  const code = String(course?.code || '').trim().toUpperCase();
  if (code && !NON_SHARED_PLACEHOLDER_CODES.has(code)) {
    return `gcc_${code}`;
  }

  if (courseInstanceId) {
    return `gci_${courseInstanceId}`;
  }

  return `gci_${createCourseInstanceId()}`;
};

const normalizeProgramCourseWithIds = (course, usedCourseInstanceIds) => {
  if (!course) return null;
  const normalizedPrerequisites = Array.isArray(course.prerequisites)
    ? course.prerequisites.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
  let courseInstanceId = String(
    course.courseInstanceId || course.mapCourseId || course.instanceId || ''
  ).trim();
  if (!courseInstanceId || usedCourseInstanceIds.has(courseInstanceId)) {
    courseInstanceId = createCourseInstanceId();
  }
  usedCourseInstanceIds.add(courseInstanceId);
  const courseGlobalId = getSharedCoursePoolId(course, courseInstanceId);
  return {
    ...course,
    prerequisites: normalizedPrerequisites,
    courseInstanceId,
    courseGlobalId
  };
};

const collectProgramCourseRefs = (program) => {
  const refs = [];
  (program?.semesters || []).forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (!course) return;
      refs.push({
        slotKey: `${semester.id}:${index}`,
        code: String(course.code || '').trim(),
        title: String(course.title || '').trim(),
        courseGlobalId: String(course.courseGlobalId || course.courseInstanceId || '').trim(),
        courseInstanceId: String(course.courseInstanceId || '').trim()
      });
    });
  });

  (program?.specializationBlocks || []).forEach((block) => {
    (block.courses || []).forEach((course, index) => {
      if (!course) return;
      refs.push({
        slotKey: `spec:${block.id}:${index}`,
        code: String(course.code || '').trim(),
        title: String(course.title || '').trim(),
        courseGlobalId: String(course.courseGlobalId || course.courseInstanceId || '').trim(),
        courseInstanceId: String(course.courseInstanceId || '').trim()
      });
    });
  });

  Object.entries(program?.electiveSuggestionMaps || {}).forEach(([electiveType, rows]) => {
    (rows || []).forEach((row) => {
      (row.courses || []).forEach((course, index) => {
        if (!course) return;
        refs.push({
          slotKey: `elec:${electiveType}:${row.id}:${index}`,
          code: String(course.code || '').trim(),
          title: String(course.title || '').trim(),
          courseGlobalId: String(course.courseGlobalId || course.courseInstanceId || '').trim(),
          courseInstanceId: String(course.courseInstanceId || '').trim()
        });
      });
    });
  });

  return refs;
};

const ensureProgramCourseInstanceIds = (program) => {
  const usedCourseInstanceIds = new Set();
  const normalizedSpecializationBlocks = (program?.specializationBlocks || []).map((block) => ({
    ...block,
    courses: (block.courses || []).map((course) => normalizeProgramCourseWithIds(course, usedCourseInstanceIds))
  }));
  const normalizedElectiveSuggestionMaps = Object.entries(program?.electiveSuggestionMaps || {}).reduce(
    (acc, [electiveType, rows]) => {
      acc[electiveType] = (rows || []).map((row) => ({
        ...row,
        courses: (row.courses || []).map((course) => normalizeProgramCourseWithIds(course, usedCourseInstanceIds))
      }));
      return acc;
    },
    {}
  );
  return {
    ...program,
    semesters: (program?.semesters || []).map((semester) => ({
      ...semester,
      courses: (semester.courses || []).map((course) => normalizeProgramCourseWithIds(course, usedCourseInstanceIds))
    })),
    specializationBlocks: normalizedSpecializationBlocks,
    electiveSuggestionMaps: normalizedElectiveSuggestionMaps
  };
};

const normalizeProgramCourseInstructorAssignments = (program) => {
  const slotToCourseGlobalId = new Map();
  const courseGlobalIdsByCode = new Map();
  const validCourseGlobalIds = new Set();
  collectProgramCourseRefs(program).forEach((entry) => {
    const courseGlobalId = String(entry.courseGlobalId || entry.courseInstanceId || entry.slotKey).trim();
    if (!courseGlobalId) return;
    validCourseGlobalIds.add(courseGlobalId);
    slotToCourseGlobalId.set(entry.slotKey, courseGlobalId);
    const code = String(entry.code || '').trim();
    if (!code) return;
    const existing = courseGlobalIdsByCode.get(code) || [];
    existing.push(courseGlobalId);
    courseGlobalIdsByCode.set(code, existing);
  });

  const assignmentByCourseGlobalId = new Map();
  const existingAssignments = Array.isArray(program?.courseInstructorAssignments)
    ? program.courseInstructorAssignments
    : [];
  existingAssignments.forEach((assignment) => {
    const courseGlobalId = String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim();
    const facultyId = String(assignment?.facultyId || '').trim();
    if (!courseGlobalId || !facultyId) return;
    if (!validCourseGlobalIds.has(courseGlobalId)) return;
    assignmentByCourseGlobalId.set(courseGlobalId, {
      id: String(assignment?.id || '').trim() || `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      courseGlobalId,
      courseInstanceId: courseGlobalId,
      facultyId
    });
  });
  const shouldImportLegacyAssignments = assignmentByCourseGlobalId.size === 0;

  const legacyBySlot =
    program?.assignedFacultyBySlot && typeof program.assignedFacultyBySlot === 'object'
      ? program.assignedFacultyBySlot
      : {};
  if (shouldImportLegacyAssignments) {
    Object.entries(legacyBySlot).forEach(([slotKey, facultyId]) => {
      const normalizedSlotKey = String(slotKey || '').trim();
      const normalizedFacultyId = String(facultyId || '').trim();
      if (!normalizedSlotKey || !normalizedFacultyId) return;
      const courseGlobalId = slotToCourseGlobalId.get(normalizedSlotKey);
      if (!courseGlobalId) return;
      assignmentByCourseGlobalId.set(courseGlobalId, {
        id: `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        courseGlobalId,
        courseInstanceId: courseGlobalId,
        facultyId: normalizedFacultyId
      });
    });
  }

  const legacyByCode =
    program?.assignedFacultyCoursesByFaculty && typeof program.assignedFacultyCoursesByFaculty === 'object'
      ? program.assignedFacultyCoursesByFaculty
      : {};
  if (shouldImportLegacyAssignments) {
    Object.entries(legacyByCode).forEach(([facultyId, courseCodes]) => {
      const normalizedFacultyId = String(facultyId || '').trim();
      if (!normalizedFacultyId) return;
      const normalizedCodes = Array.isArray(courseCodes)
        ? courseCodes.map((code) => String(code || '').trim()).filter(Boolean)
        : [];
      normalizedCodes.forEach((courseCode) => {
        const candidateIds = courseGlobalIdsByCode.get(courseCode) || [];
        const targetId = candidateIds.find((courseGlobalId) => !assignmentByCourseGlobalId.has(courseGlobalId));
        if (!targetId) return;
        assignmentByCourseGlobalId.set(targetId, {
          id: `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          courseGlobalId: targetId,
          courseInstanceId: targetId,
          facultyId: normalizedFacultyId
        });
      });
    });
  }

  return Array.from(assignmentByCourseGlobalId.values());
};

const reconcileProgramCourseInstructorAssignments = (program) => {
  const withCourseInstanceIds = ensureProgramCourseInstanceIds(program);
  return {
    ...withCourseInstanceIds,
    courseInstructorAssignments: normalizeProgramCourseInstructorAssignments(withCourseInstanceIds)
  };
};

const normalizeCourseRecord = (course) => {
  if (!course) return null;
  return {
    ...course,
    prerequisites: Array.isArray(course.prerequisites)
      ? course.prerequisites.map((value) => String(value || '').trim()).filter(Boolean)
      : []
  };
};

const normalizePrerequisiteLinks = (links = []) => {
  const seen = new Set();
  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      id: link?.id || `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromSemesterId: link?.fromSemesterId || null,
      fromIndex: Number(link?.fromIndex),
      toSemesterId: link?.toSemesterId || null,
      toIndex: Number(link?.toIndex)
    }))
    .filter((link) => {
      if (!link.fromSemesterId || !link.toSemesterId) return false;
      if (!Number.isInteger(link.fromIndex) || link.fromIndex < 0) return false;
      if (!Number.isInteger(link.toIndex) || link.toIndex < 0) return false;
      if (link.fromSemesterId === link.toSemesterId && link.fromIndex === link.toIndex) return false;
      const key = `${link.fromSemesterId}:${link.fromIndex}->${link.toSemesterId}:${link.toIndex}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const applyPrerequisiteMetadataToProgram = (program, prerequisiteLinks) => {
  const normalizedLinks = normalizePrerequisiteLinks(prerequisiteLinks);
  const slotCourseCode = new Map();
  (program.semesters || []).forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (!course?.code) return;
      slotCourseCode.set(`${semester.id}:${index}`, course.code);
    });
  });

  const validLinks = normalizedLinks.filter((link) => {
    const fromKey = `${link.fromSemesterId}:${link.fromIndex}`;
    const toKey = `${link.toSemesterId}:${link.toIndex}`;
    return slotCourseCode.has(fromKey) && slotCourseCode.has(toKey);
  });

  const prerequisitesByTarget = new Map();
  validLinks.forEach((link) => {
    const targetKey = `${link.toSemesterId}:${link.toIndex}`;
    const prereqCode = slotCourseCode.get(`${link.fromSemesterId}:${link.fromIndex}`);
    if (!prereqCode) return;
    const current = prerequisitesByTarget.get(targetKey) || [];
    current.push(prereqCode);
    prerequisitesByTarget.set(targetKey, current);
  });

  return {
    ...program,
    prerequisiteLinks: validLinks,
    semesters: (program.semesters || []).map((semester) => ({
      ...semester,
      courses: (semester.courses || []).map((course, index) => {
        if (!course) return null;
        const key = `${semester.id}:${index}`;
        return {
          ...normalizeCourseRecord(course),
          prerequisites: prerequisitesByTarget.get(key) || []
        };
      })
    }))
  };
};

const normalizeFacultyCourseRef = (course) => {
  if (!course) return null;
  const code = String(course.code || '').trim();
  if (!code) return null;
  return {
    code,
    title: String(course.title || '').trim()
  };
};

const normalizeTeachingHistoryEntry = (entry) => {
  const rawTerm = String(entry?.term || '').trim();
  const rawYear = String(entry?.year || '').trim();
  const rawTermYear = String(entry?.termYear || '').trim();
  const parsedTermYear =
    rawTerm && rawYear ? `${rawTerm} ${rawYear}` : rawTermYear;
  return {
    id: entry?.id || `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    courseCode: String(entry?.courseCode || '').trim(),
    courseTitle: String(entry?.courseTitle || '').trim(),
    term: rawTerm || (rawTermYear.split(' ').slice(0, -1).join(' ') || ''),
    year: rawYear || (rawTermYear.split(' ').slice(-1)[0] || ''),
    termYear: parsedTermYear,
    isOverload: !!entry?.isOverload
  };
};

const normalizeTeachingInterests = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    );
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const normalizeFacultyRecord = (member) => ({
  id: member?.id || `fac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: String(member?.name || '').trim(),
  faculty: String(member?.faculty || '').trim(),
  email: String(member?.email || '').trim(),
  teachingInterests: normalizeTeachingInterests(member?.teachingInterests),
  typicalCourses: (Array.isArray(member?.typicalCourses) ? member.typicalCourses : [])
    .map((course) => normalizeFacultyCourseRef(course))
    .filter(Boolean),
  currentCourses: (Array.isArray(member?.currentCourses) ? member.currentCourses : [])
    .map((course) => normalizeFacultyCourseRef(course))
    .filter(Boolean),
  teachingHistory: (Array.isArray(member?.teachingHistory) ? member.teachingHistory : [])
    .map((entry) => normalizeTeachingHistoryEntry(entry))
    .filter((entry) => entry.courseCode || entry.courseTitle || entry.termYear),
  currentTerm: FACULTY_TERM_OPTIONS.includes(String(member?.currentTerm || '').trim())
    ? String(member.currentTerm).trim()
    : inferCurrentFacultyTerm(),
  currentYear: String(member?.currentYear || '').trim() || String(new Date().getFullYear()),
  courseReleases: Math.max(0, Number(member?.courseReleases || 0)),
  comments: String(member?.comments || '').trim(),
  appointmentType: String(member?.appointmentType || '').trim(),
  teachingLoad: Math.max(0, Number(member?.teachingLoad || 0)),
  overloads: Math.max(0, Number(member?.overloads || 0))
});

const loadFacultyDirectoryFromStorage = () => {
  try {
    const stored = localStorage.getItem(FACULTY_DIRECTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((member) => normalizeFacultyRecord(member)).filter((member) => member.name);
  } catch (error) {
    console.error('Failed to load faculty directory from localStorage', error);
    return [];
  }
};

const deriveFacultyFromPrograms = (programs = []) => {
  const derived = [];
  programs.forEach((program) => {
    (program.facultyMembers || []).forEach((member) => {
      const name = String(member?.name || '').trim();
      if (!name) return;
      derived.push(
        normalizeFacultyRecord({
          id: `fac_${program.id}_${member.id || name.replace(/[^a-z0-9]+/gi, '_')}`,
          name,
          faculty: String(program?.faculty || '').trim(),
          email: '',
          teachingInterests: '',
          typicalCourses: [],
          currentCourses: [],
          teachingHistory: [],
          currentTerm: inferCurrentFacultyTerm(),
          currentYear: String(new Date().getFullYear()),
          courseReleases: 0,
          comments: '',
          appointmentType: member?.role || '',
          teachingLoad: 0,
          overloads: 0
        })
      );
    });
  });
  return derived;
};

const mergeFacultyRecords = (currentFaculty = [], programs = []) => {
  const normalizedCurrent = (currentFaculty || []).map((member) => normalizeFacultyRecord(member));
  const byIdentity = new Set(
    normalizedCurrent.map((member) => `${member.name.toLowerCase()}|${member.email.toLowerCase()}`)
  );

  const additions = [];
  deriveFacultyFromPrograms(programs).forEach((member) => {
    const key = `${member.name.toLowerCase()}|${member.email.toLowerCase()}`;
    if (byIdentity.has(key)) return;
    byIdentity.add(key);
    additions.push(member);
  });

  if (additions.length === 0) {
    return normalizedCurrent;
  }
  return [...normalizedCurrent, ...additions];
};

const areCourseRefsEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (String(left[index]?.code || '') !== String(right[index]?.code || '')) return false;
    if (String(left[index]?.title || '') !== String(right[index]?.title || '')) return false;
  }
  return true;
};

const deriveFacultyCurrentCoursesFromPrograms = (programs = []) => {
  const byFaculty = new Map();
  programs.forEach((program) => {
    const courseById = new Map();
    collectProgramCourseRefs(program).forEach((entry) => {
      const courseGlobalId = String(entry.courseGlobalId || entry.courseInstanceId || entry.slotKey || '').trim();
      const code = String(entry.code || '').trim();
      if (!courseGlobalId || !code) return;
      if (!courseById.has(courseGlobalId)) {
        courseById.set(courseGlobalId, {
          code,
          title: String(entry.title || '').trim()
        });
      }
    });
    (Array.isArray(program?.courseInstructorAssignments) ? program.courseInstructorAssignments : []).forEach((assignment) => {
      const facultyId = String(assignment?.facultyId || '').trim();
      if (!facultyId || facultyId === '__sessional__') return;
      const courseGlobalId = String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim();
      if (!courseGlobalId) return;
      const course = courseById.get(courseGlobalId);
      if (!course?.code) return;
      if (!byFaculty.has(facultyId)) {
        byFaculty.set(facultyId, new Map());
      }
      const byKey = byFaculty.get(facultyId);
      const key = `${String(course.code || '').toLowerCase()}|${String(course.title || '').toLowerCase()}`;
      byKey.set(key, {
        code: course.code,
        title: String(course.title || '').trim()
      });
    });
  });
  return new Map(
    Array.from(byFaculty.entries()).map(([facultyId, courseMap]) => [
      facultyId,
      Array.from(courseMap.values()).sort((a, b) =>
        String(a.code || '').localeCompare(String(b.code || ''))
      )
    ])
  );
};

const inferOccupiedMapColumns = (semesters = []) => {
  let maxOccupied = 0;
  semesters.forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (course) {
        maxOccupied = Math.max(maxOccupied, index + 1);
      }
    });
  });
  return Math.min(MAX_MAP_COLUMNS, Math.max(DEFAULT_MAP_COLUMNS, maxOccupied));
};

const loadFavoriteProgramIds = () => {
  try {
    const storedFavoriteIds = localStorage.getItem(FAVORITE_PROGRAM_IDS_STORAGE_KEY);
    if (!storedFavoriteIds) {
      return new Set();
    }
    const parsedFavoriteIds = JSON.parse(storedFavoriteIds);
    if (!Array.isArray(parsedFavoriteIds)) {
      return new Set();
    }
    return new Set(parsedFavoriteIds);
  } catch (error) {
    console.error('Failed to load favorite program IDs from localStorage', error);
    return new Set();
  }
};

const normalizeProgramCollection = (rawPrograms = [], favoriteProgramIds = new Set()) => {
  const basePrograms = rawPrograms.map((program) => ({
    ...program,
    prerequisiteLinks: normalizePrerequisiteLinks(program.prerequisiteLinks || []),
    semesters: (() => {
      const usedCourseInstanceIds = new Set();
      return (program.semesters || []).map((semester) => ({
        ...semester,
        courses: (semester.courses || []).map((course) => {
          const normalized = normalizeCourseRecord(course);
          if (!normalized) return null;
          let courseInstanceId = String(
            normalized.courseInstanceId || normalized.mapCourseId || normalized.instanceId || ''
          ).trim();
          if (!courseInstanceId || usedCourseInstanceIds.has(courseInstanceId)) {
            courseInstanceId = createCourseInstanceId();
          }
          usedCourseInstanceIds.add(courseInstanceId);
          return {
            ...normalized,
            courseInstanceId
          };
        })
      }));
    })(),
    isFavorite: favoriteProgramIds.has(program.id) || !!program.isFavorite,
    assignedFacultyMemberIds: Array.isArray(program.assignedFacultyMemberIds)
      ? Array.from(
          new Set(program.assignedFacultyMemberIds.map((id) => String(id || '').trim()).filter(Boolean))
        )
      : [],
    assignedFacultyCoursesByFaculty:
      program.assignedFacultyCoursesByFaculty && typeof program.assignedFacultyCoursesByFaculty === 'object'
        ? Object.entries(program.assignedFacultyCoursesByFaculty).reduce((acc, [facultyId, courseCodes]) => {
            const normalizedFacultyId = String(facultyId || '').trim();
            if (!normalizedFacultyId) return acc;
            const normalizedCodes = Array.isArray(courseCodes)
              ? Array.from(new Set(courseCodes.map((code) => String(code || '').trim()).filter(Boolean)))
              : [];
            acc[normalizedFacultyId] = normalizedCodes;
            return acc;
          }, {})
        : {},
    assignedFacultyBySlot:
      program.assignedFacultyBySlot && typeof program.assignedFacultyBySlot === 'object'
        ? Object.entries(program.assignedFacultyBySlot).reduce((acc, [slotKey, facultyId]) => {
            const normalizedSlotKey = String(slotKey || '').trim();
            const normalizedFacultyId = String(facultyId || '').trim();
            if (!normalizedSlotKey || !normalizedFacultyId) return acc;
            acc[normalizedSlotKey] = normalizedFacultyId;
            return acc;
          }, {})
        : {},
    color: program.color || getDefaultProgramColor(program.type, !!(program.parentProgramId || program.parentProgram)),
    mapColumns: Math.min(
      MAX_MAP_COLUMNS,
      Math.max(DEFAULT_MAP_COLUMNS, Number(program.mapColumns) || inferOccupiedMapColumns(program.semesters || []))
    )
  }));

  const byId = new Map(basePrograms.map((program) => [program.id, program]));
  const nameToId = new Map(basePrograms.map((program) => [program.name, program.id]));

  return basePrograms.map((program) => {
    const parentId =
      program.parentProgramId || (program.parentProgram ? nameToId.get(program.parentProgram) : null) || null;
    const parentProgram = parentId ? byId.get(parentId) || null : null;
    const withPrerequisiteMetadata = applyPrerequisiteMetadataToProgram(
      program,
      program.prerequisiteLinks || []
    );

    const reconciledProgram = reconcileProgramCourseInstructorAssignments(withPrerequisiteMetadata);
    return {
      ...reconciledProgram,
      programInfo: normalizeProgramInfo(reconciledProgram, parentProgram)
    };
  });
};

const loadProgramsFromStorage = () => {
  try {
    const favoriteProgramIds = loadFavoriteProgramIds();
    const storedPrograms = localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (!storedPrograms) {
      return normalizeProgramCollection(INITIAL_DATA, favoriteProgramIds);
    }

    const parsedPrograms = JSON.parse(storedPrograms);
    if (!Array.isArray(parsedPrograms)) {
      return normalizeProgramCollection(INITIAL_DATA, favoriteProgramIds);
    }

    return normalizeProgramCollection(parsedPrograms, favoriteProgramIds);
  } catch (error) {
    console.error('Failed to load saved programs from localStorage', error);
    return normalizeProgramCollection(INITIAL_DATA, loadFavoriteProgramIds());
  }
};

const loadCourseCategoriesFromStorage = () => {
  try {
    const stored = localStorage.getItem(COURSE_CATEGORIES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Failed to load course categories from localStorage', error);
    return [];
  }
};

const loadSavedAtFromStorage = () => {
  try {
    return localStorage.getItem(MAP_SAVED_AT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load saved timestamp from localStorage', error);
    return null;
  }
};

const loadPlanningFromStorage = () => {
  try {
    const stored = localStorage.getItem(PLANNING_STORAGE_KEY);
    if (!stored) return { years: [] };
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return { years: [] };
    return parsed;
  } catch (error) {
    console.error('Failed to load planning data from localStorage', error);
    return { years: [] };
  }
};

export default function App() {
  const [programs, setPrograms] = useState(loadProgramsFromStorage);
  const [globalCourses, setGlobalCourses] = useState(() => INITIAL_COURSES.map((course) => normalizeCourseRecord(course)));
  const [courseCategories, setCourseCategories] = useState(loadCourseCategoriesFromStorage);
  const [facultyDirectory, setFacultyDirectory] = useState(loadFacultyDirectoryFromStorage);
  const [planningData, setPlanningData] = useState(loadPlanningFromStorage);
  const [mapLastSavedAt, setMapLastSavedAt] = useState(loadSavedAtFromStorage);
  const [createSeed, setCreateSeed] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [electiveModalSlot, setElectiveModalSlot] = useState(null);
  const [placeholderCredits, setPlaceholderCredits] = useState(3);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const favoriteProgramIds = programs
        .filter((program) => !!program.isFavorite)
        .map((program) => program.id);
      localStorage.setItem(FAVORITE_PROGRAM_IDS_STORAGE_KEY, JSON.stringify(favoriteProgramIds));
    } catch (error) {
      console.error('Failed to persist favorite program IDs', error);
    }
  }, [programs]);

  useEffect(() => {
    try {
      localStorage.setItem(COURSE_CATEGORIES_STORAGE_KEY, JSON.stringify(courseCategories));
    } catch (error) {
      console.error('Failed to persist course categories', error);
    }
  }, [courseCategories]);

  useEffect(() => {
    setFacultyDirectory((current) => {
      const merged = mergeFacultyRecords(current, programs);
      const derivedCurrentCoursesByFaculty = deriveFacultyCurrentCoursesFromPrograms(programs);
      const withCurrentAssignments = merged.map((member) => {
        const facultyId = String(member.id || '').trim();
        const derivedCourses = derivedCurrentCoursesByFaculty.get(facultyId) || [];
        const normalizedCurrentCourses = (Array.isArray(member.currentCourses) ? member.currentCourses : [])
          .map((course) => normalizeFacultyCourseRef(course))
          .filter(Boolean)
          .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
        if (areCourseRefsEqual(normalizedCurrentCourses, derivedCourses)) {
          return member;
        }
        return {
          ...member,
          currentCourses: derivedCourses
        };
      });
      if (withCurrentAssignments.length !== current.length) {
        return withCurrentAssignments;
      }
      const unchanged = withCurrentAssignments.every((member, index) => member === current[index]);
      return unchanged ? current : withCurrentAssignments;
    });
  }, [programs]);

  useEffect(() => {
    try {
      localStorage.setItem(FACULTY_DIRECTORY_STORAGE_KEY, JSON.stringify(facultyDirectory));
    } catch (error) {
      console.error('Failed to persist faculty directory', error);
    }
  }, [facultyDirectory]);

  useEffect(() => {
    try {
      localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(planningData || { years: [] }));
    } catch (error) {
      console.error('Failed to persist planning data', error);
    }
  }, [planningData]);

  useEffect(() => {
    const inferred = Array.from(
      new Set(
        globalCourses
          .map((course) => String(course.discipline || '').trim())
          .filter(Boolean)
      )
    );
    setCourseCategories((current) => {
      const merged = Array.from(new Set([...current, ...inferred])).sort((a, b) => a.localeCompare(b));
      if (merged.length === current.length && merged.every((value, index) => value === current[index])) {
        return current;
      }
      return merged;
    });
  }, [globalCourses]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId),
    [programs, selectedProgramId]
  );
  const favoritePrograms = useMemo(
    () => programs.filter((program) => !!program.isFavorite).sort((a, b) => a.name.localeCompare(b.name)),
    [programs]
  );
  const getProgramShortName = (program) => {
    if (!program) return '';
    const raw = program?.programInfo?.programShortName || program?.programInfo?.shortFormName || '';
    return String(raw).trim();
  };

  const navigateTo = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if (view !== 'create') {
      setCreateSeed(null);
    }
    if (view !== 'detail') {
      setSelectedProgramId(null);
    }
  };

  const handleCreateProgram = (event) => {
    event.preventDefault();
    const program = createProgramFromForm(new FormData(event.target), programs);

    setPrograms((currentPrograms) => [...currentPrograms, program]);
    setSelectedProgramId(program.id);
    setActiveView('detail');
    setCreateSeed(null);
  };

  const handleAddGlobalCourse = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    if (!formData.get('code') || !formData.get('title')) {
      return;
    }

    setGlobalCourses((currentCourses) => [
      ...currentCourses,
      normalizeCourseRecord(createGlobalCourseFromForm(formData, COURSE_COLORS))
    ]);
    const discipline = String(formData.get('discipline') || '').trim();
    if (discipline) {
      setCourseCategories((current) =>
        current.includes(discipline) ? current : [...current, discipline].sort((a, b) => a.localeCompare(b))
      );
    }
    event.target.reset();
  };

  const updateGlobalCourse = (courseId, updates) => {
    setGlobalCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === courseId ? normalizeCourseRecord({ ...course, ...updates }) : course
      )
    );
    const discipline = String(updates?.discipline || '').trim();
    if (discipline) {
      setCourseCategories((current) =>
        current.includes(discipline) ? current : [...current, discipline].sort((a, b) => a.localeCompare(b))
      );
    }
  };

  const addCourseCategory = (categoryName) => {
    const normalized = String(categoryName || '').trim();
    if (!normalized) return;
    setCourseCategories((current) =>
      current.includes(normalized) ? current : [...current, normalized].sort((a, b) => a.localeCompare(b))
    );
  };

  const addFacultyMember = (member) => {
    const normalized = normalizeFacultyRecord({
      ...member,
      id: member?.id || `fac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    });
    if (!normalized.name || !normalized.faculty || !normalized.email) {
      return;
    }
    setFacultyDirectory((current) => {
      const exists = current.some(
        (entry) =>
          entry.name.toLowerCase() === normalized.name.toLowerCase() &&
          entry.email.toLowerCase() === normalized.email.toLowerCase()
      );
      if (exists) return current;
      return [...current, normalized];
    });
  };

  const updateFacultyMember = (facultyId, updates) => {
    setFacultyDirectory((current) =>
      current.map((member) =>
        member.id === facultyId ? normalizeFacultyRecord({ ...member, ...updates, id: member.id }) : member
      )
    );
  };

  const insertCourse = (progId, semesterId, index, course) => {
    setPrograms((currentPrograms) =>
      insertCourseInProgram(currentPrograms, progId, semesterId, index, course).map((program) =>
        program.id === progId ? reconcileProgramCourseInstructorAssignments(program) : program
      )
    );
  };

  const removeCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) =>
      removeCourseFromProgram(currentPrograms, progId, semesterId, courseIndex).map((program) =>
        program.id === progId ? reconcileProgramCourseInstructorAssignments(program) : program
      )
    );
  };

  const moveCourse = (progId, sourceSemId, sourceIndex, targetSemId, targetIndex) => {
    setPrograms((currentPrograms) =>
      swapCoursesAcrossSemesters(currentPrograms, progId, sourceSemId, sourceIndex, targetSemId, targetIndex).map(
        (program) => (program.id === progId ? reconcileProgramCourseInstructorAssignments(program) : program)
      )
    );
  };

  const toggleCoreCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
        if (program.id !== progId) {
          return program;
        }

        return {
          ...program,
          semesters: program.semesters.map((semester) => {
            if (semester.id !== semesterId) {
              return semester;
            }

            const updatedCourses = [...semester.courses];
            const currentCourse = updatedCourses[courseIndex];
            if (!currentCourse) {
              return semester;
            }

            updatedCourses[courseIndex] = {
              ...currentCourse,
              isCore: !currentCourse.isCore
            };

            return { ...semester, courses: updatedCourses };
          })
        };
      })
    );
  };

  const toggleNewCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
        if (program.id !== progId) {
          return program;
        }

        return {
          ...program,
          semesters: program.semesters.map((semester) => {
            if (semester.id !== semesterId) {
              return semester;
            }

            const updatedCourses = [...semester.courses];
            const currentCourse = updatedCourses[courseIndex];
            if (!currentCourse) {
              return semester;
            }

            updatedCourses[courseIndex] = {
              ...currentCourse,
              isNewCourse: !currentCourse.isNewCourse
            };

            return { ...semester, courses: updatedCourses };
          })
        };
      })
    );
  };

  const updateSpecializationBlocks = (progId, specializationBlocks) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? reconcileProgramCourseInstructorAssignments({
              ...program,
              specializationBlocks
            })
          : program
      )
    );
  };

  const updateProgramName = (progId, name) => {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return;
    }

    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              name: trimmedName
            }
          : program
      )
    );
  };

  const updateProgramInfo = (progId, programInfo) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              programInfo
            }
          : program
      )
    );
  };

  const updateProgramColor = (progId, color) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              color
            }
          : program
      )
    );
  };

  const updateElectiveSuggestionMaps = (progId, electiveSuggestionMaps) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? reconcileProgramCourseInstructorAssignments({
              ...program,
              electiveSuggestionMaps
            })
          : program
      )
    );
  };

  const updateProgramPrerequisiteLinks = (progId, prerequisiteLinks) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? applyPrerequisiteMetadataToProgram(program, prerequisiteLinks)
          : program
      )
    );
  };

  const updateProgramAssignedFacultyMembers = (progId, assignedFacultyMemberIds) => {
    const normalizedIds = Array.from(
      new Set((assignedFacultyMemberIds || []).map((id) => String(id || '').trim()).filter(Boolean))
    );
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? reconcileProgramCourseInstructorAssignments({
              ...program,
              assignedFacultyMemberIds: normalizedIds,
              courseInstructorAssignments: (Array.isArray(program.courseInstructorAssignments)
                ? program.courseInstructorAssignments
                : []
              ).filter((assignment) => {
                const facultyId = String(assignment?.facultyId || '').trim();
                return facultyId === '__sessional__' || normalizedIds.includes(facultyId);
              })
            })
          : program
      )
    );
  };

  const updateProgramAssignedFacultyCourses = (progId, assignedFacultyCoursesByFaculty) => {
    const normalizedAssignments =
      assignedFacultyCoursesByFaculty && typeof assignedFacultyCoursesByFaculty === 'object'
        ? Object.entries(assignedFacultyCoursesByFaculty).reduce((acc, [facultyId, courseCodes]) => {
            const normalizedFacultyId = String(facultyId || '').trim();
            if (!normalizedFacultyId) return acc;
            const normalizedCodes = Array.isArray(courseCodes)
              ? Array.from(new Set(courseCodes.map((code) => String(code || '').trim()).filter(Boolean)))
              : [];
            acc[normalizedFacultyId] = normalizedCodes;
            return acc;
          }, {})
        : {};
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? reconcileProgramCourseInstructorAssignments({
              ...program,
              assignedFacultyCoursesByFaculty: normalizedAssignments
            })
          : program
      )
    );
  };

  const updateProgramAssignedFacultyBySlot = (progId, assignedFacultyBySlot) => {
    const normalizedAssignments =
      assignedFacultyBySlot && typeof assignedFacultyBySlot === 'object'
        ? Object.entries(assignedFacultyBySlot).reduce((acc, [slotKey, facultyId]) => {
            const normalizedSlotKey = String(slotKey || '').trim();
            const normalizedFacultyId = String(facultyId || '').trim();
            if (!normalizedSlotKey || !normalizedFacultyId) return acc;
            acc[normalizedSlotKey] = normalizedFacultyId;
            return acc;
          }, {})
        : {};
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? reconcileProgramCourseInstructorAssignments({
              ...program,
              assignedFacultyBySlot: normalizedAssignments
            })
          : program
      )
    );
  };

  const updateProgramCourseInstructorAssignments = (progId, courseInstructorAssignments) => {
    setPrograms((currentPrograms) => {
      const programsWithCourseInstances = currentPrograms.map((program) =>
        ensureProgramCourseInstanceIds(program)
      );
      const targetProgramBase = programsWithCourseInstances.find((program) => program.id === progId);
      if (!targetProgramBase) {
        return programsWithCourseInstances;
      }

      const targetProgram = reconcileProgramCourseInstructorAssignments(targetProgramBase);
      const slotToCourseGlobalId = new Map();
      const targetCourseGlobalIds = new Set();
      collectProgramCourseRefs(targetProgram).forEach((entry) => {
        const courseGlobalId = String(entry.courseGlobalId || entry.courseInstanceId || entry.slotKey).trim();
        if (!courseGlobalId) return;
        targetCourseGlobalIds.add(courseGlobalId);
        slotToCourseGlobalId.set(entry.slotKey, courseGlobalId);
      });

      const currentTargetAssignmentByCourseGlobalId = new Map(
        (targetProgram.courseInstructorAssignments || []).map((assignment) => [
          String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim(),
          String(assignment?.facultyId || '').trim()
        ])
      );

      let nextTargetAssignmentByCourseGlobalId;
      let touchedCourseGlobalIds;
      if (Array.isArray(courseInstructorAssignments)) {
        const nextTargetAssignments = courseInstructorAssignments.reduce((acc, assignment) => {
          const rawCourseRef = String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim();
          const courseGlobalId = slotToCourseGlobalId.get(rawCourseRef) || rawCourseRef;
          const facultyId = String(assignment?.facultyId || '').trim();
          if (!courseGlobalId || !facultyId) return acc;
          acc.push({
            id:
              String(assignment?.id || '').trim() || `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            courseGlobalId,
            courseInstanceId: courseGlobalId,
            facultyId
          });
          return acc;
        }, []);
        nextTargetAssignmentByCourseGlobalId = new Map(
          nextTargetAssignments.map((assignment) => [
            String(assignment.courseGlobalId || assignment.courseInstanceId || '').trim(),
            String(assignment.facultyId || '').trim()
          ])
        );
        touchedCourseGlobalIds = new Set([
          ...Array.from(currentTargetAssignmentByCourseGlobalId.keys()),
          ...Array.from(nextTargetAssignmentByCourseGlobalId.keys())
        ]);
      } else if (courseInstructorAssignments && typeof courseInstructorAssignments === 'object') {
        const rawCourseRef = String(
          courseInstructorAssignments.courseGlobalId ||
            courseInstructorAssignments.courseInstanceId ||
            courseInstructorAssignments.slotKey ||
            ''
        ).trim();
        const courseGlobalId = slotToCourseGlobalId.get(rawCourseRef) || rawCourseRef;
        if (!courseGlobalId || !targetCourseGlobalIds.has(courseGlobalId)) {
          return programsWithCourseInstances;
        }
        const facultyId = String(courseInstructorAssignments.facultyId || '').trim();
        nextTargetAssignmentByCourseGlobalId = new Map(currentTargetAssignmentByCourseGlobalId);
        if (facultyId) {
          nextTargetAssignmentByCourseGlobalId.set(courseGlobalId, facultyId);
        } else {
          nextTargetAssignmentByCourseGlobalId.delete(courseGlobalId);
        }
        touchedCourseGlobalIds = new Set([courseGlobalId]);
      } else {
        return programsWithCourseInstances;
      }

      const sharedAssignmentByCourseGlobalId = new Map();
      touchedCourseGlobalIds.forEach((courseGlobalId) => {
        if (!targetCourseGlobalIds.has(courseGlobalId)) return;
        const facultyId = String(nextTargetAssignmentByCourseGlobalId.get(courseGlobalId) || '').trim();
        sharedAssignmentByCourseGlobalId.set(courseGlobalId, facultyId);
      });

      return programsWithCourseInstances.map((program) => {
        const normalizedProgram = reconcileProgramCourseInstructorAssignments(program);
        const programCourseGlobalIds = new Set();
        collectProgramCourseRefs(normalizedProgram).forEach((entry) => {
          const courseGlobalId = String(entry.courseGlobalId || entry.courseInstanceId || entry.slotKey).trim();
          if (courseGlobalId) {
            programCourseGlobalIds.add(courseGlobalId);
          }
        });

        const assignmentByCourseGlobalId = new Map(
          (normalizedProgram.courseInstructorAssignments || []).map((assignment) => [
            String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim(),
            {
              id: String(assignment?.id || '').trim() || `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              courseGlobalId: String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim(),
              courseInstanceId: String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim(),
              facultyId: String(assignment?.facultyId || '').trim()
            }
          ])
        );

        sharedAssignmentByCourseGlobalId.forEach((facultyId, courseGlobalId) => {
          if (!programCourseGlobalIds.has(courseGlobalId)) return;
          if (!facultyId) {
            assignmentByCourseGlobalId.delete(courseGlobalId);
            return;
          }
          const existing = assignmentByCourseGlobalId.get(courseGlobalId);
          assignmentByCourseGlobalId.set(courseGlobalId, {
            id: existing?.id || `cia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            courseGlobalId,
            courseInstanceId: courseGlobalId,
            facultyId
          });
        });

        const nextAssignments = Array.from(assignmentByCourseGlobalId.values()).filter(
          (assignment) => (assignment.courseGlobalId || assignment.courseInstanceId) && assignment.facultyId
        );
        const assignedFacultyFromAssignments = Array.from(
          new Set(
            nextAssignments
              .map((assignment) => String(assignment.facultyId || '').trim())
              .filter((facultyId) => facultyId && facultyId !== '__sessional__')
          )
        );

        return reconcileProgramCourseInstructorAssignments({
          ...normalizedProgram,
          assignedFacultyMemberIds: Array.from(
            new Set([
              ...((Array.isArray(normalizedProgram.assignedFacultyMemberIds)
                ? normalizedProgram.assignedFacultyMemberIds
                : [])
                .map((id) => String(id || '').trim())
                .filter(Boolean)),
              ...assignedFacultyFromAssignments
            ])
          ),
          courseInstructorAssignments: nextAssignments
        });
      });
    });
  };

  const handleCloseModal = () => {
    setElectiveModalSlot(null);
    setCourseSearchTerm('');
  };

  const handleSaveCurriculumMap = () => {
    try {
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
      const savedAt = new Date().toISOString();
      localStorage.setItem(MAP_SAVED_AT_STORAGE_KEY, savedAt);
      setMapLastSavedAt(savedAt);
    } catch (error) {
      console.error('Failed to save curriculum map', error);
    }
  };

  const handleExportProgram = async (progId) => {
    const today = getTodayIsoDate();
    const program = programs.find((candidate) => candidate.id === progId);
    if (!program) {
      return;
    }

    const nextProgram = {
      ...program,
      programInfo: {
        ...(program.programInfo || {}),
        version: Math.max(1, Number(program.programInfo?.version) || 1) + 1,
        date: today
      }
    };

    const nextPrograms = programs.map((candidate) => (candidate.id === progId ? nextProgram : candidate));
    setPrograms(nextPrograms);

    try {
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(nextPrograms));
    } catch (error) {
      console.error('Failed to persist program updates during export', error);
    }

    try {
      const { exportProgramPdf } = await import('./src/exportProgramPdf');
      exportProgramPdf(nextProgram);
    } catch (error) {
      console.error('Failed to export program PDF', error);
      window.alert('Failed to export PDF. Please try again.');
    }
  };

  const handleCreateDerivedProgram = (derivedType, parentProgram) => {
    setCreateSeed({
      type: derivedType,
      parentProgramId: parentProgram.id,
      parentProgramName: parentProgram.name,
      faculty: parentProgram.faculty,
      lead: parentProgram.lead,
      discipline: parentProgram.discipline || '',
      description:
        derivedType === 'Specialization'
          ? `Specialization stream derived from ${parentProgram.name}.`
          : `Minor stream derived from ${parentProgram.name}.`
    });
    setActiveView('create');
  };

  const handleDuplicateSpecialization = (sourceProgram) => {
    const timestamp = Date.now();
    const sourceMapColumns = Math.min(
      MAX_MAP_COLUMNS,
      Math.max(DEFAULT_MAP_COLUMNS, Number(sourceProgram.mapColumns) || inferOccupiedMapColumns(sourceProgram.semesters || []))
    );
    const duplicatedProgram = {
      ...sourceProgram,
      id: `prog_${timestamp}`,
      name: `${sourceProgram.name} (Copy)`,
      status: 'Drafting',
      mapColumns: sourceMapColumns,
      milestones: sourceProgram.milestones.map((milestone, index) => ({
        ...milestone,
        id: `m_${timestamp}_${index + 1}`,
        completed: milestone.name === 'Initial Proposal',
        date: milestone.name === 'Initial Proposal' ? new Date().toISOString().split('T')[0] : null
      })),
      reviews: [],
      specializationBlocks: (sourceProgram.specializationBlocks || []).map((block, blockIndex) => ({
        ...block,
        id: `spec_block_${timestamp}_${blockIndex + 1}`,
        columnCount: Math.min(
          MAX_MAP_COLUMNS,
          Math.max(DEFAULT_MAP_COLUMNS, Number(block.columnCount) || DEFAULT_MAP_COLUMNS)
        ),
        courses: Array.from({
          length: Math.min(
            MAX_MAP_COLUMNS,
            Math.max(DEFAULT_MAP_COLUMNS, Number(block.columnCount) || DEFAULT_MAP_COLUMNS)
          )
        }).map(() => null)
      }))
    };

    setPrograms((currentPrograms) => [...currentPrograms, duplicatedProgram]);
    setSelectedProgramId(duplicatedProgram.id);
    setActiveView('detail');
  };

  const handleOpenProgram = (programId) => {
    setSelectedProgramId(programId);
    setActiveView('detail');
    setActiveTab('overview');
    setMobileMenuOpen(false);
  };

  const handleToggleFavorite = (programId) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === programId
          ? {
              ...program,
              isFavorite: !program.isFavorite
            }
          : program
      )
    );
  };

  const handleDeleteProgram = (programId) => {
    setPrograms((currentPrograms) => {
      const nameToId = new Map(currentPrograms.map((program) => [program.name, program.id]));
      const getParentId = (program) =>
        program.parentProgramId || (program.parentProgram ? nameToId.get(program.parentProgram) : null) || null;
      const childrenByParent = new Map();

      currentPrograms.forEach((program) => {
        const parentId = getParentId(program);
        if (!parentId) return;
        const children = childrenByParent.get(parentId) || [];
        children.push(program.id);
        childrenByParent.set(parentId, children);
      });

      const toDelete = new Set([programId]);
      const queue = [programId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = childrenByParent.get(currentId) || [];
        children.forEach((childId) => {
          if (!toDelete.has(childId)) {
            toDelete.add(childId);
            queue.push(childId);
          }
        });
      }

      if (
        !window.confirm(
          toDelete.size > 1
            ? `Delete this program and ${toDelete.size - 1} derived program(s)?`
            : 'Delete this program?'
        )
      ) {
        return currentPrograms;
      }

      if (selectedProgramId && toDelete.has(selectedProgramId)) {
        setSelectedProgramId(null);
        setActiveView('dashboard');
      }

      return currentPrograms.filter((program) => !toDelete.has(program.id));
    });
  };

  const addProgramMapColumn = (programId) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
        if (program.id !== programId) {
          return program;
        }

        const currentColumns = Math.min(
          MAX_MAP_COLUMNS,
          Math.max(DEFAULT_MAP_COLUMNS, Number(program.mapColumns) || inferOccupiedMapColumns(program.semesters || []))
        );
        const nextColumnCount = Math.min(MAX_MAP_COLUMNS, currentColumns + 1);
        if (nextColumnCount === currentColumns) {
          return program;
        }

        return {
          ...program,
          mapColumns: nextColumnCount,
          semesters: program.semesters.map((semester) => {
            const nextCourses = [...semester.courses];
            while (nextCourses.length < nextColumnCount) {
              nextCourses.push(null);
            }
            return { ...semester, courses: nextCourses };
          })
        };
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100/50 text-slate-900 font-sans">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-20 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="text-indigo-400" /> AcademicFlow
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 md:border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-400" /> AcademicFlow
          </h2>
        </div>

        <div className="px-4 pb-4">
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Menu</p>
          <nav className="space-y-1">
            <button
              onClick={() => navigateTo('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'dashboard' || activeView === 'detail' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={18} /> Programs Dashboard
            </button>
            <button
              onClick={() => navigateTo('courses')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'courses' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BookOpen size={18} /> Course Catalog
            </button>
            <button
              onClick={() => navigateTo('faculty')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'faculty' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={18} /> Faculty
            </button>
            <button
              onClick={() => navigateTo('planning')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'planning' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <CalendarDays size={18} /> Planning
            </button>
          </nav>
        </div>

        {(activeView === 'dashboard' || activeView === 'detail') && (
          <div className="px-4 pb-4">
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Favorites</p>
            {favoritePrograms.length === 0 ? (
              <div className="px-4 py-2 text-xs text-slate-500">
                No favorites yet.
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {favoritePrograms.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => handleOpenProgram(program.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedProgramId === program.id && activeView === 'detail'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={program.name}
                  >
                    <Star size={14} className={selectedProgramId === program.id && activeView === 'detail' ? 'text-amber-300' : 'text-amber-400'} fill="currentColor" />
                    <span className="min-w-0">
                      <span className="block truncate">{program.name}</span>
                      {getProgramShortName(program) && (
                        <span className={`block truncate text-[11px] ${selectedProgramId === program.id && activeView === 'detail' ? 'text-slate-200' : 'text-slate-400'}`}>
                          {getProgramShortName(program)}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto p-4">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={18} /> Settings
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="flex-1 w-full pt-20 md:pt-0 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {activeView === 'dashboard' && (
          <DashboardView
            programs={programs}
            onCreateProgram={() => {
              setCreateSeed(null);
              setActiveView('create');
            }}
            onOpenProgram={handleOpenProgram}
            onToggleFavorite={handleToggleFavorite}
            onDeleteProgram={handleDeleteProgram}
          />
        )}
        {activeView === 'create' && (
          <CreateProgramView
            handleCreateProgram={handleCreateProgram}
            onBackToDashboard={() => navigateTo('dashboard')}
            programs={programs}
            createSeed={createSeed}
          />
        )}
        {activeView === 'detail' && (
          <ProgramDetailView
            programs={programs}
            selectedProgram={selectedProgram}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setActiveView={setActiveView}
            setSelectedProgramId={setSelectedProgramId}
            removeCourse={removeCourse}
            setElectiveModalSlot={setElectiveModalSlot}
            electiveModalSlot={electiveModalSlot}
            placeholderCredits={placeholderCredits}
            setPlaceholderCredits={setPlaceholderCredits}
            setCourseSearchTerm={setCourseSearchTerm}
            courseSearchTerm={courseSearchTerm}
            globalCourses={globalCourses}
            insertCourse={insertCourse}
            handleCloseModal={handleCloseModal}
            moveCourse={moveCourse}
            onSaveMap={handleSaveCurriculumMap}
            onExportProgram={handleExportProgram}
            mapLastSavedAt={mapLastSavedAt}
            onCreateDerivedProgram={handleCreateDerivedProgram}
            onDuplicateSpecialization={handleDuplicateSpecialization}
            toggleCoreCourse={toggleCoreCourse}
            toggleNewCourse={toggleNewCourse}
            updateSpecializationBlocks={updateSpecializationBlocks}
            updateProgramName={updateProgramName}
            updateProgramInfo={updateProgramInfo}
            updateProgramColor={updateProgramColor}
            addProgramMapColumn={addProgramMapColumn}
            updateElectiveSuggestionMaps={updateElectiveSuggestionMaps}
            updateProgramPrerequisiteLinks={updateProgramPrerequisiteLinks}
            facultyDirectory={facultyDirectory}
            updateProgramAssignedFacultyMembers={updateProgramAssignedFacultyMembers}
            updateProgramAssignedFacultyCourses={updateProgramAssignedFacultyCourses}
            updateProgramAssignedFacultyBySlot={updateProgramAssignedFacultyBySlot}
            updateProgramCourseInstructorAssignments={updateProgramCourseInstructorAssignments}
          />
        )}
        {activeView === 'courses' && (
          <GlobalCoursesView
            programs={programs}
            globalCourses={globalCourses}
            handleAddGlobalCourse={handleAddGlobalCourse}
            updateGlobalCourse={updateGlobalCourse}
            courseCategories={courseCategories}
            addCourseCategory={addCourseCategory}
          />
        )}
        {activeView === 'faculty' && (
          <FacultyView
            facultyMembers={facultyDirectory}
            globalCourses={globalCourses}
            categoryOptions={courseCategories}
            addCategory={addCourseCategory}
            onAddFacultyMember={addFacultyMember}
            onUpdateFacultyMember={updateFacultyMember}
          />
        )}
        {activeView === 'planning' && (
          <PlanningView
            planningData={planningData}
            onUpdatePlanningData={setPlanningData}
            globalCourses={globalCourses}
            facultyDirectory={facultyDirectory}
            programs={programs}
          />
        )}
      </main>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Columns3,
  Eye,
  EyeOff,
  FileText,
  Info,
  Lock,
  Plus,
  Search,
  Trash2,
  Users,
  UserX,
  X
} from 'lucide-react';
import { PROGRAM_COLOR_PRESETS, PROGRAM_TYPES } from '../data';
import { DerivedProgramInfoTab } from './DerivedProgramInfoTab';
import { ProgramInfoTab } from './ProgramInfoTab';
import { Badge, Card, ColorSwatchPicker, ProgressBar } from '../ui';

const DEFAULT_MAP_COLUMNS = 5;
const MAX_MAP_COLUMNS = 6;
const DEFAULT_AUX_MAP_COLUMNS = 10;
const MAX_AUX_MAP_COLUMNS = 24;

export function ProgramDetailView(props) {
  const {
    programs,
    selectedProgram,
    activeTab,
    setActiveTab,
    setActiveView,
    setSelectedProgramId,
    removeCourse,
    setElectiveModalSlot,
    electiveModalSlot,
    placeholderCredits,
    setPlaceholderCredits: updatePlaceholderCredits,
    setCourseSearchTerm,
    courseSearchTerm,
    globalCourses,
    insertCourse,
    handleCloseModal,
    moveCourse,
    onSaveMap,
    onExportProgram,
    mapLastSavedAt,
    onCreateDerivedProgram,
    onDuplicateSpecialization,
    toggleCoreCourse,
    toggleNewCourse,
    updateSpecializationBlocks,
    updateProgramName,
    updateProgramInfo,
    updateProgramColor,
    addProgramMapColumn,
    updateElectiveSuggestionMaps,
    updateProgramPrerequisiteLinks,
    facultyDirectory,
    updateProgramAssignedFacultyMembers,
    updateProgramCourseInstructorAssignments
  } = props;
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clipboardCourse, setClipboardCourse] = useState(null);
  const [specializationSelectMode, setSpecializationSelectMode] = useState(false);
  const [selectedElectiveSlots, setSelectedElectiveSlots] = useState([]);
  const [modalDisciplineFilter, setModalDisciplineFilter] = useState('All');
  const [isSpecializationMapCollapsed, setIsSpecializationMapCollapsed] = useState(false);
  const [collapsedElectiveSuggestionGroups, setCollapsedElectiveSuggestionGroups] = useState({});
  const [isEditingProgramName, setIsEditingProgramName] = useState(false);
  const [editedProgramName, setEditedProgramName] = useState('');
  const [isEditingProgramShortName, setIsEditingProgramShortName] = useState(false);
  const [editedProgramShortName, setEditedProgramShortName] = useState('');
  const [showPrerequisiteLinks, setShowPrerequisiteLinks] = useState(false);
  const [prerequisiteDrawMode, setPrerequisiteDrawMode] = useState(false);
  const [prerequisiteSourceSlot, setPrerequisiteSourceSlot] = useState(null);
  const [prerequisiteCursorPoint, setPrerequisiteCursorPoint] = useState(null);
  const [showUnassignedCourses, setShowUnassignedCourses] = useState(false);
  const [quickAssignCourseModal, setQuickAssignCourseModal] = useState(null);
  const [specializationContextMenu, setSpecializationContextMenu] = useState(null);
  const [selectedAssignableFacultyId, setSelectedAssignableFacultyId] = useState('');
  const [facultyCourseModal, setFacultyCourseModal] = useState(null);
  const [facultyCourseSearchTerm, setFacultyCourseSearchTerm] = useState('');
  const [facultyCourseDisciplineFilter, setFacultyCourseDisciplineFilter] = useState('All');
  const [facultyCourseSelectedInstanceId, setFacultyCourseSelectedInstanceId] = useState('');
  const [showCourseCredits, setShowCourseCredits] = useState(true);
  const [showCoreCourses, setShowCoreCourses] = useState(true);
  const [showSpecElectives, setShowSpecElectives] = useState(true);
  const [visibleElectiveTypes, setVisibleElectiveTypes] = useState({});
  const [mapSlotCenters, setMapSlotCenters] = useState({});
  const [mapPanelHeight, setMapPanelHeight] = useState(null);
  const mapCanvasRef = useRef(null);
  const mapSlotRefs = useRef({});
  const showCiqePanel =
    selectedProgram?.ciqeTemplateApplied ||
    !!selectedProgram?.ciqeGuidelines ||
    selectedProgram?.type === 'Minor' ||
    selectedProgram?.type === 'Specialization';
  const ciqeMinCredits = selectedProgram?.ciqeGuidelines?.minCredits ?? null;
  const ciqeMaxCredits = selectedProgram?.ciqeGuidelines?.maxCredits ?? null;
  const ciqeTargetCourses = selectedProgram?.ciqeGuidelines?.recommendedCourses ?? null;
  const requiredSpecializationCourses = selectedProgram?.ciqeGuidelines?.requiredSpecializationCourses ?? null;
  const requiredCourseCodes = selectedProgram?.ciqeGuidelines?.requiredCourseCodes || [];
  const ciqeCurrentCredits = selectedProgram
    ? selectedProgram.semesters.reduce(
        (acc, sem) => acc + sem.courses.reduce((cAcc, c) => cAcc + (c && c.credits !== undefined ? Number(c.credits) : 0), 0),
        0
      )
    : 0;
  const ciqeCurrentCourses = selectedProgram
    ? selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.filter((c) => c).length, 0)
    : 0;
  const coreProgramCredits = selectedProgram
    ? selectedProgram.semesters.reduce(
        (acc, sem) =>
          acc + sem.courses.reduce((courseAcc, course) => courseAcc + (course?.isCore ? Number(course.credits || 0) : 0), 0),
        0
      )
    : 0;
  const ciqeMinCreditsMet = ciqeMinCredits !== null ? ciqeCurrentCredits >= ciqeMinCredits : null;
  const ciqeMaxCreditsMet = ciqeMaxCredits !== null ? ciqeCurrentCredits <= ciqeMaxCredits : null;
  const ciqeCoursesMet = ciqeTargetCourses !== null ? ciqeCurrentCourses >= ciqeTargetCourses : null;
  const parentBaselineSemesters = selectedProgram?.parentBaselineSemesters || null;
  const derivedCourseCount = parentBaselineSemesters
    ? selectedProgram.semesters.reduce((acc, semester, semIndex) => {
        const baselineSemester = parentBaselineSemesters[semIndex];
        const maxSlots = Math.max(semester.courses.length, baselineSemester?.courses?.length || 0);
        let changed = 0;
        for (let slot = 0; slot < maxSlots; slot += 1) {
          const currentCode = semester.courses[slot]?.code || null;
          const baselineCode = baselineSemester?.courses?.[slot]?.code || null;
          if (currentCode && currentCode !== baselineCode) {
            changed += 1;
          }
        }
        return acc + changed;
      }, 0)
    : null;
  const requiredSpecializationMet =
    requiredSpecializationCourses !== null && derivedCourseCount !== null
      ? derivedCourseCount >= requiredSpecializationCourses
      : null;
  const mapCodes = selectedProgram
    ? selectedProgram.semesters.flatMap((semester) => semester.courses.filter((c) => c).map((course) => course.code))
    : [];
  const missingRequiredCourseCodes = requiredCourseCodes.filter((code) => !mapCodes.includes(code));
  const requiredCodesMet = requiredCourseCodes.length > 0 ? missingRequiredCourseCodes.length === 0 : null;
  const minorExclusiveCredits = selectedProgram?.type === 'Minor' && parentBaselineSemesters
    ? (() => {
        const baselineCounts = {};
        parentBaselineSemesters.forEach((semester) => {
          semester.courses.forEach((course) => {
            if (!course?.code) return;
            baselineCounts[course.code] = (baselineCounts[course.code] || 0) + 1;
          });
        });

        let exclusiveCredits = 0;
        selectedProgram.semesters.forEach((semester) => {
          semester.courses.forEach((course) => {
            if (!course?.code) return;
            if ((baselineCounts[course.code] || 0) > 0) {
              baselineCounts[course.code] -= 1;
            } else {
              exclusiveCredits += Number(course.credits || 0);
            }
          });
        });
        return exclusiveCredits;
      })()
    : null;
  const minorExclusivePercent =
    minorExclusiveCredits !== null && ciqeCurrentCredits > 0
      ? Math.round((minorExclusiveCredits / ciqeCurrentCredits) * 100)
      : null;
  const minorExclusiveMet = minorExclusivePercent !== null ? minorExclusivePercent >= 50 : null;
  const sameDisciplineMajorMinorViolation =
    selectedProgram?.type === 'Minor' &&
    selectedProgram?.parentProgramType === 'Major' &&
    selectedProgram?.discipline &&
    selectedProgram?.parentProgramDiscipline &&
    selectedProgram.discipline.trim().toLowerCase() === selectedProgram.parentProgramDiscipline.trim().toLowerCase();
  const specializationBlocks = selectedProgram?.specializationBlocks || [];
  const electiveSuggestionMaps = selectedProgram?.electiveSuggestionMaps || {};
  const lockedCoreCourseCodes = selectedProgram?.lockedCoreCourseCodes || [];
  const prerequisiteLinks = selectedProgram?.prerequisiteLinks || [];
  const specializationElectiveCount = selectedProgram
    ? selectedProgram.semesters.reduce(
        (acc, semester) =>
          acc + semester.courses.filter((course) => course?.code === 'SPEC' || course?.isSpecializationPlaceholder).length,
        0
      )
    : 0;
  const specializationElectiveCredits = selectedProgram
    ? selectedProgram.semesters.reduce(
        (acc, semester) =>
          acc +
          semester.courses.reduce((courseAcc, course) => {
            if (!course || !(course.code === 'SPEC' || course.isSpecializationPlaceholder)) {
              return courseAcc;
            }
            return courseAcc + Number(course.credits || 0);
          }, 0),
        0
      )
    : 0;
  const specializationCountByRules = specializationBlocks.reduce((acc, block) => {
    const filledCount = (block.courses || []).filter((course) => course).length;
    if ((block.rowType || 'choose') === 'required') {
      return acc + filledCount;
    }
    return acc + Math.min(Number(block.chooseCount || 0), filledCount);
  }, 0);
  const specializationTotalCourseTarget = selectedProgram
    ? selectedProgram.semesters.reduce(
        (acc, semester) =>
          acc + semester.courses.filter((course) => course?.code === 'SPEC' || course?.isSpecializationPlaceholder).length,
        0
      )
    : 0;
  const specializationCourseProgress = specializationCountByRules;
  const specializationOverLimit =
    specializationTotalCourseTarget > 0 && specializationCourseProgress > specializationTotalCourseTarget;
  const specializationCourseProgressPercent =
    specializationTotalCourseTarget > 0
      ? Math.min(100, Math.round((specializationCourseProgress / specializationTotalCourseTarget) * 100))
      : 0;
  const ciqeDisplayCurrentCredits =
    selectedProgram?.type === 'Specialization' ? specializationElectiveCredits : ciqeCurrentCredits;
  const ciqeDisplayCurrentCourses =
    selectedProgram?.type === 'Specialization' ? specializationCourseProgress : ciqeCurrentCourses;
  const ciqeDisplayMinCreditsMet = ciqeMinCredits !== null ? ciqeDisplayCurrentCredits >= ciqeMinCredits : null;
  const ciqeDisplayMaxCreditsMet = ciqeMaxCredits !== null ? ciqeDisplayCurrentCredits <= ciqeMaxCredits : null;
  const ciqeDisplayCoursesMet = ciqeTargetCourses !== null ? ciqeDisplayCurrentCourses >= ciqeTargetCourses : null;
  const isSpecElectiveCourse = (course) => !!course && (course.code === 'SPEC' || course.isSpecializationPlaceholder);

  const isLockedCoreCourse = (course) =>
    !!course && selectedProgram?.type === 'Specialization' && (course.isCore || lockedCoreCourseCodes.includes(course.code));

  const getElectiveCategory = (course) => {
    if (!course) {
      return null;
    }

    if (course.discipline) {
      return `${course.discipline} Elective`;
    }

    if (course.code === 'BUSI-ELEC') return 'BUSI Elective';
    if (course.code === 'GAME-ELEC') return 'GAME Elective';
    if (course.code === 'OPEN') return 'Open Elective';
    if (course.code === 'ELEC') return 'General Elective';
    if (course.title && /elective/i.test(course.title)) return course.title;

    return null;
  };

  const getElectiveAreaTone = (label) => {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('spec')) {
      return {
        container: 'border-indigo-200 bg-indigo-50/40',
        row: 'border-indigo-100 bg-indigo-50/50'
      };
    }
    if (normalized.includes('game')) {
      return {
        container: 'border-amber-200 bg-amber-50/40',
        row: 'border-amber-100 bg-amber-50/50'
      };
    }
    if (normalized.includes('busi')) {
      return {
        container: 'border-cyan-200 bg-cyan-50/40',
        row: 'border-cyan-100 bg-cyan-50/50'
      };
    }
    if (normalized.includes('open')) {
      return {
        container: 'border-emerald-200 bg-emerald-50/40',
        row: 'border-emerald-100 bg-emerald-50/50'
      };
    }
    if (normalized.includes('general')) {
      return {
        container: 'border-violet-200 bg-violet-50/40',
        row: 'border-violet-100 bg-violet-50/50'
      };
    }
    return {
      container: 'border-slate-200 bg-slate-50/40',
      row: 'border-slate-200 bg-slate-50/50'
    };
  };

  const electiveCreditBreakdown = selectedProgram
    ? selectedProgram.semesters.reduce((acc, semester) => {
        semester.courses.forEach((course) => {
          const category = getElectiveCategory(course);
          if (!category) return;
          acc[category] = (acc[category] || 0) + Number(course.credits || 0);
        });
        return acc;
      }, {})
    : {};
  const electiveTypesInMap = Object.keys(electiveCreditBreakdown).sort((a, b) => a.localeCompare(b));
  const electiveTypeVisibilitySignature = electiveTypesInMap.join('|');
  const assignedFacultyMemberIds = Array.isArray(selectedProgram?.assignedFacultyMemberIds)
    ? selectedProgram.assignedFacultyMemberIds
    : [];
  const courseInstructorAssignments = Array.isArray(selectedProgram?.courseInstructorAssignments)
    ? selectedProgram.courseInstructorAssignments
        .map((assignment) => ({
          id: String(assignment?.id || '').trim(),
          courseInstanceId: String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim(),
          facultyId: String(assignment?.facultyId || '').trim()
        }))
        .filter((assignment) => assignment.courseInstanceId && assignment.facultyId)
    : [];
  const normalizedElectiveCategoryTokens = electiveTypesInMap.map((value) => value.toLowerCase().replace(/\s+elective$/i, '').trim());
  const programCourseEntries = useMemo(() => {
    if (!selectedProgram) return [];
    const entries = [];
    selectedProgram.semesters.forEach((semester, semIndex) => {
      (semester.courses || []).forEach((course, index) => {
        if (!course) return;
        const slotKey = toSlotKey(semester.id, index);
        const courseInstanceId = String(course.courseGlobalId || course.courseInstanceId || slotKey).trim();
        entries.push({
          slotKey,
          semesterId: semester.id,
          semesterName: String(semester.name || '').trim(),
          semesterOrder: semIndex,
          index,
          course,
          courseInstanceId,
          sourceType: 'map'
        });
      });
    });

    (specializationBlocks || []).forEach((block, blockIndex) => {
      (block.courses || []).forEach((course, index) => {
        if (!course) return;
        const slotKey = `spec:${block.id}:${index}`;
        const courseInstanceId = String(course.courseGlobalId || course.courseInstanceId || slotKey).trim();
        entries.push({
          slotKey,
          semesterId: null,
          semesterName: `Specialization • ${block.name || `Row ${blockIndex + 1}`}`,
          semesterOrder: 1000 + blockIndex,
          index,
          course,
          courseInstanceId,
          sourceType: 'specialization'
        });
      });
    });

    Object.entries(electiveSuggestionMaps || {})
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .forEach(([electiveType, rows], electiveTypeIndex) => {
        (rows || []).forEach((row, rowIndex) => {
          (row.courses || []).forEach((course, index) => {
            if (!course) return;
            const slotKey = `elec:${electiveType}:${row.id}:${index}`;
            const courseInstanceId = String(course.courseGlobalId || course.courseInstanceId || slotKey).trim();
            entries.push({
              slotKey,
              semesterId: null,
              semesterName: `${electiveType} • ${row.name || `Row ${rowIndex + 1}`}`,
              semesterOrder: 2000 + electiveTypeIndex * 100 + rowIndex,
              index,
              course,
              courseInstanceId,
              sourceType: 'elective'
            });
          });
        });
      });

    return entries;
  }, [selectedProgram, specializationBlocks, electiveSuggestionMaps]);
  const programCourseCodeSet = useMemo(
    () => new Set(programCourseEntries.map((entry) => String(entry.course?.code || '').trim()).filter(Boolean)),
    [programCourseEntries]
  );
  const programCourseEntryBySlotKey = useMemo(
    () => new Map(programCourseEntries.map((entry) => [entry.slotKey, entry])),
    [programCourseEntries]
  );
  const programCourseEntryByInstanceId = useMemo(
    () => new Map(programCourseEntries.map((entry) => [entry.courseInstanceId, entry])),
    [programCourseEntries]
  );
  const courseInstructorAssignmentByCourseInstanceId = useMemo(() => {
    const byCourseInstanceId = new Map();
    courseInstructorAssignments.forEach((assignment) => {
      if (!programCourseEntryByInstanceId.has(assignment.courseInstanceId)) return;
      byCourseInstanceId.set(assignment.courseInstanceId, assignment);
    });
    return byCourseInstanceId;
  }, [courseInstructorAssignments, programCourseEntryByInstanceId]);
  const assignedCourseEntriesByFaculty = useMemo(() => {
    const byFaculty = {};
    courseInstructorAssignmentByCourseInstanceId.forEach((assignment, courseInstanceId) => {
      const facultyId = String(assignment.facultyId || '').trim();
      if (!facultyId || facultyId === '__sessional__') return;
      const courseEntry = programCourseEntryByInstanceId.get(courseInstanceId);
      if (!courseEntry) return;
      if (!byFaculty[facultyId]) {
        byFaculty[facultyId] = [];
      }
      byFaculty[facultyId].push(courseEntry);
    });
    return byFaculty;
  }, [courseInstructorAssignmentByCourseInstanceId, programCourseEntryByInstanceId]);
  const courseCatalogByCode = useMemo(
    () =>
      new Map(
        (globalCourses || []).map((course) => [String(course.code || '').trim(), course])
      ),
    [globalCourses]
  );
  const appointmentTypeToShort = (appointmentType) => {
    const normalized = String(appointmentType || '').toLowerCase();
    if (!normalized) return 'Faculty';
    if (normalized.includes('sessional')) return 'Sessional';
    if (normalized.includes('ltfm')) return 'LTFM';
    if (normalized.includes('ttt')) return 'TTT';
    if (normalized.includes('tf')) return 'TF';
    return String(appointmentType || '').trim() || 'Faculty';
  };
  const facultyDirectoryById = useMemo(
    () =>
      new Map(
        (facultyDirectory || []).map((member) => [String(member.id || '').trim(), member])
      ),
    [facultyDirectory]
  );
  const getInstructorBadgeLabelForAssignee = (assigneeId) => {
    const normalizedAssigneeId = String(assigneeId || '').trim();
    if (!normalizedAssigneeId) return null;
    if (normalizedAssigneeId === '__sessional__') return 'Sessional';
    const faculty = facultyDirectoryById.get(normalizedAssigneeId);
    if (!faculty) return 'Faculty';
    const trimmed = String(faculty.name || '').trim();
    if (!trimmed) return 'Faculty';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : trimmed;
  };
  const getQuickAssignWorkloadTone = (faculty) => {
    if (!faculty || faculty.atCapacity || faculty.utilizationPercent >= 100) {
      return 'border-red-300 bg-red-100 text-red-900';
    }
    if (faculty.utilizationPercent >= 75) {
      return 'border-rose-300 bg-rose-100 text-rose-900';
    }
    if (faculty.utilizationPercent >= 50) {
      return 'border-amber-300 bg-amber-100 text-amber-900';
    }
    return 'border-emerald-300 bg-emerald-100 text-emerald-900';
  };
  const catalogFacultyRows = useMemo(() => {
    return (facultyDirectory || []).map((member) => {
      const historyCourses = (member.teachingHistory || [])
        .map((entry) => ({
          code: String(entry.courseCode || '').trim(),
          title: String(entry.courseTitle || '').trim()
        }))
        .filter((entry) => entry.code);
      const typicalCourses = (member.typicalCourses || [])
        .map((course) => ({ code: String(course.code || '').trim(), title: String(course.title || '').trim() }))
        .filter((course) => course.code);
      const currentCourses = (member.currentCourses || [])
        .map((course) => ({ code: String(course.code || '').trim(), title: String(course.title || '').trim() }))
        .filter((course) => course.code);
      const allCourses = [...historyCourses, ...typicalCourses, ...currentCourses];
      const seen = new Set();
      const matchedCourses = [];
      allCourses.forEach((course) => {
        const key = `${course.code.toLowerCase()}|${course.title.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (programCourseCodeSet.has(course.code)) {
          matchedCourses.push(course);
        }
      });
      const assignedEntries = Array.isArray(assignedCourseEntriesByFaculty[member.id])
        ? assignedCourseEntriesByFaculty[member.id]
        : [];
      const assignedCoursesInProgram = assignedEntries
        .map((entry) => {
          const code = String(entry.course?.code || '').trim();
          const catalogCourse = courseCatalogByCode.get(code);
          return {
            id: `${entry.courseInstanceId}`,
            code,
            title: String(entry.course?.title || catalogCourse?.title || '').trim(),
            semesterOrder: Number(entry.semesterOrder) || 0,
            semesterName: entry.semesterName || 'Term',
            slotNumber: Number(entry.index) + 1,
            sourceType: entry.sourceType || 'map',
            locationLabel: entry.semesterName || 'Term',
            fromManualAssignment: true
          };
        })
        .sort((a, b) => {
          if (a.semesterOrder !== b.semesterOrder) {
            return a.semesterOrder - b.semesterOrder;
          }
          if (a.slotNumber !== b.slotNumber) {
            return a.slotNumber - b.slotNumber;
          }
          return a.code.localeCompare(b.code);
        });

      const interests = Array.isArray(member.teachingInterests) ? member.teachingInterests : [];
      const matchedElectiveInterests = interests.filter((interest) => {
        const normalizedInterest = String(interest || '').toLowerCase().trim();
        return normalizedElectiveCategoryTokens.some((token) => normalizedInterest.includes(token));
      });

      return {
        ...member,
        matchedCourses,
        assignedCoursesInProgram,
        matchedElectiveInterests,
        isAssigned: assignedFacultyMemberIds.includes(member.id)
      };
    });
  }, [
    facultyDirectory,
    programCourseCodeSet,
    normalizedElectiveCategoryTokens,
    assignedFacultyMemberIds,
    courseCatalogByCode,
    assignedCourseEntriesByFaculty
  ]);
  const legacyProgramFaculty = useMemo(() => {
    const catalogNameSet = new Set((facultyDirectory || []).map((member) => String(member.name || '').trim().toLowerCase()));
    return (selectedProgram?.facultyMembers || []).filter((member) => {
      const key = String(member?.name || '').trim().toLowerCase();
      return key && !catalogNameSet.has(key);
    });
  }, [selectedProgram?.facultyMembers, facultyDirectory]);
  const facultyRowsForProgram = useMemo(() => {
    const rows = catalogFacultyRows.filter(
      (member) => member.isAssigned || member.matchedCourses.length > 0 || member.matchedElectiveInterests.length > 0
    );
    const catalogIds = new Set(rows.map((member) => member.id));
    assignedFacultyMemberIds.forEach((facultyId) => {
      if (catalogIds.has(facultyId)) return;
      const found = catalogFacultyRows.find((member) => member.id === facultyId);
      if (found) {
        rows.push(found);
      }
    });
    const legacyRows = legacyProgramFaculty.map((member) => ({
      id: `legacy_${member.id || member.name}`,
      name: member.name,
      role: member.role || 'Program Faculty',
      appointmentType: member.role || 'Program Faculty',
      matchedCourses: [],
      assignedCoursesInProgram: [],
      matchedElectiveInterests: [],
      isAssigned: true,
      isLegacy: true
    }));
    return [...rows, ...legacyRows];
  }, [catalogFacultyRows, assignedFacultyMemberIds, legacyProgramFaculty]);
  const assignedFacultyForQuickAssign = useMemo(() => {
    const seen = new Set();
    return facultyRowsForProgram
      .filter((row) => !row.isLegacy)
      .map((row) => facultyDirectoryById.get(String(row.id || '').trim()))
      .filter((member) => {
        if (!member) return false;
        const id = String(member.id || '').trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [facultyRowsForProgram, facultyDirectoryById]);
  const globalAssignedCourseIdsByFaculty = useMemo(() => {
    const byFaculty = new Map();
    (programs || []).forEach((program) => {
      (Array.isArray(program?.courseInstructorAssignments) ? program.courseInstructorAssignments : []).forEach((assignment) => {
        const facultyId = String(assignment?.facultyId || '').trim();
        if (!facultyId || facultyId === '__sessional__') return;
        const courseGlobalId = String(assignment?.courseGlobalId || assignment?.courseInstanceId || '').trim();
        if (!courseGlobalId) return;
        if (!byFaculty.has(facultyId)) {
          byFaculty.set(facultyId, new Set());
        }
        byFaculty.get(facultyId).add(courseGlobalId);
      });
    });
    return byFaculty;
  }, [programs]);
  const quickAssignFacultyRows = useMemo(() => {
    return assignedFacultyForQuickAssign.map((faculty) => {
      const load = Math.max(0, Number(faculty?.teachingLoad || 0));
      const overloads = Math.max(0, Number(faculty?.overloads || 0));
      const releases = Math.max(0, Number(faculty?.courseReleases || 0));
      const capacity = Math.max(0, load + overloads - releases);
      const assignedGlobalCourses = globalAssignedCourseIdsByFaculty.get(String(faculty?.id || '').trim())?.size || 0;
      const remainingCapacity = Math.max(0, capacity - assignedGlobalCourses);
      const atCapacity = remainingCapacity <= 0;
      const utilizationPercent = capacity > 0 ? Math.min(100, Math.round((assignedGlobalCourses / capacity) * 100)) : 100;
      return {
        ...faculty,
        capacity,
        assignedGlobalCourses,
        remainingCapacity,
        atCapacity,
        utilizationPercent
      };
    });
  }, [assignedFacultyForQuickAssign, globalAssignedCourseIdsByFaculty]);
  const availableFacultyForAssignment = useMemo(
    () => catalogFacultyRows.filter((member) => !assignedFacultyMemberIds.includes(member.id)),
    [catalogFacultyRows, assignedFacultyMemberIds]
  );
  const curriculumOverviewGroups = useMemo(() => {
    if (!selectedProgram) return [];
    const allCourses = selectedProgram.semesters.flatMap((semester) => semester.courses.filter((course) => !!course));
    const specCourses = allCourses.filter((course) => isSpecElectiveCourse(course));
    const coreCourses = allCourses.filter((course) => !isSpecElectiveCourse(course) && !getElectiveCategory(course));
    const electiveGroupsMap = {};
    allCourses.forEach((course) => {
      if (isSpecElectiveCourse(course)) return;
      const category = getElectiveCategory(course);
      if (!category) return;
      if (!electiveGroupsMap[category]) {
        electiveGroupsMap[category] = [];
      }
      electiveGroupsMap[category].push(course);
    });
    const specSubgroups = specializationBlocks.map((block, blockIndex) => {
      const isRequiredRow = (block.rowType || 'choose') === 'required';
      const chooseCount = Math.max(1, Number(block.chooseCount) || 1);
      return {
        id: block.id || `spec_subgroup_${blockIndex}`,
        label: isRequiredRow ? 'Required' : `Choose ${chooseCount} courses from the following`,
        courses: (block.courses || []).filter((course) => !!course)
      };
    });

    const groups = [{ label: 'CORE', courses: coreCourses }];
    Object.keys(electiveGroupsMap)
      .sort((a, b) => a.localeCompare(b))
      .forEach((label) => groups.push({ label, courses: electiveGroupsMap[label] }));
    if (specCourses.length > 0 || specSubgroups.length > 0) {
      groups.push({ label: 'SPEC Electives', courses: specCourses, subgroups: specSubgroups });
    }
    return groups;
  }, [selectedProgram, specializationBlocks]);
  const modalDisciplineOptions = useMemo(() => {
    const unique = new Set(
      (globalCourses || [])
        .map((course) => course.discipline || 'Uncategorized')
        .filter(Boolean)
    );
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [globalCourses]);
  const facultyAssignableProgramCourses = useMemo(
    () =>
      programCourseEntries
        .map((entry) => ({
          ...entry,
          code: String(entry.course?.code || '').trim(),
          title: String(entry.course?.title || '').trim(),
          discipline: String(entry.course?.discipline || 'Uncategorized').trim()
        }))
        .filter((entry) => entry.code)
        .sort((a, b) => {
          if (a.semesterOrder !== b.semesterOrder) {
            return a.semesterOrder - b.semesterOrder;
          }
          if (a.index !== b.index) {
            return a.index - b.index;
          }
          return a.code.localeCompare(b.code);
        }),
    [programCourseEntries]
  );
  const facultyCourseDisciplineOptions = useMemo(() => {
    const unique = new Set(
      facultyAssignableProgramCourses
        .map((entry) => String(entry.discipline || 'Uncategorized').trim())
        .filter(Boolean)
    );
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [facultyAssignableProgramCourses]);
  const filteredFacultyCourseCatalog = useMemo(() => {
    const query = String(facultyCourseSearchTerm || '').trim().toLowerCase();
    return facultyAssignableProgramCourses
      .filter((entry) => {
        const discipline = String(entry.discipline || 'Uncategorized').trim();
        const disciplineMatches =
          facultyCourseDisciplineFilter === 'All' || discipline === facultyCourseDisciplineFilter;
        const searchMatches =
          query.length === 0 ||
          entry.code.toLowerCase().includes(query) ||
          entry.title.toLowerCase().includes(query) ||
          String(entry.semesterName || '').toLowerCase().includes(query) ||
          discipline.toLowerCase().includes(query);
        return disciplineMatches && searchMatches;
      })
      .sort((a, b) => {
        if (a.semesterOrder !== b.semesterOrder) {
          return a.semesterOrder - b.semesterOrder;
        }
        if (a.index !== b.index) {
          return a.index - b.index;
        }
        return a.code.localeCompare(b.code);
      });
  }, [facultyAssignableProgramCourses, facultyCourseSearchTerm, facultyCourseDisciplineFilter]);
  const selectedElectiveSlotSet = useMemo(() => new Set(selectedElectiveSlots), [selectedElectiveSlots]);
  const selectedProgramColor = selectedProgram?.color || (selectedProgram?.parentProgramId || selectedProgram?.parentProgram ? '#ede9fe' : '#dbeafe');
  const isBaseProgram = !selectedProgram?.parentProgramId && !selectedProgram?.parentProgram;
  const programById = useMemo(() => new Map((programs || []).map((program) => [program.id, program])), [programs]);
  const programNameToId = useMemo(() => new Map((programs || []).map((program) => [program.name, program.id])), [programs]);

  const getProgramParentId = (program) =>
    program?.parentProgramId || (program?.parentProgram ? programNameToId.get(program.parentProgram) : null) || null;

  const baseDerivedPrograms = useMemo(() => {
    if (!isBaseProgram || !selectedProgram || !programs?.length) {
      return [];
    }
    const childrenByParent = new Map();
    programs.forEach((program) => {
      const parentId = getProgramParentId(program);
      if (!parentId) return;
      const children = childrenByParent.get(parentId) || [];
      children.push(program);
      childrenByParent.set(parentId, children);
    });

    const derived = [];
    const queue = [...(childrenByParent.get(selectedProgram.id) || [])];
    while (queue.length > 0) {
      const current = queue.shift();
      derived.push(current);
      const nested = childrenByParent.get(current.id) || [];
      nested.forEach((child) => queue.push(child));
    }
    return derived.sort((a, b) => a.name.localeCompare(b.name));
  }, [isBaseProgram, selectedProgram, programs]);

  const connectedParentProgram = useMemo(() => {
    if (isBaseProgram || !selectedProgram) {
      return null;
    }
    const parentId = getProgramParentId(selectedProgram);
    if (!parentId) return null;
    return programById.get(parentId) || null;
  }, [isBaseProgram, selectedProgram, programById, programNameToId]);

  const openProgramOverview = (programId) => {
    if (!programId) return;
    setSelectedProgramId(programId);
    setActiveTab('overview');
  };
  const getProgramShortName = (program) => {
    if (!program) return '';
    const raw = program?.programInfo?.programShortName || program?.programInfo?.shortFormName || '';
    return String(raw).trim();
  };
  const getProgramDisplayColor = (program) =>
    program?.color || (program?.parentProgramId || program?.parentProgram ? '#ede9fe' : '#dbeafe');
  const selectedProgramShortName = getProgramShortName(selectedProgram);
  const getOccupiedColumns = (courses = []) => {
    let occupied = 0;
    courses.forEach((course, index) => {
      if (course) {
        occupied = Math.max(occupied, index + 1);
      }
    });
    return occupied;
  };
  const mapColumnCount = useMemo(() => {
    const inferred = selectedProgram?.semesters?.reduce(
      (max, semester) => Math.max(max, getOccupiedColumns(semester.courses || [])),
      0
    ) || 0;
    const explicit = Number(selectedProgram?.mapColumns) || 0;
    return Math.min(MAX_MAP_COLUMNS, Math.max(DEFAULT_MAP_COLUMNS, inferred, explicit));
  }, [selectedProgram]);
  const specializationColumnCount = useMemo(() => {
    const occupied = specializationBlocks.reduce(
      (max, block) => Math.max(max, getOccupiedColumns(block.courses || [])),
      0
    );
    const explicit = specializationBlocks.reduce(
      (max, block) => Math.max(max, Number(block.columnCount) || 0),
      0
    );
    return Math.min(MAX_AUX_MAP_COLUMNS, Math.max(DEFAULT_AUX_MAP_COLUMNS, occupied + 1, explicit));
  }, [specializationBlocks]);

  const buildArrowHeadPath = (tip, tail, size = 14, spread = 12) => {
    const dx = tip.x - tail.x;
    const dy = tip.y - tail.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const baseX = tip.x - ux * size;
    const baseY = tip.y - uy * size;
    const px = -uy;
    const py = ux;
    const leftX = baseX + px * (spread / 2);
    const leftY = baseY + py * (spread / 2);
    const rightX = baseX - px * (spread / 2);
    const rightY = baseY - py * (spread / 2);
    return `M ${tip.x} ${tip.y} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;
  };

  const buildPrerequisiteCurve = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const distance = Math.hypot(dx, dy);
    const axisTolerance = 10;
    const adjacentDistance = 190;
    const shouldUseStraightLine =
      (absDx <= axisTolerance || absDy <= axisTolerance) && distance <= adjacentDistance;

    if (shouldUseStraightLine) {
      const tip = { x: to.x, y: to.y };
      const tail = {
        x: from.x + dx * 0.9,
        y: from.y + dy * 0.9
      };
      return {
        path: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
        arrowPath: buildArrowHeadPath(tip, tail)
      };
    }

    const direction = to.x >= from.x ? 1 : -1;
    const bend = Math.max(24, Math.abs(to.x - from.x) * 0.35);
    const p0 = { x: from.x, y: from.y };
    const p1 = { x: from.x + bend * direction, y: from.y };
    const p2 = { x: to.x - bend * direction, y: to.y };
    const p3 = { x: to.x, y: to.y };
    const path = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

    const cubicPoint = (t) => {
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;
      const x =
        mt2 * mt * p0.x +
        3 * mt2 * t * p1.x +
        3 * mt * t2 * p2.x +
        t2 * t * p3.x;
      const y =
        mt2 * mt * p0.y +
        3 * mt2 * t * p1.y +
        3 * mt * t2 * p2.y +
        t2 * t * p3.y;
      return { x, y };
    };

    const tip = cubicPoint(1);
    const tail = cubicPoint(0.92);
    return {
      path,
      arrowPath: buildArrowHeadPath(tip, tail)
    };
  };

  const prerequisitePaths = useMemo(() => {
    return prerequisiteLinks
      .map((link) => {
        const from = mapSlotCenters[toSlotKey(link.fromSemesterId, Number(link.fromIndex))];
        const to = mapSlotCenters[toSlotKey(link.toSemesterId, Number(link.toIndex))];
        if (!from || !to) {
          return null;
        }

        const { path, arrowPath } = buildPrerequisiteCurve(from, to);
        return {
          id: link.id,
          path,
          arrowPath
        };
      })
      .filter(Boolean);
  }, [prerequisiteLinks, mapSlotCenters]);

  const draftPrerequisitePath = useMemo(() => {
    if (!prerequisiteSourceSlot || !prerequisiteCursorPoint) return null;
    const from = mapSlotCenters[toSlotKey(prerequisiteSourceSlot.semesterId, Number(prerequisiteSourceSlot.index))];
    if (!from) return null;
    return buildPrerequisiteCurve(from, prerequisiteCursorPoint);
  }, [prerequisiteSourceSlot, prerequisiteCursorPoint, mapSlotCenters]);

  const prerequisiteLinkDetails = useMemo(() => {
    if (!selectedProgram) return [];
    return prerequisiteLinks
      .map((link) => {
        const fromSemester = selectedProgram.semesters.find((semester) => semester.id === link.fromSemesterId);
        const toSemester = selectedProgram.semesters.find((semester) => semester.id === link.toSemesterId);
        const fromCourse = fromSemester?.courses?.[Number(link.fromIndex)] || null;
        const toCourse = toSemester?.courses?.[Number(link.toIndex)] || null;
        if (!fromCourse || !toCourse) return null;
        return {
          id: link.id,
          fromLabel: `${fromCourse.code} (${fromSemester?.name || 'Term'} • ${Number(link.fromIndex) + 1})`,
          toLabel: `${toCourse.code} (${toSemester?.name || 'Term'} • ${Number(link.toIndex) + 1})`
        };
      })
      .filter(Boolean);
  }, [selectedProgram, prerequisiteLinks]);

  const getElectiveSuggestionColumnCount = (electiveType) => {
    const rows = electiveSuggestionMaps[electiveType] || [];
    const occupied = rows.reduce((max, row) => Math.max(max, getOccupiedColumns(row.courses || [])), 0);
    const explicit = rows.reduce((max, row) => Math.max(max, Number(row.columnCount) || 0), 0);
    return Math.min(MAX_AUX_MAP_COLUMNS, Math.max(DEFAULT_AUX_MAP_COLUMNS, occupied + 1, explicit));
  };

  const setDragPayload = (event, payload) => {
    const serialized = JSON.stringify(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', serialized);
    event.dataTransfer.setData('text/plain', serialized);
  };

  const getDragPayload = (event) => {
    const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  };

  function toSlotKey(semesterId, index) {
    return `${semesterId}:${index}`;
  }

  const normalizeProgramPrerequisiteLinks = (links = []) => {
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

  const setProgramPrerequisiteLinks = (nextLinks) => {
    const normalized = normalizeProgramPrerequisiteLinks(nextLinks);
    updateProgramPrerequisiteLinks(selectedProgram.id, normalized);
  };

  const togglePrerequisiteLink = (fromSlot, toSlot) => {
    if (!fromSlot || !toSlot) return;
    if (fromSlot.semesterId === toSlot.semesterId && fromSlot.index === toSlot.index) return;

    const match = prerequisiteLinks.find(
      (link) =>
        link.fromSemesterId === fromSlot.semesterId &&
        Number(link.fromIndex) === Number(fromSlot.index) &&
        link.toSemesterId === toSlot.semesterId &&
        Number(link.toIndex) === Number(toSlot.index)
    );
    if (match) {
      setProgramPrerequisiteLinks(prerequisiteLinks.filter((link) => link.id !== match.id));
      return;
    }

    setProgramPrerequisiteLinks([
      ...prerequisiteLinks,
      {
        id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fromSemesterId: fromSlot.semesterId,
        fromIndex: Number(fromSlot.index),
        toSemesterId: toSlot.semesterId,
        toIndex: Number(toSlot.index)
      }
    ]);
  };

  const removePrerequisiteLink = (linkId) => {
    setProgramPrerequisiteLinks(prerequisiteLinks.filter((link) => link.id !== linkId));
  };

  const clearAllPrerequisiteLinks = () => {
    setProgramPrerequisiteLinks([]);
    setPrerequisiteSourceSlot(null);
  };

  const isElectiveCourse = (course) => !!getElectiveCategory(course);
  const isSelectableForSpecialization = (course) =>
    !!course && !isLockedCoreCourse(course);

  const getCourseAtSlot = (slot) => {
    if (!slot || !selectedProgram) {
      return null;
    }

    const semester = selectedProgram.semesters.find((s) => s.id === slot.semesterId);
    return semester?.courses?.[slot.index] || null;
  };

  const getIncomingPrerequisiteCount = (semesterId, index) =>
    prerequisiteLinks.filter(
      (link) => link.toSemesterId === semesterId && Number(link.toIndex) === Number(index)
    ).length;

  const copySelectedCourse = () => {
    const course = getCourseAtSlot(selectedSlot);
    if (!course) {
      return;
    }

    setClipboardCourse({ ...course });
  };

  const pasteToSelectedSlot = () => {
    if (!clipboardCourse || !selectedSlot) {
      return;
    }
    const existingCourse = getCourseAtSlot(selectedSlot);
    if (isLockedCoreCourse(existingCourse)) {
      return;
    }

    insertCourse(selectedProgram.id, selectedSlot.semesterId, selectedSlot.index, { ...clipboardCourse });
  };

  const updateBlockCourses = (blockId, updater) => {
    const next = specializationBlocks.map((block) => {
      if (block.id !== blockId) return block;
      const currentCourses = [...(block.courses || [])];
      return {
        ...block,
        courses: updater(currentCourses)
      };
    });
    updateSpecializationBlocks(selectedProgram.id, next);
  };

  const insertCourseInSpecializationBlock = (blockId, index, course) => {
    updateBlockCourses(blockId, (courses) => {
      const nextCourses = [...courses];
      nextCourses[index] = course;
      return nextCourses;
    });
  };

  const removeCourseFromSpecializationBlock = (blockId, index) => {
    updateBlockCourses(blockId, (courses) => {
      const nextCourses = [...courses];
      nextCourses[index] = null;
      return nextCourses;
    });
  };

  const moveCourseAcrossSpecializationBlocks = (sourceBlockId, sourceIndex, targetBlockId, targetIndex) => {
    const next = specializationBlocks.map((block) => ({
      ...block,
      courses: [...(block.courses || [])]
    }));
    const sourceBlock = next.find((block) => block.id === sourceBlockId);
    const targetBlock = next.find((block) => block.id === targetBlockId);
    if (!sourceBlock || !targetBlock) return;

    const sourceCourse = sourceBlock.courses[sourceIndex];
    const targetCourse = targetBlock.courses[targetIndex];
    sourceBlock.courses[sourceIndex] = targetCourse;
    targetBlock.courses[targetIndex] = sourceCourse;

    updateSpecializationBlocks(selectedProgram.id, next);
  };

  const addSelectedToSpecializationBlock = () => {
    if (selectedElectiveSlots.length === 0) {
      return;
    }

    const selectedCourses = selectedElectiveSlots
      .map((slotKey) => {
        const [semesterId, indexStr] = slotKey.split(':');
        const index = Number(indexStr);
        const semester = selectedProgram.semesters.find((s) => s.id === semesterId);
        const course = semester?.courses?.[index];
        if (!course) return null;
        return {
          code: course.code,
          title: course.title,
          credits: course.credits,
          color: course.color,
          discipline: course.discipline,
          isCore: false,
          semesterId,
          index
        };
      })
      .filter(Boolean);

    if (selectedCourses.length === 0) {
      return;
    }

    const newBlock = {
      id: `spec_block_${Date.now()}`,
      name: `Specialization Row ${specializationBlocks.length + 1}`,
      rowType: 'choose',
      chooseCount: Math.max(1, Math.min(2, selectedCourses.length)),
      columnCount: specializationColumnCount,
      courses: Array.from({ length: specializationColumnCount }).map((_, i) => selectedCourses[i] || null)
    };

    selectedElectiveSlots.forEach((slotKey) => {
      const [semesterId, indexStr] = slotKey.split(':');
      const index = Number(indexStr);
      const originalCourse = selectedProgram.semesters.find((s) => s.id === semesterId)?.courses?.[index];
      if (!originalCourse) return;
      insertCourse(selectedProgram.id, semesterId, index, {
        code: 'SPEC',
        title: 'Specialization',
        credits: originalCourse.credits !== undefined ? Number(originalCourse.credits) : 3,
        color: 'bg-indigo-100',
        isSpecializationPlaceholder: true
      });
    });

    updateSpecializationBlocks(selectedProgram.id, [...specializationBlocks, newBlock]);
    setSelectedElectiveSlots([]);
    setSpecializationSelectMode(false);
  };

  const updateBlockChooseCount = (blockId, value) => {
    const next = specializationBlocks.map((block) =>
      block.id === blockId ? { ...block, chooseCount: Math.max(1, Number(value) || 1) } : block
    );
    updateSpecializationBlocks(selectedProgram.id, next);
  };

  const updateBlockRowType = (blockId, rowType) => {
    const next = specializationBlocks.map((block) => {
      if (block.id !== blockId) return block;
      return { ...block, rowType };
    });
    updateSpecializationBlocks(selectedProgram.id, next);
  };

  const removeSpecializationBlock = (blockId) => {
    updateSpecializationBlocks(
      selectedProgram.id,
      specializationBlocks.filter((block) => block.id !== blockId)
    );
  };

  const withUpdatedElectiveRows = (electiveType, updater) => {
    const currentRows = electiveSuggestionMaps[electiveType] || [];
    const nextRows = updater([...currentRows]);
    updateElectiveSuggestionMaps(selectedProgram.id, {
      ...electiveSuggestionMaps,
      [electiveType]: nextRows
    });
  };

  const addEmptyElectiveSuggestionRow = (electiveType) => {
    const columnCount = getElectiveSuggestionColumnCount(electiveType);
    withUpdatedElectiveRows(electiveType, (rows) => [
      ...rows,
      {
        id: `elec_row_${Date.now()}`,
        name: `${electiveType} Row ${rows.length + 1}`,
        rowType: 'required',
        chooseCount: 1,
        columnCount,
        courses: Array.from({ length: columnCount }).map(() => null)
      }
    ]);
  };

  const updateElectiveSuggestionRowType = (electiveType, rowId, rowType) => {
    withUpdatedElectiveRows(electiveType, (rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, rowType } : row))
    );
  };

  const updateElectiveSuggestionChooseCount = (electiveType, rowId, value) => {
    withUpdatedElectiveRows(electiveType, (rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, chooseCount: Math.max(1, Number(value) || 1) } : row
      )
    );
  };

  const removeElectiveSuggestionRow = (electiveType, rowId) => {
    withUpdatedElectiveRows(electiveType, (rows) => rows.filter((row) => row.id !== rowId));
  };

  const insertCourseInElectiveSuggestionRow = (electiveType, rowId, index, course) => {
    withUpdatedElectiveRows(electiveType, (rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const nextCourses = [...(row.courses || [])];
        nextCourses[index] = course;
        return { ...row, courses: nextCourses };
      })
    );
  };

  const removeCourseFromElectiveSuggestionRow = (electiveType, rowId, index) => {
    withUpdatedElectiveRows(electiveType, (rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const nextCourses = [...(row.courses || [])];
        nextCourses[index] = null;
        return { ...row, courses: nextCourses };
      })
    );
  };

  const moveCourseAcrossElectiveSuggestionRows = (
    electiveType,
    sourceRowId,
    sourceIndex,
    targetRowId,
    targetIndex
  ) => {
    const rows = electiveSuggestionMaps[electiveType] || [];
    const nextRows = rows.map((row) => ({ ...row, courses: [...(row.courses || [])] }));
    const sourceRow = nextRows.find((row) => row.id === sourceRowId);
    const targetRow = nextRows.find((row) => row.id === targetRowId);
    if (!sourceRow || !targetRow) return;

    const sourceCourse = sourceRow.courses[sourceIndex];
    const targetCourse = targetRow.courses[targetIndex];
    sourceRow.courses[sourceIndex] = targetCourse;
    targetRow.courses[targetIndex] = sourceCourse;

    updateElectiveSuggestionMaps(selectedProgram.id, {
      ...electiveSuggestionMaps,
      [electiveType]: nextRows
    });
  };

  const addEmptySpecializationRow = () => {
    const newRow = {
      id: `spec_block_${Date.now()}`,
      name: `Specialization Row ${specializationBlocks.length + 1}`,
      rowType: 'required',
      chooseCount: 1,
      columnCount: specializationColumnCount,
      courses: Array.from({ length: specializationColumnCount }).map(() => null)
    };
    updateSpecializationBlocks(selectedProgram.id, [...specializationBlocks, newRow]);
  };

  const applyCourseFromModal = (course) => {
    if (!electiveModalSlot) return;
    if (electiveModalSlot.mode === 'specialization-block') {
      insertCourseInSpecializationBlock(electiveModalSlot.blockId, electiveModalSlot.index, course);
    } else if (electiveModalSlot.mode === 'elective-suggestion-row') {
      insertCourseInElectiveSuggestionRow(
        electiveModalSlot.electiveType,
        electiveModalSlot.rowId,
        electiveModalSlot.index,
        course
      );
    } else {
      insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, course);
    }
    handleCloseModal();
  };

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedProgram?.id, activeTab]);

  useEffect(() => {
    if (activeTab !== 'map') {
      setPrerequisiteDrawMode(false);
      setPrerequisiteSourceSlot(null);
      setPrerequisiteCursorPoint(null);
    }
  }, [activeTab]);

  useEffect(() => {
    setPrerequisiteSourceSlot(null);
    setPrerequisiteCursorPoint(null);
  }, [selectedProgram?.id]);

  useEffect(() => {
    if (!electiveModalSlot) {
      setModalDisciplineFilter('All');
    }
  }, [electiveModalSlot]);

  useEffect(() => {
    setIsEditingProgramName(false);
    setEditedProgramName(selectedProgram?.name || '');
  }, [selectedProgram?.id, selectedProgram?.name]);

  useEffect(() => {
    setIsEditingProgramShortName(false);
    setEditedProgramShortName(getProgramShortName(selectedProgram));
  }, [selectedProgram?.id, selectedProgram?.programInfo]);

  useEffect(() => {
    setSelectedAssignableFacultyId('');
    setShowUnassignedCourses(false);
    setQuickAssignCourseModal(null);
    setSpecializationContextMenu(null);
    setIsSpecializationMapCollapsed(false);
    setCollapsedElectiveSuggestionGroups({});
    setFacultyCourseModal(null);
    setFacultyCourseSearchTerm('');
    setFacultyCourseDisciplineFilter('All');
    setFacultyCourseSelectedInstanceId('');
  }, [selectedProgram?.id]);

  useEffect(() => {
    setVisibleElectiveTypes((current) => {
      const next = {};
      electiveTypesInMap.forEach((type) => {
        next[type] = Object.prototype.hasOwnProperty.call(current, type) ? !!current[type] : true;
      });
      const currentKeys = Object.keys(current);
      if (
        currentKeys.length === electiveTypesInMap.length &&
        currentKeys.every((key) => Object.prototype.hasOwnProperty.call(next, key) && next[key] === current[key])
      ) {
        return current;
      }
      return next;
    });
  }, [selectedProgram?.id, electiveTypeVisibilitySignature]);

  useEffect(() => {
    if (!specializationContextMenu?.canConvertSpec) {
      return;
    }
    if (
      selectedProgram?.type !== 'Specialization' ||
      !specializationSelectMode ||
      selectedElectiveSlots.length === 0
    ) {
      setSpecializationContextMenu(null);
    }
  }, [selectedProgram?.type, specializationSelectMode, selectedElectiveSlots.length, specializationContextMenu]);

  useEffect(() => {
    if (activeTab !== 'map') return undefined;
    const container = mapCanvasRef.current;
    if (!container) return undefined;

    const recalculateCenters = () => {
      const bounds = container.getBoundingClientRect();
      const nextCenters = {};
      Object.entries(mapSlotRefs.current).forEach(([slotKey, node]) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        nextCenters[slotKey] = {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2
        };
      });
      setMapSlotCenters(nextCenters);
    };

    recalculateCenters();
    const onResize = () => recalculateCenters();
    window.addEventListener('resize', onResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => recalculateCenters());
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeTab, selectedProgram?.id, mapColumnCount, prerequisiteLinks, selectedProgram?.semesters]);

  useEffect(() => {
    if (activeTab !== 'map') return undefined;
    const content = mapCanvasRef.current;
    if (!content) return undefined;

    const updateHeight = () => {
      const nextHeight = Math.ceil(content.getBoundingClientRect().height);
      setMapPanelHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    updateHeight();
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateHeight());
      resizeObserver.observe(content);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeTab, selectedProgram?.id, mapColumnCount, specializationBlocks, electiveSuggestionMaps]);

  const saveProgramShortName = () => {
    const normalized = editedProgramShortName.trim();
    updateProgramInfo(selectedProgram.id, {
      ...(selectedProgram.programInfo || {}),
      programShortName: normalized
    });
    setIsEditingProgramShortName(false);
  };

  const assignFacultyToProgram = () => {
    if (!selectedProgram || !selectedAssignableFacultyId) return;
    const nextAssignedIds = Array.from(
      new Set([...(assignedFacultyMemberIds || []), selectedAssignableFacultyId])
    );
    updateProgramAssignedFacultyMembers(selectedProgram.id, nextAssignedIds);
    setSelectedAssignableFacultyId('');
  };

  const unassignFacultyFromProgram = (facultyId) => {
    if (!selectedProgram) return;
    const nextAssignedIds = (assignedFacultyMemberIds || []).filter((id) => id !== facultyId);
    updateProgramAssignedFacultyMembers(selectedProgram.id, nextAssignedIds);
  };

  const closeQuickAssignCourseModal = () => {
    setQuickAssignCourseModal(null);
  };

  const updateInstructorAssignmentForCourseInstance = (courseInstanceId, assigneeId) => {
    if (!selectedProgram || typeof updateProgramCourseInstructorAssignments !== 'function') return;
    const normalizedCourseInstanceId = String(courseInstanceId || '').trim();
    const normalizedAssigneeId = String(assigneeId || '').trim();
    if (!normalizedCourseInstanceId) return;
    updateProgramCourseInstructorAssignments(selectedProgram.id, {
      courseGlobalId: normalizedCourseInstanceId,
      courseInstanceId: normalizedCourseInstanceId,
      facultyId: normalizedAssigneeId
    });
  };

  const assignInstructorToCourseSlot = (slotKey, assigneeId) => {
    if (!selectedProgram) return;
    const normalizedSlotKey = String(slotKey || '').trim();
    const normalizedAssigneeId = String(assigneeId || '').trim();
    if (!normalizedSlotKey || !normalizedAssigneeId) return;

    const courseEntry = programCourseEntryBySlotKey.get(normalizedSlotKey);
    if (!courseEntry?.courseInstanceId) return;
    updateInstructorAssignmentForCourseInstance(courseEntry.courseInstanceId, normalizedAssigneeId);
    closeQuickAssignCourseModal();
  };

  const removeInstructorFromCourseSlot = (slotKey) => {
    if (!selectedProgram) return;
    const normalizedSlotKey = String(slotKey || '').trim();
    if (!normalizedSlotKey) return;
    const courseEntry = programCourseEntryBySlotKey.get(normalizedSlotKey);
    if (!courseEntry?.courseInstanceId) return;
    updateInstructorAssignmentForCourseInstance(courseEntry.courseInstanceId, '');
    closeQuickAssignCourseModal();
  };

  const openFacultyCourseModal = (faculty) => {
    if (!faculty || faculty.isLegacy) return;
    setFacultyCourseModal({
      facultyId: faculty.id,
      facultyName: faculty.name
    });
    setFacultyCourseSearchTerm('');
    setFacultyCourseDisciplineFilter('All');
    setFacultyCourseSelectedInstanceId('');
  };

  const closeFacultyCourseModal = () => {
    setFacultyCourseModal(null);
    setFacultyCourseSearchTerm('');
    setFacultyCourseDisciplineFilter('All');
    setFacultyCourseSelectedInstanceId('');
  };

  const assignCourseToFacultyInProgram = () => {
    if (!selectedProgram || !facultyCourseModal?.facultyId || !facultyCourseSelectedInstanceId) return;
    const facultyId = facultyCourseModal.facultyId;
    updateInstructorAssignmentForCourseInstance(facultyCourseSelectedInstanceId, facultyId);
    closeFacultyCourseModal();
  };

  const removeCourseAssignmentFromFaculty = (facultyId, courseAssignmentId) => {
    if (!selectedProgram) return;
    const normalizedFacultyId = String(facultyId || '').trim();
    const normalizedCourseAssignmentId = String(courseAssignmentId || '').trim();
    if (!normalizedFacultyId || !normalizedCourseAssignmentId) return;
    updateInstructorAssignmentForCourseInstance(normalizedCourseAssignmentId, '');
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (activeTab !== 'map') {
        return;
      }

      const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c';
      const isPaste = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v';
      if (!isCopy && !isPaste) {
        return;
      }

      const targetTag = event.target?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
        return;
      }

      event.preventDefault();
      if (isCopy) {
        copySelectedCourse();
      }
      if (isPaste) {
        pasteToSelectedSlot();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, selectedSlot, clipboardCourse, selectedProgram, insertCourse]);

  if (!selectedProgram) return null;

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <button 
              onClick={() => { setActiveView('dashboard'); setSelectedProgramId(null); }}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-3 font-medium transition-colors"
            >
              <ArrowLeft size={16} /> Back to Programs
            </button>
            {selectedProgram.type === 'Specialization' ? (
              <div className="mb-1">
                {isEditingProgramName ? (
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      value={editedProgramName}
                      onChange={(e) => setEditedProgramName(e.target.value)}
                      className="w-full sm:w-[28rem] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateProgramName(selectedProgram.id, editedProgramName);
                          setIsEditingProgramName(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedProgramName(selectedProgram.name);
                          setIsEditingProgramName(false);
                        }}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-slate-900">{selectedProgram.name}</h1>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedProgramName(selectedProgram.name);
                          setIsEditingProgramName(true);
                        }}
                        className="px-2.5 py-1 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit Name
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{selectedProgram.name}</h1>
              </div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Program Short Name</span>
              {isEditingProgramShortName ? (
                <>
                  <input
                    value={editedProgramShortName}
                    onChange={(e) => setEditedProgramShortName(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-sm w-44"
                    placeholder="e.g. GAME-SPEC"
                  />
                  <button
                    type="button"
                    onClick={saveProgramShortName}
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedProgramShortName(selectedProgramShortName);
                      setIsEditingProgramShortName(false);
                    }}
                    className="px-2 py-1 border border-slate-300 text-slate-700 rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedProgramShortName || 'Not set'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedProgramShortName(selectedProgramShortName);
                      setIsEditingProgramShortName(true);
                    }}
                    className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <p className="text-slate-500 font-medium">{selectedProgram.type} • {selectedProgram.faculty} • Lead: {selectedProgram.lead}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onCreateDerivedProgram('Specialization', selectedProgram)}
              className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Add Specialization
            </button>
            <button
              type="button"
              onClick={() => onCreateDerivedProgram('Minor', selectedProgram)}
              className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Add Minor
            </button>
            {selectedProgram.type === 'Specialization' && (
              <button
                type="button"
                onClick={() => onDuplicateSpecialization(selectedProgram)}
                className="px-3 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 text-sm font-medium transition-colors"
              >
                Duplicate Specialization
              </button>
            )}
            <Badge type={selectedProgram.status === 'Drafting' ? 'draft' : selectedProgram.status === 'In Review' ? 'warning' : 'success'}>
              {selectedProgram.status}
            </Badge>
            <button
              type="button"
              onClick={() => onExportProgram(selectedProgram.id)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors shadow-sm"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', icon: FileText, label: 'Overview & Milestones' },
            { id: 'programInfo', icon: FileText, label: 'Program Info' },
            { id: 'map', icon: BookOpen, label: 'Curriculum Map' },
            { id: 'curriculumOverview', icon: BookOpen, label: 'Curriculum Overview' },
            { id: 'reviews', icon: AlertCircle, label: 'Feedback & Reviews' },
            { id: 'faculty', icon: Users, label: 'Assigned Faculty' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Program Description</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedProgram.description}</p>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Approval Milestones</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {selectedProgram.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${milestone.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {milestone.completed ? <Check size={16} strokeWidth={3} /> : <Clock size={16} />}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{milestone.name}</span>
                              {milestone.date ? (
                                <span className="text-xs font-medium text-slate-500 mt-1">{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-400 mt-1">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Total Semesters</span>
                      <span className="font-bold text-slate-900">{selectedProgram.semesters.length}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Defined Courses</span>
                      <span className="font-bold text-slate-900">{selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.filter(c => c).length, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Faculty Involved</span>
                      <span className="font-bold text-slate-900">{facultyRowsForProgram.length}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Program Color</h3>
                  <ColorSwatchPicker
                    label="Selected Color"
                    value={selectedProgramColor}
                    colors={PROGRAM_COLOR_PRESETS}
                    onChange={(color) => updateProgramColor(selectedProgram.id, color)}
                  />
                </Card>
                {isBaseProgram ? (
                  <Card className="p-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Derived Programs</h3>
                    {baseDerivedPrograms.length === 0 ? (
                      <p className="text-xs text-slate-500">No derived programs yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {baseDerivedPrograms.map((program) => (
                          <button
                            key={program.id}
                            type="button"
                            onClick={() => openProgramOverview(program.id)}
                            className="w-full text-left px-3 py-2 rounded border border-slate-200 hover:brightness-[0.98]"
                            style={{ backgroundColor: getProgramDisplayColor(program) }}
                          >
                            <div className="text-sm font-semibold text-slate-900 truncate">{program.name}</div>
                            {getProgramShortName(program) && (
                              <div className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                                {getProgramShortName(program)}
                              </div>
                            )}
                            <div className="text-xs text-slate-500">{program.type}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="p-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Connected Parent Program</h3>
                    {connectedParentProgram ? (
                      <button
                        type="button"
                        onClick={() => openProgramOverview(connectedParentProgram.id)}
                        className="w-full text-left px-3 py-2 rounded border border-slate-200 hover:brightness-[0.98]"
                        style={{ backgroundColor: getProgramDisplayColor(connectedParentProgram) }}
                      >
                        <div className="text-sm font-semibold text-slate-900 truncate">{connectedParentProgram.name}</div>
                        {getProgramShortName(connectedParentProgram) && (
                          <div className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                            {getProgramShortName(connectedParentProgram)}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">{connectedParentProgram.type}</div>
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">No connected parent found.</p>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'programInfo' &&
            (isBaseProgram ? (
              <ProgramInfoTab
                selectedProgram={selectedProgram}
                updateProgramInfo={updateProgramInfo}
                onExportProgram={onExportProgram}
              />
            ) : (
              <DerivedProgramInfoTab
                selectedProgram={selectedProgram}
                parentProgram={connectedParentProgram}
                updateProgramInfo={updateProgramInfo}
                onExportProgram={onExportProgram}
              />
            ))}

          {activeTab === 'curriculumOverview' && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Curriculum Overview</h3>
              <div className="space-y-3">
                {curriculumOverviewGroups.map((group, index) => (
                  <React.Fragment key={group.label}>
                    <div className="border border-slate-200 rounded-lg bg-white">
                      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-700">{group.label}</div>
                        <div className="text-[11px] text-slate-500">{group.courses.length} courses</div>
                      </div>
                      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                        {group.subgroups?.length ? (
                          <div className="space-y-2">
                            {group.subgroups.map((subgroup) => (
                              <div key={subgroup.id} className="border border-slate-200 rounded bg-slate-50/40">
                                <div className="px-2 py-1 border-b border-slate-200 flex items-center justify-between">
                                  <div className="text-[11px] font-semibold text-slate-700">{subgroup.label}</div>
                                  <div className="text-[11px] text-slate-500">{subgroup.courses.length} courses</div>
                                </div>
                                <div className="p-2">
                                  {subgroup.courses.length === 0 ? (
                                    <div className="text-xs text-slate-500">No courses in this sub-group.</div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {subgroup.courses.map((course, courseIndex) => (
                                        <div
                                          key={`${group.label}_${subgroup.id}_${course.code}_${courseIndex}`}
                                          className={`${course.color || 'bg-slate-100'} px-2 py-1.5 rounded border border-slate-300`}
                                        >
                                          <div className="text-xs font-bold text-slate-900">{course.code}</div>
                                          <div className="text-[11px] text-slate-800 leading-snug">{course.title}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : group.courses.length === 0 ? (
                          <div className="text-xs text-slate-500 p-2">No courses in this group.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {group.courses.map((course, courseIndex) => (
                              <div
                                key={`${group.label}_${course.code}_${courseIndex}`}
                                className={`${course.color || 'bg-slate-100'} px-2 py-1.5 rounded border border-slate-300`}
                              >
                                <div className="text-xs font-bold text-slate-900">{course.code}</div>
                                <div className="text-[11px] text-slate-800 leading-snug">{course.title}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < curriculumOverviewGroups.length - 1 && (
                      <div className="flex flex-col items-center -my-1">
                        <div className="h-5 w-0.5 bg-slate-300" />
                        <div className="w-9 h-9 rounded-full border-2 border-slate-300 bg-white text-slate-600 flex items-center justify-center text-xl font-bold">
                          +
                        </div>
                        <div className="h-5 w-0.5 bg-slate-300" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'map' && (() => {
            const typeDef = PROGRAM_TYPES.find(pt => pt.name === selectedProgram.type) || PROGRAM_TYPES[1]; 
            const targetCredits = ciqeMinCredits ?? typeDef.minCredits;
            
            const currentCredits = ciqeCurrentCredits;
            
            const targetCourses = Math.ceil(targetCredits / 3);
            const currentCourses = ciqeCurrentCourses;
            
            const creditProgress = targetCredits > 0 ? Math.min(100, Math.round((currentCredits / targetCredits) * 100)) : 0;
            const courseProgress = targetCourses > 0 ? Math.min(100, Math.round((currentCourses / targetCourses) * 100)) : 0;

            return (
              <div className="space-y-6 relative">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 text-center mb-3">Overview</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                        <span>Total Credits</span>
                        <span className={currentCredits >= targetCredits ? 'text-emerald-600' : ''}>
                          {currentCredits} / {targetCredits}
                        </span>
                      </div>
                      <ProgressBar
                        percentage={creditProgress}
                        height="h-2"
                        color={currentCredits >= targetCredits ? 'bg-emerald-500' : 'bg-indigo-500'}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                        <span>Total Courses</span>
                        <span className={currentCourses >= targetCourses ? 'text-emerald-600' : ''}>
                          {currentCourses} / {targetCourses}
                        </span>
                      </div>
                      <ProgressBar
                        percentage={courseProgress}
                        height="h-2"
                        color={currentCourses >= targetCourses ? 'bg-emerald-500' : 'bg-indigo-500'}
                      />
                    </div>
                  </div>
                </div>
                <Card className="p-3 -mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Toolbar</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Course Info</span>
                      <label
                        className={`inline-flex items-center gap-1.5 text-xs ${showCourseCredits ? 'text-slate-700' : 'text-slate-400'}`}
                      >
                        <input
                          type="checkbox"
                          checked={showCourseCredits}
                          onChange={(event) => setShowCourseCredits(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Credits
                      </label>
                      <label
                        className={`inline-flex items-center gap-1.5 text-xs ${showCoreCourses ? 'text-slate-700' : 'text-slate-400'}`}
                      >
                        <input
                          type="checkbox"
                          checked={showCoreCourses}
                          onChange={(event) => setShowCoreCourses(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        CORE
                      </label>
                      <label
                        className={`inline-flex items-center gap-1.5 text-xs ${showSpecElectives ? 'text-slate-700' : 'text-slate-400'}`}
                      >
                        <input
                          type="checkbox"
                          checked={showSpecElectives}
                          onChange={(event) => setShowSpecElectives(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        SPEC Electives
                      </label>
                      {electiveTypesInMap.map((electiveType) => (
                        <label
                          key={`course_info_filter_${electiveType}`}
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            visibleElectiveTypes[electiveType] !== false ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={visibleElectiveTypes[electiveType] !== false}
                            onChange={(event) =>
                              setVisibleElectiveTypes((current) => ({
                                ...current,
                                [electiveType]: event.target.checked
                              }))
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {electiveType}
                        </label>
                      ))}
                      <label
                        className={`inline-flex items-center gap-1.5 text-xs ${
                          !showCourseCredits &&
                          !showCoreCourses &&
                          !showSpecElectives &&
                          electiveTypesInMap.every((electiveType) => visibleElectiveTypes[electiveType] === false)
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            !showCourseCredits &&
                            !showCoreCourses &&
                            !showSpecElectives &&
                            electiveTypesInMap.every((electiveType) => visibleElectiveTypes[electiveType] === false)
                          }
                          onChange={(event) => {
                            const checked = event.target.checked;
                            if (checked) {
                              setShowCourseCredits(false);
                              setShowCoreCourses(false);
                              setShowSpecElectives(false);
                              setVisibleElectiveTypes((current) => {
                                const next = { ...current };
                                electiveTypesInMap.forEach((electiveType) => {
                                  next[electiveType] = false;
                                });
                                return next;
                              });
                              return;
                            }
                            setShowCourseCredits(true);
                            setShowCoreCourses(true);
                            setShowSpecElectives(true);
                            setVisibleElectiveTypes((current) => {
                              const next = { ...current };
                              electiveTypesInMap.forEach((electiveType) => {
                                next[electiveType] = true;
                              });
                              return next;
                            });
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Deselect all
                      </label>
                    </div>
                    {selectedProgram.type === 'Specialization' && (
                      <>
                        <button
                          type="button"
                          title="Select eligible electives in the map for specialization conversion"
                          onClick={() => {
                            setSpecializationSelectMode((current) => !current);
                            setSelectedElectiveSlots([]);
                          }}
                          className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            specializationSelectMode
                              ? 'border-amber-400 bg-amber-50 text-amber-800'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Check size={14} className="inline mr-1.5" />
                          Select Electives
                        </button>
                      </>
                    )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Pre-Reqs</span>
                        <button
                          type="button"
                          title="View prerequisite arrows and enable linking mode"
                          onClick={() => {
                            const nextMode = !(showPrerequisiteLinks || prerequisiteDrawMode);
                            setShowPrerequisiteLinks(nextMode);
                            setPrerequisiteDrawMode(nextMode);
                            setPrerequisiteSourceSlot(null);
                            if (!nextMode) {
                              setPrerequisiteCursorPoint(null);
                            } else {
                              setSpecializationSelectMode(false);
                              setSelectedElectiveSlots([]);
                            }
                          }}
                          className={`px-2.5 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            showPrerequisiteLinks || prerequisiteDrawMode
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {showPrerequisiteLinks || prerequisiteDrawMode ? (
                            <Eye size={14} className="inline mr-1" />
                          ) : (
                            <EyeOff size={14} className="inline mr-1" />
                          )}
                          View
                        </button>
                        <button
                          type="button"
                          title="Remove all prerequisite links from this program map"
                          onClick={clearAllPrerequisiteLinks}
                          disabled={prerequisiteLinks.length === 0}
                          className="px-2.5 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} className="inline mr-1" />
                          Clear
                        </button>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Instructors</span>
                        <button
                          type="button"
                          title="Show instructor assignments, highlight unassigned courses, and click any course to manage instructor"
                          onClick={() => setShowUnassignedCourses((current) => !current)}
                          className={`px-2.5 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                            showUnassignedCourses
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <UserX size={14} className="inline mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
                {(prerequisiteDrawMode || showPrerequisiteLinks) && (
                  <p className="text-xs text-slate-500 -mt-2">
                    {prerequisiteDrawMode
                      ? prerequisiteSourceSlot
                        ? 'Select the target course to create/remove an arrow from the selected prerequisite.'
                        : 'Select a prerequisite course, then select the course that requires it. You can also click an existing line to delete it.'
                      : 'Use "Pre-Reqs > View" to create prerequisite arrows. Click a line or use the list in the sidebar to delete links.'}
                  </p>
                )}
                
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-stretch">
                  <div className="xl:col-span-3">
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          title="Add an additional curriculum-map column (up to 6)"
                          onClick={() => addProgramMapColumn(selectedProgram.id)}
                          disabled={mapColumnCount >= MAX_MAP_COLUMNS}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Columns3 size={14} className="inline mr-1.5" />
                          + Column
                        </button>
                      </div>
                      <div
                        ref={mapCanvasRef}
                        className="relative"
                      onMouseMove={(event) => {
                        if (!prerequisiteDrawMode || !prerequisiteSourceSlot || !mapCanvasRef.current) return;
                        const bounds = mapCanvasRef.current.getBoundingClientRect();
                        setPrerequisiteCursorPoint({
                          x: event.clientX - bounds.left,
                          y: event.clientY - bounds.top
                        });
                      }}
                      onMouseLeave={() => {
                        if (prerequisiteDrawMode) {
                          setPrerequisiteCursorPoint(null);
                        }
                      }}
                    >
                        {(showPrerequisiteLinks || prerequisiteDrawMode) && (
                        <svg
                          className="absolute inset-0 w-full h-full z-20"
                          style={{ pointerEvents: prerequisiteDrawMode ? 'none' : showPrerequisiteLinks ? 'auto' : 'none' }}
                        >
                          {showPrerequisiteLinks &&
                            prerequisitePaths.map((linkPath) => (
                              <g key={linkPath.id}>
                                <path
                                  d={linkPath.path}
                                  fill="none"
                                  stroke="#4f46e5"
                                  strokeWidth="2.2"
                                  strokeDasharray="4 3"
                                  style={{ pointerEvents: prerequisiteDrawMode ? 'none' : 'stroke', cursor: 'pointer' }}
                                  onClick={() => {
                                    if (prerequisiteDrawMode) return;
                                    removePrerequisiteLink(linkPath.id);
                                  }}
                                />
                                <path d={linkPath.arrowPath} fill="#4f46e5" style={{ pointerEvents: 'none' }} />
                              </g>
                            ))}
                          {prerequisiteDrawMode && draftPrerequisitePath && (
                            <g>
                              <path
                                d={draftPrerequisitePath.path}
                                fill="none"
                                stroke="#0f172a"
                                strokeWidth="2"
                                strokeDasharray="5 4"
                                style={{ pointerEvents: 'none' }}
                              />
                              <path d={draftPrerequisitePath.arrowPath} fill="#0f172a" style={{ pointerEvents: 'none' }} />
                            </g>
                          )}
                        </svg>
                      )}
                      <div className="flex flex-col border border-slate-200 bg-slate-200 gap-[1px] rounded-xl overflow-hidden shadow-sm relative z-10">
                  {selectedProgram.semesters.map((sem, semIndex) => {
                    const semName = String(sem.name || '');
                    const semLower = semName.toLowerCase();
                    const isFall = semLower.includes('fall');
                    const isWinter = semLower.includes('winter');
                    const yearMatch = semName.match(/year\s+(\d+)/i);
                    const yearLabel = yearMatch ? `Year ${yearMatch[1]}` : null;
                    const seasonLabel = isFall ? 'Fall' : isWinter ? 'Winter' : null;
                    const showYearSeparator = isWinter && semIndex < selectedProgram.semesters.length - 1;

                    return (
                      <React.Fragment key={sem.id}>
                        <div
                          className={`flex flex-col md:flex-row bg-white ${
                            isWinter ? 'border-b-2 border-slate-300' : ''
                          }`}
                        >
                      <div
                        className={`w-full md:w-40 flex-shrink-0 p-4 flex items-center border-b md:border-b-0 md:border-r border-slate-200 ${
                          isFall ? 'bg-amber-50' : isWinter ? 'bg-sky-50' : 'bg-slate-50'
                        }`}
                      >
                        <div>
                          {yearLabel && (
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{yearLabel}</div>
                          )}
                          <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{sem.name}</span>
                          {seasonLabel && (
                            <div className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded border ${
                              isFall
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-sky-100 text-sky-700 border-sky-200'
                            }`}>
                              {seasonLabel} Term
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="flex-1 p-2 grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${mapColumnCount}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: mapColumnCount }).map((_, i) => {
                          const course = sem.courses[i];
                          const slotKey = `${sem.id}:${i}`;
                          const courseInstanceId = String(course?.courseGlobalId || course?.courseInstanceId || '').trim();
                          const assignedInstructorIdForSlot = courseInstanceId
                            ? String(
                                courseInstructorAssignmentByCourseInstanceId.get(courseInstanceId)?.facultyId || ''
                              ).trim()
                            : '';
                          const isElectiveSelected = selectedElectiveSlotSet.has(slotKey);
                          const assignedInstructorBadge = assignedInstructorIdForSlot
                            ? getInstructorBadgeLabelForAssignee(assignedInstructorIdForSlot)
                            : null;
                          const hasAssignedInstructor = !!assignedInstructorBadge;
                          const isPrerequisiteViewMode = showPrerequisiteLinks || prerequisiteDrawMode;
                          const electiveTypeForCourse = getElectiveCategory(course);
                          const dimmedByElectiveToggle =
                            !!electiveTypeForCourse && visibleElectiveTypes[electiveTypeForCourse] === false;
                          const dimmedByCoreToggle = !!course?.isCore && !showCoreCourses;
                          const dimmedBySpecToggle = isSpecElectiveCourse(course) && !showSpecElectives;
                          const dimmedByCourseInfoToggle = dimmedByElectiveToggle || dimmedByCoreToggle || dimmedBySpecToggle;
                          const canMarkNewCourse =
                            !!course && !isBaseProgram && !isLockedCoreCourse(course) && !isSpecElectiveCourse(course);
                          const assignmentHighlightClass =
                            showUnassignedCourses && course
                              ? hasAssignedInstructor
                                ? 'opacity-45 saturate-75'
                                : 'ring-2 ring-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]'
                              : '';
                          return (
                            <div 
                              key={`${sem.id}_${i}`}
                              ref={(node) => {
                                const key = toSlotKey(sem.id, i);
                                if (node) {
                                  mapSlotRefs.current[key] = node;
                                } else {
                                  delete mapSlotRefs.current[key];
                                }
                              }}
                              onClick={(event) => {
                                if (specializationContextMenu) {
                                  setSpecializationContextMenu(null);
                                }
                                setSelectedSlot({ semesterId: sem.id, index: i });
                                if (showUnassignedCourses && course) {
                                  setQuickAssignCourseModal({
                                    semesterId: sem.id,
                                    index: i,
                                    slotKey,
                                    courseCode: course.code,
                                    courseTitle: course.title,
                                    locationLabel: sem.name,
                                    currentAssigneeId: assignedInstructorIdForSlot,
                                    anchorX: event.clientX,
                                    anchorY: event.clientY
                                  });
                                  return;
                                }
                                if (prerequisiteDrawMode) {
                                  if (!course) {
                                    setPrerequisiteSourceSlot(null);
                                    return;
                                  }
                                  const currentSlot = { semesterId: sem.id, index: i };
                                  if (
                                    prerequisiteSourceSlot &&
                                    prerequisiteSourceSlot.semesterId === currentSlot.semesterId &&
                                    Number(prerequisiteSourceSlot.index) === Number(currentSlot.index)
                                  ) {
                                    setPrerequisiteSourceSlot(null);
                                  } else if (!prerequisiteSourceSlot) {
                                    setPrerequisiteSourceSlot(currentSlot);
                                  } else {
                                    togglePrerequisiteLink(prerequisiteSourceSlot, currentSlot);
                                    setPrerequisiteSourceSlot(null);
                                  }
                                  return;
                                }
                                if (specializationSelectMode && isSelectableForSpecialization(course) && !course?.isSpecializationPlaceholder) {
                                  setSelectedElectiveSlots((current) =>
                                    current.includes(slotKey)
                                      ? current.filter((key) => key !== slotKey)
                                      : [...current, slotKey]
                                  );
                                }
                              }}
                              onContextMenu={(event) => {
                                if (specializationContextMenu) {
                                  setSpecializationContextMenu(null);
                                }
                                if (!course) {
                                  return;
                                }
                                const canConvertSpec =
                                  selectedProgram.type === 'Specialization' &&
                                  specializationSelectMode &&
                                  isSelectableForSpecialization(course) &&
                                  !course?.isSpecializationPlaceholder;
                                const canMarkAsNew = canMarkNewCourse;
                                if (!canConvertSpec && !canMarkAsNew) {
                                  return;
                                }
                                event.preventDefault();
                                if (canConvertSpec && !selectedElectiveSlotSet.has(slotKey)) {
                                  setSelectedElectiveSlots((current) => [...current, slotKey]);
                                }
                                setSpecializationContextMenu({
                                  anchorX: event.clientX,
                                  anchorY: event.clientY,
                                  semesterId: sem.id,
                                  index: i,
                                  canConvertSpec,
                                  canMarkAsNew,
                                  isNewCourse: !!course.isNewCourse
                                });
                              }}
                              className={`h-24 rounded-lg relative transition-colors cursor-pointer ${selectedSlot?.semesterId === sem.id && selectedSlot?.index === i ? 'ring-2 ring-indigo-500' : ''} ${isElectiveSelected ? 'ring-2 ring-amber-500' : ''} ${
                                prerequisiteSourceSlot?.semesterId === sem.id && Number(prerequisiteSourceSlot?.index) === Number(i)
                                  ? 'ring-2 ring-fuchsia-500'
                                  : ''
                              } ${
                                course
                                  ? isLockedCoreCourse(course)
                                    ? `${course.color || 'bg-slate-200'} shadow-sm border ${course.isNewCourse ? 'border-amber-500' : 'border-slate-400/60'}`
                                    : `${course.color || 'bg-slate-200'} shadow-sm ${course.isNewCourse ? 'border border-amber-400/90' : ''}`
                                  : 'bg-slate-50 border border-dashed border-slate-300'
                              } ${assignmentHighlightClass} ${dimmedByCourseInfoToggle ? 'opacity-35 grayscale-[0.35]' : ''}`}
                              onDragOver={(e) => {
                                if (isPrerequisiteViewMode) return;
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                if (isPrerequisiteViewMode) return;
                                e.preventDefault();
                                const data = getDragPayload(e);
                                if (data?.type === 'course') {
                                  const sourceSemId = data.semesterId;
                                  const sourceIndex = data.courseIndex;
                                  
                                  if(sourceSemId === sem.id && sourceIndex === i) return;
                                  if (isLockedCoreCourse(course)) return;

                                  moveCourse(selectedProgram.id, sourceSemId, sourceIndex, sem.id, i);
                                }
                              }}
                            >
                              {course ? (
                                <div
                                  draggable={!isLockedCoreCourse(course) && !isPrerequisiteViewMode}
                                  onDragStart={(e) => {
                                    if (isLockedCoreCourse(course) || isPrerequisiteViewMode) {
                                      e.preventDefault();
                                      return;
                                    }
                                    setDragPayload(e, { type: 'course', semesterId: sem.id, courseIndex: i });
                                  }}
                                  className={`w-full h-full flex flex-col items-center justify-center relative group ${
                                    isLockedCoreCourse(course)
                                      ? 'cursor-not-allowed'
                                      : isPrerequisiteViewMode
                                        ? 'cursor-pointer'
                                        : 'cursor-grab active:cursor-grabbing'
                                  }`}
                                >
                                  {isLockedCoreCourse(course) && (
                                    <>
                                      <div className="absolute inset-0 rounded-lg bg-slate-100/45 pointer-events-none" />
                                      <div className="absolute top-1 right-1 p-1 rounded bg-white/70 text-slate-700 pointer-events-none">
                                        <Lock size={12} />
                                      </div>
                                    </>
                                  )}
                                  {!isLockedCoreCourse(course) && (
                                    <button
                                       onClick={(e) => { e.stopPropagation(); removeCourse(selectedProgram.id, sem.id, i); }}
                                       className="absolute top-1 right-1 p-1 text-black/40 hover:text-black hover:bg-white/50 rounded transition-opacity opacity-0 group-hover:opacity-100"
                                       title="Remove course"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                  {showCourseCredits && (
                                    <div className="absolute top-1.5 left-1.5 text-[10px] font-bold text-black/50 bg-white/40 px-1.5 py-0.5 rounded shadow-sm">
                                        {course.credits !== undefined ? course.credits : 3}cr
                                    </div>
                                  )}
                                  {(showPrerequisiteLinks || prerequisiteDrawMode) && getIncomingPrerequisiteCount(sem.id, i) > 0 && (
                                    <div className="absolute top-1.5 right-7 text-[10px] font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-300">
                                      Pre: {getIncomingPrerequisiteCount(sem.id, i)}
                                    </div>
                                  )}
                                  {course.isNewCourse && (
                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                      NEW
                                    </div>
                                  )}
                                  {showUnassignedCourses && assignedInstructorBadge && (
                                    <div className="absolute top-1.5 right-1.5 flex flex-wrap justify-end gap-1 max-w-[70%]">
                                      <span
                                        key={`${sem.id}_${i}_${assignedInstructorBadge}`}
                                        className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300"
                                        title="Assigned instructor"
                                      >
                                        {assignedInstructorBadge}
                                      </span>
                                    </div>
                                  )}
                                  {selectedProgram.type !== 'Specialization' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isLockedCoreCourse(course)) return;
                                        toggleCoreCourse(selectedProgram.id, sem.id, i);
                                      }}
                                      className={`absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded border ${
                                        isLockedCoreCourse(course)
                                          ? 'bg-slate-700 text-white border-slate-700'
                                          : course.isCore
                                            ? 'bg-indigo-700 text-white border-indigo-700'
                                            : 'bg-white/70 text-slate-700 border-white/80'
                                      }`}
                                      title={isLockedCoreCourse(course) ? 'Locked core course' : course.isCore ? 'Core course' : 'Mark as core'}
                                    >
                                      CORE
                                    </button>
                                  )}
                                  <div className="text-xs font-bold text-slate-900 mb-0.5 mt-3">{course.code}</div>
                                  <div className="text-[10px] leading-tight text-slate-800 text-center px-2 line-clamp-3 font-medium">{course.title}</div>
                                </div>
                              ) : (
                                <div 
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    updatePlaceholderCredits(3);
                                    setElectiveModalSlot({ semesterId: sem.id, index: i, termName: sem.name });
                                  }}
                                  className="w-full h-full hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors rounded-lg cursor-pointer flex items-center justify-center group"
                                  title="Double-click to add course or placeholder"
                                >
                                  <Plus size={20} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                        {showYearSeparator && <div className="h-1 bg-slate-300/70" />}
                      </React.Fragment>
                    );
                  })}
                      </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex flex-col gap-4 self-stretch min-h-0 overflow-y-auto"
                    style={
                      mapPanelHeight
                        ? { height: `${mapPanelHeight}px`, maxHeight: `${mapPanelHeight}px` }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-end">
                      <div className="text-right flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onSaveMap}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
                        >
                          Save Map
                        </button>
                        <span
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-md border ${
                            mapLastSavedAt
                              ? 'border-slate-300 text-slate-600 bg-white'
                              : 'border-slate-200 text-slate-300 bg-slate-50'
                          }`}
                          title={mapLastSavedAt ? `Last saved: ${new Date(mapLastSavedAt).toLocaleString()}` : 'Not saved yet'}
                        >
                          <Info size={14} />
                        </span>
                      </div>
                    </div>
                    <Card
                      className="p-4 flex-1 min-h-0 flex flex-col overflow-hidden"
                    >
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Compliance Sidebar</h3>
                      <div className="space-y-2 text-sm flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Credits</span>
                          <span className="font-semibold">{ciqeCurrentCredits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Core Program Credits</span>
                          <span className="font-semibold">{coreProgramCredits}</span>
                        </div>
                        {selectedProgram.type === 'Specialization' && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">SPEC in Map</span>
                            <span className="font-semibold">{specializationElectiveCount} courses / {specializationElectiveCredits} cr</span>
                          </div>
                        )}
                        {selectedProgram.type === 'Specialization' && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Legend</p>
                            <p className="text-[11px] text-slate-500">
                              Muted course tiles with a lock icon are locked core and cannot be edited or moved in specializations.
                            </p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Elective Credit Breakdown</p>
                          {Object.keys(electiveCreditBreakdown).length === 0 ? (
                            <p className="text-xs text-slate-500">No elective credits assigned.</p>
                          ) : (
                            <div className="space-y-1">
                              {Object.entries(electiveCreditBreakdown).map(([category, credits]) => (
                                <div key={category} className="flex justify-between text-xs">
                                  <span className="text-slate-600">{category}</span>
                                  <span className="font-semibold">{credits} cr</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pre-requisite Links</p>
                            <button
                              type="button"
                              onClick={clearAllPrerequisiteLinks}
                              disabled={prerequisiteLinkDetails.length === 0}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Clear
                            </button>
                          </div>
                          {prerequisiteLinkDetails.length === 0 ? (
                            <p className="text-xs text-slate-500">No prerequisite links defined.</p>
                          ) : (
                            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                              {prerequisiteLinkDetails.map((link) => (
                                <div key={link.id} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                                  <div className="text-[11px] text-slate-700 font-medium">{link.fromLabel}</div>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-[11px] text-slate-500">requires for</div>
                                    <button
                                      type="button"
                                      onClick={() => removePrerequisiteLink(link.id)}
                                      className="text-[10px] px-1.5 py-0.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="text-[11px] text-slate-700 font-medium">{link.toLabel}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {selectedProgram.type === 'Specialization' && (
                  <Card className="p-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Specialization Curriculum Map</h3>
                        {!isSpecializationMapCollapsed && (
                          <>
                            <p className="text-xs text-slate-600 mt-1">
                              Select multiple non-core courses above, then create a specialization row from that set.
                            </p>
                            <div className={`mt-2 text-xs font-semibold ${specializationOverLimit ? 'text-red-700' : 'text-slate-700'}`}>
                              Course Progress: {specializationCourseProgress}/{specializationTotalCourseTarget || 0}
                            </div>
                            <div className="mt-1">
                              <ProgressBar
                                percentage={specializationCourseProgressPercent}
                                height="h-2"
                                color={
                                  specializationOverLimit
                                    ? 'bg-red-500'
                                    : specializationCourseProgress >= specializationTotalCourseTarget && specializationTotalCourseTarget > 0
                                      ? 'bg-emerald-500'
                                      : 'bg-indigo-500'
                                }
                              />
                            </div>
                            {specializationOverLimit && (
                              <div className="mt-1 text-xs text-red-700">
                                Over limit: reduce specialization courses or add SPEC placeholders in the main map.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={addEmptySpecializationRow}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50"
                        >
                          + Row
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSpecializationMapCollapsed((current) => !current)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50 inline-flex items-center gap-1.5"
                        >
                          {isSpecializationMapCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          {isSpecializationMapCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                    </div>
                    {!isSpecializationMapCollapsed &&
                      (specializationBlocks.length === 0 ? (
                        <p className="text-sm text-slate-500">No specialization rows yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {specializationBlocks.map((block) => (
                            <div
                              key={block.id}
                              className={`border rounded-lg p-2 ${getElectiveAreaTone('SPEC Electives').container}`}
                            >
                            <div className="flex flex-wrap items-center gap-2 justify-between mb-1.5">
                              <div className="font-semibold text-slate-800 text-sm">{block.name}</div>
                              <div className="flex items-center gap-2 text-xs">
                                <select
                                  value={block.rowType || 'choose'}
                                  onChange={(e) => updateBlockRowType(block.id, e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded"
                                >
                                  <option value="required">Required</option>
                                  <option value="choose">Choose</option>
                                </select>
                                {block.rowType !== 'required' && (
                                  <>
                                    <input
                                      type="number"
                                      min={1}
                                      value={block.chooseCount || 1}
                                      onChange={(e) => updateBlockChooseCount(block.id, e.target.value)}
                                      className="w-16 px-2 py-1 border border-slate-300 rounded"
                                    />
                                    <span>courses from the following</span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeSpecializationBlock(block.id)}
                                  className="text-red-600"
                                >
                                  Remove Row
                                </button>
                              </div>
                            </div>
                            <div
                              className="grid gap-1.5 justify-start overflow-x-auto pb-1"
                              style={{ gridTemplateColumns: `repeat(${specializationColumnCount}, minmax(7rem, 7rem))` }}
                            >
                              {Array.from({ length: specializationColumnCount }).map((_, i) => {
                                const rowCourse = block.courses?.[i] || null;
                                const rowSlotKey = `spec:${block.id}:${i}`;
                                const rowCourseInstanceId = String(
                                  rowCourse?.courseGlobalId || rowCourse?.courseInstanceId || rowSlotKey
                                ).trim();
                                const assignedInstructorIdForRow = rowCourseInstanceId
                                  ? String(
                                      courseInstructorAssignmentByCourseInstanceId.get(rowCourseInstanceId)?.facultyId || ''
                                    ).trim()
                                  : '';
                                const assignedInstructorBadge = assignedInstructorIdForRow
                                  ? getInstructorBadgeLabelForAssignee(assignedInstructorIdForRow)
                                  : null;
                                const hasAssignedInstructor = !!assignedInstructorBadge;
                                const assignmentHighlightClass =
                                  showUnassignedCourses && rowCourse
                                    ? hasAssignedInstructor
                                      ? 'opacity-45 saturate-75'
                                      : 'ring-2 ring-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]'
                                    : '';
                                return (
                                  <div
                                    key={`${block.id}_${i}`}
                                    className={`h-24 rounded-lg relative transition-colors ${
                                      rowCourse ? `${rowCourse.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'
                                    } ${assignmentHighlightClass}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const data = getDragPayload(e);
                                      if (data?.type === 'spec-course') {
                                        moveCourseAcrossSpecializationBlocks(data.blockId, data.courseIndex, block.id, i);
                                      }
                                    }}
                                    onClick={(event) => {
                                      if (!showUnassignedCourses || !rowCourse) return;
                                      setQuickAssignCourseModal({
                                        slotKey: rowSlotKey,
                                        courseCode: rowCourse.code,
                                        courseTitle: rowCourse.title,
                                        locationLabel: `Specialization • ${block.name}`,
                                        currentAssigneeId: assignedInstructorIdForRow,
                                        anchorX: event.clientX,
                                        anchorY: event.clientY
                                      });
                                    }}
                                  >
                                    {rowCourse ? (
                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          setDragPayload(e, { type: 'spec-course', blockId: block.id, courseIndex: i });
                                        }}
                                        className="w-full h-full px-2 py-1 flex flex-col justify-center items-center relative cursor-grab active:cursor-grabbing"
                                      >
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            removeCourseFromSpecializationBlock(block.id, i);
                                          }}
                                          className="absolute top-1 right-1 p-0.5 text-black/50 hover:text-black rounded"
                                        >
                                          <X size={12} />
                                        </button>
                                        {showUnassignedCourses && assignedInstructorBadge && (
                                          <div className="absolute top-1.5 right-5 flex flex-wrap justify-end gap-1 max-w-[70%]">
                                            <span
                                              className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300"
                                              title="Assigned instructor"
                                            >
                                              {assignedInstructorBadge}
                                            </span>
                                          </div>
                                        )}
                                        <div className="text-[10px] font-bold text-slate-900">{rowCourse.code}</div>
                                        <div className="text-[10px] text-center text-slate-700 leading-tight">{rowCourse.title}</div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setElectiveModalSlot({
                                            mode: 'specialization-block',
                                            blockId: block.id,
                                            index: i,
                                            termName: block.name
                                          })
                                        }
                                        className="w-full h-full flex items-center justify-center text-slate-400 hover:text-indigo-500"
                                      >
                                        <Plus size={18} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            </div>
                          ))}
                        </div>
                      ))}
                  </Card>
                )}

                {electiveTypesInMap.length > 0 && (
                  <Card className="p-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Elective Suggestion Maps</h3>
                    <div className="space-y-3">
                      {electiveTypesInMap.map((electiveType) => {
                        const rows = electiveSuggestionMaps[electiveType] || [];
                        const suggestionColumnCount = getElectiveSuggestionColumnCount(electiveType);
                        const isCollapsed = !!collapsedElectiveSuggestionGroups[electiveType];
                        return (
                          <div
                            key={electiveType}
                            className={`border rounded-lg p-2 ${getElectiveAreaTone(electiveType).container}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-slate-800">{electiveType}</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => addEmptyElectiveSuggestionRow(electiveType)}
                                  className="px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  + Row
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCollapsedElectiveSuggestionGroups((current) => ({
                                      ...current,
                                      [electiveType]: !current[electiveType]
                                    }))
                                  }
                                  className="px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                                >
                                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                  {isCollapsed ? 'Expand' : 'Collapse'}
                                </button>
                              </div>
                            </div>
                            {isCollapsed ? (
                              <p className="text-xs text-slate-500">Collapsed</p>
                            ) : rows.length === 0 ? (
                              <p className="text-xs text-slate-500">No suggestion rows yet for this elective type.</p>
                            ) : (
                              <div className="space-y-2">
                                {rows.map((row) => (
                                  <div
                                    key={row.id}
                                    className={`border rounded p-1.5 ${getElectiveAreaTone(electiveType).row}`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                      <div className="text-xs font-semibold text-slate-700">{row.name}</div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <select
                                          value={row.rowType || 'required'}
                                          onChange={(e) => updateElectiveSuggestionRowType(electiveType, row.id, e.target.value)}
                                          className="px-2 py-1 border border-slate-300 rounded"
                                        >
                                          <option value="required">Required</option>
                                          <option value="choose">Choose</option>
                                        </select>
                                        {row.rowType === 'choose' && (
                                          <>
                                            <input
                                              type="number"
                                              min={1}
                                              value={row.chooseCount || 1}
                                              onChange={(e) => updateElectiveSuggestionChooseCount(electiveType, row.id, e.target.value)}
                                              className="w-16 px-2 py-1 border border-slate-300 rounded"
                                            />
                                            <span>courses from the following</span>
                                          </>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => removeElectiveSuggestionRow(electiveType, row.id)}
                                          className="text-red-600"
                                        >
                                          Remove Row
                                        </button>
                                      </div>
                                    </div>
                                    <div
                                      className="grid gap-1.5 justify-start overflow-x-auto pb-1"
                                      style={{ gridTemplateColumns: `repeat(${suggestionColumnCount}, minmax(7rem, 7rem))` }}
                                    >
                                      {Array.from({ length: suggestionColumnCount }).map((_, i) => {
                                        const rowCourse = row.courses?.[i] || null;
                                        const rowSlotKey = `elec:${electiveType}:${row.id}:${i}`;
                                        const rowCourseInstanceId = String(
                                          rowCourse?.courseGlobalId || rowCourse?.courseInstanceId || rowSlotKey
                                        ).trim();
                                        const assignedInstructorIdForRow = rowCourseInstanceId
                                          ? String(
                                              courseInstructorAssignmentByCourseInstanceId.get(rowCourseInstanceId)?.facultyId || ''
                                            ).trim()
                                          : '';
                                        const assignedInstructorBadge = assignedInstructorIdForRow
                                          ? getInstructorBadgeLabelForAssignee(assignedInstructorIdForRow)
                                          : null;
                                        const hasAssignedInstructor = !!assignedInstructorBadge;
                                        const assignmentHighlightClass =
                                          showUnassignedCourses && rowCourse
                                            ? hasAssignedInstructor
                                              ? 'opacity-45 saturate-75'
                                              : 'ring-2 ring-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]'
                                            : '';
                                        return (
                                          <div
                                            key={`${row.id}_${i}`}
                                            className={`h-24 rounded-lg relative transition-colors ${
                                              rowCourse ? `${rowCourse.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'
                                            } ${assignmentHighlightClass}`}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              const data = getDragPayload(e);
                                              if (data?.type === 'elective-suggestion-course') {
                                                moveCourseAcrossElectiveSuggestionRows(
                                                  electiveType,
                                                  data.rowId,
                                                  data.courseIndex,
                                                  row.id,
                                                  i
                                                );
                                              }
                                            }}
                                            onClick={(event) => {
                                              if (!showUnassignedCourses || !rowCourse) return;
                                              setQuickAssignCourseModal({
                                                slotKey: rowSlotKey,
                                                courseCode: rowCourse.code,
                                                courseTitle: rowCourse.title,
                                                locationLabel: `${electiveType} • ${row.name}`,
                                                currentAssigneeId: assignedInstructorIdForRow,
                                                anchorX: event.clientX,
                                                anchorY: event.clientY
                                              });
                                            }}
                                          >
                                            {rowCourse ? (
                                              <div
                                                draggable
                                                onDragStart={(e) => {
                                                  setDragPayload(e, {
                                                    type: 'elective-suggestion-course',
                                                    rowId: row.id,
                                                    courseIndex: i
                                                  });
                                                }}
                                                className="w-full h-full px-2 py-1 flex flex-col justify-center items-center relative cursor-grab active:cursor-grabbing"
                                              >
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    removeCourseFromElectiveSuggestionRow(electiveType, row.id, i);
                                                  }}
                                                  className="absolute top-1 right-1 p-0.5 text-black/50 hover:text-black rounded"
                                                >
                                                  <X size={12} />
                                                </button>
                                                {showUnassignedCourses && assignedInstructorBadge && (
                                                  <div className="absolute top-1.5 right-5 flex flex-wrap justify-end gap-1 max-w-[70%]">
                                                    <span
                                                      className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300"
                                                      title="Assigned instructor"
                                                    >
                                                      {assignedInstructorBadge}
                                                    </span>
                                                  </div>
                                                )}
                                                <div className="text-[10px] font-bold text-slate-900">{rowCourse.code}</div>
                                                <div className="text-[10px] text-center text-slate-700 leading-tight">{rowCourse.title}</div>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setElectiveModalSlot({
                                                    mode: 'elective-suggestion-row',
                                                    electiveType,
                                                    rowId: row.id,
                                                    index: i,
                                                    termName: `${electiveType} • ${row.name}`
                                                  })
                                                }
                                                className="w-full h-full flex items-center justify-center text-slate-400 hover:text-indigo-500"
                                              >
                                                <Plus size={18} />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Elective/Course Modal */}
                {electiveModalSlot && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {electiveModalSlot.mode === 'specialization-block'
                              ? 'Add to Specialization Row'
                              : electiveModalSlot.mode === 'elective-suggestion-row'
                                ? 'Add to Elective Suggestion Row'
                                : 'Add to Map'}
                          </h3>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{electiveModalSlot.termName} • Slot {electiveModalSlot.index + 1}</p>
                        </div>
                        <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                        
                        {/* Search Catalog */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Search & Select Course</label>
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
                            <div className="pl-3 text-slate-400"><Search size={16} /></div>
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type course code or title..."
                              className="w-full px-3 py-2.5 outline-none text-sm font-medium"
                              value={courseSearchTerm}
                              onChange={(e) => setCourseSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <select
                              value={modalDisciplineFilter}
                              onChange={(e) => setModalDisciplineFilter(e.target.value)}
                              className="px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                              {modalDisciplineOptions.map((discipline) => (
                                <option key={discipline} value={discipline}>
                                  {discipline}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                              {modalDisciplineOptions.map((discipline) => (
                                <button
                                  key={discipline}
                                  type="button"
                                  onClick={() => setModalDisciplineFilter(discipline)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                    modalDisciplineFilter === discipline
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {discipline}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-inner">
                            {(() => {
                              const normalizedTerm = courseSearchTerm.toLowerCase();
                              const filteredCourses = courseSearchTerm.trim() === '' 
                                ? globalCourses.filter((c) => {
                                    const discipline = c.discipline || 'Uncategorized';
                                    return modalDisciplineFilter === 'All' || discipline === modalDisciplineFilter;
                                  })
                                : globalCourses.filter(c => 
                                    (c.code.toLowerCase().includes(normalizedTerm) || 
                                    c.title.toLowerCase().includes(normalizedTerm) ||
                                    (c.discipline && c.discipline.toLowerCase().includes(normalizedTerm))) &&
                                    (modalDisciplineFilter === 'All' || (c.discipline || 'Uncategorized') === modalDisciplineFilter)
                                  );

                              return filteredCourses.length > 0 ? (
                                filteredCourses.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      applyCourseFromModal({ 
                                        code: c.code, 
                                        title: c.title, 
                                        color: c.color,
                                        credits: c.credits !== undefined ? c.credits : 3,
                                        discipline: c.discipline
                                      });
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0 border-slate-100 flex justify-between items-center group transition-colors"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-bold text-slate-900 text-sm truncate">{c.code}</div>
                                      <div className="text-xs text-slate-500 truncate">{c.title}</div>
                                      {c.discipline && <div className="text-[11px] text-indigo-600 font-semibold">{c.discipline}</div>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge type="neutral">{c.credits}cr</Badge>
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Plus size={14} />
                                        </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-sm text-slate-500 text-center">No courses match "{courseSearchTerm}"</div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-wide">OR ADD PLACEHOLDER</span>
                          </div>
                        </div>

                        {/* Special Blocks */}
                        <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Placeholder Credits</label>
                             <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <button onClick={() => updatePlaceholderCredits(Math.max(0, placeholderCredits - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">-</button>
                                <span className="text-sm font-bold w-6 text-center">{placeholderCredits}</span>
                                <button onClick={() => updatePlaceholderCredits(placeholderCredits + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">+</button>
                             </div>
                          </div>

                          <div className="space-y-2">
                            <button 
                              onClick={() => {
                                applyCourseFromModal({ code: 'EXP', title: 'Experiential', color: 'bg-emerald-200', credits: placeholderCredits });
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-emerald-200 border border-emerald-300" />
                                  <span className="text-sm text-slate-700">Experiential Learning</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                applyCourseFromModal({ code: 'ELEC', title: 'General Elective', color: 'bg-slate-200', credits: placeholderCredits });
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-slate-200 border border-slate-300" />
                                  <span className="text-sm text-slate-700">General Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                applyCourseFromModal({ code: 'BUSI-ELEC', title: 'BUSI Elective', color: 'bg-indigo-200', credits: placeholderCredits, discipline: 'BUSI' });
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-indigo-200 border border-indigo-300" />
                                  <span className="text-sm text-slate-700">BUSI Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                applyCourseFromModal({ code: 'GAME-ELEC', title: 'GAME Elective', color: 'bg-purple-200', credits: placeholderCredits, discipline: 'GAME' });
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-purple-200 border border-purple-300" />
                                  <span className="text-sm text-slate-700">GAME Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                applyCourseFromModal({ code: 'OPEN', title: 'Open Elective', color: 'bg-slate-300', credits: placeholderCredits });
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-slate-300 border border-slate-400" />
                                  <span className="text-sm text-slate-700">Open Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const type = new FormData(e.target).get('electiveType');
                              if (type) {
                                applyCourseFromModal({ code: 'ELEC', title: `${type} Elective`, color: 'bg-indigo-200', credits: placeholderCredits });
                              }
                            }}
                            className="pt-4 border-t border-slate-200"
                          >
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Custom Elective Type</label>
                            <div className="flex gap-2">
                              <input name="electiveType" placeholder="e.g. Technical, Business..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium shadow-sm" />
                              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                Create
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {selectedProgram.reviews.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                  <p>No reviews or feedback yet.</p>
                </div>
              ) : (
                selectedProgram.reviews.map(review => (
                  <Card key={review.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <Badge type={review.status === 'open' ? 'warning' : 'success'}>
                          {review.status}
                        </Badge>
                        <span className="text-sm font-bold text-slate-900">{review.category} Review</span>
                        <span className="text-sm text-slate-500">• {review.reviewer}</span>
                      </div>
                      <p className="text-slate-700">{review.text}</p>
                    </div>
                    {review.status === 'open' && (
                      <button className="px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50">
                        Mark Resolved
                      </button>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'faculty' && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3">Assign Faculty To Program</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedAssignableFacultyId}
                    onChange={(event) => setSelectedAssignableFacultyId(event.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select faculty member</option>
                    {availableFacultyForAssignment.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.appointmentType ? `(${member.appointmentType})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={assignFacultyToProgram}
                    disabled={!selectedAssignableFacultyId}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Faculty
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  This list includes faculty automatically matched by mapped courses and elective interests, plus explicitly assigned faculty.
                </p>
              </Card>

              {facultyRowsForProgram.length === 0 ? (
                <Card className="p-6 text-sm text-slate-500">
                  No matched or assigned faculty yet.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facultyRowsForProgram.map((faculty) => (
                    <Card key={faculty.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{faculty.name}</div>
                          <div className="text-sm text-slate-500">{faculty.role || faculty.appointmentType || 'Faculty'}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {faculty.isAssigned && <Badge type="info">Assigned</Badge>}
                          {faculty.isLegacy && <Badge type="warning">Legacy</Badge>}
                          {!faculty.isLegacy &&
                            !faculty.isAssigned &&
                            (faculty.matchedCourses.length > 0 || faculty.matchedElectiveInterests.length > 0) && (
                              <Badge type="success">Matched</Badge>
                            )}
                        </div>
                      </div>

                      {!faculty.isLegacy && (
                        <>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Courses Assigned In This Program
                              </div>
                              <button
                                type="button"
                                onClick={() => openFacultyCourseModal(faculty)}
                                className="text-xs px-2 py-0.5 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                              >
                                + Course
                              </button>
                            </div>
                            {faculty.assignedCoursesInProgram.length === 0 ? (
                              <p className="text-xs text-slate-500">No mapped or manually assigned courses.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {faculty.assignedCoursesInProgram.map((course) => (
                                  <span
                                    key={`${faculty.id}_${course.id}`}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700"
                                    title={`${course.code} - ${course.title} (${course.locationLabel}, slot ${course.slotNumber})`}
                                  >
                                    {course.code} • {course.locationLabel} S{course.slotNumber}
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeCourseAssignmentFromFaculty(faculty.id, course.id);
                                      }}
                                      className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-indigo-300 bg-white/80 text-indigo-700 hover:bg-white"
                                      title="Remove course assignment"
                                      aria-label={`Remove ${course.code} assignment from ${faculty.name}`}
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
                              Elective Interest Matches
                            </div>
                            {faculty.matchedElectiveInterests.length === 0 ? (
                              <p className="text-xs text-slate-500">No elective-interest matches.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {faculty.matchedElectiveInterests.map((interest) => (
                                  <span
                                    key={`${faculty.id}_interest_${interest}`}
                                    className="text-xs px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {!faculty.isLegacy && faculty.isAssigned && (
                        <button
                          type="button"
                          onClick={() => unassignFacultyFromProgram(faculty.id)}
                          className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Remove Assignment
                        </button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {specializationContextMenu &&
            (specializationContextMenu.canMarkAsNew || specializationContextMenu.canConvertSpec) && (
              <div className="fixed inset-0 z-50" onClick={() => setSpecializationContextMenu(null)}>
                <Card
                  className="w-64 max-w-[calc(100vw-1rem)] p-2.5"
                  style={{
                    position: 'fixed',
                    left: Math.max(
                      8,
                      Math.min(
                        (specializationContextMenu.anchorX || 16) + 8,
                        (typeof window !== 'undefined' ? window.innerWidth : 1280) - 280
                      )
                    ),
                    top: Math.max(
                      8,
                      Math.min(
                        (specializationContextMenu.anchorY || 16) + 8,
                        (typeof window !== 'undefined' ? window.innerHeight : 800) - 180
                      )
                    )
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {(() => {
                    const contextSlotKey = toSlotKey(
                      specializationContextMenu.semesterId,
                      specializationContextMenu.index
                    );
                    const selectedCountForContext =
                      specializationContextMenu.canConvertSpec &&
                      !selectedElectiveSlotSet.has(contextSlotKey)
                        ? selectedElectiveSlots.length + 1
                        : selectedElectiveSlots.length;
                    return (
                      <>
                        <div className="space-y-2">
                          {specializationContextMenu.canMarkAsNew && (
                            <button
                              type="button"
                              onClick={() => {
                                toggleNewCourse(
                                  selectedProgram.id,
                                  specializationContextMenu.semesterId,
                                  specializationContextMenu.index
                                );
                                setSpecializationContextMenu(null);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-medium hover:bg-amber-100"
                            >
                              {specializationContextMenu.isNewCourse ? 'Unmark NEW Course' : 'Mark as NEW Course'}
                            </button>
                          )}
                          {specializationContextMenu.canConvertSpec && (
                            <button
                              type="button"
                              onClick={() => {
                                addSelectedToSpecializationBlock();
                                setSpecializationContextMenu(null);
                              }}
                              disabled={selectedCountForContext === 0}
                              className="w-full text-left px-2.5 py-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Convert to SPEC (Elective)
                            </button>
                          )}
                        </div>
                        {specializationContextMenu.canConvertSpec && (
                          <p className="mt-1.5 text-[11px] text-slate-500 px-0.5">
                            {selectedCountForContext} elective{selectedCountForContext === 1 ? '' : 's'} selected
                          </p>
                        )}
                      </>
                    );
                  })()}
                </Card>
              </div>
            )}

          {facultyCourseModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
              <Card className="w-full max-w-2xl mt-8 p-5 relative">
                <button
                  type="button"
                  onClick={closeFacultyCourseModal}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  aria-label="Close assign course modal"
                >
                  <X size={16} />
                </button>
                <h3 className="text-lg font-bold text-slate-900">Assign Course to {facultyCourseModal.facultyName}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Search/filter courses in this program map, then choose the exact course instance to assign.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={facultyCourseSearchTerm}
                    onChange={(event) => setFacultyCourseSearchTerm(event.target.value)}
                    placeholder="Search by code, title, or category..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <select
                    value={facultyCourseDisciplineFilter}
                    onChange={(event) => setFacultyCourseDisciplineFilter(event.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {facultyCourseDisciplineOptions.map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {discipline}
                      </option>
                    ))}
                  </select>
                  <select
                    value={facultyCourseSelectedInstanceId}
                    onChange={(event) => setFacultyCourseSelectedInstanceId(event.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select course</option>
                    {filteredFacultyCourseCatalog.map((courseEntry) => (
                      <option key={courseEntry.courseInstanceId} value={courseEntry.courseInstanceId}>
                        {courseEntry.code} - {courseEntry.title} ({courseEntry.semesterName}, slot {courseEntry.index + 1})
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-slate-500">
                    {filteredFacultyCourseCatalog.length} course{filteredFacultyCourseCatalog.length === 1 ? '' : 's'} match the current filters.
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeFacultyCourseModal}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={assignCourseToFacultyInProgram}
                    disabled={!facultyCourseSelectedInstanceId}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Course
                  </button>
                </div>
              </Card>
            </div>
          )}

          {quickAssignCourseModal && (
            <div
              className="fixed inset-0 z-50"
              onClick={closeQuickAssignCourseModal}
            >
              <Card
                className="w-[22rem] max-w-[calc(100vw-1rem)] p-4 relative"
                style={{
                  position: 'fixed',
                  left: Math.max(
                    8,
                    Math.min(
                      (quickAssignCourseModal.anchorX || 16) + 10,
                      (typeof window !== 'undefined' ? window.innerWidth : 1280) - 360
                    )
                  ),
                  top: Math.max(
                    8,
                    Math.min(
                      (quickAssignCourseModal.anchorY || 16) + 10,
                      (typeof window !== 'undefined' ? window.innerHeight : 800) - 300
                    )
                  )
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={closeQuickAssignCourseModal}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  aria-label="Close quick assign instructor modal"
                >
                  <X size={16} />
                </button>
                <h3 className="text-lg font-bold text-slate-900">Assign Instructor</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {quickAssignCourseModal.courseCode} - {quickAssignCourseModal.courseTitle}
                </p>
                {quickAssignCourseModal.locationLabel && (
                  <p className="text-xs text-slate-500 mt-1">{quickAssignCourseModal.locationLabel}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Select an instructor from Assigned Faculty, designate as Sessional, or clear assignment.
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  Current: <span className="font-semibold text-slate-900">
                    {quickAssignCourseModal.currentAssigneeId
                      ? getInstructorBadgeLabelForAssignee(quickAssignCourseModal.currentAssigneeId) || 'Assigned'
                      : 'Unassigned'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {quickAssignFacultyRows.length === 0 ? (
                    <div className="text-xs text-slate-500 border border-slate-200 rounded-lg p-2 bg-slate-50">
                      No assigned faculty available yet. You can still designate this course as Sessional.
                    </div>
                  ) : (
                    quickAssignFacultyRows.map((faculty) => {
                      const workloadTone = getQuickAssignWorkloadTone(faculty);
                      return (
                        <button
                          key={`quick_assign_${faculty.id}`}
                          type="button"
                          disabled={faculty.atCapacity}
                          onClick={() => assignInstructorToCourseSlot(quickAssignCourseModal.slotKey, faculty.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg border ${workloadTone} transition-colors ${
                            faculty.atCapacity ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-[0.96]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold leading-tight truncate">{faculty.name}</div>
                            <div className="text-[10px] font-bold whitespace-nowrap">
                              {faculty.assignedGlobalCourses}/{faculty.capacity || 0}
                            </div>
                          </div>
                          <div className="text-[11px] leading-tight">
                            {appointmentTypeToShort(faculty.appointmentType)} • Remaining: {faculty.remainingCapacity}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => assignInstructorToCourseSlot(quickAssignCourseModal.slotKey, '__sessional__')}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100"
                    >
                      Assign as Sessional
                    </button>
                    <button
                      type="button"
                      onClick={() => removeInstructorFromCourseSlot(quickAssignCourseModal.slotKey)}
                      className="w-full px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100"
                    >
                      Remove Instructor
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
}

import { getDefaultProgramColor } from './data';
import { createDefaultProgramInfo } from './programInfo';

const DEFAULT_MAP_COLUMNS = 5;
const createCourseInstanceId = () => `ci_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const toCourseWithPrerequisites = (course, options = {}) => {
  if (!course) return null;
  const forceNewCourseInstanceId = !!options.forceNewCourseInstanceId;
  const existingCourseInstanceId = String(
    course.courseInstanceId || course.mapCourseId || course.instanceId || ''
  ).trim();
  const prerequisites = Array.isArray(course.prerequisites)
    ? course.prerequisites.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
  return {
    ...course,
    prerequisites,
    courseInstanceId: forceNewCourseInstanceId
      ? createCourseInstanceId()
      : existingCourseInstanceId || createCourseInstanceId()
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

const prunePrerequisiteLinksBySlot = (links = [], semesterId, index) =>
  normalizePrerequisiteLinks(links).filter(
    (link) =>
      !(link.fromSemesterId === semesterId && link.fromIndex === index) &&
      !(link.toSemesterId === semesterId && link.toIndex === index)
  );

const remapPrerequisiteLinksAfterSwap = (links = [], sourceSemId, sourceIndex, targetSemId, targetIndex) => {
  const remapEndpoint = (semesterId, index) => {
    if (semesterId === sourceSemId && index === sourceIndex) {
      return { semesterId: targetSemId, index: targetIndex };
    }
    if (semesterId === targetSemId && index === targetIndex) {
      return { semesterId: sourceSemId, index: sourceIndex };
    }
    return { semesterId, index };
  };

  const remapped = normalizePrerequisiteLinks(links).map((link) => {
    const from = remapEndpoint(link.fromSemesterId, link.fromIndex);
    const to = remapEndpoint(link.toSemesterId, link.toIndex);
    return {
      ...link,
      fromSemesterId: from.semesterId,
      fromIndex: from.index,
      toSemesterId: to.semesterId,
      toIndex: to.index
    };
  });
  return normalizePrerequisiteLinks(remapped);
};

const applyPrerequisiteMetadata = (semesters = [], links = []) => {
  const normalizedSemesters = (semesters || []).map((semester) => ({
    ...semester,
    courses: (semester.courses || []).map((course) => toCourseWithPrerequisites(course))
  }));
  const slotCourseCode = new Map();
  normalizedSemesters.forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (!course?.code) return;
      slotCourseCode.set(`${semester.id}:${index}`, course.code);
    });
  });

  const normalizedLinks = normalizePrerequisiteLinks(links).filter((link) => {
    const fromKey = `${link.fromSemesterId}:${link.fromIndex}`;
    const toKey = `${link.toSemesterId}:${link.toIndex}`;
    return slotCourseCode.has(fromKey) && slotCourseCode.has(toKey);
  });

  const prerequisitesByTarget = new Map();
  normalizedLinks.forEach((link) => {
    const targetKey = `${link.toSemesterId}:${link.toIndex}`;
    const prereqCode = slotCourseCode.get(`${link.fromSemesterId}:${link.fromIndex}`);
    if (!prereqCode) return;
    const current = prerequisitesByTarget.get(targetKey) || [];
    current.push(prereqCode);
    prerequisitesByTarget.set(targetKey, current);
  });

  const semestersWithPrereqs = normalizedSemesters.map((semester) => ({
    ...semester,
    courses: (semester.courses || []).map((course, index) => {
      if (!course) return null;
      const key = `${semester.id}:${index}`;
      const prerequisites = prerequisitesByTarget.get(key) || [];
      return {
        ...course,
        prerequisites
      };
    })
  }));

  return {
    semesters: semestersWithPrereqs,
    prerequisiteLinks: normalizedLinks
  };
};

export const createProgramFromForm = (formData, existingPrograms = []) => {
  const timestamp = Date.now();
  const type = formData.get('type');
  const isMinor = type === 'Minor';
  const isSpecialization = type === 'Specialization';
  const applyCiqeTemplate = formData.get('ciqeTemplate') === 'on' || isMinor || isSpecialization;
  const parentProgramId = formData.get('parentProgram') || null;
  const parentProgram = parentProgramId
    ? existingPrograms.find((program) => program.id === parentProgramId) || null
    : null;
  const requiredSpecializationCourses = Number(
    formData.get('requiredSpecializationCourses') || (isSpecialization ? 3 : isMinor ? 6 : 0)
  );
  const requiredCourseCodes = String(formData.get('requiredCourseCodes') || '')
    .split(/[\n,]+/)
    .map((code) => code.trim())
    .filter(Boolean);
  const lockedCoreCourseCodes =
    isSpecialization && parentProgram
      ? Array.from(
          new Set(
            parentProgram.semesters.flatMap((semester) =>
              semester.courses.filter((course) => course?.isCore).map((course) => course.code)
            )
          )
        )
      : [];

  const createDefaultSpecializationRows = () =>
    Array.from({ length: Math.max(requiredSpecializationCourses, 0) }).map((_, index) => ({
      id: `spec_block_${timestamp}_${index + 1}`,
      name: `Specialization Row ${index + 1}`,
      rowType: 'required',
      chooseCount: 1,
      columnCount: DEFAULT_MAP_COLUMNS,
      courses: Array.from({ length: DEFAULT_MAP_COLUMNS }).map(() => null)
    }));

  const buildSemesters = () => {
    if (applyCiqeTemplate && parentProgram) {
      return parentProgram.semesters.map((semester) => ({
        ...semester,
        courses: semester.courses.map((course) =>
          course
            ? {
                ...course,
                prerequisites: Array.isArray(course.prerequisites) ? [...course.prerequisites] : [],
                isNewCourse: false
              }
            : null
        )
      }));
    }

    if (applyCiqeTemplate && isMinor) {
      return [
        { id: `sem_${timestamp}_0`, name: 'Minor Block 1', courses: [] },
        { id: `sem_${timestamp}_1`, name: 'Minor Block 2', courses: [] },
        { id: `sem_${timestamp}_2`, name: 'Minor Block 3', courses: [] }
      ];
    }

    if (applyCiqeTemplate && isSpecialization) {
      return [
        { id: `sem_${timestamp}_0`, name: 'Specialization Block 1', courses: [] },
        { id: `sem_${timestamp}_1`, name: 'Specialization Block 2', courses: [] }
      ];
    }

    return Array.from({ length: 8 }).map((_, i) => ({
      id: `sem_${timestamp}_${i}`,
      name: `Year ${Math.floor(i / 2) + 1} - ${i % 2 === 0 ? 'Fall' : 'Winter'}`,
      courses: []
    }));
  };

  const inheritedPrerequisiteLinks = parentProgram?.prerequisiteLinks
    ? normalizePrerequisiteLinks(parentProgram.prerequisiteLinks)
    : [];
  const semestersWithPrerequisiteMetadata = applyPrerequisiteMetadata(
    buildSemesters(),
    inheritedPrerequisiteLinks
  );

  const newProgramBase = {
    id: `prog_${timestamp}`,
    name: formData.get('name'),
    type,
    discipline: formData.get('discipline') || null,
    faculty: formData.get('faculty'),
    lead: formData.get('lead'),
    parentProgramId: parentProgram?.id || null,
    parentProgram: parentProgram?.name || null,
    parentProgramType: parentProgram?.type || null,
    parentProgramDiscipline: parentProgram?.discipline || null,
    lockedCoreCourseCodes,
    parentBaselineSemesters: parentProgram
      ? parentProgram.semesters.map((semester) => ({
          ...semester,
          courses: [...semester.courses]
        }))
      : null,
    ciqeTemplateApplied: applyCiqeTemplate,
    ciqeGuidelines: applyCiqeTemplate
      ? {
          minCredits: isMinor ? 18 : isSpecialization ? 9 : null,
          maxCredits: isMinor || isSpecialization ? 24 : null,
          recommendedCourses: isMinor ? 6 : isSpecialization ? 3 : null,
          requiredSpecializationCourses: requiredSpecializationCourses || null,
          requiredCourseCodes
        }
      : null,
    status: 'Drafting',
    description: formData.get('description'),
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: new Date().toISOString().split('T')[0] },
      { id: 'm1b', name: 'CIQE Requirement Check', completed: applyCiqeTemplate, date: applyCiqeTemplate ? new Date().toISOString().split('T')[0] : null },
      { id: 'm2', name: 'Budget Approval', completed: false, date: null },
      { id: 'm3', name: 'Curriculum Map', completed: false, date: null },
      { id: 'm4', name: 'External Review', completed: false, date: null },
      { id: 'm5', name: 'Senate Approval', completed: false, date: null },
      { id: 'm6', name: 'Ministry Submission', completed: false, date: null }
    ],
    semesters: semestersWithPrerequisiteMetadata.semesters,
    prerequisiteLinks: semestersWithPrerequisiteMetadata.prerequisiteLinks,
    reviews: [],
    mapColumns: DEFAULT_MAP_COLUMNS,
    programInfo: null,
    specializationBlocks: isSpecialization ? createDefaultSpecializationRows() : [],
    electiveSuggestionMaps: {},
    facultyMembers: [{ id: `f_${timestamp}`, name: formData.get('lead'), role: 'Program Lead' }],
    color: getDefaultProgramColor(type, !!parentProgram)
  };

  return {
    ...newProgramBase,
    programInfo: createDefaultProgramInfo(newProgramBase, parentProgram)
  };
};

export const createGlobalCourseFromForm = (formData, colors) => ({
  id: `c_${Date.now()}`,
  code: formData.get('code'),
  title: formData.get('title'),
  discipline: formData.get('discipline') ? String(formData.get('discipline')).trim() : undefined,
  prerequisites: [],
  credits: Number(formData.get('credits') || 3),
  color: formData.get('color') ? String(formData.get('color')) : colors[Math.floor(Math.random() * colors.length)]
});

export const insertCourseInProgram = (programs, progId, semesterId, index, course) =>
  programs.map((program) => {
    if (program.id !== progId) {
      return program;
    }

    const updatedSemesters = program.semesters.map((semester) => {
        if (semester.id !== semesterId) {
          return semester;
        }

        const updatedCourses = [...semester.courses];
        updatedCourses[index] = toCourseWithPrerequisites(course, { forceNewCourseInstanceId: true });

        return { ...semester, courses: updatedCourses };
      });

    const nextLinks = prunePrerequisiteLinksBySlot(program.prerequisiteLinks || [], semesterId, index);
    const withPrerequisites = applyPrerequisiteMetadata(updatedSemesters, nextLinks);
    return {
      ...program,
      semesters: withPrerequisites.semesters,
      prerequisiteLinks: withPrerequisites.prerequisiteLinks
    };
  });

export const removeCourseFromProgram = (programs, progId, semesterId, courseIndex) =>
  programs.map((program) => {
    if (program.id !== progId) {
      return program;
    }

    const updatedSemesters = program.semesters.map((semester) => {
        if (semester.id !== semesterId) {
          return semester;
        }

        const updatedCourses = [...semester.courses];
        updatedCourses[courseIndex] = null;

        return {
          ...semester,
          courses: updatedCourses
        };
      });

    const nextLinks = prunePrerequisiteLinksBySlot(program.prerequisiteLinks || [], semesterId, courseIndex);
    const withPrerequisites = applyPrerequisiteMetadata(updatedSemesters, nextLinks);
    return {
      ...program,
      semesters: withPrerequisites.semesters,
      prerequisiteLinks: withPrerequisites.prerequisiteLinks
    };
  });

export const swapCoursesAcrossSemesters = (programs, progId, sourceSemId, sourceIndex, targetSemId, targetIndex) =>
  programs.map((program) => {
    if (program.id !== progId) {
      return program;
    }

    const semesters = program.semesters.map((semester) => ({
      ...semester,
      courses: [...semester.courses]
    }));

    const sourceSemester = semesters.find((semester) => semester.id === sourceSemId);
    const targetSemester = semesters.find((semester) => semester.id === targetSemId);

    if (!sourceSemester || !targetSemester) {
      return program;
    }

    const sourceCourse = sourceSemester.courses[sourceIndex];
    const targetCourse = targetSemester.courses[targetIndex];

    sourceSemester.courses[sourceIndex] = targetCourse;
    targetSemester.courses[targetIndex] = sourceCourse;

    const remappedLinks = remapPrerequisiteLinksAfterSwap(
      program.prerequisiteLinks || [],
      sourceSemId,
      sourceIndex,
      targetSemId,
      targetIndex
    );
    const withPrerequisites = applyPrerequisiteMetadata(semesters, remappedLinks);
    return {
      ...program,
      semesters: withPrerequisites.semesters,
      prerequisiteLinks: withPrerequisites.prerequisiteLinks
    };
  });

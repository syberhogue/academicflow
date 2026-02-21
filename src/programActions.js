import { getDefaultProgramColor } from './data';
import { createDefaultProgramInfo } from './programInfo';

const DEFAULT_MAP_COLUMNS = 5;

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
    semesters: buildSemesters(),
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
  credits: Number(formData.get('credits') || 3),
  color: formData.get('color') ? String(formData.get('color')) : colors[Math.floor(Math.random() * colors.length)]
});

export const insertCourseInProgram = (programs, progId, semesterId, index, course) =>
  programs.map((program) => {
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
        updatedCourses[index] = course;

        return { ...semester, courses: updatedCourses };
      })
    };
  });

export const removeCourseFromProgram = (programs, progId, semesterId, courseIndex) =>
  programs.map((program) => {
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
        updatedCourses[courseIndex] = null;

        return {
          ...semester,
          courses: updatedCourses
        };
      })
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

    return { ...program, semesters };
  });

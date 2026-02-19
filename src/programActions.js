export const createProgramFromForm = (formData) => {
  const timestamp = Date.now();

  return {
    id: `prog_${timestamp}`,
    name: formData.get('name'),
    type: formData.get('type'),
    faculty: formData.get('faculty'),
    lead: formData.get('lead'),
    status: 'Drafting',
    description: formData.get('description'),
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: new Date().toISOString().split('T')[0] },
      { id: 'm2', name: 'Budget Approval', completed: false, date: null },
      { id: 'm3', name: 'Curriculum Map', completed: false, date: null },
      { id: 'm4', name: 'External Review', completed: false, date: null },
      { id: 'm5', name: 'Senate Approval', completed: false, date: null },
      { id: 'm6', name: 'Ministry Submission', completed: false, date: null }
    ],
    semesters: Array.from({ length: 8 }).map((_, i) => ({
      id: `sem_${timestamp}_${i}`,
      name: `Year ${Math.floor(i / 2) + 1} - ${i % 2 === 0 ? 'Fall' : 'Winter'}`,
      courses: []
    })),
    reviews: [],
    facultyMembers: [{ id: `f_${timestamp}`, name: formData.get('lead'), role: 'Program Lead' }]
  };
};

export const createGlobalCourseFromForm = (formData, colors) => ({
  id: `c_${Date.now()}`,
  code: formData.get('code'),
  title: formData.get('title'),
  credits: Number(formData.get('credits') || 3),
  color: colors[Math.floor(Math.random() * colors.length)]
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

export const removeCourseFromProgram = (programs, progId, semesterId, courseCode) =>
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

        return {
          ...semester,
          courses: semester.courses.filter((course) => course.code !== courseCode)
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

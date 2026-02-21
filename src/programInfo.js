import { FACULTY_OPTIONS } from './data';

const DEFAULT_ENROLMENT_YEARS = 6;
const PROGRAM_STUDY_LEVELS = ['Undergraduate', 'Graduate'];

const UNDERGRAD_MODIFICATION_OPTIONS = [
  'changeMinorName',
  'changeProgramName',
  'changeSpecializationName',
  'newMinor',
  'newPathway',
  'newSpecialization',
  'other'
];

const GRAD_MODIFICATION_OPTIONS = [
  'changeFieldName',
  'changeProgramName',
  'newField',
  'newType1GraduateDiploma',
  'other'
];

export const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const createEmptyTextUpload = () => ({
  text: '',
  pdfName: ''
});

const parseStartYear = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})\s*\/\s*(\d{2,4})$/);
  if (match) {
    return Number(match[1]);
  }
  const currentYear = new Date().getFullYear();
  return currentYear;
};

export const formatAcademicYearLabel = (startYear) => {
  const nextYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${nextYearShort}`;
};

export const buildAcademicYearColumns = (startAcademicYear) => {
  const startYear = parseStartYear(startAcademicYear);
  return Array.from({ length: DEFAULT_ENROLMENT_YEARS }).map((_, index) =>
    formatAcademicYearLabel(startYear + index)
  );
};

const createDefaultBaseProgramInfo = (program = {}) => ({
  fullName: program.name || '',
  programShortName: '',
  degreeDesignation: '',
  degreeShortForm: '',
  costRecoveryProgram: false,
  professionalProgram: false,
  collaboratingFaculties: [],
  collaboratingInstitutions: '',
  deliveryLocation: '',
  proponentName: program.lead || '',
  proponentEmail: '',
  version: 1,
  date: getTodayIsoDate(),
  academicCouncilApprovalDate: '',
  briefDescription: '',
  abstract: createEmptyTextUpload(),
  academicRationale: createEmptyTextUpload(),
  missionAlignment: createEmptyTextUpload(),
  needDemandA: createEmptyTextUpload(),
  needDemandB: createEmptyTextUpload(),
  needDemandCNewArea: false,
  needDemandCExplain: createEmptyTextUpload(),
  needDemandD: createEmptyTextUpload(),
  enrolment: {
    startAcademicYear: '2025/26',
    steadyStateYearIndex: null,
    firstYearIntake: 0,
    projectedYearIncreasePct: 0,
    projectedRetentionLossPct: 10
  },
  admissionA: createEmptyTextUpload(),
  admissionB: createEmptyTextUpload()
});

const toFacultyLabel = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const fromCode = FACULTY_OPTIONS.find((faculty) => faculty.code.toLowerCase() === raw.toLowerCase());
  if (fromCode) {
    return `${fromCode.code} (${fromCode.name})`;
  }

  const fromName = FACULTY_OPTIONS.find((faculty) => faculty.name.toLowerCase() === raw.toLowerCase());
  if (fromName) {
    return `${fromName.code} (${fromName.name})`;
  }

  return raw;
};

const createOptionState = (keys = [], enabledKeys = []) =>
  keys.reduce((acc, key) => ({ ...acc, [key]: enabledKeys.includes(key) }), {});

const inferParentStudyLevel = (parentProgram) => {
  const parentSelection =
    parentProgram?.programInfo?.selectionOption ||
    parentProgram?.programInfo?.studyLevel ||
    parentProgram?.programInfo?.derived?.selectionOption;
  if (PROGRAM_STUDY_LEVELS.includes(parentSelection)) {
    return parentSelection;
  }
  return 'Undergraduate';
};

export const createDefaultDerivedProgramInfo = (program = {}, parentProgram = null) => {
  const inferredStudyLevel = inferParentStudyLevel(parentProgram);
  const preselectedUndergrad = [];
  if (program.type === 'Minor') {
    preselectedUndergrad.push('newMinor');
  }
  if (program.type === 'Specialization') {
    preselectedUndergrad.push('newSpecialization');
  }

  const parentFullName = parentProgram?.programInfo?.fullName || parentProgram?.name || '';
  const parentDegreeType = parentProgram?.programInfo?.degreeDesignation || parentProgram?.type || '';
  const parentProgramShortName = parentProgram?.programInfo?.programShortName || parentProgram?.programInfo?.shortFormName || '';

  return {
    mode: 'derived',
    faculty: toFacultyLabel(parentProgram?.faculty || program.faculty || ''),
    selectionOption: inferredStudyLevel,
    majorModificationType: {
      undergraduate: createOptionState(UNDERGRAD_MODIFICATION_OPTIONS, preselectedUndergrad),
      graduate: createOptionState(GRAD_MODIFICATION_OPTIONS, [])
    },
    summaryOfProposedChanges: '',
    changeToTotalCreditHours: '',
    newCourseAssociated: '',
    calendarStartDate: '',
    registrationStartDate: '',
    additionalSupportingDocuments: '',
    additionalSupportingDocumentsDetails: '',
    programName: parentFullName,
    programShortName: parentProgramShortName,
    programAndDegreeType: parentDegreeType,
    programDescriptionForCalendar: '',
    admissionRequirements: '',
    programStructure: '',
    programLearningOutcomes: '',
    briefBackgroundExistingProgram: '',
    fitWithMissionAndMandate: '',
    resourceRequirements: {
      facultyMembers: '',
      additionalHumanResources: '',
      physicalResourceRequirements: '',
      fundingRequirements: '',
      resourceFundingAvailability: ''
    },
    transitionAndCommunication: {
      transitionPlan: '',
      communicationPlan: ''
    },
    convertingToOnline: {
      hasOnlineConversion: 'no',
      adequacyTechnologicalPlatform: '',
      qualityOfEducation: '',
      programObjectives: '',
      programLearningOutcomes: '',
      supportForTeachingStaff: '',
      supportForStudents: '',
      other: ''
    },
    impactAndConsultation: {
      facultyImpact: 'no',
      facultyConsultationDetails: '',
      studentConsulted: 'no',
      studentConsultationDetails: '',
      equityDiversityInclusion: ''
    },
    indigenousContentAndConsultation: {
      containsIndigenousContent: 'maybe',
      ieacContacted: 'no',
      ieacContactedWhen: '',
      ieacAdvice: createEmptyTextUpload(),
      ieacReturnForReview: 'na',
      ieacReviewCompleted: 'na',
      otherConsultationCompleted: 'no',
      otherConsultationDetails: '',
      changeInvolvesCoop: 'no',
      coopConsulted: 'no'
    },
    version: 1,
    date: getTodayIsoDate()
  };
};

export const createDefaultProgramInfo = (program = {}, parentProgram = null) => {
  const isDerived = !!(parentProgram || program?.parentProgramId || program?.parentProgram);
  if (isDerived) {
    return createDefaultDerivedProgramInfo(program, parentProgram);
  }
  return createDefaultBaseProgramInfo(program);
};

const normalizeTextUpload = (value) => ({
  text: value?.text || '',
  pdfName: value?.pdfName || ''
});

const normalizeEnrolment = (value) => {
  const startAcademicYear = value?.startAcademicYear || '2025/26';
  const steadyStateYearIndex =
    value?.steadyStateYearIndex === null || value?.steadyStateYearIndex === undefined
      ? null
      : Math.max(0, Math.min(DEFAULT_ENROLMENT_YEARS - 1, Number(value.steadyStateYearIndex) || 0));

  const source = Array.isArray(value?.projections) ? value.projections : [];
  const inferredFirstYearIntake = Math.max(0, Number(source?.[0]?.[0]) || 0);
  const firstYearIntake = Math.max(0, Number(value?.firstYearIntake) || inferredFirstYearIntake);
  const projectedYearIncreasePct = Math.max(-100, Number(value?.projectedYearIncreasePct) || 0);
  const projectedRetentionLossPct = Math.max(0, Math.min(100, Number(value?.projectedRetentionLossPct) || 0));

  return {
    startAcademicYear,
    steadyStateYearIndex,
    firstYearIntake,
    projectedYearIncreasePct,
    projectedRetentionLossPct
  };
};

const normalizeDerivedOptionState = (value = {}, keys = [], enabledKeys = []) => {
  const defaults = createOptionState(keys, enabledKeys);
  const next = { ...defaults };
  keys.forEach((key) => {
    if (value?.[key] === undefined) {
      return;
    }
    next[key] = !!value[key];
  });
  return next;
};

const normalizeDerivedProgramInfo = (program, parentProgram) => {
  const defaults = createDefaultDerivedProgramInfo(program, parentProgram);
  const existing = program?.programInfo || {};
  const normalizedProgramShortName = String(
    existing.programShortName || existing.shortFormName || defaults.programShortName || ''
  ).trim();
  const selectionOption = PROGRAM_STUDY_LEVELS.includes(existing.selectionOption)
    ? existing.selectionOption
    : defaults.selectionOption;

  return {
    ...defaults,
    ...existing,
    mode: 'derived',
    programShortName: normalizedProgramShortName,
    faculty: toFacultyLabel(existing.faculty || defaults.faculty),
    selectionOption,
    majorModificationType: {
      undergraduate: normalizeDerivedOptionState(
        existing.majorModificationType?.undergraduate,
        UNDERGRAD_MODIFICATION_OPTIONS,
        UNDERGRAD_MODIFICATION_OPTIONS.filter((key) => defaults.majorModificationType.undergraduate[key])
      ),
      graduate: normalizeDerivedOptionState(
        existing.majorModificationType?.graduate,
        GRAD_MODIFICATION_OPTIONS,
        []
      )
    },
    resourceRequirements: {
      ...defaults.resourceRequirements,
      ...(existing.resourceRequirements || {})
    },
    transitionAndCommunication: {
      ...defaults.transitionAndCommunication,
      ...(existing.transitionAndCommunication || {})
    },
    convertingToOnline: {
      ...defaults.convertingToOnline,
      ...(existing.convertingToOnline || {})
    },
    impactAndConsultation: {
      ...defaults.impactAndConsultation,
      ...(existing.impactAndConsultation || {})
    },
    indigenousContentAndConsultation: {
      ...defaults.indigenousContentAndConsultation,
      ...(existing.indigenousContentAndConsultation || {}),
      ieacAdvice: normalizeTextUpload(existing.indigenousContentAndConsultation?.ieacAdvice)
    },
    version: Math.max(1, Number(existing.version) || defaults.version),
    date: existing.date || defaults.date
  };
};

const normalizeBaseProgramInfo = (program) => {
  const defaults = createDefaultBaseProgramInfo(program);
  const existing = program?.programInfo || {};
  const normalizedProgramShortName = String(existing.programShortName || existing.shortFormName || '').trim();

  return {
    ...defaults,
    ...existing,
    programShortName: normalizedProgramShortName,
    collaboratingFaculties: Array.isArray(existing.collaboratingFaculties)
      ? existing.collaboratingFaculties
      : defaults.collaboratingFaculties,
    version: Math.max(1, Number(existing.version) || defaults.version),
    date: existing.date || defaults.date,
    abstract: normalizeTextUpload(existing.abstract),
    academicRationale: normalizeTextUpload(existing.academicRationale),
    missionAlignment: normalizeTextUpload(existing.missionAlignment),
    needDemandA: normalizeTextUpload(existing.needDemandA),
    needDemandB: normalizeTextUpload(existing.needDemandB),
    needDemandCExplain: normalizeTextUpload(existing.needDemandCExplain),
    needDemandD: normalizeTextUpload(existing.needDemandD),
    admissionA: normalizeTextUpload(existing.admissionA),
    admissionB: normalizeTextUpload(existing.admissionB),
    enrolment: normalizeEnrolment(existing.enrolment)
  };
};

export const normalizeProgramInfo = (program, parentProgram = null) => {
  const isDerived = !!(parentProgram || program?.parentProgramId || program?.parentProgram);
  if (isDerived) {
    return normalizeDerivedProgramInfo(program, parentProgram);
  }
  return normalizeBaseProgramInfo(program);
};

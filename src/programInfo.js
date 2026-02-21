const DEFAULT_ENROLMENT_LEVELS = 5;
const DEFAULT_ENROLMENT_YEARS = 6;

export const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const createEmptyTextUpload = () => ({
  text: '',
  pdfName: ''
});

const createEmptyEnrolmentMatrix = () =>
  Array.from({ length: DEFAULT_ENROLMENT_LEVELS }).map(() =>
    Array.from({ length: DEFAULT_ENROLMENT_YEARS }).map(() => 0)
  );

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

export const createDefaultProgramInfo = (program = {}) => ({
  fullName: program.name || '',
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
    projections: createEmptyEnrolmentMatrix()
  },
  admissionA: createEmptyTextUpload(),
  admissionB: createEmptyTextUpload()
});

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
  const projections = Array.from({ length: DEFAULT_ENROLMENT_LEVELS }).map((_, rowIndex) => {
    const sourceRow = Array.isArray(source[rowIndex]) ? source[rowIndex] : [];
    return Array.from({ length: DEFAULT_ENROLMENT_YEARS }).map((__, colIndex) =>
      Math.max(0, Number(sourceRow[colIndex]) || 0)
    );
  });

  return {
    startAcademicYear,
    steadyStateYearIndex,
    projections
  };
};

export const normalizeProgramInfo = (program) => {
  const defaults = createDefaultProgramInfo(program);
  const existing = program?.programInfo || {};
  return {
    ...defaults,
    ...existing,
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


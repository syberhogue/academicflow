import { jsPDF } from 'jspdf';
import { buildAcademicYearColumns } from './programInfo';

const PAGE_MARGIN = 14;
const DEFAULT_LINE_HEIGHT = 5;
const DEFAULT_FONT_SIZE = 10;

const UNDERGRAD_MODIFICATION_LABELS = {
  changeMinorName: 'Change to name of Minor',
  changeProgramName: 'Change to name of Program',
  changeSpecializationName: 'Change to name of specialization',
  newMinor: 'New Minor',
  newPathway: 'New Pathway',
  newSpecialization: 'New Specialization',
  other: 'Other'
};

const GRAD_MODIFICATION_LABELS = {
  changeFieldName: 'Change to name of field',
  changeProgramName: 'Change to name of Program',
  newField: 'New Field',
  newType1GraduateDiploma: 'New Type 1 Graduate Diploma',
  other: 'Other'
};

const toDisplayText = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'N/A';
  }
  if (Array.isArray(value)) {
    const filtered = value.map((item) => String(item || '').trim()).filter(Boolean);
    return filtered.length > 0 ? filtered.join(', ') : 'N/A';
  }
  return String(value);
};

const yesNoText = (value) => {
  if (value === true || value === 'yes') return 'Yes';
  if (value === false || value === 'no') return 'No';
  if (value === 'maybe') return 'Maybe';
  if (value === 'na') return 'N/A';
  return toDisplayText(value);
};

const formatTextUpload = (value) => {
  const text = toDisplayText(value?.text);
  const pdf = toDisplayText(value?.pdfName);
  if (pdf !== 'N/A') {
    return `${text}\nAttachment: ${pdf}`;
  }
  return text;
};

const createPdfWriter = (doc) => {
  const pageHeight = () => doc.internal.pageSize.getHeight();
  const pageWidth = () => doc.internal.pageSize.getWidth();
  const maxTextWidth = () => pageWidth() - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (requiredHeight) => {
    if (y + requiredHeight <= pageHeight() - PAGE_MARGIN) return false;
    doc.addPage();
    y = PAGE_MARGIN;
    return true;
  };

  const writeParagraph = (text, options = {}) => {
    const {
      indent = 0,
      fontSize = DEFAULT_FONT_SIZE,
      bold = false,
      lineHeight = DEFAULT_LINE_HEIGHT,
      spacingAfter = 1
    } = options;

    const content = toDisplayText(text);
    const width = Math.max(40, maxTextWidth() - indent);
    const lines = doc.splitTextToSize(content, width);
    const height = lines.length * lineHeight + spacingAfter;
    ensureSpace(height);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(lines, PAGE_MARGIN + indent, y);
    y += height;
  };

  const writeHeading = (text) => {
    ensureSpace(9);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(text || ''), PAGE_MARGIN, y);
    y += 7;
  };

  const writeSubHeading = (text) => {
    ensureSpace(7);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(String(text || ''), PAGE_MARGIN, y);
    y += 6;
  };

  const writeKeyValue = (label, value, options = {}) => {
    const text = `${label}: ${toDisplayText(value)}`;
    writeParagraph(text, options);
  };

  const writeDivider = () => {
    ensureSpace(4);
    doc.setDrawColor(180);
    doc.line(PAGE_MARGIN, y, pageWidth() - PAGE_MARGIN, y);
    y += 3;
  };

  return {
    doc,
    ensureSpace,
    getY: () => y,
    setY: (nextY) => {
      y = nextY;
    },
    getPageHeight: pageHeight,
    getPageWidth: pageWidth,
    getMaxTextWidth: maxTextWidth,
    writeParagraph,
    writeHeading,
    writeSubHeading,
    writeKeyValue,
    writeDivider
  };
};

const startNewPage = (writer, orientation = 'portrait') => {
  writer.doc.addPage('a4', orientation);
  writer.setY(PAGE_MARGIN);
};

const getEnrolmentProjection = (enrolment = {}) => {
  const columns = buildAcademicYearColumns(enrolment.startAcademicYear || '2025/26');
  const firstYearIntake = Math.max(0, Number(enrolment.firstYearIntake) || 0);
  const projectedYearIncreasePct = Math.max(-100, Number(enrolment.projectedYearIncreasePct) || 0);
  const projectedRetentionLossPct = Math.max(0, Math.min(100, Number(enrolment.projectedRetentionLossPct) || 0));
  const intakeGrowthFactor = 1 + projectedYearIncreasePct / 100;
  const retentionFactor = 1 - projectedRetentionLossPct / 100;

  const matrix = Array.from({ length: 5 }).map((_, rowIndex) =>
    columns.map((__, colIndex) => {
      if (rowIndex > colIndex) {
        return null;
      }
      const cohortStartOffset = colIndex - rowIndex;
      const cohortIntake = firstYearIntake * Math.pow(intakeGrowthFactor, cohortStartOffset);
      const projected = cohortIntake * Math.pow(retentionFactor, rowIndex);
      return Math.max(0, Math.round(projected));
    })
  );

  const totals = columns.map((_, colIndex) => matrix.reduce((acc, row) => acc + (Number(row[colIndex]) || 0), 0));
  return { columns, matrix, totals };
};

const getSelectedModificationOptions = (source = {}, labels = {}) =>
  Object.entries(labels)
    .filter(([key]) => !!source?.[key])
    .map(([, label]) => label);

const TAILWIND_TO_HEX = {
  'bg-blue-300': '#93c5fd',
  'bg-purple-300': '#d8b4fe',
  'bg-pink-300': '#f9a8d4',
  'bg-emerald-400': '#34d399',
  'bg-amber-400': '#fbbf24',
  'bg-sky-300': '#7dd3fc',
  'bg-orange-200': '#fed7aa',
  'bg-rose-300': '#fda4af',
  'bg-teal-300': '#5eead4',
  'bg-indigo-100': '#e0e7ff',
  'bg-slate-50': '#f8fafc',
  'bg-slate-100': '#f1f5f9',
  'bg-slate-200': '#e2e8f0',
  'bg-slate-300': '#cbd5e1',
  'bg-amber-50': '#fffbeb',
  'bg-sky-50': '#f0f9ff'
};

const resolveCourseColor = (colorToken) => {
  const token = String(colorToken || '').trim();
  if (!token) return '#e2e8f0';
  if (token.startsWith('#')) return token;
  return TAILWIND_TO_HEX[token] || '#e2e8f0';
};

const trimText = (value, maxLength = 22) => {
  const raw = String(value || '').trim();
  if (raw.length <= maxLength) return raw;
  return `${raw.slice(0, Math.max(0, maxLength - 1))}…`;
};

const isSpecElectiveCourse = (course) => !!course && (course.code === 'SPEC' || course.isSpecializationPlaceholder);

const getElectiveCategory = (course) => {
  if (!course) return null;
  if (course.discipline) return `${course.discipline} Elective`;
  if (course.code === 'BUSI-ELEC') return 'BUSI Elective';
  if (course.code === 'GAME-ELEC') return 'GAME Elective';
  if (course.code === 'OPEN') return 'Open Elective';
  if (course.code === 'ELEC') return 'General Elective';
  if (course.title && /elective/i.test(course.title)) return course.title;
  return null;
};

const buildCurriculumOverviewGroups = (program) => {
  const allCourses = (program?.semesters || []).flatMap((semester) =>
    (semester.courses || []).filter((course) => !!course)
  );
  const specCourses = allCourses.filter((course) => isSpecElectiveCourse(course));
  const coreCourses = allCourses.filter((course) => !isSpecElectiveCourse(course) && !getElectiveCategory(course));

  const electiveMap = {};
  allCourses.forEach((course) => {
    if (isSpecElectiveCourse(course)) return;
    const category = getElectiveCategory(course);
    if (!category) return;
    if (!electiveMap[category]) electiveMap[category] = [];
    electiveMap[category].push(course);
  });

  const groups = [{ label: 'CORE', courses: coreCourses }];
  Object.keys(electiveMap)
    .sort((a, b) => a.localeCompare(b))
    .forEach((label) => groups.push({ label, courses: electiveMap[label] }));

  const specSubgroups = (program?.specializationBlocks || []).map((block, index) => {
    const rowType = block.rowType || 'choose';
    const chooseCount = Math.max(1, Number(block.chooseCount) || 1);
    return {
      id: block.id || `spec_${index + 1}`,
      label: rowType === 'required' ? 'Required' : `Choose ${chooseCount} courses from the following`,
      courses: (block.courses || []).filter((course) => !!course)
    };
  });

  if (specCourses.length > 0 || specSubgroups.length > 0) {
    groups.push({ label: 'SPEC Electives', courses: specCourses, subgroups: specSubgroups });
  }

  return groups;
};

const getCurriculumMapColumnCount = (program) => {
  const explicit = Math.max(0, Number(program?.mapColumns) || 0);
  let inferred = 0;
  (program?.semesters || []).forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (course) {
        inferred = Math.max(inferred, index + 1);
      }
    });
  });
  return Math.max(5, explicit, inferred);
};

const drawCourseTile = (doc, x, y, width, height, course) => {
  const fillColor = resolveCourseColor(course?.color);
  const code = String(course?.code || 'N/A').trim();
  const title = String(course?.title || '').trim();
  const credits = Number(course?.credits || 0);
  const codeFontSize = Math.max(5.2, Math.min(7.5, height * 0.38));
  const bodyFontSize = Math.max(4.8, Math.min(6.6, height * 0.3));
  const contentX = x + 1.1;
  const contentWidth = Math.max(6, width - 2.2);
  const topTextY = y + Math.min(height - 0.8, 3.6);
  const lineHeight = Math.max(1.8, bodyFontSize * 0.95);
  const creditsY = y + height - 1.0;
  const showCredits = height >= 7.2;
  const reservedForCredits = showCredits ? lineHeight : 0;

  doc.setFillColor(fillColor);
  doc.setDrawColor(148, 163, 184);
  doc.rect(x, y, width, height, 'FD');

  if (height <= 6.8) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(15, 23, 42);
    const singleLine = trimText(`${code} - ${title}`, Math.max(12, Math.floor(contentWidth * 1.8)));
    doc.text(singleLine, contentX, y + height / 2 + 0.6);
    return;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(codeFontSize);
  doc.setTextColor(15, 23, 42);
  doc.text(trimText(code, Math.max(8, Math.floor(contentWidth * 1.4))), contentX, topTextY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(bodyFontSize);

  const titleTop = topTextY + 1.9;
  const titleAreaHeight = Math.max(0, height - (titleTop - y) - reservedForCredits - 0.8);
  const maxLines = Math.max(0, Math.floor(titleAreaHeight / lineHeight));
  if (maxLines > 0) {
    const wrapped = doc.splitTextToSize(title || 'Untitled', contentWidth);
    let lines = wrapped.slice(0, maxLines);
    if (wrapped.length > maxLines && lines.length > 0) {
      lines[lines.length - 1] = trimText(lines[lines.length - 1], Math.max(6, lines[lines.length - 1].length - 1));
    }
    lines.forEach((line, index) => {
      doc.text(line, contentX, titleTop + index * lineHeight);
    });
  }

  if (showCredits) {
    doc.text(`${credits} cr`, contentX, creditsY);
  }
};

const addCurriculumOverviewDiagram = (writer, program) => {
  const doc = writer.doc;
  const groups = buildCurriculumOverviewGroups(program);
  const margin = PAGE_MARGIN;
  const pageWidth = writer.getPageWidth();
  const pageHeight = writer.getPageHeight();
  const fullContentWidth = pageWidth - margin * 2;
  const contentWidth = Math.max(72, Math.min(fullContentWidth * 0.56, 102));
  const contentX = margin + (fullContentWidth - contentWidth) / 2;
  const pageTop = writer.getY();
  const availableHeight = pageHeight - pageTop - margin;
  const groupGap = 1.8;
  if (groups.length === 0) {
    writer.writeParagraph('No curriculum courses defined.');
    return;
  }

  const groupHeight = (availableHeight - Math.max(0, groups.length - 1) * groupGap) / Math.max(1, groups.length);
  const getGroupHeaderFill = (label) => {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('core')) return [226, 232, 240];
    if (normalized.includes('spec')) return [224, 231, 255];
    if (normalized.includes('game')) return [254, 243, 199];
    if (normalized.includes('busi')) return [209, 250, 229];
    if (normalized.includes('general')) return [240, 249, 255];
    return [241, 245, 249];
  };
  const lightenColor = (rgb, ratio = 0.7) =>
    rgb.map((value) => Math.round(value + (255 - value) * Math.max(0, Math.min(1, ratio))));

  groups.forEach((group, groupIndex) => {
    const y = pageTop + groupIndex * (groupHeight + groupGap);
    const titleFontSize = Math.max(10, Math.min(18, groupHeight * 0.42));
    const subtitleFontSize = Math.max(5.5, Math.min(8.5, titleFontSize * 0.5));

    const headerFill = getGroupHeaderFill(group.label);
    const bodyFill = lightenColor(headerFill, 0.74);
    doc.setFillColor(...bodyFill);
    doc.setDrawColor(203, 213, 225);
    doc.rect(contentX, y, contentWidth, groupHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleFontSize);
    doc.setTextColor(30, 41, 59);
    const centerY = y + groupHeight / 2;
    doc.text(String(group.label || '').toUpperCase(), contentX + contentWidth / 2, centerY - subtitleFontSize * 0.35, {
      align: 'center'
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(subtitleFontSize);
    doc.setTextColor(71, 85, 105);
    doc.text(`${group.courses.length} courses`, contentX + contentWidth / 2, centerY + subtitleFontSize * 0.95, {
      align: 'center'
    });

    if (groupIndex < groups.length - 1) {
      const plusY = y + groupHeight + groupGap / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('+', contentX + contentWidth / 2, plusY + 0.7, { align: 'center' });
    }
  });

  writer.setY(pageHeight - margin);
};

const addCurriculumMapDiagram = (writer, program) => {
  const doc = writer.doc;
  const margin = PAGE_MARGIN;
  const cols = getCurriculumMapColumnCount(program);
  const semesters = program?.semesters || [];
  const rows = Math.max(1, semesters.length);
  const pageTop = writer.getY();
  const pageBottom = writer.getPageHeight() - margin;
  const pageWidth = writer.getPageWidth();
  const gap = 0.8;
  const labelWidth = Math.max(24, Math.min(34, (pageWidth - margin * 2) * 0.18));
  const gridWidth = pageWidth - margin * 2 - labelWidth;
  const cellWidth = Math.max(9, (gridWidth - Math.max(0, cols - 1) * gap) / Math.max(1, cols));
  const headerHeight = Math.max(4.8, Math.min(6.6, cellWidth * 0.42));
  const availableHeight = pageBottom - pageTop;
  const cellHeight = (availableHeight - headerHeight - Math.max(0, rows) * gap) / Math.max(1, rows);
  const headerY = pageTop;

  const getSemesterLabelColor = (semesterName = '') => {
    const normalized = String(semesterName).toLowerCase();
    if (normalized.includes('fall')) return '#fffbeb';
    if (normalized.includes('winter')) return '#f0f9ff';
    return '#f8fafc';
  };

  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, headerY, labelWidth, headerHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(6.3, Math.min(8, headerHeight * 1.2)));
  doc.setTextColor(51, 65, 85);
  doc.text('Term', margin + 1.4, headerY + headerHeight - 1.6);

  for (let col = 0; col < cols; col += 1) {
    const x = margin + labelWidth + col * (cellWidth + gap);
    doc.setFillColor(226, 232, 240);
    doc.rect(x, headerY, cellWidth, headerHeight, 'FD');
    doc.text(`C${col + 1}`, x + 1.2, headerY + headerHeight - 1.6);
  }

  semesters.forEach((semester, rowIndex) => {
    const y = headerY + headerHeight + gap + rowIndex * (cellHeight + gap);
    const semesterFill = getSemesterLabelColor(semester?.name);
    doc.setFillColor(semesterFill);
    doc.setDrawColor(148, 163, 184);
    doc.rect(margin, y, labelWidth, cellHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(5.6, Math.min(7.4, cellHeight * 0.44)));
    doc.setTextColor(30, 41, 59);
    const semesterLines = doc.splitTextToSize(String(semester?.name || 'Semester'), labelWidth - 3);
    doc.text(semesterLines.slice(0, 2), margin + 1.2, y + Math.min(cellHeight - 1.4, 3.4));

    for (let col = 0; col < cols; col += 1) {
      const x = margin + labelWidth + col * (cellWidth + gap);
      const course = semester?.courses?.[col] || null;

      if (!course) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, y, cellWidth, cellHeight, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(Math.max(6.2, Math.min(8, cellHeight * 0.42)));
        doc.setTextColor(148, 163, 184);
        doc.text('+', x + cellWidth / 2, y + cellHeight / 2 + 1.1, { align: 'center' });
        continue;
      }

      drawCourseTile(doc, x, y, cellWidth, cellHeight, course);
      const flags = [];
      if (course.isCore) flags.push('CORE');
      if (course.isNewCourse) flags.push('NEW');
      if (course.isSpecializationPlaceholder || course.code === 'SPEC') flags.push('SPEC');
      if (flags.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(Math.max(4.8, Math.min(5.8, cellHeight * 0.28)));
        doc.setTextColor(30, 41, 59);
        doc.text(flags.join(' '), x + cellWidth - 1.3, y + cellHeight - 1.4, { align: 'right' });
      }
    }
  });

  for (let i = 0; i < semesters.length - 1; i += 1) {
    const current = String(semesters[i]?.name || '');
    const next = String(semesters[i + 1]?.name || '');
    const isYearBoundary = /winter/i.test(current) && /fall/i.test(next);
    if (!isYearBoundary) continue;
    const y = headerY + headerHeight + gap + (i + 1) * (cellHeight + gap) - gap / 2;
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.25);
    doc.line(margin, y, pageWidth - margin, y);
  }

  writer.setY(pageBottom);
};

const addBaseProgramInfo = (writer, info = {}) => {
  writer.writeSubHeading('Program Info');
  writer.writeKeyValue('Full Name of Proposed Program', info.fullName);
  writer.writeKeyValue('Program Short Name', info.programShortName);
  writer.writeKeyValue('Degree Designation', info.degreeDesignation);
  writer.writeKeyValue('Degree Short Name', info.degreeShortForm);
  writer.writeKeyValue('Cost Recovery Program', yesNoText(info.costRecoveryProgram));
  writer.writeKeyValue('Professional Program', yesNoText(info.professionalProgram));
  writer.writeKeyValue('Collaborating Faculty(s)', info.collaboratingFaculties);
  writer.writeKeyValue('Collaborating Institution(s)', info.collaboratingInstitutions);
  writer.writeKeyValue('Program Delivery Location', info.deliveryLocation);
  writer.writeKeyValue('Program Proponent', info.proponentName);
  writer.writeKeyValue('Proponent Email', info.proponentEmail);
  writer.writeKeyValue('Version', info.version);
  writer.writeKeyValue('Date', info.date);
  writer.writeKeyValue('Date of Academic Council Approval', info.academicCouncilApprovalDate);
  writer.writeKeyValue('Brief Description', info.briefDescription);
  writer.writeDivider();

  writer.writeSubHeading('1. Program Abstract');
  writer.writeParagraph(formatTextUpload(info.abstract));
  writer.writeSubHeading('2. Academic Rationale');
  writer.writeParagraph(formatTextUpload(info.academicRationale));
  writer.writeSubHeading('3. Mission / Vision / IARP / SMA Alignment');
  writer.writeParagraph(formatTextUpload(info.missionAlignment));

  writer.writeSubHeading('4. Need, Demand, and Duplication');
  writer.writeParagraph('A) Need and Demand Evidence', { bold: true });
  writer.writeParagraph(formatTextUpload(info.needDemandA), { indent: 3 });
  writer.writeParagraph('B) Distinctiveness vs Internal Programs', { bold: true });
  writer.writeParagraph(formatTextUpload(info.needDemandB), { indent: 3 });
  writer.writeParagraph('C) New Area of Study', { bold: true });
  writer.writeKeyValue('Is this a new area of study?', yesNoText(info.needDemandCNewArea), { indent: 3 });
  writer.writeParagraph(formatTextUpload(info.needDemandCExplain), { indent: 3 });
  writer.writeParagraph('D) External Comparator Programs', { bold: true });
  writer.writeParagraph(formatTextUpload(info.needDemandD), { indent: 3 });

  writer.writeSubHeading('5. Enrolment Information');
  writer.writeKeyValue('First Academic Year', info.enrolment?.startAcademicYear);
  writer.writeKeyValue('Year 1 Intake', info.enrolment?.firstYearIntake);
  writer.writeKeyValue('Projected Year/Year Increase %', info.enrolment?.projectedYearIncreasePct);
  writer.writeKeyValue('Projected Retention Loss %', info.enrolment?.projectedRetentionLossPct);
  writer.writeKeyValue(
    'Steady State Year',
    info.enrolment?.steadyStateYearIndex !== null && info.enrolment?.steadyStateYearIndex !== undefined
      ? Number(info.enrolment.steadyStateYearIndex) + 1
      : 'N/A'
  );

  const enrolmentProjection = getEnrolmentProjection(info.enrolment || {});
  writer.writeParagraph(`Academic Years: ${enrolmentProjection.columns.join(' | ')}`);
  enrolmentProjection.matrix.forEach((row, index) => {
    writer.writeParagraph(
      `Year ${index + 1}: ${row.map((cell) => (cell === null ? '-' : cell)).join(' | ')}`,
      { indent: 3 }
    );
  });
  writer.writeParagraph(`Total: ${enrolmentProjection.totals.join(' | ')}`, { indent: 3, bold: true });

  writer.writeSubHeading('6. Admission Requirements');
  writer.writeParagraph('A) Formal Admission Requirements', { bold: true });
  writer.writeParagraph(formatTextUpload(info.admissionA), { indent: 3 });
  writer.writeParagraph('B) Admission Rationale', { bold: true });
  writer.writeParagraph(formatTextUpload(info.admissionB), { indent: 3 });
};

const addDerivedProgramInfo = (writer, info = {}, program) => {
  writer.writeSubHeading('Program Info (Derived Program)');
  writer.writeKeyValue('Faculty', info.faculty);
  writer.writeKeyValue('Selection Option', info.selectionOption);
  writer.writeKeyValue('Version', info.version);
  writer.writeKeyValue('Date', info.date);

  const selectedUndergrad = getSelectedModificationOptions(
    info.majorModificationType?.undergraduate,
    UNDERGRAD_MODIFICATION_LABELS
  );
  const selectedGrad = getSelectedModificationOptions(info.majorModificationType?.graduate, GRAD_MODIFICATION_LABELS);
  writer.writeKeyValue('Major Modification Type (Undergraduate)', selectedUndergrad);
  writer.writeKeyValue('Major Modification Type (Graduate)', selectedGrad);
  writer.writeDivider();

  writer.writeSubHeading('Summary and New Courses');
  writer.writeKeyValue('Summary of Proposed Changes', info.summaryOfProposedChanges);
  writer.writeKeyValue('Change to Total Credit Hours', yesNoText(info.changeToTotalCreditHours));
  writer.writeKeyValue('New Course Associated', yesNoText(info.newCourseAssociated));
  writer.writeKeyValue('Calendar Start Date', info.calendarStartDate);
  writer.writeKeyValue('Registration Start Date', info.registrationStartDate);
  writer.writeKeyValue('Additional Supporting Documents', yesNoText(info.additionalSupportingDocuments));
  writer.writeKeyValue('Supporting Documents Details', info.additionalSupportingDocumentsDetails);

  const newCourses = (program?.semesters || []).flatMap((semester) =>
    (semester.courses || [])
      .map((course) =>
        course?.isNewCourse
          ? `${course.code} - ${course.title} (${course.credits || 0} cr) [${semester.name}]`
          : null
      )
      .filter(Boolean)
  );
  writer.writeKeyValue('List of New Courses', newCourses);

  writer.writeSubHeading('Program Description');
  writer.writeKeyValue('Program Name', info.programName);
  writer.writeKeyValue('Program Short Name', info.programShortName);
  writer.writeKeyValue('Program and Degree Type', info.programAndDegreeType);
  writer.writeKeyValue('Program Description (for Calendar)', info.programDescriptionForCalendar);
  writer.writeKeyValue('Admission Requirements', info.admissionRequirements);

  writer.writeSubHeading('Program Structure and Rationale');
  writer.writeKeyValue('Program Structure', info.programStructure);
  writer.writeKeyValue('Program Learning Outcomes', info.programLearningOutcomes);
  writer.writeKeyValue('Brief Background on Existing Program', info.briefBackgroundExistingProgram);
  writer.writeKeyValue('Fit with Mission / Mandate / Strategic Plans', info.fitWithMissionAndMandate);

  writer.writeSubHeading('Resource Requirements');
  writer.writeKeyValue('Faculty Members', info.resourceRequirements?.facultyMembers);
  writer.writeKeyValue(
    'Additional Academic and Non-Academic Human Resources',
    info.resourceRequirements?.additionalHumanResources
  );
  writer.writeKeyValue('Physical Resource Requirements', info.resourceRequirements?.physicalResourceRequirements);
  writer.writeKeyValue('Statement of Funding Requirements', info.resourceRequirements?.fundingRequirements);
  writer.writeKeyValue(
    'Statement of Resource/Funding Availability',
    info.resourceRequirements?.resourceFundingAvailability
  );

  writer.writeSubHeading('Transition and Communication Plan');
  writer.writeKeyValue('Transition Plan', info.transitionAndCommunication?.transitionPlan);
  writer.writeKeyValue('Communication Plan', info.transitionAndCommunication?.communicationPlan);

  writer.writeSubHeading('Converting to Online Options');
  writer.writeKeyValue('Contains intended online conversion', yesNoText(info.convertingToOnline?.hasOnlineConversion));
  writer.writeKeyValue('Adequacy of technological platform', info.convertingToOnline?.adequacyTechnologicalPlatform);
  writer.writeKeyValue('Quality of education impacts', info.convertingToOnline?.qualityOfEducation);
  writer.writeKeyValue('Program objectives impacts', info.convertingToOnline?.programObjectives);
  writer.writeKeyValue(
    'Program-level learning outcomes impacts',
    info.convertingToOnline?.programLearningOutcomes
  );
  writer.writeKeyValue(
    'Support services/training for teaching staff',
    info.convertingToOnline?.supportForTeachingStaff
  );
  writer.writeKeyValue('Support for students in new environment', info.convertingToOnline?.supportForStudents);
  writer.writeKeyValue('Other online conversion notes', info.convertingToOnline?.other);

  writer.writeSubHeading('Impact and Consultation');
  writer.writeKeyValue('Impacts any other faculties', yesNoText(info.impactAndConsultation?.facultyImpact));
  writer.writeKeyValue(
    'Faculty consultation details',
    info.impactAndConsultation?.facultyConsultationDetails
  );
  writer.writeKeyValue('Consulted with students', yesNoText(info.impactAndConsultation?.studentConsulted));
  writer.writeKeyValue(
    'Student consultation details',
    info.impactAndConsultation?.studentConsultationDetails
  );
  writer.writeKeyValue(
    'EDI and decolonization considerations',
    info.impactAndConsultation?.equityDiversityInclusion
  );

  writer.writeSubHeading('Indigenous Content and Consultation');
  writer.writeKeyValue(
    'Contains Indigenous content',
    yesNoText(info.indigenousContentAndConsultation?.containsIndigenousContent)
  );
  writer.writeKeyValue('IEAC contacted', yesNoText(info.indigenousContentAndConsultation?.ieacContacted));
  writer.writeKeyValue('If yes, when', info.indigenousContentAndConsultation?.ieacContactedWhen);
  writer.writeKeyValue('IEAC advice and incorporation', formatTextUpload(info.indigenousContentAndConsultation?.ieacAdvice));
  writer.writeKeyValue(
    'IEAC asked to return proposal',
    yesNoText(info.indigenousContentAndConsultation?.ieacReturnForReview)
  );
  writer.writeKeyValue(
    'IEAC review completed',
    yesNoText(info.indigenousContentAndConsultation?.ieacReviewCompleted)
  );
  writer.writeKeyValue(
    'Other impacted-area consultations completed',
    yesNoText(info.indigenousContentAndConsultation?.otherConsultationCompleted)
  );
  writer.writeKeyValue(
    'Other consultation details',
    info.indigenousContentAndConsultation?.otherConsultationDetails
  );
  writer.writeKeyValue(
    'Change involves co-op',
    yesNoText(info.indigenousContentAndConsultation?.changeInvolvesCoop)
  );
  writer.writeKeyValue(
    'Co-op consultation acknowledgment',
    yesNoText(info.indigenousContentAndConsultation?.coopConsulted)
  );
};

const addCurriculumOverview = (writer, program, includeHeading = true) => {
  if (includeHeading) {
    writer.writeSubHeading('Curriculum Overview');
  }
  const groups = buildCurriculumOverviewGroups(program);
  if (groups.length === 0) {
    writer.writeParagraph('No curriculum courses defined.');
    return;
  }

  groups.forEach((group) => {
    writer.writeParagraph(`${String(group.label || '').toUpperCase()} (${group.courses.length} courses)`, {
      bold: true
    });
    if (group.subgroups?.length) {
      group.subgroups.forEach((subgroup) => {
        writer.writeParagraph(`${subgroup.label} (${subgroup.courses.length})`, { indent: 3, bold: true });
        if (subgroup.courses.length === 0) {
          writer.writeParagraph('No courses in this sub-group.', { indent: 6 });
          return;
        }
        subgroup.courses.forEach((course) => {
          writer.writeParagraph(`${course.code} - ${course.title} (${course.credits || 0} cr)`, { indent: 6 });
        });
      });
    } else if (group.courses.length === 0) {
      writer.writeParagraph('No courses in this group.', { indent: 3 });
    } else {
      group.courses.forEach((course) => {
        writer.writeParagraph(`${course.code} - ${course.title} (${course.credits || 0} cr)`, { indent: 3 });
      });
    }
  });
};

const addCurriculumMap = (writer, program, includeHeading = true) => {
  if (includeHeading) {
    writer.writeSubHeading('Curriculum Map');
  }
  const mapColumnCount = getCurriculumMapColumnCount(program);

  (program?.semesters || []).forEach((semester) => {
    writer.writeParagraph(semester.name, { bold: true });
    Array.from({ length: mapColumnCount }).forEach((_, index) => {
      const course = semester.courses?.[index] || null;
      if (!course) {
        writer.writeParagraph(`${index + 1}. [Empty]`, { indent: 3 });
        return;
      }
      const flags = [];
      if (course.isCore) flags.push('CORE');
      if (course.isNewCourse) flags.push('NEW');
      if (course.isSpecializationPlaceholder || course.code === 'SPEC') flags.push('SPEC');
      const flagText = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
      writer.writeParagraph(
        `${index + 1}. ${course.code} - ${course.title} (${Number(course.credits || 0)} cr)${flagText}`,
        { indent: 3 }
      );
    });
    writer.writeDivider();
  });
};

export const exportProgramPdf = (program) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const writer = createPdfWriter(doc);
  const info = program?.programInfo || {};
  const shortName = toDisplayText(info.programShortName);

  writer.writeHeading('Major Curriculum Modification');
  writer.writeKeyValue('Program', program?.name);
  writer.writeKeyValue('Program Short Name', shortName);
  writer.writeKeyValue('Type', program?.type);
  writer.writeKeyValue('Faculty', program?.faculty);
  writer.writeKeyValue('Lead', program?.lead);
  writer.writeKeyValue('Status', program?.status);
  writer.writeKeyValue('Version', info.version);
  writer.writeKeyValue('Date', info.date);
  writer.writeDivider();

  if (info.mode === 'derived' || program?.parentProgramId || program?.parentProgram) {
    addDerivedProgramInfo(writer, info, program);
  } else {
    addBaseProgramInfo(writer, info);
  }

  startNewPage(writer, 'portrait');
  writer.writeHeading('Curriculum Overview Diagram');
  addCurriculumOverviewDiagram(writer, program);

  startNewPage(writer, 'landscape');
  writer.writeHeading('Curriculum Map Diagram');
  addCurriculumMapDiagram(writer, program);

  startNewPage(writer, 'portrait');
  writer.writeSubHeading('Curriculum Overview (Text Summary)');
  addCurriculumOverview(writer, program, false);

  startNewPage(writer, 'portrait');
  writer.writeSubHeading('Curriculum Map (Text Summary)');
  addCurriculumMap(writer, program, false);

  const safeProgramName = String(program?.name || 'program')
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  const version = Math.max(1, Number(info.version) || 1);
  doc.save(`${safeProgramName || 'program'}_major_curriculum_modification_v${version}.pdf`);
};

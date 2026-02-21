import React, { useEffect, useMemo, useState } from 'react';
import { FACULTY_OPTIONS } from '../data';
import { createDefaultProgramInfo } from '../programInfo';
import { Card } from '../ui';

const UNDERGRAD_MODIFICATION_OPTIONS = [
  { key: 'changeMinorName', label: 'Change to name of Minor' },
  { key: 'changeProgramName', label: 'Change to name of Program' },
  { key: 'changeSpecializationName', label: 'Change to name of specialization' },
  { key: 'newMinor', label: 'New Minor' },
  { key: 'newPathway', label: 'New Pathway' },
  { key: 'newSpecialization', label: 'New Specialization' },
  { key: 'other', label: 'Other' }
];

const GRAD_MODIFICATION_OPTIONS = [
  { key: 'changeFieldName', label: 'Change to name of field' },
  { key: 'changeProgramName', label: 'Change to name of Program' },
  { key: 'newField', label: 'New Field' },
  { key: 'newType1GraduateDiploma', label: 'New Type 1 Graduate Diploma' },
  { key: 'other', label: 'Other' }
];

const TextAreaField = ({ label, value, onChange, disabled, rows = 4, placeholder = '' }) => (
  <div>
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">{label}</label>
    <textarea
      rows={rows}
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
    />
  </div>
);

const YesNoField = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">{label}</label>
    <div className="flex items-center gap-6">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="radio"
          checked={value === 'yes'}
          onChange={() => onChange('yes')}
          disabled={disabled}
        />
        Yes
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="radio"
          checked={value === 'no'}
          onChange={() => onChange('no')}
          disabled={disabled}
        />
        No
      </label>
    </div>
  </div>
);

const FACULTY_LABEL_OPTIONS = FACULTY_OPTIONS.map((faculty) => `${faculty.code} (${faculty.name})`);

export function DerivedProgramInfoTab({
  selectedProgram,
  parentProgram,
  updateProgramInfo,
  onExportProgram
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(createDefaultProgramInfo(selectedProgram, parentProgram));
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    setDraft(selectedProgram?.programInfo || createDefaultProgramInfo(selectedProgram, parentProgram));
    setIsEditing(false);
    setActiveSection('all');
  }, [selectedProgram?.id, selectedProgram?.programInfo, parentProgram?.id]);

  const newCoursesInMap = useMemo(() => {
    const rows = [];
    (selectedProgram?.semesters || []).forEach((semester) => {
      (semester.courses || []).forEach((course, index) => {
        if (!course || !course.isNewCourse) {
          return;
        }
        rows.push({
          key: `${semester.id}_${index}_${course.code}`,
          code: course.code,
          title: course.title,
          credits: Number(course.credits || 0),
          semesterName: semester.name
        });
      });
    });
    return rows;
  }, [selectedProgram]);

  useEffect(() => {
    if (!newCoursesInMap.length) {
      return;
    }
    setDraft((current) => {
      if (current.newCourseAssociated === 'yes') {
        return current;
      }
      return {
        ...current,
        newCourseAssociated: 'yes'
      };
    });
  }, [newCoursesInMap.length]);

  const setTopLevelField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setNestedField = (group, key, value) => {
    setDraft((current) => ({
      ...current,
      [group]: {
        ...(current[group] || {}),
        [key]: value
      }
    }));
  };

  const toggleModificationOption = (studyLevel, key) => {
    setDraft((current) => ({
      ...current,
      majorModificationType: {
        ...(current.majorModificationType || {}),
        [studyLevel]: {
          ...(current.majorModificationType?.[studyLevel] || {}),
          [key]: !current.majorModificationType?.[studyLevel]?.[key]
        }
      }
    }));
  };

  const handleSave = () => {
    updateProgramInfo(selectedProgram.id, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(selectedProgram?.programInfo || createDefaultProgramInfo(selectedProgram, parentProgram));
    setIsEditing(false);
  };

  const studyLevel = draft.selectionOption === 'Graduate' ? 'Graduate' : 'Undergraduate';
  const isGraduate = studyLevel === 'Graduate';
  const modificationOptions = isGraduate ? GRAD_MODIFICATION_OPTIONS : UNDERGRAD_MODIFICATION_OPTIONS;
  const sectionItems = [
    { id: 'all', label: 'ALL' },
    { id: 'derived-program-info-setup', label: 'Setup' },
    { id: 'derived-program-info-summary', label: 'Summary' },
    { id: 'derived-program-info-description', label: 'Description' },
    { id: 'derived-program-info-structure', label: 'Structure' },
    { id: 'derived-program-info-resources', label: 'Resources' },
    { id: 'derived-program-info-transition', label: 'Transition' },
    { id: 'derived-program-info-online', label: 'Online' },
    { id: 'derived-program-info-impact', label: 'Impact' },
    { id: 'derived-program-info-indigenous', label: 'Indigenous' }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Program Info</h3>
            <p className="text-sm text-slate-600">Derived program documentation workflow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm font-medium"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => onExportProgram(selectedProgram.id)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-sm font-medium"
            >
              Export / Submit
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-slate-900 border-slate-800">
        <div className="flex flex-wrap gap-2">
          {sectionItems.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-indigo-500 text-white border-indigo-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </Card>

      {(activeSection === 'all' || activeSection === 'derived-program-info-setup') && (
      <Card id="derived-program-info-setup" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Derived Program Setup</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Faculty</label>
            <select
              value={draft.faculty || ''}
              onChange={(event) => setTopLevelField('faculty', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="">Select Faculty</option>
              {FACULTY_LABEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {draft.faculty && !FACULTY_LABEL_OPTIONS.includes(draft.faculty) && (
                <option value={draft.faculty}>{draft.faculty}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Selection Option</label>
            <select
              value={studyLevel}
              onChange={(event) => setTopLevelField('selectionOption', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
            Major Modification Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 border border-slate-200 rounded bg-slate-50">
            {modificationOptions.map((option) => (
              <label key={option.key} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    !!draft.majorModificationType?.[isGraduate ? 'graduate' : 'undergraduate']?.[option.key]
                  }
                  onChange={() => toggleModificationOption(isGraduate ? 'graduate' : 'undergraduate', option.key)}
                  disabled={!isEditing}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-summary') && (
      <Card id="derived-program-info-summary" className="p-4 space-y-4">
        <TextAreaField
          label="Summary of the proposed change(s)"
          value={draft.summaryOfProposedChanges}
          onChange={(value) => setTopLevelField('summaryOfProposedChanges', value)}
          disabled={!isEditing}
          rows={5}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <YesNoField
            label="Is there a change to total credit hours in the program?"
            value={draft.changeToTotalCreditHours}
            onChange={(value) => setTopLevelField('changeToTotalCreditHours', value)}
            disabled={!isEditing}
          />
          <YesNoField
            label="Is a new course associated with this proposal?"
            value={draft.newCourseAssociated}
            onChange={(value) => setTopLevelField('newCourseAssociated', value)}
            disabled={!isEditing}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
            List New Courses (Auto-populated from map courses marked NEW)
          </label>
          {newCoursesInMap.length === 0 ? (
            <div className="text-sm text-slate-500 p-3 border border-slate-200 rounded bg-slate-50">
              No courses are currently marked as NEW in the curriculum map.
            </div>
          ) : (
            <div className="space-y-2">
              {newCoursesInMap.map((course) => (
                <div
                  key={course.key}
                  className="px-3 py-2 rounded border border-amber-200 bg-amber-50 text-sm flex justify-between gap-3"
                >
                  <span className="font-medium text-slate-900">
                    {course.code}: {course.title}
                  </span>
                  <span className="text-slate-600 text-xs whitespace-nowrap">
                    {course.credits} cr • {course.semesterName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Calendar Start Date
            </label>
            <input
              type="date"
              value={draft.calendarStartDate || ''}
              onChange={(event) => setTopLevelField('calendarStartDate', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Registration Start Date
            </label>
            <input
              type="date"
              value={draft.registrationStartDate || ''}
              onChange={(event) => setTopLevelField('registrationStartDate', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
        </div>

        <YesNoField
          label="Are you providing any additional supporting documents?"
          value={draft.additionalSupportingDocuments}
          onChange={(value) => setTopLevelField('additionalSupportingDocuments', value)}
          disabled={!isEditing}
        />
        <TextAreaField
          label="Specify additional supporting documents"
          value={draft.additionalSupportingDocumentsDetails}
          onChange={(value) => setTopLevelField('additionalSupportingDocumentsDetails', value)}
          disabled={!isEditing || draft.additionalSupportingDocuments !== 'yes'}
          rows={3}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-description') && (
      <Card id="derived-program-info-description" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Program Description</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Program Name</label>
            <input
              value={draft.programName || ''}
              onChange={(event) => setTopLevelField('programName', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Program Short Name</label>
            <input
              value={draft.programShortName || ''}
              onChange={(event) => setTopLevelField('programShortName', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
              placeholder="e.g. GAME-MIN"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Program and Degree Type
            </label>
            <input
              value={draft.programAndDegreeType || ''}
              onChange={(event) => setTopLevelField('programAndDegreeType', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
        </div>
        <TextAreaField
          label="Program Description (for Calendar)"
          value={draft.programDescriptionForCalendar}
          onChange={(value) => setTopLevelField('programDescriptionForCalendar', value)}
          disabled={!isEditing}
          rows={5}
        />
        <TextAreaField
          label="Admission Requirements"
          value={draft.admissionRequirements}
          onChange={(value) => setTopLevelField('admissionRequirements', value)}
          disabled={!isEditing}
          rows={4}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-structure') && (
      <Card id="derived-program-info-structure" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Program Structure and Rationale</h4>
        <TextAreaField
          label="Program Structure"
          value={draft.programStructure}
          onChange={(value) => setTopLevelField('programStructure', value)}
          disabled={!isEditing}
          rows={4}
        />
        <TextAreaField
          label="Program Learning Outcomes"
          value={draft.programLearningOutcomes}
          onChange={(value) => setTopLevelField('programLearningOutcomes', value)}
          disabled={!isEditing}
          rows={4}
        />
        <TextAreaField
          label="Brief background on the existing program"
          value={draft.briefBackgroundExistingProgram}
          onChange={(value) => setTopLevelField('briefBackgroundExistingProgram', value)}
          disabled={!isEditing}
          rows={4}
        />
        <TextAreaField
          label="Fit with mission, mandate, strategic plans, and broader offerings"
          value={draft.fitWithMissionAndMandate}
          onChange={(value) => setTopLevelField('fitWithMissionAndMandate', value)}
          disabled={!isEditing}
          rows={5}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-resources') && (
      <Card id="derived-program-info-resources" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Resource Requirements</h4>
        <TextAreaField
          label="Faculty Members"
          value={draft.resourceRequirements?.facultyMembers}
          onChange={(value) => setNestedField('resourceRequirements', 'facultyMembers', value)}
          disabled={!isEditing}
          rows={3}
        />
        <TextAreaField
          label="Additional academic and non-academic human resources"
          value={draft.resourceRequirements?.additionalHumanResources}
          onChange={(value) => setNestedField('resourceRequirements', 'additionalHumanResources', value)}
          disabled={!isEditing}
          rows={3}
        />
        <TextAreaField
          label="Physical resource requirements"
          value={draft.resourceRequirements?.physicalResourceRequirements}
          onChange={(value) => setNestedField('resourceRequirements', 'physicalResourceRequirements', value)}
          disabled={!isEditing}
          rows={3}
        />
        <TextAreaField
          label="Statement of funding requirements"
          value={draft.resourceRequirements?.fundingRequirements}
          onChange={(value) => setNestedField('resourceRequirements', 'fundingRequirements', value)}
          disabled={!isEditing}
          rows={4}
        />
        <TextAreaField
          label="Statement of resource/funding availability"
          value={draft.resourceRequirements?.resourceFundingAvailability}
          onChange={(value) => setNestedField('resourceRequirements', 'resourceFundingAvailability', value)}
          disabled={!isEditing}
          rows={4}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-transition') && (
      <Card id="derived-program-info-transition" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Transition and Communication Plan</h4>
        <TextAreaField
          label="Transition Plan for both new and current students"
          value={draft.transitionAndCommunication?.transitionPlan}
          onChange={(value) => setNestedField('transitionAndCommunication', 'transitionPlan', value)}
          disabled={!isEditing}
          rows={5}
        />
        <TextAreaField
          label="Communication plan for both new and current students"
          value={draft.transitionAndCommunication?.communicationPlan}
          onChange={(value) => setNestedField('transitionAndCommunication', 'communicationPlan', value)}
          disabled={!isEditing}
          rows={5}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-online') && (
      <Card id="derived-program-info-online" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Converting to Online Options</h4>
        <YesNoField
          label="Does this proposal contain any intended conversion of program components to online options?"
          value={draft.convertingToOnline?.hasOnlineConversion}
          onChange={(value) => setNestedField('convertingToOnline', 'hasOnlineConversion', value)}
          disabled={!isEditing}
        />
        {draft.convertingToOnline?.hasOnlineConversion === 'yes' && (
          <div className="space-y-4">
            <TextAreaField
              label="Adequacy of technological platform"
              value={draft.convertingToOnline?.adequacyTechnologicalPlatform}
              onChange={(value) => setNestedField('convertingToOnline', 'adequacyTechnologicalPlatform', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Maintenance of and/or changes to quality of education"
              value={draft.convertingToOnline?.qualityOfEducation}
              onChange={(value) => setNestedField('convertingToOnline', 'qualityOfEducation', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Maintenance of and/or changes to program objectives"
              value={draft.convertingToOnline?.programObjectives}
              onChange={(value) => setNestedField('convertingToOnline', 'programObjectives', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Maintenance of and/or changes to program-level learning outcomes"
              value={draft.convertingToOnline?.programLearningOutcomes}
              onChange={(value) => setNestedField('convertingToOnline', 'programLearningOutcomes', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Support services and training for teaching staff"
              value={draft.convertingToOnline?.supportForTeachingStaff}
              onChange={(value) => setNestedField('convertingToOnline', 'supportForTeachingStaff', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Support for students in the new learning environment"
              value={draft.convertingToOnline?.supportForStudents}
              onChange={(value) => setNestedField('convertingToOnline', 'supportForStudents', value)}
              disabled={!isEditing}
              rows={4}
            />
            <TextAreaField
              label="Other"
              value={draft.convertingToOnline?.other}
              onChange={(value) => setNestedField('convertingToOnline', 'other', value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>
        )}
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-impact') && (
      <Card id="derived-program-info-impact" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Impact and Consultation</h4>
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
          Consultation is central to governance at Ontario Tech. Faculties are required to consult with all areas
          impacted by this change, and the home faculty dean is responsible for all consultation decisions in this
          section of the form.
        </div>
        <YesNoField
          label="Will this change impact any other faculties?"
          value={draft.impactAndConsultation?.facultyImpact}
          onChange={(value) => setNestedField('impactAndConsultation', 'facultyImpact', value)}
          disabled={!isEditing}
        />
        <TextAreaField
          label="If yes, explain and outline the faculty consultation process in detail"
          value={draft.impactAndConsultation?.facultyConsultationDetails}
          onChange={(value) => setNestedField('impactAndConsultation', 'facultyConsultationDetails', value)}
          disabled={!isEditing || draft.impactAndConsultation?.facultyImpact !== 'yes'}
          rows={4}
        />
        <YesNoField
          label="Have you consulted with current/prospective students?"
          value={draft.impactAndConsultation?.studentConsulted}
          onChange={(value) => setNestedField('impactAndConsultation', 'studentConsulted', value)}
          disabled={!isEditing}
        />
        <TextAreaField
          label="How have current/prospective students been consulted?"
          value={draft.impactAndConsultation?.studentConsultationDetails}
          onChange={(value) => setNestedField('impactAndConsultation', 'studentConsultationDetails', value)}
          disabled={!isEditing || draft.impactAndConsultation?.studentConsulted !== 'yes'}
          rows={4}
        />
        <TextAreaField
          label="What considerations have been made for Equity, Diversity, Inclusion and Decolonization?"
          value={draft.impactAndConsultation?.equityDiversityInclusion}
          onChange={(value) => setNestedField('impactAndConsultation', 'equityDiversityInclusion', value)}
          disabled={!isEditing}
          rows={4}
        />
      </Card>
      )}

      {(activeSection === 'all' || activeSection === 'derived-program-info-indigenous') && (
      <Card id="derived-program-info-indigenous" className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Indigenous Content and Consultation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Does this specialization contain any Indigenous content?
            </label>
            <select
              value={draft.indigenousContentAndConsultation?.containsIndigenousContent || 'maybe'}
              onChange={(event) =>
                setNestedField('indigenousContentAndConsultation', 'containsIndigenousContent', event.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Has the IEAC been contacted?
            </label>
            <select
              value={draft.indigenousContentAndConsultation?.ieacContacted || 'no'}
              onChange={(event) =>
                setNestedField('indigenousContentAndConsultation', 'ieacContacted', event.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <TextAreaField
          label="If yes, when?"
          value={draft.indigenousContentAndConsultation?.ieacContactedWhen}
          onChange={(value) => setNestedField('indigenousContentAndConsultation', 'ieacContactedWhen', value)}
          disabled={!isEditing || draft.indigenousContentAndConsultation?.ieacContacted !== 'yes'}
          rows={2}
        />

        <TextAreaField
          label="Advice received from IEAC and how it has been included in the proposal"
          value={draft.indigenousContentAndConsultation?.ieacAdvice?.text}
          onChange={(value) =>
            setNestedField('indigenousContentAndConsultation', 'ieacAdvice', {
              ...(draft.indigenousContentAndConsultation?.ieacAdvice || {}),
              text: value
            })
          }
          disabled={!isEditing}
          rows={4}
        />
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="application/pdf"
            disabled={!isEditing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setNestedField('indigenousContentAndConsultation', 'ieacAdvice', {
                  ...(draft.indigenousContentAndConsultation?.ieacAdvice || {}),
                  pdfName: file.name
                });
              }
            }}
            className="text-xs"
          />
          <span className="text-xs text-slate-500">
            {draft.indigenousContentAndConsultation?.ieacAdvice?.pdfName
              ? `Attached: ${draft.indigenousContentAndConsultation.ieacAdvice.pdfName}`
              : 'No PDF attached'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Did the IEAC ask you to return the proposal for review?
            </label>
            <select
              value={draft.indigenousContentAndConsultation?.ieacReturnForReview || 'na'}
              onChange={(event) =>
                setNestedField('indigenousContentAndConsultation', 'ieacReturnForReview', event.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="na">N/A</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              If yes, have they completed their review?
            </label>
            <select
              value={draft.indigenousContentAndConsultation?.ieacReviewCompleted || 'na'}
              onChange={(event) =>
                setNestedField('indigenousContentAndConsultation', 'ieacReviewCompleted', event.target.value)
              }
              disabled={!isEditing || draft.indigenousContentAndConsultation?.ieacReturnForReview !== 'yes'}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="na">N/A</option>
            </select>
          </div>
        </div>

        <YesNoField
          label="Have you consulted with students, SGPS, Registrar, Student Life, Library, and/or other impacted areas?"
          value={draft.indigenousContentAndConsultation?.otherConsultationCompleted}
          onChange={(value) => setNestedField('indigenousContentAndConsultation', 'otherConsultationCompleted', value)}
          disabled={!isEditing}
        />
        <TextAreaField
          label="If yes, explain and outline the consultation process in detail"
          value={draft.indigenousContentAndConsultation?.otherConsultationDetails}
          onChange={(value) => setNestedField('indigenousContentAndConsultation', 'otherConsultationDetails', value)}
          disabled={!isEditing || draft.indigenousContentAndConsultation?.otherConsultationCompleted !== 'yes'}
          rows={4}
        />

        <YesNoField
          label="Does this change involve Co-op?"
          value={draft.indigenousContentAndConsultation?.changeInvolvesCoop}
          onChange={(value) => setNestedField('indigenousContentAndConsultation', 'changeInvolvesCoop', value)}
          disabled={!isEditing}
        />
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Co-op consultation acknowledgment
          </label>
          <select
            value={draft.indigenousContentAndConsultation?.coopConsulted || 'no'}
            onChange={(event) => setNestedField('indigenousContentAndConsultation', 'coopConsulted', event.target.value)}
            disabled={!isEditing || draft.indigenousContentAndConsultation?.changeInvolvesCoop !== 'yes'}
            className="w-full md:w-80 px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
          >
            <option value="yes">YES we have consulted</option>
            <option value="no">NO we have not consulted</option>
          </select>
        </div>
      </Card>
      )}
    </div>
  );
}

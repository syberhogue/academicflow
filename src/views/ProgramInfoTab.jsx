import React, { useEffect, useMemo, useState } from 'react';
import { FACULTY_OPTIONS } from '../data';
import { buildAcademicYearColumns, createDefaultProgramInfo, getTodayIsoDate } from '../programInfo';
import { Card } from '../ui';

const MAX_BRIEF_DESC = 1000;
const MAX_ABSTRACT = 1000;

const TextUploadSection = ({
  id,
  title,
  instructions,
  value,
  onTextChange,
  onPdfSelect,
  disabled,
  maxLength
}) => (
  <Card className="p-4">
    <h4 className="text-sm font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-xs text-slate-600 whitespace-pre-line mb-3">{instructions}</p>
    <textarea
      value={value.text || ''}
      onChange={(event) => onTextChange(event.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      rows={6}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
      placeholder="Enter narrative content..."
    />
    {maxLength && (
      <div className="text-[11px] text-slate-500 mt-1">
        {(value.text || '').length}/{maxLength}
      </div>
    )}
    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
      <input
        id={id}
        type="file"
        accept="application/pdf"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onPdfSelect(file.name);
          }
        }}
        className="text-xs"
      />
      <span className="text-xs text-slate-500">
        {value.pdfName ? `Attached: ${value.pdfName}` : 'No PDF attached'}
      </span>
    </div>
  </Card>
);

export function ProgramInfoTab({ selectedProgram, updateProgramInfo, onExportProgram }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(createDefaultProgramInfo(selectedProgram));

  useEffect(() => {
    setDraft(selectedProgram?.programInfo || createDefaultProgramInfo(selectedProgram));
    setIsEditing(false);
  }, [selectedProgram?.id, selectedProgram?.programInfo]);

  const academicYearColumns = useMemo(
    () => buildAcademicYearColumns(draft.enrolment?.startAcademicYear),
    [draft.enrolment?.startAcademicYear]
  );

  const enrolmentTotals = useMemo(() => {
    const matrix = draft.enrolment?.projections || [];
    return academicYearColumns.map((_, columnIndex) =>
      matrix.reduce((total, row) => total + (Number(row?.[columnIndex]) || 0), 0)
    );
  }, [draft.enrolment?.projections, academicYearColumns]);

  const setTopLevelField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setNestedTextUpload = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { text: '', pdfName: '' }),
        ...value
      }
    }));
  };

  const updateEnrolmentProjection = (rowIndex, columnIndex, value) => {
    setDraft((current) => {
      const nextMatrix = (current.enrolment?.projections || []).map((row) => [...row]);
      if (!nextMatrix[rowIndex]) {
        nextMatrix[rowIndex] = Array.from({ length: academicYearColumns.length }).map(() => 0);
      }
      nextMatrix[rowIndex][columnIndex] = Math.max(0, Number(value) || 0);
      return {
        ...current,
        enrolment: {
          ...(current.enrolment || {}),
          projections: nextMatrix
        }
      };
    });
  };

  const toggleCollaboratingFaculty = (facultyCode) => {
    setDraft((current) => {
      const currentValues = current.collaboratingFaculties || [];
      const nextValues = currentValues.includes(facultyCode)
        ? currentValues.filter((value) => value !== facultyCode)
        : [...currentValues, facultyCode];
      return {
        ...current,
        collaboratingFaculties: nextValues
      };
    });
  };

  const handleSave = () => {
    updateProgramInfo(selectedProgram.id, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(selectedProgram?.programInfo || createDefaultProgramInfo(selectedProgram));
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Program Info</h3>
            <p className="text-sm text-slate-600">Documentation block for base program approval workflow.</p>
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

      <Card className="p-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Core Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Full name of Proposed Program
            </label>
            <input
              value={draft.fullName || ''}
              onChange={(event) => setTopLevelField('fullName', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Degree Designation</label>
              <input
                value={draft.degreeDesignation || ''}
                onChange={(event) => setTopLevelField('degreeDesignation', event.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                placeholder="e.g. Bachelor of IT"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Short Form</label>
              <input
                value={draft.degreeShortForm || ''}
                onChange={(event) => setTopLevelField('degreeShortForm', event.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                placeholder="e.g. BIT"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.costRecoveryProgram}
                onChange={(event) => setTopLevelField('costRecoveryProgram', event.target.checked)}
                disabled={!isEditing}
              />
              Cost Recovery Program
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.professionalProgram}
                onChange={(event) => setTopLevelField('professionalProgram', event.target.checked)}
                disabled={!isEditing}
              />
              Professional Program
            </label>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Collaborating Faculties</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-slate-200 rounded bg-slate-50">
              {FACULTY_OPTIONS.map((faculty) => (
                <label key={faculty.code} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(draft.collaboratingFaculties || []).includes(faculty.code)}
                    onChange={() => toggleCollaboratingFaculty(faculty.code)}
                    disabled={!isEditing}
                  />
                  {faculty.code} ({faculty.name})
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Collaborating Institution(s)</label>
            <input
              value={draft.collaboratingInstitutions || ''}
              onChange={(event) => setTopLevelField('collaboratingInstitutions', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Program Delivery Location</label>
            <input
              value={draft.deliveryLocation || ''}
              onChange={(event) => setTopLevelField('deliveryLocation', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Program Proponent</label>
              <input
                value={draft.proponentName || ''}
                onChange={(event) => setTopLevelField('proponentName', event.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Contact Email</label>
              <input
                type="email"
                value={draft.proponentEmail || ''}
                onChange={(event) => setTopLevelField('proponentEmail', event.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Version</label>
              <input
                value={draft.version || 1}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Date</label>
              <input
                value={draft.date || getTodayIsoDate()}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Date of Academic Council Approval</label>
              <input
                type="date"
                value={draft.academicCouncilApprovalDate || ''}
                onChange={(event) => setTopLevelField('academicCouncilApprovalDate', event.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Brief Description of Proposed Program (1000 characters max)
            </label>
            <textarea
              rows={4}
              value={draft.briefDescription || ''}
              maxLength={MAX_BRIEF_DESC}
              onChange={(event) => setTopLevelField('briefDescription', event.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              {(draft.briefDescription || '').length}/{MAX_BRIEF_DESC}
            </div>
          </div>
        </div>
      </Card>

      <TextUploadSection
        id="section-abstract-upload"
        title="1. Program Abstract"
        instructions="Please provide a brief overview of the proposed program for external/public sharing in 1000 characters or less. Include purpose, outcomes, program components, and delivery context where relevant."
        value={draft.abstract || { text: '', pdfName: '' }}
        onTextChange={(value) => setNestedTextUpload('abstract', { text: value })}
        onPdfSelect={(value) => setNestedTextUpload('abstract', { pdfName: value })}
        disabled={!isEditing}
        maxLength={MAX_ABSTRACT}
      />

      <TextUploadSection
        id="section-rationale-upload"
        title="2. Academic Rationale"
        instructions="Identify what is being proposed and why. Explain program objectives, nomenclature, delivery model, curriculum fit, and distinct/innovative components."
        value={draft.academicRationale || { text: '', pdfName: '' }}
        onTextChange={(value) => setNestedTextUpload('academicRationale', { text: value })}
        onPdfSelect={(value) => setNestedTextUpload('academicRationale', { pdfName: value })}
        disabled={!isEditing}
      />

      <TextUploadSection
        id="section-mission-upload"
        title="3. Mission / Vision / IARP / SMA Alignment"
        instructions="Detail consistency of the program with university mission/vision, faculty and university IARP priorities, sector mandate, and strategic mandate agreement areas of strength."
        value={draft.missionAlignment || { text: '', pdfName: '' }}
        onTextChange={(value) => setNestedTextUpload('missionAlignment', { text: value })}
        onPdfSelect={(value) => setNestedTextUpload('missionAlignment', { pdfName: value })}
        disabled={!isEditing}
      />

      <Card className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">4. Need, Demand, and Duplication</h4>
        <TextUploadSection
          id="section-need-a-upload"
          title="4(A) Need and Demand Evidence"
          instructions="Provide evidence of student interest, societal need, labour market alignment, and relevant employer/sector support."
          value={draft.needDemandA || { text: '', pdfName: '' }}
          onTextChange={(value) => setNestedTextUpload('needDemandA', { text: value })}
          onPdfSelect={(value) => setNestedTextUpload('needDemandA', { pdfName: value })}
          disabled={!isEditing}
        />
        <TextUploadSection
          id="section-need-b-upload"
          title="4(B) Distinctiveness vs Internal Programs"
          instructions="Describe how this program is distinct from other Ontario Tech programs and any anticipated enrolment impacts."
          value={draft.needDemandB || { text: '', pdfName: '' }}
          onTextChange={(value) => setNestedTextUpload('needDemandB', { text: value })}
          onPdfSelect={(value) => setNestedTextUpload('needDemandB', { pdfName: value })}
          disabled={!isEditing}
        />
        <Card className="p-4">
          <h5 className="text-sm font-semibold text-slate-900 mb-2">4(C) New Area of Study</h5>
          <div className="flex items-center gap-6 mb-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!!draft.needDemandCNewArea}
                onChange={() => setTopLevelField('needDemandCNewArea', true)}
                disabled={!isEditing}
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!draft.needDemandCNewArea}
                onChange={() => setTopLevelField('needDemandCNewArea', false)}
                disabled={!isEditing}
              />
              No
            </label>
          </div>
          <textarea
            rows={4}
            value={draft.needDemandCExplain?.text || ''}
            onChange={(event) => setNestedTextUpload('needDemandCExplain', { text: event.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            placeholder="Please explain..."
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              disabled={!isEditing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setNestedTextUpload('needDemandCExplain', { pdfName: file.name });
                }
              }}
              className="text-xs"
            />
            <span className="text-xs text-slate-500">
              {draft.needDemandCExplain?.pdfName ? `Attached: ${draft.needDemandCExplain.pdfName}` : 'No PDF attached'}
            </span>
          </div>
        </Card>
        <TextUploadSection
          id="section-need-d-upload"
          title="4(D) External Comparator Programs"
          instructions="Identify similar/complementary programs in Ontario and Canada and summarize duplication rationale with appendix references."
          value={draft.needDemandD || { text: '', pdfName: '' }}
          onTextChange={(value) => setNestedTextUpload('needDemandD', { text: value })}
          onPdfSelect={(value) => setNestedTextUpload('needDemandD', { pdfName: value })}
          disabled={!isEditing}
        />
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-bold text-slate-900 mb-2">5. Enrolment Information</h4>
        <p className="text-xs text-slate-600 mb-3">
          Complete Table 1 with projected enrolment. Set the first academic year; subsequent years auto-increment.
        </p>
        <div className="mb-3 w-44">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">First Academic Year</label>
          <input
            value={draft.enrolment?.startAcademicYear || '2025/26'}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                enrolment: {
                  ...(current.enrolment || {}),
                  startAcademicYear: event.target.value
                }
              }))
            }
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm disabled:bg-slate-100"
            placeholder="e.g. 2025/26"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2 border-b border-slate-200">Level of Study</th>
                {academicYearColumns.map((column) => (
                  <th key={column} className="text-center p-2 border-b border-slate-200">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`level_${rowIndex}`} className="border-b border-slate-100">
                  <td className="p-2 font-medium text-slate-700">Year {rowIndex + 1}</td>
                  {academicYearColumns.map((_, colIndex) => (
                    <td key={`cell_${rowIndex}_${colIndex}`} className="p-1 text-center">
                      <input
                        type="number"
                        min={0}
                        value={draft.enrolment?.projections?.[rowIndex]?.[colIndex] ?? 0}
                        onChange={(event) => updateEnrolmentProjection(rowIndex, colIndex, event.target.value)}
                        disabled={!isEditing}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-center disabled:bg-slate-100"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-slate-50 border-b border-slate-200">
                <td className="p-2 font-bold text-slate-900">Total</td>
                {enrolmentTotals.map((total, index) => (
                  <td key={`total_${index}`} className="p-2 text-center font-semibold">{total}</td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium text-slate-700">Steady State (*)</td>
                {academicYearColumns.map((_, index) => (
                  <td key={`steady_${index}`} className="p-2 text-center">
                    <label className="inline-flex items-center justify-center gap-1">
                      <input
                        type="radio"
                        name="steady_state_year"
                        checked={draft.enrolment?.steadyStateYearIndex === index}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            enrolment: {
                              ...(current.enrolment || {}),
                              steadyStateYearIndex: index
                            }
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <span className="text-xs">*</span>
                    </label>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">6. Admission Requirements</h4>
        <TextUploadSection
          id="section-adm-a-upload"
          title="6(A) Formal Admission Requirements"
          instructions="Outline the admission requirements as they will appear in the Academic Calendar."
          value={draft.admissionA || { text: '', pdfName: '' }}
          onTextChange={(value) => setNestedTextUpload('admissionA', { text: value })}
          onPdfSelect={(value) => setNestedTextUpload('admissionA', { pdfName: value })}
          disabled={!isEditing}
        />
        <TextUploadSection
          id="section-adm-b-upload"
          title="6(B) Admission Rationale"
          instructions="Explain how admission requirements support program objectives, student success, and program learning outcomes."
          value={draft.admissionB || { text: '', pdfName: '' }}
          onTextChange={(value) => setNestedTextUpload('admissionB', { text: value })}
          onPdfSelect={(value) => setNestedTextUpload('admissionB', { pdfName: value })}
          disabled={!isEditing}
        />
      </Card>
    </div>
  );
}


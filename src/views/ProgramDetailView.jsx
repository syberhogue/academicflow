import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Check, Clock, FileText, Lock, Plus, Search, Users, X } from 'lucide-react';
import { PROGRAM_TYPES } from '../data';
import { Badge, Card, ProgressBar } from '../ui';

export function ProgramDetailView(props) {
  const {
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
    mapLastSavedAt,
    onCreateDerivedProgram,
    onDuplicateSpecialization,
    toggleCoreCourse,
    updateSpecializationBlocks,
    updateProgramName,
    updateElectiveSuggestionMaps
  } = props;
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clipboardCourse, setClipboardCourse] = useState(null);
  const [specializationSelectMode, setSpecializationSelectMode] = useState(false);
  const [selectedElectiveSlots, setSelectedElectiveSlots] = useState([]);
  const [newBlockChooseCount, setNewBlockChooseCount] = useState(2);
  const [modalDisciplineFilter, setModalDisciplineFilter] = useState('All');
  const [isEditingProgramName, setIsEditingProgramName] = useState(false);
  const [editedProgramName, setEditedProgramName] = useState('');
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
  const modalDisciplineOptions = useMemo(() => {
    const unique = new Set(
      (globalCourses || [])
        .map((course) => course.discipline || 'Uncategorized')
        .filter(Boolean)
    );
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [globalCourses]);
  const selectedElectiveSlotSet = useMemo(() => new Set(selectedElectiveSlots), [selectedElectiveSlots]);

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
      chooseCount: Math.max(1, Math.min(Number(newBlockChooseCount) || 1, selectedCourses.length)),
      courses: Array.from({ length: 6 }).map((_, i) => selectedCourses[i] || null)
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
    withUpdatedElectiveRows(electiveType, (rows) => [
      ...rows,
      {
        id: `elec_row_${Date.now()}`,
        name: `${electiveType} Row ${rows.length + 1}`,
        rowType: 'required',
        chooseCount: 1,
        courses: Array.from({ length: 6 }).map(() => null)
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
      courses: Array.from({ length: 6 }).map(() => null)
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
    if (!electiveModalSlot) {
      setModalDisciplineFilter('All');
    }
  }, [electiveModalSlot]);

  useEffect(() => {
    setIsEditingProgramName(false);
    setEditedProgramName(selectedProgram?.name || '');
  }, [selectedProgram?.id, selectedProgram?.name]);

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
                )}
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{selectedProgram.name}</h1>
            )}
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
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors shadow-sm">
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', icon: FileText, label: 'Overview & Milestones' },
            { id: 'map', icon: BookOpen, label: 'Curriculum Map' },
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
                      <span className="font-bold text-slate-900">{selectedProgram.facultyMembers.length}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                   <div>
                     <h2 className="text-lg font-bold text-slate-900 mb-1">Curriculum Map</h2>
                     <p className="text-sm font-medium text-slate-500">Maximum 6 courses per term. Drag and drop to reorganize.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                     <div className="flex-1 w-full sm:w-48">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                            <span>Total Credits</span>
                            <span className={currentCredits >= targetCredits ? 'text-emerald-600' : ''}>{currentCredits} / {targetCredits}</span>
                         </div>
                         <ProgressBar percentage={creditProgress} height="h-2" color={currentCredits >= targetCredits ? 'bg-emerald-500' : 'bg-indigo-500'} />
                      </div>
                      <div className="flex-1 w-full sm:w-48">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                            <span>Total Courses</span>
                            <span className={currentCourses >= targetCourses ? 'text-emerald-600' : ''}>{currentCourses} / {targetCourses}</span>
                         </div>
                         <ProgressBar percentage={courseProgress} height="h-2" color={currentCourses >= targetCourses ? 'bg-emerald-500' : 'bg-indigo-500'} />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {selectedProgram.type === 'Specialization' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSpecializationSelectMode((current) => !current);
                                setSelectedElectiveSlots([]);
                              }}
                              className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                specializationSelectMode
                                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {specializationSelectMode ? 'Selection Mode On' : 'Select Electives'}
                            </button>
                            <button
                              type="button"
                              onClick={addSelectedToSpecializationBlock}
                              disabled={selectedElectiveSlots.length === 0}
                              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Convert to SPEC (Elective)
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={copySelectedCourse}
                          disabled={!getCourseAtSlot(selectedSlot)}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={pasteToSelectedSlot}
                          disabled={!clipboardCourse || !selectedSlot}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Paste
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={onSaveMap}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
                        >
                          Save Map
                        </button>
                        {mapLastSavedAt && (
                          <span className="text-[11px] text-slate-500">
                            Last saved: {new Date(mapLastSavedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Select a slot, then use Copy/Paste buttons or `Ctrl/Cmd+C` and `Ctrl/Cmd+V`.
                </p>
                
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                  <div className="xl:col-span-3">
                    <div className="flex flex-col border border-slate-200 bg-slate-200 gap-[1px] rounded-xl overflow-hidden shadow-sm">
                  {selectedProgram.semesters.map((sem) => (
                    <div key={sem.id} className="flex flex-col md:flex-row bg-white">
                      <div className="w-full md:w-40 flex-shrink-0 p-4 bg-slate-50 flex items-center border-b md:border-b-0 md:border-r border-slate-200">
                        <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{sem.name}</span>
                      </div>
                      <div className="flex-1 p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const course = sem.courses[i];
                          const slotKey = `${sem.id}:${i}`;
                          const isElectiveSelected = selectedElectiveSlotSet.has(slotKey);
                          return (
                            <div 
                              key={`${sem.id}_${i}`}
                              onClick={() => {
                                setSelectedSlot({ semesterId: sem.id, index: i });
                                if (specializationSelectMode && isSelectableForSpecialization(course) && !course?.isSpecializationPlaceholder) {
                                  setSelectedElectiveSlots((current) =>
                                    current.includes(slotKey)
                                      ? current.filter((key) => key !== slotKey)
                                      : [...current, slotKey]
                                  );
                                }
                              }}
                              className={`h-24 rounded-lg relative transition-colors cursor-pointer ${selectedSlot?.semesterId === sem.id && selectedSlot?.index === i ? 'ring-2 ring-indigo-500' : ''} ${isElectiveSelected ? 'ring-2 ring-amber-500' : ''} ${
                                course
                                  ? isLockedCoreCourse(course)
                                    ? `${course.color || 'bg-slate-200'} shadow-sm border border-slate-400/60`
                                    : `${course.color || 'bg-slate-200'} shadow-sm`
                                  : 'bg-slate-50 border border-dashed border-slate-300'
                              }`}
                              onDragOver={(e) => { e.preventDefault(); }}
                              onDrop={(e) => {
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
                                  draggable={!isLockedCoreCourse(course)}
                                  onDragStart={(e) => {
                                    if (isLockedCoreCourse(course)) {
                                      e.preventDefault();
                                      return;
                                    }
                                    setDragPayload(e, { type: 'course', semesterId: sem.id, courseIndex: i });
                                  }}
                                  className={`w-full h-full flex flex-col items-center justify-center relative group ${isLockedCoreCourse(course) ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
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
                                  <div className="absolute top-1.5 left-1.5 text-[10px] font-bold text-black/50 bg-white/40 px-1.5 py-0.5 rounded shadow-sm">
                                      {course.credits !== undefined ? course.credits : 3}cr
                                  </div>
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
                  ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Compliance Sidebar</h3>
                      <div className="space-y-2 text-sm">
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
                      </div>
                    </Card>
                  </div>
                </div>

                {selectedProgram.type === 'Specialization' && (
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Specialization Curriculum Map</h3>
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
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={addEmptySpecializationRow}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50"
                        >
                          + Row
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={newBlockChooseCount}
                          onChange={(e) => setNewBlockChooseCount(Number(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    {specializationBlocks.length === 0 ? (
                      <p className="text-sm text-slate-500">No specialization rows yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {specializationBlocks.map((block) => (
                          <div key={block.id} className="border border-slate-200 rounded-lg p-3">
                            <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                              {Array.from({ length: 6 }).map((_, i) => {
                                const rowCourse = block.courses?.[i] || null;
                                return (
                                  <div
                                    key={`${block.id}_${i}`}
                                    className={`h-20 rounded-lg relative transition-colors ${rowCourse ? `${rowCourse.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const data = getDragPayload(e);
                                      if (data?.type === 'spec-course') {
                                        moveCourseAcrossSpecializationBlocks(data.blockId, data.courseIndex, block.id, i);
                                      }
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
                                          onClick={() => removeCourseFromSpecializationBlock(block.id, i)}
                                          className="absolute top-1 right-1 p-0.5 text-black/50 hover:text-black rounded"
                                        >
                                          <X size={12} />
                                        </button>
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
                    )}
                  </Card>
                )}

                {electiveTypesInMap.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Elective Suggestion Maps</h3>
                    <div className="space-y-4">
                      {electiveTypesInMap.map((electiveType) => {
                        const rows = electiveSuggestionMaps[electiveType] || [];
                        return (
                          <div key={electiveType} className="border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold text-slate-800">{electiveType}</div>
                              <button
                                type="button"
                                onClick={() => addEmptyElectiveSuggestionRow(electiveType)}
                                className="px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50"
                              >
                                + Row
                              </button>
                            </div>
                            {rows.length === 0 ? (
                              <p className="text-xs text-slate-500">No suggestion rows yet for this elective type.</p>
                            ) : (
                              <div className="space-y-3">
                                {rows.map((row) => (
                                  <div key={row.id} className="border border-slate-200 rounded p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
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
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                      {Array.from({ length: 6 }).map((_, i) => {
                                        const rowCourse = row.courses?.[i] || null;
                                        return (
                                          <div
                                            key={`${row.id}_${i}`}
                                            className={`h-20 rounded-lg relative transition-colors ${rowCourse ? `${rowCourse.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'}`}
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
                                                  onClick={() => removeCourseFromElectiveSuggestionRow(electiveType, row.id, i)}
                                                  className="absolute top-1 right-1 p-0.5 text-black/50 hover:text-black rounded"
                                                >
                                                  <X size={12} />
                                                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProgram.facultyMembers.map(faculty => (
                <Card key={faculty.id} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{faculty.name}</div>
                    <div className="text-sm text-slate-500">{faculty.role}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
}

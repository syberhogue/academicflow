import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, LayoutDashboard, Menu, Settings, Star, X } from 'lucide-react';
import { COURSE_COLORS, INITIAL_COURSES, INITIAL_DATA, getDefaultProgramColor } from './src/data';
import { getTodayIsoDate, normalizeProgramInfo } from './src/programInfo';
import { CreateProgramView } from './src/views/CreateProgramView';
import { DashboardView } from './src/views/DashboardView';
import { GlobalCoursesView } from './src/views/GlobalCoursesView';
import { ProgramDetailView } from './src/views/ProgramDetailView';
import {
  createGlobalCourseFromForm,
  createProgramFromForm,
  insertCourseInProgram,
  removeCourseFromProgram,
  swapCoursesAcrossSemesters
} from './src/programActions';

const PROGRAMS_STORAGE_KEY = 'academicflow.programs.v1';
const MAP_SAVED_AT_STORAGE_KEY = 'academicflow.mapSavedAt.v1';
const FAVORITE_PROGRAM_IDS_STORAGE_KEY = 'academicflow.favoriteProgramIds.v1';
const COURSE_CATEGORIES_STORAGE_KEY = 'academicflow.courseCategories.v1';
const DEFAULT_MAP_COLUMNS = 5;
const MAX_MAP_COLUMNS = 6;

const inferOccupiedMapColumns = (semesters = []) => {
  let maxOccupied = 0;
  semesters.forEach((semester) => {
    (semester.courses || []).forEach((course, index) => {
      if (course) {
        maxOccupied = Math.max(maxOccupied, index + 1);
      }
    });
  });
  return Math.min(MAX_MAP_COLUMNS, Math.max(DEFAULT_MAP_COLUMNS, maxOccupied));
};

const loadFavoriteProgramIds = () => {
  try {
    const storedFavoriteIds = localStorage.getItem(FAVORITE_PROGRAM_IDS_STORAGE_KEY);
    if (!storedFavoriteIds) {
      return new Set();
    }
    const parsedFavoriteIds = JSON.parse(storedFavoriteIds);
    if (!Array.isArray(parsedFavoriteIds)) {
      return new Set();
    }
    return new Set(parsedFavoriteIds);
  } catch (error) {
    console.error('Failed to load favorite program IDs from localStorage', error);
    return new Set();
  }
};

const normalizeProgramCollection = (rawPrograms = [], favoriteProgramIds = new Set()) => {
  const basePrograms = rawPrograms.map((program) => ({
    ...program,
    isFavorite: favoriteProgramIds.has(program.id) || !!program.isFavorite,
    color: program.color || getDefaultProgramColor(program.type, !!(program.parentProgramId || program.parentProgram)),
    mapColumns: Math.min(
      MAX_MAP_COLUMNS,
      Math.max(DEFAULT_MAP_COLUMNS, Number(program.mapColumns) || inferOccupiedMapColumns(program.semesters || []))
    )
  }));

  const byId = new Map(basePrograms.map((program) => [program.id, program]));
  const nameToId = new Map(basePrograms.map((program) => [program.name, program.id]));

  return basePrograms.map((program) => {
    const parentId =
      program.parentProgramId || (program.parentProgram ? nameToId.get(program.parentProgram) : null) || null;
    const parentProgram = parentId ? byId.get(parentId) || null : null;

    return {
      ...program,
      programInfo: normalizeProgramInfo(program, parentProgram)
    };
  });
};

const loadProgramsFromStorage = () => {
  try {
    const favoriteProgramIds = loadFavoriteProgramIds();
    const storedPrograms = localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (!storedPrograms) {
      return normalizeProgramCollection(INITIAL_DATA, favoriteProgramIds);
    }

    const parsedPrograms = JSON.parse(storedPrograms);
    if (!Array.isArray(parsedPrograms)) {
      return normalizeProgramCollection(INITIAL_DATA, favoriteProgramIds);
    }

    return normalizeProgramCollection(parsedPrograms, favoriteProgramIds);
  } catch (error) {
    console.error('Failed to load saved programs from localStorage', error);
    return normalizeProgramCollection(INITIAL_DATA, loadFavoriteProgramIds());
  }
};

const loadCourseCategoriesFromStorage = () => {
  try {
    const stored = localStorage.getItem(COURSE_CATEGORIES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Failed to load course categories from localStorage', error);
    return [];
  }
};

const loadSavedAtFromStorage = () => {
  try {
    return localStorage.getItem(MAP_SAVED_AT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load saved timestamp from localStorage', error);
    return null;
  }
};

export default function App() {
  const [programs, setPrograms] = useState(loadProgramsFromStorage);
  const [globalCourses, setGlobalCourses] = useState(INITIAL_COURSES);
  const [courseCategories, setCourseCategories] = useState(loadCourseCategoriesFromStorage);
  const [mapLastSavedAt, setMapLastSavedAt] = useState(loadSavedAtFromStorage);
  const [createSeed, setCreateSeed] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [electiveModalSlot, setElectiveModalSlot] = useState(null);
  const [placeholderCredits, setPlaceholderCredits] = useState(3);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const favoriteProgramIds = programs
        .filter((program) => !!program.isFavorite)
        .map((program) => program.id);
      localStorage.setItem(FAVORITE_PROGRAM_IDS_STORAGE_KEY, JSON.stringify(favoriteProgramIds));
    } catch (error) {
      console.error('Failed to persist favorite program IDs', error);
    }
  }, [programs]);

  useEffect(() => {
    try {
      localStorage.setItem(COURSE_CATEGORIES_STORAGE_KEY, JSON.stringify(courseCategories));
    } catch (error) {
      console.error('Failed to persist course categories', error);
    }
  }, [courseCategories]);

  useEffect(() => {
    const inferred = Array.from(
      new Set(
        globalCourses
          .map((course) => String(course.discipline || '').trim())
          .filter(Boolean)
      )
    );
    setCourseCategories((current) => {
      const merged = Array.from(new Set([...current, ...inferred])).sort((a, b) => a.localeCompare(b));
      if (merged.length === current.length && merged.every((value, index) => value === current[index])) {
        return current;
      }
      return merged;
    });
  }, [globalCourses]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId),
    [programs, selectedProgramId]
  );
  const favoritePrograms = useMemo(
    () => programs.filter((program) => !!program.isFavorite).sort((a, b) => a.name.localeCompare(b.name)),
    [programs]
  );
  const getProgramShortName = (program) => {
    if (!program) return '';
    const raw = program?.programInfo?.programShortName || program?.programInfo?.shortFormName || '';
    return String(raw).trim();
  };

  const navigateTo = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if (view !== 'create') {
      setCreateSeed(null);
    }
    if (view !== 'detail') {
      setSelectedProgramId(null);
    }
  };

  const handleCreateProgram = (event) => {
    event.preventDefault();
    const program = createProgramFromForm(new FormData(event.target), programs);

    setPrograms((currentPrograms) => [...currentPrograms, program]);
    setSelectedProgramId(program.id);
    setActiveView('detail');
    setCreateSeed(null);
  };

  const handleAddGlobalCourse = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    if (!formData.get('code') || !formData.get('title')) {
      return;
    }

    setGlobalCourses((currentCourses) => [
      ...currentCourses,
      createGlobalCourseFromForm(formData, COURSE_COLORS)
    ]);
    const discipline = String(formData.get('discipline') || '').trim();
    if (discipline) {
      setCourseCategories((current) =>
        current.includes(discipline) ? current : [...current, discipline].sort((a, b) => a.localeCompare(b))
      );
    }
    event.target.reset();
  };

  const updateGlobalCourse = (courseId, updates) => {
    setGlobalCourses((currentCourses) =>
      currentCourses.map((course) => (course.id === courseId ? { ...course, ...updates } : course))
    );
    const discipline = String(updates?.discipline || '').trim();
    if (discipline) {
      setCourseCategories((current) =>
        current.includes(discipline) ? current : [...current, discipline].sort((a, b) => a.localeCompare(b))
      );
    }
  };

  const addCourseCategory = (categoryName) => {
    const normalized = String(categoryName || '').trim();
    if (!normalized) return;
    setCourseCategories((current) =>
      current.includes(normalized) ? current : [...current, normalized].sort((a, b) => a.localeCompare(b))
    );
  };

  const insertCourse = (progId, semesterId, index, course) => {
    setPrograms((currentPrograms) => insertCourseInProgram(currentPrograms, progId, semesterId, index, course));
  };

  const removeCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) => removeCourseFromProgram(currentPrograms, progId, semesterId, courseIndex));
  };

  const moveCourse = (progId, sourceSemId, sourceIndex, targetSemId, targetIndex) => {
    setPrograms((currentPrograms) =>
      swapCoursesAcrossSemesters(currentPrograms, progId, sourceSemId, sourceIndex, targetSemId, targetIndex)
    );
  };

  const toggleCoreCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
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
            const currentCourse = updatedCourses[courseIndex];
            if (!currentCourse) {
              return semester;
            }

            updatedCourses[courseIndex] = {
              ...currentCourse,
              isCore: !currentCourse.isCore
            };

            return { ...semester, courses: updatedCourses };
          })
        };
      })
    );
  };

  const toggleNewCourse = (progId, semesterId, courseIndex) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
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
            const currentCourse = updatedCourses[courseIndex];
            if (!currentCourse) {
              return semester;
            }

            updatedCourses[courseIndex] = {
              ...currentCourse,
              isNewCourse: !currentCourse.isNewCourse
            };

            return { ...semester, courses: updatedCourses };
          })
        };
      })
    );
  };

  const updateSpecializationBlocks = (progId, specializationBlocks) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              specializationBlocks
            }
          : program
      )
    );
  };

  const updateProgramName = (progId, name) => {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return;
    }

    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              name: trimmedName
            }
          : program
      )
    );
  };

  const updateProgramInfo = (progId, programInfo) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              programInfo
            }
          : program
      )
    );
  };

  const updateProgramColor = (progId, color) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              color
            }
          : program
      )
    );
  };

  const updateElectiveSuggestionMaps = (progId, electiveSuggestionMaps) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === progId
          ? {
              ...program,
              electiveSuggestionMaps
            }
          : program
      )
    );
  };

  const handleCloseModal = () => {
    setElectiveModalSlot(null);
    setCourseSearchTerm('');
  };

  const handleSaveCurriculumMap = () => {
    try {
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
      const savedAt = new Date().toISOString();
      localStorage.setItem(MAP_SAVED_AT_STORAGE_KEY, savedAt);
      setMapLastSavedAt(savedAt);
    } catch (error) {
      console.error('Failed to save curriculum map', error);
    }
  };

  const handleExportProgram = async (progId) => {
    const today = getTodayIsoDate();
    const program = programs.find((candidate) => candidate.id === progId);
    if (!program) {
      return;
    }

    const nextProgram = {
      ...program,
      programInfo: {
        ...(program.programInfo || {}),
        version: Math.max(1, Number(program.programInfo?.version) || 1) + 1,
        date: today
      }
    };

    const nextPrograms = programs.map((candidate) => (candidate.id === progId ? nextProgram : candidate));
    setPrograms(nextPrograms);

    try {
      localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(nextPrograms));
    } catch (error) {
      console.error('Failed to persist program updates during export', error);
    }

    try {
      const { exportProgramPdf } = await import('./src/exportProgramPdf');
      exportProgramPdf(nextProgram);
    } catch (error) {
      console.error('Failed to export program PDF', error);
      window.alert('Failed to export PDF. Please try again.');
    }
  };

  const handleCreateDerivedProgram = (derivedType, parentProgram) => {
    setCreateSeed({
      type: derivedType,
      parentProgramId: parentProgram.id,
      parentProgramName: parentProgram.name,
      faculty: parentProgram.faculty,
      lead: parentProgram.lead,
      discipline: parentProgram.discipline || '',
      description:
        derivedType === 'Specialization'
          ? `Specialization stream derived from ${parentProgram.name}.`
          : `Minor stream derived from ${parentProgram.name}.`
    });
    setActiveView('create');
  };

  const handleDuplicateSpecialization = (sourceProgram) => {
    const timestamp = Date.now();
    const sourceMapColumns = Math.min(
      MAX_MAP_COLUMNS,
      Math.max(DEFAULT_MAP_COLUMNS, Number(sourceProgram.mapColumns) || inferOccupiedMapColumns(sourceProgram.semesters || []))
    );
    const duplicatedProgram = {
      ...sourceProgram,
      id: `prog_${timestamp}`,
      name: `${sourceProgram.name} (Copy)`,
      status: 'Drafting',
      mapColumns: sourceMapColumns,
      milestones: sourceProgram.milestones.map((milestone, index) => ({
        ...milestone,
        id: `m_${timestamp}_${index + 1}`,
        completed: milestone.name === 'Initial Proposal',
        date: milestone.name === 'Initial Proposal' ? new Date().toISOString().split('T')[0] : null
      })),
      reviews: [],
      specializationBlocks: (sourceProgram.specializationBlocks || []).map((block, blockIndex) => ({
        ...block,
        id: `spec_block_${timestamp}_${blockIndex + 1}`,
        columnCount: Math.min(
          MAX_MAP_COLUMNS,
          Math.max(DEFAULT_MAP_COLUMNS, Number(block.columnCount) || DEFAULT_MAP_COLUMNS)
        ),
        courses: Array.from({
          length: Math.min(
            MAX_MAP_COLUMNS,
            Math.max(DEFAULT_MAP_COLUMNS, Number(block.columnCount) || DEFAULT_MAP_COLUMNS)
          )
        }).map(() => null)
      }))
    };

    setPrograms((currentPrograms) => [...currentPrograms, duplicatedProgram]);
    setSelectedProgramId(duplicatedProgram.id);
    setActiveView('detail');
  };

  const handleOpenProgram = (programId) => {
    setSelectedProgramId(programId);
    setActiveView('detail');
    setActiveTab('overview');
    setMobileMenuOpen(false);
  };

  const handleToggleFavorite = (programId) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) =>
        program.id === programId
          ? {
              ...program,
              isFavorite: !program.isFavorite
            }
          : program
      )
    );
  };

  const handleDeleteProgram = (programId) => {
    setPrograms((currentPrograms) => {
      const nameToId = new Map(currentPrograms.map((program) => [program.name, program.id]));
      const getParentId = (program) =>
        program.parentProgramId || (program.parentProgram ? nameToId.get(program.parentProgram) : null) || null;
      const childrenByParent = new Map();

      currentPrograms.forEach((program) => {
        const parentId = getParentId(program);
        if (!parentId) return;
        const children = childrenByParent.get(parentId) || [];
        children.push(program.id);
        childrenByParent.set(parentId, children);
      });

      const toDelete = new Set([programId]);
      const queue = [programId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = childrenByParent.get(currentId) || [];
        children.forEach((childId) => {
          if (!toDelete.has(childId)) {
            toDelete.add(childId);
            queue.push(childId);
          }
        });
      }

      if (
        !window.confirm(
          toDelete.size > 1
            ? `Delete this program and ${toDelete.size - 1} derived program(s)?`
            : 'Delete this program?'
        )
      ) {
        return currentPrograms;
      }

      if (selectedProgramId && toDelete.has(selectedProgramId)) {
        setSelectedProgramId(null);
        setActiveView('dashboard');
      }

      return currentPrograms.filter((program) => !toDelete.has(program.id));
    });
  };

  const addProgramMapColumn = (programId) => {
    setPrograms((currentPrograms) =>
      currentPrograms.map((program) => {
        if (program.id !== programId) {
          return program;
        }

        const currentColumns = Math.min(
          MAX_MAP_COLUMNS,
          Math.max(DEFAULT_MAP_COLUMNS, Number(program.mapColumns) || inferOccupiedMapColumns(program.semesters || []))
        );
        const nextColumnCount = Math.min(MAX_MAP_COLUMNS, currentColumns + 1);
        if (nextColumnCount === currentColumns) {
          return program;
        }

        return {
          ...program,
          mapColumns: nextColumnCount,
          semesters: program.semesters.map((semester) => {
            const nextCourses = [...semester.courses];
            while (nextCourses.length < nextColumnCount) {
              nextCourses.push(null);
            }
            return { ...semester, courses: nextCourses };
          })
        };
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100/50 text-slate-900 font-sans">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-20 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="text-indigo-400" /> AcademicFlow
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 md:border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-400" /> AcademicFlow
          </h2>
        </div>

        <div className="px-4 pb-4">
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Menu</p>
          <nav className="space-y-1">
            <button
              onClick={() => navigateTo('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'dashboard' || activeView === 'detail' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={18} /> Programs Dashboard
            </button>
            <button
              onClick={() => navigateTo('courses')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'courses' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BookOpen size={18} /> Course Catalog
            </button>
          </nav>
        </div>

        {(activeView === 'dashboard' || activeView === 'detail') && (
          <div className="px-4 pb-4">
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Favorites</p>
            {favoritePrograms.length === 0 ? (
              <div className="px-4 py-2 text-xs text-slate-500">
                No favorites yet.
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {favoritePrograms.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => handleOpenProgram(program.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedProgramId === program.id && activeView === 'detail'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={program.name}
                  >
                    <Star size={14} className={selectedProgramId === program.id && activeView === 'detail' ? 'text-amber-300' : 'text-amber-400'} fill="currentColor" />
                    <span className="min-w-0">
                      <span className="block truncate">{program.name}</span>
                      {getProgramShortName(program) && (
                        <span className={`block truncate text-[11px] ${selectedProgramId === program.id && activeView === 'detail' ? 'text-slate-200' : 'text-slate-400'}`}>
                          {getProgramShortName(program)}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto p-4">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={18} /> Settings
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="flex-1 w-full pt-20 md:pt-0 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {activeView === 'dashboard' && (
          <DashboardView
            programs={programs}
            onCreateProgram={() => {
              setCreateSeed(null);
              setActiveView('create');
            }}
            onOpenProgram={handleOpenProgram}
            onToggleFavorite={handleToggleFavorite}
            onDeleteProgram={handleDeleteProgram}
          />
        )}
        {activeView === 'create' && (
          <CreateProgramView
            handleCreateProgram={handleCreateProgram}
            onBackToDashboard={() => navigateTo('dashboard')}
            programs={programs}
            createSeed={createSeed}
          />
        )}
        {activeView === 'detail' && (
          <ProgramDetailView
            programs={programs}
            selectedProgram={selectedProgram}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setActiveView={setActiveView}
            setSelectedProgramId={setSelectedProgramId}
            removeCourse={removeCourse}
            setElectiveModalSlot={setElectiveModalSlot}
            electiveModalSlot={electiveModalSlot}
            placeholderCredits={placeholderCredits}
            setPlaceholderCredits={setPlaceholderCredits}
            setCourseSearchTerm={setCourseSearchTerm}
            courseSearchTerm={courseSearchTerm}
            globalCourses={globalCourses}
            insertCourse={insertCourse}
            handleCloseModal={handleCloseModal}
            moveCourse={moveCourse}
            onSaveMap={handleSaveCurriculumMap}
            onExportProgram={handleExportProgram}
            mapLastSavedAt={mapLastSavedAt}
            onCreateDerivedProgram={handleCreateDerivedProgram}
            onDuplicateSpecialization={handleDuplicateSpecialization}
            toggleCoreCourse={toggleCoreCourse}
            toggleNewCourse={toggleNewCourse}
            updateSpecializationBlocks={updateSpecializationBlocks}
            updateProgramName={updateProgramName}
            updateProgramInfo={updateProgramInfo}
            updateProgramColor={updateProgramColor}
            addProgramMapColumn={addProgramMapColumn}
            updateElectiveSuggestionMaps={updateElectiveSuggestionMaps}
          />
        )}
        {activeView === 'courses' && (
          <GlobalCoursesView
            programs={programs}
            globalCourses={globalCourses}
            handleAddGlobalCourse={handleAddGlobalCourse}
            updateGlobalCourse={updateGlobalCourse}
            courseCategories={courseCategories}
            addCourseCategory={addCourseCategory}
          />
        )}
      </main>
    </div>
  );
}

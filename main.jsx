import React, { useMemo, useState } from 'react';
import { BookOpen, GraduationCap, LayoutDashboard, Menu, Settings, X } from 'lucide-react';
import { COURSE_COLORS, INITIAL_COURSES, INITIAL_DATA } from './src/data';
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

const loadProgramsFromStorage = () => {
  try {
    const storedPrograms = localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (!storedPrograms) {
      return INITIAL_DATA;
    }

    const parsedPrograms = JSON.parse(storedPrograms);
    if (!Array.isArray(parsedPrograms)) {
      return INITIAL_DATA;
    }

    return parsedPrograms;
  } catch (error) {
    console.error('Failed to load saved programs from localStorage', error);
    return INITIAL_DATA;
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
  const [mapLastSavedAt, setMapLastSavedAt] = useState(loadSavedAtFromStorage);
  const [createSeed, setCreateSeed] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [electiveModalSlot, setElectiveModalSlot] = useState(null);
  const [placeholderCredits, setPlaceholderCredits] = useState(3);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId),
    [programs, selectedProgramId]
  );

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
    event.target.reset();
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
    const duplicatedProgram = {
      ...sourceProgram,
      id: `prog_${timestamp}`,
      name: `${sourceProgram.name} (Copy)`,
      status: 'Drafting',
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
        courses: Array.from({ length: 6 }).map(() => null)
      }))
    };

    setPrograms((currentPrograms) => [...currentPrograms, duplicatedProgram]);
    setSelectedProgramId(duplicatedProgram.id);
    setActiveView('detail');
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
            onOpenProgram={(programId) => {
              setSelectedProgramId(programId);
              setActiveView('detail');
            }}
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
            mapLastSavedAt={mapLastSavedAt}
            onCreateDerivedProgram={handleCreateDerivedProgram}
            onDuplicateSpecialization={handleDuplicateSpecialization}
            toggleCoreCourse={toggleCoreCourse}
            updateSpecializationBlocks={updateSpecializationBlocks}
            updateProgramName={updateProgramName}
            updateElectiveSuggestionMaps={updateElectiveSuggestionMaps}
          />
        )}
        {activeView === 'courses' && (
          <GlobalCoursesView
            globalCourses={globalCourses}
            handleAddGlobalCourse={handleAddGlobalCourse}
          />
        )}
      </main>
    </div>
  );
}

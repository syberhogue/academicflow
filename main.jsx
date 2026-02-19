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

export default function App() {
  const [programs, setPrograms] = useState(INITIAL_DATA);
  const [globalCourses, setGlobalCourses] = useState(INITIAL_COURSES);
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
    if (view !== 'detail') {
      setSelectedProgramId(null);
    }
  };

  const handleCreateProgram = (event) => {
    event.preventDefault();
    const program = createProgramFromForm(new FormData(event.target));

    setPrograms((currentPrograms) => [...currentPrograms, program]);
    setSelectedProgramId(program.id);
    setActiveView('detail');
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

  const removeCourse = (progId, semesterId, courseCode) => {
    setPrograms((currentPrograms) => removeCourseFromProgram(currentPrograms, progId, semesterId, courseCode));
  };

  const moveCourse = (progId, sourceSemId, sourceIndex, targetSemId, targetIndex) => {
    setPrograms((currentPrograms) =>
      swapCoursesAcrossSemesters(currentPrograms, progId, sourceSemId, sourceIndex, targetSemId, targetIndex)
    );
  };

  const handleCloseModal = () => {
    setElectiveModalSlot(null);
    setCourseSearchTerm('');
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
            onCreateProgram={() => setActiveView('create')}
            onOpenProgram={(programId) => {
              setSelectedProgramId(programId);
              setActiveView('detail');
            }}
          />
        )}
        {activeView === 'create' && (
          <CreateProgramView
            handleCreateProgram={handleCreateProgram}
            onBackToDashboard={() => setActiveView('dashboard')}
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

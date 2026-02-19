import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Building,
  Users,
  FileText,
  Check,
  ArrowLeft,
  X,
  LayoutDashboard,
  GraduationCap,
  Settings,
  Menu
} from 'lucide-react';

// --- Program Definitions ---
const PROGRAM_TYPES = [
  { id: 'undergrad', name: 'Undergraduate Degree', minCredits: 90 },
  { id: 'honours', name: 'Honours Undergraduate Degree', minCredits: 120 },
  { id: 'professional', name: 'Professional Undergraduate Degree', minCredits: 60 },
  { id: 'second', name: 'Second Degree', minCredits: 60 }, 
  { id: 'major', name: 'Major', minCredits: 36 },
  { id: 'double_major', name: 'Double Major', minCredits: 60 }, 
  { id: 'minor', name: 'Minor', minCredits: 18 },
  { id: 'specialization', name: 'Specialization', minCredits: 9 },
  { id: 'coop', name: 'Co-operative Education', minCredits: 120 }, 
  { id: 'diploma', name: 'Undergraduate Diploma', minCredits: 18 }
];

const COURSE_COLORS = [
  'bg-blue-300', 'bg-purple-300', 'bg-pink-300', 'bg-emerald-400', 
  'bg-amber-400', 'bg-sky-300', 'bg-orange-200', 'bg-rose-300', 'bg-teal-300'
];

// --- Mock Data ---
const INITIAL_COURSES = [
  { id: 'c1', code: 'DS101', title: 'Intro to Data', credits: 3, color: 'bg-pink-300' },
  { id: 'c2', code: 'CS100', title: 'Python Basics', credits: 3, color: 'bg-blue-300' },
  { id: 'c3', code: 'STAT100', title: 'Prob & Stats', credits: 3, color: 'bg-purple-300' },
  { id: 'c4', code: 'HIST101', title: 'World History', credits: 3, color: 'bg-amber-400' },
  { id: 'c5', code: 'ENG101', title: 'Academic Writing', credits: 3, color: 'bg-emerald-400' },
  { id: 'c6', code: 'ROB200', title: 'Intro to Robotics', credits: 3, color: 'bg-orange-200' },
  { id: 'c7', code: 'ETH300', title: 'Tech Ethics', credits: 3, color: 'bg-sky-300' },
  { id: 'c8', code: 'BUSI 1030U', title: 'Writing and Critical Thinking', credits: 3, color: 'bg-blue-300' },
  { id: 'c9', code: 'BUSI 1130U', title: 'Introduction to Financial Accounting', credits: 3, color: 'bg-emerald-400' },
  { id: 'c10', code: 'BUSI 1450U', title: 'Statistics for Business', credits: 3, color: 'bg-purple-300' },
  { id: 'c11', code: 'BUSI 1520U', title: 'Introduction to Business Analytics', credits: 3, color: 'bg-pink-300' },
  { id: 'c12', code: 'BUSI 1600U', title: 'Management of the Enterprise', credits: 3, color: 'bg-sky-300' },
  { id: 'c13', code: 'BUSI 1915U', title: 'Fundamentals of Business Mathematics', credits: 3, color: 'bg-purple-300' },
  { id: 'c14', code: 'BUSI 2040U', title: 'Information Systems', credits: 3, color: 'bg-teal-300' },
  { id: 'c15', code: 'BUSI 2180U', title: 'Introduction to Managerial Accounting', credits: 3, color: 'bg-emerald-400' },
  { id: 'c16', code: 'BUSI 2200U', title: 'Marketing Management', credits: 3, color: 'bg-rose-300' },
  { id: 'c17', code: 'BUSI 2311U', title: 'Organizational Behaviour', credits: 3, color: 'bg-blue-300' },
  { id: 'c18', code: 'BUSI 2401U', title: 'Principles of Finance', credits: 3, color: 'bg-emerald-400' },
  { id: 'c19', code: 'BUSI 2603U', title: 'Introduction to Operations Management', credits: 3, color: 'bg-sky-300' },
  { id: 'c20', code: 'BUSI 3000U', title: 'Business and Sustainability', credits: 3, color: 'bg-teal-300' },
  { id: 'c21', code: 'BUSI 4701U', title: 'Strategic Management', credits: 3, color: 'bg-rose-300' },
  { id: 'c22', code: 'ECON 2010U', title: 'Microeconomics', credits: 3, color: 'bg-amber-400' },
  { id: 'c23', code: 'ECON 2020U', title: 'Macroeconomics', credits: 3, color: 'bg-amber-400' },
  { id: 'c24', code: 'XBIT 1500U', title: 'FBIT Student Success Workshop', credits: 0, color: 'bg-orange-200' },
  { id: 'c25', code: 'XBIT 2500U', title: 'FBIT Experience Workshop', credits: 0, color: 'bg-orange-200' },
  { id: 'c26', code: 'XBIT 3500U', title: 'FBIT Career Readiness Workshop', credits: 0, color: 'bg-orange-200' },
];

const INITIAL_DATA = [
  {
    id: 'prog_001',
    name: 'B.Sc. Data Science & AI',
    type: 'Honours Undergraduate Degree',
    faculty: 'Faculty of Science',
    lead: 'Dr. Sarah Chen',
    status: 'In Review',
    description: 'A new interdisciplinary program combining statistics, computer science, and ethical AI frameworks.',
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: '2023-11-01' },
      { id: 'm2', name: 'Budget Approval', completed: true, date: '2023-12-15' },
      { id: 'm3', name: 'Curriculum Map', completed: true, date: '2024-01-20' },
      { id: 'm4', name: 'External Review', completed: false, date: null },
      { id: 'm5', name: 'Senate Approval', completed: false, date: null },
      { id: 'm6', name: 'Ministry Submission', completed: false, date: null },
    ],
    semesters: [
      { id: 'sem1', name: 'Year 1 - Fall', courses: [
        { code: 'DS101', title: 'Intro to Data', credits: 3, color: 'bg-pink-300' },
        { code: 'CS100', title: 'Python Basics', credits: 3, color: 'bg-blue-300' },
        { code: 'MATH101', title: 'Calculus I', credits: 3, color: 'bg-slate-200' }
      ]},
      { id: 'sem2', name: 'Year 1 - Winter', courses: [
        { code: 'STAT100', title: 'Prob & Stats', credits: 3, color: 'bg-purple-300' },
        { code: 'CS101', title: 'Data Structures', credits: 3, color: 'bg-blue-300' }
      ]}
    ],
    reviews: [
      { id: 'r1', category: 'Budget', text: 'Software licensing costs need clarification.', status: 'open', reviewer: 'Finance Comm.' },
      { id: 'r2', category: 'Course', text: 'Consider adding a tech ethics prerequisite earlier.', status: 'resolved', reviewer: 'Faculty Board' }
    ],
    facultyMembers: [
      { id: 'f1', name: 'Dr. Sarah Chen', role: 'Program Lead' },
      { id: 'f2', name: 'Prof. Michael Torres', role: 'Curriculum Designer' }
    ]
  },
  {
    id: 'prog_002',
    name: 'M.A. Digital History',
    type: 'Undergraduate Degree',
    faculty: 'Faculty of Humanities',
    lead: 'Dr. James Alistair',
    status: 'Drafting',
    description: 'Exploring historical narratives through digital archives, spatial analysis, and interactive media.',
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: '2024-01-10' },
      { id: 'm2', name: 'Budget Approval', completed: false, date: null },
      { id: 'm3', name: 'Curriculum Map', completed: false, date: null },
    ],
    semesters: [
      { id: 'sem1', name: 'Term 1', courses: [] },
      { id: 'sem2', name: 'Term 2', courses: [] },
    ],
    reviews: [],
    facultyMembers: [
      { id: 'f1', name: 'Dr. James Alistair', role: 'Program Lead' }
    ]
  },
  {
    id: 'prog_003',
    name: 'Bachelor of Commerce (Honours)',
    type: 'Honours Undergraduate Degree',
    faculty: 'Faculty of Business and IT',
    lead: 'Dr. Jane Smith',
    status: 'In Review',
    description: 'A comprehensive business degree featuring core commerce courses, experiential learning, and strategic management.',
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: '2024-02-15' },
      { id: 'm2', name: 'Budget Approval', completed: false, date: null },
      { id: 'm3', name: 'Curriculum Map', completed: true, date: '2024-03-01' },
      { id: 'm4', name: 'External Review', completed: false, date: null },
      { id: 'm5', name: 'Senate Approval', completed: false, date: null },
      { id: 'm6', name: 'Ministry Submission', completed: false, date: null },
    ],
    semesters: [
      { id: 'sem1', name: 'Year 1 - Fall', courses: [
          { code: 'BUSI 1030U', title: 'Writing & Critical Thinking', credits: 3, color: 'bg-blue-300' },
          { code: 'BUSI 1130U', title: 'Intro to Financial Accounting', credits: 3, color: 'bg-emerald-400' },
          { code: 'BUSI 1600U', title: 'Management of the Enterprise', credits: 3, color: 'bg-sky-300' },
          { code: 'XBIT 1500U', title: 'FBIT Student Success Workshop', credits: 0, color: 'bg-orange-200' }
      ] },
      { id: 'sem2', name: 'Year 1 - Winter', courses: [
          { code: 'BUSI 1450U', title: 'Statistics for Business', credits: 3, color: 'bg-purple-300' },
          { code: 'BUSI 1520U', title: 'Intro to Business Analytics', credits: 3, color: 'bg-pink-300' },
          { code: 'BUSI 1915U', title: 'Fundamentals of Bus. Math', credits: 3, color: 'bg-purple-300' },
          { code: 'ECON 2010U', title: 'Microeconomics', credits: 3, color: 'bg-amber-400' }
      ] },
      { id: 'sem3', name: 'Year 2 - Fall', courses: [
          { code: 'BUSI 2040U', title: 'Information Systems', credits: 3, color: 'bg-teal-300' },
          { code: 'BUSI 2180U', title: 'Intro to Managerial Accounting', credits: 3, color: 'bg-emerald-400' },
          { code: 'ECON 2020U', title: 'Macroeconomics', credits: 3, color: 'bg-amber-400' },
          { code: 'XBIT 2500U', title: 'FBIT Experience Workshop', credits: 0, color: 'bg-orange-200' }
      ] },
      { id: 'sem4', name: 'Year 2 - Winter', courses: [
          { code: 'BUSI 2200U', title: 'Marketing Management', credits: 3, color: 'bg-rose-300' },
          { code: 'BUSI 2311U', title: 'Organizational Behaviour', credits: 3, color: 'bg-blue-300' },
          { code: 'BUSI 2401U', title: 'Principles of Finance', credits: 3, color: 'bg-emerald-400' },
          { code: 'ELEC', title: 'General Elective', credits: 3, color: 'bg-slate-200' }
      ] },
      { id: 'sem5', name: 'Year 3 - Fall', courses: [
          { code: 'BUSI 2603U', title: 'Intro to Operations Mgmt', credits: 3, color: 'bg-sky-300' },
          { code: 'BUSI 3000U', title: 'Business and Sustainability', credits: 3, color: 'bg-teal-300' },
          { code: 'XBIT 3500U', title: 'FBIT Career Readiness', credits: 0, color: 'bg-orange-200' },
          { code: 'ELEC', title: 'BUSI Elective', credits: 3, color: 'bg-indigo-200' }
      ] },
      { id: 'sem6', name: 'Year 3 - Winter', courses: [
          { code: 'ELEC', title: 'General Elective', credits: 3, color: 'bg-slate-200' },
          { code: 'ELEC', title: 'BUSI Elective', credits: 3, color: 'bg-indigo-200' },
          { code: 'OPEN', title: 'Open Elective', credits: 3, color: 'bg-slate-300' }
      ] },
      { id: 'sem7', name: 'Year 4 - Fall', courses: [
          { code: 'ELEC', title: 'General Elective', credits: 3, color: 'bg-slate-200' },
          { code: 'ELEC', title: 'BUSI Elective', credits: 3, color: 'bg-indigo-200' },
          { code: 'OPEN', title: 'Open Elective', credits: 3, color: 'bg-slate-300' }
      ] },
      { id: 'sem8', name: 'Year 4 - Winter', courses: [
          { code: 'BUSI 4701U', title: 'Strategic Management', credits: 3, color: 'bg-rose-300' },
          { code: 'OPEN', title: 'Open Elective', credits: 3, color: 'bg-slate-300' },
          { code: 'EXP', title: 'Capstone / Internship', credits: 3, color: 'bg-emerald-200' }
      ] }
    ],
    reviews: [
      { id: 'r3', category: 'Course', text: 'Consider moving Information Systems earlier in the map.', status: 'open', reviewer: 'Curriculum Committee' }
    ],
    facultyMembers: [
      { id: 'f3', name: 'Dr. Jane Smith', role: 'Program Lead' },
      { id: 'f4', name: 'Prof. Alan Turing', role: 'Business Analytics Advisor' }
    ]
  }
];

// --- Shared Components ---
const Badge = ({ children, type }) => {
  const colors = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    info: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[type]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ percentage, color = 'bg-emerald-500', height = 'h-1.5' }) => (
  <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
    <div className={`${height} ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Main Application ---
export default function App() {
  const [programs, setPrograms] = useState(INITIAL_DATA);
  const [globalCourses, setGlobalCourses] = useState(INITIAL_COURSES);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'create', 'detail', 'courses'
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'map', 'reviews', 'faculty'
  const [electiveModalSlot, setElectiveModalSlot] = useState(null);
  const [placeholderCredits, setPlaceholderCredits] = useState(3);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derived state
  const selectedProgram = useMemo(() => 
    programs.find(p => p.id === selectedProgramId), 
  [programs, selectedProgramId]);

  // Handlers
  const handleCreateProgram = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProgram = {
      id: `prog_${Date.now()}`,
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
        { id: 'm6', name: 'Ministry Submission', completed: false, date: null },
      ],
      semesters: Array.from({ length: 8 }).map((_, i) => ({
        id: `sem_${Date.now()}_${i}`,
        name: `Year ${Math.floor(i/2) + 1} - ${i%2 === 0 ? 'Fall' : 'Winter'}`,
        courses: []
      })),
      reviews: [],
      facultyMembers: [{ id: `f_${Date.now()}`, name: formData.get('lead'), role: 'Program Lead' }]
    };
    
    setPrograms([...programs, newProgram]);
    setSelectedProgramId(newProgram.id);
    setActiveView('detail');
  };

  const handleAddGlobalCourse = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('code') && fd.get('title')) {
      const randomColor = COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)];
      setGlobalCourses([...globalCourses, { 
        id: `c_${Date.now()}`, 
        code: fd.get('code'), 
        title: fd.get('title'),
        credits: Number(fd.get('credits') || 3),
        color: randomColor 
      }]);
      e.target.reset();
    }
  };

  const insertCourse = (progId, semesterId, index, course) => {
    setPrograms(progs => progs.map(p => {
      if (p.id !== progId) return p;
      const newSems = p.semesters.map(s => {
        if (s.id !== semesterId) return s;
        const newCourses = [...s.courses];
        newCourses[index] = course;
        return { ...s, courses: newCourses };
      });
      return { ...p, semesters: newSems };
    }));
  };

  const removeCourse = (progId, semesterId, courseCode) => {
    setPrograms(progs => progs.map(p => {
      if (p.id !== progId) return p;
      return {
        ...p,
        semesters: p.semesters.map(s => {
          if (s.id !== semesterId) return s;
          return { ...s, courses: s.courses.filter(c => c.code !== courseCode) };
        })
      };
    }));
  };

  const moveCourse = (progId, sourceSemId, sourceIndex, targetSemId, targetIndex) => {
    setPrograms(progs => progs.map(p => {
      if (p.id !== progId) return p;
      
      const newSems = p.semesters.map(s => ({ ...s, courses: [...s.courses] }));
      
      const sourceSem = newSems.find(s => s.id === sourceSemId);
      const targetSem = newSems.find(s => s.id === targetSemId);
      
      if (!sourceSem || !targetSem) return p;
      
      const sourceCourse = sourceSem.courses[sourceIndex];
      const targetCourse = targetSem.courses[targetIndex];
      
      sourceSem.courses[sourceIndex] = targetCourse;
      targetSem.courses[targetIndex] = sourceCourse;
      
      return { ...p, semesters: newSems };
    }));
  };

  const handleCloseModal = () => {
    setElectiveModalSlot(null);
    setCourseSearchTerm('');
  };

  const navigateTo = (view) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    if(view !== 'detail') setSelectedProgramId(null);
  };

  // --- View Functions ---

  const DashboardView = () => (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Programs</h1>
          <p className="text-slate-500">Manage curriculum design and approval workflows</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveView('create')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> New Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{programs.length}</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Programs</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {programs.filter(p => p.status === 'In Review').length}
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">In Review</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {programs.filter(p => p.status === 'Approved').length}
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Approved</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map(prog => {
          const completedMilestones = prog.milestones.filter(m => m.completed).length;
          const totalMilestones = prog.milestones.length;
          const progress = Math.round((completedMilestones / totalMilestones) * 100);
          
          return (
            <Card key={prog.id} className="flex flex-col hover:border-indigo-300 transition-colors cursor-pointer" >
              <div onClick={() => { setSelectedProgramId(prog.id); setActiveView('detail'); }} className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge type={prog.status === 'Drafting' ? 'draft' : prog.status === 'In Review' ? 'warning' : 'success'}>
                    {prog.status}
                  </Badge>
                  <div className="text-xs font-bold text-slate-400 uppercase">{prog.type.split(' ')[0]}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Building size={14} /> {prog.faculty}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-6">{prog.description}</p>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Approval Progress</span>
                  <span className="text-xs font-bold text-slate-900">{progress}%</span>
                </div>
                <ProgressBar percentage={progress} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const CreateProgramView = () => (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => setActiveView('dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Back to Programs
      </button>
      
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Program</h2>
        <form onSubmit={handleCreateProgram} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Name</label>
                <input name="name" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" placeholder="e.g. B.Sc. Robotics" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Type</label>
                <select name="type" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                  {PROGRAM_TYPES.map(pt => (
                    <option key={pt.id} value={pt.name}>{pt.name} ({pt.minCredits}cr min)</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Faculty</label>
                <input name="faculty" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" placeholder="e.g. Faculty of Science" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Lead</label>
                <input name="lead" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" placeholder="e.g. Dr. Jane Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Description & Rationale</label>
              <textarea name="description" rows="4" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white resize-none" placeholder="Briefly describe the program and its academic merit..." required></textarea>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={() => setActiveView('dashboard')} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">Initialize Program</button>
          </div>
        </form>
      </Card>
    </div>
  );

  const GlobalCoursesView = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
          <p className="text-slate-500">Manage the master list of all available courses</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleAddGlobalCourse} className="flex flex-col md:flex-row gap-4 mb-8 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="w-full md:w-1/4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Course Code</label>
                <input name="code" placeholder="e.g. MATH101" className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="flex-1 w-full">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Course Title</label>
                <input name="title" placeholder="e.g. Calculus I" className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="w-24">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Credits</label>
                <input type="number" name="credits" defaultValue={3} min={0} max={15} className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Add to Catalog
            </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalCourses.map(course => (
              <div key={course.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-start bg-white shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 mt-1 rounded-sm flex-shrink-0 ${course.color || 'bg-slate-200'}`} />
                      <div>
                          <div className="font-bold text-slate-900 mb-0.5">{course.code}</div>
                          <div className="text-sm font-medium text-slate-600">{course.title}</div>
                      </div>
                  </div>
                  <Badge type="neutral">{course.credits !== undefined ? course.credits : 3} cr</Badge>
              </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const ProgramDetailView = () => {
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
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{selectedProgram.name}</h1>
            <p className="text-slate-500 font-medium">{selectedProgram.type} • {selectedProgram.faculty} • Lead: {selectedProgram.lead}</p>
          </div>
          <div className="flex items-center gap-4">
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
                      <span className="font-bold text-slate-900">{selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.length, 0)}</span>
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
            const targetCredits = typeDef.minCredits;
            
            const currentCredits = selectedProgram.semesters.reduce((acc, sem) => 
              acc + sem.courses.reduce((cAcc, c) => cAcc + (c && c.credits !== undefined ? Number(c.credits) : 0), 0)
            , 0);
            
            const targetCourses = Math.ceil(targetCredits / 3);
            const currentCourses = selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.filter(c => c).length, 0);
            
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
                   </div>
                </div>
                
                <div className="flex flex-col border border-slate-200 bg-slate-200 gap-[1px] rounded-xl overflow-hidden shadow-sm">
                  {selectedProgram.semesters.map((sem) => (
                    <div key={sem.id} className="flex flex-col md:flex-row bg-white">
                      <div className="w-full md:w-40 flex-shrink-0 p-4 bg-slate-50 flex items-center border-b md:border-b-0 md:border-r border-slate-200">
                        <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{sem.name}</span>
                      </div>
                      <div className="flex-1 p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const course = sem.courses[i];
                          return (
                            <div 
                              key={`${sem.id}_${i}`}
                              className={`h-24 rounded-lg relative transition-all ${course ? `${course.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'}`}
                              onDragOver={(e) => { e.preventDefault(); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                  if (data.type === 'course') {
                                     const sourceSemId = data.semesterId;
                                     const sourceIndex = data.courseIndex;
                                     
                                     if(sourceSemId === sem.id && sourceIndex === i) return;

                                     moveCourse(selectedProgram.id, sourceSemId, sourceIndex, sem.id, i);
                                  }
                                } catch (err) {
                                  console.error("Failed to parse drag data", err);
                                }
                              }}
                            >
                              {course ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'course', semesterId: sem.id, courseIndex: i }));
                                  }}
                                  className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative group"
                                >
                                  <button
                                     onClick={(e) => { e.stopPropagation(); removeCourse(selectedProgram.id, sem.id, course.code); }}
                                     className="absolute top-1 right-1 p-1 text-black/40 hover:text-black hover:bg-white/50 rounded transition-all opacity-0 group-hover:opacity-100"
                                     title="Remove course"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="absolute top-1.5 left-1.5 text-[10px] font-bold text-black/50 bg-white/40 px-1.5 py-0.5 rounded shadow-sm">
                                      {course.credits !== undefined ? course.credits : 3}cr
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 mb-0.5 mt-3">{course.code}</div>
                                  <div className="text-[10px] leading-tight text-slate-800 text-center px-2 line-clamp-3 font-medium">{course.title}</div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setPlaceholderCredits(3);
                                    setElectiveModalSlot({ semesterId: sem.id, index: i, termName: sem.name });
                                  }}
                                  className="w-full h-full hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors rounded-lg cursor-pointer flex items-center justify-center group"
                                  title="Add course or placeholder"
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

                {/* Elective/Course Modal */}
                {electiveModalSlot && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Add to Map</h3>
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

                          <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-inner">
                            {(() => {
                              const filteredCourses = courseSearchTerm.trim() === '' 
                                ? globalCourses 
                                : globalCourses.filter(c => 
                                    c.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                                    c.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
                                  );

                              return filteredCourses.length > 0 ? (
                                filteredCourses.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { 
                                        code: c.code, 
                                        title: c.title, 
                                        color: c.color,
                                        credits: c.credits !== undefined ? c.credits : 3 
                                      });
                                      handleCloseModal();
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0 border-slate-100 flex justify-between items-center group transition-colors"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-bold text-slate-900 text-sm truncate">{c.code}</div>
                                      <div className="text-xs text-slate-500 truncate">{c.title}</div>
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
                                <button onClick={() => setPlaceholderCredits(Math.max(0, placeholderCredits - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">-</button>
                                <span className="text-sm font-bold w-6 text-center">{placeholderCredits}</span>
                                <button onClick={() => setPlaceholderCredits(placeholderCredits + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">+</button>
                             </div>
                          </div>

                          <div className="space-y-2">
                            <button 
                              onClick={() => {
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'EXP', title: 'Experiential', color: 'bg-emerald-200', credits: placeholderCredits });
                                handleCloseModal();
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
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'ELEC', title: 'General Elective', color: 'bg-slate-200', credits: placeholderCredits });
                                handleCloseModal();
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
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'OPEN', title: 'Open Elective', color: 'bg-slate-300', credits: placeholderCredits });
                                handleCloseModal();
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
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'ELEC', title: `${type} Elective`, color: 'bg-indigo-200', credits: placeholderCredits });
                                handleCloseModal();
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
  };

  return (
    <div className="flex min-h-screen bg-slate-100/50 text-slate-900 font-sans">
      
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-20 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="text-indigo-400" /> AcademicFlow
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
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

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 md:pt-0 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {activeView === 'dashboard' && DashboardView()}
        {activeView === 'create' && CreateProgramView()}
        {activeView === 'detail' && ProgramDetailView()}
        {activeView === 'courses' && GlobalCoursesView()}
      </main>

    </div>
  );
}
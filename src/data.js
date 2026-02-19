// --- Program Definitions ---
export const PROGRAM_TYPES = [
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

export const COURSE_COLORS = [
  'bg-blue-300', 'bg-purple-300', 'bg-pink-300', 'bg-emerald-400', 
  'bg-amber-400', 'bg-sky-300', 'bg-orange-200', 'bg-rose-300', 'bg-teal-300'
];

// --- Mock Data ---
export const INITIAL_COURSES = [
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

export const INITIAL_DATA = [
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

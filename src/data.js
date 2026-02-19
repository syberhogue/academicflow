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

const GAME_CORE_COURSES = [
  { id: 'game_core_001', code: 'INFR 1020U', title: 'Essential Mathematics for Games I', credits: 3, color: 'bg-blue-300' },
  { id: 'game_core_002', code: 'INFR 1030U', title: 'Essential Mathematics for Games II', credits: 3, color: 'bg-blue-300' },
  { id: 'game_core_003', code: 'INFR 1100U', title: 'Programming for Games I', credits: 3, color: 'bg-teal-300' },
  { id: 'game_core_004', code: 'INFR 1110U', title: 'Programming for Games II', credits: 3, color: 'bg-teal-300' },
  { id: 'game_core_005', code: 'INFR 1315U', title: 'Visual Narrative Foundations', credits: 3, color: 'bg-rose-300' },
  { id: 'game_core_006', code: 'INFR 1325U', title: 'Introduction to 2D Animation for Games', credits: 3, color: 'bg-rose-300' },
  { id: 'game_core_007', code: 'INFR 1330U', title: 'Basic Introduction to Game Design', credits: 3, color: 'bg-purple-300' },
  { id: 'game_core_008', code: 'INFR 1335U', title: 'Digital Game Design', credits: 3, color: 'bg-purple-300' },
  { id: 'game_core_009', code: 'INFR 1395U', title: 'Game Development Workshop I', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_010', code: 'INFR 1396U', title: 'Game Development Workshop II', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_011', code: 'INFR 2395U', title: 'Game Development Workshop III', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_012', code: 'INFR 2396U', title: 'Game Development Workshop IV', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_013', code: 'BUSI 2550U', title: 'Introduction to Project Management', credits: 3, color: 'bg-amber-400' },
  { id: 'game_core_014', code: 'INFR 3395U', title: 'Game Development Workshop V', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_015', code: 'INFR 3396U', title: 'Game Development Workshop VI', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_016', code: 'INFR 4560U', title: 'Law and Ethics in Game Development', credits: 3, color: 'bg-sky-300' },
  { id: 'game_core_017', code: 'INFR 4395U', title: 'Game Development Workshop VII', credits: 3, color: 'bg-emerald-400' },
  { id: 'game_core_018', code: 'INFR 4396U', title: 'Game Development Workshop VIII', credits: 3, color: 'bg-emerald-400' }
];

const GAME_ELECTIVE_COURSES = [
  { id: 'game_elec_001', code: 'INFR 1350', title: 'Introduction to Computer Graphics', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_002', code: 'INFR 2350', title: 'Intermediate Computer Graphics', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_003', code: 'INFR 3830', title: 'Distributed Systems and Networking', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_004', code: 'INFR 2820', title: 'Algorithms and Data Structures', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_005', code: 'INFR 3110', title: 'Game Engine Design and Implementation', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_006', code: 'INFR 3380', title: 'Industrial Design for Game Hardware Development', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_007', code: 'INFR 2100', title: 'Programming in C/C++', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_008', code: 'INFR 4460', title: 'Emerging Technologies', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_009', code: 'INFR 2020', title: 'Essential Math for Games 3', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_010', code: 'INFR 4450', title: 'Advanced Graphics or Games', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_011', code: 'INFR 2810', title: 'Computer Architecture', credits: 3, color: 'bg-teal-300', discipline: 'Programming' },
  { id: 'game_elec_012', code: 'INFR 2345', title: 'Modeling and Animation Systems 1', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_013', code: 'INFR 3370', title: 'Intermediate Rigging', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_014', code: 'INFR 3345', title: 'Modeling and Animation Systems 2', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_015', code: 'INFR 3315', title: 'Cinematic Systems Design', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_016', code: 'INFR 4445', title: 'Advanced Rigging', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_017', code: 'INFR 4440', title: 'Advanced Sculpting', credits: 3, color: 'bg-rose-300', discipline: 'Technical Art' },
  { id: 'game_elec_018', code: 'INFR 2330', title: 'Intermediate Game Design', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_019', code: 'INFR 4120', title: 'Serious Games', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_020', code: 'INFR 2370', title: 'Game Sound', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_021', code: 'INFR 2310', title: 'AI & Animation for Games', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_022', code: 'INFR 4400', title: 'Gamification', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_023', code: 'INFR 4370', title: 'Advanced Game Sound', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_024', code: 'INFR 3360', title: 'Virtual Spaces and Level Design', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_025', code: 'INFR 3370', title: 'Social & Emotional Game Design', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_026', code: 'INFR 4350', title: 'Human-Computer Interaction for Games', credits: 3, color: 'bg-purple-300', discipline: 'Design' },
  { id: 'game_elec_027', code: 'INFR 3250', title: 'UX Research', credits: 3, color: 'bg-sky-300', discipline: 'GUR' },
  { id: 'game_elec_028', code: 'INFR 4345', title: 'Game Analytics', credits: 3, color: 'bg-sky-300', discipline: 'GUR' },
  { id: 'game_elec_029', code: 'INFR 3350', title: 'Games User Research', credits: 3, color: 'bg-sky-300', discipline: 'GUR' }
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
  ...GAME_CORE_COURSES,
  ...GAME_ELECTIVE_COURSES
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
  },
  {
    id: 'prog_004',
    name: 'Bachelor of IT - GAME',
    type: 'Honours Undergraduate Degree',
    faculty: 'Faculty of Business and IT',
    lead: 'Dr. Alex Morgan',
    status: 'Drafting',
    description: 'Game Development and Interactive Media program with a structured core sequence and discipline-tagged elective streams.',
    milestones: [
      { id: 'm1', name: 'Initial Proposal', completed: true, date: '2025-02-05' },
      { id: 'm2', name: 'Budget Approval', completed: true, date: '2025-03-18' },
      { id: 'm3', name: 'Curriculum Map', completed: true, date: '2025-04-11' },
      { id: 'm4', name: 'External Review', completed: false, date: null },
      { id: 'm5', name: 'Senate Approval', completed: false, date: null },
      { id: 'm6', name: 'Ministry Submission', completed: false, date: null }
    ],
    semesters: [
      { id: 'sem1', name: 'Year 1 - Fall', courses: [
        { code: 'INFR 1020U', title: 'Essential Mathematics for Games I', credits: 3, color: 'bg-blue-300' },
        { code: 'INFR 1100U', title: 'Programming for Games I', credits: 3, color: 'bg-teal-300' },
        { code: 'INFR 1315U', title: 'Visual Narrative Foundations', credits: 3, color: 'bg-rose-300' },
        { code: 'INFR 1325U', title: 'Introduction to 2D Animation for Games', credits: 3, color: 'bg-rose-300' },
        { code: 'INFR 1330U', title: 'Basic Introduction to Game Design', credits: 3, color: 'bg-purple-300' },
        { code: 'INFR 1395U', title: 'Game Development Workshop I', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem2', name: 'Year 1 - Winter', courses: [
        { code: 'INFR 1030U', title: 'Essential Mathematics for Games II', credits: 3, color: 'bg-blue-300' },
        { code: 'INFR 1110U', title: 'Programming for Games II', credits: 3, color: 'bg-teal-300' },
        { code: 'INFR 1335U', title: 'Digital Game Design', credits: 3, color: 'bg-purple-300' },
        { code: 'INFR 1396U', title: 'Game Development Workshop II', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem3', name: 'Year 2 - Fall', courses: [
        { code: 'BUSI 1600U', title: 'Management of the Enterprise', credits: 3, color: 'bg-sky-300' },
        { code: 'INFR 2395U', title: 'Game Development Workshop III', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem4', name: 'Year 2 - Winter', courses: [
        { code: 'INFR 2396U', title: 'Game Development Workshop IV', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem5', name: 'Year 3 - Fall', courses: [
        { code: 'BUSI 2550U', title: 'Introduction to Project Management', credits: 3, color: 'bg-amber-400' },
        { code: 'INFR 3395U', title: 'Game Development Workshop V', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem6', name: 'Year 3 - Winter', courses: [
        { code: 'INFR 3396U', title: 'Game Development Workshop VI', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem7', name: 'Year 4 - Fall', courses: [
        { code: 'INFR 4560U', title: 'Law and Ethics in Game Development', credits: 3, color: 'bg-sky-300' },
        { code: 'INFR 4395U', title: 'Game Development Workshop VII', credits: 3, color: 'bg-emerald-400' }
      ] },
      { id: 'sem8', name: 'Year 4 - Winter', courses: [
        { code: 'INFR 4396U', title: 'Game Development Workshop VIII', credits: 3, color: 'bg-emerald-400' }
      ] }
    ],
    reviews: [
      { id: 'r4', category: 'Course', text: 'Elective streams are tagged and ready for scheduling in upper years.', status: 'open', reviewer: 'GAME Curriculum Committee' }
    ],
    facultyMembers: [
      { id: 'f5', name: 'Dr. Alex Morgan', role: 'Program Lead' },
      { id: 'f6', name: 'Prof. Kim Lee', role: 'Game Development Stream Advisor' }
    ]
  }
];

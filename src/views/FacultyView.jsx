import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserCircle2, X } from 'lucide-react';
import { FACULTY_OPTIONS } from '../data';
import { Badge, Card, ProgressBar } from '../ui';

const APPOINTMENT_TYPES = [
  'Sessional Instructor',
  'LTFM (Limited Term Fulltime)',
  'TF (Teaching)',
  'TTT (Tenure Track)'
];

const TERM_OPTIONS = ['Fall', 'Winter', 'Spring/Summer'];

const inferCurrentTerm = (date = new Date()) => {
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 12) return 'Fall';
  if (month >= 1 && month <= 4) return 'Winter';
  return 'Spring/Summer';
};

const normalizeCourseRef = (course) => {
  if (!course) return null;
  const code = String(course.code || '').trim();
  if (!code) return null;
  return {
    code,
    title: String(course.title || '').trim()
  };
};

const parseCourseTokens = (raw = '', globalCourses = []) => {
  const byCode = new Map((globalCourses || []).map((course) => [String(course.code || '').trim().toLowerCase(), course]));
  return String(raw || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const found = byCode.get(token.toLowerCase());
      if (found) return normalizeCourseRef(found);
      return { code: token.toUpperCase(), title: '' };
    })
    .filter(Boolean);
};

const toSearchable = (value) => String(value || '').trim().toLowerCase();

const getCourseLabel = (course) => {
  if (!course) return '';
  if (course.title) return `${course.code} - ${course.title}`;
  return course.code;
};

const getCurrentTermYear = (member) => {
  const term = TERM_OPTIONS.includes(String(member?.currentTerm || '').trim())
    ? String(member.currentTerm).trim()
    : inferCurrentTerm();
  const year = String(member?.currentYear || new Date().getFullYear()).trim();
  return `${term} ${year}`;
};

const getCurrentHistoryEntries = (member) => {
  if (!member) return [];
  const targetTermYear = getCurrentTermYear(member);
  return (member.teachingHistory || []).filter((entry) => String(entry.termYear || '').trim() === targetTermYear);
};

export function FacultyView({
  facultyMembers,
  globalCourses,
  categoryOptions,
  addCategory,
  onAddFacultyMember,
  onUpdateFacultyMember
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(inferCurrentTerm());
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySortKey, setHistorySortKey] = useState('termYear');
  const [historySortDir, setHistorySortDir] = useState('desc');
  const [historyTermFilter, setHistoryTermFilter] = useState('All');
  const [interestCategoryInput, setInterestCategoryInput] = useState('');

  const facultyNames = useMemo(
    () => ['All', ...FACULTY_OPTIONS.map((option) => option.name)],
    []
  );

  const filteredFaculty = useMemo(() => {
    const query = toSearchable(searchTerm);
    return (facultyMembers || []).filter((member) => {
      const facultyMatch = facultyFilter === 'All' || member.faculty === facultyFilter;
      const typeMatch = typeFilter === 'All' || member.appointmentType === typeFilter;
      const interestText = Array.isArray(member.teachingInterests) ? member.teachingInterests.join(' ') : '';
      const searchMatch =
        query.length === 0 ||
        toSearchable(member.name).includes(query) ||
        toSearchable(member.email).includes(query) ||
        toSearchable(interestText).includes(query);
      return facultyMatch && typeMatch && searchMatch;
    });
  }, [facultyMembers, searchTerm, facultyFilter, typeFilter]);

  useEffect(() => {
    if (!selectedFacultyId && filteredFaculty.length > 0) {
      setSelectedFacultyId(filteredFaculty[0].id);
      return;
    }
    if (selectedFacultyId && !filteredFaculty.some((member) => member.id === selectedFacultyId)) {
      setSelectedFacultyId(filteredFaculty[0]?.id || null);
      setIsProfileModalOpen(false);
    }
  }, [filteredFaculty, selectedFacultyId]);

  const selectedFaculty = useMemo(
    () => (facultyMembers || []).find((member) => member.id === selectedFacultyId) || null,
    [facultyMembers, selectedFacultyId]
  );

  useEffect(() => {
    if (!selectedFaculty) return;
    setSelectedTerm(String(selectedFaculty.currentTerm || inferCurrentTerm()));
    setSelectedYear(String(selectedFaculty.currentYear || new Date().getFullYear()));
    setHistoryTermFilter('All');
    setSelectedCourseCode('');
    setCourseSearchTerm('');
    setInterestCategoryInput('');
  }, [selectedFacultyId, selectedFaculty]);

  const selectableCourses = useMemo(() => {
    const query = toSearchable(courseSearchTerm);
    return [...(globalCourses || [])]
      .filter((course) => {
        if (!query) return true;
        return (
          toSearchable(course.code).includes(query) ||
          toSearchable(course.title).includes(query) ||
          toSearchable(course.discipline || '').includes(query)
        );
      })
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
  }, [globalCourses, courseSearchTerm]);

  const selectedCatalogCourse = useMemo(
    () => (globalCourses || []).find((course) => course.code === selectedCourseCode) || null,
    [globalCourses, selectedCourseCode]
  );

  const historyTermOptions = useMemo(() => {
    if (!selectedFaculty) return ['All'];
    const unique = Array.from(
      new Set((selectedFaculty.teachingHistory || []).map((entry) => String(entry.termYear || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ['All', ...unique];
  }, [selectedFaculty]);

  const filteredHistory = useMemo(() => {
    if (!selectedFaculty) return [];
    const query = toSearchable(historySearchTerm);
    const rows = (selectedFaculty.teachingHistory || []).filter((entry) => {
      const termMatch = historyTermFilter === 'All' || entry.termYear === historyTermFilter;
      const searchMatch =
        query.length === 0 ||
        toSearchable(entry.courseCode).includes(query) ||
        toSearchable(entry.courseTitle).includes(query) ||
        toSearchable(entry.termYear).includes(query);
      return termMatch && searchMatch;
    });

    return [...rows].sort((a, b) => {
      const aValue = String(a[historySortKey] || '').toLowerCase();
      const bValue = String(b[historySortKey] || '').toLowerCase();
      const compare = aValue.localeCompare(bValue, undefined, { numeric: true });
      return historySortDir === 'asc' ? compare : -compare;
    });
  }, [selectedFaculty, historySearchTerm, historyTermFilter, historySortKey, historySortDir]);

  const currentHistoryEntries = useMemo(() => getCurrentHistoryEntries(selectedFaculty), [selectedFaculty]);
  const programAssignedCurrentCourses = useMemo(() => {
    if (!selectedFaculty) return [];
    const historyCodeSet = new Set(
      currentHistoryEntries
        .map((entry) => String(entry.courseCode || '').trim().toLowerCase())
        .filter(Boolean)
    );
    return (Array.isArray(selectedFaculty.currentCourses) ? selectedFaculty.currentCourses : [])
      .map((course) => normalizeCourseRef(course))
      .filter((course) => course?.code)
      .filter((course) => !historyCodeSet.has(String(course.code || '').toLowerCase()))
      .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
  }, [selectedFaculty, currentHistoryEntries]);

  const currentTeachingCapacity = useMemo(() => {
    if (!selectedFaculty) return 0;
    const load = Math.max(0, Number(selectedFaculty.teachingLoad || 0));
    const overloads = Math.max(0, Number(selectedFaculty.overloads || 0));
    const releases = Math.max(0, Number(selectedFaculty.courseReleases || 0));
    return Math.max(0, load + overloads - releases);
  }, [selectedFaculty]);

  const assignedCurrentLoad = currentHistoryEntries.length + programAssignedCurrentCourses.length;
  const currentLoadPercent = currentTeachingCapacity > 0 ? Math.round((assignedCurrentLoad / currentTeachingCapacity) * 100) : 0;
  const isOverCapacity = currentTeachingCapacity > 0 && assignedCurrentLoad > currentTeachingCapacity;

  const teachingInterestOptions = useMemo(() => {
    const fromApp = Array.isArray(categoryOptions) ? categoryOptions : [];
    const fromFaculty = (facultyMembers || []).flatMap((member) =>
      Array.isArray(member.teachingInterests) ? member.teachingInterests : []
    );
    return Array.from(new Set([...fromApp, ...fromFaculty].map((value) => String(value || '').trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [categoryOptions, facultyMembers]);

  const updateSelectedFaculty = (updates) => {
    if (!selectedFaculty) return;
    onUpdateFacultyMember(selectedFaculty.id, updates);
  };

  const addCourseToHistory = () => {
    if (!selectedFaculty || !selectedCatalogCourse) return;
    const normalizedTerm = TERM_OPTIONS.includes(String(selectedTerm || '').trim())
      ? String(selectedTerm).trim()
      : inferCurrentTerm();
    const normalizedYear = String(selectedYear || '').trim();
    if (!normalizedYear) return;

    const entry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      courseCode: selectedCatalogCourse.code,
      courseTitle: selectedCatalogCourse.title,
      term: normalizedTerm,
      year: normalizedYear,
      termYear: `${normalizedTerm} ${normalizedYear}`,
      isOverload: false
    };

    updateSelectedFaculty({
      teachingHistory: [...(selectedFaculty.teachingHistory || []), entry]
    });
    setSelectedCourseCode('');
  };

  const removeHistoryEntry = (entryId) => {
    if (!selectedFaculty) return;
    updateSelectedFaculty({
      teachingHistory: (selectedFaculty.teachingHistory || []).filter((entry) => entry.id !== entryId)
    });
  };

  const toggleHistoryOverload = (entryId) => {
    if (!selectedFaculty) return;
    updateSelectedFaculty({
      teachingHistory: (selectedFaculty.teachingHistory || []).map((entry) =>
        entry.id === entryId ? { ...entry, isOverload: !entry.isOverload } : entry
      )
    });
  };

  const addTeachingInterestCategory = () => {
    if (!selectedFaculty) return;
    const raw = String(interestCategoryInput || '').trim();
    if (!raw) return;
    if (typeof addCategory === 'function') {
      addCategory(raw);
    }
    const current = Array.isArray(selectedFaculty.teachingInterests) ? selectedFaculty.teachingInterests : [];
    if (current.includes(raw)) {
      setInterestCategoryInput('');
      return;
    }
    updateSelectedFaculty({ teachingInterests: [...current, raw] });
    setInterestCategoryInput('');
  };

  const removeTeachingInterestCategory = (category) => {
    if (!selectedFaculty) return;
    updateSelectedFaculty({
      teachingInterests: (selectedFaculty.teachingInterests || []).filter((item) => item !== category)
    });
  };

  const handleAddFaculty = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const member = {
      name: String(formData.get('name') || '').trim(),
      faculty: String(formData.get('faculty') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      teachingInterests: String(formData.get('teachingInterests') || '').trim()
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      typicalCourses: parseCourseTokens(formData.get('typicalCourses'), globalCourses),
      currentCourses: [],
      teachingHistory: [],
      currentTerm: inferCurrentTerm(),
      currentYear: String(new Date().getFullYear()),
      courseReleases: Math.max(0, Number(formData.get('courseReleases') || 0)),
      comments: String(formData.get('comments') || '').trim(),
      appointmentType: String(formData.get('appointmentType') || '').trim(),
      teachingLoad: Math.max(0, Number(formData.get('teachingLoad') || 0)),
      overloads: Math.max(0, Number(formData.get('overloads') || 0))
    };
    if (!member.name || !member.faculty || !member.email) return;
    onAddFacultyMember(member);
    event.currentTarget.reset();
  };

  const handleSortHistory = (key) => {
    if (historySortKey === key) {
      setHistorySortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setHistorySortKey(key);
    setHistorySortDir('asc');
  };

  const openFacultyProfile = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setIsProfileModalOpen(true);
  };

  const closeFacultyProfile = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Faculty Directory</h1>
        <p className="text-slate-500">Manage faculty profiles, teaching allocations, and course teaching history</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleAddFaculty} className="space-y-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Add Faculty Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="name" required placeholder="Full Name" className="px-3 py-2 rounded border border-slate-300 text-sm" />
            <select name="faculty" required className="px-3 py-2 rounded border border-slate-300 text-sm bg-white">
              <option value="">Select Faculty</option>
              {FACULTY_OPTIONS.map((faculty) => (
                <option key={faculty.code} value={faculty.name}>
                  {faculty.name}
                </option>
              ))}
            </select>
            <input name="email" type="email" required placeholder="Email" className="px-3 py-2 rounded border border-slate-300 text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="teachingInterests"
              placeholder="Teaching interests (comma-separated categories)"
              className="px-3 py-2 rounded border border-slate-300 text-sm md:col-span-2"
            />
            <select name="appointmentType" className="px-3 py-2 rounded border border-slate-300 text-sm bg-white">
              <option value="">Type</option>
              {APPOINTMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="typicalCourses"
              placeholder="Typical courses (comma-separated codes)"
              className="px-3 py-2 rounded border border-slate-300 text-sm md:col-span-2"
            />
            <div className="grid grid-cols-3 gap-2">
              <input name="teachingLoad" type="number" min={0} placeholder="Load" className="px-3 py-2 rounded border border-slate-300 text-sm" />
              <input name="overloads" type="number" min={0} placeholder="Overloads" className="px-3 py-2 rounded border border-slate-300 text-sm" />
              <input name="courseReleases" type="number" min={0} placeholder="Releases" className="px-3 py-2 rounded border border-slate-300 text-sm" />
            </div>
          </div>
          <textarea name="comments" rows={2} placeholder="Comments/notes" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Add Faculty
          </button>
        </form>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 flex items-center border border-slate-300 rounded-lg bg-white px-3">
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search faculty by name, email, or interests..."
                className="w-full py-2 text-sm outline-none"
              />
            </div>
            <select
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
              className="px-3 py-2 rounded border border-slate-300 text-sm bg-white"
            >
              {facultyNames.map((facultyName) => (
                <option key={facultyName} value={facultyName}>
                  {facultyName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', ...APPOINTMENT_TYPES].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  typeFilter === type
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Showing {filteredFaculty.length} faculty members. Double-click a card to open profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
          {filteredFaculty.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedFacultyId(member.id)}
              onDoubleClick={() => openFacultyProfile(member.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedFacultyId === member.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{member.name}</div>
                  <div className="text-xs text-slate-600 truncate">{member.faculty}</div>
                </div>
                <UserCircle2 size={18} className="text-slate-500" />
              </div>
              <div className="mt-2 text-xs text-slate-600 truncate">{member.email}</div>
              <div className="mt-2 flex items-center justify-between">
                <Badge type="neutral">{member.appointmentType || 'N/A'}</Badge>
                <span className="text-[11px] text-slate-500">{(member.teachingHistory || []).length} history</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {isProfileModalOpen && selectedFaculty && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl mt-8 mb-8">
            <Card className="p-6 relative">
              <button
                type="button"
                onClick={closeFacultyProfile}
                className="absolute top-4 right-4 p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                aria-label="Close faculty profile"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedFaculty.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Name</label>
                  <input
                    value={selectedFaculty.name}
                    onChange={(event) => updateSelectedFaculty({ name: event.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Email</label>
                  <input
                    value={selectedFaculty.email}
                    onChange={(event) => updateSelectedFaculty({ email: event.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Faculty</label>
                  <select
                    value={selectedFaculty.faculty}
                    onChange={(event) => updateSelectedFaculty({ faculty: event.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white"
                  >
                    {FACULTY_OPTIONS.map((faculty) => (
                      <option key={faculty.code} value={faculty.name}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Type</label>
                  <select
                    value={selectedFaculty.appointmentType || ''}
                    onChange={(event) => updateSelectedFaculty({ appointmentType: event.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white"
                  >
                    <option value="">Not set</option>
                    {APPOINTMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Teaching Load</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedFaculty.teachingLoad || 0}
                    onChange={(event) => updateSelectedFaculty({ teachingLoad: Math.max(0, Number(event.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Overloads</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedFaculty.overloads || 0}
                    onChange={(event) => updateSelectedFaculty({ overloads: Math.max(0, Number(event.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Num Course Releases</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedFaculty.courseReleases || 0}
                    onChange={(event) => updateSelectedFaculty({ courseReleases: Math.max(0, Number(event.target.value) || 0) })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Current Term</label>
                  <select
                    value={selectedFaculty.currentTerm || inferCurrentTerm()}
                    onChange={(event) => updateSelectedFaculty({ currentTerm: event.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white"
                  >
                    {TERM_OPTIONS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Current Year</label>
                  <input
                    value={selectedFaculty.currentYear || ''}
                    onChange={(event) => updateSelectedFaculty({ currentYear: String(event.target.value || '').trim() })}
                    placeholder="2025"
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Comments</label>
                  <textarea
                    value={selectedFaculty.comments || ''}
                    onChange={(event) => updateSelectedFaculty({ comments: event.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <Card className="p-4 border border-slate-200 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-3">Teaching Interests</h3>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(selectedFaculty.teachingInterests || []).length === 0 ? (
                      <span className="text-xs text-slate-500">No categories assigned.</span>
                    ) : (
                      (selectedFaculty.teachingInterests || []).map((category) => (
                        <span key={category} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                          {category}
                          <button type="button" onClick={() => removeTeachingInterestCategory(category)} className="text-indigo-500 hover:text-indigo-700">
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      list="teaching-interest-options"
                      value={interestCategoryInput}
                      onChange={(event) => setInterestCategoryInput(event.target.value)}
                      placeholder="Type or select a category"
                      className="px-3 py-2 border border-slate-300 rounded text-sm md:col-span-2"
                    />
                    <button
                      type="button"
                      onClick={addTeachingInterestCategory}
                      className="px-3 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Category
                    </button>
                  </div>
                  <datalist id="teaching-interest-options">
                    {teachingInterestOptions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <Card className="p-4 border border-slate-200">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3">Add Course</h3>
                  <div className="space-y-2">
                    <input
                      value={courseSearchTerm}
                      onChange={(event) => setCourseSearchTerm(event.target.value)}
                      placeholder="Search catalog by code/title/category"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                    <select
                      value={selectedCourseCode}
                      onChange={(event) => setSelectedCourseCode(event.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                    >
                      <option value="">Select course</option>
                      {selectableCourses.map((course) => (
                        <option key={course.id} value={course.code}>
                          {course.code} - {course.title}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        value={selectedTerm}
                        onChange={(event) => setSelectedTerm(event.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                      >
                        {TERM_OPTIONS.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                      <input
                        value={selectedYear}
                        onChange={(event) => setSelectedYear(event.target.value)}
                        placeholder="Year (e.g. 2025)"
                        className="px-3 py-2 border border-slate-300 rounded text-sm md:col-span-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addCourseToHistory}
                      disabled={!selectedCatalogCourse || !String(selectedYear || '').trim()}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +Course
                    </button>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 mb-3">Currently Teaching ({getCurrentTermYear(selectedFaculty)})</h3>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Assigned Teaching Load</span>
                      <span className={isOverCapacity ? 'text-red-600' : 'text-slate-700'}>
                        {assignedCurrentLoad} / {currentTeachingCapacity}
                      </span>
                    </div>
                    <ProgressBar
                      percentage={Math.min(100, Math.max(0, currentLoadPercent))}
                      color={isOverCapacity ? 'bg-red-500' : 'bg-emerald-500'}
                      height="h-2"
                    />
                    {isOverCapacity && (
                      <p className="mt-1 text-[11px] text-red-600 font-medium">Over assigned for available load.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    {currentHistoryEntries.length === 0 && programAssignedCurrentCourses.length === 0 ? (
                      <div className="text-xs text-slate-500">No courses assigned for the selected current term/year.</div>
                    ) : (
                      <>
                        {currentHistoryEntries.map((entry) => (
                          <div
                            key={entry.id}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              toggleHistoryOverload(entry.id);
                            }}
                            className={`rounded border px-2 py-1 cursor-context-menu ${
                              entry.isOverload
                                ? 'border-amber-300 bg-amber-50 text-amber-900'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                            title="Right-click to toggle overload"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs">{entry.courseCode} - {entry.courseTitle}</span>
                              {entry.isOverload && <Badge type="warning">Overload</Badge>}
                            </div>
                          </div>
                        ))}
                        {programAssignedCurrentCourses.map((course) => (
                          <div
                            key={`program_course_${course.code}_${course.title}`}
                            className="rounded border px-2 py-1 border-indigo-200 bg-indigo-50 text-indigo-900"
                            title="Assigned from program curriculum maps"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs">{course.code} - {course.title}</span>
                              <Badge type="info">Program</Badge>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Right-click manual term/year entries to mark/unmark overload. Program-tagged entries come from assigned program maps.
                  </p>
                </Card>
              </div>

              <Card className="p-4 border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Teaching History</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={historySearchTerm}
                      onChange={(event) => setHistorySearchTerm(event.target.value)}
                      placeholder="Search history"
                      className="px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                    <select
                      value={historyTermFilter}
                      onChange={(event) => setHistoryTermFilter(event.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                    >
                      {historyTermOptions.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-200">
                        <th className="py-2 pr-3">
                          <button type="button" onClick={() => handleSortHistory('courseCode')} className="font-semibold text-slate-700 hover:text-slate-900">
                            Course Code
                          </button>
                        </th>
                        <th className="py-2 pr-3">
                          <button type="button" onClick={() => handleSortHistory('courseTitle')} className="font-semibold text-slate-700 hover:text-slate-900">
                            Course Name
                          </button>
                        </th>
                        <th className="py-2 pr-3">
                          <button type="button" onClick={() => handleSortHistory('termYear')} className="font-semibold text-slate-700 hover:text-slate-900">
                            Term/Year
                          </button>
                        </th>
                        <th className="py-2 pr-3 text-slate-700 font-semibold">Type</th>
                        <th className="py-2 text-right font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500 text-sm">
                            No teaching history entries match current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-100">
                            <td className="py-2 pr-3 text-slate-700 font-medium">{entry.courseCode}</td>
                            <td className="py-2 pr-3 text-slate-700">{entry.courseTitle}</td>
                            <td className="py-2 pr-3 text-slate-600">{entry.termYear}</td>
                            <td className="py-2 pr-3">
                              {entry.isOverload ? <Badge type="warning">Overload</Badge> : <Badge type="neutral">Regular</Badge>}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeHistoryEntry(entry.id)}
                                className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

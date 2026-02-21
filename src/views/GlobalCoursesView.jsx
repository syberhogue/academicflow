import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';
import { COURSE_COLORS } from '../data';
import { Badge, Card, ColorSwatchPicker } from '../ui';

const getCourseDiscipline = (course) => course.discipline || 'Uncategorized';

const getProgramShortLabel = (program) =>
  program?.programInfo?.programShortName ||
  program?.programInfo?.shortFormName ||
  program?.name;

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function GlobalCoursesView({
  programs,
  globalCourses,
  handleAddGlobalCourse,
  updateGlobalCourse,
  courseCategories,
  addCourseCategory
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState(COURSE_COLORS[0]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [groupViewMode, setGroupViewMode] = useState('preview');
  const [densityMode, setDensityMode] = useState('compact');
  const [previewLimit, setPreviewLimit] = useState(12);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedPreviewGroups, setExpandedPreviewGroups] = useState({});

  const disciplineOptions = useMemo(() => {
    const unique = new Set(
      [
        ...(courseCategories || []),
        ...globalCourses.map((course) => getCourseDiscipline(course))
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    );
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [courseCategories, globalCourses]);

  const programOptions = useMemo(
    () =>
      (programs || [])
        .map((program) => ({
          id: program.id,
          label: getProgramShortLabel(program),
          fullName: program.name
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [programs]
  );

  const programCourseCodeSets = useMemo(() => {
    const map = new Map();
    (programs || []).forEach((program) => {
      const codeSet = new Set();
      (program.semesters || []).forEach((semester) => {
        (semester.courses || []).forEach((course) => {
          if (course?.code) {
            codeSet.add(course.code);
          }
        });
      });
      map.set(program.id, codeSet);
    });
    return map;
  }, [programs]);

  const filteredCourses = useMemo(() => {
    return globalCourses.filter((course) => {
      const discipline = getCourseDiscipline(course);
      const disciplineMatches = disciplineFilter === 'All' || discipline === disciplineFilter;
      const query = searchTerm.trim().toLowerCase();
      const searchMatches =
        query.length === 0 ||
        course.code.toLowerCase().includes(query) ||
        course.title.toLowerCase().includes(query) ||
        discipline.toLowerCase().includes(query);

      const programMatches =
        programFilter === 'All' || (programCourseCodeSets.get(programFilter)?.has(course.code) ?? false);

      return disciplineMatches && searchMatches && programMatches;
    });
  }, [globalCourses, disciplineFilter, searchTerm, programFilter, programCourseCodeSets]);

  const groupedCourses = useMemo(() => {
    const groups = {};
    filteredCourses.forEach((course) => {
      const discipline = getCourseDiscipline(course);
      if (!groups[discipline]) {
        groups[discipline] = [];
      }
      groups[discipline].push(course);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCourses]);

  const groupedCourseMeta = useMemo(
    () =>
      groupedCourses.map(([discipline, courses]) => ({
        discipline,
        count: courses.length,
        anchorId: `discipline-${slugify(discipline)}`,
        palette: Array.from(new Set(courses.map((course) => course.color || 'bg-slate-200'))).slice(0, 5)
      })),
    [groupedCourses]
  );

  const visibleCourseCount = useMemo(
    () =>
      groupedCourses.reduce((acc, [discipline, courses]) => {
        if (groupViewMode === 'summary' || collapsedGroups[discipline]) return acc;
        if (groupViewMode === 'all' || expandedPreviewGroups[discipline]) return acc + courses.length;
        return acc + Math.min(previewLimit, courses.length);
      }, 0),
    [groupedCourses, groupViewMode, collapsedGroups, expandedPreviewGroups, previewLimit]
  );

  const filteredProgramLabel =
    programFilter === 'All' ? 'All Programs' : programOptions.find((program) => program.id === programFilter)?.label || 'All Programs';

  const collapseAllGroups = () => {
    setCollapsedGroups(
      Object.fromEntries(groupedCourses.map(([discipline]) => [discipline, true]))
    );
  };

  const expandAllGroups = () => {
    setCollapsedGroups(
      Object.fromEntries(groupedCourses.map(([discipline]) => [discipline, false]))
    );
  };

  const handleAddCategory = () => {
    const nextCategory = window.prompt('New category name');
    if (!nextCategory) return;
    const normalized = nextCategory.trim();
    if (!normalized) return;
    addCourseCategory(normalized);
    setSelectedCategory(normalized);
    setDisciplineFilter(normalized);
  };

  const openEditModal = (course) => {
    setEditingCourseId(course.id);
    setEditDraft({
      code: course.code,
      title: course.title,
      credits: course.credits !== undefined ? Number(course.credits) : 3,
      discipline: course.discipline || '',
      color: course.color || COURSE_COLORS[0]
    });
  };

  const closeEditModal = () => {
    setEditingCourseId(null);
    setEditDraft(null);
  };

  const saveCourseEdit = () => {
    if (!editingCourseId || !editDraft) return;
    updateGlobalCourse(editingCourseId, {
      code: editDraft.code,
      title: editDraft.title,
      credits: Math.max(0, Number(editDraft.credits) || 0),
      discipline: editDraft.discipline ? String(editDraft.discipline).trim() : undefined,
      color: editDraft.color
    });
    closeEditModal();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
          <p className="text-slate-500">Manage all courses, categories, and visual tags</p>
        </div>
      </div>

      <Card className="p-6">
        <form
          onSubmit={(event) => {
            handleAddGlobalCourse(event);
            setSelectedCategory('');
            setSelectedColor(COURSE_COLORS[0]);
          }}
          className="space-y-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Code</label>
              <input name="code" className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Title</label>
              <input name="title" className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Credits</label>
              <input type="number" name="credits" defaultValue={3} min={0} max={15} className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Category</label>
              <select
                name="discipline"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Uncategorized</option>
                {disciplineOptions
                  .filter((value) => value !== 'All')
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Add to Catalog
              </button>
            </div>
          </div>
          <input type="hidden" name="color" value={selectedColor} />
          <ColorSwatchPicker
            label="Selected Color"
            value={selectedColor}
            colors={COURSE_COLORS}
            onChange={setSelectedColor}
            allowCustom={false}
            swatchClassNameForColor={(color) => color}
            className="pt-1"
          />
        </form>

        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-bold uppercase tracking-wide text-slate-500">Navigation</span>
            <button
              type="button"
              onClick={() => {
                setProgramFilter('All');
                setDisciplineFilter('All');
                setSearchTerm('');
              }}
              className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
            >
              Catalog
            </button>
            <span className="text-slate-400">/</span>
            <button
              type="button"
              onClick={() => setProgramFilter('All')}
              className={`rounded-full border px-2 py-0.5 font-medium ${
                programFilter === 'All'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {filteredProgramLabel}
            </button>
            <span className="text-slate-400">/</span>
            <button
              type="button"
              onClick={() => setDisciplineFilter('All')}
              className={`rounded-full border px-2 py-0.5 font-medium ${
                disciplineFilter === 'All'
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {disciplineFilter === 'All' ? 'All Categories' : disciplineFilter}
            </button>
            {searchTerm.trim() !== '' && (
              <>
                <span className="text-slate-400">/</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100"
                >
                  Search: {searchTerm.trim()}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, or category..."
              className="md:col-span-2 px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <select
              value={disciplineFilter}
              onChange={(event) => setDisciplineFilter(event.target.value)}
              className="px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {disciplineOptions.map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 mr-1">View</span>
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'preview', label: 'Preview' },
              { id: 'all', label: 'Full' }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGroupViewMode(option.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  groupViewMode === option.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}

            <span className="h-4 w-px bg-slate-200 mx-1" />

            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 mr-1">Density</span>
            {[
              { id: 'compact', label: 'Compact' },
              { id: 'comfortable', label: 'Comfortable' }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDensityMode(option.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  densityMode === option.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}

            {groupViewMode === 'preview' && (
              <>
                <span className="h-4 w-px bg-slate-200 mx-1" />
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Per Group</label>
                <select
                  value={previewLimit}
                  onChange={(event) => setPreviewLimit(Number(event.target.value) || 12)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {[6, 12, 24, 48].map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {disciplineOptions.map((discipline) => (
              <button
                key={discipline}
                type="button"
                onClick={() => setDisciplineFilter(discipline)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  disciplineFilter === discipline
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {discipline}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-2.5 py-1 rounded-full text-xs font-medium border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              + Category
            </button>
          </div>

          <div className="pt-1">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Program Filter</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProgramFilter('All')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  programFilter === 'All'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                All Programs
              </button>
              {programOptions.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => setProgramFilter(program.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    programFilter === program.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title={program.fullName}
                >
                  {program.label}
                </button>
              ))}
            </div>
          </div>

          {groupedCourseMeta.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">Category Quick Nav</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={expandAllGroups}
                    className="px-2 py-1 rounded border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-100"
                  >
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllGroups}
                    className="px-2 py-1 rounded border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-100"
                  >
                    Collapse all
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedCourseMeta.map((group) => (
                  <a
                    key={group.discipline}
                    href={`#${group.anchorId}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span className="inline-flex -space-x-1">
                      {group.palette.map((color) => (
                        <span
                          key={`${group.discipline}_${color}`}
                          className={`${color} h-2.5 w-2.5 rounded-full border border-white`}
                        />
                      ))}
                    </span>
                    <span>{group.discipline}</span>
                    <span className="text-slate-500">({group.count})</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Showing {visibleCourseCount} visible of {filteredCourses.length} filtered ({globalCourses.length} total)
          </p>
        </div>

        {groupedCourses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            No courses match your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCourses.map(([discipline, courses]) => (
              <div key={discipline} id={`discipline-${slugify(discipline)}`} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((current) => ({
                        ...current,
                        [discipline]: !current[discipline]
                      }))
                    }
                    className="flex items-center gap-2 text-left"
                  >
                    {collapsedGroups[discipline] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{discipline}</h3>
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{courses.length} courses</span>
                    {!collapsedGroups[discipline] && groupViewMode === 'preview' && courses.length > previewLimit && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPreviewGroups((current) => ({
                            ...current,
                            [discipline]: !current[discipline]
                          }))
                        }
                        className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        {expandedPreviewGroups[discipline]
                          ? `Show fewer (${previewLimit})`
                          : `Show all (${courses.length})`}
                      </button>
                    )}
                  </div>
                </div>
                {!collapsedGroups[discipline] && groupViewMode !== 'summary' && (
                  <div
                    className={`grid gap-3 ${
                      densityMode === 'compact'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {(groupViewMode === 'all' || expandedPreviewGroups[discipline]
                      ? courses
                      : courses.slice(0, previewLimit)
                    ).map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => openEditModal(course)}
                        className={`${course.color || 'bg-slate-200'} ${
                          densityMode === 'compact' ? 'p-2.5 rounded-md' : 'p-4 rounded-lg'
                        } border border-slate-300 text-left shadow-sm hover:shadow transition-shadow`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div
                              className={`font-bold text-slate-900 mb-0.5 ${
                                densityMode === 'compact' ? 'text-xs' : 'text-sm'
                              }`}
                            >
                              {course.code}
                            </div>
                            <div
                              className={`font-medium text-slate-800 leading-tight ${
                                densityMode === 'compact' ? 'text-xs' : 'text-sm'
                              }`}
                            >
                              {course.title}
                            </div>
                            {densityMode !== 'compact' && (
                              <div className="mt-1">
                                <Badge type="info">{getCourseDiscipline(course)}</Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge type="neutral">{course.credits !== undefined ? course.credits : 3} cr</Badge>
                            <Pencil size={14} className="text-slate-700" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {editingCourseId && editDraft && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Edit Course</h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Code</label>
                  <input
                    value={editDraft.code}
                    onChange={(event) => setEditDraft((current) => ({ ...current, code: event.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Credits</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={editDraft.credits}
                    onChange={(event) => setEditDraft((current) => ({ ...current, credits: Number(event.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Title</label>
                <input
                  value={editDraft.title}
                  onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Category</label>
                <select
                  value={editDraft.discipline}
                  onChange={(event) => setEditDraft((current) => ({ ...current, discipline: event.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="">Uncategorized</option>
                  {disciplineOptions
                    .filter((value) => value !== 'All')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>
              <ColorSwatchPicker
                label="Selected Color"
                value={editDraft.color}
                colors={COURSE_COLORS}
                onChange={(color) => setEditDraft((current) => ({ ...current, color }))}
                allowCustom={false}
                swatchClassNameForColor={(color) => color}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCourseEdit}
                  className="px-3 py-2 bg-indigo-600 text-white rounded text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

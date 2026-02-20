import React, { useMemo, useState } from 'react';
import { Badge, Card } from '../ui';

  export function GlobalCoursesView({ globalCourses, handleAddGlobalCourse }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('All');

  const disciplineOptions = useMemo(() => {
    const unique = new Set(
      globalCourses
        .map((course) => course.discipline || 'Uncategorized')
        .filter(Boolean)
    );
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [globalCourses]);

  const filteredCourses = useMemo(() => {
    return globalCourses.filter((course) => {
      const discipline = course.discipline || 'Uncategorized';
      const disciplineMatches = disciplineFilter === 'All' || discipline === disciplineFilter;
      const query = searchTerm.trim().toLowerCase();
      const searchMatches =
        query.length === 0 ||
        course.code.toLowerCase().includes(query) ||
        course.title.toLowerCase().includes(query) ||
        discipline.toLowerCase().includes(query);

      return disciplineMatches && searchMatches;
    });
  }, [globalCourses, disciplineFilter, searchTerm]);

  const groupedCourses = useMemo(() => {
    const groups = {};
    filteredCourses.forEach((course) => {
      const discipline = course.discipline || 'Uncategorized';
      if (!groups[discipline]) {
        groups[discipline] = [];
      }
      groups[discipline].push(course);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCourses]);

  return (
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
            <div className="w-full md:w-1/4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 block">Discipline (Optional)</label>
                <input name="discipline" placeholder="e.g. Programming" className="w-full px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
            </div>
            <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Add to Catalog
            </button>
        </form>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, title, or discipline..."
              className="md:col-span-2 px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-3 py-2 rounded border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {disciplineOptions.map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
          <p className="text-xs text-slate-500">
            Showing {filteredCourses.length} of {globalCourses.length} courses
          </p>
        </div>

        {groupedCourses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            No courses match your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCourses.map(([discipline, courses]) => (
              <div key={discipline} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{discipline}</h3>
                  <span className="text-xs text-slate-500">{courses.length} courses</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-start bg-white shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 mt-1 rounded-sm flex-shrink-0 ${course.color || 'bg-slate-200'}`} />
                        <div>
                          <div className="font-bold text-slate-900 mb-0.5">{course.code}</div>
                          <div className="text-sm font-medium text-slate-600">{course.title}</div>
                          <div className="mt-1">
                            <Badge type="info">{course.discipline || 'Uncategorized'}</Badge>
                          </div>
                        </div>
                      </div>
                      <Badge type="neutral">{course.credits !== undefined ? course.credits : 3} cr</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

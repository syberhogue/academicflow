import React from 'react';
import { Badge, Card } from '../ui';

  export function GlobalCoursesView({ globalCourses, handleAddGlobalCourse }) {
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
                          {course.discipline && (
                            <div className="mt-1">
                              <Badge type="info">{course.discipline}</Badge>
                            </div>
                          )}
                      </div>
                  </div>
                  <Badge type="neutral">{course.credits !== undefined ? course.credits : 3} cr</Badge>
              </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

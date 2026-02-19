import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PROGRAM_TYPES } from '../data';
import { Card } from '../ui';

  export function CreateProgramView({ handleCreateProgram, onBackToDashboard, programs, createSeed }) {
  const [programType, setProgramType] = useState(createSeed?.type || PROGRAM_TYPES[0].name);
  const isMinor = programType === 'Minor';
  const isSpecialization = programType === 'Specialization';
  const isCiqeTemplateType = isMinor || isSpecialization;

  const ciqeGuidelineText = useMemo(() => {
    if (isMinor) {
      return 'CIQE template: minimum 18 credits (typically 6 courses).';
    }

    if (isSpecialization) {
      return 'CIQE template: minimum 9 credits (typically 3 courses) with parent program linkage.';
    }

    return '';
  }, [isMinor, isSpecialization]);

  const parentProgramOptions = useMemo(() => programs || [], [programs]);

  useEffect(() => {
    if (createSeed?.type) {
      setProgramType(createSeed.type);
    }
  }, [createSeed]);

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={18} /> Back to Programs
      </button>
      
      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Program</h2>
        {createSeed?.parentProgramName && (
          <div className="mb-6 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm">
            Creating a {createSeed.type} from <strong>{createSeed.parentProgramName}</strong>. The new map will start from the parent map.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setProgramType('Undergraduate Degree')}
            className={`px-4 py-3 rounded-lg border text-left transition-colors ${
              programType === 'Undergraduate Degree'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-sm font-bold">Degree Program</div>
            <div className="text-xs text-slate-500 mt-1">Standard full program setup</div>
          </button>
          <button
            type="button"
            onClick={() => setProgramType('Minor')}
            className={`px-4 py-3 rounded-lg border text-left transition-colors ${
              programType === 'Minor'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-sm font-bold">Minor Program</div>
            <div className="text-xs text-slate-500 mt-1">CIQE template: 18 credits</div>
          </button>
          <button
            type="button"
            onClick={() => setProgramType('Specialization')}
            className={`px-4 py-3 rounded-lg border text-left transition-colors ${
              programType === 'Specialization'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-sm font-bold">Specialization</div>
            <div className="text-xs text-slate-500 mt-1">CIQE template: 9 credits</div>
          </button>
        </div>
        <form onSubmit={handleCreateProgram} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Name</label>
                <input
                  name="name"
                  required
                  defaultValue={
                    createSeed?.parentProgramName
                      ? `${createSeed.parentProgramName} - ${programType}`
                      : ''
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  placeholder="e.g. B.Sc. Robotics"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Type</label>
                <select
                  name="type"
                  required
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  {PROGRAM_TYPES.map(pt => (
                    <option key={pt.id} value={pt.name}>{pt.name} ({pt.minCredits}cr min)</option>
                  ))}
                </select>
              </div>
            </div>

            {isCiqeTemplateType && (
              <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50">
                <p className="text-sm font-semibold text-indigo-800">{ciqeGuidelineText}</p>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="ciqeTemplate" defaultChecked />
                  Apply CIQE setup template automatically
                </label>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Faculty</label>
                <input
                  name="faculty"
                  required
                  defaultValue={createSeed?.faculty || ''}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  placeholder="e.g. Faculty of Science"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Program Lead</label>
                <input
                  name="lead"
                  required
                  defaultValue={createSeed?.lead || ''}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  placeholder="e.g. Dr. Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Discipline</label>
              <input
                name="discipline"
                required={isMinor || isSpecialization}
                defaultValue={createSeed?.discipline || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                placeholder="e.g. Game Development"
              />
            </div>

            {isCiqeTemplateType && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  {isSpecialization ? 'Parent Program' : 'Source Program (Optional)'}
                </label>
                <select
                  name="parentProgram"
                  required={isSpecialization}
                  defaultValue={createSeed?.parentProgramId || ''}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="" disabled>
                    {isSpecialization ? 'Select an existing program' : 'Select a source program'}
                  </option>
                  {parentProgramOptions.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {parentProgramOptions.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    No eligible parent programs exist yet. Create a primary program first.
                  </p>
                )}
              </div>
            )}

            {isCiqeTemplateType && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  {isSpecialization ? 'Specialization Courses Required' : 'Minor Courses Required'}
                </label>
                <input
                  type="number"
                  min={1}
                  name="requiredSpecializationCourses"
                  defaultValue={isSpecialization ? 3 : 6}
                  className="w-full md:w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                />
              </div>
            )}

            {isCiqeTemplateType && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Required Course Codes (Optional)
                </label>
                <textarea
                  name="requiredCourseCodes"
                  rows="2"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white resize-none"
                  placeholder="e.g. INFR 1100U, INFR 1110U"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Description & Rationale</label>
              <textarea
                name="description"
                rows="4"
                defaultValue={createSeed?.description || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white resize-none"
                placeholder="Briefly describe the program and its academic merit..."
                required
              ></textarea>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={onBackToDashboard} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">Initialize Program</button>
          </div>
        </form>
      </Card>
    </div>
  );
}

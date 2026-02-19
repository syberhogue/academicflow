import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PROGRAM_TYPES } from '../data';
import { Card } from '../ui';

  export function CreateProgramView({ handleCreateProgram, onBackToDashboard }) {
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
            <button type="button" onClick={onBackToDashboard} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">Initialize Program</button>
          </div>
        </form>
      </Card>
    </div>
  );
}

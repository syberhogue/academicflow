import React from 'react';
import { BookOpen, Activity, CheckCircle2, Plus, Building } from 'lucide-react';
import { Badge, Card, ProgressBar } from '../ui';

  export function DashboardView({ programs, onCreateProgram, onOpenProgram }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Programs</h1>
          <p className="text-slate-500">Manage curriculum design and approval workflows</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCreateProgram}
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
              <div onClick={() => onOpenProgram(prog.id)} className="p-6 flex-1">
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
}

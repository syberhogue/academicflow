import React, { useMemo, useState } from 'react';
import { BookOpen, Activity, CheckCircle2, Plus, Building, LayoutGrid, Network, ChevronRight, ChevronDown, Star, Trash2 } from 'lucide-react';
import { Badge, Card, ProgressBar } from '../ui';

export function DashboardView({ programs, onCreateProgram, onOpenProgram, onToggleFavorite, onDeleteProgram }) {
  const [viewMode, setViewMode] = useState('tree');
  const [collapsedById, setCollapsedById] = useState({});
  const getProgramShortName = (program) => {
    if (!program) return '';
    const raw = program?.programInfo?.programShortName || program?.programInfo?.shortFormName || '';
    return String(raw).trim();
  };

  const { rootPrograms, childrenByParent } = useMemo(() => {
    const idSet = new Set(programs.map((program) => program.id));
    const nameToId = new Map(programs.map((program) => [program.name, program.id]));
    const programById = new Map(programs.map((program) => [program.id, program]));
    const childMap = new Map();

    programs.forEach((program) => {
      const parentId =
        program.parentProgramId ||
        (program.parentProgram && nameToId.get(program.parentProgram)) ||
        null;

      if (!parentId || !idSet.has(parentId)) {
        return;
      }

      const children = childMap.get(parentId) || [];
      children.push(program);
      childMap.set(parentId, children);
    });

    const roots = programs.filter((program) => {
      const parentId =
        program.parentProgramId ||
        (program.parentProgram && nameToId.get(program.parentProgram)) ||
        null;
      return !parentId || !programById.has(parentId);
    });

    return { rootPrograms: roots, childrenByParent: childMap };
  }, [programs]);

  const hasParentProgram = (program) => !!(program.parentProgramId || program.parentProgram);
  const getProgramColor = (program) => program.color || (hasParentProgram(program) ? '#ede9fe' : '#dbeafe');
  const getDerivedCounts = (programId) => {
    const queue = [...(childrenByParent.get(programId) || [])];
    let specializationCount = 0;
    let minorCount = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.type === 'Specialization') specializationCount += 1;
      if (current.type === 'Minor') minorCount += 1;
      const nested = childrenByParent.get(current.id) || [];
      nested.forEach((child) => queue.push(child));
    }

    return { specializationCount, minorCount };
  };

  const renderTreeNode = (program) => {
    const children = childrenByParent.get(program.id) || [];
    const isCollapsed = !!collapsedById[program.id];
    const isDerivedProgram = hasParentProgram(program);
    const derivedCounts = !isDerivedProgram ? getDerivedCounts(program.id) : null;

    return (
      <div key={program.id} className="relative">
        <div className="relative pl-5">
          <div className="absolute left-0 top-5 w-3 border-t border-slate-300" />
          {children.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setCollapsedById((current) => ({
                  ...current,
                  [program.id]: !current[program.id]
                }))
              }
              className="absolute left-0 top-2 p-0.5 rounded hover:bg-slate-100 text-slate-500"
              title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <Card
            className={`px-3 py-2 hover:border-indigo-300 transition-colors ${isDerivedProgram ? 'border-violet-300' : 'border-blue-300'}`}
            style={{ backgroundColor: getProgramColor(program) }}
          >
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onOpenProgram(program.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900 text-sm truncate">{program.name}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold ${isDerivedProgram ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {isDerivedProgram ? 'Derived' : 'Base'}
                  </span>
                  {!isDerivedProgram && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 bg-white/70 text-slate-700">
                      {derivedCounts.specializationCount} spec • {derivedCounts.minorCount} minor
                    </span>
                  )}
                </div>
                {getProgramShortName(program) && (
                  <div className="text-[11px] text-slate-700/90 font-semibold truncate mt-0.5">
                    {getProgramShortName(program)}
                  </div>
                )}
                <div className="text-[11px] text-slate-600 mt-0.5 truncate">{program.type} • {program.faculty}</div>
              </button>
              <Badge type={program.status === 'Drafting' ? 'draft' : program.status === 'In Review' ? 'warning' : 'success'}>
                {program.status}
              </Badge>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(program.id);
                }}
                className={`p-1 rounded ${program.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-slate-500 hover:text-amber-500'}`}
                title={program.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={15} fill={program.isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteProgram(program.id);
                }}
                className="p-1 rounded text-slate-500 hover:text-red-600"
                title="Delete program"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        </div>
        {children.length > 0 && !isCollapsed && (
          <div className="ml-5 mt-2 pl-3 border-l border-slate-300 space-y-2">
            {children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Programs</h1>
          <p className="text-slate-500">Manage curriculum design and approval workflows</p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${viewMode === 'tree' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Network size={16} /> Tree
            </button>
          </div>
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

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(prog => {
            const completedMilestones = prog.milestones.filter(m => m.completed).length;
            const totalMilestones = prog.milestones.length;
            const progress = Math.round((completedMilestones / totalMilestones) * 100);
            
            return (
              <Card key={prog.id} className="flex flex-col hover:border-indigo-300 transition-colors cursor-pointer" >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <Badge type={prog.status === 'Drafting' ? 'draft' : prog.status === 'In Review' ? 'warning' : 'success'}>
                      {prog.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">{prog.type.split(' ')[0]}</div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFavorite(prog.id);
                        }}
                        className={`p-1 rounded ${prog.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'}`}
                        title={prog.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={16} fill={prog.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteProgram(prog.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                        title="Delete program"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div onClick={() => onOpenProgram(prog.id)}>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{prog.name}</h3>
                    {getProgramShortName(prog) && (
                      <div className="text-xs font-semibold text-slate-700 mb-2">{getProgramShortName(prog)}</div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <Building size={14} /> {prog.faculty}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-6">{prog.description}</p>
                  </div>
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
      ) : (
        <Card className="p-5">
          {rootPrograms.length === 0 ? (
            <div className="text-sm text-slate-500">No programs available.</div>
          ) : (
            <div className="space-y-3">
              {rootPrograms.map((program) => renderTreeNode(program))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

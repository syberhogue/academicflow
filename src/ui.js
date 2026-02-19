import React from 'react';

export const Badge = ({ children, type }) => {
  const colors = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    info: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[type]}`}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ percentage, color = 'bg-emerald-500', height = 'h-1.5' }) => (
  <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
    <div className={`${height} ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
  </div>
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

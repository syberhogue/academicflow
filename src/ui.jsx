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

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const ColorSwatchPicker = ({
  label = 'Selected Color',
  value,
  colors = [],
  onChange,
  allowCustom = true,
  className = '',
  swatchSize = 'h-8',
  swatchClassNameForColor
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg border border-slate-300 shadow-sm ${
          swatchClassNameForColor ? swatchClassNameForColor(value) : ''
        }`}
        style={swatchClassNameForColor ? undefined : { backgroundColor: value }}
      />
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{value}</div>
      </div>
    </div>
    {colors.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`${swatchSize} w-8 rounded-md border ${
              value === color ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300 hover:border-slate-400'
            } ${swatchClassNameForColor ? swatchClassNameForColor(color) : ''}`}
            style={swatchClassNameForColor ? undefined : { backgroundColor: color }}
            title={`Set color to ${color}`}
          />
        ))}
      </div>
    )}
    {allowCustom && !swatchClassNameForColor && (
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-14 p-1 border border-slate-300 rounded bg-white"
        />
        <span className="text-xs text-slate-500">Choose custom color</span>
      </div>
    )}
  </div>
);

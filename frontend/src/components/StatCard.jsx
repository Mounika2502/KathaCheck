import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-600',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-600',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      iconBg: 'bg-slate-200 text-slate-700',
    }
  };

  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span className="font-semibold text-slate-700">{trend}</span>
        </div>
      )}
    </div>
  );
}

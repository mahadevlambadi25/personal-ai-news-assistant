import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm animate-pulse space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 rounded-full" />
        <div className="h-4 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-6 w-5/6 bg-slate-200 rounded-md" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-4/5 bg-slate-100 rounded" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <div className="h-8 w-28 bg-slate-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

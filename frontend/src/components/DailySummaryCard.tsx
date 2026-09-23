import React from 'react';
import { Clock, CheckCircle2, PlayCircle, Circle, Activity } from 'lucide-react';
import { DailySummary } from '../types';

interface DailySummaryCardProps {
  summary: DailySummary | null;
  loading?: boolean;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Today's Productivity <Activity className="w-4 h-4 text-blue-600" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Summary metrics for {summary.date}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl text-blue-900 text-xs sm:text-sm font-bold flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Tracked: {summary.formatted_total_time}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Total Tracked */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Tracked</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {summary.formatted_total_time}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {summary.worked_on_count} tasks active today
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {summary.completed_count}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">
            Tasks finished today
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>In Progress</span>
            <PlayCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {summary.in_progress_tasks.length}
          </div>
          <div className="text-xs text-amber-800 mt-1 font-medium">
            Currently undergoing work
          </div>
        </div>

        {/* Pending */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Pending</span>
            <Circle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {summary.pending_tasks.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Awaiting start
          </div>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Task } from '../types';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

interface ProductivityChartProps {
  tasks: Task[];
}

const COLORS = {
  COMPLETED: '#10b981',   // Emerald 500
  IN_PROGRESS: '#f59e0b', // Amber 500
  PENDING: '#94a3b8',     // Slate 400
};

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  // 1. Data for Bar Chart: Time spent per task (minutes)
  const barData = tasks
    .filter((t) => t.total_time_seconds > 0)
    .map((t) => ({
      name: t.title.length > 18 ? `${t.title.slice(0, 16)}...` : t.title,
      minutes: Math.round((t.total_time_seconds / 60) * 10) / 10,
    }))
    .slice(0, 7); // Show top 7 tasks

  // 2. Data for Pie Chart: Status Distribution
  const statusCounts = {
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    PENDING: tasks.filter((t) => t.status === 'PENDING').length,
  };

  const pieData = [
    { name: 'Completed', value: statusCounts.COMPLETED, color: COLORS.COMPLETED },
    { name: 'In Progress', value: statusCounts.IN_PROGRESS, color: COLORS.IN_PROGRESS },
    { name: 'Pending', value: statusCounts.PENDING, color: COLORS.PENDING },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-8">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Productivity & Time Breakdown
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Time Spent per Task Bar Chart */}
        <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            Time Tracked Per Task (Minutes)
          </h4>
          {barData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} mins`, 'Time Spent']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm italic">
              No time tracked on tasks yet. Start a timer to view chart!
            </div>
          )}
        </div>

        {/* Task Status Pie Chart */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-emerald-600" /> Status Distribution
          </h4>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-3 text-xs flex-wrap border-t border-slate-200 pt-2">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed ({statusCounts.COMPLETED})
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> In Progress ({statusCounts.IN_PROGRESS})
            </div>
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Pending ({statusCounts.PENDING})
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

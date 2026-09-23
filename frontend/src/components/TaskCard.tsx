import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Square, CheckCircle2, Circle, Clock, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { useTimer } from '../context/TimerContext';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => Promise<void>;
  onTaskUpdated?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onTaskUpdated,
}) => {
  const { activeTimer, elapsedSeconds, startTimer, stopTimer, formatTimerDisplay } = useTimer();
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCurrentActive = activeTimer?.task_id === task.id;

  // Calculate live total time if this task is currently active
  const displayTotalSeconds = isCurrentActive
    ? task.total_time_seconds + elapsedSeconds
    : task.total_time_seconds;

  const formatHumanDuration = (totalSecs: number): string => {
    if (totalSecs <= 0) return '0s';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
  };

  const handleStartStop = async () => {
    setErrorMsg(null);
    setLoadingAction(true);
    try {
      if (isCurrentActive) {
        await stopTimer(task.id);
      } else {
        await startTimer(task.id);
      }
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Timer operation failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleComplete = async () => {
    setLoadingAction(true);
    try {
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await onStatusChange(task.id, newStatus);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Status update failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> In Progress
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
            <Circle className="w-3.5 h-3.5 text-slate-400" /> Pending
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-sm hover:shadow-md ${
      isCurrentActive ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left Section: Status Checkbox, Title, Description */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            onClick={handleToggleComplete}
            disabled={loadingAction}
            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0"
            title={task.status === 'COMPLETED' ? 'Mark as Pending' : 'Mark as Completed'}
          >
            {task.status === 'COMPLETED' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-50" />
            ) : (
              <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {getStatusBadge(task.status)}
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                {isCurrentActive ? (
                  <span className="text-amber-700 font-bold">{formatTimerDisplay(displayTotalSeconds)}</span>
                ) : (
                  <span>{formatHumanDuration(displayTotalSeconds)}</span>
                )}
              </span>
            </div>

            <Link to={`/tasks/${task.id}`} className="group inline-block">
              <h4 className={`text-base font-bold text-slate-900 group-hover:text-blue-600 transition tracking-tight truncate ${
                task.status === 'COMPLETED' ? 'line-through text-slate-500' : ''
              }`}>
                {task.title}
              </h4>
            </Link>

            {task.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Timer Controls & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          
          {/* Start/Stop Button */}
          {task.status !== 'COMPLETED' && (
            <button
              onClick={handleStartStop}
              disabled={loadingAction}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition transform active:scale-95 ${
                isCurrentActive
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
            >
              {isCurrentActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START</span>
                </>
              )}
            </button>
          )}

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Link
              to={`/tasks/${task.id}`}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="View Details"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>

      {errorMsg && (
        <div className="mt-3 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

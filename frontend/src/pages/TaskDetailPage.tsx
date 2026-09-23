import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Play, Square, Calendar, CheckCircle2, Circle, History, Trash2, Edit2 } from 'lucide-react';
import { Task, TimeLog, TaskStatus } from '../types';
import { taskApi } from '../services/taskApi';
import { timerApi } from '../services/timerApi';
import { useTimer } from '../context/TimerContext';
import { Navbar } from '../components/Navbar';
import { TaskModal } from '../components/TaskModal';

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const id = parseInt(taskId || '0', 10);

  const { activeTimer, totalElapsedSeconds, startTimer, stopTimer, formatTimerDisplay } = useTimer();

  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [taskRes, logsRes] = await Promise.all([
        taskApi.getTask(id),
        timerApi.getTaskTimeLogs(id),
      ]);
      setTask(taskRes);
      setLogs(logsRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Task not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  if (!id) return <div>Invalid Task ID</div>;

  const isCurrentActive = activeTimer?.task_id === id;
  const displayTotalSeconds = task
    ? isCurrentActive
      ? totalElapsedSeconds
      : task.total_time_seconds
    : 0;

  const handleStartStop = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      if (isCurrentActive) {
        await stopTimer(task.id);
      } else {
        await startTimer(task.id);
      }
      fetchTaskDetails();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    setActionLoading(true);
    try {
      await taskApi.updateTaskStatus(task.id, newStatus);
      fetchTaskDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await taskApi.deleteTask(task.id);
      navigate('/');
    }
  };

  const parseUtcDate = (isoString: string): Date => {
    let str = isoString.trim();
    // Append 'Z' if no timezone info is present (SQLite stores datetimes without 'Z')
    if (!str.endsWith('Z') && !str.includes('+') && str.lastIndexOf('-') < 11) str += 'Z';
    return new Date(str);
  };

  const formatDate = (isoString: string) => {
    return parseUtcDate(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSessionDuration = (sec?: number | null, startedAt?: string, endedAt?: string | null) => {
    if (sec != null) {
      const mins = Math.floor(sec / 60);
      const s = sec % 60;
      return `${mins}m ${s}s`;
    }
    if (!endedAt && startedAt) {
      return 'Active Tracking...';
    }
    return '0s';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {loading && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            <div className="h-32 bg-slate-100 rounded"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
            <p className="text-base font-bold mb-3">{error}</p>
            <Link to="/" className="inline-block bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs">
              Return to Safety
            </Link>
          </div>
        )}

        {!loading && !error && task && (
          <div className="space-y-6">
            
            {/* Task Overview Card */}
            <div className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-sm ${
              isCurrentActive ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
            }`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                
                {/* Left Task Title & Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {/* <span className="text-xs text-slate-400 font-mono">ID #{task.id}</span> */}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {task.title}
                  </h1>
                </div>

                {/* Start / Stop Control */}
                {task.status !== 'COMPLETED' && (
                  <button
                    onClick={handleStartStop}
                    disabled={actionLoading}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-md transition transform active:scale-95 ${
                      isCurrentActive
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>STOP TIMER</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>START TIMER</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="py-6 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                  {task.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                    <Clock className="w-4 h-4 text-blue-600" /> Total Time Spent
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {formatTimerDisplay(displayTotalSeconds)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                    <Calendar className="w-4 h-4 text-slate-400" /> Created On
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDate(task.created_at)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed Date
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {task.completed_at ? formatDate(task.completed_at) : <span className="text-slate-400 italic">Not completed yet</span>}
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      task.status === 'COMPLETED'
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {task.status === 'COMPLETED' ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{task.status === 'COMPLETED' ? 'Reopen Task' : 'Mark Complete'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Time Tracking Sessions History */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> Tracking Sessions ({logs.length})
              </h3>

              {logs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm italic">
                  No time logs recorded for this task yet. Click "Start Timer" above!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log.id} className="py-3.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          log.ended_at ? 'bg-slate-300' : 'bg-red-500 animate-ping'
                        }`}></div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {formatDate(log.started_at)}
                          </div>
                          {log.ended_at && (
                            <div className="text-xs text-slate-400">
                              Ended: {formatDate(log.ended_at)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs">
                        {formatSessionDuration(log.duration_seconds, log.started_at, log.ended_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Edit Modal */}
      {task && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            await taskApi.updateTask(task.id, data);
            fetchTaskDetails();
          }}
          initialTask={task}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw, CheckCircle2, Circle, PlayCircle, Layers } from 'lucide-react';
import { Task, TaskStatus, DailySummary, TaskCreateInput, TaskUpdateInput } from '../types';
import { taskApi } from '../services/taskApi';
import { summaryApi } from '../services/summaryApi';
import { Navbar } from '../components/Navbar';
import { ActiveTimerBanner } from '../components/ActiveTimerBanner';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { ProductivityChart } from '../components/ProductivityChart';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksRes, summaryRes] = await Promise.all([
        taskApi.getTasks(),
        summaryApi.getDailySummary(),
      ]);

      setTasks(tasksRes);
      setSummary(summaryRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (data: TaskCreateInput | TaskUpdateInput) => {
    if (editingTask) {
      await taskApi.updateTask(editingTask.id, data as TaskUpdateInput);
    } else {
      await taskApi.createTask(data as TaskCreateInput);
    }
    fetchData();
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    await taskApi.updateTaskStatus(taskId, newStatus);
    fetchData();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task and its time logs?')) {
      await taskApi.deleteTask(taskId);
      fetchData();
    }
  };

  // Filtered tasks logic
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesQuery =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Timer Sticky Banner */}
        <ActiveTimerBanner onTimerStopped={fetchData} />

        {/* Today's Daily Summary Cards */}
        <DailySummaryCard summary={summary} loading={loading} />

        {/* Productivity & Breakdown Charts */}
        {!loading && tasks.length > 0 && <ProductivityChart tasks={tasks} />}

        {/* Task Management Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          
          {/* Header Controls: Title, Search, Status Filter, Create Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" /> Tasks
              </h2>
              <p className="text-xs text-slate-500 font-medium">Manage and track time on your active goals</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Create Task Button */}
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl shadow-md transition transform active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>All Tasks</span>
              <span className="bg-slate-200/50 text-current px-1.5 py-0.2 rounded text-[10px]">{tasks.length}</span>
            </button>

            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>In Progress</span>
              <span className="bg-white/30 text-current px-1.5 py-0.2 rounded text-[10px]">
                {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Pending</span>
              <span className="bg-white/30 text-current px-1.5 py-0.2 rounded text-[10px]">
                {tasks.filter((t) => t.status === 'PENDING').length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
              <span className="bg-white/30 text-current px-1.5 py-0.2 rounded text-[10px]">
                {tasks.filter((t) => t.status === 'COMPLETED').length}
              </span>
            </button>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchData}
                className="flex items-center gap-1 text-xs font-bold text-red-800 underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Filter className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No tasks found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try changing your search query or status filter.'
                  : 'Get started by creating your first task to track time and boost productivity!'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create First Task
              </button>
            </div>
          )}

          {/* Task Cards List */}
          {!loading && !error && filteredTasks.length > 0 && (
            <div className="space-y-3.5">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                  onTaskUpdated={fetchData}
                />
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
      />
    </div>
  );
};

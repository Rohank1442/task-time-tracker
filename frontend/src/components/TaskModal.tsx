import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatus } from '../types';
import { taskApi } from '../services/taskApi';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreateInput | TaskUpdateInput) => Promise<void>;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [enhancing, setEnhancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status);
      setNaturalInput('');
    } else {
      setTitle('');
      setDescription('');
      setStatus('PENDING');
      setNaturalInput('');
    }
    setError(null);
    setAiMessage(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleEnhanceWithAI = async () => {
    const rawText = naturalInput.trim() || title.trim();
    if (!rawText) {
      setError('Please enter a natural language task prompt first (e.g., "follow up with designer").');
      return;
    }

    setError(null);
    setEnhancing(true);
    setAiMessage(null);

    try {
      const res = await taskApi.enhanceTask(rawText);
      setTitle(res.title);
      setDescription(res.description);
      if (res.ai_enhanced) {
        setAiMessage('✨ Enhanced with AI! You can edit the fields below before saving.');
      } else {
        setAiMessage('Natural language formatted. AI API key not configured, used default formatting.');
      }
    } catch {
      setError('Failed to enhance task prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {aiMessage && (
          <div className="mt-4 bg-blue-50 text-blue-800 border border-blue-200 p-3 rounded-xl text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Natural Language AI Prompt (Only when creating) */}
          {!initialTask && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-blue-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Natural Language Quick Input
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='e.g. "follow up with designer"'
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={enhancing}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm shrink-0"
                >
                  {enhancing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Improve with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Follow up with UI Designer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide context or action items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Initial Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                    status === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status === st && <Check className="w-3.5 h-3.5" />}
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold shadow-md transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialTask ? 'Update Task' : 'Create Task'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

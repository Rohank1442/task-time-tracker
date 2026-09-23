import React, { useState } from 'react';
import { Square, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';

interface ActiveTimerBannerProps {
  onTimerStopped?: () => void;
}

export const ActiveTimerBanner: React.FC<ActiveTimerBannerProps> = ({ onTimerStopped }) => {
  const { activeTimer, elapsedSeconds, stopTimer, formatTimerDisplay, timerError } = useTimer();
  const [stopping, setStopping] = useState(false);

  if (!activeTimer) return null;

  const handleStop = async () => {
    try {
      setStopping(true);
      await stopTimer(activeTimer.task_id);
      if (onTimerStopped) onTimerStopped();
    } catch {
      // Error handled in context / banner state
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-blue-800/50 mb-6 transition-all animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Active Timer Left Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">Currently Tracking</span>
              <Link
                to={`/tasks/${activeTimer.task_id}`}
                className="text-xs text-blue-200 hover:text-white flex items-center gap-0.5 underline underline-offset-2 transition"
              >
                Task #{activeTimer.task_id} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {activeTimer.task_title}
            </h3>
          </div>
        </div>

        {/* Live Timer Clock & Stop Button */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-blue-800/60">
          <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-300 bg-black/40 px-4 py-1.5 rounded-xl border border-white/10 shadow-inner">
            {formatTimerDisplay(elapsedSeconds)}
          </div>

          <button
            onClick={handleStop}
            disabled={stopping}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition transform active:scale-95"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{stopping ? 'Stopping...' : 'STOP'}</span>
          </button>
        </div>

      </div>

      {timerError && (
        <div className="mt-3 bg-red-500/20 border border-red-400/40 text-red-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{timerError}</span>
        </div>
      )}
    </div>
  );
};

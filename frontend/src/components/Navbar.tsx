import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, LogOut, CheckSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeTimer, elapsedSeconds, formatTimerDisplay } = useTimer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                TaskPulse <Sparkles className="w-4 h-4 text-blue-500" />
              </span>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Time & Productivity Tracker</p>
            </div>
          </Link>

          {/* Active Timer Pill Header */}
          {activeTimer && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full shadow-inner">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-amber-900 truncate max-w-[120px] sm:max-w-[200px]">
                {activeTimer.task_title}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md">
                {formatTimerDisplay(elapsedSeconds)}
              </span>
            </div>
          )}

          {/* Right Navigation / User Controls */}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="truncate max-w-[160px]">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition border border-transparent hover:border-red-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

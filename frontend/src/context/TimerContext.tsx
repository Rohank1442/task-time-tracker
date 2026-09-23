import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActiveTimer } from '../types';
import { timerApi } from '../services/timerApi';
import { useAuth } from './AuthContext';

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  elapsedSeconds: number;
  loadingTimer: boolean;
  timerError: string | null;
  startTimer: (taskId: number) => Promise<void>;
  stopTimer: (taskId: number) => Promise<void>;
  refreshActiveTimer: () => Promise<void>;
  formatTimerDisplay: (totalSeconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loadingTimer, setLoadingTimer] = useState<boolean>(false);
  const [timerError, setTimerError] = useState<string | null>(null);

  const fetchActiveTimer = useCallback(async () => {
    if (!token) {
      setActiveTimer(null);
      setElapsedSeconds(0);
      return;
    }
    try {
      setLoadingTimer(true);
      const timer = await timerApi.getActiveTimer();
      setActiveTimer(timer);
      if (timer) {
        const started = new Date(timer.started_at).getTime();
        const now = Date.now();
        const computedElapsed = Math.max(0, Math.floor((now - started) / 1000));
        setElapsedSeconds(computedElapsed);
      } else {
        setElapsedSeconds(0);
      }
    } catch {
      setActiveTimer(null);
      setElapsedSeconds(0);
    } finally {
      setLoadingTimer(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  // Live ticker updating every 1 second
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (activeTimer) {
      intervalId = setInterval(() => {
        const started = new Date(activeTimer.started_at).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - started) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTimer]);

  const startTimer = async (taskId: number) => {
    setTimerError(null);
    try {
      await timerApi.startTimer(taskId);
      await fetchActiveTimer();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to start timer';
      setTimerError(detail);
      throw new Error(detail);
    }
  };

  const stopTimer = async (taskId: number) => {
    setTimerError(null);
    try {
      await timerApi.stopTimer(taskId);
      setActiveTimer(null);
      setElapsedSeconds(0);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to stop timer';
      setTimerError(detail);
      throw new Error(detail);
    }
  };

  const formatTimerDisplay = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        elapsedSeconds,
        loadingTimer,
        timerError,
        startTimer,
        stopTimer,
        refreshActiveTimer: fetchActiveTimer,
        formatTimerDisplay,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

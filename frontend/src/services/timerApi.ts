import { api } from './api';
import { TimeLog, ActiveTimer, TaskTimeSummary } from '../types';

export const timerApi = {
  startTimer: async (taskId: number): Promise<TimeLog> => {
    const res = await api.post<TimeLog>(`/tasks/${taskId}/timer/start`);
    return res.data;
  },

  stopTimer: async (taskId: number): Promise<TimeLog> => {
    const res = await api.post<TimeLog>(`/tasks/${taskId}/timer/stop`);
    return res.data;
  },

  getActiveTimer: async (): Promise<ActiveTimer | null> => {
    const res = await api.get<ActiveTimer | null>('/timer/active');
    return res.data;
  },

  getAllTimeLogs: async (): Promise<TimeLog[]> => {
    const res = await api.get<TimeLog[]>('/time-logs');
    return res.data;
  },

  getTaskTimeLogs: async (taskId: number): Promise<TimeLog[]> => {
    const res = await api.get<TimeLog[]>(`/tasks/${taskId}/time-logs`);
    return res.data;
  },

  getTaskTimeSummary: async (taskId: number): Promise<TaskTimeSummary> => {
    const res = await api.get<TaskTimeSummary>(`/tasks/${taskId}/time-summary`);
    return res.data;
  },
};

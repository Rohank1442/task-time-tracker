import { api } from './api';
import { DailySummary } from '../types';

export const summaryApi = {
  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const params = date ? { date } : {};
    const res = await api.get<DailySummary>('/dashboard/daily-summary', { params });
    return res.data;
  },
};

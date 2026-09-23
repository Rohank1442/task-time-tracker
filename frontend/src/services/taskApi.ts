import { api } from './api';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatus, EnhanceTaskResponse } from '../types';

export const taskApi = {
  getTasks: async (status?: TaskStatus): Promise<Task[]> => {
    const params = status ? { status } : {};
    const res = await api.get<Task[]>('/tasks', { params });
    return res.data;
  },

  getTask: async (taskId: number): Promise<Task> => {
    const res = await api.get<Task>(`/tasks/${taskId}`);
    return res.data;
  },

  createTask: async (input: TaskCreateInput): Promise<Task> => {
    const res = await api.post<Task>('/tasks', input);
    return res.data;
  },

  updateTask: async (taskId: number, input: TaskUpdateInput): Promise<Task> => {
    const res = await api.put<Task>(`/tasks/${taskId}`, input);
    return res.data;
  },

  updateTaskStatus: async (taskId: number, status: TaskStatus): Promise<Task> => {
    const res = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
    return res.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  enhanceTask: async (prompt: string): Promise<EnhanceTaskResponse> => {
    const res = await api.post<EnhanceTaskResponse>('/tasks/enhance', { prompt });
    return res.data;
  },
};

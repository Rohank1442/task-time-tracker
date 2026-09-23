export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  total_time_seconds: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TimeLog {
  id: number;
  task_id: number;
  user_id: number;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  created_at: string;
}

export interface ActiveTimer {
  id: number;
  task_id: number;
  task_title: string;
  user_id: number;
  started_at: string;
  elapsed_seconds: number;
  prior_total_seconds: number;
  total_elapsed_seconds: number;
}

export interface TaskTimeSummary {
  task_id: number;
  total_time_seconds: number;
  formatted_duration: string;
  session_count: number;
}

export interface DailySummary {
  date: string;
  total_time_seconds: number;
  formatted_total_time: string;
  tasks_worked_on: Task[];
  completed_tasks: Task[];
  pending_tasks: Task[];
  in_progress_tasks: Task[];
  completed_count: number;
  worked_on_count: number;
}

export interface EnhanceTaskResponse {
  title: string;
  description: string;
  ai_enhanced: boolean;
}

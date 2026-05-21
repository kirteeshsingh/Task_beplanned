import { createContext } from 'react';
import type { Task, TaskStatus, TaskWithMeta } from '../lib/database.types';

export interface TaskContextType {
  tasks: TaskWithMeta[];
  loadingTasks: boolean;
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  moveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => Promise<boolean>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

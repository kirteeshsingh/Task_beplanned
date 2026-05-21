import { useContext } from 'react';
import { TaskContext } from '../contexts/task-context';

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}

import { useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskWithMeta, TaskStatus } from '../lib/database.types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { TaskContext } from './task-context';

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchTasks = useCallback(async (projectId: string) => {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      setTasks((data as TaskWithMeta[]) ?? []);
    } catch (error) {
      console.error('Failed to load tasks', error);
      toast.error('Unable to load tasks');
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const createTask = useCallback(
    async (data: Partial<Task>): Promise<Task | null> => {
      if (!user || !data.project_id || !data.title) return null;

      const nextPosition =
        (tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) : -1) + 1;

      const insertRow = {
        project_id: data.project_id,
        title: data.title,
        description: data.description ?? '',
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        due_date: data.due_date ?? null,
        assigned_to: data.assigned_to ?? null,
        tags: data.tags ?? [],
        position: nextPosition,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(insertRow)
        .select('*, assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
        .single();

      if (error || !task) {
        console.error('Failed to create task', error);
        toast.error(error?.message || 'Failed to create task');
        return null;
      }

      setTasks((prev) => [...prev, task as TaskWithMeta]);

      if (data.project_id) {
        const { error: activityError } = await supabase.from('activity_log').insert({
          project_id: data.project_id,
          user_id: user.id,
          action: 'created task',
          entity_type: 'task',
          entity_id: task.id,
          meta: { title: task.title },
        });
        if (activityError) {
          console.error('Failed to record task creation activity', activityError);
        }
      }

      return task;
    },
    [user, tasks]
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*)')
        .single();

      if (error) {
        console.error('Failed to update task', error);
        toast.error(error.message || 'Failed to update task');
        return false;
      }

      setTasks((prev) => prev.map((t) => (t.id === id ? (updated as TaskWithMeta) : t)));

      if (data.status && user) {
        const task = tasks.find((t) => t.id === id);
        if (task?.project_id) {
          const { error: activityError } = await supabase.from('activity_log').insert({
            project_id: task.project_id,
            user_id: user.id,
            action: `moved task to ${data.status}`,
            entity_type: 'task',
            entity_id: id,
            meta: { title: task.title, status: data.status },
          });
          if (activityError) {
            console.error('Failed to record task update activity', activityError);
          }
        }
      }
      return true;
    },
    [user, tasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return false;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete task', error);
        toast.error(error.message || 'Failed to delete task');
        setTasks((prev) => [...prev, task].sort((a, b) => a.position - b.position));
        return false;
      }

      if (task?.project_id && user) {
        const { error: activityError } = await supabase.from('activity_log').insert({
          project_id: task.project_id,
          user_id: user.id,
          action: 'deleted task',
          entity_type: 'task',
          entity_id: id,
          meta: { title: task.title },
        });
        if (activityError) {
          console.error('Failed to record task deletion activity', activityError);
        }
      }
      return true;
    },
    [tasks, user]
  );

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to move task');
      console.error('Failed to move task', error);
      setTasks(previousTasks);
      return false;
    }
    return true;
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ tasks, loadingTasks, fetchTasks, createTask, updateTask, deleteTask, moveTask }}>
      {children}
    </TaskContext.Provider>
  );
}

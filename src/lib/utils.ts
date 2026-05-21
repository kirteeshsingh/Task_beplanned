import { format, formatDistanceToNow, isBefore, parseISO, startOfDay } from 'date-fns';
import type { TaskPriority, TaskStatus } from './database.types';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

/** True when the due date is strictly before today's calendar day (local). */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const raw = dateStr.trim();
    const due = parseISO(raw.length <= 10 ? `${raw}T12:00:00` : raw);
    if (Number.isNaN(due.getTime())) return false;
    return isBefore(startOfDay(due), startOfDay(new Date()));
  } catch {
    return false;
  }
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  low: { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  high: { label: 'High', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  backlog: { label: 'Backlog', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  todo: { label: 'To Do', color: 'text-slate-700', bg: 'bg-white', border: 'border-slate-200' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  review: { label: 'Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  done: { label: 'Done', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
};

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#8B5CF6', '#14B8A6',
];

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

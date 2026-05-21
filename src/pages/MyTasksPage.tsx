import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Task, TaskStatus, TaskPriority } from '../lib/database.types';
import { PRIORITY_CONFIG, STATUS_CONFIG, TASK_STATUSES, formatDate, isOverdue } from '../lib/utils';
import { CheckSquare, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskWithProject extends Task {
  project?: { id: string; name: string; color: string } | null;
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects(id, name, color)')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) {
        console.error('Failed to load assigned tasks', error);
        toast.error('Could not load your tasks');
        setTasks([]);
        setLoading(false);
        return;
      }
      setTasks((data as TaskWithProject[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority]);

  const grouped = useMemo(() => {
    const overdue = filtered.filter((t) => isOverdue(t.due_date) && t.status !== 'done');
    const upcoming = filtered.filter((t) => !isOverdue(t.due_date) && t.status !== 'done');
    const done = filtered.filter((t) => t.status === 'done');
    return { overdue, upcoming, done };
  }, [filtered]);

  return (
    <div className="max-w-4xl p-5 lg:p-6">
      <div className="mb-6">
        <p className="bp-command text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">assigned.queue</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">Assigned Queue</h1>
        <p className="mt-1 text-sm text-slate-500">{tasks.filter((t) => t.status !== 'done').length} open tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
          className="bp-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          className="bp-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bp-shimmer h-16 rounded-xl border border-slate-800 p-4" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/10">
            <CheckSquare size={22} className="text-emerald-300" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-slate-200">Queue clear</h3>
          <p className="text-xs text-slate-500">No tasks assigned to you right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <Section title="Overdue" color="text-red-600" tasks={grouped.overdue} />
          )}
          {grouped.upcoming.length > 0 && (
        <Section title="Upcoming" color="text-slate-300" tasks={grouped.upcoming} />
          )}
          {grouped.done.length > 0 && (
            <Section title="Completed" color="text-slate-400" tasks={grouped.done} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, color, tasks }: { title: string; color: string; tasks: TaskWithProject[] }) {
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${color}`}>{title}</h2>
      <div className="bp-panel overflow-hidden rounded-xl">
        {tasks.map((task, i) => {
          const priority = PRIORITY_CONFIG[task.priority];
          const overdue = isOverdue(task.due_date);
          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-900/70 ${
                i < tasks.length - 1 ? 'border-b border-slate-800' : ''
              } ${
                overdue && task.status !== 'done'
                  ? 'border-l-4 border-l-red-400 bg-red-500/10'
                  : ''
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full shadow-[0_0_12px_currentColor] ${priority.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-slate-200">{task.title}</p>
                {task.project && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                    <span className="text-xs text-slate-500">{task.project.name}</span>
                  </div>
                )}
              </div>
              {task.due_date && (
                <span className={`flex items-center gap-1 whitespace-nowrap text-xs ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
                  <Calendar size={11} />
                  {formatDate(task.due_date)}
                </span>
              )}
              <span className="whitespace-nowrap rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                {STATUS_CONFIG[task.status].label}
              </span>
              {task.project && (
                <Link
                  to={`/projects/${task.project.id}`}
                  className="text-slate-600 transition-colors hover:text-cyan-300"
                >
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  BarChart2,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import type { Task, ActivityLog, Profile, TaskPriority, TaskStatus } from '../lib/database.types';
import { formatRelative, PRIORITY_CONFIG, STATUS_CONFIG, formatDate, isOverdue } from '../lib/utils';
import { getInitials, getAvatarColor } from '../lib/utils';
import toast from 'react-hot-toast';

interface Stats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

interface ActivityItem extends ActivityLog {
  profile?: Profile;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bp-panel-soft rounded-xl p-4 transition duration-200 hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="flex items-start justify-between">
        <div>
          <p className="bp-command text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-current/20 ${color}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const overdue = isOverdue(task.due_date);
  const priority = PRIORITY_CONFIG[task.priority];
  return (
    <div
      className={`group -mx-2 flex items-center gap-3 rounded-lg border-b border-slate-800/70 px-2 py-2.5 transition-colors hover:bg-slate-900/70 ${
        overdue && task.status !== 'done' ? '-ml-1 border-l-4 border-l-red-400 bg-red-500/10 pl-3' : ''
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full shadow-[0_0_12px_currentColor] ${priority.dot}`} />
      <p className="flex-1 truncate text-sm text-slate-300 group-hover:text-white">{task.title}</p>
      {task.due_date && (
        <span className={`shrink-0 text-xs font-medium ${overdue && task.status !== 'done' ? 'text-red-300' : 'text-slate-500'}`}>
          {overdue && task.status !== 'done' ? 'Overdue / ' : ''}
          {formatDate(task.due_date)}
        </span>
      )}
      <span className="shrink-0 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-xs font-medium text-slate-300">
        {STATUS_CONFIG[task.status].label}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loadingProjects } = useProjects();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: myTasksData, error: myTasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true })
        .limit(24);

      if (myTasksError) throw myTasksError;

      if (projects.length === 0) {
        setStats({ totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
        setMyTasks((myTasksData as Task[]) ?? []);
        setActivity([]);
        return;
      }

      const projectIds = projects.map((p) => p.id);

      const [{ data: allTasks, error: tasksError }, { data: activityData, error: activityError }] = await Promise.all([
        supabase.from('tasks').select('*').in('project_id', projectIds),
        supabase
          .from('activity_log')
          .select('*, profile:profiles(*)')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (tasksError || activityError) throw tasksError || activityError;

      const tasks = (allTasks as Task[]) ?? [];
      const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done').length;

      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'done').length,
        overdueTasks: overdue,
      });

      setMyTasks((myTasksData as Task[]) ?? []);
      setActivity((activityData as ActivityItem[]) ?? []);
    } catch (error) {
      console.error('Failed to load dashboard', error);
      toast.error('Could not load dashboard data');
      setMyTasks([]);
      setActivity([]);
      setStats({ totalProjects: projects.length, totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, projects]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const productivity = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const filteredMyTasks = myTasks.filter((task) => {
    const query = taskSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const projectBarData = projects.slice(0, 6).map((p) => ({
    name: p.name.length > 12 ? `${p.name.slice(0, 12)}...` : p.name,
    tasks: p.task_count,
    done: p.completed_count,
  }));

  if (loading || loadingProjects) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bp-panel-soft h-24 rounded-xl p-4">
              <div className="bp-shimmer mb-3 h-3 w-20 rounded" />
              <div className="bp-shimmer h-7 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="bp-command text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">beplanned.ops</p>
          <h1 data-testid="dashboard-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Execution Console</h1>
          <p className="mt-1 text-sm text-slate-500">Live workspace telemetry, workload pressure, and project flow.</p>
        </div>
        <div className="bp-panel-soft flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
          <span className="bp-command">sync stable</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <StatCard
            icon={FolderKanban}
            label="Workspaces"
            value={stats.totalProjects}
            sub={`${projects.filter((p) => p.member_count > 1).length} shared`}
            color="bg-cyan-400/10 text-cyan-300"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.03 }}>
          <StatCard
            icon={CheckSquare}
            label="Resolved"
            value={stats.completedTasks}
            sub={`of ${stats.totalTasks} total`}
            color="bg-emerald-400/10 text-emerald-300"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.06 }}>
          <StatCard
            icon={AlertCircle}
            label="Risk"
            value={stats.overdueTasks}
            sub="past due date"
            color={stats.overdueTasks > 0 ? 'bg-red-400/10 text-red-300' : 'bg-slate-800 text-slate-500'}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.09 }}>
          <StatCard
            icon={TrendingUp}
            label="Velocity"
            value={`${productivity}%`}
            sub="completion ratio"
            color="bg-blue-400/10 text-blue-300"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="bp-panel rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Workspace Throughput</h3>
              <p className="bp-command mt-0.5 text-[11px] text-slate-500">total_units / completed_units</p>
            </div>
            <BarChart2 size={16} className="text-cyan-300/70" />
          </div>
          {projectBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={projectBarData} barSize={10} barGap={3}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ border: '1px solid #1E293B', borderRadius: 8, fontSize: 12, background: '#020617', color: '#E2E8F0' }}
                  cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }}
                />
                <Bar dataKey="tasks" fill="#1E293B" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="done" fill="#22D3EE" radius={[3, 3, 0, 0]} name="Done" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-slate-500">
              <BarChart2 size={32} className="mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-400">No workspaces yet</p>
              <Link to="/projects" className="mt-2 text-xs text-cyan-300 hover:text-cyan-200">
                Create workspace
              </Link>
            </div>
          )}
        </div>

        <div className="bp-panel rounded-2xl p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-100">Task State Matrix</h3>
          <p className="bp-command mb-4 text-[11px] text-slate-500">done / active</p>
          {stats.totalTasks > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Done', value: stats.completedTasks },
                      { name: 'Active', value: stats.totalTasks - stats.completedTasks },
                    ]}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#22D3EE" />
                    <Cell fill="#1E293B" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  <span className="text-xs text-slate-500">Done ({stats.completedTasks})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-700" />
                  <span className="text-xs text-slate-500">Active ({stats.totalTasks - stats.completedTasks})</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-slate-500">
              <p className="text-sm">No tasks to chart</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bp-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Personal Queue</h3>
              <p className="bp-command mt-0.5 text-[11px] text-slate-500">assigned_to.current_user</p>
            </div>
            <Link to="/tasks" className="flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
              <Search size={13} className="text-cyan-300/70" />
              <input
                data-testid="dashboard-task-search"
                type="search"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search task title or description"
                className="bp-command min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
              />
            </label>
            <select
              data-testid="dashboard-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="bp-input rounded-lg px-2.5 py-2 text-xs"
              aria-label="Filter dashboard tasks by status"
            >
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              data-testid="dashboard-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="bp-input rounded-lg px-2.5 py-2 text-xs"
              aria-label="Filter dashboard tasks by priority"
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          {myTasks.length === 0 ? (
            <div className="py-10 text-center">
              <CheckSquare size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">Queue clear</p>
              <p className="mt-1 text-xs text-slate-500">Tasks assigned to you will show up here.</p>
            </div>
          ) : filteredMyTasks.length === 0 ? (
            <div className="py-10 text-center">
              <Search size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">No matching tasks</p>
              <p className="mt-1 text-xs text-slate-500">Adjust search, status, or priority filters.</p>
            </div>
          ) : (
            <div>
              {filteredMyTasks.slice(0, 8).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        <div className="bp-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Event Stream</h3>
              <p className="bp-command mt-0.5 text-[11px] text-slate-500">workspace.activity.latest</p>
            </div>
            <Clock size={14} className="text-cyan-300/70" />
          </div>
          {activity.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">No event stream yet</p>
              <p className="mt-1 text-xs text-slate-500">Signals appear as your team moves tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getAvatarColor(item.profile?.full_name || 'U') }}
                  >
                    {getInitials(item.profile?.full_name || 'U')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-slate-400">
                      <span className="font-medium text-slate-100">{item.profile?.full_name || 'Someone'}</span>{' '}
                      {item.action}
                      {(item.meta as { title?: string })?.title && (
                        <>
                          {' '}
                          &ldquo;{(item.meta as { title: string }).title}&rdquo;
                        </>
                      )}
                    </p>
                    <p className="bp-command mt-0.5 text-[11px] text-slate-600">{formatRelative(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

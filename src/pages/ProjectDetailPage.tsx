import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowLeft, Trash2, UserPlus, Search,
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskModal from '../components/tasks/TaskModal';
import type { TaskStatus } from '../lib/database.types';
import { getInitials, getAvatarColor, PRIORITY_CONFIG } from '../lib/utils';
import toast from 'react-hot-toast';

type Tab = 'board' | 'members' | 'settings';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentProject,
    members,
    loadingProjectDetail,
    fetchProject,
    updateProject,
    deleteProject,
    inviteMember,
    removeMember,
  } = useProjects();
  const { tasks, fetchTasks, loadingTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === 'admin';

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks(id);
    }
  }, [id, fetchProject, fetchTasks]);

  useEffect(() => {
    if (currentProject) {
      setNameValue(currentProject.name);
    }
  }, [currentProject]);

  const handleInvite = async () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed || !id) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    setInviting(true);
    await inviteMember(id, trimmed);
    setInviting(false);
    setInviteEmail('');
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (window.confirm(`Delete "${currentProject?.name}"? This will remove all tasks.`)) {
      const deleted = await deleteProject(id);
      if (!deleted) return;
      toast.success('Project deleted');
      navigate('/projects');
    }
  };

  const handleSaveName = async () => {
    if (!id || !nameValue.trim()) return;
    const saved = await updateProject(id, { name: nameValue });
    if (!saved) return;
    setEditingName(false);
    toast.success('Project updated');
  };

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesPriority = !filterPriority || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [filterPriority, searchTerm, tasks]);

  const projectMismatch = Boolean(currentProject && id && currentProject.id !== id);
  const showSkeleton = loadingProjectDetail || projectMismatch;

  if (showSkeleton) {
    return (
      <div className="p-6">
        <div className="max-w-3xl space-y-4">
          <div className="bp-shimmer h-8 w-48 rounded" />
          <div className="bp-shimmer h-4 w-full max-w-md rounded" />
          <div className="bp-shimmer mt-6 h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-100">Workspace not found</h2>
        <p className="text-sm text-slate-500 mt-2">It may have been removed or you don&apos;t have access.</p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
        >
          Back to workspaces
        </button>
      </div>
    );
  }

  const pct = currentProject.task_count > 0
    ? Math.round((currentProject.completed_count / currentProject.task_count) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col" data-testid="workspace-detail">
      {/* Project header */}
      <div className="border-b border-cyan-400/10 bg-black/18 px-5 pb-0 pt-5 backdrop-blur-xl lg:px-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="rounded-lg border border-slate-800 p-1.5 text-slate-500 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
            >
              <ArrowLeft size={16} />
            </button>
            <div
              className="h-9 w-1.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]"
              style={{ backgroundColor: currentProject.color }}
            />
            <div>
              {editingName && isAdmin ? (
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="border-b-2 border-cyan-400 bg-transparent text-base font-semibold text-slate-50 outline-none"
                  autoFocus
                />
              ) : (
                <h1
                  className={`text-base font-semibold text-slate-50 ${isAdmin ? 'cursor-pointer hover:text-cyan-200' : ''}`}
                  onClick={() => isAdmin && setEditingName(true)}
                >
                  {currentProject.name}
                </h1>
              )}
              <p className="text-xs text-slate-500">{currentProject.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mini member avatars */}
            <div className="hidden sm:flex items-center -space-x-1.5">
              {members.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-medium text-white"
                  style={{ backgroundColor: getAvatarColor(m.profile.full_name) }}
                  title={m.profile.full_name}
                >
                  {getInitials(m.profile.full_name)}
                </div>
              ))}
              {members.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs text-slate-400">
                  +{members.length - 4}
                </div>
              )}
            </div>

            <button
              onClick={() => setNewTaskOpen(true)}
              data-testid="add-task-button"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              <Plus size={13} />
              Add Task
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>{currentProject.completed_count} of {currentProject.task_count} tasks done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: currentProject.color }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {(['board', 'members', 'settings'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`workspace-tab-${tab}`}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-cyan-300 text-cyan-200'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'board' ? 'Board' : tab === 'members' ? `Members (${members.length})` : 'Settings'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'board' && (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto p-5 lg:p-6"
            >
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5">
                  <Search size={12} className="text-cyan-300/70" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks"
                    className="bp-command w-40 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bp-input rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="">All priorities</option>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
                <div className="bp-command ml-2 text-[11px] text-slate-500">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </div>
              </div>

              {loadingTasks ? (
                <div className="flex gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-64 shrink-0">
                      <div className="bp-shimmer mb-0.5 h-8 rounded-t-xl border border-slate-800" />
                      <div className="min-h-32 space-y-2 rounded-b-xl border border-t-0 border-slate-800 bg-black/20 p-2">
                        {i < 2 && <div className="bp-shimmer h-20 rounded-lg border border-slate-800" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <KanbanBoard projectId={currentProject.id} members={members} visibleTasks={filteredTasks} />
              )}
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-5 lg:p-6 max-w-2xl"
            >
              {isAdmin && (
                <div className="bp-panel rounded-xl p-4 mb-5">
                  <h3 className="mb-3 text-sm font-medium text-slate-100">Invite member</h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      className="bp-input flex-1 rounded-lg px-3.5 py-2 text-sm transition"
                    />
                    <button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
                    >
                      {inviting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus size={13} />
                          Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="bp-panel overflow-hidden rounded-xl">
                <div className="border-b border-slate-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-slate-100">Team members</h3>
                </div>
                <div className="divide-y divide-slate-800">
                  {members.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">No members yet.</div>
                  ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                        style={{ backgroundColor: getAvatarColor(member.profile.full_name) }}
                      >
                        {getInitials(member.profile.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100">{member.profile.full_name}</p>
                        <p className="text-xs text-slate-500">{member.profile.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          member.role === 'admin'
                            ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                            : 'border border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {member.role}
                      </span>
                      {isAdmin && member.user_id !== user?.id && (
                        <button
                          onClick={() => id && removeMember(id, member.user_id)}
                          className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors ml-1"
                          title="Remove member"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-5 lg:p-6 max-w-xl"
            >
              <div className="bp-panel mb-4 rounded-xl p-5">
                <h3 className="mb-4 text-sm font-medium text-slate-100">Workspace details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Name</label>
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      disabled={!isAdmin}
                      className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition disabled:opacity-60"
                    />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleSaveName}
                      className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                    >
                      Save changes
                    </button>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5">
                  <h3 className="mb-1 text-sm font-semibold text-red-200">Danger zone</h3>
                  <p className="mb-3 text-xs text-red-300">Once deleted, this workspace and all its tasks cannot be recovered.</p>
                  <button
                    onClick={handleDeleteProject}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400"
                  >
                    <Trash2 size={14} />
                    Delete project
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {newTaskOpen && (
        <TaskModal
          task={null}
          projectId={currentProject.id}
          members={members}
          defaultStatus={'todo' as TaskStatus}
          onClose={() => setNewTaskOpen(false)}
        />
      )}
    </div>
  );
}

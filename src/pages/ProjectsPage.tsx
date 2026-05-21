import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, FolderKanban, Users, CheckSquare, ArrowUpRight } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import type { ProjectWithMeta } from '../lib/database.types';

function ProjectCard({ project }: { project: ProjectWithMeta }) {
  const pct = project.task_count > 0 ? Math.round((project.completed_count / project.task_count) * 100) : 0;

  return (
    <Link to={`/projects/${project.id}`} data-testid="workspace-card">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.16 }}
        className="bp-panel-soft group relative overflow-hidden rounded-2xl p-5 transition-all hover:border-cyan-400/30 hover:bg-slate-900/80"
      >
        <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ backgroundColor: project.color }} />
        <div className="mb-5 flex items-start gap-3">
          <div className="h-10 w-1.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: project.color, color: project.color }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-slate-100">{project.name}</h3>
              <ArrowUpRight size={14} className="text-slate-600 transition group-hover:text-cyan-300" />
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description || 'No description'}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="bp-command text-[10px] text-slate-500">completion</span>
            <span className="bp-command text-[10px] text-cyan-300">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: project.color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={12} className="text-cyan-300/70" />
            <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckSquare size={12} className="text-cyan-300/70" />
            <span>{project.completed_count}/{project.task_count} units</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { projects, loadingProjects } = useProjects();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-5 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="bp-command text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">workspace.registry</p>
          <h1 data-testid="workspaces-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length} active workspace{projects.length !== 1 ? 's' : ''} in Beplanned
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          data-testid="new-workspace-button"
          className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:bg-cyan-300"
        >
          <Plus size={15} />
          New Workspace
        </button>
      </div>

      <div className="mb-6 flex max-w-sm items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5">
        <Search size={14} className="text-cyan-300/70" />
        <input
          type="text"
          placeholder="Filter workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bp-command flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
        />
      </div>

      {loadingProjects ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bp-panel-soft h-40 rounded-2xl p-5">
              <div className="mb-4 flex gap-3">
                <div className="bp-shimmer h-10 w-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bp-shimmer h-3 w-32 rounded" />
                  <div className="bp-shimmer h-2 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
            <FolderKanban size={22} className="text-cyan-300/70" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-slate-200">{search ? 'No matching workspaces' : 'No workspaces yet'}</h3>
          <p className="mb-5 text-xs text-slate-500">{search ? 'Try a different search token' : 'Create your first workspace to start planning'}</p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <Plus size={14} />
              Create Workspace
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

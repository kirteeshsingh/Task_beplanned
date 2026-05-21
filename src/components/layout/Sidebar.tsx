import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import CreateProjectModal from '../projects/CreateProjectModal';
import UserMenu from './UserMenu';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    if (mobileOpen) setCollapsed(false);
  }, [mobileOpen]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Ops Console', to: '/dashboard' },
    { icon: FolderKanban, label: 'Workspaces', to: '/projects' },
    { icon: CheckSquare, label: 'Assigned Queue', to: '/tasks' },
    { icon: Settings, label: 'Control Center', to: '/settings' },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-16 shrink-0 items-center border-b border-cyan-400/10 px-3 ${
          collapsed ? 'justify-center' : 'gap-2.5'
        }`}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={`group flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="bp-scanline flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]">
            <span className="bp-command text-base font-black text-cyan-200">B</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap text-base font-semibold tracking-tight text-white"
              >
                Beplanned
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto hidden rounded-md border border-slate-800 p-1 text-slate-500 transition-colors hover:border-cyan-400/30 hover:text-cyan-200 lg:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="scrollbar-hide flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            data-testid={`sidebar-${to.slice(1)}`}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'border border-cyan-400/20 bg-cyan-400/10 font-medium text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'border border-transparent text-slate-500 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity ${isActive ? 'bg-cyan-300 opacity-100' : 'opacity-0'}`} />
                <Icon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-cyan-300' : 'group-hover:text-cyan-200'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {!collapsed && projects.length > 0 ? (
          <div className="pt-5">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="bp-command text-[10px] font-medium uppercase tracking-[0.24em] text-slate-600">Pinned Workspaces</span>
              <button
                type="button"
                onClick={() => setShowCreateProject(true)}
                aria-label="New project"
                className="text-slate-500 transition-colors hover:text-cyan-200"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {projects.slice(0, 8).map((project) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                      isActive ? 'border-cyan-400/20 bg-cyan-400/10 text-white' : 'border-transparent text-slate-500 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-200'
                    }`
                  }
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <div className={`border-t border-cyan-400/10 p-3 ${collapsed ? '' : ''}`}>
        <UserMenu variant="dark" iconOnly={collapsed} />
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden shrink-0 flex-col overflow-hidden border-r border-cyan-400/10 bg-black/45 backdrop-blur-xl lg:flex"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="sidebar-overlay"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-[Min(280px,88vw)] flex-col border-r border-cyan-400/10 bg-slate-950 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {showCreateProject ? <CreateProjectModal onClose={() => setShowCreateProject(false)} /> : null}
    </>
  );
}

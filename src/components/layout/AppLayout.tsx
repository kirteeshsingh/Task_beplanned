import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useProjects } from '../../hooks/useProjects';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Ops Console',
  '/projects': 'Workspaces',
  '/tasks': 'Assigned Queue',
  '/settings': 'Control Center',
};

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { fetchProjects } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const title = PAGE_TITLES[location.pathname] || '';

  return (
    <div className="bp-grid-bg flex h-screen overflow-hidden text-slate-100">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Activity, Braces, GitBranch, Radar } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="bp-grid-bg flex min-h-screen">
      <aside className="relative hidden overflow-hidden border-r border-cyan-400/10 bg-black/35 p-12 text-white backdrop-blur-xl lg:flex lg:w-[45%] lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-10 top-24 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-20 right-8 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-2.5">
          <div className="bp-scanline flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10">
            <span className="bp-command text-base font-black text-cyan-200">B</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Beplanned</span>
        </div>

        <div className="relative max-w-md">
          <p className="bp-command mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Developer operations</p>
          <h1 className="text-5xl font-semibold leading-tight text-white">
            Plan execution like a command center.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            A dark-first workspace for project signals, task flow, ownership, and delivery telemetry.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Braces, label: 'scope.map' },
              { icon: GitBranch, label: 'ship.flow' },
              { icon: Radar, label: 'risk.scan' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bp-panel-soft rounded-xl px-3 py-3">
                <Icon size={16} className="mb-3 text-cyan-300" />
                <p className="bp-command text-[10px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative bp-command flex items-center gap-2 text-xs text-slate-500">
          <Activity size={13} className="text-emerald-400" />
          runtime.ready / React + Vite + Supabase
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-white">
              <span className="bp-command text-sm font-black text-cyan-200">B</span>
            </div>
            <span className="font-semibold tracking-tight text-slate-100">Beplanned</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

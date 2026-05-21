import { Menu, Bell, TerminalSquare } from 'lucide-react';
import UserMenu from './UserMenu';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Navbar({ onMenuClick, title }: NavbarProps) {
  return (
    <header className="h-16 shrink-0 border-b border-cyan-400/10 bg-black/28 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md border border-slate-800 bg-slate-950/70 p-1.5 text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {title ? (
          <div className="hidden min-w-0 sm:block">
            <p className="bp-command text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">beplanned.system</p>
            <h1 className="truncate text-sm font-semibold text-slate-100">{title}</h1>
          </div>
        ) : null}

        <div className="flex-1" />

        <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-2 text-xs text-slate-400 xl:flex">
          <TerminalSquare size={14} className="text-cyan-300" />
          <span className="bp-command">prod.online</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </div>

        <button
          type="button"
          className="relative rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" aria-hidden />
        </button>

        <UserMenu variant="light" />
      </div>
    </header>
  );
}

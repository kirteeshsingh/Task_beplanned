import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarColor, getInitials } from '../../lib/utils';

interface UserMenuProps {
  variant: 'dark' | 'light';
  /** Sidebar: icon-only collapsed rail */
  iconOnly?: boolean;
}

export default function UserMenu({ variant, iconOnly = false }: UserMenuProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const name = profile?.full_name || 'Account';
  const email = profile?.email || '';

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  const menuPositionClass =
    variant === 'dark'
      ? iconOnly
        ? 'left-1/2 bottom-full mb-2 -translate-x-1/2'
        : 'bottom-full left-0 right-0 mb-2'
      : 'right-0 top-full mt-1.5';

  const triggerStyles =
    variant === 'dark'
      ? 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-400/30 hover:text-white'
      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-400/30 hover:text-white';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${triggerStyles} ${
          variant === 'dark' ? 'w-full' : ''
        } ${iconOnly ? 'justify-center' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white shadow-[0_0_18px_rgba(34,211,238,0.18)]"
          style={{ backgroundColor: getAvatarColor(name) }}
        >
          {getInitials(name)}
        </div>
        {!iconOnly && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-xs font-medium text-white">
                {name}
              </p>
              {email ? (
                <p className="text-[10px] text-slate-500 truncate">{email}</p>
              ) : null}
            </div>
            <ChevronDown size={14} className={`shrink-0 opacity-70 ${variant === 'dark' ? 'text-slate-400' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: variant === 'dark' ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'dark' ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className={`bp-panel absolute z-[60] w-56 rounded-xl py-1 shadow-2xl ${menuPositionClass}`}
            role="menu"
          >
            <div className="border-b border-slate-800 px-3.5 py-2.5">
              <p className="truncate text-sm font-medium text-slate-100">{name}</p>
              {email ? <p className="bp-command mt-0.5 truncate text-[11px] text-slate-500">{email}</p> : null}
            </div>
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-300 transition-colors hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                <Settings size={14} className="text-cyan-300/70" />
                Control Center
              </button>
            </div>
            <div className="border-t border-slate-800 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

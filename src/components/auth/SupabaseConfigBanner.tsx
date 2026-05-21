import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigError } from '../../lib/supabase';

export default function SupabaseConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900"
    >
      <AlertTriangle className="shrink-0 text-amber-600" size={16} aria-hidden />
      <p className="leading-relaxed">{supabaseConfigError}</p>
    </div>
  );
}

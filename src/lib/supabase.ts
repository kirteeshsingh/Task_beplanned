import { createClient } from '@supabase/supabase-js';

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Supabase project URL only, without a `/rest/v1` path because the client adds paths. */
const supabaseUrl = supabaseUrlRaw
  ? supabaseUrlRaw.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  : undefined;

const hasPlaceholderConfig =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project-ref') ||
  supabaseAnonKey.includes('your-supabase-anon-key');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !hasPlaceholderConfig);

export const supabaseConfigError =
  'Add valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.';

/** Single client instance; uses a non-routable placeholder when env is missing so imports never throw during local dev. */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.invalid',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder-anon-key',
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
    },
  }
);

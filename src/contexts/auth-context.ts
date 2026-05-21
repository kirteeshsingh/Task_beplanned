import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../lib/database.types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; hasSession: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

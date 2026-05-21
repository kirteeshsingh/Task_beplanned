import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { getInitials, getAvatarColor } from '../lib/utils';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  });

  useEffect(() => {
    profileForm.reset({ full_name: profile?.full_name ?? '' });
  }, [profile?.full_name, profileForm]);

  const onSaveProfile = async (data: ProfileFormData) => {
    setSavingProfile(true);
    const saved = await updateProfile({ full_name: data.full_name });
    setSavingProfile(false);
    if (saved) toast.success('Profile updated');
  };

  return (
    <div className="max-w-xl p-5 lg:p-6">
      <div className="mb-6">
        <p className="bp-command text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">control.center</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">Control Center</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your Beplanned identity and session state</p>
      </div>

      {/* Avatar + name */}
      <div className="bp-panel mb-4 rounded-xl p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-100">Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold"
            style={{ backgroundColor: getAvatarColor(profile?.full_name || 'U') }}
          >
            {getInitials(profile?.full_name || 'User')}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">{profile?.full_name}</p>
            <p className="bp-command text-xs text-slate-500">{profile?.email}</p>
          </div>
        </div>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-3">
          <div>
            <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Full name</label>
            <input
              {...profileForm.register('full_name')}
              type="text"
              className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition"
            />
            {profileForm.formState.errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{profileForm.formState.errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Email</label>
            <input
              value={profile?.email ?? ''}
              disabled
              type="email"
              className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-600">Email cannot be changed</p>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
          >
            {savingProfile ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bp-panel-soft rounded-xl p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Account</h2>
        <p className="mb-3 text-xs text-slate-500">Your account is secured and active.</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="bp-command text-xs text-slate-500">active session</span>
        </div>
      </div>
    </div>
  );
}

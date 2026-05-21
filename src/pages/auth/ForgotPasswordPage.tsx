import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import SupabaseConfigBanner from '../../components/auth/SupabaseConfigBanner';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../../lib/supabase';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!isSupabaseConfigured) {
      toast.error(supabaseConfigError);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error('Failed to send reset email');
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bp-panel w-full max-w-sm rounded-2xl p-6"
      >
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10">
              <CheckCircle className="text-emerald-300" size={22} />
            </div>
            <h1 className="mb-2 text-xl font-semibold text-slate-50">Check your inbox</h1>
            <p className="mb-6 text-sm text-slate-500">
              We sent a password reset link to your email address. It may take a minute to arrive.
            </p>
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-cyan-300 hover:text-cyan-200">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <SupabaseConfigBanner />
            <p className="bp-command mb-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">recovery protocol</p>
            <h1 className="mb-1 text-2xl font-semibold text-slate-50">Reset access key</h1>
            <p className="mb-7 text-sm text-slate-500">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-cyan-200">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}

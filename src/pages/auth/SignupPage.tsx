import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import SupabaseConfigBanner from '../../components/auth/SupabaseConfigBanner';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [loading, navigate, user]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error, hasSession } = await signUp(data.email, data.password, data.fullName);
    setIsSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('already registered') || msg.includes('user already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message || 'Sign up failed');
      }
      return;
    }

    if (hasSession) {
      toast.success('Account created');
      navigate('/dashboard');
    } else {
      toast.success('Account created. Check your email to confirm your account.');
      navigate('/login');
    }
  };

  return (
    <AuthShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bp-panel w-full max-w-sm rounded-2xl p-6"
        >
          <SupabaseConfigBanner />
          <p className="bp-command mb-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">initialize workspace</p>
          <h1 className="mb-1 text-2xl font-semibold text-slate-50">Create Beplanned access</h1>
          <p className="mb-7 text-sm text-slate-500">Spin up your productivity command layer</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Full name</label>
              <input
                {...register('fullName')}
                type="text"
                className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Work email</label>
              <input
                {...register('email')}
                type="email"
                className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="bp-input w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-200"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
              Sign in
            </Link>
          </p>

        </motion.div>
    </AuthShell>
  );
}

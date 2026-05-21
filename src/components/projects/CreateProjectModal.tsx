import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { PROJECT_COLORS } from '../../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Too long'),
  description: z.string().max(200, 'Too long').optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: Props) {
  const { createProject } = useProjects();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const project = await createProject({
      name: data.name,
      description: data.description || '',
      color: selectedColor,
    });
    setIsSubmitting(false);

    if (project) {
      toast.success('Project created');
      onClose();
      navigate(`/projects/${project.id}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.18 }}
          className="bp-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="bp-command text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">workspace.init</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">New Workspace</h2>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-cyan-200">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Workspace name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Name"
                data-testid="workspace-name-input"
                className="bp-input w-full rounded-lg px-3.5 py-2.5 text-sm transition"
                autoFocus
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="bp-command mb-1.5 block text-xs font-medium text-slate-400">Description</label>
              <textarea
                {...register('description')}
                placeholder="Optional details"
                data-testid="workspace-description-input"
                rows={3}
                className="bp-input w-full resize-none rounded-lg px-3.5 py-2.5 text-sm transition"
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="bp-command mb-2 block text-xs font-medium text-slate-400">Signal color</label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bp-panel-soft flex items-center gap-3 rounded-lg p-3">
              <div
                className="w-8 h-8 rounded-lg shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <div>
                <p className="text-xs font-medium text-slate-200">Preview</p>
                <p className="text-xs text-slate-500">Your workspace will appear in the sidebar</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="create-workspace-submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-400 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

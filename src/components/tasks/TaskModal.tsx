import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Tag, User, Flag, AlertTriangle } from 'lucide-react';
import type { TaskWithMeta, Profile, TaskStatus, TaskPriority } from '../../lib/database.types';
import { useTasks } from '../../hooks/useTasks';
import { PRIORITY_CONFIG, STATUS_CONFIG, TASK_STATUSES, getInitials, getAvatarColor } from '../../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  task: TaskWithMeta | null;
  projectId: string;
  members: { user_id: string; profile: Profile }[];
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

export default function TaskModal({ task, projectId, members, onClose, defaultStatus }: Props) {
  const { createTask, updateTask, deleteTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEdit = !!task;

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? defaultStatus ?? 'todo',
      priority: task?.priority ?? 'medium',
      due_date: task?.due_date ?? '',
      assigned_to: task?.assigned_to ?? '',
      tags: task?.tags?.join(', ') ?? '',
    },
  });

  useEffect(() => {
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? defaultStatus ?? 'todo',
      priority: task?.priority ?? 'medium',
      due_date: task?.due_date ?? '',
      assigned_to: task?.assigned_to ?? '',
      tags: task?.tags?.join(', ') ?? '',
    });
  }, [task, reset, defaultStatus]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: data.title,
      description: data.description || '',
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      due_date: data.due_date || null,
      assigned_to: data.assigned_to || null,
      tags,
      project_id: projectId,
    };

    if (isEdit && task) {
      const updated = await updateTask(task.id, payload);
      setIsSubmitting(false);
      if (updated) {
        toast.success('Task updated');
        onClose();
      }
      return;
    }

    const created = await createTask(payload);
    setIsSubmitting(false);
    if (created) {
      toast.success('Task created');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const deleted = await deleteTask(task.id);
    if (!deleted) return;
    toast.success('Task deleted');
    onClose();
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
          className="bp-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5 pb-4">
            <div>
              <p className="bp-command text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">task.packet</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">
                {isEdit ? 'Edit Task' : 'New Task'}
              </h2>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-cyan-200">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            {/* Title */}
            <div>
              <input
                {...register('title')}
                type="text"
                aria-label="Task title"
                placeholder="Title"
                data-testid="task-title-input"
                className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-50 outline-none placeholder:text-slate-600 focus:ring-0"
                autoFocus={!isEdit}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <textarea
                {...register('description')}
                aria-label="Description"
                placeholder="Description"
                data-testid="task-description-input"
                rows={3}
                className="bp-input w-full resize-none rounded-lg p-3 text-sm transition"
              />
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="bp-command mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Flag size={11} />
                  Status
                </label>
                <select
                  {...register('status')}
                  aria-label="Status"
                  data-testid="task-status-select"
                  className="bp-input w-full rounded-lg px-2.5 py-2 text-sm transition"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="bp-command mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <AlertTriangle size={11} />
                  Priority
                </label>
                <select
                  {...register('priority')}
                  aria-label="Priority"
                  data-testid="task-priority-select"
                  className="bp-input w-full rounded-lg px-2.5 py-2 text-sm transition"
                >
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="bp-command mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Calendar size={11} />
                  Due date
                </label>
                <input
                  {...register('due_date')}
                  type="date"
                  aria-label="Due date"
                  data-testid="task-due-date-input"
                  className="bp-input w-full rounded-lg px-2.5 py-2 text-sm transition"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="bp-command mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <User size={11} />
                  Assignee
                </label>
                <select
                  {...register('assigned_to')}
                  aria-label="Assignee"
                  data-testid="task-assignee-select"
                  className="bp-input w-full rounded-lg px-2.5 py-2 text-sm transition"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile.full_name || m.profile.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="bp-command mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Tag size={11} />
                Tags
              </label>
              <input
                {...register('tags')}
                type="text"
                placeholder="Comma-separated tags"
                className="bp-input w-full rounded-lg px-3 py-2 text-sm transition"
              />
            </div>

            {/* Assignee display */}
            {task?.assignee && (
              <div className="flex items-center gap-2 pt-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getAvatarColor(task.assignee.full_name) }}
                >
                  {getInitials(task.assignee.full_name)}
                </div>
                <span className="text-xs text-slate-500">Assigned to <span className="font-medium text-slate-200">{task.assignee.full_name}</span></span>
              </div>
            )}

            {/* Delete confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-red-400/30 bg-red-500/10 p-3"
                >
                  <p className="mb-3 text-sm text-red-200">Are you sure you want to delete this task? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-400"
                    >
                      Delete task
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-lg border border-red-400/30 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (isEdit && !isDirty)}
                data-testid="task-submit-button"
                className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEdit ? (
                  'Save changes'
                ) : (
                  'Create task'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

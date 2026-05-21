import { memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, MessageSquare } from 'lucide-react';
import type { TaskWithMeta } from '../../lib/database.types';
import { PRIORITY_CONFIG, formatDate, isOverdue, getInitials, getAvatarColor } from '../../lib/utils';

interface Props {
  task: TaskWithMeta;
  index: number;
  onClick: (task: TaskWithMeta) => void;
}

function TaskCardInner({ task, index, onClick }: Props) {
  const priority = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          data-testid="task-card"
          className={`group cursor-pointer rounded-xl border p-3 transition-all ${
            snapshot.isDragging
              ? 'rotate-1 border-cyan-300/50 bg-slate-900 shadow-[0_18px_48px_-18px_rgba(34,211,238,0.55)]'
              : overdue && task.status !== 'done'
                ? 'border-red-400/30 bg-red-500/10 hover:border-red-300/60'
                : 'border-slate-800 bg-slate-950/78 hover:border-cyan-400/30 hover:bg-slate-900/90'
          }`}
        >
          {/* Priority + Tags row */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="bp-command inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor] ${priority.dot}`} />
              {priority.label}
            </span>
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="bp-command rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-200/80">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <p className="mb-2.5 line-clamp-2 text-sm font-medium leading-snug text-slate-200 group-hover:text-white">
            {task.title}
          </p>

          {/* Description preview */}
          {task.description && (
            <p className="mb-2.5 line-clamp-2 text-xs text-slate-500">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    overdue ? 'text-red-300' : 'text-slate-500'
                  }`}
                >
                  <Calendar size={10} />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {task.description && (
                <MessageSquare size={11} className="text-slate-600" />
              )}
              {task.assignee && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getAvatarColor(task.assignee.full_name) }}
                  title={task.assignee.full_name}
                >
                  {getInitials(task.assignee.full_name)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export const TaskCard = memo(TaskCardInner);

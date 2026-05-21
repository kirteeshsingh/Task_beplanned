import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import type { TaskWithMeta, TaskStatus, Profile, ProjectMember } from '../../lib/database.types';
import { useTasks } from '../../hooks/useTasks';
import { STATUS_CONFIG, TASK_STATUSES } from '../../lib/utils';
import { TaskCard } from './TaskCard';
import TaskModal from './TaskModal';

interface Props {
  projectId: string;
  members: (ProjectMember & { profile: Profile })[];
  visibleTasks?: TaskWithMeta[];
}

export default function KanbanBoard({ projectId, members, visibleTasks }: Props) {
  const { tasks, moveTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const columns = useMemo(() => {
    const boardTasks = visibleTasks ?? tasks;
    return TASK_STATUSES.reduce((acc, status) => {
      acc[status] = boardTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<TaskStatus, TaskWithMeta[]>);
  }, [tasks, visibleTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    moveTask(draggableId, newStatus, destination.index);
  };

  const openNewTask = (status: TaskStatus) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEditTask = (task: TaskWithMeta) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 gap-3 overflow-x-auto pb-4">
          {TASK_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const colTasks = columns[status] ?? [];
            return (
              <div
                key={status}
                className="flex w-72 shrink-0 flex-col transition-[transform,opacity] duration-200"
              >
                {/* Column header */}
                <div className="mb-1 flex items-center justify-between rounded-t-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5"
                  style={{ borderTopColor: status === 'in_progress' ? '#22D3EE' : status === 'done' ? '#34D399' : status === 'review' ? '#F59E0B' : '#334155', borderTopWidth: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="bp-command text-xs font-semibold text-slate-200">{config.label}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewTask(status)}
                    className="rounded p-0.5 text-slate-500 transition-colors hover:bg-cyan-400/10 hover:text-cyan-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-32 flex-1 space-y-2 rounded-b-xl border border-t-0 border-slate-800 p-2 transition-colors duration-200 ease-out ${
                        snapshot.isDraggingOver ? 'bg-cyan-400/10 ring-1 ring-cyan-300/30' : 'bg-black/20'
                      }`}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={openEditTask}
                        />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="bp-command text-[11px] text-slate-700">drop task packet</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {modalOpen && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          members={members}
          defaultStatus={defaultStatus}
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}

import { isOverdue, TASK_FILTERS, type Priority, type Task, type TaskFilter } from "./types";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-slate-700 text-slate-200",
  medium: "bg-yellow-500/20 text-yellow-300",
  high: "bg-red-500/20 text-red-300",
};

type TaskListProps = {
  /** Already filtered and sorted. */
  tasks: Task[];
  hasAnyTasks: boolean;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onToggle: (task: Task) => void;
  onDelete: (taskId: number) => void;
  today: string;
};

export const TaskList = ({ tasks, hasAnyTasks, filter, onFilterChange, onToggle, onDelete, today }: TaskListProps) => (
  <div className="rounded-xl bg-slate-800 p-5 xl:col-span-2">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-xl font-semibold">Your Tasks</h3>
      <div className="flex gap-2">
        {TASK_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFilterChange(option)}
            className={`rounded px-3 py-1 text-sm capitalize ${
              filter === option ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>

    {tasks.length === 0 ? (
      <p className="text-sm text-slate-400">{hasAnyTasks ? "Nothing here." : "No tasks yet. Add one to get started."}</p>
    ) : (
      <ul className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} overdue={isOverdue(task, today)} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </ul>
    )}
  </div>
);

type TaskItemProps = {
  task: Task;
  overdue: boolean;
  onToggle: (task: Task) => void;
  onDelete: (taskId: number) => void;
};

const TaskItem = ({ task, overdue, onToggle, onDelete }: TaskItemProps) => (
  <li className="flex items-start gap-3 border-b border-slate-700 pb-3">
    <input
      type="checkbox"
      checked={task.is_completed}
      onChange={() => onToggle(task)}
      aria-label={`Mark ${task.title} as ${task.is_completed ? "not done" : "done"}`}
      className="mt-1 h-4 w-4 accent-emerald-500"
    />
    <div className="min-w-0 flex-1">
      <p className={`font-medium ${task.is_completed ? "text-slate-500 line-through" : ""}`}>{task.title}</p>
      {task.description && <p className="text-sm text-slate-400">{task.description}</p>}
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 capitalize ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
        {task.due_date && (
          <span className={overdue ? "text-red-400" : "text-slate-400"}>
            {overdue ? "Overdue: " : "Due: "}
            {task.due_date}
          </span>
        )}
      </div>
    </div>
    <button type="button" onClick={() => onDelete(task.id)} className="text-sm text-slate-400 hover:text-red-400">
      Delete
    </button>
  </li>
);

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: Priority;
  is_completed: boolean;
};

export type TaskFilter = "all" | "active" | "completed";

export const TASK_FILTERS: TaskFilter[] = ["all", "active", "completed"];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const isOverdue = (task: Task, today: string) => !task.is_completed && !!task.due_date && task.due_date < today;

const matchesFilter = (task: Task, filter: TaskFilter) =>
  filter === "active" ? !task.is_completed : filter === "completed" ? task.is_completed : true;

/** Open tasks first, then by due date (no date last), then by priority (high first). */
const compareTasks = (a: Task, b: Task) => {
  if (a.is_completed !== b.is_completed) {
    return a.is_completed ? 1 : -1;
  }
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
};

export const visibleTasks = (tasks: Task[], filter: TaskFilter) =>
  tasks.filter((task) => matchesFilter(task, filter)).sort(compareTasks);

"use client";

import { useState, useEffect, type FormEvent } from "react";

type Priority = "low" | "medium" | "high";

type Task = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: Priority;
  is_completed: boolean;
};

type Filter = "all" | "active" | "completed";

const API_URL = "http://localhost:8000";

const priorityStyles: Record<Priority, string> = {
  low: "bg-slate-700 text-slate-200",
  medium: "bg-yellow-500/20 text-yellow-300",
  high: "bg-red-500/20 text-red-300",
};

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const emptyForm = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium" as Priority,
};

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  const getAuthHeaders = (): HeadersInit | null => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthRequired(true);
      return null;
    }
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (!token) {
          setAuthRequired(true);
          return;
        }

        const response = await fetch(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setAuthRequired(true);
          return;
        }

        const tasksData: unknown = await response.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setAuthRequired(true);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setTaskError("Give your task a title.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      return;
    }

    setIsSaving(true);
    setTaskError("");

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          due_date: formData.due_date || null,
          priority: formData.priority,
        }),
      });
      const result = await response.json();

      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!response.ok) {
        throw new Error(typeof result.detail === "string" ? result.detail : "Unable to create the task.");
      }

      setTasks((current) => [...current, result]);
      setFormData(emptyForm);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to create the task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const headers = getAuthHeaders();
    if (!headers) {
      return;
    }

    setTaskError("");

    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to update the task.");
      }

      const updatedTask: Task = await response.json();
      setTasks((current) => current.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to update the task.");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const headers = getAuthHeaders();
    if (!headers) {
      return;
    }

    setTaskError("");

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!response.ok) {
        throw new Error("Unable to delete the task.");
      }

      setTasks((current) => current.filter((t) => t.id !== taskId));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Unable to delete the task.");
    }
  };

  const today = new Date().toLocaleDateString("en-CA");
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const activeCount = tasks.length - completedCount;
  const overdueCount = tasks.filter((t) => !t.is_completed && t.due_date && t.due_date < today).length;

  // Open tasks first, then by due date (no date last), then by priority
  const visibleTasks = tasks
    .filter((t) => (filter === "active" ? !t.is_completed : filter === "completed" ? t.is_completed : true))
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      if (a.due_date !== b.due_date) {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date < b.due_date ? -1 : 1;
      }
      return priorityRank[a.priority] - priorityRank[b.priority];
    });

  if (loading) {
    return <div className="p-6 text-white">Loading Tasks...</div>;
  }

  if (authRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-white">
        <div className="max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
          <h2 className="mb-3 text-2xl font-bold">Login required</h2>
          <p className="text-slate-300">You must log in before loading your tasks.</p>
          <p className="mt-4 text-sm text-slate-400">Use the login button in the sidebar to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Open Tasks</p>
          <h2 className="mt-2 text-2xl font-bold">{activeCount}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Completed</p>
          <h2 className="mt-2 text-2xl font-bold">{completedCount}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Overdue</p>
          <h2 className={`mt-2 text-2xl font-bold ${overdueCount > 0 ? "text-red-400" : ""}`}>{overdueCount}</h2>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form onSubmit={handleCreateTask} className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Add Task</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="What needs doing?"
              aria-label="Task title"
              className="w-full rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400"
            />
            <textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Notes (optional)"
              aria-label="Task notes"
              rows={3}
              className="w-full rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400"
            />
            <div className="flex gap-3 font-semibold">
              <div className="min-w-0 flex-1">Due Date</div>
              <div className="min-w-0 justify-between">Difficulty</div>
            </div>
            <div className="flex gap-3">
              <input
                type="date"
                value={formData.due_date}
                onChange={(event) => setFormData({ ...formData, due_date: event.target.value })}
                aria-label="Due date"
                className="min-w-0 flex-1 rounded bg-slate-700 px-3 py-2 text-white"
              />
              <select
                value={formData.priority}
                onChange={(event) => setFormData({ ...formData, priority: event.target.value as Priority })}
                aria-label="Priority"
                className="rounded bg-slate-700 px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Add task"}
            </button>
          </div>
          {taskError && <p className="mt-3 text-sm text-red-400" role="alert">{taskError}</p>}
        </form>

        <div className="rounded-xl bg-slate-800 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Your Tasks</h3>
            <div className="flex gap-2">
              {(["all", "active", "completed"] as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded px-3 py-1 text-sm capitalize ${
                    filter === option ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {visibleTasks.length === 0 ? (
            <p className="text-sm text-slate-400">
              {tasks.length === 0 ? "No tasks yet. Add one to get started." : "Nothing here."}
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleTasks.map((task) => {
                const isOverdue = !task.is_completed && !!task.due_date && task.due_date < today;
                return (
                  <li key={task.id} className="flex items-start gap-3 border-b border-slate-700 pb-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleTask(task)}
                      aria-label={`Mark ${task.title} as ${task.is_completed ? "not done" : "done"}`}
                      className="mt-1 h-4 w-4 accent-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${task.is_completed ? "text-slate-500 line-through" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && <p className="text-sm text-slate-400">{task.description}</p>}
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-0.5 capitalize ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className={isOverdue ? "text-red-400" : "text-slate-400"}>
                            {isOverdue ? "Overdue: " : "Due: "}
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-sm text-slate-400 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default TasksPage;

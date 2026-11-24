"use client";

import { useEffect, useState } from "react";
import { API_URL, asArray, authHeaders, errorDetail, errorMessage, getToken } from "../lib/api";
import { getTodayIso } from "../lib/format";
import { AddTaskForm, type NewTask } from "./tasks/AddTaskForm";
import { TaskList } from "./tasks/TaskList";
import { isOverdue, visibleTasks, type Task, type TaskFilter } from "./tasks/types";
import { LoginRequired } from "./ui/LoginRequired";
import { StatCard } from "./ui/StatCard";

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const token = getToken();
        if (!token) {
          setAuthRequired(true);
          return;
        }

        const response = await fetch(`${API_URL}/tasks`, { headers: authHeaders(token) });
        if (!response.ok) {
          setAuthRequired(true);
          return;
        }
        setTasks(asArray<Task>(await response.json()));
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setAuthRequired(true);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  /**
   * Send a request about a task and handle the parts every task request shares:
   * a missing login, a 401, and turning failures into the error shown under the form.
   * Returns the response when it succeeded, otherwise null.
   */
  const sendTaskRequest = async (path: string, init: RequestInit, failureMessage: string) => {
    const token = getToken();
    if (!token) {
      setAuthRequired(true);
      return null;
    }

    setTaskError("");
    try {
      const response = await fetch(`${API_URL}${path}`, { ...init, headers: authHeaders(token, true) });
      if (response.status === 401) {
        setAuthRequired(true);
        return null;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(errorDetail(body, failureMessage));
      }
      return response;
    } catch (error) {
      setTaskError(errorMessage(error, failureMessage));
      return null;
    }
  };

  const handleCreateTask = async (newTask: NewTask) => {
    const response = await sendTaskRequest(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || null,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
        }),
      },
      "Unable to create the task.",
    );
    if (!response) {
      return false;
    }
    const created: Task = await response.json();
    setTasks((current) => [...current, created]);
    return true;
  };

  const handleToggleTask = async (task: Task) => {
    const response = await sendTaskRequest(
      `/tasks/${task.id}`,
      { method: "PATCH", body: JSON.stringify({ is_completed: !task.is_completed }) },
      "Unable to update the task.",
    );
    if (response) {
      const updated: Task = await response.json();
      setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const response = await sendTaskRequest(`/tasks/${taskId}`, { method: "DELETE" }, "Unable to delete the task.");
    if (response) {
      setTasks((current) => current.filter((t) => t.id !== taskId));
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading Tasks...</div>;
  }

  if (authRequired) {
    return <LoginRequired what="your tasks" />;
  }

  const today = getTodayIso();
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const activeCount = tasks.length - completedCount;
  const overdueCount = tasks.filter((t) => isOverdue(t, today)).length;

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Open Tasks" value={activeCount} />
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="Overdue" value={overdueCount} valueClassName={overdueCount > 0 ? "text-red-400" : ""} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AddTaskForm onCreate={handleCreateTask} error={taskError} onValidationError={setTaskError} />
        <TaskList
          tasks={visibleTasks(tasks, filter)}
          hasAnyTasks={tasks.length > 0}
          filter={filter}
          onFilterChange={setFilter}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
          today={today}
        />
      </section>
    </div>
  );
};

export default TasksPage;

"use client";

import { useState, type FormEvent } from "react";
import type { Priority } from "./types";

export type NewTask = {
  title: string;
  description: string;
  due_date: string;
  priority: Priority;
};

const emptyForm: NewTask = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
};

type AddTaskFormProps = {
  /** Save the task. Resolves true when it was saved, so the form can clear itself. */
  onCreate: (task: NewTask) => Promise<boolean>;
  /** Shown under the form; set by the page for any task error. */
  error: string;
  onValidationError: (message: string) => void;
};

export const AddTaskForm = ({ onCreate, error, onValidationError }: AddTaskFormProps) => {
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof NewTask>(field: K, value: NewTask[K]) =>
    setFormData({ ...formData, [field]: value });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      onValidationError("Give your task a title.");
      return;
    }

    setIsSaving(true);
    try {
      if (await onCreate(formData)) {
        setFormData(emptyForm);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800 p-5">
      <h3 className="mb-4 text-xl font-semibold">Add Task</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={formData.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="What needs doing?"
          aria-label="Task title"
          className="w-full rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400"
        />
        <textarea
          value={formData.description}
          onChange={(event) => updateField("description", event.target.value)}
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
            onChange={(event) => updateField("due_date", event.target.value)}
            aria-label="Due date"
            className="min-w-0 flex-1 rounded bg-slate-700 px-3 py-2 text-white"
          />
          <select
            value={formData.priority}
            onChange={(event) => updateField("priority", event.target.value as Priority)}
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
      {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
    </form>
  );
};

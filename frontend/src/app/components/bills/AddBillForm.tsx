"use client";

import { useState, type FormEvent } from "react";
import { API_URL, authHeaders, errorDetail, errorMessage, getToken } from "../../lib/api";
import type { Bill, BillFormData, Category, PrefilledFrom } from "./types";

const INPUT_CLASS = "rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-500";
const LABEL_CLASS = "flex flex-col gap-1 text-sm text-slate-300";

type AddBillFormProps = {
  categories: Category[];
  /** The form's fields. Held by the page so an upload can prefill them. */
  formData: BillFormData;
  setFormData: (data: BillFormData) => void;
  /** Set when the fields came from an uploaded file; that file is linked to the new bill. */
  prefilledFrom: PrefilledFrom | null;
  onClearPrefill: () => void;
  onBillAdded: (bill: Bill) => void;
  onAuthRequired: () => void;
};

export const AddBillForm = ({
  categories,
  formData,
  setFormData,
  prefilledFrom,
  onClearPrefill,
  onBillAdded,
  onAuthRequired,
}: AddBillFormProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // A new upload replaces the form's contents, so old messages about the previous bill no longer apply
  const [shownPrefill, setShownPrefill] = useState(prefilledFrom);
  if (prefilledFrom !== shownPrefill) {
    setShownPrefill(prefilledFrom);
    if (prefilledFrom) {
      setError("");
      setNotice("");
    }
  }

  const updateField = <K extends keyof BillFormData>(field: K, value: BillFormData[K]) =>
    setFormData({ ...formData, [field]: value });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const amount = Number(formData.amount);
    if (!formData.name.trim() || !formData.due_date) {
      setError("Enter a bill name and due date.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const token = getToken();
    if (!token) {
      onAuthRequired();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/bills`, {
        method: "POST",
        headers: authHeaders(token, true),
        body: JSON.stringify({
          name: formData.name.trim(),
          amount,
          due_date: formData.due_date,
          category_id: formData.category_id ? Number(formData.category_id) : null,
          is_recurring: formData.is_recurring,
          bill_file_id: prefilledFrom?.fileId ?? null,
        }),
      });

      if (response.status === 401) {
        onAuthRequired();
        return;
      }
      const result = await response.json();
      if (!response.ok) {
        throw new Error(errorDetail(result, "Unable to add the bill."));
      }

      onBillAdded(result as Bill);
      setNotice(`Added ${result.name}.`);
    } catch (submitError) {
      setError(errorMessage(submitError, "Unable to add the bill."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="mb-4 text-xl font-semibold">Add Bill</h3>
      {prefilledFrom && (
        <p className="mb-3 text-sm text-slate-300" role="status">
          Filled in from {prefilledFrom.filename}. Check each field before adding.{" "}
          <button type="button" onClick={onClearPrefill} className="text-blue-400 underline hover:text-blue-300">
            Clear
          </button>
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={`${LABEL_CLASS} sm:col-span-2`}>
          Name
          <input
            type="text"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="e.g. Internet"
            className={INPUT_CLASS}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            placeholder="0.00"
            className={INPUT_CLASS}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          Due date
          <input
            type="date"
            value={formData.due_date}
            onChange={(event) => updateField("due_date", event.target.value)}
            className="rounded bg-slate-700 px-3 py-2 text-white"
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          Category
          <select
            value={formData.category_id}
            onChange={(event) => updateField("category_id", event.target.value)}
            className="rounded bg-slate-700 px-3 py-2 text-white"
          >
            <option value="">No category</option>
            {categories
              .filter((category) => category.type !== "income")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(event) => updateField("is_recurring", event.target.checked)}
          />
          Repeats monthly
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Adding..." : "Add bill"}
          </button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-400" role="status">{notice}</p>}
    </div>
  );
};

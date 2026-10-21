"use client";

import {useState, useEffect, useRef, type FormEvent} from "react";

type Transaction = {
  id: number;
  user_id: number;
  category_id?: number | null;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  date: string;
};

type Bill = {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  due_date: string;
  category_id?: number | null;
  status?: string;
  is_recurring?: boolean;
};

type Category = {
  id: number;
  name: string;
  type: "expense" | "income" | "savings";
};

type Budget = {
  id: number;
  category_id: number;
  category_name: string | null;
  month: string;
  amount: number;
};

const API_URL = "http://localhost:8000";
const BAR_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

const emptyBillForm = {
  name: "",
  amount: "",
  due_date: "",
  category_id: "",
  is_recurring: true,
};

// "YYYY-MM" for the user's local current month, matching Budget.month and the start of ISO dates
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BillsAndBudgetPage = () => {
  const billFileInputRef = useRef<HTMLInputElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth] = useState(getCurrentMonth);
  const [selectedBillFile, setSelectedBillFile] = useState<File | null>(null);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const [billUploadError, setBillUploadError] = useState("");
  const [billUploadNotice, setBillUploadNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [formData, setFormData] = useState(emptyBillForm);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [billFormError, setBillFormError] = useState("");
  const [billFormNotice, setBillFormNotice] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (!token) {
          setAuthRequired(true);
          return;
        }

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };

        const responses = await Promise.all([
          fetch(`${API_URL}/transactions`, { headers }),
          fetch(`${API_URL}/bills`, { headers }),
          fetch(`${API_URL}/categories`, { headers }),
          fetch(`${API_URL}/budgets?month=${currentMonth}`, { headers }),
        ]);

        if (responses.some((res) => !res.ok)) {
          setAuthRequired(true);
          return;
        }

        const [transactionsData, billsData, categoriesData, budgetsData]: unknown[] = await Promise.all(
          responses.map((res) => res.json()),
        );

        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        setBills(Array.isArray(billsData) ? billsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAuthRequired(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

  const monthlyIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const budgetRows = budgets.map((budget) => {
    const spent = monthTransactions
      .filter((t) => t.type === "expense" && t.category_id === budget.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const limit = Number(budget.amount);
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : spent > 0 ? 100 : 0;
    return {
      ...budget,
      name: budget.category_name ?? "Uncategorized",
      spent,
      limit,
      percent,
      isOver: spent > limit,
    };
  });

  const categoryName = (categoryId?: number | null) =>
    categories.find((category) => category.id === categoryId)?.name;

  const remainingBudget = monthlyIncome - monthlyExpenses;

  const upcomingBillsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const recentTransactions = transactions.slice(0, 3);

  const handleAddBill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBillFormError("");
    setBillFormNotice("");

    const amount = Number(formData.amount);
    if (!formData.name.trim() || !formData.due_date) {
      setBillFormError("Enter a bill name and due date.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setBillFormError("Enter an amount greater than zero.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthRequired(true);
      return;
    }

    setIsSavingBill(true);
    try {
      const response = await fetch(`${API_URL}/bills`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          amount,
          due_date: formData.due_date,
          category_id: formData.category_id ? Number(formData.category_id) : null,
          is_recurring: formData.is_recurring,
        }),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      const result = await response.json();
      if (!response.ok) {
        throw new Error(typeof result.detail === "string" ? result.detail : "Unable to add the bill.");
      }

      setBills((current) => [...current, result as Bill]);
      setFormData(emptyBillForm);
      setBillFormNotice(`Added ${result.name}.`);
    } catch (error) {
      setBillFormError(error instanceof Error ? error.message : "Unable to add the bill.");
    } finally {
      setIsSavingBill(false);
    }
  };

  const handleBillUpload = async () => {
    if (!selectedBillFile) {
      setBillUploadError("Choose a bill file before uploading.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthRequired(true);
      return;
    }

    setIsUploadingBill(true);
    setBillUploadError("");
    setBillUploadNotice("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", selectedBillFile);

      const response = await fetch(`${API_URL}/bills/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      const result = await response.json();

      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!response.ok) {
        throw new Error(result.detail ?? "Unable to upload the bill file.");
      }

      setBillUploadNotice(result.message ?? "Bill file received.");
      setSelectedBillFile(null);
      if (billFileInputRef.current) {
        billFileInputRef.current.value = "";
      }
    } catch (error) {
      setBillUploadError(error instanceof Error ? error.message : "Unable to upload the bill file.");
    } finally {
      setIsUploadingBill(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading Dashboard...</div>;
  }

  if (authRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-white">
        <div className="max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
          <h2 className="mb-3 text-2xl font-bold">Login required</h2>
          <p className="text-slate-300">You must log in before loading your dashboard data.</p>
          <p className="mt-4 text-sm text-slate-400">Use the login button in the sidebar to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Bills & Budget</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Income this month</p>
          <h2 className="mt-2 text-2xl font-bold">${monthlyIncome.toFixed(2)}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Expenses this month</p>
          <h2 className="mt-2 text-2xl font-bold">${monthlyExpenses.toFixed(2)}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Remaining Budget</p>
          <h2 className="mt-2 text-2xl font-bold">${remainingBudget.toFixed(2)}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Bills Due Soon</p>
          <h2 className="mt-2 text-2xl font-bold">${upcomingBillsTotal.toFixed(2)}</h2>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl bg-slate-800 p-5 xl:col-span-2">
          <h3 className="mb-4 text-xl font-semibold">Budget by Category</h3>

          {budgetRows.length === 0 ? (
            <p className="text-sm text-slate-400">No budgets set for {currentMonth} yet.</p>
          ) : (
            <div className="space-y-4">
              {budgetRows.map((row, index) => (
                <div key={row.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.name}</span>
                    <span className={row.isOver ? "text-red-400" : undefined}>
                      {formatMoney(row.spent)} / {formatMoney(row.limit)}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-slate-700">
                    <div
                      className={`h-2 rounded ${row.isOver ? "bg-red-500" : BAR_COLORS[index % BAR_COLORS.length]}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Upcoming Bills</h3>
          {bills.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming bills yet.</p>
          ) : (
            <ul className="space-y-3">
              {bills.slice(0, 3).map((bill) => (
                <li key={bill.id} className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-slate-400">
                      Due: {bill.due_date}
                      {categoryName(bill.category_id) && ` · ${categoryName(bill.category_id)}`}
                    </p>
                  </div>
                  <span className="font-semibold text-red-400">${Number(bill.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400">No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="flex justify-between">
                  <span>{transaction.description ?? "Transaction"}</span>
                  <span className={transaction.type === "income" ? "text-emerald-400" : "text-red-400"}>
                    {transaction.type === "income" ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Add Bill</h3>
          <form onSubmit={handleAddBill} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-300 sm:col-span-2">
              Name
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="e.g. Internet"
                className="rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-500"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                placeholder="0.00"
                className="rounded bg-slate-700 px-3 py-2 text-white placeholder:text-slate-500"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Due date
              <input
                type="date"
                value={formData.due_date}
                onChange={(event) => setFormData({ ...formData, due_date: event.target.value })}
                className="rounded bg-slate-700 px-3 py-2 text-white"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Category
              <select
                value={formData.category_id}
                onChange={(event) => setFormData({ ...formData, category_id: event.target.value })}
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
                onChange={(event) => setFormData({ ...formData, is_recurring: event.target.checked })}
              />
              Repeats monthly
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSavingBill}
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingBill ? "Adding..." : "Add bill"}
              </button>
            </div>
          </form>
          {billFormError && <p className="mt-3 text-sm text-red-400" role="alert">{billFormError}</p>}
          {billFormNotice && <p className="mt-3 text-sm text-emerald-400" role="status">{billFormNotice}</p>}
        </div>
      </section>
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Upload Bill</h3>
          <input
            ref={billFileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            className="hidden"
            aria-label="Choose a bill file"
            onChange={(event) => {
              setSelectedBillFile(event.target.files?.[0] ?? null);
              setBillUploadError("");
              setBillUploadNotice("");
            }}
          />
          <button
            type="button"
            onClick={() => billFileInputRef.current?.click()}
            className="rounded bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600"
          >
            Choose file
          </button>
          {selectedBillFile && (
            <p className="mt-3 text-sm text-slate-300" role="status">
              Selected: {selectedBillFile.name}
            </p>
          )}
          <button
            type="button"
            onClick={handleBillUpload}
            disabled={isUploadingBill}
            className="ml-3 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploadingBill ? "Uploading..." : "Upload bill"}
          </button>
          {billUploadError && <p className="mt-3 text-sm text-red-400" role="alert">{billUploadError}</p>}
          {billUploadNotice && <p className="mt-3 text-sm text-emerald-400" role="status">{billUploadNotice}</p>}
        </div>
      </section>
    </div>
  );
};

export default BillsAndBudgetPage;

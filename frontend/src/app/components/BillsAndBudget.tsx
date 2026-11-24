"use client";

import { useEffect, useState } from "react";
import { API_URL, asArray, authHeaders, getToken } from "../lib/api";
import { formatMoney, getCurrentMonth } from "../lib/format";
import { AddBillForm } from "./bills/AddBillForm";
import { BudgetByCategory } from "./bills/BudgetByCategory";
import { RecentTransactions } from "./bills/RecentTransactions";
import { UpcomingBills } from "./bills/UpcomingBills";
import { UploadBill } from "./bills/UploadBill";
import {
  emptyBillForm,
  type Bill,
  type BillUploadResult,
  type Budget,
  type Category,
  type PrefilledFrom,
  type Transaction,
} from "./bills/types";
import { LoginRequired } from "./ui/LoginRequired";
import { StatCard } from "./ui/StatCard";

const sumAmounts = (items: { amount: number }[]) => items.reduce((sum, item) => sum + Number(item.amount), 0);

/** Turn what the backend read from an uploaded bill into Add Bill form fields. */
const formFromUpload = ({ extracted }: BillUploadResult) => ({
  ...emptyBillForm,
  name: extracted.name ?? "",
  amount: extracted.amount != null ? extracted.amount.toFixed(2) : "",
  due_date: extracted.due_date ?? "",
  category_id: extracted.category_id != null ? String(extracted.category_id) : "",
});

const BillsAndBudgetPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth] = useState(getCurrentMonth);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  // The Add Bill form lives here so an upload can prefill it
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [prefilledFrom, setPrefilledFrom] = useState<PrefilledFrom | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getToken();
        if (!token) {
          setAuthRequired(true);
          return;
        }

        const headers = authHeaders(token);
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
        setTransactions(asArray<Transaction>(transactionsData));
        setBills(asArray<Bill>(billsData));
        setCategories(asArray<Category>(categoriesData));
        setBudgets(asArray<Budget>(budgetsData));
      } catch (error) {
        console.error("Error fetching bills and budget data:", error);
        setAuthRequired(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  const handleBillAdded = (bill: Bill) => {
    setBills((current) => [...current, bill]);
    setBillForm(emptyBillForm);
    setPrefilledFrom(null);
  };

  const handleUploaded = (result: BillUploadResult) => {
    setBillForm(formFromUpload(result));
    setPrefilledFrom({ fileId: result.file_id, filename: result.filename });
  };

  const clearPrefill = () => {
    setPrefilledFrom(null);
    setBillForm(emptyBillForm);
  };

  if (loading) {
    return <div className="p-6 text-white">Loading Dashboard...</div>;
  }

  if (authRequired) {
    return <LoginRequired what="your dashboard data" />;
  }

  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthlyIncome = sumAmounts(monthTransactions.filter((t) => t.type === "income"));
  const monthlyExpenses = sumAmounts(monthTransactions.filter((t) => t.type === "expense"));
  const remainingBudget = monthlyIncome - monthlyExpenses;
  const upcomingBillsTotal = sumAmounts(bills);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Bills & Budget</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Income this month" value={formatMoney(monthlyIncome)} />
        <StatCard label="Expenses this month" value={formatMoney(monthlyExpenses)} />
        <StatCard label="Remaining Budget" value={formatMoney(remainingBudget)} />
        <StatCard label="Bills Due Soon" value={formatMoney(upcomingBillsTotal)} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BudgetByCategory budgets={budgets} monthTransactions={monthTransactions} month={currentMonth} />
        <UpcomingBills bills={bills} categories={categories} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} />
        <AddBillForm
          categories={categories}
          formData={billForm}
          setFormData={setBillForm}
          prefilledFrom={prefilledFrom}
          onClearPrefill={clearPrefill}
          onBillAdded={handleBillAdded}
          onAuthRequired={() => setAuthRequired(true)}
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UploadBill onUploaded={handleUploaded} onAuthRequired={() => setAuthRequired(true)} />
      </section>
    </div>
  );
};

export default BillsAndBudgetPage;

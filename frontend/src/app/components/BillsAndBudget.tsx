"use client";

import {useState, useEffect} from "react";

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
  dued_date: string;
  category_id?: number | null;
  status?: string;
  is_recurring?: boolean;
};

const BillsAndBudgetPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionRes, billRes] = await Promise.all([
          fetch("http://localhost:8000/transactions"),
          fetch("http://localhost:8000/bills"),
        ]);

        const transactionsData = await transactionRes.json();
        const billsData = await billRes.json();

        setTransactions(transactionsData);
        setBills(billsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const remainingBudget = monthlyIncome - monthlyExpenses;

  const upcomingBillsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  if (loading) {
    return <div className="p-6 text-white">Loading Dashboard...</div>
  }
  
  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Bills & Budget</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Monthly Income</p>
          <h2 className="mt-2 text-2xl font-bold">${monthlyIncome.toFixed(2)}</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Monthly Expenses</p>
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

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Housing</span>
                <span>$1,800 / $2,000</span>
              </div>
              <div className="h-2 rounded bg-slate-700">
                <div className="h-2 w-[90%] rounded bg-emerald-500" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Groceries</span>
                <span>$420 / $500</span>
              </div>
              <div className="h-2 rounded bg-slate-700">
                <div className="h-2 w-[84%] rounded bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Transport</span>
                <span>$260 / $300</span>
              </div>
              <div className="h-2 rounded bg-slate-700">
                <div className="h-2 w-[87%] rounded bg-yellow-500" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Entertainment</span>
                <span>$180 / $250</span>
              </div>
              <div className="h-2 rounded bg-slate-700">
                <div className="h-2 w-[72%] rounded bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Upcoming Bills</h3>

          <ul className="space-y-3">
            <li className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <p className="font-medium">Rent</p>
                <p className="text-sm text-slate-400">Due: Sep 25</p>
              </div>
              <span className="font-semibold text-red-400">$1,600</span>
            </li>

            <li className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <p className="font-medium">Electric</p>
                <p className="text-sm text-slate-400">Due: Sep 27</p>
              </div>
              <span className="font-semibold text-yellow-400">$120</span>
            </li>

            <li className="flex items-center justify-between">
              <div>
                <p className="font-medium">Internet</p>
                <p className="text-sm text-slate-400">Due: Sep 30</p>
              </div>
              <span className="font-semibold text-blue-400">$70</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Recent Transactions</h3>
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span>Paycheck</span>
              <span className="text-emerald-400">+$2,400</span>
            </li>
            <li className="flex justify-between">
              <span>Rent</span>
              <span className="text-red-400">-$1,600</span>
            </li>
            <li className="flex justify-between">
              <span>Groceries</span>
              <span className="text-red-400">-$180</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl bg-slate-800 p-5">
          <h3 className="mb-4 text-xl font-semibold">Savings Goal</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span>Emergency Fund</span>
            <span>$4,200 / $6,000</span>
          </div>
          <div className="h-3 rounded bg-slate-700">
            <div className="h-3 w-[70%] rounded bg-emerald-500" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default BillsAndBudgetPage;
import { formatMoney } from "../../lib/format";
import type { Budget, Transaction } from "./types";

const BAR_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

type BudgetByCategoryProps = {
  budgets: Budget[];
  /** Only this month's transactions. */
  monthTransactions: Transaction[];
  month: string;
};

/** How much of each budget has been spent this month, compared to its limit. */
const toBudgetRows = (budgets: Budget[], monthTransactions: Transaction[]) =>
  budgets.map((budget) => {
    const spent = monthTransactions
      .filter((t) => t.type === "expense" && t.category_id === budget.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const limit = Number(budget.amount);
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : spent > 0 ? 100 : 0;
    return {
      id: budget.id,
      name: budget.category_name ?? "Uncategorized",
      spent,
      limit,
      percent,
      isOver: spent > limit,
    };
  });

export const BudgetByCategory = ({ budgets, monthTransactions, month }: BudgetByCategoryProps) => {
  const rows = toBudgetRows(budgets, monthTransactions);

  return (
    <div className="rounded-xl bg-slate-800 p-5 xl:col-span-2">
      <h3 className="mb-4 text-xl font-semibold">Budget by Category</h3>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No budgets set for {month} yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
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
  );
};

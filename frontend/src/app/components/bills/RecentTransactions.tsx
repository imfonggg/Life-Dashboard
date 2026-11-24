import { formatMoney } from "../../lib/format";
import type { Transaction } from "./types";

const TRANSACTIONS_SHOWN = 3;

export const RecentTransactions = ({ transactions }: { transactions: Transaction[] }) => {
  const recent = transactions.slice(0, TRANSACTIONS_SHOWN);

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="mb-4 text-xl font-semibold">Recent Transactions</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400">No transactions yet.</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((transaction) => {
            const isIncome = transaction.type === "income";
            return (
              <li key={transaction.id} className="flex justify-between">
                <span>{transaction.description ?? "Transaction"}</span>
                <span className={isIncome ? "text-emerald-400" : "text-red-400"}>
                  {isIncome ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

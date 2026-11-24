import { formatMoney } from "../../lib/format";
import type { Bill, Category } from "./types";

const BILLS_SHOWN = 3;

type UpcomingBillsProps = {
  bills: Bill[];
  categories: Category[];
};

export const UpcomingBills = ({ bills, categories }: UpcomingBillsProps) => {
  const categoryName = (categoryId?: number | null) =>
    categories.find((category) => category.id === categoryId)?.name;

  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <h3 className="mb-4 text-xl font-semibold">Upcoming Bills</h3>
      {bills.length === 0 ? (
        <p className="text-sm text-slate-400">No upcoming bills yet.</p>
      ) : (
        <ul className="space-y-3">
          {bills.slice(0, BILLS_SHOWN).map((bill) => {
            const category = categoryName(bill.category_id);
            return (
              <li key={bill.id} className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div>
                  <p className="font-medium">{bill.name}</p>
                  <p className="text-sm text-slate-400">
                    Due: {bill.due_date}
                    {category && ` · ${category}`}
                  </p>
                </div>
                <span className="font-semibold text-red-400">{formatMoney(bill.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

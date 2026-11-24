type StatCardProps = {
  label: string;
  value: string | number;
  valueClassName?: string;
};

/** One of the summary numbers across the top of a dashboard page. */
export const StatCard = ({ label, value, valueClassName = "" }: StatCardProps) => (
  <div className="rounded-xl bg-slate-800 p-4">
    <p className="text-sm text-slate-400">{label}</p>
    <h2 className={`mt-2 text-2xl font-bold ${valueClassName}`.trim()}>{value}</h2>
  </div>
);

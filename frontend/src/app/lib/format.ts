// Small formatting helpers shared by the dashboard pages.

/** "$1,234.56" */
export const formatMoney = (amount: number) =>
  `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "YYYY-MM" for the user's local current month, matching Budget.month and the start of ISO dates. */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/** "YYYY-MM-DD" for the user's local today, so it compares directly with due dates from the API. */
export const getTodayIso = () => new Date().toLocaleDateString("en-CA");

// Shapes of the data the bills & budget API returns.

export type Transaction = {
  id: number;
  user_id: number;
  category_id?: number | null;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  date: string;
};

export type Bill = {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  due_date: string;
  category_id?: number | null;
  status?: string;
  is_recurring?: boolean;
};

export type Category = {
  id: number;
  name: string;
  type: "expense" | "income" | "savings";
};

export type Budget = {
  id: number;
  category_id: number;
  category_name: string | null;
  month: string;
  amount: number;
};

/** Bill details read from an uploaded file; any of them may be missing. */
export type ExtractedBill = {
  name: string | null;
  amount: number | null;
  due_date: string | null;
  category_id: number | null;
  category_name: string | null;
};

export type BillUploadResult = {
  file_id: number;
  filename: string;
  extracted: ExtractedBill;
  message: string;
};

/** The Add Bill form's fields, kept as strings the way the inputs hold them. */
export type BillFormData = {
  name: string;
  amount: string;
  due_date: string;
  category_id: string;
  is_recurring: boolean;
};

export const emptyBillForm: BillFormData = {
  name: "",
  amount: "",
  due_date: "",
  category_id: "",
  is_recurring: true,
};

/** The uploaded file the Add Bill form was prefilled from. */
export type PrefilledFrom = { fileId: number; filename: string };

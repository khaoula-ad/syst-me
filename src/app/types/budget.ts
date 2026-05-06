export type BudgetStatus = "PENDING" | "APPROVED" | "LOST" | "INVALID";

export interface Budget {
  id: string;
  name: string;
  amount: number;
  createdBy: string;
  status: BudgetStatus;
  createdAt: string;
}
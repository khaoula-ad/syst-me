export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface BudgetAlertEmailParams {
  budgetName: string;
  userName: string;
  reason: string;
}

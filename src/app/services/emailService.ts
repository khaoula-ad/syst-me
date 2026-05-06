import { sendRawEmail } from './gmailService';
import { BudgetAlertEmailParams } from '../types/email';

export async function sendBudgetAlertEmail(params: BudgetAlertEmailParams): Promise<void> {
  await sendRawEmail({
    budgetName: params.budgetName,
    userName: params.userName,
    reason: params.reason,
  });
}

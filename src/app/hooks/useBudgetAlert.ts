import { useCallback } from 'react';
import { sendBudgetAlertEmail } from '../services/emailService';
import { Budget } from '../types/budget';

export function useBudgetAlert() {
  const checkAndAlert = useCallback(async (budget: Budget): Promise<void> => {
    if (budget.status === 'LOST' || budget.status === 'INVALID') {
      await sendBudgetAlertEmail({
        budgetName: budget.name,
        userName: budget.createdBy,
        reason: `Budget marked as ${budget.status}`,
      });
    }
  }, []);

  return { checkAndAlert };
}

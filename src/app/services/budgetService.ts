import { Budget } from "../types/budget";
import { sendBudgetAlertEmail } from "./emailService";

export const updateBudgetStatus = (budget: Budget, newStatus: Budget["status"]) => {
  const updatedBudget = {
    ...budget,
    status: newStatus,
  };

  // 🔥 TRIGGER EMAIL AUTOMATIQUE
  if (newStatus === "LOST" || newStatus === "INVALID") {
    sendBudgetAlertEmail({
      budgetName: budget.name,
      userName: budget.createdBy,
      reason: `Budget marked as ${newStatus}`,
    });
  }

  return updatedBudget;
};
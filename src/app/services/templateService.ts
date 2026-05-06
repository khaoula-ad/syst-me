import { BudgetAlertEmailParams } from '../types/email';

export function buildBudgetAlertBody(params: BudgetAlertEmailParams): string {
  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });

  return [
    'Bonjour,',
    '',
    'Une opération a dépassé le budget autorisé dans le Système de Validation Budgétaire.',
    '',
    '--- Détails de l\'opération ---',
    `Identifiant budget : ${params.budgetName}`,
    `Responsable        : ${params.userName}`,
    `Motif              : ${params.reason}`,
    `Date               : ${timestamp}`,
    '------------------------------',
    '',
    'Veuillez justifier le motif de cet achat ou recourir à une dérogation.',
    'Sans justification, la demande sera classée comme non validée.',
    '',
    'Cordialement,',
    'Système de Validation Budgétaire',
  ].join('\n');
}

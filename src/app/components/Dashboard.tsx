import { useState, useEffect, useCallback } from 'react';
import { sendBudgetAlertEmail } from '../services/emailService';
import { CheckCircle2, XCircle, User, Wallet, AlertTriangle, Clock, Mail, FileText, Download } from 'lucide-react';

interface BudgetEntry {
  id: string;
  nom: string;
  prenom: string;
  prixAchat: number;
  budgetUtilise: number;
  statut: 'validé' | 'non-validé' | 'en-attente' | 'en-cours';
  justification?: string;
}

interface Justification {
  entryId: string;
  nom: string;
  prenom: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
}

const SERVER_URL = 'https://budget-server-84qj.onrender.com';

export default function Dashboard() {
  const [globalBudget, setGlobalBudget] = useState(10000);
  const [budgetInput, setBudgetInput] = useState('10000');
  const [justifications, setJustifications] = useState<Justification[]>([]);

  const [entries, setEntries] = useState<BudgetEntry[]>([
    { id: 'USR001', nom: 'Dupont', prenom: 'Marie', prixAchat: 8000, budgetUtilise: 10000, statut: 'validé' },
    { id: 'USR002', nom: 'Martin', prenom: 'Pierre', prixAchat: 120000, budgetUtilise: 100000, statut: 'en-attente' },
    { id: 'USR003', nom: 'Bernard', prenom: 'Lucas', prixAchat: 50000, budgetUtilise: 30000, statut: 'non-validé' },
  ]);

  const [formData, setFormData] = useState({ nom: '', prenom: '', identifiant: '', prixAchat: '' });
  const [showEmailAlert, setShowEmailAlert] = useState(false);

  const fetchJustifications = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/justifications`);
      const data = await res.json();
      setJustifications(data);
    } catch { /* server not running */ }
  }, []);

  const checkExpiredEntries = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/expired-entries`);
      const expired: { entryId: string }[] = await res.json();
      if (expired.length === 0) return;
      setEntries(prev =>
        prev.map(e => {
          const isExpired = expired.some(ex => ex.entryId === e.id);
          return isExpired && e.statut === 'en-attente' ? { ...e, statut: 'non-validé' } : e;
        })
      );
      await Promise.all(
        expired.map(ex => fetch(`${SERVER_URL}/pending-entries/${encodeURIComponent(ex.entryId)}`, { method: 'DELETE' }))
      );
    } catch { /* server not running */ }
  }, []);

  useEffect(() => {
    fetchJustifications();
    checkExpiredEntries();
    const interval = setInterval(fetchJustifications, 5000);
    const expiredInterval = setInterval(checkExpiredEntries, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(expiredInterval);
    };
  }, [fetchJustifications, checkExpiredEntries]);

  const handleBudgetUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = parseFloat(budgetInput);
    if (!isNaN(newBudget) && newBudget > 0) setGlobalBudget(newBudget);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prixAchat = parseFloat(formData.prixAchat);
    const statut = prixAchat <= globalBudget ? 'validé' : 'en-attente';

    const newEntry: BudgetEntry = {
      id: formData.identifiant,
      nom: formData.nom,
      prenom: formData.prenom,
      prixAchat,
      budgetUtilise: globalBudget,
      statut,
    };

    setEntries(prev => [...prev, newEntry]);

    if (prixAchat > globalBudget) {
      setShowEmailAlert(true);
      sendBudgetAlertEmail({
        budgetName: formData.identifiant,
        userName: `${formData.prenom} ${formData.nom}`,
        reason: `Prix d'achat (${prixAchat.toLocaleString('fr-FR')} DH) dépasse le budget autorisé (${globalBudget.toLocaleString('fr-FR')} DH)`,
      }).catch(console.error);
    }

    setFormData({ nom: '', prenom: '', identifiant: '', prixAchat: '' });
  };

  const handleDecision = async (justif: Justification, decision: 'validé' | 'non-validé') => {
    try {
      await fetch(`${SERVER_URL}/entries/${encodeURIComponent(justif.entryId)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      await fetch(`${SERVER_URL}/justifications/${encodeURIComponent(justif.entryId)}`, { method: 'DELETE' });
      setEntries(prev =>
        prev.map(e =>
          e.id === justif.entryId && e.nom === justif.nom && e.prenom === justif.prenom
            ? { ...e, statut: decision }
            : e
        )
      );
      fetchJustifications();
    } catch {
      console.error('Erreur lors de la décision');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">

      {showEmailAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEmailAlert(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Alerte envoyée</h2>
            </div>
            <p className="text-slate-700 mb-4">Un email a été envoyé avec un lien pour déposer la justification.</p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
              <p className="font-medium text-slate-900 mb-2">Détails de l'email :</p>
              <p className="text-slate-600 mb-1"><span className="font-medium">Destinataire :</span> safaasalmi2003@gmail.com</p>
              <p className="text-slate-600"><span className="font-medium">Objet :</span> Alerte – Dépassement de budget</p>
            </div>
            <button onClick={() => setShowEmailAlert(false)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors">OK</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Système de Validation Budgétaire</h1>
        </div>

        {/* Budget global */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-slate-900">Contrôle du budget global</h2>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700 mb-2">Budget actuel</div>
              <div className="text-3xl font-semibold text-blue-600 mb-2">{globalBudget.toLocaleString('fr-FR')} DH</div>
              <p className="text-sm text-slate-500 mb-1">Ce budget s'applique uniquement aux nouvelles opérations</p>
              <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                <Mail className="w-4 h-4" />
                <span>Un email est envoyé automatiquement en cas de dépassement du budget</span>
              </div>
            </div>
            <form onSubmit={handleBudgetUpdate} className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau budget</label>
                <input type="number" step="0.01" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
                  className="w-48 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0.00" required />
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors whitespace-nowrap">Modifier budget</button>
            </form>
          </div>
        </div>

        {/* Justifications reçues */}
        {justifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-slate-900">Justifications reçues</h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">{justifications.length}</span>
            </div>
            <div className="space-y-4">
              {justifications.map(justif => (
                <div key={justif.entryId} className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-slate-900">{justif.prenom} {justif.nom}</p>
                    <p className="text-sm text-slate-500">Dossier : <span className="font-medium text-slate-700">{justif.entryId}</span></p>
                    <p className="text-sm text-slate-500">Reçu le : {new Date(justif.uploadedAt).toLocaleString('fr-FR')}</p>
                    <a
                      href={`${SERVER_URL}/uploads/${justif.filename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {justif.originalName}
                    </a>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDecision(justif, 'validé')}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Valider
                    </button>
                    <button
                      onClick={() => handleDecision(justif, 'non-validé')}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Historique des validations</h2>
          <p className="text-sm text-slate-500 mb-6">Chaque ligne affiche le budget qui était actif au moment de l'opération</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Nom</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">Prénom</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700">ID</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Prix d'achat</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-slate-700">Budget utilisé</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-slate-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-slate-900">{entry.nom}</td>
                    <td className="py-4 px-4 text-slate-900">{entry.prenom}</td>
                    <td className="py-4 px-4 text-slate-600">{entry.id}</td>
                    <td className="py-4 px-4 text-right text-slate-900">{entry.prixAchat.toLocaleString('fr-FR')} DH</td>
                    <td className="py-4 px-4 text-right text-slate-900">{entry.budgetUtilise.toLocaleString('fr-FR')} DH</td>
                    <td className="py-4 px-4 text-center">
                      {entry.statut === 'validé' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Validé
                        </span>
                      ) : entry.statut === 'en-attente' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" /> En attente de justification
                        </span>
                      ) : entry.statut === 'en-cours' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                          <Clock className="w-4 h-4" /> En cours
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                          <XCircle className="w-4 h-4" /> Non validé
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nouvelle validation */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Nouvelle validation</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
              <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Nom" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
              <input type="text" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Prénom" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Identifiant</label>
              <input type="text" value={formData.identifiant} onChange={e => setFormData({ ...formData, identifiant: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="USR001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prix d'achat</label>
              <input type="number" step="0.01" value={formData.prixAchat} onChange={e => setFormData({ ...formData, prixAchat: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0.00" required />
            </div>
            <div className="col-span-2">
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors">Valider</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

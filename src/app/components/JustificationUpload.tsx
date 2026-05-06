import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Upload, CheckCircle2 } from 'lucide-react';

export default function JustificationUpload() {
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get('id') ?? '';
  const nom = searchParams.get('nom') ?? '';
  const prenom = searchParams.get('prenom') ?? '';

  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entryId', entryId);
    formData.append('nom', nom);
    formData.append('prenom', prenom);

    try {
      const res = await fetch('http://localhost:3001/upload-justification', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setSubmitted(true);
    } catch {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Justification envoyée</h2>
          <p className="text-slate-600">Votre fichier a été transmis. Votre dossier est en cours de traitement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Justification de dépassement</h1>
        <p className="text-slate-500 text-sm mb-6">
          {prenom} {nom} — Dossier <span className="font-medium text-slate-700">{entryId}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            {file ? (
              <p className="text-sm font-medium text-blue-600">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">Cliquez pour choisir un fichier</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, Image (max 10 MB)</p>
              </>
            )}
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer la justification'}
          </button>
        </form>
      </div>
    </div>
  );
}

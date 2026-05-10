import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// In-memory store for justifications (keyed by entryId)
const justifications = {};

// In-memory store for pending entries (keyed by entryId)
const pendingEntries = {};

// In-memory store for all entries and their statuses
const entriesStore = {};

const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function sendEmail(to, subject, text) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Budget App', email: 'adadd.khaoula@gmail.com' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }
}

// Send alert email with justification link
app.post('/send-email', async (req, res) => {
  const { budgetName, userName, reason } = req.body;
  if (!budgetName || !userName || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
  const [prenom, ...nomParts] = userName.split(' ');
  const nom = nomParts.join(' ');
  const justifLink = `https://syst-me.vercel.app/justification?id=${encodeURIComponent(budgetName)}&nom=${encodeURIComponent(nom)}&prenom=${encodeURIComponent(prenom)}`;

  const body = [
    'Bonjour,',
    '',
    'Une opération a dépassé le budget autorisé dans le Système de Validation Budgétaire.',
    '',
    "--- Détails de l'opération ---",
    `Identifiant budget : ${budgetName}`,
    `Responsable        : ${userName}`,
    `Motif              : ${reason}`,
    `Date               : ${timestamp}`,
    '------------------------------',
    '',
    'Veuillez justifier le motif de cet achat ou recourir à une dérogation.',
    'Sans justification, la demande sera classée comme non validée.',
    '⚠️ Attention : votre statut sera automatiquement marqué comme Non Validé au bout de 24h sans réponse.',
    '',
    `👉 Déposer votre justification ici : ${justifLink}`,
    '',
    'Cordialement,',
    'Système de Validation Budgétaire',
  ].join('\n');

  try {
    await sendEmail('safaasalmi2003@gmail.com', 'Alerte – Dépassement de budget', body);

    // Store entry as pending with timestamp
    pendingEntries[budgetName] = {
      entryId: budgetName,
      userName,
      sentAt: new Date().toISOString(),
      statut: 'en-attente',
    };

    // Store in entries store
    entriesStore[budgetName] = {
      entryId: budgetName,
      userName,
      statut: 'en-attente',
    };

    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Upload justification file
app.post('/upload-justification', upload.single('file'), (req, res) => {
  const { entryId, nom, prenom } = req.body;
  if (!req.file || !entryId) return res.status(400).json({ error: 'Missing file or entryId' });

  const key = `${entryId}_${nom}_${prenom}`;
  justifications[key] = {
    entryId,
    nom,
    prenom,
    filename: req.file.filename,
    originalName: req.file.originalname,
    uploadedAt: new Date().toISOString(),
  };

  res.json({ success: true });
});

// Get all justifications
app.get('/justifications', (_, res) => {
  res.json(Object.values(justifications));
});

// Get expired entries (pending for more than 24h)
app.get('/expired-entries', (_, res) => {
  const now = new Date();
  const expired = Object.values(pendingEntries).filter(entry => {
    const sentAt = new Date(entry.sentAt);
    const diffHours = (now - sentAt) / (1000 * 60 * 60);
    return diffHours >= 24 && entry.statut === 'en-attente';
  });
  res.json(expired);
});

// Mark entry as processed (justified or expired)
app.delete('/pending-entries/:entryId', (req, res) => {
  delete pendingEntries[req.params.entryId];
  res.json({ success: true });
});

// Update entry status after decision
app.post('/entries/:entryId/decision', (req, res) => {
  const { decision } = req.body;
  const { entryId } = req.params;
  if (entriesStore[entryId]) entriesStore[entryId].statut = decision;
  delete pendingEntries[entryId];
  res.json({ success: true });
});

// Get all entry statuses
app.get('/entries', (_, res) => {
  res.json(Object.values(entriesStore));
});

// Auto-check every hour and log expired entries
setInterval(() => {
  const now = new Date();
  Object.values(pendingEntries).forEach(entry => {
    const diffHours = (now - new Date(entry.sentAt)) / (1000 * 60 * 60);
    if (diffHours >= 24 && entry.statut === 'en-attente') {
      entry.statut = 'non-validé';
      if (entriesStore[entry.entryId]) entriesStore[entry.entryId].statut = 'non-validé';
      console.log(`Entry ${entry.entryId} auto-marked as non-validé after 24h`);
    }
  });
}, 60 * 60 * 1000);

// Delete justification after decision
app.delete('/justifications/:entryId', (req, res) => {
  const keyToDelete = Object.keys(justifications).find(k => k.startsWith(req.params.entryId + '_'));
  if (keyToDelete) delete justifications[keyToDelete];
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Email server running on port ${PORT}`));

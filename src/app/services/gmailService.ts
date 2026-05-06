const SERVER_URL = 'https://budget-server-84qj.onrender.com';

export interface RawEmail {
  budgetName: string;
  userName: string;
  reason: string;
}

export async function sendRawEmail(email: RawEmail): Promise<void> {
  const res = await fetch(`${SERVER_URL}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email server error: ${err}`);
  }
}

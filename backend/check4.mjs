import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const JWT_SECRET = 'cashflow_secret_key_123!';
// The user is likely Zela based on the screenshots (or Iqbal). Let's mock Zela.
const token = jwt.sign({ id: 'zela-id', username: 'Zela', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

async function check() {
  const res = await fetch('http://localhost:5000/api/transactions/stats', { headers: { 'Authorization': 'Bearer ' + token } });
  const data = await res.json();
  console.log("Stats API response for Zela:");
  console.log(JSON.stringify(data, null, 2));
}

check();

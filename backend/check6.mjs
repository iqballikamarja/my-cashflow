import jwt from 'jsonwebtoken';

const JWT_SECRET = 'cashflow_secret_key_123!';
const token = jwt.sign({ id: 'zela-id', username: 'Zela', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

async function check() {
  try {
    const res = await fetch('http://localhost:5000/api/transactions/stats', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    console.log("API response:");
    console.log(JSON.stringify(data, null, 2));
  } catch(e) { console.error(e) }
}

check();

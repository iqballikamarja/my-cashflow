import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: 'admin-id', username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'rahasia', { expiresIn: '1d' });
fetch('http://localhost:5000/api/transactions/stats', { headers: { 'Authorization': 'Bearer ' + token } })
  .then(res => res.json())
  .then(console.log).catch(console.error);

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CirclePlus, CalendarDays, Wallet, Tag, DollarSign, FileText, Send } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { API_URL } from '../config';

const CATEGORIES_OUT = ['Fix', 'Kitchen', 'Jajan', 'Mio', 'Iqbal', 'Zela', 'Alfa', 'Sedekah', 'Bathroom', 'Lainnya'];
const CATEGORIES_IN = ['Gaji', 'TikTok', 'Lainnya'];

export default function AddTransaction() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: 'OUT', account: '', toAccount: '-',
    category: '', amount: '', description: '',
    date: new Date()
  });
  const [allAccounts, setAllAccounts] = useState({ Iqbal: [], Zela: [] });
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_URL}/api/accounts/all`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.message) {
          setAllAccounts(data);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/categories`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCategories(data);
        }
      })
      .catch(() => {});
  }, [token]);

  const categories = form.type === 'TRANSFER' ? [] : allCategories.filter(c => c.type === form.type).map(c => c.name);
  
  const myUsername = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
  const myAccounts = allAccounts[myUsername] || [];

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'type') { updated.category = ''; updated.toAccount = '-'; }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccess(''); setError('');
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: `POST`, 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ ...form, amount: parseInt(form.amount, 10),
          date: format(form.date, 'yyyy-MM-dd'),
          transactionId: 'TRX-WEB-' + Date.now(),
          category: form.type === 'TRANSFER' ? 'Pindah Saldo' : form.category
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Transaksi berhasil dicatat! (' + data.transactionId + ')');
        setForm(prev => ({ ...prev, amount: '', description: '', category: '' }));
      } else { setError(data.message || 'Gagal menyimpan'); }
    } catch (err) { setError('Gagal koneksi ke server'); }
    setLoading(false);
  };

    const groupedAccounts = {};
  let otherAccountsCount = 0;
  for (const [u, accs] of Object.entries(allAccounts)) {
    const validAccs = accs.filter(a => !(u.toLowerCase() === myUsername && a === form.account));
    if (validAccs.length > 0) {
      groupedAccounts[u] = validAccs;
      otherAccountsCount += validAccs.length;
    }
  }

  return (
    <div>
      <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CirclePlus size={28} /> Catat Transaksi
      </h1>
      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label className="form-label"><CalendarDays size={16} /> Tanggal</label>
            <DatePicker
              selected={form.date}
              onChange={(date) => handleChange('date', date)}
              dateFormat="dd MMMM yyyy"
              locale={id}
              className="form-input"
              wrapperClassName="date-picker"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label"><Tag size={16} /> Jenis Transaksi</label>
            <select className="form-input" value={form.type} onChange={e => handleChange('type', e.target.value)} required>
              <option value="OUT">🔴 Pengeluaran (OUT)</option>
              <option value="IN">🟢 Pemasukan (IN)</option>
              <option value="TRANSFER">🔄 Transfer (Move)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label"><Wallet size={16} /> Dompet / Rekening Anda</label>
            <select className="form-input" value={form.account}
              onChange={e => handleChange('account', e.target.value)} required>
              <option value="">-- Pilih Rekening --</option>
              {myAccounts.map(acc => (<option key={acc} value={acc}>{acc}</option>))}
            </select>
            {myAccounts.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', margin: '0.25rem 0 0' }}>
                Belum ada rekening. Klik Tambah Rekening di menu Rekening.
              </p>
            )}
          </div>

          {form.type === 'TRANSFER' && (
            <div className="form-group">
              <label className="form-label"><Wallet size={16} /> Tujuan Transfer</label>
                              <select className="form-input" style={{ fontWeight: 500 }} value={form.toAccount}
                  onChange={e => handleChange('toAccount', e.target.value)} required>
                  <option value="">-- Pilih Tujuan --</option>
                  {Object.entries(groupedAccounts).map(([u, accs]) => (
                    <optgroup key={u} label={u.toLowerCase() === 'iqbal' ? '👨 Iqbal' : u.toLowerCase() === 'zela' ? '👩 Zela' : `👤 ${u.charAt(0).toUpperCase() + u.slice(1)}`}>
                      {accs.map(a => (
                        <option key={`${u}-${a}`} value={`${u}-${a}`}>{a}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {otherAccountsCount === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', margin: '0.25rem 0 0' }}>
                  Belum ada rekening tujuan. Tambahkan rekening di menu Rekening terlebih dahulu.
                </p>
              )}
            </div>
          )}

          {form.type !== 'TRANSFER' && (
            <div className="form-group">
              <label className="form-label"><Tag size={16} /> Kategori</label>
              <select className="form-input" value={form.category} onChange={e => handleChange('category', e.target.value)} required>
                <option value="">-- Pilih Kategori --</option>
                {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label"><DollarSign size={16} /> Nominal (Rp)</label>
            <input type="number" className="form-input" placeholder="50000"
              value={form.amount} onChange={e => handleChange('amount', e.target.value)} required min="1" />
          </div>

          <div className="form-group">
            <label className="form-label"><FileText size={16} /> Keterangan</label>
            <input type="text" className="form-input" 
              placeholder={form.type === 'TRANSFER' ? 'Tarik Tunai, Terima Tunai, dll...' : form.type === 'IN' ? 'Gaji, Tiktok, dll...' : 'Nasi Padang, Bensin, dll...'}
              value={form.description} onChange={e => handleChange('description', e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={18} /> {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
          
          {success && <div className="alert-success">{success}</div>}
          {error && <div className="alert-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

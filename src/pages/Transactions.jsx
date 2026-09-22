import React, { useState, useEffect } from 'react';
import { Receipt, Trash2, Edit3, X, Save, CalendarDays, Tag, Wallet, DollarSign, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { API_URL } from '../config';

const CATEGORIES_OUT = ['Fix', 'Kitchen', 'Jajan', 'Mio', 'Iqbal', 'Zela', 'Alfa', 'Sedekah', 'Bathroom', 'Lainnya'];
const CATEGORIES_IN = ['Gaji', 'TikTok', 'Lainnya'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Transactions() {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAccounts, setAllAccounts] = useState({ Iqbal: [], Zela: [] });
  const [allCategories, setAllCategories] = useState([]);
  
  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [periodText, setPeriodText] = useState('Semua Waktu');
  const [queryObj, setQueryObj] = useState({});
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [tempMonth, setTempMonth] = useState(now.getMonth() + 1);
  const [tempYear, setTempYear] = useState(now.getFullYear());
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  const token = localStorage.getItem('token');

  const fetchTransactions = () => {
    setLoading(true);
    let url = `${API_URL}/api/transactions`;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get(`view`) || 'all';
    const q = [];
    if (queryObj.month && queryObj.year) q.push(`month=${queryObj.month}&year=${queryObj.year}`);
    if (user?.role === 'admin' && viewParam !== 'all') q.push(`user=${viewParam}`);
    if (q.length > 0) url += '?' + q.join('&');
    fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTransactions(data.filter(t => t.source !== 'Migrasi Excel').sort((a, b) => new Date(b.date) - new Date(a.date))); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetchTransactions();
  }, [token, queryObj, location.search]);

  useEffect(() => {
    fetch(`${API_URL}/api/categories/all`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => setAllCategories(data))
      .catch(console.error);
      
    fetch(`${API_URL}/api/accounts/all`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json()).then(data => setAllAccounts(data)).catch(() => {});
  }, [token]);

  const handleThisMonth = () => {
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    setQueryObj({ month: m, year: y });
    setPeriodText(`${MONTHS[m - 1]} ${y}`);
  };

  const handleAllTime = () => {
    setQueryObj({});
    setPeriodText('Semua Waktu');
  };

  const applyCustomPeriod = (e) => {
    e.preventDefault();
    setQueryObj({ month: tempMonth, year: tempYear });
    setPeriodText(`${MONTHS[tempMonth - 1]} ${tempYear}`);
    setShowPeriodModal(false);
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin mau hapus transaksi ini?')) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) fetchTransactions();
    } catch (err) {}
  };

  const handleEdit = (t) => {
    setEditTx(t);
    setEditForm({ 
      date: t.date, type: t.type, account: t.account, toAccount: t.toAccount,
      category: t.category, amount: t.amount, description: t.description 
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'type') { updated.category = ''; updated.toAccount = '-'; }
      return updated;
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (payload.type === 'TRANSFER') payload.category = 'Pindah Saldo';
      
      const res = await fetch(`${API_URL}/api/transactions/${editTx._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) { setEditTx(null); fetchTransactions(); }
    } catch (err) {}
    setSaving(false);
  };

  const categories = editForm?.type === 'TRANSFER' ? [] : allCategories.filter(c => c.type === editForm?.type).map(c => c.name);
  const txOwner = editTx?.user || user.username;
  const myAccounts = Object.keys(allAccounts).length > 0 && allAccounts[txOwner] 
    ? allAccounts[txOwner] 
    : (allAccounts[txOwner.charAt(0).toUpperCase() + txOwner.slice(1).toLowerCase()] || []);

  const otherUsersAccounts = [];
  for (const [u, accs] of Object.entries(allAccounts)) {
    accs.forEach(a => {
      if (u.toLowerCase() !== txOwner.toLowerCase() || a !== editForm?.account) {
        otherUsersAccounts.push(u + '-' + a);
      }
    });
  }

  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼'; // Up/Down Triangles
  };
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    if (sortConfig.key === 'account') {
      aVal = a.type === 'TRANSFER' ? a.account + ' ' + a.toAccount : a.account;
      bVal = b.type === 'TRANSFER' ? b.account + ' ' + b.toAccount : b.account;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="sticky-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Receipt size={28} /> Riwayat Transaksi
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="btn-group">
              <button onClick={handleAllTime} className={`btn-toggle ${Object.keys(queryObj).length === 0 ? 'active' : ''}`}>Semua</button>
              <button onClick={handleThisMonth} className={`btn-toggle ${queryObj.month === now.getMonth() + 1 ? 'active' : ''}`}>Bulan Ini</button>
              <button onClick={() => setShowPeriodModal(true)} className={`btn-toggle ${queryObj.month && queryObj.month !== now.getMonth() + 1 ? 'active' : ''}`}>
                <Calendar size={16} /> Pilih
              </button>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Menampilkan data: <strong>{periodText}</strong></p>
      </div>

      {loading ? (
         <div className="text-body">Loading...</div>
      ) : (
        <div className="card" style={{ marginTop: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('date')}>Tanggal{getSortIcon('date')}</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('user')}>User{getSortIcon('user')}</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('type')}>Jenis{getSortIcon('type')}</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('account')}>Rekening{getSortIcon('account')}</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('category')}>Kategori{getSortIcon('category')}</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Keterangan</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Nominal</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{t.date}</td>
                  <td style={{ padding: '0.4rem 0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{t.user}</span>
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem' }}>
                    <span className={`chip ${t.type === 'IN' ? 'active' : ''}`} style={{ 
                      background: t.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : t.type === 'OUT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: t.type === 'IN' ? 'var(--accent-success)' : t.type === 'OUT' ? 'var(--accent-danger)' : 'var(--accent-primary)',
                      borderColor: 'transparent'
                    }}>
                      {t.type === 'IN' ? 'In' : t.type === 'OUT' ? 'Out' : 'TF'}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>
                    {t.type === 'TRANSFER' ? t.account + ' \u2192 ' + t.toAccount : t.account}
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{t.category}</td>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{t.description}</td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 600, color: t.type === 'IN' ? 'var(--accent-success)' : t.type === 'OUT' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : ''} {formatIDR(t.amount)}
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginRight: '0.5rem' }} title="Edit"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(t._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }} title="Hapus"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Belum ada transaksi di periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editTx && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)', padding: '0.4rem 0.5rem', overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Edit Transaksi</h3>
              <button onClick={() => setEditTx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label"><CalendarDays size={16} /> Tanggal</label>
                <input type="date" className="form-input" value={editForm.date}
                  onChange={e => handleEditChange('date', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label"><Tag size={16} /> Jenis Transaksi</label>
                <select className="form-input" value={editForm.type} onChange={e => handleEditChange('type', e.target.value)} required>
  <option value="OUT">🔴 Pengeluaran (OUT)</option>
  <option value="IN">🟢 Pemasukan (IN)</option>
  <option value="TRANSFER">🔄 Transfer (Move)</option>
</select>
              </div>

              <div className="form-group">
                <label className="form-label"><Wallet size={16} /> Dompet / Rekening Anda</label>
                <select className="form-input" value={editForm.account}
                  onChange={e => handleEditChange('account', e.target.value)} required>
                  <option value="">-- Pilih Rekening --</option>
                  {myAccounts.map(acc => (<option key={acc} value={acc}>{acc}</option>))}
                  {!myAccounts.includes(editForm.account) && editForm.account && <option value={editForm.account}>{editForm.account}</option>}
                </select>
              </div>

              {editForm.type === 'TRANSFER' && (
                <div className="form-group">
                  <label className="form-label"><Wallet size={16} /> Tujuan Transfer</label>
                  <select className="form-input" value={editForm.toAccount}
                    onChange={e => handleEditChange('toAccount', e.target.value)} required>
                    <option value="">-- Pilih Tujuan --</option>
                    {otherUsersAccounts.map(acc => (
                      <option key={acc} value={acc.split('-')[1]}>{acc.replace('-', ' - ')}</option>
                    ))}
                    {!otherUsersAccounts.find(a => a.split('-')[1] === editForm.toAccount) && editForm.toAccount !== '-' && (
                       <option value={editForm.toAccount}>{editForm.toAccount} (Lainnya)</option>
                    )}
                  </select>
                </div>
              )}

              {editForm.type !== 'TRANSFER' && (
                <div className="form-group">
                  <label className="form-label"><Tag size={16} /> Kategori</label>
                  <select className="form-input" value={editForm.category} onChange={e => handleEditChange('category', e.target.value)} required>
  <option value="">-- Pilih Kategori --</option>
  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
  {!categories.includes(editForm.category) && editForm.category && (<option value={editForm.category}>{editForm.category}</option>)}
</select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><DollarSign size={16} /> Nominal (Rp)</label>
                <input type="number" className="form-input" required min="1"
                  value={editForm.amount} onChange={e => handleEditChange('amount', parseInt(e.target.value) || '')} />
              </div>

              <div className="form-group">
                <label className="form-label"><FileText size={16} /> Keterangan</label>
                <input type="text" className="form-input" required 
                  value={editForm.description} onChange={e => handleEditChange('description', e.target.value)} />
              </div>

              <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
                <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {showPeriodModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Pilih Periode</h3>
              <button onClick={() => setShowPeriodModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={applyCustomPeriod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Bulan</label>
                  <select className="form-input" value={tempMonth} onChange={e => setTempMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun</label>
                  <input type="number" className="form-input" value={tempYear} onChange={e => setTempYear(parseInt(e.target.value))} />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Terapkan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

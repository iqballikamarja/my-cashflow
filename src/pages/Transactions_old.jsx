import React, { useState, useEffect } from 'react';
import { Receipt, Trash2, Edit3, X, Save, CalendarDays, Tag, Wallet, DollarSign, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const CATEGORIES_OUT = ['Fix', 'Kitchen', 'Jajan', 'Mio', 'Iqbal', 'Zela', 'Alfa', 'Sedekah', 'Bathroom', 'Lainnya'];
const CATEGORIES_IN = ['Gaji', 'TikTok', 'Lainnya'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Transactions() {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAccounts, setAllAccounts] = useState({ Iqbal: [], Zela: [] });
  
  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [periodText, setPeriodText] = useState('Semua Waktu');
  const [queryObj, setQueryObj] = useState({});
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [tempMonth, setTempMonth] = useState(now.getMonth() + 1);
  const [tempYear, setTempYear] = useState(now.getFullYear());

  const token = localStorage.getItem('token');

  const fetchTransactions = () => {
    setLoading(true);
    let url = 'http://localhost:5000/api/transactions';
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') || 'all';
    const q = [];
    if (queryObj.month && queryObj.year) q.push(`month=${queryObj.month}&year=${queryObj.year}`);
    if (user?.role === 'admin' && viewParam !== 'all') q.push(`user=${viewParam}`);
    if (q.length > 0) url += '?' + q.join('&');
    fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTransactions(data.filter(t => t.source !== 'Migrasi Excel')); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetchTransactions();
  }, [token, queryObj, location.search]);

  useEffect(() => {
    fetch('http://localhost:5000/api/accounts/all', { headers: { 'Authorization': 'Bearer ' + token } })
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

  const categories = editForm?.type === 'IN' ? CATEGORIES_IN : CATEGORIES_OUT;
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Menampilkan data: <strong>{periodText}</strong></p>

      {loading ? (
         <div className="text-body">Loading...</div>
      ) : (
        <div className="card" style={{ marginTop: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Tanggal</th>
                {user?.role === 'admin' && <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>User</th>}
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Jenis</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Rekening</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Kategori</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Keterangan</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Nominal</th>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{t.date}</td>
                  {user?.role === 'admin' && (
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{t.user.toLowerCase() === 'iqbal' ? '??' : '??'} {t.user}</span>
                    </td>
                  )}
                  <td style={{ padding: '0.4rem 0.5rem' }}>
                    <span className={`chip ${t.type === 'IN' ? 'active' : ''}`} style={{ 
                      background: t.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : t.type === 'OUT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: t.type === 'IN' ? 'var(--accent-success)' : t.type === 'OUT' ? 'var(--accent-danger)' : 'var(--accent-primary)',
                      borderColor: 'transparent'
                    }}>
                      {t.type === 'IN' ? '?? In' : t.type === 'OUT' ? '?? Out' : '?? TF'}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>
                    {t.type === 'TRANSFER' ? t.account + ' ? ' + t.toAccount : t.account}
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
                  <td colSpan={user?.role === 'admin' ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                <div className="btn-group">
                  {[{ val: 'OUT', label: '?? Pengeluaran' }, { val: 'IN', label: '?? Pemasukan' }, { val: 'TRANSFER', label: '?? Transfer' }].map(t => (
                    <button key={t.val} type="button" className={`btn-toggle ${editForm.type === t.val ? 'active' : ''}`}
                      onClick={() => handleEditChange('type', t.val)}>{t.label}</button>
                  ))}
                </div>
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
                  <div className="chip-group">
                    {categories.map(cat => (
                      <button key={cat} type="button" className={`chip ${editForm.category === cat ? 'active' : ''}`}
                        onClick={() => handleEditChange('category', cat)}>{cat}</button>
                    ))}
                    {!categories.includes(editForm.category) && editForm.category && (
                      <button type="button" className="chip active">{editForm.category}</button>
                    )}
                  </div>
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

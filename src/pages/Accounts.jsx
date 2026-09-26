import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import BankLogo from '../components/BankLogo';
import { API_URL } from '../config';

const BANK_COLORS = {
  BCA: { bg: '#0066AE', text: '#fff' },
  MANDIRI: { bg: '#003D79', text: '#fff' },
  BNI: { bg: '#F15A23', text: '#fff' },
  BRI: { bg: '#00529C', text: '#fff' },
  BSI: { bg: '#00A39D', text: '#fff' },
  CASH: { bg: '#2E7D32', text: '#fff' },
  GOPAY: { bg: '#00AED6', text: '#fff' },
  OVO: { bg: '#4C3494', text: '#fff' },
  DANA: { bg: '#118EEA', text: '#fff' },
  LINKAJA: { bg: '#E3000F', text: '#fff' },
  SEABANK: { bg: '#FF6D00', text: '#fff' },
  JAGO: { bg: '#F78100', text: '#fff' },
  SHOPEE: { bg: '#ee4d2d', text: '#fff' },
  SHOPEEPAY: { bg: '#ee4d2d', text: '#fff' }
};

function getBankStyle(name) {
  for (const key of Object.keys(BANK_COLORS)) {
    if (name.toUpperCase().includes(key)) return BANK_COLORS[key];
  }
  return { bg: 'linear-gradient(135deg, #546E7A, #78909C)', text: '#fff' };
}

const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

export default function Accounts() {
  const { user } = useAuth();
  const [balances, setBalances] = useState({});
  const [accountsList, setAccountsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccUser, setNewAccUser] = useState('Iqbal');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const token = localStorage.getItem('token');
  const location = useLocation();

  const fetchData = async () => {
    try {
      const [balRes, accRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions/balances`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${API_URL}/api/accounts`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      const balData = await balRes.json();
      const accData = await accRes.json();
      
      setBalances(balData.message ? {} : balData);
      setAccountsList(Array.isArray(accData) ? accData : []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setNewAccUser(user?.username);
    }
  }, [user]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setModalLoading(true); setModalError('');
    try {
      const res = await fetch(`${API_URL}/api/accounts`, {
        method: `POST`,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ name: newAccName.toUpperCase(), user: newAccUser })
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setNewAccName('');
        fetchData();
      } else {
        window.alert(data.message || 'Gagal tambah rekening'); setModalError(data.message || 'Gagal tambah rekening');
      }
    } catch (err) {
      setModalError('Server error');
    }
    setModalLoading(false);
  };

  const handleDeleteAccount = async (accName, accUser) => {
    if (!window.confirm(`Yakin mau hapus rekening ${accName} milik ${accUser}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/accounts/${accName}/${accUser}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchData();
    } catch (err) {}
  };

  const searchParams = new URLSearchParams(location.search); 
  const viewModeParam = searchParams.get('view') || 'all'; 
  const viewMode = viewModeParam === 'all' ? 'Semua' : viewModeParam.charAt(0).toUpperCase() + viewModeParam.slice(1); 
  
  if (loading) return <div className="text-body">Loading...</div>;

  let usersToDisplay = [user?.username]; 
  if (user?.role === 'admin') { 
    usersToDisplay = viewMode === 'Semua' ? ['Iqbal', 'Zela'] : [viewMode]; 
  }
  
  return (
    <div>
      <div className="sticky-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Landmark size={28} /> Rekening & Saldo
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Rekening
        </button>
      </div>

      {usersToDisplay.map(u => {
        const userExplicitAccs = accountsList.filter(a => a.user.toLowerCase() === u.toLowerCase()).map(a => a.name);
        const userBalAccs = balances[u] ? Object.keys(balances[u]).filter(acc => balances[u][acc] !== 0) : [];
        const combined = [...new Set([...userExplicitAccs, ...userBalAccs])];

        return (
          <div key={u} style={{ marginBottom: '2rem' }}>
            {user?.role === 'admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 className="text-h2" style={{ margin: 0 }}>{u.toLowerCase() === 'iqbal' ? '👦' : '👩'} {u}</h2>
              </div>
            )}
            <div className="grid-cols-3">
              {/* Total Saldo Card */}
              <div className="account-card" style={{ background: '#111827', color: '#fff', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <Landmark size={40} />
                  <span style={{ fontSize: '0.85rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>TOTAL SALDO</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
                  {formatIDR(Object.values(balances[u] || {}).reduce((a, b) => a + b, 0))}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>Gabungan Semua Rekening</div>
              </div>
              {combined.map(acc => {
                const style = getBankStyle(acc);
                const bal = balances[u]?.[acc] || 0;
                return (
                  <div key={acc} className="account-card" style={{ background: style.bg, color: style.text, position: 'relative' }}>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteAccount(acc, u)}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', zIndex: 10 }}
                        title="Hapus Rekening"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <BankLogo name={acc} size={40} />
                      <span style={{ fontSize: '0.85rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{acc}</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{formatIDR(bal)}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>Saldo saat ini</div>
                  </div>
                );
              })}
              {combined.length === 0 && (
                <div className="card" style={{ opacity: 0.5, gridColumn: 'span 3' }}>Belum ada rekening. Klik Tambah Rekening.</div>
              )}
            </div>
          </div>
        );
      })}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Tambah Rekening Baru</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user?.role === 'admin' && (
                <div className="form-group">
                  <label className="form-label">Pemilik Rekening (User)</label>
                  <select className="form-input" value={newAccUser} onChange={e => setNewAccUser(e.target.value)}>
                    <option value="Iqbal">Iqbal</option>
                    <option value="Zela">Zela</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nama Bank / E-Wallet</label>
                <input type="text" className="form-input" required autoFocus
                  value={newAccName} onChange={e => setNewAccName(e.target.value)}
                  placeholder="Contoh: BCA, BSI, CASH, DANA..." />
              </div>
              <button type="submit" className="btn-primary" disabled={modalLoading}>
                {modalLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
              {modalError && <div className="alert-error">{modalError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

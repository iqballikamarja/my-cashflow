import React, { useState, useEffect } from 'react';
import CustomDatePicker from '../components/CustomDatePicker';
import { format, parseISO } from 'date-fns';
import { Target, Plus, X, Trash2, TrendingUp, Shield, Heart, Plane, Wallet } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  darurat: { label: 'Dana Darurat', icon: Shield, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  survival: { label: 'Bertahan Hidup', icon: Heart, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  sinking: { label: 'Holiday Fund', icon: Plane, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [survivalTarget, setSurvivalTarget] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [allocateModal, setAllocateModal] = useState(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [form, setForm] = useState({ name: '', type: 'darurat', targetAmount: '', deadline: '' });

  const token = localStorage.getItem('token');

  const fetchSurvivalTarget = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        const monthlyOut = {};
        data.forEach(t => {
          if (t.type === 'OUT' && t.date && !t.isDeleted) {
            const month = t.date.substring(0, 7);
            monthlyOut[month] = (monthlyOut[month] || 0) + Number(t.amount);
          }
        });
        const vals = Object.values(monthlyOut);
        const maxOut = vals.length > 0 ? Math.max(...vals) : 0;
        setSurvivalTarget(maxOut * 2);
      }
    } catch (err) { console.error('Survival calc error:', err); }
  };

  const fetchData = async () => {
    try {
      const [goalRes, balRes] = await Promise.all([
        fetch(`${API_URL}/api/goals`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${API_URL}/api/transactions/balances`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      const goalData = await goalRes.json();
      const balData = await balRes.json();
      setGoals(goalData);
      setBalances(balData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchSurvivalTarget();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, targetAmount: Number(form.targetAmount) || 0 };
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', type: 'darurat', targetAmount: '', deadline: '' });
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus goal ini? Saldo yang teralokasi akan kembali ke saldo bebas.')) return;
    try {
      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAllocate = async () => {
    if (!allocateModal) return;
    const amount = Number(allocateAmount);
    if (isNaN(amount) || amount <= 0) return alert('Nominal tidak valid');
    if (amount > unallocated) return alert(`Saldo bebas tidak cukup. Tersedia: ${formatIDR(unallocated)}`);

    try {
      const res = await fetch(`${API_URL}/api/goals/${allocateModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ currentAmount: allocateModal.currentAmount + amount })
      });
      if (res.ok) {
        setAllocateModal(null);
        setAllocateAmount('');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const safeBalances = balances || {};
const totalBSI = (safeBalances['Iqbal']?.['BSI'] || 0) + (safeBalances['Zela']?.['BSI'] || 0);
  const safeGoals = Array.isArray(goals) ? goals : [];
const totalAllocated = safeGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const unallocated = totalBSI - totalAllocated;

  if (loading) return <div style={{ paddingBottom: "2rem" }}><div className="text-body">Loading...</div></div>;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      {/* Header */}
      <div className="sticky-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 2rem', margin: '-2rem -2rem 2rem -2rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Target size={28} /> Goals & Tabungan
        </h1>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Tambah Goal
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="account-card" style={{ background: '#0d9488', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Wallet size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Saldo Fisik BSI</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatIDR(totalBSI)}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>Rekening BSI Iqbal</div>
        </div>

        <div className="account-card" style={{ background: unallocated < 0 ? '#dc2626' : '#1e293b', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Target size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Belum Dialokasikan</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatIDR(unallocated)}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>Uang BSI yang belum masuk kantong</div>
        </div>
      </div>

      {/* Goals Grid */}
      {safeGoals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Target size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3 className="text-h3" style={{ color: 'var(--text-secondary)' }}>Belum ada Goal</h3>
          <p className="text-subtitle">Klik "Tambah Goal" untuk mulai menabung!</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {safeGoals.map(g => {
            const cfg = TYPE_CONFIG[g.type] || TYPE_CONFIG.darurat;
            const IconComponent = cfg.icon;
            const actualTarget = g.type === 'survival' ? survivalTarget : (g.targetAmount || 0);
            const progress = actualTarget > 0 ? Math.min(100, Math.round((g.currentAmount / actualTarget) * 100)) : 0;

            return (
              <div key={g._id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Delete button */}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(g._id)}
                    title="Hapus goal"
                    style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Type Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.3rem 0.75rem', borderRadius: '999px',
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', alignSelf: 'flex-start', marginBottom: '1rem'
                }}>
                  <IconComponent size={12} /> {cfg.label}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{g.name}</h3>

                {/* Subtitle */}
                {g.type === 'sinking' && g.deadline && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                    Target: {g.deadline}
                  </p>
                )}
                {g.type === 'survival' && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', fontStyle: 'italic' }}>
                    Auto: 2x pengeluaran terbesar/bulan
                  </p>
                )}

                {/* Progress Section */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Terkumpul</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: cfg.color }}>{formatIDR(g.currentAmount)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Target</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formatIDR(actualTarget)}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: `${progress}%`, height: '100%',
                      background: progress >= 100 ? 'var(--accent-success)' : cfg.color,
                      borderRadius: '999px', transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: progress >= 100 ? 'var(--accent-success)' : cfg.color }}>
                    {progress}%{progress >= 100 ? ' \u2714' : ''}
                  </div>

                  {/* Allocate Button */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setAllocateModal(g); setAllocateAmount(''); }}
                      className="btn-toggle"
                      style={{
                        width: '100%', marginTop: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        fontSize: '0.85rem', fontWeight: 600,
                        cursor: unallocated <= 0 ? 'not-allowed' : 'pointer',
                        opacity: unallocated <= 0 ? 0.5 : 1
                      }}
                      disabled={unallocated <= 0}
                    >
                      <TrendingUp size={14} /> {unallocated > 0 ? 'Alokasikan Dana' : 'Saldo BSI Kosong'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Tambah Goal Baru</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tipe Goal</label>
                <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="darurat">Dana Darurat (Rumah, Kesehatan, dll)</option>
                  <option value="survival">Dana Bertahan Hidup (Auto: max OUT x 2)</option>
                  <option value="sinking">Holiday Fund (Liburan, Gadget, dll)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Goal</label>
                <input type="text" className="form-input" required placeholder="Cth: Darurat Kesehatan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              {form.type !== 'survival' && (
                <div className="form-group">
                  <label className="form-label">Target Nominal (Rp)</label>
                  <input type="number" className="form-input" required placeholder="1000000" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} />
                </div>
              )}
              {form.type === 'sinking' && (
                <div className="form-group">
                  <label className="form-label">Target Waktu</label>
                  <CustomDatePicker selected={form.deadline ? parseISO(form.deadline) : new Date()} onChange={(date) => setForm({...form, deadline: format(date, 'yyyy-MM-dd')})} required />
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Simpan Goal</button>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {allocateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Alokasikan Dana</h3>
              <button onClick={() => setAllocateModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'var(--bg-default)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Goal: <strong style={{ color: 'var(--text-primary)' }}>{allocateModal.name}</strong></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saldo tersedia: <strong style={{ color: 'var(--accent-success)' }}>{formatIDR(unallocated)}</strong></div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Nominal Alokasi (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Masukkan nominal..."
                value={allocateAmount}
                onChange={e => setAllocateAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setAllocateModal(null)} className="btn-toggle" style={{ flex: 1 }}>Batal</button>
              <button onClick={handleAllocate} className="btn-primary" style={{ flex: 1 }}>Alokasikan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

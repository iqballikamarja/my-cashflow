import React, { useState, useEffect } from 'react';
import CustomDatePicker from '../components/CustomDatePicker';
import { format, parseISO } from 'date-fns';
import { Target, Plus, X, Trash2, Edit3, TrendingUp, Shield, Heart, Plane, Wallet } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  darurat: { label: 'Emergency Fund', icon: Shield, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  survival: { label: 'Survival Fund', icon: Heart, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  sinking: { label: 'Holiday Fund', icon: Plane, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

const formatIndonesianDate = (dateStr) => {
  if (!dateStr) return '';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }
  if (parts.length === 2) {
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    return `${month} ${parts[0]}`;
  }
  return dateStr;
};

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [balances, setBalances] = useState({});
  const [allAccounts, setAllAccounts] = useState({ Iqbal: [], Zela: [] });
  const [loading, setLoading] = useState(true);
  const [survivalTarget, setSurvivalTarget] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editModalGoal, setEditModalGoal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', type: 'darurat', accountKey: '', targetAmount: '', deadline: '' });
  const [allocateModal, setAllocateModal] = useState(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [form, setForm] = useState({ 
    name: '', 
    type: 'darurat', 
    accountKey: 'Iqbal:BSI',
    targetAmount: '', 
    deadline: '' 
  });

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
      const [goalRes, balRes, accRes] = await Promise.all([
        fetch(`${API_URL}/api/goals`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${API_URL}/api/transactions/balances`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${API_URL}/api/accounts/all`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      const goalData = await goalRes.json();
      const balData = await balRes.json();
      const accData = await accRes.json();
      setGoals(Array.isArray(goalData) ? goalData : []);
      setBalances(balData && !balData.message ? balData : {});
      if (accData && typeof accData === 'object' && !accData.message) {
        setAllAccounts(accData);
        const firstUser = Object.keys(accData)[0];
        if (firstUser && accData[firstUser].length > 0) {
          setForm(prev => prev.accountKey ? prev : { ...prev, accountKey: `${firstUser}:${accData[firstUser][0]}` });
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchSurvivalTarget();
  }, []);

  const safeBalances = balances || {};
  const safeGoals = Array.isArray(goals) ? goals : [];

  const getAccountPhysicalBalance = (accountName, accountUser) => {
    const acc = (accountName || 'BSI').toUpperCase();
    if (accountUser) {
      const u = accountUser.charAt(0).toUpperCase() + accountUser.slice(1).toLowerCase();
      const uBals = safeBalances[u] || {};
      const key = Object.keys(uBals).find(k => k.toUpperCase() === acc);
      return key ? (uBals[key] || 0) : 0;
    } else {
      let total = 0;
      ['Iqbal', 'Zela'].forEach(u => {
        const uBals = safeBalances[u] || {};
        const key = Object.keys(uBals).find(k => k.toUpperCase() === acc);
        if (key) total += (uBals[key] || 0);
      });
      return total;
    }
  };

  const getAccountAllocated = (accountName, accountUser) => {
    const acc = (accountName || 'BSI').toUpperCase();
    const u = (accountUser || '').toUpperCase();
    return safeGoals.filter(g => {
      const gAcc = (g.account || 'BSI').toUpperCase();
      const gU = (g.accountUser || '').toUpperCase();
      return gAcc === acc && gU === u;
    }).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  };

  const getAccountUnallocated = (accountName, accountUser) => {
    return getAccountPhysicalBalance(accountName, accountUser) - getAccountAllocated(accountName, accountUser);
  };

  // Helper to see if an account already has goals attached
  const getAccountGoalIndicator = (userName, accName, excludeGoalId = null) => {
    const u = (userName || '').toLowerCase();
    const a = (accName || '').toUpperCase();
    const matched = safeGoals.filter(g => {
      if (excludeGoalId && g._id === excludeGoalId) return false;
      const gAcc = (g.account || 'BSI').toUpperCase();
      const gUser = (g.accountUser || '').toLowerCase();
      if (gAcc !== a) return false;
      if (gUser && gUser !== u) return false;
      return true;
    });
    if (matched.length === 0) return { hasGoal: false, label: '' };
    return { hasGoal: true, label: ` [${matched.map(g => g.name).join(', ')}]` };
  };

  const totalAllocated = safeGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = safeGoals.reduce((sum, g) => {
    const target = g.type === 'survival' ? survivalTarget : (g.targetAmount || 0);
    return sum + target;
  }, 0);

  const linkedAccountsMap = {};
  safeGoals.forEach(g => {
    const acc = g.account || 'BSI';
    const u = g.accountUser || '';
    const key = `${u}:${acc}`;
    if (!linkedAccountsMap[key]) {
      linkedAccountsMap[key] = { acc, u };
    }
  });
  const totalLinkedPhysical = Object.values(linkedAccountsMap).reduce((sum, item) => {
    return sum + getAccountPhysicalBalance(item.acc, item.u);
  }, 0);
  const totalUnallocated = Math.max(0, totalLinkedPhysical - totalAllocated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parts = (form.accountKey || '').split(':');
    const accUser = parts.length > 1 ? parts[0] : '';
    const accName = parts.length > 1 ? parts[1] : (form.accountKey || 'BSI');

    const goalName = form.type === 'survival' ? 'Bertahan Hidup' : (form.name || 'Goal Baru');
    const payload = { 
      name: goalName,
      type: form.type,
      account: accName,
      accountUser: accUser,
      targetAmount: form.type === 'survival' ? 0 : (Number(form.targetAmount) || 0),
      deadline: form.type === 'sinking' ? form.deadline : ''
    };

    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setForm(prev => ({ ...prev, name: '', type: 'darurat', targetAmount: '', deadline: '' }));
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenEdit = (g) => {
    setEditModalGoal(g);
    setEditForm({
      name: g.name || '',
      type: g.type || 'darurat',
      accountKey: `${g.accountUser || 'Iqbal'}:${g.account || 'BSI'}`,
      targetAmount: g.targetAmount || '',
      deadline: g.deadline || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalGoal) return;
    const parts = (editForm.accountKey || '').split(':');
    const accUser = parts.length > 1 ? parts[0] : '';
    const accName = parts.length > 1 ? parts[1] : (editForm.accountKey || 'BSI');

    const goalName = editForm.type === 'survival' ? 'Bertahan Hidup' : (editForm.name || 'Goal Baru');
    const payload = {
      name: goalName,
      type: editForm.type,
      account: accName,
      accountUser: accUser,
      targetAmount: editForm.type === 'survival' ? 0 : (Number(editForm.targetAmount) || 0),
      deadline: editForm.type === 'sinking' ? editForm.deadline : ''
    };

    try {
      const res = await fetch(`${API_URL}/api/goals/${editModalGoal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditModalGoal(null);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus goal ini? Saldo yang teralokasi akan kembali ke saldo bebas rekening.')) return;
    try {
      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  const modalUnallocated = allocateModal ? getAccountUnallocated(allocateModal.account, allocateModal.accountUser) : 0;

  const handleAllocate = async () => {
    if (!allocateModal) return;
    const amount = Number(allocateAmount);
    if (isNaN(amount) || amount <= 0) return alert('Nominal tidak valid');
    if (amount > modalUnallocated) return alert(`Saldo bebas tidak cukup. Tersedia: ${formatIDR(modalUnallocated)}`);

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

  return (
    <div style={{ paddingBottom: "2rem" }}>
      {/* Header */}
      <div className="sticky-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 2rem', margin: '-2rem -2rem 2rem -2rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Target size={28} /> Goals & Tabungan
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Tambah Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="account-card" style={{ background: '#0d9488', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Wallet size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Total Tabungan Terkumpul</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatIDR(totalAllocated)}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            Dari target {formatIDR(totalTarget)} ({totalTarget > 0 ? Math.round((totalAllocated / totalTarget) * 100) : 0}%)
          </div>
        </div>

        <div className="account-card" style={{ background: totalUnallocated < 0 ? '#dc2626' : '#1e293b', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Target size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Sisa Saldo Bebas Rekening</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatIDR(totalUnallocated)}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            Uang belum dialokasikan dari rekening terhubung
          </div>
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
            const unallocated = getAccountUnallocated(g.account, g.accountUser);
            const accDisplay = `${g.account || 'BSI'}${g.accountUser ? ` (${g.accountUser})` : ''}`;

            return (
              <div key={g._id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Action buttons (Edit & Delete) */}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleOpenEdit(g)}
                    title="Edit goal"
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', opacity: 0.6, transition: 'all 0.2s', padding: '0.2rem'
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(g._id)}
                    title="Hapus goal"
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)',
                      cursor: 'pointer', opacity: 0.6, transition: 'all 0.2s', padding: '0.2rem'
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Badges row: Type & Rekening */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', paddingRight: '3rem' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.75rem', borderRadius: '999px',
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <IconComponent size={12} /> {cfg.label}
                  </div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.65rem', borderRadius: '999px',
                    background: 'var(--bg-default)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.7rem', fontWeight: 600
                  }}>
                    <Wallet size={12} /> {accDisplay}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{g.name}</h3>

                {/* Subtitle */}
                {g.type === 'sinking' && g.deadline && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                    Target: {formatIndonesianDate(g.deadline)}
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
                    {progress}%{progress >= 100 ? ' ✔' : ''}
                  </div>

                  {/* Allocate Button */}
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
                    <TrendingUp size={14} /> {unallocated > 0 ? 'Alokasikan Dana' : `Saldo ${g.account || 'BSI'} Kosong`}
                  </button>
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
                  <option value="darurat">Emergency Fund</option>
                  <option value="survival">Survival Fund</option>
                  <option value="sinking">Holiday Fund</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rekening / Bank Alokasi</label>
                <select 
                  className="form-input" 
                  value={form.accountKey} 
                  onChange={e => setForm({...form, accountKey: e.target.value})}
                  required
                >
                  <option value="">-- Pilih Rekening / Bank --</option>
                  {Object.entries(allAccounts).map(([u, accs]) => {
                    const initial = u.charAt(0).toUpperCase();
                    const name = u.charAt(0).toUpperCase() + u.slice(1).toLowerCase();
                    const circleInitial = initial === 'I' ? 'Ⓘ' : initial === 'Z' ? 'Ⓩ' : `[${initial}]`;
                    return (
                      <optgroup key={u} label={`${circleInitial} ${name}`}>
                        {accs.map(a => {
                          const { hasGoal, label } = getAccountGoalIndicator(u, a);
                          return (
                            <option key={`${u}:${a}`} value={`${u}:${a}`}>
                              {hasGoal ? `🎯 ${a}${label}` : a}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {form.type !== 'survival' && (
                <div className="form-group">
                  <label className="form-label">Nama Goal</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={form.type === 'sinking' ? 'Contoh: Liburan ke Bandung' : 'Contoh: Darurat Kesehatan'}
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
              )}

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

      {/* Edit Goal Modal */}
      {editModalGoal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Edit Goal</h3>
              <button onClick={() => setEditModalGoal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tipe Goal</label>
                <select className="form-input" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                  <option value="darurat">Emergency Fund</option>
                  <option value="survival">Survival Fund</option>
                  <option value="sinking">Holiday Fund</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rekening / Bank Alokasi</label>
                <select 
                  className="form-input" 
                  value={editForm.accountKey} 
                  onChange={e => setEditForm({...editForm, accountKey: e.target.value})}
                  required
                >
                  <option value="">-- Pilih Rekening / Bank --</option>
                  {Object.entries(allAccounts).map(([u, accs]) => {
                    const initial = u.charAt(0).toUpperCase();
                    const name = u.charAt(0).toUpperCase() + u.slice(1).toLowerCase();
                    const circleInitial = initial === 'I' ? 'Ⓘ' : initial === 'Z' ? 'Ⓩ' : `[${initial}]`;
                    return (
                      <optgroup key={u} label={`${circleInitial} ${name}`}>
                        {accs.map(a => {
                          const { hasGoal, label } = getAccountGoalIndicator(u, a, editModalGoal._id);
                          return (
                            <option key={`${u}:${a}`} value={`${u}:${a}`}>
                              {hasGoal ? `🎯 ${a}${label}` : a}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {editForm.type !== 'survival' && (
                <div className="form-group">
                  <label className="form-label">Nama Goal</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={editForm.type === 'sinking' ? 'Contoh: Liburan ke Bandung' : 'Contoh: Darurat Kesehatan'}
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
              )}

              {editForm.type !== 'survival' && (
                <div className="form-group">
                  <label className="form-label">Target Nominal (Rp)</label>
                  <input type="number" className="form-input" required placeholder="1000000" value={editForm.targetAmount} onChange={e => setEditForm({...editForm, targetAmount: e.target.value})} />
                </div>
              )}

              {editForm.type === 'sinking' && (
                <div className="form-group">
                  <label className="form-label">Target Waktu</label>
                  <CustomDatePicker selected={editForm.deadline ? parseISO(editForm.deadline) : new Date()} onChange={(date) => setEditForm({...editForm, deadline: format(date, 'yyyy-MM-dd')})} required />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditModalGoal(null)} className="btn-toggle" style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Simpan Perubahan</button>
              </div>
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Goal: <strong style={{ color: 'var(--text-primary)' }}>{allocateModal.name}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Rekening: <strong style={{ color: 'var(--text-primary)' }}>{allocateModal.account || 'BSI'}{allocateModal.accountUser ? ` (${allocateModal.accountUser})` : ''}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Saldo bebas tersedia: <strong style={{ color: 'var(--accent-success)' }}>{formatIDR(modalUnallocated)}</strong>
              </div>
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

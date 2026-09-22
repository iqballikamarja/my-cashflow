import React, { useState, useEffect } from 'react';
import { Tag, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { API_URL } from '../config';


export default function Categories() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const viewModeParam = searchParams.get('view') || 'all';
  const typeParam = searchParams.get('type');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', type: 'OUT' });
  const [targetUser, setTargetUser] = useState(user?.role === 'admin' ? 'Iqbal' : user?.username);
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        console.error(`Expected array but got:`, data);
        setCategories([]);
        if (data.message) setErrorMsg(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const viewMode = viewModeParam === 'all' ? 'Semua' : viewModeParam.charAt(0).toUpperCase() + viewModeParam.slice(1);
  const displayUser = user?.role === 'admin' ? viewMode : user?.username;

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: `POST`,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newCat.name,
          type: newCat.type,
          user: user?.role === 'admin' ? targetUser : user?.username
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menambah kategori');
      }
      setNewCat({ name: '', type: 'OUT' });
      setShowAddModal(false);
      fetchCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambah kategori');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      alert('Gagal menghapus kategori');
    }
  };

  const typeLabels = { 'OUT': 'Pengeluaran', 'IN': 'Pemasukan', 'TRANSFER': 'Transfer' };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat data kategori...</div>;
  }

  let filtered = displayUser === 'Semua' 
    ? categories 
    : categories.filter(c => c.user.toLowerCase() === displayUser.toLowerCase());
  if (typeParam) {
    filtered = filtered.filter(c => c.type.toLowerCase() === typeParam.toLowerCase());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      <div className="sticky-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Tag size={28} color="var(--accent-primary)" />
          <h2 className="text-h1" style={{ margin: 0 }}>
            Manajemen Kategori {user?.role === 'admin' && viewMode !== 'Semua' ? `- ${viewMode}` : ''}
          </h2>
        </div>
        <button onClick={() => { setNewCat({ name: '', type: typeParam ? typeParam.toUpperCase() : 'OUT' }); setShowAddModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Tambah Kategori
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-default)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              {user?.role === 'admin' && displayUser === 'Semua' && <th style={{ padding: '1rem 1.25rem' }}>USER</th>}
              <th style={{ padding: '1rem 1.25rem' }}>JENIS</th>
              <th style={{ padding: '1rem 1.25rem' }}>NAMA KATEGORI</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {user?.role === 'admin' && displayUser === 'Semua' && (
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      background: cat.user.toLowerCase() === 'iqbal' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                      color: cat.user.toLowerCase() === 'iqbal' ? '#3b82f6' : '#ec4899'
                    }}>
                      {cat.user}
                    </span>
                  </td>
                )}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: cat.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : cat.type === 'OUT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: cat.type === 'IN' ? '#10b981' : cat.type === 'OUT' ? '#ef4444' : '#3b82f6'
                  }}>
                    {typeLabels[cat.type]}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontWeight: 500 }}>{cat.name}</td>
                <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(cat._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }} title="Hapus">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'admin' && displayUser === 'Semua' ? 4 : 3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Belum ada kategori yang dibuat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Tambah Kategori Baru</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user?.role === 'admin' && (
                <div className="form-group">
                  <label className="form-label">Untuk User</label>
                  <select className="form-input" value={targetUser} onChange={(e) => setTargetUser(e.target.value)}>
                    <option value="Iqbal">Iqbal</option>
                    <option value="Zela">Zela</option>
                  </select>
                </div>
              )}
              


              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input type="text" className="form-input" required placeholder={newCat.type === 'IN' ? 'Misal: Gaji, dll' : 'Misal: Cicilan Motor'}
                  value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary" disabled={adding} style={{ marginTop: '0.5rem' }}>
                {adding ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

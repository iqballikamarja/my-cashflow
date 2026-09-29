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

      <div className="card" style={{ marginTop: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead>
            <tr>
              <th>KATEGORI</th>
              <th>JENIS</th>
              {user?.role === 'admin' && displayUser === 'Semua' && <th>USER</th>}
              <th style={{ width: '100px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat._id}>
                <td>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</div>
                </td>
                <td>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '99px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: cat.type === 'IN' ? '#d1fae5' : cat.type === 'OUT' ? '#fee2e2' : '#eff6ff', 
                    color: cat.type === 'IN' ? '#059669' : cat.type === 'OUT' ? '#dc2626' : '#2563eb', 
                    display: 'inline-block' 
                  }}>
                    {cat.type === 'IN' ? 'Pemasukan' : cat.type === 'OUT' ? 'Pengeluaran' : 'Lainnya'}
                  </span>
                </td>
                
                {user?.role === 'admin' && displayUser === 'Semua' && (
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: cat.user.toLowerCase() === 'iqbal' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {cat.user[0].toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{cat.user}</div>
                    </div>
                  </td>
                )}
                
                <td>
                  <button onClick={() => handleDelete(cat._id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', borderRadius: '99px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Trash2 size={14} /> Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'admin' && displayUser === 'Semua' ? 4 : 3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
                <label className="form-label">Jenis Kategori</label>
                <select className="form-input" value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}>
                  <option value="OUT">Pengeluaran</option>
                  <option value="IN">Pemasukan</option>
                </select>
              </div>

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

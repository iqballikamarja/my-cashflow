import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Check, X, Edit3, Key, Trash2 } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
        window.dispatchEvent(new Event('usersUpdated'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Yakin ingin menghapus permanen user ${username}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else alert(await res.text());
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const resetPassword = async (id, username) => {
    const newPass = window.prompt(`Masukkan password baru untuk ${username}:`);
    if (!newPass) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPass })
      });
      if (res.ok) alert('Password berhasil direset!');
      else alert(await res.text());
    } catch (err) {
      alert('Error resetting password');
    }
  };

  if (user?.role !== 'admin') return <div style={{ padding: '2rem' }}>Akses Ditolak. Halaman khusus Admin.</div>;
  if (loading) return <div style={{ padding: '2rem' }}>Loading users...</div>;

  return (
    <div>
      <div className="sticky-header">
        <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <UsersIcon size={28} /> User Management
        </h1>
      </div>

      <div className="card" style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`chip ${u.status === 'approved' ? 'bg-success text-success' : u.status === 'pending' ? 'bg-warning text-warning' : 'bg-danger text-danger'}`} style={{ padding: '4px 8px', fontSize: '12px' }}>
                    {u.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {u.status === 'pending' && (
                      <button onClick={() => updateStatus(u._id, 'approved')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '99px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Check size={14} /> Approve
                      </button>
                    )}
                    <button onClick={() => resetPassword(u._id, u.username)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #3b82f6', borderRadius: '99px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Key size={14} /> Reset Pass
                    </button>
                    {u.username !== 'admin' && (
                      <button onClick={() => deleteUser(u._id, u.username)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', borderRadius: '99px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Trash2 size={14} /> Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

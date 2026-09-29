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
                <td>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)' }}>
      {u.username[0].toUpperCase()}
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '14px' }}>{u.username}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Account</div>
    </div>
  </div>
</td>
                <td>
  <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: u.role === 'admin' ? '#fef3c7' : '#f1f5f9', color: u.role === 'admin' ? '#b45309' : '#475569', display: 'inline-block' }}>
    {u.role.toUpperCase()}
  </span>
</td>
                <td>
                  <span style={{ padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: u.status === 'approved' ? '#d1fae5' : '#fef2f2', color: u.status === 'approved' ? '#059669' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
    {u.status === 'approved' ? <Check size={14}/> : <X size={14}/>} {u.status.toUpperCase()}
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

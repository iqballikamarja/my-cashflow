import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WalletCards, LogIn, UserPlus } from 'lucide-react';
import { API_URL } from '../config';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(API_URL + '' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          login(data.user, data.token);
          navigate('/dashboard');
        } else {
          setSuccess(data.message);
          setIsLogin(true);
          setForm({ username: '', password: '' });
        }
      } else {
        setError(data.message || 'Terjadi kesalahan');
      }
    } catch (err) {
      setError('Gagal koneksi ke server');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-default)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: "64px", height: "64px", marginBottom: "1rem", borderRadius: "16px" }} />
          <h1 className="text-h1" style={{ margin: 0 }}>My Cashflow</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {isLogin ? 'Masuk ke dashboard keuanganmu' : 'Daftar akun baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-input" required 
              value={form.username} onChange={e => setForm({...form, username: e.target.value})} 
              placeholder="username" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required 
              value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {isLogin ? <><LogIn size={18} /> Masuk</> : <><UserPlus size={18} /> Daftar</>}
          </button>

          {error && <div className="alert-error" style={{ textAlign: 'center' }}>{error}</div>}
          {success && <div className="alert-success" style={{ textAlign: 'center' }}>{success}</div>}

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

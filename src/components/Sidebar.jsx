import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, CirclePlus, WalletCards, Landmark, LogOut, User, Menu, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [openMenus, setOpenMenus] = useState({
    overview: false,
    riwayat: false,
    rekening: false,
    kategori: false
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'all';
  const currentType = searchParams.get('type') || '';
  const isCategoriesPage = location.pathname === '/categories';

  const closeMobile = () => setMobileOpen(false);

  const toggleMenu = (menuName, e) => {
    e.preventDefault();
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const navContent = (
    <>
      <div>
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
          <span>My Cashflow</span>
          <button className="mobile-close-btn" onClick={closeMobile} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'none' }}>
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1.5rem' }}>
          
          <div className="nav-item-wrapper">
            <NavLink to="/dashboard" onClick={user?.role !== 'admin' ? closeMobile : undefined} className={({ isActive }) => 'nav-link ' + (location.pathname === '/dashboard' && currentView === 'all' ? 'active' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <LayoutDashboard size={20} /><span>Overview</span>
              </div>
              <div onClick={(e) => toggleMenu('overview', e)} style={{ padding: '0.25rem', display: 'flex' }}>
                {openMenus.overview ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </NavLink>
            {openMenus.overview && (
              <div className="sub-menu-group">
                <NavLink to="/dashboard?view=iqbal" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/dashboard' && currentView === 'iqbal' ? 'active-sub' : ''}`}>Iqbal</NavLink>
                <NavLink to="/dashboard?view=zela" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/dashboard' && currentView === 'zela' ? 'active-sub' : ''}`}>Zela</NavLink>
              </div>
            )}
          </div>

          {user?.role !== 'admin' && (
            <NavLink to="/add" onClick={closeMobile} className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <CirclePlus size={20} /><span>Catat Transaksi</span>
              </div>
            </NavLink>
          )}

          <div className="nav-item-wrapper">
            <NavLink to="/transactions" onClick={user?.role !== 'admin' ? closeMobile : undefined} className={({ isActive }) => 'nav-link ' + (location.pathname === '/transactions' && currentView === 'all' && currentType === '' ? 'active' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Receipt size={20} /><span>Riwayat</span>
              </div>
              {user?.role === 'admin' && (
                <div onClick={(e) => toggleMenu('riwayat', e)} style={{ padding: '0.25rem', display: 'flex' }}>
                  {openMenus.riwayat ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              )}
            </NavLink>
            {user?.role === 'admin' && openMenus.riwayat && (
              <div className="sub-menu-group">
                <NavLink to="/transactions?view=iqbal" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/transactions' && currentView === 'iqbal' ? 'active-sub' : ''}`}>Iqbal</NavLink>
                <NavLink to="/transactions?view=zela" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/transactions' && currentView === 'zela' ? 'active-sub' : ''}`}>Zela</NavLink>
              </div>
            )}
          </div>

          <div className="nav-item-wrapper">
            <NavLink to="/accounts" onClick={user?.role !== 'admin' ? closeMobile : undefined} className={({ isActive }) => 'nav-link ' + (location.pathname === '/accounts' && currentView === 'all' ? 'active' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Landmark size={20} /><span>Rekening</span>
              </div>
              {user?.role === 'admin' && (
                <div onClick={(e) => toggleMenu('rekening', e)} style={{ padding: '0.25rem', display: 'flex' }}>
                  {openMenus.rekening ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              )}
            </NavLink>
            {user?.role === 'admin' && openMenus.rekening && (
              <div className="sub-menu-group">
                <NavLink to="/accounts?view=iqbal" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/accounts' && currentView === 'iqbal' ? 'active-sub' : ''}`}>Iqbal</NavLink>
                <NavLink to="/accounts?view=zela" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/accounts' && currentView === 'zela' ? 'active-sub' : ''}`}>Zela</NavLink>
              </div>
            )}
          </div>
          
          
          <div className="nav-item-wrapper">
            <NavLink to="/categories" onClick={user?.role !== 'admin' ? closeMobile : undefined} className={({ isActive }) => 'nav-link ' + (location.pathname === '/categories' && currentType === '' ? 'active' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Tag size={20} /><span>Kategori</span>
              </div>
              <div onClick={(e) => { e.preventDefault(); toggleMenu('kategori', e); }} style={{ padding: '0.25rem', display: 'flex' }}>
                {openMenus.kategori ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </NavLink>
            {openMenus.kategori && (
              <div className="sub-menu-group">
                <NavLink to="/categories?type=in" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/categories' && currentType === 'in' ? 'active-sub' : ''}`}>Pemasukan (IN)</NavLink>
                <NavLink to="/categories?type=out" onClick={closeMobile} className={`nav-link sub ${location.pathname === '/categories' && currentType === 'out' ? 'active-sub' : ''}`}>Pengeluaran (OUT)</NavLink>
              </div>
            )}
          </div>

        </nav>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'var(--bg-default)', padding: '0.5rem', borderRadius: '50%', color: 'var(--text-secondary)' }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--accent-danger)' }}>
          <LogOut size={20} /><span>Keluar</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={24} />
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {navContent}
      </aside>
    </>
  );
}

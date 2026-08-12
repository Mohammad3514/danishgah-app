import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle, sidebarCollapsed, title, subtitle }) {
  const { user, userProfile, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleColors = {
    admin: 'badge-blue',
    teacher: 'badge-green',
    accountant: 'badge-yellow',
    viewer: 'badge-gray',
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button className="icon-btn" onClick={onMenuToggle} id="menu-toggle-btn" aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div>
          <div className="header-title">{title || 'Dashboard'}</div>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="header-search">
          <Search size={14} color="var(--text-muted)" />
          <input
            id="global-search"
            type="text"
            placeholder="Search students..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <button className="icon-btn" id="notifications-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div
            className="user-avatar"
            onClick={() => setMenuOpen(o => !o)}
            id="user-avatar-btn"
            role="button"
            aria-expanded={menuOpen}
            aria-label="User menu"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {initials}
            <ChevronDown size={10} style={{ marginLeft: 2 }} />
          </div>

          {menuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">
                  {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
                </div>
                <div className={`badge ${roleColors[role] || 'badge-gray'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                  {role?.charAt(0).toUpperCase() + role?.slice(1)}
                </div>
              </div>
              <button className="user-menu-item" onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
                <User size={15} /> My Profile
              </button>
              <button className="user-menu-item" onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
                <Settings size={15} /> Settings
              </button>
              <button className="user-menu-item danger" onClick={handleLogout} id="logout-btn">
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

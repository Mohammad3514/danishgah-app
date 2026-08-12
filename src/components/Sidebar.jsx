import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, DollarSign, ClipboardList,
  TrendingDown, Gift, BarChart3, Settings, ChevronLeft, ChevronRight,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'teacher', 'accountant', 'viewer'] },
    ]
  },
  {
    section: 'People',
    items: [
      { label: 'Students', icon: Users, path: '/students', roles: ['admin', 'teacher', 'accountant'] },
    ]
  },
  {
    section: 'Academics',
    items: [
      { label: 'Attendance', icon: ClipboardList, path: '/attendance', roles: ['admin', 'teacher'] },
    ]
  },
  {
    section: 'Finance',
    items: [
      { label: 'Fee Management', icon: DollarSign, path: '/fees', roles: ['admin', 'accountant'] },
      { label: 'Expenses', icon: TrendingDown, path: '/expenses', roles: ['admin', 'accountant'] },
      { label: 'Events Budget', icon: Gift, path: '/events', roles: ['admin', 'accountant'] },
    ]
  },
  {
    section: 'Analytics',
    items: [
      { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin', 'accountant'] },
    ]
  },
  {
    section: 'System',
    items: [
      { label: 'Import Data', icon: Upload, path: '/import', roles: ['admin'] },
      { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
    ]
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { role } = useAuth();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h2>Danishgah</h2>
            <span>Institute Management</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => {
          const accessible = section.items.filter(item => item.roles.includes(role));
          if (accessible.length === 0) return null;
          return (
            <div key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {accessible.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : ''}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                  >
                    <Icon className="nav-icon" size={18} />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

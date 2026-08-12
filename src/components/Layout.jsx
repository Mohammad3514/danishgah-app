import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard':  { title: 'Dashboard',         subtitle: 'Overview of your institute' },
  '/students':   { title: 'Students',           subtitle: 'Manage student records' },
  '/attendance': { title: 'Attendance',         subtitle: 'Mark and track attendance' },
  '/fees':       { title: 'Fee Management',     subtitle: 'Track fees, dues and payments' },
  '/expenses':   { title: 'Expenses',           subtitle: 'Log and manage expenses' },
  '/events':     { title: 'Events & Budget',    subtitle: 'Plan events and track budgets' },
  '/reports':    { title: 'Reports',            subtitle: 'Analytics and exportable reports' },
  '/import':     { title: 'Import Data',        subtitle: 'Import from Google Sheets or Excel' },
  '/settings':   { title: 'Settings',           subtitle: 'Manage users and preferences' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pathKey = Object.keys(pageTitles).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const { title, subtitle } = pageTitles[pathKey] || {};

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(o => !o);
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 150,
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(o => !o)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={handleMenuToggle}
          sidebarCollapsed={collapsed}
          title={title}
          subtitle={subtitle}
        />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

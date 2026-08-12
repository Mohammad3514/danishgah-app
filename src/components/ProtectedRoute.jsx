import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'teacher') {
      return <Navigate to="/attendance" replace />;
    }
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon" style={{ fontSize: 32 }}>🔒</div>
        <h3>Access Denied</h3>
        <p>You don't have permission to view this page. Contact your administrator.</p>
      </div>
    );
  }

  return children;
}

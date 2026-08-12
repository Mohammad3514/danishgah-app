import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy load all pages
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Students   = lazy(() => import('./pages/Students'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Fees       = lazy(() => import('./pages/Fees'));
const Expenses   = lazy(() => import('./pages/Expenses'));
const Events     = lazy(() => import('./pages/Events'));
const Reports    = lazy(() => import('./pages/Reports'));
const ImportData = lazy(() => import('./pages/ImportData'));
const Settings   = lazy(() => import('./pages/Settings'));

const PageLoader = () => (
  <div className="loading-page">
    <div className="spinner spinner-lg" />
    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
            <Route path="/students/*" element={<Suspense fallback={<PageLoader />}><Students /></Suspense>} />
            <Route path="/attendance/*" element={<Suspense fallback={<PageLoader />}><Attendance /></Suspense>} />
            <Route path="/fees/*" element={
              <ProtectedRoute allowedRoles={['admin','accountant']}>
                <Suspense fallback={<PageLoader />}><Fees /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/expenses/*" element={
              <ProtectedRoute allowedRoles={['admin','accountant']}>
                <Suspense fallback={<PageLoader />}><Expenses /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/events/*" element={
              <ProtectedRoute allowedRoles={['admin','accountant']}>
                <Suspense fallback={<PageLoader />}><Events /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/reports/*" element={
              <ProtectedRoute allowedRoles={['admin','accountant']}>
                <Suspense fallback={<PageLoader />}><Reports /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/import/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<PageLoader />}><ImportData /></Suspense>
              </ProtectedRoute>
            } />
            <Route path="/settings/*" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

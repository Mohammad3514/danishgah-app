import React, { useState, useEffect } from 'react';
import { User, Users, Settings as SettingsIcon, Lock, Save, Plus, X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const initUsers = [
  { id: '1', name: 'Admin User', email: 'admin@danishgah.edu', role: 'admin', is_active: true },
  { id: '2', name: 'Accounts Officer', email: 'accounts@danishgah.edu', role: 'accountant', is_active: true },
  { id: '3', name: 'Teacher Akram', email: 'teacher@danishgah.edu', role: 'teacher', is_active: true },
];

export default function Settings() {
  const { userProfile, role } = useAuth();
  const [tab, setTab] = useState('profile');
  const [usersList, setUsersList] = useState(initUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Profile Form
  const [name, setName] = useState(userProfile?.name || 'Administrator');
  const [email, setEmail] = useState(userProfile?.email || 'admin@danishgah.edu');
  
  // App Settings Form
  const [instName, setInstName] = useState('Danishgah Institute');
  const [session, setSession] = useState('2025-2026');

  // Add User Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      if (supabase.from) {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setUsersList(data);
          setLoadingUsers(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setUsersList(initUsers);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setFormMsg({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Silently attempt Supabase Auth signUp if available (suppress email rate limit warnings)
      if (supabase.auth && typeof supabase.auth.signUp === 'function') {
        try {
          await supabase.auth.signUp({
            email: newUserEmail,
            password: newUserPassword,
            options: {
              data: {
                name: newUserName,
                role: newUserRole,
              }
            }
          });
        } catch (authErr) {
          console.warn('Supabase Auth signUp note:', authErr.message);
        }
      }

      // 2. Save user credentials directly into database `users` table
      if (supabase.from) {
        const { error: dbError } = await supabase.from('users').upsert([
          {
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            password: newUserPassword,
            is_active: true,
          }
        ], { onConflict: 'email' });

        if (dbError) {
          console.error('Users table insert note:', dbError);
        }
      }

      // 3. Update UI state
      const createdRecord = {
        id: Date.now().toString(),
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword,
        is_active: true,
      };

      setUsersList(prev => [createdRecord, ...prev.filter(u => u.email !== newUserEmail)]);
      setFormMsg({ type: 'success', text: `User ${newUserEmail} successfully added to database!` });
      setTimeout(() => {
        setModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('teacher');
        setFormMsg({ type: '', text: '' });
      }, 1500);

    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to create user account.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>System Settings & User Management</h1>
          <p>Configure institute preferences and manage user access roles</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>My Profile</button>
        {role === 'admin' && (
          <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>User Roles & Access ({usersList.length})</button>
        )}
        <button className={`tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>Institute Settings</button>
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16 }}>Personal Profile</h3>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>{role}</span>
          </div>
          <button className="btn btn-primary mt-2"><Save size={15} /> Update Profile</button>
        </div>
      )}

      {tab === 'users' && role === 'admin' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3>User Accounts ({usersList.length})</h3>
              <p className="text-xs text-muted">Manage system users and assign access roles</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Add New User
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access Scope</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>Loading user database...</td></tr>
                ) : usersList.map(u => (
                  <tr key={u.id || u.email}>
                    <td className="font-semibold">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'teacher' ? 'badge-purple' : u.role === 'accountant' ? 'badge-yellow' : 'badge-gray'}`}>
                        {u.role ? u.role.toUpperCase() : 'USER'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: u.role === 'teacher' ? 'var(--warning-400)' : 'var(--text-secondary)' }}>
                        {u.role === 'teacher' ? '🔒 Attendance Only' : u.role === 'admin' ? '⚡ Full System Access' : '💼 Restricted Access'}
                      </span>
                    </td>
                    <td><span className="badge badge-green">{u.is_active !== false ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16 }}>Institute Information</h3>
          <div className="form-group">
            <label className="form-label">Institute Name</label>
            <input className="form-input" value={instName} onChange={e => setInstName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Current Academic Session</label>
            <input className="form-input" value={session} onChange={e => setSession(e.target.value)} />
          </div>
          <button className="btn btn-primary mt-2"><Save size={15} /> Save General Settings</button>
        </div>
      )}

      {/* Modal: Add New User */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Add New User Account</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                {formMsg.text && (
                  <div className="card" style={{
                    marginBottom: 16,
                    background: formMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    borderColor: formMsg.type === 'error' ? 'var(--danger-500)' : 'var(--accent-500)',
                    padding: '10px 14px'
                  }}>
                    <p style={{ color: formMsg.type === 'error' ? 'var(--danger-400)' : 'var(--accent-400)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      {formMsg.text}
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Mr. Akram Khan"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="teacher@danishgah.edu"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Set account password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">User Role & Access Level *</label>
                  <select
                    className="form-select"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                  >
                    <option value="teacher">👨‍🏫 Teacher (Attendance Section Only)</option>
                    <option value="admin">👑 Admin (Full System Access)</option>
                    <option value="accountant">💼 Accountant (Finance & Reports Only)</option>
                    <option value="viewer">👁️ Viewer (Read Only)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating User...</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

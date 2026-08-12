import React, { useState } from 'react';
import { User, Users, Settings as SettingsIcon, Lock, Save, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const initUsers = [
  { id: 1, name: 'Admin User', email: 'admin@danishgah.edu', role: 'admin', status: 'Active' },
  { id: 2, name: 'Accounts Officer', email: 'accounts@danishgah.edu', role: 'accountant', status: 'Active' },
  { id: 3, name: 'Teacher Akram', email: 'akram@danishgah.edu', role: 'teacher', status: 'Active' },
];

export default function Settings() {
  const { userProfile, role } = useAuth();
  const [tab, setTab] = useState('profile');
  const [usersList, setUsersList] = useState(initUsers);

  // Profile Form
  const [name, setName] = useState(userProfile?.name || 'Administrator');
  const [email, setEmail] = useState(userProfile?.email || 'admin@danishgah.edu');
  
  // App Settings Form
  const [instName, setInstName] = useState('Danishgah Institute');
  const [session, setSession] = useState('2025-2026');

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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'accountant' ? 'badge-yellow' : 'badge-green'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="badge badge-green">{u.status}</span></td>
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
    </div>
  );
}

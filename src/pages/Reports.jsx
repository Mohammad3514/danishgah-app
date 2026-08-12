import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, BarChart3, TrendingUp, Users, DollarSign, Printer } from 'lucide-react';

const feeData = [
  { month: 'Mar', collected: 420000, pending: 85000 },
  { month: 'Apr', collected: 395000, pending: 110000 },
  { month: 'May', collected: 450000, pending: 60000 },
  { month: 'Jun', collected: 380000, pending: 140000 },
  { month: 'Jul', collected: 460000, pending: 75000 },
  { month: 'Aug', collected: 485000, pending: 92000 },
];

const expenseData = [
  { month: 'Mar', amount: 310000 },
  { month: 'Apr', amount: 285000 },
  { month: 'May', amount: 340000 },
  { month: 'Jun', amount: 298000 },
  { month: 'Jul', amount: 315000 },
  { month: 'Aug', amount: 330000 },
];

const expensePie = [
  { name: 'Salaries', value: 180000, color: '#6366f1' },
  { name: 'Utilities', value: 35000,  color: '#10b981' },
  { name: 'Supplies', value: 28000,  color: '#f59e0b' },
  { name: 'Maintenance', value: 22000, color: '#ef4444' },
  { name: 'Transport', value: 18000,  color: '#06b6d4' },
  { name: 'Events', value: 25000,  color: '#a855f7' },
  { name: 'Other', value: 22000,  color: '#64748b' },
];

const attendanceData = [
  { class: 'Class 1', present: 92, absent: 8 },
  { class: 'Class 2', present: 88, absent: 12 },
  { class: 'Class 3', present: 95, absent: 5 },
  { class: 'Class 4', present: 85, absent: 15 },
  { class: 'Class 5', present: 90, absent: 10 },
  { class: 'Class 6', present: 78, absent: 22 },
  { class: 'Class 7', present: 83, absent: 17 },
  { class: 'Class 8', present: 91, absent: 9 },
];

const defaulters = [
  { name: 'Ali Hassan', class: 'Class 5', months: 3, amount: 7500 },
  { name: 'Sana Malik', class: 'Class 3', months: 2, amount: 5000 },
  { name: 'Umar Farooq', class: 'Class 7', months: 4, amount: 10000 },
  { name: 'Hina Akhtar', class: 'Class 1', months: 1, amount: 2500 },
  { name: 'Bilal Ahmed', class: 'Class 8', months: 2, amount: 6000 },
];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');

  const handlePrint = () => window.print();

  const tabs = [
    { id: 'overview',    label: 'Overview' },
    { id: 'fees',        label: 'Fee Report' },
    { id: 'attendance',  label: 'Attendance' },
    { id: 'expenses',    label: 'Expenses' },
    { id: 'defaulters',  label: 'Defaulters' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>Comprehensive institute performance reports</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} /> Print Report
          </button>
          <button className="btn btn-primary">
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Students', val: '247', icon: Users, color: 'blue', change: '+12 this month' },
              { label: 'Fees Collected (Aug)', val: 'PKR 4.85L', icon: DollarSign, color: 'green', change: '+5.4% vs July' },
              { label: 'Pending Dues', val: 'PKR 92K', icon: TrendingUp, color: 'red', change: '22 defaulters' },
              { label: 'Avg Attendance', val: '88.4%', icon: BarChart3, color: 'purple', change: 'Across all classes' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div className="stat-card" key={s.label}>
                  <div className={`stat-icon ${s.color}`}><Icon size={22} /></div>
                  <div className="stat-info">
                    <h3>{s.val}</h3>
                    <p>{s.label}</p>
                    <span className="stat-change up" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="chart-container">
              <div className="card-header">
                <span className="card-title">Fee Collection vs Pending (6 Months)</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => `PKR ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend />
                  <Bar dataKey="collected" fill="#6366f1" name="Collected" radius={[4,4,0,0]} />
                  <Bar dataKey="pending"   fill="#ef4444" name="Pending"   radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="card-header">
                <span className="card-title">Expense Breakdown</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expensePie} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={renderLabel}>
                    {expensePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `PKR ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance by class */}
          <div className="chart-container">
            <div className="card-header">
              <span className="card-title">Attendance Rate by Class (%)</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="class" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="present" fill="#10b981" name="Present %" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FEE REPORT */}
      {activeTab === 'fees' && (
        <div className="animate-fade-in">
          <div className="chart-container" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Monthly Fee Collection Trend</span>
              <button className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => `PKR ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend />
                <Line type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Collected" />
                <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} name="Pending" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th><th>Total Expected</th><th>Collected</th><th>Pending</th><th>Collection %</th>
                </tr>
              </thead>
              <tbody>
                {feeData.map(r => {
                  const total = r.collected + r.pending;
                  const pct = Math.round((r.collected / total) * 100);
                  return (
                    <tr key={r.month}>
                      <td className="font-semibold">{r.month} 2025</td>
                      <td>PKR {total.toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-400)' }}>PKR {r.collected.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger-400)' }}>PKR {r.pending.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress" style={{ width: 80 }}>
                            <div className={`progress-bar ${pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="animate-fade-in">
          <div className="chart-container" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Class-wise Attendance Overview</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="class" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present %" radius={[4,4,0,0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent %" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Class</th><th>Present %</th><th>Absent %</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendanceData.map(r => (
                  <tr key={r.class}>
                    <td className="font-semibold">{r.class}</td>
                    <td style={{ color: 'var(--accent-400)' }}>{r.present}%</td>
                    <td style={{ color: 'var(--danger-400)' }}>{r.absent}%</td>
                    <td>
                      <span className={`badge ${r.present >= 90 ? 'badge-green' : r.present >= 80 ? 'badge-yellow' : 'badge-red'}`}>
                        {r.present >= 90 ? 'Excellent' : r.present >= 80 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="chart-container">
              <div className="card-header"><span className="card-title">Monthly Expenses</span></div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => `PKR ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="amount" fill="#a855f7" radius={[4,4,0,0]} name="Total Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container">
              <div className="card-header"><span className="card-title">By Category</span></div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expensePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={renderLabel}>
                    {expensePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `PKR ${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DEFAULTERS */}
      {activeTab === 'defaulters' && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: 20, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <p style={{ color: 'var(--danger-400)', fontWeight: 600 }}>
              ⚠️ {defaulters.length} students have pending fee dues. Total pending: PKR {defaulters.reduce((s,d)=>s+d.amount,0).toLocaleString()}
            </p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Student Name</th><th>Class</th><th>Months Pending</th><th>Amount Due</th><th>Action</th></tr>
              </thead>
              <tbody>
                {defaulters.map((d, i) => (
                  <tr key={i}>
                    <td className="text-muted">{i+1}</td>
                    <td className="font-semibold">{d.name}</td>
                    <td><span className="badge badge-blue">{d.class}</span></td>
                    <td><span className="badge badge-red">{d.months} month{d.months>1?'s':''}</span></td>
                    <td style={{ color: 'var(--danger-400)', fontWeight: 700 }}>PKR {d.amount.toLocaleString()}</td>
                    <td><button className="btn btn-primary btn-sm">Collect Fee</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

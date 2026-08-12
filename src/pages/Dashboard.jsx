import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Wallet,
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  UserPlus,
  DollarSign,
  BarChart3,
  BookOpen,
  Bell,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const feeChartData = [
  { month: 'Mar', collected: 310000, target: 480000 },
  { month: 'Apr', collected: 420000, target: 480000 },
  { month: 'May', collected: 395000, target: 480000 },
  { month: 'Jun', collected: 460000, target: 480000 },
  { month: 'Jul', collected: 435000, target: 480000 },
  { month: 'Aug', collected: 485000, target: 480000 },
];

const expenseData = [
  { name: 'Salaries',    value: 58, color: '#6366f1' },
  { name: 'Utilities',   value: 12, color: '#10b981' },
  { name: 'Supplies',    value: 9,  color: '#f59e0b' },
  { name: 'Maintenance', value: 8,  color: '#ef4444' },
  { name: 'Events',      value: 7,  color: '#c084fc' },
  { name: 'Other',       value: 6,  color: '#22d3ee' },
];

const recentActivity = [
  { id: 1, dot: 'blue',   text: 'Ahmad Raza enrolled in Grade 9 – Science',        time: '2 min ago',  badge: 'Enrollment', badgeClass: 'badge-blue'   },
  { id: 2, dot: 'green',  text: 'Fee of PKR 8,500 collected from Sana Bibi',        time: '18 min ago', badge: 'Fee Paid',   badgeClass: 'badge-green'  },
  { id: 3, dot: 'yellow', text: 'Attendance marked for Grade 6 – 29/32 present',    time: '45 min ago', badge: 'Attendance', badgeClass: 'badge-yellow' },
  { id: 4, dot: 'red',    text: 'Pending fee reminder sent to 12 students',          time: '2 hr ago',   badge: 'Due',        badgeClass: 'badge-red'    },
  { id: 5, dot: 'green',  text: 'Monthly Fee report generated for August',           time: '3 hr ago',   badge: 'Report',     badgeClass: 'badge-green'  },
  { id: 6, dot: 'yellow', text: 'Annual Sports Day event registered – Aug 20',       time: '5 hr ago',   badge: 'Event',      badgeClass: 'badge-yellow' },
];

const topStudents = [
  { name: 'Ayesha Malik', grade: 'Grade 10', marks: 98, avatar: 'AM' },
  { name: 'Bilal Ahmed',  grade: 'Grade 9',  marks: 95, avatar: 'BA' },
  { name: 'Fatima Zahra', grade: 'Grade 10', marks: 93, avatar: 'FZ' },
  { name: 'Usman Tariq',  grade: 'Grade 8',  marks: 91, avatar: 'UT' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconClass, value, label, change, changeDir, prefix }) {
  const isUp = changeDir === 'up';
  return (
    <div className="stat-card animate-fade-in">
      <div className={`stat-icon ${iconClass}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <h3>
          {prefix && (
            <span style={{ fontSize: '1rem', fontWeight: 600, verticalAlign: 'middle' }}>
              {prefix}
            </span>
          )}
          {value}
        </h3>
        <p>{label}</p>
        <div className={`stat-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      </div>
    </div>
  );
}

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name === 'collected' ? 'Collected' : 'Target'}: PKR {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ color: payload[0].payload.color, fontWeight: 700 }}>
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  );
};

const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const displayName = useMemo(() => {
    if (userProfile?.name) return userProfile.name.split(' ')[0];
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Admin';
  }, [user, userProfile]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const attendanceRate = Math.round((189 / 247) * 100);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 32 }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={26} style={{ color: 'var(--primary-400)' }} />
            Welcome back, {displayName}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {today}&nbsp;·&nbsp;Here's what's happening at your institute today.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <BarChart3 size={16} />
            View Reports
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/students/add')}>
            <UserPlus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* ── Summary Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.08))',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={18} style={{ color: 'var(--primary-400)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>3 upcoming events</strong> this week
            &nbsp;— Annual Sports Day, Science Exhibition &amp; Parent Meeting.
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>
          View Events <ArrowUpRight size={14} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        <StatCard
          icon={GraduationCap}
          iconClass="blue"
          value="247"
          label="Total Students"
          change="+12 this month"
          changeDir="up"
        />
        <StatCard
          icon={Wallet}
          iconClass="green"
          value="485,000"
          label="Fees Collected (Aug)"
          change="+11.5% vs last month"
          changeDir="up"
          prefix="₨ "
        />
        <StatCard
          icon={AlertCircle}
          iconClass="red"
          value="92,000"
          label="Pending Dues"
          change="-8% vs last month"
          changeDir="down"
          prefix="₨ "
        />
        <StatCard
          icon={CalendarCheck}
          iconClass="cyan"
          value="189 / 247"
          label="Present Today"
          change={`${attendanceRate}% attendance rate`}
          changeDir="up"
        />
        <StatCard
          icon={CalendarDays}
          iconClass="yellow"
          value="3"
          label="Upcoming Events"
          change="Next: Sports Day Aug 20"
          changeDir="up"
        />
      </div>

      {/* ── Main Dashboard Grid: Charts ── */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>

        {/* ── Fee Collection AreaChart ── */}
        <div className="chart-container">
          <div className="card-header">
            <div>
              <div className="card-title">Fee Collection Trend</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Last 6 months · PKR
              </p>
            </div>
            <span className="badge badge-green">
              <ArrowUpRight size={11} /> +11.5%
            </span>
          </div>

          {/* Mini legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Collected', color: '#6366f1' },
              { label: 'Target',    color: 'rgba(245,158,11,0.7)' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                {l.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={feeChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`}
                width={54}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#gradTarget)"
                dot={false}
                activeDot={{ r: 5, fill: '#f59e0b' }}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#gradCollected)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 2, stroke: '#312e81' }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Monthly % row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border-secondary)',
          }}>
            {feeChartData.map((d) => {
              const pct = Math.round((d.collected / d.target) * 100);
              return (
                <div key={d.month} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>{d.month}</div>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: pct >= 100 ? 'var(--accent-400)' : 'var(--text-primary)',
                  }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Expense PieChart ── */}
        <div className="chart-container">
          <div className="card-header">
            <div>
              <div className="card-title">Expense Breakdown</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>August 2026</p>
            </div>
            <span className="badge badge-blue">Monthly</span>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomPieLabel}
              >
                {expenseData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Pie Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
            {expenseData.map((item) => (
              <div key={item.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: item.color, flexShrink: 0, display: 'inline-block',
                  }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Activity + Side Panel ── */}
      <div className="dashboard-bottom-grid">

        {/* ── Recent Activity ── */}
        <div className="recent-activity">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>
              View all
            </button>
          </div>
          {recentActivity.map((item) => (
            <div className="activity-item" key={item.id}>
              <div className={`activity-dot ${item.dot}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="activity-text">{item.text}</div>
                <div className="activity-time">{item.time}</div>
              </div>
              <span className={`badge ${item.badgeClass}`} style={{ flexShrink: 0 }}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate('/attendance')}
              >
                <ClipboardList size={16} />
                Mark Attendance
              </button>
              <button
                className="btn btn-success"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate('/fees')}
              >
                <DollarSign size={16} />
                Collect Fee
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate('/students/add')}
              >
                <UserPlus size={16} />
                Add Student
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate('/reports')}
              >
                <BarChart3 size={16} />
                View Reports
              </button>
            </div>
          </div>

          {/* Top Performers */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div className="card-title">Top Performers</div>
              <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topStudents.map((student, idx) => {
                const rankColor =
                  idx === 0 ? '#f59e0b' :
                  idx === 1 ? '#94a3b8' :
                  idx === 2 ? '#cd7f32' :
                  'var(--text-muted)';
                const avatarBg =
                  idx === 0
                    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                    : 'linear-gradient(135deg,var(--primary-500),var(--accent-500))';
                return (
                  <div key={student.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rankColor, width: 16, textAlign: 'center', flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <div className="avatar avatar-sm" style={{ background: avatarBg }}>
                      {student.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.grade}</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-400)' }}>
                      {student.marks}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Attendance bar */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Today's Attendance</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-400)' }}>{attendanceRate}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar green" style={{ width: `${attendanceRate}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>189 present</span>
                <span>58 absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Dues Alert Banner ── */}
      <div style={{
        marginTop: 20,
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} style={{ color: 'var(--danger-400)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--danger-400)' }}>₨ 92,000</strong> in pending dues from{' '}
            <strong style={{ color: 'var(--text-primary)' }}>12 students</strong>. Last reminder sent 2 hours ago.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/fees/dues')}>
            View Details <ArrowUpRight size={13} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => navigate('/fees/reminders')}>
            Send Reminders
          </button>
        </div>
      </div>

    </div>
  );
}

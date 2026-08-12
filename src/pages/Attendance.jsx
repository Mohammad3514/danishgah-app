import React, { useState } from 'react';
import { ClipboardList, Check, X, Clock, Users, Calendar } from 'lucide-react';

const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

const dummyStudentsClass5 = [
  { id: 1, rollNo: '001', name: 'Ahmed Ali Khan' },
  { id: 2, rollNo: '002', name: 'Fatima Noor' },
  { id: 3, rollNo: '003', name: 'Usman Tariq' },
  { id: 4, rollNo: '004', name: 'Ayesha Siddiqui' },
  { id: 5, rollNo: '005', name: 'Bilal Hassan' },
  { id: 6, rollNo: '006', name: 'Zainab Khalid' },
  { id: 7, rollNo: '007', name: 'Muhammad Hamza' },
  { id: 8, rollNo: '008', name: 'Sana Iqbal' },
  { id: 9, rollNo: '009', name: 'Ali Raza' },
  { id: 10, rollNo: '010', name: 'Hina Malik' },
  { id: 11, rollNo: '011', name: 'Omar Sheikh' },
  { id: 12, rollNo: '012', name: 'Maryam Butt' },
];

export default function Attendance() {
  const [tab, setTab] = useState('mark');
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2025-08');

  // Attendance state: studentId -> 'Present' | 'Absent' | 'Leave'
  const [attendance, setAttendance] = useState({
    1: 'Present', 2: 'Present', 3: 'Present', 4: 'Absent',
    5: 'Present', 6: 'Leave', 7: 'Present', 8: 'Present',
    9: 'Present', 10: 'Absent', 11: 'Present', 12: 'Present'
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const setStatus = (id, status) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'Absent').length;
  const leaveCount = Object.values(attendance).filter(v => v === 'Leave').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance Tracker</h1>
          <p>Daily student attendance records and monthly tracker</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>Mark Attendance</button>
        <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Monthly Matrix</button>
      </div>

      {tab === 'mark' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Class</label>
                <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Date</label>
                <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginLeft: 'auto', alignItems: 'center' }}>
                <span className="badge badge-green">Present: {presentCount}</span>
                <span className="badge badge-red">Absent: {absentCount}</span>
                <span className="badge badge-yellow">Leave: {leaveCount}</span>
              </div>
            </div>
          </div>

          {savedMsg && (
            <div className="card" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--accent-500)', marginBottom: 16 }}>
              <p style={{ color: 'var(--accent-400)', fontWeight: 600 }}>✅ Attendance saved successfully for {selectedClass} on {selectedDate}!</p>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {dummyStudentsClass5.map(s => {
                  const current = attendance[s.id] || 'Present';
                  return (
                    <tr key={s.id}>
                      <td className="font-semibold text-muted">{s.rollNo}</td>
                      <td className="font-semibold">{s.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            className={`btn btn-sm ${current === 'Present' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => setStatus(s.id, 'Present')}
                          >
                            <Check size={14} /> Present
                          </button>
                          <button
                            className={`btn btn-sm ${current === 'Absent' ? 'btn-danger' : 'btn-ghost'}`}
                            onClick={() => setStatus(s.id, 'Absent')}
                          >
                            <X size={14} /> Absent
                          </button>
                          <button
                            className={`btn btn-sm ${current === 'Leave' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={current === 'Leave' ? { background: 'var(--warning-500)', color: '#000' } : {}}
                            onClick={() => setStatus(s.id, 'Leave')}
                          >
                            <Clock size={14} /> Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSave}>Submit Attendance</button>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Class</label>
                <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Month</label>
                <input type="month" className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <div className="attendance-grid" style={{ minWidth: 1000, padding: 12 }}>
              <div className="att-cell header">Student Name</div>
              {Array.from({ length: 31 }, (_, i) => (
                <div key={i} className="att-cell header">{i + 1}</div>
              ))}

              {dummyStudentsClass5.map(s => (
                <React.Fragment key={s.id}>
                  <div className="att-cell name truncate">{s.name}</div>
                  {Array.from({ length: 31 }, (_, i) => {
                    const isSunday = (i + 1) % 7 === 0;
                    if (isSunday) return <div key={i} className="att-cell empty" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>S</div>;
                    const st = (i + s.id) % 10 === 0 ? 'absent' : (i + s.id) % 15 === 0 ? 'leave' : 'present';
                    return (
                      <div key={i} className={`att-cell ${st}`}>
                        {st === 'present' ? 'P' : st === 'absent' ? 'A' : 'L'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

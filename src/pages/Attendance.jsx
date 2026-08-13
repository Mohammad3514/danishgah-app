import React, { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Clock, Users, Calendar, Filter, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../supabase';

const CLASSES = ['All Classes', 'Muntazir (3-4)', 'Muntaqim (5)', 'Zaman (6)', 'Qaim (7-8)', 'Hujjat (9-10)', 'Senior Class'];

export default function Attendance() {
  const [tab, setTab] = useState('report');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2025-04');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Auto-detect available months in database on initial load
  useEffect(() => {
    const detectMonths = async () => {
      if (supabase.from) {
        try {
          const { data } = await supabase.from('attendance').select('date').order('date', { ascending: false }).limit(5000);
          if (data && data.length > 0) {
            const monthSet = new Set();
            data.forEach(r => {
              if (r.date && r.date.length >= 7) {
                monthSet.add(r.date.slice(0, 7));
              }
            });
            const mList = Array.from(monthSet).sort().reverse();
            if (mList.length > 0) {
              setAvailableMonths(mList);
              setSelectedMonth(mList[0]);
            }
          }
        } catch (e) {
          console.error('Error detecting attendance months:', e);
        }
      }
    };
    detectMonths();
  }, []);

  // Fetch Students and Attendance
  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      if (supabase.from) {
        // Fetch all students from database
        const { data: stData } = await supabase.from('students').select('*').order('name', { ascending: true });
        
        let filteredStudents = stData || [];
        if (selectedClass !== 'All Classes' && filteredStudents.length > 0) {
          filteredStudents = filteredStudents.filter(s => {
            if (!s.class) return true;
            const c1 = s.class.toLowerCase().replace(/[^a-z0-9]/g, '');
            const c2 = selectedClass.toLowerCase().replace(/[^a-z0-9]/g, '');
            return c1 === c2 || c1.includes(c2) || c2.includes(c1);
          });
        }
        setStudents(filteredStudents);

        // Fetch daily attendance for selectedDate (Mark Attendance tab)
        const { data: attData } = await supabase.from('attendance').select('*').eq('date', selectedDate);
        const map = {};
        if (attData && attData.length > 0) {
          attData.forEach(a => {
            if (a.student_id) map[a.student_id] = a.status;
            if (a.student_name) map[a.student_name.trim().toLowerCase()] = a.status;
          });
        }
        setAttendanceMap(map);

        // Fetch monthly attendance for Matrix
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-');
          const yNum = parseInt(year || '2026', 10);
          const mNum = parseInt(month || '4', 10);
          const lastDay = new Date(yNum, mNum, 0).getDate();
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
          const { data: mData } = await supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate);
          if (mData) setMonthlyRecords(mData);
        }
      }
    } catch (e) {
      console.error('Error fetching attendance:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, selectedMonth]);

  const setStatus = (student, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [student.id]: status,
      [student.name.trim().toLowerCase()]: status,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');

    try {
      const recordsToInsert = students.map(s => {
        const status = attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()] || 'Present';
        return {
          student_id: s.id,
          student_name: s.name,
          class: s.class || (selectedClass !== 'All Classes' ? selectedClass : 'Muntazir (3-4)'),
          date: selectedDate,
          status: status
        };
      });

      if (supabase.from && recordsToInsert.length > 0) {
        if (selectedClass !== 'All Classes') {
          await supabase.from('attendance').delete().eq('class', selectedClass).eq('date', selectedDate);
        } else {
          await supabase.from('attendance').delete().eq('date', selectedDate);
        }
        
        const { error } = await supabase.from('attendance').insert(recordsToInsert);
        if (error) throw new Error(error.message);
      }

      setSavedMsg(`✅ Attendance saved successfully to database for ${selectedDate}!`);
      setTimeout(() => setSavedMsg(''), 3000);
      await fetchStudentsAndAttendance();
    } catch (err) {
      console.error(err);
      alert(`Error saving attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate days in selected month
  const [yStr, mStr] = selectedMonth.split('-');
  const yearNum = parseInt(yStr || '2025', 10);
  const monthNum = parseInt(mStr || '4', 10);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  // Summary counts for Mark Attendance
  const presentCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()] || 'Present') === 'Present').length;
  const absentCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()]) === 'Absent').length;
  const leaveCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()]) === 'Leave').length;

  const formatMonthLabel = (mStrVal) => {
    if (!mStrVal) return '';
    const [y, m] = mStrVal.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance Tracker</h1>
          <p>Daily student attendance records and monthly matrix synced with database</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
          <Calendar size={16} style={{ display: 'inline', marginRight: 6 }} /> Monthly Matrix
        </button>
        <button className={`tab ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>
          <ClipboardList size={16} style={{ display: 'inline', marginRight: 6 }} /> Mark Daily Attendance
        </button>
      </div>

      {tab === 'report' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Filter Class</label>
                <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Month</label>
                {availableMonths.length > 0 ? (
                  <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{formatMonthLabel(m)} ({m})</option>
                    ))}
                  </select>
                ) : (
                  <input type="month" className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="badge badge-green" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '6px 12px' }}>
                  P = Present
                </span>
                <span className="badge badge-red" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 12px' }}>
                  A = Absent
                </span>
                <span className="badge badge-yellow" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '6px 12px' }}>
                  L = Leave
                </span>
              </div>
            </div>
          </div>

          <div className="attendance-matrix-container">
            <table className="attendance-matrix-table">
              <thead>
                <tr>
                  <th className="col-sticky">Student Name</th>
                  <th style={{ minWidth: 100 }}>Class</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i} style={{ width: 34 }}>{i + 1}</th>
                  ))}
                  <th style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', minWidth: 40 }}>P</th>
                  <th style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', minWidth: 40 }}>A</th>
                  <th style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', minWidth: 40 }}>L</th>
                  <th style={{ minWidth: 60 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={daysInMonth + 6} style={{ padding: 40, textAlign: 'center' }}>
                      <span className="spinner" /> Loading attendance records for {formatMonthLabel(selectedMonth)}...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students found in database for {selectedClass}
                    </td>
                  </tr>
                ) : (
                  students.map(s => {
                    let pCount = 0, aCount = 0, lCount = 0;

                    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
                      const dayNum = String(i + 1).padStart(2, '0');
                      const targetDateStr = `${selectedMonth}-${dayNum}`;
                      
                      const rec = monthlyRecords.find(r => 
                        r.date === targetDateStr && 
                        (String(r.student_id) === String(s.id) || (r.student_name && r.student_name.trim().toLowerCase() === s.name.trim().toLowerCase()))
                      );

                      const st = rec ? rec.status.toLowerCase() : 'empty';
                      if (st === 'present') pCount++;
                      else if (st === 'absent') aCount++;
                      else if (st === 'leave') lCount++;

                      return (
                        <td key={i}>
                          <div className={`att-pill ${st}`}>
                            {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'leave' ? 'L' : '—'}
                          </div>
                        </td>
                      );
                    });

                    const totalMarked = pCount + aCount + lCount;
                    const pct = totalMarked > 0 ? Math.round((pCount / totalMarked) * 100) : 0;

                    return (
                      <tr key={s.id}>
                        <td className="col-sticky">
                          <div className="font-semibold text-primary truncate" style={{ maxWidth: 190 }}>{s.name}</div>
                          <div className="text-xs text-muted">Roll: {s.roll_number || s.rollNo || '—'}</div>
                        </td>
                        <td>
                          <span className="badge badge-blue text-xs">{s.class || 'General'}</span>
                        </td>
                        {dayCells}
                        <td style={{ fontWeight: 700, color: '#10b981' }}>{pCount}</td>
                        <td style={{ fontWeight: 700, color: '#ef4444' }}>{aCount}</td>
                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>{lCount}</td>
                        <td style={{ fontWeight: 700 }}>{totalMarked > 0 ? `${pct}%` : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <p style={{ color: 'var(--accent-400)', fontWeight: 600 }}>{savedMsg}</p>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>Loading students from database...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found in database for {selectedClass}</td></tr>
                ) : students.map(s => {
                  const current = attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()] || 'Present';
                  return (
                    <tr key={s.id}>
                      <td className="font-semibold text-muted">{s.roll_number || s.rollNo || '—'}</td>
                      <td className="font-semibold">{s.name}</td>
                      <td><span className="badge badge-blue">{s.class || 'General'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            className={`btn btn-sm ${current === 'Present' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => setStatus(s, 'Present')}
                          >
                            <Check size={14} /> Present
                          </button>
                          <button
                            className={`btn btn-sm ${current === 'Absent' ? 'btn-danger' : 'btn-ghost'}`}
                            onClick={() => setStatus(s, 'Absent')}
                          >
                            <X size={14} /> Absent
                          </button>
                          <button
                            className={`btn btn-sm ${current === 'Leave' ? 'btn-secondary' : 'btn-ghost'}`}
                            style={current === 'Leave' ? { background: 'var(--warning-500)', color: '#000' } : {}}
                            onClick={() => setStatus(s, 'Leave')}
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
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving || students.length === 0}>
              {saving ? <><span className="spinner" /> Saving to Database...</> : 'Submit Attendance to Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

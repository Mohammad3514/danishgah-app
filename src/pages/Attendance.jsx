import React, { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Clock, Users, Calendar } from 'lucide-react';
import { supabase } from '../supabase';

const CLASSES = ['Muntazir (3-4)', 'Muntaqim (5)', 'Zaman (6)', 'Qaim (7-8)', 'Hujjat (9-10)', 'Senior Class'];

export default function Attendance() {
  const [tab, setTab] = useState('mark');
  const [selectedClass, setSelectedClass] = useState('Muntazir (3-4)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // 1. Fetch Students from database for selectedClass
  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      if (supabase.from) {
        // Fetch students matching selectedClass (or all students if matching fails)
        const { data: stData } = await supabase.from('students').select('*').order('name', { ascending: true });
        
        let filteredStudents = [];
        if (stData && stData.length > 0) {
          filteredStudents = stData.filter(s => {
            if (!s.class) return true;
            const c1 = s.class.toLowerCase();
            const c2 = selectedClass.toLowerCase();
            return c1 === c2 || c1.includes(c2) || c2.includes(c1);
          });
          setStudents(filteredStudents.length > 0 ? filteredStudents : stData);
        }

        // Fetch existing attendance for selectedDate
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
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        const { data: mData } = await supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate);
        if (mData) setMonthlyRecords(mData);
      }
    } catch (e) {
      console.error(e);
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
          class: s.class || selectedClass,
          date: selectedDate,
          status: status
        };
      });

      if (supabase.from && recordsToInsert.length > 0) {
        // Delete previous records for selectedClass & selectedDate to prevent duplicates
        await supabase.from('attendance').delete().eq('class', selectedClass).eq('date', selectedDate);
        
        // Insert new attendance records
        const { error } = await supabase.from('attendance').insert(recordsToInsert);
        if (error) throw new Error(error.message);
      }

      setSavedMsg(`✅ Attendance saved successfully to database for ${selectedClass} on ${selectedDate}!`);
      setTimeout(() => setSavedMsg(''), 3000);
      await fetchStudentsAndAttendance();
    } catch (err) {
      console.error(err);
      alert(`Error saving attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()] || 'Present') === 'Present').length;
  const absentCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()]) === 'Absent').length;
  const leaveCount = students.filter(s => (attendanceMap[s.id] || attendanceMap[s.name.trim().toLowerCase()]) === 'Leave').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance Tracker</h1>
          <p>Daily student attendance records and monthly matrix synced with Supabase database</p>
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
                      <td><span className="badge badge-blue">{s.class || selectedClass}</span></td>
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

              {students.map(s => (
                <React.Fragment key={s.id}>
                  <div className="att-cell name truncate">{s.name}</div>
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayNum = String(i + 1).padStart(2, '0');
                    const targetDateStr = `${selectedMonth}-${dayNum}`;
                    const rec = monthlyRecords.find(r => 
                      r.date === targetDateStr && 
                      (String(r.student_id) === String(s.id) || (r.student_name && r.student_name.trim().toLowerCase() === s.name.trim().toLowerCase()))
                    );

                    const st = rec ? rec.status.toLowerCase() : 'empty';
                    return (
                      <div key={i} className={`att-cell ${st}`}>
                        {st === 'present' ? 'P' : st === 'absent' ? 'A' : st === 'leave' ? 'L' : '—'}
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

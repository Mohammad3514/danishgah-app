import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Download, Eye, X, User } from 'lucide-react';
import { supabase } from '../supabase';

const CLASSES = ['Muntazir (3-4)', 'Muntaqim (5)', 'Zaman (6)', 'Qaim (7-8)', 'Hujjat (9-10)', 'Senior Class'];

const initStudents = [
  { id:1, roll_number:'001', name:'Ahmed Ali Khan',    father_name:'Ali Khan',      class:'Muntaqim (5)', gender:'Male',   dob:'2014-03-12', guardian_name:'Ali Khan',     phone:'0301-1234567', address:'House 12, Street 4, Lahore', status:'Active' },
  { id:2, roll_number:'002', name:'Fatima Noor',        father_name:'Noor Ahmed',    class:'Qaim (7-8)', gender:'Female', dob:'2012-07-22', guardian_name:'Noor Ahmed',   phone:'0321-2345678', address:'Flat 3B, Block C, Karachi',  status:'Active' },
  { id:3, roll_number:'003', name:'Usman Tariq',        father_name:'Tariq Mehmood', class:'Muntazir (3-4)', gender:'Male',   dob:'2016-01-05', guardian_name:'Tariq Mehmood',phone:'0333-3456789', address:'Plot 7, Sector G, Islamabad',  status:'Active' },
];

const emptyForm = { roll_number:'', name:'', father_name:'', class:'Muntazir (3-4)', gender:'Male', date_of_birth:'', guardian_name:'', guardian_phone:'', address:'', status:'Active' };

function Avatar({ name, size = 36 }) {
  const initials = (name || 'S').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4'];
  const bg = colors[(name || 'S').charCodeAt(0) % colors.length];
  return <div className="avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}>{initials}</div>;
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewStudent, setViewStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      if (supabase.from) {
        const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setStudents(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setStudents(initStudents);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s => {
    const sName = s.name || '';
    const sRoll = s.roll_number || s.rollNo || '';
    const matchSearch = sName.toLowerCase().includes(search.toLowerCase()) || sRoll.includes(search);
    const matchClass  = !filterClass  || s.class === filterClass;
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchGender = !filterGender || s.gender === filterGender;
    return matchSearch && matchClass && matchStatus && matchGender;
  });

  const openAdd = () => { setForm(emptyForm); setEditStudent(null); setModalOpen(true); };
  const openEdit = (s) => {
    setForm({
      roll_number: s.roll_number || s.rollNo || '',
      name: s.name || '',
      father_name: s.father_name || s.fatherName || '',
      class: s.class || 'Muntazir (3-4)',
      gender: s.gender || 'Male',
      date_of_birth: s.date_of_birth || s.dob || '',
      guardian_name: s.guardian_name || s.guardian || '',
      guardian_phone: s.guardian_phone || s.phone || '',
      address: s.address || '',
      status: s.status || 'Active'
    });
    setEditStudent(s.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.roll_number) return;

    try {
      if (supabase.from) {
        if (editStudent) {
          await supabase.from('students').update(form).eq('id', editStudent);
        } else {
          await supabase.from('students').insert([form]);
        }
        await fetchStudents();
        setModalOpen(false);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    if (editStudent) {
      setStudents(ss => ss.map(s => s.id === editStudent ? { ...s, ...form } : s));
    } else {
      setStudents(ss => [{ ...form, id: Date.now() }, ...ss]);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student record?')) {
      try {
        if (supabase.from) {
          await supabase.from('students').delete().eq('id', id);
          await fetchStudents();
          return;
        }
      } catch (e) { console.error(e); }
      setStudents(ss => ss.filter(s => s.id !== id));
    }
  };

  const exportCSV = () => {
    const headers = ['Roll No','Name','Father Name','Class','Gender','Guardian','Phone','Address','Status'];
    const rows = students.map(s => [s.roll_number || s.rollNo, s.name, s.father_name || s.fatherName, s.class, s.gender, s.guardian_name || s.guardian, s.guardian_phone || s.phone, `"${s.address || ''}"`, s.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students.csv'; a.click();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Students ({students.length})</h1>
          <p>{filtered.length} students shown from database</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={15}/> Export CSV</button>
          <button className="btn btn-primary" id="add-student-btn" onClick={openAdd}><Plus size={15}/> Add Student</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input id="student-search" className="form-input" style={{ paddingLeft: 32 }} placeholder="Search by name or roll number..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-select" style={{ flex:'0 0 160px' }} value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c=><option key={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ flex:'0 0 130px' }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option><option>Inactive</option>
          </select>
          <select className="form-select" style={{ flex:'0 0 120px' }} value={filterGender} onChange={e=>setFilterGender(e.target.value)}>
            <option value="">All Genders</option>
            <option>Male</option><option>Female</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Roll No</th><th>Class</th><th>Gender</th>
              <th>Guardian Phone</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}>Loading from database...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No students found in database</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={s.name}/>
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted">{(s.father_name || s.fatherName) ? `S/O ${s.father_name || s.fatherName}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="text-muted font-semibold">{s.roll_number || s.rollNo}</td>
                <td><span className="badge badge-blue">{s.class}</span></td>
                <td>{s.gender || 'Male'}</td>
                <td>{s.guardian_phone || s.phone || '—'}</td>
                <td><span className={`badge ${s.status==='Active'?'badge-green':'badge-gray'}`}>{s.status || 'Active'}</span></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={()=>setViewStudent(s)}><Eye size={14}/></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>openEdit(s)}><Edit2 size={14}/></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={()=>handleDelete(s.id)} style={{ color:'var(--danger-400)' }}><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={()=>setModalOpen(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Student full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Roll Number *</label><input className="form-input" placeholder="e.g. 001" value={form.roll_number} onChange={e=>setForm({...form,roll_number:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Father's Name</label><input className="form-input" placeholder="Father's full name" value={form.father_name} onChange={e=>setForm({...form,father_name:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-select" value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                    {CLASSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" placeholder="Guardian name" value={form.guardian_name} onChange={e=>setForm({...form,guardian_name:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" placeholder="0300-1234567" value={form.guardian_phone} onChange={e=>setForm({...form,guardian_phone:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" placeholder="Full address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editStudent?'Save Changes':'Add Student'}</button>
            </div>
          </div>
        </div>
      )}

      {viewStudent && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewStudent(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button className="btn btn-ghost btn-icon" onClick={()=>setViewStudent(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border-secondary)' }}>
                <Avatar name={viewStudent.name} size={56}/>
                <div>
                  <h2 style={{ fontSize:'1.2rem' }}>{viewStudent.name}</h2>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Roll No: {viewStudent.roll_number || viewStudent.rollNo} | {viewStudent.class}</p>
                </div>
              </div>
              <div className="form-row">
                {[
                  ['Father\'s Name', viewStudent.father_name || viewStudent.fatherName],
                  ['Gender', viewStudent.gender],
                  ['Guardian', viewStudent.guardian_name || viewStudent.guardian],
                  ['Phone', viewStudent.guardian_phone || viewStudent.phone],
                ].map(([l,v])=>(
                  <div key={l}>
                    <div className="text-xs text-muted" style={{ marginBottom:2, fontWeight:600, textTransform:'uppercase' }}>{l}</div>
                    <div className="font-semibold" style={{ fontSize:'0.875rem' }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setViewStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

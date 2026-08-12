import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, CheckCircle, AlertTriangle, Edit2, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';

const CLASSES = ['Muntazir (3-4)', 'Muntaqim (5)', 'Zaman (6)', 'Qaim (7-8)', 'Hujjat (9-10)', 'Senior Class'];
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const YEARS = ['2026', '2025', '2024', '2027'];

const defaultFeeStructure = [
  { class: 'Muntazir (3-4)', fee: 300 },
  { class: 'Muntaqim (5)', fee: 300 },
  { class: 'Zaman (6)', fee: 300 },
  { class: 'Qaim (7-8)', fee: 300 },
  { class: 'Hujjat (9-10)', fee: 300 },
  { class: 'Senior Class', fee: 300 },
];

const initStudents = [
  { id: '1', roll_number: '001', name: 'Ahmed Ali Khan', class: 'Muntaqim (5)', card_issued: 'Yes' },
  { id: '2', roll_number: '002', name: 'Fatima Noor', class: 'Qaim (7-8)', card_issued: 'Old Card' },
  { id: '3', roll_number: '003', name: 'Usman Tariq', class: 'Muntazir (3-4)', card_issued: 'No' },
  { id: '4', roll_number: '004', name: 'Ayesha Siddiqui', class: 'Hujjat (9-10)', card_issued: 'Yes' },
];

const initTransactions = [
  { id: 'rec-1', student_name: 'Ahmed Ali Khan', roll_number: '001', class: 'Muntaqim (5)', month: 'August 2026', amount: 300, date: '2026-08-05', payment_method: 'Cash', status: 'Paid', card_issued: 'Yes' },
  { id: 'rec-2', student_name: 'Fatima Noor', roll_number: '002', class: 'Qaim (7-8)', month: 'August 2026', amount: 300, date: '2026-08-01', payment_method: 'Cash', status: 'Overdue', card_issued: 'Old Card' },
];

export default function Fees() {
  const [tab, setTab] = useState('records');
  const [students, setStudents] = useState(initStudents);
  const [transactions, setTransactions] = useState(initTransactions);
  const [feeStructure, setFeeStructure] = useState(defaultFeeStructure);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMonth, setFilterMonth] = useState('August');
  const [filterYear, setFilterYear] = useState('2026');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCard, setFilterCard] = useState('');

  // Edit Fee Record Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    student_name: '',
    roll_number: '',
    class: 'Muntazir (3-4)',
    month: 'August 2026',
    amount: 300,
    status: 'Paid',
    payment_method: 'Cash',
    card_issued: 'No',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (supabase.from) {
        // Fetch students
        const { data: stData } = await supabase.from('students').select('*').order('created_at', { ascending: false });
        if (stData && stData.length > 0) setStudents(stData);

        // Fetch fee payments
        const { data: feeData } = await supabase.from('fee_payments').select('*').order('created_at', { ascending: false });
        if (feeData && feeData.length > 0) {
          const mapped = feeData.map(f => ({
            id: f.id,
            student_name: (f.student_name || '').trim(),
            roll_number: f.roll_number || '—',
            class: (f.class || '').trim(),
            month: (f.month || '').trim(),
            amount: Number(f.amount || 0),
            date: f.paid_date || f.date || new Date().toISOString().split('T')[0],
            payment_method: f.payment_method || 'Cash',
            status: f.status || 'Paid',
            card_issued: f.card_issued || 'No',
          }));
          setTransactions(mapped);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute merged records list strictly filtered by all criteria (Search, Class, Month, Year, Status, Card)
  const displayedRecords = React.useMemo(() => {
    const selectedPeriod = `${filterMonth} ${filterYear}`;
    const targetMonth = filterMonth.trim().toLowerCase();
    const targetYear = filterYear.trim().toLowerCase();

    const getFeeForClass = (cls) => {
      const found = feeStructure.find(f => {
        const fCls = f.class.toLowerCase();
        const cCls = (cls || '').toLowerCase();
        return fCls === cCls || fCls.includes(cCls) || cCls.includes(fCls);
      });
      return found ? Number(found.fee) : 300;
    };

    // 1. Deduplicate student profiles by name
    const uniqueStudentsMap = new Map();
    students.forEach(s => {
      if (!s.name) return;
      const key = s.name.trim().toLowerCase();
      if (!uniqueStudentsMap.has(key)) {
        uniqueStudentsMap.set(key, s);
      }
    });
    const uniqueStudents = Array.from(uniqueStudentsMap.values());

    // 2. Map all unique students to their transaction or pending record for selected Month & Year
    let records = uniqueStudents.map(s => {
      const sName = (s.name || '').trim().toLowerCase();
      const sRoll = (s.roll_number || s.rollNo || '').trim().toLowerCase();

      // Find exact fee_payment transaction in database matching student AND selected Month & Year
      const existingTx = transactions.find(t => {
        const tName = (t.student_name || '').trim().toLowerCase();
        const tRoll = (t.roll_number || '').trim().toLowerCase();
        
        const nameMatch = (tName && (tName === sName || tName.includes(sName) || sName.includes(tName))) || 
                          (tRoll && sRoll && tRoll === sRoll);
        if (!nameMatch) return false;

        const tMonth = (t.month || '').trim().toLowerCase();
        return tMonth.includes(targetMonth) && tMonth.includes(targetYear);
      });

      const classDefaultFee = getFeeForClass(s.class);

      if (existingTx) {
        return {
          id: existingTx.id,
          student_id: s.id,
          student_name: s.name,
          roll_number: s.roll_number || s.rollNo || '—',
          class: s.class || existingTx.class,
          month: existingTx.month || selectedPeriod,
          amount: Number(existingTx.amount),
          status: existingTx.status || 'Paid',
          payment_method: existingTx.payment_method || 'Cash',
          card_issued: existingTx.card_issued || s.card_issued || 'No',
          date: existingTx.date || new Date().toISOString().split('T')[0],
        };
      }

      return {
        id: `temp-${s.id}-${filterMonth}-${filterYear}`,
        student_id: s.id,
        student_name: s.name,
        roll_number: s.roll_number || s.rollNo || '—',
        class: s.class,
        month: selectedPeriod,
        amount: classDefaultFee,
        status: 'Pending',
        payment_method: 'Cash',
        card_issued: s.card_issued || 'No',
        date: new Date().toISOString().split('T')[0],
      };
    });

    // 3. Include any fee_payments from DB for selected Month & Year if student profile was not in students table
    transactions.forEach(t => {
      const tMonth = (t.month || '').trim().toLowerCase();
      if (tMonth.includes(targetMonth) && tMonth.includes(targetYear)) {
        const tName = (t.student_name || '').trim().toLowerCase();
        const alreadyAdded = records.some(r => r.student_name.trim().toLowerCase() === tName);
        if (!alreadyAdded) {
          records.push({
            id: t.id,
            student_id: t.student_id || t.id,
            student_name: t.student_name,
            roll_number: t.roll_number || '—',
            class: t.class || 'Muntazir (3-4)',
            month: t.month,
            amount: Number(t.amount),
            status: t.status || 'Paid',
            payment_method: t.payment_method || 'Cash',
            card_issued: t.card_issued || 'No',
            date: t.date || new Date().toISOString().split('T')[0],
          });
        }
      }
    });

    // 4. APPLY ALL FILTERS STRICTLY AT THE END ON THE FINAL RECORD LIST:

    // Filter A: Search by Name or Roll Number
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      records = records.filter(r => {
        const n = (r.student_name || '').trim().toLowerCase();
        const roll = (r.roll_number || '').trim().toLowerCase();
        return n.includes(term) || roll.includes(term);
      });
    }

    // Filter B: Filter by Class
    if (filterClass && filterClass.trim()) {
      const targetCls = filterClass.trim().toLowerCase();
      records = records.filter(r => {
        const rCls = (r.class || '').trim().toLowerCase();
        return rCls === targetCls || rCls.includes(targetCls) || targetCls.includes(rCls);
      });
    }

    // Filter C: Filter by Month & Year
    records = records.filter(r => {
      const rMonth = (r.month || '').toLowerCase();
      return rMonth.includes(targetMonth) && rMonth.includes(targetYear);
    });

    // Filter D: Filter by Status (Paid, Pending, Overdue, Defaulter)
    if (filterStatus && filterStatus.trim()) {
      records = records.filter(r => r.status.trim().toLowerCase() === filterStatus.trim().toLowerCase());
    }

    // Filter E: Filter by Card Issued
    if (filterCard && filterCard.trim()) {
      records = records.filter(r => r.card_issued.trim().toLowerCase() === filterCard.trim().toLowerCase());
    }

    return records;
  }, [students, transactions, search, filterClass, filterMonth, filterYear, filterStatus, filterCard, feeStructure]);

  const openEdit = (record) => {
    const classDefaultFee = (feeStructure.find(f => f.class === record.class)?.fee) || 300;
    setEditForm({
      id: record.id,
      student_id: record.student_id,
      student_name: record.student_name,
      roll_number: record.roll_number,
      class: record.class,
      month: record.month || `${filterMonth} ${filterYear}`,
      amount: record.amount || classDefaultFee,
      status: record.status || 'Paid',
      payment_method: record.payment_method || 'Cash',
      card_issued: record.card_issued || 'No',
      date: record.date || new Date().toISOString().split('T')[0],
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        student_name: editForm.student_name,
        roll_number: editForm.roll_number,
        class: editForm.class,
        month: editForm.month,
        amount: Number(editForm.amount),
        payment_method: editForm.payment_method,
        status: editForm.status,
        card_issued: editForm.card_issued,
        paid_date: editForm.date,
      };

      if (supabase.from) {
        if (editForm.id && !editForm.id.startsWith('temp-')) {
          await supabase.from('fee_payments').update(payload).eq('id', editForm.id);
        } else {
          await supabase.from('fee_payments').insert([payload]);
        }
        await fetchData();
      }

      setSuccessMsg(`Fee record for ${editForm.student_name} saved successfully!`);
      setTimeout(() => {
        setEditModalOpen(false);
        setSuccessMsg('');
      }, 1200);

    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderCardBadge = (status) => {
    if (status === 'Yes') return <span className="badge badge-green">💳 Yes</span>;
    if (status === 'Old Card') return <span className="badge badge-purple">📇 Old Card</span>;
    return <span className="badge badge-gray">No</span>;
  };

  // Stats calculation
  const totalCollected = displayedRecords.filter(r => r.status === 'Paid').reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalPending = displayedRecords.filter(r => r.status !== 'Paid').reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const paidCount = displayedRecords.filter(r => r.status === 'Paid').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Fee Management</h1>
          <p>View student fee records by Month & Year, filter by card status, and update payment records directly</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>PKR {totalCollected.toLocaleString()}</h3>
            <p>Collected ({filterMonth} {filterYear})</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h3>PKR {totalPending.toLocaleString()}</h3>
            <p>Pending / Due ({filterMonth} {filterYear})</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <h3>{paidCount} / {displayedRecords.length}</h3>
            <p>Students Paid ({filterMonth} {filterYear})</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Fee Records & Editing</button>
        <button className={`tab ${tab === 'defaulters' ? 'active' : ''}`} onClick={() => setTab('defaulters')}>Pending Dues ({displayedRecords.filter(r => r.status !== 'Paid').length})</button>
        <button className={`tab ${tab === 'structure' ? 'active' : ''}`} onClick={() => setTab('structure')}>Fee Structure</button>
      </div>

      {tab === 'records' && (
        <div>
          {/* Filters Bar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Search student by name or roll no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select className="form-select" style={{ flex: '0 0 160px' }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>

              <select className="form-select" style={{ flex: '0 0 130px' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select className="form-select" style={{ flex: '0 0 100px' }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <select className="form-select" style={{ flex: '0 0 130px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Defaulter">Defaulter</option>
              </select>

              <select className="form-select" style={{ flex: '0 0 140px' }} value={filterCard} onChange={e => setFilterCard(e.target.value)}>
                <option value="">Card: All</option>
                <option value="Yes">💳 Yes</option>
                <option value="No">No</option>
                <option value="Old Card">📇 Old Card</option>
              </select>
            </div>
          </div>

          {/* Student Fee Records Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Month & Year</th>
                  <th>Amount (PKR)</th>
                  <th>Payment Method</th>
                  <th>Card Issued</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Loading fee records...</td></tr>
                ) : displayedRecords.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No student fee records found matching criteria</td></tr>
                ) : displayedRecords.map(r => (
                  <tr key={r.id || r.student_name}>
                    <td className="font-semibold text-muted">{r.roll_number}</td>
                    <td className="font-semibold">{r.student_name}</td>
                    <td><span className="badge badge-blue">{r.class}</span></td>
                    <td className="font-semibold">{r.month}</td>
                    <td className="font-semibold" style={{ color: r.status === 'Paid' ? 'var(--accent-400)' : 'var(--danger-400)' }}>
                      PKR {Number(r.amount).toLocaleString()}
                    </td>
                    <td>{r.payment_method}</td>
                    <td>{renderCardBadge(r.card_issued)}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'Paid' ? 'badge-green' : r.status === 'Pending' ? 'badge-yellow' : 'badge-red'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                        <Edit2 size={13} /> Edit Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Fee Month & Year</th>
                <th>Amount Due (PKR)</th>
                <th>Card Issued</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.filter(r => r.status !== 'Paid').map(d => (
                <tr key={d.id || d.student_name}>
                  <td className="font-semibold">{d.student_name}</td>
                  <td><span className="badge badge-blue">{d.class}</span></td>
                  <td><span className="badge badge-yellow">{d.month}</span></td>
                  <td className="font-semibold" style={{ color: 'var(--danger-400)' }}>PKR {Number(d.amount).toLocaleString()}</td>
                  <td>{renderCardBadge(d.card_issued)}</td>
                  <td><span className={`badge ${d.status === 'Pending' ? 'badge-yellow' : 'badge-red'}`}>{d.status}</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openEdit(d)}>
                      <Edit2 size={13} /> Edit / Collect Fee
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'structure' && (
        <div className="table-container" style={{ maxWidth: 600 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Monthly Tuition Fee (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {feeStructure.map((f, i) => (
                <tr key={f.class}>
                  <td className="font-semibold">{f.class}</td>
                  <td>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 140 }}
                      value={f.fee}
                      onChange={e => {
                        const val = e.target.value;
                        setFeeStructure(arr => arr.map((item, idx) => idx === i ? { ...item, fee: Number(val) } : item));
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Edit Student Fee Record */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Edit Student Fee Record</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {successMsg && (
                  <div className="card" style={{ marginBottom: 16, background: 'rgba(16,185,129,0.1)', borderColor: 'var(--accent-500)', padding: '10px 14px' }}>
                    <p style={{ color: 'var(--accent-400)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} />
                      {successMsg}
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input className="form-input" value={editForm.student_name} onChange={e => setEditForm({ ...editForm, student_name: e.target.value })} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select className="form-select" value={editForm.class} onChange={e => setEditForm({ ...editForm, class: e.target.value })}>
                      {CLASSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fee Month & Year</label>
                    <input className="form-input" value={editForm.month} onChange={e => setEditForm({ ...editForm, month: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fee Amount (PKR)</label>
                    <input type="number" className="form-input" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="Paid">✅ Paid</option>
                      <option value="Pending">⏳ Pending</option>
                      <option value="Overdue">⚠️ Overdue</option>
                      <option value="Defaulter">🚨 Defaulter</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={editForm.payment_method} onChange={e => setEditForm({ ...editForm, payment_method: e.target.value })}>
                      <option value="Cash">Cash</option>
                      <option value="Online Bank Transfer">Online Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Issued</label>
                    <select className="form-select" value={editForm.card_issued || 'No'} onChange={e => setEditForm({ ...editForm, card_issued: e.target.value })}>
                      <option value="No">No</option>
                      <option value="Yes">💳 Yes</option>
                      <option value="Old Card">📇 Old Card</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} required />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

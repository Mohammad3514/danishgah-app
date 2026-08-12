import React, { useState } from 'react';
import { DollarSign, Printer, Search, Plus, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

const CLASSES = ['Muntazir (3-4)', 'Muntaqim (5)', 'Zaman (6)', 'Qaim (7-8)', 'Hujjat (9-10)', 'Senior Class'];

const initFeeStructure = [
  { class: 'Muntazir (3-4)', fee: 2500 },
  { class: 'Muntaqim (5)', fee: 3000 },
  { class: 'Zaman (6)', fee: 3000 },
  { class: 'Qaim (7-8)', fee: 3500 },
  { class: 'Hujjat (9-10)', fee: 4000 },
  { class: 'Senior Class', fee: 4500 },
];

const initTransactions = [
  { id: 'REC-1001', student: 'Ahmed Ali Khan', rollNo: '001', class: 'Muntaqim (5)', month: 'August 2025', amount: 3000, date: '2025-08-05', method: 'Cash', status: 'Paid' },
  { id: 'REC-1002', student: 'Usman Tariq', rollNo: '003', class: 'Muntazir (3-4)', month: 'August 2025', amount: 2500, date: '2025-08-06', method: 'Online Bank', status: 'Paid' },
  { id: 'REC-1003', student: 'Ayesha Siddiqui', rollNo: '004', class: 'Hujjat (9-10)', month: 'August 2025', amount: 4000, date: '2025-08-08', method: 'Cash', status: 'Paid' },
  { id: 'REC-1004', student: 'Bilal Hassan', rollNo: '005', class: 'Muntazir (3-4)', month: 'August 2025', amount: 2500, date: '2025-08-09', method: 'Cheque', status: 'Paid' },
];

const initDefaulters = [
  { id: 2, name: 'Fatima Noor', class: 'Qaim (7-8)', phone: '0321-2345678', month: 'August 2025', amount: 3500, status: 'Overdue' },
  { id: 6, name: 'Zainab Khalid', class: 'Zaman (6)', phone: '0322-6789012', month: 'July & August 2025', amount: 6000, status: 'Overdue' },
  { id: 9, name: 'Ali Raza', class: 'Hujjat (9-10)', phone: '0355-9012345', month: 'August 2025', amount: 4000, status: 'Overdue' },
  { id: 11, name: 'Omar Sheikh', class: 'Muntaqim (5)', phone: '0377-1234560', month: 'June, July, Aug 2025', amount: 9000, status: 'Defaulter' },
  { id: 15, name: 'Fahad Ansari', class: 'Hujjat (9-10)', phone: '0312-5678234', month: 'August 2025', amount: 4000, status: 'Overdue' },
];

export default function Fees() {
  const [tab, setTab] = useState('collect');
  const [transactions, setTransactions] = useState(initTransactions);
  const [feeStructure, setFeeStructure] = useState(initFeeStructure);
  
  // Payment Collect Form
  const [studentName, setStudentName] = useState('Fatima Noor');
  const [studentClass, setStudentClass] = useState('Qaim (7-8)');
  const [month, setMonth] = useState('August 2025');
  const [amount, setAmount] = useState(3500);
  const [method, setMethod] = useState('Cash');
  const [receipt, setReceipt] = useState(null);

  const handleCollectFee = (e) => {
    e.preventDefault();
    const newRec = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      student: studentName,
      rollNo: '002',
      class: studentClass,
      month: month,
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      method: method,
      status: 'Paid'
    };
    setTransactions([newRec, ...transactions]);
    setReceipt(newRec);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Fee Management</h1>
          <p>Collect fees, view transaction records, track defaulters & fee structure</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><DollarSign size={22} /></div>
          <div className="stat-info">
            <h3>PKR 485,000</h3>
            <p>Collected This Month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h3>PKR 92,000</h3>
            <p>Pending Dues</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <h3>189 / 247</h3>
            <p>Students Paid</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'collect' ? 'active' : ''}`} onClick={() => setTab('collect')}>Collect Fee</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Payment History</button>
        <button className={`tab ${tab === 'defaulters' ? 'active' : ''}`} onClick={() => setTab('defaulters')}>Pending Dues ({initDefaulters.length})</button>
        <button className={`tab ${tab === 'structure' ? 'active' : ''}`} onClick={() => setTab('structure')}>Fee Structure</button>
      </div>

      {tab === 'collect' && (
        <div className="dashboard-grid">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Record Fee Payment</h3>
            <form onSubmit={handleCollectFee}>
              <div className="form-group">
                <label className="form-label">Student Name</label>
                <input className="form-input" value={studentName} onChange={e => setStudentName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={studentClass} onChange={e => setStudentClass(e.target.value)}>
                    {CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fee Month</label>
                  <input className="form-input" value={month} onChange={e => setMonth(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (PKR)</label>
                  <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                    <option>Cash</option>
                    <option>Online Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full mt-2">Generate Receipt & Record Payment</button>
            </form>
          </div>

          <div>
            {receipt ? (
              <div className="card" id="printable-receipt" style={{ background: '#fff', color: '#000', borderRadius: 12, padding: 24 }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: 12, marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.4rem', color: '#1e1b4b', margin: 0 }}>DANISHGAH INSTITUTE</h2>
                  <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Official Fee Payment Receipt</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 12 }}>
                  <span><strong>Receipt #:</strong> {receipt.id}</span>
                  <span><strong>Date:</strong> {receipt.date}</span>
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.8', marginBottom: 16 }}>
                  <div><strong>Student Name:</strong> {receipt.student}</div>
                  <div><strong>Class:</strong> {receipt.class}</div>
                  <div><strong>For Month:</strong> {receipt.month}</div>
                  <div><strong>Payment Method:</strong> {receipt.method}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 16, border: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TOTAL AMOUNT RECEIVED</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669' }}>PKR {receipt.amount.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={handlePrint}><Printer size={14} /> Print Fee Receipt</button>
                </div>
              </div>
            ) : (
              <div className="card empty-state" style={{ height: '100%', justifyContent: 'center' }}>
                <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h4>Fee Receipt Preview</h4>
                <p>Fill out the payment form to generate a printable receipt.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Month</th>
                <th>Amount (PKR)</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold text-muted">{t.id}</td>
                  <td className="font-semibold">{t.student}</td>
                  <td><span className="badge badge-blue">{t.class}</span></td>
                  <td>{t.month}</td>
                  <td className="font-semibold" style={{ color: 'var(--accent-400)' }}>PKR {t.amount.toLocaleString()}</td>
                  <td>{t.method}</td>
                  <td className="text-sm text-muted">{t.date}</td>
                  <td><span className="badge badge-green">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Guardian Phone</th>
                <th>Pending Months</th>
                <th>Amount Due</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {initDefaulters.map(d => (
                <tr key={d.id}>
                  <td className="font-semibold">{d.name}</td>
                  <td><span className="badge badge-blue">{d.class}</span></td>
                  <td>{d.phone}</td>
                  <td><span className="badge badge-yellow">{d.month}</span></td>
                  <td className="font-semibold" style={{ color: 'var(--danger-400)' }}>PKR {d.amount.toLocaleString()}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setStudentName(d.name);
                      setStudentClass(d.class);
                      setAmount(d.amount);
                      setTab('collect');
                    }}>Collect Fee</button>
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
    </div>
  );
}

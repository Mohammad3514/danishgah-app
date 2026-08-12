import React, { useState } from 'react';
import { TrendingDown, Plus, Filter, Download, FileText } from 'lucide-react';

const initExpenses = [
  { id: 1, date: '2025-08-01', category: 'Salaries', description: 'Faculty Salary for July 2025', amount: 180000, paidBy: 'Admin', method: 'Bank Transfer' },
  { id: 2, date: '2025-08-03', category: 'Utilities', description: 'Electricity Bill (LESCO)', amount: 35000, paidBy: 'Accountant', method: 'Online' },
  { id: 3, date: '2025-08-04', category: 'Supplies', description: 'Stationery & Printing Paper', amount: 12000, paidBy: 'Admin', method: 'Cash' },
  { id: 4, date: '2025-08-06', category: 'Maintenance', description: 'Generator Repair & Diesel', amount: 15000, paidBy: 'Accountant', method: 'Cash' },
  { id: 5, date: '2025-08-08', category: 'Utilities', description: 'Internet Fiber Bill (PTCL)', amount: 8000, paidBy: 'Accountant', method: 'Online' },
  { id: 6, date: '2025-08-10', category: 'Events', description: 'Independence Day Prep Refreshments', amount: 14000, paidBy: 'Admin', method: 'Cash' },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState(initExpenses);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Utilities',
    description: '',
    amount: '',
    paidBy: 'Accountant',
    method: 'Cash'
  });

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setExpenses([{ ...form, id: Date.now(), amount: Number(form.amount) }, ...expenses]);
    setModalOpen(false);
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Utilities', description: '', amount: '', paidBy: 'Accountant', method: 'Cash' });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Expense Tracker</h1>
          <p>Track all institute operating expenses and overheads</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Log New Expense</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div className="stat-info">
            <h3>PKR {totalExpense.toLocaleString()}</h3>
            <p>Total Expenses (August)</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount (PKR)</th>
              <th>Paid By</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="text-sm text-muted">{e.date}</td>
                <td><span className="badge badge-purple">{e.category}</span></td>
                <td className="font-semibold">{e.description}</td>
                <td className="font-bold" style={{ color: 'var(--danger-400)' }}>PKR {e.amount.toLocaleString()}</td>
                <td className="text-sm">{e.paidBy}</td>
                <td className="text-sm text-muted">{e.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={evt => evt.target === evt.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Log New Expense</h3>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['Salaries', 'Utilities', 'Supplies', 'Maintenance', 'Transport', 'Events', 'Miscellaneous'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="e.g. LESCO Electricity Bill" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (PKR)</label>
                    <input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                      <option>Cash</option>
                      <option>Online</option>
                      <option>Bank Transfer</option>
                      <option>Cheque</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Gift, Plus, DollarSign } from 'lucide-react';

const initEvents = [
  { id: 1, name: 'Annual Sports Day 2025', date: '2025-09-15', budget: 150000, spent: 45000, status: 'Planned' },
  { id: 2, name: 'Eid Milad-un-Nabi Event', date: '2025-09-28', budget: 80000, spent: 20000, status: 'Planned' },
  { id: 3, name: 'Science Exhibition 2025', date: '2025-10-05', budget: 60000, spent: 60000, status: 'Completed' },
];

export default function Events() {
  const [events, setEvents] = useState(initEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('2025-09-20');
  const [budget, setBudget] = useState(50000);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;
    setEvents([...events, { id: Date.now(), name, date, budget: Number(budget), spent: 0, status: 'Planned' }]);
    setModalOpen(false);
    setName('');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Events & Budget Tracker</h1>
          <p>Plan special events and monitor allocated budgets vs actual expenditure</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Create Event</button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Date</th>
              <th>Allocated Budget</th>
              <th>Actual Spent</th>
              <th>Remaining</th>
              <th>Budget Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => {
              const pct = Math.min(100, Math.round((ev.spent / ev.budget) * 100));
              const remaining = ev.budget - ev.spent;
              return (
                <tr key={ev.id}>
                  <td className="font-semibold">{ev.name}</td>
                  <td className="text-sm text-muted">{ev.date}</td>
                  <td className="font-semibold">PKR {ev.budget.toLocaleString()}</td>
                  <td className="font-semibold" style={{ color: 'var(--danger-400)' }}>PKR {ev.spent.toLocaleString()}</td>
                  <td className="font-semibold" style={{ color: 'var(--accent-400)' }}>PKR {remaining.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 80 }}>
                        <div className={`progress-bar ${pct > 90 ? 'red' : pct > 60 ? 'yellow' : 'green'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs">{pct}%</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{ev.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Create Event & Set Budget</h3>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Name</label>
                  <input className="form-input" placeholder="e.g. Annual Prize Distribution" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Date</label>
                    <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Allocated Budget (PKR)</label>
                    <input type="number" className="form-input" value={budget} onChange={e => setBudget(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Sparkles, Loader2, AlertCircle, Calendar } from 'lucide-react';

export default function Dashboard({ refreshTrigger, currentData }) {
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/expenses/');
      setExpenses(res.data);
      if (res.data.length > 0) {
        const dates = res.data.map(e => e.date.split('T')[0]).sort();
        setStartDate(dates[0]);
        setEndDate(dates[dates.length - 1]);
      }
    } catch (err) {
      setError('Failed to fetch expenses from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await axios.post('http://localhost:8000/summary', currentData);
      setInsights(res.data.summary);
    } catch (err) {
      setError('Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  const filteredExpenses = expenses.filter(e => {
    const d = e.date.split('T')[0];
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  // Process data for charts
  const categoryDataMap = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.total;
    return acc;
  }, {});
  const categoryData = Object.keys(categoryDataMap).map(k => ({ name: k, total: categoryDataMap[k] }));

  const timelineDataMap = filteredExpenses.reduce((acc, curr) => {
    const date = curr.date.split('T')[0];
    acc[date] = (acc[date] || 0) + curr.total;
    return acc;
  }, {});
  const timelineData = Object.keys(timelineDataMap).sort().map(k => ({ date: k, total: timelineDataMap[k] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
      <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', padding: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: insights ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#a855f7" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#c084fc' }}>AI Financial Insights</h3>
          </div>
          <button className="primary" onClick={generateInsights} disabled={loadingInsights} style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none' }}>
            {loadingInsights ? <Loader2 className="animate-spin" size={16} /> : 'Generate Insights'}
          </button>
        </div>
        
        {insights && (
          <div className="animate-fade-in" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {insights}
          </div>
        )}

        {error && (
          <div className="animate-fade-in" style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: 'var(--danger-color, #ef4444)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
      </div>

      {expenses.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <AlertCircle size={48} style={{ marginBottom: '16px' }} />
          <p>No expenses recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Date Filters */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Filter by Date
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* All Expenses Table */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>All Expenses</h3>
            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1px', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Date</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Merchant</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Total</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((row, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 12px', fontSize: '0.95rem' }}>{row.date.split('T')[0]}</td>
                      <td style={{ padding: '8px 12px', fontSize: '0.95rem' }}>{row.merchant}</td>
                      <td style={{ padding: '8px 12px', fontSize: '0.95rem' }}>${row.total.toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', fontSize: '0.95rem' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
                          {row.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
              Showing {filteredExpenses.length} expense(s)
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Spending by Category</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text-primary)'}} />
                    <Bar dataKey="total" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Spending Timeline</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip contentStyle={{background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text-primary)'}} />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

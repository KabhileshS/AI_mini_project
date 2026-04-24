import React, { useState } from 'react';
import axios from 'axios';
import { Save, X, Loader2 } from 'lucide-react';

export default function DataTable({ data, onSave, onCancel }) {
  const [rows, setRows] = useState(data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    let savedCount = 0;
    
    try {
      for (const row of rows) {
        await axios.post('http://localhost:8000/expenses/', {
          date: row.date || new Date().toISOString().split('T')[0],
          merchant: row.merchant || '',
          total: parseFloat(row.total || 0),
          category: row.category || ''
        });
        savedCount++;
      }
      onSave();
    } catch (err) {
      setError(`Saved ${savedCount} expenses but failed on the rest. Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Date</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Merchant</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Total</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.9rem' }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <input type="date" value={row.date || ''} onChange={e => handleChange(idx, 'date', e.target.value)} style={{ background: 'transparent', border: '1px solid transparent' }} />
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <input type="text" value={row.merchant || ''} onChange={e => handleChange(idx, 'merchant', e.target.value)} style={{ background: 'transparent', border: '1px solid transparent' }} />
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <input type="number" step="0.01" value={row.total || 0} onChange={e => handleChange(idx, 'total', e.target.value)} style={{ background: 'transparent', border: '1px solid transparent' }} />
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <input type="text" value={row.category || ''} onChange={e => handleChange(idx, 'category', e.target.value)} style={{ background: 'transparent', border: '1px solid transparent' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {error && <p style={{ color: 'var(--danger-color)', marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</p>}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <button className="secondary" onClick={onCancel} disabled={saving}>
          <X size={16} /> Cancel
        </button>
        <button className="primary" onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
          {saving ? 'Saving...' : `Save ${rows.length} Items`}
        </button>
      </div>
    </div>
  );
}

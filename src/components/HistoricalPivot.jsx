import React, { useState } from 'react';
import { HISTORICAL_DATA } from '../data/historicalData';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags'];

export default function HistoricalPivot({ viewMode }) {
  // viewMode is 'Semua', 'Iqbal', or 'Zela'
  const dataKey = viewMode === 'Semua' ? 'ALL' : viewMode.toUpperCase();
  const data = HISTORICAL_DATA[dataKey];

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const [showBalance, setShowBalance] = useState(true);

  const renderTable = (title, tableData, theme) => {
    if (!tableData) return null;
    
    // Calculate Grand Totals per month
    const grandTotals = {};
    MONTHS.forEach(m => grandTotals[m] = 0);
    
    tableData.forEach(row => {
      MONTHS.forEach(m => {
        if (row[m]) grandTotals[m] += row[m];
      });
    });

    const colors = theme === 'out' 
      ? { header: '#C62828', headerBorder: '#ffffff', rowEven: '#FFEBEE', rowOdd: '#FFCDD2', cellBorder: '#ffffff', footer: '#B71C1C' }
      : { header: '#2E7D32', headerBorder: '#ffffff', rowEven: '#E8F5E9', rowOdd: '#C8E6C9', cellBorder: '#ffffff', footer: '#1B5E20' };

    return (
      <div className="card" style={{ marginTop: '2rem', padding: '1rem', overflowX: 'auto', border: '2px dashed var(--border-color)' }}>
        <h3 className="text-h3" style={{ marginBottom: '1rem', color: colors.header }}>{title} (Jan - Agt 2026)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.4rem 0.5rem', background: colors.header, color: 'white', textAlign: 'center', border: `1px solid ${colors.headerBorder}`, position: 'sticky', left: 0, zIndex: 2, minWidth: '120px', boxShadow: `inset -1px 0 0 ${colors.headerBorder}` }}>Kategori</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ padding: '0.4rem 0.5rem', background: colors.header, color: 'white', border: `1px solid ${colors.headerBorder}`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {m} 2026
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={row.category} style={{ background: i % 2 === 0 ? colors.rowEven : colors.rowOdd }}>
                  <td style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.cellBorder}`, textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? colors.rowEven : colors.rowOdd, boxShadow: `inset -1px 0 0 ${colors.cellBorder}` }}>{row.category}</td>
                  {MONTHS.map(m => (
                    <td key={m} style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.cellBorder}`, whiteSpace: 'nowrap' }}>
                      {showBalance ? formatNumber(row[m]) : '***.***'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: colors.footer, color: 'white', fontWeight: 700 }}>
                <td style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.headerBorder}`, textAlign: 'left', position: 'sticky', left: 0, zIndex: 1, background: colors.footer, boxShadow: `inset -1px 0 0 ${colors.headerBorder}` }}>Total</td>
                {MONTHS.map(m => (
                  <td key={m} style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.headerBorder}`, whiteSpace: 'nowrap' }}>
                    {showBalance ? formatNumber(grandTotals[m]) : '***.***'}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  if (!data) return null;

  return (
    <>
      {renderTable(`Rekap Pengeluaran per Kategori`, data.OUT, 'out')}
      {renderTable(`Rekap Pemasukan per Kategori`, data.IN, 'in')}
    </>
  );
}

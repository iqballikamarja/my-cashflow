import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Landmark, Users, Calendar, X, Eye, EyeOff } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { HISTORICAL_DATA } from '../data/historicalData';
import { API_URL } from '../config';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

const BUDGET_LIMITS = {
  Jajan: 1500000,
  Kitchen: 2000000,
  Mio: 500000,
  Sedekah: 500000,
};

const JOINT_GOAL = {
  title: 'Dana Darurat & Liburan',
  target: 20000000,
};


export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    Iqbal: { totalIn: 0, totalOut: 0, balance: 0 },
    Zela: { totalIn: 0, totalOut: 0, balance: 0 },
    grandTotal: 0
  });
  const [allTx, setAllTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const viewModeParam = searchParams.get('view') || 'all';
  const viewMode = viewModeParam === 'all' ? 'Semua' : viewModeParam.charAt(0).toUpperCase() + viewModeParam.slice(1);

  const now = new Date();
  const [periodText, setPeriodText] = useState(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
  const [queryObj, setQueryObj] = useState({ startMonth: now.getMonth() + 1, endMonth: now.getMonth() + 1, year: now.getFullYear() });
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [tempStartMonth, setTempStartMonth] = useState(1);
  const [tempEndMonth, setTempEndMonth] = useState(now.getMonth() + 1);
  const [tempYear, setTempYear] = useState(now.getFullYear());

  const [activeOutCats, setActiveOutCats] = useState([]);
  const [activeInCats, setActiveInCats] = useState([]);
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    let url = `${API_URL}/api/transactions/stats`;
    let txUrl = `${API_URL}/api/transactions`;
    
    if (queryObj.startMonth && queryObj.endMonth && queryObj.year) {
      const fromStr = `${queryObj.year}-${String(queryObj.startMonth).padStart(2, `0`)}-01`;
      const endMonthPadding = String(queryObj.endMonth).padStart(2, '0');
      // simple logic: to the end of the month by getting day 0 of next month
      const toDate = new Date(queryObj.year, queryObj.endMonth, 0); 
      const toStr = `${queryObj.year}-${endMonthPadding}-${String(toDate.getDate()).padStart(2, '0')}`;
      url += `?from=${fromStr}&to=${toStr}`;
      txUrl += `?from=${fromStr}&to=${toStr}`;
    }

    Promise.all([
      fetch(url, { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(txUrl, { headers: { 'Authorization': 'Bearer ' + token } })
    ])
      .then(async ([resStats, resTx]) => {
        const statsData = await resStats.json();
        const txData = await resTx.json();
        if (statsData.Iqbal) setStats(statsData);
        if (Array.isArray(txData)) setAllTx(txData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [queryObj, location.search]);

  const handleThisMonth = () => {
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    setQueryObj({ month: m, year: y });
    setPeriodText(`${MONTHS[m - 1]} ${y}`);
  };

  const handleAllTime = () => {
    setQueryObj({});
    setPeriodText('Semua Waktu');
  };

  const applyCustomPeriod = (e) => {
    e.preventDefault();
    if (tempStartMonth > tempEndMonth) {
      alert('Bulan awal harus sebelum atau sama dengan bulan akhir.');
      return;
    }
    setQueryObj({ startMonth: tempStartMonth, endMonth: tempEndMonth, year: tempYear });
    if (tempStartMonth === tempEndMonth) {
      setPeriodText(`${MONTHS[tempStartMonth - 1]} ${tempYear}`);
    } else {
      setPeriodText(`${MONTHS[tempStartMonth - 1]} - ${MONTHS[tempEndMonth - 1]} ${tempYear}`);
    }
    setShowPeriodModal(false);
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num || 0);

  const HIST_MONTH_MAP = { Jan: '2026-01', Feb: '2026-02', Mar: '2026-03', Apr: '2026-04', Mei: '2026-05', Jun: '2026-06', Jul: '2026-07', Ags: '2026-08' };
  const histDataKey = viewMode === 'Semua' ? 'ALL' : viewMode.toUpperCase();
  const histData = HISTORICAL_DATA[histDataKey];

  const isHistMatch = (ym) => {
    if (Object.keys(queryObj).length === 0) return true; // Semua waktu
    const [y, m] = ym.split('-');
    if (parseInt(y) !== queryObj.year) return false;
    const monthNum = parseInt(m);
    if (monthNum < queryObj.startMonth || monthNum > queryObj.endMonth) return false;
    return true;
  };

  const getFilteredStats = () => {
    let histIn = 0;
    let histOut = 0;
    
    if (histData) {
      if (histData.IN) {
        histData.IN.forEach(row => {
          Object.entries(HIST_MONTH_MAP).forEach(([mName, ym]) => {
            if (row[mName] && isHistMatch(ym)) histIn += row[mName];
          });
        });
      }
      if (histData.OUT) {
        histData.OUT.forEach(row => {
          Object.entries(HIST_MONTH_MAP).forEach(([mName, ym]) => {
            if (row[mName] && isHistMatch(ym)) histOut += row[mName];
          });
        });
      }
    }

    if (viewMode === 'Iqbal') {
      return {
        totalIn: (stats.Iqbal?.totalIn || 0) + histIn,
        totalOut: (stats.Iqbal?.totalOut || 0) + histOut,
        balance: (stats.Iqbal?.balance || 0) + (histIn - histOut)
      };
    } else if (viewMode === 'Zela') {
      return {
        totalIn: (stats.Zela?.totalIn || 0) + histIn,
        totalOut: (stats.Zela?.totalOut || 0) + histOut,
        balance: (stats.Zela?.balance || 0) + (histIn - histOut)
      };
    } else {
      return {
        totalIn: (stats.Iqbal?.totalIn || 0) + (stats.Zela?.totalIn || 0) + histIn,
        totalOut: (stats.Iqbal?.totalOut || 0) + (stats.Zela?.totalOut || 0) + histOut,
        balance: (stats.grandTotal || 0) + (histIn - histOut)
      };
    }
  };

  const getPivotData = (type) => {
    const pivot = {};
    const monthsSet = new Set();
    const grandTotals = {};

    // 1. Inject hardcoded Jan-Aug data (filtered)
    const histRows = histData ? (type === 'OUT' ? histData.OUT : histData.IN) : [];
    if (histRows) {
      histRows.forEach(row => {
        Object.entries(HIST_MONTH_MAP).forEach(([key, ym]) => {
          if (row[key] != null && isHistMatch(ym)) {
            monthsSet.add(ym);
            let catName = row.category;
            if (catName.toLowerCase() === 'tiktok') catName = 'TikTok';
            
            if (!pivot[catName]) pivot[catName] = {};
            if (!pivot[catName][ym]) pivot[catName][ym] = 0;
            pivot[catName][ym] += row[key];
            if (!grandTotals[ym]) grandTotals[ym] = 0;
            grandTotals[ym] += row[key];
          }
        });
      });
    }

    // 2. Add real transaction data (Sep 2026+)
    let filteredTx = allTx.filter(t => t.type === type);
    if (viewMode !== 'Semua') {
      filteredTx = filteredTx.filter(t => t.user.toLowerCase() === viewMode.toLowerCase());
    }

    filteredTx.forEach(t => {
      const ym = t.date.substring(0, 7);
      monthsSet.add(ym);
      
      let catName = t.category;
      if (catName && catName.toLowerCase() === 'tiktok') catName = 'TikTok';

      if (!pivot[catName]) pivot[catName] = {};
      if (!pivot[catName][ym]) pivot[catName][ym] = 0;
      pivot[catName][ym] += t.amount;
      
      if (!grandTotals[ym]) grandTotals[ym] = 0;
      grandTotals[ym] += t.amount;
    });

    const months = [...monthsSet].sort();
    return { pivot, months, grandTotals };
  };

  const currentStats = getFilteredStats();
  const outPivot = getPivotData('OUT');
  const inPivot = getPivotData('IN');
  const sortedOutCategories = Object.keys(outPivot.pivot).sort();
  const sortedInCategories = Object.keys(inPivot.pivot).sort();

  useEffect(() => {
    if (outPivot && sortedOutCategories.length > 0) {
      if (activeOutCats.length === 0) {
        const outSums = sortedOutCategories.map(cat => ({ 
          cat, 
          total: outPivot.months.reduce((sum, m) => sum + (outPivot.pivot[cat][m] || 0), 0) 
        })).sort((a, b) => b.total - a.total);
        setActiveOutCats(outSums.slice(0, 5).map(i => i.cat));
      }
    }
    if (inPivot && sortedInCategories.length > 0) {
      if (activeInCats.length === 0) {
        const inSums = sortedInCategories.map(cat => ({ 
          cat, 
          total: inPivot.months.reduce((sum, m) => sum + (inPivot.pivot[cat][m] || 0), 0) 
        })).sort((a, b) => b.total - a.total);
        setActiveInCats(inSums.slice(0, 5).map(i => i.cat));
      }
    }
  }, [outPivot.months.length, inPivot.months.length]); // trigger when months count changes (new data)

  const toggleCat = (cat, activeList, setList) => {
    if (activeList.includes(cat)) {
      setList(activeList.filter(c => c !== cat));
    } else {
      setList([...activeList, cat]);
    }
  };

  const getAggregatedTrend = (pivotObj, activeCats) => {
    const isYearly = pivotObj.months.length > 12;
    let labels = [];
    let datasets = [];

    if (isYearly) {
      const years = [...new Set(pivotObj.months.map(m => m.split('-')[0]))].sort();
      labels = years;
      datasets = activeCats.map((cat, i) => {
        const data = years.map(yr => {
          return pivotObj.months.filter(m => m.startsWith(yr)).reduce((sum, m) => sum + (pivotObj.pivot[cat] ? pivotObj.pivot[cat][m] || 0 : 0), 0);
        });
        return {
          label: cat, data,
          borderColor: `hsl(${(i * 137.508) % 360}, 70%, 50%)`,
          backgroundColor: `hsl(${(i * 137.508) % 360}, 70%, 50%, 0.5)`,
          borderWidth: 2, tension: 0.2
        };
      });
    } else {
      labels = pivotObj.months.map(formatMonthLabel);
      datasets = activeCats.map((cat, i) => {
        const data = pivotObj.months.map(m => pivotObj.pivot[cat] ? pivotObj.pivot[cat][m] || 0 : 0);
        return {
          label: cat, data,
          borderColor: `hsl(${(i * 137.508) % 360}, 70%, 50%)`,
          backgroundColor: `hsl(${(i * 137.508) % 360}, 70%, 50%, 0.5)`,
          borderWidth: 2, tension: 0.2
        };
      });
    }
    return { labels, datasets };
  };


  const generateInsights = () => {
    if (loading || !currentStats) return [];
    const insights = [];
    
    // 1. Savings Rate
    if (currentStats.totalIn > 0) {
      const savingsRate = Math.round(((currentStats.totalIn - currentStats.totalOut) / currentStats.totalIn) * 100);
      if (savingsRate > 20) {
        insights.push(`💡 Cakep! Kalian berhasil nyimpen ${savingsRate}% dari total pemasukan periode ini.`);
      } else if (savingsRate > 0) {
        insights.push(`⚠️ Sisa uang periode ini cuma ${savingsRate}% dari pemasukan. Hati-hati ya!`);
      } else {
        insights.push(`🚨 Waduh, pengeluaran lebih gede dari pemasukan (Defisit). Rem dulu belanjanya!`);
      }
    }

    // 2. Largest Expense
    if (sortedOutCategories.length > 0) {
      const outSums = sortedOutCategories.map(cat => ({ 
        cat, 
        total: outPivot.months.reduce((sum, m) => sum + (outPivot.pivot[cat][m] || 0), 0) 
      })).sort((a, b) => b.total - a.total);
      
      if (outSums.length > 0 && outSums[0].total > 0) {
        insights.push(`🔥 Pengeluaran paling boncos lari ke kategori "${outSums[0].cat}" (${formatIDR(outSums[0].total)}).`);
      }
    }

    // 3. Budget Warnings (Only if viewing a specific month)
    if (Object.keys(queryObj).length > 0) {
      const outSums = sortedOutCategories.map(cat => ({ 
        cat, 
        total: outPivot.months.reduce((sum, m) => sum + (outPivot.pivot[cat][m] || 0), 0) 
      }));
      let hasWarning = false;
      outSums.forEach(({ cat, total }) => {
        if (BUDGET_LIMITS[cat]) {
          const pct = total / BUDGET_LIMITS[cat];
          if (pct >= 1 && !hasWarning) {
            insights.push(`🛑 Awas! Pengeluaran "${cat}" udah jebol dari budget bulanan (${formatIDR(BUDGET_LIMITS[cat])}).`);
            hasWarning = true;
          } else if (pct >= 0.8 && !hasWarning) {
            insights.push(`👀 Kategori "${cat}" udah nyentuh ${Math.round(pct*100)}% dari budget. Kurang-kurangin!`);
            hasWarning = true;
          }
        }
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (loading && Object.keys(queryObj).length === 0 && stats.grandTotal === 0 && !histData) return <div className="text-body">Loading...</div>;

  const renderPivotTable = (title, pivotData, categories, theme) => {
    const { pivot, months, grandTotals } = pivotData;
    const colors = theme === 'out' 
      ? { header: '#C62828', headerBorder: '#ffffff', rowEven: '#FFEBEE', rowOdd: '#FFCDD2', cellBorder: '#ffffff', footer: '#B71C1C' }
      : { header: '#2E7D32', headerBorder: '#ffffff', rowEven: '#E8F5E9', rowOdd: '#C8E6C9', cellBorder: '#ffffff', footer: '#1B5E20' };

    if (categories.length === 0) return null;

    return (
      <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <h3 className="text-h3" style={{ marginBottom: '1rem', color: colors.header }}>{title} {viewMode !== 'Semua' && `(${viewMode})`}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.4rem 0.5rem', background: colors.header, color: 'white', textAlign: 'center', border: `1px solid ${colors.headerBorder}`, position: 'sticky', left: 0, zIndex: 2, minWidth: '120px', boxShadow: `inset -1px 0 0 ${colors.headerBorder}` }}>Kategori</th>
                {months.map(m => (
                  <th key={m} style={{ padding: '0.4rem 0.5rem', background: colors.header, color: 'white', border: `1px solid ${colors.headerBorder}`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {formatMonthLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat} style={{ background: i % 2 === 0 ? colors.rowEven : colors.rowOdd }}>
                  <td style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.cellBorder}`, textAlign: 'left', fontWeight: 600, position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? colors.rowEven : colors.rowOdd, boxShadow: `inset -1px 0 0 ${colors.cellBorder}` }}>{cat}</td>
                  {months.map(m => (
                    <td key={m} style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.cellBorder}`, whiteSpace: 'nowrap' }}>
                      {pivot[cat][m] ? (showBalance ? formatNumber(pivot[cat][m]) : '***.***') : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: colors.footer, color: 'white', fontWeight: 700 }}>
                <td style={{ padding: '0.4rem 0.5rem', border: `1px solid ${colors.headerBorder}`, textAlign: 'left', position: 'sticky', left: 0, zIndex: 1, background: colors.footer, boxShadow: `inset -1px 0 0 ${colors.headerBorder}` }}>Total</td>
                {months.map(m => (
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

  return (
    <div>
      <div className="sticky-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 className="text-h1" style={{ margin: 0 }}>Overview {viewMode !== 'Semua' && `(${viewMode})`}</h1>
            <button 
              onClick={() => setShowBalance(!showBalance)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%' }}
              title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {showBalance ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="btn-group">
              <button onClick={handleAllTime} className={`btn-toggle ${Object.keys(queryObj).length === 0 ? 'active' : ''}`}>Semua</button>
              <button onClick={() => setShowPeriodModal(true)} className={`btn-toggle ${Object.keys(queryObj).length > 0 ? 'active' : ''}`}>
                <Calendar size={16} /> Pilih Periode
              </button>
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Menampilkan data: <strong>{periodText}</strong></p>
      </div>



      {viewMode === 'Semua' && (
        <div className="grid-cols-3">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="text-subtitle">Grand Total Balance</p>
                <h2 className="text-h2" style={{ marginTop: '0.5rem', marginBottom: 0 }}>{showBalance ? formatIDR(currentStats.balance) : 'Rp ***.***'}</h2>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                <Landmark size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="text-subtitle">Total Pemasukan</p>
                <h2 className="text-h2" style={{ marginTop: '0.5rem', marginBottom: 0 }}>{showBalance ? formatIDR(currentStats.totalIn) : 'Rp ***.***'}</h2>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--accent-success)' }}><TrendingUp size={24} /></div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="text-subtitle">Total Pengeluaran</p>
                <h2 className="text-h2" style={{ marginTop: '0.5rem', marginBottom: 0 }}>{showBalance ? formatIDR(currentStats.totalOut) : 'Rp ***.***'}</h2>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--accent-danger)' }}><TrendingDown size={24} /></div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
        
        {/* KELOMPOK PENGELUARAN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(queryObj).length > 0 && (
            renderPivotTable('📊 Rincian Detail Pengeluaran (Angka Pasti)', outPivot, sortedOutCategories, 'out')
          )}
          {outPivot.months.length > 1 ? (
            <div className="card" style={{ padding: '1rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '1rem', color: '#C62828' }}>📉 Visualisasi Tren Pengeluaran {viewMode !== 'Semua' && `(${viewMode})`}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {sortedOutCategories.map(cat => {
                  const isActive = activeOutCats.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCat(cat, activeOutCats, setActiveOutCats)}
                      style={{
                        padding: '0.25rem 0.75rem', borderRadius: '16px',
                        border: `1px solid ${isActive ? '#C62828' : 'var(--border-color)'}`,
                        background: isActive ? '#C62828' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.75rem', cursor: 'pointer'
                      }}>
                      {cat}
                    </button>
                  )
                })}
              </div>
              <div style={{ height: '350px' }}>
                <Line 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} 
                  data={getAggregatedTrend(outPivot, activeOutCats)} 
                />
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '1rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '1rem', color: '#C62828' }}>📉 Total Pengeluaran per Kategori {viewMode !== 'Semua' && `(${viewMode})`}</h3>
              <div style={{ height: '400px' }}>
                <Bar 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                  data={{
                    labels: sortedOutCategories,
                    datasets: [{
                      label: 'Total Pengeluaran',
                      data: sortedOutCategories.map(cat => outPivot.months.reduce((sum, m) => sum + (outPivot.pivot[cat][m] || 0), 0)),
                      backgroundColor: sortedOutCategories.map((_, i) => `hsl(${(i * 137.508) % 360}, 70%, 50%, 0.7)`),
                    }]
                  }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* KELOMPOK PEMASUKAN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(queryObj).length > 0 && (
            renderPivotTable('📊 Rincian Detail Pemasukan (Angka Pasti)', inPivot, sortedInCategories, 'in')
          )}
          {inPivot.months.length > 1 ? (
            <div className="card" style={{ padding: '1rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '1rem', color: '#2E7D32' }}>📈 Visualisasi Tren Pemasukan {viewMode !== 'Semua' && `(${viewMode})`}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {sortedInCategories.map(cat => {
                  const isActive = activeInCats.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCat(cat, activeInCats, setActiveInCats)}
                      style={{
                        padding: '0.25rem 0.75rem', borderRadius: '16px',
                        border: `1px solid ${isActive ? '#2E7D32' : 'var(--border-color)'}`,
                        background: isActive ? '#2E7D32' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.75rem', cursor: 'pointer'
                      }}>
                      {cat}
                    </button>
                  )
                })}
              </div>
              <div style={{ height: '350px' }}>
                <Line 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} 
                  data={getAggregatedTrend(inPivot, activeInCats)} 
                />
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '1rem' }}>
              <h3 className="text-h3" style={{ marginBottom: '1rem', color: '#2E7D32' }}>📈 Total Pemasukan per Kategori {viewMode !== 'Semua' && `(${viewMode})`}</h3>
              <div style={{ height: '400px' }}>
                <Bar 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                  data={{
                    labels: sortedInCategories,
                    datasets: [{
                      label: 'Total Pemasukan',
                      data: sortedInCategories.map(cat => inPivot.months.reduce((sum, m) => sum + (inPivot.pivot[cat][m] || 0), 0)),
                      backgroundColor: sortedInCategories.map((_, i) => `hsl(${(i * 137.508) % 360}, 70%, 50%, 0.7)`),
                    }]
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>


      {showPeriodModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-h2" style={{ margin: 0 }}>Pilih Periode</h3>
              <button onClick={() => setShowPeriodModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={applyCustomPeriod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Bulan Awal</label>
                  <select className="form-input" value={tempStartMonth} onChange={e => setTempStartMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bulan Akhir</label>
                  <select className="form-input" value={tempEndMonth} onChange={e => setTempEndMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tahun</label>
                <input type="number" className="form-input" value={tempYear} onChange={e => setTempYear(parseInt(e.target.value))} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Terapkan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

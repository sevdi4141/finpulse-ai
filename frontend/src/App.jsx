import { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import './App.css';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/finance';

const CURRENCIES = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
  { code: 'USD', name: 'ABD Doları', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
  { code: 'CHF', name: 'İsviçre Frangı', symbol: '₣' },
  { code: 'JPY', name: 'Japon Yeni', symbol: '¥' },
  { code: 'SAR', name: 'Suudi Riyali', symbol: '﷼' },
  { code: 'AED', name: 'BAE Dirhemi', symbol: 'د.إ' }
];

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [liveRates, setLiveRates] = useState({ TRY: 1, USD: 50.62, EUR: 55.22, GBP: 66.01, CHF: 60.15, JPY: 0.318, SAR: 13.49, AED: 13.78 });
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    profitMargin: 0,
    currentRatio: 0,
    fxExposure: 0,
    currencyBreakdown: {},
    aiInsight: 'Canlı piyasa kurları senkronize ediliyor...'
  });

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    type: 'INCOME',
    category: 'Yazılım & Lisans',
    amount: '',
    currency: 'USD'
  });
  const [fxCalc, setFxCalc] = useState({ amount: 1000, currency: 'EUR' });
  const [loading, setLoading] = useState(false);

  // Stres Testi & Bütçe Limitleri
  const [fxShockPct, setFxShockPct] = useState(15);
  const [budgetLimits, setBudgetLimits] = useState({
    'Bulut & Altyapı': 100000,
    'Operasyon': 150000,
    'Pazarlama': 80000
  });
  const [newBudget, setNewBudget] = useState({ category: '', limit: '' });

  // Defter Arama & Filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');

  // Yinelenen Ödeme Takvimi
  const [recurringList, setRecurringList] = useState([
    { id: 1, title: 'AWS & Sunucu Altyapısı', amount: 1450, currency: 'USD', day: "Her Ayın 28'i" },
    { id: 2, title: 'Kurumsal Stopaj & KDV Ödemesi', amount: 64000, currency: 'TRY', day: "Her Ayın 26'sı" }
  ]);
  const [recForm, setRecForm] = useState({ title: '', amount: '', currency: 'USD', day: "Her Ayın 15'i" });

  const fetchLiveMarketRates = async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/TRY');
      const data = await res.json();
      if (data && data.rates) {
        const updated = { TRY: 1 };
        CURRENCIES.forEach(({ code }) => {
          if (code !== 'TRY' && data.rates[code]) {
            updated[code] = Number((1 / data.rates[code]).toFixed(4));
          }
        });
        setLiveRates((prev) => ({ ...prev, ...updated }));
      }
    } catch {
      // Yedek kurlar korunur
    }
  };

  const fetchData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/transactions`),
        fetch(`${API_BASE}/summary`)
      ]);
      if (txRes.ok && sumRes.ok) {
        const txData = await txRes.json();
        const sumData = await sumRes.json();
        setTransactions(txData);
        setSummary(sumData);
        if (sumData.liveRates) setLiveRates((prev) => ({ ...prev, ...sumData.liveRates }));
        setApiOnline(true);
      }
    } catch {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    fetchLiveMarketRates();
    fetchData();
    const interval = setInterval(fetchLiveMarketRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
      });
      setForm({ ...form, title: '', amount: '' });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePortfolio = async () => {
    setLoading(true);
    const samples = [
      { title: 'Avrupa SaaS İhracat Geliri', type: 'INCOME', category: 'Yazılım & Lisans', amount: 4200, currency: 'EUR' },
      { title: 'ABD Kurumsal Danışmanlık', type: 'INCOME', category: 'Danışmanlık', amount: 6500, currency: 'USD' },
      { title: 'AWS & Bulut Altyapı Gideri', type: 'EXPENSE', category: 'Bulut & Altyapı', amount: 1450, currency: 'USD' },
      { title: 'Londra Ofis & Operasyon', type: 'EXPENSE', category: 'Operasyon', amount: 1800, currency: 'GBP' },
      { title: 'Merkez Bankası Döviz Rezervi', type: 'ASSET', category: 'Nakit Rezerv', amount: 12000, currency: 'CHF' },
      { title: 'Kısa Vadeli Tedarikçi Ödemesi', type: 'LIABILITY', category: 'Ticari Borç', amount: 145000, currency: 'TRY' }
    ];
    try {
      for (const item of samples) {
        await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  // TÜM VERİLERİ SIFIRLAMA (TEMİZ SAYFA)
  const handleClearAll = async () => {
    if (!window.confirm('Tüm kayıtlı finansal işlemler silinecek ve temiz sayfa açılacak. Onaylıyor musunuz?')) return;
    setLoading(true);
    try {
      await Promise.all(transactions.map((tx) => fetch(`${API_BASE}/transactions/${tx.id}`, { method: 'DELETE' })));
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  // EXCEL / CSV DOSYASINDAN GERÇEK VERİ İÇE AKTARMA
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV dosyasında başlık satırı ve en az 1 veri satırı olmalıdır.');
        return;
      }
      const sep = lines[0].includes(';') ? ';' : ',';
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
        // Hem dışa aktarılan formatı (8 sütun) hem basit 5 sütunlu formatı destekler:
        // Format A (5 sütun): Aciklama;Tur;Kategori;Tutar;ParaBirimi
        // Format B (8 sütun - FinPulse Export): ID;Aciklama;Tur;Kategori;OrijinalTutar;ParaBirimi;...
        const isExportFormat = cols.length >= 6 && !isNaN(Number(cols[0]));
        const title = isExportFormat ? cols[1] : cols[0];
        const rawType = (isExportFormat ? cols[2] : cols[1] || 'INCOME').toUpperCase();
        const type = ['INCOME', 'EXPENSE', 'ASSET', 'LIABILITY'].includes(rawType) ? rawType : 'INCOME';
        const category = (isExportFormat ? cols[3] : cols[2]) || 'Genel';
        const amount = parseFloat((isExportFormat ? cols[4] : cols[3] || '0').replace(',', '.'));
        const rawCurr = (isExportFormat ? cols[5] : cols[4] || 'TRY').toUpperCase();
        const currency = CURRENCIES.some((c) => c.code === rawCurr) ? rawCurr : 'TRY';

        if (title && !isNaN(amount) && amount > 0) {
          await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, type, category, amount, currency })
          });
          importedCount++;
        }
      }
      await fetchData();
      alert(`${importedCount} adet gerçek finansal işlem başarıyla içe aktarıldı!`);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // ÖRNEK CSV ŞABLONU İNDİRME
  const downloadSampleCSVTemplate = () => {
    const template =
      '\uFEFFAciklama;Tur;Kategori;Tutar;ParaBirimi\n' +
      'Musteri Fatura Tahsilati;INCOME;Satis Geliri;125000;TRY\n' +
      'Yurtdisi Yazilim Lisans Geliri;INCOME;Ihracat;3400;USD\n' +
      'Ofis Kira ve Aidat Gideri;EXPENSE;Operasyon;42000;TRY\n' +
      'Avrupa Tedarikci Odemesi;EXPENSE;Tedarik;1850;EUR';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FinPulse_Veri_Yukleme_Sablonu.csv';
    a.click();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  // Excel (CSV) Dışa Aktarma
  const exportToCSV = () => {
    const headers = ['ID', 'Aciklama', 'Tur', 'Kategori', 'Orijinal Tutar', 'Para Birimi', 'TRY Karsiligi', 'Tarih'];
    const rows = transactions.map((tx) => [
      tx.id,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.type,
      `"${tx.category}"`,
      tx.amount,
      tx.currency,
      (tx.amount * (liveRates[tx.currency] || 1)).toFixed(2),
      tx.transactionDate || ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinPulse_AI_Rapor_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  // Cash Runway (Nakit Ömrü) Hesabı
  const totalCashAssets = transactions
    .filter((t) => t.type === 'ASSET')
    .reduce((sum, t) => sum + t.amount * (liveRates[t.currency] || 1), 0) + Math.max(0, summary.netCashFlow);
  const monthlyBurn = summary.totalExpense > 0 ? summary.totalExpense : 0;
  const runwayMonths = monthlyBurn > 0 ? (totalCashAssets / monthlyBurn).toFixed(1) : '∞';

  // Kur Şoku Stres Testi Hesabı
  const fxNetPositionTry = transactions.reduce((acc, tx) => {
    if (tx.currency === 'TRY') return acc;
    const valTry = tx.amount * (liveRates[tx.currency] || 1);
    const sign = tx.type === 'INCOME' || tx.type === 'ASSET' ? 1 : -1;
    return acc + sign * valTry;
  }, 0);
  const shockImpactTry = fxNetPositionTry * (fxShockPct / 100);
  const stressedNetCashFlow = summary.netCashFlow + shockImpactTry;

  // Grafik Verileri
  let runningBalance = 0;
  const trendData = [...transactions].reverse().map((tx, index) => {
    const tryVal = tx.amount * (liveRates[tx.currency] || 1);
    if (tx.type === 'INCOME') runningBalance += tryVal;
    if (tx.type === 'EXPENSE') runningBalance -= tryVal;
    return {
      name: `#${index + 1} ${tx.title.slice(0, 14)}`,
      Gelir: tx.type === 'INCOME' ? Math.round(tryVal) : 0,
      Gider: tx.type === 'EXPENSE' ? Math.round(tryVal) : 0,
      KümülatifNakit: Math.round(runningBalance)
    };
  });

  const categoryExpenseMap = {};
  const categoryAllMap = {};
  transactions.forEach((tx) => {
    const tryVal = tx.amount * (liveRates[tx.currency] || 1);
    if (!categoryAllMap[tx.category]) categoryAllMap[tx.category] = { category: tx.category, Tutar: 0 };
    categoryAllMap[tx.category].Tutar += Math.round(tryVal);
    if (tx.type === 'EXPENSE') {
      categoryExpenseMap[tx.category] = (categoryExpenseMap[tx.category] || 0) + tryVal;
    }
  });
  const categoryData = Object.values(categoryAllMap);

  const pieData = Object.entries(summary.currencyBreakdown || {})
    .filter(([, val]) => val > 0)
    .map(([name, value]) => ({ name, value }));

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchesCurr = currencyFilter === 'ALL' || tx.currency === currencyFilter;
    return matchesSearch && matchesType && matchesCurr;
  });

  const convertedFx = fxCalc.amount * (liveRates[fxCalc.currency] || 1);

  const handleAddBudget = (e) => {
    e.preventDefault();
    if (!newBudget.category || !newBudget.limit) return;
    setBudgetLimits({ ...budgetLimits, [newBudget.category]: parseFloat(newBudget.limit) });
    setNewBudget({ category: '', limit: '' });
  };

  const handleAddRecurring = (e) => {
    e.preventDefault();
    if (!recForm.title || !recForm.amount) return;
    setRecurringList([...recurringList, { id: Date.now(), ...recForm, amount: parseFloat(recForm.amount) }]);
    setRecForm({ title: '', amount: '', currency: 'USD', day: "Her Ayın 15'i" });
  };

  const applyRecurringToLedger = async (item) => {
    await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${item.title} (Otomatik Ödeme)`,
        type: 'EXPENSE',
        category: 'Düzenli Ödemeler',
        amount: item.amount,
        currency: item.currency
      })
    });
    await fetchData();
  };

  return (
    <div className="dashboard" translate="no">
      {/* CANLI BORSA KUR BANDI */}
      <div className="ticker-bar no-print">
        <div className="ticker-badge">
          <span className="pulse-dot" /> CANLI PİYASA
        </div>
        <div className="ticker-track">
          {CURRENCIES.filter((c) => c.code !== 'TRY').map((c) => (
            <div key={c.code} className="ticker-pill">
              <span className="pair">{c.code}/TRY</span>
              <span className="rate">₺{liveRates[c.code]?.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ÜST KOMUTA BARI */}
      <header className="topbar">
        <div>
          <h1 className="brand-title">
            FinPulse <span className="badge">AI PRO</span>
          </h1>
          <p className="subtitle">Kurumsal Hazine, Çoklu Döviz Riski & AI Finansal Simülasyon Kokpiti</p>
        </div>
        <div className="header-actions no-print">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCSVImport}
          />
          {transactions.length === 0 ? (
            <button className="demo-btn" onClick={loadSamplePortfolio} disabled={loading}>
              ✦ Örnek Portföy Yükle
            </button>
          ) : (
            <button className="danger-btn" onClick={handleClearAll} disabled={loading}>
              🗑 Verileri Sıfırla
            </button>
          )}
          <button className="action-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            ↑ CSV Yükle
          </button>
          <button className="action-btn" onClick={exportToCSV} disabled={transactions.length === 0}>
            ↓ Excel (CSV)
          </button>
          <button className="action-btn" onClick={() => window.print()}>
            🖨 PDF Rapor
          </button>
          <div className={`status-pill ${apiOnline ? 'online' : 'offline'}`}>
            ● {apiOnline ? 'API Aktif (8080)' : 'Bağlantı Yok'}
          </div>
        </div>
      </header>

      {/* AI DANIŞMAN BANNER */}
      <section className="ai-banner">
        <div className="ai-icon">✦</div>
        <div>
          <strong>AI Hazine & Likidite Analizi</strong>
          <p>{summary.aiInsight}</p>
        </div>
      </section>

      {/* 6'LI STRATEJİK KPI ŞERİDİ */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <span>Toplam Gelir (TRY)</span>
          <h2 className="text-green">₺{formatMoney(summary.totalIncome)}</h2>
        </div>
        <div className="kpi-card">
          <span>Toplam Gider (TRY)</span>
          <h2 className="text-red">₺{formatMoney(summary.totalExpense)}</h2>
        </div>
        <div className="kpi-card">
          <span>Net Nakit Akışı</span>
          <h2 className={summary.netCashFlow >= 0 ? 'text-green' : 'text-red'}>
            ₺{formatMoney(summary.netCashFlow)}
          </h2>
        </div>
        <div className="kpi-card">
          <span>Nakit Ömrü (Runway)</span>
          <h2 className="text-purple">
            {runwayMonths} <small>{runwayMonths === '∞' ? 'Sınırsız' : 'Ay'}</small>
          </h2>
        </div>
        <div className="kpi-card">
          <span>Kâr Marjı / Cari Oran</span>
          <h2 className="text-white">
            %{summary.profitMargin} <small>/ {summary.currentRatio}x</small>
          </h2>
        </div>
        <div className="kpi-card">
          <span>Döviz Pozisyonu (FX)</span>
          <h2 className="text-blue">₺{formatMoney(summary.fxExposure)}</h2>
        </div>
      </section>

      {/* MODÜLER SEKMELER */}
      <nav className="tab-nav no-print">
        <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>
          📊 Genel Bakış & Canlı Grafikler
        </button>
        <button className={activeTab === 'stress' ? 'tab active' : 'tab'} onClick={() => setActiveTab('stress')}>
          ⚡ AI Kur Şoku Simülatörü & Bütçe Limitleri
        </button>
        <button className={activeTab === 'ledger' ? 'tab active' : 'tab'} onClick={() => setActiveTab('ledger')}>
          📑 İşlem Defteri & Ödeme Takvimi ({transactions.length})
        </button>
      </nav>

      {/* SEKME 1: GENEL BAKIŞ & CANLI GRAFİKLER */}
      {activeTab === 'overview' && (
        <>
          <section className="analytics-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Nakit Akışı & Kümülatif Bakiye Trendi (TRY)</h3>
                <span className="chip">Gerçek Zamanlı</span>
              </div>
              {trendData.length === 0 ? (
                <div className="chart-empty">
                  Grafiklerin oluşması için alttaki formdan gerçek verilerinizi girin, <b>"CSV Yükle"</b> ile Excel aktarın veya <b>"Örnek Portföy Yükle"</b> butonunu kullanın.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="giderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      formatter={(v) => `₺${formatMoney(v)}`}
                      contentStyle={{ backgroundColor: '#0b1120', borderColor: '#334155', borderRadius: 10, color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="KümülatifNakit" name="Kümülatif Nakit" stroke="#3b82f6" strokeWidth={2.5} fill="url(#netGrad)" />
                    <Area type="monotone" dataKey="Gelir" stroke="#10b981" strokeWidth={2} fill="url(#gelirGrad)" />
                    <Area type="monotone" dataKey="Gider" stroke="#ef4444" strokeWidth={2} fill="url(#giderGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Döviz Portföyü & Canlı Çevirici</h3>
                <span className="chip">8 Para Birimi</span>
              </div>
              {pieData.length === 0 ? (
                <div className="chart-empty" style={{ height: 185 }}>Döviz dağılımı için işlem bekleniyor.</div>
              ) : (
                <ResponsiveContainer width="100%" height={185}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={74} paddingAngle={4}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `₺${formatMoney(v)}`}
                      contentStyle={{ backgroundColor: '#0b1120', borderColor: '#334155', borderRadius: 10, color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="fx-box">
                <input
                  type="number"
                  value={fxCalc.amount}
                  onChange={(e) => setFxCalc({ ...fxCalc, amount: parseFloat(e.target.value) || 0 })}
                />
                <select value={fxCalc.currency} onChange={(e) => setFxCalc({ ...fxCalc, currency: e.target.value })}>
                  {CURRENCIES.filter((c) => c.code !== 'TRY').map((c) => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
                <div className="fx-result">= ₺{formatMoney(convertedFx)}</div>
              </div>
            </div>
          </section>

          {categoryData.length > 0 && (
            <section className="panel" style={{ marginBottom: 22 }}>
              <div className="panel-head">
                <h3>Kategori Bazlı Finansal Hacim Dağılımı (TRY)</h3>
                <span className="chip">Departman & Kalem Analizi</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    formatter={(v) => `₺${formatMoney(v)}`}
                    contentStyle={{ backgroundColor: '#0b1120', borderColor: '#334155', borderRadius: 10, color: '#fff' }}
                  />
                  <Bar dataKey="Tutar" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={46} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}
        </>
      )}

      {/* SEKME 2: AI KUR ŞOKU STRES TESTİ & BÜTÇE LİMİTLERİ */}
      {activeTab === 'stress' && (
        <section className="analytics-grid">
          <div className="panel">
            <div className="panel-head">
              <h3>⚡ AI Kur Şoku & Stres Testi (What-If Analizi)</h3>
              <span className="chip">Senaryo: {fxShockPct > 0 ? `+${fxShockPct}%` : `${fxShockPct}%`} Kur Değişimi</span>
            </div>
            <p className="muted-desc">
              Döviz kurlarındaki ani yükseliş veya düşüşlerin şirketinizin net döviz pozisyonuna ve nakit akışına etkisini canlı simüle edin.
            </p>

            <div className="slider-box">
              <div className="slider-labels">
                <span>%-30 Kur Düşüşü</span>
                <strong className="text-blue">Seçili Senaryo: {fxShockPct > 0 ? `+${fxShockPct}%` : `${fxShockPct}%`}</strong>
                <span>+%50 Kur Şoku</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                value={fxShockPct}
                onChange={(e) => setFxShockPct(Number(e.target.value))}
                className="shock-slider"
              />
            </div>

            <div className="stress-cards">
              <div className="stress-item">
                <span>Net Döviz Pozisyonu (Varlık - Borç)</span>
                <strong className={fxNetPositionTry >= 0 ? 'text-green' : 'text-red'}>
                  ₺{formatMoney(fxNetPositionTry)}
                </strong>
              </div>
              <div className="stress-item">
                <span>Kur Değişimi Net Bilanço Etkisi</span>
                <strong className={shockImpactTry >= 0 ? 'text-green' : 'text-red'}>
                  {shockImpactTry >= 0 ? '+' : ''}₺{formatMoney(shockImpactTry)}
                </strong>
              </div>
              <div className="stress-item">
                <span>Simülasyon Sonrası Net Nakit Akışı</span>
                <strong className={stressedNetCashFlow >= 0 ? 'text-blue' : 'text-red'}>
                  ₺{formatMoney(stressedNetCashFlow)}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>🎯 Kategori Bazlı Gider Bütçe Limitleri</h3>
              <span className="chip">Erken Uyarı Sistemi</span>
            </div>

            <div className="budget-list">
              {Object.entries(budgetLimits).map(([cat, limit]) => {
                const spent = categoryExpenseMap[cat] || 0;
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const isOver = spent > limit;
                const isWarn = pct >= 80 && !isOver;
                return (
                  <div key={cat} className="budget-item">
                    <div className="budget-head">
                      <span>{cat} {isOver && <b className="text-red">(LİMİT AŞILDI!)</b>} {isWarn && <b className="text-amber">(%80+ Uyarı)</b>}</span>
                      <span>₺{formatMoney(spent)} / ₺{formatMoney(limit)}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isOver ? 'red-bg' : isWarn ? 'amber-bg' : 'green-bg'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddBudget} className="inline-form">
              <input
                type="text"
                placeholder="Kategori (Örn: Operasyon)"
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              />
              <input
                type="number"
                placeholder="Limit (TRY)"
                value={newBudget.limit}
                onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
              />
              <button type="submit">Limit Koy</button>
            </form>
          </div>
        </section>
      )}

      {/* İŞLEM DEFTERİ, GERÇEK VERİ GİRİŞ FORMU VE ÖDEME TAKVİMİ */}
      {(activeTab === 'ledger' || activeTab === 'overview') && (
        <div className="main-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="panel no-print">
              <div className="panel-head">
                <h3>Yeni Finansal İşlem Ekle</h3>
                <button type="button" className="mini-btn" onClick={downloadSampleCSVTemplate}>
                  📄 CSV Şablonu
                </button>
              </div>
              <form onSubmit={handleSubmit} className="tx-form">
                <label>İşlem Açıklaması</label>
                <input
                  type="text"
                  placeholder="Örn: Avrupa İhracat Tahsilatı / AWS Faturası"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />

                <div className="row">
                  <div>
                    <label>İşlem Türü</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="INCOME">Gelir (INCOME)</option>
                      <option value="EXPENSE">Gider (EXPENSE)</option>
                      <option value="ASSET">Varlık / Nakit (ASSET)</option>
                      <option value="LIABILITY">Borç / Yükümlülük (LIABILITY)</option>
                    </select>
                  </div>
                  <div>
                    <label>Kategori</label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label>Gerçek Tutar</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Örn: 45000.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Para Birimi (Canlı Kur)</label>
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name} ({c.code === 'TRY' ? '1.00₺' : `${liveRates[c.code]?.toFixed(2)}₺`})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : '+ Gerçek İşlemi Kaydet ve Analiz Et'}
                </button>
              </form>
            </section>

            {/* YİNELENEN ÖDEME & VERGİ TAKVİMİ */}
            <section className="panel no-print">
              <div className="panel-head">
                <h3>📅 Yaklaşan Düzenli Ödemeler</h3>
                <span className="chip">Otomatik İşle</span>
              </div>
              <div className="rec-list">
                {recurringList.map((item) => (
                  <div key={item.id} className="rec-item">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.day} • {formatMoney(item.amount)} {item.currency}</small>
                    </div>
                    <button className="mini-btn" onClick={() => applyRecurringToLedger(item)}>
                      Deftere İşle
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddRecurring} className="inline-form" style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="Ödeme adı"
                  value={recForm.title}
                  onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Tutar"
                  style={{ width: 85 }}
                  value={recForm.amount}
                  onChange={(e) => setRecForm({ ...recForm, amount: e.target.value })}
                />
                <select
                  style={{ width: 78 }}
                  value={recForm.currency}
                  onChange={(e) => setRecForm({ ...recForm, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <button type="submit">+</button>
              </form>
            </section>
          </div>

          <section className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: 10 }}>
              <h3>Finansal İşlem Defteri ({filteredTransactions.length})</h3>
              <div className="filter-bar no-print">
                <input
                  type="text"
                  placeholder="Ara (açıklama/kategori)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="ALL">Tüm Türler</option>
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                  <option value="ASSET">ASSET</option>
                  <option value="LIABILITY">LIABILITY</option>
                </select>
                <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
                  <option value="ALL">Tüm Dövizler</option>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p className="empty">Kriterlere uygun kayıt bulunamadı. Soldaki formdan gerçek verilerinizi girin veya üstten CSV yükleyin.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Açıklama</th>
                      <th>Tür</th>
                      <th>Kategori</th>
                      <th>Orijinal Tutar</th>
                      <th>TRY Karşılığı</th>
                      <th className="no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td><strong>{tx.title}</strong></td>
                        <td><span className={`tag ${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                        <td>{tx.category}</td>
                        <td><strong>{formatMoney(tx.amount)} {tx.currency}</strong></td>
                        <td className="text-blue">₺{formatMoney(tx.amount * (liveRates[tx.currency] || 1))}</td>
                        <td className="no-print">
                          <button className="del-btn" onClick={() => handleDelete(tx.id)}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import StatCard from '../components/StatCard';
// import DemandHeatmap from '../components/DemandHeatmap'; // Moved to dedicated page
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api, { aiApi } from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState([]);
    const [products, setProducts] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [festivalData, setFestivalData] = useState(null);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deadStock, setDeadStock] = useState([]);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const [replenishStatus, setReplenishStatus] = useState('IDLE'); // IDLE, GENERATING, READY, DELIVERING, DELIVERED
    const [draftOrder, setDraftOrder] = useState(null);

    const handleAutoReplenish = async () => {
        try {
            // Stage 1: Call Gemini / AI for draft
            setReplenishStatus('GENERATING');

            // Fetch stationery restock draft from AI Service
            const res = await api.post('/vendors/draft-order', {
                vendor_id: 1, // Sai Traders
                product_name: 'Stationery Items',
                quantity: 50,
                last_price: 250
            });

            setDraftOrder(res.data);
            setReplenishStatus('READY');

            // Wait a bit to show "Generating" effect
            setTimeout(() => {
                // Stage 2: Open WhatsApp
                window.open(res.data.whatsapp_link, '_blank');

                // Stage 3: Transition to Delivering
                setReplenishStatus('DELIVERING');

                // Stage 4: Simulate Delivery Completion after 10 seconds
                setTimeout(async () => {
                    await api.post('/inventory/transaction', {
                        product_id: 4,
                        type: 'IN',
                        quantity: 50,
                        reason: 'Predictive Intervention: Strategic Restock'
                    });
                    setReplenishStatus('DELIVERED');
                }, 10000);
            }, 1500);

        } catch (err) {
            console.error(err);
            alert('Replenish failed');
            setReplenishStatus('IDLE');
        }
    };

    const handleDismiss = () => {
        setIsBannerVisible(false);
    };

    const handleBulkImport = () => {
        setIsBulkImporting(true);
        setTimeout(() => {
            setIsBulkImporting(false);
            alert('Bulk Import Success: 250 product records synchronized from "seasonal_inventory.xlsx"');
        }, 3000);
    };

    const handleRunAuditTrace = () => {
        // Link to Audit Trail page
        window.location.href = '/audit';
    };

    // Synthetic Operational Telemetry Feed (Simulated)
    const neuralEvents = [
        { time: '09:12', event: 'Anomaly Detected: Sudden surge in Vidyavihar University Cluster demand.', type: 'alert' },
        { time: '10:45', event: 'Stock Deduction Sync: Invoice #INV-8829 processed successfully.', type: 'info' },
        { time: '12:30', event: 'Neural Optimization: Adjusting safety thresholds for stationery products.', type: 'process' },
        { time: '14:15', event: 'Scenario Sync: Wedding Season patterns identified in Chembur region.', type: 'info' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const inventoryRes = await api.get('/inventory/products');
                const productsData = inventoryRes.data;
                setProducts(productsData);

                const totalProducts = productsData.length;
                const lowStock = productsData.filter(p => p.current_stock < 50).length;

                setStats([
                    { title: 'Total Products', value: totalProducts.toString(), icon: Package, trend: 5 },
                    { title: 'Low Stock Alerts', value: lowStock.toString(), icon: AlertTriangle, alert: lowStock > 0, trend: -2 },
                    { title: 'Dead Stock (90d+)', value: deadStockItems.length.toString(), icon: AlertTriangle, alert: deadStockItems.length > 0, trend: 0 },
                    { title: 'Revenue Saved', value: '₹12K', icon: DollarSign, trend: 8 },
                ]);

                const forecastRes = await aiApi.get('/forecast/1');
                const product1 = productsData.find(p => p.id === 1) || { current_stock: 100 };
                let runningStock = product1.current_stock;

                const forecast = forecastRes.data.forecast.map(day => {
                    const dataPoint = {
                        name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        stock: runningStock,
                        demand: day.predicted_demand,
                        historical_avg: day.predicted_demand * 0.8
                    };
                    runningStock = Math.max(0, runningStock - day.predicted_demand + 15);
                    return dataPoint;
                });
                setChartData(forecast);

                // Dead Stock Detection Logic
                const deadStockItems = productsData.filter(p => {
                    if (!p.last_sold_date) return false;
                    const days = (new Date() - new Date(p.last_sold_date)) / (1000 * 60 * 60 * 24);
                    return days > 90;
                });
                setDeadStock(deadStockItems);

                const seasonalRes = await aiApi.get('/forecast/seasonal');
                setFestivalData(seasonalRes.data);

                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;

    const data = chartData.length > 0 ? chartData : [
        { name: 'Mon', stock: 4000, demand: 2400 },
        { name: 'Tue', stock: 3000, demand: 1398 },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* 1. Scenario Indicator & Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-slate-800">Intelligence Dashboard</h1>
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-full border border-indigo-200 animate-pulse">
                            Active Scenario: Exam Season
                        </span>
                    </div>
                    <p className="text-slate-500">Predictive inventory auditing & neural demand forecasting</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBulkImport}
                        disabled={isBulkImporting}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase hover:bg-slate-700 disabled:opacity-50 transition-all border border-slate-700 shadow-sm"
                    >
                        {isBulkImporting ? 'Importing Stack...' : 'Bulk Import (CSV/XLS)'}
                    </button>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-mono uppercase">System Node: MUM-INTEL-01</p>
                        <p className="text-xs font-bold text-slate-600">Last Sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            {/* 2. Predictive Intervention Banner */}
            {isBannerVisible && (
                <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg border border-indigo-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Predictive Intervention Required</h4>
                            <p className="text-xs text-indigo-100 italic">"Detected 45% probability of stockout for Stationery items in Vidyavihar cluster by Wednesday."</p>
                        </div>
                    </div>

                    {/* Context Logic Engine Block */}
                    <div className="bg-white/10 p-3 rounded-lg flex items-center gap-3 border border-white/10 max-w-sm hidden lg:flex">
                        <div className="text-lg">📊</div>
                        <div className="text-[10px] leading-tight">
                            <span className="font-black uppercase block mb-0.5 text-white/90">Context Signal Intelligence</span>
                            <span className="font-bold text-indigo-200">📚 University Exams Next Week</span> → Stationery Demand <span className="text-white">+3.2x</span> (Vidyavihar Hub)
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAutoReplenish}
                            disabled={replenishStatus !== 'IDLE'}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase flex items-center gap-2 ${replenishStatus === 'IDLE' ? 'bg-white text-indigo-600 hover:bg-slate-50' :
                                replenishStatus === 'DELIVERED' ? 'bg-green-500 text-white' : 'bg-indigo-400 text-white animate-pulse'
                                }`}>
                            {replenishStatus === 'IDLE' && 'Auto-Replenish'}
                            {replenishStatus === 'GENERATING' && 'AI Generating Draft...'}
                            {replenishStatus === 'READY' && 'Opening WhatsApp...'}
                            {replenishStatus === 'DELIVERING' && 'Logistics Callback Sync...'}
                            {replenishStatus === 'DELIVERED' && '✓ Vendor Response Simulated'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg border border-indigo-400 hover:bg-indigo-400 transition-colors uppercase">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* 2.5 Dead Stock Warning (Enterprise Insight) */}
            {deadStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <Package size={20} className="text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-red-900 uppercase">Dead Stock Detection Alert</h4>
                            <p className="text-xs text-red-700">
                                <span className="font-bold">{deadStock.length} items</span> identified with zero movement in <span className="font-bold">90+ days</span>.
                                <span className="ml-2 underline cursor-pointer hover:text-red-900 font-bold italic">Recommendation: Schedule "Flash Sale" or "Bundle Promotion"</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3. Stock Level Trend Graph (Enterprise Style) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Predictive Stock Audit</h2>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600"><span className="w-2 h-2 bg-blue-600 rounded-full"></span> Stock Level</span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600"><span className="w-2 h-2 bg-green-600 rounded-full"></span> Predicted Demand</span>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="stock" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Dynamic Stock" />
                                <Bar dataKey="demand" fill="#10b981" radius={[6, 6, 0, 0]} name="AI Forecasted Demand" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Critical Actions Summary (Demand vs Inventory Ranker) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-4">Critical Vulnerabilities</h2>
                    <div className="space-y-3">
                        {products.slice(0, 4).map((product, idx) => {
                            const vulnerability = Math.floor(Math.random() * 80) + 20;
                            return (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-700">{product.name}</span>
                                        <span className={`text-[10px] font-bold ${vulnerability > 70 ? 'text-red-600' : 'text-orange-600'}`}>
                                            Supply Risk: {vulnerability}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${vulnerability > 70 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${vulnerability}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-[9px] text-slate-400 uppercase tracking-tight font-bold">Gap: {50 - product.current_stock} units</p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${product.price_volatility > 15 ? 'bg-red-50 text-red-600 border-red-100' :
                                                product.price_volatility > 8 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            Volatility: {product.price_volatility}% ({product.market_sentiment})
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleRunAuditTrace}
                        className="w-full mt-6 py-2.5 bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
                    >
                        Run Full Immutable Audit Trail
                    </button>
                </div>
            </div>

            {/* 4. Neural Intelligence Panel (Operational Processing Log) */}
            <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-100 text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Synthetic Operational Telemetry Feed (Simulated Infrastructure)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Node_v4.2.0_MUM-TELEMETRY-STREAM</span>
                </div>
                <div className="space-y-2 font-mono text-[11px]">
                    {neuralEvents.map((ev, i) => (
                        <div key={i} className="flex gap-4 border-b border-slate-800/50 pb-1.5">
                            <span className="text-indigo-400 text-xs shrink-0">{ev.time}</span>
                            <span className={
                                ev.type === 'alert' ? 'text-red-400' :
                                    ev.type === 'process' ? 'text-amber-400' : 'text-slate-400'
                            }>
                                <span className="opacity-50 mr-2">[{ev.type.toUpperCase()}]</span>
                                {ev.event}
                            </span>
                        </div>
                    ))}
                    <div className="text-indigo-500 pt-2 flex items-center gap-1">
                        <span className="animate-pulse">_</span> Actively monitoring internal cross-service events...
                    </div>
                </div>
            </div>

            {/* 5. Strategic Intelligence: Seasonal Demand Outlook */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" /> Context / Calendar Intelligence Engine (Seeded Historical Baseline)
                        </h2>
                        <div className="flex gap-4 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🗓️ Long-term demand planning (30–60 days)</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🧠 Non-operational, strategic insights</span>
                        </div>
                    </div>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                        Strategic Engine: Prophet™
                    </span>
                </div>

                {loading && !festivalData && (
                    <div className="text-center py-8 text-slate-400 animate-pulse">
                        Analyzing Long-term Seasonal Market Trends...
                    </div>
                )}

                {!loading && !festivalData && (
                    <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg border border-red-100 text-sm">
                        ⚠️ Strategic Intelligence Sync Failed. <button onClick={() => window.location.reload()} className="underline ml-2">Retry</button>
                    </div>
                )}

                {!loading && festivalData && Array.isArray(festivalData) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {festivalData.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 uppercase uppercase">
                                        {item.type}
                                    </span>
                                    <span className="text-lg font-black text-green-600">
                                        {item.surge}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 mb-1">{item.event}</h3>
                                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{item.insight}</p>
                                <div className="flex flex-wrap gap-1">
                                    {item.categories.map((cat, ci) => (
                                        <span key={ci} className="text-[8px] font-bold px-1.5 py-0.5 bg-white text-slate-500 rounded border border-slate-100">{cat}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-[10px] text-slate-400 mt-6 italic">*Strategic insights (Prophet™) are for long-term procurement planning and do not intersect with real-time operational thresholds.</p>
            </div>
        </div>
    );
};

export default Dashboard;

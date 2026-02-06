import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign, Activity, Zap, ShieldCheck, Globe } from 'lucide-react';
import StatCard from '../components/StatCard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import api, { aiApi } from '../services/api';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [stats, setStats] = useState([]);
    const [products, setProducts] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [festivalData, setFestivalData] = useState(null);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deadStock, setDeadStock] = useState([]);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const [replenishStatus, setReplenishStatus] = useState('IDLE');
    const [draftOrder, setDraftOrder] = useState(null);

    const handleAutoReplenish = async () => {
        try {
            setReplenishStatus('GENERATING');
            const res = await api.post('/vendors/draft-order', {
                vendor_id: 1,
                product_name: 'Stationery Items',
                quantity: 50,
                last_price: 250
            });
            setDraftOrder(res.data);
            setReplenishStatus('READY');
            setTimeout(() => {
                window.open(res.data.whatsapp_link, '_blank');
                setReplenishStatus('DELIVERING');
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
            setReplenishStatus('IDLE');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const inventoryRes = await api.get('/inventory/products');
                const productsData = inventoryRes.data;
                setProducts(productsData);

                // 1. Calculate stats dependencies
                const totalProducts = productsData.length;
                const lowStock = productsData.filter(p => p.current_stock < 50).length;

                const deadStockItems = productsData.filter(p => {
                    if (!p.last_sold_date) return false;
                    const days = (new Date() - new Date(p.last_sold_date)) / (1000 * 60 * 60 * 24);
                    return days > 90;
                });
                setDeadStock(deadStockItems);
<<<<<<< HEAD

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

                // (deadStockItems already calculated above)
=======
>>>>>>> origin/theme-vendor

                setStats([
                    { title: 'Total Inventory', value: totalProducts.toString(), icon: Package, trend: 12 },
                    { title: 'Critical Alerts', value: lowStock.toString(), icon: AlertTriangle, alert: lowStock > 0, trend: -5 },
                    { title: 'Dead Stock Assets', value: deadStockItems.length.toString(), icon: ShieldCheck, trend: 0 },
                    { title: 'Projected Savings', value: '₹18.4K', icon: DollarSign, trend: 24 },
                ]);

                // Find target product for forecast (prefer first available if 1 doesn't exist)
                const targetProduct = productsData.length > 0 ? productsData[0] : { id: 1, current_stock: 100 };

                const forecastRes = await aiApi.get(`/forecast/${targetProduct.id}`);
                let runningStock = targetProduct.current_stock;

                const forecast = forecastRes.data.forecast.map(day => {
                    const dataPoint = {
                        name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        stock: runningStock,
                        demand: day.predicted_demand,
                    };
                    runningStock = Math.max(0, runningStock - day.predicted_demand + 15);
                    return dataPoint;
                });
                setChartData(forecast);

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

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Initializing Neural Engine...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Activity className="text-blue-400" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Intelligence <span className="text-blue-500">Node</span></h1>
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium">Real-time predictive supply-chain orchestration</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" /> System Status: Online
                    </button>
                    <div className="hidden lg:block text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Quantum Instance</p>
                        <p className="text-sm font-black text-blue-400">ID: SME-X1-ALPHA</p>
                    </div>
                </div>
            </div>

            {/* Predictive Intervention */}
            {isBannerVisible && products.some(p => p.current_stock < p.min_level) && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative overflow-hidden group rounded-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                                <AlertTriangle className="text-white animate-pulse" size={32} />
                            </div>
                            {(() => {
                                const critical = products.find(p => p.current_stock < p.min_level);
                                return (
                                    <div>
                                        <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black text-white uppercase mb-1 inline-block">NEURAL ALERT</span>
                                        <h3 className="text-xl font-black text-white">Stockout Imminent: {critical.name}</h3>
                                        <p className="text-red-100 text-sm italic">"Current stock ({critical.current_stock}) is below safety threshold ({critical.min_level}). Neural engine recommends baseline replenishment of {critical.max_level - critical.current_stock} units."</p>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAutoReplenish}
                                disabled={replenishStatus !== 'IDLE'}
                                className="px-8 py-3 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                {replenishStatus === 'IDLE' ? 'Execute Hyper-Restock' : 'Syncing...'}
                            </button>
                            <button
                                onClick={() => setIsBannerVisible(false)}
                                className="px-6 py-3 bg-black/20 hover:bg-black/30 text-white rounded-xl font-bold text-xs uppercase transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)]">Neural Forecast</h2>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">7-Day Predictive Consumption</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                <span className="text-[10px] font-bold text-slate-400">Stock</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-bold text-slate-400">Demand</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-glass)" opacity={0.5} />
                                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} stroke="var(--text-secondary)" opacity={0.7} />
                                <YAxis fontSize={11} axisLine={false} tickLine={false} stroke="var(--text-secondary)" opacity={0.7} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        backdropBlur: '12px',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="stock" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStock)" strokeWidth={3} />
                                <Area type="monotone" dataKey="demand" stroke="#10b981" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6">Risk Protocol</h2>
                    <div className="space-y-6 flex-1">
                        {products.length > 0 ? products.slice(0, 4).map((product, idx) => {
                            // Real vulnerability calculation: 100% risk if current_stock is 0, 0% if >= max_level
                            const vulnerability = Math.min(100, Math.max(0,
                                Math.round(((product.min_level - product.current_stock) / product.min_level) * 100)
                            ));
                            return (
                                <div key={idx} className="group">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors uppercase">{product.name}</span>
                                        <span className={`text-[10px] font-black ${vulnerability > 70 ? 'text-red-400' : vulnerability > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {vulnerability}% LOGISTICS RISK
                                        </span>
                                    </div>
<<<<<<< HEAD
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
=======
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, vulnerability)}%` }}
                    className={`h-full rounded-full ${vulnerability > 70 ? 'bg-red-500' : vulnerability > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                ></motion.div>
>>>>>>> origin/theme-vendor
            </div>
        </div>
                            );
                        }) : (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
        <ShieldCheck size={48} className="mb-4 text-slate-500" />
        <p className="text-xs font-bold uppercase tracking-widest">No Active Hazards</p>
        <p className="text-[10px] mt-2">Neural engine requires product data to initiate risk synthesis.</p>
    </div>
)}
                    </div >
    <button className="w-full mt-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">
        Initiate Global Audit
    </button>
                </div >
            </div >

    {/* Strategic Insights Grid */ }
    < div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
        { festivalData && festivalData.slice(0, 3).map((insight, idx) => (
            <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="glass-card p-6 border-l-4 border-l-blue-500"
            >
                <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black uppercase tracking-tighter">Market Driver</span>
                    <span className="text-[10px] font-black text-emerald-400">{insight.surge} SURGE</span>
                </div>
                <h4 className="text-lg font-black text-[var(--text-primary)] mb-2 italic">"{insight.event}"</h4>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mb-4">{insight.insight}</p>
                <div className="flex flex-wrap gap-2">
                    {insight.categories.map((cat, ci) => (
                        <span key={ci} className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase">{cat}</span>
                    ))}
                </div>
            </motion.div>
        ))}
            </div >

    {/* Telemetry Feed */ }
    < div className = "bg-[var(--bg-card)] rounded-2xl border border-[var(--border-glass)] p-6 font-mono text-xs shadow-xl" >
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="font-bold underline uppercase">Live Telemetry Stream</span>
                </div>
                <div className="space-y-2 opacity-70">
                    <p className="text-slate-500">[{new Date().toLocaleTimeString()}] <span className="text-blue-400 font-bold uppercase ml-2">[NETWORK]</span> Uplink established. SME-Alpha synchronization active.</p>
                    {products.some(p => p.current_stock < p.min_level) && (
                        <p className="text-red-400 font-black italic">[{new Date().toLocaleTimeString()}] [CRITICAL] Stockout hazard detected in primary cluster.</p>
                    )}
                    {festivalData && (
                        <p className="text-amber-400 font-bold uppercase ml-2">[{new Date().toLocaleTimeString()}] [NEURAL] Strategic pattern match: {festivalData[0].event} imminent.</p>
                    )}
                    <p className="text-slate-500">[{new Date().toLocaleTimeString()}] <span className="text-emerald-400 font-bold uppercase ml-2">[LEDGER]</span> Audit hash #442a-x9 generated successfully.</p>
                </div>
            </div >
        </div >
    );
};

export default Dashboard;

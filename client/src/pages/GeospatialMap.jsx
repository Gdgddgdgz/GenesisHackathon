import React, { useState, useEffect } from 'react';
import LeafletMap from '../components/LeafletMap';
import { aiApi } from '../services/api';
import { MapPin, Info, Layers, Crosshair, Radar } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const GeospatialMap = () => {
    const [points, setPoints] = useState([]);
    const [shopLocation, setShopLocation] = useState(null);
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [loading, setLoading] = useState(true);
    const [segment, setSegment] = useState('apparel');

    const fetchHeatmap = async (region = '', currentSegment = segment) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/heatmap?segment=${currentSegment}`);
            let data = res.data.features;
            if (region) {
                data = data.filter(f => f.properties.name === region);
            }
            setPoints(data);
            setShopLocation(res.data.shop_location);
        } catch (error) {
            console.error("Error fetching heatmap:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const regRes = await axios.get('http://localhost:8000/regions');
                setRegions(regRes.data);
                fetchHeatmap('', segment);
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, []);

    const handleRegionChange = (e) => {
        const region = e.target.value;
        setSelectedRegion(region);
        fetchHeatmap(region, segment);
    };

    const handleSegmentChange = (e) => {
        const newSegment = e.target.value;
        setSegment(newSegment);
        fetchHeatmap(selectedRegion, newSegment);
    };

    const handleUpdateZones = () => {
        fetchHeatmap(selectedRegion, segment);
    };

    return (
        <div className="space-y-8 pb-20 h-full flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                        Geospatial <span className="text-blue-500">Synth</span>
                        <Radar className="text-blue-500 animate-pulse" size={32} />
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Real-time demand heatmaps and delivery cluster analysis</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-glass)] shadow-sm">
                        <select
                            value={segment}
                            onChange={handleSegmentChange}
                            className="bg-transparent text-[var(--text-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            <optgroup label="Retail" className="bg-[var(--bg-main)]">
                                <option value="apparel">Apparel</option>
                                <option value="footwear">Footwear</option>
                                <option value="stationery">Stationery</option>
                            </optgroup>
                            <optgroup label="Food" className="bg-slate-900">
                                <option value="bakery_products">Bakery</option>
                                <option value="dairy_products">Dairy</option>
                                <option value="packaged_food_snacks">Packaged Food</option>
                            </optgroup>
                        </select>
                        <div className="w-[1px] h-6 bg-[var(--border-glass)]"></div>
                        <select
                            value={selectedRegion}
                            onChange={handleRegionChange}
                            className="bg-transparent text-[var(--text-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            <option value="" className="bg-[var(--bg-main)]">Global Scan</option>
                            {regions.map(reg => (
                                <option key={reg} value={reg} className="bg-[var(--bg-main)]">{reg}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleUpdateZones}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                        <Crosshair size={18} /> Re-sync
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 min-h-[500px] glass-card p-2 overflow-hidden relative"
            >
                {loading && (
                    <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Neutralizing Data Layer...</p>
                    </div>
                )}

                <div className="w-full h-full rounded-xl overflow-hidden dark:grayscale dark:contrast-[1.1] dark:brightness-[0.8] dark:invert-[0.05]">
                    <LeafletMap points={points} shopLocation={shopLocation} />
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 right-6 p-6 glass-card border-[var(--border-glass)] bg-[var(--bg-card)] max-w-xs transition-all hover:scale-105 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Signal Density</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                            <span className="text-[10px] font-bold text-slate-400">Critical Demand Cluster</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                            <span className="text-[10px] font-bold text-slate-400">Optimized Sourcing Zone</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-[10px] font-bold text-slate-400">Stable Baseline Feed</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-[var(--border-glass)] bg-[var(--bg-card)] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-400">
                        <Info size={18} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Market Fluidity</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">Heatmap shows localized demand drift based on semantic search volumes and inventory gaps.</p>
                </div>
                <div className="glass-card p-6 border-[var(--border-glass)] bg-[var(--bg-card)] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400">
                        <Crosshair size={18} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Delivery Radius</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">Optimized zones are calculated within a 5km radius of your primary warehouse uplink.</p>
                </div>
                <div className="glass-card p-6 border-[var(--border-glass)] bg-[var(--bg-card)] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-amber-400">
                        <Radar size={18} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Growth Predictor</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">Red zones indicate a 42% higher conversion rate for targeted promotional drops.</p>
                </div>
            </div>
        </div>
    );
};

export default GeospatialMap;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Radar, Layers, MapPin, GraduationCap, Church, ShoppingBag, TreePine, Home } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

const CATEGORIES = [
    { label: 'Education', color: '#F59E0B', desc: 'Schools, Unis' },
    { label: 'Religious', color: '#A855F7', desc: 'Temples, Mosques' },
    { label: 'Commercial', color: '#EC4899', desc: 'Malls, Shops' },
    { label: 'Parks', color: '#10B981', desc: 'Gardens, Grounds' },
    { label: 'Residential', color: '#94A3B8', desc: 'Housing Areas' },
];

const GeospatialMap = () => {
    const [points, setPoints] = useState([]);
    const [shopLocation, setShopLocation] = useState(null);
    const [institutions, setInstitutions] = useState([]);
    const [activePointer, setActivePointer] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Groceries');
    const [colorMapping, setColorMapping] = useState(null);


    // --- 1. Fetch Heatmap Data (Backend) ---
    const fetchHeatmap = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/heatmap?segment=${selectedCategory}`);
            setPoints(res.data.features);
            setShopLocation(res.data.shop_location);
        } catch (error) {
            console.error("Backend offline:", error);
        }
        setLoading(false);
    };

    // --- 2. Fetch AI Forecast & Interpretation ---
    const fetchAIInterpretation = async () => {
        try {
            const seasonalRes = await axios.get(`http://localhost:8000/forecast/seasonal?category=${selectedCategory}`);
            const insightsText = (seasonalRes.data || []).map(p => p.insight).join(" ");

            const forecastRes = await axios.post('http://localhost:8000/interpret-forecast', {
                forecast_text: insightsText || `Current demand signals for ${selectedCategory} are stable.`,
                category: selectedCategory
            });
            setColorMapping(forecastRes.data);
        } catch (err) {
            console.error("Mapping error:", err);
        }
    };

    // --- 2. Handle Map Clicks & Overpass Query ---
    const abortControllerRef = React.useRef(null);
    const handleMapClick = async (lat, lng) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 3. Create a new controller for the current request
        abortControllerRef.current = new AbortController();

        setActivePointer({ lat, lng });
        setIsScanning(true);

        const query = `[out:json][timeout:25];
        (
          way["landuse"~"residential|commercial|retail"](around:4800,${lat},${lng});
          node["amenity"~"school|college|university|place_of_worship"](around:4800,${lat},${lng});
          way["amenity"~"school|college|university|place_of_worship"](around:4800,${lat},${lng});
          node["shop"~"mall|supermarket|department_store"](around:4800,${lat},${lng});
          way["leisure"~"park|garden|playground"](around:4800,${lat},${lng});
        );
        out center;`;

        try {
            const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
                signal: abortControllerRef.current.signal
            });

            // Clean the data immediately
            const cleaned = (res.data.elements || []).map(el => {
                const tags = el.tags || {};
                const rawType = tags.amenity || tags.shop || tags.leisure || tags.landuse || "place";
                return {
                    id: el.id,
                    lat: el.lat || el.center?.lat,
                    lon: el.lon || el.center?.lon,
                    type: rawType.toUpperCase().replace(/ /g, '_'), // Normalize for interpreter
                    rawType: rawType.replace(/_/g, ' '),
                    name: tags.name || `Unnamed ${rawType.replace(/_/g, ' ')}`,
                    tags: tags
                };
            }).filter(item => item.lat && item.lon);

            setInstitutions(cleaned);
        } catch (err) {
            if (!axios.isCancel(err)) console.error("Overpass error:", err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddressSearch = async (address) => {
        if (!address) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1
                }
            });

            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];

                // 1. Move the map and scan the new area
                handleMapClick(parseFloat(lat), parseFloat(lon));
            } else {
                alert("Location not found. Try adding a city name.");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        }
    };

    useEffect(() => {
        fetchHeatmap();
        fetchAIInterpretation();
    }, [selectedCategory]);

    // Helper to get Icon for Sidebar
    const getSidebarIcon = (tags) => {
        if (tags.amenity === 'place_of_worship') return <Church size={16} className="text-purple-400" />;
        if (tags.amenity) return <GraduationCap size={16} className="text-amber-400" />;
        if (tags.shop || tags.landuse === 'commercial') return <ShoppingBag size={16} className="text-pink-400" />;
        if (tags.leisure) return <TreePine size={16} className="text-emerald-400" />;
        return <Home size={16} className="text-slate-400" />;
    };

    return (
        <div className="flex flex-col h-screen p-6 space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black flex items-center gap-2">
                            Geospatial <span className="text-blue-500">Synth</span> <Radar className="animate-pulse text-blue-500" />
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Forecast Domain:</span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-3 py-1 rounded-md outline-none cursor-pointer hover:bg-blue-500/20 transition-all"
                            >
                                <option value="Groceries">Groceries</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Electrical_Appliances">Electrical Appliances</option>
                                <option value="Flowers">Flowers</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* NEW: Search Bar */}
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search address (e.g. Bandra, Mumbai)..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e.target.value)}
                    />
                    <button className="absolute right-3 top-2.5 text-slate-500 hover:text-blue-400">
                        <MapPin size={16} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Map Legend (Moved to Right & Enhanced) */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl w-48">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-white/10 pb-2">Map Legend</h4>

                    <div className="space-y-4">
                        {/* 1. Zone Types */}
                        <div className="space-y-2">
                            <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Zone Categories</p>
                            {CATEGORIES.map(cat => (
                                <div key={cat.label} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: cat.color, border: '2px solid white' }} />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-200 leading-none">{cat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2. Opportunity Tints */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <p className="text-[8px] font-black uppercase text-slate-500 mb-1">AI Opportunity Signals</p>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-md bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <p className="text-[10px] font-bold text-emerald-400 leading-none">High Opportunity</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-md bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                <p className="text-[10px] font-bold text-rose-400 leading-none">Neutral / Risk</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Map Container */}
                <div className="flex-1 glass-card relative rounded-xl overflow-hidden border border-white/10">
                    {(loading || isScanning) && (
                        <div className="absolute inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">
                                    {isScanning ? "Scanning Area..." : "Loading Basemap..."}
                                </p>
                            </div>
                        </div>
                    )}
                    <LeafletMap
                        points={points}
                        shopLocation={shopLocation}
                        onMapClick={handleMapClick}
                        activePointer={activePointer}
                        institutions={institutions}
                        colorMapping={colorMapping}
                    />
                </div>

                {/* Sidebar */}
                <aside className="w-80 flex flex-col glass-card border border-white/10 p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                            <Layers size={14} /> Result Feed
                        </h3>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                            {institutions.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {institutions.length === 0 ? (
                            <div className="text-center py-20 opacity-30">
                                <MapPin className="mx-auto mb-2" />
                                <p className="text-xs">Tap map to analyze</p>
                            </div>
                        ) : (
                            institutions.map((inst) => (
                                <div key={inst.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex gap-3">
                                        {getSidebarIcon(inst.tags)}
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-200 leading-tight">{inst.name}</h4>
                                            <p className="text-[9px] uppercase font-black text-blue-500/80 mt-1">{inst.type}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default GeospatialMap;
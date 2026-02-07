import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Radar, Layers, MapPin, GraduationCap, Church, ShoppingBag, TreePine, Home } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import api from '../services/api';

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
    const [userLocations, setUserLocations] = useState([]); // outlets + custom pins
    const [institutions, setInstitutions] = useState([]);
    const [activePointer, setActivePointer] = useState(null);
    const [customPins, setCustomPins] = useState([]); // user-added pins (lat, lng)
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Groceries');
    const [colorMapping, setColorMapping] = useState(null);
    const MUMBAI_CENTER = { lat: 19.076, lng: 72.8777 }; // Standardized to lng
    const initialLoadDone = useRef(false);

    // --- Overpass scan (reused for initial load and map clicks) ---
    const runOverpassScan = async (locations = []) => {
        if (locations.length === 0) return;

        setIsScanning(true);
        try {
            // Aggregate all institution nodes from multiple locations
            let allInstitutions = [];

            for (const loc of locations) {
                const { lat, lng } = loc;
                const query = `[out:json][timeout:25];
                (
                  way["landuse"~"residential|commercial|retail"](around:2500,${lat},${lng});
                  node["amenity"~"school|college|university|place_of_worship|hospital|pharmacy|bank|parking"](around:2500,${lat},${lng});
                  way["amenity"~"school|college|university|place_of_worship|hospital|pharmacy|bank|parking"](around:2500,${lat},${lng});
                  node["shop"](around:2500,${lat},${lng});
                  way["shop"](around:2500,${lat},${lng});
                  node["leisure"~"park|garden|playground|stadium"](around:2500,${lat},${lng});
                  way["leisure"~"park|garden|playground|stadium"](around:2500,${lat},${lng});
                );
                out center;`;

                console.log(`Scanner: Fetching data for lat=${lat}, lng=${lng} within 2.5km...`);
                const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
                const elements = res.data.elements || [];

                const cleaned = elements.map(el => {
                    const tags = el.tags || {};
                    const rawType = tags.amenity || tags.shop || tags.leisure || tags.landuse || "place";
                    return {
                        id: el.id,
                        lat: el.lat || el.center?.lat,
                        lng: el.lon || el.center?.lon,
                        type: rawType.toUpperCase().replace(/ /g, '_'),
                        rawType: rawType.replace(/_/g, ' '),
                        name: tags.name || `Unnamed ${rawType.replace(/_/g, ' ')}`,
                        tags: tags
                    };
                }).filter(item => item.lat != null && item.lng != null);

                allInstitutions = [...allInstitutions, ...cleaned];
            }

            // De-duplicate institutions by ID
            const unique = Array.from(new Map(allInstitutions.map(item => [item.id, item])).values());
            console.log(`Scanner: ${unique.length} unique nodes total across all points.`);
            setInstitutions(unique);
        } catch (err) {
            if (!axios.isCancel(err)) console.error("Overpass error:", err);
        } finally {
            setIsScanning(false);
            setLoading(false);
        }
    };

    // --- 1. Fetch Heatmap Data (Backend - Aggregated for all Outlets) ---
    const fetchHeatmap = async () => {
        setLoading(true);
        try {
            const locationsToScan = [...userLocations];
            if (activePointer) locationsToScan.push(activePointer);

            let allFeatures = [];

            for (const loc of locationsToScan) {
                const lat = loc.lat;
                const lng = loc.lng || loc.lon;
                if (lat == null || lng == null) continue;

                const params = new URLSearchParams({ segment: selectedCategory, lat, lon: lng });
                const refLat = first?.lat || MUMBAI_CENTER.lat;
                const refLng = first?.lng || MUMBAI_CENTER.lng;

                params.set('lat', refLat);
                params.set('lon', refLng);

                const res = await axios.get(`http://localhost:8000/heatmap?${params.toString()}`);
                if (res.data?.features) {
                    allFeatures = [...allFeatures, ...res.data.features];
                }
            }

            // De-duplicate features if necessary (though overlapping is often okay for heatmap)
            setPoints(allFeatures);
        } catch (error) {
            console.error("Backend offline or heatmap error:", error);
        } finally {
            setLoading(false);
        }
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

    // --- 2. Handle Map Clicks: add pin + scan surroundings ---
    const handleMapClick = async (lat, lng) => {
        const newPin = { lat, lng, name: `Pin ${customPins.length + 1}`, id: `custom-${Date.now()}` };

        // 1. Update UI state immediately
        setActivePointer({ lat, lng });
        setCustomPins(prev => {
            const key = `${lat.toFixed(5)}-${lng.toFixed(5)}`;
            if (prev.some(p => `${p.lat.toFixed(5)}-${p.lng?.toFixed(5) || p.lon?.toFixed(5)}` === key)) return prev;
            return [...prev, newPin];
        });

        // 2. Trigger Demographic Scan (Institutions)
        await runOverpassScan([...userLocations, newPin]);

        // 3. Trigger Heatmap Refresh (Demand signals)
        await fetchHeatmap();
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
                handleMapClick(parseFloat(lat), parseFloat(lon));
            } else {
                alert("Location not found. Try adding a city name.");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const outletsRes = await api.get('/outlets').catch(() => ({ data: [] }));
                const outlets = outletsRes.data || [];
                const withCoords = outlets.filter(o => o.lat != null && (o.lon != null || o.lng != null));
                if (withCoords.length > 0) {
                    const formattedOutlets = withCoords.map(o => ({
                        lat: o.lat,
                        lng: o.lon || o.lng,
                        name: o.location || o.geo_display_name || `Outlet ${o.id}`,
                        id: `outlet-${o.id}`
                    }));
                    if (!cancelled) setUserLocations(formattedOutlets);

                    const first = formattedOutlets[0];
                    if (!cancelled) {
                        setShopLocation(first);
                        setActivePointer(first);
                    }
                    // Bulk scan ALL outlets
                    await runOverpassScan(formattedOutlets);
                    if (cancelled) return;
                } else {
                    if (!cancelled) {
                        setShopLocation(MUMBAI_CENTER);
                        setActivePointer(MUMBAI_CENTER);
                    }
                    await runOverpassScan([MUMBAI_CENTER]);
                    if (cancelled) return;
                }
                const params = new URLSearchParams({ segment: selectedCategory });
                if (lat != null && lng != null) {
                    params.set('lat', lat);
                    params.set('lon', lng);
                }
                const res = await axios.get(`http://localhost:8000/heatmap?${params.toString()}`);
                if (!cancelled) {
                    setPoints(res.data.features);
                    if (res.data.shop_location) {
                        const sl = res.data.shop_location;
                        setShopLocation({ lat: sl.lat, lng: sl.lon || sl.lng });
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    console.error("Initial load failure:", e);
                    setPoints([]);
                    setShopLocation(s => s || MUMBAI_CENTER);
                    setActivePointer(p => p || MUMBAI_CENTER);
                }
            }
            if (!cancelled) {
                setLoading(false);
                setIsScanning(false);
            }
            fetchAIInterpretation();
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            return;
        }
        fetchHeatmap();
        fetchAIInterpretation();
    }, [selectedCategory]);

    return (
        <div className="flex flex-col h-screen p-8 space-y-4">
            <header className="flex justify-between items-center pr-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        Geospatial <span className="text-blue-500">Synth</span>
                        <Radar className="text-blue-500 animate-pulse" size={32} />
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Active Forecast Domain:</span>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-transparent border-none text-blue-500 text-[11px] font-black uppercase outline-none cursor-pointer hover:text-blue-400 transition-all appearance-none pr-4 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%233b82f6%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_center] bg-[length:1em] bg-no-repeat"
                        >
                            <option value="Groceries" className="bg-[#0B1121]">Groceries</option>
                            <option value="Electronics" className="bg-[#0B1121]">Electronics</option>
                            <option value="Furniture" className="bg-[#0B1121]">Furniture</option>
                            <option value="Electrical_Appliances" className="bg-[#0B1121]">Electrical Appliances</option>
                            <option value="Flowers" className="bg-[#0B1121]">Flowers</option>
                        </select>
                    </div>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-80 focus:outline-none focus:border-blue-500/50 transition-all text-white font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e.target.value)}
                    />
                    <MapPin className="absolute right-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                </div>
            </header>

            <div className="flex-1 relative glass-card rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                {(loading || isScanning) && (
                    <div className="absolute inset-0 z-[1001] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">
                                {isScanning ? "Neural Scanning..." : "Syncing Map Nodes..."}
                            </span>
                        </div>
                    </div>
                )}

                <LeafletMap
                    points={points}
                    shopLocation={shopLocation}
                    outlets={userLocations}
                    customPins={customPins}
                    onMapClick={handleMapClick}
                    activePointer={activePointer}
                    institutions={institutions}
                    colorMapping={colorMapping}
                />

                <div className="absolute bottom-6 right-6 z-[1000] bg-slate-950/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl w-56 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border-b border-white/5 pb-2">Intelligence Legend</h4>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase">Micro-Demographics</p>
                            {CATEGORIES.map(cat => (
                                <div key={cat.label} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color, border: '1.5px solid rgba(255,255,255,0.2)' }} />
                                    <span className="text-[10px] font-bold text-slate-300">{cat.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <p className="text-[8px] font-black text-slate-500 uppercase">Prophetic Signals</p>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                <span className="text-[10px] font-bold text-emerald-400">Surge Potential</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
                                <span className="text-[10px] font-bold text-rose-400">Market Fatigue</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none max-h-[60%] overflow-hidden">
                    <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg flex items-center gap-3 pointer-events-auto">
                        <Layers size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Nodes Detected: {institutions.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeospatialMap;
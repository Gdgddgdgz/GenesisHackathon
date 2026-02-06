import React, { useState, useEffect } from 'react';
import LeafletMap from '../components/LeafletMap';
import { MapPin, Info, Layers, Crosshair, Radar, GraduationCap, Church, Library } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const GeospatialMap = () => {
    const [points, setPoints] = useState([]);
    const [shopLocation, setShopLocation] = useState(null);
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [loading, setLoading] = useState(true);
    const [segment, setSegment] = useState('apparel');

    // --- NEW STATE FOR INSTITUTIONS ---
    const [institutions, setInstitutions] = useState([]);
    const [activePointer, setActivePointer] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

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
            console.error("Local Backend Error (CORS or Server Down):", error);
        }
        setLoading(false);
    };

    // --- NEW CLICK HANDLER ---
    const handleMapClick = async (lat, lng) => {
        setActivePointer({ lat, lng });
        setIsScanning(true);

        // Querying public OpenStreetMap data for institutions within 2km
        const query = `[out:json][timeout:25];
        (
        node["amenity"](around:5000,${lat},${lng});
        way["amenity"](around:5000,${lat},${lng});
        rel["amenity"](around:5000,${lat},${lng});
        );
        out center;`;

        try {
            const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            setInstitutions(res.data.elements || []);
        } catch (err) {
            console.error("Overpass API Error:", err);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const regRes = await axios.get('http://localhost:8000/regions');
                setRegions(regRes.data);
                fetchHeatmap('', segment);
            } catch (err) {
                console.error("Init Error:", err);
                setLoading(false); // Stop loading even if backend fails
            }
        };
        init();
    }, []);

    return (
        <div className="space-y-8 pb-20 h-full flex flex-col">
            {/* Header Area (Same as before) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                        Geospatial <span className="text-blue-500">Intel</span>
                        <Radar className="text-blue-500 animate-pulse" size={32} />
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Real-time demand and institutional clusters</p>
                </div>
                {/* ... existing select inputs ... */}
            </div>

            {/* Main Content: Map + Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 glass-card p-2 overflow-hidden relative border border-[var(--border-glass)]"
                >
                    {(loading || isScanning) && (
                        <div className="absolute inset-0 z-[1000] bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                                {isScanning ? "Scanning Institutions..." : "Neutralizing Data Layer..."}
                            </p>
                        </div>
                    )}

                    <div className="w-full h-full rounded-xl overflow-hidden ">
                        <LeafletMap
                            points={points}
                            shopLocation={shopLocation}
                            onMapClick={handleMapClick}
                            activePointer={activePointer}
                            institutions={institutions}
                        />
                    </div>
                </motion.div>

                {/* --- NEW SIDEBAR COLUMN --- */}
                <div className="w-full lg:w-80 space-y-4 h-full">
                    <div className="glass-card p-5 border-[var(--border-glass)] bg-[var(--bg-card)] h-full overflow-y-auto max-h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                <Layers size={14} /> Vicinity Meta
                            </h3>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                {institutions.length} Results
                            </span>
                        </div>

                        <div className="space-y-3">
                            {institutions.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <MapPin className="mx-auto mb-2" size={24} />
                                    <p className="text-xs font-medium italic">Click map to gather data</p>
                                </div>
                            ) : (
                                institutions.map((inst, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all">
                                        <div className="flex gap-3">
                                            {inst.tags.amenity === 'place_of_worship' ? <Church size={16} className="text-purple-400" /> : <GraduationCap size={16} className="text-amber-400" />}
                                            <div className="flex-1">
                                                <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1">{inst.tags.name || 'Unnamed'}</h4>
                                                <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">{inst.tags.amenity.replace('_', ' ')}</p>
                                                {inst.tags.religion && <span className="text-[8px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded mt-2 inline-block border border-purple-500/20">{inst.tags.religion}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeospatialMap;
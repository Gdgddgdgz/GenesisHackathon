import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { MapPin, Target, Layers, Copy, CheckCircle, Package, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

// IMPORTANT: Add your Mapbox token to .env as VITE_MAPBOX_TOKEN
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNsZGVtbzEyMzQ1NjczcG1jZGVtbzEyMzQ1In0.demo';

const MapIntel = () => {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const anchorRef = useRef(null);
    const loadingRef = useRef(null);

    const [anchor, setAnchor] = useState(null);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [hoveredCoords, setHoveredCoords] = useState(null);
    const [copiedCoords, setCopiedCoords] = useState(false);
    const [lowStockItems, setLowStockItems] = useState([]);

    // Keep refs in sync with state for access in event listeners
    useEffect(() => { anchorRef.current = anchor; }, [anchor]);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    useEffect(() => {
        fetchLowStock();
    }, []);

    const fetchLowStock = async () => {
        try {
            const res = await api.get('/inventory/products');
            const sorted = res.data
                .filter(p => p.current_stock < 50)
                .sort((a, b) => a.current_stock - b.current_stock);
            setLowStockItems(sorted.slice(0, 5));
        } catch (err) {
            console.error('Low stock fetch error:', err);
        }
    };

    const handleTransactionComplete = () => {
        if (anchorRef.current) {
            performAnalysis(anchorRef.current.lat, anchorRef.current.lng);
        }
        fetchLowStock();
    };

    useEffect(() => {
        if (mapRef.current) return;

        const timer = setTimeout(() => {
            try {
                mapRef.current = new mapboxgl.Map({
                    container: mapContainer.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [78.9629, 20.5937],
                    zoom: 4
                });

                mapRef.current.on('load', () => {
                    if (!mapRef.current) return;

                    mapRef.current.addSource('radius-circle', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    mapRef.current.addSource('zones', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    mapRef.current.addSource('zone-polygons', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    mapRef.current.addLayer({
                        id: 'radius-circle-fill',
                        type: 'fill',
                        source: 'radius-circle',
                        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }
                    });

                    mapRef.current.addLayer({
                        id: 'radius-circle-outline',
                        type: 'line',
                        source: 'radius-circle',
                        paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [2, 2] }
                    });

                    mapRef.current.addLayer({
                        id: 'zone-polygons-fill',
                        type: 'fill',
                        source: 'zone-polygons',
                        paint: {
                            'fill-color': [
                                'match', ['get', 'type'],
                                'Residential', '#10b981',
                                'Commercial', '#f59e0b',
                                'Institutional', '#3b82f6',
                                'Mixed-Use', '#8b5cf6',
                                'Industrial', '#6b7280',
                                '#3b82f6'
                            ],
                            'fill-opacity': 0.25
                        }
                    });

                    mapRef.current.addLayer({
                        id: 'zone-polygons-outline',
                        type: 'line',
                        source: 'zone-polygons',
                        paint: {
                            'line-color': [
                                'match', ['get', 'type'],
                                'Residential', '#10b981',
                                'Commercial', '#f59e0b',
                                'Institutional', '#3b82f6',
                                'Mixed-Use', '#8b5cf6',
                                'Industrial', '#6b7280',
                                '#3b82f6'
                            ],
                            'line-width': 2,
                            'line-opacity': 0.8
                        }
                    });

                    mapRef.current.addLayer({
                        id: 'zone-markers',
                        type: 'circle',
                        source: 'zones',
                        paint: {
                            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 12],
                            'circle-color': [
                                'match', ['get', 'type'],
                                'Residential', '#10b981',
                                'Commercial', '#f59e0b',
                                'Institutional', '#3b82f6',
                                'Mixed-Use', '#8b5cf6',
                                'Industrial', '#6b7280',
                                '#3b82f6'
                            ],
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff'
                        }
                    });

                    mapRef.current.on('click', 'zone-markers', async (e) => {
                        const feature = e.features[0];
                        const props = feature.properties;

                        setSelectedZone({
                            ...props,
                            name: 'Resolving precise location...',
                            insight: 'Analyzing micro-location data...'
                        });

                        mapRef.current.flyTo({
                            center: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
                            zoom: 13,
                            essential: true
                        });

                        try {
                            const currentAnchor = anchorRef.current;
                            if (!currentAnchor) return;

                            const res = await api.post('/intel/detailed-insight', {
                                lat: feature.geometry.coordinates[1],
                                lng: feature.geometry.coordinates[0],
                                anchorLat: currentAnchor.lat,
                                anchorLng: currentAnchor.lng,
                                radius: 15,
                                zoneType: props.type,
                                zoneContext: props.community_context,
                                distance: props.distance
                            });

                            if (res.data) {
                                setSelectedZone({
                                    ...props,
                                    name: res.data.locationName,
                                    insight: res.data.insight,
                                    verified: true
                                });
                            }
                        } catch (error) {
                            console.error('Failed to resolve zone details:', error);
                            setSelectedZone(props);
                        }
                    });

                    mapRef.current.on('click', 'zone-polygons-fill', (e) => {
                        setSelectedZone(e.features[0].properties);
                    });

                    // Add click listener ONLY after map is loaded and sources are ready
                    mapRef.current.on('click', handleMapClick);
                });

                mapRef.current.on('mousemove', (e) => {
                    setHoveredCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
                });

                mapRef.current.on('error', (e) => {
                    console.error('Mapbox error:', e);
                });

            } catch (error) {
                console.error('Failed to create Mapbox map:', error);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const currentMarker = useRef(null);

    const performAnalysis = async (lat, lng) => {
        if (!mapRef.current || !mapRef.current.loaded()) return;

        try {
            const response = await api.post('/intel/analyze', { lat, lng, radius: 15 });
            const { zones: analyzedZones } = response.data;

            setZones(analyzedZones);

            const zoneFeatures = analyzedZones.map(zone => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [zone.lng, zone.lat] },
                properties: {
                    id: zone.id,
                    name: zone.name,
                    type: zone.type,
                    distance: zone.distance.toFixed(1),
                    insight: zone.insight
                }
            }));

            const zonePolygons = analyzedZones.map(zone => {
                const zoneCircle = turf.circle([zone.lng, zone.lat], 0.5, { steps: 32, units: 'kilometers' });
                return {
                    ...zoneCircle,
                    properties: {
                        id: zone.id,
                        name: zone.name,
                        type: zone.type,
                        distance: zone.distance.toFixed(1),
                        insight: zone.insight
                    }
                };
            });

            const zonesSource = mapRef.current.getSource('zones');
            if (zonesSource) {
                zonesSource.setData({
                    type: 'FeatureCollection',
                    features: zoneFeatures
                });
            }

            const polygonSource = mapRef.current.getSource('zone-polygons');
            if (polygonSource) {
                polygonSource.setData({
                    type: 'FeatureCollection',
                    features: zonePolygons
                });
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            if (!loadingRef.current) alert('Failed to refresh data. Details: ' + error.message);
        }
    };

    const handleMapClick = async (e) => {
        if (!mapRef.current || !mapRef.current.loaded()) return;

        // Allow clicks on canvas and markers (which are siblings of canvas in the container)
        const target = e.originalEvent?.target;
        const isMapPart = target?.closest('.mapboxgl-map');
        if (!isMapPart) return;

        const { lng, lat } = e.lngLat;

        setAnchor({ lat, lng });
        setLoading(true);
        setSelectedZone(null);

        const center = [lng, lat];
        const circle = turf.circle(center, 15, { steps: 64, units: 'kilometers' });

        const radiusSource = mapRef.current.getSource('radius-circle');
        if (radiusSource) {
            radiusSource.setData(circle);
        }

        if (currentMarker.current) {
            currentMarker.current.remove();
        }

        const marker = new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);

        // Disable pointer events so clicks pass through to the map and don't show a hand cursor
        marker.getElement().style.pointerEvents = 'none';

        currentMarker.current = marker;

        try {
            await performAnalysis(lat, lng);

            // Final safety check before interacting with map instance
            if (!mapRef.current) return;

            const bbox = turf.bbox(circle);
            // Mapbox fitBounds expects [ [minLng, minLat], [maxLng, maxLat] ]
            const bounds = [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
            ];
            mapRef.current.fitBounds(bounds, { padding: 50 });
        } catch (error) {
            console.error('Initial analysis failed:', error);
            // Avoid alerting if the map was intentionally cleared/unmounted
            if (mapRef.current) {
                alert(`Analysis Error: ${error.message || 'Check connection to intelligence service'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const copyCoordinates = (lat, lng) => {
        const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        navigator.clipboard.writeText(coordString);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2000);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapContainer} className="absolute inset-0" />

                {/* Instructions Overlay */}
                {!anchor && (
                    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm border border-slate-200 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="text-blue-600" size={20} />
                            <h3 className="font-bold text-slate-800">Location Intelligence</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Click anywhere in India to set your anchor point. The system will analyze a <strong>15km radius</strong> around that location.
                        </p>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse flex items-center gap-2 z-20">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing location...
                    </div>
                )}

                {/* Coordinate Display */}
                {hoveredCoords && !loading && (
                    <div className="absolute bottom-4 left-4 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2 z-10">
                        <span>{hoveredCoords.lat.toFixed(6)}, {hoveredCoords.lng.toFixed(6)}</span>
                        <button
                            onClick={() => copyCoordinates(hoveredCoords.lat, hoveredCoords.lng)}
                            className="hover:bg-slate-700 p-1 rounded"
                        >
                            {copiedCoords ? <CheckCircle size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="w-[450px] bg-slate-50 border-l border-slate-200 overflow-y-auto flex flex-col z-30 shadow-2xl">
                {!anchor ? (
                    <div className="p-8 text-center my-auto">
                        <MapPin className="mx-auto text-slate-300 mb-6" size={64} />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">No Location Selected</h3>
                        <p className="text-sm text-slate-400">Click anywhere on the map to analyze hyperlocal business intelligence.</p>
                    </div>
                ) : selectedZone ? (
                    <div className="flex-1 flex flex-col h-full bg-white">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <button
                                onClick={() => setSelectedZone(null)}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-6 hover:underline"
                            >
                                <span>←</span> Back to Discovery
                            </button>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-2xl text-slate-900 leading-tight">{selectedZone.name}</h3>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm ${selectedZone.type === 'Residential' ? 'bg-green-100 text-green-700' :
                                    selectedZone.type === 'Commercial' ? 'bg-amber-100 text-amber-700' :
                                        selectedZone.type === 'Institutional' ? 'bg-blue-100 text-blue-700' :
                                            selectedZone.type === 'Mixed-Use' ? 'bg-purple-100 text-purple-700' :
                                                'bg-slate-100 text-slate-700'
                                    }`}>
                                    {selectedZone.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Distance</p>
                                    <p className="text-lg font-black text-slate-700">{selectedZone.distance} km</p>
                                </div>
                                <div className="border-l border-slate-200 h-8"></div>
                                <div>
                                    <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Confidence</p>
                                    <p className="text-lg font-black text-blue-700">High</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-8">
                            <div>
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                                    <Target size={14} className="text-blue-500" />
                                    Dynamic Target Analysis
                                </h4>
                                <div className="bg-slate-900 p-6 rounded-2xl relative shadow-xl shadow-slate-900/20">
                                    <div className="absolute -top-2.5 -left-2 bg-blue-600 text-[9px] font-black text-white px-3 py-1 rounded uppercase tracking-tighter shadow-md">
                                        Gemini-1.5-Flash
                                    </div>
                                    <p className="text-base text-slate-100 whitespace-pre-line leading-relaxed italic font-serif">
                                        "{selectedZone.insight}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-8 space-y-10">
                                    <section>
                                        <h4 className="flex items-center justify-between font-black text-slate-800 mb-6 text-sm uppercase tracking-[0.2em]">
                                            <span className="flex items-center gap-3">
                                                <Target size={18} className="text-blue-500" />
                                                Operational Context
                                            </span>
                                        </h4>
                                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Sentiment</p>
                                            <p className="text-xl font-black text-slate-900 leading-tight mb-4">
                                                {selectedZone.type} Hub
                                            </p>
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                                <Globe size={14} className="text-blue-600" />
                                                <span className="text-xs font-black text-blue-700 uppercase tracking-wider">{selectedZone.distance} KM FROM ANCHOR</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 space-y-10">
                        {/* Anchor Header */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden ring-1 ring-slate-200">
                            <div className="absolute -right-6 -top-6 p-1 opacity-5">
                                <Target size={120} />
                            </div>
                            <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-[0.2em] mb-3">Operational Anchor</p>
                            <h3 className="font-black text-2xl text-slate-900 mb-2 leading-tight">Current Map Center</h3>
                            <p className="text-sm font-bold text-slate-400 font-mono">
                                {anchor.lat.toFixed(6)}, {anchor.lng.toFixed(6)}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">15 KM Discovery Zone Active</span>
                            </div>
                        </div>

                        {/* Inventory Simulation Link */}
                        <div className="p-6 bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                            <div className="relative z-10">
                                <h4 className="font-black text-white text-lg mb-2">Inventory Simulation</h4>
                                <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">Simulate transactions & analyze supply chain resilience in this radius.</p>
                                <button
                                    onClick={() => window.location.href = '/billing'}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30"
                                >
                                    Launch Virtual Counter
                                </button>
                            </div>
                        </div>

                        <section>
                            <h4 className="flex items-center justify-between font-black text-slate-800 mb-6 text-sm uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-3">
                                    <Package size={18} className="text-blue-500" />
                                    Inventory Pulse
                                </span>
                                <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black">{lowStockItems.length} ALERTS</span>
                            </h4>
                            <div className="space-y-4">
                                {lowStockItems.length === 0 ? (
                                    <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                        <CheckCircle size={40} className="mb-3 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest">Global Stock Healthy</p>
                                    </div>
                                ) : (
                                    lowStockItems.map(item => (
                                        <div key={item.id} className="bg-white border-2 border-slate-100 p-8 rounded-2xl flex items-center justify-between shadow-sm hover:border-amber-200 transition-all group hover:shadow-xl hover:shadow-amber-100">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                                    <TrendingDown size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900 leading-tight mb-1">{item.name}</p>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Current: <span className="text-amber-600 font-black">{item.current_stock} UTs</span></p>
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 text-amber-600 text-xs font-black px-4 py-2 rounded-xl uppercase border border-amber-100">
                                                Low
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Zones List */}
                        <section className="bg-white/50 p-8 rounded-3xl border border-slate-200/50">
                            <h4 className="font-black text-slate-800 mb-6 text-sm uppercase tracking-[0.2em] flex justify-between items-center">
                                Hyperlocal Zones
                                <span className="text-xs font-black bg-blue-600 text-white px-3 py-1 rounded-full">{zones.length}</span>
                            </h4>

                            {zones.length === 0 ? (
                                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-8 text-center shadow-inner">
                                    <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4 opacity-50" />
                                    <p className="text-base font-black text-amber-900 mb-2">Low Spatial Density</p>
                                    <p className="text-xs text-amber-700 font-medium leading-relaxed uppercase tracking-tight">
                                        No major commercial clusters detected here. Analysis limited to regional patterns.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {zones.map(zone => (
                                        <button
                                            key={zone.id}
                                            onClick={() => setSelectedZone({ ...zone, distance: (typeof zone.distance === 'number' ? zone.distance.toFixed(1) : zone.distance) })}
                                            className="bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 text-left transition-all group active:scale-[0.98]"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-4">{zone.name}</p>
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">{typeof zone.distance === 'number' ? zone.distance.toFixed(1) : zone.distance} km</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${zone.type === 'Residential' ? 'bg-green-500' :
                                                    zone.type === 'Commercial' ? 'bg-amber-500' :
                                                        zone.type === 'Institutional' ? 'bg-blue-500' :
                                                            zone.type === 'Mixed-Use' ? 'bg-purple-500' :
                                                                'bg-slate-500'
                                                    }`}></div>
                                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{zone.type}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapIntel;

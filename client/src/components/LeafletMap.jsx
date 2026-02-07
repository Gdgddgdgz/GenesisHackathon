import React from 'react';
import { useMap, MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. HELPERS (Keep these at the top, outside the component) ---

// Fix for Leaflet marker icons
const DefaultIcon = L.icon({
    iconUrl: 'http://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'http://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Distinctive Emerald/Green Marker for Permanent Outlets
const PERMANENT_OUTLET_ICON = L.divIcon({
    className: "custom-permanent-marker",
    html: `
        <div style="
            background-color: #10b981;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 11px;
                height: 11px;
                background-color: white;
                border-radius: 50%;
                transform: rotate(45deg);
                box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.1);
            "></div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Helper to get color based on the amenity type
// Helper to get color based on the amenity type
const getMarkerStyle = (tags = {}) => {
    if (tags.amenity === 'place_of_worship') return { color: '#A855F7', label: 'Religious' };
    if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college')
        return { color: '#F59E0B', label: 'Education' };
    if (tags.shop || tags.landuse === 'commercial' || tags.landuse === 'retail')
        return { color: '#EC4899', label: 'Commercial' };
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground')
        return { color: '#10B981', label: 'Park/Garden' };
    if (tags.landuse === 'residential') return { color: '#94A3B8', label: 'Residential' };
    return { color: '#3B82F6', label: 'Other' };
};

// Component to catch map clicks
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
    });
    return null;
};

const MapAutoCenter = ({ activePointer, shopLocation }) => {
    const map = useMap();
    React.useEffect(() => {
        if (activePointer?.lat != null && (activePointer?.lng != null || activePointer?.lon != null)) {
            const lng = activePointer.lng ?? activePointer.lon;
            map.flyTo([activePointer.lat, lng], 14, { duration: 1.5 });
        } else if (shopLocation?.lat != null && (shopLocation?.lng != null || shopLocation?.lon != null)) {
            const lng = shopLocation.lng ?? shopLocation.lon;
            map.flyTo([shopLocation.lat, lng], 13, { duration: 1 });
        }
    }, [activePointer, shopLocation, map]);
    return null;
};

// --- 2. MAIN COMPONENT ---

const LeafletMap = ({ points, shopLocation, outlets = [], customPins = [], onMapClick, activePointer, institutions, colorMapping }) => {
    const defaultCenter = [19.0760, 72.8777]; // Mumbai
    const center = shopLocation?.lat != null && (shopLocation?.lng != null || shopLocation?.lon != null)
        ? [shopLocation.lat, shopLocation.lng ?? shopLocation.lon]
        : defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            className="z-0"
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
            {/* Clean, minimalist tile server */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <MapClickHandler onMapClick={onMapClick} />

            <MapAutoCenter activePointer={activePointer} shopLocation={shopLocation} />

            {/* 1. Permanent Outlets (Emerald Green styling) */}
            {outlets.map((pin, idx) => {
                const lat = pin.lat;
                const lng = pin.lng ?? pin.lon;
                if (lat == null || lng == null) return null;
                return (
                    <Marker
                        key={pin.id || `outlet-${idx}`}
                        position={[lat, lng]}
                        icon={PERMANENT_OUTLET_ICON}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Permanent Outlet</p>
                                <p className="text-xs font-bold text-slate-700">{pin.name || 'Saved Store'}</p>
                            </div>
                        </Popup>
                        <Tooltip direction="top" offset={[0, -32]} opacity={1} permanent={false}>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white/90 px-2 py-0.5 rounded border border-emerald-500/30 shadow-sm">
                                {pin.name || 'OUTLET'}
                            </span>
                        </Tooltip>
                    </Marker>
                );
            })}

            {/* 2. Custom Temporary Pins (Standard styling) */}
            {customPins.map((pin, idx) => {
                const lat = pin.lat;
                const lng = pin.lng ?? pin.lon;
                if (lat == null || lng == null) return null;
                return (
                    <Marker key={pin.id || `custom-${idx}`} position={[lat, lng]}>
                        <Popup>
                            <span className="text-xs font-bold text-slate-700">{pin.name || 'Selected point'}</span>
                        </Popup>
                        <Tooltip direction="top" offset={[0, -5]} opacity={1} sticky>
                            <span className="text-xs font-bold text-blue-600">{pin.name || 'SCAN FOCUS'}</span>
                        </Tooltip>
                    </Marker>
                );
            })}

            {/* A. Active click pointer + 2.5km Tactical Scan Boundary */}
            {activePointer?.lat != null && (activePointer?.lng != null || activePointer?.lon != null) && (
                <>
                    <Marker position={[activePointer.lat, activePointer.lng ?? activePointer.lon]} />
                    <Circle
                        center={[activePointer.lat, activePointer.lng ?? activePointer.lon]}
                        radius={2500} // 2.5km Focus Boundary
                        pathOptions={{
                            color: '#3b82f6',
                            fillColor: '#3b82f6',
                            fillOpacity: 0.1, // Increased visibility
                            dashArray: '10, 15',
                            weight: 2, // Thicker border
                            opacity: 0.8 // More prominent dashed line
                        }}
                    />
                </>
            )}

            {/* B. Amenities / Institutions (Restricted to 2.5km of ANY ref point) */}
            {institutions.map((inst, idx) => {
                const lat = inst.lat;
                const lng = inst.lng;
                if (lat == null || lng == null) return null;

                // Check distance against ALL possible reference points (outlets + active pointer)
                const refPoints = [...outlets, activePointer].filter(p => p && p.lat != null && (p.lng != null || p.lon != null));
                const isWithinRange = refPoints.some(ref => {
                    const rLat = ref.lat;
                    const rLng = ref.lng ?? ref.lon;
                    const latDiff = (lat - rLat) * 111;
                    const lonDiff = (lng - rLng) * 105; // Accuracy fix for Mumbai
                    const distKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                    return distKm <= 2.55; // 50m tolerance for boundary nodes
                });

                if (!isWithinRange) return null;

                const tags = inst.tags || {};
                let fillColor = '#94A3B8'; // Default Residential/Other

                if (tags.amenity === 'place_of_worship') fillColor = '#A855F7';
                else if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') fillColor = '#F59E0B';
                else if (tags.shop || tags.landuse === 'commercial' || tags.landuse === 'retail') fillColor = '#EC4899';
                else if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground') fillColor = '#10B981';

                return (
                    <Circle
                        key={`inst-${inst.id || idx}`}
                        center={[lat, lng]}
                        radius={40} // Reverted to original dense size
                        pathOptions={{
                            fillColor: fillColor,
                            color: 'transparent',
                            fillOpacity: 0.8,
                            interactive: true
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -5]} opacity={1} sticky>
                            <span className="text-[10px] font-bold text-slate-800 tracking-tight">
                                {inst.name || inst.rawType || 'Place'}
                            </span>
                        </Tooltip>
                    </Circle>
                );
            })}

            {/* C. Tactical Heatmap Circles (Limited to 2.5km of ANY ref point) */}
            {points.map((heatPoint, idx) => {
                if (!heatPoint.geometry?.coordinates) return null;
                const coords = [heatPoint.geometry.coordinates[1], heatPoint.geometry.coordinates[0]];

                const refPoints = [...outlets, activePointer].filter(p => p && p.lat != null && (p.lng != null || p.lon != null));
                const isWithinRange = refPoints.some(ref => {
                    const rLat = ref.lat;
                    const rLng = ref.lng ?? ref.lon;
                    const latDiff = (coords[0] - rLat) * 111;
                    const lonDiff = (coords[1] - rLng) * 105; // Accuracy fix
                    const distKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
                    return distKm <= 2.55;
                });

                if (!isWithinRange) return null;

                // 2. Multiplier-based logic (removing the 4 blue circles entirely)
                const multiplier = heatPoint.properties.multiplier || 1.0;
                if (multiplier < 1.1) return null;

                let zoneColor = '#10B981'; // Green (Prophetic Surge Potential as seen in ref legend)
                if (multiplier >= 1.3) zoneColor = '#ef4444'; // Red (Market Fatigue)

                return (
                    <Circle
                        key={`heat-${idx}`}
                        center={coords}
                        radius={heatPoint.properties.radius || 1000}
                        pathOptions={{
                            fillColor: zoneColor,
                            color: zoneColor,
                            weight: 2,
                            dashArray: '10, 15', // Matches dashed border in reference
                            fillOpacity: 0.2
                        }}
                    />
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;
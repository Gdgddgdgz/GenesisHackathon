import React from 'react';
import { useMap, MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. HELPERS (Keep these at the top, outside the component) ---

// Fix for Leaflet marker icons
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

const MapAutoCenter = ({ activePointer }) => {
    const map = useMap();
    React.useEffect(() => {
        if (activePointer) {
            map.flyTo([activePointer.lat, activePointer.lng], 14, {
                duration: 1.5
            });
        }
    }, [activePointer, map]);
    return null;
};

// --- 2. MAIN COMPONENT ---

const LeafletMap = ({ points, shopLocation, onMapClick, activePointer, institutions }) => {
    const defaultCenter = [19.0760, 72.8777]; // Mumbai
    const center = shopLocation ? [shopLocation.lat, shopLocation.lon] : defaultCenter;

    return (
        <MapContainer 
            center={center} 
            zoom={13} 
            scrollWheelZoom={true} 
            className="h-full w-full rounded-xl z-0"
        >
            {/* Clean, minimalist tile server */}
            <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapClickHandler onMapClick={onMapClick} />

            <MapAutoCenter activePointer={activePointer} />

            {/* A. User's Search Center (The Scan Area) */}
            {activePointer && (
                <>
                    <Marker position={[activePointer.lat, activePointer.lng]} />
                    <Circle 
                        center={[activePointer.lat, activePointer.lng]} 
                        radius={5000} // 5km Radius
                        pathOptions={{ color: '#3b82f6', fillOpacity: 0.05, dashArray: '10, 10', weight: 1 }}
                    />
                </>
            )}

            {/* B. Amenities / Institutions */}
            {institutions.map((inst, idx) => {
                const lat = inst.lat || inst.center?.lat;
                const lon = inst.lon || inst.center?.lon;
                if (!lat || !lon) return null;

                const style = getMarkerStyle(inst.tags);
                const typeLabel = (inst.tags?.amenity || inst.tags?.shop || inst.tags?.leisure || inst.tags?.landuse || "Place")
                    .replace(/_/g, ' ');

                return (
                    <Circle 
                        key={`inst-${inst.id || idx}`}
                        center={[lat, lon]}
                        radius={70} // Size of the "tiny dot"
                        pathOptions={{ 
                            fillColor: style.color, 
                            color: 'white', 
                            weight: 1, 
                            fillOpacity: 0.9,
                            interactive: true // Ensures hover events work
                        }}
                    >
                        {/* NEW: Tooltip for Hover functionality */}
                        <Tooltip 
                            direction="top" 
                            offset={[0, -5]} 
                            opacity={1} 
                            sticky={true} // Follows the mouse slightly
                        >
                            <div className="px-1 py-0.5">
                                <span className="block text-[8px] font-black uppercase text-blue-600 leading-none mb-1">
                                    {typeLabel}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                    {inst.name}
                                </span>
                            </div>
                        </Tooltip>

                        {/* Keep the Popup for mobile users who can't "hover" */}
                        <Popup>
                            <div className="text-xs">
                                <span className="font-black uppercase text-blue-500 block text-[9px]">{typeLabel}</span>
                                <span className="font-bold text-slate-700">{inst.name}</span>
                            </div>
                        </Popup>
                    </Circle>
                );
            })}

            {/* C. Demand Heatmap Circles */}
            {points.map((point, idx) => {
                if (!point.geometry?.coordinates) return null;
                const coords = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
                const multiplier = point.properties.multiplier || 1.0;
                let zoneColor = multiplier >= 1.3 ? '#ef4444' : multiplier >= 1.1 ? '#f59e0b' : '#3b82f6';

                return (
                    <Circle
                        key={`heat-${idx}`}
                        center={coords}
                        radius={point.properties.radius || 300}
                        pathOptions={{ fillColor: zoneColor, color: 'transparent', fillOpacity: 0.4 }}
                    />
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;
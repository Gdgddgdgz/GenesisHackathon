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
        if (activePointer) {
            map.flyTo([activePointer.lat, activePointer.lng], 14, { duration: 1.5 });
        } else if (shopLocation) {
            map.flyTo([shopLocation.lat, shopLocation.lon], 13, { duration: 1 });
        }
    }, [activePointer, shopLocation, map]);
    return null;
};

// --- 2. MAIN COMPONENT ---

const LeafletMap = ({ points, shopLocation, userPins = [], onMapClick, activePointer, institutions, colorMapping }) => {
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

            <MapAutoCenter activePointer={activePointer} shopLocation={shopLocation} />

            {/* User outlet + custom pins (always visible) */}
            {userPins.map((pin, idx) => (
                <Marker key={pin.id || `pin-${idx}`} position={[pin.lat, pin.lon]}>
                    <Popup>
                        <span className="text-xs font-bold text-slate-700">{pin.name || 'Your location'}</span>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -5]} opacity={1} sticky>
                        <span className="text-xs font-bold text-blue-600">{pin.name || 'Your location'}</span>
                    </Tooltip>
                </Marker>
            ))}

            {/* A. Active click / scan center (circle) */}
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
                        {/* Tooltip for Hover functionality */}
                        <Tooltip
                            direction="top"
                            offset={[0, -5]}
                            opacity={1}
                            sticky={true}
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

            {/* C. Demand Heatmap Circles (Semantic Zone Analysis) */}
            {points.map((point, idx) => {
                if (!point.geometry?.coordinates) return null;
                const coords = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
                const refPoint = activePointer || shopLocation;
                if (!refPoint) return null;

                // Radius Clipping (relative to active pin or shop location)
                const distKm = Math.sqrt(
                    Math.pow((coords[0] - refPoint.lat) * 111, 2) +
                    Math.pow((coords[1] - refPoint.lon) * 85, 2)
                );
                if (distKm > 5) return null;

                // --- 1. SEMANTIC CLASSIFICATION LOGIC ---
                const radius = point.properties.radius || 1000;
                let purpleCount = 0;
                let greenCount = 0;
                let greyCount = 0;

                institutions.forEach(inst => {
                    const iLat = inst.lat || inst.center?.lat;
                    const iLon = inst.lon || inst.center?.lon;
                    if (!iLat || !iLon) return;

                    const dLat = (iLat - coords[0]) * 111000;
                    const dLon = (iLon - coords[1]) * 85000;
                    const distM = Math.sqrt(dLat * dLat + dLon * dLon);

                    if (distM <= radius) {
                        const style = getMarkerStyle(inst.tags);
                        if (style.color === '#A855F7') purpleCount++;
                        if (style.color === '#10B981' || style.color === '#EC4899') greenCount++;
                        if (style.color === '#94A3B8') greyCount++;
                    }
                });

                let inferredProfile = "INDUSTRIAL"; // Default
                if (purpleCount >= 20) {
                    inferredProfile = "RESIDENTIAL";
                } else if (purpleCount > greenCount && purpleCount > greyCount) {
                    inferredProfile = "RESIDENTIAL";
                } else if (greenCount > greyCount && greenCount > purpleCount) {
                    inferredProfile = "COMMERCIAL";
                } else {
                    inferredProfile = "INDUSTRIAL";
                }


                // --- 2. FORECAST MAPPING (Dynamic & Non-Arbitrary) ---
                let tintColor = 'transparent';
                let tintOpacity = 0;

                if (colorMapping && colorMapping.affected_zones) {
                    const affected = colorMapping.affected_zones.map(z => z.toUpperCase());

                    // Match inferred profile against AI affected zones
                    // Adding RETAIL as a match for Commercial areas
                    const isAffected = affected.includes(inferredProfile) ||
                        (inferredProfile === "COMMERCIAL" && affected.includes("RETAIL"));

                    if (isAffected) {
                        tintColor = colorMapping.color_for_affected_zones === 'green' ? '#10b981' : '#ef4444';
                        tintOpacity = 0.25;
                    } else {
                        // If not affected by the specific surge, use the "other" color (usually Red for risk/neutral)
                        tintColor = colorMapping.color_for_other_zones === 'red' ? '#ef4444' : '#10b981';
                        tintOpacity = 0.2;
                    }
                }

                const zoneColors = {
                    'RESIDENTIAL': '#3b82f6',
                    'COMMERCIAL': '#ec4899',
                    'INDUSTRIAL': '#94a3b8'
                };
                const baseColor = zoneColors[inferredProfile] || '#94a3b8';

                return (
                    <React.Fragment key={`zone-wrap-${idx}`}>
                        <Circle
                            center={coords}
                            radius={radius}
                            pathOptions={{
                                color: baseColor,
                                weight: 2,
                                fillOpacity: 0.05,
                                fillColor: baseColor,
                                dashArray: '5, 10'
                            }}
                        />
                        {tintColor !== 'transparent' && (
                            <Circle
                                center={coords}
                                radius={radius}
                                pathOptions={{
                                    color: 'transparent',
                                    fillColor: tintColor,
                                    fillOpacity: tintOpacity
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;
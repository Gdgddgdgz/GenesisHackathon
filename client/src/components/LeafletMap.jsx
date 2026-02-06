import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LeafletMap = ({ points, shopLocation }) => {
    // Default center (Mumbai Central) or provided shop location
    const position = shopLocation ? [shopLocation.lat, shopLocation.lon] : [19.0760, 72.8777];

    return (
        <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-xl z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Shop Location */}
            <Marker position={position}>
                <Popup>
                    <div className="font-bold">Your Shop</div>
                    <div className="text-xs text-slate-500">Kurla Central Operations</div>
                </Popup>
            </Marker>

            {points.map((point, idx) => {
                if (!point.geometry || !point.geometry.coordinates) return null;

                const coords = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
                const multiplier = point.properties.multiplier || 1.0;
                const distance = point.properties.distance || 0;

                // Unified Color Mapping: Same color -> same meaning
                let zoneColor = '#0EA5E9'; // Default Sky Blue (Stable)
                let statusLabel = 'Stable';

                if (multiplier >= 1.3) {
                    zoneColor = '#ef4444'; // Red (High Demand)
                    statusLabel = 'High Demand';
                } else if (multiplier >= 1.1) {
                    zoneColor = '#f59e0b'; // Orange/Yellow (Medium Demand)
                    statusLabel = 'Medium Demand';
                } else if (multiplier < 0.9) {
                    zoneColor = '#4338ca'; // Deep Blue (Low Demand / Deficit)
                    statusLabel = 'Low Demand';
                }

                return (
                    <div key={idx}>
                        <Circle
                            center={coords}
                            pathOptions={{
                                fillColor: zoneColor,
                                color: 'transparent',
                                fillOpacity: 0.6
                            }}
                            radius={point.properties.radius || 300}
                        />
                        <Marker position={coords}>
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                <div className="font-bold flex items-center gap-2">
                                    <span style={{ color: zoneColor }}>●</span>
                                    {point.properties.name}: {statusLabel}
                                </div>
                            </Tooltip>
                            <Popup>
                                <div className="p-2 min-w-[220px]">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 text-sm">{point.properties.name}</h4>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${statusLabel === 'High Demand' ? 'bg-red-100 text-red-700' :
                                            statusLabel === 'Medium Demand' ? 'bg-orange-100 text-orange-700' :
                                                statusLabel === 'Low Demand' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-sky-100 text-sky-700'
                                            }`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-600 mb-3 flex items-center gap-3">
                                        <span><span className="font-bold">Trend:</span> {point.properties.spike}</span>
                                        <span><span className="font-bold text-blue-600">Proximity:</span> {distance.toFixed(1)} km</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                        <p className="text-[11px] font-medium text-slate-700 leading-normal">
                                            <span className="font-bold uppercase text-[9px] block text-slate-400 mb-1">Contextual Insight:</span>
                                            {point.properties.reason}
                                        </p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    </div>
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;

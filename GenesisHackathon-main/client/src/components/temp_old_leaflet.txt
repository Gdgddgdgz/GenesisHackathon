import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- NEW COMPONENT FOR CLICK HANDLING ---
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
    });
    return null;
};

const LeafletMap = ({ points, shopLocation, onMapClick, activePointer, institutions }) => {
    const { theme } = useTheme();
    const position = shopLocation ? [shopLocation.lat, shopLocation.lon] : [19.0760, 72.8777];

    return (
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="h-full w-full rounded-xl z-0">
            <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}/{r}.png"
            />

            <MapClickHandler onMapClick={onMapClick} />

            {/* Pointer where user clicked */}
            {activePointer && (
                <Marker position={[activePointer.lat, activePointer.lng]}>
                    <Popup>Scan Radius: 2km</Popup>
                </Marker>
            )}

            {/* Render Institutions found */}
            {institutions.map((inst, idx) => {
                const pos = inst.lat ? [inst.lat, inst.lon] : [inst.center?.lat, inst.center?.lon];
                if (!pos[0]) return null;
                
                return (
                    <Circle 
                        key={idx}
                        center={pos}
                        radius={40}
                        pathOptions={{ 
                            fillColor: inst.tags.amenity === 'place_of_worship' ? '#A855F7' : '#F59E0B',
                            color: 'white',
                            weight: 1,
                            fillOpacity: 0.8
                        }}
                    >
                        <Tooltip>{inst.tags.name || 'Institution'}</Tooltip>
                    </Circle>
                );
            })}

            {/* Original Heatmap Circles */}
            {points.map((point, idx) => {
                if (!point.geometry?.coordinates) return null;
                const coords = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
                const multiplier = point.properties.multiplier || 1.0;
                let zoneColor = multiplier >= 1.3 ? '#ef4444' : multiplier >= 1.1 ? '#f59e0b' : '#0EA5E9';

                return (
                    <Circle
                        key={`heat-${idx}`}
                        center={coords}
                        pathOptions={{ fillColor: zoneColor, color: 'transparent', fillOpacity: 0.6 }}
                        radius={point.properties.radius || 300}
                    />
                );
            })}
        </MapContainer>
    );
};

export default LeafletMap;
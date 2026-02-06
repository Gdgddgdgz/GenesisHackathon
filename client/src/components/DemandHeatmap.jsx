import React, { useEffect, useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { aiApi } from '../services/api';

const DemandHeatmap = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const res = await aiApi.get('/heatmap');
                // Check if features exist, robust error handling
                if (res.data && res.data.features) {
                    setPoints(res.data.features);
                }
                setLoading(false);
            } catch (err) {
                console.error("Heatmap API Error:", err);
                setError("Failed to load demand data");
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Hyper-Local Demand Heatmap</h2>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded"><div className="w-2 h-2 rounded-full bg-red-500"></div> High Demand</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Medium</span>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Mumbai_city_map.png')] bg-cover bg-center grayscale"></div>

                {loading ? (
                    <div className="text-white flex flex-col items-center gap-2">
                        <Loader className="animate-spin" />
                        <span>Loading Intelligence...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 flex flex-col items-center gap-2">
                        <AlertTriangle />
                        <span>{error}</span>
                        <button onClick={() => window.location.reload()} className="text-xs underline">Retry</button>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        {points.map((pt, idx) => {
                            // Simple projection simulation for demo points
                            // Maps roughly to container space
                            const intensity = pt.properties.intensity;
                            const color = intensity > 0.8 ? 'bg-red-500' : 'bg-yellow-500';
                            const size = intensity > 0.8 ? 'w-24 h-24' : 'w-16 h-16';

                            // Randomize position based on list index for stub visual dispersion
                            // In real app, use projection library like react-map-gl
                            const top = `${(pt.geometry.coordinates[1] * 1000) % 80 + 10}%`;
                            const left = `${(pt.geometry.coordinates[0] * 1000) % 80 + 10}%`;

                            return (
                                <div
                                    key={idx}
                                    className={`absolute rounded-full ${color} opacity-40 blur-xl animate-pulse cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-[10px] text-white font-bold`}
                                    style={{ top: top, left: left, width: '4rem', height: '4rem' }}
                                    title={`Intensity: ${intensity.toFixed(2)}`}
                                >
                                    {Math.floor(intensity * 100)}%
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DemandHeatmap;

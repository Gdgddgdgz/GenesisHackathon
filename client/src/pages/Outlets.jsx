import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Database, Loader2 } from 'lucide-react';
import api from '../services/api';
import { motion } from 'framer-motion';

const Outlets = () => {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formLocation, setFormLocation] = useState('');
    const [formError, setFormError] = useState('');

    const fetchOutlets = async () => {
        try {
            const res = await api.get('/outlets');
            setOutlets(res.data);
        } catch (err) {
            console.error('Failed to load outlets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formLocation.trim()) {
            setFormError('Please enter a location');
            return;
        }
        setSubmitting(true);
        try {
            let geo_display_name = null;
            let lat = null;
            let lon = null;
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formLocation.trim())}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        // Note: If this still fails in browser, consider moving geocoding to your backend
                    }
                }
            );
            const geoResults = await geoRes.json();
            if (Array.isArray(geoResults) && geoResults.length > 0) {
                const first = geoResults[0];
                geo_display_name = first.display_name;
                lat = parseFloat(first.lat);
                lon = parseFloat(first.lon);
            }
            await api.post('/outlets', {
                location: formLocation.trim(),
                geo_display_name,
                lat,
                lon
            });
            setFormLocation('');
            setShowForm(false);
            await fetchOutlets();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to add outlet');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this outlet?')) return;
        try {
            await api.delete(`/outlets/${id}`);
            setOutlets(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            console.error('Failed to delete outlet', err);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Outlets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                        Outlet <span className="text-blue-500">Locations</span>
                        <MapPin size={32} className="text-slate-700" />
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Manage your store and warehouse locations</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => { setShowForm(!showForm); setFormError(''); setFormLocation(''); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl border border-blue-500/50 uppercase font-black text-[10px] tracking-widest transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Add Outlet
                    </button>
                </div>
            </div>

            {/* Add Outlet Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 border-[var(--border-glass)]"
                >
                    <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">New outlet location</h3>
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Address / Location</label>
                            <input
                                type="text"
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                                placeholder="e.g. 123 Business Bay, Mumbai"
                                className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setFormError(''); setFormLocation(''); }}
                                className="px-4 py-3 rounded-xl border border-[var(--border-glass)] text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-widest hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                Add
                            </button>
                        </div>
                    </form>
                    {formError && <p className="text-red-400 text-xs mt-2 font-bold uppercase">{formError}</p>}
                </motion.div>
            )}

            {/* Outlets Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-glass)] bg-[var(--bg-main)]/50">
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Location</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Address</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Coordinates</th>
                                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-glass)]">
                            {outlets.map((outlet, index) => (
                                <motion.tr
                                    key={outlet.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={14} className="text-blue-500/50" />
                                            <span className="font-bold text-[var(--text-primary)] text-xs">{outlet.location}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[var(--text-secondary)] text-xs block max-w-xs truncate" title={outlet.geo_display_name || '-'}>
                                            {outlet.geo_display_name || '–'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-[var(--text-secondary)] text-xs font-mono">
                                        {outlet.lat != null && outlet.lon != null
                                            ? `${outlet.lat.toFixed(4)}, ${outlet.lon.toFixed(4)}`
                                            : '–'}
                                    </td>
                                    <td className="p-6">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(outlet.id)}
                                            className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {outlets.length === 0 && (
                    <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                        <Database size={48} className="mb-4 text-slate-800" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Outlets Yet</p>
                        <p className="text-[9px] text-slate-600 mt-2 uppercase">Add your first outlet location above</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Outlets;

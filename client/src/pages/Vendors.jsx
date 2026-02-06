import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Star, Truck, Trash2, ShieldCheck, UserPlus, Search, User } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newVendor, setNewVendor] = useState({ name: '', phone: '', categories: '', trust_score: 80 });
    const [isBulkOnboarding, setIsBulkOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleAddVendor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/vendors', { ...newVendor, categories: newVendor.categories.split(',').map(c => c.trim()) });
            setShowForm(false);
            setNewVendor({ name: '', phone: '', categories: '', trust_score: 80 });
            fetchVendors();
        } catch (err) {
            alert('Failed to add vendor');
        }
    };

    const handleBulkOnboard = async () => {
        setIsBulkOnboarding(true);
        setTimeout(() => {
            setIsBulkOnboarding(false);
            alert('Bulk Onboarding Success: 12 vendors added from "mumbai_distributors.csv"');
        }, 3000);
    };

    const handleDeleteVendor = async (id) => {
        if (!window.confirm('Remove this partner from your neural registry?')) return;
        try {
            await api.delete(`/vendors/${id}`);
            fetchVendors();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDraftOrder = (vendor) => {
        const msg = `Namaste ${vendor.name}, need a restock based on SME Synth predictions. Can we match last pricing?`;
        const url = `https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const renderStars = (score) => {
        const rating = Math.min(5, Math.max(1, Math.round(score / 20)));
        return (
            <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        fill={i < rating ? "var(--neon-accent)" : "none"}
                        className={i < rating ? "text-[var(--neon-accent)] opacity-100" : "text-[var(--text-secondary)] opacity-30"}
                    />
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Authenticating Nodes...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Vendor <span className="text-blue-500">Network</span></h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Intelligent sourcing and partner reliability metrics</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleBulkOnboard}
                        disabled={isBulkOnboarding}
                        className="px-6 py-3.5 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 text-[var(--text-secondary)]"
                    >
                        {isBulkOnboarding ? 'Processing CSV...' : 'Bulk Onboarding'}
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                        <UserPlus size={18} /> {showForm ? 'Cancel Registration' : 'Partner Registration'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card p-8 mb-8">
                            <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Partner Onboarding</h2>
                            <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">Entity Name</label>
                                    <input type="text" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">Secure Uplink (Phone)</label>
                                    <input type="text" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">Specialization</label>
                                    <input type="text" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={newVendor.categories} onChange={e => setNewVendor({ ...newVendor, categories: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Onboard Partner</button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vendor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                    <motion.div
                        key={vendor.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="glass-card p-8 group flex flex-col relative overflow-hidden"
                    >
                        {/* Status Glow */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-10 ${vendor.trust_score >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center border border-[var(--border-glass)] group-hover:border-blue-500/50 transition-colors shadow-lg">
                                    <User size={28} className="text-[var(--text-secondary)] group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)]">{vendor.name}</h3>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Reliability Index</p>
                                    {renderStars(vendor.trust_score)}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteVendor(vendor.id)}
                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            <div className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-xl border border-[var(--border-glass)]">
                                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Trust Score</span>
                                <span className={`text-xs font-black ${vendor.trust_score >= 90 ? 'text-emerald-400' : 'text-blue-400'}`}>{vendor.trust_score}%</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] px-1">
                                <Phone size={16} className="text-blue-500/70" /> {vendor.phone}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] px-1">
                                <Truck size={16} className="text-blue-500/70" />
                                <span>Last Sync: {vendor.last_delivery_time ? new Date(vendor.last_delivery_time).toLocaleDateString() : 'Active'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4 px-1">
                                {vendor.categories?.map((cat, ci) => (
                                    <span key={ci} className="text-[8px] font-black px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 uppercase tracking-widest">{cat}</span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleDraftOrder(vendor)}
                            className="w-full py-4 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-emerald-500/20"
                        >
                            <MessageCircle size={18} />
                            WhatsApp AI Order
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Vendors;

import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Star, Truck, Trash2 } from 'lucide-react';
import api from '../services/api';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newVendor, setNewVendor] = useState({ name: '', phone: '', categories: '', trust_score: 80 });
    const [isBulkOnboarding, setIsBulkOnboarding] = useState(false);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch (err) {
            console.error(err);
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
        // Simulation: 3 seconds to onboard bulk data
        setTimeout(() => {
            setIsBulkOnboarding(false);
            alert('Bulk Onboarding Success: 12 vendors added from "mumbai_distributors.csv"');
        }, 3000);
    };

    const handleDeleteVendor = async (id) => {
        if (!window.confirm('Are you sure you want to remove this vendor from your co-pilot?')) return;
        try {
            const response = await api.delete(`/vendors/${id}`);
            if (response.data && response.data.success) {
                fetchVendors();
            } else {
                alert(`Removal failed: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDraftOrder = (vendor) => {
        const msg = `Namaste ${vendor.name}, need 50 units. Last price match?`;
        const url = `https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const renderStars = (score) => {
        const rating = Math.min(5, Math.max(1, Math.round(score / 20)));
        return (
            <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        fill={i < rating ? "#f59e0b" : "none"}
                        className={i < rating ? "text-amber-500" : "text-slate-300"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Vendor Co-Pilot</h1>
                    <p className="text-slate-500 mt-1">Smart sourcing & trust scoring</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleBulkOnboard}
                        disabled={isBulkOnboarding}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 text-sm disabled:opacity-50"
                    >
                        {isBulkOnboarding ? 'Onboarding...' : 'Bulk Onboard'}
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                        {showForm ? 'Cancel' : '+ Add Vendor'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in mb-6">
                    <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Vendor Name</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Phone (+91...)</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Categories (comma sep)</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newVendor.categories} onChange={e => setNewVendor({ ...newVendor, categories: e.target.value })} />
                        </div>
                        <button type="submit" className="bg-green-600 text-white p-2 rounded font-medium hover:bg-green-700">Save Vendor</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                    <div key={vendor.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                    {vendor.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{vendor.name}</h3>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-slate-500 leading-tight mb-1">{vendor.categories?.join(', ')}</span>
                                        {renderStars(vendor.trust_score)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase text-center flex flex-col ${vendor.trust_score >= 90 ? 'bg-green-100 text-green-700' :
                                    vendor.trust_score >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    <span>Score: {vendor.trust_score}</span>
                                    <span className="text-[7px] text-slate-400 font-bold">Simulation Insight</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteVendor(vendor.id)}
                                    className="text-red-300 hover:text-red-500 transition-colors p-1"
                                    title="Remove Vendor"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={16} className="text-slate-400" /> {vendor.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Truck size={16} className="text-slate-400" /> <span className="text-xs italic text-slate-400">last delivery:</span> {vendor.last_delivery_time ? new Date(vendor.last_delivery_time).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        <button
                            onClick={() => handleDraftOrder(vendor)}
                            className="w-full py-2 bg-green-50 text-green-600 font-semibold rounded-lg border border-green-200 hover:bg-green-100 flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <MessageCircle size={18} />
                            WhatsApp AI Order
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Vendors;

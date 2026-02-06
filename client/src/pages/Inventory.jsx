import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, TrendingUp, Search, Plus, Trash2, Filter, Download } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: '', unit_price: '', current_stock: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load inventory", err);
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/products', newProduct);
            setShowForm(false);
            setNewProduct({ name: '', sku: '', category: '', unit_price: '', current_stock: '' });
            fetchProducts();
        } catch (err) {
            alert('Failed to add product');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this asset from the registry?')) return;
        try {
            await api.delete(`/inventory/products/${id}`);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.sku.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Ledger...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Inventory <span className="text-emerald-500">Registry</span></h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Manage and audit your supply-chain assets</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search assets by name or SKU..."
                            className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-semibold text-sm text-[var(--text-primary)]"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                    >
                        <Plus size={18} /> {showForm ? 'Cancel' : 'Register Asset'}
                    </button>
                    <button className="p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-slate-400">
                        <Download size={20} />
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
                            <h2 className="text-xl font-black text-white mb-6">Asset Registration</h2>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">Asset Name</label>
                                    <input type="text" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">SKU Code</label>
                                    <input type="text" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 ml-1">Valuation (₹)</label>
                                    <input type="number" required className="w-full p-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50" value={newProduct.unit_price} onChange={e => setNewProduct({ ...newProduct, unit_price: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Commit</button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table Registry */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Detail</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SKU Registry</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Category</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Valuation</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status Check</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[var(--bg-main)] rounded-xl flex items-center justify-center border border-[var(--border-glass)] group-hover:border-emerald-500/50 transition-colors shadow-sm">
                                                <Package size={24} className="text-[var(--text-secondary)] group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)] text-lg">{product.name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Node Cluster: BRAVO-9</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono text-xs text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">{product.sku}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-black text-[var(--text-primary)]">₹{product.unit_price}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(product.current_stock, 100)}%` }}
                                                    className={`h-full rounded-full ${product.current_stock < 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase ${product.current_stock < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {product.current_stock} Units
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="p-2.5 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-xl transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;

import React, { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle, CheckCircle, Package } from 'lucide-react';
import api from '../services/api';

const MockBillingCard = ({ anchor, onTransactionComplete }) => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
            if (res.data.length > 0) setSelectedProduct(res.data[0].id);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    };

    const handleGenerateBill = async () => {
        if (!selectedProduct) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const product = products.find(p => p.id === parseInt(selectedProduct));

            await api.post('/billing/create', {
                items: [{ product_id: product.id, quantity: parseInt(quantity) }],
                customer_name: 'Walk-in Customer (Demo)',
                anchorLat: anchor.lat,
                anchorLng: anchor.lng
            });

            setSuccess(`Simulated sale of ${quantity}x ${product.name}`);
            setLoading(false);

            // Notify parent to refresh data
            if (onTransactionComplete) onTransactionComplete();

            // Clear success after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Transaction failed');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
            <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold">
                    <ShoppingBag size={16} className="text-blue-400" />
                    <span>Mock Billing (Demo)</span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tighter">
                    Demo-Safe
                </span>
            </div>

            <div className="p-4 space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product SKU</label>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - {p.current_stock} in stock
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qty</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50"
                        />
                    </div>
                    <button
                        onClick={handleGenerateBill}
                        disabled={loading || !selectedProduct}
                        className={`flex-2 mt-5 py-2 px-4 rounded font-bold text-xs transition-all flex items-center gap-2 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Generate Bill'}
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle size={14} />
                        <span>{success}</span>
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Package size={12} />
                        <span>Auto-Update Inventory enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockBillingCard;

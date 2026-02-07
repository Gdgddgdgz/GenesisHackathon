import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Search,
    Plus,
    Trash2,
    CheckCircle,
    AlertCircle,
    Package,
    ArrowRight,
    Printer,
    User,
    ChevronRight,
    TrendingDown
} from 'lucide-react';
import api from '../services/api';

const BillingCounter = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastBill, setLastBill] = useState(null);
    const [billNumber, setBillNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

    // Default Demo Coordinates (Navi Mumbai)
    const DEMO_LAT = 19.0330;
    const DEMO_LNG = 73.0297;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        const currentQtyInCart = existing ? existing.quantity : 0;

        if (product.current_stock <= currentQtyInCart) {
            setError(`Insufficient stock for ${product.name}! Only ${product.current_stock} units available.`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQty) => {
        const product = products.find(p => p.id === id);
        if (newQty > product.current_stock) {
            setError(`Cannot exceed available stock (${product.current_stock} units)`);
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (newQty < 1) return;
        setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    };

    const handleGenerateBill = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        setError(null);

        try {
            // Prepare billing items
            const billingItems = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            // Call API
            const response = await api.post('/billing/create', {
                items: billingItems,
                customer_name: 'Counter Sale',
                anchorLat: DEMO_LAT,
                anchorLng: DEMO_LNG
            });

            // Calculate stock impact for visual feedback
            const impact = cart.map(item => ({
                name: item.name,
                before: item.current_stock,
                after: item.current_stock - item.quantity,
                sold: item.quantity
            }));

            setLastBill({
                billId: response.data.billId,
                total: calculateTotal(),
                items: impact
            });

            // Clean up
            setCart([]);
            setLoading(false);
            fetchProducts();
            setBillNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Billing failed');
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (lastBill) {
        return (
            <div className="max-w-2xl mx-auto py-12 animate-in zoom-in duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="bg-green-600 p-8 text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold">Bill Generated Successfully</h2>
                        <p className="text-green-100 mt-1">Stock updated automatically across the system</p>
                    </div>

                    <div className="p-8">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bill Number</p>
                                <p className="text-lg font-bold text-slate-900">#{lastBill.billId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                <p className="text-2xl font-black text-blue-600">₹{lastBill.total.toLocaleString()}</p>
                            </div>
                        </div>

                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Inventory Impact</h3>
                        <div className="space-y-3">
                            {lastBill.items.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Qty Sold: {item.sold}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Before</p>
                                            <p className="text-sm font-bold text-slate-600">{item.before}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300" />
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-green-500 uppercase">After</p>
                                            <p className="text-sm font-black text-green-600">{item.after}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setLastBill(null)}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> New Bill
                            </button>
                            <button className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing Counter</h1>
                    <p className="text-[var(--text-secondary)]">Create new sales and update inventory instantly.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-glass)] shadow-sm flex items-center gap-2">
                        <User size={16} className="text-[var(--text-secondary)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Active Counter: Main Store</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left: Product Search */}
                <div className="xl:col-span-12">
                    <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-glass)] shadow-sm flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3 text-[var(--text-secondary)]" size={18} />
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-[var(--bg-main)] rounded-lg border border-[var(--border-glass)] focus:ring-2 focus:ring-blue-500 outline-none text-sm text-[var(--text-primary)] transition-all"
                            />
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {searchTerm && filteredProducts.length > 0 && (
                        <div className="mt-2 bg-[var(--bg-card)] backdrop-blur-xl rounded-xl border border-[var(--border-glass)] shadow-2xl max-h-64 overflow-y-auto z-50 absolute w-[calc(100%-48px)] xl:w-[calc(100%-64px)]">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => { addToCart(p); setSearchTerm(''); }}
                                    className="p-4 hover:bg-blue-500/10 cursor-pointer border-b border-[var(--border-glass)] last:border-none flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{p.name}</p>
                                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">{p.sku} • ₹{p.unit_price}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.current_stock < 20 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                            Stock: {p.current_stock}
                                        </span>
                                        <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content: Cart & Summary */}
                <div className="xl:col-span-8">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-glass)] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="bg-white/5 px-6 py-4 border-b border-[var(--border-glass)] flex justify-between items-center">
                            <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <ShoppingCart size={18} className="text-blue-500" />
                                Current Bill Items
                            </h2>
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{billNumber}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-[var(--text-secondary)] opacity-30">
                                        <ShoppingCart size={32} />
                                    </div>
                                    <h3 className="font-bold text-[var(--text-secondary)]">Bill is empty</h3>
                                    <p className="text-sm text-[var(--text-secondary)] opacity-50 mt-1 max-w-xs">Search and add items to generate a sales invoice.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Item Description</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-center">Price</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-center">Qty</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Subtotal</th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-glass)]">
                                        {cart.map(item => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{item.name}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">{item.sku}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-sm font-medium text-[var(--text-secondary)]">₹{item.unit_price}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-6 h-6 rounded border border-[var(--border-glass)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/5"
                                                        >-</button>
                                                        <span className="text-sm font-bold w-6 text-center text-[var(--text-primary)]">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-6 h-6 rounded border border-[var(--border-glass)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/5"
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-black text-[var(--text-primary)]">₹{(item.unit_price * item.quantity).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Summary & Action */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-glass)] shadow-sm p-6 space-y-6">
                        <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Bill Summary</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--text-secondary)]">Items Total</span>
                                <span className="font-bold text-[var(--text-primary)]">₹{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[var(--text-secondary)]">Tax (GST 0%)</span>
                                <span className="font-bold text-[var(--text-primary)] text-xs">Included</span>
                            </div>
                            <div className="pt-4 border-t border-[var(--border-glass)] flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Payable Amount</p>
                                    <p className="text-3xl font-black text-[var(--text-primary)] leading-tight">₹{calculateTotal().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Package size={20} />
                            </div>
                            <p className="text-[11px] font-bold text-blue-400 leading-relaxed">
                                Inventory will be automatically updated across all systems upon bill generation.
                            </p>
                        </div>

                        <button
                            onClick={handleGenerateBill}
                            disabled={cart.length === 0 || loading}
                            className={`w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${cart.length === 0 || loading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-base'
                                }`}
                        >
                            {loading ? (
                                <>Updating Inventory...</>
                            ) : (
                                <>
                                    Generate Bill & Update Stock
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-right-2">
                            <AlertCircle className="text-red-500 shrink-0" size={18} />
                            <div>
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Validation Error</h4>
                                <p className="text-xs text-red-300 mt-0.5 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Quick Inventory Watch (Top Items) */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Watchlist</h3>
                            <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Live</span>
                        </div>
                        <div className="space-y-3">
                            {products.filter(p => p.current_stock < 30).slice(0, 3).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown size={12} className="text-amber-500" />
                                        <span className="text-[11px] font-bold text-slate-100">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-500">{p.current_stock} units</span>
                                </div>
                            ))}
                            {products.filter(p => p.current_stock < 30).length === 0 && (
                                <p className="text-[10px] text-slate-500 italic text-center py-2">All stock levels are healthy.</p>
                            )}
                        </div>
                        <button className="w-full mt-4 py-2 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-slate-800 transition-all">
                            View Full Inventory
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingCounter;

import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, TrendingUp, Search, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

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
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await api.delete(`/inventory/products/${id}`);
            if (response.data && response.data.success) {
                fetchProducts();
            } else {
                alert(`Deletion failed: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.response?.data?.error || err.message}`);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.sku.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Inventory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
                    <p className="text-slate-500 mt-1">Real-time stock tracking & adjustments</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} /> {showForm ? 'Cancel' : 'Add Product'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in">
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Product Name</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">SKU</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                            <input type="text" required className="w-full p-2 border rounded" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Price (₹)</label>
                            <input type="number" required className="w-full p-2 border rounded" value={newProduct.unit_price} onChange={e => setNewProduct({ ...newProduct, unit_price: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Stock</label>
                            <input type="number" required className="w-full p-2 border rounded" value={newProduct.current_stock} onChange={e => setNewProduct({ ...newProduct, current_stock: e.target.value })} />
                        </div>
                        <button type="submit" className="bg-green-600 text-white p-2 rounded font-medium hover:bg-green-700 w-full">Save</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Product Name</th>
                            <th className="p-4 font-semibold text-slate-600">SKU</th>
                            <th className="p-4 font-semibold text-slate-600">Category</th>
                            <th className="p-4 font-semibold text-slate-600">Price</th>
                            <th className="p-4 font-semibold text-slate-600">Stock Level</th>
                            <th className="p-4 font-semibold text-slate-600">Status</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg">
                                            <Package size={20} className="text-slate-500" />
                                        </div>
                                        {product.name}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-500 font-mono text-sm">{product.sku}</td>
                                <td className="p-4 text-slate-600">
                                    <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-semibold">{product.category}</span>
                                </td>
                                <td className="p-4 text-slate-800 font-medium">₹{product.unit_price}</td>
                                <td className="p-4">
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-1 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${product.current_stock < 50 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(product.current_stock, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">{product.current_stock} units</span>
                                </td>
                                <td className="p-4">
                                    {product.current_stock < 50 ? (
                                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                            <AlertCircle size={12} /> Low Stock
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                            <TrendingUp size={12} /> Healthy
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No products found matching your search.</div>
                )}
            </div>
        </div>
    );
};

export default Inventory;

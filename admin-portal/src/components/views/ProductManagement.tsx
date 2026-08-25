import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchVendorProducts, createVendorProduct, deleteVendorProduct } from '../../services/api';

export const ProductManagementView: React.FC = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState(999);
    const [categoryId, setCategoryId] = useState(1);
    const [categoryName, setCategoryName] = useState('Pooja Items');
    const [shortDesc, setShortDesc] = useState('');

    const loadProducts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetchVendorProducts(token);
            if (res.success) setProducts(res.data.products);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await createVendorProduct(token, {
                name,
                price: Number(price),
                categoryId: Number(categoryId),
                categoryName,
                shortDesc,
                images: ['https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=400'],
                stock: 50,
                satvikVerified: true
            });
            if (res.success) {
                setShowAddModal(false);
                setName('');
                loadProducts();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!token || !confirm('Are you sure you want to remove this product?')) return;
        try {
            await deleteVendorProduct(token, id);
            loadProducts();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center text-xs text-[var(--color-text-dim)]">Loading Products...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Products & Store Management</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage standalone Satvik items, pooja thalis, rudraksha, and scriptures</p>
                </div>

                <button onClick={() => setShowAddModal(true)} className="btn btn-primary text-xs">
                    + Add New Product
                </button>
            </div>

            <div className="card p-4 overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td className="flex items-center gap-3">
                                    <img src={p.thumbnail || p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]" />
                                    <div>
                                        <p className="font-bold text-xs text-[var(--color-text)]">{p.name}</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)]">SKU: {p.sku}</p>
                                    </div>
                                </td>
                                <td className="text-xs text-[var(--color-text-muted)]">{p.categoryName}</td>
                                <td className="font-bold text-xs text-[var(--color-primary)]">₹{p.price?.toLocaleString('en-IN')}</td>
                                <td className="text-xs font-semibold text-emerald-400">{p.stock} units</td>
                                <td>
                                    <span className="badge badge-success">Active</span>
                                </td>
                                <td>
                                    <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for adding product */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card p-6 w-full max-w-md space-y-4">
                        <h2 className="text-lg font-serif font-bold text-[var(--color-text)]">Add New Devotional Product</h2>

                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Product Name *</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="w-full text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Price (₹) *</label>
                                    <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full text-xs" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Category *</label>
                                    <select value={categoryName} onChange={e => {
                                        setCategoryName(e.target.value);
                                        setCategoryId(e.target.value === 'Pooja Items' ? 1 : 2);
                                    }} className="w-full text-xs">
                                        <option value="Pooja Items">Pooja Items</option>
                                        <option value="Idols & Murtis">Idols & Murtis</option>
                                        <option value="Books & Scriptures">Books & Scriptures</option>
                                        <option value="Rudraksha & Malas">Rudraksha & Malas</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Short Description</label>
                                <input type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Short product description" className="w-full text-xs" />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary text-xs">Cancel</button>
                                <button type="submit" className="btn btn-primary text-xs">Publish Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

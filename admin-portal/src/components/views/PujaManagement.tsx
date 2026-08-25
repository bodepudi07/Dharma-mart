import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminPujas } from '../../services/api';

export const PujaManagementView: React.FC = () => {
    const { token } = useAuth();
    const [pujas, setPujas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPuja, setSelectedPuja] = useState<any | null>(null);
    const [editingPuja, setEditingPuja] = useState<any | null>(null);
    
    // Price editing state
    const [essentialPrice, setEssentialPrice] = useState(0);
    const [completePrice, setCompletePrice] = useState(0);
    const [sampoornaPrice, setSampoornaPrice] = useState(0);

    useEffect(() => {
        loadPujas();
    }, []);

    const loadPujas = async () => {
        setLoading(true);
        try {
            const res = await fetchAdminPujas();
            if (res.success) setPujas(res.data.pujas);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const openEditModal = (puja: any) => {
        setEditingPuja(puja);
        setEssentialPrice(puja.tiers?.essential?.price || 0);
        setCompletePrice(puja.tiers?.complete?.price || 0);
        setSampoornaPrice(puja.tiers?.sampoorna?.price || 0);
    };

    const handlePriceUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingPuja) return;
        
        try {
            const response = await fetch(`http://localhost:3333/api/admin/poojas/${editingPuja.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editingPuja,
                    tiers: {
                        ...editingPuja.tiers,
                        essential: {
                            ...editingPuja.tiers.essential,
                            price: essentialPrice
                        },
                        complete: {
                            ...editingPuja.tiers.complete,
                            price: completePrice
                        },
                        sampoorna: {
                            ...editingPuja.tiers.sampoorna,
                            price: sampoornaPrice
                        }
                    }
                })
            });
            
            if (response.ok) {
                setEditingPuja(null);
                loadPujas();
            }
        } catch (error) {
            console.error('Failed to update prices:', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-xs text-[var(--color-text-dim)]">Loading Puja Catalog...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Puja Catalog Management</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage 3-tier Puja pricing, regional traditions, and kit inclusions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="card p-4 overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Puja Name</th>
                                    <th>Deity</th>
                                    <th>Essential</th>
                                    <th>Complete</th>
                                    <th>Sampoorna</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pujas.map((p) => (
                                    <tr key={p.id} className="hover:bg-[var(--color-surface-3)] cursor-pointer" onClick={() => setSelectedPuja(p)}>
                                        <td>
                                            <p className="font-bold text-xs text-[var(--color-text)]">{p.name}</p>
                                            <p className="text-[10px] text-[var(--color-text-dim)] capitalize">{p.occasionType}</p>
                                        </td>
                                        <td className="text-xs text-[var(--color-primary)] font-medium">{p.deity}</td>
                                        <td className="text-xs font-semibold text-emerald-400">₹{p.tiers?.essential?.price}</td>
                                        <td className="text-xs font-semibold text-amber-400">₹{p.tiers?.complete?.price}</td>
                                        <td className="text-xs font-semibold text-rose-400">₹{p.tiers?.sampoorna?.price}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedPuja(p); }} className="btn btn-secondary btn-sm text-[10px]">View</button>
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(p); }} className="btn btn-primary btn-sm text-[10px]">Edit Price</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Puja Detail Inspector */}
                <div className="card p-6 space-y-4 sticky top-24 h-fit">
                    {selectedPuja ? (
                        <>
                            <div className="flex items-center gap-3">
                                <img src={selectedPuja.deityImage} alt={selectedPuja.name} className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
                                <div>
                                    <h3 className="font-serif font-bold text-base text-[var(--color-text)]">{selectedPuja.name}</h3>
                                    <p className="text-xs text-[var(--color-primary)]">{selectedPuja.deity}</p>
                                </div>
                            </div>

                            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{selectedPuja.significance}</p>

                            <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                                <h4 className="text-xs font-bold text-[var(--color-text)]">Tier Inclusions Overview</h4>

                                <div className="p-3 rounded-lg bg-[var(--color-surface-3)] border border-emerald-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-emerald-400">🟢 Essential Tier</span>
                                        <span className="text-xs font-bold text-[var(--color-text)]">₹{selectedPuja.tiers?.essential?.price}</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--color-text-dim)]">{selectedPuja.tiers?.essential?.includes?.slice(0, 3).join(', ')}...</p>
                                </div>

                                <div className="p-3 rounded-lg bg-[var(--color-surface-3)] border border-amber-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-amber-400">🟡 Complete Tier (Popular)</span>
                                        <span className="text-xs font-bold text-[var(--color-text)]">₹{selectedPuja.tiers?.complete?.price}</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--color-text-dim)]">{selectedPuja.tiers?.complete?.includes?.slice(0, 3).join(', ')}...</p>
                                </div>

                                <div className="p-3 rounded-lg bg-[var(--color-surface-3)] border border-rose-500/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-rose-400">🔴 Sampoorna Tier</span>
                                        <span className="text-xs font-bold text-[var(--color-text)]">₹{selectedPuja.tiers?.sampoorna?.price}</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--color-text-dim)]">{selectedPuja.tiers?.sampoorna?.includes?.slice(0, 3).join(', ')}...</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-xs text-[var(--color-text-dim)]">
                            Select a Puja from the list to view detailed 3-tier configurations.
                        </div>
                    )}
                </div>
            </div>

            {/* Price Edit Modal */}
            {editingPuja && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card p-6 w-full max-w-lg space-y-4">
                        <div className="flex items-center gap-3">
                            <img src={editingPuja.deityImage} alt={editingPuja.name} className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
                            <div>
                                <h2 className="text-lg font-serif font-bold text-[var(--color-text)]">Edit Puja Pricing</h2>
                                <p className="text-xs text-[var(--color-primary)]">{editingPuja.name}</p>
                            </div>
                        </div>

                        <form onSubmit={handlePriceUpdate} className="space-y-4 pt-4">
                            <div className="space-y-3">
                                <div className="p-4 rounded-lg bg-[var(--color-surface-3)] border border-emerald-500/20">
                                    <label className="block text-xs font-bold text-emerald-400 mb-2">🟢 Essential Tier Price (₹)</label>
                                    <input 
                                        type="number" 
                                        value={essentialPrice} 
                                        onChange={e => setEssentialPrice(Number(e.target.value))} 
                                        className="w-full text-sm"
                                        required
                                        min="0"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">Basic ritual with core essentials</p>
                                </div>

                                <div className="p-4 rounded-lg bg-[var(--color-surface-3)] border border-amber-500/20">
                                    <label className="block text-xs font-bold text-amber-400 mb-2">🟡 Complete Tier Price (₹)</label>
                                    <input 
                                        type="number" 
                                        value={completePrice} 
                                        onChange={e => setCompletePrice(Number(e.target.value))} 
                                        className="w-full text-sm"
                                        required
                                        min="0"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">Popular choice with full traditional setup</p>
                                </div>

                                <div className="p-4 rounded-lg bg-[var(--color-surface-3)] border border-rose-500/20">
                                    <label className="block text-xs font-bold text-rose-400 mb-2">🔴 Sampoorna Tier Price (₹)</label>
                                    <input 
                                        type="number" 
                                        value={sampoornaPrice} 
                                        onChange={e => setSampoornaPrice(Number(e.target.value))} 
                                        className="w-full text-sm"
                                        required
                                        min="0"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-dim)] mt-1">Premium complete ritual with all accessories</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingPuja(null)} 
                                    className="btn btn-secondary text-xs"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary text-xs">
                                    💾 Save Pricing
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

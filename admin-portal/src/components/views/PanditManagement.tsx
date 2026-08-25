import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminPandits, createAdminPandit, updateAdminPandit } from '../../services/api';

export const PanditManagementView: React.FC = () => {
    const { token } = useAuth();
    const [pandits, setPandits] = useState<any[]>([]);
    const [pendingPandits, setPendingPandits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPandit, setEditingPandit] = useState<any | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [location, setLocation] = useState('Hyderabad');
    const [tradition, setTradition] = useState('telugu');
    const [title, setTitle] = useState('Senior Vedic Pandit');
    const [languages, setLanguages] = useState('Telugu, Sanskrit, Hindi');
    const [experience, setExperience] = useState(15);
    const [hourlyRate, setHourlyRate] = useState(1200);

    const loadPandits = async () => {
        setLoading(true);
        try {
            const res = await fetchAdminPandits();
            if (res.success) setPandits(res.data.pandits);
            
            // Load pending pandits
            const pendingRes = await fetch('http://localhost:3333/api/admin/pending-pandits', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pendingData = await pendingRes.json();
            if (pendingData.success) setPendingPandits(pendingData.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPandits();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await createAdminPandit(token, {
                name,
                location,
                tradition,
                title,
                languages: languages.split(',').map(l => l.trim()),
                experience: Number(experience),
                hourlyRate: Number(hourlyRate),
                verified: true,
                senior: Number(experience) >= 15
            });
            if (res.success) {
                setShowAddModal(false);
                resetForm();
                loadPandits();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingPandit) return;
        try {
            await updateAdminPandit(token, editingPandit.id, {
                name,
                location,
                tradition,
                title,
                languages: languages.split(',').map(l => l.trim()),
                experience: Number(experience),
                hourlyRate: Number(hourlyRate)
            });
            setEditingPandit(null);
            resetForm();
            loadPandits();
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setName('');
        setLocation('Hyderabad');
        setTradition('telugu');
        setTitle('Senior Vedic Pandit');
        setLanguages('Telugu, Sanskrit, Hindi');
        setExperience(15);
        setHourlyRate(1200);
    };

    const openEditModal = (pandit: any) => {
        setEditingPandit(pandit);
        setName(pandit.name);
        setLocation(pandit.location);
        setTradition(pandit.tradition);
        setTitle(pandit.title);
        setLanguages(pandit.languages?.join(', ') || '');
        setExperience(pandit.experience);
        setHourlyRate(pandit.hourlyRate);
    };

    const approvePandit = async (panditId: number) => {
        if (!token) return;
        try {
            await fetch(`http://localhost:3333/api/admin/approve-pandit/${panditId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadPandits();
        } catch (e) {
            console.error(e);
        }
    };

    const rejectPandit = async (panditId: number) => {
        if (!token) return;
        try {
            await fetch(`http://localhost:3333/api/admin/reject-pandit/${panditId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadPandits();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleVerification = async (pandit: any) => {
        if (!token) return;
        try {
            await updateAdminPandit(token, pandit.id, { verified: !pandit.verified });
            loadPandits();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center text-xs text-[var(--color-text-dim)]">Loading Pandit Network...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Pending Pandits Section */}
            {pendingPandits.length > 0 && (
                <div className="card p-6 space-y-4 border-2 border-amber-500/30">
                    <h2 className="text-lg font-serif font-bold text-amber-400">⏳ Pending Verification ({pendingPandits.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingPandits.map((p) => (
                            <div key={p.id} className="card p-4 space-y-3 bg-amber-500/5">
                                <div className="flex items-start gap-3">
                                    <img src={p.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/50" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{p.name}</h3>
                                        <p className="text-xs text-[var(--color-primary)]">{p.title}</p>
                                        <p className="text-[10px] text-[var(--color-text-dim)]">{p.experience} yrs · {p.location}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    <p><strong>Tradition:</strong> {p.tradition}</p>
                                    <p><strong>Languages:</strong> {p.languages?.join(', ')}</p>
                                    <p><strong>Rate:</strong> ₹{p.hourlyRate}/hr</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => approvePandit(p.id)} className="btn btn-primary btn-sm flex-1 text-[10px]">✓ Approve</button>
                                    <button onClick={() => rejectPandit(p.id)} className="btn btn-secondary btn-sm flex-1 text-[10px]">✗ Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Verified Pandit Network</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Manage verified priests, traditions, specializations, and availability</p>
                </div>

                <button onClick={() => setShowAddModal(true)} className="btn btn-primary text-xs">
                    + Add New Pandit
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pandits.map((p) => (
                    <div key={p.id} className="card p-6 space-y-4 relative">
                        <div className="flex items-start gap-4">
                            <img src={p.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-primary)]/30" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{p.name}</h3>
                                    {p.verified && <span className="text-blue-400 text-xs" title="Verified">✓</span>}
                                </div>
                                <p className="text-xs text-[var(--color-primary)] font-medium">{p.title}</p>
                                <p className="text-[10px] text-[var(--color-text-dim)] mt-0.5">{p.experience} yrs exp · {p.location}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border)]">
                            <p><strong>Tradition:</strong> <span className="capitalize text-[var(--color-text)]">{p.tradition}</span></p>
                            <p><strong>Languages:</strong> {p.languages?.join(', ')}</p>
                            <p><strong>Hourly Rate:</strong> ₹{p.hourlyRate}</p>
                            <p><strong>Completed Pujas:</strong> {p.completedPujas || 0}</p>
                            <p><strong>Rating:</strong> ⭐ {p.rating || 5.0} ({p.reviewCount || 0} reviews)</p>
                        </div>

                        <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center gap-2">
                            <button
                                onClick={() => openEditModal(p)}
                                className="btn btn-secondary btn-sm text-[10px] flex-1"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={() => toggleVerification(p)}
                                className="text-[10px] text-[var(--color-text-muted)] hover:text-white underline"
                            >
                                {p.verified ? 'Revoke' : 'Verify'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for adding/editing Pandit */}
            {(showAddModal || editingPandit) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-serif font-bold text-[var(--color-text)]">
                            {editingPandit ? 'Edit Pandit Details' : 'Register New Pandit'}
                        </h2>

                        <form onSubmit={editingPandit ? handleUpdate : handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Pandit Name *</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Pandit Name" className="w-full text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Location *</label>
                                    <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full text-xs" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Tradition *</label>
                                    <select value={tradition} onChange={e => setTradition(e.target.value)} className="w-full text-xs">
                                        <option value="telugu">Telugu</option>
                                        <option value="tamil">Tamil</option>
                                        <option value="kannada">Kannada</option>
                                        <option value="marathi">Marathi</option>
                                        <option value="north-indian">North Indian</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-xs" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Languages (comma separated)</label>
                                <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} className="w-full text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Experience (Years)</label>
                                    <input type="number" value={experience} onChange={e => setExperience(Number(e.target.value))} className="w-full text-xs" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Hourly Rate (₹)</label>
                                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full text-xs" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingPandit(null);
                                        resetForm();
                                    }} 
                                    className="btn btn-secondary text-xs"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary text-xs">
                                    {editingPandit ? 'Update Pandit' : 'Save Pandit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

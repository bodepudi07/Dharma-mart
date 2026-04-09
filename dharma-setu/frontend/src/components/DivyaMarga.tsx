import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { I18nContent, Language, Temple, RemoteSeva, Pandit, Sankalpa } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';
import { useNotifications } from '../contexts/NotificationContext';

interface DivyaMargaProps {
    t: I18nContent;
    language: Language;
    onNavigate: (view: any, props?: any) => void;
    openModal: (type: string, props?: any) => void;
}

const GOTRA_LIST = [
    'Bharadwaj', 'Kashyap', 'Vasishtha', 'Vishwamitra', 'Gautam',
    'Jamadagni', 'Atri', 'Agastya', 'Angiras', 'Pulastya',
    'Pulaha', 'Kratu', 'Marichi', 'Daksha', 'Shandilya',
    'Paraashar', 'Garg', 'Maudgalya', 'Sandilya', 'Other',
];

const RASHI_LIST = [
    'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
    'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrischika (Scorpio)',
    'Dhanu (Sagittarius)', 'Makar (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
];

const NAKSHATRA_LIST = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Moola', 'Purvashadha', 'Uttarashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const SEVA_CATEGORIES = ['All', 'Abhishekam', 'Homa', 'Graha Shanti', 'Dosh Nivaran', 'Katha', 'Shakti Pooja', 'Prasad Seva', 'Aarti & Darshan'];

// Sankalpas loaded from backend (localStorage as fallback)
const STORAGE_KEY = 'dharmasetu_sankalpas';
function loadLocalSankalpas(): Sankalpa[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export const DivyaMarga = ({ t, language, onNavigate, openModal }: DivyaMargaProps) => {
    const [sevas, setSevas] = useState<RemoteSeva[]>([]);
    const [temples, setTemples] = useState<Temple[]>([]);
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'devotee' | 'pandit'>('devotee');
    const [devoteeSubTab, setDevoteeSubTab] = useState<'explore' | 'bookings'>('explore');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sankalpas, setSankalpas] = useState<Sankalpa[]>([]);

    // Booking form state
    const [selectedSeva, setSelectedSeva] = useState<RemoteSeva | null>(null);
    const [bookingForm, setBookingForm] = useState({
        devoteeName: '', gotra: '', rashi: '', nakshatra: '',
        address: '', pincode: '', phone: '', selectedDate: '',
    });

    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { addNotification } = useNotifications();

    useEffect(() => {
        const load = async () => {
            try {
                const [sevaData, templeData, panditData] = await Promise.all([
                    api.getRemoteSevas(language),
                    api.getTemples(language),
                    api.getPandits(language),
                ]);
                setSevas(sevaData);
                setTemples(templeData);
                setPandits(panditData.filter(p => p.status === 'verified'));

                // Load sankalpas from backend (fallback to localStorage)
                if (currentUser?.token) {
                    try {
                        const serverSankalpas = await api.getUserSankalpas(currentUser.token);
                        setSankalpas(serverSankalpas);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSankalpas));
                    } catch {
                        setSankalpas(loadLocalSankalpas());
                    }
                } else {
                    setSankalpas(loadLocalSankalpas());
                }
            } catch {
                addToast('Failed to load remote sevas', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [language, addToast, currentUser]);

    const templeMap = useMemo(() => new Map(temples.map(t => [t.id, t])), [temples]);
    const panditMap = useMemo(() => new Map(pandits.map(p => [p.id, p])), [pandits]);

    const filteredSevas = useMemo(() => {
        if (categoryFilter === 'All') return sevas;
        return sevas.filter(s => s.category === categoryFilter);
    }, [sevas, categoryFilter]);

    // Pandit's own sevas (for pandit dashboard)
    const panditSevas = useMemo(() => {
        if (!currentUser) return [];
        // Show all sankalpas that are assigned to pandits (simulated)
        return sankalpas;
    }, [sankalpas, currentUser]);

    const getTempleImage = useCallback((templeId: number) => {
        return templeMap.get(templeId)?.imageUrl || '';
    }, [templeMap]);

    const handleBookSeva = (seva: RemoteSeva) => {
        if (!currentUser) {
            openModal('login');
            return;
        }
        setSelectedSeva(seva);
        setBookingForm({
            devoteeName: currentUser.name || '',
            gotra: '', rashi: '', nakshatra: '',
            address: '', pincode: '', phone: '',
            selectedDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        });
    };

    const handleSubmitSankalpa = async () => {
        if (!selectedSeva || !currentUser) return;
        const { devoteeName, gotra, address, pincode, phone, selectedDate } = bookingForm;
        if (!devoteeName.trim() || !gotra || !address.trim() || !pincode.trim() || !phone.trim() || !selectedDate) {
            addToast('Please fill all required fields', 'error');
            return;
        }

        const sankalpaData = {
            sevaId: selectedSeva.id,
            devoteeName: devoteeName.trim(),
            gotra,
            rashi: bookingForm.rashi || undefined,
            nakshatra: bookingForm.nakshatra || undefined,
            address: address.trim(),
            pincode: pincode.trim(),
            phone: phone.trim(),
            date: selectedDate,
            panditId: selectedSeva.panditIds[0],
        };

        try {
            if (currentUser.token) {
                const created = await api.createSankalpa(sankalpaData, currentUser.token);
                const updated = [created, ...sankalpas];
                setSankalpas(updated);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } else {
                // Fallback: localStorage only
                const newSankalpa: Sankalpa = {
                    id: `sk-${Date.now()}`,
                    userId: currentUser.email,
                    status: 'Pending',
                    ...sankalpaData,
                };
                const updated = [newSankalpa, ...sankalpas];
                setSankalpas(updated);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
            setSelectedSeva(null);
            setDevoteeSubTab('bookings');
            addToast(`Sankalpa booked for ${selectedSeva.name}! The pandit will receive your details.`, 'success');
            addNotification({
                title: 'Sankalpa Booked',
                message: `Your ${selectedSeva.name} at ${selectedSeva.templeName} is pending pandit acceptance.`,
                type: 'sankalpa',
                icon: 'flame',
            });
        } catch (err: any) {
            addToast(err.message || 'Failed to create sankalpa', 'error');
        }
    };

    const updateSankalpaStatus = async (id: string, status: Sankalpa['status'], extras?: Partial<Sankalpa>) => {
        try {
            if (currentUser?.token) {
                await api.updateSankalpaStatus(id, status, currentUser.token, extras as any);
            }
            const updated = sankalpas.map(s =>
                s.id === id ? { ...s, status, ...extras } : s
            );
            setSankalpas(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            addToast(`Seva status updated to: ${status}`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Failed to update status', 'error');
        }
    };

    const getSevaForSankalpa = (sankalpa: Sankalpa) => sevas.find(s => s.id === sankalpa.sevaId);
    const getPanditForSankalpa = (sankalpa: Sankalpa) => panditMap.get(sankalpa.panditId);

    const STATUS_STEPS: Sankalpa['status'][] = ['Pending', 'Accepted', 'InProgress', 'Completed', 'ProofUploaded', 'PrasadShipped', 'Delivered'];
    const getStatusIndex = (s: Sankalpa['status']) => STATUS_STEPS.indexOf(s);

    if (loading) return (
        <div className="min-h-screen bg-[#022c22] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#022c22] text-white overflow-x-hidden font-sans pt-20 pb-24 relative">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/30 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <header className="py-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-teal-400 font-bold tracking-widest uppercase text-xs">
                            <span className="w-8 h-[1px] bg-teal-400/50" />
                            Digital Sanctuary • Rural Temples
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-teal-300 to-emerald-200" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Divya Marga
                        </h1>
                        <p className="text-lg text-emerald-100/60 max-w-xl font-light">
                            Remote poojas at sacred rural temples. Geotagged video proof, prasad & sacred items delivered to your doorstep.
                        </p>
                    </div>

                    {/* Devotee / Pandit Toggle */}
                    <div className="flex bg-emerald-950/50 border border-emerald-500/20 p-1 rounded-2xl backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('devotee')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'devotee' ? 'bg-teal-500 text-emerald-950 shadow-lg' : 'text-teal-400/70 hover:text-teal-300'}`}
                        >
                            <Icon name="heart" className="w-4 h-4" /> Devotee
                        </button>
                        <button
                            onClick={() => setActiveTab('pandit')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pandit' ? 'bg-teal-500 text-emerald-950 shadow-lg' : 'text-teal-400/70 hover:text-teal-300'}`}
                        >
                            <Icon name="user-edit" className="w-4 h-4" /> Temple Pandit
                        </button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'devotee' ? (
                        <motion.div key="devotee" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* Devotee Sub-tabs */}
                            <div className="flex gap-2 mb-8">
                                <button
                                    onClick={() => { setDevoteeSubTab('explore'); setSelectedSeva(null); }}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${devoteeSubTab === 'explore' ? 'bg-emerald-800 text-teal-300 border border-teal-500/30' : 'text-emerald-100/40 hover:text-emerald-100/60'}`}
                                >
                                    Explore Remote Sevas
                                </button>
                                <button
                                    onClick={() => { setDevoteeSubTab('bookings'); setSelectedSeva(null); }}
                                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${devoteeSubTab === 'bookings' ? 'bg-emerald-800 text-teal-300 border border-teal-500/30' : 'text-emerald-100/40 hover:text-emerald-100/60'}`}
                                >
                                    My Sankalpas
                                    {sankalpas.length > 0 && <span className="bg-teal-500 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">{sankalpas.length}</span>}
                                </button>
                            </div>

                            {/* Sankalpa Booking Form */}
                            {selectedSeva && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
                                    <SankalpaBookingForm
                                        seva={selectedSeva}
                                        form={bookingForm}
                                        setForm={setBookingForm}
                                        onSubmit={handleSubmitSankalpa}
                                        onCancel={() => setSelectedSeva(null)}
                                        templeImage={getTempleImage(selectedSeva.templeId)}
                                        pandit={panditMap.get(selectedSeva.panditIds[0])}
                                    />
                                </motion.div>
                            )}

                            {devoteeSubTab === 'explore' && !selectedSeva && (
                                <div className="space-y-8">
                                    {/* Rural Temple Banner */}
                                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/60 to-emerald-950 border border-green-500/20 p-6 md:p-8">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/5 rounded-full blur-[80px] -mr-16 -mt-16" />
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                                                <Icon name="heart-hand" className="w-7 h-7 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-green-100">Supporting Rural Temple Pandits</h3>
                                                <p className="text-green-200/60 text-sm mt-1 max-w-2xl">
                                                    Your remote seva directly supports pandits and priests at ancient rural temples across India.
                                                    Every booking includes geotagged video proof, your name & gotra in the sankalpa, and sacred prasad delivered to your home.
                                                </p>
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-green-300 bg-green-900/50 px-3 py-1 rounded-full border border-green-500/20">
                                                        <Icon name="camera" className="w-3 h-3" /> Geotagged Video
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-green-300 bg-green-900/50 px-3 py-1 rounded-full border border-green-500/20">
                                                        <Icon name="package" className="w-3 h-3" /> Prasad Delivery
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-green-300 bg-green-900/50 px-3 py-1 rounded-full border border-green-500/20">
                                                        <Icon name="shield-check" className="w-3 h-3" /> Verified Pandits
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Filters */}
                                    <div className="flex flex-wrap gap-2">
                                        {SEVA_CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategoryFilter(cat)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                                    categoryFilter === cat
                                                        ? 'bg-teal-500 text-emerald-950 shadow-lg'
                                                        : 'bg-emerald-950/50 border border-emerald-500/20 text-emerald-100/60 hover:bg-emerald-500/10 hover:text-emerald-200'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Seva Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredSevas.map((seva, idx) => (
                                            <RemoteSevaCard
                                                key={seva.id}
                                                seva={seva}
                                                templeImage={getTempleImage(seva.templeId)}
                                                pandit={panditMap.get(seva.panditIds[0])}
                                                onBook={() => handleBookSeva(seva)}
                                                delay={idx * 0.08}
                                            />
                                        ))}
                                    </div>
                                    {filteredSevas.length === 0 && (
                                        <div className="text-center py-16 text-emerald-100/40">
                                            <Icon name="search" className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-semibold">No sevas found in this category</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Devotee - My Bookings / Sankalpas */}
                            {devoteeSubTab === 'bookings' && (
                                <DevoteeSankalpaDashboard
                                    sankalpas={sankalpas}
                                    sevas={sevas}
                                    panditMap={panditMap}
                                    statusSteps={STATUS_STEPS}
                                    getStatusIndex={getStatusIndex}
                                />
                            )}
                        </motion.div>
                    ) : (
                        /* ====== PANDIT SIDE ====== */
                        <motion.div key="pandit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <PanditDashboard
                                sankalpas={sankalpas}
                                sevas={sevas}
                                panditMap={panditMap}
                                statusSteps={STATUS_STEPS}
                                getStatusIndex={getStatusIndex}
                                onUpdateStatus={updateSankalpaStatus}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ==================== SUB-COMPONENTS ====================

/** Remote Seva Card */
const RemoteSevaCard = ({ seva, templeImage, pandit, onBook, delay }: {
    seva: RemoteSeva; templeImage: string; pandit?: Pandit; onBook: () => void; delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -5 }}
        className="group rounded-[2rem] bg-emerald-950/40 border border-emerald-500/10 overflow-hidden backdrop-blur-md shadow-2xl flex flex-col hover:border-emerald-400/30 transition-all duration-500"
    >
        <div className="h-48 relative overflow-hidden">
            {templeImage && <img src={templeImage} alt={seva.templeName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" referrerPolicy="no-referrer" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-[#022c22]/20 to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-emerald-950/80 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">{seva.category}</span>
                {seva.isRuralTemple && (
                    <span className="bg-green-900/80 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded border border-green-500/30 text-green-300 uppercase tracking-widest">Rural Temple</span>
                )}
            </div>
            <div className="absolute bottom-3 left-3 right-3">
                <h4 className="text-base font-bold text-white leading-tight">{seva.name}</h4>
                <p className="text-emerald-200/50 text-xs mt-1 flex items-center gap-1">
                    <Icon name="map-pin" className="w-3 h-3" /> {seva.templeLocation}
                </p>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-grow space-y-4">
            <p className="text-emerald-100/50 text-xs leading-relaxed line-clamp-2">{seva.description}</p>

            {/* Deliverables */}
            <div className="flex flex-wrap gap-1.5">
                {seva.deliverables.map(d => (
                    <span key={d} className="bg-emerald-900/50 border border-emerald-500/10 text-[9px] font-bold text-emerald-300/70 px-2 py-0.5 rounded-full">{d}</span>
                ))}
            </div>

            {/* Pandit Info */}
            {pandit && (
                <div className="flex items-center gap-2 bg-emerald-900/30 rounded-xl p-2 border border-emerald-500/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold flex-shrink-0">
                        {pandit.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-100 truncate">{pandit.name}</p>
                        <p className="text-[10px] text-emerald-300/50">{pandit.experience}yr exp • ⭐ {pandit.rating}</p>
                    </div>
                </div>
            )}

            {/* Price & Duration */}
            <div className="flex items-center justify-between pt-2 mt-auto">
                <div>
                    <p className="text-2xl font-black text-teal-300">₹{seva.cost.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-100/40 uppercase tracking-wider">{seva.duration}</p>
                </div>
                <button
                    onClick={onBook}
                    className="bg-teal-500 hover:bg-teal-400 text-emerald-950 font-black px-6 py-3 rounded-2xl text-xs transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                >
                    Book Seva
                </button>
            </div>
        </div>
    </motion.div>
);

/** Sankalpa Booking Form — Name, Gotra, Rashi, Nakshatra, Address */
const SankalpaBookingForm = ({ seva, form, setForm, onSubmit, onCancel, templeImage, pandit }: {
    seva: RemoteSeva;
    form: { devoteeName: string; gotra: string; rashi: string; nakshatra: string; address: string; pincode: string; phone: string; selectedDate: string };
    setForm: (f: typeof form) => void;
    onSubmit: () => void;
    onCancel: () => void;
    templeImage: string;
    pandit?: Pandit;
}) => {
    const update = (key: string, value: string) => setForm({ ...form, [key]: value });
    const minDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    return (
        <div className="rounded-[2rem] bg-emerald-950/60 border border-teal-500/20 overflow-hidden backdrop-blur-md">
            {/* Header with temple image */}
            <div className="relative h-36 overflow-hidden">
                {templeImage && <img src={templeImage} alt={seva.templeName} className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />}
                <div className="absolute inset-0 bg-gradient-to-r from-[#022c22] to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                    <p className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">Sankalpa Booking</p>
                    <h3 className="text-xl font-bold text-white">{seva.name}</h3>
                    <p className="text-xs text-emerald-100/50">{seva.templeName} • {seva.templeLocation}</p>
                </div>
                <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-900/80 flex items-center justify-center hover:bg-emerald-800 transition-colors">
                    <Icon name="x" className="w-4 h-4 text-emerald-100" />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Info Banner */}
                <div className="bg-teal-900/30 border border-teal-500/10 rounded-xl p-3 text-xs text-teal-200/70">
                    <strong className="text-teal-300">Your Name & Gotra will be recited during the Sankalpa</strong> — the pandit will take your details and invoke your presence in the ritual. You will receive geotagged video proof and prasad delivered home.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Devotee Name */}
                    <div>
                        <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Devotee Name (for Sankalpa) *</label>
                        <input
                            type="text"
                            value={form.devoteeName}
                            onChange={e => update('devoteeName', e.target.value)}
                            placeholder="Full name as to be recited"
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white placeholder-emerald-100/30 focus:border-teal-400 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Gotra */}
                    <div>
                        <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Gotra (Lineage) *</label>
                        <select
                            value={form.gotra}
                            onChange={e => update('gotra', e.target.value)}
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white focus:border-teal-400 focus:outline-none appearance-none"
                            required
                        >
                            <option value="" className="bg-emerald-950">Select Gotra</option>
                            {GOTRA_LIST.map(g => <option key={g} value={g} className="bg-emerald-950">{g}</option>)}
                        </select>
                    </div>

                    {/* Rashi */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-300/60 mb-1 uppercase tracking-wider">Rashi (Moon Sign)</label>
                        <select
                            value={form.rashi}
                            onChange={e => update('rashi', e.target.value)}
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white focus:border-teal-400 focus:outline-none appearance-none"
                        >
                            <option value="" className="bg-emerald-950">Optional — Select Rashi</option>
                            {RASHI_LIST.map(r => <option key={r} value={r} className="bg-emerald-950">{r}</option>)}
                        </select>
                    </div>

                    {/* Nakshatra */}
                    <div>
                        <label className="block text-xs font-bold text-emerald-300/60 mb-1 uppercase tracking-wider">Nakshatra (Birth Star)</label>
                        <select
                            value={form.nakshatra}
                            onChange={e => update('nakshatra', e.target.value)}
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white focus:border-teal-400 focus:outline-none appearance-none"
                        >
                            <option value="" className="bg-emerald-950">Optional — Select Nakshatra</option>
                            {NAKSHATRA_LIST.map(n => <option key={n} value={n} className="bg-emerald-950">{n}</option>)}
                        </select>
                    </div>

                    {/* Preferred Date */}
                    <div>
                        <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Preferred Date *</label>
                        <input
                            type="date"
                            value={form.selectedDate}
                            min={minDate}
                            onChange={e => update('selectedDate', e.target.value)}
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white focus:border-teal-400 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Phone Number *</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => update('phone', e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white placeholder-emerald-100/30 focus:border-teal-400 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Address for Prasad Delivery */}
                <div>
                    <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Delivery Address (for Prasad & Sacred Items) *</label>
                    <textarea
                        value={form.address}
                        onChange={e => update('address', e.target.value)}
                        placeholder="Full address including House No, Street, City, State"
                        rows={3}
                        className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white placeholder-emerald-100/30 focus:border-teal-400 focus:outline-none resize-none"
                        required
                    />
                </div>
                <div className="w-40">
                    <label className="block text-xs font-bold text-teal-300 mb-1 uppercase tracking-wider">Pincode *</label>
                    <input
                        type="text"
                        value={form.pincode}
                        onChange={e => update('pincode', e.target.value)}
                        placeholder="6-digit PIN"
                        maxLength={6}
                        className="w-full p-3 rounded-xl bg-emerald-900/50 border border-emerald-500/20 text-white placeholder-emerald-100/30 focus:border-teal-400 focus:outline-none"
                        required
                    />
                </div>

                {/* Deliverables Preview */}
                <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-500/10">
                    <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">You will receive</p>
                    <div className="flex flex-wrap gap-2">
                        {seva.deliverables.map(d => (
                            <span key={d} className="flex items-center gap-1 text-xs font-semibold text-emerald-200 bg-emerald-800/50 px-3 py-1 rounded-full border border-emerald-500/20">
                                <Icon name="check" className="w-3 h-3 text-teal-400" /> {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Pandit & Cost */}
                <div className="flex items-center justify-between">
                    {pandit && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-300">
                                {pandit.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-100">{pandit.name}</p>
                                <p className="text-[10px] text-emerald-300/50">{pandit.specialization}</p>
                            </div>
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-3xl font-black text-teal-300">₹{seva.cost.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-100/40 uppercase">Includes Prasad Delivery</p>
                    </div>
                </div>

                <button
                    onClick={onSubmit}
                    className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-emerald-950 font-black text-sm transition-all shadow-[0_0_25px_rgba(20,184,166,0.3)]"
                >
                    Confirm Sankalpa & Book Seva
                </button>
            </div>
        </div>
    );
};

/** Devotee Sankalpa Dashboard — Track Status */
const DevoteeSankalpaDashboard = ({ sankalpas, sevas, panditMap, statusSteps, getStatusIndex }: {
    sankalpas: Sankalpa[];
    sevas: RemoteSeva[];
    panditMap: Map<number, Pandit>;
    statusSteps: Sankalpa['status'][];
    getStatusIndex: (s: Sankalpa['status']) => number;
}) => {
    const getSevaForSankalpa = (s: Sankalpa) => sevas.find(sv => sv.id === s.sevaId);
    const stepLabels = ['Booked', 'Accepted', 'Ritual', 'Done', 'Video', 'Shipped', 'Delivered'];

    if (sankalpas.length === 0) {
        return (
            <div className="text-center py-20 text-emerald-100/40">
                <Icon name="receipt" className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2">No Sankalpas Yet</h3>
                <p className="text-sm">Book a remote seva to see your bookings and track prasad delivery here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
                <Icon name="receipt" className="text-teal-400" /> Your Sankalpas
            </h3>
            {sankalpas.map(sankalpa => {
                const seva = getSevaForSankalpa(sankalpa);
                const pandit = panditMap.get(sankalpa.panditId);
                const currentStep = getStatusIndex(sankalpa.status);

                return (
                    <div key={sankalpa.id} className="rounded-3xl bg-emerald-950/40 border border-emerald-500/20 p-6 backdrop-blur-md hover:border-emerald-400/30 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <h4 className="text-lg font-bold text-emerald-100">{seva?.name || 'Remote Seva'}</h4>
                                <p className="text-xs text-emerald-100/50">{seva?.templeName} • {sankalpa.date}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-emerald-100/40">
                                    <span>Devotee: <strong className="text-emerald-200">{sankalpa.devoteeName}</strong></span>
                                    <span>Gotra: <strong className="text-emerald-200">{sankalpa.gotra}</strong></span>
                                    {sankalpa.rashi && <span>Rashi: <strong className="text-emerald-200">{sankalpa.rashi}</strong></span>}
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                sankalpa.status === 'Delivered' ? 'bg-teal-500 text-emerald-950' :
                                sankalpa.status === 'PrasadShipped' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-emerald-500/20 text-emerald-400'
                            }`}>
                                {sankalpa.status}
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-emerald-100/30">
                                {stepLabels.map((label, i) => (
                                    <span key={label} className={i <= currentStep ? 'text-teal-400' : ''}>{label}</span>
                                ))}
                            </div>
                            <div className="h-1.5 w-full bg-emerald-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                                    style={{ width: `${((currentStep + 1) / statusSteps.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Action Row */}
                        <div className="flex items-center justify-between mt-4">
                            {pandit && (
                                <p className="text-xs text-emerald-100/40">
                                    Pandit: <strong className="text-emerald-200">{pandit.name}</strong> • {pandit.location}
                                </p>
                            )}
                            <div className="flex items-center gap-3">
                                {sankalpa.proofVideoUrl && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-teal-400">
                                        <Icon name="camera" className="w-3 h-3" /> Video Proof Available
                                    </span>
                                )}
                                {sankalpa.trackingId && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-blue-300">
                                        <Icon name="truck" className="w-3 h-3" /> Tracking: {sankalpa.trackingId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/** Pandit Dashboard — Accept Sevas, Upload Proof, Ship Prasad */
const PanditDashboard = ({ sankalpas, sevas, panditMap, statusSteps, getStatusIndex, onUpdateStatus }: {
    sankalpas: Sankalpa[];
    sevas: RemoteSeva[];
    panditMap: Map<number, Pandit>;
    statusSteps: Sankalpa['status'][];
    getStatusIndex: (s: Sankalpa['status']) => number;
    onUpdateStatus: (id: string, status: Sankalpa['status'], extras?: Partial<Sankalpa>) => void;
}) => {
    const getSevaForSankalpa = (s: Sankalpa) => sevas.find(sv => sv.id === s.sevaId);
    const nextStatus = (current: Sankalpa['status']): Sankalpa['status'] | null => {
        const idx = getStatusIndex(current);
        return idx < statusSteps.length - 1 ? statusSteps[idx + 1] : null;
    };

    const actionLabels: Record<string, string> = {
        'Accepted': 'Start Ritual',
        'InProgress': 'Mark Completed',
        'Completed': 'Upload Video Proof',
        'ProofUploaded': 'Ship Prasad & Items',
        'PrasadShipped': 'Confirm Delivery',
    };

    if (sankalpas.length === 0) {
        return (
            <div className="text-center py-20 text-emerald-100/40">
                <Icon name="user-edit" className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2">No Seva Requests Yet</h3>
                <p className="text-sm">When devotees book remote sevas at your temple, they will appear here for you to manage.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Icon name="clipboard-list" className="text-teal-400" /> Seva Management
                </h3>
                <div className="flex gap-3 text-xs">
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full font-bold">
                        {sankalpas.filter(s => s.status === 'Pending').length} Pending
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                        {sankalpas.filter(s => s.status === 'InProgress' || s.status === 'Accepted').length} Active
                    </span>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-emerald-900/30 border border-emerald-500/10 rounded-xl p-4">
                <h4 className="text-sm font-bold text-teal-300 mb-2">Pandit Workflow</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-emerald-100/60">
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center text-[8px] font-bold">1</span> Accept Booking</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[8px] font-bold">2</span> Perform &amp; Upload Video</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[8px] font-bold">3</span> Ship Prasad &amp; Sacred Items</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[8px] font-bold">4</span> Confirm Delivery</div>
                </div>
            </div>

            {/* Seva Cards */}
            {sankalpas.map(sankalpa => {
                const seva = getSevaForSankalpa(sankalpa);
                const next = nextStatus(sankalpa.status);
                const actionLabel = sankalpa.status === 'Pending' ? 'Accept Seva' : actionLabels[sankalpa.status] || null;

                return (
                    <div key={sankalpa.id} className="rounded-3xl bg-emerald-950/50 border border-emerald-500/20 overflow-hidden backdrop-blur-md">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-emerald-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                                <h4 className="text-lg font-bold">{seva?.name || 'Remote Seva'}</h4>
                                <p className="text-xs text-emerald-100/50">{seva?.templeName} • Scheduled: {sankalpa.date}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                sankalpa.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                sankalpa.status === 'Delivered' ? 'bg-teal-500 text-emerald-950' :
                                'bg-emerald-500/20 text-emerald-400'
                            }`}>
                                {sankalpa.status}
                            </div>
                        </div>

                        {/* Devotee Details */}
                        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-emerald-900/30 rounded-xl p-3 border border-emerald-500/10">
                                <p className="text-[10px] text-emerald-300/50 uppercase tracking-wider font-bold mb-1">Sankalpa Details</p>
                                <p className="text-sm text-emerald-100"><strong>Name:</strong> {sankalpa.devoteeName}</p>
                                <p className="text-sm text-emerald-100"><strong>Gotra:</strong> {sankalpa.gotra}</p>
                                {sankalpa.rashi && <p className="text-sm text-emerald-100"><strong>Rashi:</strong> {sankalpa.rashi}</p>}
                                {sankalpa.nakshatra && <p className="text-sm text-emerald-100"><strong>Nakshatra:</strong> {sankalpa.nakshatra}</p>}
                            </div>
                            <div className="bg-emerald-900/30 rounded-xl p-3 border border-emerald-500/10">
                                <p className="text-[10px] text-emerald-300/50 uppercase tracking-wider font-bold mb-1">Prasad Delivery Address</p>
                                <p className="text-sm text-emerald-100">{sankalpa.address}</p>
                                <p className="text-sm text-emerald-100">PIN: {sankalpa.pincode}</p>
                                <p className="text-sm text-emerald-100">Phone: {sankalpa.phone}</p>
                            </div>
                            <div className="bg-emerald-900/30 rounded-xl p-3 border border-emerald-500/10">
                                <p className="text-[10px] text-emerald-300/50 uppercase tracking-wider font-bold mb-1">Deliverables</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {seva?.deliverables.map(d => (
                                        <span key={d} className="text-[10px] font-semibold text-emerald-300 bg-emerald-800/50 px-2 py-0.5 rounded-full">{d}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        {next && actionLabel && (
                            <div className="px-6 py-4 border-t border-emerald-500/10 flex items-center justify-between">
                                {sankalpa.status === 'Completed' && (
                                    <p className="text-xs text-emerald-100/40">Upload geotagged video of the completed ritual</p>
                                )}
                                {sankalpa.status === 'ProofUploaded' && (
                                    <p className="text-xs text-emerald-100/40">Ship prasad, sacred thread &amp; other items to devotee</p>
                                )}
                                {sankalpa.status === 'Pending' && (
                                    <p className="text-xs text-emerald-100/40">Review details &amp; accept this seva request</p>
                                )}
                                {!['Pending', 'Completed', 'ProofUploaded'].includes(sankalpa.status) && <div />}
                                <button
                                    onClick={() => {
                                        const extras: Partial<Sankalpa> = {};
                                        if (next === 'ProofUploaded') {
                                            extras.proofVideoUrl = `https://seva-proof.dharmasetu.app/${sankalpa.id}/video.mp4`;
                                        }
                                        if (next === 'PrasadShipped') {
                                            extras.trackingId = `DS${Date.now().toString().slice(-8)}`;
                                        }
                                        onUpdateStatus(sankalpa.id, next, extras);
                                    }}
                                    className={`px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                                        sankalpa.status === 'Pending'
                                            ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950'
                                            : 'bg-teal-500 hover:bg-teal-400 text-emerald-950'
                                    }`}
                                >
                                    {actionLabel}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

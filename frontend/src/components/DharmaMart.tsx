import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { I18nContent, Language } from '../types';
import { fetchFeaturedPujas, fetchPujasByOccasion, fetchPujaDetail, fetchPandits } from '../services/martService';

// ─── Types ───────────────────────────────────
interface PujaTier { name: string; price: number; description?: string; includes: string[]; excludes?: string[]; }
interface Puja {
    id: number; name: string; slug: string; deity: string; deityImage: string; bannerImage: string;
    description: string; significance: string; duration: string; occasionType: string;
    supportedTraditions: string[]; bestTimeGuidance: string; featured: boolean; popular: boolean;
    rating: number; bookingCount: number;
    tiers: { essential: PujaTier; complete: PujaTier; sampoorna: PujaTier; };
}
interface Pandit {
    id: number; name: string; photo: string; title: string; languages: string[];
    experience: number; location: string; tradition: string; sampradaya: string;
    rating: number; reviewCount: number; completedPujas: number; verified: boolean; senior: boolean;
    hourlyRate: number;
}

// ─── Constants ───────────────────────────────
const OCCASION_LABELS: Record<string, { label: string; emoji: string; gradient: string }> = {
    festival: { label: 'Grand Festivals', emoji: '🪔', gradient: 'from-amber-500 via-orange-500 to-red-600' },
    vrat: { label: 'Vrats & Parayanam', emoji: '📜', gradient: 'from-emerald-500 via-teal-600 to-cyan-700' },
    'life-event': { label: 'Life Events & Samskaras', emoji: '🌺', gradient: 'from-rose-500 via-pink-600 to-purple-600' },
    special: { label: 'Special & Planetary Shanti', emoji: '🔮', gradient: 'from-purple-600 via-indigo-600 to-blue-700' },
    purnima: { label: 'Purnima & Auspicious Days', emoji: '🌕', gradient: 'from-amber-400 via-yellow-500 to-amber-600' }
};

const TRADITIONS = [
    { id: 'telugu', label: 'Telugu', script: 'తెలుగు' },
    { id: 'tamil', label: 'Tamil', script: 'தமிழ்' },
    { id: 'kannada', label: 'Kannada', script: 'ಕನ್ನಡ' },
    { id: 'marathi', label: 'Marathi', script: 'मराठी' },
    { id: 'north-indian', label: 'North Indian', script: 'हिन्दी' }
];

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: string }) => {
    const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Icon key={i} name="star" className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
            ))}
        </div>
    );
};

// ─── Stunning Puja Card ──────────────────────
const PujaCard = ({ puja, onSelect }: { puja: Puja; onSelect: (p: Puja) => void }) => (
    <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        onClick={() => onSelect(puja)}
        className="group relative bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden border border-amber-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(217,119,6,0.25)] hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col"
    >
        {/* Top Gold Border Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />

        <div className="relative h-48 overflow-hidden">
            <img src={puja.deityImage} alt={puja.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {puja.popular && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-300/30 backdrop-blur-md flex items-center gap-1">
                    ✨ Highly Revered
                </span>
            )}
            
            <div className="absolute bottom-3 left-4 right-4">
                <span className="text-amber-300 text-[11px] font-semibold tracking-wider uppercase drop-shadow-md">
                    {puja.deity}
                </span>
                <h3 className="text-white font-serif font-bold text-lg leading-tight drop-shadow-md">{puja.name}</h3>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-1 justify-between bg-gradient-to-b from-white to-amber-50/20">
            <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed mb-4">
                {puja.description}
            </p>

            <div className="pt-3 border-t border-amber-100 flex items-center justify-between mt-auto">
                <div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold block">All 3 Tiers From</span>
                    <span className="text-xl font-bold text-amber-700 font-serif">₹{puja.tiers.essential.price.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                        <StarRating rating={puja.rating} />
                        <span className="text-xs font-bold text-stone-700 ml-1">{puja.rating}</span>
                    </div>
                    <span className="text-[10px] text-amber-800/60 font-medium">{puja.bookingCount}+ Devotees</span>
                </div>
            </div>
        </div>
    </motion.div>
);

// ─── Pandit Card ─────────────────────────────
const PanditCard = ({ pandit }: { pandit: Pandit }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-amber-200/50 shadow-sm hover:shadow-md hover:border-amber-300 transition-all">
        <div className="flex items-start gap-4">
            <img src={pandit.photo} alt={pandit.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/40 shadow-sm" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{pandit.name}</h4>
                    {pandit.verified && <span className="text-amber-500 text-xs" title="Verified Priest">✓</span>}
                    {pandit.senior && <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded shadow-sm">SENIOR</span>}
                </div>
                <p className="text-stone-500 text-xs mb-1.5">{pandit.title} · {pandit.experience} yrs exp</p>
                <div className="flex items-center gap-3">
                    <StarRating rating={pandit.rating} />
                    <span className="text-[10px] text-stone-400 font-medium">{pandit.completedPujas} pujas conducted</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                    {pandit.languages.map(l => <span key={l} className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full font-medium">{l}</span>)}
                </div>
            </div>
        </div>
    </div>
);

// ─── Puja Detail Modal ──────────────────────
const PujaDetailModal = ({ puja, onClose, kitData, pandits }: { puja: Puja; onClose: () => void; kitData: any; pandits: Pandit[] }) => {
    const [selectedTier, setSelectedTier] = useState<'essential' | 'complete' | 'sampoorna'>('complete');
    const [selectedTradition, setSelectedTradition] = useState('telugu');
    const [showKitDetails, setShowKitDetails] = useState(false);
    const [bookingStep, setBookingStep] = useState(0);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingName, setBookingName] = useState('');
    const [bookingPhone, setBookingPhone] = useState('');
    const [bookingAddress, setBookingAddress] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const currentTier = puja.tiers[selectedTier];

    const buildBreakdown = () => {
        const items = [];
        const kitPrice = selectedTier === 'essential' ? Math.round(currentTier.price * 0.5) :
                         selectedTier === 'complete' ? Math.round(currentTier.price * 0.25) :
                         Math.round(currentTier.price * 0.2);
        items.push({ emoji: '📦', label: 'Authentic Puja Kit & Samagri', price: kitPrice });
        if (selectedTier !== 'essential') {
            items.push({ emoji: '🌸', label: 'Fresh Flowers & Sacred Leaves', price: selectedTier === 'complete' ? 199 : 399 });
            items.push({ emoji: '🍌', label: 'Fruits & Naivedyam Materials', price: selectedTier === 'complete' ? 199 : 499 });
        }
        items.push({ emoji: '🧑‍🦳', label: selectedTier === 'essential' ? 'Online Pandit Guidance' : selectedTier === 'complete' ? 'Verified Pandit at Home' : 'Senior Experienced Vedic Priest',
            price: selectedTier === 'essential' ? 0 : selectedTier === 'complete' ? 1000 : 2000 });
        items.push({ emoji: '📖', label: 'Puja Vidhi & Vrat Katha Book', price: selectedTier === 'essential' ? 0 : selectedTier === 'complete' ? 49 : 99 });
        items.push({ emoji: '🚚', label: 'Devotional Setup & Delivery', price: selectedTier === 'essential' ? 49 : selectedTier === 'complete' ? 99 : 0 });
        return items;
    };
    const breakdown = buildBreakdown();
    const total = breakdown.reduce((s, b) => s + b.price, 0);

    const handleBook = async () => {
        setIsBooking(true);
        setTimeout(() => { setIsBooking(false); setBookingSuccess(true); }, 1200);
    };

    if (bookingSuccess) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-stone-900 via-amber-950 to-stone-900 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-400/40">
                        <span className="text-4xl">🙏</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-amber-300 mb-2">Puja Service Confirmed!</h2>
                    <p className="text-amber-100/80 text-sm mb-1">{puja.name}</p>
                    <p className="text-xs text-amber-200/60 mb-6">{selectedTier.toUpperCase()} TIER · {TRADITIONS.find(t => t.id === selectedTradition)?.label} Tradition</p>
                    
                    <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/10">
                        <p className="text-xs text-amber-100/70 mb-1">Total Composite Amount</p>
                        <p className="text-3xl font-bold text-amber-300 font-serif">₹{total.toLocaleString('en-IN')}</p>
                    </div>

                    <button onClick={onClose} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg hover:brightness-110 transition-all">
                        May Divine Blessings Be With You
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md overflow-y-auto" onClick={onClose}>
            <div className="min-h-screen flex items-start justify-center p-4 pt-6 pb-20">
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 25 }}
                    className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-amber-200" onClick={e => e.stopPropagation()}>

                    {/* Banner Header */}
                    <div className="relative h-56 md:h-64 overflow-hidden">
                        <img src={puja.bannerImage} alt={puja.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
                        <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/70 transition-colors">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-5 left-6 right-6 text-white">
                            <span className="bg-amber-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                                {puja.deity}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white drop-shadow-md">{puja.name}</h2>
                            <div className="flex items-center gap-4 mt-2 text-amber-200 text-xs font-medium">
                                <div className="flex items-center gap-1"><StarRating rating={puja.rating} /><span>{puja.rating} ({puja.bookingCount} bookings)</span></div>
                                <span>⏱️ {puja.duration}</span>
                            </div>
                        </div>
                    </div>

                    {bookingStep === 0 ? (
                        <div className="p-6 md:p-8 space-y-8">
                            {/* Significance */}
                            <div>
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-2 flex items-center gap-2">
                                    <span>🙏</span> Sacred Significance
                                </h3>
                                <p className="text-stone-600 text-sm leading-relaxed">{puja.significance}</p>
                            </div>

                            {/* Tradition Selector */}
                            <div>
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-2 flex items-center gap-2">
                                    <span>🌿</span> Select Your Regional Tradition
                                </h3>
                                <p className="text-stone-500 text-xs mb-3">Rituals adapt to your family's exact sampradaya and regional customs.</p>
                                <div className="flex flex-wrap gap-2">
                                    {TRADITIONS.filter(t => puja.supportedTraditions.includes(t.id)).map(t => (
                                        <button key={t.id} onClick={() => setSelectedTradition(t.id)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                selectedTradition === t.id
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                                                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400'
                                            }`}>
                                            <span className="opacity-75 mr-1.5">{t.script}</span> {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3 Tier Selector */}
                            <div>
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-3 flex items-center gap-2">
                                    <span>💎</span> Select Service Level
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['essential', 'complete', 'sampoorna'] as const).map(tKey => {
                                        const td = puja.tiers[tKey];
                                        const isSelected = selectedTier === tKey;
                                        return (
                                            <button key={tKey} onClick={() => setSelectedTier(tKey)}
                                                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/50 shadow-lg'
                                                        : 'bg-white border-stone-200 hover:border-amber-300'
                                                }`}>
                                                {tKey === 'complete' && (
                                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md">
                                                        Most Popular
                                                    </span>
                                                )}
                                                <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">{tKey}</p>
                                                <p className="text-2xl font-serif font-bold text-stone-900 mb-2">₹{td.price.toLocaleString('en-IN')}</p>
                                                <ul className="space-y-1.5">
                                                    {td.includes.map((inc, i) => (
                                                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                                                            <span className="text-amber-500 font-bold">✓</span>
                                                            <span>{inc}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* What's Inside & Why */}
                            {kitData && (
                                <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200/60">
                                    <button onClick={() => setShowKitDetails(!showKitDetails)}
                                        className="w-full flex items-center justify-between text-amber-900 font-bold text-sm">
                                        <span className="flex items-center gap-2">📜 "What's Inside & Why" Kit Transparency</span>
                                        <Icon name={showKitDetails ? 'chevron-down' : 'chevron-right'} className="w-5 h-5" />
                                    </button>

                                    {showKitDetails && (
                                        <div className="mt-4 space-y-2.5 pt-3 border-t border-amber-200/60">
                                            {kitData.tiers?.essential?.items?.map((item: any, i: number) => (
                                                <div key={i} className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm text-xs">
                                                    <p className="font-bold text-stone-900">{item.name} <span className="text-amber-700 font-normal">({item.quantity})</span></p>
                                                    <p className="text-stone-500 text-[11px] mt-0.5">{item.why}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Composite Price Breakdown */}
                            <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl">
                                <h4 className="font-serif font-bold text-base text-amber-300 mb-4">🛒 Single Composite Price Breakdown</h4>
                                <div className="space-y-2 text-xs">
                                    {breakdown.map((b, i) => (
                                        <div key={i} className="flex justify-between items-center py-1 border-b border-stone-800">
                                            <span className="text-stone-300">{b.emoji} {b.label}</span>
                                            <span className="font-bold text-amber-200">₹{b.price.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-3 text-base font-bold text-white">
                                        <span>Total Amount</span>
                                        <span className="text-2xl text-amber-400 font-serif">₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setBookingStep(1)}
                                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold py-4 rounded-2xl text-base shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                <span>Proceed to Book {puja.name}</span>
                                <Icon name="chevron-right" className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* Booking Form */
                        <div className="p-6 md:p-8 space-y-6">
                            <button onClick={() => setBookingStep(0)} className="text-xs text-stone-500 hover:text-amber-700 flex items-center gap-1 font-semibold">
                                ← Back to Puja details
                            </button>

                            <h3 className="font-serif font-bold text-xl text-stone-900">📅 Finalize Puja Booking</h3>

                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Puja Date *</label>
                                    <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full" />
                                </div>

                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Devotee Full Name *</label>
                                    <input type="text" required value={bookingName} onChange={e => setBookingName(e.target.value)} placeholder="Full Name" className="w-full" />
                                </div>

                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Contact Phone Number *</label>
                                    <input type="tel" required value={bookingPhone} onChange={e => setBookingPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full" />
                                </div>

                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Puja Location Address *</label>
                                    <textarea required value={bookingAddress} onChange={e => setBookingAddress(e.target.value)} placeholder="Complete home address for setup & Pandit arrival" rows={3} className="w-full resize-none" />
                                </div>

                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Special Family Traditions or Notes</label>
                                    <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Any specific gothram, family deity preference, or instructions..." rows= {2} className="w-full resize-none" />
                                </div>
                            </div>

                            <button onClick={handleBook} disabled={isBooking || !bookingDate || !bookingName || !bookingPhone || !bookingAddress}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-2xl text-base shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {isBooking ? 'Confirming Puja...' : `Confirm Booking — ₹${total.toLocaleString('en-IN')}`}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

// ─── Main DharmaMart Storefront Component ─────
export const DharmaMart = ({ t, language }: { t: I18nContent; language: Language }) => {
    const [featuredPujas, setFeaturedPujas] = useState<Puja[]>([]);
    const [occasions, setOccasions] = useState<Record<string, Puja[]>>({});
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPuja, setSelectedPuja] = useState<Puja | null>(null);
    const [pujaKitData, setPujaKitData] = useState<any>(null);
    const [pujaAvailablePandits, setPujaAvailablePandits] = useState<Pandit[]>([]);
    const [activeOccasion, setActiveOccasion] = useState('festival');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [featRes, occRes, panRes] = await Promise.all([
                    fetchFeaturedPujas(),
                    fetchPujasByOccasion(),
                    fetchPandits()
                ]);
                if (featRes.success) setFeaturedPujas(featRes.data.pujas);
                if (occRes.success) setOccasions(occRes.data.occasions);
                if (panRes.success) setPandits(panRes.data.pandits);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, []);

    const handleSelectPuja = useCallback(async (puja: Puja) => {
        setSelectedPuja(puja);
        try {
            const res = await fetchPujaDetail(puja.id);
            if (res.success) {
                setPujaKitData(res.data.kit);
                setPujaAvailablePandits(res.data.pandits || []);
            }
        } catch (e) { console.error(e); }
    }, []);

    return (
        <div className="relative min-h-screen bg-[#FAF8F5] text-stone-900">
            {/* ─── Hero Header ─── */}
            <div className="relative h-[480px] bg-stone-900 overflow-hidden flex items-center justify-center text-center">
                <img src="https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=1600" alt="Devotional Background" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-amber-950/60 to-[#FAF8F5]" />

                <div className="relative z-10 px-4 max-w-4xl mx-auto space-y-4">
                    <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md">
                        🛕 COMPLETE PUJA SERVICE PLATFORM
                    </span>
                    
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight drop-shadow-lg">
                        Puja. Samagri. Pandit.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Everything with Devotion.</span>
                    </h1>

                    <p className="text-amber-100/90 text-base md:text-lg font-light max-w-2xl mx-auto">
                        From Samagri to Seva — We Take Care of Everything.
                    </p>
                </div>
            </div>

            {/* ─── Main Content Container ─── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 space-y-16 pb-24">

                {/* How It Works Banner */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-amber-200/80 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    {[
                        { emoji: '🛕', title: 'Choose Your Puja', desc: 'Satyanarayan, Ganesh Chaturthi, Griha Pravesh & more' },
                        { emoji: '🌿', title: 'Select Tradition', desc: 'Telugu, Tamil, Kannada, Marathi, or North Indian' },
                        { emoji: '💎', title: 'Pick Service Level', desc: 'Essential, Complete, or Sampoorna (From ₹499)' },
                        { emoji: '📅', title: '1-Click Booking', desc: 'Kit + Fresh Flowers + Naivedyam + Pandit bundled' }
                    ].map((step, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/80">
                            <span className="text-3xl mb-2 block">{step.emoji}</span>
                            <h3 className="font-serif font-bold text-stone-900 text-sm mb-1">{step.title}</h3>
                            <p className="text-stone-500 text-xs">{step.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Featured Pujas Section */}
                <section>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-stone-900">✨ Highly Revered Pujas</h2>
                            <p className="text-stone-500 text-xs mt-1">Select any Puja to inspect service levels, kit transparency & book</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredPujas.map(puja => (
                            <PujaCard key={puja.id} puja={puja} onSelect={handleSelectPuja} />
                        ))}
                    </div>
                </section>

                {/* Browse by Occasion */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-serif font-bold text-stone-900">🗂️ Browse Pujas by Occasion</h2>
                        <p className="text-stone-500 text-xs mt-1">Explore rituals tailored to your spiritual needs</p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                        {Object.entries(OCCASION_LABELS).map(([key, val]) => (
                            <button key={key} onClick={() => setActiveOccasion(key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                    activeOccasion === key
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-white text-stone-700 border border-amber-200 hover:border-amber-400'
                                }`}>
                                <span>{val.emoji}</span>
                                <span>{val.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                        {(occasions[activeOccasion] || []).map(puja => (
                            <PujaCard key={puja.id} puja={puja} onSelect={handleSelectPuja} />
                        ))}
                    </div>
                </section>

                {/* Verified Pandit Network */}
                <section className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-amber-200/60 shadow-lg space-y-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900">🧑‍🦳 Verified Pandit Network</h2>
                        <p className="text-stone-500 text-xs mt-1">Experienced Vedic scholars fluent in your native language & sampradaya</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pandits.slice(0, 6).map(p => (
                            <PanditCard key={p.id} pandit={p} />
                        ))}
                    </div>
                </section>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedPuja && (
                    <PujaDetailModal
                        puja={selectedPuja}
                        onClose={() => { setSelectedPuja(null); setPujaKitData(null); setPujaAvailablePandits([]); }}
                        kitData={pujaKitData}
                        pandits={pujaAvailablePandits}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

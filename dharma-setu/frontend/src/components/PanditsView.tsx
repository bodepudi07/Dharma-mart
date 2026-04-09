import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { I18nContent, Pandit, Language } from '../types';
import * as api from '../services/apiService';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PanditCard } from './PanditCard';
import { Icon } from './Icon';
import { CardAnimator } from './CardAnimator';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface PanditsViewProps {
    t: I18nContent;
    language: Language;
}

const SPECIALIZATION_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Vedic Rituals', value: 'vedic' },
    { label: 'Jyotish & Graha Shanti', value: 'jyotish' },
    { label: 'Homas & Yagnas', value: 'homa' },
    { label: 'Samskar Ceremonies', value: 'samskar' },
    { label: 'Bhakti & Katha', value: 'bhakti' },
];

const SERVICE_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Online', value: 'Online' },
    { label: 'Offline (In-person)', value: 'Offline' },
];

export const PanditsView = ({ t, language }: PanditsViewProps) => {
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [specFilter, setSpecFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'cost'>('rating');
    const { openModal } = useModal();
    const { currentUser } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        let isCancelled = false;
        const loadPandits = async () => {
            setIsLoading(true);
            try {
                const data = await api.getPandits(language);
                if (!isCancelled) {
                    setPandits(data.filter((p: Pandit) => p.status === 'verified'));
                }
            } catch (error) {
                addToast('Failed to load pandits', 'error');
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };
        loadPandits();

        const handleDataUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.key === 'pandits') loadPandits();
        };
        window.addEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);
        return () => {
            isCancelled = true;
            window.removeEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);
        };
    }, [language, addToast]);

    const matchesSpec = useCallback((pandit: Pandit, filter: string) => {
        if (filter === 'all') return true;
        const spec = pandit.specialization.toLowerCase();
        const specialties = pandit.specialties.map(s => s.toLowerCase()).join(' ');
        const combined = spec + ' ' + specialties;
        switch (filter) {
            case 'vedic': return combined.includes('vedic') || combined.includes('rudra') || combined.includes('abhishek');
            case 'jyotish': return combined.includes('jyotish') || combined.includes('graha') || combined.includes('dosh') || combined.includes('shani');
            case 'homa': return combined.includes('homa') || combined.includes('havan') || combined.includes('yagna') || combined.includes('fire');
            case 'samskar': return combined.includes('vivah') || combined.includes('samskar') || combined.includes('griha') || combined.includes('namakarana') || combined.includes('vastu');
            case 'bhakti': return combined.includes('bhakti') || combined.includes('katha') || combined.includes('sunderkand') || combined.includes('ramayan') || combined.includes('path');
            default: return true;
        }
    }, []);

    const filteredPandits = useMemo(() => {
        let result = pandits;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                p.specialization.toLowerCase().includes(q) ||
                p.specialties.some(s => s.toLowerCase().includes(q))
            );
        }

        result = result.filter(p => matchesSpec(p, specFilter));

        if (serviceFilter !== 'all') {
            result = result.filter(p => p.services.includes(serviceFilter as 'Online' | 'Offline'));
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'rating': return b.rating - a.rating;
                case 'experience': return b.experience - a.experience;
                case 'cost': return a.cost - b.cost;
                default: return 0;
            }
        });

        return result;
    }, [pandits, searchQuery, specFilter, serviceFilter, sortBy, matchesSpec]);

    const handleBookPandit = (pandit: Pandit) => {
        openModal('panditBooking', { pandit });
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
                <div className="h-12 bg-stone-200 rounded-lg w-64 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden h-96">
                            <div className="h-56 bg-stone-200"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-6 bg-stone-200 rounded w-3/4"></div>
                                <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                                <div className="h-10 bg-stone-200 rounded-full w-full mt-4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold font-heading">Pandits & Purohits</h1>
                    <p className="text-text-muted mt-2">
                        Find experienced and verified Vedic scholars for all your spiritual needs — from temple rituals and home poojas to horoscope consultations.
                    </p>
                </div>
                <button
                    onClick={() => openModal('panditRegistration')}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md self-start md:self-auto"
                >
                    <Icon name="user-edit" className="w-5 h-5" />
                    <span>Register as a Pandit</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md mb-8 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by name, location, or specialization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-100 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Specialization Filter */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-muted mb-1">Specialization</label>
                        <div className="flex flex-wrap gap-2">
                            {SPECIALIZATION_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setSpecFilter(f.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        specFilter === f.value
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-stone-100 text-text-muted hover:bg-stone-200'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Service Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Service Mode</label>
                        <div className="flex gap-2">
                            {SERVICE_FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setServiceFilter(f.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        serviceFilter === f.value
                                            ? 'bg-secondary text-white shadow-md'
                                            : 'bg-stone-100 text-text-muted hover:bg-stone-200'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="px-3 py-2 bg-stone-100 rounded-lg border border-stone-200 text-sm"
                        >
                            <option value="rating">Highest Rated</option>
                            <option value="experience">Most Experienced</option>
                            <option value="cost">Lowest Cost</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6 text-sm text-text-muted">
                <span className="font-semibold text-text-base">{filteredPandits.length} Pandits Found</span>
                <span className="flex items-center gap-1">
                    <Icon name="star" className="w-4 h-4 text-yellow-500" />
                    Avg. Rating: {filteredPandits.length > 0 ? (filteredPandits.reduce((sum, p) => sum + p.rating, 0) / filteredPandits.length).toFixed(1) : '—'}
                </span>
                <span>
                    Avg. Exp: {filteredPandits.length > 0 ? Math.round(filteredPandits.reduce((sum, p) => sum + p.experience, 0) / filteredPandits.length) : '—'} years
                </span>
            </div>

            {/* Pandit Cards Grid */}
            {filteredPandits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPandits.map((pandit) => (
                        <CardAnimator key={pandit.id}>
                            <PanditDetailCard pandit={pandit} t={t} onBook={handleBookPandit} />
                        </CardAnimator>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Icon name="search" className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-base mb-2">No pandits found</h3>
                    <p className="text-text-muted">Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
};

/** Enhanced pandit card with expanded details for the dedicated view */
const PanditDetailCard = React.memo(({ pandit, t, onBook }: { pandit: Pandit; t: I18nContent; onBook: (p: Pandit) => void }) => {
    const [expanded, setExpanded] = useState(false);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availableDays = pandit.availability?.days?.map(d => dayNames[d]).join(', ') || 'All days';
    const hours = pandit.availability?.hours?.[0];
    const timings = hours ? `${hours.start} - ${hours.end}` : 'Flexible';

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-stone-100 hover:shadow-xl transition-shadow h-full">
            {/* Header with avatar/initials */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent p-6 relative">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0 border-2 border-primary/30">
                        {pandit.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-text-base truncate">{pandit.name}</h3>
                        <p className="text-sm text-primary font-medium">{pandit.specialization}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                            <Icon name="map-pin" className="w-3 h-3" />
                            {pandit.location}
                        </p>
                    </div>
                </div>
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-2.5 py-1 text-sm font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <Icon name="star" className="w-4 h-4" />
                    {pandit.rating.toFixed(1)}
                </div>
            </div>

            {/* Key stats */}
            <div className="px-6 py-3 grid grid-cols-3 gap-2 border-b border-stone-100">
                <div className="text-center">
                    <p className="text-lg font-bold text-primary">{pandit.experience}</p>
                    <p className="text-xs text-text-muted">Years Exp.</p>
                </div>
                <div className="text-center border-x border-stone-100">
                    <p className="text-lg font-bold text-primary">₹{pandit.cost.toLocaleString()}</p>
                    <p className="text-xs text-text-muted">Starting</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-primary">{pandit.specialties.length}</p>
                    <p className="text-xs text-text-muted">Poojas</p>
                </div>
            </div>

            {/* Service modes */}
            <div className="px-6 py-3 flex items-center gap-2">
                {pandit.services.map(s => (
                    <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s === 'Online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {s === 'Online' ? '🌐 Online' : '🏠 In-person'}
                    </span>
                ))}
            </div>

            {/* Expandable poojas section */}
            <div className="px-6 py-3 flex-grow">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-between w-full text-sm font-semibold text-text-base hover:text-primary transition-colors"
                >
                    <span>Poojas Performed ({pandit.specialties.length})</span>
                    <Icon name="chevron-left" className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {expanded && (
                    <div className="mt-2 space-y-1.5">
                        {pandit.specialties.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                                <Icon name="om" className="w-3 h-3 text-primary flex-shrink-0" />
                                <span>{s}</span>
                            </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-stone-100 text-xs text-text-muted space-y-1">
                            <p className="flex items-center gap-1">
                                <Icon name="calendar" className="w-3 h-3" />
                                Available: {availableDays}
                            </p>
                            <p className="flex items-center gap-1">
                                <Icon name="clock" className="w-3 h-3" />
                                Timings: {timings}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Book button */}
            <div className="p-4 pt-2 mt-auto">
                <button
                    onClick={() => onBook(pandit)}
                    className="w-full bg-primary text-white font-bold py-3 px-6 rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-[1.02] shadow-md"
                >
                    {t.bookPandit}
                </button>
            </div>
        </div>
    );
});

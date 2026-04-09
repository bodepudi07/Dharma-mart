
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import { I18nContent, Temple, Pooja, Yatra, Book, MajorEvent, ContentType, ModalType, Language, Pandit } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Components
import { CardAnimator } from './CardAnimator';
import { TempleCard } from './TempleCard';
import { PoojaCard } from './PoojaCard';
import { YatraCard } from './YatraCard';
import { BookCard } from './BookCard';
import { EventCard } from './EventCard';
import { TempleCardSkeleton } from './TempleCardSkeleton';
import { PoojaCardSkeleton } from './PoojaCardSkeleton';
import { YatraCardSkeleton } from './YatraCardSkeleton';
import { BookCardSkeleton } from './BookCardSkeleton';
import { EventCardSkeleton } from './EventCardSkeleton';
import { Icon } from './Icon';

// --- Location & Distance Utils ---
const INDIAN_CITIES = [
    { name: 'Delhi / NCR', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Noida / Ghaziabad', lat: 28.5355, lng: 77.3910 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
    { name: 'Patna', lat: 25.6093, lng: 85.1376 },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTransportCost(distanceKm: number, ratePerKm: number): number {
    if (distanceKm <= 30) return 0;
    return Math.round((distanceKm - 30) * ratePerKm);
}

const typeToTitleMap: Record<ContentType, keyof I18nContent> = {
    temples: 'navTemples',
    poojas: 'navPoojaServices',
    yatras: 'navYatras',
    events: 'navEvents',
};

const templeCategoryGroups = [
    {
        title: "Major Circuits",
        categories: [
            { name: "Adi Shankara's Char Dham", tag: 'char dham' },
            { name: "Himalayan Char Dham", tag: 'himalayan char dham' },
            { name: '12 Jyotirlingas', tag: 'jyotirlinga' },
            { name: 'Panchabhoota Sthalams', tag: 'panchabhoota' },
        ]
    },
    {
        title: "Deity Traditions",
        categories: [
            { name: 'Shaiva Temples', tag: 'shiva' },
            { name: 'Vaishnava Temples', tag: 'vaishnava' },
            { name: 'Shakta Pithas', tag: 'shakta' },
        ]
    },
    {
        title: "Other Sacred Sites",
        categories: [
            { name: 'Shankar Mutts', tag: 'shankar mutt' },
            { name: 'Other Major Shrines', tag: 'other_major' }
        ]
    }
];

const CANONICAL_SORT_TAGS = new Set(['char dham', 'himalayan char dham', 'jyotirlinga', 'panchabhoota']);


export interface GridViewProps {
    t: I18nContent;
    type: ContentType;
    language: Language;
    onDarshanClick: (temple: Temple) => void;
    // Make these optional since they only apply to temples
    yatraPlan?: Temple[];
    isInYatraPlan?: (templeId: number) => boolean;
    onToggleYatraPlan?: (temple: Temple) => void;
}

export const GridView = ({ t, type, language, onDarshanClick, yatraPlan, isInYatraPlan, onToggleYatraPlan }: GridViewProps) => {
    const [allItems, setAllItems] = useState<any[]>([]);
    const [allPandits, setAllPandits] = useState<Pandit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRegion, setActiveRegion] = useState('All');

    // Pandit sub-tab state (only for poojas view)
    const [poojaSubTab, setPoojaSubTab] = useState<'services' | 'pandits'>('services');
    const [userCityIndex, setUserCityIndex] = useState<number>(-1);
    const [panditSearch, setPanditSearch] = useState('');
    const [panditServiceFilter, setPanditServiceFilter] = useState<'all' | 'Online' | 'Offline'>('all');
    const [panditSortBy, setPanditSortBy] = useState<'distance' | 'rating' | 'cost'>('distance');

    const { openModal, closeModal } = useModal();
    const { currentUser } = useAuth();
    const { addToast } = useToast();


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let data: any[] = [];
            switch (type) {
                case 'temples': data = await api.getTemples(language); break;
                case 'poojas': {
                    const [poojaData, panditData] = await Promise.all([
                        api.getPoojas(language),
                        api.getPandits(language)
                    ]);
                    data = poojaData.filter(pooja => pooja.serviceType === 'General');
                    setAllPandits(panditData);
                    break;
                }
                case 'yatras': data = await api.getYatras(language); break;
                case 'events': data = await api.getMajorEvents(language); break;
                default: data = [];
            }
            setAllItems(data);
        } catch (error) {
            addToast(`Failed to load ${type}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [type, addToast, language]);

    useEffect(() => {
        fetchData();

        const handleDataUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            const keyMap: Record<ContentType, string> = {
                temples: 'temples',
                poojas: 'poojas',
                yatras: 'yatras',
                events: 'events',
            };
            if (customEvent.detail?.key === keyMap[type] || (type === 'poojas' && customEvent.detail?.key === 'pandits')) {
                fetchData();
            }
        };

        window.addEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);

        return () => {
            window.removeEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);
        };
    }, [type, fetchData]);

    const allRegions = useMemo(() => {
        if (type !== 'temples') return [];
        const regions = new Set<string>();
        allItems.forEach((temple: Temple) => {
            const parts = temple.location.split(',');
            if (parts.length > 1) {
                regions.add(parts[1].trim());
            }
        });
        return ['All', ...Array.from(regions).sort()];
    }, [allItems, type]);

    const handleCategoryClick = (tag: string) => {
        setActiveCategory(tag);
    };

    const navigateTo = (path: string) => { window.location.hash = path; };
    const handleLoginOrAction = (action: () => void) => {
        if (!currentUser) openModal('login');
        else action();
    };

    const handlePoojaBooking = (pooja: Pooja) => {
        handleLoginOrAction(() => {
            openModal('poojaBooking', { pooja });
        });
    };

    const handleAskGuru = (pooja: Pooja) => {
        openModal('aiGuruChat', { pooja: pooja });
    };

    const handleBookPandit = (pandit: Pandit) => {
        handleLoginOrAction(() => {
            openModal('panditBooking', { pandit });
        });
    };

    // Compute pandit distances + transport costs
    const userCity = userCityIndex >= 0 ? INDIAN_CITIES[userCityIndex] : null;

    const panditsWithDistance = useMemo(() => {
        const verified = allPandits.filter(p => p.status === 'verified');
        return verified.map(p => {
            const dist = (userCity && p.coordinates)
                ? Math.round(haversineDistance(userCity.lat, userCity.lng, p.coordinates.lat, p.coordinates.lng))
                : null;
            const transport = (dist !== null && p.transportCostPerKm)
                ? getTransportCost(dist, p.transportCostPerKm)
                : 0;
            return { ...p, distance: dist, transportCost: transport };
        });
    }, [allPandits, userCity]);

    const filteredPandits = useMemo(() => {
        let result = panditsWithDistance;
        if (panditSearch.trim()) {
            const q = panditSearch.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                p.specialization.toLowerCase().includes(q) ||
                p.specialties.some(s => s.toLowerCase().includes(q))
            );
        }
        if (panditServiceFilter !== 'all') {
            result = result.filter(p => p.services.includes(panditServiceFilter));
        }
        result.sort((a, b) => {
            switch (panditSortBy) {
                case 'distance':
                    if (a.distance === null && b.distance === null) return b.rating - a.rating;
                    if (a.distance === null) return 1;
                    if (b.distance === null) return -1;
                    return a.distance - b.distance;
                case 'rating': return b.rating - a.rating;
                case 'cost': return a.cost - b.cost;
                default: return 0;
            }
        });
        return result;
    }, [panditsWithDistance, panditSearch, panditServiceFilter, panditSortBy]);

    // --- Generic Content Handlers ---
    const handleSubmit = async (itemData: any) => {
        if (!currentUser?.token) return;
        try {
            let result;
            const isUpdate = !!itemData.id;

            switch (type) {
                case 'events':
                    result = isUpdate ? await api.updateEvent(itemData, currentUser.token) : await api.addEvent(itemData, currentUser.token);
                    break;
                case 'poojas':
                    result = isUpdate ? await api.updatePooja(itemData, currentUser.token) : await api.addPooja(itemData, currentUser.token);
                    break;
                case 'yatras':
                    result = isUpdate ? await api.updateYatra(itemData, currentUser.token) : await api.addYatra(itemData, currentUser.token);
                    break;
                default:
                    throw new Error("Unsupported type for submission");
            }

            addToast(result.message, 'success');
            closeModal();
            if (!isUpdate) {
                document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            if (err instanceof Error) addToast(err.message, 'error');
        }
    };

    const handleDelete = async (itemId: number, itemName: string) => {
        if (!currentUser?.token) return;

        const onConfirmDelete = async () => {
            if (!currentUser?.token) return;

            const originalItems = allItems;
            setAllItems(currentItems => currentItems.filter(item => item.id !== itemId));
            closeModal();

            try {
                let result;
                switch (type) {
                    case 'events': result = await api.deleteEvent(itemId, currentUser.token); break;
                    case 'poojas': result = await api.deletePooja(itemId, currentUser.token); break;
                    case 'yatras': result = await api.deleteYatra(itemId, currentUser.token); break;
                    default: throw new Error("Unsupported type for deletion");
                }
                addToast(result.message, 'success');
            } catch (err) {
                if (err instanceof Error) addToast(err.message, 'error');
                addToast(`Failed to delete '${itemName}'. Reverting change.`, 'error');
                setAllItems(originalItems);
            }
        };

        let confirmationMessage = `${t.confirmDeleteMessage.replace('this item', `"${itemName}"`)}`;

        openModal('confirmation', {
            title: t.confirmDeleteTitle,
            message: confirmationMessage,
            onConfirm: onConfirmDelete
        });
    };

    const title = t[typeToTitleMap[type]];
    const modalType: ModalType = `${type.slice(0, -1)}Admin` as ModalType;
    const addItemTextKey = `add${type.charAt(0).toUpperCase() + type.slice(1, -1)}` as keyof I18nContent;

    const filteredItems = useMemo(() => {
        let items = [...allItems];

        if (type === 'temples') {
            // Region filtering
            if (activeRegion !== 'All') {
                items = items.filter(item => (item as Temple).location.includes(activeRegion));
            }

            // Category filtering
            if (activeCategory !== 'All') {
                items = items.filter(item => (item as Temple).tags?.includes(activeCategory.toLowerCase()));
            }

            // Search query filtering
            if (searchQuery) {
                const lowerCaseQuery = searchQuery.toLowerCase();
                items = items.filter(item =>
                    (item as Temple).name.toLowerCase().includes(lowerCaseQuery) ||
                    (item as Temple).location.toLowerCase().includes(lowerCaseQuery)
                );
            }

            // Custom sorting for specific circuits
            if (CANONICAL_SORT_TAGS.has(activeCategory.toLowerCase())) {
                const circuitKey = activeCategory.toLowerCase().replace(/ /g, '_');
                items.sort((a: Temple, b: Temple) => {
                    const orderA = a.circuitOrder?.[circuitKey] ?? Infinity;
                    const orderB = b.circuitOrder?.[circuitKey] ?? Infinity;
                    return orderA - orderB;
                });
            } else {
                // Default sort alphabetically by name for other categories
                items.sort((a, b) => a.name.localeCompare(b.name));
            }
        } else {
            // For non-temple views, just sort alphabetically
            items.sort((a, b) => a.name.localeCompare(b.name));
        }

        return items;
    }, [allItems, activeCategory, type, searchQuery, activeRegion]);

    const renderCard = (item: any) => {
        switch (type) {
            case 'temples':
                return (
                    <TempleCard
                        temple={item}
                        t={t}
                        onSelectTemple={() => navigateTo(`/templeDetail/${item.id}`)}
                        onBookDarshan={() => onDarshanClick(item)}
                        onVirtualDarshan={() => openModal('vrDarshan')}
                        onViewImage={() => openModal('imageDetail', { imageUrl: item.imageUrl, altText: item.name })}
                        onAskGuru={() => openModal('aiGuruChat', { temple: item })}
                        isInYatraPlan={isInYatraPlan ? isInYatraPlan(item.id) : false}
                        onToggleYatraPlan={onToggleYatraPlan!}
                    />
                );
            case 'poojas': {
                const panditCount = allPandits.filter(p => p.specialties.some(s => s.toLowerCase() === item.name.toLowerCase())).length;
                return (
                    <PoojaCard
                        pooja={item}
                        t={t}
                        panditCount={panditCount}
                        onBook={handlePoojaBooking}
                        onAskGuru={handleAskGuru}
                        isAdmin={currentUser?.role === 'admin'}
                        onEdit={() => openModal('poojaAdmin', { initialData: item, onSubmit: handleSubmit, t })}
                        onDelete={() => handleDelete(item.id, item.name)}
                        onViewImage={() => openModal('imageDetail', { imageUrl: item.imageUrl, altText: item.name })}
                    />
                );
            }
            case 'yatras':
                return (
                    <YatraCard
                        yatra={item}
                        t={t}
                        onViewItinerary={() => openModal('yatraDetail', { yatra: item, t })}
                        isAdmin={currentUser?.role === 'admin'}
                        onEdit={() => openModal('yatraAdmin', { initialData: item, onSubmit: handleSubmit, t })}
                        onDelete={() => handleDelete(item.id, item.name)}
                        onViewImage={() => openModal('imageDetail', { imageUrl: item.imageUrl, altText: item.name })}
                    />
                );
            case 'events':
                return (
                    <EventCard
                        event={item}
                        t={t}
                        onSelectEvent={() => navigateTo(`/eventDetail/${item.id}`)}
                        isAdmin={currentUser?.role === 'admin'}
                        onEdit={() => openModal('eventAdmin', { initialData: item, onSubmit: handleSubmit, t })}
                        onDelete={() => handleDelete(item.id, item.name)}
                        onViewImage={() => openModal('imageDetail', { imageUrl: item.imageUrl, altText: item.name })}
                    />
                );
            default:
                return null;
        }
    };

    const getSkeleton = (index: number) => {
        switch (type) {
            case 'temples': return <TempleCardSkeleton key={index} />;
            case 'poojas': return <PoojaCardSkeleton key={index} />;
            case 'yatras': return <YatraCardSkeleton key={index} />;
            case 'events': return <EventCardSkeleton key={index} />;
            default: return null;
        }
    };

    const gridClass = useMemo(() => {
        switch (type) {
            case 'events': return "grid grid-cols-1 lg:grid-cols-2 gap-8";
            case 'temples':
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
            case 'poojas':
            case 'yatras':
                return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";
            default:
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";
        }
    }, [type]);

    const canAdd = currentUser?.role === 'admin' && type !== 'temples';

    return (
        <div className="animate-fade-in py-8 min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold font-heading">{title}</h1>
                        {type === 'poojas' && <p className="text-text-muted mt-1">Book experienced pandits for sacred rituals, homas, and ceremonies at your home or online.</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {canAdd && (
                            <button
                                onClick={() => openModal(modalType, { onSubmit: handleSubmit, t })}
                                className="bg-green-600 text-white font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Icon name="plus" className="w-5 h-5" />
                                <span>{t[addItemTextKey]}</span>
                            </button>
                        )}
                        {type === 'poojas' && (
                            <button
                                onClick={() => openModal('panditRegistration')}
                                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <Icon name="user-edit" className="w-5 h-5" />
                                <span>Join as a Pandit</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Pooja Sub-tabs */}
                {type === 'poojas' && (
                    <div className="flex gap-2 mb-6 bg-stone-100 p-1.5 rounded-xl w-fit">
                        <button
                            onClick={() => setPoojaSubTab('services')}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                                poojaSubTab === 'services'
                                    ? 'bg-white text-primary shadow-md'
                                    : 'text-text-muted hover:text-text-base'
                            }`}
                        >
                            <Icon name="bell" className="w-4 h-4" />
                            Pooja Services
                        </button>
                        <button
                            onClick={() => setPoojaSubTab('pandits')}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                                poojaSubTab === 'pandits'
                                    ? 'bg-white text-primary shadow-md'
                                    : 'text-text-muted hover:text-text-base'
                            }`}
                        >
                            <Icon name="user-edit" className="w-4 h-4" />
                            Find Pandits Near You
                        </button>
                    </div>
                )}

                {/* Pandits Sub-tab Content */}
                {type === 'poojas' && poojaSubTab === 'pandits' ? (
                    <div className="animate-fade-in">
                        {/* Rural-Urban Banner */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Icon name="heart-hand" className="w-6 h-6 text-green-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-800 text-sm">Connecting Rural Pandits to Urban Devotees</h3>
                                <p className="text-green-600 text-xs mt-0.5">Support verified pandits from small towns and pilgrimage cities. Rural pandits offer lower travel costs and deep traditional expertise.</p>
                            </div>
                        </div>

                        {/* Location Selector + Search */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md mb-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* City Selector */}
                                <div className="relative">
                                    <Icon name="map-pin" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                    <select
                                        value={userCityIndex}
                                        onChange={(e) => setUserCityIndex(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value={-1}>Select your city (for distance & transport cost)</option>
                                        {INDIAN_CITIES.map((city, i) => (
                                            <option key={city.name} value={i}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Search */}
                                <div className="relative">
                                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, location, or specialization..."
                                        value={panditSearch}
                                        onChange={(e) => setPanditSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-lg border border-stone-200 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Service Filter */}
                                <div className="flex gap-2">
                                    {(['all', 'Online', 'Offline'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setPanditServiceFilter(f)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                                panditServiceFilter === f
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-stone-100 text-text-muted hover:bg-stone-200'
                                            }`}
                                        >
                                            {f === 'all' ? 'All Modes' : f === 'Online' ? '🌐 Online' : '🏠 In-person'}
                                        </button>
                                    ))}
                                </div>
                                <div className="h-5 w-px bg-stone-300"></div>
                                {/* Sort */}
                                <select
                                    value={panditSortBy}
                                    onChange={(e) => setPanditSortBy(e.target.value as typeof panditSortBy)}
                                    className="px-3 py-1.5 bg-stone-100 rounded-lg border border-stone-200 text-xs font-medium"
                                >
                                    <option value="distance">Nearest First</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="cost">Lowest Cost</option>
                                </select>
                                <span className="text-xs text-text-muted ml-auto">{filteredPandits.length} pandits found</span>
                            </div>
                        </div>

                        {/* Pandit Cards Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden h-80 animate-pulse">
                                        <div className="h-28 bg-stone-100"></div>
                                        <div className="p-4 space-y-3">
                                            <div className="h-5 bg-stone-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                                            <div className="h-4 bg-stone-200 rounded w-full"></div>
                                            <div className="h-10 bg-stone-200 rounded-full w-full mt-4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredPandits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPandits.map((pandit) => (
                                    <CardAnimator key={pandit.id}>
                                        <PanditLocationCard pandit={pandit} t={t} onBook={handleBookPandit} userCity={userCity} />
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
                ) : (
                    /* Original content (poojas grid, temples, yatras, events) */
                    <>
                {type === 'temples' && (
                    <div className="mb-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by temple name or location..."
                                    className="w-full pl-12 pr-4 py-3 text-lg rounded-full bg-white shadow-md border-2 border-transparent focus:border-primary focus:ring-primary focus:outline-none"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <Icon name="search" className="w-6 h-6 text-text-muted" />
                                </div>
                            </div>

                            {/* Region Filter */}
                            <div className="relative">
                                <select
                                    value={activeRegion}
                                    onChange={(e) => setActiveRegion(e.target.value)}
                                    className="w-full pl-12 pr-10 py-3 text-lg rounded-full bg-white shadow-md border-2 border-transparent focus:border-primary focus:ring-primary focus:outline-none appearance-none"
                                    aria-label="Filter by region"
                                >
                                    {allRegions.map(region => (
                                        <option key={region} value={region}>
                                            {region === 'All' ? 'All Regions' : region}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <Icon name="map-pin" className="w-6 h-6 text-text-muted" />
                                </div>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="bg-white/50 p-4 rounded-xl shadow-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => handleCategoryClick('All')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 flex items-center gap-2 ${activeCategory === 'All'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-white/60 text-primary hover:bg-white'
                                        }`}
                                >
                                    All Temples
                                </button>
                                <div className="h-6 w-px bg-stone-300 hidden sm:block"></div>
                                {templeCategoryGroups.map(group => (
                                    <React.Fragment key={group.title}>
                                        {group.categories.map(category => (
                                            <button
                                                key={category.name}
                                                onClick={() => handleCategoryClick(category.tag)}
                                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 flex items-center gap-2 ${activeCategory === category.tag
                                                        ? 'bg-primary text-white shadow-md'
                                                        : 'bg-white/60 text-primary hover:bg-white'
                                                    }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className={gridClass}>
                        {[...Array(type === 'events' ? 2 : (type === 'poojas' || type === 'yatras' ? 4 : 3))].map((_, i) => getSkeleton(i))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className={gridClass}>
                        {filteredItems.map(item => (
                            <CardAnimator key={item.id}>
                                {renderCard(item)}
                            </CardAnimator>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-stone-600">
                        <h3 className="text-2xl font-semibold mb-2">No {type} found.</h3>
                        {searchQuery ? (
                            <p>Your search for "{searchQuery}" did not match any temples in the selected filters.</p>
                        ) : canAdd ? (
                            <p>You can add one using the button above.</p>
                        ) : (
                            <p>No temples match the selected category or region.</p>
                        )}
                    </div>
                )}
                    </>
                )}
            </div>
        </div>
    );
};

/** Pandit card with distance and transport cost info */
const PanditLocationCard = React.memo(({ pandit, t, onBook, userCity }: {
    pandit: Pandit & { distance: number | null; transportCost: number };
    t: I18nContent;
    onBook: (p: Pandit) => void;
    userCity: { name: string; lat: number; lng: number } | null;
}) => {
    const [expanded, setExpanded] = useState(false);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availableDays = pandit.availability?.days?.map(d => dayNames[d]).join(', ') || 'All days';
    const hours = pandit.availability?.hours?.[0];
    const timings = hours ? `${hours.start} - ${hours.end}` : 'Flexible';
    const totalCost = pandit.cost + (pandit.transportCost || 0);
    const isOffline = pandit.services.includes('Offline');

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-stone-100 hover:shadow-xl transition-shadow h-full">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent p-5 relative">
                <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold flex-shrink-0 border-2 border-primary/30">
                        {pandit.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-text-base truncate">{pandit.name}</h3>
                        <p className="text-xs text-primary font-medium">{pandit.specialization}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <Icon name="map-pin" className="w-3 h-3" />
                            {pandit.location}
                        </p>
                    </div>
                </div>
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1">
                        <Icon name="star" className="w-3 h-3" />
                        {pandit.rating.toFixed(1)}
                    </div>
                    {pandit.isRural && (
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
                            Rural Pandit
                        </div>
                    )}
                </div>
            </div>

            {/* Distance & Cost Row */}
            <div className="px-5 py-3 bg-stone-50 border-y border-stone-100">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-sm font-bold text-primary">{pandit.experience}yr</p>
                        <p className="text-[10px] text-text-muted">Experience</p>
                    </div>
                    <div>
                        {pandit.distance !== null ? (
                            <>
                                <p className="text-sm font-bold text-blue-600">{pandit.distance} km</p>
                                <p className="text-[10px] text-text-muted">Distance</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-stone-400">—</p>
                                <p className="text-[10px] text-text-muted">Select city</p>
                            </>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-primary">₹{pandit.cost.toLocaleString()}</p>
                        <p className="text-[10px] text-text-muted">Base Cost</p>
                    </div>
                </div>
            </div>

            {/* Transport Cost (if applicable) */}
            {isOffline && pandit.distance !== null && pandit.transportCost > 0 && (
                <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-amber-700 flex items-center gap-1">
                            <Icon name="compass" className="w-3 h-3" />
                            Transport ({pandit.distance} km)
                        </span>
                        <span className="font-bold text-amber-800">+ ₹{pandit.transportCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                        <span className="font-semibold text-text-base">Estimated Total</span>
                        <span className="font-bold text-primary text-sm">₹{totalCost.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Service modes */}
            <div className="px-5 py-2 flex items-center gap-2">
                {pandit.services.map(s => (
                    <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        s === 'Online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {s === 'Online' ? '🌐 Online' : '🏠 In-person'}
                    </span>
                ))}
            </div>

            {/* Expandable poojas */}
            <div className="px-5 py-2 flex-grow">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-text-base hover:text-primary transition-colors"
                >
                    <span>Poojas ({pandit.specialties.length})</span>
                    <Icon name="chevron-left" className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : '-rotate-90'}`} />
                </button>
                {expanded && (
                    <div className="mt-2 space-y-1">
                        {pandit.specialties.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Icon name="om" className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                <span>{s}</span>
                            </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-text-muted space-y-0.5">
                            <p className="flex items-center gap-1">
                                <Icon name="calendar" className="w-2.5 h-2.5" />
                                {availableDays}
                            </p>
                            <p className="flex items-center gap-1">
                                <Icon name="clock" className="w-2.5 h-2.5" />
                                {timings}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Book button */}
            <div className="p-4 pt-2 mt-auto">
                <button
                    onClick={() => onBook(pandit)}
                    className="w-full bg-primary text-white font-bold py-2.5 px-6 rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-[1.02] shadow-md text-sm"
                >
                    {t.bookPandit}
                </button>
            </div>
        </div>
    );
});

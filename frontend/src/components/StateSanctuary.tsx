import React, { useState, useEffect, useMemo } from 'react';
import { I18nContent, Temple, Language } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'motion/react';
import { getTemples } from '../services/apiService';
import { fuzzySearch, calculateDistance } from '../utils/geolocation';

interface StateSanctuaryProps {
    t: I18nContent;
    language: Language;
    onNavigate: (view: any, props?: any) => void;
    userLocation?: { latitude: number; longitude: number } | null;
}

export const StateSanctuary = ({ t, language, onNavigate, userLocation }: StateSanctuaryProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allTemples, setAllTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [detectedCity, setDetectedCity] = useState('Hyderabad');

    // Dynamic City Detection via Reverse Geocoding
    useEffect(() => {
        if (!userLocation) {
            setDetectedCity('Hyderabad');
            return;
        }

        const fetchCityName = async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();

                // Prioritize the most recognizable local settlement name
                const city = data.address.city || data.address.town || data.address.village || data.address.state_district || data.address.county || 'Your Location';
                setDetectedCity(city);
            } catch (error) {
                console.error("Failed to reverse geocode:", error);
                setDetectedCity('Your Area');
            }
        };

        fetchCityName();
    }, [userLocation]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getTemples(language);
                // Filter for Telangana and Hyderabad temples using the new region property
                const telanganaData = data.filter(temple =>
                    temple.region === 'Telangana' ||
                    temple.location.toLowerCase().includes('telangana') ||
                    temple.location.toLowerCase().includes('hyderabad')
                );
                setAllTemples(telanganaData);
            } catch (error) {
                console.error("Failed to load Telangana temples:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [language]);

    // Improved Search Algorithm Integration
    const filteredTemples = useMemo(() => {
        if (!searchQuery) return allTemples;
        // Search across name, location, deity, and tags
        const results = fuzzySearch(allTemples, searchQuery, ['name', 'location', 'deity', 'tags'] as (keyof Temple)[]);
        return results.map(r => r.item);
    }, [searchQuery, allTemples]);

    // Dynamic Categorization with corrected IDs
    const majorTemples = useMemo(() =>
        allTemples.filter(temple => [152, 153, 154, 155, 500, 501, 502, 503, 504, 1142].includes(temple.id)),
        [allTemples]);

    const shivaCircuit = useMemo(() =>
        allTemples.filter(temple => (temple.tags?.includes('shiva') || temple.deity?.toLowerCase().includes('shiva')) && ![500, 152].includes(temple.id)),
        [allTemples]);


    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1128] pt-20 pb-24 relative overflow-hidden">
                {/* Skeleton Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
                    <div className="text-center pt-8 max-w-2xl mx-auto space-y-4">
                        <div className="h-16 w-3/4 mx-auto bg-amber-500/10 rounded-2xl animate-pulse"></div>
                        <div className="h-6 w-1/2 mx-auto bg-blue-300/10 rounded-full animate-pulse mt-4"></div>
                        <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/5 animate-pulse mt-8"></div>
                    </div>

                    {/* Skeleton Live Pilot Banner */}
                    <div className="h-48 w-full bg-gradient-to-r from-amber-900/40 to-amber-700/20 rounded-[2rem] border border-amber-500/20 animate-pulse mt-12"></div>

                    {/* Skeleton Carousels */}
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <div key={idx} className="space-y-6 mt-16">
                            <div className="flex justify-between items-center">
                                <div className="h-8 w-48 bg-amber-500/10 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-24 bg-blue-300/10 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex space-x-6 overflow-hidden">
                                {Array.from({ length: 3 }).map((_, cardIdx) => (
                                    <div key={cardIdx} className="flex-shrink-0 w-72 h-96 bg-white/5 border border-white/5 rounded-2xl animate-pulse">
                                        <div className="h-48 bg-white/5 rounded-t-2xl"></div>
                                        <div className="p-6 space-y-4">
                                            <div className="h-6 w-3/4 bg-white/10 rounded"></div>
                                            <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                                            <div className="h-10 w-full bg-amber-500/10 rounded mt-4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1128] text-white overflow-x-hidden pt-20 pb-24 relative font-sans">
            {/* Ethereal Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-30">
                <div className="absolute w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]" />

                {/* Telangana Map Outline (Simplified SVG) */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute w-[600px] h-[600px] text-amber-500/10"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                >
                    <path
                        d="M30,20 L50,15 L70,25 L85,45 L80,70 L60,85 L40,80 L20,60 L15,40 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="animate-pulse"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }}
                    />
                </motion.svg>

                <div className="w-[600px] h-[600px] border-[2px] border-amber-500/20 rounded-[30%] animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-[500px] h-[500px] border-[1px] border-amber-300/10 rounded-[40%] animate-[spin_40s_linear_infinite_reverse]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center pt-8"
                >
                    <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                        The Deccan Sanctum
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-200 font-light tracking-wide">
                        {language === Language.TE ? 'తెలంగాణ పుణ్యక్షేత్రాల అన్వేషణ' : 'Explore the Sacred Heart of Telangana'}
                    </p>

                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icon name="search" className="h-5 w-5 text-blue-300" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-blue-300/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                                placeholder={language === Language.TE ? "దేవాలయాలు, ప్రాంతాలు వెతకండి..." : "Search temples, deities, or locations in Telangana..."}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Live Pilot Banner */}
                {!searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-red-700 shadow-[0_0_40px_rgba(234,88,12,0.3)] border border-orange-400/30 cursor-pointer"
                        onClick={() => onNavigate('templeDetail', { templeId: 104 })}
                    >
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl opacity-50" />
                        <div className="px-6 py-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 animate-pulse">
                                    <Icon name="map-pin" className="h-10 w-10 text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                        Chilkur Balaji <span className="text-orange-200 font-normal text-lg">(Visa Balaji)</span>
                                    </h3>
                                    <p className="text-orange-100 flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                                        Live Protocol Active
                                    </p>
                                </div>
                            </div>
                            <button className="whitespace-nowrap bg-yellow-400 hover:bg-yellow-300 text-orange-900 font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-yellow-400/20 transform hover:-translate-y-1 transition-all duration-300">
                                {t.bookNow} (₹151)
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Search Results / Map Integration */}
                <AnimatePresence>
                    {searchQuery ? (
                        <motion.section
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredTemples.length > 0 ? (
                                filteredTemples.map((temple) => (
                                    <TempleCard key={temple.id} temple={temple} onClick={() => onNavigate('templeDetail', { templeId: temple.id })} />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center text-blue-300/50">
                                    <Icon name="info" className="mx-auto h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-xl">{t.noResultsFound}</p>
                                </div>
                            )}
                        </motion.section>
                    ) : (
                        <>
                            {/* The Maha Kshetras */}
                            <section>
                                <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                                    <Icon name="sun" className="text-amber-400" /> {language === Language.TE ? 'మహా క్షేత్రాలు' : 'The Maha Kshetras'}
                                </h2>
                                <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">
                                    {majorTemples.map(temple => (
                                        <div key={temple.id} onClick={() => onNavigate('templeDetail', { templeId: temple.id })} className="min-w-[300px] md:min-w-[400px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-pointer shadow-2xl">
                                            <div className="h-48 bg-stone-800 relative overflow-hidden">
                                                <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="bg-amber-500/80 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white capitalize">{temple.tags?.[0] || 'Sanctum'}</span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-white">{temple.name}</h3>
                                                <p className="text-blue-200 text-sm mt-1">{temple.deity}</p>
                                                <div className="mt-4 flex items-center justify-between text-sm text-stone-400 border-t border-white/10 pt-4">
                                                    <span className="flex items-center gap-1"><Icon name="map-pin" className="w-4 h-4" /> {temple.location.split(',')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* The Ancient Shiva Circuit */}
                            <section>
                                <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                                    <Icon name="moon" className="text-blue-300" /> {language === Language.TE ? 'ప్రాచీన శివ క్షేత్రాలు' : 'The Ancient Shiva Circuit'}
                                </h2>
                                <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">
                                    {shivaCircuit.map(temple => (
                                        <div key={temple.id} onClick={() => onNavigate('templeDetail', { templeId: temple.id })} className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group shadow-xl">
                                            <div className="h-40 bg-stone-800 rounded-xl mb-4 overflow-hidden">
                                                <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{temple.name}</h3>
                                            <p className="text-blue-200/70 text-sm mt-1 mb-3">{temple.location.split(',')[0]}</p>
                                            <span className="inline-block bg-white/10 text-xs text-amber-200 px-3 py-1 rounded-full border border-amber-200/30">
                                                {temple.tags?.includes('unesco') ? 'UNESCO Heritage' : 'Kakatiya Era'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Contextual City Gems (Sorted by distance to user) */}
                            <section>
                                <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                                    <Icon name="lotus" className="text-indigo-400" /> {language === Language.TE ? `${detectedCity} వైభవం` : `${detectedCity} City Gems`}
                                </h2>

                                {(() => {
                                    const nearbyTemples = [...allTemples].map(temple => ({
                                        ...temple,
                                        distance: calculateDistance(
                                            userLocation ? userLocation.latitude : 17.3850,
                                            userLocation ? userLocation.longitude : 78.4867,
                                            temple.lat,
                                            temple.lng
                                        )
                                    }))
                                        .filter(temple => temple.id !== 152) // Exclude duplicate/specifics if needed
                                        // CRITICAL: Only show temples that are ACTUALLY near the user's mobile (e.g., within 75km)
                                        .filter(temple => temple.distance <= 75)
                                        .sort((a, b) => a.distance - b.distance)
                                        .slice(0, 6);

                                    if (nearbyTemples.length === 0) {
                                        return (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                                                <Icon name="map-pin" className="mx-auto h-12 w-12 text-blue-300 opacity-50 mb-3" />
                                                <p className="text-blue-200 text-lg">We haven't discovered any major Kshetras within 75km of your current mobile location yet.</p>
                                                <p className="text-stone-400 text-sm mt-2">Explore the Maha Kshetras or search globally to discover divine destinations.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {nearbyTemples.map(temple => (
                                                <div key={temple.id} onClick={() => onNavigate('templeDetail', { templeId: temple.id })} className="rounded-2xl bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-500/20 p-6 backdrop-blur-md relative overflow-hidden group hover:border-indigo-400/50 transition-colors cursor-pointer">
                                                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                                                    <h3 className="text-xl font-bold text-indigo-100">{temple.name}</h3>
                                                    <p className="text-indigo-200/60 mt-2 text-sm line-clamp-2">{temple.history}</p>
                                                    <div className="mt-6 flex items-center justify-between">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs text-indigo-300/80 font-mono tracking-tighter uppercase">{temple.deity}</span>
                                                            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
                                                                {temple.distance < 10 ? 'Very Close' : `${Math.round(temple.distance)} km away`}
                                                            </span>
                                                        </div>
                                                        <Icon name="chevron-right" className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </section>

                            {/* Curated Trails (Local to user) */}
                            <section>
                                <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3 mt-12">
                                    <Icon name="map-pin" className="text-emerald-400" /> {language === Language.TE ? `${detectedCity} ఆధ్యాత్మిక యాత్రలు` : `Curated Trails from ${detectedCity}`}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h3 className="text-xl font-bold text-emerald-400 mb-2">Weekend Heritage Trail</h3>
                                        <p className="text-stone-300 text-sm mb-4">A perfectly optimized 2-day journey covering the highest-energy kshetras closest to your current location.</p>
                                        <div className="flex items-center gap-3 text-sm text-stone-400 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span>Starts at {detectedCity}</span>
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                            <span>3 Temples</span>
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                            <span>~150km Total</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h3 className="text-xl font-bold text-amber-400 mb-2">The Architecture Circuit</h3>
                                        <p className="text-stone-300 text-sm mb-4">Explore the finest Kakatiya and Chalukya era structures within driving distance of your city.</p>
                                        <div className="flex items-center gap-3 text-sm text-stone-400 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span>Starts at {detectedCity}</span>
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                            <span>2 Temples</span>
                                            <Icon name="chevron-right" className="w-4 h-4" />
                                            <span>Architecture Focus</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </AnimatePresence>

                {/* Dharma Uddhar Local CTA */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="mt-16 rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-pulse" />
                    <Icon name="heart" className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Dharma Uddhar: Restore Our Heritage</h2>
                    <p className="text-stone-300 max-w-2xl mx-auto mb-8">
                        Join hands to help restore forgotten 10th-century stepwells and ancient shrines around Hyderabad. Your contribution breathes life back into our history.
                    </p>
                    <button
                        onClick={() => onNavigate('restorationSanctuary')}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-colors"
                    >
                        Adopt a Local Brick (₹100)
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

// Helper Component for Search Results
const TempleCard = ({ temple, onClick }: { temple: Temple; onClick: () => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={onClick}
        className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all group cursor-pointer"
    >
        <div className="h-40 bg-stone-800 relative">
            <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-5">
            <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors">{temple.name}</h3>
            <p className="text-blue-200/70 text-sm mt-1">{temple.location.split(',')[0]}</p>
        </div>
    </motion.div>
);

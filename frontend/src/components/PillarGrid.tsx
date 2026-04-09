import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useModal } from '../contexts/ModalContext';
import { I18nContent } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Pillar {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
    span?: string;
    details: string;
    action?: string;
}

interface PillarGridProps {
    t: I18nContent;
}

// The gradient colors for the detail overlay background
const pillarGradients: Record<string, string> = {
    'from-orange-500/20 to-orange-600/20': 'from-orange-500 to-orange-600',
    'from-amber-500/20 to-amber-600/20': 'from-amber-500 to-amber-600',
    'from-blue-500/20 to-blue-600/20': 'from-blue-500 to-blue-600',
    'from-emerald-500/20 to-emerald-600/20': 'from-emerald-500 to-emerald-600',
    'from-purple-500/20 to-purple-600/20': 'from-purple-500 to-purple-600',
    'from-rose-500/20 to-rose-600/20': 'from-rose-500 to-rose-600',
    'from-cyan-500/20 to-cyan-600/20': 'from-cyan-500 to-cyan-600',
    'from-green-500/20 to-green-600/20': 'from-green-500 to-green-600',
    'from-red-500/20 to-red-600/20': 'from-red-500 to-red-600',
    'from-stone-600/20 to-stone-700/20': 'from-stone-600 to-stone-700',
};

export const PillarGrid = ({ t }: PillarGridProps) => {
    const { openModal } = useModal();
    const { currentUser } = useAuth();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const isAdmin = currentUser?.role === 'admin';

    const devoteePillars: Pillar[] = [
        {
            id: 1,
            title: "Dharma Gurukul",
            description: "AI Rishi & Kids Shloka Coach. Ancient wisdom meets AI precision.",
            icon: "book-open",
            color: "from-orange-500/20 to-orange-600/20",
            span: "md:col-span-2 md:row-span-2",
            details: "AI Rishi: A chatbot trained on Vedas & Gita. Bal-Vihar: AI Pronunciation Coach for kids. Dharma Granth: Audiobooks of scriptures.",
            action: "knowledge"
        },
        {
            id: 2,
            title: "Mantra Yoga",
            description: "Daily AI Panchang & Virtual Temple. Build your spiritual habit.",
            icon: "flame",
            color: "from-amber-500/20 to-amber-600/20",
            details: "AI Panchang: Dynamic daily alerts. Virtual Temple: Tap to light Diya. Sync-Chant: Live group chanting rooms.",
            action: "chakraSanctuary"
        },
        {
            id: 3,
            title: "Dharma Connect",
            description: "Uber for Priests & Astrology. Verified Vedic services at your doorstep.",
            icon: "map-pin",
            color: "from-blue-500/20 to-blue-600/20",
            details: "Uber for Priests: Map-based booking of verified pandits. Astrology Connect: Video calls for Kundali & Muhurtham.",
            action: "poojas"
        },
        {
            id: 4,
            title: "Dharma Mart",
            description: "Smart Puja Kits & Pure Essentials. Lab-tested purity delivered.",
            icon: "shopping-bag",
            color: "from-emerald-500/20 to-emerald-600/20",
            span: "md:col-span-2",
            details: "Smart Puja Kits: Auto-suggested samagri for rituals. Pure Essentials: Lab-tested Kumkum, Camphor, and A2 Ghee.",
            action: "mart"
        },
        {
            id: 5,
            title: "Divya Darshan",
            description: "Temple Command Center. Hub & Spoke discovery for full circuits.",
            icon: "temple",
            color: "from-purple-500/20 to-purple-600/20",
            details: "Hub & Spoke Discovery: Find satellite temples. Quick Services: Tickets, Prasad, and Satvik Stay booking.",
            action: "temples"
        },
        {
            id: 6,
            title: "Divya Marga",
            description: "Remote Seva Logistics & Video Proof. Sankalpa from anywhere.",
            icon: "truck",
            color: "from-rose-500/20 to-rose-600/20",
            details: "Remote Puja: Sankalpa video proof from priests. Cold Chain Delivery: Fresh Prasad delivered in 24 hours.",
            action: "divyaMarga"
        },
        {
            id: 7,
            title: "Satvik-Trace",
            description: "Purity Engine. QR Scan for Ghee & Prasad quality reports.",
            icon: "shield-check",
            color: "from-cyan-500/20 to-cyan-600/20",
            details: "Purity Engine: Supply lab-tested ghee to temples. Verification: Scan QR on Prasad for lab reports.",
            action: "satvikTrace"
        },
        {
            id: 8,
            title: t.ecoInnovationPortal,
            description: t.ecoPoojaGadiTitle + " & " + t.ecoFloralExchange,
            icon: "leaf",
            color: "from-green-500/20 to-green-600/20",
            details: t.ecoPoojaGadiDesc,
            action: "ecoInnovation"
        },
        {
            id: 9,
            title: "Dharma Uddhar",
            description: "Temple Revival. Micro-donations to save ancient heritage.",
            icon: "heart-hand",
            color: "from-red-500/20 to-red-600/20",
            details: "Adopt-a-Brick: Fund specific temple repairs. Proof: Video updates of restoration work.",
            action: "uploadTemple"
        }
    ];

    const adminPillars: Pillar[] = [
        {
            id: 101,
            title: "Central Dashboard",
            description: "Real-time analytics, daily bookings, and revenue overview.",
            icon: "layout-dashboard",
            color: "from-stone-600/20 to-stone-700/20",
            span: "md:col-span-2 md:row-span-2",
            details: "Monitor daily footfall, live booking statistics, and overall platform health in one central hub.",
            action: "adminDashboard"
        },
        {
            id: 102,
            title: "Booking Manager",
            description: "Approve and schedule Poojas, Darshan, and Yatra requests.",
            icon: "calendar-check",
            color: "from-amber-500/20 to-amber-600/20",
            details: "Review incoming booking requests, assign timeslots, and manage daily temple schedules.",
            action: "adminDashboard"
        },
        {
            id: 103,
            title: "Pandit Roster",
            description: "Manage priest availability, specializations, and assignments.",
            icon: "users",
            color: "from-blue-500/20 to-blue-600/20",
            details: "Onboard new priests, verify credentials, and allocate them to specific Poojas or user requests.",
            action: "adminDashboard"
        },
        {
            id: 104,
            title: "Donation Tracking",
            description: "Transparent ledger of Annadanam, Temple Maintenance, and General funds.",
            icon: "indian-rupee",
            color: "from-emerald-500/20 to-emerald-600/20",
            span: "md:col-span-2",
            details: "Track micro-donations (Dharma Uddhar) and generate automated tax exemption receipts for devotees.",
            action: "adminDashboard"
        },
        {
            id: 105,
            title: "Inventory & Satvik-Trace",
            description: "Stock management for Prasad, Samagri, and lab report uploads.",
            icon: "package",
            color: "from-cyan-500/20 to-cyan-600/20",
            details: "Update inventory levels for 'Dharma Mart', and upload purity certificates for raw materials.",
            action: "adminDashboard"
        },
        {
            id: 106,
            title: "Live Stream Studio",
            description: "Broadcast Aarti, Poojas, and discourses directly to devotees.",
            icon: "video",
            color: "from-rose-500/20 to-rose-600/20",
            details: "Control live camera feeds, manage broadcast schedules, and interact with remote devotees.",
            action: "adminDashboard"
        },
        {
            id: 107,
            title: "User Access Control",
            description: "Manage roles, permissions, and resolve devotee tickets.",
            icon: "shield",
            color: "from-purple-500/20 to-purple-600/20",
            details: "Assign roles (Devotee, Pandit, Admin), handle support requests, and monitor platform security.",
            action: "adminDashboard"
        },
        {
            id: 108,
            title: "Eco-Initiatives",
            description: "Track floral waste exchange limits and Yagna brick stock.",
            icon: "leaf",
            color: "from-green-500/20 to-green-600/20",
            details: "Monitor the 'Eco Innovation Hub' operations, verify floral waste deposits, and update reward points.",
            action: "adminDashboard"
        },
        {
            id: 109,
            title: "Temple Profile Settings",
            description: "Update timings, deity info, and public announcements.",
            icon: "settings",
            color: "from-orange-500/20 to-orange-600/20",
            details: "Edit the public-facing 'Divya Darshan' temple page, update opening hours, and post daily updates.",
            action: "adminDashboard"
        }
    ];

    const pillars = isAdmin ? adminPillars : devoteePillars;
    const selectedPillar = selectedIndex !== null ? pillars[selectedIndex] : null;

    const handlePillarAction = (pillar: Pillar) => {
        if (isAdmin && pillar.action === 'adminDashboard') {
            window.location.hash = '/admin';
            return;
        }

        switch (pillar.action) {
            case 'knowledge':
                window.location.hash = '/knowledge';
                break;
            case 'chakraSanctuary':
                window.location.hash = '/chakraSanctuary';
                break;
            case 'poojas':
                window.location.hash = '/poojas';
                break;
            case 'mart':
                window.location.hash = '/mart';
                break;
            case 'temples':
                window.location.hash = '/temples';
                break;
            case 'liveDarshan':
                openModal('liveDarshan');
                break;
            case 'divyaMarga':
                window.location.hash = '/divyaMarga';
                break;
            case 'satvikTrace':
                openModal('satvikTrace');
                break;
            case 'ecoInnovation':
                openModal('ecoInnovation');
                break;
            case 'uploadTemple':
                openModal('uploadTemple');
                break;
            default:
                openModal('aiGuruChat', { pillar });
        }
    };

    const navigateOverlay = (direction: 'prev' | 'next') => {
        if (selectedIndex === null) return;
        const newIndex = direction === 'next'
            ? (selectedIndex + 1) % pillars.length
            : (selectedIndex - 1 + pillars.length) % pillars.length;
        setSelectedIndex(newIndex);
    };

    const getGradient = (color: string) => pillarGradients[color] || 'from-primary to-secondary';

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {pillars.map((pillar, index) => (
                    <motion.div
                        key={pillar.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedIndex(index)}
                        className={`group relative overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white p-6 md:p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-md min-h-[260px] ${pillar.span || ''}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <div className="relative z-10 flex-grow">
                            <div className="mb-4 p-3 bg-stone-50 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                                <Icon name={pillar.icon as any} className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-ink mb-2">{pillar.title}</h3>
                            <p className="text-stone-500 text-sm leading-relaxed mb-4">
                                {pillar.description}
                            </p>
                        </div>

                        <div className="relative z-10 mt-auto pt-4 flex items-center text-xs font-bold tracking-widest uppercase text-primary opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 border-t border-stone-100">
                            {isAdmin ? "Manage Module" : "Explore Pillar"} <Icon name="chevron-right" className="w-4 h-4 ml-1" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Pillar Detail Overlay ── */}
            {createPortal(
                <AnimatePresence>
                    {selectedPillar && selectedIndex !== null && (
                        <motion.div
                            key="pillar-detail-overlay-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                            onClick={() => setSelectedIndex(null)}
                        >
                            {/* Backdrop */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                            {/* Detail Card */}
                            <motion.div
                                key={selectedPillar.id}
                                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden"
                            >
                                {/* Gradient Header */}
                                <div className={`relative bg-gradient-to-br ${getGradient(selectedPillar.color)} p-8 pb-14 overflow-hidden`}>
                                    {/* Decorative elements */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]">
                                            <svg viewBox="0 0 100 100" className="w-full h-full text-white/20 animate-slow-spin">
                                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 4" />
                                                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 3" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedIndex(null)}
                                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all z-20"
                                        aria-label="Close"
                                    >
                                        <Icon name="x" className="w-5 h-5" />
                                    </button>

                                    {/* Pillar Counter */}
                                    <div className="absolute top-5 left-6 z-20">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold text-white tracking-widest uppercase">
                                            {selectedIndex + 1} / {pillars.length}
                                        </span>
                                    </div>

                                    {/* Icon & Title */}
                                    <div className="relative z-10 mt-6 text-center">
                                        <motion.div
                                            key={`icon-${selectedPillar.id}`}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                                            className="w-20 h-20 mx-auto mb-5 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-lg border border-white/30"
                                        >
                                            <Icon name={selectedPillar.icon as any} className="w-10 h-10 text-white drop-shadow-md" />
                                        </motion.div>
                                        <motion.h3
                                            key={`title-${selectedPillar.id}`}
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.15 }}
                                            className="text-3xl font-serif font-bold text-white drop-shadow-md"
                                        >
                                            {selectedPillar.title}
                                        </motion.h3>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="relative -mt-6 px-6 pb-6">
                                    <motion.div
                                        key={`content-${selectedPillar.id}`}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white rounded-3xl shadow-md border border-stone-100 p-6"
                                    >
                                        <p className="text-stone-600 leading-relaxed mb-4 text-sm">{selectedPillar.description}</p>

                                        <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-100">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">What's Inside</h4>
                                            <p className="text-stone-700 text-sm leading-relaxed">{selectedPillar.details}</p>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedIndex(null);
                                                handlePillarAction(selectedPillar);
                                            }}
                                            className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 bg-gradient-to-r ${getGradient(selectedPillar.color)}`}
                                        >
                                            <span>{isAdmin ? "Open Module" : "Explore This Pillar"}</span>
                                            <Icon name="chevron-right" className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Navigation Arrows */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none z-30">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigateOverlay('prev'); }}
                                        className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-stone-600 hover:text-primary hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-110 -translate-x-3"
                                        aria-label="Previous pillar"
                                    >
                                        <Icon name="chevron-right" className="w-5 h-5 rotate-180" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigateOverlay('next'); }}
                                        className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-stone-600 hover:text-primary hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-110 translate-x-3"
                                        aria-label="Next pillar"
                                    >
                                        <Icon name="chevron-right" className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Pill Navigation Dots */}
                                <div className="flex justify-center gap-1.5 pb-5">
                                    {pillars.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); }}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                i === selectedIndex
                                                    ? 'w-6 bg-primary'
                                                    : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                                            }`}
                                            aria-label={`Go to pillar ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

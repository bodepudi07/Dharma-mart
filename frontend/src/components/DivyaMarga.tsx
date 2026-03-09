import React, { useState, useEffect, useMemo } from 'react';
import { I18nContent, Language, Temple, RemoteSeva } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { getTemples } from '../services/apiService';

interface DivyaMargaProps {
    t: I18nContent;
    language: Language;
    onNavigate: (view: any, props?: any) => void;
    openModal: (type: string, props?: any) => void;
}

export const DivyaMarga = ({ t, language, onNavigate, openModal }: DivyaMargaProps) => {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'explore' | 'dashboard'>('explore');

    useEffect(() => {
        const load = async () => {
            const data = await getTemples(language);
            // Prioritize temples with sacred/ritual tags
            const ritualTemples = data.filter(temple =>
                temple.tags?.includes('shiva') ||
                temple.tags?.includes('krishna') ||
                temple.tags?.includes('shakta')
            ).slice(0, 9);
            setTemples(ritualTemples);
            setLoading(false);
        };
        load();
    }, [language]);

    // Simulated Active Sevas for the Dashboard
    const activeSevas = useMemo(() => [
        {
            id: 's-1',
            templeName: 'Kashi Vishwanath',
            sevaName: 'Maha Mrityunjaya Homa',
            status: 'in-progress',
            stage: 'Preparation',
            timestamp: '2 hours ago',
            icon: 'flame'
        },
        {
            id: 's-2',
            templeName: 'Mallikarjuna Srisailam',
            sevaName: 'Gau Seva (Green Offering)',
            status: 'completed',
            stage: 'Camera Uploaded',
            timestamp: 'Yesterday',
            icon: 'camera'
        }
    ], []);

    if (loading) return (
        <div className="min-h-screen bg-[#022c22] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#022c22] text-white overflow-x-hidden font-sans pt-20 pb-24 relative">
            {/* Emerald Ethereal Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/30 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-emerald-500/5 rounded-full animate-[ping_10s_linear_infinite]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <header className="py-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-teal-400 font-bold tracking-widest uppercase text-xs"
                        >
                            <span className="w-8 h-[1px] bg-teal-400/50" />
                            Digital Sanctuary
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-teal-300 to-emerald-200" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Divya Marga
                        </h1>
                        <p className="text-xl text-emerald-100/60 max-w-xl font-light">
                            Bridging the physical gap through remote rituals, sacred logistics, and authenticated video proof.
                        </p>
                    </div>

                    <div className="flex bg-emerald-950/50 border border-emerald-500/20 p-1 rounded-2xl backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'explore' ? 'bg-teal-500 text-emerald-950 shadow-lg' : 'text-teal-400/70 hover:text-teal-300'}`}
                        >
                            Explore Sevas
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-teal-500 text-emerald-950 shadow-lg' : 'text-teal-400/70 hover:text-teal-300'}`}
                        >
                            My Dashboard
                        </button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'explore' ? (
                        <motion.div
                            key="explore"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-16"
                        >
                            {/* Featured Banner */}
                            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-800 to-teal-900 border border-emerald-400/30 p-8 md:p-12 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-16 -mt-16" />
                                <div className="flex flex-col md:flex-row items-center gap-10">
                                    <div className="flex-1 space-y-6 text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] uppercase font-bold text-emerald-200">New Offering</span>
                                        </div>
                                        <h2 className="text-4xl font-bold">Sacred Gau Seva at Srisailam</h2>
                                        <p className="text-emerald-100/70 text-lg leading-relaxed">
                                            Support the protection of sacred cows at the Srisailam Devasthanam. Perform a remote "Gau Puja" and receive a personal video of the offering.
                                        </p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <button
                                                onClick={() => openModal('poojaBooking', { templeId: 7 })}
                                                className="bg-emerald-100 text-emerald-900 font-black px-8 py-4 rounded-2xl hover:bg-emerald-200 transition-all shadow-xl"
                                            >
                                                Perform Seva (₹501)
                                            </button>
                                            <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-md font-bold hover:bg-white/10 transition-all">
                                                View Live Stream
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-[400px] aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl relative group">
                                        <img src="https://images.unsplash.com/photo-1590424744295-886ec5cd650f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-emerald-900/20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-emerald-100/20 border border-emerald-100/30 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Icon name="play" className="w-6 h-6 text-emerald-100 fill-emerald-100" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seva Grid */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <Icon name="box" className="text-teal-400" /> Explore Rituals
                                    </h3>
                                    <div className="flex gap-2">
                                        {['All', 'Homa', 'Abhishekam', 'Gau Seva'].map(tag => (
                                            <button key={tag} className="px-4 py-2 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-emerald-950 transition-all">
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {temples.map((temple, idx) => (
                                        <PremiumSevaCard key={temple.id} temple={temple} delay={idx * 0.1} openModal={openModal} />
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Active Lifecycle Dashboard */}
                                <div className="lg:col-span-2 space-y-6">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <Icon name="zap" className="text-teal-400" /> Active Seva Lifecycle
                                    </h3>
                                    <div className="space-y-4">
                                        {activeSevas.map(seva => (
                                            <div key={seva.id} className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-md hover:border-emerald-400/40 transition-all group">
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${seva.status === 'completed' ? 'bg-teal-500/20 text-teal-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                            <Icon name={seva.icon as any} className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-bold">{seva.sevaName}</h4>
                                                            <p className="text-emerald-100/50 text-sm">{seva.templeName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${seva.status === 'completed' ? 'bg-teal-500 text-emerald-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                            {seva.status}
                                                        </div>
                                                        <p className="text-xs text-emerald-100/30 mt-2">{seva.timestamp}</p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mt-8 space-y-4">
                                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-emerald-100/30">
                                                        <span>Booking</span>
                                                        <span className={seva.stage === 'Preparation' ? 'text-teal-400' : ''}>Preparation</span>
                                                        <span className={seva.stage === 'Ritual' ? 'text-teal-400' : ''}>Ritual</span>
                                                        <span className={seva.status === 'completed' ? 'text-teal-400' : ''}>Completed</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-emerald-900 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: seva.status === 'completed' ? '100%' : '50%' }}
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                                        />
                                                    </div>
                                                    {seva.status === 'completed' && (
                                                        <button className="flex items-center gap-2 text-teal-400 font-bold text-sm hover:text-teal-300 transition-colors pt-2">
                                                            <Icon name="camera" className="w-4 h-4" /> Download Ritual Proof (HD)
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary & Stats */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold">Your Impact</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/10 text-center">
                                            <p className="text-3xl font-black text-emerald-100">12</p>
                                            <p className="text-xs font-bold text-emerald-500/60 uppercase mt-1">Sevas Done</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/10 text-center">
                                            <p className="text-3xl font-black text-emerald-100">₹6.5k</p>
                                            <p className="text-xs font-bold text-emerald-500/60 uppercase mt-1">Dharma Score</p>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-teal-900 to-emerald-950 border border-teal-500/20 relative overflow-hidden group">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                        <Icon name="shield" className="w-10 h-10 text-teal-400 mb-4" />
                                        <h4 className="text-xl font-bold mb-2">Verified Sanctity</h4>
                                        <p className="text-emerald-100/60 text-sm leading-relaxed">
                                            Every ritual performed remotely is authenticated by our on-ground Dharma Sevaks. Video proofs are signed with 128-bit digital certificates.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const PremiumSevaCard = ({ temple, delay, openModal }: { temple: Temple; delay: number; openModal: (type: string, props?: any) => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -8 }}
            className="group rounded-[2rem] bg-emerald-950/40 border border-emerald-500/10 overflow-hidden backdrop-blur-md shadow-2xl flex flex-col hover:border-emerald-400/40 transition-all duration-500"
        >
            <div className="h-56 relative overflow-hidden">
                <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-[#022c22]/10 to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-emerald-950/80 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">Ritual</span>
                    {temple.tags?.includes('shiva') && <span className="bg-teal-900/80 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded border border-teal-500/30 text-teal-300 uppercase tracking-widest">Shiva</span>}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white leading-tight">{temple.name}</h4>
                    <p className="text-emerald-200/50 text-xs mt-1 flex items-center gap-1">
                        <Icon name="map-pin" className="w-3 h-3" /> {temple.location.split(',')[0]}
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <div className="flex flex-col gap-2">
                    <SevaOptionItem
                        name="Gau Seva (Remote)"
                        price="₹501"
                        onClick={() => openModal('poojaBooking', { temple, pooja: { name: 'Gau Seva', cost: 501 } })}
                    />
                    <SevaOptionItem
                        name="Sankalpa & Archana"
                        price="₹1101"
                        onClick={() => openModal('poojaBooking', { temple, pooja: { name: 'Sankalpa & Archana', cost: 1101 } })}
                    />
                </div>

                <button
                    onClick={() => openModal('poojaBooking', { temple })}
                    className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-emerald-950 text-sm font-black transition-all shadow-[0_0_25px_rgba(20,184,166,0.2)]"
                >
                    View All Offerings
                </button>
            </div>
        </motion.div>
    );
};

const SevaOptionItem = ({ name, price, onClick }: { name: string; price: string; onClick: () => void }) => (
    <div
        onClick={onClick}
        className="flex items-center justify-between p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/10 hover:border-teal-400/30 hover:bg-emerald-900/50 transition-all cursor-pointer group/item"
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover/item:bg-teal-500/20 transition-colors">
                <Icon name="heart" className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-100/80 group-hover/item:text-emerald-500 transition-colors">{name}</span>
        </div>
        <span className="text-xs font-black text-teal-400">{price}</span>
    </div>
);

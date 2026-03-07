
import React, { useState, useEffect } from 'react';
import { I18nContent, Temple, Language } from '../types';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'motion/react';
import { getTemples } from '../services/apiService';

interface RestorationSanctuaryProps {
    t: I18nContent;
    language: Language;
    onNavigate: (view: any, props?: any) => void;
    onDonate: (temple: Temple) => void;
    openModal: (type: string, props?: any) => void;
}

export const RestorationSanctuary = ({ t, language, onNavigate, onDonate, openModal }: RestorationSanctuaryProps) => {
    const [restorationTemples, setRestorationTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getTemples(language);
                const destroyed = data.filter(temple => !!temple.isDestroyed);
                setRestorationTemples(destroyed);
            } catch (error) {
                console.error("Failed to load restoration temples:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 font-sans pt-24">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Hero Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-amber-500/10 pb-12">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-amber-500 font-bold tracking-widest uppercase text-sm"
                        >
                            <Icon name="heart-hand" className="w-5 h-5" /> Dharma Uddhar
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                            Heritage Sanctuary
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl">
                            Restoring forgotten shrines to their former glory. Help us identify lost temples and contribute to their physical and spiritual revival.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('restorationSubmission')}
                        className="px-8 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl font-bold hover:bg-amber-500/20 transition-all flex items-center gap-2 group whitespace-nowrap"
                    >
                        <Icon name="plus" className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Submit Forgotten Site
                    </motion.button>
                </header>

                {/* Restoration Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {restorationTemples.map(temple => (
                        <RestorationCard key={temple.id} temple={temple} onDonate={() => onDonate(temple)} />
                    ))}
                </section>

                <footer className="mt-20 p-10 rounded-[2.5rem] bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-500/10 text-center">
                    <h2 className="text-3xl font-bold text-amber-200 mb-6">Every Stone is a Prayer</h2>
                    <p className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
                        Funds are allocated to archaeological clearance, structural stabilization, and skilled artisans specializing in ancient Shastra-compliant architecture.
                    </p>
                </footer>
            </div>
        </div>
    );
};

const RestorationCard = ({ temple, onDonate }: { temple: Temple; onDonate: () => void }) => {
    const progress = temple.restorationProgress || 0;
    const bricks = temple.restorationBricks || 1000;
    const brickCost = temple.costPerBrick || 250;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group rounded-[2.5rem] bg-slate-900/40 border border-slate-800 overflow-hidden backdrop-blur-xl hover:border-amber-500/30 transition-all shadow-2xl"
        >
            <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                    <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent hidden md:block" />
                    <div className="absolute bottom-4 left-4">
                        <div className="bg-amber-500/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                            <Icon name="info" className="w-3 h-3" /> RUINS DETECTED
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-bold group-hover:text-amber-300 transition-colors">{temple.name}</h3>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Icon name="map-pin" className="w-3 h-3 text-amber-500" /> {temple.location}
                        </p>
                        <p className="text-sm text-slate-400 line-clamp-3 italic">"{temple.history}"</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Restoration Status</span>
                                <span className="text-amber-500">{progress}% Secured</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.5)]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-2">
                            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Heritage Goal</p>
                                <p className="text-lg font-bold text-amber-200">₹{temple.restorationGoal?.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Raised So Far</p>
                                <p className="text-lg font-bold text-indigo-300">₹{temple.restorationReceived?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onDonate}
                                className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-amber-900/40"
                            >
                                Contribute Fund
                            </button>
                            <button
                                onClick={onDonate}
                                className="flex-1 py-4 bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-amber-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
                            >
                                <Icon name="plus" className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                Adopt a Brick (₹{brickCost})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

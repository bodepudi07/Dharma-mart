import React from 'react';
import { I18nContent } from '../types';
import { Icon } from './Icon';
import { motion } from 'motion/react';

interface StateSanctuaryProps {
    t: I18nContent;
}

export const StateSanctuary = ({ t }: StateSanctuaryProps) => {
    // Component logic here

    return (
        <div className="min-h-screen bg-[#0a1128] text-white overflow-x-hidden pt-20 pb-24 relative font-sans">
            {/* Ethereal Background with subtle glowing state map logic here */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-30">
                <div className="absolute w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]" />
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
                        Explore the Sacred Heart of Telangana
                    </p>

                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icon name="search" className="h-5 w-5 text-blue-300" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-blue-300/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                                placeholder="Search temples, deities, or locations in Hyderabad..."
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Live Pilot Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-red-700 shadow-[0_0_40px_rgba(234,88,12,0.3)] border border-orange-400/30"
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
                            Book Proxy Seva (₹151)
                        </button>
                    </div>
                </motion.div>

                {/* The Maha Kshetras (Horizontal Scroll) */}
                <section>
                    <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                        <Icon name="sun" className="text-amber-400" /> The Maha Kshetras
                    </h2>
                    <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">

                        <div className="min-w-[300px] md:min-w-[400px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-pointer">
                            <div className="h-48 bg-stone-800 relative overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Yadagirigutta_Temple.jpg" alt="Yadagirigutta" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-amber-500/80 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white">Major Hub</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white">Yadagirigutta</h3>
                                <p className="text-blue-200 text-sm mt-1">Sri Lakshmi Narasimha Swamy</p>
                                <div className="mt-4 flex items-center justify-between text-sm text-stone-400 border-t border-white/10 pt-4">
                                    <span className="flex items-center gap-1"><Icon name="map-pin" className="w-4 h-4" /> 62 km from Hyd</span>
                                </div>
                            </div>
                        </div>

                        <div className="min-w-[300px] md:min-w-[400px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-pointer">
                            <div className="h-48 bg-stone-800 relative overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Bhadrachalam_Temple.jpg" alt="Bhadrachalam" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-blue-500/80 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white">River Godavari</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white">Bhadrachalam</h3>
                                <p className="text-blue-200 text-sm mt-1">Sri Sita Ramachandraswamy</p>
                                <div className="mt-4 flex items-center justify-between text-sm text-stone-400 border-t border-white/10 pt-4">
                                    <span className="flex items-center gap-1"><Icon name="map-pin" className="w-4 h-4" /> 312 km from Hyd</span>
                                </div>
                            </div>
                        </div>

                        <div className="min-w-[300px] md:min-w-[400px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-colors group cursor-pointer">
                            <div className="h-48 bg-stone-800 relative overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Vemulawada_Temple.jpg" alt="Vemulawada" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-purple-500/80 backdrop-blur-md text-xs font-bold px-2 py-1 rounded text-white">Dakshina Kashi</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white">Vemulawada</h3>
                                <p className="text-blue-200 text-sm mt-1">Sri Raja Rajeshwara Swamy</p>
                                <div className="mt-4 flex items-center justify-between text-sm text-stone-400 border-t border-white/10 pt-4">
                                    <span className="flex items-center gap-1"><Icon name="map-pin" className="w-4 h-4" /> 150 km from Hyd</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* The Ancient Shiva Circuit */}
                <section>
                    <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                        <Icon name="moon" className="text-blue-300" /> The Ancient Shiva Circuit
                    </h2>
                    <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x hide-scrollbar">

                        <div className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="h-40 bg-stone-800 rounded-xl mb-4 overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Ramappa_Temple_Main_Entrance.jpg" alt="Ramappa" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Ramappa Temple</h3>
                            <p className="text-blue-200/70 text-sm mt-1 mb-3">Mulugu District</p>
                            <span className="inline-block bg-white/10 text-xs text-amber-200 px-3 py-1 rounded-full border border-amber-200/30">UNESCO World Heritage</span>
                        </div>

                        <div className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="h-40 bg-stone-800 rounded-xl mb-4 overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Thousand_Pillar_Temple%2C_Warangal.jpg" alt="Thousand Pillar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Thousand Pillar Temple</h3>
                            <p className="text-blue-200/70 text-sm mt-1 mb-3">Warangal</p>
                            <span className="inline-block bg-white/10 text-xs text-stone-300 px-3 py-1 rounded-full border border-white/20">Kakatiya Architecture</span>
                        </div>

                        <div className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-center rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="h-40 bg-stone-800 rounded-xl mb-4 overflow-hidden">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Keesaragutta_Temple.jpg" alt="Keesaragutta" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Keesaragutta Temple</h3>
                            <p className="text-blue-200/70 text-sm mt-1 mb-3">Hyderabad Outskirts</p>
                            <span className="inline-block bg-white/10 text-xs text-stone-300 px-3 py-1 rounded-full border border-white/20">Hilltop Shrine</span>
                        </div>

                    </div>
                </section>

                {/* Curated Trails Grid */}
                <section>
                    <h2 className="text-3xl font-semibold mb-6 text-amber-100 flex items-center gap-3">
                        <Icon name="compass" className="text-emerald-400" /> Curated Trails & Divya Deshams
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="rounded-2xl bg-gradient-to-br from-indigo-900/50 to-blue-900/40 border border-indigo-500/30 p-6 backdrop-blur-md relative overflow-hidden group hover:border-indigo-400/60 transition-colors cursor-pointer">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                            <h3 className="text-xl font-bold text-indigo-100">The Hyderabad Inner-City Parikrama</h3>
                            <p className="text-indigo-200/70 mt-2 text-sm">A perfect 1-day spiritual journey within the city limits.</p>
                            <div className="mt-6 flex flex-wrap gap-2 text-xs text-indigo-200">
                                <span className="bg-black/20 px-3 py-1.5 rounded-md border border-indigo-500/20">Birla Mandir</span>
                                <Icon name="chevron-right" className="w-4 h-4 self-center text-indigo-400/50" />
                                <span className="bg-black/20 px-3 py-1.5 rounded-md border border-indigo-500/20">Jagannath Temple</span>
                                <Icon name="chevron-right" className="w-4 h-4 self-center text-indigo-400/50" />
                                <span className="bg-black/20 px-3 py-1.5 rounded-md border border-indigo-500/20">Balkampet Yellamma</span>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-emerald-900/50 to-teal-900/40 border border-emerald-500/30 p-6 backdrop-blur-md relative overflow-hidden group hover:border-emerald-400/60 transition-colors cursor-pointer">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                            <h3 className="text-xl font-bold text-emerald-100">Ancient Vaishnavite Trails</h3>
                            <p className="text-emerald-200/70 mt-2 text-sm">Discover historic Vishnu and Rama temples hidden in the Deccan.</p>
                            <div className="mt-6 flex flex-wrap gap-2 text-xs text-emerald-200">
                                <span className="bg-black/20 px-3 py-1.5 rounded-md border border-emerald-500/20">Karmanghat Hanuman</span>
                                <Icon name="chevron-right" className="w-4 h-4 self-center text-emerald-400/50" />
                                <span className="bg-black/20 px-3 py-1.5 rounded-md border border-emerald-500/20">Sita Ramachandraswamy (Amingad)</span>
                            </div>
                        </div>

                    </div>
                </section>

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
                    <button className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-colors">
                        Adopt a Local Brick (₹100)
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

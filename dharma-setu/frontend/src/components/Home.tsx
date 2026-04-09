import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { I18nContent, Temple, Pooja, Yatra, Book, Sloka, Testimonial, MajorEvent, Language } from '../types';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SLOKA_DATA } from '../constants';
import { useHomePageData } from '../hooks/useHomePageData';
import { Icon } from './Icon';

// Components
import { Section } from './Section';
import { SlokaOfTheDay } from './SlokaOfTheDay';
import { PanchangWidget } from './PanchangWidget';
import { TempleCard } from './TempleCard';
import { PoojaCard } from './PoojaCard';
import { YatraCard } from './YatraCard';
import { EventCard } from './EventCard';
import { VRDarshan } from './VRDarshan';
import { AIGuru } from './AIGuru';
import { FestivalCalendar } from './FestivalCalendar';
import { TestimonialCard } from './TestimonialCard';
import { Footer } from './Footer';
import { CardAnimator } from './CardAnimator';
import { LiveDarshanCard } from './LiveDarshanCard';
import { DonationCard } from './DonationCard';
import { FeaturedYatra } from './FeaturedYatra';
import { PersonalizedFeed } from './PersonalizedFeed';
import { PillarGrid } from './PillarGrid';
import { CustomYatraCard } from './CustomYatraCard';
import { PanditCard } from './PanditCard';
import { getDailySloka } from '../services/aiService';

// Skeletons
import { TempleCardSkeleton } from './TempleCardSkeleton';
import { PoojaCardSkeleton } from './PoojaCardSkeleton';
import { YatraCardSkeleton } from './YatraCardSkeleton';
import { EventCardSkeleton } from './EventCardSkeleton';

export interface HomeProps {
    t: I18nContent;
    language: Language;
    onDarshanClick: (temple: Temple) => void;
    yatraPlan: Temple[];
    isInYatraPlan: (templeId: number) => boolean;
    onToggleYatraPlan: (temple: Temple) => void;
}

export const Home = ({ t, language, onDarshanClick, yatraPlan, isInYatraPlan, onToggleYatraPlan }: HomeProps) => {
    const { openModal } = useModal();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { data, isLoading } = useHomePageData(language);

    const [dailySloka, setDailySloka] = useState<Sloka | null>(SLOKA_DATA[language][0]);

    useEffect(() => {
        let isCancelled = false;
        getDailySloka(language).then(data => {
            if (!isCancelled) {
                setDailySloka({
                    text: data.sloka_devanagari,
                    translation: data.sloka_transliteration,
                    meaning: data.meaning,
                });
            }
        }).catch(err => {
            console.error("Failed to fetch daily sloka, using fallback.", err);
        });
        return () => { isCancelled = true; };
    }, [language]);

    const handleLoginOrAction = (action: () => void) => {
        if (!currentUser) {
            openModal('login');
        } else {
            action();
        }
    };

    const handlePoojaBooking = (pooja: Pooja) => {
        handleLoginOrAction(() => {
            openModal('poojaBooking', { pooja });
        });
    };

    const handleAskGuruAboutPooja = (pooja: Pooja) => {
        openModal('aiGuruChat', { pooja });
    };

    const navigateTo = (path: string) => {
        window.location.hash = path;
    };

    return (
        <>
            {/* Hero Section - CRAZY UI ENHANCEMENT */}
            <section className="relative min-h-[105vh] flex items-center justify-center text-white overflow-hidden bg-ink pt-20">
                {/* Deep Cosmic Background Layer */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/images/hero_bg_4k.png')] bg-cover bg-center opacity-70 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/60 to-ink z-10"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60 z-10 animate-pulse"></div>
                </div>

                {/* Floating Orbs / Sacred Geometry */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-orb-float opacity-70"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/20 rounded-full mix-blend-screen filter blur-[120px] animate-orb-float opacity-50" style={{ animationDelay: '-4s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-primary/30 animate-slow-spin">
                            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 3" />
                            <path d="M 50 2 V 98 M 2 50 H 98 M 15 15 L 85 85 M 15 85 L 85 15" fill="none" stroke="currentColor" strokeWidth="0.1" opacity="0.5" />
                        </svg>
                    </div>
                </div>

                {/* Main Content Plate - Glassmorphism HUD */}
                <div className="relative z-20 container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-12 mt-10">

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                            }
                        }}
                        className="lg:w-1/2 text-center lg:text-left"
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-hud border border-primary/30 mb-8"
                        >
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></span>
                            <span className="text-xs font-mono tracking-widest text-primary font-bold uppercase">Silicon Valley meets Sanatana Dharma</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-[1.1]">
                            <span className="block drop-shadow-[0_0_35px_rgba(255,255,255,0.6)]">
                                {t.heroTitle.split(' ').map((word: string, i: number) => (
                                    <motion.span
                                        key={i}
                                        className="inline-block mr-4"
                                        variants={{
                                            hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
                                            visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
                                        }}
                                        transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </span>
                            <motion.span
                                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                                transition={{ duration: 1, delay: 0.8 }}
                                className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-secondary animate-neon-text mt-2 text-5xl md:text-7xl drop-shadow-[0_0_20px_rgba(234,88,12,0.8)]"
                            >
                                {t.appSlogan}
                            </motion.span>
                        </h1>

                        <motion.p
                            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                            transition={{ duration: 1, delay: 1 }}
                            className="text-xl md:text-2xl text-stone-300 mb-10 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed border-l-4 border-primary/50 pl-6"
                        >
                            {t.heroSubtitle}
                        </motion.p>

                        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                            <button
                                onClick={() => navigateTo('/poojas')}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-orange-600 rounded-full font-bold text-white tracking-wider flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] transform hover:-translate-y-1 transition-all duration-300 animate-shimmer-sweep overflow-hidden border border-orange-400/50"
                            >
                                <Icon name="lotus" className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">Begin Journey</span>
                            </button>

                            <button
                                onClick={() => openModal('aiGuruChat')}
                                className="w-full sm:w-auto px-8 py-4 glass-hud rounded-full font-bold text-white tracking-wider flex items-center justify-center gap-3 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 group"
                            >
                                <Icon name="cosmic-logo" className="w-5 h-5 text-primary group-hover:animate-om-pulse" />
                                Ask AI Guru
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className="lg:w-1/2 flex justify-center lg:justify-end relative"
                    >
                        {/* Elaborate Mandala/Chakra visual */}
                        <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-cyber-pulse"></div>

                            {/* Rotating rings */}
                            <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full animate-slow-spin flex items-center justify-center">
                                <div className="w-3 h-3 bg-primary rounded-full absolute -top-1.5 shadow-[0_0_15px_#ea580c]"></div>
                            </div>
                            <div className="absolute inset-4 border-[2px] border-dashed border-secondary/40 rounded-full animate-slow-spin" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
                            <div className="absolute inset-12 border-[1px] border-white/20 rounded-full"></div>

                            {/* Center Piece */}
                            <div className="relative z-10 w-64 h-64 glass-hud rounded-full border border-primary/50 shadow-[0_0_50px_rgba(234,88,12,0.3)] flex items-center justify-center backdrop-blur-2xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                                <Icon name="swasthika" className="w-24 h-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] filter transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_0_40px_rgba(234,88,12,1)]" />

                                {/* Inner scanning light */}
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_15px_#ea580c] animate-tech-scan"></div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50 animate-bounce">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-primary">Scroll</span>
                    <Icon name="chevron-right" className="w-5 h-5 text-primary rotate-90" />
                </div>
            </section>

            <div className="bg-paper">
                {/* Daily Sloka Section */}
                {dailySloka && (
                    <div className="container mx-auto px-4 mt-8 md:-mt-10 relative z-30 mb-8">
                        <SlokaOfTheDay sloka={dailySloka} t={t} />
                    </div>
                )}

                {/* Daily Panchang Section */}
                <div className="container mx-auto px-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <PanchangWidget />
                </div>

                {/* Daily Dharma Quest - Stickiness & Gamification */}
                {currentUser && (
                    <div className="container mx-auto px-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group shadow-sm hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] transition-shadow duration-500">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700"></div>

                            <div className="flex items-center gap-6 z-10">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl shadow-md border border-amber-200">
                                    {/* Glowing spinning lotus for gamification */}
                                    <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-amber-400/50 animate-slow-spin"></div>
                                    <Icon name="lotus" className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 drop-shadow-[0_0_8px_#ea580c] animate-deity-breathe" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-ink">Daily Dharma Quest</h3>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase tracking-widest font-bold rounded-full">Day {currentUser.currentStreak || 1}</span>
                                    </div>
                                    <p className="text-stone-500 text-sm">Light your virtual diya or chant 108 times to maintain your spiritual streak.</p>
                                </div>
                            </div>

                            <div className="flex w-full md:w-auto gap-3 z-10">
                                <button
                                    onClick={() => navigateTo('/chakraSanctuary')}
                                    className="flex-1 md:flex-none px-6 py-3 bg-white text-primary border border-primary/20 hover:border-primary/50 font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                >
                                    <Icon name="flame" className="w-5 h-5 text-orange-500 group-hover/btn:animate-pulse" />
                                    <span>Light Diya</span>
                                </button>
                                <button
                                    onClick={() => navigateTo('/chantingZone')}
                                    className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(234,88,12,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>Start Japa</span>
                                    <Icon name="chevron-right" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Featured Temple Spotlight */}
                {data.temples.length > 0 && (() => {
                    const featured = data.temples[0];
                    return (
                <div className="container mx-auto px-4 py-12">
                    <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative group shadow-sm">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon name="temple" className="w-64 h-64 text-primary" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-shrink-0 relative">
                                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse"></div>
                                <img
                                    src={featured.imageUrl}
                                    alt={featured.name}
                                    className="w-48 h-48 object-cover rounded-2xl relative z-10 shadow-lg"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white animate-pulse" title="Active"></div>
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold tracking-widest uppercase rounded-full border border-emerald-500/20">Featured</span>
                                    <span className="text-stone-500 text-xs font-medium">{featured.location}</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-4">{featured.name}</h2>
                                <p className="text-stone-500 text-sm mb-8 max-w-lg line-clamp-2">{featured.history}</p>
                                <button onClick={() => navigateTo(`/templeDetail/${featured.id}`)} className="btn-primary w-full md:w-auto">
                                    View Temple & Book Darshan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                    );
                })()}

                {/* 9 Pillars Bento Grid */}
                <section id="pillars" className="container mx-auto px-4 py-24">
                    <div className="text-center mb-16">
                        {currentUser?.role === 'admin' ? (
                            <>
                                <h2 className="text-4xl md:text-6xl font-serif font-bold text-ink mb-6">Partner Command Center</h2>
                                <p className="text-stone-500 text-lg max-w-2xl mx-auto">Manage operations, track donations, and monitor the spiritual ecosystem.</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl md:text-6xl font-serif font-bold text-ink mb-6">The 9-Pillar Infrastructure</h2>
                                <p className="text-stone-500 text-lg max-w-2xl mx-auto">We do not just list temples. We manage the entire spiritual ecosystem.</p>
                            </>
                        )}
                    </div>
                    <PillarGrid t={t} />
                </section>

                {/* Featured Hooks Section */}
                <section className="py-24 px-6 bg-stone-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-sm"
                            >
                                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icon name="microphone" className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-ink mb-4">Bal-Vihar</h3>
                                <p className="text-stone-600 mb-6">"Duolingo for Shlokas." AI-powered pronunciation coach for the next generation.</p>
                                <button onClick={() => navigateTo('/chantingZone')} className="text-orange-600 font-bold uppercase tracking-widest text-xs hover:text-orange-500 transition-colors">Try Kids Mode</button>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-sm"
                            >
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icon name="users-group" className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-ink mb-4">Dharma Connect</h3>
                                <p className="text-stone-600 mb-6">"Uber for Priests." Book verified Vedic pandits for any ritual at your doorstep.</p>
                                <button onClick={() => navigateTo('/poojas')} className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:text-blue-500 transition-colors">Book a Pandit</button>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-sm"
                            >
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icon name="shield-check" className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-ink mb-4">Satvik-Trace</h3>
                                <p className="text-stone-600 mb-6">"The Purity Engine." QR-based verification for Prasad and Puja essentials.</p>
                                <button onClick={() => openModal('satvikTrace')} className="text-emerald-600 font-bold uppercase tracking-widest text-xs hover:text-emerald-500 transition-colors">Scan for Purity</button>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Personalized Feed */}
                <PersonalizedFeed t={t} language={language} />

                {/* New Yatra Planner Card */}
                <div className="container mx-auto px-4 py-8">
                    <CustomYatraCard onPlanYatra={() => navigateTo('/yatraPlanner')} />
                </div>

                {/* Featured Temples */}
                <Section id="featured-temples" title={t.featuredTemples} icon={<Icon name="temple" className="w-8 h-8" />} onViewAll={() => navigateTo('/temples')} viewAllText={t.exploreAll}>
                    <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4">
                        {isLoading.temples ? [...Array(5)].map((_, i) => <div key={i} className="w-80 flex-shrink-0"><TempleCardSkeleton /></div>) : data.temples.slice(0, 5).map(temple => (
                            <div key={temple.id} className="w-80 flex-shrink-0">
                                <CardAnimator>
                                    <TempleCard
                                        temple={temple}
                                        t={t}
                                        onSelectTemple={() => navigateTo(`/templeDetail/${temple.id}`)}
                                        onBookDarshan={() => onDarshanClick(temple)}
                                        onVirtualDarshan={() => openModal('vrDarshan')}
                                        onViewImage={() => openModal('imageDetail', { imageUrl: temple.imageUrl, altText: temple.name })}
                                        onAskGuru={() => openModal('aiGuruChat', { temple })}
                                        isInYatraPlan={isInYatraPlan(temple.id)}
                                        onToggleYatraPlan={onToggleYatraPlan}
                                    />
                                </CardAnimator>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Chanting Zone for Kids */}
                <div className="container mx-auto px-4 my-8">
                    <div className="relative bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-xl p-8 overflow-hidden flex flex-col justify-center">
                        <img src="https://www.freeiconspng.com/uploads/peace-lotus-flower-png-4.png" alt="" className="absolute -bottom-12 -right-12 w-64 h-64 opacity-20 transform rotate-12" />
                        <div className="relative z-10 md:flex md:items-center md:gap-8 text-white text-center md:text-left">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ganesha_with_Modak.svg/512px-Ganesha_with_Modak.svg.png" alt="Smiling Ganesha" className="w-40 h-40 mx-auto md:mx-0 mb-4 md:mb-0" />
                            <div>
                                <h3 className="text-3xl font-bold font-kid-friendly mb-2">{t.chantingZoneForKids}</h3>
                                <p className="mb-6 opacity-90">{t.chantingZoneSubtitle}</p>
                                <button
                                    onClick={() => navigateTo('/chantingZone')}
                                    className="bg-white text-purple-600 font-bold font-kid-friendly py-3 px-8 rounded-full hover:bg-yellow-200 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    {t.chantNow}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Pilgrimage of the Month */}
                <div className="container mx-auto px-4">
                    <FeaturedYatra t={t} onExplore={() => navigateTo('/yatras')} />
                </div>

                {/* Major Events */}
                <Section id="major-events" title={t.majorEvents} icon={<Icon name="users-group" className="w-8 h-8" />} onViewAll={() => navigateTo('/events')} viewAllText={t.viewAll}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {isLoading.events ? [...Array(2)].map((_, i) => <EventCardSkeleton key={i} />) : data.events.slice(0, 2).map(event => (
                            <CardAnimator key={event.id}>
                                <EventCard
                                    event={event}
                                    t={t}
                                    onSelectEvent={() => navigateTo(`/eventDetail/${event.id}`)}
                                    onViewImage={() => openModal('imageDetail', { imageUrl: event.imageUrl, altText: event.name })}
                                />
                            </CardAnimator>
                        ))}
                    </div>
                </Section>

                {/* Explore Poojas */}
                <Section id="explore-poojas" title={t.explorePoojas} icon={<Icon name="bell" className="w-8 h-8" />} onViewAll={() => navigateTo('/poojas')} viewAllText={t.exploreAll}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading.poojas ? [...Array(4)].map((_, i) => <PoojaCardSkeleton key={i} />) : data.poojas.slice(0, 4).map(pooja => (
                            <CardAnimator key={pooja.id}>
                                <PoojaCard
                                    pooja={pooja}
                                    t={t}
                                    onBook={handlePoojaBooking}
                                    onViewImage={() => openModal('imageDetail', { imageUrl: pooja.imageUrl, altText: pooja.name })}
                                    onAskGuru={handleAskGuruAboutPooja}
                                />
                            </CardAnimator>
                        ))}
                    </div>
                </Section>

                {/* Featured Vedic Pandits */}
                <Section id="featured-pandits" title="Featured Vedic Pandits" icon={<Icon name="users" className="w-8 h-8" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading.pandits ? [...Array(4)].map((_, i) => <div key={i} className="h-64 bg-stone-200 animate-pulse rounded-lg"></div>) : data.pandits.slice(0, 4).map(pandit => (
                            <CardAnimator key={pandit.id}>
                                <PanditCard
                                    pandit={pandit}
                                    t={t}
                                    onBook={(pandit) => handleLoginOrAction(() => openModal('panditBooking', { pandit, event: null }))}
                                />
                            </CardAnimator>
                        ))}
                    </div>
                </Section>

                {/* Yatra Packages */}
                <Section id="yatra-packages" title={t.yatraPackages} icon={<Icon name="compass" className="w-8 h-8" />} onViewAll={() => navigateTo('/yatras')} viewAllText={t.viewAll}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isLoading.yatras ? [...Array(4)].map((_, i) => <YatraCardSkeleton key={i} />) : data.yatras.slice(0, 4).map(yatra => (
                            <CardAnimator key={yatra.id}>
                                <YatraCard
                                    yatra={yatra}
                                    t={t}
                                    onViewItinerary={() => openModal('yatraDetail', { yatra })}
                                    onViewImage={() => openModal('imageDetail', { imageUrl: yatra.imageUrl, altText: yatra.name })}
                                />
                            </CardAnimator>
                        ))}
                    </div>
                </Section>

                {/* Immersive Experiences Section */}
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <LiveDarshanCard title={t.liveDarshanTitle} description="From Ganga Aarti in Varanasi to your screen." buttonText={t.liveDarshanButton} onClick={() => openModal('liveDarshan')} />
                        <VRDarshan t={t} onClick={() => openModal('vrDarshan')} />
                    </div>
                </div>

                {/* AI Guru */}
                <Section id="ai-guru" title={t.aiGuruTitle} icon={<Icon name="cosmic-logo" className="w-8 h-8 text-primary" />}>
                    <AIGuru t={t} />
                </Section>

                {/* Forgotten Temple */}
                <section className="relative bg-ink text-paper py-20 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-repeat"
                        style={{
                            backgroundImage: `url('https://www.transparenttextures.com/patterns/az-subtle.png')`,
                            opacity: 0.05
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink to-ink/80"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl font-bold font-heading mb-4 text-primary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t.forgottenTempleTitle}</h2>
                                <p className="text-lg text-paper/80 mb-8 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{t.forgottenTempleDesc}</p>
                                <button
                                    onClick={() => handleLoginOrAction(() => openModal('uploadTemple'))}
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-secondary transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 animate-fade-in-up mx-auto md:mx-0"
                                    style={{ animationDelay: '0.6s' }}
                                >
                                    <Icon name="upload" className="w-5 h-5" />
                                    {t.uploadTemple}
                                </button>
                            </div>
                            <div className="relative flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                <div className="flex gap-2 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                    {/* Ruined Temple */}
                                    <div className="w-40 h-40 bg-cover bg-center rounded-md border-2 border-stone-500 relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1587895259837-2637b51e133e?q=80&w=800')` }}>
                                        <div className="absolute inset-0 bg-black/50"></div>
                                        <span className="absolute bottom-2 left-2 text-white font-bold text-sm bg-black/50 px-1 rounded">Before</span>
                                    </div>
                                    {/* Restored Temple */}
                                    <div className="w-40 h-40 bg-cover bg-center rounded-md border-2 border-primary relative" style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Somnath_Temple_At_Sunset_2.jpg/1280px-Somnath_Temple_At_Sunset_2.jpg')` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        <span className="absolute bottom-2 left-2 text-white font-bold text-sm bg-black/50 px-1 rounded">After</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seva Section */}
                <Section id="seva" title={t.sevaTitle} icon={<Icon name="heart-hand" className="w-8 h-8" />}>
                    <DonationCard t={t} onDonate={() => handleLoginOrAction(() => openModal('donation'))} />
                </Section>

                {/* Festivals */}
                <Section id="festivals" title={t.festivalsTitle} icon={<Icon name="calendar" className="w-8 h-8" />}>
                    <FestivalCalendar t={t} />
                </Section>

                {/* Testimonials */}
                <Section id="testimonials" title="Words from Devotees" icon={<Icon name="users-group" className="w-8 h-8" />}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {isLoading.testimonials ? [...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white rounded-xl shadow-lg animate-pulse"></div>) : data.testimonials.map(testimonial => (
                            <CardAnimator key={testimonial.id}>
                                <TestimonialCard testimonial={testimonial} />
                            </CardAnimator>
                        ))}
                    </div>
                </Section>
            </div>

            <Footer t={t} />
        </>
    );
};

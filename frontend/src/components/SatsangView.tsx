import React, { useState, useEffect, useMemo } from 'react';
import { I18nContent, ChatRoom as ChatRoomType } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { CardAnimator } from './CardAnimator';

const CATEGORY_ICONS: Record<string, string> = {
    All: 'om',
    General: 'users-group',
    Practice: 'meditate',
    Devotion: 'speaker',
    Knowledge: 'book-open',
    Seva: 'heart-hand',
    Action: 'temple',
    Local: 'map-pin',
    Youth: 'users',
    Family: 'heart',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    public: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
    academic: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.2)]' },
    restricted: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
    local: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.2)]' },
    volunteer: { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/30', glow: 'shadow-[0_0_12px_rgba(236,72,153,0.2)]' },
    action: { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/30', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
};

const SatsangCard = ({ room, t, index }: { room: ChatRoomType; t: I18nContent; index: number }) => {
    const navigateTo = (path: string) => { window.location.hash = path; };
    const roomName = t[room.name as keyof I18nContent] || room.name;
    const roomDesc = t[room.description as keyof I18nContent] || room.description;
    const typeStyle = TYPE_COLORS[room.type] || TYPE_COLORS.public;

    return (
        <CardAnimator>
            <div
                className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl rounded-[1.5rem] border border-white/[0.08] hover:border-primary/40 transition-all duration-700 flex flex-col h-full overflow-hidden hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(234,88,12,0.25)]"
                style={{ animationDelay: `${index * 80}ms` }}
            >
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-transparent group-hover:to-secondary/5 transition-all duration-700 pointer-events-none rounded-[1.5rem]" />

                {/* Top accent line */}
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 p-6 flex flex-col h-full">
                    {/* Header: Icon + Type Badge */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-14 h-14 bg-white/[0.06] rounded-2xl border border-white/10 group-hover:border-primary/40 group-hover:bg-primary/20 flex items-center justify-center transition-all duration-500">
                                <Icon name={room.icon} className="w-7 h-7 text-stone-400 group-hover:text-primary transition-colors duration-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {room.isLocal && (
                                <span className={`${typeStyle.bg} ${typeStyle.text} text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeStyle.border} ${typeStyle.glow} flex items-center gap-1`}>
                                    <Icon name="map-pin" className="w-2.5 h-2.5" /> Local
                                </span>
                            )}
                            <span className={`${typeStyle.bg} ${typeStyle.text} text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeStyle.border} ${typeStyle.glow} capitalize`}>
                                {room.type}
                            </span>
                        </div>
                    </div>

                    {/* Room Title */}
                    <h2 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-amber-400 transition-all duration-500 mb-1.5 leading-tight">{roomName}</h2>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-stone-500 font-medium">
                        {(room.onlineCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-400">{room.onlineCount} online</span>
                            </span>
                        )}
                        {(room.messageCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Icon name="chat" className="w-3.5 h-3.5" />
                                {room.messageCount} messages
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-stone-400">
                            <Icon name="clock" className="w-3.5 h-3.5" />
                            {room.lastActive || 'New'}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-stone-400 flex-grow mb-5 text-sm leading-relaxed line-clamp-2">{roomDesc}</p>

                    {/* Tags */}
                    {room.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {room.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold bg-white/[0.04] text-stone-500 px-2 py-0.5 rounded-md border border-white/[0.06] group-hover:border-primary/20 group-hover:text-stone-400 transition-all duration-300">#{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Join Button */}
                    <button
                        onClick={() => navigateTo(`/satsang/${room.id}`)}
                        className="mt-auto w-full relative overflow-hidden py-3 rounded-xl font-bold tracking-widest uppercase text-xs bg-white/[0.05] text-stone-300 border border-white/10 hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all duration-500 group/btn"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Icon name="users" className="w-4 h-4" />
                            Join Circle
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    </button>
                </div>
            </div>
        </CardAnimator>
    );
};

/* Trending topics ticker */
const TrendingTicker = () => {
    const topics = ['#BhagavadGita', '#MorningMantra', '#TempleRestoration', '#VedicAstrology', '#AyurvedicDiet', '#SpiritualParenting', '#KirtanNight', '#YatraDiaries', '#SanskritLearning', '#DharmaYouth'];
    return (
        <div className="overflow-hidden py-3 border-y border-white/[0.06] mb-8">
            <div className="flex animate-marquee whitespace-nowrap gap-8">
                {[...topics, ...topics].map((topic, i) => (
                    <span key={i} className="text-xs font-mono text-stone-500 tracking-wider flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/60" />
                        {topic}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* Stats bar */
const CommunityStats = ({ roomCount, totalMessages }: { roomCount: number; totalMessages: number }) => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
        {[
            { value: roomCount.toString(), label: 'Active Circles', icon: 'users-group' },
            { value: totalMessages.toLocaleString(), label: 'Messages', icon: 'chat' },
            { value: '24/7', label: 'Always Open', icon: 'flame' },
        ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                <Icon name={stat.icon as any} className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{stat.label}</p>
            </div>
        ))}
    </div>
);

export const SatsangView = ({ t }: { t: I18nContent }) => {
    const [rooms, setRooms] = useState<ChatRoomType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const { addToast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        api.getChatRooms()
            .then(setRooms)
            .catch(() => addToast("Could not load community circles.", 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const categories = ['All', ...Array.from(new Set(rooms.map(r => r.category).filter(Boolean)))];
    const totalMessages = rooms.reduce((sum, r) => sum + (r.messageCount || 0), 0);

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesCategory = activeCategory === 'All' || room.category === activeCategory;
            const roomName = t[room.name as keyof I18nContent] || room.name;
            const matchesSearch = roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (room.tags && room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
            return matchesCategory && matchesSearch;
        });
    }, [rooms, activeCategory, searchQuery, t]);

    return (
        <div className="min-h-full bg-[#08090f] pb-20 animate-fade-in relative overflow-hidden">
            {/* Cosmic background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-primary/8 rounded-full blur-[150px] animate-cosmic-drift" />
                <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] bg-indigo-500/6 rounded-full blur-[150px] animate-cosmic-drift-reverse" />
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] bg-amber-500/4 rounded-full blur-[120px] animate-glow-pulse" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-primary/30 animate-float-particle"
                        style={{
                            left: `${8 + (i * 7.5) % 84}%`,
                            top: `${15 + (i * 13) % 70}%`,
                            animationDelay: `${i * 0.7}s`,
                            animationDuration: `${6 + (i % 4) * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Hero Header */}
            <header className="relative pt-20 pb-16 px-4 overflow-hidden">
                {/* Sacred geometry subtle pattern - rotating */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <svg className="w-full h-full animate-[spin_120s_linear_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.1" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.1" />
                        <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.1" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="0.05" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.05" />
                        <line x1="22" y1="22" x2="78" y2="78" stroke="white" strokeWidth="0.05" />
                        <line x1="78" y1="22" x2="22" y2="78" stroke="white" strokeWidth="0.05" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Floating icon with glow */}
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-glow-pulse scale-150" />
                        {/* Rotating ring */}
                        <div className="absolute -inset-4 animate-[spin_15s_linear_infinite]">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(234,88,12,0.2)" strokeWidth="0.5" strokeDasharray="8 4" />
                            </svg>
                        </div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(234,88,12,0.3)] animate-om-pulse">
                            <Icon name="users-group" className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(234,88,12,0.8)]" />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-mono tracking-[0.2em] text-stone-400 uppercase">{rooms.length} circles active now</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold text-white tracking-tight mb-6 leading-[1.1]">
                        <span className="block">{t.satsangTitle}</span>
                        <span className="block text-2xl sm:text-3xl mt-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-secondary font-sans font-light tracking-wide">Where Seekers Unite</span>
                    </h1>

                    <p className="text-base sm:text-lg max-w-2xl mx-auto text-stone-400 font-light leading-relaxed mb-10">{t.satsangDesc}</p>

                    {/* Stats */}
                    <CommunityStats roomCount={rooms.length} totalMessages={totalMessages} />
                </div>
            </header>

            {/* Trending Ticker */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <TrendingTicker />
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                    {/* Category Pills */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full lg:w-auto pb-2">
                        {categories.map(cat => {
                            const iconName = CATEGORY_ICONS[cat || 'All'] || 'om';
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat || 'All')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 border ${
                                        activeCategory === cat
                                            ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_20px_rgba(234,88,12,0.2)]'
                                            : 'text-stone-500 border-white/[0.06] hover:text-white hover:bg-white/[0.04] hover:border-white/10'
                                    }`}
                                >
                                    <Icon name={iconName as any} className="w-3.5 h-3.5" />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-80 flex-shrink-0">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
                        <input
                            type="text"
                            placeholder="Search circles, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-white/[0.06] outline-none transition-all text-white placeholder:text-stone-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="bg-white/[0.03] backdrop-blur-md rounded-[1.5rem] border border-white/[0.06] animate-pulse h-72" />
                        ))}
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                            <Icon name="search" className="w-10 h-10 text-stone-700" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-500 mb-2">No circles found</h3>
                        <p className="text-stone-600 text-sm">Try a different search or category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredRooms.map((room, i) => (
                            <div key={room.id} className="animate-stagger-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <SatsangCard room={room} t={t} index={i} />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Circle CTA */}
            <div className="mt-16 max-w-3xl mx-auto px-4 relative z-10">
                <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-white/[0.03] to-secondary/10 p-8 rounded-[1.5rem] border border-primary/20 text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-glow-pulse opacity-50" />
                    <div className="relative z-10">
                        <Icon name="users-group" className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h3 className="font-serif text-2xl font-bold text-white mb-2">Start Your Own Circle</h3>
                        <p className="text-stone-400 text-sm max-w-md mx-auto mb-6">Gather like-minded seekers around a shared spiritual interest. Create a local, practice, or study circle.</p>
                        <button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-sm tracking-wider hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(234,88,12,0.4)] transition-all duration-300">
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>

            {/* Guidelines */}
            <aside className="mt-12 max-w-3xl mx-auto px-4 relative z-10 pb-8">
                <div className="bg-white/[0.03] backdrop-blur-md p-6 rounded-[1.5rem] border border-white/[0.06] flex items-start gap-5">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Icon name="shield-check" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg font-bold text-white mb-1">{t.satsangCommunityGuidelines}</h3>
                        <p className="text-sm text-stone-400 leading-relaxed">{t.satsangGuidelinesContent}</p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

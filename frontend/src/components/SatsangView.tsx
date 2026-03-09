import React, { useState, useEffect, useMemo } from 'react';
import { I18nContent, ChatRoom as ChatRoomType } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { CardAnimator } from './CardAnimator';

const SatsangCard = ({ room, t }: { room: ChatRoomType; t: I18nContent; }) => {
    const navigateTo = (path: string) => { window.location.hash = path; };
    const roomName = t[room.name as keyof I18nContent] || room.name;
    const roomDesc = t[room.description as keyof I18nContent] || room.description;

    return (
        <CardAnimator>
            <div className="group relative bg-white/5 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 hover:border-primary/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_24px_50px_rgba(180,83,9,0.2)] transition-all duration-500 flex flex-col h-full overflow-hidden hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="absolute top-0 right-0 p-4 z-20">
                    {room.isLocal && <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3" /> Local</span>}
                    {room.type === 'academic' && <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md">Academic</span>}
                </div>

                <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="relative flex-shrink-0">
                        <div className="bg-white/5 text-primary p-4 rounded-2xl border border-white/10 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                            <Icon name={room.icon} className="w-7 h-7" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300 pr-16">{roomName}</h2>
                        <div className="flex items-center gap-3 mt-1 text-xs text-stone-400 font-medium tracking-wide">
                            <span className="flex items-center gap-1"><Icon name="users" className="w-3.5 h-3.5" /> {room.membersCount ? room.membersCount.toLocaleString() : '1,000+'} members</span>
                            <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {room.lastActive || 'Active'}</span>
                        </div>
                    </div>
                </div>

                <p className="text-stone-300 flex-grow mb-6 relative z-10 text-sm leading-relaxed font-light">{roomDesc}</p>

                {room.tags && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {room.tags.map(tag => (
                            <span key={tag} className="text-[10px] uppercase tracking-wider font-bold bg-white/5 text-stone-400 px-2.5 py-1 rounded-lg border border-white/5">#{tag}</span>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => navigateTo(`/satsang/${room.id}`)}
                    className="mt-auto w-full btn-primary py-3 rounded-2xl font-bold tracking-widest uppercase text-xs"
                >
                    Join Circle
                </button>
            </div>
        </CardAnimator>
    );
};

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
        <div className="min-h-full bg-[#0d0f1a] pb-20 animate-fade-in relative overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header Section */}
            <header className="relative pt-16 pb-12 px-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full shadow-2xl mb-6 border border-white/10">
                        <Icon name="users-group" className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white tracking-tight drop-shadow-lg">{t.satsangTitle}</h1>
                    <p className="mt-4 sm:mt-6 text-base sm:text-lg max-w-2xl mx-auto text-stone-400 font-light leading-relaxed">Connect with seekers, share experiences, and grow together in your spiritual journey through guided and open discussions.</p>
                </div>
            </header>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-10 relative z-20">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                    {/* Categories Tabs */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full md:w-auto p-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat || 'All')}
                                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeCategory === cat ? 'bg-primary text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72 flex-shrink-0">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
                        <input
                            type="text"
                            placeholder="Search topics, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white/10 outline-none transition-all text-white placeholder:text-stone-600 text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Community Rooms Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 animate-pulse h-64"></div>
                        ))}
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-20">
                        <Icon name="search" className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-stone-600">No communities found</h3>
                        <p className="text-stone-500 mt-2">Try adjusting your search or category filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map(room => (
                            <SatsangCard key={room.id} room={room} t={t} />
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Guidelines Banner */}
            <aside className="mt-20 max-w-4xl mx-auto px-4 relative z-10">
                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-primary/20 shadow-2xl flex flex-col md:flex-row items-center gap-6">
                    <div className="bg-primary/10 p-4 rounded-full text-primary border border-primary/20">
                        <Icon name="shield-check" className="w-10 h-10 shadow-[0_0_15px_rgba(234,88,12,0.2)]" />
                    </div>
                    <div>
                        <h3 className="font-serif text-2xl font-bold text-white mb-2">{t.satsangCommunityGuidelines}</h3>
                        <p className="text-sm md:text-base text-stone-400 font-light leading-relaxed">{t.satsangGuidelinesContent}</p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

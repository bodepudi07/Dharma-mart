import React, { useState, useEffect } from 'react';
import { I18nContent, ChatRoom as ChatRoomType } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { CardAnimator } from './CardAnimator';

const SatsangCard = ({ room, t }: { room: ChatRoomType; t: I18nContent; }) => {
    const navigateTo = (path: string) => { window.location.hash = path; };
    const roomName = t[room.name];
    const roomDesc = t[room.description];

    return (
        <CardAnimator>
            <div className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-[var(--color-primary)]/50 hover:shadow-[0_0_40px_var(--chakra-glow-color)] transition-all duration-500 flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="flex items-center gap-5 mb-6 relative z-10">
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-[var(--color-primary)]/20 blur-xl rounded-full group-hover:bg-[var(--color-primary)]/40 transition-colors duration-500"></div>
                        <div className="relative bg-white/10 text-[var(--color-primary)] p-4 rounded-full border border-white/10 group-hover:border-[var(--color-primary)]/50 transition-colors">
                            <Icon name={room.icon} className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif text-white tracking-wide group-hover:text-[var(--color-primary)] transition-colors duration-300">{roomName}</h2>
                </div>

                <p className="text-stone-300 flex-grow mb-8 relative z-10 font-light leading-relaxed">{roomDesc}</p>

                <button
                    onClick={() => navigateTo(`/satsang/${room.id}`)}
                    className="mt-auto relative overflow-hidden group/btn bg-white/10 text-white font-medium py-3 px-8 rounded-full self-start transition-all duration-300 border border-white/20 hover:border-transparent"
                >
                    <span className="relative z-10 tracking-widest uppercase text-sm group-hover/btn:text-black transition-colors duration-300 delay-100">{t.satsangJoinCircle}</span>
                    <div className="absolute inset-0 bg-[var(--color-primary)] transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left"></div>
                </button>
            </div>
        </CardAnimator>
    );
};

export const SatsangView = ({ t }: { t: I18nContent }) => {
    const [rooms, setRooms] = useState<ChatRoomType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        api.getChatRooms()
            .then(setRooms)
            .catch(() => addToast("Could not load community circles.", 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    return (
        <div className="min-h-full p-4 sm:p-8 animate-fade-in bg-black text-white relative flex flex-col items-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-[var(--color-primary)]/20 rounded-full blur-[120px] opacity-60 mix-blend-screen animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-[var(--color-secondary)]/20 rounded-full blur-[100px] opacity-60 mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="relative z-10 text-center mb-16 pt-8 w-full max-w-5xl">
                <Icon name="users-group" className="w-16 h-16 text-[var(--color-primary)] mx-auto mb-6 drop-shadow-[0_0_15px_var(--chakra-glow-color)] transition-all duration-500" />
                <h1 className="text-5xl md:text-6xl font-serif text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-500">{t.satsangTitle}</h1>
                <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-stone-300 font-light tracking-wide transition-all duration-500">{t.satsangDesc}</p>
            </header>

            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 animate-pulse">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="w-16 h-16 rounded-full bg-white/10"></div>
                                <div className="h-8 bg-white/10 rounded-md w-1/2"></div>
                            </div>
                            <div className="h-4 bg-white/10 rounded-md w-full mb-3"></div>
                            <div className="h-4 bg-white/10 rounded-md w-5/6"></div>
                            <div className="h-12 bg-white/10 rounded-full w-40 mt-8"></div>
                        </div>
                    ))
                ) : rooms.map(room => (
                    <SatsangCard key={room.id} room={room} t={t} />
                ))}
            </main>

            <aside className="relative z-10 mt-20 mb-8 max-w-3xl w-full mx-auto bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-[var(--color-primary)]/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h3 className="font-serif text-2xl text-[var(--color-primary)] text-center mb-4 tracking-wide transition-all duration-500">{t.satsangCommunityGuidelines}</h3>
                <p className="text-base text-stone-400 text-center font-light leading-relaxed transition-all duration-500">{t.satsangGuidelinesContent}</p>
            </aside>
        </div>
    );
};

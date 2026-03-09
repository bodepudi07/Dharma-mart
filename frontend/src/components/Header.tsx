
import React from 'react';
import { User, I18nContent } from '../types';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';

export interface HeaderProps {
    currentUser: User | null;
    t: I18nContent;
    onMenuClick: () => void;
    onUserClick: () => void;
    onLoginClick: () => void;
}

export const Header = ({ currentUser, t, onMenuClick, onUserClick, onLoginClick }: HeaderProps) => {
    const { theme } = useTheme();

    return (
        <header
            className="md:hidden flex items-center justify-between p-4 bg-paper/80 backdrop-blur-xl text-ink shadow-sm sticky top-0 z-20 border-b border-white/20 transition-all duration-500"
        >
            <button onClick={onMenuClick} className="p-2 text-stone-600 hover:text-primary transition-colors" aria-label="Open menu">
                <Icon name="menu" className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse pointer-events-none"></div>
                <Icon name="cosmic-logo" className="w-6 h-6 text-primary relative z-10 animate-slow-spin" />
                <span className="font-serif font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm tracking-tight relative z-10">{t.heroTitle}</span>
            </div>
            {currentUser ? (
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 shadow-inner">
                        <Icon name="flame" className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-stone-700">{currentUser.currentStreak || 0}</span>
                        <div className="w-px h-4 bg-stone-300 mx-1"></div>
                        <Icon name="star" className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-stone-700">Lvl {currentUser.level || 1}</span>
                    </div>
                    <button onClick={onUserClick} className="p-1 relative group" aria-label="View profile">
                        <div className="absolute inset-0 bg-primary/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 blur-sm"></div>
                        <img
                            src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`}
                            alt="Profile"
                            className="w-8 h-8 rounded-full border-2 border-primary relative z-10 object-cover"
                        />
                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-20"></div>
                    </button>
                </div>
            ) : (
                <button onClick={onLoginClick} className="text-xs font-bold bg-gradient-to-r from-primary to-secondary px-5 py-2 rounded-full text-white shadow-md active:scale-95 hover:shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                    <span className="relative z-10">{t.login}</span>
                </button>
            )}
        </header>
    );
};

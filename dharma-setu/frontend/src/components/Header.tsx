
import React from 'react';
import { User, I18nContent, Language } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { SessionTimer } from './SessionTimer';

export interface HeaderProps {
    currentUser: User | null;
    t: I18nContent;
    currentLang: Language;
    setLang: (lang: Language) => void;
    onMenuClick: () => void;
    onUserClick: () => void;
    onLoginClick: () => void;
}

export const Header = ({ currentUser, t, currentLang, setLang, onMenuClick, onUserClick, onLoginClick }: HeaderProps) => {
    const { theme } = useTheme();

    return (
        <header
            role="banner"
            className="md:hidden flex items-center justify-between p-4 bg-paper/80 backdrop-blur-xl text-ink shadow-sm sticky top-0 z-20 border-b border-white/20 transition-all duration-500"
        >
            <button onClick={onMenuClick} className="p-2 text-stone-600 hover:text-primary transition-colors" aria-label="Open menu">
                <Icon name="menu" className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse pointer-events-none"></div>
                <Icon name="cosmic-logo" className="w-6 h-6 text-primary relative z-10 animate-slow-spin hidden sm:block" />
                <span className="font-serif font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm tracking-tight relative z-10 hidden sm:block">{t.heroTitle}</span>
            </div>

            <div className="flex items-center gap-3">
                <LanguageSwitcher currentLang={currentLang} setLang={setLang} />
                {currentUser ? (
                    <div className="flex items-center gap-3">
                        <SessionTimer />
                    </div>
                ) : null}
            </div>
        </header>
    );
};

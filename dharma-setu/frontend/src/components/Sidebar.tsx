




import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Language, type I18nContent, type User, type View, type IconName, type Temple } from '../types';
import { Icon } from './Icon';
import { SessionTimer } from './SessionTimer';
import * as api from '../services/apiService';
import { fuzzySearch } from '../utils/geolocation';


interface SidebarProps {
    currentLang: Language;
    setLang: (lang: Language) => void;
    t: I18nContent;
    onLoginClick: () => void;
    onSetView: (view: View, id?: string | number) => void;
    onSevaClick: () => void;
    currentView: View;
    currentUser: User | null;
    logout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink = React.memo(({
    icon,
    label,
    isActive,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
        className={`w-full flex items-center space-x-4 px-5 py-3 rounded-2xl text-base transition-all duration-300 group relative ${isActive
            ? 'text-primary font-semibold'
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/50'
            }`}
    >
        {isActive && (
            <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl border-l-4 border-primary shadow-[-5px_0_15px_rgba(234,88,12,0.3)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        <span className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`}>
            {icon}
        </span>
        <span className="relative z-10">{label}</span>
    </button>
));
NavLink.displayName = 'NavLink';


export const Sidebar = ({ currentLang, setLang, t, onLoginClick, onSetView, currentView, currentUser, logout, onSevaClick, isOpen, setIsOpen }: SidebarProps) => {

    const handleLinkClick = (view: View, id?: string | number) => {
        onSetView(view, id);
        setIsOpen(false);
    };

    // Only 3 core navigation items for the exclusive experience
    const mainNavLinks: { view: View; label: string; icon: IconName }[] = [
        { view: 'home', label: t.navHome, icon: 'home' },
        { view: 'temples', label: 'Sacred Darshans', icon: 'temple' },
        { view: 'chantingZone', label: t.navChantingZone, icon: 'om' },
    ];

    return (
        <aside role="navigation" aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-40 w-72 bg-paper/95 backdrop-blur-2xl border-r border-stone-200/50 flex flex-col p-6 h-full overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 w-16 h-16 bg-primary/20 blur-xl rounded-full pointer-events-none"></div>
                <button onClick={() => handleLinkClick('home')} className="flex items-center space-x-3 text-left group relative z-10">
                    <div className="p-2 bg-gradient-to-br from-primary/10 to-transparent rounded-xl group-hover:from-primary/20 group-hover:scale-110 transition-all duration-300 shadow-inner">
                        <Icon name="cosmic-logo" className="h-8 w-8 text-primary group-hover:animate-slow-spin" />
                    </div>
                    <span className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm tracking-tight">{t.heroTitle}</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-stone-400 hover:text-stone-900" aria-label="Close menu">
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            {/* Session Timer */}
            {currentUser && (
                <div className="mb-6">
                    <SessionTimer />
                </div>
            )}

            <nav className="flex-grow space-y-1 mt-6">
                {mainNavLinks.map(link => (
                    <NavLink
                        key={link.view}
                        onClick={() => handleLinkClick(link.view)}
                        isActive={currentView === link.view}
                        label={link.label}
                        icon={<Icon name={link.icon} className="w-6 h-6" />}
                    />
                ))}
            </nav>

            <div className="mt-auto flex-shrink-0 space-y-4 pt-6 border-t border-stone-100">
                <div className="flex items-center justify-between">
                    <LanguageSwitcher currentLang={currentLang} setLang={setLang} />
                </div>
                {currentUser ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {currentUser.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="font-semibold text-sm truncate text-ink">{currentUser.email}</p>
                                <p className="text-xs text-stone-400">Exclusive Access</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="w-full bg-stone-100 text-stone-600 font-medium px-4 py-2.5 rounded-xl text-sm hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        >
                            End Session
                        </button>
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

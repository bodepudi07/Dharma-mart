



import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Language, type I18nContent, type User, type View, type IconName, type Temple } from '../types';
import { Icon } from './Icon';
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

const SearchInput = ({ t, onSearch }: { t: I18nContent; onSearch: (query: string) => void }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Temple[]>([]);
    const [allTemples, setAllTemples] = useState<Temple[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        api.getTemples(Language.EN).then(setAllTemples);
    }, []);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        if (newQuery.length > 2) {
            const maxDistance = newQuery.length < 5 ? 1 : 2;
            const results = fuzzySearch(allTemples, newQuery.toLowerCase(), ['name', 'location'], maxDistance);
            setSuggestions(results.map(r => r.item as Temple).slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (templeName: string) => {
        setQuery(templeName);
        setSuggestions([]);
        onSearch(templeName);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setSuggestions([]);
            (document.activeElement as HTMLElement)?.blur();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative mb-4">
            <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={t.heroSearchPlaceholder}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-[rgba(0,0,0,0.2)] text-white border-2 border-[rgba(255,255,255,0.2)] focus:border-primary focus:ring-primary focus:outline-none"
                autoComplete="off"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon name="search" className="w-5 h-5 text-sidebar" />
            </div>
            {isFocused && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white text-stone-800 rounded-md shadow-lg overflow-hidden animate-fade-in">
                    {suggestions.map(temple => (
                        <li key={temple.id}>
                            <button
                                type="button"
                                onMouseDown={() => handleSuggestionClick(temple.name)}
                                className="w-full text-left px-4 py-2 hover:bg-stone-100"
                            >
                                {temple.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </form>
    );
};


export const Sidebar = ({ currentLang, setLang, t, onLoginClick, onSetView, currentView, currentUser, logout, onSevaClick, isOpen, setIsOpen }: SidebarProps) => {

    const handleLinkClick = (view: View, id?: string | number) => {
        onSetView(view, id);
        setIsOpen(false); // Close sidebar on navigation
    };

    const mainNavLinks: { view: View; label: string; icon: IconName }[] = [
        { view: 'home', label: t.navHome, icon: 'home' },
        { view: 'chakraSanctuary', label: t.navChakraSanctuary, icon: 'chakra' },
        { view: 'temples', label: t.navTemples, icon: 'temple' },
        { view: 'stateSanctuary', label: 'Local Sanctuary', icon: 'map-pin' },
        { view: 'events', label: t.navEvents, icon: 'users-group' },
        { view: 'poojas', label: t.navPoojaServices, icon: 'bell' },
        { view: 'yatraPlanner', label: t.navYatras, icon: 'compass' },
        { view: 'knowledge', label: t.navKnowledge, icon: 'book-open' },
        { view: 'chantingZone', label: t.navChantingZone, icon: 'om' },
        { view: 'restorationSanctuary', label: 'Dharma Uddhar', icon: 'heart-hand' },
        { view: 'divyaMarga', label: 'Divya Marga', icon: 'video' },
        { view: 'satsang', label: t.navSatsang, icon: 'users' },
    ];

    return (
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-paper/95 backdrop-blur-2xl border-r border-stone-200/50 flex flex-col p-6 h-full overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-8 relative">
                {/* Subtle cosmic glow behind logo */}
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

            <SearchInput t={t} onSearch={(query) => handleLinkClick('search', query)} />

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

                <NavLink
                    key="seva"
                    onClick={() => {
                        onSevaClick();
                        setIsOpen(false);
                    }}
                    isActive={false} // Seva is an action, not a view
                    label={t.navSeva}
                    icon={<Icon name="heart-hand" className="w-6 h-6" />}
                />

                {currentUser?.role === 'admin' && (
                    <NavLink
                        onClick={() => handleLinkClick('dashboard')}
                        isActive={currentView === 'dashboard'}
                        label={t.navDashboard}
                        icon={<Icon name="clipboard-list" className="w-6 h-6" />}
                    />
                )}
                {currentUser && (
                    <NavLink
                        onClick={() => handleLinkClick('savedInsights')}
                        isActive={currentView === 'savedInsights'}
                        label="Saved Insights"
                        icon={<Icon name="heart" className="w-6 h-6" />}
                    />
                )}
            </nav>

            <div className="mt-auto flex-shrink-0 space-y-4 pt-6 border-t border-stone-100">
                <LanguageSwitcher currentLang={currentLang} setLang={setLang} />
                {currentUser ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                onSetView('home'); // or just open user modal directly, but the logic flows through App
                                // we will just open user setting, wait, in App 'settings' is user profile
                                handleLinkClick('settings');
                            }}
                            className={`w-full flex items-center gap-3 text-left p-3 rounded-2xl transition-all ${currentView === 'settings' ? 'bg-primary/5 border border-primary/10' : 'hover:bg-stone-100/50'}`}
                        >
                            <div className="relative">
                                <img
                                    src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full border-2 border-primary flex-shrink-0 object-cover"
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="font-semibold text-sm truncate text-ink">{currentUser.name}</p>
                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                                    <span className="flex items-center gap-1"><Icon name="star" className="w-3 h-3 text-amber-500" /> Lvl {currentUser.level || 1}</span>
                                    <span className="flex items-center gap-1"><Icon name="flame" className="w-3 h-3 text-orange-500" /> {currentUser.currentStreak || 0}</span>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="w-full bg-stone-100 text-stone-600 font-medium px-4 py-2.5 rounded-xl text-sm hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                        >
                            {t.logout}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-3">
                        <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold px-4 py-3 rounded-xl text-sm hover:shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:scale-[1.02] transition-all duration-300 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                            <span className="relative z-10">{t.login}</span>
                        </button>
                        <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="w-full bg-white/50 backdrop-blur-sm text-stone-700 font-bold px-4 py-3 rounded-xl text-sm border border-stone-200 hover:bg-white hover:shadow-md hover:scale-[1.02] transition-all duration-300">{t.signup}</button>
                    </div>
                )}
            </div>
        </aside>
    );
};

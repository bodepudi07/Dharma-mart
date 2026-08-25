import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Language, type I18nContent, type User, type View, type IconName, type Temple } from '../types';
import { Icon } from './Icon';
import * as api from '../services/apiService';
import { fuzzySearch } from '../utils/geolocation';
import { NotificationBell } from './NotificationBell';

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
        className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-xl text-base transition-all duration-500 group relative border border-transparent ${isActive
            ? 'text-amber-800 font-serif font-semibold bg-[#FAF6EE]/90 border-[#C3A150]/30 shadow-[0_4px_20px_rgba(195,161,80,0.15)]'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/40'
            }`}
    >
        {/* Soft diya-glow behind text when active */}
        {isActive && (
          <div className="absolute left-2 w-1.5 h-6 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full shadow-[0_0_8px_#f59e0b]" />
        )}
        <span className={`relative z-10 transition-transform duration-500 group-hover:scale-105 ${isActive ? 'text-amber-800' : 'text-stone-400'}`}>
            {icon}
        </span>
        <span className="relative z-10 font-serif text-sm tracking-wide">{label}</span>
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
        <form onSubmit={handleSubmit} className="relative mb-6">
            <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder={t.heroSearchPlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/70 text-stone-800 border-2 border-stone-200/80 focus:border-[#C3A150]/60 focus:ring-0 focus:outline-none text-sm transition-all"
                autoComplete="off"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon name="search" className="w-5 h-5 text-stone-400" />
            </div>
            {isFocused && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white text-stone-800 rounded-md shadow-lg overflow-hidden animate-fade-in border border-stone-200">
                    {suggestions.map(temple => (
                        <li key={temple.id}>
                            <button
                                type="button"
                                onMouseDown={() => handleSuggestionClick(temple.name)}
                                className="w-full text-left px-4 py-2 hover:bg-stone-100 text-sm font-serif"
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
    const [punya, setPunya] = useState(() => parseInt(localStorage.getItem('dd-punya-balance') || '0', 10));

    useEffect(() => {
        const handleUpdate = () => setPunya(parseInt(localStorage.getItem('dd-punya-balance') || '0', 10));
        window.addEventListener('punyaUpdated', handleUpdate);
        return () => window.removeEventListener('punyaUpdated', handleUpdate);
    }, []);

    const handleLinkClick = (view: View, id?: string | number) => {
        onSetView(view, id);
        setIsOpen(false);
    };

    // Organized navigation groups with brass/bronze dividers
    const navGroup1: { view: View; label: string; icon: IconName }[] = [
        { view: 'home', label: t.navHome, icon: 'home' },
        { view: 'temples', label: t.navTemples, icon: 'temple' },
        { view: 'stateSanctuary', label: 'Local Sanctuary', icon: 'map-pin' },
        { view: 'yatraPlanner', label: t.navYatras, icon: 'compass' },
    ];

    const navGroup2: { view: View; label: string; icon: IconName }[] = [
        { view: 'knowledge', label: t.navKnowledge, icon: 'book-open' },
        { view: 'chantingZone', label: t.navChantingZone, icon: 'om' },
        { view: 'chakraSanctuary', label: t.navChakraSanctuary, icon: 'chakra' },
    ];

    const navGroup3: { view: View; label: string; icon: IconName }[] = [
        { view: 'poojas', label: t.navPoojaServices, icon: 'bell' },
        { view: 'mart', label: t.navMart, icon: 'shopping-bag' },
        { view: 'restorationSanctuary', label: 'Dharma Uddhar', icon: 'heart-hand' },
        { view: 'divyaMarga', label: 'Divya Marga', icon: 'video' },
        { view: 'events', label: t.navEvents, icon: 'users-group' },
    ];

    return (
        <aside 
          role="navigation" 
          aria-label="Main navigation" 
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#FAF6EE] border-r-2 border-[#C3A150]/20 flex flex-col p-6 h-full overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0 shadow-[4px_0_30px_rgba(27,24,18,0.06)] ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')`,
          }}
        >
            {/* Header / Logo */}
            <div className="flex items-center justify-between mb-8 relative pb-4 border-b border-[#C3A150]/20">
                <button onClick={() => handleLinkClick('home')} className="flex items-center space-x-3 text-left group relative z-10">
                    <div className="p-2 bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl group-hover:from-amber-500/20 group-hover:scale-105 transition-all duration-300">
                        <Icon name="cosmic-logo" className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-xl font-serif font-bold text-copper tracking-wide">{t.heroTitle}</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-stone-400 hover:text-stone-900" aria-label="Close menu">
                    <Icon name="x" className="w-6 h-6" />
                </button>
            </div>

            <SearchInput t={t} onSearch={(query) => handleLinkClick('search', query)} />

            {/* Navigation Lists with Bronze Separators */}
            <nav className="flex-grow space-y-1">
                
                {/* Group 1: Sanctuary Walkthrough */}
                <div className="space-y-1">
                  {navGroup1.map(link => (
                      <NavLink
                          key={link.view}
                          onClick={() => handleLinkClick(link.view)}
                          isActive={currentView === link.view}
                          label={link.label}
                          icon={<Icon name={link.icon} className="w-5 h-5" />}
                      />
                  ))}
                </div>

                {/* Bronze separator */}
                <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C3A150]/30 to-transparent my-4" />

                {/* Group 2: Gurukul / Study */}
                <div className="space-y-1">
                  {navGroup2.map(link => (
                      <NavLink
                          key={link.view}
                          onClick={() => handleLinkClick(link.view)}
                          isActive={currentView === link.view}
                          label={link.label}
                          icon={<Icon name={link.icon} className="w-5 h-5" />}
                      />
                  ))}
                </div>

                {/* Bronze separator */}
                <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C3A150]/30 to-transparent my-4" />

                {/* Group 3: Services & Offerings */}
                <div className="space-y-1">
                  {navGroup3.map(link => (
                      <NavLink
                          key={link.view}
                          onClick={() => handleLinkClick(link.view)}
                          isActive={currentView === link.view}
                          label={link.label}
                          icon={<Icon name={link.icon} className="w-5 h-5" />}
                      />
                  ))}
                  
                  <NavLink
                      key="seva"
                      onClick={() => {
                          onSevaClick();
                          setIsOpen(false);
                      }}
                      isActive={false}
                      label={t.navSeva}
                      icon={<Icon name="heart-hand" className="w-5 h-5" />}
                  />
                </div>

                {currentUser?.role === 'admin' && (
                    <>
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C3A150]/30 to-transparent my-4" />
                      <NavLink
                          onClick={() => handleLinkClick('dashboard')}
                          isActive={currentView === 'dashboard'}
                          label={t.navDashboard}
                          icon={<Icon name="clipboard-list" className="w-5 h-5" />}
                      />
                    </>
                )}
            </nav>

            {/* Bottom Profile / Settings */}
            <div className="mt-auto flex-shrink-0 space-y-4 pt-6 border-t border-[#C3A150]/20">
                <div className="flex items-center justify-between">
                    <LanguageSwitcher currentLang={currentLang} setLang={setLang} />
                    {currentUser && <NotificationBell />}
                </div>

                {currentUser ? (
                    <div className="space-y-3">
                        <button
                            onClick={() => handleLinkClick('settings')}
                            className={`w-full flex items-center gap-3 text-left p-2.5 rounded-xl border border-transparent transition-all ${
                              currentView === 'settings' 
                                ? 'bg-white border-[#C3A150]/35 shadow-sm' 
                                : 'hover:bg-white/50'
                            }`}
                        >
                            <img
                                src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`}
                                alt="Profile"
                                className="w-9 h-9 rounded-full border border-[#C3A150] object-cover"
                            />
                            <div className="overflow-hidden flex-grow">
                                <p className="font-serif font-bold text-xs text-stone-800 truncate">{currentUser.name}</p>
                                <div className="flex items-center gap-1.5 text-[9px] text-stone-500 mt-0.5">
                                    <span className="flex items-center gap-0.5"><Icon name="sun" className="w-2.5 h-2.5 text-amber-500" /> {punya}</span>
                                    <span>•</span>
                                    <span>Daily Sadhak</span>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-serif text-xs py-2 rounded-xl transition-all border border-stone-200/50"
                        >
                            {t.logout}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        <button 
                          onClick={() => { onLoginClick(); setIsOpen(false); }} 
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-serif font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                        >
                            {t.login}
                        </button>
                        <button 
                          onClick={() => { onLoginClick(); setIsOpen(false); }} 
                          className="w-full py-2.5 bg-white border border-stone-200 text-stone-700 font-serif font-bold text-xs rounded-xl transition-all hover:bg-stone-50 hover:scale-[1.02]"
                        >
                            {t.signup}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};
export default Sidebar;

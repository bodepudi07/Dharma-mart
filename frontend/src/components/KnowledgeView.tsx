import React, { useState, useEffect, useMemo } from 'react';
import { I18nContent, Book, Language } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { SLOKA_DATA } from '../constants';

const scriptureCategories = [
    { key: 'categoryVeda', tag: 'veda', emoji: '🕉️', gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.15)', accent: 'text-amber-400', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-500/20', iconBg: 'from-amber-400 to-orange-600' },
    { key: 'categoryGita', tag: 'gita', emoji: '📖', gradient: 'from-sky-400 to-blue-600', glow: 'rgba(56,189,248,0.15)', accent: 'text-sky-400', accentBg: 'bg-sky-500/10', accentBorder: 'border-sky-500/20', iconBg: 'from-sky-400 to-blue-600' },
    { key: 'categoryUpanishad', tag: 'upanishad', emoji: '✨', gradient: 'from-violet-400 to-purple-600', glow: 'rgba(167,139,250,0.15)', accent: 'text-violet-400', accentBg: 'bg-violet-500/10', accentBorder: 'border-violet-500/20', iconBg: 'from-violet-400 to-purple-600' },
    { key: 'categoryPurana', tag: 'purana', emoji: '📜', gradient: 'from-emerald-400 to-teal-600', glow: 'rgba(52,211,153,0.15)', accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', accentBorder: 'border-emerald-500/20', iconBg: 'from-emerald-400 to-teal-600' },
    { key: 'categoryItihasa', tag: 'itihasa', emoji: '⚔️', gradient: 'from-rose-400 to-red-600', glow: 'rgba(251,113,133,0.15)', accent: 'text-rose-400', accentBg: 'bg-rose-500/10', accentBorder: 'border-rose-500/20', iconBg: 'from-rose-400 to-red-600' },
    { key: 'categorySmriti', tag: 'smriti', emoji: '⚖️', gradient: 'from-cyan-400 to-teal-600', glow: 'rgba(34,211,238,0.15)', accent: 'text-cyan-400', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-500/20', iconBg: 'from-cyan-400 to-teal-600' },
    { key: 'categoryDarsana', tag: 'darsana', emoji: '🧘', gradient: 'from-indigo-400 to-blue-700', glow: 'rgba(129,140,248,0.15)', accent: 'text-indigo-400', accentBg: 'bg-indigo-500/10', accentBorder: 'border-indigo-500/20', iconBg: 'from-indigo-400 to-blue-700' },
    { key: 'categoryAgama', tag: 'agama', emoji: '🔱', gradient: 'from-fuchsia-400 to-pink-600', glow: 'rgba(232,121,249,0.15)', accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/10', accentBorder: 'border-fuchsia-500/20', iconBg: 'from-fuchsia-400 to-pink-600' },
    { key: 'categoryOtherSastra', tag: 'other', emoji: '📚', gradient: 'from-slate-400 to-zinc-600', glow: 'rgba(148,163,184,0.15)', accent: 'text-slate-300', accentBg: 'bg-slate-500/10', accentBorder: 'border-slate-500/20', iconBg: 'from-slate-400 to-zinc-600' },
    { key: 'categoryGuru', tag: 'guru', emoji: '🙏', gradient: 'from-yellow-400 to-amber-600', glow: 'rgba(250,204,21,0.15)', accent: 'text-yellow-400', accentBg: 'bg-yellow-500/10', accentBorder: 'border-yellow-500/20', iconBg: 'from-yellow-400 to-amber-600' },
    { key: 'categoryAncientScience', tag: 'ancient_science', emoji: '🔬', gradient: 'from-lime-400 to-green-600', glow: 'rgba(163,230,53,0.15)', accent: 'text-lime-400', accentBg: 'bg-lime-500/10', accentBorder: 'border-lime-500/20', iconBg: 'from-lime-400 to-green-600' },
    { key: 'categoryAnimatedVideos', tag: 'animated_video', emoji: '🎬', gradient: 'from-orange-400 to-red-500', glow: 'rgba(251,146,60,0.15)', accent: 'text-orange-400', accentBg: 'bg-orange-500/10', accentBorder: 'border-orange-500/20', iconBg: 'from-orange-400 to-red-500' }
];

const bookToCategory = (book: Book): string => {
    const tags = book.tags || [];
    for (const category of scriptureCategories) {
        if (tags.includes(category.tag)) {
            return category.tag;
        }
    }
    return 'other';
};

export const KnowledgeView = ({ t, language }: { t: I18nContent, language: Language }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const { addToast } = useToast();

    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

    useEffect(() => {
        api.getBooks(language).then(setBooks).catch(() => addToast("Failed to load scriptures.", 'error')).finally(() => setIsLoading(false));
    }, [addToast, language]);

    const categorizedBooks = useMemo(() => {
        const categories: Record<string, Book[]> = {};
        scriptureCategories.forEach(c => categories[c.tag] = []);

        const filtered = books.filter(book => {
            const matchesSearch = !searchQuery || book.name.toLowerCase().includes(searchQuery.toLowerCase()) || book.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = !activeFilter || bookToCategory(book) === activeFilter;
            return matchesSearch && matchesFilter;
        });

        filtered.forEach(book => {
            const category = bookToCategory(book);
            if (categories[category]) {
                categories[category].push(book);
            }
        });
        for (const key in categories) {
            categories[key].sort((a, b) => a.name.localeCompare(b.name));
        }
        return categories;
    }, [books, searchQuery, activeFilter]);

    const dailySloka = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const slokaList = SLOKA_DATA[language] || SLOKA_DATA[Language.EN];
        return slokaList[dayOfYear % slokaList.length];
    }, [language]);

    const navigateTo = (path: string) => { window.location.hash = path; };

    const handleExplainCategory = async (e: React.MouseEvent, categoryTag: string, categoryName: string) => {
        e.stopPropagation();
        if (explanations[categoryTag]) return;

        setLoadingExplanation(categoryTag);
        try {
            const result = await api.explainScripture(`the ${categoryName}`);
            setExplanations(prev => ({ ...prev, [categoryTag]: result }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to get explanation.";
            addToast(message, 'error');
            setExplanations(prev => ({ ...prev, [categoryTag]: "Sorry, the Guru could not provide an explanation at this time." }));
        } finally {
            setLoadingExplanation(null);
        }
    };

    return (
        <div className="knowledge-hub-container min-h-full p-4 sm:p-8 animate-fade-in bg-[#080a14] text-white relative overflow-hidden">
            {/* Ethereal Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-amber-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
                <div className="absolute bottom-[20%] left-[15%] w-[20%] h-[20%] bg-rose-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            <header className="text-center mb-12 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Icon name="cosmic-logo" className="w-10 h-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">The Akashic Records</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-xl mb-4">
                    {t.knowledgeHubTitle}
                </h1>

                {/* Search & Filter Bar */}
                <div className="max-w-2xl mx-auto mt-6 space-y-4">
                    <div className="relative">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search scriptures by name..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setActiveFilter(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!activeFilter ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                        >
                            All
                        </button>
                        {scriptureCategories.map(cat => (
                            <button
                                key={cat.tag}
                                onClick={() => setActiveFilter(activeFilter === cat.tag ? null : cat.tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === cat.tag ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg` : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                            >
                                <span>{cat.emoji}</span>
                                {(t[cat.key as keyof I18nContent] as string) || cat.tag}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Daily Wisdom Altar */}
            <section className="mb-16 relative z-10 box-border px-4">
                <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-amber-500/30 via-rose-400/40 to-violet-500/30 rounded-[2.5rem]">
                    <div className="bg-[#0e1225]/95 backdrop-blur-xl p-8 md:p-12 rounded-[2.4rem] relative overflow-hidden border border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-rose-500/3 to-violet-500/5 pointer-events-none"></div>
                        <Icon name="om" className="absolute -top-10 -right-10 w-48 h-48 text-amber-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Icon name="lotus" className="w-8 h-8 text-amber-400 animate-pulse" />
                            </div>
                            <h2 className="text-amber-400 font-bold tracking-widest uppercase text-sm">{t.dailyWisdom}</h2>
                            <p className="text-2xl md:text-3xl font-serif italic text-amber-50/90 leading-relaxed max-w-2xl drop-shadow-md">
                                "{dailySloka.meaning}"
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500/40"></div>
                                <span className="text-xs text-amber-400/60 font-bold tracking-tighter">— Sacred Verses —</span>
                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500/40"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Knowledge Grid */}
            <main className="max-w-7xl mx-auto relative z-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Icon name="lotus" className="w-16 h-16 text-amber-400 animate-spin" />
                        <p className="text-amber-200/50 animate-pulse font-serif italic">Unrolling the celestial scrolls...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {scriptureCategories.map((category) => {
                            const booksInCategory = categorizedBooks[category.tag];
                            if (!booksInCategory || booksInCategory.length === 0) return null;

                            return (
                                <div
                                    key={category.key}
                                    className="group relative bg-white/[0.03] border border-white/10 p-6 rounded-3xl hover:border-opacity-40 transition-all duration-500 flex flex-col h-full overflow-hidden"
                                    style={{ boxShadow: `0 0 40px ${category.glow}` }}
                                >
                                    {/* Category glow effect */}
                                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 bg-gradient-to-br ${category.gradient}`} />

                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.iconBg} flex items-center justify-center shadow-lg`}>
                                            <span className="text-xl">{category.emoji}</span>
                                        </div>
                                        <span className={`text-xs font-bold ${category.accent} opacity-60`}>{booksInCategory.length} texts</span>
                                    </div>

                                    <h3 className={`text-2xl font-bold font-heading mb-4 ${category.accent}`}>{t[category.key as keyof I18nContent]}</h3>

                                    <div className="space-y-3 flex-grow mb-6">
                                        {booksInCategory.slice(0, 4).map(book => (
                                            <button
                                                key={book.id}
                                                onClick={() => book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable, 'info')}
                                                className={`w-full text-left p-3 rounded-xl bg-white/5 hover:${category.accentBg} border border-white/5 flex items-center justify-between group/book transition-all`}
                                            >
                                                <span className="text-sm font-medium text-blue-100 group-hover/book:text-white">{book.name}</span>
                                                <Icon name="chevron-left" className={`w-4 h-4 transform rotate-180 opacity-40 group-hover/book:opacity-100 ${category.accent}`} />
                                            </button>
                                        ))}
                                        {booksInCategory.length > 4 && (
                                            <p className={`text-xs text-center ${category.accent} opacity-50 pt-2`}>+ {booksInCategory.length - 4} more scriptures</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handleExplainCategory(e, category.tag, t[category.key as keyof I18nContent] || category.tag)}
                                        disabled={loadingExplanation === category.tag}
                                        className={`w-full py-3 rounded-2xl ${category.accentBg} border ${category.accentBorder} ${category.accent} font-bold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-all disabled:opacity-50`}
                                    >
                                        {loadingExplanation === category.tag ? (
                                            <Icon name="lotus" className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Icon name="cosmic-logo" className="w-4 h-4" />
                                        )}
                                        Scholarly Overview
                                    </button>

                                    {explanations[category.tag] && (
                                        <div className={`mt-4 p-4 rounded-xl ${category.accentBg} border ${category.accentBorder} text-xs text-white/70 italic animate-fade-in line-clamp-3 hover:line-clamp-none transition-all`}>
                                            {explanations[category.tag]}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Curated Reading Paths */}
            <section className="max-w-7xl mx-auto mt-20 pt-20 border-t border-white/10 relative z-10">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-amber-200 via-rose-300 to-violet-300 bg-clip-text text-transparent">Suggested Reading Paths</h2>
                    <p className="text-stone-400">Curated sequences based on tradition and difficulty.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: "Begin with the Gita", desc: "Start with the Bhagavad Gita for foundational spiritual philosophy.", books: books.filter(b => b.tags?.includes('gita')).slice(0, 3), gradient: 'from-sky-500/20 to-blue-600/5', border: 'border-sky-500/20', accent: 'text-sky-300' },
                            { title: "Explore the Epics", desc: "The Ramayana and Mahabharata — India's great narrative wisdom.", books: books.filter(b => b.tags?.includes('itihasa')).slice(0, 3), gradient: 'from-rose-500/20 to-red-600/5', border: 'border-rose-500/20', accent: 'text-rose-300' },
                            { title: "Vedic Hymns", desc: "The oldest spiritual texts — hymns, rituals, and cosmic knowledge.", books: books.filter(b => b.tags?.includes('veda')).slice(0, 3), gradient: 'from-amber-500/20 to-orange-600/5', border: 'border-amber-500/20', accent: 'text-amber-300' },
                            { title: "Guru Teachings", desc: "Wisdom from great spiritual masters across different paths and traditions.", books: books.filter(b => b.tags?.includes('guru')).slice(0, 3), gradient: 'from-yellow-500/20 to-amber-600/5', border: 'border-yellow-500/20', accent: 'text-yellow-300' },
                            { title: "Ancient Science", desc: "Discover how ancient Indian knowledge anticipated modern scientific discoveries.", books: books.filter(b => b.tags?.includes('ancient_science')).slice(0, 3), gradient: 'from-lime-500/20 to-green-600/5', border: 'border-lime-500/20', accent: 'text-lime-300' },
                        ].map((path, i) => (
                            <div key={i} className={`p-5 rounded-2xl border ${path.border} bg-gradient-to-br ${path.gradient} space-y-3 hover:scale-[1.02] transition-transform duration-300`}>
                                <h4 className={`font-bold text-lg ${path.accent}`}>{path.title}</h4>
                                <p className="text-xs text-white/40">{path.desc}</p>
                                <div className="space-y-2 pt-2">
                                    {path.books.map(book => (
                                        <button
                                            key={book.id}
                                            onClick={() => book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable, 'info')}
                                            className={`w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-blue-100 flex items-center justify-between transition-all`}
                                        >
                                            <span>{book.name}</span>
                                            <Icon name="chevron-left" className="w-3 h-3 transform rotate-180 text-white/30" />
                                        </button>
                                    ))}
                                    {path.books.length === 0 && <p className="text-xs text-white/20 italic">No books in this path yet.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { I18nContent, Book, Language } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';
import { SLOKA_DATA } from '../constants';
import { useModal } from '../contexts/ModalContext';

const scriptureCategories = [
    { key: 'categoryVeda', tag: 'veda' },
    { key: 'categoryGita', tag: 'gita' },
    { key: 'categoryUpanishad', tag: 'upanishad' },
    { key: 'categoryPurana', tag: 'purana' },
    { key: 'categoryItihasa', tag: 'itihasa' },
    { key: 'categorySmriti', tag: 'smriti' },
    { key: 'categoryDarsana', tag: 'darsana' },
    { key: 'categoryAgama', tag: 'agama' },
    { key: 'categoryOtherSastra', tag: 'other' }
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
    const [isPremium, setIsPremium] = useState(false); // Mock premium state
    const { addToast } = useToast();
    const { openModal } = useModal();

    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

    useEffect(() => {
        api.getBooks(language).then(setBooks).catch(() => addToast("Failed to load scriptures.", 'error')).finally(() => setIsLoading(false));
    }, [addToast, language]);

    const categorizedBooks = useMemo(() => {
        const categories: Record<string, Book[]> = {};
        scriptureCategories.forEach(c => categories[c.tag] = []);

        books.forEach(book => {
            const category = bookToCategory(book);
            if (categories[category]) {
                categories[category].push(book);
            }
        });
        for (const key in categories) {
            categories[key].sort((a, b) => a.name.localeCompare(b.name));
        }
        return categories;
    }, [books]);

    const dailySloka = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const slokaList = SLOKA_DATA[language] || SLOKA_DATA[Language.EN];
        return slokaList[dayOfYear % slokaList.length];
    }, [language]);

    const navigateTo = (path: string) => { window.location.hash = path; };

    const handleAskGuru = (e: React.MouseEvent, book: Book) => {
        e.stopPropagation();
        if (!isPremium && book.tags?.includes('veda')) {
            addToast("Deep Guru Analysis is a Gyan Prime feature.", 'info');
            return;
        }
        openModal('aiGuruChat', { book });
    };

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

    const handlePremiumAction = () => {
        addToast("Subscribing to Gyan Prime... (Mock)", 'success');
        setTimeout(() => setIsPremium(true), 1500);
    };

    return (
        <div className="knowledge-hub-container min-h-full p-4 sm:p-8 animate-fade-in bg-[#0d0f1a] text-white relative overflow-hidden">
            {/* Ethereal Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="text-center mb-12 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Icon name="cosmic-logo" className="w-10 h-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">The Akashic Records</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-xl mb-4">
                    {t.knowledgeHubTitle}
                </h1>
                {!isPremium ? (
                    <button
                        onClick={handlePremiumAction}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full text-sm font-bold shadow-lg shadow-amber-600/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto text-white"
                    >
                        <Icon name="star" className="w-4 h-4" />
                        Unlock Gyan Prime
                    </button>
                ) : (
                    <div className="mt-4 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 inline-flex items-center gap-2">
                        <Icon name="check-circle" className="w-4 h-4" />
                        Gyan Prime Active
                    </div>
                )}
            </header>

            {/* Daily Wisdom Altar */}
            <section className="mb-16 relative z-10 box-border px-4">
                <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-amber-500/20 via-amber-400/50 to-amber-500/20 rounded-[2.5rem]">
                    <div className="bg-[#161b33]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2.4rem] relative overflow-hidden border border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
                        <Icon name="om" className="absolute -top-10 -right-10 w-48 h-48 text-amber-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Icon name="lotus" className="w-8 h-8 text-amber-400 animate-pulse" />
                            </div>
                            <h2 className="text-amber-400 font-bold tracking-widest uppercase text-sm">{t.dailyWisdom}</h2>
                            <p className="text-2xl md:text-3xl font-serif italic text-blue-100 leading-relaxed max-w-2xl drop-shadow-md">
                                "{dailySloka.meaning}"
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="h-[1px] w-12 bg-amber-500/30"></div>
                                <span className="text-xs text-amber-500/60 font-bold tracking-tighter">— Sacred Verses —</span>
                                <div className="h-[1px] w-12 bg-amber-500/30"></div>
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
                            const isLocked = !isPremium && ['veda', 'upanishad'].includes(category.tag);

                            return (
                                <div
                                    key={category.key}
                                    className="group relative bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-500 flex flex-col h-full overflow-hidden"
                                >
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-[#0d0f1a]/80 backdrop-blur-md z-20 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
                                            <Icon name="lock" className="w-10 h-10 text-amber-400 mb-3" />
                                            <h4 className="text-lg font-bold text-amber-100 mb-1">Advanced Wisdom</h4>
                                            <p className="text-xs text-amber-200/60 mb-4">Requires Gyan Prime for deep structural analysis</p>
                                            <button
                                                onClick={handlePremiumAction}
                                                className="px-4 py-1.5 bg-amber-600/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-full hover:bg-amber-600/40 transition-colors"
                                            >
                                                Unlock Tier
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
                                            <Icon name="om" className="w-7 h-7 text-white" />
                                        </div>
                                        <Icon name="cosmic-logo" className="w-5 h-5 text-amber-400/30 group-hover:text-amber-400/100 transition-colors" />
                                    </div>

                                    <h3 className="text-2xl font-bold font-heading mb-4 text-amber-100">{t[category.key as keyof I18nContent]}</h3>

                                    <div className="space-y-3 flex-grow mb-6">
                                        {booksInCategory.slice(0, 4).map(book => (
                                            <button
                                                key={book.id}
                                                onClick={() => book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable, 'info')}
                                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/5 flex items-center justify-between group/book transition-all"
                                            >
                                                <span className="text-sm font-medium text-blue-100 group-hover/book:text-white">{book.name}</span>
                                                <Icon name="chevron-left" className="w-4 h-4 transform rotate-180 text-amber-500/40 group-hover/book:text-amber-400" />
                                            </button>
                                        ))}
                                        {booksInCategory.length > 4 && (
                                            <p className="text-xs text-center text-amber-500/60 pt-2">+ {booksInCategory.length - 4} more scriptures</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handleExplainCategory(e, category.tag, t[category.key as keyof I18nContent] || category.tag)}
                                        disabled={loadingExplanation === category.tag}
                                        className="w-full py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                    >
                                        {loadingExplanation === category.tag ? (
                                            <Icon name="lotus" className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Icon name="cosmic-logo" className="w-4 h-4" />
                                        )}
                                        Scholarly Overview
                                    </button>

                                    {explanations[category.tag] && (
                                        <div className="mt-4 p-4 rounded-xl bg-amber-900/20 border border-amber-500/20 text-xs text-amber-200/80 italic animate-fade-in line-clamp-3 hover:line-clamp-none transition-all">
                                            {explanations[category.tag]}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Premium Sections */}
            <section className="max-w-7xl mx-auto mt-20 pt-20 border-t border-white/10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Curated Paths */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold font-heading text-amber-200">Curated Philosophical Paths</h2>
                        <div className="space-y-4">
                            {[
                                { title: "Dharma of the Soul", time: "12 Lessons", level: "Beginner", premium: false },
                                { title: "Secrets of Karma Yoga", time: "8 Lessons", level: "Intermediate", premium: false },
                                { title: "Advaita Vedanta Masterclass", time: "24 Lessons", level: "Prime Only", premium: true }
                            ].map((path, i) => (
                                <div
                                    key={i}
                                    onClick={() => path.premium && !isPremium ? handlePremiumAction() : addToast("Path Loaded", "success")}
                                    className={`p-5 rounded-2xl border ${path.premium && !isPremium ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/5'} flex justify-between items-center group cursor-pointer hover:border-amber-400/50 transition-all`}
                                >
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">{path.title}</h4>
                                        <div className="flex gap-4 text-xs text-white/40">
                                            <span>{path.time}</span>
                                            <span className={path.premium && !isPremium ? 'text-amber-400 font-bold' : ''}>{path.level}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-amber-400/20 transition-all">
                                        <Icon name={path.premium && !isPremium ? "lock" : "chevron-left"} className={`w-5 h-5 ${path.premium && !isPremium ? 'text-amber-500' : 'text-white/20 transform rotate-180'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audio Library */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold font-heading text-amber-200">Sacred Recitations</h2>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded-full tracking-widest border border-amber-500/30">Prime Feature</span>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#1a1c2e] to-[#0d0f1a] border border-amber-500/20 flex flex-col items-center text-center space-y-6 opacity-80 filter grayscale-[0.5]">
                            <Icon name="volume-on" className="w-16 h-16 text-amber-400/40" />
                            <p className="text-lg text-amber-100/60 font-serif italic">Unlock authentic Chants from the high priests of the Kashi Vishwanath temple.</p>
                            <button
                                onClick={handlePremiumAction}
                                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-amber-400 hover:bg-white/10 transition-all"
                            >
                                {isPremium ? "Enter Library" : "Get Prime Access"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

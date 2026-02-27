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
    const [openAccordion, setOpenAccordion] = useState<string | null>('veda');
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
        // Sort books within each category alphabetically
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
        openModal('aiGuruChat', { book });
    };

    const handleExplainCategory = async (e: React.MouseEvent, categoryTag: string, categoryName: string) => {
        e.stopPropagation();

        if (explanations[categoryTag]) {
            setOpenAccordion(categoryTag);
            return;
        }

        setLoadingExplanation(categoryTag);
        setOpenAccordion(categoryTag);

        try {
            const result = await api.explainScripture(`the ${categoryName}`);
            setExplanations(prev => ({ ...prev, [categoryTag]: result }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to get explanation.";
            addToast(message, 'error');
            setExplanations(prev => ({ ...prev, [categoryTag]: "Sorry, the Guru could not provide an explanation at this time. Please try again later." }));
        } finally {
            setLoadingExplanation(null);
        }
    };

    return (
        <div className="knowledge-hub-container min-h-full p-4 sm:p-8 animate-fade-in">
            <header className="text-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
                <h1 className="text-4xl md:text-5xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm">{t.knowledgeHubTitle}</h1>
            </header>

            <section className="mb-12 animate-float">
                <div className="daily-wisdom-card max-w-3xl mx-auto p-6 rounded-2xl shadow-xl border border-primary/20 bg-gradient-to-b from-white/80 to-amber-50/50 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <Icon name="om" className="absolute -top-4 -right-4 w-24 h-24 text-primary/5 -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" />

                    <h2 className="font-bold text-center text-xl text-primary mb-4 flex items-center justify-center gap-2">
                        <Icon name="meditate" className="w-6 h-6" />
                        {t.dailyWisdom}
                    </h2>
                    <p className="text-center text-lg md:text-xl italic text-ink/80 leading-relaxed max-w-2xl mx-auto font-serif relative z-10">"{dailySloka.meaning}"</p>
                </div>
            </section>

            <main className="max-w-3xl mx-auto space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Icon name="lotus" className="w-12 h-12 text-primary animate-spin" /></div>
                ) : (
                    scriptureCategories.map((category, index) => {
                        const booksInCategory = categorizedBooks[category.tag];
                        if (!booksInCategory || booksInCategory.length === 0) return null;
                        const isOpen = openAccordion === category.tag;
                        return (
                            <div
                                key={category.key}
                                className={`accordion-item rounded-xl shadow-md border hover:border-primary/30 transition-all duration-300 overflow-hidden bg-white/60 backdrop-blur-sm ${isOpen ? 'open shadow-xl border-primary/50' : 'border-stone-200'}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <header className="accordion-header flex items-center p-4" onClick={() => setOpenAccordion(isOpen ? null : category.tag)}>
                                    <div className="mandala-icon w-12 h-12 rounded-full flex items-center justify-center mr-4">
                                        <Icon name="om" className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading flex-grow text-text-base">{t[category.key as keyof I18nContent]}</h3>
                                    <button
                                        onClick={(e) => handleExplainCategory(e, category.tag, t[category.key as keyof I18nContent])}
                                        className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors ml-4 z-10 flex-shrink-0"
                                        title={`Explain ${t[category.key as keyof I18nContent]} with AI`}
                                        disabled={loadingExplanation === category.tag}
                                    >
                                        {loadingExplanation === category.tag
                                            ? <Icon name="lotus" className="w-5 h-5 animate-spin" />
                                            : <Icon name="cosmic-logo" className="w-5 h-5" />
                                        }
                                    </button>
                                    <Icon name="chevron-left" className="w-6 h-6 chevron-icon transform -rotate-90 text-primary ml-2 flex-shrink-0" />
                                </header>
                                <div className="accordion-content">
                                    <div>
                                        {(explanations[category.tag] || loadingExplanation === category.tag) && (
                                            <div className="p-4 mb-4 bg-amber-100/50 border-l-4 border-primary rounded-r-lg animate-fade-in">
                                                {loadingExplanation === category.tag ? (
                                                    <div className="flex items-center gap-2 text-text-muted">
                                                        <Icon name="lotus" className="w-5 h-5 animate-spin" />
                                                        <span>{t.guruThinking}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-text-base italic whitespace-pre-wrap">{explanations[category.tag]}</p>
                                                )}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {booksInCategory.map(book => (
                                                <div
                                                    key={book.id}
                                                    className="book-entry-card p-3 rounded-lg hover:text-primary transition-colors flex justify-between items-center"
                                                >
                                                    <button
                                                        onClick={() => book.contentKey ? navigateTo(`/bookReader/${book.contentKey}`) : addToast(t.bookNotAvailable, 'info')}
                                                        className="text-left flex-grow"
                                                    >
                                                        <p className="font-bold">{book.name}</p>
                                                        <p className="text-sm text-text-muted">Tap to Explore &rarr;</p>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleAskGuru(e, book)}
                                                        className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors ml-2 flex-shrink-0"
                                                        title={`Ask Guru about ${book.name}`}
                                                    >
                                                        <Icon name="cosmic-logo" className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </main>
        </div>
    );
};

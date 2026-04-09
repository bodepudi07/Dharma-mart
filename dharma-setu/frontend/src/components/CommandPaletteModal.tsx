import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import * as api from '../services/apiService';
import { SearchResults, Language } from '../types';

interface CommandPaletteModalProps {
    onClose: () => void;
    language: Language;
}

export const CommandPaletteModal = ({ onClose, language }: CommandPaletteModalProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Focus the input immediately
        if (inputRef.current) {
            inputRef.current.focus();
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            setIsLoading(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Empty filters array for command palette search
                const res = await api.searchAll(query, language, { crowd: [], deity: [], distance: 0 }, null);
                setResults(res);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query, language]);

    const navigateTo = (path: string) => {
        window.location.hash = path;
        onClose();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigateTo(`search/${query.trim()}`);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] overflow-y-auto w-full h-full p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="w-full max-w-2xl bg-white/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center px-4 border-b border-stone-200/50">
                    <Icon name="search" className="w-6 h-6 text-primary" />
                    <form onSubmit={handleFormSubmit} className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none py-5 px-4 text-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-0"
                            placeholder="Search Temples, Texts, Events... (Press Enter to view all)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </form>
                    <div className="flex items-center gap-2">
                        {isLoading && <Icon name="lotus" className="w-5 h-5 text-primary animate-spin" />}
                        <button onClick={onClose} className="px-2 py-1 bg-stone-100 rounded text-xs font-medium text-stone-500 hover:bg-stone-200">ESC</button>
                    </div>
                </div>

                {query && (
                    <div className="max-h-[50vh] overflow-y-auto bg-stone-50/50 p-2 scrollbar-thin">
                        {!isLoading && results && results.temples.length === 0 && results.books.length === 0 && results.events.length === 0 ? (
                            <div className="p-8 text-center text-stone-500">
                                <p>No results found for "{query}".</p>
                                <p className="text-sm mt-1">Press Enter to do a full search.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 p-2">
                                {results?.temples.length ? (
                                    <div>
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-3">Temples & Spaces</h3>
                                        <div className="space-y-1">
                                            {results.temples.slice(0, 4).map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => navigateTo(`templeDetail/${t.id}`)}
                                                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-white rounded-xl transition-colors text-left group border border-transparent hover:border-stone-200 hover:shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-stone-800 group-hover:text-primary transition-colors line-clamp-1">{t.name}</p>
                                                            <p className="text-xs text-stone-500 line-clamp-1">{t.location}</p>
                                                        </div>
                                                    </div>
                                                    <Icon name="chevron-right" className="w-4 h-4 text-stone-300 group-hover:text-primary" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {results?.books.length ? (
                                    <div>
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-3 mt-4">Knowledge Hub</h3>
                                        <div className="space-y-1">
                                            {results.books.slice(0, 3).map(b => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => navigateTo(`bookReader/${b.contentKey}`)}
                                                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-white rounded-xl transition-colors text-left group border border-transparent hover:border-stone-200 hover:shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-amber-50 text-amber-600">
                                                            <Icon name="book-open" className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-stone-800 group-hover:text-amber-600 transition-colors line-clamp-1">{b.name}</p>
                                                        </div>
                                                    </div>
                                                    <Icon name="chevron-right" className="w-4 h-4 text-stone-300 group-hover:text-amber-600" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}

                {query && results && (
                    <div className="border-t border-stone-200/50 p-2 bg-stone-100/50">
                        <button
                            onClick={(e) => handleFormSubmit(e as any)}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-primary font-medium bg-white hover:bg-primary/5 rounded-xl border border-primary/20 transition-all text-sm"
                        >
                            <Icon name="search" className="w-4 h-4" />
                            See all results for "{query}"
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { Book, I18nContent, BookContent, BookVerse, Language } from '../types';
import * as api from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { Icon } from './Icon';

interface BookReaderProps {
    bookId: string;
    t: I18nContent;
    language: Language;
}

type Tab = 'sanskrit' | 'english';

export const BookReader = ({ bookId, t, language }: BookReaderProps) => {
    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<BookContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('sanskrit');
    const [activeChapter, setActiveChapter] = useState<number | null>(null);
    const chapterRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const { addToast } = useToast();

    useEffect(() => {
        let isCancelled = false;

        const loadContent = async () => {
            if (!bookId) {
                if (!isCancelled) setError("No book specified.");
                if (!isCancelled) setIsLoading(false);
                return;
            }
            if (!isCancelled) setIsLoading(true);
            if (!isCancelled) setError(null);

            try {
                const bookMeta = await api.getBookByContentKey(bookId, language);
                if (isCancelled) return;

                if (!bookMeta) {
                    throw new Error("Book metadata not found.");
                }
                setBook(bookMeta);

                if (!bookMeta.contentKey) {
                    throw new Error("This book does not have readable content.");
                }

                const bookContent = await api.getBookContent(bookMeta.contentKey);
                if (isCancelled) return;

                setContent(bookContent);
            } catch (err) {
                if (isCancelled) return;
                const msg = err instanceof Error ? err.message : "Failed to load book content.";
                setError(msg);
                addToast(msg, 'error');
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadContent();

        return () => {
            isCancelled = true;
        };
    }, [bookId, addToast, language]);

    const onBack = () => window.history.back();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0d0f1a] flex flex-col items-center justify-center gap-4">
                <Icon name="lotus" className="w-16 h-16 text-amber-500 animate-spin" />
                <div className="text-amber-200 font-serif italic animate-pulse">Unrolling sacred scrolls...</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <Icon name="alert-circle" className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Scripture Not Found</h2>
                        <p className="text-stone-400 text-sm leading-relaxed">{error || 'This scripture could not be loaded. It may not have content available yet.'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                            Go Back
                        </button>
                        <button onClick={() => window.location.hash = '/knowledge'} className="flex-1 py-3 rounded-2xl font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all">
                            Browse Library
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderVerse = (verse: BookVerse) => (
        <div key={verse.verse} className="py-6 border-b border-white/5 group/verse">
            <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-amber-500/60 group-hover/verse:text-amber-400 group-hover/verse:border-amber-500/30 transition-all">
                    {verse.verse}
                </span>
                <div className="flex-grow">
                    <p className={`leading-relaxed ${activeTab === 'sanskrit'
                        ? 'font-noto-serif text-2xl text-amber-100 drop-shadow-[0_2px_10px_rgba(251,191,36,0.1)]'
                        : 'text-lg text-blue-100/90 italic font-light'}`}>
                        {activeTab === 'sanskrit' ? verse.sanskrit : verse.translation}
                    </p>
                </div>
            </div>
        </div>
    );

    const scrollToChapter = (chapterNum: number) => {
        setActiveChapter(chapterNum);
        chapterRefs.current[chapterNum]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderChapterContent = () => {
        if (!content || !content.chapters || content.chapters.length === 0) {
            return (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Icon name="book-open" className="w-12 h-12 text-stone-700 mx-auto mb-4" />
                    <div className="text-stone-500 italic">This scripture's verses are currently being verified by the scholars...</div>
                </div>
            );
        }

        const chapters = content.chapters;

        return (
            <div>
                {/* Chapter Navigation */}
                {chapters.length > 1 && (
                    <div className="mb-8 flex flex-wrap gap-2 justify-center">
                        {chapters.map((chapter: any) => (
                            <button
                                key={chapter.chapter}
                                onClick={() => scrollToChapter(chapter.chapter)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeChapter === chapter.chapter ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'}`}
                            >
                                Ch. {chapter.chapter}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-12">
                    {chapters.map((chapter: any) => (
                        <div key={chapter.chapter} ref={el => { chapterRefs.current[chapter.chapter] = el; }} className="animate-fade-in-up scroll-mt-20">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-amber-500/30"></div>
                                <h2 className="text-xl md:text-2xl font-bold text-amber-400 uppercase tracking-[0.2em] px-4 text-center">
                                    Chapter {chapter.chapter}: {chapter.title}
                                </h2>
                                <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-amber-500/30"></div>
                            </div>
                            <div className="bg-white/[0.02] rounded-[2rem] p-4 md:p-8 border border-white/5 shadow-inner">
                                {chapter.verses.map((verse: any) => renderVerse(verse))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0d0f1a] text-white pb-24 overflow-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-8">
                <div className="max-w-5xl mx-auto">
                    <button onClick={onBack} className="mb-8 group flex items-center text-stone-400 hover:text-amber-400 transition-colors font-bold tracking-widest uppercase text-xs">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-amber-500/20 transition-all">
                            <Icon name="chevron-left" className="h-4 w-4" />
                        </div>
                        Back to Library
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.2)] flex-shrink-0">
                            <Icon name="book-open" className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 mb-4 tracking-tight">
                                {book.name}
                            </h1>
                            <p className="text-stone-400 text-lg font-light leading-relaxed max-w-2xl">{book.description}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="mb-10 sticky top-4 z-30 flex justify-center">
                            <div className="flex items-center bg-[#161b33]/80 backdrop-blur-2xl rounded-full p-1.5 border border-white/10 shadow-2xl">
                                <button
                                    onClick={() => setActiveTab('sanskrit')}
                                    className={`py-2.5 px-8 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'sanskrit' ? 'bg-primary text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-stone-400 hover:text-white'}`}
                                >
                                    Sanskrit
                                </button>
                                <button
                                    onClick={() => setActiveTab('english')}
                                    className={`py-2.5 px-8 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'english' ? 'bg-primary text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-stone-400 hover:text-white'}`}
                                >
                                    Translation
                                </button>
                            </div>
                        </div>

                        <div className="animate-fade-in relative">
                            {renderChapterContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

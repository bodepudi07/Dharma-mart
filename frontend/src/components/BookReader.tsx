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

type Tab = 'sanskrit' | 'english' | 'both';

export const BookReader = ({ bookId, t, language }: BookReaderProps) => {
    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<BookContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('both');
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
            <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
                <Icon name="lotus" className="w-16 h-16 text-amber-600 animate-spin" />
                <div className="text-stone-600 font-serif italic animate-pulse">Unrolling sacred scrolls...</div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-stone-200 p-10 rounded-3xl text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <Icon name="alert-circle" className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-stone-800 mb-2">Scripture Not Found</h2>
                        <p className="text-stone-500 text-sm leading-relaxed">{error || 'This scripture could not be loaded.'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-bold bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 transition-all">
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
        <div key={verse.verse} className="py-8 border-b border-stone-200/60 relative group/verse last:border-0">
            <div className="flex items-start gap-6">
                
                {/* Traditional Sanskrit verse tag */}
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100/50 border border-amber-200 flex items-center justify-center text-xs font-mono font-bold text-amber-800 shadow-sm">
                    {verse.verse}
                </span>

                <div className="flex-grow space-y-4">
                  {(activeTab === 'sanskrit' || activeTab === 'both') && (
                    <p className="font-serif text-2xl md:text-3xl text-stone-800 leading-relaxed font-bold tracking-wide">
                      {verse.sanskrit}
                    </p>
                  )}

                  {(activeTab === 'english' || activeTab === 'both') && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono uppercase tracking-widest text-[#C3A150] font-bold">English Transliteration</p>
                      <p className="text-sm text-stone-500 italic font-light leading-relaxed">{verse.translation}</p>
                      
                      {(verse as any).meaning && (
                        <>
                          <p className="text-xs font-mono uppercase tracking-widest text-primary/70 font-bold mt-2">Meaning</p>
                          <p className="text-stone-600 text-sm leading-relaxed">{(verse as any).meaning}</p>
                        </>
                      )}
                    </div>
                  )}
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
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300/60 shadow-sm">
                    <Icon name="book-open" className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                    <div className="text-stone-500 italic">This scripture's verses are currently being verified by scholars...</div>
                </div>
            );
        }

        const chapters = content.chapters;

        return (
            <div className="space-y-12">
                {/* Chapter Selection Bar */}
                {chapters.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center pb-4 border-b border-stone-200/50">
                        {chapters.map((chapter: any) => (
                            <button
                                key={chapter.chapter}
                                onClick={() => scrollToChapter(chapter.chapter)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                  activeChapter === chapter.chapter 
                                    ? 'bg-amber-600 text-white shadow-md' 
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                Chapter {chapter.chapter}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-16">
                    {chapters.map((chapter: any) => (
                        <div 
                          key={chapter.chapter} 
                          ref={el => { chapterRefs.current[chapter.chapter] = el; }} 
                          className="animate-fade-in-up scroll-mt-24 space-y-6"
                        >
                            {/* Chapter Header Banner */}
                            <div className="flex items-center gap-4">
                                <div className="h-[1.5px] flex-grow bg-gradient-to-r from-transparent to-amber-500/20"></div>
                                <h2 className="text-lg md:text-xl font-serif font-bold text-copper uppercase tracking-[0.2em] px-4 text-center">
                                    Chapter {chapter.chapter}: {chapter.title}
                                </h2>
                                <div className="h-[1.5px] flex-grow bg-gradient-to-l from-transparent to-amber-500/20"></div>
                            </div>

                            {/* Ancient Palm-leaf Manuscript Canvas */}
                            <div className="relative bg-[#FAF6EE] border-2 border-[#C3A150]/20 rounded-[2rem] p-8 md:p-12 shadow-[0_15px_45px_rgba(27,24,18,0.06)] overflow-hidden">
                                
                                {/* Left Binding Hole Overlay */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-6 w-5 h-5 rounded-full bg-[#1b1812] border-4 border-[#C3A150] shadow-inner opacity-20 pointer-events-none" />
                                
                                {/* Right Binding Hole Overlay */}
                                <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-6 w-5 h-5 rounded-full bg-[#1b1812] border-4 border-[#C3A150] shadow-inner opacity-20 pointer-events-none" />

                                <div className="space-y-2 max-w-4xl mx-auto px-2 md:px-6">
                                    {chapter.verses.map((verse: any) => renderVerse(verse))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-24 overflow-hidden relative">
            
            {/* Soft decorative background pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-[0.4] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 pt-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* Back Button */}
                    <button 
                      onClick={onBack} 
                      className="group flex items-center text-stone-500 hover:text-primary transition-colors font-bold tracking-widest uppercase text-xs"
                    >
                        <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center mr-3 transition-all border border-stone-200">
                            <Icon name="chevron-left" className="h-4 w-4" />
                        </div>
                        Back to Library
                    </button>

                    {/* Book Header Card */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-[#FAF6EE]/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#C3A150]/20 shadow-sm">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_12px_24px_rgba(245,158,11,0.15)] flex-shrink-0">
                            <Icon name="book-open" className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-center md:text-left space-y-3">
                            <h1 className="text-3xl md:text-5xl font-bold font-serif text-copper tracking-tight">
                                {book.name}
                            </h1>
                            <p className="text-stone-500 text-sm md:text-base font-light leading-relaxed max-w-2xl">{book.description}</p>
                        </div>
                    </div>

                    {/* Reader Canvas & View Options Tab */}
                    <div className="space-y-8">
                        <div className="flex justify-center sticky top-4 z-30">
                            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full p-1 border border-stone-200 shadow-md">
                                <button
                                    onClick={() => setActiveTab('sanskrit')}
                                    className={`py-2 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                                      activeTab === 'sanskrit' 
                                        ? 'bg-amber-600 text-white shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Sanskrit
                                </button>
                                <button
                                    onClick={() => setActiveTab('english')}
                                    className={`py-2 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                                      activeTab === 'english' 
                                        ? 'bg-amber-600 text-white shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setActiveTab('both')}
                                    className={`py-2 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                                      activeTab === 'both' 
                                        ? 'bg-amber-600 text-white shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Parallel
                                </button>
                            </div>
                        </div>

                        <div className="animate-fade-in">
                            {renderChapterContent()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
export default BookReader;

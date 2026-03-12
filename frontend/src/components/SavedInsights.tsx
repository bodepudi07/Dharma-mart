import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/apiService';
import { Icon } from './Icon';
import { I18nContent } from '../types';

interface SavedInsightsProps {
    t: I18nContent;
}

export const SavedInsights = ({ t }: SavedInsightsProps) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser?.token) {
            api.getBookmarks(currentUser.id, currentUser.token)
                .then(setBookmarks)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [currentUser]);

    const handleDelete = async (id: number) => {
        if (!currentUser?.token) return;
        try {
            await api.deleteBookmark(id, currentUser.token);
            setBookmarks(prev => prev.filter(b => b.id !== id));
            addToast('Insight removed.', 'success');
        } catch (err) {
            addToast('Failed to remove insight.', 'error');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Copied to clipboard!', 'success');
    };

    if (!currentUser) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Icon name="lock" className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h2 className="text-2xl font-serif font-bold text-ink mb-2">Login Required</h2>
                <p className="text-stone-500">Please login to view your saved insights.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-2">Saved Insights</h1>
                    <p className="text-stone-500">Wisdom you've captured from the AI Guru.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <Icon name="heart-filled" className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">{bookmarks.length} Saved</span>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Icon name="lotus" className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : bookmarks.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200">
                    <Icon name="chat" className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-400">No insights saved yet.</h3>
                    <p className="text-stone-500 mb-6">Ask the AI Guru a question and tap the heart icon to save his wisdom.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {bookmarks.map((bookmark) => (
                            <motion.div
                                key={bookmark.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 relative group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs uppercase tracking-widest font-bold text-primary/60 bg-primary/5 px-2 py-1 rounded">
                                        {bookmark.context}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(bookmark.id)}
                                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-lg text-ink font-serif leading-relaxed italic mb-6">
                                    "{bookmark.text}"
                                </p>

                                <div className="flex items-center justify-between text-xs text-stone-400">
                                    <span>{new Date(bookmark.timestamp).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => copyToClipboard(bookmark.text)}
                                        className="flex items-center gap-1 hover:text-primary transition-colors font-bold uppercase tracking-tighter"
                                    >
                                        <Icon name="copy" className="w-3 h-3" />
                                        Copy Wisdom
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

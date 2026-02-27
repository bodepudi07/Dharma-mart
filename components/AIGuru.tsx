import React, { useState, useRef, useEffect } from 'react';
// FIX: Import Language enum for typed API calls.
import { I18nContent, Temple, Book, Pooja, ShoppingRecommendation, Language } from '../types';
import { streamDevaGptResponse } from '../services/aiService';
import { Icon } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { useModal } from '../contexts/ModalContext';

interface AIGuruProps {
    t: I18nContent;
    temple?: Temple;
    book?: Book;
    pooja?: Pooja;
    pillar?: any;
    // FIX: Add optional onBookPooja prop to handle booking from within a modal context.
    onBookPooja?: (pooja: Pooja) => void;
    onBuyItem?: () => void;
}

interface Message {
    role: 'user' | 'guru';
    text: string;
}

const CHAT_HISTORY_KEY = 'dharma-setu-chat-history';

export const AIGuru = ({ t, temple, book, pooja, pillar, onBookPooja, onBuyItem }: AIGuruProps) => {
    const { currentUser } = useAuth();
    const { openModal } = useModal();

    const getGreeting = () => {
        const name = currentUser?.name.split(' ')[0] || 'Bhakta';
        if (pillar) {
            return `🙏 Swagatam! I can assist you with ${pillar.title}. ${pillar.details}`;
        }
        if (temple) {
            return `🙏 Swagatam! I am Deva-GPT, your digital sevak. Ask me anything about ${temple.name}.`;
        }
        if (book) {
            return `🙏 Swagatam, ${name}ji! I am Deva-GPT. How may I assist you with your reading of ${book.name}?`;
        }
        if (pooja) {
            return `🙏 Pranam! I can provide more details about the ${pooja.name} ritual. What would you like to know?`;
        }
        return `🙏 Swagatam! I am Deva-GPT, your digital sevak. Ask me any question about dharma, philosophy, or rituals.`;
    };

    const [messages, setMessages] = useState<Message[]>(() => {
        try {
            if (temple || book || pooja || pillar) { // Contextual chats are not persisted
                return [{ role: 'guru', text: getGreeting() }];
            }
            const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
            return savedMessages ? JSON.parse(savedMessages) : [{ role: 'guru', text: getGreeting() }];
        } catch (error) {
            console.error("Failed to parse chat history", error);
            return [{ role: 'guru', text: getGreeting() }];
        }
    });

    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [recommendations, setRecommendations] = useState<ShoppingRecommendation[]>([]);
    const [allPoojas, setAllPoojas] = useState<Pooja[]>([]);
    const [userBookings, setUserBookings] = useState<any[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // FIX: Use Language enum instead of hardcoded string.
        api.getPoojas(Language.EN).then(setAllPoojas);
        if (currentUser) {
            api.getUserBookings(currentUser.id, currentUser.token || '').then(setUserBookings).catch(console.error);
        }
    }, [currentUser]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, isLoading]);

    useEffect(() => {
        if (!temple && !book && !pooja && !pillar) {
            try {
                localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error("Failed to save chat history", error);
            }
        }
    }, [messages, temple, book, pooja, pillar]);

    const handleQuerySubmit = async (queryString: string) => {
        if (!queryString.trim() || isLoading) return;

        setRecommendations([]); // Clear previous recommendations
        const newUserMessage: Message = { role: 'user', text: queryString };

        const historyForApi = messages
            .slice(1)
            .filter(m => m.text && m.text.trim())
            .map((m): { role: 'user' | 'model', parts: { text: string }[] } => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text.trim() }]
            }));

        setMessages(prev => [...prev, newUserMessage, { role: 'guru', text: '' }]);
        setQuery('');
        setError('');
        setIsLoading(true);

        let accumulatedText = '';

        try {
            const onChunk = (chunk: string) => {
                accumulatedText += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'guru') {
                        newMessages[newMessages.length - 1] = {
                            ...lastMessage,
                            text: lastMessage.text + chunk
                        };
                    }
                    return newMessages;
                });
            };

            const onComplete = () => {
                setIsLoading(false);
                const separator = '||DHARMA_SHOPPER_ACTION||';
                if (accumulatedText.includes(separator)) {
                    const parts = accumulatedText.split(separator);
                    const conversationalText = parts[0].trim();
                    const jsonPart = parts[1];

                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.role === 'guru') {
                            newMessages[newMessages.length - 1] = {
                                ...lastMessage,
                                text: conversationalText
                            };
                        }
                        return newMessages;
                    });

                    try {
                        const cleanJson = jsonPart.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                        const parsedRecs = JSON.parse(cleanJson);
                        if (Array.isArray(parsedRecs)) {
                            setRecommendations(parsedRecs);
                        }
                    } catch (e) {
                        console.error("Failed to parse AI recommendations:", e, "JSON Part:", jsonPart);
                    }
                }
            };

            await streamDevaGptResponse(
                queryString,
                historyForApi,
                { temple, book, pooja, pillar, user: currentUser, userBookings },
                onChunk,
                onComplete
            );
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                const errorMessage: Message = { role: 'guru', text: err.message };
                setMessages(prev => [...prev.slice(0, -1), errorMessage]);
            }
            setIsLoading(false);
        }
    };

    // FIX: This local handler is for when AIGuru is used outside a modal.
    const localHandlePoojaBooking = (pooja: Pooja) => {
        if (!currentUser) {
            openModal('login');
        } else {
            openModal('poojaBooking', { pooja });
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleQuerySubmit(query);
    };

    return (
        <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto mb-4 pr-2 -mr-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'guru' && <Icon name="cosmic-logo" className="w-8 h-8 text-primary flex-shrink-0 mt-1" />}
                        <div className={`max-w-md ${msg.role === 'user' ? 'order-2' : ''}`}>
                            <div className={`p-3 rounded-2xl shadow-sm animate-fade-in ${msg.role === 'user' ? 'ai-guru-chat-bubble-user rounded-br-none' : 'ai-guru-chat-bubble-guru rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap text-base">
                                    {msg.text}
                                    {isLoading && msg.role === 'guru' && index === messages.length - 1 && <span className="blinking-cursor">▍</span>}
                                </p>
                            </div>
                        </div>
                        {msg.role === 'user' && <Icon name="user-circle" className="w-8 h-8 text-primary flex-shrink-0" />}
                    </div>
                ))}
                {isLoading && messages[messages.length - 1].role === 'user' && (
                    <div className="flex justify-start">
                        <div className="max-w-sm p-3 rounded-lg mb-2 bg-white text-orange-900 border border-orange-200">
                            <Icon name="lotus" className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    </div>
                )}
                {error && <div className="text-center text-red-600 p-2 bg-red-100 rounded-lg">{error}</div>}
                <div ref={messagesEndRef} />
            </div>

            {recommendations.length > 0 && (
                <div className="flex-shrink-0 mt-4 border-t pt-4">
                    <h4 className="font-bold text-lg mb-2 text-primary">Recommendations for you:</h4>
                    <div className="flex overflow-x-auto space-x-4 pb-2">
                        {recommendations.map((rec, index) => (
                            <ProductRecommendationCard
                                key={index}
                                recommendation={rec}
                                allPoojas={allPoojas}
                                t={t}
                                // FIX: Use the passed handler if available, otherwise use the local one.
                                onBookPooja={onBookPooja || localHandlePoojaBooking}
                                onViewImage={() => openModal('imageDetail', { imageUrl: rec.imageUrl, altText: rec.itemName })}
                                onBuyItem={onBuyItem || (() => openModal('aiShopper'))}
                            />
                        ))}
                    </div>
                </div>
            )}


            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 flex-shrink-0 pt-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.aiGuruPlaceholder}
                        className="w-full p-3 pl-4 pr-12 rounded-full border-2 ai-guru-input focus:ring-2 focus:outline-none"
                        disabled={isLoading}
                    />
                </div>
                <button
                    id="ai-guru-submit"
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="ai-guru-submit-button text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 shadow-md"
                >
                    {t.askGuru}
                </button>
            </form>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import * as api from '../services/apiService';
import { MajorEvent, Pandit, I18nContent, Language, Pooja } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { Section } from './Section';
import { CrowdLevelIndicator } from './CrowdLevelIndicator';
import { PanditCard } from './PanditCard';
import { PanditCardSkeleton } from './PanditCardSkeleton';
import { Icon } from './Icon';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useImageWithFallback } from '../hooks/useImageWithFallback';

interface EventDetailProps {
    eventId: string;
    t: I18nContent;
    language: Language;
}

export const EventDetail = ({ eventId, t, language }: EventDetailProps) => {
    const [event, setEvent] = useState<MajorEvent | null>(null);
    const [pandits, setPandits] = useState<Pandit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { currentUser } = useAuth();
    const { openModal, closeModal } = useModal();
    const { addToast } = useToast();
    const { imgSrc, onError: handleImageError } = useImageWithFallback(event?.imageUrl || '', PLACEHOLDER_IMAGE_URL, event?.name || 'Event', 'event');


    useEffect(() => {
        let isCancelled = false;

        const fetchEventData = async () => {
            if (isCancelled) return;
            setIsLoading(true);
            setError(null);
            try {
                const numericId = parseInt(eventId, 10);
                if (isNaN(numericId)) {
                    throw new Error("Invalid Event ID.");
                }
                const [eventData, panditsData] = await Promise.all([
                    api.getEventById(numericId, language),
                    api.getPandits(language, numericId)
                ]);

                if (isCancelled) return;

                if (eventData) {
                    setEvent(eventData);
                    setPandits(panditsData);
                } else {
                    setError("Event not found.");
                }
            } catch (err) {
                if (isCancelled) return;
                const message = err instanceof Error ? err.message : "Could not load event data.";
                setError(message);
                addToast(message, 'error');
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchEventData();

        const handleDataUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.key === 'pandits' || customEvent.detail?.key === 'events') {
                fetchEventData();
            }
        };

        window.addEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);

        return () => {
            isCancelled = true;
            window.removeEventListener(api.DATA_UPDATED_EVENT, handleDataUpdate);
        };
    }, [eventId, addToast, language]);

    const onBack = () => window.location.hash = '#/events';

    const handlePanditSubmit = async (panditData: Partial<Pandit>) => {
        if (!currentUser?.token || !event) return;
        try {
            let result;
            if (panditData.id) {
                result = await api.updatePandit(panditData as Partial<Pandit> & { id: number }, currentUser.token);
            } else {
                result = await api.addPandit({ ...panditData, eventId: event.id }, currentUser.token);
            }
            addToast(result.message, 'success');
            closeModal();
            // Refresh handled by event listener
        } catch (err) {
            if (err instanceof Error) addToast(err.message, 'error');
        }
    };

    const onAddPandit = () => {
        if (!event) return;
        openModal('panditAdmin', { event, onSubmit: handlePanditSubmit, t });
    };

    const onEditPandit = (pandit: Pandit) => {
        if (!event) return;
        openModal('panditAdmin', { event, initialData: pandit, onSubmit: handlePanditSubmit, t });
    };

    const onDeletePandit = (pandit: Pandit) => {
        if (!currentUser?.token) return;
        openModal('confirmation', {
            title: t.confirmDeleteTitle,
            message: t.confirmDeleteMessage.replace('this item', pandit.name),
            onConfirm: async () => {
                try {
                    await api.deletePandit(pandit.id!, currentUser.token!);
                    addToast(`Pandit ${pandit.name} deleted.`, 'success');
                    closeModal();
                    // Refresh handled by event listener
                } catch (err) {
                    if (err instanceof Error) addToast(err.message, 'error');
                }
            }
        });
    };

    const onBookPandit = (pandit: Pandit) => {
        if (!currentUser) {
            openModal('login');
            return;
        }
        if (!event) return;
        openModal('panditBooking', { pandit, event });
    };

    const handleSubscribe = () => {
        if (!event) return;
        addToast(`Subscribed to updates for ${event.name}`, 'success');
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Icon name="lotus" className="h-16 w-16 text-orange-500 animate-spin" /></div>;
    }

    if (error || !event) {
        return <div className="text-center py-20 text-red-600"><h2>{error || 'Event not found'}</h2></div>;
    }

    const cleanDescription = DOMPurify.sanitize(event.description.replace(/\n/g, '<br />'));

    return (
        <div className="bg-amber-50 animate-fade-in">
            <section className="relative h-[50vh] bg-black group overflow-hidden">
                <img src={imgSrc} alt={event.name} loading="lazy" onError={handleImageError} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-[2s] scale-105 group-hover:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-50 via-transparent to-black/40"></div>
                {/* Subtle divine light ray effect */}
                <div className="absolute -bottom-1/2 left-1/3 w-[1px] h-[200%] bg-white/20 -rotate-45 blur-sm mix-blend-overlay"></div>
                <div className="absolute -top-1/2 right-1/4 w-[2px] h-[200%] bg-amber-400/20 rotate-45 blur-md mix-blend-overlay"></div>
            </section>
            <div className="container mx-auto px-4 -mt-32 relative z-10 animate-fade-in-up">
                <div className="bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-amber-500/20 relative overflow-hidden">
                    {/* Inner glowing edge for events */}
                    <div className="absolute inset-0 rounded-[2.5rem] border-[2px] border-amber-500/10 pointer-events-none mix-blend-overlay"></div>
                    <button onClick={onBack} className="mb-6 inline-flex items-center text-orange-600 hover:text-orange-800 font-bold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Back to Events
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold text-orange-900 mb-2">{event.name}</h1>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-lg text-stone-600">
                                <p className="flex items-center"><Icon name="calendar" className="w-5 h-5 mr-2 text-orange-500" /> {event.dates}</p>
                                <p className="flex items-center"><Icon name="map-pin" className="w-5 h-5 mr-2 text-orange-500" /> {event.location}</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 mt-4 md:mt-0">
                            <CrowdLevelIndicator level={event.crowdLevel} size="large" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start">
                        <div className="flex-grow flex flex-wrap gap-4">
                            <button
                                onClick={handleSubscribe}
                                className="w-full sm:w-auto flex-shrink-0 bg-amber-500/10 text-amber-700 font-bold py-3 px-8 rounded-full hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 relative overflow-hidden group border border-amber-500/30"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                                <Icon name="bell" className="w-5 h-5 relative z-10 animate-bell-shake" />
                                <span className="relative z-10">Subscribe for Updates</span>
                            </button>
                            <button
                                onClick={() => openModal('task', { item: event, itemType: 'Event', t })}
                                className="w-full sm:w-auto flex-shrink-0 bg-amber-500 border border-amber-500 text-white font-bold py-3 px-8 rounded-full hover:bg-amber-600 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300 shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                                <Icon name="clock" className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">{t.setTask}</span>
                            </button>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none text-stone-800" dangerouslySetInnerHTML={{ __html: cleanDescription }} />

                    <div className="mt-8">
                        {(event.crowdLevel === 'High' || event.crowdLevel === 'Very High') && (
                            <div className="p-6 bg-primary/10 rounded-xl border-l-4 border-primary shadow-md">
                                <h3 className="text-2xl font-bold font-heading mb-2">Event Essentials</h3>
                                <p className="text-text-muted mb-4">Prepare for the crowds. Let our AI Guru help you find essential Pooja items, merchandise, and services for {event.name}.</p>
                                <button
                                    onClick={() => openModal('aiGuruChat', {
                                        pooja: { name: event.name, description: event.description } as Pooja, // Pass event context as a pooja-like object
                                    })}
                                    className="bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-3 rounded-full text-sm hover:shadow-[0_0_20px_rgba(234,88,12,0.6)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group relative overflow-hidden inline-flex"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                                    <Icon name="shopping-bag" className="w-5 h-5 relative z-10 aspect-square" />
                                    <span className="relative z-10">Get Recommendations</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Section
                id="available-pandits"
                title={t.availablePandits}
                icon={<Icon name="users" className="w-8 h-8" />}
            >
                {currentUser?.role === 'admin' && (
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={onAddPandit}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-full text-sm hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <Icon name="plus" className="w-4 h-4" />
                            {t.addPandit}
                        </button>
                    </div>
                )}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{[...Array(3)].map((_, i) => <PanditCardSkeleton key={i} />)}</div>
                ) : pandits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pandits.map(pandit =>
                            <PanditCard
                                key={pandit.id}
                                pandit={pandit}
                                t={t}
                                onBook={() => onBookPandit(pandit)}
                                isAdmin={currentUser?.role === 'admin'}
                                onEdit={() => onEditPandit(pandit)}
                                onDelete={() => onDeletePandit(pandit)}
                            />
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-amber-100 rounded-lg">
                        <p className="text-stone-700">{t.noPanditsAvailable}</p>
                    </div>
                )}
            </Section>

            <div className="h-24 bg-amber-50"></div>
        </div>
    );
};

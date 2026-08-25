import React, { useRef } from 'react';
import { I18nContent, Temple, Book, Pooja } from '../types';
import { AIGuru } from './AIGuru';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Icon } from './Icon';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';

interface AIGuruModalProps {
    onClose: () => void;
    t: I18nContent;
    temple?: Temple;
    book?: Book;
    pooja?: Pooja;
    pillar?: any;
}

export const AIGuruModal = ({ onClose, t, temple, book, pooja, pillar }: AIGuruModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);
    const { openModal } = useModal();
    const { currentUser } = useAuth();


    let title = "Ask Deva-GPT";
    if (temple) title = `Ask about ${temple.name}`;
    if (book) title = `Ask about ${book.name}`;
    if (pooja) title = `Ask about ${pooja.name}`;
    if (pillar) title = pillar.title;

    const handlePoojaBooking = (poojaToBook: Pooja) => {
        if (!currentUser) {
            openModal('login');
        } else {
            // Close the current AI modal before opening the new one
            onClose();
            // Need a slight delay to allow the state to update properly
            setTimeout(() => {
                openModal('poojaBooking', { pooja: poojaToBook });
            }, 100);
        }
    };


    const handleBuyItem = () => {
        window.location.hash = '/mart';
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-guru-modal-title"
                className="bg-main rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] p-6 relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    aria-label="Close"
                    className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors text-2xl font-bold z-10"
                >&times;</button>
                 <div className="text-center mb-4 flex-shrink-0">
                    <Icon name="cosmic-logo" className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h2 id="ai-guru-modal-title" className="text-2xl font-bold text-primary font-heading">
                        {title}
                    </h2>
                </div>
                <div className="flex-grow overflow-hidden">
                   <AIGuru t={t} temple={temple} book={book} pooja={pooja} pillar={pillar} onBookPooja={handlePoojaBooking} onBuyItem={handleBuyItem} />
                </div>
            </div>
        </div>
    );
};

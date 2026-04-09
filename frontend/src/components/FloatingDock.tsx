import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';

export const FloatingDock = () => {
    const { openModal } = useModal();
    const { currentUser } = useAuth();

    const navigate = (view: string) => {
        window.location.hash = view;
    };

    const items = [
        { icon: 'home', label: 'Home', action: () => navigate('home') },
        { icon: 'temple', label: 'Temples', action: () => navigate('temples') },
        { icon: 'shopping-bag', label: 'Mart', action: () => navigate('mart') },
        { icon: 'user-circle', label: 'Profile', action: () => {
            if (currentUser) {
                navigate('settings');
            } else {
                openModal('login');
            }
        }},
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] md:hidden">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 p-2 bg-stone-900/80 backdrop-blur-xl border border-stone-700/50 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
                {items.map((item, index) => (
                    <motion.button
                        key={index}
                        onClick={item.action}
                        whileHover={{ scale: 1.2, y: -10 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative group p-4 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <Icon name={item.icon as any} className="w-6 h-6 text-stone-300 group-hover:text-primary transition-colors" />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-ink text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {item.label}
                        </span>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};

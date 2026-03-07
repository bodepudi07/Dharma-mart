import React from 'react';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { useModal } from '../contexts/ModalContext';

export const FloatingDock = () => {
    const { openModal } = useModal();

    const items = [
        { icon: 'home', label: 'Home', href: '#' },
        { icon: 'temple', label: 'Temples', href: '#featured-temples' },
        { icon: 'shopping-bag', label: 'Mart', action: () => openModal('aiShopper') },
        { icon: 'user-circle', label: 'Profile', href: '#' },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
                {items.map((item, index) => (
                    item.href ? (
                        <motion.a
                            key={index}
                            href={item.href}
                            whileHover={{ scale: 1.2, y: -10 }}
                            className="relative group p-4 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icon name={item.icon as any} className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-ink text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {item.label}
                            </span>
                        </motion.a>
                    ) : (
                        <motion.button
                            key={index}
                            onClick={item.action}
                            whileHover={{ scale: 1.2, y: -10 }}
                            className="relative group p-4 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icon name={item.icon as any} className="w-6 h-6 text-white group-hover:text-primary transition-colors" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-ink text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {item.label}
                            </span>
                        </motion.button>
                    )
                ))}
            </motion.div>
        </div>
    );
};

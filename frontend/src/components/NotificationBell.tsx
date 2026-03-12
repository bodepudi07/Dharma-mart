import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Icon } from './Icon';
import { AppNotification, IconName } from '../types';

const ICON_MAP: Record<AppNotification['type'], IconName> = {
    booking: 'calendar',
    sankalpa: 'flame',
    achievement: 'star',
    reminder: 'bell',
    system: 'info',
};

const COLOR_MAP: Record<AppNotification['type'], string> = {
    booking: 'text-blue-500',
    sankalpa: 'text-orange-500',
    achievement: 'text-amber-500',
    reminder: 'text-green-500',
    system: 'text-stone-500',
};

function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export const NotificationBell: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-stone-500 hover:text-primary transition-colors rounded-full hover:bg-stone-100"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
                <Icon name="bell" className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
                        <h3 className="font-bold text-stone-800 text-sm">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-primary font-semibold hover:underline">
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={clearAll} className="text-xs text-stone-400 hover:text-red-500 font-semibold">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                                <Icon name="bell" className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs mt-1">We'll notify you about bookings & updates</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => { markAsRead(notif.id); }}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-stone-50 transition-colors border-b border-stone-50 ${!notif.read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`mt-0.5 flex-shrink-0 ${COLOR_MAP[notif.type]}`}>
                                        <Icon name={(notif.icon as IconName) || ICON_MAP[notif.type]} className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-stone-400 mt-1">{timeAgo(notif.timestamp)}</p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

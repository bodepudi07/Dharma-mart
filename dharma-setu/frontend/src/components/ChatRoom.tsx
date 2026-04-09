
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { I18nContent, ChatMessage, ChatRoom as ChatRoomType } from '../types';
import * as api from '../services/apiService';
import { OnlineUser } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { Icon } from './Icon';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface ChatRoomProps {
    roomId: number;
    t: I18nContent;
}

export const ChatRoom = ({ roomId, t }: ChatRoomProps) => {
    const [room, setRoom] = useState<ChatRoomType | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [showMembers, setShowMembers] = useState(false);

    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { openModal } = useModal();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<number>(0);

    // Track the latest message ID for incremental polling
    const updateLastMessageId = useCallback((msgs: ChatMessage[]) => {
        if (msgs.length > 0) {
            const maxId = Math.max(...msgs.map(m => m.id));
            if (maxId > lastMessageIdRef.current) {
                lastMessageIdRef.current = maxId;
            }
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        // Poll for NEW messages only (incremental)
        const pollNewMessages = async () => {
            if (document.hidden || lastMessageIdRef.current === 0) return;
            try {
                const newMsgs = await api.getNewMessagesSince(roomId, lastMessageIdRef.current);
                if (!isCancelled && newMsgs.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const trulyNew = newMsgs.filter(m => !existingIds.has(m.id));
                        if (trulyNew.length === 0) return prev;
                        const updated = [...prev, ...trulyNew];
                        updateLastMessageId(trulyNew);
                        return updated;
                    });
                }
            } catch {
                // Silent fail on poll
            }
        };

        // Heartbeat for presence
        const sendHeartbeat = async () => {
            if (!currentUser?.token) return;
            try {
                const online = await api.sendPresenceHeartbeat(roomId, currentUser.token);
                if (!isCancelled) setOnlineUsers(online);
            } catch {
                // Silent fail
            }
        };

        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [rooms, initialMsgs] = await Promise.all([
                    api.getChatRooms(),
                    api.getChatMessages(roomId),
                ]);

                if (isCancelled) return;

                const currentRoom = rooms.find(r => r.id === roomId);
                if (currentRoom) setRoom(currentRoom);
                else addToast("Chat room not found.", 'error');

                setMessages(initialMsgs);
                updateLastMessageId(initialMsgs);

                // Initial heartbeat
                if (currentUser?.token) {
                    const online = await api.sendPresenceHeartbeat(roomId, currentUser.token);
                    if (!isCancelled) setOnlineUsers(online);
                }
            } catch {
                if (!isCancelled) addToast("Could not load chat room details.", 'error');
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchInitialData();
        const pollInterval = setInterval(pollNewMessages, 2000);
        const heartbeatInterval = setInterval(sendHeartbeat, 10000);

        return () => {
            isCancelled = true;
            clearInterval(pollInterval);
            clearInterval(heartbeatInterval);
            // Leave room on unmount
            if (currentUser?.token) {
                api.leaveRoom(roomId, currentUser.token);
            }
        };
    }, [roomId, addToast, currentUser?.token, updateLastMessageId]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 200;
            if (isScrolledNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || isSending) return;

        const text = newMessage.trim();
        const optimisticMessage: ChatMessage = {
            id: Date.now(),
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            timestamp: new Date().toISOString(),
            text,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setIsSending(true);

        try {
            await api.postChatMessage(roomId, text, currentUser);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Failed to send message.", 'error');
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        } finally {
            setIsSending(false);
        }
    };

    const onBack = () => { window.location.hash = '#/satsang'; };

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-full bg-[#0a0b10] gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Icon name="lotus" className="w-14 h-14 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-stone-500 text-sm font-mono tracking-widest uppercase">Entering circle...</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#0a0b10] p-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <Icon name="x" className="w-10 h-10 text-red-400" />
                </div>
                <p className="text-xl text-white font-bold mb-2">Circle Not Found</p>
                <p className="text-stone-500 text-sm mb-6">This satsang circle may have been moved or removed.</p>
                <button onClick={onBack} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors text-sm">
                    Back to Satsang
                </button>
            </div>
        );
    }

    const roomName = t[room.name as keyof I18nContent] || room.name;
    const roomDesc = t[room.description as keyof I18nContent] || room.description;

    // Group messages and detect date boundaries
    let lastDate = '';

    return (
        <div className="h-full flex flex-col bg-[#0a0b10] relative overflow-hidden">
            {/* Subtle ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <header className="flex-shrink-0 relative z-10 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors">
                            <Icon name="chevron-left" className="w-5 h-5 text-stone-400" />
                        </button>
                        <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/20">
                            <Icon name={room.icon} className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">{roomName}</h1>
                            <p className="text-[11px] text-stone-500 leading-tight mt-0.5 max-w-[200px] sm:max-w-none truncate">{roomDesc}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.06] transition-all"
                    >
                        <div className="flex -space-x-1.5">
                            {onlineUsers.slice(0, 3).map(u => (
                                <img key={u.id} src={u.avatarUrl || PLACEHOLDER_IMAGE_URL} alt={u.name} className="w-6 h-6 rounded-full border-2 border-[#0a0b10] object-cover" />
                            ))}
                        </div>
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {onlineUsers.length}
                        </span>
                    </button>
                </div>

                {/* Online members panel */}
                {showMembers && onlineUsers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] animate-fade-in">
                        <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-2 font-mono">Online Now</p>
                        <div className="flex flex-wrap gap-2">
                            {onlineUsers.map(u => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] rounded-lg border border-white/[0.06]"
                                >
                                    <img src={u.avatarUrl || PLACEHOLDER_IMAGE_URL} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                                    <span className="text-xs text-stone-400">{u.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto px-4 py-4 space-y-1 relative z-10">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-4 border border-white/[0.06]">
                            <Icon name="om" className="w-8 h-8 text-stone-700" />
                        </div>
                        <p className="text-stone-500 text-sm font-medium">This circle is peaceful and quiet.</p>
                        <p className="text-stone-600 text-xs mt-1">Be the first to share your thoughts.</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isOwn = msg.userId === currentUser?.id;
                    const currentDate = formatDateSeparator(msg.timestamp);
                    const showDateSep = currentDate !== lastDate;
                    if (showDateSep) lastDate = currentDate;

                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isGrouped = prevMsg && prevMsg.userId === msg.userId && !showDateSep;
                    const avatarUrl = msg.userAvatar || PLACEHOLDER_IMAGE_URL;

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSep && (
                                <div className="flex items-center gap-3 py-4">
                                    <div className="flex-1 h-[1px] bg-white/[0.06]" />
                                    <span className="text-[10px] font-mono tracking-widest text-stone-600 uppercase">{currentDate}</span>
                                    <div className="flex-1 h-[1px] bg-white/[0.06]" />
                                </div>
                            )}
                            <div className={`flex items-end gap-2.5 ${isGrouped ? 'mt-0.5' : 'mt-3'} ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                {/* Avatar for others */}
                                {!isOwn && (
                                    <div className={`flex-shrink-0 ${isGrouped ? 'invisible' : ''}`}>
                                        <img src={avatarUrl} alt={msg.userName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                    </div>
                                )}

                                <div className={`max-w-[75%] sm:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                                    {/* Username for others, only on first of group */}
                                    {!isOwn && !isGrouped && (
                                        <p className="text-[11px] font-bold text-primary/80 mb-1 ml-1">
                                            {msg.userName}
                                        </p>
                                    )}
                                    <div className={`px-4 py-2.5 ${
                                        isOwn
                                            ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl rounded-br-md shadow-[0_4px_15px_rgba(234,88,12,0.25)]'
                                            : 'bg-white/[0.06] text-stone-200 rounded-2xl rounded-bl-md border border-white/[0.06]'
                                    }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                    <p className={`text-[10px] text-stone-600 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                        {formatTimestamp(msg.timestamp)}
                                    </p>
                                </div>

                                {/* Avatar for self */}
                                {isOwn && (
                                    <div className={`flex-shrink-0 order-2 ${isGrouped ? 'invisible' : ''}`}>
                                        <img src={currentUser?.avatarUrl || PLACEHOLDER_IMAGE_URL} alt={currentUser?.name} className="w-8 h-8 rounded-full object-cover border-2 border-primary/30" />
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 relative z-10 bg-white/[0.03] backdrop-blur-xl border-t border-white/[0.06] p-3 sm:p-4">
                {!currentUser ? (
                    <div className="text-center py-2">
                        <p className="text-stone-500 text-sm">
                            <button onClick={() => openModal('login')} className="text-primary font-bold hover:underline">Sign in</button>
                            {' '}to join the conversation
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t.satsangTypeMessage}
                                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-white/[0.08] outline-none transition-all text-white placeholder:text-stone-600 text-sm"
                                disabled={isSending}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSending || !newMessage.trim()}
                            className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-primary to-secondary text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:shadow-none disabled:hover:translate-y-0 active:scale-95"
                        >
                            <Icon name="play" className="w-5 h-5 rotate-90" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

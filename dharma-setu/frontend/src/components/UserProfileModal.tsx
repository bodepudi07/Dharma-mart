import React, { useState, useEffect, useCallback, useRef } from 'react';
import { I18nContent, User, Post } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as api from '../services/apiService';
import { Icon } from './Icon';

interface UserProfileModalProps {
    user: User;
    t: I18nContent;
    onClose: () => void;
}

const LEVEL_TITLES = [
    { max: 5, title: 'Novice Seeker' },
    { max: 15, title: 'Dedicated Sadhaka' },
    { max: 30, title: 'Dharma Guardian' },
    { max: 50, title: 'Spiritual Guide' },
    { max: 100, title: 'Enlightened Master' }
];

const getLevelTitle = (level: number) => {
    return LEVEL_TITLES.find(l => level <= l.max)?.title || 'Enlightened Master';
};

const AVAILABLE_BADGES = [
    { id: 'early_bird', name: 'Brahma Muhurta', icon: 'sun', desc: 'Chanted before sunrise' },
    { id: 'streak_7', name: '7-Day Streak', icon: 'flame', desc: 'Completed sadhana for 7 days straight' },
    { id: 'temple_visitor', name: 'Pilgrim', icon: 'map-pin', desc: 'Visited 5 temples virtually or physically' },
    { id: 'Gita_reader', name: 'Wisdom Seeker', icon: 'book-open', desc: 'Read 10 chapters of holy texts' },
];

export const UserProfileModal = ({ user: initialUser, t, onClose }: UserProfileModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);

    const [user, setUser] = useState<User>(initialUser);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'journey' | 'social'>('journey');

    const { currentUser } = useAuth();
    const { addToast } = useToast();

    const isCurrentUserProfile = currentUser?.id === user.id;

    const fetchData = useCallback(async () => {
        try {
            const [fullUser, allPosts] = await Promise.all([
                api.getUserById(initialUser.id, currentUser?.token || ''),
                api.getPosts()
            ]);
            if (fullUser) {
                // Use default values for gamification fields if missing
                setUser({
                    ...fullUser,
                    level: fullUser.level || 1,
                    xp: fullUser.xp || 0,
                    currentStreak: fullUser.currentStreak || 0,
                    longestStreak: fullUser.longestStreak || 0,
                    dharmaCoins: fullUser.dharmaCoins || 0,
                    badges: fullUser.badges || []
                });
                if (currentUser) {
                    setIsFollowing(fullUser.followers.includes(currentUser.id));
                }
            }
            setUserPosts(allPosts.filter(p => p.userId === initialUser.id));
        } catch {
            addToast("Could not load full profile.", 'error');
        }
    }, [initialUser.id, currentUser, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollowToggle = async () => {
        if (!currentUser || !currentUser.token) {
            addToast("You must be logged in to follow users.", 'info');
            return;
        }
        setIsFollowLoading(true);
        try {
            await api.toggleFollowUser(currentUser.id, user.id, currentUser.token);
            setUser(prevUser => {
                const isNowFollowing = !isFollowing;
                const newFollowers = isNowFollowing
                    ? [...prevUser.followers, currentUser.id]
                    : prevUser.followers.filter(id => id !== currentUser.id);
                return { ...prevUser, followers: newFollowers };
            });
            setIsFollowing(!isFollowing);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Action failed.", 'error');
        } finally {
            setIsFollowLoading(false);
        }
    };

    const xpForNextLevel = (user.level || 1) * 1000;
    const xpProgress = ((user.xp || 0) / xpForNextLevel) * 100;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 w-full max-w-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header Background */}
                <div className="h-32 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 relative">
                    <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10 mix-blend-overlay"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 sm:px-10 flex-grow overflow-y-auto pb-8 custom-scrollbar relative">
                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 mb-6">
                        <div className="relative">
                            <img
                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                alt={user.name}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white object-cover"
                            />
                            <div className="absolute bottom-1 right-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                Lvl {user.level || 1}
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left pb-2">
                            <h2 className="text-3xl font-bold text-stone-900 font-heading">{user.name}</h2>
                            <p className="text-amber-600 font-medium">{getLevelTitle(user.level || 1)}</p>
                        </div>
                        {!isCurrentUserProfile && currentUser && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={isFollowLoading}
                                className={`mb-2 px-8 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${isFollowing ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:shadow-lg hover:scale-105'}`}
                            >
                                {isFollowLoading ? <Icon name="lotus" className="w-5 h-5 animate-spin" /> : (isFollowing ? 'Following' : 'Follow')}
                            </button>
                        )}
                    </div>

                    <p className="text-stone-600 text-center sm:text-left mb-8 max-w-lg mx-auto sm:mx-0">
                        {user.bio || "Walking the path of Dharma. Dedicated to daily sadhana and spiritual growth."}
                    </p>

                    {/* Tabs */}
                    <div className="flex border-b border-stone-200 mb-6">
                        <button
                            onClick={() => setActiveTab('journey')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'journey' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                        >
                            Spiritual Journey
                        </button>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'social' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                        >
                            Community
                        </button>
                    </div>

                    {activeTab === 'journey' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* XP Progress Bar */}
                            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 shadow-inner">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="font-bold text-stone-800">Experience</h4>
                                        <p className="text-xs text-stone-500">{user.xp || 0} / {xpForNextLevel} XP to Level {window.Number(user.level || 1) + 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-primary">{Math.round(xpProgress)}%</span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(xpProgress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Gamification Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex flex-col items-center justify-center text-center">
                                    <Icon name="flame" className="w-8 h-8 text-orange-500 mb-2" />
                                    <h5 className="text-2xl font-bold text-orange-600">{user.currentStreak || 0}</h5>
                                    <p className="text-xs text-orange-800/70 font-medium">Day Streak</p>
                                </div>
                                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 flex flex-col items-center justify-center text-center">
                                    <Icon name="star" className="w-8 h-8 text-yellow-500 mb-2" />
                                    <h5 className="text-2xl font-bold text-yellow-600">{user.dharmaCoins || 0}</h5>
                                    <p className="text-xs text-yellow-800/70 font-medium">Dharma Coins</p>
                                </div>
                                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col items-center justify-center text-center">
                                    <Icon name="om" className="w-8 h-8 text-indigo-500 mb-2" />
                                    <h5 className="text-2xl font-bold text-indigo-600">{user.totalJapaCount || 0}</h5>
                                    <p className="text-xs text-indigo-800/70 font-medium">Total Chants</p>
                                </div>
                            </div>

                            {/* Earned Badges */}
                            <div>
                                <h3 className="font-bold text-lg text-stone-800 mb-3 flex items-center gap-2">
                                    <Icon name="shield-check" className="w-5 h-5 text-primary" />
                                    Earned Badges
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {AVAILABLE_BADGES.map(badge => {
                                        const isEarned = user.badges?.includes(badge.id);
                                        return (
                                            <div
                                                key={badge.id}
                                                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${isEarned ? 'bg-white border-amber-200 shadow-sm' : 'bg-stone-50 border-stone-200 opacity-60 grayscale'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isEarned ? 'bg-amber-100 text-amber-600' : 'bg-stone-200 text-stone-400'}`}>
                                                    <Icon name={badge.icon as any} className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xs font-bold text-stone-800 line-clamp-1">{badge.name}</h4>
                                                {isEarned && <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 leading-tight">{badge.desc}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-around bg-stone-50 rounded-2xl p-4 border border-stone-100 mb-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-stone-800">{userPosts.length}</p>
                                    <p className="text-sm text-stone-500 font-medium">Posts</p>
                                </div>
                                <div className="w-px bg-stone-200"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-stone-800">{user.followers.length}</p>
                                    <p className="text-sm text-stone-500 font-medium">Followers</p>
                                </div>
                                <div className="w-px bg-stone-200"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-stone-800">{user.following.length}</p>
                                    <p className="text-sm text-stone-500 font-medium">Following</p>
                                </div>
                            </div>

                            {userPosts.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {userPosts.map(post => (
                                        <div key={post.id} className="aspect-square bg-stone-200 rounded-xl overflow-hidden group relative cursor-pointer">
                                            <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="flex gap-3 text-white">
                                                    <span className="flex items-center gap-1 text-sm font-bold"><Icon name="heart-filled" className="w-4 h-4" /> {post.likes.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center bg-stone-50 rounded-2xl p-8 border border-stone-100 border-dashed">
                                    <Icon name="image" className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 font-medium">No spiritual moments shared yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

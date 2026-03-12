

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { I18nContent } from '../types';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
                    prompt: () => void;
                    renderButton: (parent: HTMLElement, config: { theme?: string; size?: string; width?: number; shape?: string; text?: string }) => void;
                };
            };
        };
    }
}

interface LoginModalProps {
    onClose: () => void;
    t: I18nContent;
}

export const LoginModal = ({ onClose, t }: LoginModalProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const { login, signup, isLoading, loginWithGoogle } = useAuth();
    const { addToast } = useToast();
    const modalRef = useRef<HTMLDivElement>(null);
    const googleBtnRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef);

    const [showMockGoogle, setShowMockGoogle] = useState(false);
    const [mockGoogleName, setMockGoogleName] = useState('');
    const [mockGoogleEmail, setMockGoogleEmail] = useState('');

    const isMockMode = !import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'your_google_client_id_here';

    const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
        try {
            await loginWithGoogle(response.credential);
            addToast('Logged in with Google!', 'success');
            onClose();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Google login failed', 'error');
        }
    }, [loginWithGoogle, addToast, onClose]);

    const handleMockGoogleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await loginWithGoogle('mock_google_credential', { name: mockGoogleName, email: mockGoogleEmail });
            addToast('Logged in with Google!', 'success');
            onClose();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Google login failed', 'error');
        }
    };

    useEffect(() => {
        if (isMockMode) return;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        const initGoogle = () => {
            if (window.google && googleBtnRef.current) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleCredential,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 380,
                    shape: 'pill',
                    text: 'continue_with',
                });
            }
        };

        if (window.google) {
            initGoogle();
        } else {
            const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (!existing) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = initGoogle;
                document.head.appendChild(script);
            } else {
                existing.addEventListener('load', initGoogle);
            }
        }
    }, [handleGoogleCredential, isMockMode]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isSignUp) {
                await signup(name, email, password);
                addToast("Registration successful! Welcome.", 'success');
            } else {
                await login(email, password, rememberMe);
                addToast("Login successful!", 'success');
            }
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                addToast(error.message, 'error');
            } else {
                addToast('An unknown error occurred.', 'error');
            }
        }
    };

    const handleSocialLogin = async (provider: 'facebook') => {
        try {
            addToast('Facebook login will be available soon. Please use Google or email.', 'info');
        } catch (error) {
            if (error instanceof Error) {
                addToast(error.message, 'error');
            }
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setName('');
        setEmail('');
        setPassword('');
    }

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
                className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 w-full max-w-md p-8 relative transform transition-all duration-500 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[60px] pointer-events-none mix-blend-multiply"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/15 rounded-full blur-[50px] pointer-events-none mix-blend-multiply"></div>

                {/* Inner glowing edge */}
                <div className="absolute inset-0 rounded-[2.5rem] border-[2px] border-primary/10 pointer-events-none mix-blend-overlay"></div>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors text-2xl font-bold"
                >&times;</button>
                <div className="text-center mb-8 relative z-10">
                    <div className="relative inline-block mb-4">
                        <Icon name="cosmic-logo" className="h-14 w-14 text-primary relative z-10 animate-slow-spin" />
                        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-150 animate-pulse"></div>
                    </div>
                    <h2 id="login-modal-title" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm font-heading mb-2">
                        {isSignUp ? 'Begin Your Journey' : 'Welcome Back'}
                    </h2>
                    <p className="text-stone-600 font-medium">{isSignUp ? 'Join us to explore the spiritual realms.' : 'Enter the sanctuary to continue.'}</p>
                </div>

                <div className="space-y-4">
                    {isMockMode ? (
                        <>
                            <button onClick={() => setShowMockGoogle(!showMockGoogle)} disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-secondary/50 text-text-base font-bold py-3 px-4 rounded-full hover:bg-secondary/10 transition-colors disabled:opacity-50">
                                <Icon name="google" className="w-6 h-6" />
                                {t.loginWithGoogle}
                            </button>
                            {showMockGoogle && (
                                <form onSubmit={handleMockGoogleLogin} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                                    <p className="text-xs text-stone-500 text-center">Sign in with your Google account</p>
                                    <input type="text" placeholder="Full Name" value={mockGoogleName} onChange={e => setMockGoogleName(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:ring-2 ring-primary/40 focus:border-primary focus:outline-none" required />
                                    <input type="email" placeholder="Email Address" value={mockGoogleEmail} onChange={e => setMockGoogleEmail(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:ring-2 ring-primary/40 focus:border-primary focus:outline-none" required />
                                    <button type="submit" disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-2.5 rounded-lg hover:shadow-md transition-all text-sm disabled:opacity-50">
                                        {isLoading ? 'Signing in...' : 'Continue with Google'}
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <div ref={googleBtnRef} className="flex justify-center" />
                    )}
                    <button onClick={() => handleSocialLogin('facebook')} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-bold py-3 px-4 rounded-full hover:bg-[#166eab] transition-colors disabled:opacity-50">
                        <Icon name="facebook" className="w-6 h-6" />
                        {t.loginWithFacebook}
                    </button>
                </div>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-secondary/30"></div>
                    <span className="flex-shrink mx-4 text-xs text-text-muted">{t.loginOrContinue}</span>
                    <div className="flex-grow border-t border-secondary/30"></div>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10">
                    {isSignUp && (
                        <div className="mb-5 group">
                            <label className="block text-sm font-bold text-primary/80 mb-1.5 transition-colors group-focus-within:text-primary" htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:ring-2 ring-primary/40 focus:border-primary focus:outline-none shadow-inner transition-all duration-300"
                                required
                            />
                        </div>
                    )}
                    <div className="mb-5 group">
                        <label className="block text-sm font-bold text-primary/80 mb-1.5 transition-colors group-focus-within:text-primary" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:ring-2 ring-primary/40 focus:border-primary focus:outline-none shadow-inner transition-all duration-300"
                            required
                        />
                    </div>
                    <div className="mb-5 group">
                        <label className="block text-sm font-bold text-primary/80 mb-1.5 transition-colors group-focus-within:text-primary" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:ring-2 ring-primary/40 focus:border-primary focus:outline-none shadow-inner transition-all duration-300"
                            required
                            minLength={isSignUp ? 8 : undefined}
                        />
                        {isSignUp && password.length > 0 && password.length < 8 && (
                            <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                        )}
                    </div>

                    {!isSignUp && (
                        <div className="mb-6 flex items-center justify-between">
                            <label className="flex items-center text-sm text-text-muted cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-secondary text-primary focus:ring-primary"
                                />
                                <span className="ml-2">Remember Me</span>
                            </label>
                            <a href="#" onClick={(e) => { e.preventDefault(); addToast("Password reset will be available soon. Please contact support.", 'info'); }} className="text-sm text-primary hover:underline">Forgot Password?</a>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all duration-300 shadow-md transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-wait relative overflow-hidden group">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_2s_infinite]"></div>
                        <span className="relative z-10">{isLoading ? 'Manifesting...' : (isSignUp ? 'Begin Journey' : 'Enter Sanctuary')}</span>
                    </button>
                </form>

                <div className="mt-6 text-center text-sm relative z-10">
                    <button onClick={toggleMode} className="text-primary hover:underline">
                        {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('official@dharmamart.com');
    const [password, setPassword] = useState('Dharmamart@TechnicalAdmin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (!res.success) {
            setError(res.message || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
            <div className="card-glass p-8 rounded-2xl w-full max-w-md shadow-2xl border border-[var(--color-border)] animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-3">
                        <span className="text-3xl">🛕</span>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">Dharma Mart Admin</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Vendor & Official Management Portal</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Official / Vendor Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full"
                            placeholder="official@dharmamart.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full"
                            placeholder="••••••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 text-sm mt-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Authenticating...</span>
                            </div>
                        ) : (
                            'Sign In to Portal'
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-dim)]">
                    <p>Default Super Admin Credentials:</p>
                    <p className="font-mono text-[var(--color-primary)] mt-1">official@dharmamart.com</p>
                    <p className="font-mono text-[var(--color-text-muted)]">Dharmamart@TechnicalAdmin</p>
                </div>
            </div>
        </div>
    );
};

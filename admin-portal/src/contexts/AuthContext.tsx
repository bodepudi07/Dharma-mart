import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyVendorToken, vendorLogin as apiLogin } from '../services/api';

interface Vendor {
    id: number;
    email: string;
    name: string;
    storeName: string;
    role: string;
    verified: boolean;
    status: string;
    storeLogo?: string;
}

interface AuthContextType {
    vendor: Vendor | null;
    token: string | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('dharmamart_admin_token'));
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await verifyVendorToken(token);
                    if (res.success && res.data.vendor) {
                        setVendor(res.data.vendor);
                    } else {
                        localStorage.removeItem('dharmamart_admin_token');
                        setToken(null);
                        setVendor(null);
                    }
                } catch (e) {
                    localStorage.removeItem('dharmamart_admin_token');
                    setToken(null);
                    setVendor(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email: string, pass: string) => {
        try {
            const res = await apiLogin({ email, password: pass });
            if (res.success && res.data.token) {
                localStorage.setItem('dharmamart_admin_token', res.data.token);
                setToken(res.data.token);
                setVendor(res.data.vendor);
                return { success: true };
            } else {
                return { success: false, message: res.error || 'Login failed' };
            }
        } catch (err: any) {
            return { success: false, message: err.message || 'Server connection error' };
        }
    };

    const logout = () => {
        localStorage.removeItem('dharmamart_admin_token');
        setToken(null);
        setVendor(null);
    };

    return (
        <AuthContext.Provider value={{ vendor, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

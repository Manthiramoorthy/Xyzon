import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, bootstrapAuth, getMe } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { const raw = localStorage.getItem('u'); return raw ? JSON.parse(raw) : null; } catch { return null; }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                await bootstrapAuth();
                const me = await getMe().catch(() => null);
                if (me) {
                    setUser(me.user);
                    localStorage.setItem('u', JSON.stringify(me.user));
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const u = await apiLogin({ email, password });
            setUser(u);
            localStorage.setItem('u', JSON.stringify(u));
            return u;
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }, []);

    const register = useCallback(async (data) => {
        setError(null);
        try {
            await apiRegister(data);
            const u = await login(data.email, data.password);
            return u;
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }, [login]);

    const logout = useCallback(async () => {
        await apiLogout();
        setUser(null);
        localStorage.removeItem('u');
    }, []);

    const value = { user, loading, error, login, register, logout };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContext;

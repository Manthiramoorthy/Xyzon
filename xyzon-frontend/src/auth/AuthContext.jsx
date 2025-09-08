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
        let isMounted = true;
        let isBootstrapping = false;

        const initializeAuth = async () => {
            if (isBootstrapping) return; // Prevent multiple bootstrap attempts
            isBootstrapping = true;

            try {
                // Try to restore from localStorage first
                const storedUser = localStorage.getItem('u');
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        if (isMounted) setUser(parsedUser);
                    } catch (e) {
                        localStorage.removeItem('u');
                    }
                }

                // Now check if we have valid authentication
                const hasValidAuth = await bootstrapAuth();
                if (!hasValidAuth) {
                    // No valid auth, clear everything
                    if (isMounted) {
                        setUser(null);
                        localStorage.removeItem('u');
                    }
                } else {
                    // We have valid auth, but let's verify user info
                    try {
                        const me = await getMe();
                        if (me && isMounted) {
                            setUser(me.user);
                            localStorage.setItem('u', JSON.stringify(me.user));
                        }
                    } catch (error) {
                        // getMe failed, but we have valid tokens - keep existing user or set null
                        console.log('Failed to get user info, but auth is valid');
                    }
                }
            } catch (error) {
                console.log('Auth initialization failed:', error.message);
                if (isMounted) {
                    setUser(null);
                    localStorage.removeItem('u');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
                isBootstrapping = false;
            }
        };

        initializeAuth();

        return () => {
            isMounted = false;
        };
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

    const updateUserData = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('u', JSON.stringify(userData));
    }, []);

    const value = { user, loading, error, login, register, logout, updateUserData };
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

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });

    failedQueue = [];
};

// Add auth token to requests
authApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh
authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't attempt refresh for auth endpoints to prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')) {

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return authApi(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    // Create a fresh axios instance to avoid interceptor loops
                    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    processQueue(null, accessToken);

                    // Update the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return authApi(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and process queue
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('u');
                    processQueue(refreshError, null);
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // No refresh token, clear tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('u');
                isRefreshing = false;
                processQueue(error, null);
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

// Authentication APIs
export const authApiService = {
    // User registration
    register: (userData) => authApi.post('/auth/register', userData),

    // User login
    login: (credentials) => authApi.post('/auth/login', credentials),

    // User logout
    logout: (refreshToken) => authApi.post('/auth/logout', { refreshToken }),

    // Get current user
    getMe: () => authApi.get('/auth/me', { requiresAuth: true }),

    // Refresh access token
    refreshToken: (refreshToken) => authApi.post('/auth/refresh', { refreshToken }),

    // Password reset request
    forgotPassword: (email) => authApi.post('/auth/forgot-password', { email }),

    // Password reset with token
    resetPassword: (resetData) => authApi.post('/auth/reset-password', resetData),

    // Change password (authenticated user)
    changePassword: (passwordData) => authApi.post('/auth/change-password', passwordData, { requiresAuth: true }),

    // Update user profile
    updateProfile: (profileData) => authApi.put('/auth/profile', profileData, { requiresAuth: true }),

    // Delete user account
    deleteAccount: () => authApi.delete('/auth/account', { requiresAuth: true }),

    // Verify email
    verifyEmail: (token) => authApi.post('/auth/verify-email', { token }),

    // Resend verification email
    resendVerification: () => authApi.post('/auth/resend-verification', {}, { requiresAuth: true }),

    // Check if user exists (for registration)
    checkUserExists: (email) => authApi.post('/auth/check-user', { email }),

    // Social login (Google, Facebook, etc.)
    socialLogin: (provider, token) => authApi.post(`/auth/social/${provider}`, { token }),

    // Enable/Disable Two-Factor Authentication
    enable2FA: () => authApi.post('/auth/2fa/enable', {}, { requiresAuth: true }),
    disable2FA: () => authApi.post('/auth/2fa/disable', {}, { requiresAuth: true }),
    verify2FA: (code) => authApi.post('/auth/2fa/verify', { code }, { requiresAuth: true }),

    // Admin APIs (require admin role)
    admin: {
        getAllUsers: (params = {}) => authApi.get('/auth/admin/users', { params, requiresAuth: true }),
        getUserById: (userId) => authApi.get(`/auth/admin/users/${userId}`, { requiresAuth: true }),
        updateUserRole: (userId, role) => authApi.put(`/auth/admin/users/${userId}/role`, { role }, { requiresAuth: true }),
        suspendUser: (userId) => authApi.post(`/auth/admin/users/${userId}/suspend`, {}, { requiresAuth: true }),
        unsuspendUser: (userId) => authApi.post(`/auth/admin/users/${userId}/unsuspend`, {}, { requiresAuth: true }),
        deleteUser: (userId) => authApi.delete(`/auth/admin/users/${userId}`, { requiresAuth: true }),
    }
};

// Token management utilities
export const tokenUtils = {
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },

    getAccessToken: () => localStorage.getItem('accessToken'),
    getRefreshToken: () => localStorage.getItem('refreshToken'),

    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('u');
    },

    isTokenValid: (token) => {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    getTokenPayload: (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null;
        }
    }
};

export default authApi;

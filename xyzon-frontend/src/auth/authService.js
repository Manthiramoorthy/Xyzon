import { authApiService, tokenUtils } from '../api/authApi';

// Token management
export function getAccessToken() {
    return tokenUtils.getAccessToken();
}

export function setAccessToken(token) {
    tokenUtils.setTokens(token, tokenUtils.getRefreshToken());
}

// Authentication service functions
export async function register(userData) {
    try {
        const response = await authApiService.register(userData);
        console.log('Register success response:', response);
        return response.data;
    } catch (error) {
        console.error('Register error:', error);
        console.error('Error response:', error.response);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
        throw new Error(errorMessage);
    }
}

export async function login(credentials) {
    try {
        const response = await authApiService.login(credentials);
        console.log('Login success response:', response);
        const { user, accessToken, refreshToken } = response.data;

        // Store tokens
        tokenUtils.setTokens(accessToken, refreshToken);

        return user;
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error response:', error.response);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed';
        throw new Error(errorMessage);
    }
}

export async function logout() {
    try {
        const refreshToken = tokenUtils.getRefreshToken();
        if (refreshToken) {
            await authApiService.logout(refreshToken);
        }
    } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
    } finally {
        // Always clear tokens
        tokenUtils.clearTokens();
    }
}

export async function getMe() {
    // Don't make API call if there's no access token
    const token = getAccessToken();
    if (!token) {
        throw new Error('No access token available');
    }

    try {
        const response = await authApiService.getMe();
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to get user info');
    }
}

export async function forgotPassword(email) {
    try {
        const response = await authApiService.forgotPassword(email);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
}

export async function resetPassword(resetData) {
    try {
        const response = await authApiService.resetPassword(resetData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password reset failed');
    }
}

export async function changePassword(passwordData) {
    try {
        const response = await authApiService.changePassword(passwordData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password change failed');
    }
}

export async function updateProfile(profileData) {
    try {
        const response = await authApiService.updateProfile(profileData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Profile update failed');
    }
}

export async function bootstrapAuth() {
    const refreshToken = tokenUtils.getRefreshToken();
    const accessToken = tokenUtils.getAccessToken();

    // If we have a valid access token, we're good
    if (accessToken && tokenUtils.isTokenValid(accessToken)) {
        return true;
    }

    // If we have a refresh token, try to refresh
    if (refreshToken) {
        try {
            const response = await authApiService.refreshToken(refreshToken);
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            tokenUtils.setTokens(accessToken, newRefreshToken);
            return true;
        } catch (error) {
            // Refresh failed, clear all tokens
            tokenUtils.clearTokens();
            return false;
        }
    }

    // No valid tokens
    return false;
}

// Utility functions
export function isAuthenticated() {
    const token = tokenUtils.getAccessToken();
    return token && tokenUtils.isTokenValid(token);
}

export function getUserRole() {
    const token = tokenUtils.getAccessToken();
    if (!token) return null;

    const payload = tokenUtils.getTokenPayload(token);
    return payload?.role || null;
}

export function getUserId() {
    const token = tokenUtils.getAccessToken();
    if (!token) return null;

    const payload = tokenUtils.getTokenPayload(token);
    return payload?.userId || payload?.id || null;
}

// Export default service object
export default {
    login,
    register,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    bootstrapAuth,
    getAccessToken,
    isAuthenticated,
    getUserRole,
    getUserId
};

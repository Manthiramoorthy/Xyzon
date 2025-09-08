import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
    (error) => {
        return Promise.reject(error);
    }
);

export const profileApi = {
    // Get user profile
    getProfile: () => api.get('/profile'),

    // Update user profile
    updateProfile: (profileData) => api.put('/profile', profileData),

    // Upload profile picture
    uploadProfilePicture: (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        return api.post('/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Delete profile picture
    deleteProfilePicture: () => api.delete('/profile/picture')
};

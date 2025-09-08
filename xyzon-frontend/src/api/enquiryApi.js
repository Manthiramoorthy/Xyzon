import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/enquiries`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
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

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const enquiryApi = {
    // Public API - Submit enquiry (no auth required)
    submitEnquiry: async (enquiryData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/enquiries/submit`, enquiryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Admin APIs - Require authentication
    getAllEnquiries: async (params = {}) => {
        try {
            const response = await apiClient.get('/', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getEnquiryById: async (id) => {
        try {
            const response = await apiClient.get(`/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateEnquiry: async (id, updateData) => {
        try {
            const response = await apiClient.put(`/${id}`, updateData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    sendResponse: async (id, responseData) => {
        try {
            const response = await apiClient.post(`/${id}/respond`, responseData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteEnquiry: async (id) => {
        try {
            const response = await apiClient.delete(`/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getEnquiryStats: async () => {
        try {
            const response = await apiClient.get('/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    bulkAction: async (actionData) => {
        try {
            const response = await apiClient.post('/bulk-action', actionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default enquiryApi;

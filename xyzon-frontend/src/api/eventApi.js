import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
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
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken
                    });
                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    error.config.headers.Authorization = `Bearer ${accessToken}`;
                    return api.request(error.config);
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('u');
                    // Only redirect if we're not already on login page
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                // Only redirect if we're not already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Event Management APIs
export const eventApi = {
    // Public event APIs
    getAllEvents: (params = {}) => api.get('/events', { params }),
    getEvent: (id) => api.get(`/events/${id}`),

    // Admin event APIs
    createEvent: (data) => api.post('/events', data),
    updateEvent: (id, data) => api.put(`/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/events/${id}`),
    getAdminEvents: (params = {}) => api.get('/events/admin/my-events', { params }),
    uploadEventImages: (formData) => api.post('/events/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Event statistics
    getEventStatistics: (id) => api.get(`/events/${id}/statistics`),
    getEventStats: (id) => api.get(`/events/${id}/stats`),

    // Event reminders
    sendEventReminders: (id) => api.post(`/events/${id}/send-reminders`),

    // Event registrations management
    getEventRegistrations: (id, params = {}) => api.get(`/events/${id}/registrations`, { params }),
    exportEventRegistrations: (id) => api.get(`/events/${id}/registrations/export`, { responseType: 'blob' }),

    // Certificate management
    getEventCertificates: (id) => api.get(`/events/${id}/certificates`),
    uploadCertificateTemplate: (id, formData) => api.post(`/events/${id}/certificate-template`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    issueCertificate: (eventId, registrationId) => api.post(`/events/${eventId}/registrations/${registrationId}/certificate`),
};

// Registration APIs
export const registrationApi = {
    registerForEvent: (eventId, data) => api.post(`/events/${eventId}/register`, data),
    getUserRegistrations: (params = {}) => api.get('/events/user/registrations', { params }),
    getEventRegistrations: (eventId, params = {}) => api.get(`/events/${eventId}/registrations`, { params }),
    markAttendance: (registrationId, data) => api.put(`/events/registrations/${registrationId}/attendance`, data),
    updateRegistrationStatus: (registrationId, data) => api.put(`/events/registrations/${registrationId}/status`, data),
    cancelRegistration: (registrationId) => api.delete(`/events/registrations/${registrationId}`),
};

// Payment APIs
export const paymentApi = {
    verifyPayment: (data) => api.post('/events/payment/verify', data),
    getPayment: (id) => api.get(`/payments/${id}`),
    getUserPayments: (params = {}) => api.get('/payments/user/my-payments', { params }),
    getEventPayments: (eventId, params = {}) => api.get(`/payments/event/${eventId}/payments`, { params }),
    refundPayment: (id, data) => api.post(`/payments/${id}/refund`, data),
    createRazorpayOrder: (data) => api.post('/payments/create-order', data),
};

// Certificate APIs
export const certificateApi = {
    // Certificate templates
    getTemplates: () => api.get('/events/certificate-templates'),

    // User certificates
    getUserCertificates: () => api.get('/events/user/certificates'),

    // Certificate management
    getCertificate: (id) => api.get(`/certificates/${id}`),
    viewCertificate: (certificateId) => api.get(`/events/certificates/${certificateId}/view`),
    downloadCertificate: (certificateId) => api.get(`/events/certificates/${certificateId}/download`),
    verifyCertificate: (code) => api.get(`/certificates/verify/${code}`),

    // Issue certificates
    issueCertificate: (registrationId, data = {}) => api.post(`/events/registrations/${registrationId}/certificate`, data),
    issueBulkCertificates: (eventId, data) => api.post(`/events/${eventId}/certificates/bulk`, data),

    // Event certificates
    getEventCertificates: (eventId, params = {}) => api.get(`/events/${eventId}/certificates`, { params }),
    getCertificate: (certificateId) => api.get(`/certificates/${certificateId}`),
    getCertificateByRegistration: (registrationId) => api.get(`/certificates/registration/${registrationId}`),
    revokeCertificate: (id) => api.put(`/certificates/${id}/revoke`),
    generateCertificatePreview: (data) => api.post('/certificates/preview', data),
};

export default api;

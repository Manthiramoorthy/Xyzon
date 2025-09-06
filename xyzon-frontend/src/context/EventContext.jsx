import React, { createContext, useContext, useState, useCallback } from 'react';
import { eventApi, registrationApi, paymentApi, certificateApi } from '../api/eventApi';

const EventContext = createContext(null);

export function EventProvider({ children }) {
    const [events, setEvents] = useState([]);
    const [userRegistrations, setUserRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEvents = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventApi.getAllEvents(params);
            setEvents(response.data.data.docs || response.data.data);
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch events');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvent = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventApi.getEvent(id);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch event');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const createEvent = useCallback(async (data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventApi.createEvent(data);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create event');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEvent = useCallback(async (id, data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventApi.updateEvent(id, data);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update event');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEvent = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);
            await eventApi.deleteEvent(id);
            setEvents(prev => prev.filter(event => event._id !== id));
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete event');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const registerForEvent = useCallback(async (eventId, data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await registrationApi.registerForEvent(eventId, data);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to register for event');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUserRegistrations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await registrationApi.getUserRegistrations();
            setUserRegistrations(response.data.data.docs || response.data.data);
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch registrations');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyPayment = useCallback(async (data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await paymentApi.verifyPayment(data);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Payment verification failed');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const createRazorpayOrder = useCallback(async (data) => {
        try {
            setLoading(true);
            setError(null);
            const response = await paymentApi.createRazorpayOrder(data);
            return response.data.data;
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create payment order');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        // State
        events,
        userRegistrations,
        loading,
        error,

        // Event operations
        fetchEvents,
        fetchEvent,
        createEvent,
        updateEvent,
        deleteEvent,

        // Registration operations
        registerForEvent,
        fetchUserRegistrations,

        // Payment operations
        verifyPayment,
        createRazorpayOrder,

        // Utilities
        clearError,
        setEvents,
        setUserRegistrations,
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
}

export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvent must be used within an EventProvider');
    }
    return context;
};

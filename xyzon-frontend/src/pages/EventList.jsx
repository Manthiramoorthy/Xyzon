import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import {
    FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag,
    FaSearch, FaFilter, FaStar, FaTicketAlt, FaGlobe, FaWifi,
    FaCheckCircle
} from 'react-icons/fa';

export const EventCard = ({ event, onRegister, userRegistrations = [] }) => {
    const isUpcoming = new Date(event.startDate) > new Date();
    const isRegistrationOpen = new Date(event.registrationEndDate) > new Date() &&
        new Date(event.registrationStartDate) <= new Date();

    // Check if user is registered for this event
    const isUserRegistered = userRegistrations.some(reg =>
        reg.event?._id === event._id || reg.eventId === event._id
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventModeIcon = (mode) => {
        switch (mode) {
            case 'online': return <FaWifi className="text-info" />;
            case 'offline': return <FaMapMarkerAlt className="text-warning" />;
            case 'hybrid': return <FaGlobe className="text-success" />;
            default: return <FaGlobe />;
        }
    };

    return (
        <div className="card shadow-sm h-100 event-card">
            {event.bannerUrl && (
                <img src={event.bannerUrl} alt={event.title} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} />
            )}
            <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge ${event.eventType === 'paid' ? 'bg-primary' : 'bg-success'} mb-2`}>
                        <FaTicketAlt className="me-1" />
                        {event.eventType === 'paid' ? `₹${event.price}` : 'Free'}
                    </span>
                    <div className="d-flex align-items-center">
                        {getEventModeIcon(event.eventMode)}
                        <small className="text-muted ms-1">{event.eventMode}</small>
                    </div>
                </div>

                <h5 className="card-title fw-bold">{event.title}</h5>
                <p className="card-text text-muted small flex-grow-1">
                    {event.shortDescription || event.description?.substring(0, 120) + '...'}
                </p>

                <div className="event-details mb-3">
                    <div className="d-flex align-items-center mb-2">
                        <FaCalendarAlt className="text-primary me-2" />
                        <small>{formatDate(event.startDate)}</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <FaClock className="text-info me-2" />
                        <small>{formatTime(event.startDate)} - {formatTime(event.endDate)}</small>
                    </div>
                    {event.eventMode !== 'online' && event.venue && (
                        <div className="d-flex align-items-center mb-2">
                            <FaMapMarkerAlt className="text-warning me-2" />
                            <small>{event.venue}</small>
                        </div>
                    )}
                    <div className="d-flex align-items-center mb-2">
                        <FaUsers className="text-success me-2" />
                        <small>{event.maxParticipants} participants max</small>
                    </div>
                    {event.category && (
                        <div className="d-flex align-items-center">
                            <FaTag className="text-secondary me-2" />
                            <small>{event.category}</small>
                        </div>
                    )}
                </div>

                {event.tags && event.tags.length > 0 && (
                    <div className="mb-3">
                        {event.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="badge bg-light text-dark me-1 small">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto">
                    {isUserRegistered ? (
                        <button className="btn btn-success w-100" disabled>
                            <FaCheckCircle className="me-2" />
                            Event Registered
                        </button>
                    ) : isRegistrationOpen && isUpcoming ? (
                        <button
                            className="btn btn-primary w-100"
                            onClick={() => onRegister(event)}
                        >
                            Register Now
                        </button>
                    ) : !isUpcoming ? (
                        <button className="btn btn-secondary w-100" disabled>
                            Event Completed
                        </button>
                    ) : (
                        <button className="btn btn-outline-secondary w-100" disabled>
                            Registration Closed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function EventList() {
    const { user } = useAuth();
    const { events, fetchEvents, userRegistrations, fetchUserRegistrations, loading, error } = useEvent();
    const [filters, setFilters] = useState({
        search: '',
        eventType: 'all',
        category: 'all',
        eventMode: 'all',
        status: 'published'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadEvents();
        // Fetch user registrations if user is logged in
        if (user) {
            fetchUserRegistrations().catch(console.error);
        }
    }, [filters, page, user]);

    const loadEvents = async () => {
        try {
            const params = {
                page,
                limit: 12,
                ...filters,
                ...(filters.search && { search: filters.search }),
                ...(filters.eventType !== 'all' && { eventType: filters.eventType }),
                ...(filters.category !== 'all' && { category: filters.category }),
                ...(filters.eventMode !== 'all' && { eventMode: filters.eventMode })
            };

            // Remove 'all' values
            Object.keys(params).forEach(key => {
                if (params[key] === 'all') delete params[key];
            });

            await fetchEvents(params);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleRegister = (event) => {
        // Navigate to registration page or open registration modal
        window.location.href = `/events/${event._id}/register`;
    };

    const categories = ['Technology', 'Business', 'Education', 'Health', 'Arts', 'Sports'];
    const eventModes = ['online', 'offline', 'hybrid'];

    if (loading && events.length === 0) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }


    // Separate upcoming and past events
    const now = new Date();
    const upcomingEvents = events && events.length > 0
        ? events.filter(ev => new Date(ev.startDate) > now)
        : [];
    const pastEvents = events && events.length > 0
        ? events.filter(ev => new Date(ev.startDate) <= now)
        : [];

    return (
        <div className="container py-4">
        
            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <FaSearch />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search events..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 text-end">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <FaFilter className="me-2" />
                                        Filters
                                    </button>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="row mt-3 pt-3 border-top">
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Event Type</label>
                                        <select
                                            className="form-select"
                                            value={filters.eventType}
                                            onChange={(e) => handleFilterChange('eventType', e.target.value)}
                                        >
                                            <option value="all">All Types</option>
                                            <option value="free">Free</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Category</label>
                                        <select
                                            className="form-select"
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Mode</label>
                                        <select
                                            className="form-select"
                                            value={filters.eventMode}
                                            onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                                        >
                                            <option value="all">All Modes</option>
                                            {eventModes.map(mode => (
                                                <option key={mode} value={mode}>
                                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3 d-flex align-items-end">
                                        <button
                                            className="btn btn-outline-secondary w-100"
                                            onClick={() => {
                                                setFilters({
                                                    search: '',
                                                    eventType: 'all',
                                                    category: 'all',
                                                    eventMode: 'all',
                                                    status: 'published'
                                                });
                                                setPage(1);
                                            }}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <div className="row">
                {upcomingEvents.length === 0 && !loading ? (
                    <div className="col-12 text-center py-5">
                        <FaCalendarAlt size={64} className="text-muted mb-3" />
                        <h4 className="text-muted">No upcoming events found</h4>
                        <p className="text-muted">Try adjusting your search criteria or check back later for new events.</p>
                    </div>
                ) : (
                    upcomingEvents.map(event => (
                        <div key={event._id} className="col-lg-4 col-md-6 mb-4">
                            <EventCard
                                event={event}
                                onRegister={handleRegister}
                                userRegistrations={userRegistrations}
                            />
                        </div>
                    ))
                )}
            </div>

            {loading && events.length > 0 && (
                <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading more events...</span>
                    </div>
                </div>
            )}

            {/* Past Events Section */}
            {pastEvents.length > 0 && (
                <div className="row mt-5">
                    <div className="col-12">
                        <h4 className="fw-bold mb-3 text-secondary">Past Events</h4>
                        <div className="row">
                            {pastEvents.map(ev => (
                                <div key={ev._id} className="col-lg-4 col-md-6 mb-4">
                                    <EventCard
                                        event={ev}
                                        onRegister={handleRegister}
                                        userRegistrations={userRegistrations}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

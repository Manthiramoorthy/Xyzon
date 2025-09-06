import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
    FaCalendarAlt, FaTicketAlt
} from 'react-icons/fa';
import { EventCard } from './EventList';

export default function UserRegistrations() {
    const { fetchUserRegistrations, userRegistrations, loading, error } = useEvent();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showAvailableEvents, setShowAvailableEvents] = useState(true);
    const { events, fetchEvents } = useEvent();
    const navigate = useNavigate();

    useEffect(() => {
        loadRegistrations();
        fetchEvents({ status: 'published' });
    }, []);

    const loadRegistrations = async () => {
        try {
            await fetchUserRegistrations();
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    };

    const filteredRegistrations = userRegistrations.filter(reg => {
        const matchesFilter = filter === 'all' || reg.status === filter;
        const matchesSearch =
            reg.event.title.toLowerCase().includes(search.toLowerCase()) ||
            (reg.event.shortDescription && reg.event.shortDescription.toLowerCase().includes(search.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const getUpcomingEvents = () => {
        return userRegistrations.filter(reg =>
            new Date(reg.event.startDate) > new Date() &&
            reg.status === 'registered'
        );
    };

    const getPastEvents = () => {
        return userRegistrations.filter(reg =>
            new Date(reg.event.startDate) <= new Date()
        );
    };

    const getCertificatesCount = () => {
        return userRegistrations.filter(reg => reg.certificate).length;
    };

    if (loading) {
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
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <h1 className="fw-bold mb-0">
                        <FaTicketAlt className="text-primary me-3" />
                        My Event Registrations
                    </h1>
                    <div className="d-flex gap-2 align-items-center mt-3 mt-md-0">
                        <input
                            type="text"
                            className="form-control"
                            style={{ minWidth: 220 }}
                            placeholder="Search your events..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body d-flex flex-wrap gap-2 align-items-center">
                            <span className="fw-bold me-2">Filter by:</span>
                            <select
                                className="form-select w-auto"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="registered">Registered</option>
                                <option value="attended">Attended</option>
                                <option value="absent">Absent</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <button className="btn btn-outline-secondary ms-auto" onClick={() => { setFilter('all'); setSearch(''); }}>Clear</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Registrations */}
            <div className="row">
                {filteredRegistrations.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <FaTicketAlt size={64} className="text-muted mb-3" />
                        <h4 className="text-muted">No registrations found</h4>
                        <p className="text-muted mb-4">
                            {filter === 'all' && !search
                                ? "You haven't registered for any events yet."
                                : `No registrations matching your criteria.`
                            }
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowAvailableEvents(true)}>
                            <FaCalendarAlt className="me-2" />
                            Show Available Events
                        </button>
                    </div>
                ) : (
                    filteredRegistrations.map(registration => (
                        <div key={registration._id} className="col-lg-4 col-md-6 mb-4">
                            <EventCard
                                event={registration.event}
                                userRegistrations={userRegistrations}
                                onRegister={() => { }}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Available Events to Register */}
            {showAvailableEvents && (
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h5 className="card-title mb-3">Available Events to Register</h5>
                                <div className="row">
                                    {(() => {
                                        const availableEvents = upcomingEvents && upcomingEvents.length > 0
                                            ? upcomingEvents.filter(ev => !userRegistrations.some(reg => reg.event._id === ev._id))
                                            : [];
                                        if (availableEvents.length === 0) {
                                            return (
                                                <div className="col-12 text-center text-muted py-4">
                                                    No available events to register.
                                                </div>
                                            );
                                        }
                                        return availableEvents.map(ev => (
                                            <div key={ev._id} className="col-lg-4 col-md-6 mb-4">
                                                <div className="card h-100 shadow-sm">
                                                    {ev.bannerUrl && (
                                                        <img src={ev.bannerUrl} alt={ev.title} className="card-img-top" style={{ height: '160px', objectFit: 'cover' }} />
                                                    )}
                                                    <div className="card-body d-flex flex-column">
                                                        <h5 className="card-title fw-bold">{ev.title}</h5>
                                                        <p className="card-text text-muted small flex-grow-1">{ev.shortDescription || ev.description?.substring(0, 100) + '...'}</p>
                                                        <div className="mb-2">
                                                            <FaCalendarAlt className="text-primary me-2" />
                                                            <small>{new Date(ev.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
                                                        </div>
                                                        <button className="btn btn-primary w-100 mt-auto" onClick={() => navigate(`/events/${ev._id}/register`)}>
                                                            Register
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
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
                                        userRegistrations={userRegistrations}
                                        onRegister={() => { }}
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

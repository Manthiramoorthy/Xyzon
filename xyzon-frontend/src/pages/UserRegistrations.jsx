import React, { useState, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { Link } from 'react-router-dom';
import {
    FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt,
    FaCertificate, FaEye, FaDownload, FaCheck, FaTimes
} from 'react-icons/fa';

const RegistrationCard = ({ registration }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            registered: { color: 'bg-primary', icon: FaTicketAlt },
            attended: { color: 'bg-success', icon: FaCheck },
            absent: { color: 'bg-danger', icon: FaTimes },
            cancelled: { color: 'bg-secondary', icon: FaTimes }
        };

        const config = statusConfig[status] || statusConfig.registered;
        const IconComponent = config.icon;

        return (
            <span className={`badge ${config.color}`}>
                <IconComponent className="me-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentStatusBadge = (payment) => {
        if (!payment) return null;

        const statusConfig = {
            paid: { color: 'bg-success', text: 'Paid' },
            failed: { color: 'bg-danger', text: 'Failed' },
            pending: { color: 'bg-warning', text: 'Pending' },
            refunded: { color: 'bg-info', text: 'Refunded' }
        };

        const config = statusConfig[payment.status] || statusConfig.pending;

        return (
            <span className={`badge ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="card shadow-sm h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title fw-bold mb-0">{registration.event.title}</h5>
                    {getStatusBadge(registration.status)}
                </div>

                <div className="event-details mb-3">
                    <div className="d-flex align-items-center mb-2">
                        <FaCalendarAlt className="text-primary me-2" />
                        <small>{formatDate(registration.event.startDate)}</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                        <FaClock className="text-info me-2" />
                        <small>{formatTime(registration.event.startDate)}</small>
                    </div>
                    {registration.event.venue && (
                        <div className="d-flex align-items-center mb-2">
                            <FaMapMarkerAlt className="text-warning me-2" />
                            <small>{registration.event.venue}</small>
                        </div>
                    )}
                </div>

                {registration.payment && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted small">Payment:</span>
                        <div>
                            {getPaymentStatusBadge(registration.payment)}
                            <span className="ms-2 fw-bold">₹{registration.payment.amount}</span>
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">Registered:</span>
                    <span className="small">{formatDate(registration.registrationDate)}</span>
                </div>

                {registration.certificate && (
                    <div className="alert alert-success py-2">
                        <FaCertificate className="text-success me-2" />
                        <small>Certificate available</small>
                        <button
                            className="btn btn-sm btn-outline-success ms-2"
                            onClick={() => window.open(`/certificates/${registration.certificate.id}`, '_blank')}
                        >
                            <FaDownload className="me-1" />
                            Download
                        </button>
                    </div>
                )}

                <div className="d-flex gap-2">
                    <Link
                        to={`/events/${registration.event._id}`}
                        className="btn btn-outline-primary btn-sm flex-grow-1"
                    >
                        <FaEye className="me-1" />
                        View Event
                    </Link>
                    {registration.event.eventMode === 'online' && registration.event.eventLink &&
                        registration.status === 'registered' && new Date(registration.event.startDate) > new Date() && (
                            <a
                                href={registration.event.eventLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                            >
                                Join Event
                            </a>
                        )}
                </div>
            </div>
        </div>
    );
};

export default function UserRegistrations() {
    const { fetchUserRegistrations, userRegistrations, loading, error } = useEvent();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadRegistrations();
    }, []);

    const loadRegistrations = async () => {
        try {
            await fetchUserRegistrations();
        } catch (error) {
            console.error('Error loading registrations:', error);
        }
    };

    const filteredRegistrations = userRegistrations.filter(reg => {
        if (filter === 'all') return true;
        return reg.status === filter;
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

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h1 className="fw-bold mb-4">
                        <FaTicketAlt className="text-primary me-3" />
                        My Event Registrations
                    </h1>

                    {/* Statistics */}
                    <div className="d-none row mb-4">
                        <div className="col-md-3 col-6 mb-3">
                            <div className="card bg-primary text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{userRegistrations.length}</h3>
                                    <small>Total Registrations</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-3">
                            <div className="card bg-success text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{getUpcomingEvents().length}</h3>
                                    <small>Upcoming Events</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-3">
                            <div className="card bg-info text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{getPastEvents().length}</h3>
                                    <small>Past Events</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-3">
                            <div className="card bg-warning text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{getCertificatesCount()}</h3>
                                    <small>Certificates</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="d-flex flex-wrap gap-2">
                                <button
                                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilter('all')}
                                >
                                    All ({userRegistrations.length})
                                </button>
                                <button
                                    className={`btn ${filter === 'registered' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilter('registered')}
                                >
                                    Registered ({userRegistrations.filter(r => r.status === 'registered').length})
                                </button>
                                <button
                                    className={`btn ${filter === 'attended' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilter('attended')}
                                >
                                    Attended ({userRegistrations.filter(r => r.status === 'attended').length})
                                </button>
                                <button
                                    className={`btn ${filter === 'absent' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilter('absent')}
                                >
                                    Absent ({userRegistrations.filter(r => r.status === 'absent').length})
                                </button>
                            </div>
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
                            {filter === 'all'
                                ? "You haven't registered for any events yet."
                                : `No registrations with status "${filter}" found.`
                            }
                        </p>
                        <Link to="/events" className="btn btn-primary">
                            <FaCalendarAlt className="me-2" />
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    filteredRegistrations.map(registration => (
                        <div key={registration._id} className="col-lg-4 col-md-6 mb-4">
                            <RegistrationCard registration={registration} />
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="row mt-5">
                <div className="col-12">
                    <div className="card bg-light">
                        <div className="card-body text-center">
                            <h5 className="card-title">Looking for more events?</h5>
                            <p className="card-text text-muted">
                                Discover amazing events and expand your knowledge with our community.
                            </p>
                            <Link to="/events" className="btn btn-primary">
                                <FaCalendarAlt className="me-2" />
                                Browse Events
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

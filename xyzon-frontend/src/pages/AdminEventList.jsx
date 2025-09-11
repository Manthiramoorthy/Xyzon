import React, { useState, useEffect } from 'react';
import { eventApi } from '../api/eventApi';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ICONS from '../constants/icons';
import {
    FaUsers, FaCalendarAlt,
    FaChartBar, FaEnvelope, FaCertificate, FaTicketAlt,
    FaPlus
} from 'react-icons/fa';

const EventCard = ({ event, onEdit, onDelete, onViewStats, onSendReminders }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-secondary', text: 'Draft' },
            published: { color: 'bg-success', text: 'Published' },
            cancelled: { color: 'bg-danger', text: 'Cancelled' },
            completed: { color: 'bg-info', text: 'Completed' }
        };

        const config = statusConfig[status] || statusConfig.draft;

        return (
            <span className={`badge ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const isUpcoming = new Date(event.startDate) > new Date();

    return (
        <div className="card shadow-sm h-100">
            {event.bannerUrl && (
                <img
                    src={event.bannerUrl}
                    alt={event.title}
                    className="card-img-top"
                    style={{ height: '150px', objectFit: 'cover' }}
                />
            )}
            <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title fw-bold mb-0">{event.title}</h6>
                    {getStatusBadge(event.status)}
                </div>

                <p className="card-text text-muted small flex-grow-1">
                    {event.shortDescription || event.description?.substring(0, 100) + '...'}
                </p>

                <div className="event-meta mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(event.startDate)}
                        </small>
                        <span className={`badge ${event.eventType === 'paid' ? 'bg-primary' : 'bg-success'}`}>
                            <FaTicketAlt className="me-1" />
                            {event.eventType === 'paid' ? `₹${event.price}` : 'Free'}
                        </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                            <FaUsers className="me-1" />
                            {event.registrationCount || 0}/{event.maxParticipants}
                        </small>
                        <small className="text-muted text-capitalize">{event.eventMode}</small>
                    </div>
                </div>

                <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-1 justify-content-center">
                        <Link
                            to={`/events/${event._id}`}
                            className="btn btn-outline-primary btn-sm flex-fill"
                        >
                            <ICONS.VIEW className="me-1" />
                            <span className="d-none d-sm-inline">View</span>
                        </Link>
                        <button
                            className="btn btn-outline-secondary btn-sm flex-fill"
                            onClick={() => onEdit(event)}
                        >
                            <ICONS.EDIT className="me-1" />
                            <span className="d-none d-sm-inline">Edit</span>
                        </button>
                        <button
                            className="btn btn-outline-info btn-sm flex-fill"
                            onClick={() => onViewStats(event)}
                        >
                            <FaChartBar className="me-1" />
                            <span className="d-none d-sm-inline">Stats</span>
                        </button>
                    </div>

                    <div className="d-flex gap-1 justify-content-center">
                        <Link
                            to={`/admin/events/${event._id}/registrations`}
                            className="btn btn-outline-success btn-sm flex-fill"
                        >
                            <FaUsers className="me-1" />
                            <span className="d-none d-sm-inline">Registrations</span>
                        </Link>
                        <Link
                            to={`/admin/events/${event._id}/certificates`}
                            className="btn btn-outline-info btn-sm flex-fill"
                        >
                            <FaCertificate className="me-1" />
                            <span className="d-none d-sm-inline">Certificates</span>
                        </Link>
                    </div>

                    <div className="d-flex gap-1 justify-content-center">
                        {isUpcoming && (
                            <button
                                className="btn btn-outline-warning btn-sm flex-fill"
                                onClick={() => onSendReminders(event)}
                            >
                                <FaEnvelope className="me-1" />
                                <span className="d-none d-sm-inline">Remind</span>
                            </button>
                        )}
                        <button
                            className="btn btn-outline-danger btn-sm flex-fill"
                            onClick={() => onDelete(event)}
                        >
                            <ICONS.DELETE className="me-1" />
                            <span className="d-none d-sm-inline">Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AdminEventList() {
    const { toast, confirm } = useToast();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        eventType: 'all'
    });

    useEffect(() => {
        loadEvents();
    }, [filters]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: 1,
                limit: 50,
                ...(filters.search && { search: filters.search }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.eventType !== 'all' && { eventType: filters.eventType })
            };

            const response = await eventApi.getAdminEvents(params);
            setEvents(response.data.data.docs || response.data.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleEdit = (event) => {
        window.location.href = `/admin/events/${event._id}/edit`;
    };

    const handleDelete = async (event) => {
        const confirmed = await confirm(`Are you sure you want to delete "${event.title}"?`);
        if (confirmed) {
            try {
                await eventApi.deleteEvent(event._id);
                setEvents(prev => prev.filter(e => e._id !== event._id));
                toast.success('Event deleted successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete event');
            }
        }
    };

    const handleViewStats = (event) => {
        window.location.href = `/admin/events/${event._id}/stats`;
    };

    const handleSendReminders = async (event) => {
        const confirmed = await confirm(`Send reminder emails to all registered participants for "${event.title}"?`);
        if (confirmed) {
            try {
                await eventApi.sendEventReminders(event._id);
                toast.success('Reminder emails sent successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to send reminders');
            }
        }
    };

    const getStatsOverview = () => {
        const totalEvents = events.length;
        const publishedEvents = events.filter(e => e.status === 'published').length;
        const upcomingEvents = events.filter(e =>
            e.status === 'published' && new Date(e.startDate) > new Date()
        ).length;
        const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

        return { totalEvents, publishedEvents, upcomingEvents, totalRegistrations };
    };

    const stats = getStatsOverview();

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

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <h1 className="fw-bold mb-0 h4 h-md-1">
                            <FaCalendarAlt className="text-primary me-2 me-md-3" />
                            My Events
                        </h1>
                        <Link to="/admin/events/create" className="btn btn-primary">
                            <ICONS.ADD className="me-1 me-md-2" />
                            <span className="d-none d-sm-inline">Create </span>Event
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-lg-6 col-md-12">
                                    <SearchBar
                                        value={filters.search}
                                        onChange={(value) => handleFilterChange('search', value)}
                                        placeholder="Search events..."
                                        onClear={() => handleFilterChange('search', '')}
                                    />
                                </div>
                                <div className="col-lg-3 col-md-6">
                                    <select
                                        className="form-select"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="col-lg-3 col-md-6">
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

            {/* Events Grid */}
            <div className="row">
                {events.length === 0 && !loading ? (
                    <div className="col-12 text-center py-5">
                        <FaCalendarAlt size={64} className="text-muted mb-3" />
                        <h4 className="text-muted">No events found</h4>
                        <p className="text-muted mb-4">Create your first event to get started.</p>
                        <Link to="/admin/events/create" className="btn btn-primary">
                            <FaPlus className="me-2" />
                            Create Your First Event
                        </Link>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event._id} className="col-xl-4 col-lg-6 col-md-6 mb-4">
                            <EventCard
                                event={event}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewStats={handleViewStats}
                                onSendReminders={handleSendReminders}
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
        </div>
    );
}

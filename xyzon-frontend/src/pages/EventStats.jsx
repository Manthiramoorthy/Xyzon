import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import {
    FaArrowLeft, FaUsers, FaMoneyBillWave, FaChartLine,
    FaCalendarAlt, FaTicketAlt, FaUserCheck, FaClock
} from 'react-icons/fa';

export default function EventStats() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEventStats();
    }, [id]);

    const loadEventStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load event details
            const eventResponse = await eventApi.getEvent(id);
            setEvent(eventResponse.data.data);

            // Load event statistics
            try {
                const statsResponse = await eventApi.getEventStats(id);
                setStats(statsResponse.data.data);
            } catch (statsError) {
                console.warn('Stats not available:', statsError);
                setStats({
                    totalRegistrations: 0,
                    totalRevenue: 0,
                    attendanceRate: 0,
                    registrationTrend: []
                });
            }

            // Load registrations
            try {
                const regResponse = await eventApi.getEventRegistrations(id);
                setRegistrations(regResponse.data.data.docs || regResponse.data.data || []);
            } catch (regError) {
                console.warn('Registrations not available:', regError);
                setRegistrations([]);
            }

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load event statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
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

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <Link to="/admin/events" className="btn btn-primary">
                    <FaArrowLeft className="me-2" />
                    Back to Events
                </Link>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning" role="alert">
                    Event not found
                </div>
                <Link to="/admin/events" className="btn btn-primary">
                    <FaArrowLeft className="me-2" />
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex align-items-center mb-4">
                <Link to="/admin/events" className="btn btn-outline-primary me-3">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="fw-bold mb-1">{event.title}</h1>
                    <small className="text-muted">Event Statistics & Analytics</small>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row mb-4">
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                            <FaUsers size={24} className="mb-2" />
                            <h3 className="fw-bold">{registrations.length}</h3>
                            <small>Total Registrations</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-success text-white">
                        <div className="card-body text-center">
                            <FaMoneyBillWave size={24} className="mb-2" />
                            <h3 className="fw-bold">
                                {event.eventType === 'paid' ?
                                    formatCurrency((stats?.totalRevenue || 0)) :
                                    'Free'
                                }
                            </h3>
                            <small>Total Revenue</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-info text-white">
                        <div className="card-body text-center">
                            <FaUserCheck size={24} className="mb-2" />
                            <h3 className="fw-bold">{stats?.attendanceRate || 0}%</h3>
                            <small>Attendance Rate</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body text-center">
                            <FaTicketAlt size={24} className="mb-2" />
                            <h3 className="fw-bold">{event.maxParticipants - registrations.length}</h3>
                            <small>Available Spots</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details */}
            <div className="row mb-4">
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <FaCalendarAlt className="me-2" />
                                Event Information
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-sm-6 mb-3">
                                    <strong>Event Type:</strong>
                                    <br />
                                    <span className={`badge ${event.eventType === 'paid' ? 'bg-primary' : 'bg-success'}`}>
                                        {event.eventType === 'paid' ? `Paid (${formatCurrency(event.price)})` : 'Free'}
                                    </span>
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <strong>Mode:</strong>
                                    <br />
                                    <span className="badge bg-info text-capitalize">{event.eventMode}</span>
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <strong>Start Date:</strong>
                                    <br />
                                    {formatDate(event.startDate)}
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <strong>End Date:</strong>
                                    <br />
                                    {formatDate(event.endDate)}
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <strong>Registration Period:</strong>
                                    <br />
                                    <small>
                                        {formatDate(event.registrationStartDate)} - {formatDate(event.registrationEndDate)}
                                    </small>
                                </div>
                                <div className="col-sm-6 mb-3">
                                    <strong>Category:</strong>
                                    <br />
                                    <span className="badge bg-secondary">{event.category}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <FaChartLine className="me-2" />
                                Quick Actions
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link
                                    to={`/admin/events/${id}/registrations`}
                                    className="btn btn-outline-primary"
                                >
                                    <FaUsers className="me-2" />
                                    View All Registrations
                                </Link>
                                <Link
                                    to={`/admin/events/${id}/certificates`}
                                    className="btn btn-outline-success"
                                >
                                    <FaTicketAlt className="me-2" />
                                    Manage Certificates
                                </Link>
                                <Link
                                    to={`/admin/events/${id}/edit`}
                                    className="btn btn-outline-secondary"
                                >
                                    Edit Event Details
                                </Link>
                                <Link
                                    to={`/events/${id}`}
                                    className="btn btn-outline-info"
                                >
                                    View Public Event Page
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Registrations */}
            {registrations.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <FaClock className="me-2" />
                            Recent Registrations
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Registered On</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.slice(0, 5).map(registration => (
                                        <tr key={registration._id}>
                                            <td>{registration.name}</td>
                                            <td>{registration.email}</td>
                                            <td>{registration.phone}</td>
                                            <td>{formatDate(registration.createdAt)}</td>
                                            <td>
                                                <span className={`badge ${registration.paymentStatus === 'completed' ? 'bg-success' :
                                                        registration.paymentStatus === 'pending' ? 'bg-warning' : 'bg-success'
                                                    }`}>
                                                    {registration.paymentStatus || 'Registered'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {registrations.length > 5 && (
                            <div className="text-center mt-3">
                                <Link
                                    to={`/admin/events/${id}/registrations`}
                                    className="btn btn-primary btn-sm"
                                >
                                    View All {registrations.length} Registrations
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

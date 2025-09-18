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
    const [exporting, setExporting] = useState(false);
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
                const statsResponse = await eventApi.getEventStatistics(id);
                setStats(statsResponse.data.data);
            } catch (statsError) {
                console.warn('Stats not available:', statsError);
                setStats(null);
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

    const downloadCsv = async () => {
        try {
            setExporting(true);
            const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/events/${id}/statistics/export`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-${id}-statistics.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally { setExporting(false); }
    };

    const fmt = (n, currency = false) => {
        if (currency) return formatCurrency(n || 0);
        return (n || 0).toLocaleString();
    };

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
            {stats && (
                <div className="row mb-4 g-3">
                    <div className="col-6 col-lg-3">
                        <div className="card h-100 bg-primary text-white"><div className="card-body text-center"><FaUsers className="mb-2" /><h3 className="fw-bold mb-0">{fmt(stats.stats.totalRegistrations)}</h3><small>Total Registrations</small></div></div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card h-100 bg-success text-white"><div className="card-body text-center"><FaMoneyBillWave className="mb-2" /><h3 className="fw-bold mb-0">{event.eventType === 'paid' ? formatCurrency(stats.stats.revenue) : 'Free'}</h3><small>Net Revenue</small></div></div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card h-100 bg-info text-white"><div className="card-body text-center"><FaUserCheck className="mb-2" /><h3 className="fw-bold mb-0">{stats.stats.attendanceRate}%</h3><small>Attendance Rate</small></div></div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card h-100 bg-warning text-white"><div className="card-body text-center"><FaTicketAlt className="mb-2" /><h3 className="fw-bold mb-0">{event.maxParticipants - stats.stats.totalRegistrations}</h3><small>Available Spots</small></div></div>
                    </div>
                </div>
            )}

            {stats && (
                <div className="mb-4 d-flex flex-wrap gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={downloadCsv} disabled={exporting}>{exporting ? 'Exporting...' : 'Download CSV Report'}</button>
                </div>
            )}

            {/* Event Details & Analytics */}
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

            {/* Payment & Registration Analytics */}
            {stats && (
                <div className="row mb-4 g-4">
                    <div className="col-lg-6">
                        <div className="card h-100">
                            <div className="card-header"><h6 className="mb-0">Registration Status</h6></div>
                            <div className="card-body small">
                                {Object.keys(stats.stats.registrationStatus || {}).length === 0 && <div className="text-muted">No registrations yet</div>}
                                <ul className="list-unstyled mb-0">
                                    {Object.entries(stats.stats.registrationStatus || {}).map(([k, v]) => <li key={k} className="d-flex justify-content-between border-bottom py-1"><span className="text-capitalize">{k}</span><span className="fw-semibold">{v}</span></li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card h-100">
                            <div className="card-header"><h6 className="mb-0">Payment Status</h6></div>
                            <div className="card-body small">
                                {Object.keys(stats.stats.paymentStatus || {}).length === 0 && <div className="text-muted">No payments yet</div>}
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle mb-0">
                                        <thead><tr><th>Status</th><th className="text-end">Count</th><th className="text-end">Amount</th><th className="text-end">Discount</th></tr></thead>
                                        <tbody>
                                            {Object.entries(stats.stats.paymentStatus || {}).map(([k, v]) => (
                                                <tr key={k}><td className="text-capitalize">{k}</td><td className="text-end">{v.count}</td><td className="text-end">{event.eventType === 'paid' ? formatCurrency(v.amount) : '-'}</td><td className="text-end">{v.discount ? formatCurrency(v.discount) : '-'}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card h-100">
                            <div className="card-header"><h6 className="mb-0">Payment Methods</h6></div>
                            <div className="card-body small">
                                {(stats.stats.paymentMethods || []).length === 0 && <div className="text-muted">No paid payments yet</div>}
                                <ul className="list-unstyled mb-0">
                                    {(stats.stats.paymentMethods || []).map(m => <li key={m.method} className="d-flex justify-content-between border-bottom py-1"><span className="text-uppercase">{m.method}</span><span>{m.count} ({formatCurrency(m.amount)})</span></li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card h-100">
                            <div className="card-header"><h6 className="mb-0">Top Coupons</h6></div>
                            <div className="card-body small">
                                {(stats.stats.coupons || []).length === 0 && <div className="text-muted">No coupons used</div>}
                                <ul className="list-unstyled mb-0">
                                    {(stats.stats.coupons || []).slice(0, 6).map(c => <li key={c.code} className="d-flex justify-content-between border-bottom py-1"><span>{c.code}</span><span>{c.uses} uses / {formatCurrency(c.discount)} saved</span></li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header"><h6 className="mb-0">30-Day Trend (Registrations & Revenue)</h6></div>
                            <div className="card-body small">
                                {/* Placeholder simple trend representation */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="text-muted">Registrations</h6>
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            <table className="table table-sm mb-0">
                                                <thead><tr><th>Date</th><th className="text-end">Count</th></tr></thead>
                                                <tbody>{(stats.stats.dailyRegistrations || []).map(d => <tr key={d.date}><td>{d.date}</td><td className="text-end">{d.count}</td></tr>)}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="text-muted">Revenue</h6>
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            <table className="table table-sm mb-0">
                                                <thead><tr><th>Date</th><th className="text-end">Amount</th><th className="text-end">Count</th></tr></thead>
                                                <tbody>{(stats.stats.dailyRevenue || []).map(d => <tr key={d.date}><td>{d.date}</td><td className="text-end">{formatCurrency(d.amount)}</td><td className="text-end">{d.count}</td></tr>)}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-muted mt-2 small">(Integrate a chart library like Chart.js or Recharts here later.)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

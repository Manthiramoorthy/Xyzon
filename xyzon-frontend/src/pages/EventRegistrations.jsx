import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventApi, registrationApi, certificateApi } from '../api/eventApi';
import {
    FaArrowLeft, FaUsers, FaDownload, FaEnvelope, FaCertificate,
    FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaClock,
    FaEdit, FaTrash, FaEye, FaUserCheck, FaUserTimes, FaSpinner
} from 'react-icons/fa';

export default function EventRegistrations() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        paymentStatus: 'all',
        attendanceStatus: 'all'
    });
    const [issuingCertificate, setIssuingCertificate] = useState(null);
    const [exportingCsv, setExportingCsv] = useState(false);

    useEffect(() => {
        loadData();
    }, [id, filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load event details
            const eventResponse = await eventApi.getEvent(id);
            setEvent(eventResponse.data.data);

            // Load registrations with filters
            const params = {
                ...(filters.search && { search: filters.search }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.paymentStatus !== 'all' && { paymentStatus: filters.paymentStatus }),
                ...(filters.attendanceStatus !== 'all' && { attendanceStatus: filters.attendanceStatus })
            };

            try {
                const regResponse = await eventApi.getEventRegistrations(id, params);
                setRegistrations(regResponse.data.data.docs || regResponse.data.data || []);
            } catch (regError) {
                console.warn('Registrations API not available, using mock data');
                setRegistrations([]);
            }

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load event registrations');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const exportRegistrations = async (exportType = 'all') => {
        setExportingCsv(true);
        try {
            // Filter registrations based on export type
            let dataToExport = registrations;
            let filenameSuffix = '';

            switch (exportType) {
                case 'attended':
                    dataToExport = registrations.filter(r => r.status === 'attended');
                    filenameSuffix = '-attended';
                    break;
                case 'pending':
                    dataToExport = registrations.filter(r => r.status !== 'attended' && r.status !== 'cancelled');
                    filenameSuffix = '-pending';
                    break;
                case 'cancelled':
                    dataToExport = registrations.filter(r => r.status === 'cancelled');
                    filenameSuffix = '-cancelled';
                    break;
                case 'all':
                default:
                    dataToExport = registrations;
                    filenameSuffix = '';
                    break;
            }

            // First try the backend API
            try {
                const response = await eventApi.exportEventRegistrations(id);
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}${filenameSuffix}-registrations.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return;
            } catch (backendError) {
                console.warn('Backend export not available, generating CSV on frontend:', backendError.message);
            }

            // Fallback: Generate CSV on frontend
            if (dataToExport.length === 0) {
                alert(`No ${exportType === 'all' ? '' : exportType + ' '}registrations to export`);
                return;
            }

            // Define CSV headers
            const headers = [
                'Name',
                'Email',
                'Phone',
                'Organization',
                'Registration Date',
                'Payment Status',
                'Attendance Status',
                'Status'
            ];

            // Generate CSV data
            const csvData = dataToExport.map(registration => {
                return [
                    `"${registration.name || ''}"`,
                    `"${registration.email || ''}"`,
                    `"${registration.phone || ''}"`,
                    `"${registration.organization || registration.college || ''}"`,
                    `"${formatDateForCsv(registration.createdAt)}"`,
                    `"${getPaymentStatusText(registration)}"`,
                    `"${getAttendanceStatusText(registration)}"`,
                    `"${registration.status || 'registered'}"`
                ].join(',');
            });

            // Combine headers and data
            const csvContent = [
                headers.map(header => `"${header}"`).join(','),
                ...csvData
            ].join('\n');

            // Create and download the CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}${filenameSuffix}-registrations-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Show success message
            const exportTypeText = exportType === 'all' ? 'all' : exportType;
            alert(`Successfully exported ${dataToExport.length} ${exportTypeText} registrations to CSV`);

        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export registrations: ' + (error.message || 'Unknown error'));
        } finally {
            setExportingCsv(false);
        }
    };

    const sendReminderEmails = async () => {
        if (window.confirm('Send reminder emails to all registered participants?')) {
            try {
                await eventApi.sendEventReminders(id);
                alert('Reminder emails sent successfully!');
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to send reminder emails');
            }
        }
    };

    const markAttendance = async (registrationId, status) => {
        try {
            await registrationApi.updateRegistrationStatus(registrationId, {
                status: status,
                method: 'manual'
            });
            // Reload registrations to see updated status
            loadData();
            alert(`Status updated to ${status}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const issueCertificate = async (registrationId) => {
        setIssuingCertificate(registrationId);
        try {
            await certificateApi.issueCertificate(registrationId);
            alert('Certificate issued successfully!');
            loadData(); // Reload data
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to issue certificate');
        } finally {
            setIssuingCertificate(null);
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

    const formatDateForCsv = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getAttendanceStatusText = (registration) => {
        const status = registration.status || 'registered';
        switch (status) {
            case 'attended': return 'Attended';
            case 'absent': return 'Absent';
            case 'cancelled': return 'Cancelled';
            default: return 'Registered';
        }
    };

    const getPaymentStatusText = (registration) => {
        if (event.eventType === 'free') return 'Free Event';
        const paymentStatus = registration.paymentStatus;
        switch (paymentStatus) {
            case 'completed': return 'Completed';
            case 'pending': return 'Pending';
            case 'failed': return 'Failed';
            default: return 'Unknown';
        }
    };

    const getStatusBadge = (registration) => {
        // First check attendance status
        const status = registration.status || 'registered';

        if (status === 'attended') {
            return <span className="badge bg-success"><FaCheckCircle className="me-1" />Attended</span>;
        } else if (status === 'absent') {
            return <span className="badge bg-danger"><FaTimesCircle className="me-1" />Absent</span>;
        } else if (status === 'cancelled') {
            return <span className="badge bg-secondary"><FaTimesCircle className="me-1" />Cancelled</span>;
        }

        // If not attended/absent/cancelled, check payment status
        if (registration.paymentStatus === 'completed' || event.eventType === 'free') {
            return <span className="badge bg-primary"><FaClock className="me-1" />Registered</span>;
        } else if (registration.paymentStatus === 'pending') {
            return <span className="badge bg-warning">Pending Payment</span>;
        } else if (registration.paymentStatus === 'failed') {
            return <span className="badge bg-danger">Payment Failed</span>;
        }
        return <span className="badge bg-secondary">Registered</span>;
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
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                    <div>
                        <h1 className="fw-bold mb-1 h4 h-md-1">{event.title}</h1>
                        <small className="text-muted">Event Registrations</small>
                    </div>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                    <div className="btn-group">
                        <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => exportRegistrations('all')}
                            disabled={exportingCsv || registrations.length === 0}
                        >
                            {exportingCsv ? (
                                <>
                                    <FaSpinner className="spinner-border spinner-border-sm me-1" />
                                    <span className="d-none d-md-inline">Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <FaDownload className="me-1" />
                                    <span className="d-none d-md-inline">Export </span>CSV
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            disabled={exportingCsv || registrations.length === 0}
                        >
                            <span className="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); exportRegistrations('all'); }}>All Registrations</a></li>
                            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); exportRegistrations('attended'); }}>Attended Only</a></li>
                            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); exportRegistrations('pending'); }}>Pending Only</a></li>
                            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); exportRegistrations('cancelled'); }}>Cancelled Only</a></li>
                        </ul>
                    </div>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={sendReminderEmails}
                    >
                        <FaEnvelope className="me-1" />
                        <span className="d-none d-md-inline">Send </span>Reminders
                    </button>
                    <Link
                        to={`/admin/events/${id}/certificates`}
                        className="btn btn-primary btn-sm"
                    >
                        <FaCertificate className="me-1" />
                        <span className="d-none d-sm-inline">Certificates</span>
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-primary text-white text-center">
                        <div className="card-body py-3">
                            <h3 className="fw-bold mb-1">{registrations.length}</h3>
                            <small>Total Registrations</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-success text-white text-center">
                        <div className="card-body py-3">
                            <h3 className="fw-bold mb-1">
                                {registrations.filter(r => r.status === 'attended').length}
                            </h3>
                            <small>Attended</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-warning text-white text-center">
                        <div className="card-body py-3">
                            <h3 className="fw-bold mb-1">
                                {registrations.filter(r => (r.paymentStatus === 'completed' || event.eventType === 'free') && r.status !== 'attended' && r.status !== 'cancelled').length}
                            </h3>
                            <small>Registered</small>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card bg-info text-white text-center">
                        <div className="card-body py-3">
                            <h3 className="fw-bold mb-1">{Math.max(0, event.maxParticipants - registrations.length)}</h3>
                            <small>Available Spots</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-lg-6 col-md-12">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <FaSearch />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name, email, or phone..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-4 col-sm-6">
                            <select
                                className="form-select"
                                value={filters.paymentStatus}
                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                            >
                                <option value="all">All Payment Status</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="col-lg-2 col-md-4 col-sm-6">
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="col-lg-2 col-md-4">
                            <select
                                className="form-select"
                                value={filters.attendanceStatus}
                                onChange={(e) => handleFilterChange('attendanceStatus', e.target.value)}
                            >
                                <option value="all">All Attendance</option>
                                <option value="registered">Registered</option>
                                <option value="attended">Attended</option>
                                <option value="absent">Absent</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registrations Table */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <FaUsers className="me-2" />
                        Registered Participants ({registrations.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {registrations.length === 0 ? (
                        <div className="text-center py-5">
                            <FaUsers size={64} className="text-muted mb-3" />
                            <h5 className="text-muted">No registrations yet</h5>
                            <p className="text-muted">Participants will appear here once they register for the event.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Participant</th>
                                        <th className="d-none d-lg-table-cell">Contact</th>
                                        <th className="d-none d-md-table-cell">Registration Date</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(registration => (
                                        <tr key={registration._id || Math.random()}>
                                            <td>
                                                <div>
                                                    <strong>{registration.name}</strong>
                                                    {registration.organization && (
                                                        <div><small className="text-muted">{registration.organization}</small></div>
                                                    )}
                                                    {/* Mobile: Show contact info */}
                                                    <div className="d-lg-none mt-1">
                                                        <small className="text-muted d-block">{registration.email}</small>
                                                        {registration.phone && (
                                                            <small className="text-muted">{registration.phone}</small>
                                                        )}
                                                    </div>
                                                    {/* Mobile: Show registration date */}
                                                    <div className="d-md-none mt-1">
                                                        <small className="text-muted">
                                                            Registered: {formatDate(registration.createdAt || new Date())}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="d-none d-lg-table-cell">
                                                <div>
                                                    <div><small>{registration.email}</small></div>
                                                    {registration.phone && (
                                                        <small className="text-muted">{registration.phone}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="d-none d-md-table-cell">
                                                <small>
                                                    {formatDate(registration.createdAt || new Date())}
                                                </small>
                                            </td>
                                            <td className="text-center">
                                                {getStatusBadge(registration)}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-center flex-wrap">
                                                    {/* Attendance Actions */}
                                                    {registration.status !== 'attended' && (
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            title="Mark as Attended"
                                                            onClick={() => markAttendance(registration._id, 'attended')}
                                                        >
                                                            <FaUserCheck />
                                                        </button>
                                                    )}
                                                    {registration.status !== 'absent' && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            title="Mark as Absent"
                                                            onClick={() => markAttendance(registration._id, 'absent')}
                                                        >
                                                            <FaUserTimes />
                                                        </button>
                                                    )}
                                                    {registration.status !== 'registered' && (
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            title="Mark as Registered"
                                                            onClick={() => markAttendance(registration._id, 'registered')}
                                                        >
                                                            <FaClock />
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

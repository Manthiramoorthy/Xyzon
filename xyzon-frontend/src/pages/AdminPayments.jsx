import React, { useEffect, useState, useCallback } from 'react';
import { paymentApi } from '../api/eventApi';
import { useToast } from '../context/ToastContext';
import {
    FaRupeeSign,
    FaCheckCircle,
    FaTimesCircle,
    FaUndo,
    FaSearch,
    FaDownload,
    FaFilter,
    FaEye,
    FaCalendarAlt,
    FaCreditCard,
    FaExclamationTriangle,
    FaSpinner,
    FaClock,
    FaBan,
    FaQuestionCircle
} from 'react-icons/fa';

export default function AdminPayments() {
    const { toast, confirm } = useToast();
    const [payments, setPayments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refundStatus, setRefundStatus] = useState({});
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: '',
        eventId: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadPayments();
        loadStatistics();
    }, [currentPage, filters]);

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value)
                )
            };

            const res = await paymentApi.getAllPayments(params);
            const data = res.data.data;
            setPayments(data.docs || data || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError('Failed to load payments');
            toast.error('Failed to load payments: ' + (err.response?.data?.message || err.message));
            console.error('Load payments error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const res = await paymentApi.getPaymentStatistics();
            setStatistics(res.data.data);
        } catch (err) {
            console.error('Load statistics error:', err);
            toast.error('Failed to load payment statistics');
        }
    };

    const handleRefund = async (payment) => {
        const confirmed = await confirm(
            'Confirm Refund',
            `Are you sure you want to refund ₹${payment.amount} to ${payment.user?.name}?`,
            'warning'
        );

        if (!confirmed) return;

        setRefundStatus(s => ({ ...s, [payment._id]: 'processing' }));
        try {
            await paymentApi.refundPayment(payment._id, {
                reason: 'Requested by admin'
            });
            setRefundStatus(s => ({ ...s, [payment._id]: 'refunded' }));
            toast.success(`Successfully refunded ₹${payment.amount} to ${payment.user?.name}`);
            loadPayments();
            loadStatistics();
        } catch (err) {
            setRefundStatus(s => ({ ...s, [payment._id]: 'error' }));
            toast.error('Failed to process refund: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    }, []);

    const clearFilters = () => {
        setFilters({
            status: '',
            search: '',
            startDate: '',
            endDate: '',
            eventId: ''
        });
        setCurrentPage(1);
    };

    const exportPayments = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const queryParams = new URLSearchParams();

            // Add filters to query params
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`${API_BASE_URL}/payments/admin/export?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('Payments exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Export failed. Please try again.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <FaCheckCircle className="text-success" />;
            case 'failed': return <FaTimesCircle className="text-danger" />;
            case 'refunded': return <FaUndo className="text-warning" />;
            case 'created': return <FaClock className="text-info" />;
            case 'attempted': return <FaSpinner className="text-warning" />;
            case 'cancelled': return <FaBan className="text-secondary" />;
            default: return <FaQuestionCircle className="text-muted" />;
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            paid: 'success',
            failed: 'danger',
            refunded: 'warning',
            created: 'info',
            attempted: 'warning',
            cancelled: 'secondary'
        };

        return (
            <span className={`badge bg-${variants[status] || 'secondary'} d-flex align-items-center gap-1`}>
                {getStatusIcon(status)}
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    if (loading && payments.length === 0) {
        return (
            <div className="container py-4">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <div className="text-center">
                        <FaSpinner className="fa-spin fa-2x text-primary mb-3" />
                        <p>Loading payments...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Payment Management</h2>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter className="me-1" />
                        Filters
                    </button>
                    <button className="btn btn-outline-success" onClick={exportPayments}>
                        <FaDownload className="me-1" />
                        Export
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card bg-success text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h6 className="card-title mb-0">Total Revenue</h6>
                                        <h4 className="mb-0">
                                            <FaRupeeSign />{statistics.totalRevenue?.toLocaleString() || 0}
                                        </h4>
                                    </div>
                                    <FaCreditCard size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-primary text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h6 className="card-title mb-0">Successful Payments</h6>
                                        <h4 className="mb-0">{statistics.paidCount || 0}</h4>
                                    </div>
                                    <FaCheckCircle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-warning text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h6 className="card-title mb-0">Pending</h6>
                                        <h4 className="mb-0">{statistics.pendingPayments || 0}</h4>
                                    </div>
                                    <FaClock size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-danger text-white">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h6 className="card-title mb-0">Failed</h6>
                                        <h4 className="mb-0">{statistics.failedPayments || 0}</h4>
                                    </div>
                                    <FaTimesCircle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label">Search</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FaSearch />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Payment ID, User, Event..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="created">Created</option>
                                    <option value="attempted">Attempted</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>
                            <div className="col-md-1 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary w-100"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    {error}
                </div>
            )}

            {/* Payments Table */}
            <div className="card">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <FaSpinner className="fa-spin fa-2x text-primary mb-3" />
                            <p>Loading payments...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-5">
                            <FaCreditCard size={48} className="text-muted mb-3" />
                            <h5>No payments found</h5>
                            <p className="text-muted">No payments match your current filters.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Payment Details</th>
                                        <th>User</th>
                                        <th>Event</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payment Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(payment => (
                                        <tr key={payment._id}>
                                            <td>
                                                <div className="small text-muted">
                                                    ID: {payment._id.slice(-8)}
                                                </div>
                                                <div className="small">
                                                    Order: {payment.razorpayOrderId}
                                                </div>
                                                {payment.razorpayPaymentId && (
                                                    <div className="small text-success">
                                                        Payment: {payment.razorpayPaymentId}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-medium">
                                                    {payment.user?.name || 'Unknown'}
                                                </div>
                                                <div className="small text-muted">
                                                    {payment.user?.email}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">
                                                    {payment.event?.title || 'Event Deleted'}
                                                </div>
                                                <div className="small text-muted">
                                                    {payment.event?.eventType}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-medium">
                                                    <FaRupeeSign className="me-1" />
                                                    {payment.amount?.toLocaleString()}
                                                </div>
                                                <div className="small text-muted">
                                                    {payment.currency || 'INR'}
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(payment.status)}
                                                {payment.method && (
                                                    <div className="small text-muted mt-1">
                                                        {payment.method}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <FaCalendarAlt className="me-1" />
                                                    {payment.paidAt ?
                                                        new Date(payment.paidAt).toLocaleDateString() :
                                                        new Date(payment.createdAt).toLocaleDateString()
                                                    }
                                                </div>
                                                <div className="small text-muted">
                                                    {payment.paidAt ?
                                                        new Date(payment.paidAt).toLocaleTimeString() :
                                                        new Date(payment.createdAt).toLocaleTimeString()
                                                    }
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group-vertical btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => setSelectedPayment(payment)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#paymentDetailsModal"
                                                    >
                                                        <FaEye className="me-1" />
                                                        View
                                                    </button>
                                                    {payment.status === 'paid' && !payment.refundId && (
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() => handleRefund(payment)}
                                                            disabled={refundStatus[payment._id] === 'processing'}
                                                        >
                                                            {refundStatus[payment._id] === 'processing' ? (
                                                                <FaSpinner className="fa-spin me-1" />
                                                            ) : (
                                                                <FaUndo className="me-1" />
                                                            )}
                                                            Refund
                                                        </button>
                                                    )}
                                                    {payment.status === 'refunded' && (
                                                        <span className="badge bg-success">
                                                            Refunded
                                                        </span>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <nav className="mt-4">
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => (
                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Payment Details Modal */}
            <div className="modal fade" id="paymentDetailsModal" tabIndex="-1">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Payment Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            {selectedPayment && (
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Payment Information</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Payment ID:</strong></td>
                                                    <td>{selectedPayment._id}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Order ID:</strong></td>
                                                    <td>{selectedPayment.razorpayOrderId}</td>
                                                </tr>
                                                {selectedPayment.razorpayPaymentId && (
                                                    <tr>
                                                        <td><strong>Payment ID (Razorpay):</strong></td>
                                                        <td>{selectedPayment.razorpayPaymentId}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td><strong>Amount:</strong></td>
                                                    <td><FaRupeeSign />{selectedPayment.amount}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Status:</strong></td>
                                                    <td>{getStatusBadge(selectedPayment.status)}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Method:</strong></td>
                                                    <td>{selectedPayment.method || 'N/A'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>User & Event Information</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td><strong>User:</strong></td>
                                                    <td>{selectedPayment.user?.name || 'Unknown'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Email:</strong></td>
                                                    <td>{selectedPayment.user?.email || 'Unknown'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Event:</strong></td>
                                                    <td>{selectedPayment.event?.title || 'Event Deleted'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Event Type:</strong></td>
                                                    <td>{selectedPayment.event?.eventType || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Created At:</strong></td>
                                                    <td>{new Date(selectedPayment.createdAt).toLocaleString()}</td>
                                                </tr>
                                                {selectedPayment.paidAt && (
                                                    <tr>
                                                        <td><strong>Paid At:</strong></td>
                                                        <td>{new Date(selectedPayment.paidAt).toLocaleString()}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

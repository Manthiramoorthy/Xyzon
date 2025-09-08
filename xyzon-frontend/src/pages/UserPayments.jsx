import React, { useEffect, useState } from 'react';
import { paymentApi } from '../api/eventApi';
import { FaRupeeSign, FaCheckCircle, FaTimesCircle, FaClock, FaDownload, FaEye } from 'react-icons/fa';

export default function UserPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadPayments();
    }, [currentPage]);

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await paymentApi.getUserPayments({ page: currentPage, limit: 10 });
            const data = res.data.data;
            setPayments(data.docs || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <FaCheckCircle className="text-success" />;
            case 'failed':
            case 'cancelled':
                return <FaTimesCircle className="text-danger" />;
            default:
                return <FaClock className="text-warning" />;
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'created': 'badge-secondary',
            'attempted': 'badge-warning',
            'paid': 'badge-success',
            'failed': 'badge-danger',
            'cancelled': 'badge-danger',
            'refunded': 'badge-info'
        };
        return badges[status] || 'badge-secondary';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Payment History</h2>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-2">Loading payments...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : payments.length === 0 ? (
                <div className="alert alert-info">
                    <h5>No payment history found</h5>
                    <p>You haven't made any payments yet. Register for paid events to see your payment history here.</p>
                </div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Transaction ID</th>
                                            <th>Event</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Payment Date</th>
                                            <th>Method</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(payment => (
                                            <tr key={payment._id}>
                                                <td>
                                                    <code className="text-primary">
                                                        {payment.razorpayPaymentId || payment._id.slice(-8)}
                                                    </code>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{payment.event?.title || 'Event Not Found'}</strong>
                                                        {payment.event?.eventType && (
                                                            <small className="text-muted d-block">
                                                                {payment.event.eventType}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-success">
                                                        {formatAmount(payment.amount)}
                                                    </span>
                                                    <small className="text-muted d-block">
                                                        {payment.currency}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                                                        {getStatusIcon(payment.status)} {payment.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                                                        {payment.status !== 'paid' && (
                                                            <small className="text-muted d-block">
                                                                Created: {formatDate(payment.createdAt)}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {payment.method || 'Online Payment'}
                                                    {payment.bank && (
                                                        <small className="text-muted d-block">{payment.bank}</small>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => window.open(`/user/payments/${payment._id}`, '_blank')}
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        {payment.status === 'paid' && (
                                                            <button
                                                                className="btn btn-outline-success"
                                                                onClick={() => window.open(`/user/payments/${payment._id}/receipt`, '_blank')}
                                                                title="Download Receipt"
                                                            >
                                                                <FaDownload />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                {[...Array(totalPages)].map((_, i) => (
                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
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

                    {/* Payment Summary */}
                    <div className="row mt-4">
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="card-title">Payment Summary</h6>
                                    <div className="row text-center">
                                        <div className="col">
                                            <div className="text-success fw-bold">
                                                {payments.filter(p => p.status === 'paid').length}
                                            </div>
                                            <small className="text-muted">Successful</small>
                                        </div>
                                        <div className="col">
                                            <div className="text-warning fw-bold">
                                                {payments.filter(p => ['created', 'attempted'].includes(p.status)).length}
                                            </div>
                                            <small className="text-muted">Pending</small>
                                        </div>
                                        <div className="col">
                                            <div className="text-danger fw-bold">
                                                {payments.filter(p => ['failed', 'cancelled'].includes(p.status)).length}
                                            </div>
                                            <small className="text-muted">Failed</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="card-title">Total Spent</h6>
                                    <div className="text-center">
                                        <div className="display-6 text-success fw-bold">
                                            {formatAmount(
                                                payments
                                                    .filter(p => p.status === 'paid')
                                                    .reduce((sum, p) => sum + p.amount, 0)
                                            )}
                                        </div>
                                        <small className="text-muted">
                                            From {payments.filter(p => p.status === 'paid').length} successful payments
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

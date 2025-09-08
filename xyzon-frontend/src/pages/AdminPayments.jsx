import React, { useEffect, useState } from 'react';
import { paymentApi } from '../api/eventApi';
import { FaRupeeSign, FaCheckCircle, FaTimesCircle, FaUndo } from 'react-icons/fa';

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refundStatus, setRefundStatus] = useState({});

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await paymentApi.getAllPayments(); // Admin endpoint to get all payments
            setPayments(res.data.data.docs || res.data.data || []);
        } catch (err) {
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (paymentId) => {
        setRefundStatus(s => ({ ...s, [paymentId]: 'processing' }));
        try {
            await paymentApi.refundPayment(paymentId, {});
            setRefundStatus(s => ({ ...s, [paymentId]: 'refunded' }));
            loadPayments();
        } catch (err) {
            setRefundStatus(s => ({ ...s, [paymentId]: 'error' }));
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">Payment Management</h2>
            {loading ? (
                <div>Loading payments...</div>
            ) : error ? (
                <div className="text-danger">{error}</div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>User</th>
                            <th>Event</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Paid At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(payment => (
                            <tr key={payment._id}>
                                <td>{payment._id}</td>
                                <td>{payment.user?.name || payment.user}</td>
                                <td>{payment.event?.title || payment.event}</td>
                                <td><FaRupeeSign /> {payment.amount}</td>
                                <td>
                                    {payment.status === 'paid' ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />} {payment.status}
                                </td>
                                <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}</td>
                                <td>
                                    {payment.status === 'paid' && refundStatus[payment._id] !== 'refunded' ? (
                                        <button className="btn btn-sm btn-warning" onClick={() => handleRefund(payment._id)} disabled={refundStatus[payment._id] === 'processing'}>
                                            <FaUndo className="me-1" /> Refund
                                        </button>
                                    ) : refundStatus[payment._id] === 'refunded' ? (
                                        <span className="text-success">Refunded</span>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

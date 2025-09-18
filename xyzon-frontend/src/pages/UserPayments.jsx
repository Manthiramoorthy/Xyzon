import React, { useEffect, useState, useMemo } from 'react';
import { paymentApi } from '../api/eventApi';
import ICONS from '../constants/icons';
import { FaCheckCircle, FaTimesCircle, FaClock, FaDownload, FaSearch, FaSync, FaSort, FaSortUp, FaSortDown, FaFilter, FaInfoCircle, FaFilePdf, FaBan } from 'react-icons/fa';
import jsPDF from 'jspdf';

export default function UserPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Enhancements
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // date | amount | status
    const [sortDir, setSortDir] = useState('desc'); // asc | desc
    const [exporting, setExporting] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

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

    // New: text-only color classes (no background)
    const getStatusTextClass = (status) => {
        switch (status) {
            case 'paid': return 'text-success';
            case 'failed':
            case 'cancelled': return 'text-danger';
            case 'attempted':
            case 'created': return 'text-warning';
            case 'refunded': return 'text-info';
            default: return 'text-muted';
        }
    };


    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Derived filtered + searched + sorted payments (client-side for current page)
    const processedPayments = useMemo(() => {
        let rows = [...payments];
        if (statusFilter !== 'all') {
            rows = rows.filter(p => p.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter(p =>
                (p.event?.title || '').toLowerCase().includes(q) ||
                (p.razorpayPaymentId || '').toLowerCase().includes(q) ||
                p._id.toLowerCase().includes(q)
            );
        }
        rows.sort((a, b) => {
            switch (sortBy) {
                case 'amount': {
                    return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
                }
                case 'status': {
                    return sortDir === 'asc'
                        ? (a.status || '').localeCompare(b.status || '')
                        : (b.status || '').localeCompare(a.status || '');
                }
                case 'date':
                default: {
                    const da = new Date(a.paidAt || a.createdAt).getTime();
                    const db = new Date(b.paidAt || b.createdAt).getTime();
                    return sortDir === 'asc' ? da - db : db - da;
                }
            }
        });
        return rows;
    }, [payments, statusFilter, search, sortBy, sortDir]);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return <FaSort className="ms-1 text-muted" />;
        return sortDir === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
    };

    const exportCSV = () => {
        try {
            setExporting(true);
            const headers = ['Transaction ID', 'Event', 'Amount', 'Original Amount', 'Discount', 'Coupon', 'Currency', 'Status', 'Paid Date', 'Created Date', 'Method', 'Bank'];
            const lines = [headers.join(',')];
            processedPayments.forEach(p => {
                const row = [
                    p.razorpayPaymentId || p._id,
                    (p.event?.title || '').replace(/,/g, ' '),
                    p.amount,
                    p.originalAmount ?? '',
                    p.discountAmount ?? '',
                    p.couponCode || '',
                    p.currency,
                    p.status,
                    p.paidAt ? new Date(p.paidAt).toISOString() : '',
                    new Date(p.createdAt).toISOString(),
                    p.method || 'Online Payment',
                    p.bank || ''
                ].map(v => `"${v ?? ''}"`).join(',');
                lines.push(row);
            });
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payments_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    const reload = () => {
        loadPayments();
    };

    const cancelPending = async (paymentId) => {
        if (!window.confirm('Cancel this pending payment?')) return;
        setCancellingId(paymentId);
        try {
            await paymentApi.cancelPayment(paymentId);
            await loadPayments();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to cancel payment');
        } finally {
            setCancellingId(null);
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleString();

    const openDetails = async (paymentId) => {
        setDetailLoading(true);
        setViewing(null);
        try {
            // Attempt to fetch full payment detail (using getPaymentStatus style endpoint if available)
            const res = await paymentApi.getPayment(paymentId);
            setViewing(res.data?.data || res.data);
        } catch (e) {
            const local = payments.find(p => p._id === paymentId);
            setViewing({ ...local, _unfetched: true });
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetails = () => setViewing(null);

    const downloadReceipt = async (payment) => {
        setDownloading(true);
        try {
            // If user details missing, attempt to refetch this payment with full details
            let fullPayment = payment;
            if (!payment.user || !payment.user.name) {
                try {
                    const res = await paymentApi.getPayment(payment._id);
                    fullPayment = res.data?.data || res.data || payment;
                } catch { /* ignore */ }
            }

            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const marginX = 50;
            let cursorY = 60;

            // Load logo (assumes public/assets/images/default-logo.jpeg) and keep original proportional size
            const logoUrl = '/assets/images/default-logo.jpeg';
            const loadImageAsDataURL = (url) => new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.width, h: img.height });
                };
                img.onerror = reject;
                img.src = url;
            });

            let headerTextX = marginX + 100; // fallback if logo fails
            try {
                const { dataUrl, w, h } = await loadImageAsDataURL(logoUrl);
                // Convert pixels to points (approx) and scale down only if too large
                const pxToPt = 72 / 96; // assuming 96dpi source
                let logoWpt = w * pxToPt;
                let logoHpt = h * pxToPt;
                const maxW = 140; // safety cap so it doesn't dominate
                const maxH = 140;
                const scale = Math.min(1, maxW / logoWpt, maxH / logoHpt);
                logoWpt *= scale; logoHpt *= scale;
                doc.addImage(dataUrl, 'PNG', marginX, cursorY - 30, logoWpt, logoHpt);
                headerTextX = marginX + logoWpt + 20;
            } catch { /* logo optional */ }

            // Company Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('Xyzon Innovations Private Limited', headerTextX, cursorY);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(['CAMPUS 1A, NO.143, DR.M.G.R. ROAD,', 'Perungudi, Saidapet, Kanchipuram-600096, Tamil Nadu', 'Email: contact@xyzon.in  Phone: +91 87542 00247'], headerTextX, cursorY + 16);
            cursorY += 90;

            // Title / Metadata bar
            doc.setDrawColor(0, 0, 102);
            doc.setFillColor(0, 0, 102);
            doc.rect(0, cursorY - 30, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('PAYMENT RECEIPT / INVOICE', marginX, cursorY - 5);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - marginX, cursorY - 5, { align: 'right' });

            doc.setTextColor(0, 0, 0);
            cursorY += 10;

            const section = (title) => {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                doc.text(title, marginX, cursorY += 30);
                doc.setFont('helvetica', 'normal');
                doc.setDrawColor(242, 107, 36); doc.setFillColor(242, 107, 36);
                doc.rect(marginX, cursorY + 6, 60, 2, 'F');
                cursorY += 20;
            };

            const field = (label, value, col = 0) => {
                const colWidth = (pageWidth - marginX * 2) / 2;
                const x = marginX + colWidth * col;
                doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                doc.text(label.toUpperCase(), x, cursorY);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
                doc.text(String(value || '-'), x, cursorY + 14);
            };

            // Payment Info
            section('Payment Information');
            field('Transaction ID', fullPayment.razorpayPaymentId || fullPayment._id); field('Status', fullPayment.status, 1);
            cursorY += 34;
            // Use ASCII-safe amount representation to avoid font glyph issues (₹ often missing in default font)
            const amountDisplay = `INR ${Number(fullPayment.amount || 0).toFixed(2)}`;
            field('Amount Paid', amountDisplay); field('Method', fullPayment.method || 'Online Payment', 1);
            cursorY += 34;
            if (fullPayment.originalAmount && fullPayment.originalAmount !== fullPayment.amount) {
                field('Original Amount', `INR ${Number(fullPayment.originalAmount).toFixed(2)}`); field('Discount', `INR ${Number(fullPayment.discountAmount || 0).toFixed(2)}`, 1);
                cursorY += 34;
            }
            if (fullPayment.couponCode) {
                field('Coupon Code', fullPayment.couponCode);
                cursorY += 34;
            }
            field('Created At', formatDate(fullPayment.createdAt)); field('Paid At', fullPayment.paidAt ? formatDate(fullPayment.paidAt) : '-', 1);
            cursorY += 40;

            // Customer (User) Info
            if (fullPayment.user) {
                section('Customer Details');
                field('Name', fullPayment.user.name || '-'); field('Email', fullPayment.user.email || '-', 1);
                cursorY += 34;
                if (fullPayment.user.phone) {
                    field('Phone', fullPayment.user.phone);
                    cursorY += 34;
                }
                cursorY += 10;
            }

            // Event Info
            section('Event Details');
            field('Event Title', fullPayment.event?.title || 'N/A');
            cursorY += 34;
            if (fullPayment.event?.startDate) {
                field('Start Date', formatDate(fullPayment.event.startDate));
            }
            cursorY += 40;

            // Notes
            if (fullPayment.notes) {
                section('Notes');
                const notesStr = typeof fullPayment.notes === 'string' ? fullPayment.notes : JSON.stringify(fullPayment.notes, null, 2);
                const notesLines = doc.splitTextToSize(notesStr, pageWidth - marginX * 2);
                doc.setFontSize(10);
                doc.text(notesLines, marginX, cursorY);
                cursorY += notesLines.length * 14 + 10;
            }

            // Footer
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text('This is a system generated receipt. No signature required.', marginX, 800);
            doc.text('Thank you for your payment.', pageWidth - marginX, 800, { align: 'right' });

            doc.save(`receipt_${fullPayment._id}.pdf`);
        } catch (e) {
            console.error('Receipt generation failed:', e);
            alert('Failed to generate receipt');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
                <h2 className="m-0">My Payment History</h2>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <div className="input-group" style={{ maxWidth: 260 }}>
                        <span className="input-group-text bg-white"><FaSearch /></span>
                        <input
                            className="form-control"
                            placeholder="Search event / txn id"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="input-group" style={{ maxWidth: 200 }}>
                        <span className="input-group-text bg-white"><FaFilter /></span>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="created">Created</option>
                            <option value="attempted">Attempted</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <button className="btn btn-outline-secondary" onClick={() => { setSearch(''); setStatusFilter('all'); }} disabled={!search && statusFilter === 'all'}>Reset</button>
                    <button className="btn btn-outline-primary" onClick={reload} title="Reload" disabled={loading}><FaSync className={loading ? 'fa-spin' : ''} /></button>
                    <button className="btn btn-success" onClick={exportCSV} disabled={exporting || processedPayments.length === 0}>
                        <FaDownload className="me-1" /> CSV
                    </button>
                </div>
            </div>

            {/* Quick summary cards */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Successful</div>
                            <div className="h5 mb-0 text-success fw-bold">{payments.filter(p => p.status === 'paid').length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Pending</div>
                            <div className="h5 mb-0 text-warning fw-bold">{payments.filter(p => ['created', 'attempted'].includes(p.status)).length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Failed / Cancelled</div>
                            <div className="h5 mb-0 text-danger fw-bold">{payments.filter(p => ['failed', 'cancelled'].includes(p.status)).length}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Total Spent</div>
                            <div className="h5 mb-0 text-success fw-bold">{formatAmount(payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0))}</div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '14%' }}>Transaction ID</th>
                                        <th>Event</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payment Date</th>
                                        <th>Method</th>
                                        <th style={{ width: '8%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="placeholder-wave">
                                            <td><span className="placeholder col-9"></span></td>
                                            <td><span className="placeholder col-10"></span><br /><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-4"></span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                    <div>{typeof error === 'string' ? error : error.message || 'An error occurred'}</div>
                    <button className="btn btn-sm btn-light" onClick={reload}>Retry</button>
                </div>
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
                                            <th style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => toggleSort('date')}>
                                                Date {getSortIcon('date')}
                                            </th>
                                            <th style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => toggleSort('amount')}>
                                                Amount {getSortIcon('amount')}
                                            </th>
                                            <th style={{ whiteSpace: 'nowrap' }}>Coupon</th>
                                            <th style={{ whiteSpace: 'nowrap' }}>Txn ID</th>
                                            <th style={{ minWidth: 160 }}>Event</th>
                                            <th style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => toggleSort('status')}>
                                                Status {getSortIcon('status')}
                                            </th>
                                            <th style={{ whiteSpace: 'nowrap' }}>Method</th>
                                            <th style={{ width: 140 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedPayments.map(payment => (
                                            <tr key={payment._id}>
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
                                                    <span className="fw-bold text-success">
                                                        {formatAmount(payment.amount)}
                                                    </span>
                                                    {payment.originalAmount && payment.originalAmount !== payment.amount && (
                                                        <small className="text-muted d-block">Orig: {formatAmount(payment.originalAmount)} | Saved {formatAmount(payment.discountAmount)}</small>
                                                    )}
                                                    <small className="text-muted d-block">
                                                        {payment.currency}
                                                    </small>
                                                </td>
                                                <td>
                                                    {payment.couponCode ? <span className="badge bg-success-subtle text-success border">{payment.couponCode}</span> : <span className="text-muted small">—</span>}
                                                </td>
                                                <td>
                                                    <code className="text-primary">
                                                        {payment.razorpayPaymentId || payment._id.slice(-10)}
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
                                                    <div className={`d-inline-flex flex-column gap-1`} style={{ fontSize: '.75rem' }}>
                                                        <span className={`d-inline-flex align-items-center gap-1 fw-semibold ${getStatusTextClass(payment.status)}`} style={{ letterSpacing: '.5px' }}>
                                                            {getStatusIcon(payment.status)} {payment.status.toUpperCase()}
                                                        </span>
                                                        {/* Show reason / guidance for failed or pending */}
                                                        {payment.status === 'failed' && (
                                                            <span className="text-danger small">
                                                                {payment.errorDescription || 'Payment failed. No charge was made.'}
                                                            </span>
                                                        )}
                                                        {['created', 'attempted'].includes(payment.status) && (
                                                            <span className="text-muted small">
                                                                Complete payment or cancel to start anew.
                                                            </span>
                                                        )}
                                                        {payment.status === 'cancelled' && payment.canceledAt && (
                                                            <span className="text-muted small">Cancelled {new Date(payment.canceledAt).toLocaleString()}</span>
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
                                                    <div className="d-flex flex-wrap gap-1">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                                                            onClick={() => openDetails(payment._id)}
                                                            title="View Details"
                                                        >
                                                            <FaInfoCircle />
                                                        </button>
                                                        {payment.status === 'paid' && (
                                                            <button
                                                                className="btn btn-outline-success btn-sm d-inline-flex align-items-center"
                                                                onClick={() => downloadReceipt(payment)}
                                                                title="Download Receipt"
                                                                disabled={downloading}
                                                            >
                                                                {downloading ? <FaSync className="fa-spin" /> : <FaDownload />}
                                                            </button>
                                                        )}
                                                        {['created', 'attempted'].includes(payment.status) && (
                                                            <button
                                                                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center"
                                                                onClick={() => cancelPending(payment._id)}
                                                                title="Cancel Pending Payment"
                                                                disabled={cancellingId === payment._id}
                                                            >
                                                                {cancellingId === payment._id ? <FaSync className="fa-spin" /> : <FaBan />}
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
                    {viewing && (
                        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true">
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title mb-0 d-flex align-items-center gap-2"><FaInfoCircle /> Payment Details</h5>
                                        <button type="button" className="btn-close" onClick={closeDetails}></button>
                                    </div>
                                    <div className="modal-body">
                                        {detailLoading ? (
                                            <div className="text-center py-5">
                                                <FaSync className="fa-spin" /> Loading details...
                                            </div>
                                        ) : (
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <div className="small text-muted">Transaction ID</div>
                                                    <div className="fw-semibold">{viewing.razorpayPaymentId || viewing._id}</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="small text-muted">Status</div>
                                                    <div className="fw-semibold text-capitalize">{viewing.status}</div>
                                                    {viewing.status === 'failed' && (
                                                        <div className="text-danger small mt-1">
                                                            {viewing.errorDescription || 'The payment failed. Please try again or use a different method.'}
                                                        </div>
                                                    )}
                                                    {['created', 'attempted'].includes(viewing.status) && (
                                                        <div className="text-muted small mt-1">Pending. Complete in Razorpay popup or cancel.</div>
                                                    )}
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="small text-muted">Amount</div>
                                                    <div className="fw-semibold text-success">{formatAmount(viewing.amount)}</div>
                                                    {viewing.originalAmount && viewing.originalAmount !== viewing.amount && (
                                                        <div className="small text-muted">Orig {formatAmount(viewing.originalAmount)} | Saved {formatAmount(viewing.discountAmount)}</div>
                                                    )}
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="small text-muted">Coupon</div>
                                                    <div className="fw-semibold">{viewing.couponCode || '—'}</div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="small text-muted">Event</div>
                                                    <div className="fw-semibold">{viewing.event?.title || 'N/A'}</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="small text-muted">Currency</div>
                                                    <div className="fw-semibold">{viewing.currency}</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="small text-muted">Method</div>
                                                    <div className="fw-semibold">{viewing.method || 'Online Payment'}</div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="small text-muted">Created At</div>
                                                    <div className="fw-semibold">{formatDate(viewing.createdAt)}</div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="small text-muted">Paid At</div>
                                                    <div className="fw-semibold">{viewing.paidAt ? formatDate(viewing.paidAt) : '-'}</div>
                                                </div>
                                                {viewing.notes && (
                                                    <div className="col-12">
                                                        <div className="small text-muted">Notes</div>
                                                        <pre className="bg-light p-2 rounded small" style={{ maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(viewing.notes, null, 2)}</pre>
                                                    </div>
                                                )}
                                                {(viewing.status === 'failed' || ['created', 'attempted'].includes(viewing.status)) && (
                                                    <div className="col-12">
                                                        <div className="alert alert-warning p-2 mb-0 small">
                                                            {viewing.status === 'failed' ? (
                                                                <>
                                                                    If amount was deducted it will auto-refund by your bank within 5-7 working days. You can retry now.
                                                                </>
                                                            ) : (
                                                                <>Payment still pending. You may keep the tab open, retry the flow, or cancel this attempt.</>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer d-flex justify-content-between">
                                        <div className="text-muted small">{viewing._unfetched ? 'Partial data (from list only)' : ''}</div>
                                        <div className="d-flex gap-2">
                                            {['created', 'attempted'].includes(viewing.status) && (
                                                <button className="btn btn-outline-danger" onClick={() => cancelPending(viewing._id)} disabled={cancellingId === viewing._id}>
                                                    {cancellingId === viewing._id ? <FaSync className="fa-spin" /> : <> <FaBan className="me-1" /> Cancel Payment</>}
                                                </button>
                                            )}
                                            {viewing.status === 'paid' && (
                                                <button className="btn btn-success" onClick={() => downloadReceipt(viewing)} disabled={downloading}>
                                                    {downloading ? <FaSync className="fa-spin" /> : <><FaFilePdf className="me-1" /> Download Receipt</>}
                                                </button>
                                            )}
                                            <button className="btn btn-secondary" onClick={closeDetails}>Close</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Pagination (hidden when filters/search active to avoid mismatch with server pagination) */}
                    {statusFilter === 'all' && !search && totalPages > 1 && (
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

                    {/* Legacy summary replaced by quick summary cards above */}
                </>
            )}
        </div>
    );
}

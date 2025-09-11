import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { certificateApi } from '../api/eventApi';
import { useToast } from '../context/ToastContext';
import { generateCertificatePDF } from '../utils/certificateUtils';
import {
    FaCertificate, FaCalendarAlt, FaUser, FaSpinner, FaFilePdf, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaThLarge, FaList, FaSync, FaEye
} from 'react-icons/fa';

export default function UserCertificates() {
    const { toast } = useToast();
    const navigate = useNavigate();

    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingCert, setDownloadingCert] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date'); // date | title | recipient
    const [sortDir, setSortDir] = useState('desc');
    const [viewMode, setViewMode] = useState('grid'); // grid | list
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await certificateApi.getUserCertificates();
            setCertificates(response.data.data || []);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCertificate = async (certificate) => {
        setDownloadingCert(certificate._id);
        try {
            console.log('Starting certificate PDF download for:', certificate.recipientName);
            let html = certificate.generatedHtml;

            // If HTML is not directly available, try to get it from the API
            if (!html) {
                const response = await certificateApi.getCertificate(certificate.certificateId);
                html = response.data.data?.generatedHtml;
            }

            if (!html) {
                throw new Error('Certificate content not available');
            }

            const fileName = `${certificate.recipientName.replace(/\s+/g, '_')}_Certificate.pdf`;

            console.log('Certificate HTML loaded, ensuring all images are loaded before PDF generation...');

            // Generate PDF with proper image loading
            await generateCertificatePDF(html, fileName);

            console.log('PDF generated and downloaded successfully');
        } catch (error) {
            console.error('Error downloading certificate:', error);
            toast.error('Failed to download certificate as PDF. Please ensure all images are accessible and try again.\nError: ' + (error.message || 'Unknown error'));
        } finally {
            setDownloadingCert(null);
        }
    };

    const handleViewCertificate = (certificate) => {
        if (certificate.status !== 'issued') return; // guard
        navigate(`/certificates/${certificate.certificateId}`);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Derived dataset
    const processedCertificates = useMemo(() => {
        let rows = [...certificates];
        if (statusFilter !== 'all') rows = rows.filter(c => c.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(c =>
                c.title.toLowerCase().includes(q) ||
                (c.recipientName || '').toLowerCase().includes(q) ||
                (c.event?.title || '').toLowerCase().includes(q) ||
                (c.certificateId || '').toLowerCase().includes(q)
            );
        }
        rows.sort((a, b) => {
            switch (sortBy) {
                case 'title': return sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
                case 'recipient': return sortDir === 'asc' ? (a.recipientName || '').localeCompare(b.recipientName || '') : (b.recipientName || '').localeCompare(a.recipientName || '');
                case 'date':
                default: {
                    const da = new Date(a.issueDate).getTime();
                    const db = new Date(b.issueDate).getTime();
                    return sortDir === 'asc' ? da - db : db - da;
                }
            }
        });
        return rows;
    }, [certificates, search, statusFilter, sortBy, sortDir]);

    const toggleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortDir('desc'); }
    };
    const sortIcon = (field) => {
        if (sortBy !== field) return <FaSort className="ms-1 text-muted" />;
        return sortDir === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
    };

    const stats = useMemo(() => ({
        total: certificates.length,
        issued: certificates.filter(c => c.status === 'issued').length,
        revoked: certificates.filter(c => c.status === 'revoked').length,
        thisYear: certificates.filter(c => new Date(c.issueDate).getFullYear() === new Date().getFullYear()).length
    }), [certificates]);

    const resetFilters = () => { setSearch(''); setStatusFilter('all'); setSortBy('date'); setSortDir('desc'); };
    const refresh = async () => { setRefreshing(true); await loadCertificates(); setRefreshing(false); };

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
                    {typeof error === 'string' ? error : error.message || 'An error occurred'}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                    <h1 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <FaCertificate className="text-primary" /> My Certificates
                    </h1>
                    <p className="text-muted mb-0">Search, filter and download your issued certificates.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view"><FaThLarge /></button>
                    <button className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view"><FaList /></button>
                    <button className="btn btn-outline-primary" onClick={refresh} disabled={refreshing}><FaSync className={refreshing ? 'fa-spin' : ''} /></button>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white"><FaSearch /></span>
                                <input className="form-control" placeholder="Search title / event / ID" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group">
                                <span className="input-group-text bg-white"><FaFilter /></span>
                                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="all">All Statuses</option>
                                    <option value="issued">Issued</option>
                                    <option value="revoked">Revoked</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="input-group">
                                <span className="input-group-text bg-white"><FaSort /></span>
                                <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="date">Issue Date</option>
                                    <option value="title">Title</option>
                                    <option value="recipient">Recipient</option>
                                </select>
                                <button className="btn btn-outline-secondary" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} title="Toggle sort direction">{sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />}</button>
                            </div>
                        </div>
                        <div className="col-md-2 d-flex gap-2">
                            <button className="btn btn-outline-secondary w-100" disabled={!search && statusFilter === 'all' && sortBy === 'date' && sortDir === 'desc'} onClick={resetFilters}>Reset</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Total</div>
                            <div className="h5 mb-0 fw-bold">{stats.total}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Issued</div>
                            <div className="h5 mb-0 text-success fw-bold">{stats.issued}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">Revoked</div>
                            <div className="h5 mb-0 text-danger fw-bold">{stats.revoked}</div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                    <div className="card h-100">
                        <div className="card-body py-3">
                            <div className="small text-muted">This Year</div>
                            <div className="h5 mb-0 text-primary fw-bold">{stats.thisYear}</div>
                        </div>
                    </div>
                </div>
            </div>

            {processedCertificates.length === 0 ? (
                <div className="text-center py-5">
                    <FaCertificate size={64} className="text-muted mb-3" />
                    <h4 className="text-muted">No certificates found</h4>
                    <p className="text-muted mb-3">{certificates.length === 0 ? 'Complete events to earn certificates that will appear here.' : 'Try adjusting your search or filters.'}</p>
                    <Link to="/events" className="btn btn-primary">Browse Events</Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="row">
                    {processedCertificates.map(certificate => (
                        <div key={certificate.certificateId} className="col-lg-6 col-xl-4 mb-4">
                            <div className="card h-100 shadow-sm border-0 certificate-card" style={{ minHeight: '320px' }}>
                                <div className="card-header bg-primary text-white">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <FaCertificate className="fs-4" />
                                        <span className={"badge bg-light text-" + (certificate.status === 'issued' ? 'primary' : certificate.status === 'revoked' ? 'danger' : 'secondary')}>
                                            {certificate.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title text-primary mb-3" style={{ minHeight: '50px', display: 'flex', alignItems: 'center' }}>{certificate.title}</h5>
                                    <div className="mb-3 flex-grow-1 small">
                                        <div className="d-flex align-items-center mb-1"><FaUser className="me-2 text-muted flex-shrink-0" /> <span className="text-muted">Recipient: <strong>{certificate.recipientName}</strong></span></div>
                                        <div className="d-flex align-items-center mb-1"><FaCalendarAlt className="me-2 text-muted flex-shrink-0" /> <span className="text-muted">Event: <strong>{certificate.event?.title || 'N/A'}</strong></span></div>
                                        <div className="d-flex align-items-center"><FaCalendarAlt className="me-2 text-muted flex-shrink-0" /> <span className="text-muted">Issued: <strong>{formatDate(certificate.issueDate)}</strong></span></div>
                                    </div>
                                    <div className="border-top pt-3 mt-auto d-flex flex-column gap-2">
                                        <div className="btn-group" role="group">
                                            <button
                                                className="btn btn-outline-primary"
                                                onClick={() => handleViewCertificate(certificate)}
                                                disabled={certificate.status !== 'issued'}
                                                title={certificate.status !== 'issued' ? 'Certificate not available for viewing' : 'View Certificate'}
                                            >
                                                <FaEye className="me-2" /> View
                                            </button>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleDownloadCertificate(certificate)}
                                                disabled={certificate.status !== 'issued' || downloadingCert === certificate._id}
                                                title={certificate.status !== 'issued' ? 'Certificate not available for download' : 'Download PDF'}
                                            >
                                                {downloadingCert === certificate._id ? (
                                                    <><FaSpinner className="fa-spin me-2" />Generating...</>
                                                ) : (
                                                    <><FaFilePdf className="me-2" />PDF</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-footer bg-light text-center py-2"><small className="text-muted fw-bold">ID: {certificate.certificateId}</small></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>Issue Date {sortIcon('date')}</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>Title {sortIcon('title')}</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('recipient')}>Recipient {sortIcon('recipient')}</th>
                                    <th>Event</th>
                                    <th>Status</th>
                                    <th style={{ width: 180 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedCertificates.map(certificate => (
                                    <tr key={certificate.certificateId}>
                                        <td>{formatDate(certificate.issueDate)}</td>
                                        <td className="fw-semibold text-primary">{certificate.title}</td>
                                        <td>{certificate.recipientName}</td>
                                        <td>{certificate.event?.title || 'N/A'}</td>
                                        <td>
                                            <span className={"badge bg-" + (certificate.status === 'issued' ? 'success' : certificate.status === 'revoked' ? 'danger' : 'secondary')}>{certificate.status}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handleViewCertificate(certificate)}
                                                    disabled={certificate.status !== 'issued'}
                                                    title={certificate.status !== 'issued' ? 'Not available' : 'View Certificate'}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleDownloadCertificate(certificate)}
                                                    disabled={certificate.status !== 'issued' || downloadingCert === certificate._id}
                                                    title={certificate.status !== 'issued' ? 'Certificate not available for download' : 'Download PDF'}
                                                >
                                                    {downloadingCert === certificate._id ? <FaSpinner className="fa-spin" /> : <FaFilePdf />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

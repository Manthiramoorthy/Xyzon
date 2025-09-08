import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../api/eventApi';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { generateCertificatePDF } from '../utils/certificateUtils';
import {
    FaCertificate, FaCalendarAlt, FaUser, FaSpinner, FaFilePdf
} from 'react-icons/fa';

export default function UserCertificates() {
    const { toast } = useToast();

    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingCert, setDownloadingCert] = useState(null);

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
            toast.error('Failed to download certificate as PDF. Please ensure all images are accessible and try again.\nError: ' + error.message);
        } finally {
            setDownloadingCert(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h1 className="fw-bold mb-1">
                        <FaCertificate className="me-2 text-primary" />
                        My Certificates
                    </h1>
                    <p className="text-muted mb-0">
                        Your earned certificates from completed events
                    </p>
                </div>
            </div>

            {/* Certificates Grid */}
            {certificates.length === 0 ? (
                <div className="text-center py-5">
                    <FaCertificate size={64} className="text-muted mb-3" />
                    <h4 className="text-muted">No certificates earned yet</h4>
                    <p className="text-muted">
                        Complete events to earn certificates that will appear here.
                    </p>
                    <Link to="/events" className="btn btn-primary">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {certificates.map(certificate => (
                        <div key={certificate.certificateId} className="col-lg-6 col-xl-4 mb-4">
                            <div className="card h-100 shadow-sm border-0" style={{ minHeight: '320px' }}>
                                <div className="card-header bg-primary text-white">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <FaCertificate className="fs-4" />
                                        <span className="badge bg-light text-primary">
                                            {certificate.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title text-primary mb-3" style={{
                                        minHeight: '50px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {certificate.title}
                                    </h5>

                                    <div className="mb-3 flex-grow-1">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaUser className="me-2 text-muted flex-shrink-0" />
                                            <small className="text-muted">
                                                Recipient: <strong>{certificate.recipientName}</strong>
                                            </small>
                                        </div>
                                        <div className="d-flex align-items-center mb-2">
                                            <FaCalendarAlt className="me-2 text-muted flex-shrink-0" />
                                            <small className="text-muted">
                                                Event: <strong>{certificate.event?.title || 'N/A'}</strong>
                                            </small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <FaCalendarAlt className="me-2 text-muted flex-shrink-0" />
                                            <small className="text-muted">
                                                Issued: <strong>{formatDate(certificate.issueDate)}</strong>
                                            </small>
                                        </div>
                                    </div>

                                    <div className="border-top pt-3 mt-auto">
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={() => handleDownloadCertificate(certificate)}
                                            disabled={downloadingCert === certificate._id}
                                        >
                                            {downloadingCert === certificate._id ? (
                                                <>
                                                    <FaSpinner className="spinner-border spinner-border-sm me-2" />
                                                    Generating PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <FaFilePdf className="me-2" />
                                                    Download PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="card-footer bg-light text-center py-2">
                                    <small className="text-muted fw-bold">
                                        ID: {certificate.certificateId}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

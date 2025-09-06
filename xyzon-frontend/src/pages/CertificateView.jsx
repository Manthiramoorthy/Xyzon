import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { certificateApi } from '../api/eventApi';
import { useAuth } from '../auth/AuthContext';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function CertificateView() {
    const { certificateId } = useParams();
    const { user } = useAuth();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCertificate();
    }, [certificateId]);

    const loadCertificate = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await certificateApi.downloadCertificate(certificateId);
            setCertificate(response.data.data);
        } catch (error) {
            if (error.response?.status === 401) {
                setError('Authentication required to view this certificate');
            } else if (error.response?.status === 404) {
                setError('Certificate not found');
            } else {
                setError(error.response?.data?.message || 'Failed to load certificate');
            }
        } finally {
            setLoading(false);
        }
    };

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <FaSpinner className="fa-spin fa-2x text-primary mb-3" />
                    <p>Loading certificate...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <FaExclamationTriangle className="fa-2x text-danger mb-3" />
                    <h4>Certificate Not Available</h4>
                    <p className="text-muted">{error}</p>
                </div>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <FaExclamationTriangle className="fa-2x text-warning mb-3" />
                    <h4>Certificate Not Found</h4>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0">
            <div
                className="certificate-container"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#f8f9fa'
                }}
            >
                <div
                    className="certificate-wrapper"
                    style={{
                        background: 'white',
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        maxWidth: '900px',
                        width: '100%',
                        margin: '20px'
                    }}
                >
                    <div
                        dangerouslySetInnerHTML={{ __html: certificate.generatedHtml }}
                        style={{
                            width: '100%',
                            height: 'auto'
                        }}
                    />
                </div>
            </div>

            <div className="text-center mb-4">
                <button
                    className="btn btn-primary me-2"
                    onClick={() => window.print()}
                >
                    Print Certificate
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

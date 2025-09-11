import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { certificateApi } from '../api/eventApi';
import { useAuth } from '../auth/AuthContext';
import { FaSpinner, FaExclamationTriangle, FaDownload, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { generateCertificatePDF } from '../utils/certificateUtils';

export default function CertificateView() {
    const { certificateId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { loadCertificate(); }, [certificateId]);

    const loadCertificate = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await certificateApi.downloadCertificate(certificateId);
            setCertificate(response.data.data);
        } catch (err) {
            if (err.response?.status === 401) setError('Authentication required');
            else if (err.response?.status === 404) setError('Certificate not found');
            else setError(err.response?.data?.message || 'Failed to load certificate');
        } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (!certificate?.generatedHtml) return;
        try {
            setDownloading(true);
            const fileName = `${(certificate.recipientName || 'certificate').replace(/\s+/g, '_')}_${certificate.certificateId}.pdf`;
            await generateCertificatePDF(certificate.generatedHtml, fileName);
        } catch (e) { console.error(e); } finally { setDownloading(false); }
    };

    if (!user) return <Navigate to="/login" />;

    if (loading) return (
        <div className="container py-5 text-center">
            <FaSpinner className="fa-spin fa-2x text-primary mb-3" />
            <p className="text-muted mb-0">Loading certificate...</p>
        </div>
    );

    if (error) return (
        <div className="container py-5 text-center">
            <FaExclamationTriangle className="fa-2x text-danger mb-3" />
            <h5 className="mb-2">Not Available</h5>
            <p className="text-muted">{error}</p>
            <button className="btn btn-light border mt-2" onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );

    if (!certificate) return null;

    const issueDate = certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : '—';

    return (
        <div className="container py-4">
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <h4 className="mb-0 fw-bold text-primary">Certificate</h4>

            </div>
            <div className="row g-4">
                <div className="col-lg-6 col-xl-5">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body d-flex flex-column">
                            <h5 className="fw-bold mb-3">Details</h5>
                            <div className="small text-muted mb-1">Title</div><div className="fw-semibold mb-3">{certificate.title || '—'}</div>
                            <div className="small text-muted mb-1">Recipient</div><div className="fw-semibold mb-3">{certificate.recipientName || '—'}</div>
                            <div className="small text-muted mb-1">Issue Date</div><div className="fw-semibold mb-3">{issueDate}</div>
                            {certificate.verificationCode && (
                                <div className="mb-3">
                                    <div className="small text-muted mb-1 d-flex align-items-center gap-1"><FaShieldAlt /> Verification Code</div>
                                    <div className="badge bg-light text-dark border" style={{ fontSize: '.85rem' }}>{certificate.verificationCode}</div>
                                    <div className="mt-2"><Link to={`/certificates/verify/${certificate.verificationCode}`} className="small text-decoration-none">Verify Online →</Link></div>
                                </div>
                            )}
                            <div className="mt-auto small text-muted">Use the download button to get your PDF copy.</div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-6 col-xl-7">
                    <div className="card shadow-sm border-0 h-100 d-flex">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center text-center">
                            <FaDownload size={56} className="text-primary mb-3" />
                            <h5 className="fw-bold mb-2">Download Your Certificate</h5>
                            <p className="text-muted mb-3" style={{ maxWidth: 360 }}>
                                Click the button below to get your official certificate as a PDF. You can open it, share it, or print it from any PDF viewer.
                            </p>
                            <button className="btn btn-primary d-flex align-items-center" disabled={downloading || !certificate.generatedHtml} onClick={handleDownload}>
                                {downloading ? <><FaSpinner className="fa-spin me-2" />Generating...</> : <><FaDownload className="me-2" />Download PDF</>}
                            </button>
                            <div className="small text-muted mt-3">ID: {certificate.certificateId}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

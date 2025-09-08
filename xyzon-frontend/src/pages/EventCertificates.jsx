import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { eventApi, certificateApi } from '../api/eventApi';
import * as certificateTemplateApi from '../api/certificateTemplateApi';
import { generateCertificatePDF, previewCertificate } from '../utils/certificateUtils';
import {
    FaArrowLeft, FaCertificate, FaDownload, FaUsers, FaUpload,
    FaEye, FaEnvelope, FaCheck, FaTimes, FaPlus, FaSpinner
} from 'react-icons/fa';

export default function EventCertificates() {
    const { id } = useParams();
    const { toast, confirm } = useToast();

    const [event, setEvent] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [issuingCertificate, setIssuingCertificate] = useState(null);
    const [issuingBulk, setIssuingBulk] = useState(false);
    const [downloadingCertificates, setDownloadingCertificates] = useState({});
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load event details
            const eventResponse = await eventApi.getEvent(id);
            setEvent(eventResponse.data.data);

            // Load certificate templates from the new template management system
            try {
                const templatesResponse = await certificateTemplateApi.getTemplates();
                const templatesList = templatesResponse.data || [];
                setTemplates(templatesList);

                // Set first template as default if available
                if (templatesList.length > 0) {
                    setSelectedTemplate(templatesList[0]._id);
                }
            } catch (templateError) {
                console.error('Failed to load certificate templates:', templateError);
                setTemplates([]);
            }

            // Load certificates
            try {
                const certResponse = await certificateApi.getEventCertificates(id);
                setCertificates(certResponse.data.data || []);
            } catch (certError) {
                console.warn('Certificates API not available');
                setCertificates([]);
            }

            // Load registrations - only attended participants are eligible for certificates
            try {
                const regResponse = await eventApi.getEventRegistrations(id, { status: 'attended' });
                setRegistrations(regResponse.data.data.docs || regResponse.data.data || []);
            } catch (regError) {
                console.warn('Registrations API not available');
                setRegistrations([]);
            }

        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load certificate data');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkIssue = async () => {
        if (!selectedTemplate) {
            toast.error('Please select a certificate template first.');
            return;
        }

        // Get registrations that don't have certificates yet
        const eligibleRegistrations = registrations.filter(reg =>
            reg.status === 'attended' && !reg.certificateIssued
        );

        if (eligibleRegistrations.length === 0) {
            toast.error('No eligible participants found. All attended participants already have certificates.');
            return;
        }

        const confirmed = await confirm(`Issue certificates to ${eligibleRegistrations.length} attended participants?`);
        if (confirmed) {
            setIssuingBulk(true);
            try {
                const registrationIds = eligibleRegistrations.map(reg => reg._id);
                await certificateApi.issueBulkCertificates(id, {
                    registrationIds: registrationIds,
                    templateId: selectedTemplate
                });
                toast.success('Certificates issued successfully!');
                loadData(); // Reload data
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to issue certificates');
            } finally {
                setIssuingBulk(false);
            }
        }
    };

    const handleIndividualIssue = async (registrationId) => {
        if (!selectedTemplate) {
            toast.error('Please select a certificate template first.');
            return;
        }

        setIssuingCertificate(registrationId);
        try {
            await certificateApi.issueCertificate(registrationId, {
                templateId: selectedTemplate
            });
            toast.success('Certificate issued successfully!');
            loadData(); // Reload data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to issue certificate');
        } finally {
            setIssuingCertificate(null);
        }
    };

    const handlePreviewTemplate = async (templateId) => {
        try {
            const template = templates.find(t => t._id === templateId);
            if (!template) return;

            const sampleData = {
                recipientName: 'John Doe',
                eventName: event?.title || 'Sample Event',
                eventDate: event?.startDateTime ? new Date(event.startDateTime).toLocaleDateString() : '2024-01-15',
                organizerName: event?.organizer || 'Event Organizer',
                certificateId: 'CERT-2024-001',
                issueDate: new Date().toLocaleDateString()
            };

            const response = await certificateTemplateApi.previewTemplate(template.htmlContent, sampleData);
            setPreviewTemplate({
                name: template.name,
                html: response.data.previewHtml
            });
            setShowPreview(true);
        } catch (error) {
            console.error('Error previewing template:', error);
            toast.error('Failed to preview template: ' + error.message);
        }
    };

    const handleViewCertificate = async (registrationId) => {
        try {
            const response = await certificateApi.getCertificateByRegistration(registrationId);
            const certificate = response.data.data;

            if (certificate && certificate.generatedHtml) {
                previewCertificate(certificate.generatedHtml);
            } else {
                toast.warning('Certificate HTML not available');
            }
        } catch (error) {
            console.error('Error viewing certificate:', error);
            toast.error('Failed to view certificate: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDownloadCertificate = async (registrationId, recipientName) => {
        // Set downloading state for this specific certificate
        setDownloadingCertificates(prev => ({ ...prev, [registrationId]: true }));

        try {
            console.log('Starting certificate download for:', recipientName);
            const response = await certificateApi.getCertificateByRegistration(registrationId);
            const certificate = response.data.data;

            if (certificate && certificate.generatedHtml) {
                const fileName = `${recipientName.replace(/\s+/g, '_')}_Certificate.pdf`;
                console.log('Certificate HTML loaded, generating PDF...');

                // Show user feedback
                const originalAlert = window.alert;
                const loadingAlert = () => {
                    console.log('PDF generation in progress - please wait for images to load...');
                };

                // Generate PDF with image loading wait
                await generateCertificatePDF(certificate.generatedHtml, fileName);
                console.log('PDF generated and downloaded successfully');

            } else {
                toast.warning('Certificate HTML not available for download');
            }
        } catch (error) {
            console.error('Error downloading certificate:', error);
            toast.error('Failed to download certificate. Please ensure all images are accessible and try again.\nError: ' + (error.response?.data?.message || error.message));
        } finally {
            // Clear downloading state
            setDownloadingCertificates(prev => {
                const newState = { ...prev };
                delete newState[registrationId];
                return newState;
            });
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

    const getRegistrationStatus = (registration) => {
        if (registration.paymentStatus === 'completed' || event?.eventType === 'free') {
            return 'confirmed';
        } else if (registration.paymentStatus === 'pending') {
            return 'pending';
        }
        return 'failed';
    };

    const hasCertificate = (registrationId) => {
        // Check if the registration itself has certificateIssued flag
        const registration = registrations.find(reg => reg._id === registrationId);
        if (registration && registration.certificateIssued) {
            return true;
        }

        // Fallback: check in certificates array by registration field
        return certificates.some(cert =>
            cert.registration === registrationId ||
            cert.registrationId === registrationId
        );
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

    const confirmedRegistrations = registrations.filter(r => getRegistrationStatus(r) === 'confirmed');
    const issuedCertificates = certificates.length;

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center flex-wrap gap-2">

                    <div>
                        <h1 className="fw-bold mb-1 h4 h-md-1">{event.title}</h1>
                        <small className="text-muted">Certificate Management</small>
                    </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link
                        to="/admin/certificate-templates"
                        className="btn btn-outline-secondary btn-sm"
                    >
                        <FaUpload className="me-1" />
                        <span className="d-none d-md-inline">Manage </span>Templates
                    </Link>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleBulkIssue}
                        disabled={confirmedRegistrations.length === 0 || !selectedTemplate}
                    >
                        <FaCertificate className="me-1" />
                        <span className="d-none d-sm-inline">Issue All </span>Certificates
                    </button>
                </div>
            </div>

            {/* Certificate Options */}
            {event.hasCertificate ? (
                <div className="alert alert-info mb-4">
                    <FaCertificate className="me-2" />
                    This event is configured to issue certificates. You can issue individual or bulk certificates below.
                </div>
            ) : (
                <div className="alert alert-warning mb-4">
                    <FaCertificate className="me-2" />
                    This event is not configured for certificates. You can still manually issue certificates if needed.
                </div>
            )}

            {/* Certificate Template Selection */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <FaCertificate className="me-2" />
                        Certificate Template & Actions
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <label className="form-label">Select Certificate Template:</label>
                            <select
                                className="form-select"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="">Choose a template...</option>
                                {templates.map(template => (
                                    <option key={template._id} value={template._id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                            {templates.length === 0 && (
                                <small className="text-muted">No templates available. Please create templates first.</small>
                            )}
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <label className="form-label">Template Preview:</label>
                            <div>
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    onClick={() => selectedTemplate && handlePreviewTemplate(selectedTemplate)}
                                    disabled={!selectedTemplate}
                                >
                                    <FaEye className="me-1" />
                                    Preview Template
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-12">
                            <label className="form-label">Bulk Actions:</label>
                            <div>
                                <button
                                    className="btn btn-success w-100"
                                    onClick={handleBulkIssue}
                                    disabled={issuingBulk || confirmedRegistrations.length === 0 || !selectedTemplate}
                                >
                                    {issuingBulk ? (
                                        <>
                                            <FaSpinner className="spinner-border spinner-border-sm me-2" />
                                            Issuing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCertificate className="me-2" />
                                            Issue All Certificates
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants List */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <FaUsers className="me-2" />
                        Certificate Status for Attended Participants
                    </h5>
                </div>
                <div className="card-body p-0">
                    {confirmedRegistrations.length === 0 ? (
                        <div className="text-center py-5">
                            <FaUsers size={64} className="text-muted mb-3" />
                            <h5 className="text-muted">No attended participants</h5>
                            <p className="text-muted">
                                Certificates can be issued only to participants who have attended the event.
                                Mark attendance in the registrations section first.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Participant</th>
                                        <th className="d-none d-md-table-cell">Registration Date</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {confirmedRegistrations.map(registration => {
                                        const hasCurrentCert = hasCertificate(registration._id);
                                        return (
                                            <tr key={registration._id || Math.random()}>
                                                <td>
                                                    <div>
                                                        <strong>{registration.name}</strong>
                                                        <div><small className="text-muted">{registration.email}</small></div>
                                                        {registration.organization && (
                                                            <div><small className="text-muted">{registration.organization}</small></div>
                                                        )}
                                                        <div className="d-md-none mt-1">
                                                            <small className="text-muted">
                                                                Registered: {formatDate(registration.createdAt || new Date())}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="d-none d-md-table-cell">
                                                    <small>{formatDate(registration.createdAt || new Date())}</small>
                                                </td>
                                                <td className="text-center">
                                                    {hasCurrentCert ? (
                                                        <span className="badge bg-success">
                                                            <FaCheck className="me-1" />
                                                            <span className="d-none d-sm-inline">Issued</span>
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-warning">
                                                            <FaTimes className="me-1" />
                                                            <span className="d-none d-sm-inline">Not Issued</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1 justify-content-center flex-wrap">
                                                        {hasCurrentCert ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm"
                                                                    onClick={() => handleViewCertificate(registration._id)}
                                                                    title="View Certificate"
                                                                >
                                                                    <FaEye />
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-success btn-sm"
                                                                    onClick={() => handleDownloadCertificate(registration._id, registration.name)}
                                                                    title="Download Certificate as PDF"
                                                                    disabled={downloadingCertificates[registration._id]}
                                                                >
                                                                    {downloadingCertificates[registration._id] ? (
                                                                        <FaSpinner className="spinner-border spinner-border-sm" />
                                                                    ) : (
                                                                        <FaDownload />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    title="Email Certificate"
                                                                >
                                                                    <FaEnvelope />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => handleIndividualIssue(registration._id)}
                                                                disabled={issuingCertificate === registration._id || !selectedTemplate}
                                                            >
                                                                {issuingCertificate === registration._id ? (
                                                                    <>
                                                                        <FaSpinner className="spinner-border spinner-border-sm me-1" />
                                                                        <span className="d-none d-sm-inline">Issuing...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaPlus className="me-1" />
                                                                        <span className="d-none d-sm-inline">Issue Certificate</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-lg-4 col-md-6">
                                <Link
                                    to="/admin/certificate"
                                    className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                                >
                                    <FaCertificate className="me-2" />
                                    <span>Certificate Generator</span>
                                </Link>
                                <small className="text-muted d-block mt-2 text-center">
                                    Use the general certificate generator tool
                                </small>
                            </div>
                            <div className="col-lg-4 col-md-6">
                                <Link
                                    to={`/admin/events/${id}/registrations`}
                                    className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                                >
                                    <FaUsers className="me-2" />
                                    <span>View All Registrations</span>
                                </Link>
                                <small className="text-muted d-block mt-2 text-center">
                                    Manage all event registrations
                                </small>
                            </div>
                            <div className="col-lg-4 col-md-12">
                                <Link
                                    to={`/admin/events/${id}/stats`}
                                    className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center"
                                >
                                    <FaUsers className="me-2" />
                                    <span>Event Statistics</span>
                                </Link>
                                <small className="text-muted d-block mt-2 text-center">
                                    View detailed event analytics
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Preview Modal */}
            {showPreview && previewTemplate && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Template Preview: {previewTemplate.name}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowPreview(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div
                                    className="border rounded p-3 bg-white"
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

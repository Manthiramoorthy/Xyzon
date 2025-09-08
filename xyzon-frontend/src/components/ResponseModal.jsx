import React, { useState } from 'react';
import { enquiryApi } from '../api/enquiryApi';
import './ResponseModal.css';

const ResponseModal = ({ enquiry, onClose, onSent }) => {
    const [responseData, setResponseData] = useState({
        subject: `Re: ${enquiry.subject}`,
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setResponseData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendResponse = async (e) => {
        e.preventDefault();

        if (!responseData.subject.trim() || !responseData.message.trim()) {
            setError('Subject and message are required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await enquiryApi.sendResponse(enquiry._id, responseData);

            if (response.success) {
                onSent();
            } else {
                setError(response.message || 'Failed to send response');
            }
        } catch (err) {
            setError('Failed to send response: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Quick response templates
    const quickTemplates = [
        {
            name: 'Acknowledgment',
            subject: `Re: ${enquiry.subject}`,
            message: `Dear ${enquiry.name},

Thank you for contacting us. We have received your enquiry and will get back to you within 24-48 hours with a detailed response.

If you have any urgent concerns, please don't hesitate to contact us directly.

Best regards,
Xyzon Team`
        },
        {
            name: 'More Information Needed',
            subject: `Re: ${enquiry.subject} - Additional Information Required`,
            message: `Dear ${enquiry.name},

Thank you for your enquiry. To assist you better, we need some additional information:

1. [Specify what information is needed]
2. [Add more details if required]

Please reply to this email with the requested information, and we'll be happy to help you further.

Best regards,
Xyzon Team`
        },
        {
            name: 'Issue Resolved',
            subject: `Re: ${enquiry.subject} - Issue Resolved`,
            message: `Dear ${enquiry.name},

We're pleased to inform you that your enquiry has been resolved.

[Provide details about the resolution]

If you have any further questions or concerns, please don't hesitate to contact us.

Best regards,
Xyzon Team`
        }
    ];

    const applyTemplate = (template) => {
        setResponseData({
            subject: template.subject,
            message: template.message
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content response-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Send Response</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                            <button onClick={() => setError('')}>×</button>
                        </div>
                    )}

                    {/* Original Enquiry Summary */}
                    <div className="original-enquiry">
                        <h3>Original Enquiry</h3>
                        <div className="enquiry-summary">
                            <div className="summary-item">
                                <strong>From:</strong> {enquiry.name} ({enquiry.email})
                            </div>
                            <div className="summary-item">
                                <strong>Date:</strong> {formatDate(enquiry.createdAt)}
                            </div>
                            <div className="summary-item">
                                <strong>Subject:</strong> {enquiry.subject}
                            </div>
                            <div className="summary-item message-preview">
                                <strong>Message:</strong>
                                <div className="message-text">
                                    {enquiry.message.length > 200
                                        ? `${enquiry.message.substring(0, 200)}...`
                                        : enquiry.message
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="quick-templates">
                        <h3>Quick Response Templates</h3>
                        <div className="templates-buttons">
                            {quickTemplates.map((template, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="template-btn"
                                    onClick={() => applyTemplate(template)}
                                    disabled={loading}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Response Form */}
                    <form onSubmit={handleSendResponse} className="response-form">
                        <div className="form-group">
                            <label htmlFor="subject">Subject *</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={responseData.subject}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                placeholder="Response subject"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message *</label>
                            <textarea
                                id="message"
                                name="message"
                                value={responseData.message}
                                onChange={handleInputChange}
                                required
                                rows="12"
                                disabled={loading}
                                placeholder="Type your response message here..."
                            />
                            <div className="character-count">
                                {responseData.message.length} characters
                            </div>
                        </div>

                        <div className="response-preview">
                            <h4>Email Preview</h4>
                            <div className="preview-content">
                                <div className="email-header">
                                    <div><strong>To:</strong> {enquiry.email}</div>
                                    <div><strong>Subject:</strong> {responseData.subject}</div>
                                </div>
                                <div className="email-body">
                                    {responseData.message.split('\n').map((line, index) => (
                                        <p key={index}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Previous Responses */}
                    {enquiry.responses && enquiry.responses.length > 0 && (
                        <div className="previous-responses">
                            <h3>Previous Responses</h3>
                            <div className="responses-list">
                                {enquiry.responses.slice(-3).map((response, index) => (
                                    <div key={index} className="response-summary">
                                        <div className="response-header">
                                            <strong>{response.subject}</strong>
                                            <span className="response-date">
                                                {formatDate(response.sentAt)}
                                            </span>
                                        </div>
                                        <div className="response-preview">
                                            {response.message.substring(0, 100)}
                                            {response.message.length > 100 ? '...' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSendResponse}
                        className="btn-primary"
                        disabled={loading || !responseData.subject.trim() || !responseData.message.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="spinner small"></span>
                                Sending...
                            </>
                        ) : (
                            <>
                                📧 Send Response
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResponseModal;

import React, { useState } from 'react';
import { enquiryApi } from '../api/enquiryApi';
import './EnquiryDetailsModal.css';

const EnquiryDetailsModal = ({ enquiry, onClose, onUpdate }) => {
    const [adminNote, setAdminNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddNote = async () => {
        if (!adminNote.trim()) return;

        try {
            setLoading(true);
            const response = await enquiryApi.updateEnquiry(enquiry._id, { adminNote: adminNote.trim() });

            if (response.success) {
                setAdminNote('');
                onUpdate();
                // Refresh the enquiry data
                window.location.reload(); // Simple refresh - you could make this more elegant
            }
        } catch (err) {
            setError('Failed to add note: ' + (err.message || 'Unknown error'));
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
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content enquiry-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Enquiry Details</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                            <button onClick={() => setError('')}>×</button>
                        </div>
                    )}

                    {/* Customer Information */}
                    <div className="details-section">
                        <h3>Customer Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{enquiry.name}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{enquiry.email}</span>
                            </div>
                            {enquiry.phone && (
                                <div className="info-item">
                                    <label>Phone:</label>
                                    <span>{enquiry.phone}</span>
                                </div>
                            )}
                            <div className="info-item">
                                <label>Category:</label>
                                <span className="category-tag">{enquiry.category}</span>
                            </div>
                            <div className="info-item">
                                <label>Status:</label>
                                <span className={`status-badge status-${enquiry.status}`}>
                                    {enquiry.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Priority:</label>
                                <span className={`priority-badge priority-${enquiry.priority}`}>
                                    {enquiry.priority}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Submitted:</label>
                                <span>{formatDate(enquiry.createdAt)}</span>
                            </div>
                            {enquiry.updatedAt !== enquiry.createdAt && (
                                <div className="info-item">
                                    <label>Last Updated:</label>
                                    <span>{formatDate(enquiry.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enquiry Content */}
                    <div className="details-section">
                        <h3>Enquiry Content</h3>
                        <div className="enquiry-content">
                            <div className="subject-box">
                                <label>Subject:</label>
                                <h4>{enquiry.subject}</h4>
                            </div>
                            <div className="message-box">
                                <label>Message:</label>
                                <div className="message-content">
                                    {enquiry.message.split('\n').map((line, index) => (
                                        <p key={index}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Information */}
                    <div className="details-section">
                        <h3>Technical Information</h3>
                        <div className="info-grid">
                            {enquiry.ipAddress && (
                                <div className="info-item">
                                    <label>IP Address:</label>
                                    <span className="technical-info">{enquiry.ipAddress}</span>
                                </div>
                            )}
                            {enquiry.userAgent && (
                                <div className="info-item full-width">
                                    <label>User Agent:</label>
                                    <span className="technical-info small">{enquiry.userAgent}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Responses */}
                    {enquiry.responses && enquiry.responses.length > 0 && (
                        <div className="details-section">
                            <h3>Responses Sent</h3>
                            <div className="responses-list">
                                {enquiry.responses.map((response, index) => (
                                    <div key={index} className="response-item">
                                        <div className="response-header">
                                            <h4>{response.subject}</h4>
                                            <span className="response-date">
                                                {formatDate(response.sentAt)} by {response.sentBy?.name || 'System'}
                                            </span>
                                        </div>
                                        <div className="response-message">
                                            {response.message.split('\n').map((line, idx) => (
                                                <p key={idx}>{line}</p>
                                            ))}
                                        </div>
                                        <div className="response-status">
                                            {response.emailSent ? (
                                                <span className="email-sent">✓ Email sent successfully</span>
                                            ) : (
                                                <span className="email-failed">⚠ Email delivery failed</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    {enquiry.adminNotes && enquiry.adminNotes.length > 0 && (
                        <div className="details-section">
                            <h3>Admin Notes</h3>
                            <div className="notes-list">
                                {enquiry.adminNotes.map((note, index) => (
                                    <div key={index} className="note-item">
                                        <div className="note-header">
                                            <span className="note-author">
                                                {note.addedBy?.name || 'Admin'}
                                            </span>
                                            <span className="note-date">
                                                {formatDate(note.addedAt)}
                                            </span>
                                        </div>
                                        <div className="note-content">
                                            {note.note}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add New Note */}
                    <div className="details-section">
                        <h3>Add Admin Note</h3>
                        <div className="add-note-form">
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add a private note for internal use..."
                                rows="4"
                                disabled={loading}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!adminNote.trim() || loading}
                                className="add-note-btn"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner small"></span>
                                        Adding...
                                    </>
                                ) : (
                                    'Add Note'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;

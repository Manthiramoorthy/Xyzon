import React, { useState } from 'react';
import { enquiryApi } from '../api/enquiryApi';
import './ContactForm.css';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        subject: '',
        message: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'technical', label: 'Technical Support' },
        { value: 'billing', label: 'Billing & Payment' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'feedback', label: 'Feedback' },
        { value: 'other', label: 'Other' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await enquiryApi.submitEnquiry(formData);

            if (response.success) {
                setSuccess(true);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    category: 'general',
                    subject: '',
                    message: ''
                });
            } else {
                setError(response.message || 'Failed to submit enquiry');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSuccess(false);
        setError('');
    };

    if (success) {
        return (
            <div className="contact-form-container">
                <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h3>Thank You!</h3>
                    <p>Your enquiry has been submitted successfully. We'll get back to you soon!</p>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="btn-secondary"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="contact-form-container">

            <form onSubmit={handleSubmit} className="contact-form">
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠</span>
                        {error}
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="Your full name"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="your.email@example.com"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            disabled={loading}
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="Brief description of your enquiry"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        placeholder="Please provide details about your enquiry..."
                        rows="6"
                        disabled={loading}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Sending...
                            </>
                        ) : (
                            'Send Message'
                        )}
                    </button>
                </div>
            </form>

            <div className="contact-info">
                <div className="contact-info-item">
                    <h4>Response Time</h4>
                    <p>We typically respond within 24 hours during business days.</p>
                </div>

                <div className="contact-info-item">
                    <h4>Business Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                </div>
            </div>
        </div>
    );
};

export default ContactForm;

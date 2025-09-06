import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import {
    FaSave, FaArrowLeft, FaCalendarAlt, FaImage, FaPlus, FaTrash,
    FaInfoCircle, FaTicketAlt, FaMapMarkerAlt, FaCertificate,
    FaClock, FaTag
} from 'react-icons/fa';

export default function EventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        shortDescription: '',
        eventType: 'free',
        price: 0,
        currency: 'INR',
        startDate: '',
        endDate: '',
        registrationStartDate: '',
        registrationEndDate: '',
        eventMode: 'online',
        eventLink: '',
        venue: '',
        address: '',
        maxParticipants: 100,
        category: 'Technology',
        tags: [],
        hasCertificate: false,
        status: 'draft',
        registrationQuestions: []
    });

    const [tagInput, setTagInput] = useState('');
    const [bannerFile, setBannerFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);

    useEffect(() => {
        if (isEdit) {
            loadEvent();
        } else {
            // Set default dates for new events
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const weekLater = new Date(now);
            weekLater.setDate(weekLater.getDate() + 7);

            setFormData(prev => ({
                ...prev,
                registrationStartDate: now.toISOString().slice(0, 16),
                registrationEndDate: tomorrow.toISOString().slice(0, 16),
                startDate: weekLater.toISOString().slice(0, 16),
                endDate: new Date(weekLater.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
            }));
        }
    }, [id, isEdit]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEvent(id);
            const event = response.data.data;

            setFormData({
                ...event,
                startDate: new Date(event.startDate).toISOString().slice(0, 16),
                endDate: new Date(event.endDate).toISOString().slice(0, 16),
                registrationStartDate: new Date(event.registrationStartDate).toISOString().slice(0, 16),
                registrationEndDate: new Date(event.registrationEndDate).toISOString().slice(0, 16),
                tags: event.tags || [],
                registrationQuestions: event.registrationQuestions || []
            });
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }));
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            _id: Date.now().toString(),
            question: '',
            type: 'text',
            options: [],
            required: false,
            order: formData.registrationQuestions.length + 1
        };
        setFormData(prev => ({
            ...prev,
            registrationQuestions: [...prev.registrationQuestions, newQuestion]
        }));
    };

    const handleUpdateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            registrationQuestions: prev.registrationQuestions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            )
        }));
    };

    const handleRemoveQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            registrationQuestions: prev.registrationQuestions.filter((_, i) => i !== index)
        }));
    };

    const handleAddOption = (questionIndex) => {
        const question = formData.registrationQuestions[questionIndex];
        const newOptions = [...(question.options || []), ''];
        handleUpdateQuestion(questionIndex, 'options', newOptions);
    };

    const handleUpdateOption = (questionIndex, optionIndex, value) => {
        const question = formData.registrationQuestions[questionIndex];
        const newOptions = question.options.map((opt, i) => i === optionIndex ? value : opt);
        handleUpdateQuestion(questionIndex, 'options', newOptions);
    };

    const handleRemoveOption = (questionIndex, optionIndex) => {
        const question = formData.registrationQuestions[questionIndex];
        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        handleUpdateQuestion(questionIndex, 'options', newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate dates
            const now = new Date();
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            const regStart = new Date(formData.registrationStartDate);
            const regEnd = new Date(formData.registrationEndDate);

            if (startDate <= endDate && regStart <= regEnd && regEnd <= startDate) {
                // Dates are valid
            } else {
                throw new Error('Please check your dates. Registration should end before event starts, and event end should be after start.');
            }

            let eventData;
            if (isEdit) {
                const response = await eventApi.updateEvent(id, formData);
                eventData = response.data.data;
            } else {
                const response = await eventApi.createEvent(formData);
                eventData = response.data.data;
            }

            // Upload images if any
            if (bannerFile || imageFiles.length > 0) {
                const imageFormData = new FormData();
                if (bannerFile) {
                    imageFormData.append('banner', bannerFile);
                }
                imageFiles.forEach(file => {
                    imageFormData.append('images', file);
                });

                try {
                    await eventApi.uploadEventImages(imageFormData);
                } catch (uploadError) {
                    console.warn('Image upload failed:', uploadError);
                }
            }

            alert(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
            navigate('/admin/events');
        } catch (error) {
            setError(error.message || error.response?.data?.message || 'Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        'Technology', 'Business', 'Education', 'Health', 'Arts', 'Sports',
        'Science', 'Music', 'Food', 'Travel', 'Finance', 'Marketing'
    ];

    if (loading && isEdit && !formData.title) {
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

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold">
                        <FaCalendarAlt className="text-primary me-3" />
                        {isEdit ? 'Edit Event' : 'Create New Event'}
                    </h1>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* Main Form */}
                    <div className="col-lg-8">
                        {/* Basic Information */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header">
                                <h5 className="fw-bold mb-0">
                                    <FaInfoCircle className="text-primary me-2" />
                                    Basic Information
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-bold">Event Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            required
                                            placeholder="Enter event title..."
                                        />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-bold">Short Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.shortDescription}
                                            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                            placeholder="Brief description for event cards..."
                                            maxLength="150"
                                        />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-bold">Description *</label>
                                        <textarea
                                            className="form-control"
                                            rows="6"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            required
                                            placeholder="Detailed description of your event..."
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Category *</label>
                                        <select
                                            className="form-select"
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Max Participants *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.maxParticipants}
                                            onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header">
                                <h5 className="fw-bold mb-0">
                                    <FaCalendarAlt className="text-primary me-2" />
                                    Event Details
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Event Type *</label>
                                        <select
                                            className="form-select"
                                            value={formData.eventType}
                                            onChange={(e) => handleInputChange('eventType', e.target.value)}
                                            required
                                        >
                                            <option value="free">Free</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>
                                    {formData.eventType === 'paid' && (
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Price (INR) *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    )}
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Event Mode *</label>
                                        <select
                                            className="form-select"
                                            value={formData.eventMode}
                                            onChange={(e) => handleInputChange('eventMode', e.target.value)}
                                            required
                                        >
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                {(formData.eventMode === 'online' || formData.eventMode === 'hybrid') && (
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Event Link</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={formData.eventLink}
                                            onChange={(e) => handleInputChange('eventLink', e.target.value)}
                                            placeholder="https://zoom.us/j/123456789"
                                        />
                                    </div>
                                )}

                                {(formData.eventMode === 'offline' || formData.eventMode === 'hybrid') && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Venue</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.venue}
                                                onChange={(e) => handleInputChange('venue', e.target.value)}
                                                placeholder="Event venue name"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Address</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                placeholder="Full address of the venue"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={formData.hasCertificate}
                                        onChange={(e) => handleInputChange('hasCertificate', e.target.checked)}
                                        id="hasCertificate"
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="hasCertificate">
                                        <FaCertificate className="text-warning me-2" />
                                        Issue certificates to attendees
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Date and Time */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header">
                                <h5 className="fw-bold mb-0">
                                    <FaClock className="text-primary me-2" />
                                    Date and Time
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Event Start *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={formData.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Event End *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={formData.endDate}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Registration Start *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={formData.registrationStartDate}
                                            onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Registration End *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={formData.registrationEndDate}
                                            onChange={(e) => handleInputChange('registrationEndDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header">
                                <h5 className="fw-bold mb-0">
                                    <FaTag className="text-primary me-2" />
                                    Tags
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="input-group mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="Add a tag..."
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={handleAddTag}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {formData.tags.map((tag, index) => (
                                        <span key={index} className="badge bg-primary d-flex align-items-center gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white"
                                                style={{ fontSize: '0.7em' }}
                                                onClick={() => handleRemoveTag(index)}
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Registration Questions */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Registration Questions</h5>
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleAddQuestion}
                                >
                                    <FaPlus className="me-1" />
                                    Add Question
                                </button>
                            </div>
                            <div className="card-body">
                                {formData.registrationQuestions.length === 0 ? (
                                    <p className="text-muted text-center py-3">
                                        No registration questions added yet. Click "Add Question" to create custom questions for registrants.
                                    </p>
                                ) : (
                                    formData.registrationQuestions.map((question, qIndex) => (
                                        <div key={question._id} className="border rounded p-3 mb-3">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <h6 className="fw-bold mb-0">Question {qIndex + 1}</h6>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleRemoveQuestion(qIndex)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-8 mb-3">
                                                    <label className="form-label">Question Text</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={question.question}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                                                        placeholder="Enter your question..."
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <label className="form-label">Question Type</label>
                                                    <select
                                                        className="form-select"
                                                        value={question.type}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, 'type', e.target.value)}
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="textarea">Textarea</option>
                                                        <option value="select">Select</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {question.type === 'select' && (
                                                <div className="mb-3">
                                                    <label className="form-label">Options</label>
                                                    {(question.options || []).map((option, oIndex) => (
                                                        <div key={oIndex} className="input-group mb-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={option}
                                                                onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                                                placeholder={`Option ${oIndex + 1}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => handleAddOption(qIndex)}
                                                    >
                                                        <FaPlus className="me-1" />
                                                        Add Option
                                                    </button>
                                                </div>
                                            )}

                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={question.required}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, 'required', e.target.checked)}
                                                    id={`required-${qIndex}`}
                                                />
                                                <label className="form-check-label" htmlFor={`required-${qIndex}`}>
                                                    Required question
                                                </label>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-4">
                        {/* Image Upload */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-header">
                                <h5 className="fw-bold mb-0">
                                    <FaImage className="text-primary me-2" />
                                    Images
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Event Banner</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => setBannerFile(e.target.files[0])}
                                    />
                                    <small className="text-muted">Recommended: 1200x600px</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Additional Images</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setImageFiles(Array.from(e.target.files))}
                                    />
                                    <small className="text-muted">Max 5 images, 5MB each</small>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="me-2" />
                                                {isEdit ? 'Update Event' : 'Create Event'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/admin/events')}
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {isEdit && (
                                    <div className="mt-3 pt-3 border-top">
                                        <small className="text-muted">
                                            <strong>Created:</strong><br />
                                            {new Date(formData.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../auth/AuthContext';
import {
    FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag,
    FaTicketAlt, FaGlobe, FaWifi, FaArrowLeft, FaShare,
    FaCertificate, FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { fetchEvent, registerForEvent, createRazorpayOrder, verifyPayment, loading, error } = useEvent();
    const [event, setEvent] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        answers: []
    });
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            const eventData = await fetchEvent(id);
            setEvent(eventData);
            // Initialize answers for registration questions
            if (eventData.registrationQuestions) {
                setRegistrationData(prev => ({
                    ...prev,
                    answers: eventData.registrationQuestions.map(q => ({
                        questionId: q._id,
                        question: q.question,
                        answer: ''
                    }))
                }));
            }
        } catch (error) {
            console.error('Error loading event:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getEventModeIcon = (mode) => {
        switch (mode) {
            case 'online': return <FaWifi className="text-info" />;
            case 'offline': return <FaMapMarkerAlt className="text-warning" />;
            case 'hybrid': return <FaGlobe className="text-success" />;
            default: return <FaGlobe />;
        }
    };

    const isRegistrationOpen = () => {
        if (!event) return false;
        const now = new Date();
        return new Date(event.registrationStartDate) <= now &&
            new Date(event.registrationEndDate) > now;
    };

    const isUpcoming = () => {
        if (!event) return false;
        return new Date(event.startDate) > new Date();
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        setRegistering(true);
        try {
            if (event.eventType === 'paid') {
                // Create Razorpay order
                const orderData = await createRazorpayOrder({
                    eventId: event._id,
                    amount: event.price
                });

                // Initialize Razorpay
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Xyzon Events',
                    description: event.title,
                    order_id: orderData.id,
                    handler: async (response) => {
                        try {
                            // Verify payment
                            await verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                registrationData
                            });

                            alert('Registration successful! You will receive a confirmation email shortly.');
                            navigate('/user/registrations');
                        } catch (error) {
                            alert('Payment verification failed. Please try again.');
                        }
                    },
                    prefill: {
                        name: registrationData.name,
                        email: registrationData.email,
                        contact: registrationData.phone
                    },
                    theme: {
                        color: '#000066'
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                // Free event registration
                await registerForEvent(event._id, registrationData);
                alert('Registration successful! You will receive a confirmation email shortly.');
                navigate('/user/registrations');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setRegistrationData(prev => ({
            ...prev,
            answers: prev.answers.map(a =>
                a.questionId === questionId ? { ...a, answer } : a
            )
        }));
    };

    const shareEvent = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.shortDescription,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Event link copied to clipboard!');
        }
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

    if (error || !event) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <FaExclamationTriangle size={64} className="text-warning mb-3" />
                    <h4>Event not found</h4>
                    <p className="text-muted">The event you're looking for doesn't exist or has been removed.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/events')}>
                        <FaArrowLeft className="me-2" />
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">

            <div className="row">
                {/* Event Details */}
                <div className="col-lg-8">
                    {/* Event Banner */}
                    {event.bannerUrl && (
                        <img
                            src={event.bannerUrl}
                            alt={event.title}
                            className="img-fluid rounded mb-4"
                            style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                        />
                    )}

                    {/* Event Header */}
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                            <h1 className="fw-bold">{event.title}</h1>
                            <p className="text-muted lead">{event.shortDescription}</p>
                        </div>
                        <button className="btn btn-outline-secondary" onClick={shareEvent}>
                            <FaShare className="me-2" />
                            Share
                        </button>
                    </div>

                    {/* Event Info */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-3">
                                <FaInfoCircle className="text-primary me-2" />
                                Event Information
                            </h5>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center mb-3">
                                        <FaCalendarAlt className="text-primary me-3" />
                                        <div>
                                            <div className="fw-bold">Date</div>
                                            <div>{formatDate(event.startDate)}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <FaClock className="text-info me-3" />
                                        <div>
                                            <div className="fw-bold">Time</div>
                                            <div>{formatTime(event.startDate)} - {formatTime(event.endDate)}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        {getEventModeIcon(event.eventMode)}
                                        <div className="ms-3">
                                            <div className="fw-bold">Mode</div>
                                            <div className="text-capitalize">{event.eventMode}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    {event.eventMode !== 'online' && event.venue && (
                                        <div className="d-flex align-items-center mb-3">
                                            <FaMapMarkerAlt className="text-warning me-3" />
                                            <div>
                                                <div className="fw-bold">Venue</div>
                                                <div>{event.venue}</div>
                                                {event.address && <small className="text-muted">{event.address}</small>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="d-flex align-items-center mb-3">
                                        <FaUsers className="text-success me-3" />
                                        <div>
                                            <div className="fw-bold">Capacity</div>
                                            <div>{event.maxParticipants} participants</div>
                                        </div>
                                    </div>
                                    {event.category && (
                                        <div className="d-flex align-items-center mb-3">
                                            <FaTag className="text-secondary me-3" />
                                            <div>
                                                <div className="fw-bold">Category</div>
                                                <div>{event.category}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Description */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-3">About This Event</h5>
                            <div dangerouslySetInnerHTML={{ __html: event.description }} />
                        </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                        <div className="mb-4">
                            <h6 className="fw-bold mb-2">Tags</h6>
                            {event.tags.map((tag, index) => (
                                <span key={index} className="badge bg-light text-dark me-2 mb-2">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Registration Sidebar */}
                <div className="col-lg-4">
                    <div className="card shadow-sm sticky-top" style={{ top: '100px' }}>
                        <div className="card-body">
                            {/* Price */}
                            <div className="text-center mb-4">
                                <div className="display-6 fw-bold text-primary">
                                    <FaTicketAlt className="me-2" />
                                    {event.eventType === 'paid' ? `₹${event.price}` : 'Free'}
                                </div>
                                {event.hasCertificate && (
                                    <div className="text-success mt-2">
                                        <FaCertificate className="me-2" />
                                        Certificate included
                                    </div>
                                )}
                            </div>

                            {/* Registration Status */}
                            {!isUpcoming() ? (
                                <div className="alert alert-secondary text-center">
                                    <FaExclamationTriangle className="me-2" />
                                    Event has ended
                                </div>
                            ) : !isRegistrationOpen() ? (
                                <div className="alert alert-warning text-center">
                                    <FaExclamationTriangle className="me-2" />
                                    Registration closed
                                </div>
                            ) : !user ? (
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={() => navigate('/login')}
                                    >
                                        Login to Register
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {!showRegistrationForm ? (
                                        <div className="d-grid">
                                            <button
                                                className="btn btn-primary btn-lg"
                                                onClick={() => setShowRegistrationForm(true)}
                                            >
                                                Register Now
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleRegistrationSubmit}>
                                            <h6 className="fw-bold mb-3">Registration Details</h6>

                                            <div className="mb-3">
                                                <label className="form-label">Full Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={registrationData.name}
                                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Email *</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={registrationData.email}
                                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={registrationData.phone}
                                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                                                    required
                                                />
                                            </div>

                                            {/* Registration Questions */}
                                            {event.registrationQuestions && event.registrationQuestions.map((question) => (
                                                <div key={question._id} className="mb-3">
                                                    <label className="form-label">
                                                        {question.question}
                                                        {question.required && ' *'}
                                                    </label>
                                                    {question.type === 'select' ? (
                                                        <select
                                                            className="form-select"
                                                            required={question.required}
                                                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                                        >
                                                            <option value="">Select an option</option>
                                                            {question.options.map((option, idx) => (
                                                                <option key={idx} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    ) : question.type === 'textarea' ? (
                                                        <textarea
                                                            className="form-control"
                                                            rows="3"
                                                            required={question.required}
                                                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            required={question.required}
                                                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}

                                            <div className="d-grid gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={registering}
                                                >
                                                    {registering ? (
                                                        <>
                                                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        event.eventType === 'paid' ? `Pay ₹${event.price}` : 'Register Free'
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setShowRegistrationForm(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}

                            {/* Registration Dates */}
                            <div className="mt-4 pt-3 border-top">
                                <small className="text-muted">
                                    <div><strong>Registration Opens:</strong></div>
                                    <div>{formatDate(event.registrationStartDate)}</div>
                                    <div className="mt-2"><strong>Registration Closes:</strong></div>
                                    <div>{formatDate(event.registrationEndDate)}</div>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { eventApi, registrationApi } from '../api/eventApi';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaUsers, FaTag, FaMoneyBillWave, FaGlobe, FaWifi,
    FaTicketAlt, FaCertificate, FaInfoCircle
} from 'react-icons/fa';

export default function EventRegister() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [error, setError] = useState(null);
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        answers: []
    });

    useEffect(() => {
        loadEvent();
    }, [id]);

    useEffect(() => {
        // Pre-fill user data if logged in
        if (user) {
            setRegistrationData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEvent(id);
            const eventData = response.data.data;
            setEvent(eventData);

            // Initialize answers for registration questions
            if (eventData.registrationQuestions?.length > 0) {
                setRegistrationData(prev => ({
                    ...prev,
                    answers: eventData.registrationQuestions.map(q => ({
                        questionId: q._id || Math.random().toString(),
                        question: q.question,
                        answer: ''
                    }))
                }));
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setRegistrationData(prev => ({ ...prev, [field]: value }));
    };

    const handleAnswerChange = (questionId, answer) => {
        setRegistrationData(prev => ({
            ...prev,
            answers: prev.answers.map(a =>
                a.questionId === questionId ? { ...a, answer } : a
            )
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        setRegistering(true);
        try {
            if (event.eventType === 'paid') {
                // 1. Create Razorpay order (no registration yet)
                const orderResponse = await registrationApi.createRazorpayOrder({
                    eventId: event._id
                });

                console.log('Order Response:', orderResponse);
                console.log('Order Response Data:', orderResponse.data);

                // Extract orderId from the nested data structure
                const orderId = orderResponse.data?.data?.orderId || orderResponse.data?.orderId || orderResponse.data?.id;
                console.log('Extracted Order ID:', orderId);

                if (!orderId) {
                    console.error('No order ID found in response:', orderResponse);
                    window.toast && window.toast.error ? window.toast.error('Failed to create payment order. Please try again.') : alert('Failed to create payment order. Please try again.');
                    return;
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: event.price * 100, // Always use event.price * 100 for display
                    currency: orderResponse.data.currency,
                    name: 'Xyzon Events',
                    description: event.title,
                    order_id: orderId,
                    handler: async (response) => {
                        try {
                            console.log('Razorpay Response:', response);

                            // Check if all required fields are present
                            if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
                                console.error('Missing required fields in Razorpay response:', {
                                    order_id: response.razorpay_order_id,
                                    payment_id: response.razorpay_payment_id,
                                    signature: response.razorpay_signature
                                });
                                window.toast && window.toast.error ? window.toast.error('Payment incomplete. Missing verification data.') : alert('Payment incomplete. Missing verification data.');
                                return;
                            }

                            // 2. Verify payment
                            await registrationApi.verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            // 3. Create registration with the paid order
                            await registrationApi.registerAfterPayment({
                                ...registrationData,
                                razorpay_order_id: response.razorpay_order_id
                            });

                            window.toast && window.toast.success ? window.toast.success('Registration successful! You will receive a confirmation email shortly.') : alert('Registration successful! You will receive a confirmation email shortly.');
                            navigate('/user/registrations');
                        } catch (error) {
                            console.log(error)
                            window.toast && window.toast.error ? window.toast.error('Payment verification or registration failed. Please try again.') : alert('Payment verification or registration failed. Please try again.');
                        }
                    },
                    prefill: {
                        name: registrationData.name,
                        email: registrationData.email,
                        contact: registrationData.phone
                    },
                    theme: {
                        color: '#000066'
                    },
                    modal: {
                        ondismiss: () => {
                            window.toast && window.toast.info ? window.toast.info('Payment cancelled.') : alert('Payment cancelled.');
                        }
                    }
                };
                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                // Free event registration
                await registrationApi.registerForEvent(event._id, registrationData);
                window.toast && window.toast.success ? window.toast.success('Registration successful! You will receive a confirmation email shortly.') : alert('Registration successful! You will receive a confirmation email shortly.');
                navigate('/user/registrations');
            }
        } catch (error) {
            console.log(error);
            window.toast && window.toast.error ? window.toast.error(error.response?.data?.message || 'Registration failed. Please try again.') : alert(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setRegistering(false);
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
            minute: '2-digit'
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
                <button
                    onClick={() => navigate('/events')}
                    className="btn btn-primary"
                >
                    <FaArrowLeft className="me-2" />
                    Back to Events
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning" role="alert">
                    Event not found
                </div>
                <button
                    onClick={() => navigate('/events')}
                    className="btn btn-primary"
                >
                    <FaArrowLeft className="me-2" />
                    Back to Events
                </button>
            </div>
        );
    }

    const registrationOpen = isRegistrationOpen();
    const eventUpcoming = isUpcoming();

    return (
        <div className="container py-5">
            <div className="row">
                {/* Event Summary */}
                <div className="col-lg-4 mb-4">
                    <div className="card sticky-top" style={{ top: '100px' }}>
                        {event.bannerUrl && (
                            <img
                                src={event.bannerUrl}
                                alt={event.title}
                                className="card-img-top"
                                style={{ height: '200px', objectFit: 'cover' }}
                            />
                        )}
                        <div className="card-body">
                            <h5 className="card-title fw-bold">{event.title}</h5>
                            <p className="card-text text-muted">
                                {event.shortDescription}
                            </p>

                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                    <FaCalendarAlt className="text-primary me-2" />
                                    <small>
                                        <strong>{formatDate(event.startDate)}</strong>
                                    </small>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <FaClock className="text-primary me-2" />
                                    <small>
                                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                    </small>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    {event.eventMode === 'online' ? (
                                        <>
                                            <FaWifi className="text-primary me-2" />
                                            <small>Online Event</small>
                                        </>
                                    ) : event.eventMode === 'offline' ? (
                                        <>
                                            <FaMapMarkerAlt className="text-primary me-2" />
                                            <small>{event.venue || 'Venue TBA'}</small>
                                        </>
                                    ) : (
                                        <>
                                            <FaGlobe className="text-primary me-2" />
                                            <small>Hybrid Event</small>
                                        </>
                                    )}
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <FaUsers className="text-primary me-2" />
                                    <small>{event.maxParticipants} participants max</small>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <FaTag className="text-primary me-2" />
                                    <small>{event.category}</small>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className={`h4 fw-bold ${event.eventType === 'paid' ? 'text-primary' : 'text-success'}`}>
                                    {event.eventType === 'paid' ?
                                        `₹${event.price}` :
                                        'FREE'
                                    }
                                </div>
                                {event.hasCertificate && (
                                    <small className="text-muted d-block">
                                        <FaCertificate className="me-1" />
                                        Certificate included
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">
                                <FaTicketAlt className="me-2" />
                                Event Registration
                            </h4>
                        </div>
                        <div className="card-body">
                            {!registrationOpen ? (
                                <div className="alert alert-warning">
                                    <FaInfoCircle className="me-2" />
                                    {!eventUpcoming ?
                                        'This event has already ended.' :
                                        'Registration is currently closed for this event.'
                                    }
                                </div>
                            ) : !user ? (
                                <div className="alert alert-info">
                                    <FaInfoCircle className="me-2" />
                                    You need to be logged in to register for this event.
                                    <div className="mt-2">
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="btn btn-primary btn-sm me-2"
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => navigate('/register')}
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            Create Account
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {/* Basic Information */}
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={registrationData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Email *</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={registrationData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={registrationData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Organization</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={registrationData.organization}
                                                onChange={(e) => handleInputChange('organization', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Questions */}
                                    {event.registrationQuestions?.length > 0 && (
                                        <div className="mb-4">
                                            <h6>Additional Information</h6>
                                            {event.registrationQuestions.map((question, index) => {
                                                const answer = registrationData.answers.find(a =>
                                                    a.questionId === (question._id || question.id)
                                                );
                                                return (
                                                    <div key={question._id || index} className="mb-3">
                                                        <label className="form-label">
                                                            {question.question}
                                                            {question.required && <span className="text-danger"> *</span>}
                                                        </label>
                                                        {question.type === 'text' && (
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={answer?.answer || ''}
                                                                onChange={(e) => handleAnswerChange(
                                                                    question._id || question.id,
                                                                    e.target.value
                                                                )}
                                                                required={question.required}
                                                            />
                                                        )}
                                                        {question.type === 'textarea' && (
                                                            <textarea
                                                                className="form-control"
                                                                rows="3"
                                                                value={answer?.answer || ''}
                                                                onChange={(e) => handleAnswerChange(
                                                                    question._id || question.id,
                                                                    e.target.value
                                                                )}
                                                                required={question.required}
                                                            />
                                                        )}
                                                        {question.type === 'select' && (
                                                            <select
                                                                className="form-select"
                                                                value={answer?.answer || ''}
                                                                onChange={(e) => handleAnswerChange(
                                                                    question._id || question.id,
                                                                    e.target.value
                                                                )}
                                                                required={question.required}
                                                            >
                                                                <option value="">Select an option</option>
                                                                {question.options?.map((option, idx) => (
                                                                    <option key={idx} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className={`btn btn-lg ${event.eventType === 'paid' ? 'btn-primary' : 'btn-success'}`}
                                            disabled={registering}
                                        >
                                            {registering ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm me-2" />
                                                    Processing...
                                                </>
                                            ) : event.eventType === 'paid' ? (
                                                <>
                                                    <FaMoneyBillWave className="me-2" />
                                                    Pay ₹{event.price} & Register
                                                </>
                                            ) : (
                                                <>
                                                    <FaTicketAlt className="me-2" />
                                                    Register for Free
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {event.eventType === 'paid' && (
                                        <div className="text-center mt-3">
                                            <small className="text-muted">
                                                Secure payment powered by Razorpay
                                            </small>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

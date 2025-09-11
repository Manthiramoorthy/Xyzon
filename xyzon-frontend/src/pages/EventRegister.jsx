import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { eventApi, registrationApi } from '../api/eventApi';
import {
    FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt,
    FaUsers, FaTag, FaMoneyBillWave, FaGlobe, FaWifi,
    FaTicketAlt, FaCertificate, FaInfoCircle, FaCheck, FaSpinner, FaShieldAlt, FaRupeeSign, FaTags
} from 'react-icons/fa';

export default function EventRegister() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [paymentStage, setPaymentStage] = useState('idle'); // idle|creating|waiting_gateway|verifying|registering|completed|failed|cancelled
    const [activePaymentMeta, setActivePaymentMeta] = useState(null); // {paymentId, orderId}
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [gatewayError, setGatewayError] = useState(null);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        answers: []
    });

    useEffect(() => { loadEvent(); }, [id]);
    // Countdown (registration end or event start)
    useEffect(() => {
        if (!event) return;
        const target = isRegistrationOpen() ? new Date(event.registrationEndDate) : new Date(event.startDate);
        const interval = setInterval(() => {
            const now = new Date();
            const diff = target - now;
            if (diff <= 0) {
                setCountdown('Starting soon');
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            setCountdown(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m`);
        }, 60000);
        // immediate tick
        const now = new Date();
        const diffNow = target - now;
        if (diffNow <= 0) setCountdown('Starting soon');
        else {
            const d = Math.floor(diffNow / (1000 * 60 * 60 * 24));
            const h = Math.floor((diffNow / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diffNow / (1000 * 60)) % 60);
            setCountdown(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m`);
        }
        return () => clearInterval(interval);
    }, [event]);

    const currency = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

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

    // If user logs out mid-flow, reset payment state gracefully
    useEffect(() => {
        if (!user && paymentStage !== 'idle' && paymentStage !== 'completed') {
            setPaymentStage('idle');
            setRegistering(false);
            toast.info('You have been logged out. Please log in again to continue registration.');
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

    const STAGES = useMemo(() => ([
        { key: 'creating', label: 'Creating order' },
        { key: 'waiting_gateway', label: 'Waiting for payment' },
        { key: 'verifying', label: 'Verifying payment' },
        { key: 'registering', label: 'Finalizing registration' }
    ]), []);

    const resetPaymentFlow = () => {
        setPaymentStage('idle');
        setActivePaymentMeta(null);
        setGatewayError(null);
        setRegistering(false);
    };

    const retryPayment = () => {
        resetPaymentFlow();
        // Slight delay to ensure state reset
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => { } };
            handleSubmit(fakeEvent);
        }, 50);
    };

    const stageDescription = (stage) => {
        switch (stage) {
            case 'creating': return 'Contacting payment gateway...';
            case 'waiting_gateway': return 'Complete the payment in the Razorpay popup. Do not refresh.';
            case 'verifying': return 'Verifying your payment. Please wait.';
            case 'registering': return 'Payment verified. Creating your registration...';
            case 'failed': return 'Something went wrong. You can retry the payment.';
            case 'cancelled': return 'Payment cancelled/closed. You can start a new attempt.';
            case 'completed': return 'All done! Redirecting...';
            default: return '';
        }
    };

    const currentStageIndex = STAGES.findIndex(s => s.key === paymentStage);
    const progressPercent = useMemo(() => {
        if (paymentStage === 'idle') return 0;
        if (paymentStage === 'completed') return 100;
        if (paymentStage === 'failed' || paymentStage === 'cancelled') {
            if (currentStageIndex === -1) return 0;
            return Math.round(((currentStageIndex + 1) / (STAGES.length + 1)) * 100);
        }
        if (currentStageIndex >= 0) {
            return Math.round(((currentStageIndex + 1) / (STAGES.length + 1)) * 100);
        }
        return 0;
    }, [paymentStage, currentStageIndex, STAGES.length]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate('/login');
            return;
        }

        setRegistering(true);
        setGatewayError(null);
        try {
            if (event.eventType === 'paid') {
                setPaymentStage('creating');
                // 1. Create Razorpay order (no registration yet) with potential reuse
                let orderResponse;
                try {
                    orderResponse = await registrationApi.createRazorpayOrder({
                        eventId: event._id,
                        reuseExisting: true
                    });
                } catch (err) {
                    // If payment in progress, show modal to user to choose
                    if (err.response?.data?.code === 'PAYMENT_IN_PROGRESS') {
                        setActivePaymentMeta({ paymentId: err.response.data.paymentId });
                        setPaymentStage('idle');
                        setShowPaymentModal(true);
                        toast.info('You have an ongoing payment attempt.');
                        return;
                    }
                    throw err;
                }

                console.log('Order Response:', orderResponse);
                console.log('Order Response Data:', orderResponse.data);

                // Extract orderId from the nested data structure
                const orderId = orderResponse.data?.data?.orderId || orderResponse.data?.orderId || orderResponse.data?.id;
                console.log('Extracted Order ID:', orderId);

                if (!orderId) {
                    console.error('No order ID found in response:', orderResponse);
                    toast.error('Failed to create payment order. Please try again.');
                    return;
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: event.price * 100, // Always use event.price * 100 for display
                    currency: orderResponse.data.currency,
                    name: `Xyzon Events - ${event.title}`,
                    description: event.shortDescription || event.title,
                    order_id: orderId,
                    handler: async (response) => {
                        try {
                            setPaymentStage('verifying');
                            console.log('Razorpay Response:', response);

                            // Check if all required fields are present
                            if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
                                console.error('Missing required fields in Razorpay response:', {
                                    order_id: response.razorpay_order_id,
                                    payment_id: response.razorpay_payment_id,
                                    signature: response.razorpay_signature
                                });
                                toast.error('Payment incomplete. Missing verification data.');
                                return;
                            }

                            // 2. Verify payment
                            await registrationApi.verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            // 3. Create registration with the paid order
                            setPaymentStage('registering');
                            await registrationApi.registerAfterPayment({
                                ...registrationData,
                                razorpay_order_id: response.razorpay_order_id
                            });

                            setPaymentStage('completed');
                            toast.success('Registration successful! You will receive a confirmation email shortly.');
                            navigate('/user/registrations');
                        } catch (error) {
                            console.log(error)
                            setPaymentStage('failed');
                            toast.error(error.response?.data?.message || 'Payment verification or registration failed.');
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
                            setPaymentStage('cancelled');
                            toast.info('Payment popup closed. You can retry.');
                        }
                    }
                };
                const razorpay = new window.Razorpay(options);
                setPaymentStage('waiting_gateway');
                razorpay.open();
            } else {
                // Free event registration
                setPaymentStage('registering');
                await registrationApi.registerForEvent(event._id, registrationData);
                setPaymentStage('completed');
                toast.success('Registration successful! You will receive a confirmation email shortly.');
                navigate('/user/registrations');
            }
        } catch (error) {
            console.log(error);
            setPaymentStage(p => (p === 'idle' || p === 'creating' || p === 'waiting_gateway') ? 'failed' : p);
            toast.error(error.response?.data?.message || 'Registration / payment failed.');
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
        <div className="container py-4">
            {/* Payment progress overlay */}
            {paymentStage !== 'idle' && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)', zIndex: 1050 }}>
                    <div className="card shadow-sm border-0" style={{ maxWidth: 440, width: '92%' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">{paymentStage === 'completed' ? 'Payment Complete' : 'Processing Payment'}</h6>
                                {(paymentStage === 'failed' || paymentStage === 'cancelled') && (
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetPaymentFlow}>Close</button>
                                )}
                            </div>
                            <div className="progress mb-3" style={{ height: 6 }}>
                                <div className={`progress-bar ${paymentStage === 'failed' ? 'bg-danger' : paymentStage === 'cancelled' ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${progressPercent}%`, transition: 'width .4s' }} />
                            </div>
                            <ul className="list-unstyled small mb-3 d-flex flex-column gap-1">
                                {STAGES.map((step, idx) => {
                                    const isActive = paymentStage === step.key;
                                    const isDone = ['completed', 'failed', 'cancelled'].includes(paymentStage) ? currentStageIndex > idx : currentStageIndex > idx;
                                    return (
                                        <li key={step.key} className={(isActive ? 'fw-semibold text-primary ' : isDone ? 'text-success ' : 'text-muted ') + 'd-flex align-items-center'}>
                                            {isActive ? <FaSpinner className="fa-spin me-2" /> : isDone ? <FaCheck className="me-2" /> : <span className="me-2" style={{ width: 14 }} />}
                                            {idx + 1}. {step.label}
                                        </li>
                                    );
                                })}
                                <li className={(paymentStage === 'completed' ? 'fw-semibold text-success ' : 'text-muted ') + 'd-flex align-items-center'}>
                                    {paymentStage === 'completed' ? <FaCheck className="me-2" /> : <span className="me-2" style={{ width: 14 }} />}
                                    {STAGES.length + 1}. Done
                                </li>
                            </ul>
                            {paymentStage !== 'idle' && paymentStage !== 'completed' && (
                                <div className={`alert py-2 small mb-3 ${paymentStage === 'failed' ? 'alert-danger' : paymentStage === 'cancelled' ? 'alert-warning' : 'alert-info'}`}>{stageDescription(paymentStage)}</div>
                            )}
                            {paymentStage === 'completed' && (
                                <div className="alert alert-success py-2 small mb-3">Registration successful. Redirecting...</div>
                            )}
                            {(paymentStage === 'failed' || paymentStage === 'cancelled') && (
                                <div className="d-flex justify-content-end gap-2">
                                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={resetPaymentFlow}>Close</button>
                                    <button className="btn btn-primary btn-sm" type="button" onClick={retryPayment}>Retry Payment</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="row g-4">
                {/* Left Column: Event Details */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                        {event.bannerUrl && (
                            <div className="position-relative">
                                <img src={event.bannerUrl} alt={event.title} className="w-100" style={{ height: 210, objectFit: 'cover' }} />
                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.65))' }} />
                                <div className="position-absolute bottom-0 start-0 p-3 text-white w-100">
                                    <h5 className="fw-bold mb-1">{event.title}</h5>
                                    <div className="d-flex flex-wrap gap-2 small">
                                        <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1"><FaCalendarAlt /> {formatDate(event.startDate)}</span>
                                        <span className="badge bg-light text-dark d-inline-flex align-items-center gap-1"><FaClock /> {formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                                        {event.hasCertificate && <span className="badge bg-success d-inline-flex align-items-center gap-1"><FaCertificate /> Certificate</span>}
                                        <span className={`badge ${event.eventType === 'paid' ? 'bg-primary' : 'bg-success'}`}>{event.eventType === 'paid' ? currency(event.price) : 'FREE'}</span>
                                    </div>
                                </div>
                            </div>)}
                        <div className="card-body">
                            <p className="text-muted small mb-3">{event.shortDescription}</p>
                            <div className="mb-3 d-flex flex-wrap gap-2">
                                <span className="badge bg-secondary-subtle text-dark border d-inline-flex align-items-center gap-1"><FaUsers /> {event.maxParticipants} max</span>
                                <span className="badge bg-secondary-subtle text-dark border d-inline-flex align-items-center gap-1"><FaTag /> {event.category}</span>
                                {event.eventMode === 'online' && <span className="badge bg-info-subtle text-dark border d-inline-flex align-items-center gap-1"><FaWifi /> Online</span>}
                                {event.eventMode === 'offline' && <span className="badge bg-info-subtle text-dark border d-inline-flex align-items-center gap-1"><FaMapMarkerAlt /> {event.venue || 'Venue TBA'}</span>}
                                {event.eventMode === 'hybrid' && <span className="badge bg-info-subtle text-dark border d-inline-flex align-items-center gap-1"><FaGlobe /> Hybrid</span>}
                            </div>
                            <div className="mb-3 p-3 rounded bg-light border small">
                                <div className="d-flex justify-content-between"><span className="text-muted">Registration {isRegistrationOpen() ? 'ends in' : 'opens / starts'}</span><strong>{countdown}</strong></div>
                                <div className="mt-2"><span className="text-muted">Window:</span> {formatDate(event.registrationStartDate)} – {formatDate(event.registrationEndDate)}</div>
                            </div>
                            <div className="mb-3">
                                <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2"><FaInfoCircle /> About this event</h6>
                                <div className="small" style={!showFullDescription ? { maxHeight: 120, overflow: 'hidden' } : {}} dangerouslySetInnerHTML={{ __html: (event.description || '').replace(/\n/g, '<br/>') }} />
                                {(event.description || '').length > 400 && (
                                    <button type="button" className="btn btn-link p-0 mt-1 small" onClick={() => setShowFullDescription(s => !s)}>
                                        {showFullDescription ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                            {event.tags?.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="fw-semibold small text-uppercase text-muted mb-2 d-flex align-items-center gap-1"><FaTags /> Tags</h6>
                                    <div className="d-flex flex-wrap gap-1">
                                        {event.tags.map((t, i) => <span key={i} className="badge bg-dark-subtle text-dark border">{t}</span>)}
                                    </div>
                                </div>
                            )}
                            {event.eventMode !== 'online' && (event.address || event.venue) && (
                                <div className="mb-3 small">
                                    <h6 className="fw-semibold mb-1">Venue & Address</h6>
                                    <div>{event.venue}</div>
                                    <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{event.address}</div>
                                    {(event.address || event.venue) && <a rel="noreferrer" target="_blank" className="small d-inline-block mt-1" href={`https://www.google.com/maps/search/${encodeURIComponent(event.venue || '') + ' ' + encodeURIComponent(event.address || '')}`}>Open in Google Maps →</a>}
                                </div>
                            )}
                            {event.hasCertificate && (
                                <div className="alert alert-success py-2 small d-flex align-items-start gap-2"><FaCertificate className="mt-1" /> <div><strong>Certificate:</strong> Participants will receive an official certificate upon completion / attendance.</div></div>
                            )}
                            <div className="border rounded p-3 small bg-white shadow-sm">
                                <div className="d-flex align-items-center gap-2 mb-2"><FaShieldAlt className="text-primary" /><strong className="small mb-0">Secure Registration</strong></div>
                                <ul className="mb-0 ps-3">
                                    <li>Encrypted payment (Razorpay)</li>
                                    <li>Instant confirmation email</li>
                                    <li>No card details stored on our servers</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    {event.eventType === 'paid' && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body p-3" style={{ background: 'linear-gradient(135deg,#001d6e,#003cba)', color: '#fff' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-semibold d-flex align-items-center gap-2"><FaMoneyBillWave /> Payment Details</span>
                                    <span className="badge bg-light text-dark">{currency(event.price)}</span>
                                </div>
                                <div className="small mb-2">One-time fee. Includes access to all sessions{event.hasCertificate ? ' + certificate issuance' : ''}.</div>
                                <ul className="small mb-0 ps-3">
                                    <li>No hidden charges</li>
                                    <li>UPI / Card / Netbanking supported</li>
                                    <li>GST inclusive (if applicable)</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Registration Form */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 border-bottom">
                            <div className="d-flex flex-wrap justify-content-between align-items-center">
                                <h4 className="card-title mb-0 d-flex align-items-center gap-2"><FaTicketAlt /> Register Now</h4>
                                <div className="small text-muted">{registrationOpen ? 'Open' : 'Closed'}</div>
                            </div>
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
                                <div className="p-4 border rounded-3 bg-light position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f8fbff,#eef3f9)' }}>
                                    <div className="position-absolute top-0 end-0 opacity-25" style={{ fontSize: 90, lineHeight: 1, pointerEvents: 'none' }}>🔒</div>
                                    <div className="d-flex flex-column flex-lg-row align-items-start gap-4">
                                        <div className="flex-grow-1">
                                            <h5 className="fw-bold d-flex align-items-center gap-2 mb-2"><FaInfoCircle className="text-primary" /> Login Required</h5>
                                            <p className="text-muted mb-3 small">Log in (or create a free account) to register for this event and access your registrations, payments, and certificates in one place.</p>
                                            <ul className="small mb-3 ps-3" style={{ columns: 2, maxWidth: 520 }}>
                                                <li>Fast checkout</li>
                                                <li>Certificate access</li>
                                                <li>Track payments</li>
                                                <li>Manage registrations</li>
                                                <li>Email updates</li>
                                                <li>Exclusive offers</li>
                                            </ul>
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => navigate(`/login?next=/events/${id}/register`)}
                                                    className="btn btn-primary"
                                                >
                                                    Login & Continue
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/register?next=/events/${id}/register`)}
                                                    className="btn btn-outline-primary"
                                                >
                                                    Create Account
                                                </button>
                                            </div>
                                            <div className="mt-3 small text-muted">Your partially filled answers will be preserved if you stay on this page.</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <fieldset className="mb-4">
                                        <legend className="small text-uppercase text-muted fw-semibold mb-3">Your Information</legend>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Full Name <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" value={registrationData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Email <span className="text-danger">*</span></label>
                                                <input type="email" className="form-control" value={registrationData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Phone Number</label>
                                                <input type="tel" className="form-control" value={registrationData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Optional" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Organization</label>
                                                <input type="text" className="form-control" value={registrationData.organization} onChange={(e) => handleInputChange('organization', e.target.value)} placeholder="Optional" />
                                            </div>
                                        </div>
                                    </fieldset>

                                    {/* Custom Questions */}
                                    {event.registrationQuestions?.length > 0 && (
                                        <fieldset className="mb-4">
                                            <legend className="small text-uppercase text-muted fw-semibold mb-3">Additional Information</legend>
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
                                        </fieldset>
                                    )}

                                    <div className="border-top pt-4">
                                        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                                            {event.eventType === 'paid' && (
                                                <div className="text-start small w-100 w-md-auto">
                                                    <div className="fw-semibold">Total Payable</div>
                                                    <div className="display-6 fw-bold mb-0" style={{ fontSize: '1.8rem' }}>{currency(event.price)}</div>
                                                    <div className="text-muted">Includes all taxes</div>
                                                </div>
                                            )}
                                            <div className="flex-grow-1 text-center">
                                                <button type="submit" className={`btn btn-lg px-4 ${event.eventType === 'paid' ? 'btn-primary' : 'btn-success'}`} disabled={registering} style={{ minWidth: 240 }}>
                                                    {registering ? <><div className="spinner-border spinner-border-sm me-2" />Processing...</> : event.eventType === 'paid' ? <><FaMoneyBillWave className="me-2" />Pay {currency(event.price)} & Register</> : <><FaTicketAlt className="me-2" />Register for Free</>}
                                                </button>
                                                {event.eventType === 'paid' && <div className="small text-muted mt-2 d-flex align-items-center justify-content-center gap-2"><FaShieldAlt /> Secure Razorpay Checkout</div>}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Existing payment in progress modal */}
            {showPaymentModal && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Payment Already In Progress</h6>
                                <button className="btn-close" onClick={() => setShowPaymentModal(false)} />
                            </div>
                            <div className="modal-body small">
                                You have a previous pending payment attempt for this event. Choose an option:
                                <ul className="mt-2 mb-0">
                                    <li>Continue with the existing payment order (will reopen gateway)</li>
                                    <li>Cancel the old attempt and start a fresh one</li>
                                </ul>
                            </div>
                            <div className="modal-footer d-flex justify-content-between">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPaymentModal(false)}>Close</button>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-danger btn-sm" onClick={async () => {
                                        try { await registrationApi.createRazorpayOrder({ eventId: event._id, forceCancelExisting: true }); setShowPaymentModal(false); handleSubmit(new Event('submit')); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
                                    }}>Cancel & New</button>
                                    <button className="btn btn-primary btn-sm" onClick={async () => {
                                        try { await registrationApi.createRazorpayOrder({ eventId: event._id, reuseExisting: true }); setShowPaymentModal(false); handleSubmit(new Event('submit')); } catch (e) { toast.error(e.response?.data?.message || 'Failed to reuse'); }
                                    }}>Continue Existing</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

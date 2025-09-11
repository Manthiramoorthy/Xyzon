import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag,
    FaTicketAlt, FaGlobe, FaWifi, FaShare, FaArrowLeft,
    FaCertificate, FaInfoCircle, FaExclamationTriangle, FaCheckCircle,
    FaCopy, FaDownload, FaUserPlus, FaHourglassHalf, FaBolt,
    FaStopwatch, FaPlay, FaFire
} from 'react-icons/fa';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const { fetchEvent, loading, error, userRegistrations, fetchUserRegistrations } = useEvent();
    const [event, setEvent] = useState(null);
    const [startCountdown, setStartCountdown] = useState(null); // {days, hours, minutes, seconds}
    const [closeCountdown, setCloseCountdown] = useState(null);
    const [endCountdown, setEndCountdown] = useState(null);

    useEffect(() => {
        loadEvent();
        if (user) {
            fetchUserRegistrations().catch(() => { });
        }
    }, [id, user]);

    const loadEvent = async () => {
        try {
            const eventData = await fetchEvent(id);
            setEvent(eventData);
        } catch (error) {
            console.error('Error loading event:', error);
        }
    };

    // Countdown timers (start, registration close, end)
    useEffect(() => {
        if (!event) return;
        const tick = () => {
            const now = new Date().getTime();
            const startDiff = new Date(event.startDate).getTime() - now;
            const closeDiff = new Date(event.registrationEndDate).getTime() - now;
            const endDiff = new Date(event.endDate).getTime() - now;

            const toParts = (ms) => {
                if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
                const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((ms / (1000 * 60)) % 60);
                const seconds = Math.floor((ms / 1000) % 60);
                return { days, hours, minutes, seconds, finished: false };
            };

            setStartCountdown(toParts(startDiff));
            setCloseCountdown(toParts(closeDiff));
            setEndCountdown(toParts(endDiff));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [event]);

    const formatCountdown = (c) => {
        if (!c) return '';
        if (c.finished) return '0s';
        const segs = [];
        if (c.days) segs.push(`${c.days}d`);
        if (c.hours || c.days) segs.push(`${c.hours}h`);
        if (c.minutes || c.hours || c.days) segs.push(`${c.minutes}m`);
        segs.push(`${c.seconds}s`);
        return segs.join(' ');
    };

    const downloadICS = () => {
        if (!event) return;
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const toICSDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Xyzon//Event//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `UID:${event._id}@xyzon`,
            `DTSTAMP:${toICSDate(new Date())}`,
            `DTSTART:${toICSDate(start)}`,
            `DTEND:${toICSDate(end)}`,
            `SUMMARY:${(event.title || '').replace(/\n/g, ' ')}`,
            `DESCRIPTION:${(event.shortDescription || '').replace(/\n/g, ' ')}`,
            event.venue ? `LOCATION:${event.venue}` : '',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(Boolean).join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Calendar file downloaded');
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            toast.success('Link copied');
        });
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

    const isLive = () => {
        if (!event) return false;
        const now = new Date();
        return new Date(event.startDate) <= now && new Date(event.endDate) > now;
    };

    // Inline registration removed: button now navigates to dedicated registration page.

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
            toast.success('Event link copied to clipboard!');
        }
    };

    if (loading) {
        // Skeleton loader
        return (
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-8 mb-4">
                        <div className="placeholder-glow mb-3" style={{ height: 300, background: 'linear-gradient(90deg,#f0f3f7,#e2e8ef,#f0f3f7)', borderRadius: '8px' }} />
                        <div className="placeholder-glow mb-2">
                            <div className="placeholder col-7" style={{ height: 40 }} />
                        </div>
                        <div className="placeholder-glow mb-4">
                            <div className="placeholder col-10" style={{ height: 20 }} />
                            <div className="placeholder col-8 mt-2" style={{ height: 20 }} />
                        </div>
                        <div className="placeholder-glow mb-3">
                            <div className="placeholder col-12" style={{ height: 180 }} />
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card shadow-sm">
                            <div className="card-body placeholder-glow">
                                <div className="placeholder col-6 mb-3" style={{ height: 32 }} />
                                <div className="placeholder col-12 mb-2" style={{ height: 20 }} />
                                <div className="placeholder col-10 mb-2" style={{ height: 20 }} />
                                <div className="placeholder col-8 mb-4" style={{ height: 20 }} />
                                <div className="placeholder col-12" style={{ height: 46, borderRadius: 6 }} />
                            </div>
                        </div>
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

    // Determine if user already registered
    const existingReg = user && userRegistrations.find(r => (r.event?._id === event._id) || (r.eventId === event._id));

    return (
        <div className="container py-4">

            <div className="row">
                {/* Event Details */}
                <div className="col-lg-8">

                    {/* Event Banner */}
                    {event.bannerUrl && (
                        <div className="position-relative mb-4">
                            <img
                                src={event.bannerUrl}
                                alt={event.title}
                                className="img-fluid rounded"
                                style={{ width: '100%', height: '300px', objectFit: 'cover', filter: 'brightness(0.92)' }}
                            />
                            <div className="position-absolute top-0 start-0 w-100 h-100 rounded" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.55))' }} />
                            <div className="position-absolute bottom-0 start-0 p-3 p-md-4 text-white">
                                <h2 className="fw-bold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,.4)' }}>{event.title}</h2>
                                <div className="d-flex flex-wrap gap-2">
                                    <span className="badge bg-primary d-flex align-items-center gap-1"><FaCalendarAlt /> {new Date(event.startDate).toLocaleDateString()}</span>
                                    <span className="badge bg-info d-flex align-items-center gap-1"><FaClock /> {formatTime(event.startDate)}</span>
                                    <span className="badge bg-dark d-flex align-items-center gap-1 text-capitalize"><FaGlobe /> {event.eventMode}</span>
                                    {event.hasCertificate && <span className="badge bg-success d-flex align-items-center gap-1"><FaCertificate /> Certificate</span>}
                                </div>
                            </div>
                            {(!isUpcoming() || !isRegistrationOpen()) && (
                                <div className="position-absolute top-0 end-0 m-3">
                                    {!isUpcoming() ? (
                                        <span className="badge bg-secondary shadow">Completed</span>
                                    ) : !isRegistrationOpen() && (
                                        <span className="badge bg-warning text-dark shadow">Registration Closed</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Event Header */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-stretch gap-3 mb-4">
                        <div className="flex-grow-1">
                            {!event.bannerUrl && <h1 className="fw-bold mb-2">{event.title}</h1>}
                            <p className="text-muted lead mb-3">{event.shortDescription || 'Join us for this event.'}</p>
                            <div className="d-flex flex-wrap gap-2 small">
                                <span className="badge bg-primary-subtle text-primary border border-primary">{event.eventType === 'paid' ? 'Paid' : 'Free'}</span>
                                <span className="badge bg-light text-dark border">{event.eventMode}</span>
                                {event.hasCertificate && <span className="badge bg-success-subtle text-success border border-success">Certificate</span>}
                                {isRegistrationOpen() && isUpcoming() && closeCountdown && !closeCountdown.finished && (
                                    <span className="badge bg-warning text-dark">Reg closes in {formatCountdown(closeCountdown)}</span>
                                )}
                                {startCountdown && !startCountdown.finished && (
                                    <span className="badge bg-info text-dark">Starts in {formatCountdown(startCountdown)}</span>
                                )}
                                {isLive() && endCountdown && !endCountdown.finished && (
                                    <span className="badge bg-danger d-flex align-items-center gap-1"><FaPlay /> Live • Ends in {formatCountdown(endCountdown)}</span>
                                )}
                            </div>
                        </div>
                        <div className="d-flex flex-column align-items-stretch gap-2">
                            <div className="btn-group">
                                <button className="btn btn-outline-secondary" onClick={shareEvent} title="Share via native share or copy">
                                    <FaShare className="me-2" /> Share
                                </button>
                                <button className="btn btn-outline-secondary" onClick={copyLink} title="Copy link">
                                    <FaCopy />
                                </button>
                                <button className="btn btn-outline-secondary" onClick={downloadICS} title="Add to calendar">
                                    <FaDownload />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Event Info */}
                    {/* Time / Countdown Emphasis */}
                    <div className="mb-4">
                        {isUpcoming() && startCountdown && !startCountdown.finished && (
                            <div className="p-3 p-md-4 rounded-3 shadow-sm bg-gradient" style={{ background: 'linear-gradient(135deg,#eef5ff,#e6f0ff,#ffffff)' }}>
                                <div className="d-flex align-items-center mb-3 gap-2">
                                    <FaStopwatch className="text-primary" />
                                    <h5 className="fw-bold mb-0">Event Starts In</h5>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {['days', 'hours', 'minutes', 'seconds'].map(part => (
                                        <div key={part} className="flex-grow-1 text-center" style={{ minWidth: 70 }}>
                                            <div className="fw-bold display-6" style={{ fontSize: '2rem', letterSpacing: '1px' }}>{startCountdown[part]}</div>
                                            <div className="text-uppercase small text-muted" style={{ letterSpacing: '1px' }}>{part}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isLive() && endCountdown && !endCountdown.finished && (
                            <div className="p-3 p-md-4 rounded-3 shadow-sm" style={{ background: 'linear-gradient(135deg,#ffe9e9,#ffe1d5,#ffffff)' }}>
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="badge bg-danger d-flex align-items-center gap-1"><FaPlay /> LIVE</span>
                                    <h5 className="fw-bold mb-0 text-danger">In Progress</h5>
                                    <span className="ms-auto badge bg-light text-danger d-flex align-items-center gap-1"><FaClock /> Ends in {formatCountdown(endCountdown)}</span>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {['hours', 'minutes', 'seconds'].map(part => (
                                        <div key={part} className="flex-grow-1 text-center" style={{ minWidth: 70 }}>
                                            <div className="fw-bold" style={{ fontSize: '1.8rem' }}>{endCountdown[part]}</div>
                                            <div className="text-uppercase small text-muted" style={{ letterSpacing: '1px' }}>{part}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isUpcoming() && !isLive() && endCountdown?.finished && (
                            <div className="alert alert-secondary d-flex align-items-center gap-2 mb-4">
                                <FaExclamationTriangle /> Event Completed
                            </div>
                        )}
                    </div>

                    {/* Quick Highlights */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-4 col-6">
                            <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Date</div>
                                <div className="fw-bold" style={{ lineHeight: 1.2 }}>{new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="text-muted" style={{ fontSize: '.75rem' }}>{formatTime(event.startDate)}</div>
                            </div>
                        </div>
                        <div className="col-md-4 col-6">
                            <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Mode</div>
                                <div className="fw-bold text-capitalize d-flex align-items-center gap-1">{getEventModeIcon(event.eventMode)} {event.eventMode}</div>
                                {event.venue && event.eventMode !== 'online' && <div className="text-muted" style={{ fontSize: '.65rem' }}>{event.venue}</div>}
                            </div>
                        </div>
                        <div className="col-md-4 col-6">
                            <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Registration</div>
                                <div className="fw-bold d-flex align-items-center gap-1">{event.eventType === 'paid' ? `₹${event.price}` : 'Free'} {event.eventType === 'paid' && closeCountdown && !closeCountdown.finished && closeCountdown.days === 0 && closeCountdown.hours < 12 && <FaFire className="text-danger" />}</div>
                                <div className="text-muted" style={{ fontSize: '.65rem' }}>{closeCountdown && !closeCountdown.finished ? `Closes in ${formatCountdown(closeCountdown)}` : 'Closing Soon'}</div>
                            </div>
                        </div>
                        <div className="col-md-4 col-6">
                            <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Seats</div>
                                {(() => { const registered = event.registeredCount || event.participantsRegistered || event.registrationCount || event.currentRegistrations || event.currentParticipants || 0; const max = event.maxParticipants || 0; const left = max ? max - registered : 0; return <><div className="fw-bold">{max ? `${left} left` : 'Unlimited'}</div><div className="text-muted" style={{ fontSize: '.65rem' }}>{max ? `${registered}/${max} filled` : ''}</div></>; })()}
                            </div>
                        </div>
                        {event.hasCertificate && (
                            <div className="col-md-4 col-6">
                                <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Certificate</div>
                                    <div className="fw-bold d-flex align-items-center gap-1 text-success"><FaCertificate /> Included</div>
                                    <div className="text-muted" style={{ fontSize: '.65rem' }}>After validation</div>
                                </div>
                            </div>
                        )}
                        {event.category && (
                            <div className="col-md-4 col-6">
                                <div className="border rounded-3 h-100 p-3 small d-flex flex-column justify-content-between bg-white shadow-sm">
                                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '.65rem' }}>Category</div>
                                    <div className="fw-bold">{event.category}</div>
                                    <div className="text-muted" style={{ fontSize: '.65rem' }}>Topic Focus</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="d-none card shadow-sm mb-4 border-0" style={{ borderRadius: 14 }}>
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
                    <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: 14 }}>
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-3">About This Event</h5>
                            <div dangerouslySetInnerHTML={{ __html: event.description || '<p>No detailed description provided yet.</p>' }} />
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
                    <div className="card shadow-sm sticky-top border-0" style={{ top: '100px', borderRadius: 18, background: 'linear-gradient(180deg,#ffffff,#f5f9ff)' }}>
                        <div className="card-body">
                            {/* Price */}
                            <div className="text-center mb-4">
                                <div className="fw-bold text-uppercase small text-muted mb-2">Registration</div>
                                <div className="display-6 fw-bold text-primary d-flex justify-content-center align-items-center gap-2" style={{ fontSize: '2.4rem' }}>
                                    <FaTicketAlt /> {event.eventType === 'paid' ? `₹${event.price}` : 'Free'}
                                </div>
                                {event.hasCertificate && (
                                    <div className="text-success mt-2 small d-flex justify-content-center align-items-center gap-2">
                                        <FaCertificate /> Certificate Included
                                    </div>
                                )}
                            </div>

                            {/* Seat Availability */}
                            {(() => {
                                const registered = event.registeredCount || event.participantsRegistered || event.registrationCount || event.currentRegistrations || event.currentParticipants || 0;
                                const max = event.maxParticipants || 0;
                                if (!max || registered <= 0) return null;
                                const pct = Math.min(100, Math.round((registered / max) * 100));
                                return (
                                    <div className="mb-4" aria-label={`Seats filled ${registered} of ${max}`}>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted d-flex align-items-center gap-1"><FaUsers /> Seats</span>
                                            <span className="fw-semibold">{registered}/{max} ({pct}%)</span>
                                        </div>
                                        <div className="progress" style={{ height: 10 }}>
                                            <div className={`progress-bar ${pct > 85 ? 'bg-danger' : pct > 65 ? 'bg-warning' : 'bg-primary'}`} role="progressbar" style={{ width: pct + '%' }} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" />
                                        </div>
                                        {pct >= 95 && <div className="small text-danger mt-1"><FaBolt className="me-1" /> Almost full</div>}
                                    </div>
                                );
                            })()}

                            {/* Registration closing progress */}
                            {(() => {
                                const now = Date.now();
                                const start = new Date(event.registrationStartDate).getTime();
                                const end = new Date(event.registrationEndDate).getTime();
                                if (now < start || now > end) return null;
                                const total = end - start;
                                const elapsed = now - start;
                                const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                                return (
                                    <div className="mb-4" aria-label={`Registration window ${pct}% elapsed`}>
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted d-flex align-items-center gap-1"><FaHourglassHalf /> Time Left</span>
                                            {closeCountdown && !closeCountdown.finished && <span>{formatCountdown(closeCountdown)}</span>}
                                        </div>
                                        <div className="progress" style={{ height: 6 }}>
                                            <div className="progress-bar bg-info" role="progressbar" style={{ width: pct + '%' }} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" />
                                        </div>
                                    </div>
                                );
                            })()}

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
                            ) : existingReg ? (
                                <div className="alert alert-info text-center">
                                    <FaCheckCircle className="me-2" />
                                    You're already registered
                                    <div className="mt-2">
                                        <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/user/registrations')}>View My Registrations</button>
                                    </div>
                                </div>
                            ) : !user ? (
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary btn-lg d-flex justify-content-center align-items-center gap-2"
                                        onClick={() => navigate(`/login?next=/events/${event._id}/register`)}
                                    >
                                        <FaUserPlus /> Login to Register
                                    </button>
                                </div>
                            ) : (
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary btn-lg d-flex justify-content-center align-items-center gap-2"
                                        onClick={() => navigate(`/events/${event._id}/register`)}
                                    >
                                        <FaUserPlus /> Register Now
                                    </button>
                                </div>
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

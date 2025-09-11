import React, { useState, useEffect } from 'react';
import { eventApi } from '../api/eventApi';
import ICONS from '../constants/icons';
import {
    FiCalendar,
    FiUsers,
    FiAward,
    FiTrendingUp,
    FiClock
} from 'react-icons/fi';

const AdminDashboard = () => {
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentEvents();
    }, []);

    const fetchRecentEvents = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getEvents({ page: 1, limit: 5 });
            setRecentEvents(response.data.data.docs || []);
        } catch (error) {
            console.error('Error fetching recent events:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Create Event',
            description: 'Set up a new event',
            icon: <FiPlus />,
            href: '/admin/events/create',
            color: '#000066',
            bgColor: '#f0f0ff'
        },
        {
            title: 'Manage Templates',
            description: 'Certificate templates',
            icon: <FiAward />,
            href: '/admin/certificate-templates',
            color: '#16a34a',
            bgColor: '#f0fdf4'
        },
        {
            title: 'View Events',
            description: 'All your events',
            icon: <FiCalendar />,
            href: '/admin/events',
            color: '#dc2626',
            bgColor: '#fef2f2'
        },
        {
            title: 'Send Mail',
            description: 'Email communications',
            icon: <FiTrendingUp />,
            href: '/admin/send-mail',
            color: '#7c3aed',
            bgColor: '#f3f4f6'
        }
    ];

    return (
        <div className="admin-dashboard">
            {/* Welcome Section */}
            <div className="welcome-section">
                <h2>Welcome to Admin Dashboard</h2>
                <p className="text-muted">Manage your events, certificates, and communications from here.</p>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h5 className="section-title">Quick Actions</h5>
                <div className="actions-grid">
                    {quickActions.map((action, index) => (
                        <a
                            key={index}
                            href={action.href}
                            className="action-card"
                            style={{
                                '--hover-color': action.color,
                                '--bg-color': action.bgColor
                            }}
                        >
                            <div
                                className="action-icon"
                                style={{
                                    backgroundColor: action.bgColor,
                                    color: action.color
                                }}
                            >
                                {action.icon}
                            </div>
                            <div className="action-content">
                                <h6 className="action-title">{action.title}</h6>
                                <p className="action-description">{action.description}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Events */}
            <div className="recent-events">
                <div className="section-header">
                    <h5 className="section-title">Recent Events</h5>
                    <a href="/admin/events" className="view-all-link">View All</a>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading recent events...</p>
                        </div>
                    </div>
                ) : recentEvents.length > 0 ? (
                    <div className="events-list">
                        {recentEvents.map((event) => (
                            <div key={event._id} className="event-card">
                                <div className="event-info">
                                    <h6 className="event-title">{event.title}</h6>
                                    <div className="event-meta">
                                        <span className="event-date">
                                            <FiCalendar size={14} />
                                            {new Date(event.startDate).toLocaleDateString()}
                                        </span>
                                        <span className={`event-status status-${event.status}`}>
                                            {event.status === 'published' ? <ICONS.VIEW size={14} /> : <FiClock size={14} />}
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="event-actions">
                                    <a
                                        href={`/admin/events/${event._id}`}
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        View
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="text-center py-4">
                            <FiCalendar size={48} className="text-muted mb-3" />
                            <h6>No events yet</h6>
                            <p className="text-muted">Create your first event to get started.</p>
                            <a href="/admin/events/create" className="btn btn-primary">
                                <FiPlus className="me-2" />
                                Create Event
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .admin-dashboard {
                    max-width: 100%;
                }

                .welcome-section {
                    margin-bottom: 32px;
                    padding: 24px;
                    background: linear-gradient(135deg, #000066 0%, #0066cc 100%);
                    border-radius: 12px;
                    color: white;
                }

                .welcome-section h2 {
                    margin: 0 0 8px 0;
                    font-weight: 700;
                }

                .welcome-section p {
                    margin: 0;
                    opacity: 0.9;
                }

                .section-title {
                    color: #111827;
                    font-weight: 600;
                    margin-bottom: 16px;
                }

                .quick-actions {
                    margin-bottom: 32px;
                }

                .actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                }

                .action-card {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.2s ease;
                    gap: 16px;
                }

                .action-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    border-color: var(--hover-color);
                    text-decoration: none;
                    color: inherit;
                }

                .action-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .action-content {
                    flex: 1;
                }

                .action-title {
                    margin: 0 0 4px 0;
                    font-weight: 600;
                    font-size: 16px;
                }

                .action-description {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .recent-events {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .section-header {
                    padding: 20px;
                    border-bottom: 1px solid #f3f4f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }

                .section-header .section-title {
                    margin: 0;
                }

                .view-all-link {
                    color: #000066;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 14px;
                }

                .view-all-link:hover {
                    text-decoration: underline;
                }

                .loading-state, .empty-state {
                    padding: 40px 20px;
                }

                .events-list {
                    padding: 16px;
                }

                .event-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border: 1px solid #f3f4f6;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                }

                .event-card:last-child {
                    margin-bottom: 0;
                }

                .event-card:hover {
                    border-color: #e5e7eb;
                    background: #f8fafc;
                }

                .event-info {
                    flex: 1;
                }

                .event-title {
                    margin: 0 0 8px 0;
                    font-weight: 600;
                    color: #111827;
                }

                .event-meta {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .event-date, .event-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #6b7280;
                }

                .event-status.status-published {
                    color: #16a34a;
                }

                .event-status.status-draft {
                    color: #ea580c;
                }

                .event-actions {
                    flex-shrink: 0;
                }

                @media (max-width: 768px) {
                    .actions-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .event-card {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    
                    .event-actions {
                        text-align: right;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;

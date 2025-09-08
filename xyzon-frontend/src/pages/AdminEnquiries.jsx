import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { enquiryApi } from '../api/enquiryApi';
import EnquiryDetailsModal from '../components/EnquiryDetailsModal';
import ResponseModal from '../components/ResponseModal';
import './AdminEnquiries.css';

const AdminEnquiries = () => {
    const { toast, confirm } = useToast();

    const [enquiries, setEnquiries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter and pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
        search: ''
    });

    // Modal states
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);

    // Selection states for bulk actions
    const [selectedEnquiries, setSelectedEnquiries] = useState([]);
    const [bulkAction, setBulkAction] = useState('');

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'new', label: 'New' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
    ];

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        { value: 'general', label: 'General' },
        { value: 'technical', label: 'Technical' },
        { value: 'billing', label: 'Billing' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'feedback', label: 'Feedback' },
        { value: 'other', label: 'Other' }
    ];

    const priorityOptions = [
        { value: '', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
    ];

    useEffect(() => {
        fetchEnquiries();
        fetchStats();
    }, [currentPage, filters]);

    const fetchEnquiries = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                ...filters
            };

            const response = await enquiryApi.getAllEnquiries(params);
            if (response.success) {
                setEnquiries(response.data.docs || []);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (err) {
            setError('Failed to fetch enquiries: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await enquiryApi.getEnquiryStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.warn('Failed to fetch stats:', err);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const handleStatusUpdate = async (enquiryId, newStatus) => {
        try {
            const response = await enquiryApi.updateEnquiry(enquiryId, { status: newStatus });
            if (response.success) {
                await fetchEnquiries();
                await fetchStats();
            }
        } catch (err) {
            setError('Failed to update status: ' + (err.message || 'Unknown error'));
        }
    };

    const handlePriorityUpdate = async (enquiryId, newPriority) => {
        try {
            const response = await enquiryApi.updateEnquiry(enquiryId, { priority: newPriority });
            if (response.success) {
                await fetchEnquiries();
            }
        } catch (err) {
            setError('Failed to update priority: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDeleteEnquiry = async (enquiryId) => {
        const confirmed = await confirm('Are you sure you want to delete this enquiry?');
        if (!confirmed) return;

        try {
            const response = await enquiryApi.deleteEnquiry(enquiryId);
            if (response.success) {
                await fetchEnquiries();
                await fetchStats();
            }
        } catch (err) {
            setError('Failed to delete enquiry: ' + (err.message || 'Unknown error'));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedEnquiries.length === 0) return;

        try {
            let actionData = { action: bulkAction, enquiryIds: selectedEnquiries };

            if (bulkAction === 'updateStatus') {
                const status = prompt('Enter new status (new, in_progress, resolved, closed):');
                if (!status) return;
                actionData.updateData = { status };
            } else if (bulkAction === 'updatePriority') {
                const priority = prompt('Enter new priority (low, medium, high, urgent):');
                if (!priority) return;
                actionData.updateData = { priority };
            } else if (bulkAction === 'delete') {
                const confirmed = await confirm(`Are you sure you want to delete ${selectedEnquiries.length} enquiries?`);
                if (!confirmed) return;
            }

            const response = await enquiryApi.bulkAction(actionData);
            if (response.success) {
                setSelectedEnquiries([]);
                setBulkAction('');
                await fetchEnquiries();
                await fetchStats();
            }
        } catch (err) {
            setError('Bulk action failed: ' + (err.message || 'Unknown error'));
        }
    };

    const handleSelectEnquiry = (enquiryId) => {
        setSelectedEnquiries(prev =>
            prev.includes(enquiryId)
                ? prev.filter(id => id !== enquiryId)
                : [...prev, enquiryId]
        );
    };

    const handleSelectAll = () => {
        if (selectedEnquiries.length === enquiries.length) {
            setSelectedEnquiries([]);
        } else {
            setSelectedEnquiries(enquiries.map(e => e._id));
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            new: 'status-new',
            in_progress: 'status-in-progress',
            resolved: 'status-resolved',
            closed: 'status-closed'
        };

        return <span className={`status-badge ${statusClasses[status]}`}>{status.replace('_', ' ')}</span>;
    };

    const getPriorityBadge = (priority) => {
        const priorityClasses = {
            low: 'priority-low',
            medium: 'priority-medium',
            high: 'priority-high',
            urgent: 'priority-urgent'
        };

        return <span className={`priority-badge ${priorityClasses[priority]}`}>{priority}</span>;
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

    return (
        <div className="admin-enquiries">
            <div className="enquiries-header">
                <h1>Enquiry Management</h1>

                {stats && (
                    <div className="stats-cards">
                        <div className="stat-card">
                            <h3>{stats.overview.total}</h3>
                            <p>Total Enquiries</p>
                        </div>
                        <div className="stat-card new">
                            <h3>{stats.overview.new}</h3>
                            <p>New</p>
                        </div>
                        <div className="stat-card in-progress">
                            <h3>{stats.overview.inProgress}</h3>
                            <p>In Progress</p>
                        </div>
                        <div className="stat-card resolved">
                            <h3>{stats.overview.resolved}</h3>
                            <p>Resolved</p>
                        </div>
                        <div className="stat-card recent">
                            <h3>{stats.recentCount}</h3>
                            <p>Last 7 Days</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            <div className="enquiries-controls">
                <div className="filters">
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                        {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Search enquiries..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>

                {selectedEnquiries.length > 0 && (
                    <div className="bulk-actions">
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                        >
                            <option value="">Select Action</option>
                            <option value="updateStatus">Update Status</option>
                            <option value="updatePriority">Update Priority</option>
                            <option value="delete">Delete</option>
                        </select>
                        <button
                            onClick={handleBulkAction}
                            disabled={!bulkAction}
                            className="bulk-action-btn"
                        >
                            Apply to {selectedEnquiries.length} enquiries
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner large"></div>
                    <p>Loading enquiries...</p>
                </div>
            ) : (
                <>
                    <div className="enquiries-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={selectedEnquiries.length === enquiries.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Customer</th>
                                    <th>Subject</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enquiries.map(enquiry => (
                                    <tr key={enquiry._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedEnquiries.includes(enquiry._id)}
                                                onChange={() => handleSelectEnquiry(enquiry._id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="customer-info">
                                                <strong>{enquiry.name}</strong>
                                                <br />
                                                <small>{enquiry.email}</small>
                                            </div>
                                        </td>
                                        <td className="subject-cell">
                                            <span title={enquiry.subject}>{enquiry.subject}</span>
                                        </td>
                                        <td>
                                            <span className="category-badge">{enquiry.category}</span>
                                        </td>
                                        <td>
                                            <select
                                                value={enquiry.status}
                                                onChange={(e) => handleStatusUpdate(enquiry._id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="new">New</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={enquiry.priority}
                                                onChange={(e) => handlePriorityUpdate(enquiry._id, e.target.value)}
                                                className="priority-select"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </td>
                                        <td>{formatDate(enquiry.createdAt)}</td>
                                        <td className="actions-cell">
                                            <button
                                                onClick={() => {
                                                    setSelectedEnquiry(enquiry);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="action-btn view-btn"
                                                title="View Details"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedEnquiry(enquiry);
                                                    setShowResponseModal(true);
                                                }}
                                                className="action-btn respond-btn"
                                                title="Send Response"
                                            >
                                                📧
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEnquiry(enquiry._id)}
                                                className="action-btn delete-btn"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <span>Page {currentPage} of {totalPages}</span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* Modals */}
            {showDetailsModal && selectedEnquiry && (
                <EnquiryDetailsModal
                    enquiry={selectedEnquiry}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedEnquiry(null);
                    }}
                    onUpdate={() => {
                        fetchEnquiries();
                        fetchStats();
                    }}
                />
            )}

            {showResponseModal && selectedEnquiry && (
                <ResponseModal
                    enquiry={selectedEnquiry}
                    onClose={() => {
                        setShowResponseModal(false);
                        setSelectedEnquiry(null);
                    }}
                    onSent={() => {
                        fetchEnquiries();
                        fetchStats();
                        setShowResponseModal(false);
                        setSelectedEnquiry(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminEnquiries;

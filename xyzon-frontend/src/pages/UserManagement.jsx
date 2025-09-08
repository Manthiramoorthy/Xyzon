import React, { useState, useEffect } from 'react';
import { authApiService } from '../api/authApi';
import { useToast } from '../context/ToastContext';
import {
    FaUsers, FaSearch, FaFilter, FaUserShield, FaUserSlash,
    FaTrash, FaEdit, FaEye, FaBan, FaCheck
} from 'react-icons/fa';

const UserCard = ({ user, onUpdateRole, onSuspend, onDelete }) => {
    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { color: 'bg-danger', text: 'Admin' },
            moderator: { color: 'bg-warning', text: 'Moderator' },
            user: { color: 'bg-primary', text: 'User' }
        };

        const config = roleConfig[role] || roleConfig.user;
        return (
            <span className={`badge ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getStatusBadge = (status, isActive) => {
        if (!isActive) {
            return <span className="badge bg-secondary">Suspended</span>;
        }
        return <span className="badge bg-success">Active</span>;
    };

    return (
        <div className="card shadow-sm h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 className="card-title fw-bold mb-1">{user.name}</h6>
                        <p className="card-text text-muted small mb-1">{user.email}</p>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status, user.isActive)}
                    </div>
                </div>

                <div className="user-meta mb-3">
                    <small className="text-muted d-block">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </small>
                    {user.lastLogin && (
                        <small className="text-muted d-block">
                            Last Login: {new Date(user.lastLogin).toLocaleDateString()}
                        </small>
                    )}
                </div>

                <div className="btn-group w-100" role="group">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onUpdateRole(user)}
                        title="Change Role"
                    >
                        <FaUserShield />
                    </button>
                    <button
                        className={`btn ${user.isActive ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm`}
                        onClick={() => onSuspend(user)}
                        title={user.isActive ? 'Suspend User' : 'Unsuspend User'}
                    >
                        {user.isActive ? <FaBan /> : <FaCheck />}
                    </button>
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDelete(user)}
                        title="Delete User"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function UserManagement() {
    const { toast, confirm } = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        role: 'all',
        status: 'all'
    });
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        loadUsers();
    }, [filters]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: 1,
                limit: 50,
                ...(filters.search && { search: filters.search }),
                ...(filters.role !== 'all' && { role: filters.role }),
                ...(filters.status !== 'all' && { status: filters.status })
            };

            const response = await authApiService.admin.getAllUsers(params);
            console.log('API Response:', response);
            setUsers(response.data.data.docs || response.data.data || response.data || []);
        } catch (error) {
            console.error('Load Users Error:', error);
            setError(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateRole = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const handleRoleUpdate = async () => {
        if (!selectedUser || !newRole) return;

        try {
            await authApiService.admin.updateUserRole(selectedUser._id, newRole);
            setUsers(prev => prev.map(u =>
                u._id === selectedUser._id ? { ...u, role: newRole } : u
            ));
            setShowRoleModal(false);
            toast.success('User role updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user role');
        }
    };

    const handleSuspend = async (user) => {
        const action = user.isActive ? 'suspend' : 'unsuspend';
        const confirmText = user.isActive ?
            `Are you sure you want to suspend ${user.name}?` :
            `Are you sure you want to unsuspend ${user.name}?`;

        const confirmed = await confirm(confirmText);
        if (confirmed) {
            try {
                if (user.isActive) {
                    await authApiService.admin.suspendUser(user._id);
                } else {
                    await authApiService.admin.unsuspendUser(user._id);
                }

                setUsers(prev => prev.map(u =>
                    u._id === user._id ? { ...u, isActive: !user.isActive } : u
                ));
                toast.success(`User ${action}ed successfully`);
            } catch (error) {
                toast.error(error.response?.data?.message || `Failed to ${action} user`);
            }
        }
    };

    const handleDelete = async (user) => {
        const confirmed = await confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`);
        if (confirmed) {
            try {
                await authApiService.admin.deleteUser(user._id);
                setUsers(prev => prev.filter(u => u._id !== user._id));
                toast.success('User deleted successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const getStatsOverview = () => {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive).length;
        const adminUsers = users.filter(u => u.role === 'admin').length;
        const suspendedUsers = users.filter(u => !u.isActive).length;

        return { totalUsers, activeUsers, adminUsers, suspendedUsers };
    };

    const stats = getStatsOverview();

    if (loading && users.length === 0) {
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
            <div className="row mb-4">
                <div className="col-12">
                    <h1 className="fw-bold mb-4">
                        <FaUsers className="text-primary me-3" />
                        User Management
                    </h1>

                    {/* Stats Overview */}
                    <div className="row mb-4">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card bg-primary text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{stats.totalUsers}</h3>
                                    <small>Total Users</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card bg-success text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{stats.activeUsers}</h3>
                                    <small>Active Users</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card bg-danger text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{stats.adminUsers}</h3>
                                    <small>Admin Users</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card bg-warning text-white">
                                <div className="card-body text-center">
                                    <h3 className="fw-bold">{stats.suspendedUsers}</h3>
                                    <small>Suspended</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <FaSearch />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search users..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filters.role}
                                        onChange={(e) => handleFilterChange('role', e.target.value)}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Users Grid */}
            <div className="row">
                {users.length === 0 && !loading ? (
                    <div className="col-12 text-center py-5">
                        <FaUsers size={64} className="text-muted mb-3" />
                        <h4 className="text-muted">No users found</h4>
                        <p className="text-muted">No users match your current filter criteria.</p>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user._id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                            <UserCard
                                user={user}
                                onUpdateRole={handleUpdateRole}
                                onSuspend={handleSuspend}
                                onDelete={handleDelete}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Role Update Modal */}
            {showRoleModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Update User Role</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRoleModal(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <p>Update role for <strong>{selectedUser?.name}</strong></p>
                                <select
                                    className="form-select"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowRoleModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleRoleUpdate}
                                >
                                    Update Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && users.length > 0 && (
                <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading more users...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

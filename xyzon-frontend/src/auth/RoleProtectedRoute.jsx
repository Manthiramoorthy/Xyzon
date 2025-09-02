import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RoleProtectedRoute({ role, children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#000066' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

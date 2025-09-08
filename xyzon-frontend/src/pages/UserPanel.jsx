import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../auth/AuthContext';
import { FiFileText, FiCalendar, FiUsers, FiAward, FiCreditCard, FiLogOut, FiUser } from 'react-icons/fi';

export default function UserPanel() {
    const { setItems } = useMenu();
    const { logout } = useAuth();
    const loc = useLocation();

    useEffect(() => {
        setItems([
            { to: '/user/registrations', label: 'My Event Registrations', icon: <FiUsers /> },
            { to: '/user/payments', label: 'My Payment History', icon: <FiCreditCard /> },
            { to: '/user/certificates', label: 'My Certificates', icon: <FiAward /> },
            { to: '/user/profile', label: 'My Profile', icon: <FiUser /> },
            { action: logout, label: 'Logout', icon: <FiLogOut />, isAction: true },
        ]);
    }, [setItems, logout]);

    useEffect(() => { /* path change rerender */ }, [loc.pathname]);
    return <main style={{ padding: '30px 1.2rem 2rem 1.2rem' }}><Outlet /></main>;
}

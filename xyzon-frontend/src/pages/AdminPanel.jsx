import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../auth/AuthContext';
import {
    FiFileText, FiMail, FiCalendar, FiPlus,
    FiUsers, FiBarChart, FiAward, FiUserCheck, FiLogOut
} from 'react-icons/fi';

export default function AdminPanel() {
    const { setItems } = useMenu();
    const { logout } = useAuth();
    const loc = useLocation();

    useEffect(() => {
        setItems([
            { to: '/admin/events', label: 'My Events', icon: <FiCalendar /> },
            { to: '/admin/events/create', label: 'Create Event', icon: <FiPlus /> },
            { to: '/admin/users', label: 'User Management', icon: <FiUserCheck /> },
            { to: '/admin/certificate-templates', label: 'Certificate Templates', icon: <FiAward /> },
            { to: '/admin/certificate', label: 'Certificate Generator', icon: <FiFileText /> },
            { to: '/admin/send-mail', label: 'Send Email', icon: <FiMail /> },
            { action: logout, label: 'Logout', icon: <FiLogOut />, isAction: true },
        ]);
    }, [setItems, logout]);

    useEffect(() => { /* highlight update triggers re-render */ }, [loc.pathname]);

    return (
        <div className="admin-panel-container">

            {/* Main Content */}
            <main className="admin-main-content">
                <Outlet />
            </main>


            <style jsx>{`
                .admin-panel-container {
                    display: flex;
                    gap: 24px;
                    padding: 10px 1.2rem 2rem 1.2rem;
                    min-height: calc(100vh - 120px);
                }
                
                .admin-main-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .admin-stats-panel {
                    width: 300px;
                    flex-shrink: 0;
                }
                
                @media (max-width: 1199px) {
                    .admin-panel-container {
                        flex-direction: column;
                        gap: 16px;
                        padding: 8px 1rem 1.5rem 1rem;
                    }
                }
                
                @media (max-width: 768px) {
                    .admin-panel-container {
                        gap: 12px;
                        padding: 8px 0.8rem 1rem 0.8rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .admin-panel-container {
                        padding: 8px 0.5rem 1rem 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
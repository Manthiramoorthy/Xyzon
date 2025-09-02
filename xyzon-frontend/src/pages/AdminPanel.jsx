import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { FiFileText, FiMail } from 'react-icons/fi';

export default function AdminPanel() {
    const { setItems } = useMenu();
    const loc = useLocation();
    useEffect(() => {
        setItems([
            { to: '/admin/certificate', label: 'Certificate Generator', icon: <FiFileText /> },
            { to: '/admin/send-mail', label: 'Send Email', icon: <FiMail /> },
        ]);
    }, [setItems]);
    useEffect(() => { /* highlight update triggers re-render */ }, [loc.pathname]);
    return <main style={{ padding: '10px 1.2rem 2rem 1.2rem' }}><Outlet /></main>;
}

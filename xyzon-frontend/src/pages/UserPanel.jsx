import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { FiFileText } from 'react-icons/fi';

export default function UserPanel() {
    const { setItems } = useMenu();
    const loc = useLocation();
    useEffect(() => {
        setItems([
            { to: '/user/certificate', label: 'Certificate Generator', icon: <FiFileText /> },
        ]);
    }, [setItems]);
    useEffect(() => { /* path change rerender */ }, [loc.pathname]);
    return <main style={{ padding: '90px 1.2rem 2rem 1.2rem' }}><Outlet /></main>;
}

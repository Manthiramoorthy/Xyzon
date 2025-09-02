import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FiMenu, FiX, FiMail, FiFileText, FiLogOut, FiUser } from 'react-icons/fi';

export default function AdminToolbar({ links }) {
    const [open, setOpen] = useState(false);
    const loc = useLocation();
    const { user, logout } = useAuth();
    const toggle = () => setOpen(o => !o);
    const close = () => setOpen(false);
    return (
        <div>
            <header style={styles.bar}>
                <button onClick={toggle} aria-label="Toggle menu" style={styles.menuBtn}>{open ? <FiX /> : <FiMenu />}</button>
                <div style={styles.brand}>Xyzon Admin</div>
                <div style={styles.spacer} />
                {user && <div style={styles.userBox} title={user.email}><FiUser style={{ marginRight: 6 }} /> {user.role === 'admin' ? 'Admin' : 'User'}</div>}
                <button onClick={logout} style={styles.logoutBtn}><FiLogOut /> Logout</button>
            </header>
            <nav style={{ ...styles.side, transform: open ? 'translateX(0)' : 'translateX(-105%)' }}>
                <div style={styles.sideInner}>
                    <div style={styles.sideTitle}>Navigation</div>
                    <ul style={styles.navList}>
                        {links.map(l => (
                            <li key={l.to}>
                                <Link onClick={close} to={l.to} style={{ ...styles.navLink, ...(loc.pathname === l.to ? styles.navLinkActive : {}) }}>
                                    {l.icon && <span style={{ marginRight: 10, display: 'flex', alignItems: 'center' }}>{l.icon}</span>}
                                    <span>{l.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </div>
    );
}

const styles = {
    bar: { position: 'fixed', top: 0, left: 0, right: 0, height: 60, display: 'flex', alignItems: 'center', background: '#000066', color: '#fff', padding: '0 1rem', zIndex: 1100, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' },
    menuBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6 },
    brand: { fontWeight: 700, fontSize: 18, marginLeft: 8, letterSpacing: .5 },
    spacer: { flex: 1 },
    userBox: { display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600, background: '#ffffff22', padding: '6px 12px', borderRadius: 30, marginRight: 12 },
    logoutBtn: { background: '#f26b24', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 },
    side: { position: 'fixed', top: 60, bottom: 0, left: 0, width: 240, background: '#fff', borderRight: '1px solid #00006622', transition: 'transform .35s', zIndex: 1090, boxShadow: '2px 0 8px rgba(0,0,0,0.08)' },
    sideInner: { padding: '1rem .85rem', height: '100%', overflowY: 'auto' },
    sideTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '.7px', color: '#000066', textTransform: 'uppercase', marginBottom: 10 },
    navList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 },
    navLink: { display: 'flex', alignItems: 'center', padding: '10px 12px', textDecoration: 'none', color: '#000066', fontWeight: 600, borderRadius: 10, background: '#00006608', fontSize: 14, transition: 'background .25s, color .25s' },
    navLinkActive: { background: '#f26b24', color: '#fff' },
};

export const defaultAdminLinks = [
    { to: '/admin/certificate', label: 'Certificate Generator', icon: <FiFileText /> },
    { to: '/admin/send-mail', label: 'Send Email', icon: <FiMail /> },
];

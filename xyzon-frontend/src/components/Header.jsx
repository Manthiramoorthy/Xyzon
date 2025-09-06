import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMenu } from '../context/MenuContext';
import { FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '#about' },
    { label: 'Programs', href: '#programs' },
    { label: 'Events', href: '/events' },
    { label: 'Services', href: '#services' },
    { label: 'Success Stories', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
];

// Helper function to handle smooth scrolling to sections
const handleSectionClick = (sectionId, navigate) => {
    // If we're not on the home page, navigate there first
    if (window.location.pathname !== '/') {
        navigate('/', { replace: true });
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } else {
        // We're already on the home page, just scroll
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// Helper function to handle home navigation
const handleHomeClick = (navigate) => {
    navigate('/', { replace: false });
};

export function Header() {
    const location = useLocation();
    if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password') return null;
    const { user, logout } = useAuth();
    const { items } = useMenu();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const hasCustom = items && items.length > 0 && (location.pathname.startsWith('/admin') || location.pathname.startsWith('/user'));
    const toggle = () => setOpen(o => !o);
    const close = () => setOpen(false);
    return (
        <header style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1200 }}>
            <nav className="navbar navbar-expand-lg navbar-light shadow-sm" style={{ minHeight: 64, backgroundColor: '#F8FAFC', borderBottom: '1px solid rgba(0,0,102,0.08)' }}>
                <div className="container-fluid px-3">
                    <div className="d-flex align-items-center gap-2">
                        {hasCustom && (
                            <button onClick={toggle} className="btn btn-outline-primary d-inline-flex" aria-label="Toggle menu" aria-expanded={open} aria-controls="panel-side-menu">
                                {open ? <FiX /> : <FiMenu />}
                            </button>
                        )}
                        <Link className="navbar-brand d-flex align-items-center gap-2" to="/" style={{ fontWeight: 700, letterSpacing: 0.5, color: '#000066', textDecoration: 'none' }}>
                            <img src="/assets/images/default-logo.jpeg" alt="Xyzon" style={{ height: 60, borderRadius: 8 }} />
                        </Link>
                    </div>
                    {!hasCustom && (
                        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#topNav" aria-controls="topNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon" />
                        </button>
                    )}
                    <div className={!hasCustom ? 'collapse navbar-collapse' : ''} id={!hasCustom ? 'topNav' : undefined}>
                        {!hasCustom && (
                            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                                {navLinks.map(l => (
                                    <li key={l.label} className="nav-item">
                                        {l.label === 'Home' ? (
                                            <button
                                                className="nav-link btn btn-link p-0"
                                                style={{ border: 'none', background: 'none', textDecoration: 'none' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleHomeClick(navigate);
                                                }}
                                            >
                                                {l.label}
                                            </button>
                                        ) : l.href.startsWith('#') ? (
                                            <button
                                                className="nav-link btn btn-link p-0"
                                                style={{ border: 'none', background: 'none', textDecoration: 'none' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleSectionClick(l.href.substring(1), navigate);
                                                }}
                                            >
                                                {l.label}
                                            </button>
                                        ) : l.href.startsWith('/') ? (
                                            <Link className="nav-link" to={l.href}>{l.label}</Link>
                                        ) : (
                                            <a className="nav-link" href={l.href}>{l.label}</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="d-flex align-items-center gap-2 ms-auto">
                            {user && !hasCustom && (
                                <button
                                    className="btn btn-outline-primary fw-semibold px-3 py-2"
                                    onClick={() => navigate(user.role === 'admin' ? '/admin/events' : '/user/registrations')}
                                >
                                    {user.role === 'admin' ? 'Admin Panel' : 'User Portal'}
                                </button>
                            )}
                            {!user && (
                                <>
                                    <Link to="/login" className="btn btn-outline-primary fw-semibold px-3 py-2">Sign In</Link>
                                    <Link to="/register" className="btn btn-primary fw-semibold px-3 py-2">Sign Up</Link>
                                </>
                            )}
                            {user && hasCustom && (
                                <div className="d-flex align-items-center px-3 py-2 fw-semibold" style={{ background: '#00006610', borderRadius: 30, fontSize: 14, color: '#000066' }}>
                                    <FiUser style={{ marginRight: 6 }} /> {user.role === 'admin' ? 'Admin' : 'User'}
                                </div>
                            )}
                            {user && !hasCustom && (
                                <>
                                    <div className="d-none d-md-flex align-items-center px-3 py-2 fw-semibold" style={{ background: '#00006610', borderRadius: 30, fontSize: 14, color: '#000066' }}>
                                        <FiUser style={{ marginRight: 6 }} /> {user.role === 'admin' ? 'Admin' : 'User'}
                                    </div>
                                    <button className="btn btn-primary fw-semibold px-3 py-2 d-flex align-items-center gap-1" onClick={logout}><FiLogOut /> Logout</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {hasCustom && (
                <div id="panel-side-menu" style={{ position: 'fixed', top: 64, left: 0, bottom: 0, width: 240, background: '#fff', borderRight: '1px solid #00006622', transform: open ? 'translateX(0)' : 'translateX(-110%)', transition: 'transform .35s', boxShadow: '2px 0 8px rgba(0,0,0,0.08)', zIndex: 1190 }}>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map((it, index) => (
                            <li key={it.to || index}>
                                {it.isAction ? (
                                    <button
                                        onClick={() => {
                                            close();
                                            it.action();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 12px',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            borderRadius: 10,
                                            background: '#dc354520',
                                            color: '#dc3545',
                                            fontSize: 14,
                                            border: 'none',
                                            width: '100%',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {it.icon && <span>{it.icon}</span>}
                                        {it.label}
                                    </button>
                                ) : (
                                    <Link
                                        onClick={close}
                                        to={it.to}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 12px',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            borderRadius: 10,
                                            background: location.pathname === it.to ? '#f26b24' : '#00006608',
                                            color: location.pathname === it.to ? '#fff' : '#000066',
                                            fontSize: 14
                                        }}
                                    >
                                        {it.icon && <span>{it.icon}</span>}
                                        {it.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </header>
    );
}

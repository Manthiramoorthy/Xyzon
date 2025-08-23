import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    if (location.pathname === '/') {
        return <></>;
    }   
    return (
        <header style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1040 }}>
            {/* Top accent bar */}
            <nav className="navbar navbar-expand-lg navbar-light" style={{ minHeight: 64, backgroundColor: '#F8FAFC' }}>
                <div className="container-fluid">
                    <a className="navbar-brand d-flex align-items-center" href="/" style={{ textAlign: 'center', fontWeight: 700, fontSize: 24, letterSpacing: 1 }}>
                        <img src="/assets/images/default-logo.jpeg" alt="Company Logo" style={{ height: 60, marginRight: 14, border: 0, borderRadius: 8 }} />
                    </a>
                    <div className="d-flex gap-2">
                        <button
                            className={`btn btn-outline-primary px-3 py-2 fw-semibold${location.pathname.startsWith('/certificate') ? ' active' : ''}`}
                            onClick={() => navigate('/certificate')}
                        >
                            Certificate
                        </button>
                        <button
                            className={`btn btn-outline-primary px-3 py-2 fw-semibold${location.pathname.startsWith('/send-mail') ? ' active' : ''}`}
                            onClick={() => navigate('/send-mail')}
                        >
                            Send Mail
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}

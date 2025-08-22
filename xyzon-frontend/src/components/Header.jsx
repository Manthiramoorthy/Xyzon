import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top" style={{ zIndex: 1040, }}>
            <div className="container-fluid">
                <a className="navbar-brand d-flex align-items-center" href="/" style={{ textAlign: 'center' }}>
                    <img src="/assets/images/default-logo.jpeg" alt="Company Logo" style={{ height: 40, marginRight: 12, border: 0 }} />
                </a>
                <div className="d-flex gap-2">
                    <button
                        className={`btn btn-outline-primary${location.pathname.startsWith('/certificate') ? ' active' : ''}`}
                        onClick={() => navigate('/certificate')}
                    >
                        Certificate
                    </button>
                    <button
                        className={`btn btn-outline-primary${location.pathname.startsWith('/send-mail') ? ' active' : ''}`}
                        onClick={() => navigate('/send-mail')}
                    >
                        Send Mail
                    </button>
                </div>
            </div>
        </nav>
    );
}

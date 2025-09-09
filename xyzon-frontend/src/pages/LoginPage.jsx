import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import '../auth/authStyles.css';

export default function LoginPage() {
    const { login, error, user } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Add auth page class to body to prevent header padding
    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => {
            document.body.classList.remove('auth-page');
        };
    }, []);

    const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const submit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const u = await login(form.email, form.password);
            // Don't navigate here, let the useEffect handle it
        } catch {
            // Error is handled by AuthContext
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (user) {
            const targetPath = user.role === 'admin' ? '/admin/events' : '/user/registrations';
            // Only navigate if we're not already on the target path
            if (location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
        }
    }, [user, navigate, location.pathname]);
    const [showPwd, setShowPwd] = useState(false);
    return (
        <div className="auth-page-root">
            <div className="auth-shell">
                <div className="auth-panel-brand blue">
                    <div className="brand-inner">
                        <img src="/assets/images/xyzon.png" alt="Xyzon" className="auth-logo" />
                        <div className="brand-badge">
                            <span className="badge-text">Trusted Platform</span>
                            <div className="badge-icon">✓</div>
                        </div>
                        <h1>Welcome Back to Xyzon</h1>
                        <p className="brand-subtitle">Continue your journey of innovation and entrepreneurship with cutting-edge programs designed for tomorrow's leaders.</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <div className="feature-icon">🚀</div>
                                <div className="feature-content">
                                    <h3>Launch Your Ideas</h3>
                                    <p>Transform concepts into reality with expert guidance</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🏆</div>
                                <div className="feature-content">
                                    <h3>Win Hackathons</h3>
                                    <p>Compete in industry-level challenges and competitions</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🌟</div>
                                <div className="feature-content">
                                    <h3>Build Your Network</h3>
                                    <p>Connect with mentors, peers, and industry leaders</p>
                                </div>
                            </div>
                        </div>
                        <div className="stats-row">
                            <div className="stat">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Students</div>
                            </div>
                            <div className="stat">
                                <div className="stat-number">50+</div>
                                <div className="stat-label">Projects</div>
                            </div>
                            <div className="stat">
                                <div className="stat-number">20+</div>
                                <div className="stat-label">Mentors</div>
                            </div>
                        </div>
                    </div>
                </div>
                <form onSubmit={submit} className="auth-form-panel" aria-describedby={error ? 'login-error' : undefined}>
                    <h2>Welcome Back</h2>
                    {error && <div id="login-error" className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">Email Address</label>
                        <div className="auth-input-wrap">
                            <FiMail className="auth-icon" />
                            <input id="login-email" className="auth-input" name="email" type="email" value={form.email} onChange={onChange} required placeholder="Enter your email" autoComplete="email" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">Password</label>
                        <div className="auth-input-wrap">
                            <FiLock className="auth-icon" />
                            <input id="login-password" className="auth-input" name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange} required placeholder="Enter your password" autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPwd(s => !s)} className="auth-eye-btn" aria-label={showPwd ? 'Hide password' : 'Show password'}>{showPwd ? <FiEyeOff /> : <FiEye />}</button>
                        </div>
                    </div>
                    <button className="auth-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                    <div className="auth-links" style={{ marginTop: 20 }}><Link to="/forgot-password">Forgot your password?</Link></div>
                    <div className="auth-links">Don't have an account? <Link to="/register">Create one now</Link></div>
                </form>
            </div>
        </div>
    );
}

// (Inline style object removed; using shared CSS classes.)
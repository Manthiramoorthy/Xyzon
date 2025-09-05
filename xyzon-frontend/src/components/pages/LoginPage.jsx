import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import '../../auth/authStyles.css';

export default function LoginPage() {
    const { login, error, user } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const submit = async e => { e.preventDefault(); setLoading(true); try { const u = await login(form.email, form.password); navigate(u.role === 'admin' ? '/admin/certificate' : '/user/certificate'); } catch { } finally { setLoading(false); } };
    useEffect(() => { if (user) { navigate(user.role === 'admin' ? '/admin/certificate' : '/user/certificate', { replace: true }); } }, [user, navigate]);
    const [showPwd, setShowPwd] = useState(false);
    return (
        <div className="auth-page-root fade-in">
            <div className="auth-shell">
                <div className="auth-panel-brand blue">
                    <div className="brand-inner">
                        <img src="/assets/images/default-logo.jpeg" alt="Xyzon" className="auth-logo" />
                        <h1>Welcome Back</h1>
                        <p>Empowering innovation through learning.</p>
                        <ul>
                            <li>Hands-on Programs</li>
                            <li>Hackathon Centric Learning</li>
                            <li>Entrepreneur Ecosystem</li>
                        </ul>
                    </div>
                </div>
                <form onSubmit={submit} className="auth-form-panel" aria-describedby={error ? 'login-error' : undefined}>
                    <h2>Sign In</h2>
                    {error && <div id="login-error" className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">Email</label>
                        <div className="auth-input-wrap">
                            <FiMail className="auth-icon" />
                            <input id="login-email" className="auth-input" name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@domain.com" autoComplete="email" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">Password</label>
                        <div className="auth-input-wrap">
                            <FiLock className="auth-icon" />
                            <input id="login-password" className="auth-input" name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange} required placeholder="••••••••" autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPwd(s => !s)} className="auth-eye-btn" aria-label={showPwd ? 'Hide password' : 'Show password'}>{showPwd ? <FiEyeOff /> : <FiEye />}</button>
                        </div>
                    </div>
                    <button className="auth-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
                    <div className="auth-links" style={{ marginTop: 14 }}><Link to="/forgot-password">Forgot password?</Link></div>
                    <div className="auth-links">No account? <Link to="/register">Register</Link></div>
                </form>
            </div>
        </div>
    );
}

// (Inline style object removed; using shared CSS classes.)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import '../auth/authStyles.css';

export default function RegisterPage() {
    const { register, error } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Add auth page class to body to prevent header padding
    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => {
            document.body.classList.remove('auth-page');
        };
    }, []);

    const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const submit = async e => { e.preventDefault(); setLoading(true); try { await register(form); navigate('/'); } catch { } finally { setLoading(false); } };
    const [showPwd, setShowPwd] = useState(false);
    const strength = useMemo(() => {
        let score = 0; const v = form.password;
        if (v.length >= 8) score++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++; if (/\d/.test(v)) score++;
        return score;
    }, [form.password]);
    return (
        <div className="auth-page-root">
            <div className="auth-shell">
                <div className="auth-panel-brand orange">
                    <div className="brand-inner">
                        <img src="/assets/images/xyzon.png" alt="Xyzon" className="auth-logo" />
                        <div className="brand-badge">
                            <span className="badge-text">Join 500+ Students</span>
                            <div className="badge-icon">🎯</div>
                        </div>
                        <h1>Start Your Innovation Journey</h1>
                        <p className="brand-subtitle">Join Xyzon's community of innovators, entrepreneurs, and change-makers. Build the future with hands-on experience and industry mentorship.</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <div className="feature-icon">💡</div>
                                <div className="feature-content">
                                    <h3>Learn by Doing</h3>
                                    <p>Real-world projects with industry-grade tools and technologies</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🤝</div>
                                <div className="feature-content">
                                    <h3>Expert Mentorship</h3>
                                    <p>Get guidance from industry veterans and successful entrepreneurs</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🚀</div>
                                <div className="feature-content">
                                    <h3>Launch Your Startup</h3>
                                    <p>From idea validation to product launch - we support your journey</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial">
                            <div className="testimonial-text">"Xyzon transformed my idea into a successful startup. The community and mentorship are unmatched!"</div>
                            <div className="testimonial-author">- Sarah K., Alumni</div>
                        </div>
                    </div>
                </div>
                <form onSubmit={submit} className="auth-form-panel" aria-describedby={error ? 'reg-error' : undefined}>
                    <h2>Create Your Account</h2>
                    {error && <div id="reg-error" className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-name">Full Name</label>
                        <div className="auth-input-wrap">
                            <FiUser className="auth-icon" />
                            <input id="reg-name" className="auth-input" name="name" value={form.name} onChange={onChange} required placeholder="Enter your full name" autoComplete="name" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-email">Email Address</label>
                        <div className="auth-input-wrap">
                            <FiMail className="auth-icon" />
                            <input id="reg-email" className="auth-input" name="email" type="email" value={form.email} onChange={onChange} required placeholder="Enter your email" autoComplete="email" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-password">Create Password</label>
                        <div className="auth-input-wrap">
                            <FiLock className="auth-icon" />
                            <input id="reg-password" className="auth-input" name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange} required minLength={8} placeholder="Create a strong password" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPwd(s => !s)} className="auth-eye-btn" aria-label={showPwd ? 'Hide password' : 'Show password'}>{showPwd ? <FiEyeOff /> : <FiEye />}</button>
                        </div>
                        <PasswordHints pwd={form.password} />
                        <div className="strength-track" aria-hidden="true">
                            <div className={`strength-bar ${strength === 2 ? 'good' : strength === 3 ? 'strong' : ''}`} style={{ width: `${(strength / 3) * 100}%` }} />
                        </div>
                        <div className="strength-label">Password strength: {['Weak', 'Fair', 'Good', 'Strong'][strength]}</div>
                    </div>
                    <button className="auth-btn" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
                    <div className="auth-links">Already have an account? <Link to="/login">Sign in here</Link></div>
                </form>
            </div>
        </div>
    );
}

function PasswordHints({ pwd }) {
    const rules = [
        { label: '8+ chars', ok: pwd.length >= 8 },
        { label: 'Letter', ok: /[A-Za-z]/.test(pwd) },
        { label: 'Number', ok: /[0-9]/.test(pwd) }
    ];
    return (
        <div className="password-hints" aria-hidden="true">
            {rules.map(r => <span key={r.label} className={r.ok ? 'ok' : ''}>{r.label}</span>)}
        </div>
    );
}

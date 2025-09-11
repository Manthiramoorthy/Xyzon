import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import ICONS from '../../constants/icons';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import '../../auth/authStyles.css';

export default function RegisterPage() {
    const { register, error } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const submit = async e => { e.preventDefault(); setLoading(true); try { await register(form); navigate('/'); } catch { } finally { setLoading(false); } };
    const [showPwd, setShowPwd] = useState(false);
    const strength = useMemo(() => {
        let score = 0; const v = form.password;
        if (v.length >= 8) score++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++; if (/\d/.test(v)) score++;
        return score;
    }, [form.password]);
    return (
        <div className="auth-page-root fade-in">
            <div className="auth-shell">
                <div className="auth-panel-brand blue">
                    <div className="brand-inner">
                        <img src="/assets/images/default-logo.jpeg" alt="Xyzon" className="auth-logo" />
                        <h1>Join Xyzon</h1>
                        <p>Start your journey in innovation & entrepreneurship.</p>
                        <ul>
                            <li>Community Mentorship</li>
                            <li>Hackathons & Challenges</li>
                            <li>Industry-grade Projects</li>
                        </ul>
                    </div>
                </div>
                <form onSubmit={submit} className="auth-form-panel" aria-describedby={error ? 'reg-error' : undefined}>
                    <h2>Create Account</h2>
                    {error && <div id="reg-error" className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-name">Name</label>
                        <div className="auth-input-wrap">
                            <FiUser className="auth-icon" />
                            <input id="reg-name" className="auth-input" name="name" value={form.name} onChange={onChange} required placeholder="Your full name" autoComplete="name" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-email">Email</label>
                        <div className="auth-input-wrap">
                            <FiMail className="auth-icon" />
                            <input id="reg-email" className="auth-input" name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@domain.com" autoComplete="email" />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-password">Password</label>
                        <div className="auth-input-wrap">
                            <FiLock className="auth-icon" />
                            <input id="reg-password" className="auth-input" name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange} required minLength={8} placeholder="Min 8 characters" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPwd(s => !s)} className="auth-eye-btn">{showPwd ? <ICONS.HIDE /> : <ICONS.VIEW />}</button>
                        </div>
                        <PasswordHints pwd={form.password} />
                        <div className="strength-track" aria-hidden="true">
                            <div className={`strength-bar ${strength === 2 ? 'good' : strength === 3 ? 'strong' : ''}`} style={{ width: `${(strength / 3) * 100}%` }} />
                        </div>
                        <div className="strength-label">Password strength: {['Weak', 'Fair', 'Good', 'Strong'][strength]}</div>
                    </div>
                    <button className="auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
                    <div className="auth-links">Have an account? <Link to="/login">Login</Link></div>
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

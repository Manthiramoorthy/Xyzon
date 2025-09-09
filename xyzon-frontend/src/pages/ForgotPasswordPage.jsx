import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../auth/authService';
import { FiMail, FiLock, FiRefreshCcw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../auth/authStyles.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [stage, setStage] = useState('request');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Add auth page class to body to prevent header padding
    useEffect(() => {
        document.body.classList.add('auth-page');
        return () => {
            document.body.classList.remove('auth-page');
        };
    }, []);

    const request = async e => { e.preventDefault(); setLoading(true); setError(''); try { await forgotPassword(email); setMsg('If account exists, a reset link or token has been generated. (Dev token may display below)'); setStage('token'); } catch (err) { setError(err.message); } finally { setLoading(false); } };
    const reset = async e => { e.preventDefault(); setLoading(true); setError(''); try { await resetPassword({ token, password }); setMsg('Password reset successful. You can login now.'); setStage('done'); } catch (err) { setError(err.message); } finally { setLoading(false); } };

    return (
        <div className="auth-page-root">
            <div className="auth-shell">
                <div className="auth-panel-brand amber">
                    <div className="brand-inner">
                        <img src="/assets/images/xyzon.png" alt="Xyzon" className="auth-logo" />
                        <div className="brand-badge">
                            <span className="badge-text">Secure Reset</span>
                            <div className="badge-icon">🔒</div>
                        </div>
                        <h1>Secure Account Recovery</h1>
                        <p className="brand-subtitle">Don't worry! It happens to the best of us. Reset your password securely and get back to building amazing things.</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <div className="feature-icon">🔐</div>
                                <div className="feature-content">
                                    <h3>Bank-Level Security</h3>
                                    <p>Your account is protected with enterprise-grade encryption</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">⚡</div>
                                <div className="feature-content">
                                    <h3>Quick Recovery</h3>
                                    <p>Get back to your projects in just a few simple steps</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">📧</div>
                                <div className="feature-content">
                                    <h3>Email Verification</h3>
                                    <p>We'll send a secure reset link to your registered email</p>
                                </div>
                            </div>
                        </div>
                        <div className="security-note">
                            <div className="security-icon">🛡️</div>
                            <div className="security-text">
                                <strong>Privacy Protected:</strong> Your data is encrypted and never shared with third parties.
                            </div>
                        </div>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <h2>Reset Your Password</h2>
                    {error && <div className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    {stage === 'request' && (
                        <form onSubmit={request} noValidate>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-email">Email Address</label>
                                <div className="auth-input-wrap">
                                    <FiMail className="auth-icon" />
                                    <input id="fp-email" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Enter your email address" autoComplete="email" />
                                </div>
                            </div>
                            <button className="auth-btn alt" disabled={loading}>{loading ? 'Sending Reset Link...' : 'Send Reset Link'}</button>
                            {msg && <div className="auth-info"><FiCheckCircle style={{ marginRight: 8 }} /> {msg}</div>}
                        </form>
                    )}
                    {stage === 'token' && (
                        <form onSubmit={reset} noValidate>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-token">Reset Token</label>
                                <div className="auth-input-wrap">
                                    <FiRefreshCcw className="auth-icon" />
                                    <input id="fp-token" className="auth-input" value={token} onChange={e => setToken(e.target.value)} required placeholder="Enter the reset token" />
                                </div>
                            </div>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-password">New Password</label>
                                <div className="auth-input-wrap">
                                    <FiLock className="auth-icon" />
                                    <input id="fp-password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={8} placeholder="Enter your new password" autoComplete="new-password" />
                                </div>
                            </div>
                            <button className="auth-btn alt" disabled={loading}>{loading ? 'Updating Password...' : 'Update Password'}</button>
                            {msg && <div className="auth-info"><FiCheckCircle style={{ marginRight: 8 }} /> {msg}</div>}
                        </form>
                    )}
                    {stage === 'done' && (
                        <div className="auth-info" style={{ marginTop: 0 }}>
                            <FiCheckCircle style={{ marginTop: 2 }} /> 
                            Password reset successful! <Link to="/login" style={{ fontWeight: 700 }}>Sign in now</Link>
                        </div>
                    )}
                    <div className="auth-links" style={{ marginTop: 24 }}>
                        <Link to="/login">← Back to Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// (Inline style object removed; using shared CSS classes.)

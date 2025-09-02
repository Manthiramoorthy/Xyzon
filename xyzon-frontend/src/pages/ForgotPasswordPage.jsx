import React, { useState } from 'react';
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

    const request = async e => { e.preventDefault(); setLoading(true); setError(''); try { await forgotPassword(email); setMsg('If account exists, a reset link or token has been generated. (Dev token may display below)'); setStage('token'); } catch (err) { setError(err.message); } finally { setLoading(false); } };
    const reset = async e => { e.preventDefault(); setLoading(true); setError(''); try { await resetPassword({ token, password }); setMsg('Password reset successful. You can login now.'); setStage('done'); } catch (err) { setError(err.message); } finally { setLoading(false); } };

    return (
        <div className="auth-page-root fade-in">
            <div className="auth-shell">
                <div className="auth-panel-brand blue">
                    <div className="brand-inner">
                        <img src="/assets/images/default-logo.jpeg" alt="Xyzon" className="auth-logo" />
                        <h1>Reset Access</h1>
                        <p>Securely regain access and continue learning.</p>
                        <ul>
                            <li>Token based reset</li>
                            <li>Secure hashing</li>
                            <li>Fast turnaround</li>
                        </ul>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <h2>Reset Password</h2>
                    {error && <div className="auth-error" role="alert"><FiAlertCircle style={{ marginTop: 2 }} /> {error}</div>}
                    {stage === 'request' && (
                        <form onSubmit={request} noValidate>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-email">Email</label>
                                <div className="auth-input-wrap">
                                    <FiMail className="auth-icon" />
                                    <input id="fp-email" className="auth-input" value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@domain.com" autoComplete="email" />
                                </div>
                            </div>
                            <button className="auth-btn alt" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
                            {msg && <div className="auth-info"><FiCheckCircle style={{ marginRight: 6 }} /> {msg}</div>}
                        </form>
                    )}
                    {stage === 'token' && (
                        <form onSubmit={reset} noValidate>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-token">Reset Token</label>
                                <div className="auth-input-wrap">
                                    <FiRefreshCcw className="auth-icon" />
                                    <input id="fp-token" className="auth-input" value={token} onChange={e => setToken(e.target.value)} required placeholder="Enter token" />
                                </div>
                            </div>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="fp-password">New Password</label>
                                <div className="auth-input-wrap">
                                    <FiLock className="auth-icon" />
                                    <input id="fp-password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={8} placeholder="New password" autoComplete="new-password" />
                                </div>
                            </div>
                            <button className="auth-btn alt" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
                            {msg && <div className="auth-info"><FiCheckCircle style={{ marginRight: 6 }} /> {msg}</div>}
                        </form>
                    )}
                    {stage === 'done' && <div style={{ color: '#000066', marginTop: 16 }}>Return to <Link to="/login">Login</Link></div>}
                    <div className="auth-links" style={{ marginTop: 18 }}><Link to="/login">Back to login</Link></div>
                </div>
            </div>
        </div>
    );
}

// (Inline style object removed; using shared CSS classes.)

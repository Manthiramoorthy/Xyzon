import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaCertificate } from 'react-icons/fa';

export default function CertificateVerifyForm() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter a verification code');
            return;
        }
        setError('');
        navigate(`/certificate-verification/${code.trim()}`);
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-lg border-0 p-4" style={{ minWidth: 350 }}>
                <div className="text-center mb-4">
                    <FaCertificate className="fa-3x text-primary mb-2" />
                    <h3>Verify Certificate</h3>
                    <p className="text-muted">Enter your certificate verification code below</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="Verification Code"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {error && <div className="text-danger mb-2">{error}</div>}
                    <button type="submit" className="btn btn-primary w-100">
                        <FaSearch className="me-2" /> Verify
                    </button>
                </form>
            </div>
        </div>
    );
}

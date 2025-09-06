import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { certificateApi } from '../api/eventApi';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaCertificate } from 'react-icons/fa';

export default function CertificateVerification() {
    const { verificationCode } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        verifyCertificate();
    }, [verificationCode]);

    const verifyCertificate = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await certificateApi.verifyCertificate(verificationCode);
            setCertificate(response.data.data);
            setIsValid(true);
        } catch (error) {
            if (error.response?.status === 404) {
                setError('Certificate not found or verification code is invalid');
            } else {
                setError(error.response?.data?.message || 'Failed to verify certificate');
            }
            setIsValid(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <FaSpinner className="fa-spin fa-3x text-primary mb-4" />
                    <h4>Verifying Certificate...</h4>
                    <p className="text-muted">Please wait while we verify the certificate</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5 text-center">
                                {isValid ? (
                                    <>
                                        <FaCheckCircle className="fa-4x text-success mb-4" />
                                        <h2 className="text-success mb-3">Certificate Verified!</h2>
                                        <p className="text-muted mb-4">
                                            This certificate is authentic and valid.
                                        </p>

                                        {certificate && (
                                            <div className="bg-light p-4 rounded mb-4">
                                                <div className="row text-start">
                                                    <div className="col-sm-4">
                                                        <strong>Certificate ID:</strong>
                                                    </div>
                                                    <div className="col-sm-8">
                                                        {certificate.certificateId}
                                                    </div>
                                                </div>
                                                <hr className="my-2" />
                                                <div className="row text-start">
                                                    <div className="col-sm-4">
                                                        <strong>Recipient:</strong>
                                                    </div>
                                                    <div className="col-sm-8">
                                                        {certificate.recipientName}
                                                    </div>
                                                </div>
                                                <hr className="my-2" />
                                                <div className="row text-start">
                                                    <div className="col-sm-4">
                                                        <strong>Title:</strong>
                                                    </div>
                                                    <div className="col-sm-8">
                                                        {certificate.title}
                                                    </div>
                                                </div>
                                                <hr className="my-2" />
                                                <div className="row text-start">
                                                    <div className="col-sm-4">
                                                        <strong>Issue Date:</strong>
                                                    </div>
                                                    <div className="col-sm-8">
                                                        {new Date(certificate.issueDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {certificate.event && (
                                                    <>
                                                        <hr className="my-2" />
                                                        <div className="row text-start">
                                                            <div className="col-sm-4">
                                                                <strong>Event:</strong>
                                                            </div>
                                                            <div className="col-sm-8">
                                                                {certificate.event.title}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <FaTimesCircle className="fa-4x text-danger mb-4" />
                                        <h2 className="text-danger mb-3">Certificate Invalid</h2>
                                        <p className="text-muted mb-4">
                                            {error || 'This certificate could not be verified.'}
                                        </p>
                                    </>
                                )}

                                <div className="mt-4">
                                    <FaCertificate className="text-primary me-2" />
                                    <span className="text-muted">
                                        Verification Code: <code>{verificationCode}</code>
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => window.history.back()}
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

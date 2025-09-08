import React, { useEffect, useState } from 'react';
import { companyApi } from '../api/eventApi';
import { FaSave, FaUpload, FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt, 
         FaLinkedin, FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

export default function CompanyProfile() {
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoUploading, setLogoUploading] = useState(false);

    useEffect(() => {
        loadCompanyProfile();
    }, []);

    const loadCompanyProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await companyApi.getProfile();
            setCompany(res.data.data);
        } catch (err) {
            setError('Failed to load company profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setCompany(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSimpleInputChange = (field, value) => {
        setCompany(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess('');
        try {
            await companyApi.updateProfile(company);
            setSuccess('Company profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update company profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLogoUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('logo', file);

        try {
            const res = await companyApi.uploadLogo(formData);
            setCompany(prev => ({
                ...prev,
                branding: {
                    ...prev.branding,
                    logo: res.data.data.logo
                }
            }));
            setSuccess('Logo uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to upload logo');
        } finally {
            setLogoUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading company profile...</p>
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Company Profile</h2>
                <button 
                    className="btn btn-primary" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    <FaSave className="me-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="row">
                {/* Basic Information */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Basic Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Company Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.name || ''}
                                    onChange={(e) => handleSimpleInputChange('name', e.target.value)}
                                    placeholder="Your Company Name"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Tagline</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.tagline || ''}
                                    onChange={(e) => handleSimpleInputChange('tagline', e.target.value)}
                                    placeholder="Your company tagline"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={company.description || ''}
                                    onChange={(e) => handleSimpleInputChange('description', e.target.value)}
                                    placeholder="Brief description of your company"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0"><FaPhone className="me-2" />Contact Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Email *</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaEnvelope /></span>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={company.email || ''}
                                        onChange={(e) => handleSimpleInputChange('email', e.target.value)}
                                        placeholder="contact@company.com"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.phone || ''}
                                    onChange={(e) => handleSimpleInputChange('phone', e.target.value)}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Alternate Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.alternatePhone || ''}
                                    onChange={(e) => handleSimpleInputChange('alternatePhone', e.target.value)}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0"><FaMapMarkerAlt className="me-2" />Address</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Street Address</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.address?.street || ''}
                                    onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company.address?.city || ''}
                                        onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">State</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company.address?.state || ''}
                                        onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company.address?.country || ''}
                                        onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                                        placeholder="Country"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">ZIP Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company.address?.zipCode || ''}
                                        onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                                        placeholder="ZIP Code"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Social Media & Web</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Website</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaGlobe /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.website || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'website', e.target.value)}
                                        placeholder="https://www.company.com"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">LinkedIn</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaLinkedin /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.linkedin || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/company/yourcompany"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Facebook</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaFacebook /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.facebook || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'facebook', e.target.value)}
                                        placeholder="https://facebook.com/yourcompany"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Twitter</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaTwitter /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.twitter || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'twitter', e.target.value)}
                                        placeholder="https://twitter.com/yourcompany"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Instagram</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaInstagram /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.instagram || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'instagram', e.target.value)}
                                        placeholder="https://instagram.com/yourcompany"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">YouTube</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaYoutube /></span>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={company.socialMedia?.youtube || ''}
                                        onChange={(e) => handleInputChange('socialMedia', 'youtube', e.target.value)}
                                        placeholder="https://youtube.com/c/yourcompany"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Business Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Business Type</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.businessInfo?.businessType || ''}
                                    onChange={(e) => handleInputChange('businessInfo', 'businessType', e.target.value)}
                                    placeholder="Event Management Company"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Established Year</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={company.businessInfo?.establishedYear || ''}
                                    onChange={(e) => handleInputChange('businessInfo', 'establishedYear', parseInt(e.target.value))}
                                    placeholder={new Date().getFullYear()}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Registration Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.businessInfo?.registrationNumber || ''}
                                    onChange={(e) => handleInputChange('businessInfo', 'registrationNumber', e.target.value)}
                                    placeholder="Business registration number"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">GST Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.businessInfo?.gstNumber || ''}
                                    onChange={(e) => handleInputChange('businessInfo', 'gstNumber', e.target.value)}
                                    placeholder="GST registration number"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">PAN Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={company.businessInfo?.panNumber || ''}
                                    onChange={(e) => handleInputChange('businessInfo', 'panNumber', e.target.value)}
                                    placeholder="PAN number"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">Branding</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Company Logo</label>
                                <div className="d-flex align-items-center gap-3">
                                    {company.branding?.logo && (
                                        <img 
                                            src={`http://localhost:5000${company.branding.logo}`} 
                                            alt="Company Logo" 
                                            className="img-thumbnail"
                                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                        />
                                    )}
                                    <div>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={logoUploading}
                                        />
                                        {logoUploading && <small className="text-muted">Uploading...</small>}
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Primary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={company.branding?.primaryColor || '#000066'}
                                        onChange={(e) => handleInputChange('branding', 'primaryColor', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Secondary Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={company.branding?.secondaryColor || '#ffffff'}
                                        onChange={(e) => handleInputChange('branding', 'secondaryColor', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Accent Color</label>
                                    <input
                                        type="color"
                                        className="form-control form-control-color"
                                        value={company.branding?.accentColor || '#ff6b35'}
                                        onChange={(e) => handleInputChange('branding', 'accentColor', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Settings */}
                <div className="col-lg-12 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0"><FaEnvelope className="me-2" />Email Settings</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">From Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={company.emailSettings?.fromName || ''}
                                        onChange={(e) => handleInputChange('emailSettings', 'fromName', e.target.value)}
                                        placeholder="Company Team"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">From Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={company.emailSettings?.fromEmail || ''}
                                        onChange={(e) => handleInputChange('emailSettings', 'fromEmail', e.target.value)}
                                        placeholder="noreply@company.com"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Reply To Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={company.emailSettings?.replyToEmail || ''}
                                        onChange={(e) => handleInputChange('emailSettings', 'replyToEmail', e.target.value)}
                                        placeholder="support@company.com"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email Signature</label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={company.emailSettings?.signature || ''}
                                    onChange={(e) => handleInputChange('emailSettings', 'signature', e.target.value)}
                                    placeholder="Email signature for all outgoing emails"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-4">
                <button 
                    className="btn btn-primary btn-lg px-5" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    <FaSave className="me-2" />
                    {saving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
}

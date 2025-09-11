import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi } from '../api/profileApi';
import ICONS, { ICON_SIZES, ICON_COLORS } from '../constants/icons';
import {
    FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaGraduationCap,
    FaMapMarkerAlt, FaLinkedin, FaGithub, FaTwitter, FaGlobe, FaInfoCircle
} from 'react-icons/fa';

export default function UserProfile() {
    const { user, updateUserData } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        dateOfBirth: '',
        collegeName: '',
        department: '',
        yearOfStudy: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        bio: '',
        socialLinks: {
            linkedin: '',
            github: '',
            twitter: '',
            portfolio: ''
        }
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await profileApi.getProfile();
            const profileData = response.data.data;
            setProfile(profileData);

            // Set form data
            setFormData({
                name: profileData.name || '',
                phone: profileData.phone || '',
                dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
                collegeName: profileData.collegeName || '',
                department: profileData.department || '',
                yearOfStudy: profileData.yearOfStudy || '',
                address: {
                    street: profileData.address?.street || '',
                    city: profileData.address?.city || '',
                    state: profileData.address?.state || '',
                    pincode: profileData.address?.pincode || '',
                    country: profileData.address?.country || 'India'
                },
                bio: profileData.bio || '',
                socialLinks: {
                    linkedin: profileData.socialLinks?.linkedin || '',
                    github: profileData.socialLinks?.github || '',
                    twitter: profileData.socialLinks?.twitter || '',
                    portfolio: profileData.socialLinks?.portfolio || ''
                }
            });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await profileApi.updateProfile(formData);
            setProfile(response.data.data);
            updateUserData(response.data.data);
            setEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Removed profile picture management as per requirement.

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-lg-4 mb-4">
                    {/* Account Overview (profile picture removed) */}
                    <div className="card shadow-sm h-100">
                        <div className="card-header border-0 pb-0">
                            <h6 className="card-title mb-0">
                                <FaInfoCircle className="me-2" />Account Overview
                            </h6>
                        </div>
                        <div className="card-body pt-3">
                            <div className="mb-3">
                                <div className="small text-muted">Name</div>
                                <div className="fw-semibold">{profile?.name || '—'}</div>
                            </div>
                            <div className="mb-3">
                                <div className="small text-muted">Email</div>
                                <div className="fw-semibold d-flex align-items-center gap-2"><FaEnvelope /> {profile?.email}</div>
                            </div>
                            <div className="mb-3">
                                <div className="small text-muted">College</div>
                                <div className="fw-semibold d-flex align-items-center gap-2"><FaGraduationCap /> {profile?.collegeName || 'Not set'}</div>
                            </div>
                            <div className="mb-3">
                                <div className="small text-muted">Phone</div>
                                <div className="fw-semibold d-flex align-items-center gap-2"><FaPhone /> {profile?.phone || 'Not set'}</div>
                            </div>
                            <div className="mb-3">
                                <div className="small text-muted">Date of Birth</div>
                                <div className="fw-semibold d-flex align-items-center gap-2"><FaCalendarAlt /> {formatDate(profile?.dateOfBirth)}</div>
                            </div>
                            <div className="mb-3">
                                <div className="small text-muted">Location</div>
                                <div className="fw-semibold d-flex align-items-center gap-2">
                                    <FaMapMarkerAlt />
                                    {profile?.address?.city || profile?.address?.state ? (
                                        <>{[profile.address.city, profile.address.state].filter(Boolean).join(', ')}</>
                                    ) : 'Not set'}
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="small text-muted">Department / Year</div>
                                <div className="fw-semibold">{profile?.department && profile?.yearOfStudy ? `${profile.department} - ${profile.yearOfStudy}` : 'Not set'}</div>
                            </div>
                            {/* Completeness */}
                            {(() => {
                                const fields = [profile?.phone, profile?.collegeName, profile?.department, profile?.yearOfStudy, profile?.address?.city, profile?.bio, profile?.socialLinks?.linkedin, profile?.socialLinks?.github];
                                const filled = fields.filter(Boolean).length;
                                const percent = Math.round((filled / fields.length) * 100);
                                return (
                                    <div className="mt-auto">
                                        <div className="small text-muted mb-1">Profile completeness</div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" />
                                        </div>
                                        <div className="small mt-1 fw-semibold">{percent}% complete</div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    {/* Profile Details Card */}
                    <div className="card shadow-sm">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                <FaUser className="me-2" />
                                Profile Details
                            </h5>
                            <button
                                className={`btn ${editing ? 'btn-outline-secondary' : 'btn-primary'}`}
                                onClick={() => editing ? setEditing(false) : setEditing(true)}
                            >
                                {editing ? (
                                    <>
                                        <ICONS.CANCEL className="me-1" size={ICON_SIZES.SM} />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <ICONS.EDIT className="me-1" size={ICON_SIZES.SM} />
                                        Edit Profile
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="card-body">
                            {editing ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">College Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.collegeName}
                                                onChange={(e) => handleInputChange('collegeName', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Department</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.department}
                                                onChange={(e) => handleInputChange('department', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Year of Study</label>
                                            <select
                                                className="form-select"
                                                value={formData.yearOfStudy}
                                                onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                                <option value="Graduate">Graduate</option>
                                                <option value="Post Graduate">Post Graduate</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <h6 className="fw-bold mb-3">Address</h6>
                                    <div className="row mb-3">
                                        <div className="col-12 mb-3">
                                            <label className="form-label">Street Address</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address.street}
                                                onChange={(e) => handleInputChange('address.street', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address.city}
                                                onChange={(e) => handleInputChange('address.city', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">State</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address.state}
                                                onChange={(e) => handleInputChange('address.state', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Pincode</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address.pincode}
                                                onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Country</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.address.country}
                                                onChange={(e) => handleInputChange('address.country', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="mb-3">
                                        <label className="form-label">Bio</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            maxLength="500"
                                            value={formData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            placeholder="Tell us about yourself..."
                                        />
                                        <small className="text-muted">{formData.bio.length}/500 characters</small>
                                    </div>

                                    {/* Social Links */}
                                    <h6 className="fw-bold mb-3">Social Links</h6>
                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <FaLinkedin className="text-primary me-1" />
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.socialLinks.linkedin}
                                                onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                                                placeholder="https://linkedin.com/in/username"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                <FaGithub className="text-dark me-1" />
                                                GitHub
                                            </label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.socialLinks.github}
                                                onChange={(e) => handleInputChange('socialLinks.github', e.target.value)}
                                                placeholder="https://github.com/username"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaTwitter className="text-info me-1" />
                                                Twitter
                                            </label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.socialLinks.twitter}
                                                onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                                                placeholder="https://twitter.com/username"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                <FaGlobe className="text-success me-1" />
                                                Portfolio/Website
                                            </label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.socialLinks.portfolio}
                                                onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                                                placeholder="https://yourwebsite.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm me-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <ICONS.SAVE className="me-1" size={ICON_SIZES.SM} />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    {/* Display Mode */}
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Full Name</label>
                                                <p className="fw-semibold">{profile?.name || 'Not set'}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Email</label>
                                                <p className="fw-semibold">{profile?.email}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Phone</label>
                                                <p className="fw-semibold">{profile?.phone || 'Not set'}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Date of Birth</label>
                                                <p className="fw-semibold">{formatDate(profile?.dateOfBirth)}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">College</label>
                                                <p className="fw-semibold">{profile?.collegeName || 'Not set'}</p>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-muted">Department & Year</label>
                                                <p className="fw-semibold">
                                                    {profile?.department && profile?.yearOfStudy
                                                        ? `${profile.department} - ${profile.yearOfStudy}`
                                                        : 'Not set'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {profile?.address && (profile.address.city || profile.address.state) && (
                                        <div className="mb-4">
                                            <label className="form-label text-muted">Address</label>
                                            <p className="fw-semibold">
                                                {[
                                                    profile.address.street,
                                                    profile.address.city,
                                                    profile.address.state,
                                                    profile.address.pincode,
                                                    profile.address.country
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {profile?.bio && (
                                        <div className="mb-4">
                                            <label className="form-label text-muted">Bio</label>
                                            <p className="fw-semibold">{profile.bio}</p>
                                        </div>
                                    )}

                                    {profile?.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                                        <div>
                                            <label className="form-label text-muted">Social Links</label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {profile.socialLinks.linkedin && (
                                                    <a
                                                        href={profile.socialLinks.linkedin}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-primary btn-sm"
                                                    >
                                                        <FaLinkedin className="me-1" />
                                                        LinkedIn
                                                    </a>
                                                )}
                                                {profile.socialLinks.github && (
                                                    <a
                                                        href={profile.socialLinks.github}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-dark btn-sm"
                                                    >
                                                        <FaGithub className="me-1" />
                                                        GitHub
                                                    </a>
                                                )}
                                                {profile.socialLinks.twitter && (
                                                    <a
                                                        href={profile.socialLinks.twitter}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-info btn-sm"
                                                    >
                                                        <FaTwitter className="me-1" />
                                                        Twitter
                                                    </a>
                                                )}
                                                {profile.socialLinks.portfolio && (
                                                    <a
                                                        href={profile.socialLinks.portfolio}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-success btn-sm"
                                                    >
                                                        <FaGlobe className="me-1" />
                                                        Portfolio
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

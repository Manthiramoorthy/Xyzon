import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import * as certificateTemplateApi from '../api/certificateTemplateApi';

const CertificateTemplateManager = () => {
    const { toast, confirm } = useToast();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        htmlContent: ''
    });

    const sampleData = {
        recipientName: 'John Doe',
        eventName: 'Web Development Masterclass',
        eventDate: '2024-01-15',
        organizerName: 'Tech Institute',
        certificateId: 'CERT-2024-001',
        issueDate: '2024-01-20'
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await certificateTemplateApi.getTemplates();
            console.log('Templates loaded:', response);
            setTemplates(response.data || response || []); // Handle different response formats
        } catch (error) {
            console.error('Error loading templates:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                toast.error('Authentication failed. Please log in again.');
            } else {
                toast.error('Failed to load templates: ' + error.message);
            }
            setTemplates([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.htmlContent) {
            toast.warning('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            if (editingTemplate) {
                await certificateTemplateApi.updateTemplate(editingTemplate._id, formData);
                toast.success('Template updated successfully!');
            } else {
                await certificateTemplateApi.createTemplate(formData);
                toast.success('Template created successfully!');
            }

            setFormData({ name: '', description: '', htmlContent: '' });
            setShowForm(false);
            setEditingTemplate(null);
            await loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            htmlContent: template.htmlContent
        });
        setShowForm(true);
    };

    const handleDelete = async (templateId) => {
        const confirmed = await confirm('Are you sure you want to delete this template?');
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await certificateTemplateApi.deleteTemplate(templateId);
            toast.success('Template deleted successfully!');
            await loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (htmlContent) => {
        try {
            setLoading(true);
            const response = await certificateTemplateApi.previewTemplate(htmlContent, sampleData);
            setPreviewHtml(response.data.previewHtml);
            setShowPreview(true);
        } catch (error) {
            console.error('Error previewing template:', error);
            toast.error('Failed to preview template: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelForm = () => {
        setFormData({ name: '', description: '', htmlContent: '' });
        setShowForm(false);
        setEditingTemplate(null);
    };

    return (
        <div className="certificate-template-manager">
            <div className="template-header">
                <h2>Certificate Template Manager</h2>
                <button
                    onClick={() => setShowForm(true)}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    Add New Template
                </button>
            </div>

            {showForm && (
                <div className="template-form-modal">
                    <div className="modal-content">
                        <h3>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Template Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Professional Certificate"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="form-group">
                                <label>HTML Content *</label>
                                <div className="html-editor">
                                    <textarea
                                        name="htmlContent"
                                        value={formData.htmlContent}
                                        onChange={handleInputChange}
                                        required
                                        rows={15}
                                        placeholder={`Enter HTML content with placeholders like {{recipientName}}, {{eventName}}, etc.`}
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                    <div className="available-placeholders">
                                        <strong>Available placeholders:</strong>
                                        <span>{`{{recipientName}}, {{eventName}}, {{eventDate}}, {{organizerName}}, {{certificateId}}, {{issueDate}}`}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => handlePreview(formData.htmlContent)}
                                    disabled={!formData.htmlContent || loading}
                                    className="btn btn-secondary"
                                >
                                    Preview
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    disabled={loading}
                                    className="btn btn-cancel"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPreview && (
                <div className="preview-modal">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>Template Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="close-btn">×</button>
                        </div>
                        <div className="preview-content">
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="templates-list">
                <h3>Existing Templates ({templates.length})</h3>

                {loading && <div className="loading">Loading...</div>}

                {templates.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>No certificate templates found. Create your first template above!</p>
                    </div>
                )}

                <div className="templates-grid">
                    {templates.map((template) => (
                        <div key={template._id} className="template-card">
                            <div className="template-header">
                                <h4>{template.name}</h4>
                                <div className="template-actions">
                                    <button
                                        onClick={() => handlePreview(template.htmlContent)}
                                        className="btn btn-sm btn-secondary"
                                        title="Preview"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="btn btn-sm btn-primary"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template._id)}
                                        className="btn btn-sm btn-danger"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {template.description && (
                                <p className="template-description">{template.description}</p>
                            )}

                            <div className="template-meta">
                                <small>
                                    Created: {new Date(template.createdAt).toLocaleDateString()}
                                    {template.updatedAt !== template.createdAt && (
                                        <> • Updated: {new Date(template.updatedAt).toLocaleDateString()}</>
                                    )}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .certificate-template-manager {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .template-form-modal, .preview-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                }

                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-content.large {
                    max-width: 1000px;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .html-editor {
                    position: relative;
                }

                .available-placeholders {
                    margin-top: 10px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    font-size: 12px;
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover:not(:disabled) {
                    background: #545b62;
                }

                .btn-danger {
                    background: #dc3545;
                    color: white;
                }

                .btn-danger:hover:not(:disabled) {
                    background: #c82333;
                }

                .btn-cancel {
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 1px solid #dee2e6;
                }

                .btn-cancel:hover:not(:disabled) {
                    background: #e2e6ea;
                }

                .btn-sm {
                    padding: 4px 8px;
                    font-size: 12px;
                }

                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .template-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .template-card .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }

                .template-card h4 {
                    margin: 0;
                    color: #333;
                }

                .template-actions {
                    display: flex;
                    gap: 5px;
                }

                .template-description {
                    color: #666;
                    margin: 10px 0;
                    font-size: 14px;
                }

                .template-meta {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                    color: #888;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin-top: 20px;
                }

                .preview-content {
                    border: 1px solid #ddd;
                    padding: 20px;
                    background: white;
                    margin-top: 20px;
                }
            `}</style>
        </div>
    );
};

export default CertificateTemplateManager;

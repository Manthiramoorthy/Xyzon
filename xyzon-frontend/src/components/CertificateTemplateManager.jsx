import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import * as certificateTemplateApi from '../api/certificateTemplateApi';
import ICONS from '../constants/icons';

const CertificateTemplateManager = () => {
    const { toast, confirm } = useToast();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('created_desc');

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

    const PLACEHOLDERS = [
        'recipientName', 'eventName', 'eventDate', 'organizerName', 'certificateId', 'issueDate'
    ];

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
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                toast.error('Authentication failed. Please log in again.');
            } else {
                toast.error('Failed to load templates: ' + (error.message || 'Unknown error'));
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
            toast.error('Failed to save template: ' + (error.message || 'Unknown error'));
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

    const handleDuplicate = async (template) => {
        try {
            setLoading(true);
            await certificateTemplateApi.createTemplate({
                name: template.name + ' Copy',
                description: template.description,
                htmlContent: template.htmlContent
            });
            toast.success('Template duplicated');
            await loadTemplates();
        } catch (e) {
            toast.error(e.message || 'Duplicate failed');
        } finally {
            setLoading(false);
        }
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
            toast.error('Failed to delete template: ' + (error.message || 'Unknown error'));
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
            toast.error('Failed to preview template: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const cancelForm = () => {
        setFormData({ name: '', description: '', htmlContent: '' });
        setShowForm(false);
        setEditingTemplate(null);
    };

    // Filter & sort templates
    const filteredTemplates = useMemo(() => {
        let list = [...templates];
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            );
        }
        switch (sortKey) {
            case 'name_asc':
                list.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name_desc':
                list.sort((a, b) => b.name.localeCompare(a.name)); break;
            case 'updated_desc':
                list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); break;
            case 'updated_asc':
                list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)); break;
            case 'created_asc':
                list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case 'created_desc':
            default:
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return list;
    }, [templates, searchTerm, sortKey]);

    const renderMiniPreview = (tpl) => {
        try {
            let html = tpl.htmlContent || '';
            PLACEHOLDERS.forEach(ph => { html = html.replaceAll(`{{${ph}}}`, sampleData[ph] || ph); });
            // Strip scripts & styles for safety/sizing
            html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
            // Keep first 400 chars
            html = html.slice(0, 400);
            return { __html: html };
        } catch { return { __html: '' }; }
    };

    const insertPlaceholder = (ph) => {
        setFormData(prev => ({ ...prev, htmlContent: prev.htmlContent + (prev.htmlContent.endsWith(' ') ? '' : ' ') + `{{${ph}}}` }));
    };

    return (
        <div className="certificate-template-manager">
            <div className="template-header">
                <div>
                    <h2>Certificate Template Manager</h2>
                    <p className="subtitle">Manage reusable certificate layouts with placeholders & live previews.</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && <button className="clear-btn" onClick={() => setSearchTerm('')}>&times;</button>}
                    </div>
                    <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="sort-select">
                        <option value="created_desc">Newest</option>
                        <option value="created_asc">Oldest</option>
                        <option value="updated_desc">Recently Updated</option>
                        <option value="updated_asc">Least Recently Updated</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="name_desc">Name Z-A</option>
                    </select>
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <ICONS.ADD className="me-2" />
                        New Template
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="template-form-modal">
                    <div className="modal-content wide">
                        <div className="modal-bar">
                            <h3 className="mb-0 d-flex align-items-center gap-2">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
                            <div className="d-flex align-items-center gap-2">
                                <label className="toggle-preview small"><input type="checkbox" checked={showLivePreview} onChange={(e) => setShowLivePreview(e.target.checked)} /> Live Preview</label>
                                <button onClick={cancelForm} type="button" className="btn btn-cancel small-rounded"><ICONS.CLOSE /></button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="template-form-grid">
                            <div className="left-pane">
                                <div className="form-group">
                                    <label>Template Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Professional Certificate" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional description" />
                                </div>
                                <div className="editor-wrapper">
                                    <div className="editor-header d-flex justify-content-between align-items-center mb-2">
                                        <label className="mb-0">HTML Content *</label>
                                        <div className="placeholder-chips">
                                            {PLACEHOLDERS.map(ph => (
                                                <button type="button" key={ph} onClick={() => insertPlaceholder(ph)} className="chip">{`{{${ph}}}`}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        name="htmlContent"
                                        value={formData.htmlContent}
                                        onChange={handleInputChange}
                                        required
                                        rows={18}
                                        className="code-area"
                                        placeholder={`Enter HTML. Use placeholders like {{recipientName}}, {{eventName}}...`}
                                    />
                                    <div className="available-placeholders small muted mt-2">Hint: Placeholders are replaced when issuing certificates. Click a chip to insert.</div>
                                </div>
                                <div className="form-actions sticky-actions">
                                    <button type="button" onClick={() => handlePreview(formData.htmlContent)} disabled={!formData.htmlContent || loading} className="btn btn-secondary">
                                        <ICONS.VIEW className="me-2" />Full Preview
                                    </button>
                                    <button type="submit" disabled={loading} className="btn btn-primary">
                                        <ICONS.SAVE className="me-2" />{loading ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </div>
                            {showLivePreview && (
                                <div className="right-pane live-preview">
                                    <div className="live-preview-inner" dangerouslySetInnerHTML={renderMiniPreview(formData)} />
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {showPreview && (
                <div className="preview-modal">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>Template Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="close-btn">
                                <ICONS.CLOSE />
                            </button>
                        </div>
                        <div className="preview-content">
                            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="templates-list">
                <h3 className="mt-4">Existing Templates ({filteredTemplates.length})</h3>

                {loading && <div className="loading">Loading...</div>}

                {filteredTemplates.length === 0 && !loading && (
                    <div className="empty-state">
                        <p>No matching templates. Adjust search or create a new one.</p>
                    </div>
                )}

                <div className="templates-grid">
                    {filteredTemplates.map((template) => (
                        <div key={template._id} className="template-card fancy">
                            <div className="card-top">
                                <div className="name-block">
                                    <h4 className="mb-1">{template.name}</h4>
                                    {template.description && <div className="desc small text-muted">{template.description}</div>}
                                </div>
                                <div className="template-actions btn-cluster">
                                    <button onClick={() => handlePreview(template.htmlContent)} className="icon-btn info" title="Preview"><ICONS.VIEW /></button>
                                    <button onClick={() => handleEdit(template)} className="icon-btn primary" title="Edit"><ICONS.EDIT /></button>
                                    <button onClick={() => handleDuplicate(template)} className="icon-btn warn" title="Duplicate"><ICONS.COPY /></button>
                                    <button onClick={() => handleDelete(template._id)} className="icon-btn danger" title="Delete"><ICONS.DELETE /></button>
                                </div>
                            </div>
                            <div className="mini-preview" dangerouslySetInnerHTML={renderMiniPreview(template)} />
                            <div className="template-meta small mt-3 d-flex flex-wrap gap-3">
                                <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                                {template.updatedAt !== template.createdAt && <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>}
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
                    flex-wrap: wrap;
                }

                .template-header .subtitle { margin: 4px 0 0; color:#6c757d; font-size:0.9rem; }
                .header-actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
                .search-box { position:relative; }
                .search-box input { padding:6px 30px 6px 10px; border:1px solid #ccc; border-radius:6px; }
                .search-box .clear-btn { position:absolute; right:4px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:18px; line-height:1; padding:0 4px; color:#888; }
                .sort-select { padding:6px 10px; border:1px solid #ccc; border-radius:6px; background:#fff; }

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

                .modal-content.wide { max-width: 1200px; }
                .modal-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
                .toggle-preview { cursor:pointer; user-select:none; }
                .toggle-preview input { margin-right:4px; }
                .template-form-grid { display:flex; gap:24px; }
                .left-pane { flex:1 1 60%; min-width:0; }
                .right-pane { flex:1 1 40%; min-width:320px; background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; padding:16px; position:sticky; top:20px; max-height:70vh; overflow:auto; }
                .live-preview-inner { font-size:12px; line-height:1.3; }

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

                .html-editor { position: relative; }
                .editor-wrapper { position:relative; }
                .code-area { width:100%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0e1116; color:#e9edf2; border:1px solid #222; border-radius:8px; padding:12px 14px; font-size:13px; line-height:1.4; resize:vertical; box-shadow: inset 0 0 0 1px #1d232b; }
                .code-area:focus { outline:2px solid #2563eb; }
                .placeholder-chips { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
                .chip { background:#eef2f7; border:1px solid #ced4da; padding:3px 8px; font-size:11px; border-radius:14px; cursor:pointer; transition:.15s; }
                .chip:hover { background:#e1e7ef; }

                .available-placeholders {
                    margin-top: 10px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    font-size: 12px;
                }

                .form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px; }
                .sticky-actions { position:sticky; bottom:0; background: linear-gradient(180deg, rgba(255,255,255,0.2), #fff 60%); padding-top:16px; }

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

                .templates-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap:24px; margin-top:20px; }

                .template-card { border:1px solid #e1e5e9; border-radius:14px; padding:18px 18px 20px; background:linear-gradient(145deg,#fff,#f6f8fa); box-shadow:0 4px 10px -2px rgba(0,0,0,0.06); position:relative; display:flex; flex-direction:column; }
                .template-card.fancy::before { content:''; position:absolute; inset:0; border-radius:14px; padding:1px; background:linear-gradient(135deg,#6ea8fe,#91e5a9,#ffd479); -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite: exclude; pointer-events:none; opacity:.4; }
                .template-card:hover { box-shadow:0 6px 16px -3px rgba(0,0,0,0.12); transform:translateY(-2px); transition:.25s; }
                .card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px; }
                .name-block h4 { font-size:1.05rem; font-weight:600; }
                .desc { font-size:.75rem; line-height:1.2; }
                .btn-cluster { display:flex; gap:6px; }
                .icon-btn { border:none; background:#f1f3f5; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; font-size:15px; transition:.18s; position:relative; }
                .icon-btn:hover { background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.12); transform:translateY(-2px); }
                .icon-btn.info { color:#0d6efd; }
                .icon-btn.primary { color:#1d4ed8; }
                .icon-btn.warn { color:#d97706; }
                .icon-btn.danger { color:#dc2626; }
                .mini-preview { background:#fff; border:1px dashed #cfd4da; border-radius:8px; padding:10px; font-size:11px; max-height:150px; overflow:auto; font-family:ui-monospace,monospace; }

                .template-card .template-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }

                .template-card h4 {
                    margin: 0;
                    color: #333;
                }

                .template-actions { display:flex; gap:5px; }

                .template-description {
                    color: #666;
                    margin: 10px 0;
                    font-size: 14px;
                }

                .template-meta { margin-top:12px; padding-top:10px; border-top:1px solid #e4e7eb; color:#667085; }

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

                .preview-content { border:1px solid #ddd; padding:20px; background:white; margin-top:20px; }

                @media (max-width: 960px) {
                    .template-form-grid { flex-direction:column; }
                    .right-pane { position:relative; top:0; max-height:none; }
                }
            `}</style>
        </div>
    );
};

export default CertificateTemplateManager;

import React, { useState } from 'react';
import { sendPersonalizedBulkMail } from '../api/personalizedMailApi';
import Papa from 'papaparse';
import { AttachmentInput } from '../components/AttachmentInput';

function renderTemplate(template, data) {
    let html = template;
    Object.keys(data).forEach(key => {
        html = html.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key] || '');
    });
    return html;
}

export default function SendPersonalizedMail() {
    const [template, setTemplate] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [recipientsRaw, setRecipientsRaw] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [importMode, setImportMode] = useState('json');
    const [csvError, setCsvError] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(true);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const addAttachment = att => setAttachments(a => [...a, att]);
    const removeAttachment = i => setAttachments(a => a.filter((_, idx) => idx !== i));

    // Handle JSON paste
    const handleJsonChange = e => {
        setRecipientsRaw(e.target.value);
        try {
            const arr = JSON.parse(e.target.value);
            if (Array.isArray(arr)) {
                setRecipients(arr);
                setCsvError('');
            } else {
                setCsvError('JSON must be an array');
            }
        } catch (err) {
            setCsvError('Invalid JSON');
            setRecipients([]);
        }
    };

    // Handle CSV upload
    const handleCsvUpload = e => {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
                if (results.errors.length > 0) {
                    setCsvError('CSV parsing error: ' + results.errors[0].message);
                    setRecipients([]);
                    return;
                }
                setRecipients(results.data);
                setRecipientsRaw(JSON.stringify(results.data, null, 2));
                setCsvError('');
            },
            error: err => {
                setCsvError('CSV parsing failed: ' + err.message);
                setRecipients([]);
            },
        });
    };

    const sendMail = async () => {
        setSending(true); setResult(null);
        try {
            const payload = {
                template,
                recipients,
                attachments: attachments.length ? attachments : undefined
            };
            const res = await sendPersonalizedBulkMail(payload);
            setResult({ success: true, data: res.data });
            setShowModal(true);
        } catch (err) {
            setResult({ success: false, error: err.response?.data?.error || err.message });
            setShowModal(true);
        } finally { setSending(false); }
    };

    const previewData = recipients[previewIndex] || {};

    // Helper for alert type
    const getAlertType = () => {
        if (!result) return '';
        if (result.success) return 'alert-success';
        return 'alert-danger';
    };

    return (
        <div className="container justify-content-center" style={{ position: 'relative', marginTop: 76, marginBottom: 76 }}>
            {sending && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(30,34,40,0.7)', zIndex: 9999, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card shadow-lg p-4" style={{
                        minWidth: 320, background: '#fff', borderRadius: 12, display: 'flex',
                        alignItems: 'center'
                    }}>
                        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Sending...</span>
                        </div>
                        <div className="fs-5 fw-semibold text-center">Sending mail, please wait...</div>
                    </div>
                </div>
            )}
            {/* Recipients and template input */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="mb-2">
                        <label className="form-label">HTML Template</label>
                        <textarea className="form-control" rows={6} value={template} onChange={e => setTemplate(e.target.value)} placeholder="Paste your HTML template with {placeholders}" />
                    </div>
                    <div className="mb-2">
                        <label className="form-label">Recipients</label>
                        <input className="form-control" type="file" accept=".csv" onChange={handleCsvUpload} />

                        {csvError && <div className="text-danger mt-1">{csvError}</div>}
                    </div>
                    <div className="mb-2">
                        <label className="form-label">Attachments</label>
                        <AttachmentInput onAdd={addAttachment} inputId="personalized-attach-file" />
                        <div className="mt-2">
                            {attachments.map((a, i) => (
                                <div key={i} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-1">
                                    <div>
                                        <div className="fw-bold">{a.filename}</div>
                                        <div className="small text-muted">{a.contentType}</div>
                                    </div>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeAttachment(i)}>Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-success" onClick={sendMail} disabled={sending || !template || recipients.length === 0}>Send</button>
                        <button className="btn btn-outline-secondary" onClick={() => { setTemplate(''); setRecipients([]); setRecipientsRaw(''); setAttachments([]); }}>Reset</button>
                    </div>
                </div>
            </div>
            {/* Preview section */}
            <div className="card shadow-sm mb-4"style={{ position: 'relative', textAlign: 'center' }}>
                <div className="card-body">
                    <h5>Preview</h5>
                    <div className="mb-2">
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => setPreviewIndex(i => Math.max(0, i - 1))} disabled={previewIndex === 0}>Previous</button>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => setPreviewIndex(i => Math.min(recipients.length - 1, i + 1))} disabled={previewIndex === recipients.length - 1}>Next</button>
                        <span className="ms-2">{recipients.length > 0 ? `Previewing ${previewIndex + 1} of ${recipients.length}` : 'No recipient loaded'}</span>
                    </div>
                    <div className="d-flex text-start align-items-center justify-content-center" style={{ maxHeight: 470, minHeight: 444, background: '#f8f9fa' }}>
                        <div style={{ background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.05)', maxWidth: '100%', width: '900px', maxHeight: 460, minHeight: 440, padding: '20px' }}>
                            <div dangerouslySetInnerHTML={{ __html: renderTemplate(template, previewData) }} />
                        </div>
                    </div>
                    <div className="mt-2 small text-muted">Current recipient: {previewData.email || '-'}</div>
                </div>
            </div>
            {/* Modal for API result */}
            {showModal && result && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.4)' }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className={`modal-header ${result.success ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                <h5 className="modal-title">
                                    {result.success ? 'Mail Sent Successfully' : 'Mail Sending Failed'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {result.success ? (
                                    <>
                                        <div className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> <b>Success!</b></div>
                                        <div>Sent <b>{result.data?.sent ?? 0}</b> emails.</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-2"><i className="bi bi-x-circle-fill text-danger me-2"></i> <b>Error:</b></div>
                                        <div>{result.error || 'Unknown error'}</div>
                                    </>
                                )}
                                <hr />
                                <div className="small text-muted">Raw response:</div>
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

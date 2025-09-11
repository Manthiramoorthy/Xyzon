import React, { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import { getTemplates } from "../api/certificateTemplateApi";



const DEFAULT_AUTHORITY = {
    name: "Head",
    role: "InspireX Innovation Unit",
    companyName: "Xyzon Innovations Private Limited",
    logoDataUrl: "/assets/images/inspirex-xyzon.png",
    partnerLogoDataUrl: "/assets/images/default-partner.png",
    signatureDataUrl: "/assets/images/default-signature.png",
    certTitle: "Certificate of Appreciation",
    certSubtitle: "This is proudly presented to",
    certMidline: "has successfully participated in the webinar on",
};

function CertificateGenerator() {
    const [participantData, setParticipantData] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    // Full template objects from certificate template API
    const [templates, setTemplates] = useState([]);
    const [csvError, setCsvError] = useState("");
    const [authorityConfig, setAuthorityConfig] = useState(DEFAULT_AUTHORITY);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [placeholderCache, setPlaceholderCache] = useState({}); // { idx: Set([...]) }
    const [csvPlaceholderWarning, setCsvPlaceholderWarning] = useState("");
    const previewRef = useRef();
    const previewWrapperRef = useRef();
    const [previewScale, setPreviewScale] = useState(0.7);
    const CERT_WIDTH = 900;
    const CERT_HEIGHT = 600;

    // Load templates from API on mount
    useEffect(() => {
        (async () => {
            try {
                setLoadingTemplates(true);
                const res = await getTemplates(); // { success, data }
                setTemplates(res?.data || []);
            } catch (e) {
                console.error("Failed to load certificate templates", e);
                setTemplates([]);
            } finally {
                setLoadingTemplates(false);
            }
        })();
    }, []);

    const extractPlaceholders = (html) => {
        if (!html) return [];
        const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
        const found = new Set();
        let m;
        while ((m = regex.exec(html)) !== null) {
            found.add(m[1]);
        }
        return Array.from(found).sort();
    };

    useEffect(() => {
        const cache = {};
        templates.forEach((tpl, idx) => {
            cache[idx] = new Set(extractPlaceholders(tpl?.htmlContent));
        });
        setPlaceholderCache(cache);
    }, [templates]);

    // CSV Upload Handler
    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setCsvError("CSV parsing error: " + results.errors[0].message);
                    setParticipantData([]);
                    setCsvPlaceholderWarning("");
                    return;
                }
                const headers = results.meta.fields;
                const rows = results.data;
                const augmented = rows.map(r => {
                    const copy = { ...r };
                    Object.keys(r).forEach(k => {
                        const snake = toSnakeCase(k);
                        if (!(snake in copy)) copy[snake] = r[k];
                    });
                    return copy;
                });
                setParticipantData(augmented);
                setCsvError("");
                setCurrentIndex(0);
                if (participantPlaceholdersOriginal.length > 0) {
                    const missing = participantPlaceholdersOriginal.filter(p => !headers.includes(p));
                    if (missing.length > 0) setCsvPlaceholderWarning(`CSV missing template placeholders: ${missing.join(', ')}`);
                    else setCsvPlaceholderWarning("");
                } else {
                    setCsvPlaceholderWarning("");
                }
            },
            error: (err) => {
                setCsvError("CSV parsing failed: " + err.message);
                setParticipantData([]);
                setCsvPlaceholderWarning("");
            },
        });
    };

    // Image upload handler
    const handleImageUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAuthorityConfig((prev) => ({ ...prev, [key]: ev.target.result }));
        };
        reader.readAsDataURL(file);
    };

    // Template rendering
    function renderTemplate(templateHtml, data, authority) {
        if (!templateHtml) return "<div class='text-danger'>Template not loaded</div>";
        return templateHtml.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
            const v = getValueForPlaceholder(key, data, authority);
            return (v === undefined || v === null) ? '' : String(v);
        });
    }


    // Common function to generate a jsPDF from template/data/authority
    const generateCertificatePDF = async (templateHtml, data, authority) => {
        const tempDiv = document.createElement("div");
        tempDiv.style.width = "900px";
        tempDiv.style.height = "600px";
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.innerHTML = renderTemplate(templateHtml, data, authority);
        document.body.appendChild(tempDiv);
        const canvas = await html2canvas(tempDiv, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [900, 600] });
        pdf.addImage(imgData, "PNG", 0, 0, 900, 600);
        document.body.removeChild(tempDiv);
        return pdf;
    };

    // PDF Export (single)
    const exportPDF = async () => {
        if (!participantData[currentIndex]) return;
        const pdf = await generateCertificatePDF(
            templates[selectedTemplate]?.htmlContent,
            participantData[currentIndex],
            authorityConfig
        );
        pdf.save(`${participantData[currentIndex]?.name || "certificate"}.pdf`);
    };

    // PDF Export (bulk)
    const exportAllPDFs = async () => {
        const zip = new JSZip();
        for (let i = 0; i < participantData.length; i++) {
            const pdf = await generateCertificatePDF(
                templates[selectedTemplate]?.htmlContent,
                participantData[i],
                authorityConfig
            );
            const pdfBlob = pdf.output("blob");
            zip.file(`${participantData[i].name || "certificate"}.pdf`, pdfBlob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "certificates.zip");
    };

    const data = participantData[currentIndex] || {};

    const currentPlaceholders = useMemo(() => Array.from(placeholderCache[selectedTemplate] || []), [placeholderCache, selectedTemplate]);

    // Dynamic placeholder logic
    const toSnakeCase = (str) => str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();

    const authorityKeys = new Set([
        'authority_name', 'authority_role', 'company_name', 'cert_title', 'cert_subtitle', 'cert_midline', 'company_logo', 'partner_logo', 'authority_signature',
        'authorityName', 'authorityRole', 'companyName', 'certTitle', 'certSubtitle', 'certMidline', 'companyLogo', 'partnerLogo', 'authoritySignature'
    ]);

    const isParticipantPlaceholder = (ph) => {
        if (authorityKeys.has(ph)) return false;
        const s = ph.toLowerCase();
        return /participant|event|certificate|verification|issue|name|date|type/.test(s) && !/authority/.test(s);
    };

    const participantPlaceholdersOriginal = useMemo(
        () => currentPlaceholders.filter(isParticipantPlaceholder),
        [currentPlaceholders]
    );

    const getValueForPlaceholder = (placeholder, data, authority) => {
        if (data && data[placeholder] != null && data[placeholder] !== '') return data[placeholder];
        const snake = toSnakeCase(placeholder);
        switch (snake) {
            case 'participant_name':
            case 'name': return data.participant_name || data.name || 'John Doe';
            case 'event_name': return data.event_name || 'Sample Event Title';
            case 'event_date':
            case 'date_of_event': return data.event_date || data.date_of_event || new Date().toLocaleDateString();
            case 'event_type': return data.event_type || 'Workshop';
            case 'certificate_id': return data.certificate_id || 'CERT-SAMPLE-123';
            case 'verification_code': return data.verification_code || 'VERIFY123';
            case 'issue_date': return data.issue_date || new Date().toLocaleDateString();
            case 'cert_title': return authority.certTitle || 'Certificate of Appreciation';
            case 'cert_subtitle': return authority.certSubtitle || 'This is proudly presented to';
            case 'cert_midline': return authority.certMidline || 'for outstanding achievement in';
            case 'company_name': return authority.companyName || 'Xyzon Innovations Private Limited';
            case 'authority_name': return authority.name || 'Authority Name';
            case 'authority_role': return authority.role || 'Authority Role';
            case 'company_logo': return authority.logoDataUrl || '/assets/images/inspirex-xyzon.png';
            case 'partner_logo': return authority.partnerLogoDataUrl || '/assets/images/default-partner.png';
            case 'authority_signature': return authority.signatureDataUrl || '/assets/images/default-signature.png';
            default:
                if (authority[placeholder] != null) return authority[placeholder];
                return '';
        }
    };

    const sampleValueForPlaceholder = (placeholder) => {
        const snake = toSnakeCase(placeholder);
        switch (snake) {
            case 'participant_name':
            case 'name': return 'John Doe';
            case 'event_name': return 'InspireX Workshop on Innovation';
            case 'event_date':
            case 'date_of_event': return new Date().toLocaleDateString();
            case 'event_type': return 'Workshop';
            case 'certificate_id': return 'CERT-001';
            case 'verification_code': return 'VERIFY001';
            case 'issue_date': return new Date().toLocaleDateString();
            default: return '';
        }
    };

    // Responsive scaling for preview
    useEffect(() => {
        const calcScale = () => {
            if (!previewWrapperRef.current) return;
            const wrapperWidth = previewWrapperRef.current.clientWidth;
            const widthScale = (wrapperWidth - 16) / CERT_WIDTH;
            // Reserve some vertical space for controls; ensure minimum height scenario
            const availableHeight = window.innerHeight - 280; // rough offset for header + controls
            const heightScale = availableHeight > 0 ? availableHeight / CERT_HEIGHT : 1;
            let scale = Math.min(1, widthScale, heightScale);
            if (!isFinite(scale) || scale <= 0) scale = 0.1;
            setPreviewScale(scale);
        };
        calcScale();
        window.addEventListener('resize', calcScale);
        return () => window.removeEventListener('resize', calcScale);
    }, []);

    const categorizedPlaceholders = useMemo(() => {
        const out = { 'Participant Data': [], 'Authority / Company': [], 'Images / Assets': [], Other: [] };
        currentPlaceholders.forEach(ph => {
            const s = ph.toLowerCase();
            if (isParticipantPlaceholder(ph)) out['Participant Data'].push(ph);
            else if (/company|cert_|authority/.test(s)) out['Authority / Company'].push(ph);
            else if (/logo|signature/.test(s)) out['Images / Assets'].push(ph);
            else out.Other.push(ph);
        });
        return out;
    }, [currentPlaceholders]);

    const downloadSampleCsv = () => {
        let cols = participantPlaceholdersOriginal;
        if (cols.length === 0) cols = ['participant_name', 'event_name', 'event_date'];
        const header = cols.join(',');
        const sampleValues = cols.map(sampleValueForPlaceholder);
        const csv = header + '\n' + sampleValues.join(',') + '\n';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'sample_certificate_data.csv');
    };

    return (
        // Reduced horizontal padding on small screens; retain larger padding on md/lg
        <div className="px-2 px-md-4 px-lg-5" style={{ marginTop: 100 }}>
            <div className="row g-4 ">
                {/* Controls */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body bg-light">
                            <h5 className="mb-3">Upload CSV File</h5>
                            <input
                                className="form-control mb-2"
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                            />
                            <div className="form-text mb-1 small">
                                Template placeholders detected: {participantPlaceholdersOriginal.length === 0 ? <span className="text-muted">participant_name, event_name, event_date</span> : <b>{participantPlaceholdersOriginal.join(', ')}</b>}
                            </div>
                            <div className="form-text mb-2 small text-muted">CSV should contain these exact placeholder column names (case-sensitive). Extra columns are ignored. Unmatched placeholders render blank.</div>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={downloadSampleCsv}>Download Sample CSV</button>
                            {csvError && <div className="text-danger mb-2">{csvError}</div>}
                            {!csvError && csvPlaceholderWarning && <div className="text-warning small mt-2">{csvPlaceholderWarning}</div>}
                        </div>
                    </div>
                    {/* Template Selection at the top with fixed height and scroll */}
                    <div className="card shadow-sm border-0 mb-4" style={{ height: 400 }}>
                        <div className="card-body bg-light d-flex flex-column" style={{ height: '100%' }}>
                            <h5 className="mb-3">Select Template</h5>
                            {loadingTemplates ? (
                                <div>Loading templates...</div>
                            ) : (
                                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="d-flex flex-wrap gap-2 justify-content-center align-content-start">
                                    {templates.map((tpl, idx) => (
                                        <div
                                            key={idx}
                                            className={`border rounded p-1 ${selectedTemplate === idx ? "border-primary" : ""}`}
                                            style={{ width: 120, cursor: "pointer", background: "#fff" }}
                                            onClick={() => setSelectedTemplate(idx)}
                                        >
                                            <div style={{ width: 108, height: 72, overflow: "hidden", borderRadius: 4, border: "1px solid #eee", background: "#f8f9fa", position: 'relative' }}>
                                                <div style={{
                                                    width: 900,
                                                    height: 300,
                                                    transform: 'scale(0.12)',
                                                    transformOrigin: 'top left',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    pointerEvents: 'none',
                                                }}
                                                    dangerouslySetInnerHTML={{ __html: renderTemplate(templates[idx]?.htmlContent, participantData[0] || {}, authorityConfig) }}
                                                />
                                            </div>
                                            <div className="text-center small mt-1" title={tpl.name || `Template ${idx + 1}`}>{tpl.name || `T${idx + 1}`}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Preview & Export */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body bg-light">
                            <h5 className="mb-3">Preview & Export</h5>
                            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                                <div className="d-flex">
                                    <button className="btn btn-outline-primary me-2" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>Previous</button>
                                    <button className="btn btn-outline-primary" onClick={() => setCurrentIndex(i => Math.min(participantData.length - 1, i + 1))} disabled={currentIndex === participantData.length - 1}>Next</button>
                                </div>
                                <div className="d-flex">
                                    <button className="btn btn-success me-2" onClick={exportPDF} disabled={participantData.length === 0}>Export PDF</button>
                                    <button className="btn btn-primary" onClick={exportAllPDFs} disabled={participantData.length === 0}>Export ZIP</button>
                                </div>
                            </div>
                            <div ref={previewWrapperRef} className="border rounded bg-white d-flex justify-content-center align-items-start position-relative w-100" style={{ background: '#f8f9fa', overflow: 'auto', padding: '0.5rem' }}>
                                <div style={{ width: CERT_WIDTH * previewScale, height: CERT_HEIGHT * previewScale, position: 'relative' }}>
                                    <div
                                        ref={previewRef}
                                        style={{
                                            width: CERT_WIDTH,
                                            height: CERT_HEIGHT,
                                            background: '#fff',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.05)',
                                            transform: `scale(${previewScale})`,
                                            transformOrigin: 'top left',
                                            pointerEvents: 'none'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: renderTemplate(templates[selectedTemplate]?.htmlContent, data, authorityConfig) }}
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2 small text-muted flex-wrap gap-2">
                                <span><b>Preview:</b> {data.name || data.participant_name || '-'}</span>
                                {participantData.length > 0 && <span>{currentIndex + 1} / {participantData.length}</span>}
                                <span>Scale: {(previewScale * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body bg-light">
                    <h5 className="mb-3">Authority & Certificate Details</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Authority Name</label>
                            <input className="form-control" value={authorityConfig.name} onChange={e => setAuthorityConfig(a => ({ ...a, name: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Authority Role</label>
                            <input className="form-control" value={authorityConfig.role} onChange={e => setAuthorityConfig(a => ({ ...a, role: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Company Name</label>
                            <input className="form-control" value={authorityConfig.companyName} onChange={e => setAuthorityConfig(a => ({ ...a, companyName: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Certificate Title</label>
                            <input className="form-control" value={authorityConfig.certTitle} onChange={e => setAuthorityConfig(a => ({ ...a, certTitle: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Certificate Subtitle</label>
                            <input className="form-control" value={authorityConfig.certSubtitle} onChange={e => setAuthorityConfig(a => ({ ...a, certSubtitle: e.target.value }))} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Certificate Midline</label>
                            <input className="form-control" value={authorityConfig.certMidline} onChange={e => setAuthorityConfig(a => ({ ...a, certMidline: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Logo</label>
                            <input className="form-control" type="file" accept="image/*" onChange={e => handleImageUpload(e, "logoDataUrl")} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Partner Logo</label>
                            <input className="form-control" type="file" accept="image/*" onChange={e => handleImageUpload(e, "partnerLogoDataUrl")} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Signature</label>
                            <input className="form-control" type="file" accept="image/*" onChange={e => handleImageUpload(e, "signatureDataUrl")} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CSV Preview at the very bottom */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body bg-light">
                    <h5 className="mb-3">CSV Preview</h5>
                    {participantData.length === 0 ? (
                        <div className="text-muted">No data loaded.</div>
                    ) : (
                        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                            <table className="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        {Object.keys(participantData[0]).map((col) => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {participantData.map((row, i) => (
                                        <tr key={i} className={i === currentIndex ? 'table-primary' : ''}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j}>{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CertificateGenerator;

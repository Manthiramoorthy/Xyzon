import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { fetchTemplates } from "../api/templateApi";



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
    const [templates, setTemplates] = useState([]);
    const [csvError, setCsvError] = useState("");
    const [authorityConfig, setAuthorityConfig] = useState(DEFAULT_AUTHORITY);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const previewRef = useRef();

    // Load templates from API on mount
    useEffect(() => {
        setLoadingTemplates(true);
        fetchTemplates()
            .then((tpls) => {
                // tpls is an array of { filename, content }
                setTemplates(tpls.map(t => t.content));
                setLoadingTemplates(false);
            })
            .catch((err) => {
                setTemplates([]);
                setLoadingTemplates(false);
                // Optionally, set an error state here
                // setCsvError("Failed to load templates from server");
            });
    }, []);

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
                    return;
                }
                const required = ["name", "date_of_event", "event_name", "event_type"];
                const missing = required.filter((col) => !results.meta.fields.includes(col));
                if (missing.length > 0) {
                    setCsvError("Missing required columns: " + missing.join(", "));
                    setParticipantData([]);
                    return;
                }
                setParticipantData(results.data);
                setCsvError("");
                setCurrentIndex(0);
            },
            error: (err) => {
                setCsvError("CSV parsing failed: " + err.message);
                setParticipantData([]);
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
        let html = templateHtml;
        html = html.replace(/\{\{cert_title\}\}/g, authority.certTitle || "Certificate of Appreciation");
        html = html.replace(/\{\{cert_subtitle\}\}/g, authority.certSubtitle || "This is proudly presented to");
        html = html.replace(/\{\{cert_midline\}\}/g, authority.certMidline || "for outstanding achievement in");
        html = html.replace(/\{\{company_name\}\}/g, authority.companyName || "Xyzon Innovations Private Limited");
        html = html.replace(/\{\{participant_name\}\}/g, data.name || "John Doe");
        html = html.replace(/\{\{event_name\}\}/g, data.event_name || "Sample Training Program");
        html = html.replace(/\{\{event_date\}\}/g, data.date_of_event || "March 15, 2024");
        html = html.replace(/\{\{event_type\}\}/g, data.event_type || "Workshop");
        html = html.replace(/\{\{authority_name\}\}/g, authority.name || "Dr. Sarah Wilson");
        html = html.replace(/\{\{authority_role\}\}/g, authority.role || "Program Director");
        html = html.replace(/\{\{company_logo\}\}/g, authority.logoDataUrl || "/assets/images/inspirex-xyzon.png");
        html = html.replace(/\{\{partner_logo\}\}/g, authority.partnerLogoDataUrl || "/assets/images/default-partner.png");
        html = html.replace(/\{\{authority_signature\}\}/g, authority.signatureDataUrl || "/assets/images/default-signature.png");
        return html;
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
            templates[selectedTemplate],
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
                templates[selectedTemplate],
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

    return (
        <div className="px-5" style={{ marginTop: 100 }}>
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
                            <div className="form-text mb-2">
                                Columns required: <b>name, date_of_event, event_name, event_type</b>
                            </div>
                            {csvError && <div className="text-danger mb-2">{csvError}</div>}
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
                                                    dangerouslySetInnerHTML={{ __html: renderTemplate(templates[idx], participantData[0] || {}, authorityConfig) }}
                                                />
                                            </div>
                                            <div className="text-center small mt-1">T{idx + 1}</div>
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
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <button className="btn btn-outline-primary me-2" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>Previous</button>
                                    <button className="btn btn-outline-primary" onClick={() => setCurrentIndex(i => Math.min(participantData.length - 1, i + 1))} disabled={currentIndex === participantData.length - 1}>Next</button>
                                </div>
                                <div>
                                    <button className="btn btn-success me-2" onClick={exportPDF} disabled={participantData.length === 0}>Export as PDF</button>
                                    <button className="btn btn-primary" onClick={exportAllPDFs} disabled={participantData.length === 0}>Export All as ZIP</button>
                                </div>
                            </div>
                            <div className="border rounded bg-white d-flex justify-content-center align-items-top" style={{ background: '#f8f9fa' }}>
                                <div ref={previewRef} style={{ width: 900, height: 430, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.05)', scale: '0.7', transformOrigin: 'top', pointerEvents: 'none' }}
                                    dangerouslySetInnerHTML={{ __html: renderTemplate(templates[selectedTemplate], data, authorityConfig) }} />
                            </div>
                            <div className="text-center mt-3">
                                <b>Previewing certificate for:</b> {data.name || "-"}
                                {participantData.length > 0 && (
                                    <span className="ms-2 text-muted">({currentIndex + 1} of {participantData.length})</span>
                                )}
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

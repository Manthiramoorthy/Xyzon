import React, { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import { eventApi, certificateApi } from '../api/eventApi';
import {
    FiRefreshCw, FiFilter, FiDownload, FiCalendar, FiUsers, FiRepeat, FiAward,
    FiBarChart2, FiDollarSign, FiSearch, FiArrowUp, FiArrowDown, FiSliders
} from 'react-icons/fi';

export default function AdminEventSummary() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', eventType: '', category: '', status: '' });
    const [limit, setLimit] = useState(100);
    const [titleQuery, setTitleQuery] = useState('');
    const [sort, setSort] = useState({ key: 'startDate', dir: 'desc' });
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [exportingAll, setExportingAll] = useState(false);

    const load = async () => {
        try {
            setLoading(true); setError('');
            const res = await eventApi.getAdminSummary({ ...filters, limit: limit || 100 });
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); /* initial */ }, []);
    // Optional auto refresh every 60s when enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(() => { load(); }, 60000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh, filters, limit]);

    const global = data?.global || {};
    const perEvent = data?.perEvent || [];
    const topEvents = data?.topEvents || [];

    // Derived aggregations
    const aggregates = useMemo(() => {
        const statusCounts = {};
        const typeCounts = {};
        let totalCapacity = 0;
        let totalOccupancy = 0; // registrations / maxParticipants
        perEvent.forEach(ev => {
            statusCounts[ev.status] = (statusCounts[ev.status] || 0) + 1;
            typeCounts[ev.eventType] = (typeCounts[ev.eventType] || 0) + 1;
            if (ev.maxParticipants) {
                totalCapacity += ev.maxParticipants;
                totalOccupancy += Math.min(ev.registrations, ev.maxParticipants);
            }
        });
        const overallOccupancyRate = totalCapacity ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : null;
        return { statusCounts, typeCounts, overallOccupancyRate };
    }, [perEvent]);

    const formatNumber = (n, opts = {}) => {
        if (n === undefined || n === null || n === '') return '-';
        if (typeof n === 'number') {
            if (opts.money) return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return n.toLocaleString('en-IN');
        }
        return n;
    };

    const toggleSort = (key) => {
        setSort(prev => {
            if (prev.key === key) {
                return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            }
            return { key, dir: 'asc' };
        });
    };

    const sortedFilteredEvents = useMemo(() => {
        let rows = perEvent;
        if (titleQuery.trim()) {
            const q = titleQuery.toLowerCase();
            rows = rows.filter(r => r.title?.toLowerCase().includes(q));
        }
        // Client-side sort
        rows = [...rows].sort((a, b) => {
            const { key, dir } = sort;
            const av = a[key];
            const bv = b[key];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === 'number' && typeof bv === 'number') {
                return dir === 'asc' ? av - bv : bv - av;
            }
            const as = String(av).toLowerCase();
            const bs = String(bv).toLowerCase();
            if (as < bs) return dir === 'asc' ? -1 : 1;
            if (as > bs) return dir === 'asc' ? 1 : -1;
            return 0;
        });
        return rows;
    }, [perEvent, titleQuery, sort]);

    const SortIcon = ({ column }) => sort.key === column ? (sort.dir === 'asc' ? <FiArrowUp className="ms-1" /> : <FiArrowDown className="ms-1" />) : null;

    // --- Lightweight Chart Components (inline to avoid extra files/deps) ---
    const DonutChart = ({ data, colors, size = 140, strokeWidth = 18, centerLabel }) => {
        const entries = Object.entries(data || {}).filter(([, v]) => v > 0);
        const total = entries.reduce((s, [, v]) => s + v, 0);
        if (!total) return <div className="text-muted small">No data</div>;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;
        return (
            <svg width={size} height={size} role="img" aria-label="Distribution chart">
                <g transform={`translate(${size / 2},${size / 2})`}>
                    {entries.map(([k, v], idx) => {
                        const fraction = v / total;
                        const dash = circumference * fraction;
                        const circle = (
                            <circle
                                key={k}
                                r={radius}
                                fill="transparent"
                                stroke={colors[idx % colors.length]}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${dash} ${circumference - dash}`}
                                strokeDashoffset={-offset}
                                style={{ transition: 'stroke-dasharray .4s' }}
                            />
                        );
                        offset += dash;
                        return circle;
                    })}
                    <text textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fill="#0d4a6b">
                        {centerLabel || total}
                    </text>
                </g>
            </svg>
        );
    };

    const MiniBarChart = ({ items, maxBars = 5, metric = 'registrations', valueLabel = 'Reg' }) => {
        if (!items?.length) return <div className="text-muted small">No data</div>;
        const slice = items.slice(0, maxBars);
        const maxVal = Math.max(...slice.map(i => i[metric] || 0), 1);
        return (
            <div className="d-flex flex-column gap-2">
                {slice.map(ev => {
                    const val = ev[metric] || 0;
                    const pct = (val / maxVal) * 100;
                    return (
                        <div key={ev.eventId} className="small">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-truncate" style={{ maxWidth: '70%' }}>{ev.title}</span>
                                <span className="fw-semibold" style={{ fontSize: 11 }}>{val}</span>
                            </div>
                            <div className="progress" style={{ height: 6 }}>
                                <div className="progress-bar bg-primary" style={{ width: pct + '%' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const Gauge = ({ value, size = 140, color = '#0d6efd', label = 'Rate' }) => {
        if (value == null) return <div className="text-muted small">No data</div>;
        const radius = size / 2 - 12;
        const circumference = 2 * Math.PI * radius;
        const clamped = Math.min(100, Math.max(0, value));
        const dash = (clamped / 100) * circumference;
        return (
            <svg width={size} height={size} role="img" aria-label={label + ' gauge'}>
                <g transform={`translate(${size / 2},${size / 2})`}>
                    <circle r={radius} fill="transparent" stroke="#e9ecef" strokeWidth={12} />
                    <circle
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={12}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeLinecap="round"
                        transform="rotate(-90)"
                    />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill="#0d4a6b">{clamped}%</text>
                    <text textAnchor="middle" y={24} fontSize={11} fill="#6c757d">{label}</text>
                </g>
            </svg>
        );
    };

    const exportCsv = () => {
        if (!sortedFilteredEvents.length) return;
        const headers = ['Event ID', 'Title', 'Status', 'Start Date', 'End Date', 'Type', 'Category', 'Registrations', 'Attended', 'Attendance %', 'Certificates', 'Revenue', 'Paid Orders', 'Max Participants'];
        const rows = sortedFilteredEvents.map(e => [e.eventId, e.title, e.status, e.startDate ? new Date(e.startDate).toLocaleDateString() : '', e.endDate ? new Date(e.endDate).toLocaleDateString() : '', e.eventType, e.category, e.registrations, e.attended, e.attendanceRate, e.certificatesIssued, e.revenue, e.paidCount, e.maxParticipants || '']);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'event_summary.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // Full management export (ZIP with multiple CSVs)
    const exportFullReport = async () => {
        if (!perEvent.length) return;
        setExportingAll(true);
        try {
            const zip = new JSZip();
            const sanitize = (s = '') => s.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);

            // 1. Global metrics
            const globalRows = Object.entries(global).map(([k, v]) => `${k},${v}`);
            zip.file('global_metrics.csv', ['Metric,Value', ...globalRows].join('\n'));

            // 2. Per event metrics (reuse existing logic but without filters sorting optional)
            const perEventHeaders = ['Event ID', 'Title', 'Status', 'Start Date', 'End Date', 'Type', 'Category', 'Registrations', 'Attended', 'Attendance %', 'Certificates', 'Revenue', 'Paid Orders', 'Max Participants'];
            const perEventRows = perEvent.map(e => [e.eventId, '"' + (e.title?.replace(/"/g, '""') || '') + '"', e.status, e.startDate || '', e.endDate || '', e.eventType, e.category || '', e.registrations, e.attended, e.attendanceRate, e.certificatesIssued, e.revenue, e.paidCount, e.maxParticipants || ''].join(','));
            zip.file('per_event.csv', [perEventHeaders.join(','), ...perEventRows].join('\n'));

            // 3. Top events
            if (topEvents.length) {
                const topHeaders = ['Event ID', 'Title', 'Registrations', 'Attended', 'Attendance %', 'Revenue'];
                const topRows = topEvents.map(t => [t.eventId, '"' + (t.title?.replace(/"/g, '""') || '') + '"', t.registrations, t.attended, t.attendanceRate, t.revenue].join(','));
                zip.file('top_events.csv', [topHeaders.join(','), ...topRows].join('\n'));
            }

            // 4. Per-event participants & certificate status; collect repeat participants aggregator
            const repeatMap = {}; // email -> {count, events:Set, name}
            for (const ev of perEvent) {
                try {
                    const [regRes, certRes] = await Promise.all([
                        eventApi.getEventRegistrations(ev.eventId, { limit: 10000 }).catch(() => ({ data: { data: [] } })),
                        certificateApi.getEventCertificates(ev.eventId).catch(() => ({ data: { data: [] } }))
                    ]);
                    const registrationsData = regRes.data?.data?.docs || regRes.data?.data || [];
                    const certificatesData = certRes.data?.data || [];
                    const certByReg = new Map(certificatesData.map(c => {
                        const regRef = (c.registration && typeof c.registration === 'object') ? c.registration._id : c.registration;
                        return [String(regRef), c];
                    }));
                    const participantHeaders = ['Registration ID', 'Name', 'Email', 'Payment Status', 'Attendance Status', 'Created At', 'Certificate Status', 'Certificate ID'];
                    const participantRows = registrationsData.map(r => {
                        const cert = certByReg.get(String(r._id));
                        // update repeat tracker
                        if (r.email) {
                            if (!repeatMap[r.email]) repeatMap[r.email] = { count: 0, events: new Set(), name: r.name };
                            repeatMap[r.email].count += 1;
                            repeatMap[r.email].events.add(ev.eventId);
                        }
                        return [
                            r._id,
                            '"' + (r.name?.replace(/"/g, '""') || '') + '"',
                            r.email || '',
                            r.paymentStatus || '',
                            r.attendanceStatus || r.status || '',
                            r.createdAt || '',
                            cert ? cert.status : '',
                            cert ? cert._id : ''
                        ].join(',');
                    });
                    const fileName = `participants/event_${sanitize(ev.title || ev.eventId)}_${ev.eventId}.csv`;
                    zip.file(fileName, [participantHeaders.join(','), ...participantRows].join('\n'));
                } catch (innerErr) {
                    // Log error file
                    zip.file(`participants/event_${ev.eventId}_ERROR.txt`, innerErr.message || 'Failed to fetch participants');
                }
            }

            // 5. Repeat participants
            const repeatEntries = Object.entries(repeatMap).filter(([, v]) => v.count > 1);
            if (repeatEntries.length) {
                const repeatHeaders = ['Email', 'Name', 'Occurrences', 'Event IDs'];
                const repeatRows = repeatEntries.map(([email, v]) => [email, '"' + (v.name?.replace(/"/g, '""') || '') + '"', v.count, '"' + Array.from(v.events).join('|') + '"'].join(','));
                zip.file('repeat_participants.csv', [repeatHeaders.join(','), ...repeatRows].join('\n'));
            }

            // Generate zip
            const blob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'event_management_full_report.zip';
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            alert('Failed to export full report: ' + (err.message || err));
        } finally {
            setExportingAll(false);
        }
    };

    const summaryCards = [
        { label: 'Total Events', value: global.totalEvents, icon: <FiCalendar /> },
        { label: 'Registrations', value: global.totalRegistrations, icon: <FiUsers /> },
        { label: 'Attended', value: global.totalAttended, icon: <FiUsers /> },
        { label: 'Certificates Issued', value: global.certificatesIssued, icon: <FiAward /> },
        { label: 'Revenue', value: `₹${(global.totalRevenue || 0).toFixed(2)}`, icon: <FiDollarSign /> },
        { label: 'Refunded', value: `₹${(global.refundedAmount || 0).toFixed(2)}`, icon: <FiDollarSign /> },
        { label: 'Repeat Participants', value: `${global.repeatParticipants} (${global.repeatParticipantPercent}%)`, icon: <FiRepeat /> },
        { label: 'Avg Attendance %', value: `${global.averageAttendanceRate}%`, icon: <FiBarChart2 /> },
    ];

    return (
        <div className="container-fluid px-2 px-md-3 px-lg-4" style={{ marginTop: 20 }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <h4 className="m-0">Event Management Summary</h4>
                <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}><FiRefreshCw className="me-1" /> Refresh</button>
                    <button className="btn btn-outline-primary btn-sm" onClick={exportCsv} disabled={!perEvent.length}><FiDownload className="me-1" /> Per-Event CSV</button>
                    <button className="btn btn-primary btn-sm" onClick={exportFullReport} disabled={!perEvent.length || exportingAll} title="Download complete management ZIP (participants, certificates, repeats)">
                        {exportingAll ? 'Preparing…' : 'Full Report ZIP'}
                    </button>
                    <div className="form-check form-switch d-flex align-items-center small ms-2">
                        <input className="form-check-input me-1" type="checkbox" id="autoRefreshChk" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                        <label className="form-check-label" htmlFor="autoRefreshChk">Auto 60s</label>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center mb-2 small text-muted">
                <FiSliders /> <span>Client metrics</span>
                {lastUpdated && <span className="ms-2">Last updated: {lastUpdated.toLocaleTimeString()}</span>}
                {aggregates.overallOccupancyRate && <span className="ms-2">Overall Occupancy: {aggregates.overallOccupancyRate}%</span>}
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-6 col-md-2">
                            <label className="form-label">Start Date</label>
                            <input type="date" className="form-control form-control-sm" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">End Date</label>
                            <input type="date" className="form-control form-control-sm" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Type</label>
                            <select className="form-select form-select-sm" value={filters.eventType} onChange={e => setFilters(f => ({ ...f, eventType: e.target.value }))}>
                                <option value="">All</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Status</label>
                            <select className="form-select form-select-sm" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Category</label>
                            <input className="form-control form-control-sm" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} placeholder="Category" />
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Limit</label>
                            <input type="number" min={1} className="form-control form-control-sm" value={limit} onChange={e => setLimit(e.target.value)} />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label">Search Title</label>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text"><FiSearch /></span>
                                <input className="form-control" value={titleQuery} placeholder="Search event title" onChange={e => setTitleQuery(e.target.value)} />
                                {titleQuery && <button className="btn btn-outline-secondary" onClick={() => setTitleQuery('')}>×</button>}
                            </div>
                        </div>
                        <div className="col-12 col-md-6 text-end align-self-end">
                            <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}><FiFilter className="me-1" /> Apply</button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <div className="row g-3 mb-4">
                {summaryCards.map(c => (
                    <div key={c.label} className="col-6 col-sm-4 col-lg-3">
                        <div className="border rounded p-3 bg-white h-100 d-flex flex-column justify-content-between shadow-sm position-relative">
                            <div className="text-muted small fw-semibold d-flex align-items-center gap-2">{c.icon} {c.label}</div>
                            <div className="fs-5 fw-bold mt-2" style={{ color: '#0d4a6b' }}>{c.value ?? '-'}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-lg-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-header py-2"><h6 className="m-0 small">Status Distribution</h6></div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <DonutChart
                                data={aggregates.statusCounts}
                                colors={['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1']}
                                centerLabel={Object.values(aggregates.statusCounts).reduce((a, b) => a + b, 0)}
                            />
                            <div className="d-flex flex-wrap gap-2 mt-2 justify-content-center">
                                {Object.entries(aggregates.statusCounts).map(([k, v], idx) => (
                                    <span key={k} className="badge border bg-light text-dark small" style={{ borderColor: '#dee2e6' }}>
                                        <span style={{ display: 'inline-block', width: 10, height: 10, background: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'][idx % 5], marginRight: 4, borderRadius: 2 }} />
                                        {k}: {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-header py-2"><h6 className="m-0 small">Type Distribution</h6></div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <DonutChart
                                data={aggregates.typeCounts}
                                colors={['#20c997', '#0dcaf0', '#6610f2', '#fd7e14']}
                                centerLabel={Object.values(aggregates.typeCounts).reduce((a, b) => a + b, 0)}
                            />
                            <div className="d-flex flex-wrap gap-2 mt-2 justify-content-center">
                                {Object.entries(aggregates.typeCounts).map(([k, v], idx) => (
                                    <span key={k} className="badge border bg-light text-dark small">
                                        <span style={{ display: 'inline-block', width: 10, height: 10, background: ['#20c997', '#0dcaf0', '#6610f2', '#fd7e14'][idx % 4], marginRight: 4, borderRadius: 2 }} />
                                        {k}: {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card h-100 shadow-sm">
                        <div className="card-header py-2"><h6 className="m-0 small">Overall Occupancy</h6></div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <Gauge value={aggregates.overallOccupancyRate ? parseFloat(aggregates.overallOccupancyRate) : null} label="Occupancy" />
                            <div className="small text-muted mt-2 text-center" style={{ maxWidth: 180 }}>Based on registrations vs capacity across events with a max participants limit.</div>
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header py-2 d-flex justify-content-between align-items-center">
                            <h6 className="m-0 small">Top Events (Registrations)</h6>
                            <span className="badge bg-light text-dark border small">Top {Math.min(5, topEvents.length || 0)}</span>
                        </div>
                        <div className="card-body">
                            <MiniBarChart items={topEvents} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-header">
                    <h6 className="m-0">Per Event Metrics</h6>
                </div>
                <div className="card-body p-0">
                    <div style={{ maxHeight: 460, overflow: 'auto' }}>
                        <table className="table table-sm table-striped mb-0 align-middle">
                            <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th role="button" onClick={() => toggleSort('title')}>Title <SortIcon column="title" /></th>
                                    <th role="button" onClick={() => toggleSort('status')}>Status <SortIcon column="status" /></th>
                                    <th role="button" onClick={() => toggleSort('eventType')}>Type <SortIcon column="eventType" /></th>
                                    <th>Category</th>
                                    <th role="button" onClick={() => toggleSort('registrations')}>Reg <SortIcon column="registrations" /></th>
                                    <th role="button" onClick={() => toggleSort('attended')}>Att <SortIcon column="attended" /></th>
                                    <th role="button" onClick={() => toggleSort('attendanceRate')}>Att % <SortIcon column="attendanceRate" /></th>
                                    <th role="button" onClick={() => toggleSort('certificatesIssued')}>Certs <SortIcon column="certificatesIssued" /></th>
                                    <th role="button" onClick={() => toggleSort('revenue')}>Revenue <SortIcon column="revenue" /></th>
                                    <th role="button" onClick={() => toggleSort('paidCount')}>Paid <SortIcon column="paidCount" /></th>
                                    <th role="button" onClick={() => toggleSort('maxParticipants')}>Max <SortIcon column="maxParticipants" /></th>
                                    <th role="button" onClick={() => toggleSort('occupancy')}>Occup % <SortIcon column="occupancy" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedFilteredEvents.length === 0 && !loading && <tr><td colSpan={12} className="text-center py-4 text-muted">No events</td></tr>}
                                {sortedFilteredEvents.map(e => {
                                    const occupancy = e.maxParticipants ? Math.min(100, ((e.registrations / e.maxParticipants) * 100)).toFixed(1) : null;
                                    return (
                                        <tr key={e.eventId}>
                                            <td style={{ minWidth: 200 }}>
                                                <div className="fw-semibold small">{e.title}</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{e.startDate ? new Date(e.startDate).toLocaleDateString() : ''} → {e.endDate ? new Date(e.endDate).toLocaleDateString() : ''}</div>
                                            </td>
                                            <td>{e.status}</td>
                                            <td>{e.eventType}</td>
                                            <td>{e.category || '-'}</td>
                                            <td>{formatNumber(e.registrations)}</td>
                                            <td>{formatNumber(e.attended)}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-1">
                                                    <span>{e.attendanceRate}%</span>
                                                    <div className="progress flex-grow-1" style={{ height: 6 }}>
                                                        <div className={`progress-bar ${e.attendanceRate >= 70 ? 'bg-success' : e.attendanceRate >= 40 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${e.attendanceRate}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatNumber(e.certificatesIssued)}</td>
                                            <td>{formatNumber(e.revenue, { money: true })}</td>
                                            <td>{formatNumber(e.paidCount)}</td>
                                            <td>{e.maxParticipants || '-'}</td>
                                            <td>{occupancy ? (
                                                <div className="d-flex align-items-center gap-1">
                                                    <span>{occupancy}%</span>
                                                    <div className="progress flex-grow-1" style={{ height: 6 }}>
                                                        <div className="progress-bar bg-info" style={{ width: `${occupancy}%` }} />
                                                    </div>
                                                </div>
                                            ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {loading && <tr><td colSpan={12} className="text-center py-3 small text-muted">Loading...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-5">
                <div className="card-header"><h6 className="m-0">Top Events (by Registrations)</h6></div>
                <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                        {topEvents.map(t => (
                            <li key={t.eventId} className="list-group-item">
                                <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center">
                                    <div style={{ minWidth: 220 }}>
                                        <div className="fw-semibold small">{t.title}</div>
                                        <div className="small text-muted">Reg: {t.registrations} • Att: {t.attended} • Rev: ₹{t.revenue}</div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                                        <div className="progress flex-grow-1" style={{ height: 8 }}>
                                            <div className={`progress-bar ${t.attendanceRate >= 70 ? 'bg-success' : t.attendanceRate >= 40 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${t.attendanceRate}%` }} />
                                        </div>
                                        <span className="badge text-bg-primary rounded-pill">{t.attendanceRate}%</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {(!topEvents.length && !loading) && <li className="list-group-item text-muted">No events</li>}
                        {loading && <li className="list-group-item text-muted small">Loading...</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}

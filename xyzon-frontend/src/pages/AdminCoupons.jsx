import React, { useEffect, useState, useMemo } from 'react';
import { couponApi, eventApi } from '../api/eventApi';
import { FaPlus, FaSync, FaCheck, FaTimes, FaEdit, FaTrash, FaSearch, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';

export default function AdminCoupons() {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form, setForm] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        maxDiscount: '',
        minAmount: '',
        startDate: '',
        endDate: '',
        usageLimit: '',
        perUserLimit: '',
        active: true
    });

    const resetForm = () => {
        setForm({
            code: '', description: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minAmount: '', startDate: '', endDate: '', usageLimit: '', perUserLimit: '', active: true
        });
        setEditingCoupon(null);
    };

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const res = await couponApi.list({ page, limit: 20 });
            const data = res.data.data;
            setCoupons(data.docs || data.items || []);
            setTotalPages(data.totalPages || 1);
        } catch (e) {
            toast.error('Failed to load coupons');
        } finally { setLoading(false); }
    };

    useEffect(() => { loadCoupons(); }, [page]);

    const filteredCoupons = useMemo(() => {
        if (!search.trim()) return coupons;
        const q = search.trim().toLowerCase();
        return coupons.filter(c => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    }, [coupons, search]);

    const handleChange = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
    };

    const submitForm = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            // convert empties to undefined
            ['maxDiscount', 'minAmount', 'usageLimit', 'perUserLimit', 'discountValue'].forEach(k => { if (payload[k] === '' || payload[k] === null) delete payload[k]; else payload[k] = Number(payload[k]); });
            if (payload.startDate === '') delete payload.startDate; if (payload.endDate === '') delete payload.endDate;
            if (editingCoupon) {
                await couponApi.update(editingCoupon._id, payload);
                toast.success('Coupon updated');
            } else {
                await couponApi.create(payload);
                toast.success('Coupon created');
            }
            resetForm();
            setCreating(false);
            await loadCoupons();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const deleteCoupon = async (id) => {
        if (!window.confirm('Delete this coupon?')) return;
        try { await couponApi.remove(id); toast.success('Deleted'); await loadCoupons(); } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    };

    const toggleActive = async (coupon) => {
        try { await couponApi.update(coupon._id, { active: !coupon.active }); toast.success('Status updated'); await loadCoupons(); } catch (e) { toast.error('Update failed'); }
    };

    const startEdit = (c) => {
        setEditingCoupon(c);
        setForm({
            code: c.code,
            description: c.description || '',
            discountType: c.discountType,
            discountValue: c.discountValue ?? '',
            maxDiscount: c.maxDiscount ?? '',
            minAmount: c.minAmount ?? '',
            startDate: c.startDate ? c.startDate.substring(0, 10) : '',
            endDate: c.endDate ? c.endDate.substring(0, 10) : '',
            usageLimit: c.usageLimit ?? '',
            perUserLimit: c.perUserLimit ?? '',
            active: c.active
        });
        setCreating(true);
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
                <h2 className="m-0">Coupon Management</h2>
                <div className="d-flex gap-2">
                    <div className="input-group">
                        <span className="input-group-text bg-white"><FaSearch /></span>
                        <input className="form-control" placeholder="Search code / desc" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-outline-primary" onClick={loadCoupons} disabled={loading}><FaSync className={loading ? 'fa-spin' : ''} /></button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setCreating(true); }}><FaPlus className="me-1" />New Coupon</button>
                </div>
            </div>
            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Usage</th>
                                <th>Validity</th>
                                <th>Active</th>
                                <th style={{ width: 150 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-5">Loading...</td></tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-4 text-muted">No coupons found</td></tr>
                            ) : filteredCoupons.map(c => {
                                const usage = c.usageLimit ? `${c.totalRedemptions || 0}/${c.usageLimit}` : (c.totalRedemptions || 0);
                                const validity = c.startDate || c.endDate ? `${c.startDate ? c.startDate.substring(0, 10) : '..'} → ${c.endDate ? c.endDate.substring(0, 10) : '..'}` : '—';
                                return (
                                    <tr key={c._id} className={c.active ? '' : 'table-secondary'}>
                                        <td className="fw-semibold">{c.code}</td>
                                        <td className="text-capitalize small">{c.discountType}</td>
                                        <td className="small">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}{c.discountType === 'percentage' && c.maxDiscount ? <span className="text-muted"> (max ₹{c.maxDiscount})</span> : ''}</td>
                                        <td className="small">{usage}</td>
                                        <td className="small">{validity}</td>
                                        <td>{c.active ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>}</td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(c)} title="Edit"><FaEdit /></button>
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(c)} title="Toggle Active">{c.active ? <FaToggleOn /> : <FaToggleOff />}</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCoupon(c._id)} title="Delete"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Pagination if needed */}
            {search.trim() === '' && totalPages > 1 && (
                <nav className="mt-3">
                    <ul className="pagination pagination-sm">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</button></li>
                        {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => (
                            <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
                        ))}
                        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</button></li>
                    </ul>
                </nav>
            )}

            {creating && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <form onSubmit={submitForm}>
                                <div className="modal-header">
                                    <h5 className="modal-title mb-0">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h5>
                                    <button type="button" className="btn-close" onClick={() => { setCreating(false); resetForm(); }}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Code *</label>
                                            <input className="form-control" value={form.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} required disabled={!!editingCoupon} />
                                        </div>
                                        <div className="col-md-8">
                                            <label className="form-label">Description</label>
                                            <input className="form-control" value={form.description} onChange={e => handleChange('description', e.target.value)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Discount Type *</label>
                                            <select className="form-select" value={form.discountType} onChange={e => handleChange('discountType', e.target.value)}>
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Value *</label>
                                            <input type="number" min="0" className="form-control" value={form.discountValue} onChange={e => handleChange('discountValue', e.target.value)} required />
                                        </div>
                                        {form.discountType === 'percentage' && (
                                            <div className="col-md-4">
                                                <label className="form-label">Max Discount (₹)</label>
                                                <input type="number" min="0" className="form-control" value={form.maxDiscount} onChange={e => handleChange('maxDiscount', e.target.value)} />
                                            </div>
                                        )}
                                        <div className="col-md-4">
                                            <label className="form-label">Min Amount (₹)</label>
                                            <input type="number" min="0" className="form-control" value={form.minAmount} onChange={e => handleChange('minAmount', e.target.value)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Usage Limit</label>
                                            <input type="number" min="1" className="form-control" value={form.usageLimit} onChange={e => handleChange('usageLimit', e.target.value)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Per User Limit</label>
                                            <input type="number" min="1" className="form-control" value={form.perUserLimit} onChange={e => handleChange('perUserLimit', e.target.value)} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Start Date</label>
                                            <input type="date" className="form-control" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">End Date</label>
                                            <input type="date" className="form-control" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                                        </div>
                                        <div className="col-md-4 d-flex align-items-center mt-2">
                                            <div className="form-check form-switch mt-3">
                                                <input className="form-check-input" type="checkbox" role="switch" id="activeSwitch" checked={form.active} onChange={e => handleChange('active', e.target.checked)} />
                                                <label className="form-check-label" htmlFor="activeSwitch">Active</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setCreating(false); resetForm(); }}>Close</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><FaSync className="fa-spin me-2" />Saving...</> : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

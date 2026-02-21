import React, { useState, useEffect, useCallback } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";
import { driverAPI } from "../lib/api";

const LICENSE_CATEGORIES = ["van", "truck", "tanker", "flatbed", "refrigerated"];
const EMPTY_DRIVER = { name: "", license_expiry: "", license_category: "van" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="driver-modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
                    <h3 id="driver-modal-title" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "var(--color-text-muted)", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function ScoreBar({ value, max = 100, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "var(--color-primary)", borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", width: "32px", textAlign: "right" }}>{value}</span>
        </div>
    );
}

function Drivers({ showToast, role }) {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [groupBy, setGroupBy] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_DRIVER);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const canCreate = role === "manager" || role === "safety_officer";

    const loadDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await driverAPI.getAll();
            setDrivers(data.drivers || []);
        } catch (err) {
            showToast("Failed to load drivers: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadDrivers(); }, [loadDrivers]);

    const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

    const validateDriver = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = "Driver name is required.";
        if (!form.license_expiry) errs.license_expiry = "License expiry date is required.";
        if (form.license_expiry && new Date(form.license_expiry) < new Date()) errs.license_expiry = "License expiry must be a future date.";
        return errs;
    };

    const handleSaveDriver = async (e) => {
        e.preventDefault();
        const errs = validateDriver();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Please fix the highlighted fields.", "error"); return; }
        setSaving(true);
        try {
            await driverAPI.create({
                name: form.name.trim(),
                license_expiry: form.license_expiry,
                license_category: form.license_category || "van",
            });
            setShowModal(false); setForm(EMPTY_DRIVER); setErrors({});
            showToast("Driver added. License category is verified when assigning to vehicles.", "success");
            loadDrivers();
        } catch (err) {
            showToast(err.message || "Failed to add driver.", "error");
        } finally {
            setSaving(false);
        }
    };

    const today = new Date();
    const isExpired = (expiry) => new Date(expiry) < today;
    const isExpiringSoon = (expiry) => {
        const exp = new Date(expiry);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    };

    let displayed = drivers.filter((d) =>
        !search || [d.name, d.license_category, d.status].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "name") displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "safetyScore") displayed = [...displayed].sort((a, b) => b.safety_score - a.safety_score);
    if (sortBy === "expiry") displayed = [...displayed].sort((a, b) => (a.license_expiry || "").localeCompare(b.license_expiry || ""));

    const expiredCount = drivers.filter((d) => isExpired(d.license_expiry)).length;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading drivers…</span>
            </div>
        );
    }

    return (
        <div>
            {/* Expired license alert */}
            {expiredCount > 0 && (
                <div role="alert" style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", borderRadius: "8px", padding: "11px 16px", marginBottom: "16px", fontSize: "0.875rem", color: "var(--color-text-primary)", display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>⚠</span>
                    <span>
                        <strong>Compliance Alert:</strong> {expiredCount} driver(s) have expired licenses. Assignment to new trips has been blocked until resolved.
                    </span>
                </div>
            )}

            <PageHeader
                title="Driver Performance & Safety"
                actionLabel={canCreate ? "New Driver" : undefined}
                onAction={canCreate ? () => { setShowModal(true); setForm(EMPTY_DRIVER); setErrors({}); } : undefined}
                search={search} onSearch={setSearch} searchPlaceholder="Search by name, category, status…"
                sortOptions={[
                    { label: "Name (A–Z)", value: "name" },
                    { label: "Safety Score", value: "safetyScore" },
                    { label: "License Expiry", value: "expiry" },
                ]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Status", value: "status" }]}
                groupValue={groupBy} onGroup={setGroupBy}
            />

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No drivers match your search.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>License Category</th>
                                <th>Expiry Date</th>
                                <th style={{ minWidth: "120px" }}>Safety Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((d) => {
                                const expired = isExpired(d.license_expiry);
                                const expiring = isExpiringSoon(d.license_expiry);
                                const isSuspended = d.status === "suspended";
                                return (
                                    <tr key={d.id} style={expired || isSuspended ? { background: "var(--color-danger-bg)" } : {}}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{
                                                    width: "32px", height: "32px", borderRadius: "50%",
                                                    background: expired || isSuspended ? "var(--color-danger-bg)" : "var(--color-primary-light)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: "13px",
                                                    color: expired || isSuspended ? "var(--color-text-primary)" : "var(--color-primary)",
                                                    flexShrink: 0,
                                                }}>
                                                    {d.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{d.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ textTransform: "capitalize", color: "var(--color-text-secondary)" }}>{d.license_category}</td>
                                        <td>
                                            <span style={{ color: expired || expiring ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: expired || expiring ? 600 : 400 }}>
                                                {d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : "—"}
                                                {expired && <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-text-primary)", borderRadius: "4px", padding: "1px 5px" }}>Expired</span>}
                                                {!expired && expiring && <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-text-secondary)", borderRadius: "4px", padding: "1px 5px" }}>Expiring Soon</span>}
                                            </span>
                                        </td>
                                        <td><ScoreBar value={d.safety_score} color={d.safety_score >= 80 ? "var(--color-primary)" : "var(--color-text-muted)"} /></td>
                                        <td><StatusPill status={d.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <Modal title="Add Driver" onClose={() => { setShowModal(false); setForm(EMPTY_DRIVER); setErrors({}); }}>
                    <form onSubmit={handleSaveDriver} noValidate>
                        <FormField label="Driver Name" required htmlFor="d-name" error={errors.name}>
                            <input id="d-name" type="text" value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Alex" className={errors.name ? "error-field" : ""} />
                        </FormField>
                        <FormField label="License Category" required htmlFor="d-category" error={errors.license_category}>
                            <select id="d-category" value={form.license_category} onChange={(e) => setF("license_category", e.target.value)}>
                                {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </FormField>
                        <FormField label="License Expiry" required htmlFor="d-expiry" error={errors.license_expiry}>
                            <input id="d-expiry" type="date" value={form.license_expiry} onChange={(e) => setF("license_expiry", e.target.value)} className={errors.license_expiry ? "error-field" : ""} />
                        </FormField>
                        <div style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", fontSize: "0.75rem", color: "var(--color-text-primary)" }}>
                            License is validated when assigning this driver to a vehicle (category must match vehicle class).
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_DRIVER); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={saving}
                                style={{ padding: "9px 20px", background: saving ? "#999" : "var(--color-primary)", color: "var(--color-surface)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                                {saving ? "Saving…" : "Add Driver"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Drivers;
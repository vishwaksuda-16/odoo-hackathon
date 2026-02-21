import React, { useState, useEffect, useCallback } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";
import { maintenanceAPI, vehicleAPI } from "../lib/api";

const SERVICE_TYPES = ["Oil Change", "Tire Replacement", "Brake Service", "Engine Repair", "AC Service", "Electrical", "Suspension", "General Inspection", "Other"];

const EMPTY = { vehicle_id: "", description: "", cost: "", odometer_at_service: "" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="maint-modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
                    <h3 id="maint-modal-title" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "var(--color-text-muted)", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Maintenance({ showToast, role }) {
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const canCreate = role === "manager" || role === "safety_officer";

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [logRes, vehRes] = await Promise.all([
                maintenanceAPI.getAll("limit=100"),
                vehicleAPI.getAll(),
            ]);
            setLogs(logRes.logs || []);
            setVehicles(vehRes.vehicles || []);
        } catch (err) {
            showToast("Failed to load maintenance data: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const setF = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: "" }));
        // Auto-fill odometer when vehicle selected
        if (k === "vehicle_id") {
            const vehicle = vehicles.find((ve) => String(ve.id) === String(v));
            if (vehicle) {
                setForm((f) => ({ ...f, [k]: v, odometer_at_service: String(vehicle.odometer) }));
            }
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.vehicle_id) errs.vehicle_id = "Please select a vehicle.";
        if (!form.description.trim()) errs.description = "Service description is required.";
        if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0)
            errs.cost = "Cost must be a valid non-negative number.";
        if (!form.odometer_at_service || isNaN(Number(form.odometer_at_service)) || Number(form.odometer_at_service) < 0)
            errs.odometer_at_service = "Odometer reading is required.";
        return errs;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Service log creation failed. Please check required fields.", "error"); return; }

        setSaving(true);
        try {
            await maintenanceAPI.add({
                vehicle_id: Number(form.vehicle_id),
                cost: Number(form.cost),
                description: form.description,
                odometer_at_service: Number(form.odometer_at_service),
            });
            setShowModal(false); setForm(EMPTY); setErrors({});
            showToast("Service log added. Vehicle moved to 'In Shop' status.", "success");
            loadData();
        } catch (err) {
            showToast(err.message || "Failed to add service log.", "error");
        } finally {
            setSaving(false);
        }
    };

    let displayed = logs.filter((l) =>
        !search || [l.name_model, l.license_plate, l.description].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "date") displayed = [...displayed].sort((a, b) => (b.service_date || "").localeCompare(a.service_date || ""));
    if (sortBy === "cost") displayed = [...displayed].sort((a, b) => Number(b.cost) - Number(a.cost));

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading maintenance logs…</span>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Maintenance & Service"
                actionLabel={canCreate ? "Add Service" : undefined}
                onAction={canCreate ? () => setShowModal(true) : undefined}
                search={search} onSearch={setSearch} searchPlaceholder="Search by vehicle, service…"
                sortOptions={[{ label: "Date (Newest)", value: "date" }, { label: "Cost (Highest)", value: "cost" }]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Vehicle", value: "vehicle" }]}
            />

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No service logs found.</div>
                ) : (
                    <table>
                        <thead><tr><th>Log ID</th><th>Vehicle</th><th>Service / Issue</th><th>Cost (₹)</th><th>Odometer</th><th>Date</th></tr></thead>
                        <tbody>
                            {displayed.map((l) => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>#{l.id}</td>
                                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>{l.name_model} – {l.license_plate}</td>
                                    <td style={{ fontWeight: 500 }}>{l.description}</td>
                                    <td>₹{Number(l.cost).toLocaleString()}</td>
                                    <td>{l.odometer_at_service?.toLocaleString()}</td>
                                    <td style={{ color: "var(--color-text-secondary)" }}>{l.service_date ? new Date(l.service_date).toLocaleDateString() : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <Modal title="Add Service Log" onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}>
                    <form onSubmit={handleSave} noValidate>
                        <FormField label="Vehicle" required htmlFor="m-vehicle" error={errors.vehicle_id}>
                            <select id="m-vehicle" value={form.vehicle_id} onChange={(e) => setF("vehicle_id", e.target.value)} className={errors.vehicle_id ? "error-field" : ""}>
                                <option value="">Select vehicle…</option>
                                {vehicles.filter((v) => v.status !== "retired").map((v) => (
                                    <option key={v.id} value={v.id}>{v.name_model} – {v.license_plate}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Service / Issue Description" required htmlFor="m-desc" error={errors.description}>
                            <select id="m-desc" value={form.description} onChange={(e) => setF("description", e.target.value)} className={errors.description ? "error-field" : ""}>
                                <option value="">Select service type…</option>
                                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Cost (₹)" required htmlFor="m-cost" error={errors.cost}>
                                <input id="m-cost" type="number" min="0" value={form.cost} onChange={(e) => setF("cost", e.target.value)} placeholder="e.g. 2500" className={errors.cost ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Odometer at Service" required htmlFor="m-odo" error={errors.odometer_at_service}>
                                <input id="m-odo" type="number" min="0" value={form.odometer_at_service} onChange={(e) => setF("odometer_at_service", e.target.value)} placeholder="Auto-filled" className={errors.odometer_at_service ? "error-field" : ""} />
                            </FormField>
                        </div>
                        <div style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", fontSize: "0.75rem", color: "#0369a1" }}>
                            <strong>Note:</strong> Adding a service log will automatically set the vehicle status to "In Shop".
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                                {saving ? "Saving…" : "Save Service"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Maintenance;
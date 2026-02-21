import React, { useState, useEffect, useCallback } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";
import { vehicleAPI } from "../lib/api";

const VEHICLE_CLASSES = ["van", "truck", "tanker", "flatbed", "refrigerated"];

const EMPTY_FORM = { name_model: "", license_plate: "", vehicle_class: "", max_load_kg: "", region: "" };

function Modal({ title, onClose, children }) {
    return (
        <div
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
                    <h3 id="modal-title" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
                    <button onClick={onClose} aria-label="Close dialog" style={{ background: "none", border: "none", fontSize: "22px", color: "var(--color-text-muted)", cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Vehicles({ showToast, role }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [groupBy, setGroupBy] = useState("");

    const canCreate = role === "manager";

    const loadVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await vehicleAPI.getAll();
            setVehicles(data.vehicles || []);
        } catch (err) {
            showToast("Failed to load vehicles: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadVehicles(); }, [loadVehicles]);

    const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

    const validate = () => {
        const errs = {};
        if (!form.license_plate.trim()) errs.license_plate = "License plate is required.";
        if (!form.name_model.trim()) errs.name_model = "Vehicle model is required.";
        if (!form.vehicle_class) errs.vehicle_class = "Please select a vehicle class.";
        if (!form.max_load_kg || isNaN(Number(form.max_load_kg)) || Number(form.max_load_kg) <= 0)
            errs.max_load_kg = "Max load must be a positive number.";
        return errs;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Vehicle creation failed. Please check required fields.", "error"); return; }

        setSaving(true);
        try {
            await vehicleAPI.create({
                name_model: form.name_model,
                license_plate: form.license_plate.toUpperCase(),
                max_load_kg: Number(form.max_load_kg),
                vehicle_class: form.vehicle_class,
                region: form.region || null,
            });
            setShowModal(false); setForm(EMPTY_FORM); setErrors({});
            showToast("Vehicle registered successfully.", "success");
            loadVehicles();
        } catch (err) {
            showToast(err.message || "Failed to create vehicle.", "error");
        } finally {
            setSaving(false);
        }
    };

    let displayed = vehicles.filter((v) =>
        !search || [v.license_plate, v.name_model, v.vehicle_class].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "model") displayed = [...displayed].sort((a, b) => a.name_model.localeCompare(b.name_model));
    if (sortBy === "payload") displayed = [...displayed].sort((a, b) => Number(b.max_load_kg) - Number(a.max_load_kg));
    if (sortBy === "odometer") displayed = [...displayed].sort((a, b) => b.odometer - a.odometer);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading vehicles…</span>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Vehicle Registry"
                actionLabel={canCreate ? "New Vehicle" : undefined}
                onAction={canCreate ? () => setShowModal(true) : undefined}
                search={search} onSearch={setSearch} searchPlaceholder="Search by plate, model, class…"
                groupOptions={[{ label: "Vehicle Class", value: "vehicle_class" }, { label: "Status", value: "status" }]}
                groupValue={groupBy} onGroup={setGroupBy}
                sortOptions={[{ label: "Model", value: "model" }, { label: "Max Load", value: "payload" }, { label: "Odometer", value: "odometer" }]}
                sortValue={sortBy} onSort={setSortBy}
            />

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No vehicles match your search.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Plate</th><th>Model</th><th>Class</th><th>Max Load (kg)</th><th>Odometer (km)</th><th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((v) => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 600, fontFamily: "monospace", color: "var(--color-text-primary)" }}>{v.license_plate}</td>
                                    <td style={{ fontWeight: 500 }}>{v.name_model}</td>
                                    <td style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{v.vehicle_class}</td>
                                    <td>{Number(v.max_load_kg).toLocaleString()}</td>
                                    <td>{v.odometer.toLocaleString()}</td>
                                    <td><StatusPill status={v.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Vehicle Modal */}
            {showModal && (
                <Modal title="Register New Vehicle" onClose={() => { setShowModal(false); setForm(EMPTY_FORM); setErrors({}); }}>
                    <form onSubmit={handleSave} noValidate>
                        <FormField label="License Plate" required htmlFor="v-plate" error={errors.license_plate}>
                            <input id="v-plate" type="text" value={form.license_plate} onChange={(e) => setF("license_plate", e.target.value)} placeholder="e.g. MH12AB1234" className={errors.license_plate ? "error-field" : ""} />
                        </FormField>
                        <FormField label="Model" required htmlFor="v-model" error={errors.name_model}>
                            <input id="v-model" type="text" value={form.name_model} onChange={(e) => setF("name_model", e.target.value)} placeholder="e.g. Tata Prima 4028.S" className={errors.name_model ? "error-field" : ""} />
                        </FormField>
                        <FormField label="Vehicle Class" required htmlFor="v-class" error={errors.vehicle_class}>
                            <select id="v-class" value={form.vehicle_class} onChange={(e) => setF("vehicle_class", e.target.value)} className={errors.vehicle_class ? "error-field" : ""}>
                                <option value="">Select class…</option>
                                {VEHICLE_CLASSES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Max Load (kg)" required htmlFor="v-load" error={errors.max_load_kg}>
                                <input id="v-load" type="number" min="0" value={form.max_load_kg} onChange={(e) => setF("max_load_kg", e.target.value)} placeholder="e.g. 15000" className={errors.max_load_kg ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Region" htmlFor="v-region">
                                <input id="v-region" type="text" value={form.region} onChange={(e) => setF("region", e.target.value)} placeholder="e.g. South India" />
                            </FormField>
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                style={{ padding: "9px 20px", background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                                {saving ? "Saving…" : "Save Vehicle"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Vehicles;
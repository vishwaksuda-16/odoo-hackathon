import React, { useState, useEffect, useCallback } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";
import { tripAPI, vehicleAPI, driverAPI } from "../lib/api";

const EMPTY = { vehicle_id: "", driver_id: "", cargo_weight_kg: "" };
const EMPTY_COMPLETE = { final_odometer: "", liters: "", fuel_cost: "" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="trip-modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "var(--color-surface)", borderRadius: "12px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid var(--color-border)" }}>
                    <h3 id="trip-modal-title" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "var(--color-text-muted)", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Trips({ showToast, role }) {
    const [trips, setTrips] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [weightWarning, setWeightWarning] = useState("");
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [completeModal, setCompleteModal] = useState(null);
    const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
    const [completeErrors, setCompleteErrors] = useState({});
    const [completing, setCompleting] = useState(false);

    const canCreate = role === "manager" || role === "dispatcher";

    const loadTrips = useCallback(async () => {
        setLoading(true);
        try {
            const data = await tripAPI.getAll("limit=100");
            setTrips(data.trips || []);
        } catch (err) {
            showToast("Failed to load trips: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadTrips(); }, [loadTrips]);

    const openCreateModal = async () => {
        try {
            const [vRes, dRes] = await Promise.all([
                vehicleAPI.getAll("status=available"),
                driverAPI.getAll("status=on_duty"),
            ]);
            setAvailableVehicles(vRes.vehicles || []);
            setAvailableDrivers((dRes.drivers || []).filter((d) => new Date(d.license_expiry) > new Date()));
            setShowModal(true);
        } catch (err) {
            showToast("Failed to load available vehicles/drivers: " + err.message, "error");
        }
    };

    const setF = (k, v) => {
        const next = { ...form, [k]: v };
        setForm(next);
        setErrors((e) => ({ ...e, [k]: "" }));
        // Live weight validation
        if ((k === "cargo_weight_kg" || k === "vehicle_id") && next.vehicle_id) {
            const vehicle = availableVehicles.find((ve) => String(ve.id) === String(next.vehicle_id));
            if (vehicle && Number(next.cargo_weight_kg) > Number(vehicle.max_load_kg)) {
                setWeightWarning(`Cargo weight (${Number(next.cargo_weight_kg).toLocaleString()} kg) exceeds vehicle capacity (${Number(vehicle.max_load_kg).toLocaleString()} kg). Trip cannot be created.`);
            } else {
                setWeightWarning("");
            }
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.vehicle_id) errs.vehicle_id = "Please select a vehicle.";
        if (!form.driver_id) errs.driver_id = "Please select a driver.";
        if (!form.cargo_weight_kg || isNaN(Number(form.cargo_weight_kg)) || Number(form.cargo_weight_kg) <= 0)
            errs.cargo_weight_kg = "Cargo weight must be a positive number.";
        if (!errs.cargo_weight_kg && !errs.vehicle_id && form.vehicle_id) {
            const vehicle = availableVehicles.find((v) => String(v.id) === String(form.vehicle_id));
            if (vehicle && Number(form.cargo_weight_kg) > Number(vehicle.max_load_kg))
                errs.cargo_weight_kg = `Cargo weight exceeds vehicle capacity (${Number(vehicle.max_load_kg).toLocaleString()} kg). Trip cannot be created.`;
        }
        return errs;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Trip cannot be created. Please review the highlighted fields.", "error"); return; }

        setSaving(true);
        try {
            await tripAPI.create({
                vehicle_id: Number(form.vehicle_id),
                driver_id: Number(form.driver_id),
                cargo_weight_kg: Number(form.cargo_weight_kg),
            });
            setShowModal(false); setForm(EMPTY); setErrors({}); setWeightWarning("");
            showToast("Trip dispatched successfully.", "success");
            loadTrips();
        } catch (err) {
            const msg = err.body?.detail || err.message || "Failed to create trip.";
            showToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const openCompleteModal = (trip) => {
        setCompleteModal(trip);
        setCompleteForm({ final_odometer: String(trip.start_odometer || ""), liters: "", fuel_cost: "" });
        setCompleteErrors({});
    };

    const setCF = (k, v) => { setCompleteForm((f) => ({ ...f, [k]: v })); setCompleteErrors((e) => ({ ...e, [k]: "" })); };

    const validateComplete = () => {
        const errs = {};
        const start = completeModal ? Number(completeModal.start_odometer) : 0;
        const final = Number(completeForm.final_odometer);
        if (!completeForm.final_odometer || isNaN(final)) errs.final_odometer = "Final odometer is required.";
        else if (final <= start) errs.final_odometer = `Final odometer must be greater than start (${start}).`;
        return errs;
    };

    const handleCompleteTrip = async (e) => {
        e.preventDefault();
        if (!completeModal) return;
        const errs = validateComplete();
        if (Object.keys(errs).length) { setCompleteErrors(errs); showToast("Please enter a valid final odometer.", "error"); return; }
        setCompleting(true);
        try {
            await tripAPI.complete({
                trip_id: completeModal.id,
                final_odometer: Number(completeForm.final_odometer),
                ...(completeForm.liters && !isNaN(Number(completeForm.liters)) && { liters: Number(completeForm.liters) }),
                ...(completeForm.fuel_cost && !isNaN(Number(completeForm.fuel_cost)) && { fuel_cost: Number(completeForm.fuel_cost) }),
            });
            setCompleteModal(null); setCompleteForm(EMPTY_COMPLETE); setCompleteErrors({});
            showToast("Trip marked done. Vehicle and driver are now available.", "success");
            loadTrips();
        } catch (err) {
            showToast(err.message || "Failed to complete trip.", "error");
        } finally {
            setCompleting(false);
        }
    };

    let displayed = trips.filter((t) =>
        !search || [t.vehicle_name, t.driver_name, t.license_plate, t.status].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "status") displayed = [...displayed].sort((a, b) => a.status.localeCompare(b.status));
    if (sortBy === "weight") displayed = [...displayed].sort((a, b) => Number(b.cargo_weight_kg) - Number(a.cargo_weight_kg));

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading trips…</span>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Trip Dispatcher"
                actionLabel={canCreate ? "New Trip" : undefined}
                onAction={canCreate ? openCreateModal : undefined}
                search={search} onSearch={setSearch} searchPlaceholder="Search trips…"
                sortOptions={[{ label: "Status", value: "status" }, { label: "Cargo Weight", value: "weight" }]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Status", value: "status" }]}
            />

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No trips match your search.</div>
                ) : (
                    <table>
                        <thead><tr><th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Cargo (kg)</th><th>Start Odometer</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {displayed.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>#{t.id}</td>
                                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
                                        {t.vehicle_name} – {t.license_plate}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{t.driver_name}</td>
                                    <td>{Number(t.cargo_weight_kg).toLocaleString()}</td>
                                    <td style={{ fontSize: "0.8125rem" }}>{t.start_odometer != null ? Number(t.start_odometer).toLocaleString() : "—"}</td>
                                    <td><StatusPill status={t.status} /></td>
                                    <td>
                                        {t.status === "dispatched" && (role === "manager" || role === "dispatcher") && (
                                            <button type="button" onClick={() => openCompleteModal(t)} style={{ padding: "6px 12px", fontSize: "0.75rem", background: "var(--color-primary)", color: "var(--color-surface)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Complete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <Modal title="Dispatch New Trip" onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}); setWeightWarning(""); }}>
                    <form onSubmit={handleSave} noValidate>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Vehicle" required htmlFor="t-vehicle" error={errors.vehicle_id}>
                                <select id="t-vehicle" value={form.vehicle_id} onChange={(e) => setF("vehicle_id", e.target.value)} className={errors.vehicle_id ? "error-field" : ""}>
                                    <option value="">Select vehicle…</option>
                                    {availableVehicles.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name_model} – {v.license_plate} ({Number(v.max_load_kg).toLocaleString()} kg)</option>
                                    ))}
                                </select>
                                {availableVehicles.length === 0 && <span style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}>No available vehicles</span>}
                            </FormField>
                            <FormField label="Driver" required htmlFor="t-driver" error={errors.driver_id}>
                                <select id="t-driver" value={form.driver_id} onChange={(e) => setF("driver_id", e.target.value)} className={errors.driver_id ? "error-field" : ""}>
                                    <option value="">Select driver…</option>
                                    {availableDrivers.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>
                                    ))}
                                </select>
                                {availableDrivers.length === 0 && <span style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}>No on-duty drivers with valid licenses</span>}
                            </FormField>
                        </div>
                        <FormField label="Cargo Weight (kg)" required htmlFor="t-weight" error={errors.cargo_weight_kg}>
                            <input id="t-weight" type="number" min="1" value={form.cargo_weight_kg} onChange={(e) => setF("cargo_weight_kg", e.target.value)} placeholder="e.g. 12000" className={errors.cargo_weight_kg ? "error-field" : ""} />
                        </FormField>
                        {weightWarning && (
                            <div role="alert" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", borderRadius: "6px", padding: "9px 12px", marginBottom: "12px", fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
                                ⚠ {weightWarning}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}); setWeightWarning(""); }}
                                style={{ padding: "9px 18px", border: "1px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: saving ? "#999" : "var(--color-primary)", color: "var(--color-surface)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                                {saving ? "Creating…" : "Dispatch Trip"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {completeModal && (
                <Modal title="Complete Trip" onClose={() => { setCompleteModal(null); setCompleteForm(EMPTY_COMPLETE); setCompleteErrors({}); }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                        Trip #{completeModal.id} — {completeModal.vehicle_name} / {completeModal.driver_name}. Start odometer: {Number(completeModal.start_odometer).toLocaleString()} km.
                    </p>
                    <form onSubmit={handleCompleteTrip} noValidate>
                        <FormField label="Final Odometer (km)" required htmlFor="final-odo" error={completeErrors.final_odometer}>
                            <input id="final-odo" type="number" min={Number(completeModal.start_odometer) + 1} value={completeForm.final_odometer} onChange={(e) => setCF("final_odometer", e.target.value)} placeholder="e.g. 50500" className={completeErrors.final_odometer ? "error-field" : ""} />
                        </FormField>
                        <FormField label="Fuel Liters (optional)" htmlFor="complete-liters">
                            <input id="complete-liters" type="number" min="0" step="0.01" value={completeForm.liters} onChange={(e) => setCF("liters", e.target.value)} placeholder="For fuel log" />
                        </FormField>
                        <FormField label="Fuel Cost (₹, optional)" htmlFor="complete-cost">
                            <input id="complete-cost" type="number" min="0" step="0.01" value={completeForm.fuel_cost} onChange={(e) => setCF("fuel_cost", e.target.value)} placeholder="For cost-per-km" />
                        </FormField>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                            <button type="button" onClick={() => { setCompleteModal(null); setCompleteForm(EMPTY_COMPLETE); setCompleteErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid var(--color-border)", borderRadius: "6px", background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={completing} style={{ padding: "9px 20px", background: completing ? "#999" : "var(--color-primary)", color: "var(--color-surface)", border: "none", borderRadius: "6px", fontWeight: 600, cursor: completing ? "not-allowed" : "pointer" }}>
                                {completing ? "Completing…" : "Mark Done"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Trips;
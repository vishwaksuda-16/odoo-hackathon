import React, { useState } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";

const VEHICLE_TYPES = ["Heavy Truck", "Light Van", "Mini Truck", "Tanker", "Refrigerated Van", "Flatbed"];

const INITIAL_DATA = [
    { id: 1, plate: "MH12AB1234", model: "Tata Prima", type: "Heavy Truck", payload: 15000, odometer: 42800, status: "available" },
    { id: 2, plate: "MH14CD5678", model: "Ashok Leyland BOSS", type: "Light Van", payload: 3500, odometer: 18200, status: "on_trip" },
    { id: 3, plate: "MH01EF9012", model: "Eicher Pro 6015", type: "Heavy Truck", payload: 20000, odometer: 74100, status: "in_shop" },
    { id: 4, plate: "DL04GH3456", model: "Force Traveller", type: "Mini Truck", payload: 1800, odometer: 9300, status: "available" },
];

const EMPTY_FORM = { plate: "", model: "", type: "", payload: "", odometer: "" };

function Modal({ title, onClose, children }) {
    return (
        <div
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                    <h3 id="modal-title" style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{title}</h3>
                    <button onClick={onClose} aria-label="Close dialog" style={{ background: "none", border: "none", fontSize: "22px", color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Vehicles({ showToast }) {
    const [vehicles, setVehicles] = useState(INITIAL_DATA);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [groupBy, setGroupBy] = useState("");

    const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

    const validate = () => {
        const errs = {};
        if (!form.plate.trim()) errs.plate = "License plate is required.";
        if (!form.model.trim()) errs.model = "Vehicle model is required.";
        if (!form.type) errs.type = "Please select a vehicle type.";
        if (!form.payload || isNaN(Number(form.payload)) || Number(form.payload) <= 0)
            errs.payload = "Max payload must be a positive number.";
        if (!form.odometer || isNaN(Number(form.odometer)) || Number(form.odometer) < 0)
            errs.odometer = "Odometer must be a non-negative number.";
        return errs;
    };

    const handleSave = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Vehicle creation failed. Please check required fields.", "error"); return; }
        const newV = {
            id: vehicles.length + 1, plate: form.plate.toUpperCase(), model: form.model, type: form.type,
            payload: Number(form.payload), odometer: Number(form.odometer), status: "available",
        };
        setVehicles((v) => [newV, ...v]);
        setShowModal(false); setForm(EMPTY_FORM); setErrors({});
        showToast("Vehicle registered successfully.", "success");
    };

    let displayed = vehicles.filter((v) =>
        !search || v.plate.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()) || v.type.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "model") displayed = [...displayed].sort((a, b) => a.model.localeCompare(b.model));
    if (sortBy === "payload") displayed = [...displayed].sort((a, b) => b.payload - a.payload);
    if (sortBy === "odometer") displayed = [...displayed].sort((a, b) => b.odometer - a.odometer);

    return (
        <div>
            <PageHeader
                title="Vehicle Registry"
                actionLabel="New Vehicle"
                onAction={() => setShowModal(true)}
                search={search} onSearch={setSearch} searchPlaceholder="Search by plate, model, type…"
                groupOptions={[{ label: "Vehicle Type", value: "type" }, { label: "Status", value: "status" }]}
                groupValue={groupBy} onGroup={setGroupBy}
                sortOptions={[{ label: "Model", value: "model" }, { label: "Max Payload", value: "payload" }, { label: "Odometer", value: "odometer" }]}
                sortValue={sortBy} onSort={setSortBy}
            />

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>No vehicles match your search.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Plate</th><th>Model</th><th>Type</th><th>Max Payload (kg)</th><th>Odometer (km)</th><th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((v) => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 600, fontFamily: "monospace", color: "#1e293b" }}>{v.plate}</td>
                                    <td style={{ fontWeight: 500 }}>{v.model}</td>
                                    <td style={{ color: "#475569" }}>{v.type}</td>
                                    <td>{v.payload.toLocaleString()}</td>
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
                        <FormField label="License Plate" required htmlFor="v-plate" error={errors.plate}>
                            <input id="v-plate" type="text" value={form.plate} onChange={(e) => setF("plate", e.target.value)} placeholder="e.g. MH12AB1234" className={errors.plate ? "error-field" : ""} />
                        </FormField>
                        <FormField label="Model" required htmlFor="v-model" error={errors.model}>
                            <input id="v-model" type="text" value={form.model} onChange={(e) => setF("model", e.target.value)} placeholder="e.g. Tata Prima 4028.S" className={errors.model ? "error-field" : ""} />
                        </FormField>
                        <FormField label="Vehicle Type" required htmlFor="v-type" error={errors.type}>
                            <select id="v-type" value={form.type} onChange={(e) => setF("type", e.target.value)} className={errors.type ? "error-field" : ""}>
                                <option value="">Select type…</option>
                                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Max Payload (kg)" required htmlFor="v-payload" error={errors.payload}>
                                <input id="v-payload" type="number" min="0" value={form.payload} onChange={(e) => setF("payload", e.target.value)} placeholder="e.g. 15000" className={errors.payload ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Initial Odometer (km)" required htmlFor="v-odometer" error={errors.odometer}>
                                <input id="v-odometer" type="number" min="0" value={form.odometer} onChange={(e) => setF("odometer", e.target.value)} placeholder="e.g. 0" className={errors.odometer ? "error-field" : ""} />
                            </FormField>
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button type="submit"
                                style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>
                                Save Vehicle
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Vehicles;
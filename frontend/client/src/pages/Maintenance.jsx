import React, { useState } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";

const VEHICLES = ["Tata Prima – MH12AB1234", "Ashok Leyland – MH14CD5678", "Eicher Pro – MH01EF9012", "Force Traveller – DL04GH3456"];
const SERVICE_TYPES = ["Oil Change", "Tire Replacement", "Brake Service", "Engine Repair", "AC Service", "Electrical", "Suspension", "General Inspection", "Other"];

const INITIAL_LOGS = [
    { id: 501, vehicle: VEHICLES[0], service: "Oil Change", cost: 2000, date: "2024-06-01", status: "completed" },
    { id: 502, vehicle: VEHICLES[2], service: "Brake Service", cost: 8500, date: "2024-06-10", status: "in_shop" },
    { id: 503, vehicle: VEHICLES[1], service: "Tire Replacement", cost: 12000, date: "2024-06-15", status: "scheduled" },
];

const EMPTY = { vehicle: "", service: "", date: "", cost: "" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="maint-modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                    <h3 id="maint-modal-title" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#94a3b8", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Maintenance({ showToast }) {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

    const validate = () => {
        const errs = {};
        if (!form.vehicle) errs.vehicle = "Please select a vehicle.";
        if (!form.service) errs.service = "Please select a service type.";
        if (!form.date) errs.date = "Service date is required.";
        if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0)
            errs.cost = "Cost must be a valid non-negative number.";
        return errs;
    };

    const handleSave = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Service log creation failed. Please check required fields.", "error"); return; }
        const newLog = {
            id: 600 + logs.length, vehicle: form.vehicle, service: form.service,
            cost: Number(form.cost), date: form.date, status: "scheduled",
        };
        setLogs((l) => [newLog, ...l]);
        setShowModal(false); setForm(EMPTY); setErrors({});
        showToast("Service log added successfully.", "success");
    };

    let displayed = logs.filter((l) =>
        !search || [l.vehicle, l.service].some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === "date") displayed = [...displayed].sort((a, b) => b.date.localeCompare(a.date));
    if (sortBy === "cost") displayed = [...displayed].sort((a, b) => b.cost - a.cost);

    return (
        <div>
            <PageHeader
                title="Maintenance & Service"
                actionLabel="Add New Service"
                onAction={() => setShowModal(true)}
                search={search} onSearch={setSearch} searchPlaceholder="Search by vehicle, service…"
                sortOptions={[{ label: "Date (Newest)", value: "date" }, { label: "Cost (Highest)", value: "cost" }]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Vehicle", value: "vehicle" }, { label: "Status", value: "status" }]}
            />

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No service logs match your search.</div>
                ) : (
                    <table>
                        <thead><tr><th>Log ID</th><th>Vehicle</th><th>Service / Issue</th><th>Cost (₹)</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {displayed.map((l) => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 600, color: "#1d4ed8" }}>#{l.id}</td>
                                    <td style={{ color: "#475569", fontSize: "0.8125rem" }}>{l.vehicle}</td>
                                    <td style={{ fontWeight: 500 }}>{l.service}</td>
                                    <td>₹{l.cost.toLocaleString()}</td>
                                    <td style={{ color: "#475569" }}>{l.date}</td>
                                    <td><StatusPill status={l.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <Modal title="Add Service Log" onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}>
                    <form onSubmit={handleSave} noValidate>
                        <FormField label="Vehicle" required htmlFor="m-vehicle" error={errors.vehicle}>
                            <select id="m-vehicle" value={form.vehicle} onChange={(e) => setF("vehicle", e.target.value)} className={errors.vehicle ? "error-field" : ""}>
                                <option value="">Select vehicle…</option>
                                {VEHICLES.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Service / Issue" required htmlFor="m-service" error={errors.service}>
                            <select id="m-service" value={form.service} onChange={(e) => setF("service", e.target.value)} className={errors.service ? "error-field" : ""}>
                                <option value="">Select service type…</option>
                                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Service Date" required htmlFor="m-date" error={errors.date}>
                                <input id="m-date" type="date" value={form.date} onChange={(e) => setF("date", e.target.value)} className={errors.date ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Cost (₹)" required htmlFor="m-cost" error={errors.cost}>
                                <input id="m-cost" type="number" min="0" value={form.cost} onChange={(e) => setF("cost", e.target.value)} placeholder="e.g. 2500" className={errors.cost ? "error-field" : ""} />
                            </FormField>
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Save Service</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Maintenance;
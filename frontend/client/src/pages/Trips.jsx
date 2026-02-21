import React, { useState } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";

const VEHICLES = ["Tata Prima – MH12AB1234 (15t)", "Ashok Leyland – MH14CD5678 (3.5t)", "Eicher Pro – MH01EF9012 (20t)", "Force Traveller – DL04GH3456 (1.8t)"];
const VEHICLE_CAPS = { 0: 15000, 1: 3500, 2: 20000, 3: 1800 };
const DRIVERS = ["Alex Kumar", "Priya Mohan", "Raj Singh", "Sara Nair", "Vikram Patel"];

const INITIAL_TRIPS = [
    { id: 101, vehicle: VEHICLES[0], driver: "Alex Kumar", origin: "Chennai", destination: "Bangalore", cargo: "Electronics", weight: 12000, fuel: 200, status: "completed" },
    { id: 102, vehicle: VEHICLES[1], driver: "Priya Mohan", origin: "Pune", destination: "Mumbai", cargo: "Textiles", weight: 2800, fuel: 40, status: "on_trip" },
    { id: 103, vehicle: VEHICLES[2], driver: "Raj Singh", origin: "Delhi", destination: "Jaipur", cargo: "Steel Rods", weight: 18000, fuel: 300, status: "scheduled" },
];

const EMPTY = { vehicleIdx: "", driver: "", origin: "", destination: "", cargo: "", weight: "", fuel: "" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="trip-modal-title"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                    <h3 id="trip-modal-title" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#94a3b8", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Trips({ showToast }) {
    const [trips, setTrips] = useState(INITIAL_TRIPS);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [weightWarning, setWeightWarning] = useState("");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const setF = (k, v) => {
        const next = { ...form, [k]: v };
        setForm(next);
        setErrors((e) => ({ ...e, [k]: "" }));
        // Live weight validation
        if ((k === "weight" || k === "vehicleIdx") && next.vehicleIdx !== "") {
            const cap = VEHICLE_CAPS[Number(next.vehicleIdx)];
            const w = Number(next.weight);
            if (w > 0 && cap && w > cap) {
                setWeightWarning(`Cargo weight (${w.toLocaleString()} kg) exceeds vehicle capacity (${cap.toLocaleString()} kg). Trip cannot be created.`);
            } else { setWeightWarning(""); }
        }
    };

    const validate = () => {
        const errs = {};
        if (form.vehicleIdx === "") errs.vehicleIdx = "Please select a vehicle.";
        if (!form.driver) errs.driver = "Please select a driver.";
        if (!form.origin.trim()) errs.origin = "Origin is required.";
        if (!form.destination.trim()) errs.destination = "Destination is required.";
        if (!form.cargo.trim()) errs.cargo = "Cargo description is required.";
        if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0)
            errs.weight = "Cargo weight must be a positive number.";
        if (!form.fuel || isNaN(Number(form.fuel)) || Number(form.fuel) <= 0)
            errs.fuel = "Estimated fuel must be a positive number.";
        if (!errs.weight && !errs.vehicleIdx && form.vehicleIdx !== "") {
            const cap = VEHICLE_CAPS[Number(form.vehicleIdx)];
            if (Number(form.weight) > cap) errs.weight = `Cargo weight exceeds vehicle capacity (${cap.toLocaleString()} kg). Trip cannot be created.`;
        }
        return errs;
    };

    const handleSave = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Trip cannot be created. Please review the highlighted fields.", "error"); return; }
        const newTrip = {
            id: 200 + trips.length, vehicle: VEHICLES[Number(form.vehicleIdx)], driver: form.driver,
            origin: form.origin, destination: form.destination, cargo: form.cargo,
            weight: Number(form.weight), fuel: Number(form.fuel), status: "scheduled",
        };
        setTrips((t) => [newTrip, ...t]);
        setShowModal(false); setForm(EMPTY); setErrors({}); setWeightWarning("");
        showToast("Trip scheduled successfully.", "success");
    };

    let displayed = trips.filter((t) =>
        !search || [t.vehicle, t.driver, t.origin, t.destination, t.cargo].some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === "status") displayed = [...displayed].sort((a, b) => a.status.localeCompare(b.status));
    if (sortBy === "weight") displayed = [...displayed].sort((a, b) => b.weight - a.weight);

    return (
        <div>
            <PageHeader
                title="Trip Dispatcher"
                actionLabel="New Trip"
                onAction={() => setShowModal(true)}
                search={search} onSearch={setSearch} searchPlaceholder="Search trips…"
                sortOptions={[{ label: "Status", value: "status" }, { label: "Cargo Weight", value: "weight" }]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Status", value: "status" }, { label: "Driver", value: "driver" }]}
            />

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No trips match your search.</div>
                ) : (
                    <table>
                        <thead><tr><th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Origin → Destination</th><th>Cargo</th><th>Weight (kg)</th><th>Status</th></tr></thead>
                        <tbody>
                            {displayed.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600, color: "#1d4ed8" }}>#{t.id}</td>
                                    <td style={{ color: "#475569", fontSize: "0.8125rem" }}>{t.vehicle}</td>
                                    <td style={{ fontWeight: 500 }}>{t.driver}</td>
                                    <td style={{ color: "#475569" }}>{t.origin} → {t.destination}</td>
                                    <td style={{ color: "#475569" }}>{t.cargo}</td>
                                    <td>{t.weight.toLocaleString()}</td>
                                    <td><StatusPill status={t.status} /></td>
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
                            <FormField label="Vehicle" required htmlFor="t-vehicle" error={errors.vehicleIdx}>
                                <select id="t-vehicle" value={form.vehicleIdx} onChange={(e) => setF("vehicleIdx", e.target.value)} className={errors.vehicleIdx ? "error-field" : ""}>
                                    <option value="">Select vehicle…</option>
                                    {VEHICLES.map((v, i) => <option key={i} value={i}>{v}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Driver" required htmlFor="t-driver" error={errors.driver}>
                                <select id="t-driver" value={form.driver} onChange={(e) => setF("driver", e.target.value)} className={errors.driver ? "error-field" : ""}>
                                    <option value="">Select driver…</option>
                                    {DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Origin" required htmlFor="t-origin" error={errors.origin}>
                                <input id="t-origin" value={form.origin} onChange={(e) => setF("origin", e.target.value)} placeholder="City or location" className={errors.origin ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Destination" required htmlFor="t-dest" error={errors.destination}>
                                <input id="t-dest" value={form.destination} onChange={(e) => setF("destination", e.target.value)} placeholder="City or location" className={errors.destination ? "error-field" : ""} />
                            </FormField>
                        </div>
                        <FormField label="Cargo Description" required htmlFor="t-cargo" error={errors.cargo}>
                            <input id="t-cargo" value={form.cargo} onChange={(e) => setF("cargo", e.target.value)} placeholder="e.g. Electronics, Textiles, Steel" className={errors.cargo ? "error-field" : ""} />
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Cargo Weight (kg)" required htmlFor="t-weight" error={errors.weight}>
                                <input id="t-weight" type="number" min="1" value={form.weight} onChange={(e) => setF("weight", e.target.value)} placeholder="e.g. 12000" className={errors.weight ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Estimated Fuel (L)" required htmlFor="t-fuel" error={errors.fuel}>
                                <input id="t-fuel" type="number" min="1" value={form.fuel} onChange={(e) => setF("fuel", e.target.value)} placeholder="e.g. 200" className={errors.fuel ? "error-field" : ""} />
                            </FormField>
                        </div>
                        {weightWarning && (
                            <div role="alert" style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "9px 12px", marginBottom: "12px", fontSize: "0.8125rem", color: "#b45309" }}>
                                ⚠ {weightWarning}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}); setWeightWarning(""); }}
                                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Dispatch Trip</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Trips;
import React, { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";

const TRIPS = ["Trip #101 – Truck A (Chennai→Bangalore)", "Trip #102 – Van B (Pune→Mumbai)", "Trip #103 – Truck C (Delhi→Jaipur)"];
const DRIVERS = ["Alex Kumar", "Priya Mohan", "Raj Singh", "Sara Nair", "Vikram Patel"];

const INITIAL_EXPENSES = [
    { id: 801, trip: TRIPS[0], driver: "Alex Kumar", fuel: 45, cost: 4500, misc: "Toll fees", date: "2024-06-02" },
    { id: 802, trip: TRIPS[1], driver: "Priya Mohan", fuel: 18, cost: 1800, misc: "Loading charges", date: "2024-06-10" },
    { id: 803, trip: TRIPS[2], driver: "Raj Singh", fuel: 72, cost: 7200, misc: "None", date: "2024-06-15" },
];

const EMPTY = { trip: "", driver: "", fuel: "", cost: "", misc: "" };

function Modal({ title, onClose, children }) {
    return (
        <div role="dialog" aria-modal="true"
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", color: "#94a3b8", cursor: "pointer" }}>×</button>
                </div>
                <div style={{ padding: "20px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

function Expenses({ showToast }) {
    const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

    const validate = () => {
        const errs = {};
        if (!form.trip) errs.trip = "Please select a trip.";
        if (!form.driver) errs.driver = "Please select a driver.";
        if (!form.fuel || isNaN(Number(form.fuel)) || Number(form.fuel) <= 0)
            errs.fuel = "Fuel quantity must be a positive number.";
        if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) <= 0)
            errs.cost = "Cost must be a positive number.";
        return errs;
    };

    const handleSave = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); showToast("Expense entry failed. Please check required fields.", "error"); return; }
        const newExp = {
            id: 900 + expenses.length, trip: form.trip, driver: form.driver,
            fuel: Number(form.fuel), cost: Number(form.cost), misc: form.misc || "None",
            date: new Date().toISOString().slice(0, 10),
        };
        setExpenses((x) => [newExp, ...x]);
        setShowModal(false); setForm(EMPTY); setErrors({});
        showToast("Expense entry saved successfully.", "success");
    };

    let displayed = expenses.filter((x) =>
        !search || [x.trip, x.driver, x.misc].some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === "cost") displayed = [...displayed].sort((a, b) => b.cost - a.cost);
    if (sortBy === "date") displayed = [...displayed].sort((a, b) => b.date.localeCompare(a.date));
    if (sortBy === "fuel") displayed = [...displayed].sort((a, b) => b.fuel - a.fuel);

    const totalCost = displayed.reduce((s, x) => s + x.cost, 0);

    return (
        <div>
            <PageHeader
                title="Expenses & Fuel Logging"
                actionLabel="Add Expense"
                onAction={() => setShowModal(true)}
                search={search} onSearch={setSearch} searchPlaceholder="Search by trip, driver…"
                sortOptions={[{ label: "Cost (Highest)", value: "cost" }, { label: "Date (Newest)", value: "date" }, { label: "Fuel (Most)", value: "fuel" }]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Driver", value: "driver" }, { label: "Trip", value: "trip" }]}
            />

            {/* Summary strip */}
            <div style={{ display: "flex", gap: "14px", marginBottom: "18px" }}>
                {[
                    { label: "Total Shown", value: `₹${totalCost.toLocaleString()}` },
                    { label: "Total Fuel (L)", value: displayed.reduce((s, x) => s + x.fuel, 0).toLocaleString() },
                    { label: "Avg. Cost / Trip", value: displayed.length ? `₹${Math.round(totalCost / displayed.length).toLocaleString()}` : "—" },
                ].map((s) => (
                    <div key={s.label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No expenses found.</div>
                ) : (
                    <table>
                        <thead><tr><th>ID</th><th>Trip</th><th>Driver</th><th>Fuel (L)</th><th>Cost (₹)</th><th>Miscellaneous</th><th>Date</th></tr></thead>
                        <tbody>
                            {displayed.map((x) => (
                                <tr key={x.id}>
                                    <td style={{ fontWeight: 600, color: "#1d4ed8" }}>#{x.id}</td>
                                    <td style={{ color: "#475569", fontSize: "0.8125rem" }}>{x.trip}</td>
                                    <td style={{ fontWeight: 500 }}>{x.driver}</td>
                                    <td>{x.fuel}</td>
                                    <td style={{ fontWeight: 600 }}>₹{x.cost.toLocaleString()}</td>
                                    <td style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>{x.misc}</td>
                                    <td style={{ color: "#475569" }}>{x.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <Modal title="Add Expense Entry" onClose={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}>
                    <form onSubmit={handleSave} noValidate>
                        <FormField label="Trip" required htmlFor="e-trip" error={errors.trip}>
                            <select id="e-trip" value={form.trip} onChange={(e) => setF("trip", e.target.value)} className={errors.trip ? "error-field" : ""}>
                                <option value="">Select trip…</option>
                                {TRIPS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Driver" required htmlFor="e-driver" error={errors.driver}>
                            <select id="e-driver" value={form.driver} onChange={(e) => setF("driver", e.target.value)} className={errors.driver ? "error-field" : ""}>
                                <option value="">Select driver…</option>
                                {DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FormField>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                            <FormField label="Fuel (litres)" required htmlFor="e-fuel" error={errors.fuel}>
                                <input id="e-fuel" type="number" min="0.1" step="0.1" value={form.fuel} onChange={(e) => setF("fuel", e.target.value)} placeholder="e.g. 45" className={errors.fuel ? "error-field" : ""} />
                            </FormField>
                            <FormField label="Total Cost (₹)" required htmlFor="e-cost" error={errors.cost}>
                                <input id="e-cost" type="number" min="1" value={form.cost} onChange={(e) => setF("cost", e.target.value)} placeholder="e.g. 4500" className={errors.cost ? "error-field" : ""} />
                            </FormField>
                        </div>
                        <FormField label="Miscellaneous Notes" htmlFor="e-misc">
                            <input id="e-misc" value={form.misc} onChange={(e) => setF("misc", e.target.value)} placeholder="e.g. Toll fees, loading charges (optional)" />
                        </FormField>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY); setErrors({}); }}
                                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", color: "#475569", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" style={{ padding: "9px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Save Expense</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Expenses;
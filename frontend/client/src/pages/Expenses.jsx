import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/ui/PageHeader";
import { analyticsAPI } from "../lib/api";

function Expenses({ showToast, role }) {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await analyticsAPI.report();
            setReport(data.report || []);
        } catch (err) {
            showToast("Failed to load expense data: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    let displayed = report.filter((r) =>
        !search || [r.name_model, r.license_plate].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "fuel_cost") displayed = [...displayed].sort((a, b) => Number(b.total_fuel_cost || 0) - Number(a.total_fuel_cost || 0));
    if (sortBy === "maint_cost") displayed = [...displayed].sort((a, b) => Number(b.total_maint_cost || 0) - Number(a.total_maint_cost || 0));
    if (sortBy === "total") displayed = [...displayed].sort((a, b) => (Number(b.total_fuel_cost || 0) + Number(b.total_maint_cost || 0)) - (Number(a.total_fuel_cost || 0) + Number(a.total_maint_cost || 0)));

    const totalFuel = displayed.reduce((s, r) => s + Number(r.total_fuel_cost || 0), 0);
    const totalMaint = displayed.reduce((s, r) => s + Number(r.total_maint_cost || 0), 0);
    const totalLiters = displayed.reduce((s, r) => s + Number(r.total_liters || 0), 0);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading expenses…</span>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Expenses & Fuel Logging"
                search={search} onSearch={setSearch} searchPlaceholder="Search by vehicle…"
                sortOptions={[
                    { label: "Fuel Cost (Highest)", value: "fuel_cost" },
                    { label: "Maintenance Cost", value: "maint_cost" },
                    { label: "Total Cost", value: "total" },
                ]}
                sortValue={sortBy} onSort={setSortBy}
            />

            {/* Summary strip */}
            <div style={{ display: "flex", gap: "14px", marginBottom: "18px" }}>
                {[
                    { label: "Total Fuel Cost", value: `₹${totalFuel.toLocaleString()}` },
                    { label: "Total Maint. Cost", value: `₹${totalMaint.toLocaleString()}` },
                    { label: "Total Fuel (L)", value: totalLiters.toLocaleString() },
                    { label: "Total Operational Cost", value: `₹${(totalFuel + totalMaint).toLocaleString()}` },
                ].map((s) => (
                    <div key={s.label} style={{ flex: 1, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No expense data found.</div>
                ) : (
                    <table>
                        <thead><tr>
                            <th>Vehicle</th>
                            <th>Plate</th>
                            <th style={{ textAlign: "right" }}>Fuel (L)</th>
                            <th style={{ textAlign: "right" }}>Fuel Cost (₹)</th>
                            <th style={{ textAlign: "right" }}>Maint. Cost (₹)</th>
                            <th style={{ textAlign: "right" }}>Fuel Eff. (km/L)</th>
                            <th style={{ textAlign: "right" }}>Cost/km (₹)</th>
                            <th style={{ textAlign: "right" }}>Total Cost (₹)</th>
                        </tr></thead>
                        <tbody>
                            {displayed.map((r, i) => {
                                const fuelCost = Number(r.total_fuel_cost || 0);
                                const maintCost = Number(r.total_maint_cost || 0);
                                const total = fuelCost + maintCost;
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{r.name_model}</td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{r.license_plate}</td>
                                        <td style={{ textAlign: "right" }}>{Number(r.total_liters || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: "right", color: "var(--color-text-primary)" }}>₹{fuelCost.toLocaleString()}</td>
                                        <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>₹{maintCost.toLocaleString()}</td>
                                        <td style={{ textAlign: "right" }}>{r.km_per_liter ? Number(r.km_per_liter).toFixed(1) : "—"}</td>
                                        <td style={{ textAlign: "right" }}>{r.cost_per_km ? `₹${Number(r.cost_per_km).toFixed(2)}` : "—"}</td>
                                        <td style={{ textAlign: "right", fontWeight: 600 }}>₹{total.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Expenses;
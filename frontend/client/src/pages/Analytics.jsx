import React, { useState, useEffect, useCallback } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { analyticsAPI } from "../lib/api";

function BarChart({ data }) {
    if (!data || data.length === 0) return <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px" }}>No data available</div>;
    const maxVal = Math.max(...data.map((d) => Number(d.revenue || d.total_fuel || 0)), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "140px", padding: "0 8px" }}>
            {data.map((d, i) => {
                const rev = Number(d.revenue || d.total_fuel || 0);
                const fuel = Number(d.fuel_cost || d.total_fuel || 0);
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "110px", gap: "2px" }}>
                            <div title={`Revenue: ₹${rev.toLocaleString()}`} style={{ width: "100%", height: `${(rev / maxVal) * 100}px`, background: "var(--color-primary)", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
                            <div title={`Fuel: ₹${fuel.toLocaleString()}`} style={{ width: "100%", height: `${(fuel / maxVal) * 100}px`, background: "#555", borderRadius: "3px 3px 0 0", minHeight: "3px" }} />
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textAlign: "center" }}>{d.month_name ? d.month_name.slice(0, 3) : `M${d.month || i + 1}`}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Analytics({ showToast, role }) {
    const [loading, setLoading] = useState(true);
    const [monthly, setMonthly] = useState([]);
    const [vehicleROI, setVehicleROI] = useState([]);
    const [ytdSummary, setYtdSummary] = useState({});
    const [report, setReport] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [financialRes, reportRes] = await Promise.all([
                analyticsAPI.monthlyFinancial(new Date().getFullYear()),
                analyticsAPI.report(),
            ]);
            setMonthly(financialRes.data?.monthly_breakdown || []);
            setVehicleROI(financialRes.data?.vehicle_roi || []);
            setYtdSummary(financialRes.data?.ytd_summary || {});
            setReport(reportRes.report || []);
        } catch (err) {
            showToast("Failed to load analytics data: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // Calculate KPIs from report data (cost-per-km from fuel + maintenance / odometer)
    const avgFuelEff = report.length > 0
        ? report.reduce((s, v) => s + Number(v.km_per_liter || 0), 0) / report.filter((v) => v.km_per_liter).length
        : 0;
    const avgROI = report.length > 0
        ? report.reduce((s, v) => s + Number(v.roi || 0), 0) / report.filter((v) => v.roi !== null).length
        : 0;
    const avgCostPerKm = report.length > 0
        ? report.filter((v) => v.cost_per_km != null).length
            ? report.reduce((s, v) => s + Number(v.cost_per_km || 0), 0) / report.filter((v) => v.cost_per_km != null).length
            : null
        : null;
    const ytdFuel = Number(ytdSummary.ytd_fuel_cost || 0);

    let dispMonthly = [...monthly];
    if (search) dispMonthly = dispMonthly.filter((d) => (d.month_name || "").toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "revenue") dispMonthly = [...dispMonthly].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading analytics…</span>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Operational Analytics"
                search={search} onSearch={setSearch} searchPlaceholder="Filter by month…"
                sortOptions={[{ label: "Revenue (Highest)", value: "revenue" }]}
                sortValue={sortBy} onSort={setSortBy}
            />

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card title="Avg. Fuel Efficiency" value={avgFuelEff > 0 ? `${avgFuelEff.toFixed(1)} km/L` : "—"} subtitle="across all vehicles" icon="⛽" />
                <Card title="Avg. Cost per km" value={avgCostPerKm != null ? `₹${Number(avgCostPerKm).toFixed(2)}/km` : "—"} subtitle="fuel + maintenance / odometer" icon="📐" />
                <Card title="Avg. Fleet ROI" value={avgROI ? `${(avgROI * 100).toFixed(1)}%` : "—"} subtitle="revenue vs. cost" icon="📈" />
                <Card title="YTD Fuel Cost" value={`₹${(ytdFuel / 100000).toFixed(2)}L`} subtitle={`₹${ytdFuel.toLocaleString()} total`} icon="🛢️" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {/* Chart */}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Revenue vs. Fuel Cost</h3>
                        <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--color-primary)", display: "inline-block" }} />Revenue</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#555", display: "inline-block" }} />Fuel</span>
                        </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                        <BarChart data={dispMonthly} />
                    </div>
                </div>

                {/* Vehicle ROI Breakdown */}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Vehicle Cost Breakdown</h3>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        {report.length === 0 ? (
                            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>No vehicle data available.</div>
                        ) : (
                            report.slice(0, 5).map((v, i) => {
                                const roi = v.roi ? (Number(v.roi) * 100).toFixed(1) : "—";
                                const kmPerL = v.km_per_liter ? Number(v.km_per_liter).toFixed(1) : "–";
                                const totalCost = Number(v.total_fuel_cost || 0) + Number(v.total_maint_cost || 0);
                                const costPerKm = v.cost_per_km != null ? `₹${Number(v.cost_per_km).toFixed(2)}/km` : "—";
                                return (
                                    <div key={i} style={{ padding: "12px 20px", borderBottom: i < 4 ? "1px solid var(--color-border)" : "none" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{v.name_model}</span>
                                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                                                {roi !== "—" ? `ROI ${roi}%` : "—"}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                                            <span>Fuel Eff: <strong style={{ color: "var(--color-text-primary)" }}>{kmPerL} km/L</strong></span>
                                            <span>Cost/km: <strong style={{ color: "var(--color-text-primary)" }}>{costPerKm}</strong></span>
                                            <span>Total Cost: <strong style={{ color: "var(--color-text-primary)" }}>₹{totalCost.toLocaleString()}</strong></span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Financial Summary */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Monthly Financial Summary</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{new Date().getFullYear()}</span>
                </div>
                {dispMonthly.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No monthly data available.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th style={{ textAlign: "right" }}>Fuel Cost (₹)</th>
                                <th style={{ textAlign: "right" }}>Maintenance Cost (₹)</th>
                                <th style={{ textAlign: "right" }}>Total Cost (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispMonthly.map((d, i) => {
                                const fuelCost = Number(d.fuel_cost || d.total_fuel || 0);
                                const maintCost = Number(d.maint_cost || d.total_maintenance || 0);
                                const total = fuelCost + maintCost;
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{d.month_name || `Month ${d.month}`}</td>
                                        <td style={{ textAlign: "right", color: "var(--color-text-primary)" }}>₹{fuelCost.toLocaleString()}</td>
                                        <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>₹{maintCost.toLocaleString()}</td>
                                        <td style={{ textAlign: "right", fontWeight: 600 }}>₹{total.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: "var(--color-surface-raised)", borderTop: "2px solid var(--color-border)" }}>
                                <td style={{ fontWeight: 700, padding: "12px 14px" }}>YTD Total</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-text-primary)", padding: "12px 14px" }}>₹{ytdFuel.toLocaleString()}</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-text-secondary)", padding: "12px 14px" }}>₹{Number(ytdSummary.ytd_maint_cost || 0).toLocaleString()}</td>
                                <td style={{ textAlign: "right", fontWeight: 800, padding: "12px 14px" }}>₹{Number(ytdSummary.ytd_total_cost || 0).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Analytics;
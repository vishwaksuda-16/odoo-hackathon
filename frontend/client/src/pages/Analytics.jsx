import React, { useState } from "react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const MONTHLY_DATA = [
    { month: "January", revenue: 840000, fuel: 184000, maintenance: 42000 },
    { month: "February", revenue: 910000, fuel: 196000, maintenance: 35000 },
    { month: "March", revenue: 780000, fuel: 201000, maintenance: 58000 },
    { month: "April", revenue: 1020000, fuel: 188000, maintenance: 31000 },
    { month: "May", revenue: 960000, fuel: 175000, maintenance: 46000 },
    { month: "June", revenue: 1150000, fuel: 210000, maintenance: 52000 },
];

const VEHICLE_KPI = [
    { vehicle: "Truck A – MH12AB1234", trips: 42, kmDriven: 18400, fuelUsed: 2208, revenue: 520000, cost: 98000 },
    { vehicle: "Van B – MH14CD5678", trips: 31, kmDriven: 8200, fuelUsed: 820, revenue: 210000, cost: 38000 },
    { vehicle: "Truck C – MH01EF9012", trips: 28, kmDriven: 22100, fuelUsed: 3094, revenue: 490000, cost: 140000 },
];

function BarChart({ data }) {
    const maxVal = Math.max(...data.map((d) => d.revenue));
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "140px", padding: "0 8px" }}>
            {data.map((d) => {
                const netProfit = d.revenue - d.fuel - d.maintenance;
                const profitColor = netProfit >= 0 ? "#16a34a" : "#dc2626";
                return (
                    <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "110px", gap: "2px" }}>
                            <div title={`Revenue: ₹${d.revenue.toLocaleString()}`}
                                style={{ width: "100%", height: `${(d.revenue / maxVal) * 100}px`, background: "#1d4ed8", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
                            <div title={`Fuel: ₹${d.fuel.toLocaleString()}`}
                                style={{ width: "100%", height: `${(d.fuel / maxVal) * 100}px`, background: "#f59e0b", borderRadius: "3px 3px 0 0", minHeight: "3px" }} />
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "#94a3b8", textAlign: "center" }}>{d.month.slice(0, 3)}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Analytics({ showToast }) {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");

    const totals = MONTHLY_DATA.reduce((acc, d) => ({
        revenue: acc.revenue + d.revenue,
        fuel: acc.fuel + d.fuel,
        maintenance: acc.maintenance + d.maintenance,
    }), { revenue: 0, fuel: 0, maintenance: 0 });
    const totalNet = totals.revenue - totals.fuel - totals.maintenance;
    const avgFuelEff = VEHICLE_KPI.reduce((s, v) => s + (v.kmDriven / v.fuelUsed), 0) / VEHICLE_KPI.length;
    const avgROI = VEHICLE_KPI.reduce((s, v) => s + ((v.revenue - v.cost) / v.cost) * 100, 0) / VEHICLE_KPI.length;

    let dispMonthly = MONTHLY_DATA.map((d) => ({ ...d, net: d.revenue - d.fuel - d.maintenance }));
    if (sortBy === "revenue") dispMonthly = [...dispMonthly].sort((a, b) => b.revenue - a.revenue);
    if (sortBy === "net") dispMonthly = [...dispMonthly].sort((a, b) => b.net - a.net);
    if (search) dispMonthly = dispMonthly.filter((d) => d.month.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <PageHeader
                title="Operational Analytics"
                search={search} onSearch={setSearch} searchPlaceholder="Filter by month…"
                sortOptions={[{ label: "Revenue (Highest)", value: "revenue" }, { label: "Net Profit", value: "net" }]}
                sortValue={sortBy} onSort={setSortBy}
            />

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card title="Avg. Fuel Efficiency" value={`${avgFuelEff.toFixed(1)} km/L`} subtitle="across all vehicles" icon="⛽" color="#0284c7" trend={3} />
                <Card title="Fleet ROI" value={`${avgROI.toFixed(1)}%`} subtitle="revenue vs. cost" icon="📈" color="#16a34a" trend={8} />
                <Card title="6-Month Fuel Cost" value={`₹${(totals.fuel / 100000).toFixed(2)}L`} subtitle={`₹${totals.fuel.toLocaleString()} total`} icon="🛢️" color="#d97706" trend={-2} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {/* Chart */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Revenue vs. Fuel Cost</h3>
                        <div style={{ display: "flex", gap: "12px", fontSize: "0.6875rem", color: "#475569" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#1d4ed8", display: "inline-block" }} />Revenue</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f59e0b", display: "inline-block" }} />Fuel</span>
                        </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                        <BarChart data={MONTHLY_DATA} />
                    </div>
                </div>

                {/* Vehicle KPI */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Vehicle ROI Breakdown</h3>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        {VEHICLE_KPI.map((v, i) => {
                            const roi = ((v.revenue - v.cost) / v.cost * 100).toFixed(1);
                            const kmPerL = (v.kmDriven / v.fuelUsed).toFixed(1);
                            return (
                                <div key={i} style={{ padding: "12px 20px", borderBottom: i < VEHICLE_KPI.length - 1 ? "1px solid #f0f4f8" : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{v.vehicle}</span>
                                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: Number(roi) >= 0 ? "#16a34a" : "#dc2626" }}>ROI {roi}%</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "#64748b" }}>
                                        <span>Trips: <strong style={{ color: "#0f172a" }}>{v.trips}</strong></span>
                                        <span>Fuel Eff: <strong style={{ color: "#0f172a" }}>{kmPerL} km/L</strong></span>
                                        <span>Revenue: <strong style={{ color: "#0f172a" }}>₹{v.revenue.toLocaleString()}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Financial Summary Table */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Financial Summary</h3>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>January – June 2024</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th style={{ textAlign: "right" }}>Revenue (₹)</th>
                            <th style={{ textAlign: "right" }}>Fuel Cost (₹)</th>
                            <th style={{ textAlign: "right" }}>Maintenance (₹)</th>
                            <th style={{ textAlign: "right" }}>Net Profit (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dispMonthly.map((d) => {
                            const isPositive = d.net >= 0;
                            return (
                                <tr key={d.month}>
                                    <td style={{ fontWeight: 500 }}>{d.month}</td>
                                    <td style={{ textAlign: "right" }}>{d.revenue.toLocaleString()}</td>
                                    <td style={{ textAlign: "right", color: "#dc2626" }}>{d.fuel.toLocaleString()}</td>
                                    <td style={{ textAlign: "right", color: "#d97706" }}>{d.maintenance.toLocaleString()}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <span style={{
                                            fontWeight: 700,
                                            color: isPositive ? "#16a34a" : "#dc2626",
                                            background: isPositive ? "#f0fdf4" : "#fef2f2",
                                            padding: "2px 8px", borderRadius: "4px",
                                        }}>
                                            {isPositive ? "+" : ""}{d.net.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                            <td style={{ fontWeight: 700, padding: "12px 14px" }}>6-Month Total</td>
                            <td style={{ textAlign: "right", fontWeight: 700, padding: "12px 14px" }}>₹{totals.revenue.toLocaleString()}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#dc2626", padding: "12px 14px" }}>₹{totals.fuel.toLocaleString()}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#d97706", padding: "12px 14px" }}>₹{totals.maintenance.toLocaleString()}</td>
                            <td style={{ textAlign: "right", padding: "12px 14px" }}>
                                <span style={{ fontWeight: 800, fontSize: "1rem", color: totalNet >= 0 ? "#16a34a" : "#dc2626" }}>
                                    {totalNet >= 0 ? "+" : ""}₹{totalNet.toLocaleString()}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default Analytics;
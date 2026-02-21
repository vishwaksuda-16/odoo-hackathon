import React, { useState } from "react";
import Card from "../components/ui/Card";
import StatusPill from "../components/ui/StatusPill";

const RECENT_TRIPS = [
    { id: 101, vehicle: "Truck A – MH12AB1234", driver: "Alex Kumar", origin: "Chennai", destination: "Bangalore", status: "completed" },
    { id: 102, vehicle: "Van B – MH14CD5678", driver: "Priya Mohan", origin: "Pune", destination: "Mumbai", status: "on_trip" },
    { id: 103, vehicle: "Truck C – MH01EF9012", driver: "Raj Singh", origin: "Delhi", destination: "Jaipur", status: "scheduled" },
    { id: 104, vehicle: "Van D – MH04GH3456", driver: "Sara Nair", origin: "Hyderabad", destination: "Chennai", status: "pending" },
];

const ALERTS = [
    { type: "warning", msg: "Truck A – oil change overdue (12,500 km)" },
    { type: "danger", msg: "Driver Alex Kumar – license expires in 14 days" },
    { type: "info", msg: "Van B returned from service. Status: available" },
];

const ALERT_STYLE = {
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", dot: "#d97706" },
    danger: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", dot: "#dc2626" },
    info: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", dot: "#0284c7" },
};

function Dashboard({ showToast }) {
    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card title="Active Fleet" value="12" subtitle="vehicles" icon="🚛" color="#1d4ed8" trend={5} />
                <Card title="Maintenance Alerts" value="3" subtitle="need attention" icon="🔧" color="#d97706" trend={-2} />
                <Card title="Pending Cargo" value="7" subtitle="awaiting dispatch" icon="📦" color="#7c3aed" trend={12} />
                <Card title="Drivers On Duty" value="9" subtitle="of 14 total" icon="👤" color="#16a34a" trend={0} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
                {/* Recent Trips */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>Recent Trips</h3>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Last 24 hours</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Trip ID</th>
                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Route</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_TRIPS.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600, color: "#1d4ed8" }}>#{t.id}</td>
                                    <td style={{ color: "#475569" }}>{t.vehicle}</td>
                                    <td>{t.driver}</td>
                                    <td style={{ color: "#475569" }}>{t.origin} → {t.destination}</td>
                                    <td><StatusPill status={t.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Alerts Panel */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>System Alerts</h3>
                    </div>
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {ALERTS.map((a, i) => {
                            const s = ALERT_STYLE[a.type];
                            return (
                                <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px", padding: "10px 12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.dot, marginTop: "5px", flexShrink: 0 }} />
                                    <span style={{ fontSize: "0.8125rem", color: s.text, lineHeight: "1.4" }}>{a.msg}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary stats */}
                    <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                            { label: "Trips This Month", value: "47" },
                            { label: "Avg Distance (km)", value: "312" },
                            { label: "Fuel Cost (₹)", value: "1,84,500" },
                            { label: "Fleet Utilization", value: "78%" },
                        ].map((s) => (
                            <div key={s.label} style={{ background: "#f8fafc", borderRadius: "6px", padding: "10px 12px" }}>
                                <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
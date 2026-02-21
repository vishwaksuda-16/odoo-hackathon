import React, { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import StatusPill from "../components/ui/StatusPill";
import { vehicleAPI, tripAPI, driverAPI, alertAPI } from "../lib/api";

function Dashboard({ showToast, role }) {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ activeFleet: 0, inShop: 0, pendingCargo: 0, driversOnDuty: 0, totalDrivers: 0, totalVehicles: 0 });
    const [recentTrips, setRecentTrips] = useState([]);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [vehicleRes, tripRes, driverRes] = await Promise.all([
                    vehicleAPI.getAll(),
                    tripAPI.getAll("limit=10"),
                    driverAPI.getAll(),
                ]);

                let alertRes = { alerts: [] };
                try { alertRes = await alertAPI.getAll("resolved=false&limit=10"); } catch { /* alerts may not be accessible */ }

                if (cancelled) return;

                const vehicles = vehicleRes.vehicles || [];
                const drivers = driverRes.drivers || [];
                const trips = tripRes.trips || [];

                setKpis({
                    activeFleet: vehicles.filter((v) => v.status === "on_trip").length,
                    inShop: vehicles.filter((v) => v.status === "in_shop").length,
                    pendingCargo: trips.filter((t) => t.status === "draft").length,
                    driversOnDuty: drivers.filter((d) => d.status === "on_duty" || d.status === "on_trip").length,
                    totalDrivers: drivers.length,
                    totalVehicles: vehicles.length,
                });

                setRecentTrips(trips.slice(0, 5));
                setAlerts((alertRes.alerts || []).slice(0, 5));
            } catch (err) {
                if (!cancelled) showToast("Failed to load dashboard data: " + err.message, "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [showToast]);

    const ALERT_STYLE = {
        warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "#b45309", dot: "#d97706" },
        critical: { bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "#b91c1c", dot: "#dc2626" },
        info: { bg: "var(--color-info-bg)", border: "var(--color-info-border)", text: "#0369a1", dot: "#0284c7" },
    };

    const utilRate = kpis.totalVehicles > 0
        ? Math.round(((kpis.activeFleet) / kpis.totalVehicles) * 100)
        : 0;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading dashboard…</span>
            </div>
        );
    }

    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card title="Active Fleet" value={kpis.activeFleet} subtitle={`of ${kpis.totalVehicles} vehicles`} icon="🚛" color="#1d4ed8" />
                <Card title="Maintenance Alerts" value={kpis.inShop} subtitle="in shop" icon="🔧" color="#d97706" />
                <Card title="Utilization Rate" value={`${utilRate}%`} subtitle="vehicles on trip" icon="📊" color="#7c3aed" />
                <Card title="Drivers On Duty" value={kpis.driversOnDuty} subtitle={`of ${kpis.totalDrivers} total`} icon="👤" color="#16a34a" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
                {/* Recent Trips */}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Recent Trips</h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Latest</span>
                    </div>
                    {recentTrips.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No trips found.</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTrips.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>#{t.id}</td>
                                        <td style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
                                            {t.vehicle_name || t.name_model} – {t.license_plate}
                                        </td>
                                        <td>{t.driver_name}</td>
                                        <td><StatusPill status={t.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Alerts Panel */}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>System Alerts</h3>
                    </div>
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {alerts.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                                No active alerts. All systems operational.
                            </div>
                        ) : (
                            alerts.map((a) => {
                                const sev = a.severity || "info";
                                const s = ALERT_STYLE[sev] || ALERT_STYLE.info;
                                return (
                                    <div key={a.id} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px", padding: "10px 12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.dot, marginTop: "5px", flexShrink: 0 }} />
                                        <span style={{ fontSize: "0.8125rem", color: s.text, lineHeight: "1.4" }}>{a.message}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary stats */}
                    <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {[
                            { label: "Active Fleet", value: kpis.activeFleet },
                            { label: "In Shop", value: kpis.inShop },
                            { label: "Utilization", value: `${utilRate}%` },
                            { label: "On Duty", value: kpis.driversOnDuty },
                        ].map((s) => (
                            <div key={s.label} style={{ background: "var(--color-surface-raised)", borderRadius: "6px", padding: "10px 12px" }}>
                                <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
import React, { useState, useEffect, useCallback } from "react";
import Card from "../components/ui/Card";
import StatusPill from "../components/ui/StatusPill";
import { vehicleAPI, tripAPI, driverAPI, alertAPI } from "../lib/api";

function Dashboard({ showToast, role }) {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({});
    const [recentTrips, setRecentTrips] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [vRes, tRes, dRes, aRes] = await Promise.all([
                vehicleAPI.getAll(),
                tripAPI.getAll(),
                driverAPI.getAll(),
                alertAPI.getAll().catch(() => ({ alerts: [] })),
            ]);
            const vehicles = vRes.vehicles || [];
            const trips = tRes.trips || [];
            const drivers = dRes.drivers || [];
            const alertList = aRes.alerts || [];

            setKpis({
                totalVehicles: vehicles.length,
                available: vehicles.filter((v) => v.status === "available").length,
                onTrip: vehicles.filter((v) => v.status === "on_trip").length,
                inShop: vehicles.filter((v) => v.status === "in_shop").length,
                totalDrivers: drivers.length,
                onDuty: drivers.filter((d) => d.status === "on_duty").length,
                totalTrips: trips.length,
                completed: trips.filter((t) => t.status === "completed").length,
                criticalAlerts: alertList.filter((a) => a.severity === "critical").length,
            });
            setRecentTrips(trips.slice(0, 6));
            setAlerts(alertList.slice(0, 5));
        } catch (err) {
            showToast("Failed to load dashboard: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", gap: "12px" }}>
                <span className="ff-spinner" style={{ width: "28px", height: "28px" }}></span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>Loading dashboard…</span>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                    Fleet Overview
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Real-time status of your fleet operations
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <Card title="Total Vehicles" value={kpis.totalVehicles} subtitle={`${kpis.available} available`} icon="🚛" />
                <Card title="Active Trips" value={kpis.onTrip} subtitle={`${kpis.completed} completed`} icon="🗺️" />
                <Card title="Drivers On Duty" value={kpis.onDuty} subtitle={`${kpis.totalDrivers} total drivers`} icon="👤" />
                <Card title="Critical Alerts" value={kpis.criticalAlerts} subtitle={`${alerts.length} unresolved`} icon="🔔" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Recent Trips */}
                <div className="ff-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>Recent Trips</h3>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{recentTrips.length} shown</span>
                    </div>
                    {recentTrips.length === 0 ? (
                        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>No trips yet.</div>
                    ) : (
                        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {recentTrips.map((t) => (
                                <div
                                    key={t.id}
                                    style={{
                                        padding: "12px 20px",
                                        borderBottom: "1px solid var(--color-border-light)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        transition: "background var(--transition-fast)",
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                            {t.vehicle_name || "Vehicle"} · {t.driver_name || "Driver"}
                                        </div>
                                        <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                            {t.cargo_weight_kg} kg · {t.license_plate}
                                        </div>
                                    </div>
                                    <StatusPill status={t.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Alerts */}
                <div className="ff-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700 }}>System Alerts</h3>
                        {alerts.length > 0 && (
                            <span style={{
                                fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
                                background: "var(--color-danger-bg)", color: "var(--color-danger)",
                                border: "1px solid var(--color-danger-border)",
                            }}>
                                {alerts.length} ACTIVE
                            </span>
                        )}
                    </div>
                    {alerts.length === 0 ? (
                        <div style={{ padding: "32px 20px", textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>All systems clear</div>
                        </div>
                    ) : (
                        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {alerts.map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: "12px 20px",
                                        borderBottom: "1px solid var(--color-border-light)",
                                        borderLeft: `3px solid ${a.severity === "critical" ? "var(--color-danger)" : "var(--color-warning)"}`,
                                    }}
                                >
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px",
                                    }}>
                                        <span style={{
                                            fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                                            padding: "1px 6px", borderRadius: "3px",
                                            background: a.severity === "critical" ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
                                            color: a.severity === "critical" ? "var(--color-danger)" : "var(--color-warning)",
                                        }}>
                                            {a.severity}
                                        </span>
                                        <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>
                                            {a.alert_type?.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                                        {a.message?.length > 120 ? a.message.slice(0, 120) + "…" : a.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
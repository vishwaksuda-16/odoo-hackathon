import React, { useState, useEffect, useCallback } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";
import { driverAPI } from "../lib/api";

function ScoreBar({ value, max = 100, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "var(--color-primary)", borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)", width: "32px", textAlign: "right" }}>{value}</span>
        </div>
    );
}

function Drivers({ showToast, role }) {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [groupBy, setGroupBy] = useState("");

    const loadDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await driverAPI.getAll();
            setDrivers(data.drivers || []);
        } catch (err) {
            showToast("Failed to load drivers: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadDrivers(); }, [loadDrivers]);

    const today = new Date();
    const isExpired = (expiry) => new Date(expiry) < today;
    const isExpiringSoon = (expiry) => {
        const exp = new Date(expiry);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    };

    let displayed = drivers.filter((d) =>
        !search || [d.name, d.license_category, d.status].some((s) =>
            (s || "").toLowerCase().includes(search.toLowerCase())
        )
    );
    if (sortBy === "name") displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "safetyScore") displayed = [...displayed].sort((a, b) => b.safety_score - a.safety_score);
    if (sortBy === "expiry") displayed = [...displayed].sort((a, b) => (a.license_expiry || "").localeCompare(b.license_expiry || ""));

    const expiredCount = drivers.filter((d) => isExpired(d.license_expiry)).length;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px" }}>
                <span className="ff-spinner"></span>
                <span style={{ color: "var(--color-text-muted)" }}>Loading drivers…</span>
            </div>
        );
    }

    return (
        <div>
            {/* Expired license alert */}
            {expiredCount > 0 && (
                <div role="alert" style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", borderRadius: "8px", padding: "11px 16px", marginBottom: "16px", fontSize: "0.875rem", color: "var(--color-text-primary)", display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>⚠</span>
                    <span>
                        <strong>Compliance Alert:</strong> {expiredCount} driver(s) have expired licenses. Assignment to new trips has been blocked until resolved.
                    </span>
                </div>
            )}

            <PageHeader
                title="Driver Performance & Safety"
                search={search} onSearch={setSearch} searchPlaceholder="Search by name, category, status…"
                sortOptions={[
                    { label: "Name (A–Z)", value: "name" },
                    { label: "Safety Score", value: "safetyScore" },
                    { label: "License Expiry", value: "expiry" },
                ]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Status", value: "status" }]}
                groupValue={groupBy} onGroup={setGroupBy}
            />

            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No drivers match your search.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>License Category</th>
                                <th>Expiry Date</th>
                                <th style={{ minWidth: "120px" }}>Safety Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((d) => {
                                const expired = isExpired(d.license_expiry);
                                const expiring = isExpiringSoon(d.license_expiry);
                                const isSuspended = d.status === "suspended";
                                return (
                                    <tr key={d.id} style={expired || isSuspended ? { background: "var(--color-danger-bg)" } : {}}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{
                                                    width: "32px", height: "32px", borderRadius: "50%",
                                                    background: expired || isSuspended ? "var(--color-danger-bg)" : "var(--color-primary-light)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: "13px",
                                                    color: expired || isSuspended ? "var(--color-text-primary)" : "var(--color-primary)",
                                                    flexShrink: 0,
                                                }}>
                                                    {d.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{d.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ textTransform: "capitalize", color: "var(--color-text-secondary)" }}>{d.license_category}</td>
                                        <td>
                                            <span style={{ color: expired || expiring ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: expired || expiring ? 600 : 400 }}>
                                                {d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : "—"}
                                                {expired && <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-text-primary)", borderRadius: "4px", padding: "1px 5px" }}>Expired</span>}
                                                {!expired && expiring && <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-text-secondary)", borderRadius: "4px", padding: "1px 5px" }}>Expiring Soon</span>}
                                            </span>
                                        </td>
                                        <td><ScoreBar value={d.safety_score} color={d.safety_score >= 80 ? "var(--color-primary)" : "var(--color-text-muted)"} /></td>
                                        <td><StatusPill status={d.status} /></td>
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

export default Drivers;
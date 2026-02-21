import React, { useState } from "react";
import StatusPill from "../components/ui/StatusPill";
import PageHeader from "../components/ui/PageHeader";

const INITIAL_DRIVERS = [
    { id: 301, name: "Alex Kumar", license: "TN-2019-0012345", expiry: "2025-08-15", completionRate: 96, safetyScore: 92, compliance: "compliant", trips: 142, status: "on_duty" },
    { id: 302, name: "Priya Mohan", license: "MH-2021-0067890", expiry: "2026-03-22", completionRate: 88, safetyScore: 85, compliance: "compliant", trips: 89, status: "on_duty" },
    { id: 303, name: "Raj Singh", license: "DL-2018-0034567", expiry: "2024-11-30", completionRate: 72, safetyScore: 61, compliance: "non_compliant", trips: 201, status: "off_duty" },
    { id: 304, name: "Sara Nair", license: "KL-2020-0089012", expiry: "2027-01-10", completionRate: 94, safetyScore: 98, compliance: "compliant", trips: 65, status: "on_duty" },
    { id: 305, name: "Vikram Patel", license: "GJ-2019-0045678", expiry: "2025-06-30", completionRate: 81, safetyScore: 77, compliance: "compliant", trips: 118, status: "off_duty" },
];

function ScoreBar({ value, max = 100, color }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "#1d4ed8", borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a", width: "32px", textAlign: "right" }}>{value}</span>
        </div>
    );
}

function Drivers({ showToast }) {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [groupBy, setGroupBy] = useState("");

    let displayed = INITIAL_DRIVERS.filter((d) =>
        !search || [d.name, d.license, d.compliance].some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === "name") displayed = [...displayed].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "safetyScore") displayed = [...displayed].sort((a, b) => b.safetyScore - a.safetyScore);
    if (sortBy === "completionRate") displayed = [...displayed].sort((a, b) => b.completionRate - a.completionRate);
    if (sortBy === "expiry") displayed = [...displayed].sort((a, b) => a.expiry.localeCompare(b.expiry));

    const today = new Date();
    const isExpiringSoon = (expiry) => {
        const exp = new Date(expiry);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    };

    return (
        <div>
            {/* Non-compliant alert */}
            {INITIAL_DRIVERS.some((d) => d.compliance === "non_compliant") && (
                <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "11px 16px", marginBottom: "16px", fontSize: "0.875rem", color: "#b91c1c", display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontWeight: 700 }}>⚠</span>
                    <span>
                        <strong>Compliance Alert:</strong> 1 driver is currently marked as non-compliant. Assignment to new trips has been restricted until resolved.
                    </span>
                </div>
            )}

            <PageHeader
                title="Driver Performance & Safety"
                search={search} onSearch={setSearch} searchPlaceholder="Search by name, license, status…"
                sortOptions={[
                    { label: "Name (A–Z)", value: "name" },
                    { label: "Safety Score", value: "safetyScore" },
                    { label: "Completion Rate", value: "completionRate" },
                    { label: "License Expiry", value: "expiry" },
                ]}
                sortValue={sortBy} onSort={setSortBy}
                groupOptions={[{ label: "Compliance", value: "compliance" }, { label: "Status", value: "status" }]}
                groupValue={groupBy} onGroup={setGroupBy}
            />

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {displayed.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No drivers match your search.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>License No.</th>
                                <th>Expiry Date</th>
                                <th style={{ minWidth: "130px" }}>Completion Rate</th>
                                <th style={{ minWidth: "120px" }}>Safety Score</th>
                                <th>Trips</th>
                                <th>Compliance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((d) => {
                                const noncompliant = d.compliance === "non_compliant";
                                const expiring = isExpiringSoon(d.expiry);
                                return (
                                    <tr key={d.id} style={noncompliant ? { background: "#fff5f5" } : {}}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{
                                                    width: "32px", height: "32px", borderRadius: "50%",
                                                    background: noncompliant ? "#fee2e2" : "#eff6ff",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: "13px",
                                                    color: noncompliant ? "#b91c1c" : "#1d4ed8",
                                                    flexShrink: 0,
                                                }}>
                                                    {d.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{d.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "#475569" }}>{d.license}</td>
                                        <td>
                                            <span style={{ color: expiring ? "#b45309" : "#475569", fontWeight: expiring ? 600 : 400 }}>
                                                {d.expiry}
                                                {expiring && <span style={{ marginLeft: "6px", fontSize: "0.7rem", background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", borderRadius: "4px", padding: "1px 5px" }}>Expiring Soon</span>}
                                            </span>
                                        </td>
                                        <td><ScoreBar value={d.completionRate} color={d.completionRate >= 85 ? "#16a34a" : "#d97706"} /></td>
                                        <td><ScoreBar value={d.safetyScore} color={d.safetyScore >= 80 ? "#1d4ed8" : "#dc2626"} /></td>
                                        <td style={{ fontWeight: 500 }}>{d.trips}</td>
                                        <td><StatusPill status={d.compliance} /></td>
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
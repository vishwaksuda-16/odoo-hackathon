import React from "react";

const STATUS_MAP = {
    available: { bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a", label: "Available" },
    on_trip: { bg: "#eff6ff", text: "#1d4ed8", dot: "#1d4ed8", label: "On Trip" },
    in_shop: { bg: "#fff7ed", text: "#c2410c", dot: "#ea580c", label: "In Shop" },
    retired: { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", label: "Retired" },
    on_duty: { bg: "#f0fdf4", text: "#15803d", dot: "#16a34a", label: "On Duty" },
    off_duty: { bg: "#f8fafc", text: "#64748b", dot: "#94a3b8", label: "Off Duty" },
    compliant: { bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a", label: "Compliant" },
    non_compliant: { bg: "#fef2f2", text: "#b91c1c", dot: "#dc2626", label: "Non-Compliant" },
    pending: { bg: "#fffbeb", text: "#b45309", dot: "#d97706", label: "Pending" },
    completed: { bg: "#f0fdf4", text: "#15803d", dot: "#16a34a", label: "Completed" },
    scheduled: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6", label: "Scheduled" },
    cancelled: { bg: "#fef2f2", text: "#b91c1c", dot: "#dc2626", label: "Cancelled" },
};

function StatusPill({ status }) {
    const cfg = STATUS_MAP[status] || { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", label: status };

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 9px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: cfg.bg,
                color: cfg.text,
                whiteSpace: "nowrap",
            }}
        >
            <span
                style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: cfg.dot,
                    flexShrink: 0,
                }}
            />
            {cfg.label}
        </span>
    );
}

export default StatusPill;
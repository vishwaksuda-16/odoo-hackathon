import React from "react";

const STATUS_MAP = {
    available: { label: "Available", dot: "#16a34a", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "#16a34a" },
    on_trip: { label: "On Trip", dot: "#1d4ed8", bg: "var(--color-primary-light)", border: "var(--color-border)", text: "var(--color-primary)" },
    in_shop: { label: "In Shop", dot: "#d97706", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "#b45309" },
    retired: { label: "Retired", dot: "#94a3b8", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-muted)" },
    on_duty: { label: "On Duty", dot: "#16a34a", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "#16a34a" },
    off_duty: { label: "Off Duty", dot: "#94a3b8", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-muted)" },
    suspended: { label: "Suspended", dot: "#dc2626", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "#dc2626" },
    draft: { label: "Draft", dot: "#64748b", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-secondary)" },
    dispatched: { label: "Dispatched", dot: "#1d4ed8", bg: "var(--color-primary-light)", border: "var(--color-border)", text: "var(--color-primary)" },
    completed: { label: "Completed", dot: "#16a34a", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "#16a34a" },
    cancelled: { label: "Cancelled", dot: "#dc2626", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "#dc2626" },
    compliant: { label: "Compliant", dot: "#16a34a", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "#16a34a" },
    non_compliant: { label: "Non-Compliant", dot: "#dc2626", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "#dc2626" },
    scheduled: { label: "Scheduled", dot: "#0284c7", bg: "var(--color-info-bg)", border: "var(--color-info-border)", text: "#0284c7" },
};

function StatusPill({ status }) {
    const config = STATUS_MAP[status] || {
        label: (status || "unknown").replace(/_/g, " "),
        dot: "#94a3b8",
        bg: "var(--color-surface-raised)",
        border: "var(--color-border)",
        text: "var(--color-text-muted)"
    };

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px 3px 7px",
                borderRadius: "99px",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.text,
                whiteSpace: "nowrap",
            }}
        >
            <span
                style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: config.dot, flexShrink: 0,
                }}
            />
            {config.label}
        </span>
    );
}

export default StatusPill;
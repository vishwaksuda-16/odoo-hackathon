import React from "react";

/* White/black theme: all statuses use grayscale */
const STATUS_MAP = {
    available: { label: "Available", dot: "#333", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-text-primary)" },
    on_trip: { label: "On Trip", dot: "#000", bg: "var(--color-primary-light)", border: "var(--color-border)", text: "var(--color-primary)" },
    in_shop: { label: "In Shop", dot: "#555", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "var(--color-text-secondary)" },
    retired: { label: "Retired", dot: "#999", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-muted)" },
    on_duty: { label: "On Duty", dot: "#333", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-text-primary)" },
    off_duty: { label: "Off Duty", dot: "#999", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-muted)" },
    suspended: { label: "Suspended", dot: "#1a1a1a", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "var(--color-danger)" },
    draft: { label: "Draft", dot: "#666", bg: "var(--color-surface-raised)", border: "var(--color-border)", text: "var(--color-text-secondary)" },
    dispatched: { label: "Dispatched", dot: "#000", bg: "var(--color-primary-light)", border: "var(--color-border)", text: "var(--color-primary)" },
    completed: { label: "Completed", dot: "#333", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-text-primary)" },
    cancelled: { label: "Cancelled", dot: "#1a1a1a", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "var(--color-danger)" },
    compliant: { label: "Compliant", dot: "#333", bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "var(--color-text-primary)" },
    non_compliant: { label: "Non-Compliant", dot: "#1a1a1a", bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "var(--color-danger)" },
    scheduled: { label: "Scheduled", dot: "#444", bg: "var(--color-info-bg)", border: "var(--color-info-border)", text: "var(--color-info)" },
};

function StatusPill({ status }) {
    const config = STATUS_MAP[status] || {
        label: (status || "unknown").replace(/_/g, " "),
        dot: "#999",
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
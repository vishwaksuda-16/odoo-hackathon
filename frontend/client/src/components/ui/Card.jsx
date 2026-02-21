import React from "react";

function Card({ title, value, subtitle, icon, color = "var(--color-primary)", trend }) {
    return (
        <div
            className="ff-card"
            style={{ padding: "20px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}
        >
            <div>
                <div style={{
                    fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px",
                }}>
                    {title}
                </div>
                <div style={{
                    fontSize: "1.75rem", fontWeight: 900, color: "var(--color-text-primary)",
                    letterSpacing: "-0.03em", lineHeight: 1,
                }}>
                    {value}
                </div>
                {subtitle && (
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                        {subtitle}
                    </div>
                )}
                {trend !== undefined && trend !== null && (
                    <div style={{
                        fontSize: "0.6875rem", fontWeight: 700, marginTop: "8px",
                        color: trend >= 0 ? "var(--color-success)" : "var(--color-danger)",
                        display: "flex", alignItems: "center", gap: "3px",
                    }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            {trend >= 0
                                ? <path d="M6 2L10 7H2L6 2Z" />
                                : <path d="M6 10L2 5H10L6 10Z" />}
                        </svg>
                        {trend >= 0 ? `+${trend}%` : `${trend}%`}
                    </div>
                )}
            </div>

        </div>
    );
}

export default Card;
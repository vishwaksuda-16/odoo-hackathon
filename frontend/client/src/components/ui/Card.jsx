import React from "react";

function Card({ title, value, subtitle, icon, color = "var(--color-primary)", trend }) {
    return (
        <div
            style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
                transition: "box-shadow 200ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
            <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                    {title}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
                    {value}
                </div>
                {subtitle && (
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                        {subtitle}
                    </div>
                )}
                {trend !== undefined && trend !== null && (
                    <div style={{
                        fontSize: "0.75rem", fontWeight: 600, marginTop: "6px",
                        color: trend >= 0 ? "var(--color-success)" : "var(--color-danger)",
                    }}>
                        {trend >= 0 ? `▲ +${trend}%` : `▼ ${trend}%`}
                    </div>
                )}
            </div>
            <div
                style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: `${color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", flexShrink: 0,
                }}
            >
                {icon}
            </div>
        </div>
    );
}

export default Card;
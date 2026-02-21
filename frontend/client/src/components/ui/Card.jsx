import React from "react";

/**
 * Card – KPI summary card.
 * Props: title, value, subtitle, icon (SVG string or element), color, trend
 */
function Card({ title, value, subtitle, icon, color = "#1d4ed8", trend }) {
    return (
        <div
            style={{
                flex: 1,
                minWidth: "160px",
                padding: "18px 20px",
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {title}
                </span>
                {icon && (
                    <span
                        style={{
                            width: "32px", height: "32px",
                            background: `${color}18`,
                            borderRadius: "8px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: color, fontSize: "16px",
                        }}
                    >
                        {icon}
                    </span>
                )}
            </div>

            {/* Value */}
            <div style={{ fontSize: "1.625rem", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                {value}
            </div>

            {/* Subtitle / Trend */}
            {(subtitle || trend !== undefined) && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {subtitle && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{subtitle}</span>
                    )}
                    {trend !== undefined && (
                        <span
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: trend >= 0 ? "#16a34a" : "#dc2626",
                            }}
                        >
                            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default Card;
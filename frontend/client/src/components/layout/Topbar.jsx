import React from "react";

const PAGE_LABELS = {
    dashboard: "Dashboard",
    vehicles: "Vehicle Registry",
    trips: "Trip Dispatcher",
    maintenance: "Maintenance & Service",
    expenses: "Expenses & Fuel Logging",
    drivers: "Driver Performance & Safety",
    analytics: "Operational Analytics",
};

function Topbar({ currentPage, userName = "Fleet Admin", role = "Fleet Manager" }) {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-IN", {
        weekday: "short", month: "short", day: "2-digit", year: "numeric",
    });

    return (
        <header
            style={{
                height: "56px",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                gap: "16px",
                flexShrink: 0,
                zIndex: 50,
            }}
        >
            {/* Page Title */}
            <h1
                style={{
                    flex: 1,
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                }}
            >
                {PAGE_LABELS[currentPage] || "FleetFlow"}
            </h1>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Date */}
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {formatted}
                </span>

                {/* Divider */}
                <div style={{ width: "1px", height: "22px", background: "#e2e8f0" }} />

                {/* User chip */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                        style={{
                            width: "30px", height: "30px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 700, fontSize: "13px",
                        }}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a" }}>
                            {userName}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>{role}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Topbar;
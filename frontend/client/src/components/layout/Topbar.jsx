import React from "react";

const PAGE_TITLES = {
    dashboard: "Dashboard",
    vehicles: "Fleet Registry",
    drivers: "Driver Management",
    trips: "Trip Dispatcher",
    maintenance: "Maintenance Center",
    expenses: "Expense Tracker",
    analytics: "Analytics Hub",
};

function Topbar({ currentPage, user, onToggleSidebar, onToggleTheme, darkMode, onLogout }) {
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const initials = (user?.username || "U")
        .split(/[_\s]+/)
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .slice(0, 2);

    return (
        <header
            style={{
                height: "var(--topbar-height)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                flexShrink: 0,
                zIndex: 50,
                gap: "16px",
            }}
        >
            {/* Left: Toggle + Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <button
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-secondary)",
                        padding: "6px",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
                        <rect y="9" width="14" height="2" rx="1" fill="currentColor" />
                        <rect y="15" width="18" height="2" rx="1" fill="currentColor" />
                    </svg>
                </button>
                <div>
                    <h1 style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>
                        {PAGE_TITLES[currentPage] || "FleetFlow"}
                    </h1>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{today}</div>
                </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Theme toggle */}
                <button
                    onClick={onToggleTheme}
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    title={darkMode ? "Light mode" : "Dark mode"}
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-surface-raised)",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                    }}
                >
                    {darkMode ? "☀️" : "🌙"}
                </button>

                {/* User chip */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 12px 6px 6px",
                        borderRadius: "99px",
                        background: "var(--color-surface-raised)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <div
                        style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.6875rem",
                            color: "#fff",
                            flexShrink: 0,
                        }}
                    >
                        {initials}
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            {user?.username || "User"}
                        </div>
                        <div style={{ fontSize: "0.5625rem", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                            {(user?.role || "").replace(/_/g, " ")}
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    aria-label="Sign out"
                    title="Sign out"
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-danger-bg)",
                        border: "1px solid var(--color-danger-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--color-danger)",
                        fontSize: "14px",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default Topbar;
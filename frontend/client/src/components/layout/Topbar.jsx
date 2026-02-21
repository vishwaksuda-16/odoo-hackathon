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

function Topbar({
    currentPage,
    userName = "Fleet Admin",
    role = "Fleet Manager",
    onLogout,
    theme,
    onToggleTheme,
    sidebarCollapsed,
    onToggleSidebar,
}) {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-IN", {
        weekday: "short", month: "short", day: "2-digit", year: "numeric",
    });

    return (
        <header
            style={{
                height: "56px",
                backgroundColor: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
                gap: "16px",
                flexShrink: 0,
                zIndex: 50,
            }}
        >
            {/* Hamburger – always visible */}
            <button
                onClick={onToggleSidebar}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                    borderRadius: "6px",
                    flexShrink: 0,
                }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            </button>

            {/* Page Title */}
            <h1
                style={{
                    flex: 1,
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                }}
            >
                {PAGE_LABELS[currentPage] || "FleetFlow"}
            </h1>

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Date */}
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {formatted}
                </span>

                {/* Divider */}
                <div style={{ width: "1px", height: "22px", background: "var(--color-border)" }} />

                {/* Dark Mode Toggle */}
                <button
                    onClick={onToggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Light mode" : "Dark mode"}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "5px",
                        borderRadius: "6px",
                        flexShrink: 0,
                    }}
                >
                    {theme === "dark" ? (
                        /* Sun icon */
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="9" y1="1" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="1" y1="9" x2="3" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="15" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="3.3" y1="3.3" x2="4.7" y2="4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="13.3" y1="13.3" x2="14.7" y2="14.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="3.3" y1="14.7" x2="4.7" y2="13.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="13.3" y1="4.7" x2="14.7" y2="3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ) : (
                        /* Moon icon */
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M15 10.5A6.5 6.5 0 017.5 3 6.5 6.5 0 109 15.5a6.5 6.5 0 006-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>

                {/* Divider */}
                <div style={{ width: "1px", height: "22px", background: "var(--color-border)" }} />

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
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            {userName}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{role}</span>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={onLogout}
                    aria-label="Sign out"
                    title="Sign out"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        background: "none",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        color: "var(--color-danger)",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M5 1H3a2 2 0 00-2 2v8a2 2 0 002 2h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sign out
                </button>
            </div>
        </header>
    );
}

export default Topbar;
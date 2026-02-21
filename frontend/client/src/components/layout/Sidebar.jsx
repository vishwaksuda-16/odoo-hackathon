import React from "react";

const NAV_ITEMS = [
    {
        key: "dashboard",
        label: "Dashboard",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    {
        key: "vehicles",
        label: "Vehicle Registry",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="6" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 6L5.5 2H12.5L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="4.5" cy="14" r="1.5" fill="currentColor" />
                <circle cx="13.5" cy="14" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        key: "trips",
        label: "Trip Dispatcher",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9h14M12 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        key: "maintenance",
        label: "Maintenance",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M14.5 3.5l-2 2-1.5-1.5 2-2A4 4 0 003.5 7.5l7 7a4 4 0 005.5-5.5l-1.5-5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        key: "expenses",
        label: "Expenses",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="1.5" y1="7" x2="16.5" y2="7" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    {
        key: "drivers",
        label: "Drivers",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: "analytics",
        label: "Analytics",
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="10" width="3" height="6" rx="1" fill="currentColor" opacity="0.5" />
                <rect x="7.5" y="6" width="3" height="10" rx="1" fill="currentColor" opacity="0.75" />
                <rect x="13" y="2" width="3" height="14" rx="1" fill="currentColor" />
            </svg>
        ),
    },
];

function Sidebar({ setPage, currentPage, collapsed, allowedPages = [] }) {
    const filteredItems = NAV_ITEMS.filter((item) => allowedPages.includes(item.key));

    return (
        <aside
            aria-label="Navigation sidebar"
            style={{
                width: collapsed ? "64px" : "220px",
                minWidth: collapsed ? "64px" : "220px",
                height: "100vh",
                backgroundColor: "var(--sidebar-bg)",
                display: "flex",
                flexDirection: "column",
                transition: "width 200ms ease, min-width 200ms ease",
                overflow: "hidden",
                zIndex: 100,
                flexShrink: 0,
            }}
        >
            {/* Branding */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    height: "56px",
                    padding: "0 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    gap: "10px",
                    flexShrink: 0,
                }}
            >
                {/* Logo mark */}
                <div
                    style={{
                        width: "32px", height: "32px", borderRadius: "8px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontWeight: 800, fontSize: "15px", color: "#fff",
                    }}
                >
                    F
                </div>
                {!collapsed && (
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", whiteSpace: "nowrap" }}>
                        FleetFlow
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav aria-label="Main navigation" style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
                <ul role="list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {filteredItems.map((item) => {
                        const isActive = currentPage === item.key;
                        return (
                            <li key={item.key}>
                                <button
                                    onClick={() => setPage(item.key)}
                                    aria-current={isActive ? "page" : undefined}
                                    title={collapsed ? item.label : undefined}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        width: "100%",
                                        padding: collapsed ? "10px 0" : "10px 14px",
                                        justifyContent: collapsed ? "center" : "flex-start",
                                        background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                                        border: "none",
                                        borderRadius: "0",
                                        color: isActive ? "#fff" : "var(--sidebar-text)",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        fontWeight: isActive ? 600 : 400,
                                        textAlign: "left",
                                        whiteSpace: "nowrap",
                                        transition: "background 150ms ease, color 150ms ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                                            e.currentTarget.style.color = "#e2e8f0";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--sidebar-text)";
                                        }
                                    }}
                                >
                                    <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;
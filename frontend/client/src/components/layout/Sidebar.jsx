import React from "react";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "D" },
    { id: "vehicles", label: "Vehicles", icon: "V" },
    { id: "drivers", label: "Drivers", icon: "DR" },
    { id: "trips", label: "Trips", icon: "T" },
    { id: "maintenance", label: "Maintenance", icon: "M" },
    { id: "expenses", label: "Expenses", icon: "E" },
    { id: "analytics", label: "Analytics", icon: "A" },
    { id: "exports", label: "Exports", icon: "↓" },
];

function Sidebar({ currentPage, onNavigate, collapsed, allowedPages = [] }) {
    const visibleItems = NAV_ITEMS.filter(
        (item) => allowedPages.length === 0 || allowedPages.includes(item.id)
    );

    return (
        <aside
            style={{
                width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
                height: "100vh",
                background: "var(--sidebar-bg)",
                display: "flex",
                flexDirection: "column",
                transition: "width var(--transition-base)",
                borderRight: "1px solid var(--sidebar-border)",
                overflow: "hidden",
                flexShrink: 0,
                zIndex: 100,
            }}
        >
            {/* Brand */}
            <div
                style={{
                    height: "var(--topbar-height)",
                    display: "flex",
                    alignItems: "center",
                    padding: collapsed ? "0 16px" : "0 20px",
                    gap: "12px",
                    borderBottom: "1px solid var(--sidebar-border)",
                    flexShrink: 0,
                }}
            >
    <div>
      <img
        src='./fleetflow.png'
        alt="logo"
        width={50}
        height={50  }
      />
    </div>
                {!collapsed && (
                    <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                        <div
                            style={{
                                fontSize: "1.0625rem",
                                fontWeight: 800,
                                color: "var(--sidebar-text-active)",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.2,
                            }}
                        >
                            FleetFlow
                        </div>
                        <div
                            style={{
                                fontSize: "0.625rem",
                                fontWeight: 500,
                                color: "var(--sidebar-text)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                opacity: 0.6,
                            }}
                        >
                            Fleet Management
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav
                style={{
                    flex: 1,
                    padding: "12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {!collapsed && (
                    <div
                        style={{
                            fontSize: "0.5625rem",
                            fontWeight: 700,
                            color: "var(--sidebar-text)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "8px 12px 6px",
                            opacity: 0.4,
                        }}
                    >
                        Navigation
                    </div>
                )}
                {visibleItems.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: collapsed ? "11px 0" : "10px 14px",
                                justifyContent: collapsed ? "center" : "flex-start",
                                background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                                color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "0.8125rem",
                                fontWeight: isActive ? 600 : 500,
                                cursor: "pointer",
                                transition: "all var(--transition-fast)",
                                width: "100%",
                                textAlign: "left",
                                position: "relative",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.background = "var(--sidebar-hover)";
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                        >
                            {isActive && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: collapsed ? "50%" : "0",
                                        top: collapsed ? "auto" : "50%",
                                        bottom: collapsed ? "-2px" : "auto",
                                        transform: collapsed ? "translateX(-50%)" : "translateY(-50%)",
                                        width: collapsed ? "20px" : "3px",
                                        height: collapsed ? "3px" : "20px",
                                        borderRadius: "2px",
                                        background: "var(--sidebar-text-active)",
                                        boxShadow: "0 0 6px rgba(255,255,255,0.2)",
                                    }}
                                />
                            )}
                            <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div
                    style={{
                        padding: "14px 20px",
                        borderTop: "1px solid var(--sidebar-border)",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#10b981",
                                boxShadow: "0 0 6px rgba(16, 185, 129, 0.5)",
                            }}
                        />
                        <span style={{ fontSize: "0.6875rem", color: "var(--sidebar-text)", opacity: 0.7 }}>
                            System Online
                        </span>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
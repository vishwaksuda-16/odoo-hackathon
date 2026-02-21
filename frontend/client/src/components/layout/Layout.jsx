import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastContainer } from "../ui/Toast";

function Layout({
    children,
    setPage,
    currentPage,
    userName,
    role,
    userRole,
    allowedPages,
    toasts,
    dismissToast,
    onLogout,
    theme,
    onToggleTheme,
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

    // Build a user-like object for Topbar
    const user = { username: userName, role: userRole };

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Sidebar
                onNavigate={setPage}
                currentPage={currentPage}
                collapsed={sidebarCollapsed}
                allowedPages={allowedPages}
            />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Topbar
                    currentPage={currentPage}
                    user={user}
                    onLogout={onLogout}
                    darkMode={theme === "dark"}
                    onToggleTheme={onToggleTheme}
                    onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
                />

                <main
                    id="main-content"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "24px",
                        backgroundColor: "var(--color-bg)",
                    }}
                >
                    {children}
                </main>
            </div>

            {/* Global Toast Notifications */}
            <ToastContainer toasts={toasts || []} onDismiss={dismissToast || (() => { })} />
        </div>
    );
}

export default Layout;
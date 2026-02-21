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

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Sidebar
                setPage={setPage}
                currentPage={currentPage}
                collapsed={sidebarCollapsed}
                allowedPages={allowedPages}
            />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Topbar
                    currentPage={currentPage}
                    userName={userName}
                    role={role}
                    onLogout={onLogout}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    sidebarCollapsed={sidebarCollapsed}
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
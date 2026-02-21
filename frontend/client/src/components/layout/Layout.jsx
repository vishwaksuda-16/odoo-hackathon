import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastContainer } from "../ui/Toast";

function Layout({ children, setPage, currentPage, userName, role, toasts, dismissToast }) {
    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Sidebar setPage={setPage} currentPage={currentPage} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Topbar currentPage={currentPage} userName={userName} role={role} />

                <main
                    id="main-content"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "24px",
                        backgroundColor: "#f0f4f8",
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
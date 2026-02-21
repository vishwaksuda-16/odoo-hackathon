import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Left Sidebar */}
            <Sidebar />

            {/* Right Main Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Topbar />
                <div style={{ padding: "24px", flex: 1 }}>{children}</div>
            </div>
        </div>
    );
}

export default Layout;
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children, setPage }) {
    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                width: "100vw",
                backgroundColor: "#fafafa",
            }}
        >
            <Sidebar setPage={setPage} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Topbar />
                <div style={{ padding: "24px", flex: 1, color: "#000" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Layout;
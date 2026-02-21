import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Topbar />
                <div
                    style={{
                        padding: "24px",
                        flex: 1,
                        color: "#000",
                        backgroundColor: "#fafafa",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Layout;
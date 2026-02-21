import React from "react";

function Layout({ children }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {children}
        </div>
    );
}

export default Layout;
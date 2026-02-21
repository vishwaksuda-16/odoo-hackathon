import React from "react";

function Topbar() {
    return (
        <div
            style={{
                height: "56px",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
            }}
        >
            <strong>Dashboard</strong>
        </div>
    );
}

export default Topbar;
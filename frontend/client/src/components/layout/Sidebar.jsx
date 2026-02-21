import React from "react";

function Sidebar() {
    return (
        <div
            style={{
                width: "220px",
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRight: "1px solid #ddd",
                color: "#000",          // ✅ ADD THIS
            }}
        >
            <h3 style={{ marginBottom: "16px" }}>FleetFlow</h3>

            <ul style={{ listStyle: "none", padding: 0, lineHeight: "2" }}>
                <li>Dashboard</li>
                <li>Vehicle Registry</li>
                <li>Trip Dispatcher</li>
                <li>Maintenance</li>
                <li>Expenses</li>
                <li>Drivers</li>
                <li>Analytics</li>
            </ul>
        </div>
    );
}

export default Sidebar;
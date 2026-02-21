import React from "react";

function Sidebar({ setPage }) {
    return (
        <div
            style={{
                width: "220px",
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRight: "1px solid #ddd",
                color: "#000",
            }}
        >
            <h3 style={{ marginBottom: "16px" }}>FleetFlow</h3>

            <ul style={{ listStyle: "none", padding: 0, lineHeight: "2" }}>
                <li onClick={() => setPage("dashboard")} style={{ cursor: "pointer" }}>
                    Dashboard
                </li>
                <li onClick={() => setPage("vehicles")} style={{ cursor: "pointer" }}>
                    Vehicle Registry
                </li>
                <li onClick={() => setPage("trips")} style={{ cursor: "pointer" }}>
                    Trip Dispatcher
                </li>
                <li onClick={() => setPage("maintenance")} style={{ cursor: "pointer" }}>
                    Maintenance
                </li>
                <li onClick={() => setPage("expenses")} style={{ cursor: "pointer" }}>
                    Expenses
                </li>
                <li onClick={() => setPage("drivers")} style={{ cursor: "pointer" }}>
                    Drivers
                </li>
                <li onClick={() => setPage("analytics")} style={{ cursor: "pointer" }}>
                    Analytics
                </li>
            </ul>
        </div>
    );
}

export default Sidebar;
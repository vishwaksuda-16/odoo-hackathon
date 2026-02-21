import React from "react";

function Dashboard() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>Dashboard</h2>

            {/* KPI Cards Row */}
            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        padding: "16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd",
                    }}
                >
                    <strong>Active Fleet</strong>
                    <p>0</p>
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: "16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd",
                    }}
                >
                    <strong>Maintenance Alerts</strong>
                    <p>0</p>
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: "16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd",
                    }}
                >
                    <strong>Pending Cargo</strong>
                    <p>0</p>
                </div>
            </div>

            {/* Placeholder for table/content */}
            <div
                style={{
                    height: "200px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                }}
            >
                <p style={{ padding: "16px" }}>
                    Table / Data will appear here
                </p>
            </div>
        </div>
    );
}

export default Dashboard;
import React from "react";
import Card from "../components/ui/Card";

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
                <Card title="Active Fleet" value="0" />
                <Card title="Maintenance Alerts" value="0" />
                <Card title="Pending Cargo" value="0" />
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
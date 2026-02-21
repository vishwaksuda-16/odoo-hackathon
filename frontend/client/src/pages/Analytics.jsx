import React from "react";
import Card from "../components/ui/Card";

function Analytics() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>
                Operational Analytics & Financial Reports
            </h2>

            {/* KPI Summary Row */}
            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <Card title="Fuel Efficiency (km/L)" value="--" />
                <Card title="Vehicle ROI" value="--" />
                <Card title="Monthly Cost" value="--" />
            </div>

            {/* Charts / Reports Placeholder */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    padding: "16px",
                    height: "200px",
                }}
            >
                <p>Charts and reports will appear here</p>
            </div>
        </div>
    );
}

export default Analytics;
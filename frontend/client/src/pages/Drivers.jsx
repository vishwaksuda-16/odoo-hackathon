import React from "react";
import StatusPill from "../components/ui/StatusPill";

function Drivers() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>
                Driver Performance & Safety
            </h2>

            {/* Drivers Table */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    padding: "16px",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "8px" }}>Driver ID</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Name</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>
                                License Expiry
                            </th>
                            <th style={{ textAlign: "left", padding: "8px" }}>
                                Safety Score
                            </th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px" }}>301</td>
                            <td style={{ padding: "8px" }}>Alex</td>
                            <td style={{ padding: "8px" }}>2025-08-15</td>
                            <td style={{ padding: "8px" }}>92</td>
                            <td style={{ padding: "8px" }}>
                                <StatusPill status="on_duty" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Drivers;
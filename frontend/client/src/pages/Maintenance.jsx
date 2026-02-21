import React from "react";
import StatusPill from "../components/ui/StatusPill";

function Maintenance() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>
                Maintenance & Service Logs
            </h2>

            {/* Add Service Form */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    padding: "16px",
                    marginBottom: "24px",
                }}
            >
                <strong>Add Service</strong>

                <div style={{ marginTop: "16px" }}>
                    <input
                        placeholder="Vehicle"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Service / Issue"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Cost"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Date"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />

                    <button>Add Service</button>
                </div>
            </div>

            {/* Maintenance Logs Table */}
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
                            <th style={{ textAlign: "left", padding: "8px" }}>Log ID</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Vehicle</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Service</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Cost</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px" }}>501</td>
                            <td style={{ padding: "8px" }}>Truck A</td>
                            <td style={{ padding: "8px" }}>Oil Change</td>
                            <td style={{ padding: "8px" }}>₹2,000</td>
                            <td style={{ padding: "8px" }}>2024-06-01</td>
                            <td style={{ padding: "8px" }}>
                                <StatusPill status="in_shop" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Maintenance;
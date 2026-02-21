import React from "react";
import StatusPill from "../components/ui/StatusPill";

function Vehicles() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>Vehicle Registry</h2>

            {/* Add Vehicle Placeholder */}
            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    marginBottom: "24px",
                }}
            >
                <strong>Add Vehicle</strong>
                <p style={{ marginTop: "8px" }}>
                    Vehicle form will be added here
                </p>
            </div>

            {/* Vehicles Table */}
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
                            <th style={{ textAlign: "left", padding: "8px" }}>ID</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Model</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Capacity</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Odometer</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px" }}>1</td>
                            <td style={{ padding: "8px" }}>Truck A</td>
                            <td style={{ padding: "8px" }}>5000 kg</td>
                            <td style={{ padding: "8px" }}>12000</td>
                            <td style={{ padding: "8px" }}>
                                <StatusPill status="available" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Vehicles;
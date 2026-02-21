import React from "react";
import StatusPill from "../components/ui/StatusPill";

function Trips() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>Trip Dispatcher</h2>

            {/* Trip Creation Form */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    padding: "16px",
                    marginBottom: "24px",
                }}
            >
                <strong>Create Trip</strong>

                <div style={{ marginTop: "16px" }}>
                    <input
                        placeholder="Select Vehicle"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Select Driver"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Origin"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Destination"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Cargo Weight (kg)"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />

                    <button>Create Trip</button>
                </div>
            </div>

            {/* Trips Table */}
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
                            <th style={{ textAlign: "left", padding: "8px" }}>Trip ID</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Vehicle</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Driver</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Origin</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Destination</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px" }}>101</td>
                            <td style={{ padding: "8px" }}>Truck A</td>
                            <td style={{ padding: "8px" }}>John</td>
                            <td style={{ padding: "8px" }}>Chennai</td>
                            <td style={{ padding: "8px" }}>Bangalore</td>
                            <td style={{ padding: "8px" }}>
                                <StatusPill status="on_trip" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Trips;
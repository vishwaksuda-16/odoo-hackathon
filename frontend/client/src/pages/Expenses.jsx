import React from "react";

function Expenses() {
    return (
        <div>
            {/* Page Title */}
            <h2 style={{ marginBottom: "16px" }}>
                Expenses & Fuel Logging
            </h2>

            {/* Add Expense Form */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #ddd",
                    padding: "16px",
                    marginBottom: "24px",
                }}
            >
                <strong>Add Expense</strong>

                <div style={{ marginTop: "16px" }}>
                    <input
                        placeholder="Trip / Vehicle"
                        style={{ display: "block", marginBottom: "8px", width: "100%" }}
                    />
                    <input
                        placeholder="Fuel (liters)"
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

                    <button>Add Expense</button>
                </div>
            </div>

            {/* Expenses Table */}
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
                            <th style={{ textAlign: "left", padding: "8px" }}>Expense ID</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Trip / Vehicle</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Fuel (L)</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Cost</th>
                            <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "8px" }}>801</td>
                            <td style={{ padding: "8px" }}>Trip 101 / Truck A</td>
                            <td style={{ padding: "8px" }}>45</td>
                            <td style={{ padding: "8px" }}>₹4,500</td>
                            <td style={{ padding: "8px" }}>2024-06-02</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Expenses;
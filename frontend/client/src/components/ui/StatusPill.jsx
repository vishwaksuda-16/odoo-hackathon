import React from "react";

function StatusPill({ status }) {
    let backgroundColor = "#e0e0e0";
    let textColor = "#000";

    if (status === "available") {
        backgroundColor = "#d1fae5";
        textColor = "#065f46";
    } else if (status === "on_trip") {
        backgroundColor = "#dbeafe";
        textColor = "#1e40af";
    } else if (status === "in_shop") {
        backgroundColor = "#ffedd5";
        textColor = "#9a3412";
    } else if (status === "retired") {
        backgroundColor = "#e5e7eb";
        textColor = "#374151";
    }

    return (
        <span
            style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                backgroundColor,
                color: textColor,
                display: "inline-block",
            }}
        >
            {status}
        </span>
    );
}

export default StatusPill;
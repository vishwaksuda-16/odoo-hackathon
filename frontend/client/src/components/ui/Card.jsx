import React from "react";

function Card({ title, value }) {
    return (
        <div
            style={{
                flex: 1,
                padding: "16px",
                backgroundColor: "#ffffff",
                border: "1px solid #ddd",
            }}
        >
            <strong>{title}</strong>
            <p>{value}</p>
        </div>
    );
}

export default Card;
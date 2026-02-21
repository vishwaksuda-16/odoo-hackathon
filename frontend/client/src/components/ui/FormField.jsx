import React from "react";

function FormField({ label, required, htmlFor, error, children }) {
    return (
        <div style={{ marginBottom: "14px" }}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginBottom: "5px",
                    }}
                >
                    {label}
                    {required && <span style={{ color: "var(--color-danger)", marginLeft: "3px" }}>*</span>}
                </label>
            )}
            {children}
            {error && (
                <div
                    role="alert"
                    style={{
                        fontSize: "0.75rem",
                        color: "var(--color-danger)",
                        marginTop: "4px",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}

export default FormField;

import React from "react";

/**
 * FormField – Reusable labeled form control with inline validation error.
 *
 * Props:
 *   label      string   – visible label text
 *   required   bool     – show asterisk, adds aria-required
 *   error      string   – error message (shown below input)
 *   htmlFor    string   – links label to input id
 *   children   node     – the actual <input>, <select>, or <textarea>
 */
function FormField({ label, required = false, error, htmlFor, children }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
            {label && (
                <label
                    htmlFor={htmlFor}
                    style={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: error ? "#dc2626" : "#475569",
                    }}
                >
                    {label}
                    {required && (
                        <span aria-hidden="true" style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>
                    )}
                </label>
            )}
            {children}
            {error && (
                <span
                    role="alert"
                    style={{
                        fontSize: "0.75rem",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    {/* small warning triangle */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M6 1L11 10H1L6 1Z" stroke="#dc2626" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                        <line x1="6" y1="5" x2="6" y2="7.5" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
                        <circle cx="6" cy="9" r="0.6" fill="#dc2626" />
                    </svg>
                    {error}
                </span>
            )}
        </div>
    );
}

export default FormField;

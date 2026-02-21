import React, { useState, useCallback, useRef } from "react";

const TOAST_STYLES = {
    success: { bg: "var(--color-success-bg)", border: "var(--color-success-border)", text: "#16a34a", icon: "✓" },
    error: { bg: "var(--color-danger-bg)", border: "var(--color-danger-border)", text: "#dc2626", icon: "✕" },
    warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", text: "#b45309", icon: "⚠" },
    info: { bg: "var(--color-info-bg)", border: "var(--color-info-border)", text: "#0284c7", icon: "ℹ" },
};

function Toast({ message, type = "info", onDismiss }) {
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;

    return (
        <div
            role="alert"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: "8px",
                boxShadow: "var(--shadow-lg)",
                minWidth: "300px",
                maxWidth: "420px",
                animation: "ff-toast-in 300ms ease",
            }}
        >
            <span style={{ fontWeight: 700, fontSize: "14px", color: s.text, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: "0.875rem", color: s.text, lineHeight: 1.4 }}>{message}</span>
            <button
                onClick={onDismiss}
                aria-label="Dismiss notification"
                style={{
                    background: "none", border: "none", color: s.text,
                    fontSize: "18px", cursor: "pointer", padding: "2px", lineHeight: 1,
                    opacity: 0.6, flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
}

function ToastContainer({ toasts, onDismiss }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div
            aria-live="polite"
            style={{
                position: "fixed",
                top: "72px",
                right: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                zIndex: 1000,
            }}
        >
            {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => onDismiss(t.id)} />
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const counterRef = useRef(0);

    const showToast = useCallback((message, type = "info") => {
        const id = ++counterRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, showToast, dismissToast };
}

export { Toast, ToastContainer, useToast };
export default Toast;

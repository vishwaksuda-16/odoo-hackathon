import React, { useState, useCallback, useEffect } from "react";

/* ── Toast Component ── */
function Toast({ id, type, message, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(id), 4000);
        return () => clearTimeout(t);
    }, [id, onDismiss]);

    const icons = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ",
    };

    const colors = {
        success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "#16a34a" },
        error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", icon: "#dc2626" },
        warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", icon: "#d97706" },
        info: { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", icon: "#0284c7" },
    };

    const c = colors[type] || colors.info;

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 16px",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                minWidth: "300px",
                maxWidth: "420px",
                animation: "toast-in 200ms ease",
            }}
        >
            <span style={{ color: c.icon, fontWeight: 700, fontSize: "16px", lineHeight: "20px", flexShrink: 0 }}>
                {icons[type]}
            </span>
            <p style={{ flex: 1, fontSize: "0.875rem", color: c.text, lineHeight: "1.5", margin: 0 }}>
                {message}
            </p>
            <button
                onClick={() => onDismiss(id)}
                aria-label="Dismiss notification"
                style={{
                    background: "none",
                    border: "none",
                    color: c.text,
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: "1",
                    padding: "0 2px",
                    opacity: 0.6,
                    flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
}

/* ── Toast Container ── */
export function ToastContainer({ toasts, onDismiss }) {
    return (
        <>
            <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <div
                aria-label="Notifications"
                style={{
                    position: "fixed",
                    top: "72px",
                    right: "20px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {toasts.map((t) => (
                    <Toast key={t.id} {...t} onDismiss={onDismiss} />
                ))}
            </div>
        </>
    );
}

/* ── useToast Hook ── */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, showToast, dismissToast };
}

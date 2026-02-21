import React, { useState } from "react";
import { authAPI } from "../lib/api";

function Login({ onLogin, onGoRegister, onSwitchToRegister, showToast }) {
    const [form, setForm] = useState({ login: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.login || !form.password) {
            setError("Username/email and password are required.");
            return;
        }
        setLoading(true);
        try {
            const data = await authAPI.login(form.login, form.password);
            if (data.success) {
                onLogin({
                    user: data.user,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                });
            }
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background pattern */}
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
            }} />
            <div style={{
                position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px",
                borderRadius: "50%", background: "rgba(99, 102, 241, 0.06)", filter: "blur(80px)",
            }} />

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.04)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)",
                    padding: "40px 36px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            margin: "0 auto 16px",
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            fontWeight: 900,
                            color: "#fff",
                            boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
                        }}
                    >
                        F
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
                        Sign in to your FleetFlow account
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            color: "#fca5a5",
                            fontSize: "0.8125rem",
                            marginBottom: "18px",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Username or Email
                        </label>
                        <input
                            type="text"
                            value={form.login}
                            onChange={(e) => setForm({ ...form, login: e.target.value })}
                            placeholder="admin_mgr"
                            autoComplete="username"
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#fff",
                                fontSize: "0.9375rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.06)",
                                color: "#fff",
                                fontSize: "0.9375rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "10px",
                            background: loading ? "rgba(99, 102, 241, 0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#fff",
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 200ms ease",
                        }}
                    >
                        {loading && <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
                        Don't have an account?{" "}
                        <button
                            onClick={onSwitchToRegister || onGoRegister}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#818cf8",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "0.8125rem",
                            }}
                        >
                            Create one
                        </button>
                    </span>
                </div>

                {/* Demo hint */}
                <div
                    style={{
                        marginTop: "24px",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: "rgba(99, 102, 241, 0.06)",
                        border: "1px solid rgba(99, 102, 241, 0.15)",
                    }}
                >
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                        Demo Credentials
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)" }}>
                        <span><strong style={{ color: "rgba(255,255,255,0.7)" }}>Manager:</strong> admin_mgr</span>
                        <span><strong style={{ color: "rgba(255,255,255,0.7)" }}>Dispatcher:</strong> dispatch_ops</span>
                        <span><strong style={{ color: "rgba(255,255,255,0.7)" }}>Safety:</strong> safety_lead</span>
                        <span><strong style={{ color: "rgba(255,255,255,0.7)" }}>Analyst:</strong> data_analyst</span>
                    </div>
                    <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
                        Password for all: <strong style={{ color: "rgba(255,255,255,0.6)" }}>fleet123</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

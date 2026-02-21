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
                background: "#000000",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "20px",
                    background: "#ffffff",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
                    padding: "40px 36px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            width: "150px",
                            height: "56px",
                            margin: "0 auto 16px",
                            borderRadius: "16px",
                            background: "#000000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            fontWeight: 900,
                            color: "#fff",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        FleetFlow
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#000", letterSpacing: "-0.02em" }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "6px" }}>
                        Sign in to your FleetFlow account
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "rgba(0, 0, 0, 0.06)",
                            border: "1px solid rgba(0, 0, 0, 0.15)",
                            color: "#000",
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
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#333", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                                border: "1px solid #e0e0e0",
                                background: "#fafafa",
                                color: "#000",
                                fontSize: "0.9375rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#333", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                                border: "1px solid #e0e0e0",
                                background: "#fafafa",
                                color: "#000",
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
                            background: loading ? "#999" : "#000",
                            color: "#fff",
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
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
                    <span style={{ fontSize: "0.8125rem", color: "#666" }}>
                        Don't have an account?{" "}
                        <button
                            onClick={onSwitchToRegister || onGoRegister}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#000",
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "underline",
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
                        background: "rgba(0, 0, 0, 0.04)",
                        border: "1px solid #e0e0e0",
                    }}
                >
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                        Demo Credentials
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "0.6875rem", color: "#555" }}>
                        <span><strong style={{ color: "#000" }}>Manager:</strong> admin_mgr</span>
                        <span><strong style={{ color: "#000" }}>Dispatcher:</strong> dispatch_ops</span>
                        <span><strong style={{ color: "#000" }}>Safety:</strong> safety_lead</span>
                        <span><strong style={{ color: "#000" }}>Analyst:</strong> data_analyst</span>
                    </div>
                    <div style={{ fontSize: "0.625rem", color: "#666", marginTop: "6px" }}>
                        Password for all: <strong style={{ color: "#000" }}>fleet123</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

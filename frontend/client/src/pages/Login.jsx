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
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                backgroundImage: "url(/bg.jpeg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Dark overlay so form stays readable over the graphic */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "20px",
                    padding: "44px 40px",
                    position: "relative",
                    zIndex: 1,
                    background: "rgba(15, 23, 42, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(16px)",
                }}
            >
                {/* Logo / title — matches FleetFlow branding on the bg */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
                        FleetFlow
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "8px", marginBottom: 0 }}>
                        Sign in to your account
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        style={{
                            padding: "12px 16px",
                            borderRadius: "12px",
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#fca5a5",
                            fontSize: "0.8125rem",
                            marginBottom: "20px",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)", marginBottom: "8px" }}>
                            Username or email
                        </label>
                        <input
                            type="text"
                            value={form.login}
                            onChange={(e) => setForm({ ...form, login: e.target.value })}
                            placeholder="Enter username or email"
                            autoComplete="username"
                            style={{
                                width: "100%",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                background: "rgba(0, 0, 0, 0.25)",
                                color: "#fff",
                                fontSize: "0.9375rem",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)", marginBottom: "8px" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Enter password"
                            autoComplete="current-password"
                            style={{
                                width: "100%",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                background: "rgba(0, 0, 0, 0.25)",
                                color: "#fff",
                                fontSize: "0.9375rem",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px 20px",
                            borderRadius: "12px",
                            background: loading ? "rgba(255,255,255,0.2)" : "#fff",
                            color: loading ? "rgba(255,255,255,0.7)" : "#0f172a",
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: loading ? "none" : "0 4px 20px rgba(0, 0, 0, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                        }}
                    >
                        {loading && <span className="ff-spinner" style={{ width: "18px", height: "18px", borderWidth: "2px", borderTopColor: "#0f172a", borderColor: "rgba(15,23,42,0.3)" }} />}
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", marginBottom: 0, fontSize: "0.8125rem", color: "rgba(255, 255, 255, 0.6)" }}>
                    Don't have an account?{" "}
                    <button
                        onClick={onSwitchToRegister || onGoRegister}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontSize: "inherit",
                        }}
                    >
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;

import React, { useState } from "react";
import { authAPI } from "../lib/api";

const inputStyle = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    background: "rgba(0, 0, 0, 0.25)",
    color: "#fff",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box",
};

const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: "8px",
};

function Register({ onRegister, onGoLogin, onSwitchToLogin, showToast }) {
    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const roles = [
        { value: "manager", label: "Manager" },
        { value: "dispatcher", label: "Dispatcher" },
        { value: "safety_officer", label: "Safety Officer" },
        { value: "analyst", label: "Analyst" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const { username, email, password, confirmPassword, role } = form;
        if (!username || !email || !password || !confirmPassword || !role) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            await authAPI.register(username, email, password, confirmPassword, role);
            onRegister();
        } catch (err) {
            setError(err.message || "Registration failed.");
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
                    maxWidth: "440px",
                    maxHeight: "92vh",
                    overflowY: "auto",
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
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
                        FleetFlow
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "8px", marginBottom: 0 }}>
                        Create your account
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                        <div>
                            <label style={labelStyle}>Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                placeholder="Enter username"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                            >
                                <option value="" style={{ background: "#1e293b", color: "#94a3b8" }}>Select role…</option>
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value} style={{ background: "#1e293b", color: "#fff" }}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "18px" }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Enter email"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
                        <div>
                            <label style={labelStyle}>Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Min 6 characters"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                placeholder="Confirm password"
                                style={inputStyle}
                            />
                        </div>
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
                        {loading ? "Creating…" : "Create account"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", marginBottom: 0, fontSize: "0.8125rem", color: "rgba(255, 255, 255, 0.6)" }}>
                    Already have an account?{" "}
                    <button
                        onClick={onSwitchToLogin || onGoLogin}
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
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;

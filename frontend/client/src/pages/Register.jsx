import React, { useState } from "react";
import { authAPI } from "../lib/api";

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

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e0e0e0",
        background: "#fafafa",
        color: "#000",
        fontSize: "0.875rem",
        outline: "none",
    };

    const labelStyle = {
        display: "block",
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "#333",
        marginBottom: "5px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
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
                    maxWidth: "440px",
                    borderRadius: "20px",
                    background: "#ffffff",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
                    padding: "36px 36px 32px",
                    position: "relative",
                    zIndex: 1,
                    maxHeight: "92vh",
                    overflowY: "auto",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div
                        style={{
                            width: "48px", height: "48px", margin: "0 auto 14px",
                            borderRadius: "14px", background: "#000",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "20px", fontWeight: 900, color: "#fff",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        F
                    </div>
                    <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", letterSpacing: "-0.02em" }}>
                        Create Account
                    </h1>
                    <p style={{ fontSize: "0.8125rem", color: "#666", marginTop: "4px" }}>
                        Join the FleetFlow platform
                    </p>
                </div>

                {error && (
                    <div role="alert" style={{
                        padding: "10px 14px", borderRadius: "10px",
                        background: "rgba(0, 0, 0, 0.06)", border: "1px solid rgba(0, 0, 0, 0.15)",
                        color: "#000", fontSize: "0.8125rem", marginBottom: "16px", textAlign: "center",
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                        <div>
                            <label style={labelStyle}>Username</label>
                            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="johndoe" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Role</label>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
                                <option value="" style={{ color: "#000" }}>Select role…</option>
                                {roles.map((r) => <option key={r.value} value={r.value} style={{ color: "#000" }}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" style={inputStyle} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
                        <div>
                            <label style={labelStyle}>Password</label>
                            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm</label>
                            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••" style={inputStyle} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "13px", borderRadius: "10px",
                            background: loading ? "#999" : "#000",
                            color: "#fff", fontSize: "0.9375rem", fontWeight: 700, border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                    >
                        {loading && <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                        {loading ? "Creating…" : "Create Account"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#666" }}>
                        Already have an account?{" "}
                        <button onClick={onSwitchToLogin || onGoLogin} style={{ background: "none", border: "none", color: "#000", fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontSize: "0.8125rem" }}>
                            Sign in
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Register;

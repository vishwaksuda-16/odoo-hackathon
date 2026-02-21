import React, { useState } from "react";
import FormField from "../components/ui/FormField";

const ROLES = [
    { value: "", label: "Select a role…" },
    { value: "fleet_manager", label: "Fleet Manager" },
    { value: "driver", label: "Driver" },
    { value: "admin", label: "Administrator" },
    { value: "analyst", label: "Operations Analyst" },
];

/* Demo credentials — UI-only auth simulation */
const DEMO_USERS = [
    { username: "admin", password: "admin123", role: "admin", name: "System Admin" },
    { username: "manager", password: "fleet123", role: "fleet_manager", name: "Fleet Manager" },
    { username: "driver", password: "drive123", role: "driver", name: "Driver" },
];

function Login({ onLogin, onGoRegister }) {
    const [form, setForm] = useState({ username: "", password: "", role: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.username.trim() || !form.password.trim() || !form.role) {
            if (!form.username.trim()) errs.username = "Username is required.";
            if (!form.password.trim()) errs.password = "Password is required.";
            if (!form.role) errs.role = "Please select a role to continue.";
            return errs;
        }
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setTimeout(() => {
            const match = DEMO_USERS.find(
                (u) => u.username === form.username && u.password === form.password
            );
            if (match) {
                onLogin({ role: form.role, name: match.name, username: match.username });
            } else {
                setErrors({ auth: "Invalid username or password. Please try again." });
                setLoading(false);
            }
        }, 600);
    };

    return (
        <div
            style={{
                minHeight: "100vh", width: "100vw",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
            }}
        >
            <div
                style={{
                    width: "100%", maxWidth: "420px",
                    background: "#fff", borderRadius: "14px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                        padding: "32px 36px 28px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                        <div
                            style={{
                                width: "38px", height: "38px", borderRadius: "10px",
                                background: "rgba(255,255,255,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: "18px", color: "#fff",
                            }}
                        >
                            F
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>FleetFlow</span>
                    </div>
                    <h2 style={{ color: "#fff", fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>
                        Sign in to your account
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", marginTop: "4px" }}>
                        Fleet & Logistics Management System
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate style={{ padding: "28px 36px 32px" }}>
                    {/* Auth-level error */}
                    {errors.auth && (
                        <div
                            role="alert"
                            style={{
                                background: "#fef2f2", border: "1px solid #fecaca",
                                borderRadius: "8px", padding: "10px 14px",
                                marginBottom: "18px", fontSize: "0.875rem", color: "#b91c1c",
                                display: "flex", alignItems: "center", gap: "8px",
                            }}
                        >
                            <span style={{ fontWeight: 700 }}>✕</span> {errors.auth}
                        </div>
                    )}

                    <FormField label="Role" required htmlFor="login-role" error={errors.role}>
                        <select
                            id="login-role"
                            value={form.role}
                            onChange={(e) => set("role", e.target.value)}
                            className={errors.role ? "error-field" : ""}
                            aria-required="true"
                            aria-describedby={errors.role ? "login-role-err" : undefined}
                        >
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </FormField>

                    <FormField label="Username" required htmlFor="login-username" error={errors.username}>
                        <input
                            id="login-username"
                            type="text"
                            value={form.username}
                            onChange={(e) => set("username", e.target.value)}
                            placeholder="Enter your username"
                            autoComplete="username"
                            aria-required="true"
                            className={errors.username ? "error-field" : ""}
                        />
                    </FormField>

                    <FormField label="Password" required htmlFor="login-password" error={errors.password}>
                        <input
                            id="login-password"
                            type="password"
                            value={form.password}
                            onChange={(e) => set("password", e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            aria-required="true"
                            className={errors.password ? "error-field" : ""}
                        />
                    </FormField>

                    {/* Demo hint */}
                    <div
                        style={{
                            background: "#f0f9ff", border: "1px solid #bae6fd",
                            borderRadius: "6px", padding: "8px 12px", marginBottom: "18px",
                            fontSize: "0.75rem", color: "#0369a1",
                        }}
                    >
                        <strong>Demo:</strong> admin / admin123 &nbsp;|&nbsp; manager / fleet123 &nbsp;|&nbsp; driver / drive123
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "11px",
                            background: loading ? "#93c5fd" : "#1d4ed8",
                            color: "#fff", border: "none", borderRadius: "8px",
                            fontSize: "0.9375rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 150ms",
                        }}
                    >
                        {loading ? "Signing in…" : "Sign In"}
                    </button>

                    <p style={{ textAlign: "center", marginTop: "18px", fontSize: "0.875rem", color: "#64748b" }}>
                        New to FleetFlow?{" "}
                        <button
                            type="button" onClick={onGoRegister}
                            style={{ background: "none", border: "none", color: "#1d4ed8", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "inherit" }}
                        >
                            Create an account
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;

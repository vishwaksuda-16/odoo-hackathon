import React, { useState } from "react";
import FormField from "../components/ui/FormField";
import { authAPI } from "../lib/api";

function Login({ onLogin, onGoRegister, showToast }) {
    const [form, setForm] = useState({ login: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: "", auth: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.login.trim()) errs.login = "Username or email is required.";
        if (!form.password.trim()) errs.password = "Password is required.";
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            const data = await authAPI.login(form.login, form.password);
            if (data.success) {
                onLogin(data);
            } else {
                setErrors({ auth: data.message || "Login failed. Please try again." });
            }
        } catch (err) {
            setErrors({ auth: err.message || "Invalid username or password." });
        } finally {
            setLoading(false);
        }
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

                    <FormField label="Username or Email" required htmlFor="login-user" error={errors.login}>
                        <input
                            id="login-user"
                            type="text"
                            value={form.login}
                            onChange={(e) => set("login", e.target.value)}
                            placeholder="Enter username or email"
                            autoComplete="username"
                            aria-required="true"
                            className={errors.login ? "error-field" : ""}
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

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "11px",
                            background: loading ? "#93c5fd" : "#1d4ed8",
                            color: "#fff", border: "none", borderRadius: "8px",
                            fontSize: "0.9375rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 150ms",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                    >
                        {loading && <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span>}
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

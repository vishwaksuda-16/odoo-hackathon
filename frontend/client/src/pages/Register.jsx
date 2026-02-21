import React, { useState } from "react";
import FormField from "../components/ui/FormField";
import { authAPI } from "../lib/api";

const ROLES = [
    { value: "", label: "Select a role…" },
    { value: "manager", label: "Fleet Manager" },
    { value: "dispatcher", label: "Dispatcher" },
    { value: "safety_officer", label: "Safety Officer" },
    { value: "analyst", label: "Financial Analyst" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register({ onRegister, onGoLogin, showToast }) {
    const [form, setForm] = useState({
        role: "", username: "", email: "", password: "", confirm: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: "", general: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!form.role) errs.role = "Please select a role.";
        if (!form.username.trim()) errs.username = "Username is required.";
        if (!form.email.trim()) errs.email = "Email address is required.";
        else if (!EMAIL_RE.test(form.email)) errs.email = "Please enter a valid email address.";
        if (!form.password) errs.password = "Password is required.";
        else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
        if (!form.confirm) errs.confirm = "Please confirm your password.";
        else if (form.confirm !== form.password) errs.confirm = "Passwords do not match.";
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            const data = await authAPI.register(
                form.username,
                form.email,
                form.password,
                form.confirm,
                form.role
            );
            if (data.success) {
                onRegister(data);
            } else {
                setErrors({ general: data.message || "Registration failed. Please try again." });
            }
        } catch (err) {
            setErrors({ general: err.message || "Registration failed. Please try again." });
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
                overflowY: "auto", padding: "32px 16px",
            }}
        >
            <div
                style={{
                    width: "100%", maxWidth: "460px",
                    background: "#fff", borderRadius: "14px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)", padding: "28px 36px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
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
                    <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Create your account</h2>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", marginTop: "4px" }}>
                        Join the fleet management platform
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate style={{ padding: "24px 36px 32px" }}>
                    {errors.general && (
                        <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "0.875rem", color: "#b91c1c" }}>
                            <strong>✕</strong> {errors.general}
                        </div>
                    )}

                    <FormField label="Role" required htmlFor="reg-role" error={errors.role}>
                        <select id="reg-role" value={form.role} onChange={(e) => set("role", e.target.value)} className={errors.role ? "error-field" : ""}>
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </FormField>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                        <FormField label="Username" required htmlFor="reg-username" error={errors.username}>
                            <input id="reg-username" type="text" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="john_fleet" autoComplete="username" className={errors.username ? "error-field" : ""} />
                        </FormField>

                        <FormField label="Email Address" required htmlFor="reg-email" error={errors.email}>
                            <input id="reg-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@fleetflow.io" autoComplete="email" className={errors.email ? "error-field" : ""} />
                        </FormField>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                        <FormField label="Password" required htmlFor="reg-password" error={errors.password}>
                            <input id="reg-password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password" className={errors.password ? "error-field" : ""} />
                        </FormField>

                        <FormField label="Confirm Password" required htmlFor="reg-confirm" error={errors.confirm}>
                            <input id="reg-confirm" type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Re-enter password" autoComplete="new-password" className={errors.confirm ? "error-field" : ""} />
                        </FormField>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "11px",
                            background: loading ? "#93c5fd" : "#1d4ed8",
                            color: "#fff", border: "none", borderRadius: "8px",
                            fontSize: "0.9375rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                            marginTop: "4px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}
                    >
                        {loading && <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span>}
                        {loading ? "Creating account…" : "Create Account"}
                    </button>

                    <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.875rem", color: "#64748b" }}>
                        Already have an account?{" "}
                        <button
                            type="button" onClick={onGoLogin}
                            style={{ background: "none", border: "none", color: "#1d4ed8", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "inherit" }}
                        >
                            Sign in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Register;

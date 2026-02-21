import React, { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import FormField from "../components/ui/FormField";
import { exportAPI, downloadExport } from "../lib/api";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const cardStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    padding: "20px 22px",
};

function Exports({ showToast }) {
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [downloading, setDownloading] = useState(null);

    const handleDownload = async (label, url, filename) => {
        setDownloading(label);
        try {
            await downloadExport(url, filename);
            showToast(`${label} downloaded successfully.`, "success");
        } catch (err) {
            showToast(err.message || `Failed to download ${label}.`, "error");
        } finally {
            setDownloading(null);
        }
    };

    const btn = (label, url, filename) => (
        <button
            type="button"
            disabled={!!downloading}
            onClick={() => handleDownload(label, url, filename)}
            style={{ width: "100%", padding: "10px", background: downloading === label ? "#999" : "var(--color-primary)", color: "var(--color-surface)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: downloading ? "not-allowed" : "pointer" }}
        >
            {downloading === label ? "Downloading…" : `Download ${label}`}
        </button>
    );

    return (
        <div>
            <PageHeader title="Exports" searchPlaceholder="" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Monthly Payroll (CSV)</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Driver trips, km, fuel by month</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                        <FormField label="Year" htmlFor="exp-year">
                            <select id="exp-year" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "100%", padding: "8px" }}>
                                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Month" htmlFor="exp-month">
                            <select id="exp-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: "100%", padding: "8px" }}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString("default", { month: "short" })}</option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                    {btn("Payroll CSV", exportAPI.payrollCSV(year, month), `payroll_${year}_${String(month).padStart(2, "0")}.csv`)}
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Vehicle Health Audit (CSV)</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Status, odometer, services, overdue</div>
                    {btn("Health Audit CSV", exportAPI.vehicleHealthCSV(), "vehicle_health_audit.csv")}
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Financial Report (CSV)</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Fleet costs, fuel, maintenance</div>
                    {btn("Financial CSV", exportAPI.financialCSV(), "fleet_financial_report.csv")}
                </div>
                <div style={cardStyle}>
                    <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Financial Report (PDF)</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Fleet report for print/archive</div>
                    {btn("Financial PDF", exportAPI.financialPDF(), "fleet_report.pdf")}
                </div>
            </div>
        </div>
    );
}

export default Exports;

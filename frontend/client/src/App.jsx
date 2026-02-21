import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import Layout from "./components/layout/Layout";
import { useToast } from "./components/ui/Toast";
import { authAPI } from "./lib/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Drivers from "./pages/Drivers";
import Analytics from "./pages/Analytics";

/* ─── RBAC permission map ─────────────────────────────────── */
const ROLE_PERMISSIONS = {
  manager: ["dashboard", "vehicles", "maintenance", "analytics"],
  dispatcher: ["dashboard", "trips", "vehicles"],
  safety_officer: ["dashboard", "drivers"],
  analyst: ["dashboard", "expenses", "analytics"],
};

function getDefaultPage(role) {
  return "dashboard";
}

function getAllowedPages(role) {
  return ROLE_PERMISSIONS[role] || ["dashboard"];
}

/* ─── Session persistence ─────────────────────────────────── */
function loadSession() {
  try {
    const raw = localStorage.getItem("ff_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.user && session.accessToken) return session;
  } catch { /* corrupt data */ }
  return null;
}

function saveSession(session) {
  localStorage.setItem("ff_session", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("ff_session");
}

/* ─── Theme persistence ──────────────────────────────────── */
function loadTheme() {
  return localStorage.getItem("ff_theme") || "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ff_theme", theme);
}

/* ═══════════════════════════════════════════════════════════ */
function App() {
  const [session, setSession] = useState(loadSession);
  const [authView, setAuthView] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(loadTheme);
  const { toasts, showToast, dismissToast } = useToast();

  /* Apply theme on mount & changes */
  useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  /* ── Auth handlers ──────────────────────────────────────── */
  const handleLogin = useCallback((loginResponse) => {
    const newSession = {
      user: loginResponse.user,
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
    };
    saveSession(newSession);
    setSession(newSession);
    setPage(getDefaultPage(loginResponse.user.role));
    showToast(
      `Welcome, ${loginResponse.user.username}! Signed in as ${loginResponse.user.role.replace(/_/g, " ")}.`,
      "success"
    );
  }, [showToast]);

  const handleRegister = useCallback((registerResponse) => {
    // After registration, user must log in
    showToast("Account created successfully! Please sign in.", "success");
    setAuthView("login");
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch { /* best-effort */ }
    clearSession();
    setSession(null);
    setAuthView("login");
    setPage("dashboard");
    showToast("You have been signed out.", "info");
  }, [showToast]);

  /* ── RBAC: enforce allowed pages ────────────────────────── */
  const allowedPages = session ? getAllowedPages(session.user.role) : [];

  const handleSetPage = useCallback((p) => {
    if (!session) return;
    if (!getAllowedPages(session.user.role).includes(p)) {
      showToast("Access denied. You do not have permission to view this page.", "error");
      return;
    }
    setPage(p);
  }, [session, showToast]);

  /* Redirect if current page becomes inaccessible */
  useEffect(() => {
    if (session && !allowedPages.includes(page)) {
      setPage(getDefaultPage(session.user.role));
    }
  }, [session, allowedPages, page]);

  /* ── Not authenticated ──────────────────────────────────── */
  if (!session) {
    if (authView === "register") {
      return <Register onRegister={handleRegister} onGoLogin={() => setAuthView("login")} showToast={showToast} />;
    }
    return <Login onLogin={handleLogin} onGoRegister={() => setAuthView("register")} showToast={showToast} />;
  }

  /* ── Authenticated ──────────────────────────────────────── */
  const user = session.user;
  const roleLabel = user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Layout
      setPage={handleSetPage}
      currentPage={page}
      userName={user.username}
      role={roleLabel}
      userRole={user.role}
      allowedPages={allowedPages}
      toasts={toasts}
      dismissToast={dismissToast}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {page === "dashboard" && <Dashboard showToast={showToast} role={user.role} />}
      {page === "vehicles" && <Vehicles showToast={showToast} role={user.role} />}
      {page === "trips" && <Trips showToast={showToast} role={user.role} />}
      {page === "maintenance" && <Maintenance showToast={showToast} role={user.role} />}
      {page === "expenses" && <Expenses showToast={showToast} role={user.role} />}
      {page === "drivers" && <Drivers showToast={showToast} role={user.role} />}
      {page === "analytics" && <Analytics showToast={showToast} role={user.role} />}
    </Layout>
  );
}

export default App;
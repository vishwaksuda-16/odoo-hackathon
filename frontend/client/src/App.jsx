import React, { useState } from "react";
import "./App.css";
import Layout from "./components/layout/Layout";
import { useToast } from "./components/ui/Toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Drivers from "./pages/Drivers";
import Analytics from "./pages/Analytics";

function App() {
  const [authState, setAuthState] = useState(null); // null = unauthenticated
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [page, setPage] = useState("dashboard");
  const { toasts, showToast, dismissToast } = useToast();

  const handleLogin = (user) => {
    setAuthState(user);
    setPage("dashboard");
    showToast(`Welcome back, ${user.name}! You are signed in as ${user.role.replace("_", " ")}.`, "success");
  };

  const handleLogout = () => {
    setAuthState(null);
    setAuthView("login");
  };

  // ── Not authenticated ──────────────────────────────────
  if (!authState) {
    if (authView === "register") {
      return <Register onLogin={handleLogin} onGoLogin={() => setAuthView("login")} />;
    }
    return <Login onLogin={handleLogin} onGoRegister={() => setAuthView("register")} />;
  }

  // ── Authenticated ──────────────────────────────────────
  return (
    <Layout
      setPage={setPage}
      currentPage={page}
      userName={authState.name}
      role={authState.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      toasts={toasts}
      dismissToast={dismissToast}
    >
      {page === "dashboard" && <Dashboard showToast={showToast} />}
      {page === "vehicles" && <Vehicles showToast={showToast} />}
      {page === "trips" && <Trips showToast={showToast} />}
      {page === "maintenance" && <Maintenance showToast={showToast} />}
      {page === "expenses" && <Expenses showToast={showToast} />}
      {page === "drivers" && <Drivers showToast={showToast} />}
      {page === "analytics" && <Analytics showToast={showToast} />}
    </Layout>
  );
}

export default App;
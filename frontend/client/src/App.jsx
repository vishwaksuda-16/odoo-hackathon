import React, { useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <Layout>
      {/* Temporary Navigation (UI only) */}
      <div style={{ marginBottom: "16px" }}>
        <button onClick={() => setPage("dashboard")}>
          Dashboard
        </button>
        <button
          onClick={() => setPage("vehicles")}
          style={{ marginLeft: "8px" }}
        >
          Vehicle Registry
        </button>
      </div>

      {page === "dashboard" && <Dashboard />}
      {page === "vehicles" && <Vehicles />}
    </Layout>
  );
}

export default App;
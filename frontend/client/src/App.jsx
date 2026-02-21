import React, { useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Drivers from "./pages/Drivers";
import Analytics from "./pages/Analytics";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <Layout setPage={setPage}>
      {page === "dashboard" && <Dashboard />}
      {page === "vehicles" && <Vehicles />}
      {page === "trips" && <Trips />}
      {page === "maintenance" && <Maintenance />}
      {page === "expenses" && <Expenses />}
      {page === "drivers" && <Drivers />}
      {page === "analytics" && <Analytics />}
    </Layout>
  );
}

export default App;
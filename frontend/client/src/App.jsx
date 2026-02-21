import React, { useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <Layout setPage={setPage}>
      {page === "dashboard" && <Dashboard />}
      {page === "vehicles" && <Vehicles />}
      {page === "trips" && <Trips />}
    </Layout>
  );
}

export default App;
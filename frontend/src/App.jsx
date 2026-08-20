import { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      {!showDashboard ? (
        <LandingPage
          onEnter={() => setShowDashboard(true)}
        />
      ) : (
        <Dashboard />
      )}
    </>
  );
}

export default App;
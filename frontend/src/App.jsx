import { useState, useEffect } from "react";
import CoverPage from "./components/CoverPage";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import InputForm from "./components/InputForm";
import GridPrediction from "./components/GridPrediction";

function App() {
  const [currentPage, setCurrentPage] = useState("cover");
  const [solarPower, setSolarPower] = useState(null);

  useEffect(() => {
    window.history.replaceState({ page: "cover" }, "");
    window.history.pushState({ page: "cover" }, "");

    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.page === "cover") {
          window.history.pushState({ page: "cover" }, "");
        }
      } else {
        setCurrentPage("cover");
        window.history.pushState({ page: "cover" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, "");
  };

  return (
    <>
      {currentPage === "cover" ? (
        <CoverPage
          onTitleClick={() => navigateTo("home")}
        />
      ) : currentPage === "home" || currentPage === "landing" ? (
        <HomePage
          onExplore={() => navigateTo("dashboard")}
        />
      ) : currentPage === "dashboard" ? (
        <Dashboard
          onSolarSelect={() => navigateTo("solar")}
        />
      ) : currentPage === "solar" ? (
        <div className="dashboard">
          <header>
            <h2>☀️ Solar Power Prediction</h2>

            <p>
              Predict solar AC power using environmental conditions.
            </p>
          </header>

          <InputForm
            onSolarPrediction={(power) => {
              setSolarPower(power);
              navigateTo("grid");
            }}
          />
        </div>
      ) : (
        <div className="dashboard">
          <header>
            <h2>⚡ Grid Load Prediction</h2>

            <p>
              Compare solar generation with your power consumption.
            </p>
          </header>

          <GridPrediction solarPower={solarPower} />
        </div>
      )}
    </>
  );
}

export default App;
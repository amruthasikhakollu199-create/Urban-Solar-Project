import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

function PredictionHistory({ onBackToDashboard }) {
  const { user } = useAuth();

  const [filter, setFilter] = useState("all"); // "all" | "solar" | "grid"
  const [solarHistory, setSolarHistory] = useState([]);
  const [gridHistory, setGridHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      if (!user) return;
      setLoading(true);
      setError("");

      try {
        // Filter created_at from current time minus 7 days
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        // 1. Fetch solar predictions for logged-in user (RLS enforces user_id)
        const { data: solarData, error: solarErr } = await supabase
          .from("solar_predictions")
          .select("*")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false });

        if (solarErr) throw solarErr;

        // 2. Fetch grid predictions for logged-in user (RLS enforces user_id)
        const { data: gridData, error: gridErr } = await supabase
          .from("grid_predictions")
          .select("*")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false });

        if (gridErr) throw gridErr;

        if (isMounted) {
          setSolarHistory(solarData || []);
          setGridHistory(gridData || []);
        }
      } catch (err) {
        console.error("Error fetching prediction history:", err);
        if (isMounted) {
          setError("Failed to load prediction history. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Helper to format date & time nicely (e.g., "25 Aug, 10:30")
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Helper to format numbers with commas
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return "-";
    return Number(num).toLocaleString("en-IN", {
      maximumFractionDigits: decimals,
    });
  };

  const hasSolarRecords = solarHistory.length > 0;
  const hasGridRecords = gridHistory.length > 0;
  const hasAnyRecords = hasSolarRecords || hasGridRecords;

  return (
    <div className="dashboard">

      {/* TOP NAVIGATION / BACK BUTTON */}
      <div className="history-topbar">
        <button
          className="back-button"
          onClick={onBackToDashboard}
          type="button"
        >
          ← Back to Dashboard
        </button>

        <span className="history-badge">Last 7 Days History</span>
      </div>

      <header style={{ marginBottom: "35px" }}>
        <h2>📜 Prediction History</h2>
        <p>Your saved solar power and grid load predictions from the last 7 days.</p>
      </header>

      {/* FILTER TOGGLE BUTTONS */}
      <div className="history-filter-bar">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
          type="button"
        >
          All Predictions ({solarHistory.length + gridHistory.length})
        </button>
        <button
          className={`filter-tab ${filter === "solar" ? "active" : ""}`}
          onClick={() => setFilter("solar")}
          type="button"
        >
          ☀️ Solar ({solarHistory.length})
        </button>
        <button
          className={`filter-tab ${filter === "grid" ? "active" : ""}`}
          onClick={() => setFilter("grid")}
          type="button"
        >
          ⚡ Grid Load ({gridHistory.length})
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="history-loading">
          <span className="loading-icon">☀️</span>
          <span>Loading history…</span>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="error-message" style={{ maxWidth: "800px", margin: "20px auto" }}>
          {error}
        </div>
      )}

      {/* CONTENT SECTIONS */}
      {!loading && !error && (
        <div className="history-content-container">

          {/* EMPTY STATE WHEN NO RECORDS AT ALL OR NO RECORDS FOR FILTER */}
          {((filter === "all" && !hasAnyRecords) ||
            (filter === "solar" && !hasSolarRecords) ||
            (filter === "grid" && !hasGridRecords)) && (
            <div className="history-empty-card">
              <div className="empty-icon">📂</div>
              <h3>No predictions found for the last 7 days</h3>
              <p>
                {filter === "solar"
                  ? "You haven't generated any solar power predictions in the past week."
                  : filter === "grid"
                  ? "You haven't generated any grid load predictions in the past week."
                  : "Make solar or grid load predictions to track your historical data here."}
              </p>
            </div>
          )}

          {/* A. SOLAR PREDICTION HISTORY */}
          {(filter === "all" || filter === "solar") && hasSolarRecords && (
            <div className="history-section">
              <div className="section-header">
                <h3>☀️ Solar Power Prediction History</h3>
                <span className="count-pill">{solarHistory.length} record{solarHistory.length > 1 ? "s" : ""}</span>
              </div>

              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Temp (°C)</th>
                      <th>Humidity (%)</th>
                      <th>Cloud Cover (%)</th>
                      <th>Shortwave Rad.</th>
                      <th>Predicted Solar Power</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solarHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="date-cell">{formatDate(item.created_at)}</td>
                        <td>{formatNumber(item.temperature, 1)}°C</td>
                        <td>{formatNumber(item.humidity, 0)}%</td>
                        <td>{formatNumber(item.cloud_cover, 0)}%</td>
                        <td>{formatNumber(item.shortwave_radiation, 1)} W/m²</td>
                        <td className="highlight-cell solar-power">
                          {formatNumber(item.predicted_power, 2)} kW
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B. GRID LOAD PREDICTION HISTORY */}
          {(filter === "all" || filter === "grid") && hasGridRecords && (
            <div className="history-section">
              <div className="section-header">
                <h3>⚡ Grid Load Prediction History</h3>
                <span className="count-pill">{gridHistory.length} record{gridHistory.length > 1 ? "s" : ""}</span>
              </div>

              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Solar Power</th>
                      <th>Consumption (Demand)</th>
                      <th>Forecast Period</th>
                      <th>Power Balance</th>
                      <th>Energy Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridHistory.map((item) => {
                      const isSurplus = Number(item.power_balance) >= 0;
                      return (
                        <tr key={item.id}>
                          <td className="date-cell">{formatDate(item.created_at)}</td>
                          <td>{formatNumber(item.solar_power, 2)} kW</td>
                          <td>{formatNumber(item.consumption, 2)} kW</td>
                          <td>{item.forecast_period} Days</td>
                          <td className={`balance-cell ${isSurplus ? "surplus" : "deficit"}`}>
                            {isSurplus ? "+" : ""}
                            {formatNumber(item.power_balance, 2)} kW
                          </td>
                          <td className={`balance-cell ${isSurplus ? "surplus" : "deficit"}`}>
                            <span style={{ display: "block", fontSize: "11.5px", fontWeight: "500", opacity: 0.85, marginBottom: "2px" }}>
                              Energy Balance ({item.forecast_period} Days)
                            </span>
                            <span>
                              {isSurplus ? "+" : ""}
                              {formatNumber(item.energy_balance, 2)} kWh
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default PredictionHistory;

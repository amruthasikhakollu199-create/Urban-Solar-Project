import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

function GridPrediction({ solarPower, onGoToSolar }) {
  const { user } = useAuth();

  const [consumption, setConsumption] = useState("");
  const [period, setPeriod] = useState("10");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasSolar = Number.isFinite(Number(solarPower)) && Number(solarPower) > 0;

  const handlePredict = async (event) => {
    event.preventDefault();

    if (loading) return;

    const solar = Number(solarPower);
    const consumed = Number(consumption);
    const days = Number(period);

    if (!Number.isFinite(solar) || !Number.isFinite(consumed)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const payload = {
        solar_power: solar,
        consumption: consumed,
        forecast_period: days,
        user_id: user?.id,
      };

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response;
      try {
        response = await fetch(`${apiUrl}/predict-grid`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } catch (backendErr) {
        console.warn("Primary API URL failed, falling back to hosted endpoint:", backendErr);
        response = await fetch("https://urban-solar-project.onrender.com/predict-grid", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error("Grid prediction request failed");
      }

      const data = await response.json();

      setResult({
        solar: Number(data.solar),
        consumed: Number(data.consumed),
        days: Number(data.days),
        powerBalance: Number(data.powerBalance),
        energyBalance: Number(data.energyBalance),
      });
    } catch (err) {
      console.error("Grid prediction error:", err);

      // Offline fallback calculation for UI display if network fails
      const powerBalance = roundValue(solar - consumed);
      const energyBalance = roundValue(powerBalance * 24 * days);
      setResult({
        solar,
        consumed,
        days,
        powerBalance,
        energyBalance,
      });
      setError("Unable to reach forecasting server. Calculation displayed in offline mode.");
    } finally {
      setLoading(false);
    }
  };

  const roundValue = (val) => Math.round(val * 100) / 100;

  // If no solar prediction was made in current session, prompt user to predict solar power first
  if (!hasSolar) {
    return (
      <div className="form-card empty-solar-state-card">
        <div className="empty-state-icon">☀️</div>
        <h3>Please generate a Solar Power Prediction first.</h3>
        <p>
          Grid Load Prediction requires the estimated solar AC power output to calculate your net power and energy balance.
        </p>
        {onGoToSolar && (
          <button
            type="button"
            className="predict-button"
            style={{ maxWidth: "280px", margin: "20px auto 0" }}
            onClick={onGoToSolar}
          >
            Go to Solar Prediction →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="form-card">

      <form onSubmit={handlePredict}>

        <div className="input-grid">

          {/* SOLAR POWER (Auto-received & Read-Only) */}
          <div className="input-group">
            <label>Solar AC Power Generated</label>

            <input
              type="text"
              value={`${Number(solarPower).toLocaleString("en-IN", { maximumFractionDigits: 2 })} kW`}
              readOnly
              className="readonly-input"
            />

            <small className="auto-received-badge">
              Automatically received from Solar Prediction ✓
            </small>
          </div>

          {/* CONSUMPTION */}
          <div className="input-group">
            <label>Current Power Consumption</label>

            <input
              type="number"
              value={consumption}
              onChange={(event) =>
                setConsumption(event.target.value)
              }
              placeholder="Example: 2000"
              min="0"
              step="any"
              required
            />

            <small>
              Enter current consumption in kW
            </small>
          </div>


          {/* FORECAST PERIOD */}

          <div className="input-group">
            <label>Forecast Period</label>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value)
              }
            >
              <option value="10">10 Days</option>
              <option value="20">20 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

        </div>


        {/* PREDICT BUTTON */}

        <button
          type="submit"
          className="predict-button"
          disabled={loading}
        >
          {loading ? "Calculating..." : "Predict Power Requirement"}
        </button>

      </form>


      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* RESULT */}

      {result && (
        <div className="prediction-result">

          <p>Power Balance</p>

          <h2>
            {Math.abs(result.powerBalance).toLocaleString(
              "en-IN",
              {
                maximumFractionDigits: 2,
              }
            )}{" "}
            kW
          </h2>


          {/* STATUS */}

          {result.powerBalance >= 0 ? (
            <span>
              ☀️ Surplus Power Available
            </span>
          ) : (
            <span>
              ⚡ Additional Power Required
            </span>
          )}


          {/* PERIOD RESULT */}

          <div className="period-result">

            <p>
              Estimated Energy Balance for{" "}
              {result.days} Days
            </p>

            <h3>
              {Math.abs(result.energyBalance).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}{" "}
              kWh
            </h3>

            {result.energyBalance >= 0 ? (
              <small>
                Estimated surplus energy available
              </small>
            ) : (
              <small>
                Estimated additional energy required
              </small>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default GridPrediction;
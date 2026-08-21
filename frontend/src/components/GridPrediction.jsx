import { useState } from "react";

function GridPrediction({ solarPower }) {
  const [consumption, setConsumption] = useState("");
  const [period, setPeriod] = useState("10");
  const [result, setResult] = useState(null);

  const handlePredict = (event) => {
    event.preventDefault();

    const solar = Number(solarPower);
    const consumed = Number(consumption);
    const days = Number(period);

    if (!Number.isFinite(solar) || !Number.isFinite(consumed)) {
      return;
    }

    // Difference between generation and consumption
    const powerBalance = solar - consumed;

    // Energy balance for selected number of days
    // 24 hours per day
    const energyBalance =
      powerBalance * 24 * days;

    setResult({
      solar,
      consumed,
      days,
      powerBalance,
      energyBalance,
    });
  };

  return (
    <div className="form-card">

      <form onSubmit={handlePredict}>

        <div className="input-grid">

          {/* SOLAR POWER */}

          <div className="input-group">
            <label>Solar AC Power Generated</label>

            <input
              type="number"
              value={solarPower || ""}
              readOnly
            />

            <small>
              Automatically received from Solar Prediction
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
        >
          Predict Power Requirement
        </button>

      </form>


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
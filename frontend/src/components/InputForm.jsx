import { useState } from "react";
import PredictionResult from "./PredictionResult";

function InputForm() {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    solarPower: "",
    loadLag1: "",
    loadLag24: "",
    rollingMean3: "",
    rollingMean24: "",
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePredict = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formData.date,
            time: formData.time,

            solarPower: Number(formData.solarPower),

            loadLag1: Number(formData.loadLag1),

            loadLag24: Number(formData.loadLag24),

            rollingMean3: Number(formData.rollingMean3),

            rollingMean24: Number(formData.rollingMean24),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      setPrediction(
        Number(data.predicted_demand).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })
      );

    } catch (error) {
      console.error("Prediction error:", error);

      setError(
        "Unable to get prediction. Please make sure the backend is running."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">

      <form onSubmit={handlePredict}>

        <div className="input-grid">

          {/* DATE */}

          <div className="input-group">
            <label>Date</label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>


          {/* TIME */}

          <div className="input-group">
            <label>Time</label>

            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>


          {/* SOLAR POWER */}

          <div className="input-group">
            <label>Solar AC Power</label>

            <input
              type="number"
              name="solarPower"
              value={formData.solarPower}
              onChange={handleChange}
              placeholder="Example: 500"
              min="0"
              step="any"
              required
            />
          </div>


          {/* PREVIOUS HOUR */}

          <div className="input-group">
            <label>Previous Hour Demand</label>

            <input
              type="number"
              name="loadLag1"
              value={formData.loadLag1}
              onChange={handleChange}
              placeholder="Example: 150000"
              min="0"
              step="any"
              required
            />
          </div>


          {/* PREVIOUS DAY */}

          <div className="input-group">
            <label>Previous Day Same-Hour Demand</label>

            <input
              type="number"
              name="loadLag24"
              value={formData.loadLag24}
              onChange={handleChange}
              placeholder="Example: 153000"
              min="0"
              step="any"
              required
            />
          </div>


          {/* 3 HOUR AVERAGE */}

          <div className="input-group">
            <label>Previous 3-Hour Average</label>

            <input
              type="number"
              name="rollingMean3"
              value={formData.rollingMean3}
              onChange={handleChange}
              placeholder="Example: 152000"
              min="0"
              step="any"
              required
            />
          </div>


          {/* 24 HOUR AVERAGE */}

          <div className="input-group">
            <label>Previous 24-Hour Average</label>

            <input
              type="number"
              name="rollingMean24"
              value={formData.rollingMean24}
              onChange={handleChange}
              placeholder="Example: 145500"
              min="0"
              step="any"
              required
            />
          </div>

        </div>


        {/* PREDICT BUTTON */}

        <button
          type="submit"
          className="predict-button"
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict Grid Demand"}
        </button>

      </form>


      {/* ERROR MESSAGE */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* PREDICTION RESULT */}

      {prediction && (
        <PredictionResult
          prediction={prediction}
          date={formData.date}
          time={formData.time}
        />
      )}

    </div>
  );
}

export default InputForm;
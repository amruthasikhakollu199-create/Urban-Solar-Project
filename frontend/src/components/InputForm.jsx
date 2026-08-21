import { useState } from "react";
import PredictionResult from "./PredictionResult";

function InputForm({ onSolarPrediction }) {
  const [formData, setFormData] = useState({
    temperature: "",
    humidity: "",
    cloud_cover: "",
    shortwave_radiation: "",
    zenith: "",
    angle_of_incidence: "",
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
        "http://127.0.0.1:8000/predict-solar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            temperature: Number(formData.temperature),
            humidity: Number(formData.humidity),
            cloud_cover: Number(formData.cloud_cover),
            shortwave_radiation: Number(
              formData.shortwave_radiation
            ),
            zenith: Number(formData.zenith),
            angle_of_incidence: Number(
              formData.angle_of_incidence
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Solar prediction request failed");
      }

      const data = await response.json();

      const predictedPower = Number(
        data.predicted_solar_power
      );

      setPrediction(
        predictedPower.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })
      );

      if (onSolarPrediction) {
        onSolarPrediction(predictedPower);
      }

    } catch (error) {
      console.error("Solar prediction error:", error);

      setError(
        "Unable to get solar prediction. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">

      <form onSubmit={handlePredict}>

        <div className="input-grid">

          <div className="input-group">
            <label>Temperature</label>

            <input
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="Example: 25"
              step="any"
              required
            />
          </div>

          <div className="input-group">
            <label>Relative Humidity</label>

            <input
              type="number"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              placeholder="Example: 50"
              min="0"
              max="100"
              step="any"
              required
            />
          </div>

          <div className="input-group">
            <label>Total Cloud Cover</label>

            <input
              type="number"
              name="cloud_cover"
              value={formData.cloud_cover}
              onChange={handleChange}
              placeholder="Example: 20"
              min="0"
              max="100"
              step="any"
              required
            />
          </div>

          <div className="input-group">
            <label>Shortwave Radiation</label>

            <input
              type="number"
              name="shortwave_radiation"
              value={formData.shortwave_radiation}
              onChange={handleChange}
              placeholder="Example: 500"
              min="0"
              step="any"
              required
            />
          </div>

          <div className="input-group">
            <label>Zenith</label>

            <input
              type="number"
              name="zenith"
              value={formData.zenith}
              onChange={handleChange}
              placeholder="Example: 40"
              min="0"
              max="180"
              step="any"
              required
            />
          </div>

          <div className="input-group">
            <label>Angle of Incidence</label>

            <input
              type="number"
              name="angle_of_incidence"
              value={formData.angle_of_incidence}
              onChange={handleChange}
              placeholder="Example: 35"
              min="0"
              max="180"
              step="any"
              required
            />
          </div>

        </div>

        <button
          type="submit"
          className="predict-button"
          disabled={loading}
        >
          {loading
            ? "Predicting..."
            : "Predict Solar Power"}
        </button>

      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {prediction && (
        <PredictionResult
          prediction={prediction}
        />
      )}

    </div>
  );
}

export default InputForm;
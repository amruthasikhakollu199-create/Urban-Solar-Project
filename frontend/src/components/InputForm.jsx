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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePredict = (event) => {
    event.preventDefault();

    // Temporary prediction placeholder.
    // Later this will call the FastAPI backend.
    setPrediction("154,120");
  };

  return (
    <div className="form-card">

      <form onSubmit={handlePredict}>

        <div className="input-grid">

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

          <div className="input-group">
            <label>Solar AC Power</label>
            <input
              type="number"
              name="solarPower"
              value={formData.solarPower}
              onChange={handleChange}
              placeholder="Example: 500"
              required
            />
          </div>

          <div className="input-group">
            <label>Previous Hour Demand</label>
            <input
              type="number"
              name="loadLag1"
              value={formData.loadLag1}
              onChange={handleChange}
              placeholder="Example: 150000"
              required
            />
          </div>

          <div className="input-group">
            <label>Previous Day Same-Hour Demand</label>
            <input
              type="number"
              name="loadLag24"
              value={formData.loadLag24}
              onChange={handleChange}
              placeholder="Example: 153000"
              required
            />
          </div>

          <div className="input-group">
            <label>Previous 3-Hour Average</label>
            <input
              type="number"
              name="rollingMean3"
              value={formData.rollingMean3}
              onChange={handleChange}
              placeholder="Example: 152000"
              required
            />
          </div>

          <div className="input-group">
            <label>Previous 24-Hour Average</label>
            <input
              type="number"
              name="rollingMean24"
              value={formData.rollingMean24}
              onChange={handleChange}
              placeholder="Example: 145500"
              required
            />
          </div>

        </div>

        <button type="submit" className="predict-button">
          Predict Grid Demand
        </button>

      </form>

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
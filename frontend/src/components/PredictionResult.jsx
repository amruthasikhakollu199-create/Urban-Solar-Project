function PredictionResult({ prediction }) {
  return (
    <div className="prediction-result">

      <p>Predicted Solar AC Power</p>

      <h2>{prediction} kW</h2>

    </div>
  );
}

export default PredictionResult;
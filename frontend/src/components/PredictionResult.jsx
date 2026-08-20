function PredictionResult({ prediction, date, time }) {
  return (
    <div className="prediction-result">

      <p>Predicted Grid Demand</p>

      <h2>{prediction}</h2>

      <span>
        For {date} at {time}
      </span>

    </div>
  );
}

export default PredictionResult;
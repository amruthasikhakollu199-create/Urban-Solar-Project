function Dashboard({ onSolarSelect }) {
  return (
    <div className="dashboard">

      <header>
        <h2>Urban Solar & Grid Load Forecasting</h2>

        <p>
          Choose what you want to predict.
        </p>
      </header>

      <div className="prediction-options">

        <button
          className="prediction-card solar-card"
          onClick={onSolarSelect}
        >
          <div className="card-icon">☀️</div>

          <h3>Solar Power Prediction</h3>

          <p>
            Predict solar AC power using environmental
            conditions.
          </p>

          <span>Predict Solar Power →</span>
        </button>

      </div>

    </div>
  );
}

export default Dashboard;
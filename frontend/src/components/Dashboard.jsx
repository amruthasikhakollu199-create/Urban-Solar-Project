function Dashboard({ onSolarSelect, onHistorySelect, onLogout }) {
  return (
    <div className="dashboard">

      {/* Topbar with Logout and History links */}
      <div className="dashboard-topbar">
        {onHistorySelect && (
          <button
            id="nav-history-btn"
            className="history-nav-button"
            onClick={onHistorySelect}
            type="button"
          >
            📜 Prediction History
          </button>
        )}

        {onLogout && (
          <button
            id="logout-btn"
            className="logout-button"
            onClick={onLogout}
            type="button"
          >
            Sign Out
          </button>
        )}
      </div>

      <header>
        <h2>Urban Solar &amp; Grid Load Forecasting</h2>

        <p>
          Choose what you want to predict or view your history.
        </p>
      </header>

      <div className="prediction-options">

        {/* SOLAR POWER CARD */}
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

        {/* PREDICTION HISTORY CARD */}
        {onHistorySelect && (
          <button
            className="prediction-card history-card"
            onClick={onHistorySelect}
          >
            <div className="card-icon">📜</div>

            <h3>Prediction History</h3>

            <p>
              View your saved solar and grid prediction history
              from the last 7 days.
            </p>

            <span>View History →</span>
          </button>
        )}

      </div>

    </div>
  );
}

export default Dashboard;
function LandingPage({ onEnter }) {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <p className="eyebrow">☀️ SMART ENERGY FORECASTING</p>

        <h1 onClick={onEnter}>
          Urban Solar & Grid
          <br />
          Load Forecasting
        </h1>

        <p className="landing-subtitle">
          Click the project name to enter the forecasting dashboard.
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
import React from "react";

function HomePage({ onExplore }) {
  return (
    <div className="landing-page home-page">
      {/* Hand-drawn background elements */}
      <div className="doodle doodle-sun">☀</div>

      <div className="doodle doodle-cloud cloud-one">☁</div>
      <div className="doodle doodle-cloud cloud-two">☁</div>

      <div className="doodle doodle-solar-panel">
        <div className="panel-grid">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div className="doodle doodle-solar-panel panel-two">
        <div className="panel-grid">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div className="doodle doodle-house">
        <div className="house-roof"></div>
        <div className="house-body">
          <div className="house-window"></div>
          <div className="house-door"></div>
        </div>
      </div>

      <div className="doodle doodle-energy energy-one">⚡</div>
      <div className="doodle doodle-energy energy-two">✦</div>

      <div className="doodle doodle-leaf leaf-one">❧</div>
      <div className="doodle doodle-leaf leaf-two">❧</div>

      {/* Main Content */}
      <div className="landing-content home-content">

        <div className="brand">
          <span className="brand-icon">☀️</span>
          <span>SMART ENERGY FORECASTING</span>
        </div>


        <h1 className="home-title">
          Urban Solar Power Generation
          <br />
          & Grid Load Forecasting
        </h1>

        <p className="home-description">
          An intelligent forecasting application that predicts solar AC power generation based on environmental conditions and analyzes urban grid power requirements for efficient grid management.
        </p>

        {/* Feature Sections */}
        <div className="home-features">
          <div className="home-feature-card">
            <div className="feature-icon solar-icon">☀️</div>
            <h3>Solar Power Prediction</h3>
            <p>
              Predict solar AC power output using key environmental parameters including irradiance, temperature, cloud cover, and solar geometry.
            </p>
          </div>

          <div className="home-feature-card">
            <div className="feature-icon grid-icon">⚡</div>
            <h3>Grid Load Analysis</h3>
            <p>
              Analyze urban power demand patterns and evaluate grid requirements alongside solar generation for balanced load management.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="home-action">
          <button
            className="explore-button"
            onClick={onExplore}
            aria-label="Explore Predictions"
          >
            Explore Predictions →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

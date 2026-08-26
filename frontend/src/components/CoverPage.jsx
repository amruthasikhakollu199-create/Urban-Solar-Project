import React from "react";

function CoverPage({ onTitleClick }) {
  return (
    <div className="landing-page">
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

      {/* Main content */}
      <div className="landing-content">
        <div className="brand">
          <span className="brand-icon">☀️</span>
          <span>SMART ENERGY FORECASTING</span>
        </div>

        {/* CLICKABLE TITLE */}
        <button
          className="landing-title-button"
          onClick={onTitleClick}
          aria-label="Enter Urban Solar Power Generation and Grid Load Forecasting"
        >
          <h1>
            Urban Solar Power Generation
            <br />
            & Grid Load Forecasting
          </h1>
        </button>

        <p className="landing-subtitle">
          Solar intelligence for a smarter urban grid
        </p>
      </div>
    </div>
  );
}

export default CoverPage;

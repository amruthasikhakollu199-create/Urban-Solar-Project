import React from "react";

function Dashboard({ onSolarSelect, onHistorySelect, onLogout }) {
  return (
    <div className="dashboard overview-dashboard">

      <header className="dashboard-header-clean">
        <div className="dashboard-badge">⚡ Intelligent Energy Management</div>
        <h2>Urban Solar &amp; Grid Load Forecasting</h2>
      </header>

      {/* 4-STEP CONNECTED WORKFLOW */}
      <section className="workflow-section">
        <div className="section-title-wrap">
          <span className="section-subtitle">Process Overview</span>
          <h3>How Our Energy Forecasting Works</h3>
        </div>

        <div className="workflow-timeline">
          {/* STEP 1 */}
          <div className="workflow-step">
            <div className="step-badge">1</div>
            <div className="step-card">
              <div className="step-icon">☀️</div>
              <h4>Input Environmental Data</h4>
              <p>
                Enter environmental conditions such as temperature, humidity, cloud cover, shortwave radiation, zenith, and angle of incidence.
              </p>
            </div>
          </div>

          {/* CONNECTOR 1 -> 2 */}
          <div className="workflow-connector" aria-hidden="true">
            <span className="connector-line"></span>
            <span className="connector-arrow">→</span>
            <span className="connector-arrow-mobile">↓</span>
          </div>

          {/* STEP 2 */}
          <div className="workflow-step">
            <div className="step-badge">2</div>
            <div className="step-card">
              <div className="step-icon">🌞</div>
              <h4>Predict Solar Power</h4>
              <p>
                Our machine learning model predicts the solar AC power that the power plant can generate.
              </p>
            </div>
          </div>

          {/* CONNECTOR 2 -> 3 */}
          <div className="workflow-connector" aria-hidden="true">
            <span className="connector-line"></span>
            <span className="connector-arrow">→</span>
            <span className="connector-arrow-mobile">↓</span>
          </div>

          {/* STEP 3 */}
          <div className="workflow-step">
            <div className="step-badge">3</div>
            <div className="step-card">
              <div className="step-icon">⚡</div>
              <h4>Compare Generation with Grid Demand</h4>
              <p>
                The predicted solar generation is automatically passed to Grid Load Prediction and compared with current power consumption.
              </p>
            </div>
          </div>

          {/* CONNECTOR 3 -> 4 */}
          <div className="workflow-connector" aria-hidden="true">
            <span className="connector-line"></span>
            <span className="connector-arrow">→</span>
            <span className="connector-arrow-mobile">↓</span>
          </div>

          {/* STEP 4 */}
          <div className="workflow-step">
            <div className="step-badge">4</div>
            <div className="step-card">
              <div className="step-icon">📊</div>
              <h4>Analyze Power Balance</h4>
              <p>
                The system calculates whether the plant has surplus generation or requires additional power for the selected forecast period.
              </p>
            </div>
          </div>
        </div>

        {/* START FORECASTING CTA */}
        {onSolarSelect && (
          <div className="workflow-action">
            <button
              type="button"
              className="predict-button start-flow-btn"
              onClick={onSolarSelect}
            >
              Start Solar Power Prediction →
            </button>
          </div>
        )}
      </section>

      {/* WHY THIS MATTERS SECTION */}
      <section className="matters-section">
        <div className="section-title-wrap">
          <h3>Why This Matters?</h3>
          <p className="matters-intro">
            By combining solar generation forecasting with grid demand analysis, the system helps identify power shortages and surplus generation before they become operational problems.
          </p>
        </div>

        <div className="benefits-grid">
          {/* Benefit 1 */}
          <div className="benefit-card">
            <div className="benefit-icon">☀️</div>
            <h4>Better Solar Utilization</h4>
            <p>Use predicted generation more effectively.</p>
          </div>

          {/* Benefit 2 */}
          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h4>Demand Awareness</h4>
            <p>Understand whether current generation can meet consumption.</p>
          </div>

          {/* Benefit 3 */}
          <div className="benefit-card">
            <div className="benefit-icon">🌱</div>
            <h4>Smarter Energy Planning</h4>
            <p>Support better decisions for efficient and sustainable power management.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;
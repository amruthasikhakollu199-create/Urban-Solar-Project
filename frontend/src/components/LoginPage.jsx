import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage({ onLoginSuccess, onGoToSignup }) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    setLoading(false);
    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
    } else {
      onLoginSuccess();
    }
  };

  return (
    <div className="auth-page">
      {/* Background doodles matching the existing cover page style */}
      <div className="doodle doodle-sun" style={{ fontSize: "90px" }}>☀</div>
      <div className="doodle doodle-cloud cloud-one">☁</div>
      <div className="doodle doodle-energy energy-one">⚡</div>
      <div className="doodle doodle-leaf leaf-two">❧</div>

      <div className="auth-card">
        {/* Brand header */}
        <div className="brand" style={{ marginBottom: "6px" }}>
          <span className="brand-icon">☀️</span>
          <span>SMART ENERGY FORECASTING</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to your dashboard</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="predict-button auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-link-text">
          Don't have an account?{" "}
          <button
            id="go-to-signup-btn"
            className="auth-link-btn"
            onClick={onGoToSignup}
            type="button"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

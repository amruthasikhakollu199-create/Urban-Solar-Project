import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function SignupPage({ onSignupSuccess, onGoToLogin }) {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password);

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || "Could not create account. Please try again.");
    } else {
      // Supabase may send a confirmation email depending on project settings.
      // Show a success message; if email confirmation is disabled, redirect directly.
      setSuccessMsg(
        "Account created! Check your email to confirm, then sign in."
      );
      // Give the user a moment to read the message, then go to login.
      setTimeout(() => onSignupSuccess(), 2500);
    }
  };

  return (
    <div className="auth-page">
      {/* Background doodles matching cover page */}
      <div className="doodle doodle-sun" style={{ fontSize: "90px" }}>☀</div>
      <div className="doodle doodle-cloud cloud-two">☁</div>
      <div className="doodle doodle-energy energy-two">✦</div>
      <div className="doodle doodle-leaf leaf-one">❧</div>

      <div className="auth-card">
        {/* Brand header */}
        <div className="brand" style={{ marginBottom: "6px" }}>
          <span className="brand-icon">☀️</span>
          <span>SMART ENERGY FORECASTING</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start forecasting solar &amp; grid load today</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="input-group">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {successMsg && (
            <p className="success-message" role="status">
              {successMsg}
            </p>
          )}

          <button
            id="signup-submit-btn"
            type="submit"
            className="predict-button auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-link-text">
          Already have an account?{" "}
          <button
            id="go-to-login-btn"
            className="auth-link-btn"
            onClick={onGoToLogin}
            type="button"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;

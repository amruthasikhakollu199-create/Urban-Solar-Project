import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function SignupPage({ onSignupSuccess, onGoToLogin }) {
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    city: "",
    area: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const nameTrimmed = formData.fullName.trim();
    const emailTrimmed = formData.email.trim();
    const cityTrimmed = formData.city.trim();
    const areaTrimmed = formData.area.trim();

    if (!nameTrimmed) {
      setError("Please enter your Full Name.");
      return;
    }

    if (!emailTrimmed) {
      setError("Please enter your Email Address.");
      return;
    }

    if (!cityTrimmed) {
      setError("Please enter your City.");
      return;
    }

    if (!areaTrimmed) {
      setError("Please enter your Area.");
      return;
    }

    if (!formData.password) {
      setError("Please enter a Password.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!formData.confirmPassword) {
      setError("Please confirm your Password.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const metadata = {
      full_name: nameTrimmed,
      city: cityTrimmed,
      area: areaTrimmed,
    };

    const { error: signUpError } = await signUp(
      emailTrimmed,
      formData.password,
      metadata
    );

    setLoading(false);

    if (signUpError) {
      const rawMsg = (signUpError.message || "").toLowerCase();
      const status = signUpError.status;

      if (
        rawMsg.includes("duplicate") ||
        rawMsg.includes("unique") ||
        rawMsg.includes("power_plants")
      ) {
        setError(
          "An account is already registered with this location. Please use a different location."
        );
      } else if (
        status === 429 ||
        rawMsg.includes("rate limit") ||
        rawMsg.includes("too many") ||
        rawMsg.includes("security purposes")
      ) {
        setError(
          "Too many signup attempts. Please wait a few minutes before trying again."
        );
      } else {
        setError(
          "Could not create account. Please check your details and try again."
        );
      }
    } else {
      setSuccessMsg(
        "Account created! Check your email to confirm, then sign in."
      );
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
          {/* 1. Full Name */}
          <div className="input-group">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              name="fullName"
              placeholder="e.g. Amrutha S"
              value={formData.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
              disabled={loading}
            />
          </div>

          {/* 2. Email Address */}
          <div className="input-group">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* 3. City */}
          <div className="input-group">
            <label htmlFor="signup-city">City</label>
            <input
              id="signup-city"
              type="text"
              name="city"
              placeholder="e.g. Vijayawada"
              value={formData.city}
              onChange={handleChange}
              required
              autoComplete="address-level2"
              disabled={loading}
            />
          </div>

          {/* 4. Area */}
          <div className="input-group">
            <label htmlFor="signup-area">Area</label>
            <input
              id="signup-area"
              type="text"
              name="area"
              placeholder="e.g. 1 Town"
              value={formData.area}
              onChange={handleChange}
              required
              autoComplete="address-level3"
              disabled={loading}
            />
          </div>

          {/* 5. Password */}
          <div className="input-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {/* 6. Confirm Password */}
          <div className="input-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
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

          {/* 7. Create Account Button */}
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

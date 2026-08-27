import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function DetailsPage({ onBackToDashboard, onNavigateTo }) {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    area: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Initialize form data from user metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setFormData({
        fullName: user.user_metadata.full_name || "",
        city: user.user_metadata.city || "",
        area: user.user_metadata.area || "",
      });
    }
  }, [user]);

  // Dynamic email masking helper
  const maskEmail = (email) => {
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return "••••••••••";
    }

    const [username, domain] = email.split("@");

    if (username.length <= 4) {
      const visiblePart = username.slice(0, Math.min(2, username.length));
      const maskedPart = "•".repeat(Math.max(4, username.length - visiblePart.length));
      return `${visiblePart}${maskedPart}@${domain}`;
    }

    const visiblePart = username.slice(0, 4);
    const maskedPart = "•".repeat(username.length - 4);
    return `${visiblePart}${maskedPart}@${domain}`;
  };

  const fullName = user?.user_metadata?.full_name || "User";
  const city = user?.user_metadata?.city;
  const area = user?.user_metadata?.area;
  const plantLocation =
    city && area ? `${city}, ${area}` : city || area || "Location not configured";
  const maskedEmail = maskEmail(user?.email);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartEdit = () => {
    setError("");
    setSuccessMsg("");
    setFormData({
      fullName: user?.user_metadata?.full_name || "",
      city: user?.user_metadata?.city || "",
      area: user?.user_metadata?.area || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    setSuccessMsg("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const nameTrimmed = formData.fullName.trim();
    const cityTrimmed = formData.city.trim();
    const areaTrimmed = formData.area.trim();

    if (!nameTrimmed) {
      setError("Full Name cannot be empty.");
      return;
    }

    if (!cityTrimmed) {
      setError("City cannot be empty.");
      return;
    }

    if (!areaTrimmed) {
      setError("Area cannot be empty.");
      return;
    }

    setLoading(true);

    const { error: updateErr } = await updateProfile({
      full_name: nameTrimmed,
      city: cityTrimmed,
      area: areaTrimmed,
    });

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message || "Failed to update profile. Please try again.");
    } else {
      setSuccessMsg("Profile updated successfully! ✓");
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMsg("");
      }, 1200);
    }
  };

  return (
    <div className="dashboard">
      {/* Topbar navigation */}
      <div className="history-topbar">
        <button
          className="back-button"
          onClick={onBackToDashboard}
          type="button"
        >
          ← Back to Dashboard
        </button>

        {/* Top-Right Edit Profile Button */}
        <button
          id="edit-profile-toggle-btn"
          className={`edit-profile-top-btn ${isEditing ? "editing-mode" : ""}`}
          onClick={isEditing ? handleCancelEdit : handleStartEdit}
          type="button"
        >
          {isEditing ? "✕ Cancel Editing" : "✏️ Edit Profile"}
        </button>
      </div>

      <header style={{ marginBottom: "30px" }}>
        <h2>{isEditing ? "✏️ Edit Profile" : "👤 Account Details"}</h2>
        <p>
          {isEditing
            ? "Update your personal details and power plant location."
            : "Your profile information and power plant location status."}
        </p>
      </header>

      <div className="details-card-container">
        <div className="details-card">
          <div className="details-header">
            <div className="details-avatar">
              {fullName && fullName !== "User"
                ? fullName.charAt(0).toUpperCase()
                : user?.email
                ? user.email.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div>
              <h3 className="details-user-email">{fullName}</h3>
              <span className="details-status-badge">● Active Account</span>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ margin: "0 0 20px" }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="success-message" style={{ margin: "0 0 20px" }}>
              {successMsg}
            </div>
          )}

          {/* EDIT MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="edit-profile-form" noValidate>
              <div className="input-grid">
                {/* 1. Full Name */}
                <div className="input-group">
                  <label htmlFor="edit-name">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Amrutha S"
                    required
                    disabled={loading}
                  />
                </div>

                {/* 2. City */}
                <div className="input-group">
                  <label htmlFor="edit-city">City</label>
                  <input
                    id="edit-city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Vijayawada"
                    required
                    disabled={loading}
                  />
                </div>

                {/* 3. Area */}
                <div className="input-group">
                  <label htmlFor="edit-area">Area</label>
                  <input
                    id="edit-area"
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g. 1 Town"
                    required
                    disabled={loading}
                  />
                </div>

                {/* 4. Masked Email (Read-only) */}
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="text"
                    value={maskedEmail}
                    readOnly
                    className="readonly-input"
                    title="Email is protected and managed via authentication"
                  />
                  <small style={{ color: "#6a8271", marginTop: "4px", display: "block" }}>
                    Protected email address
                  </small>
                </div>
              </div>

              <div className="edit-actions-row">
                <button
                  type="button"
                  className="edit-btn-cancel"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="edit-btn-save"
                  disabled={loading}
                >
                  {loading ? "Saving Changes…" : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <div className="details-grid">
              {/* 1. Name */}
              <div className="details-item">
                <span className="details-label">Name</span>
                <span className="details-value">{fullName}</span>
              </div>

              {/* 2. Power Plant Location (City, Area) */}
              <div className="details-item">
                <span className="details-label">Power Plant Location</span>
                <span className="details-value plant-location-value">
                  {plantLocation}
                </span>
              </div>

              {/* 3. Masked Email Address */}
              <div className="details-item">
                <span className="details-label">Email Address</span>
                <span className="details-value masked-email-value">
                  {maskedEmail}
                </span>
              </div>

              {/* 4. Account Status */}
              <div className="details-item">
                <span className="details-label">Account Status</span>
                <span className="details-value status-active-text">
                  Active Account
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailsPage;


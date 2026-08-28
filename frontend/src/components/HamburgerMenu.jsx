import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

function HamburgerMenu({ currentPage, onNavigateTo, onLogout, onDeleteSuccess, onOpenNotifications }) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const drawerRef = useRef(null);

  // Close drawer on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        !event.target.closest(".hamburger-trigger-btn")
      ) {
        setIsOpen(false);
      }
    }

    // Close drawer on ESC key
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowDeleteModal(false);
      }
    }

    if (isOpen || showDeleteModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, showDeleteModal]);

  const handleNavClick = (page) => {
    setIsOpen(false);
    onNavigateTo(page);
  };

  const handleSignOutClick = async () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
      onNavigateTo("cover");
    }
  };

  const handleDeleteAccountClick = () => {
    setIsOpen(false);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      let isDeleted = false;
      let lastErrorMessage = "";

      // Strategy 1: Supabase Postgres RPC (Native atomic self-deletion with ON DELETE CASCADE)
      try {
        const { error: rpcError } = await supabase.rpc("delete_user");
        if (!rpcError) {
          isDeleted = true;
        } else {
          console.warn("RPC delete_user returned notice:", rpcError);
          lastErrorMessage = rpcError.message;
        }
      } catch (rpcEx) {
        console.warn("RPC delete_user call threw exception:", rpcEx);
      }

      // Strategy 2: Backend Admin API /auth/delete-account
      if (!isDeleted) {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes?.data?.session?.access_token;

        if (token) {
          const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

          let response;
          try {
            response = await fetch(`${apiUrl}/auth/delete-account`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          } catch (fetchErr) {
            console.warn("Primary API URL unreachable, trying fallback endpoint:", fetchErr);
            response = await fetch("https://urban-solar-project.onrender.com/auth/delete-account", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          }

          if (response && response.ok) {
            isDeleted = true;
          } else if (response) {
            const errData = await response.json().catch(() => ({}));
            lastErrorMessage = errData.detail || "Server rejected account deletion.";
          }
        }
      }

      if (!isDeleted) {
        throw new Error(
          lastErrorMessage ||
            "Unable to permanently erase account. Please run the delete_user() SQL function in Supabase SQL editor or check backend configuration."
        );
      }

      // 3. Clear local auth state
      await signOut();

      setShowDeleteModal(false);

      // 4. Return to the Login page
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        onNavigateTo("login");
      }
    } catch (err) {
      console.error("Error during account deletion:", err);
      setDeleteError(
        err.message || "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  const displayName = user?.user_metadata?.full_name || "Solar & Grid User";
  const maskedUserEmail = maskEmail(user?.email);

  return (
    <>
      {/* ☰ Top-Left Floating Hamburger Button */}
      <button
        type="button"
        id="hamburger-menu-btn"
        className="hamburger-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger-icon-lines">☰</span>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left-Side Drawer */}
      <aside
        ref={drawerRef}
        className={`drawer-container ${isOpen ? "drawer-open" : ""}`}
        aria-label="Main Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="drawer-brand-icon">☀️</span>
            <div className="drawer-brand-info">
              <span className="drawer-brand-name">{displayName}</span>
              <span className="drawer-user-email" title={maskedUserEmail}>
                {maskedUserEmail}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer Navigation List */}
        <nav className="drawer-nav">
          <ul className="drawer-menu-list">
            {/* 1. Details */}
            <li>
              <button
                type="button"
                className={`drawer-menu-item ${currentPage === "details" ? "active" : ""}`}
                onClick={() => handleNavClick("details")}
              >
                <span className="menu-item-icon">👤</span>
                <span className="menu-item-text">Details</span>
              </button>
            </li>

            {/* 2. Prediction History */}
            <li>
              <button
                type="button"
                className={`drawer-menu-item ${currentPage === "history" ? "active" : ""}`}
                onClick={() => handleNavClick("history")}
              >
                <span className="menu-item-icon">📜</span>
                <span className="menu-item-text">Prediction History</span>
              </button>
            </li>

            {/* 3. Energy Surplus Notifications */}
            <li>
              <button
                type="button"
                className="drawer-menu-item"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenNotifications) onOpenNotifications();
                }}
              >
                <span className="menu-item-icon">🔔</span>
                <span className="menu-item-text">Energy Notifications</span>
              </button>
            </li>

            <li className="drawer-divider" role="separator" />

            {/* 4. Sign Out */}
            <li>
              <button
                type="button"
                className="drawer-menu-item signout-item"
                onClick={handleSignOutClick}
              >
                <span className="menu-item-icon">🚪</span>
                <span className="menu-item-text">Sign Out</span>
              </button>
            </li>

            {/* 5. Delete Account */}
            <li>
              <button
                type="button"
                className="drawer-menu-item delete-account-item"
                onClick={handleDeleteAccountClick}
              >
                <span className="menu-item-icon">🗑️</span>
                <span className="menu-item-text">Delete Account</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <p className="drawer-footer-text">Urban Solar Project</p>
          <small className="drawer-footer-version">v2.0 • Forecasting Suite</small>
        </div>
      </aside>

      {/* Confirmation Modal for Delete Account */}
      {showDeleteModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="delete-confirm-modal">
            <div className="modal-icon-badge">⚠️</div>

            <h3 id="delete-dialog-title">Are you sure you want to delete your account?</h3>

            <p className="modal-warning-text">
              Deleting your account will permanently remove your account and associated prediction history.
            </p>

            {deleteError && (
              <div className="error-message" style={{ margin: "12px 0" }}>
                {deleteError}
              </div>
            )}

            <div className="modal-action-buttons">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-confirm-delete-btn"
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting Account…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HamburgerMenu;

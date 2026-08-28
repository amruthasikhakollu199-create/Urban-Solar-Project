import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function NotificationPanel({ isOpen, onToggle, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plantInfo, setPlantInfo] = useState(null);
  const panelRef = useRef(null);

  // Helper to ensure user's power plant record exists in public.power_plants
  const ensurePlantRecord = useCallback(async () => {
    if (!user) return null;
    try {
      const { data: existingPlant, error: fetchErr } = await supabase
        .from("power_plants")
        .select("id, city, area, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchErr) {
        console.warn("Notice fetching power plant:", fetchErr.message);
      }

      if (existingPlant) {
        setPlantInfo(existingPlant);
        return existingPlant;
      }

      // If no plant record exists yet, create one using metadata
      const city = user?.user_metadata?.city || "Vijayawada";
      const area = user?.user_metadata?.area || "Central Plant";

      const { data: newPlant, error: insertErr } = await supabase
        .from("power_plants")
        .insert([{ user_id: user.id, city, area }])
        .select()
        .maybeSingle();

      if (insertErr) {
        console.warn("Notice creating power plant record:", insertErr.message);
      }

      if (newPlant) {
        setPlantInfo(newPlant);
        return newPlant;
      }
    } catch (err) {
      console.warn("Exception in ensurePlantRecord:", err);
    }
    return null;
  }, [user]);

  // Fetch energy notifications intended for the logged-in user's power plant
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setError("");

    try {
      let currentPlant = plantInfo;
      if (!currentPlant) {
        currentPlant = await ensurePlantRecord();
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      let notifList = [];

      // 1. Fetch via Supabase Client (RLS protected)
      if (currentPlant?.id) {
        const { data: sbData, error: sbErr } = await supabase
          .from("energy_notifications")
          .select("*")
          .eq("target_plant_id", currentPlant.id)
          .order("created_at", { ascending: false });

        if (!sbErr && Array.isArray(sbData)) {
          notifList = sbData;
        }
      }

      // 2. Fallback to backend /notifications endpoint if needed
      if (notifList.length === 0) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const token = session?.access_token;
          const res = await fetch(`${apiUrl}/notifications?user_id=${user.id}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            const apiData = await res.json();
            if (apiData.notifications && Array.isArray(apiData.notifications)) {
              notifList = apiData.notifications;
            }
          }
        } catch (apiErr) {
          console.debug("Backend notification fetch notice:", apiErr);
        }
      }

      setNotifications(notifList);
      const unread = notifList.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching energy notifications:", err);
      setError("Unable to load notifications at this time.");
    } finally {
      setLoading(false);
    }
  }, [user, plantInfo, ensurePlantRecord]);

  // Initial load and periodic polling every 15 seconds
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchNotifications();

      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 15000);

      return () => clearInterval(intervalId);
    }
  }, [user, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.closest(".notification-bell-trigger")
      ) {
        if (onClose) onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Mark single notification as read
  const handleMarkAsRead = async (notif) => {
    if (notif.is_read) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      // 1. Update in Supabase
      await supabase
        .from("energy_notifications")
        .update({ is_read: true })
        .eq("id", notif.id);

      // 2. Also notify backend endpoint for reliability
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      fetch(`${apiUrl}/notifications/${notif.id}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => {});
    } catch (err) {
      console.warn("Notice marking notification read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      if (plantInfo?.id) {
        await supabase
          .from("energy_notifications")
          .update({ is_read: true })
          .eq("target_plant_id", plantInfo.id)
          .eq("is_read", false);
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      fetch(`${apiUrl}/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_plant_id: plantInfo?.id,
          user_id: user?.id,
        }),
      }).catch(() => {});
    } catch (err) {
      console.warn("Notice marking all notifications as read:", err);
    }
  };

  // Helper to extract source plant name from message
  const getSourcePlantName = (notif) => {
    if (notif.message && notif.message.includes("available from ")) {
      const parts = notif.message.split("available from ");
      if (parts[1]) {
        return parts[1].replace(/\.$/, "").trim();
      }
    }
    return "Surplus Solar Plant";
  };

  // Helper to format created timestamp
  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* 🔔 Floating Top-Right Notification Indicator Button */}
      <button
        type="button"
        id="notification-bell-btn"
        className="notification-bell-trigger"
        onClick={onToggle}
        aria-label="Toggle Energy Surplus Notifications"
        aria-expanded={isOpen}
        title="Energy Surplus Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge-count" id="notification-unread-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop for mobile / overlay */}
      {isOpen && (
        <div
          className="notification-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Notification Dropdown / Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="notification-panel-dropdown"
          role="region"
          aria-label="Energy Notifications Panel"
        >
          {/* Panel Header */}
          <div className="notif-panel-header">
            <div className="notif-header-title-wrap">
              <span className="notif-header-icon">⚡</span>
              <div>
                <h3 className="notif-header-title">Energy Surplus Alerts</h3>
                <span className="notif-header-subtitle">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All notifications caught up"}
                </span>
              </div>
            </div>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all-btn"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                className="notif-close-btn"
                onClick={onClose}
                aria-label="Close notification panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="notif-panel-body">
            {loading && notifications.length === 0 && (
              <div className="notif-loading-state">
                <span className="notif-loading-spinner">☀️</span>
                <p>Checking energy alerts…</p>
              </div>
            )}

            {error && notifications.length === 0 && (
              <div className="notif-error-state">{error}</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="notif-empty-state">
                <span className="notif-empty-icon">🌱</span>
                <h4>No energy notifications</h4>
                <p>
                  When another registered plant generates surplus power while your
                  plant has a power deficit, alerts will appear here.
                </p>
              </div>
            )}

            {notifications.length > 0 && (
              <div className="notif-list">
                {notifications.map((notif) => {
                  const sourceName = getSourcePlantName(notif);
                  const surplusKw = Number(notif.surplus_energy_kw);
                  const isRead = notif.is_read;

                  return (
                    <div
                      key={notif.id}
                      className={`notif-item-card ${isRead ? "notif-read" : "notif-unread"}`}
                      onClick={() => handleMarkAsRead(notif)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleMarkAsRead(notif);
                        }
                      }}
                    >
                      {/* Unread indicator dot */}
                      {!isRead && <span className="notif-unread-dot" title="Unread" />}

                      <div className="notif-card-main">
                        {/* Top row: Source plant & Time */}
                        <div className="notif-card-top-row">
                          <div className="notif-source-badge">
                            <span className="notif-plant-pin">📍</span>
                            <strong className="notif-source-name">{sourceName}</strong>
                          </div>
                          <span className="notif-time-badge">{formatTime(notif.created_at)}</span>
                        </div>

                        {/* Surplus Energy Pill */}
                        <div className="notif-surplus-pill">
                          <span className="surplus-pill-icon">⚡</span>
                          <span className="surplus-pill-text">
                            <strong>
                              +{surplusKw.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kW
                            </strong>{" "}
                            Surplus Energy Available
                          </span>
                        </div>

                        {/* Message */}
                        <p className="notif-message-text">{notif.message}</p>

                        {/* Status Footer */}
                        <div className="notif-status-footer">
                          <span
                            className={`notif-status-chip ${
                              isRead ? "status-chip-read" : "status-chip-unread"
                            }`}
                          >
                            {isRead ? "✓ Read" : "● New Alert — Click to mark read"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="notif-panel-footer">
            <small>Surplus power matched automatically from grid predictions</small>
          </div>
        </div>
      )}
    </>
  );
}

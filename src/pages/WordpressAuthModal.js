import React, { useState, useEffect } from "react";
import "./WordPressAuthModal.css";
import { FaWordpressSimple } from "react-icons/fa";

const API_BASE_URL = "https://ai.1upmedia.com:443/wordpress";

const WordPressAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [siteUrl, setSiteUrl] = useState("");
  const [authWindow, setAuthWindow] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  const handleOAuthRedirect = async () => {
    if (!siteUrl.trim()) {
      setStatus({
        message: "Please enter your WordPress site URL.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth?siteUrl=${encodeURIComponent(siteUrl)}`
      );
      const data = await response.json();

      if (data.success) {
        const popup = window.open(
          data.authUrl,
          "WordPressAuth",
          "width=600,height=700"
        );
        setAuthWindow(popup);
      } else {
        setStatus({
          message: "Failed to initiate authentication.",
          type: "error",
        });
      }
    } catch (error) {
      setStatus({ message: "Connection error", type: "error" });
    }
  };

  useEffect(() => {
    const handleAuthMessage = (event) => {
      console.log("Received event:", event.data);

      // Ensure the message is coming from the correct origin
      if (!event.origin.includes("ai.1upmedia.com")) return;

      const { success, siteUrl, username, appPassword } = event.data;

      if (success) {
        setStatus({ loading: false, message: "Connected!", type: "success" });
        onSuccess({ siteUrl, username, appPassword });

        if (authWindow) {
          authWindow.close();
        }
      } else {
        setStatus({
          loading: false,
          message: "Authentication failed",
          type: "error",
        });
      }
    };

    window.addEventListener("message", handleAuthMessage);

    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, [authWindow]);

  if (!isOpen) return null;

  return (
    <div className="wordpress-modal-overlay" onClick={onClose}>
      <div className="wordpress-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaWordpressSimple className="wordpress-logo" />
          <h2>Connect WordPress Site</h2>
        </div>

        <div className="wordpress-auth-content">
          <label>Enter Your WordPress Site URL</label>
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://your-site.com"
            required
          />

          <button
            className="wordpress-submit-btn"
            onClick={handleOAuthRedirect}
          >
            Connect via WordPress
          </button>
        </div>

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordPressAuthModal;

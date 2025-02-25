// WordPressAuthModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./WordPressAuthModal.css";
import { FaWordpressSimple } from "react-icons/fa";

const WordPressAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [credentials, setCredentials] = useState({
    siteUrl: "",
    username: "",
    appPassword: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "", // 'error' or 'success'
  });

  const handleValidation = async (e) => {
    e.preventDefault();
    setStatus({
      loading: true,
      message: "Validating credentials...",
      type: "info",
    });

    try {
      const response = await axios.post(
        "https://ai.1upmedia.com:443/wordpress/validate-wordpress",
        {
          siteUrl: credentials.siteUrl,
          username: credentials.username,
          appPassword: credentials.appPassword,
        }
      );

      if (response.data.success) {
        setStatus({
          loading: false,
          message: "Connection successful!",
          type: "success",
        });

        // Wait for 1 second to show success message
        setTimeout(() => {
          onSuccess({
            siteUrl: credentials.siteUrl,
            username: credentials.username,
            appPassword: credentials.appPassword,
            userData: response.data.user,
          });
        }, 1000);
      } else {
        setStatus({
          loading: false,
          message: response.data.message,
          type: "error",
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.message || "Connection failed",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wordpress-modal-overlay" onClick={onClose}>
      <div className="wordpress-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <img
            src={FaWordpressSimple}
            alt="WordPress"
            className="wordpress-logo"
          />
          <h2>Connect WordPress Site</h2>
        </div>

        <form onSubmit={handleValidation} className="wordpress-form">
          <div className="form-group">
            <label>WordPress Site URL</label>
            <input
              type="url"
              value={credentials.siteUrl}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  siteUrl: e.target.value,
                })
              }
              placeholder="https://your-site.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  username: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Application Password</label>
            <input
              type="password"
              value={credentials.appPassword}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  appPassword: e.target.value,
                })
              }
              placeholder="xxxx xxxx xxxx xxxx"
              required
            />
            <small>
              Generate from WordPress Dashboard → Users → Profile → Application
              Passwords
            </small>
          </div>

          <button
            type="submit"
            className={`wordpress-submit-btn ${
              status.loading ? "loading" : ""
            }`}
            disabled={status.loading}
          >
            {status.loading ? "Validating..." : "Connect Site"}
          </button>
        </form>

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

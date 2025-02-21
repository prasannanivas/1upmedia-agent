// WordPressShareModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./WordPressShareModal.css";
import { FaWordpress } from "react-icons/fa";

const WordPressShareModal = ({ isOpen, onClose, post, wordpressProfiles }) => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  const formatUTCDate = (date) => {
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  const handleShare = async () => {
    if (!selectedProfile) {
      setStatus({
        loading: false,
        message: "Please select a WordPress site",
        type: "error",
      });
      return;
    }

    console.log(post);
    setStatus({
      loading: true,
      message: "Publishing to WordPress...",
      type: "info",
    });

    try {
      // Format the post data

      // Get credentials from the selected profile
      const credentials = {
        siteUrl: selectedProfile.dynamic_fields.siteUrl,
        username: selectedProfile.dynamic_fields.username,
        appPassword: selectedProfile.access_token,
      };

      const postData = {
        title: post.title,
        content: post.content,
        scheduleDate: post.scheduleDate || formatUTCDate(new Date()),
        categories: post.categories || [1],
        image: {
          url: post?.image_data?.url,
          title: post.image_data?.title,
          alt: post.image_data?.alt,
          description: post.image_data?.description,
        },
        tags: post.tags || [],
        status: "future", //
      };

      const validationResponse = await axios.post(
        "http://ai.1upmedia.com:3000/wordpress/validate-wordpress",
        credentials
      );

      if (!validationResponse.data.success) {
        throw new Error("WordPress connection validation failed");
      }

      const scheduleResponse = await axios.post(
        "http://ai.1upmedia.com:3000/wordpress/schedule-post",
        {
          ...credentials,
          postData,
        }
      );

      if (scheduleResponse.data.success) {
        setStatus({
          loading: false,
          message: `Successfully scheduled for ${new Date(
            postData.scheduleDate
          ).toLocaleString()}!`,
          type: "success",
        });

        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(scheduleResponse.data.message);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.message || error.message,
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wp-share-modal-overlay" onClick={onClose}>
      <div className="wp-share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaWordpress className="wp-icon" />
          <h2>Share to WordPress</h2>
        </div>

        {wordpressProfiles.length > 0 ? (
          <div className="wp-sites-list">
            {wordpressProfiles.map((profile) => (
              <div
                key={profile.dynamic_fields.siteUrl}
                className={`wp-site-item ${
                  selectedProfile?.dynamic_fields.siteUrl ===
                  profile.dynamic_fields.siteUrl
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="site-info">
                  <h3>{profile.account_name}</h3>
                  <p>{profile.dynamic_fields.siteUrl}</p>
                </div>
                <div className="site-select">
                  <input
                    type="radio"
                    checked={
                      selectedProfile?.dynamic_fields.siteUrl ===
                      profile.dynamic_fields.siteUrl
                    }
                    onChange={() => setSelectedProfile(profile)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sites-message">
            <p>No WordPress sites connected.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}

        {wordpressProfiles.length > 0 && (
          <button
            className={`share-button ${status.loading ? "loading" : ""}`}
            onClick={handleShare}
            disabled={!selectedProfile || status.loading}
          >
            {status.loading ? "Publishing..." : "Publish to WordPress"}
          </button>
        )}

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

// Update your FloatingOptions component
export default WordPressShareModal;

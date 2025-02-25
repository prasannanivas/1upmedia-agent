// WordPressShareModal.jsx
import React, { useState } from "react";
import axios from "axios";
import "./WordPressShareModal.css";
import { FaWordpress } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const WordPressShareModal = ({ isOpen, onClose, post, wordpressProfiles }) => {
  const { authState } = useAuth();
  const { email } = authState;
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

    setStatus({
      loading: true,
      message: "Publishing to WordPress...",
      type: "info",
    });

    try {
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
        status: "future", // Scheduled post
      };

      const validationResponse = await axios.post(
        "https://ai.1upmedia.com:443/wordpress/validate-wordpress",
        credentials
      );

      if (!validationResponse.data.success) {
        throw new Error("WordPress connection validation failed");
      }

      const scheduleResponse = await axios.post(
        "https://ai.1upmedia.com:443/wordpress/schedule-post",
        {
          ...credentials,
          postData,
        }
      );

      // scheduleResponse.data

      //   {
      //     "success": true,
      //     "postId": 6694,
      //     "postUrl": "https://dev.1upmedia.com/industry-insights-on-ltte-prabakaran/",
      //     "scheduledDate": "2025-02-25T12:39:07",
      //     "featuredImage": {
      //         "id": 6693,
      //         "url": "https://res.cloudinary.com/dwakndhkf/image/upload/v1739444785/ai_generated_images/qqr3y5xhsxqetc185ybr.png"
      //     }
      // }

      if (scheduleResponse.data.success) {
        const { postId, postUrl, scheduledDate, featuredImage } =
          scheduleResponse.data;

        // Store share history immediately
        const shareHistoryEntry = {
          platform: "wordpress",
          link: postUrl,
          extra_data: {
            postId,
            scheduledDate,
            featuredImageUrl: featuredImage?.url || null,
            siteUrl: selectedProfile.dynamic_fields.siteUrl,
          },
        };

        setStatus({
          loading: false,
          message: `Successfully scheduled for ${new Date(
            postData.scheduleDate
          ).toLocaleString()}!`,
          type: "success",
        });

        try {
          await axios.put(
            `https://ai.1upmedia.com:443/aiagent/posts/${email}/${post.post_id}/share-history`,
            {
              share_history: [shareHistoryEntry],
            }
          );
        } catch (error) {
          console.error("Error storing share history:", error);
        }

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

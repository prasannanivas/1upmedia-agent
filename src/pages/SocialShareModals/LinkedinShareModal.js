import React, { useState, useEffect } from "react";
import { FaLinkedin } from "react-icons/fa";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";

const LINKEDIN_TEXT_LIMIT = 3000;

const LinkedInShareModal = ({ isOpen, onClose, post, linkedinProfiles }) => {
  const { authState } = useAuth();
  const { email } = authState;
  // State for selected profile
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);

  // Content state
  const [content, setContent] = useState("");

  // Status state
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // Get current profile
  const selectedProfile = linkedinProfiles?.[selectedProfileIndex];
  const accessToken = selectedProfile?.access_token;

  // Format initial content
  useEffect(() => {
    if (post?.content) {
      const formatted = ContentFormatter.format(post.content, {
        preserveLinks: true,
        addSpacing: true,
      });
      setContent(formatted.slice(0, LINKEDIN_TEXT_LIMIT));
    }
  }, [post?.content]);

  const handleTruncateContent = () => {
    setContent((prev) => prev.slice(0, LINKEDIN_TEXT_LIMIT));
  };

  const handleShare = async () => {
    if (!content.trim()) {
      setStatus({
        loading: false,
        message: "Content is required",
        type: "error",
      });
      return;
    }

    setStatus({
      loading: true,
      message: "Publishing to LinkedIn...",
      type: "info",
    });

    try {
      const postData = {
        accessToken: accessToken,
        text: content.trim(),
        scheduleDate: "2025-02-21 20:19:46",
        author: "prasannanivas",
        imageUrl: post?.image_data?.url,
      };

      const response = await axios.post(
        "http://ai.1upmedia.com:3000/linkedin/shareOnLinkedIn",
        postData
      );
      // response.data

      //   {
      //     "success": true,
      //     "message": "Post shared successfully!",
      //     "data": {
      //         "id": "urn:li:share:7300141466348134400"
      //     }
      // }
      if (response.data.success) {
        const postUrl = `https://www.linkedin.com/feed/update/${response.data?.data?.id}`;

        // Store share history immediately
        const shareHistoryEntry = {
          platform: "linkedIn",
          link: postUrl,
          extra_data: {
            postId: response.data.data.id,
            imageUrl: post?.image_data?.url || null,
          },
        };

        setStatus({
          loading: false,
          message: "Successfully posted to LinkedIn!",
          type: "success",
        });
        try {
          await axios.put(
            `http://ai.1upmedia.com:3000/aiagent/posts/${email}/${post.post_id}/share-history`,
            {
              share_history: [shareHistoryEntry],
            }
          );
        } catch (error) {
          console.error("Error storing share history", error);
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.data);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.message || "Error posting to LinkedIn",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  const charsRemaining = LINKEDIN_TEXT_LIMIT - content.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div
        className="social-share-modal linkedin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaLinkedin className="linkedin-icon" />
          <h2>Share to LinkedIn</h2>

          {/* Profile Selector */}
          {linkedinProfiles && linkedinProfiles.length > 1 && (
            <div className="profile-selector">
              <label>Select LinkedIn Profile: </label>
              <select
                value={selectedProfileIndex}
                onChange={(e) =>
                  setSelectedProfileIndex(Number(e.target.value))
                }
              >
                {linkedinProfiles.map((profile, index) => (
                  <option key={profile._id || index} value={index}>
                    {profile.account_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show account info */}
          <div className="linkedin-account-info">
            <img
              src={selectedProfile?.profile_picture}
              alt=""
              className="profile-picture"
            />
            <span>Posting as: {selectedProfile?.account_name}</span>
          </div>
        </div>

        <div className="content-editor-section">
          {/* Content Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Post Content</h3>
              <div className="content-controls">
                <span className={isOverLimit ? "over-limit" : ""}>
                  {charsRemaining} characters remaining
                </span>
                {isOverLimit && (
                  <button
                    onClick={handleTruncateContent}
                    className="truncate-button"
                  >
                    Truncate
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`content-textarea ${isOverLimit ? "error" : ""}`}
              placeholder="Write your LinkedIn post..."
              rows={8}
            />
          </div>
        </div>

        {/* Share Button */}
        <button
          className={`share-button linkedin ${status.loading ? "loading" : ""}`}
          onClick={handleShare}
          disabled={!content.trim() || isOverLimit || status.loading}
        >
          {status.loading ? "Publishing..." : "Post to LinkedIn"}
        </button>

        {/* Status Message */}
        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInShareModal;

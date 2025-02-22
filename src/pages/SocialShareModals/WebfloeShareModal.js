import React, { useState, useEffect } from "react";
import { SiWebflow } from "react-icons/si";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";

const WEBFLOW_TEXT_LIMIT = 10000; // Arbitrary limit for Webflow

const WebflowShareModal = ({ isOpen, onClose, post, webflowProfiles }) => {
  // State for selected profile and site

  console.log(webflowProfiles);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [sites, setSites] = useState([]);
  const [collections, setCollections] = useState([]);

  // Content state
  const [content, setContent] = useState("");

  // Status state
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // Success with link state
  const [successWithLink, setSuccessWithLink] = useState({
    show: false,
    url: "",
  });

  // Get current profile
  const selectedProfile = webflowProfiles?.[selectedProfileIndex];
  const accessToken = selectedProfile?.access_token;

  // Fetch sites when profile changes
  useEffect(() => {
    if (accessToken) {
      fetchSites();
    }
  }, [accessToken]);

  // Fetch sites
  const fetchSites = async () => {
    try {
      const response = await axios.get(
        `http://ai.1upmedia.com:3000/webflow/sites?accessToken=${accessToken}`
      );
      setSites(response.data.sites);
      if (response.data.sites.length > 0) {
        setSelectedSiteId(response.data.sites[0].id);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  // Format initial content
  useEffect(() => {
    if (post?.content) {
      const formatted = ContentFormatter.format(post.content, {
        preserveLinks: true,
        addSpacing: true,
      });
      setContent(formatted.slice(0, WEBFLOW_TEXT_LIMIT));
    }
  }, [post?.content]);

  const handleTruncateContent = () => {
    setContent((prev) => prev.slice(0, WEBFLOW_TEXT_LIMIT));
  };

  const handleShare = async () => {
    if (!content.trim() || !selectedSiteId) {
      setStatus({
        loading: false,
        message: "Content and site selection are required",
        type: "error",
      });
      return;
    }

    setStatus({
      loading: true,
      message: "Publishing to Webflow...",
      type: "info",
    });

    try {
      const postData = {
        accessToken: accessToken,
        siteId: selectedSiteId,
        content: {
          title: post.title || "New Post",
          body: content.trim(),
          tags: post.tags,
          categories: post.categories,
        },
        imageUrl: post?.image_data?.url,
      };

      const response = await axios.post(
        "http://ai.1upmedia.com:3000/webflow/publish-webflow-post",
        postData
      );

      if (response.data.success) {
        setStatus({
          loading: false,
          message: "Successfully published to Webflow!",
          type: "success",
        });

        setSuccessWithLink({
          show: true,
          url: response.data.liveUrl,
        });

        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.error || "Error publishing to Webflow",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  const charsRemaining = WEBFLOW_TEXT_LIMIT - content.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div
        className="social-share-modal webflow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <SiWebflow className="webflow-icon" />
          <h2>Share to Webflow</h2>

          {/* Profile Selector */}
          {webflowProfiles && webflowProfiles.length > 1 && (
            <div className="profile-selector">
              <label>Select Webflow Profile: </label>
              <select
                value={selectedProfileIndex}
                onChange={(e) =>
                  setSelectedProfileIndex(Number(e.target.value))
                }
              >
                {webflowProfiles.map((profile, index) => (
                  <option key={profile._id || index} value={index}>
                    {profile.account_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Site Selector */}
          {sites.length > 0 && (
            <div className="site-selector">
              <label>Select Site: </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show account info */}
          <div className="webflow-account-info">
            <span>Publishing as: {selectedProfile?.account_name}</span>
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
              placeholder="Write your post content..."
              rows={6}
            />
          </div>

          {/* Image Preview */}
          {post?.image_data?.url && (
            <div className="image-preview">
              <img src={post.image_data.url} alt="Post" />
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          className={`share-button webflow ${status.loading ? "loading" : ""}`}
          onClick={handleShare}
          disabled={
            !content.trim() || isOverLimit || status.loading || !selectedSiteId
          }
        >
          {status.loading ? "Publishing..." : "Publish to Webflow"}
        </button>

        {/* Status Message */}
        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
            {successWithLink.show && (
              <div className="post-link">
                <a
                  href={successWithLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="webflow-post-link"
                >
                  View Post
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebflowShareModal;

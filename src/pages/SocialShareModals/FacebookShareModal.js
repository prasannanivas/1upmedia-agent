import React, { useState, useMemo } from "react";
import { FaFacebook } from "react-icons/fa";
import axios from "axios";
import "./SocialShareModal.css";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";
const FACEBOOK_CAPTION_LIMIT = 63206; // Facebook's character limit

const FacebookShareModal = ({ isOpen, onClose, post, facebookPages }) => {
  const { authState } = useAuth();
  const { email } = authState;
  // Parse and format the initial content
  const initialContent = useMemo(() => {
    if (!post?.content) return "";
    return ContentFormatter.format(post.content, {
      maxLength: FACEBOOK_CAPTION_LIMIT,
      preserveLinks: true,
      addSpacing: true,
    });
  }, [post?.content]);

  const [editedCaption, setEditedCaption] = useState(initialContent);
  const [selectedPages, setSelectedPages] = useState([]);
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
    progress: { completed: 0, total: 0 },
  });

  // Calculate remaining characters
  const remainingChars = FACEBOOK_CAPTION_LIMIT - editedCaption.length;
  const isOverLimit = remainingChars < 0;

  const handleCaptionChange = (e) => {
    setEditedCaption(e.target.value);
  };

  const handleTruncate = () => {
    setEditedCaption((prev) => prev.slice(0, FACEBOOK_CAPTION_LIMIT));
  };

  const handlePageSelect = (page) => {
    setSelectedPages((prev) => {
      const isSelected = prev.some((p) => p._id === page._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== page._id);
      } else {
        return [...prev, page];
      }
    });
  };

  const handleShare = async () => {
    if (selectedPages.length === 0) {
      setStatus({
        loading: false,
        message: "Please select at least one Facebook page",
        type: "error",
        progress: { completed: 0, total: 0 },
      });
      return;
    }

    if (isOverLimit) {
      setStatus({
        loading: false,
        message: `Caption exceeds ${FACEBOOK_CAPTION_LIMIT} characters limit. Please shorten it.`,
        type: "error",
        progress: { completed: 0, total: 0 },
      });
      return;
    }

    setStatus({
      loading: true,
      message: `Publishing to ${selectedPages.length} page${
        selectedPages.length > 1 ? "s" : ""
      }...`,
      type: "info",
      progress: { completed: 0, total: selectedPages.length },
    });

    try {
      const results = await Promise.allSettled(
        selectedPages.map(async (page) => {
          try {
            const postData = {
              pageId: page.dynamic_fields.page_id,
              accessToken: page.access_token,
              imageUrl: post?.image_data?.url,
              caption: initialContent,
              scheduleDate: post.scheduleDate || "2025-02-21 15:25:38",
              should_not_optimise: true,
            };

            const response = await axios.post(
              "https://ai.1upmedia.com:443/facebook/postImageToFacebookPage",
              postData
            );
            // response.data
            // {"success":true,"postId":"122146739510503075"}

            if (response.data.success) {
              const postUrl = `https://www.facebook.com/${response.data?.postId}`;

              // Store share history immediately
              const shareHistoryEntry = {
                platform: "facebook",
                link: postUrl,
                extra_data: {
                  postId: response.data.postId,
                  pageName: page.account_name,
                  scheduleDate: post.scheduleDate || "2025-02-21 15:25:38",
                  imageUrl: post?.image_data?.url || null,
                },
              };

              setStatus((prev) => ({
                ...prev,
                progress: {
                  completed: prev.progress.completed + 1,
                  total: selectedPages.length,
                },
              }));

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

              return {
                pageName: page.account_name,
                success: true,
                message: "Successfully posted",
              };
            } else {
              throw new Error("Post failed");
            }
          } catch (error) {
            return {
              pageName: page.account_name,
              success: false,
              message:
                error.response?.data?.message ||
                error.message ||
                "Error posting to Facebook",
            };
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = selectedPages.length - successful;

      setStatus({
        loading: false,
        message: `${successful} post${
          successful !== 1 ? "s" : ""
        } scheduled successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        type:
          failed === 0
            ? "success"
            : failed === selectedPages.length
            ? "error"
            : "warning",
        progress: { completed: successful, total: selectedPages.length },
      });

      if (successful === selectedPages.length) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.message || error.message,
        type: "error",
        progress: { completed: 0, total: selectedPages.length },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div className="social-share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaFacebook className="fb-icon" />
          <h2>Share to Facebook</h2>
        </div>

        {/* Content Preview and Editor Section */}
        <div className="content-editor-section">
          <div className="content-header">
            <h3>Post Content</h3>
            <div className="character-count">
              <span className={isOverLimit ? "over-limit" : ""}>
                {remainingChars >= 0
                  ? `${remainingChars} characters remaining`
                  : `${Math.abs(remainingChars)} characters over limit`}
              </span>
            </div>
          </div>

          {post?.image_data?.url && (
            <div className="image-preview">
              <img src={post.image_data.url} alt="Post preview" />
            </div>
          )}

          <div className="content-editor">
            <textarea
              value={editedCaption}
              onChange={handleCaptionChange}
              className={`content-textarea ${isOverLimit ? "error" : ""}`}
              placeholder="Write your post content..."
              rows={6}
            />
            {isOverLimit && (
              <div className="content-warning">
                <span>Content exceeds Facebook's character limit!</span>
                <button onClick={handleTruncate} className="truncate-button">
                  Truncate to {FACEBOOK_CAPTION_LIMIT} characters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rest of your existing JSX code */}
        {facebookPages?.length > 0 ? (
          <>
            <div className="select-all-container">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={selectedPages.length === facebookPages.length}
                  onChange={() => {
                    if (selectedPages.length === facebookPages.length) {
                      setSelectedPages([]);
                    } else {
                      setSelectedPages([...facebookPages]);
                    }
                  }}
                />
                Select All Pages
              </label>
              <span className="selected-count">
                {selectedPages.length} of {facebookPages.length} selected
              </span>
            </div>

            <div className="fb-pages-list">
              {facebookPages.map((page) => (
                <div
                  key={page._id}
                  className={`fb-page-item ${
                    selectedPages.some((p) => p._id === page._id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handlePageSelect(page)}
                >
                  <div className="page-info">
                    <div className="page-image">
                      <img
                        src={page.profile_picture}
                        alt={page.account_name}
                        className="profile-pic"
                      />
                    </div>
                    <div className="page-details">
                      <h3>{page.account_name}</h3>
                      <p>{page.social_media_name}</p>
                    </div>
                  </div>
                  <div className="page-select">
                    <input
                      type="checkbox"
                      checked={selectedPages.some((p) => p._id === page._id)}
                      onChange={() => handlePageSelect(page)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-pages-message">
            <p>No Facebook pages connected.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}

        {facebookPages?.length > 0 && (
          <button
            className={`share-button facebook ${
              status.loading ? "loading" : ""
            }`}
            onClick={handleShare}
            disabled={
              selectedPages.length === 0 || status.loading || isOverLimit
            }
          >
            {status.loading
              ? `Publishing (${status.progress.completed}/${status.progress.total})...`
              : `Publish to ${selectedPages.length || "Facebook"} ${
                  selectedPages.length > 1 ? "Pages" : "Page"
                }`}
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

export default FacebookShareModal;

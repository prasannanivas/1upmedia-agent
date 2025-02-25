import React, { useState } from "react";
import { FaInstagram } from "react-icons/fa";
import axios from "axios";
import "./SocialShareModal.css";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";

const INSTAGRAM_CAPTION_LIMIT = 2200;

const InstagramShareModal = ({ isOpen, onClose, post, instagramAccounts }) => {
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [editedCaption, setEditedCaption] = useState(
    ContentFormatter.format(post?.content) || ""
  );
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
    progress: { completed: 0, total: 0 },
  });

  const { authState } = useAuth();
  const { email } = authState;

  // Calculate remaining characters
  const remainingChars = INSTAGRAM_CAPTION_LIMIT - editedCaption.length;
  const isOverLimit = remainingChars < 0;

  const handleCaptionChange = (e) => {
    const newCaption = e.target.value;
    setEditedCaption(newCaption);
  };

  const truncateCaption = () => {
    setEditedCaption((prev) => prev.slice(0, INSTAGRAM_CAPTION_LIMIT));
  };

  const handleAccountSelect = (account) => {
    setSelectedAccounts((prev) => {
      const isSelected = prev.some((p) => p._id === account._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== account._id);
      } else {
        return [...prev, account];
      }
    });
  };

  const handleShare = async () => {
    if (selectedAccounts.length === 0) {
      setStatus({
        loading: false,
        message: "Please select at least one Instagram account",
        type: "error",
        progress: { completed: 0, total: 0 },
      });
      return;
    }

    if (isOverLimit) {
      setStatus({
        loading: false,
        message: `Caption exceeds ${INSTAGRAM_CAPTION_LIMIT} characters limit. Please shorten it.`,
        type: "error",
        progress: { completed: 0, total: 0 },
      });
      return;
    }

    setStatus({
      loading: true,
      message: `Publishing to ${selectedAccounts.length} account${
        selectedAccounts.length > 1 ? "s" : ""
      }...`,
      type: "info",
      progress: { completed: 0, total: selectedAccounts.length },
    });

    try {
      const results = await Promise.allSettled(
        selectedAccounts.map(async (account) => {
          try {
            const postData = {
              instagramAccountId: account.dynamic_fields.page_id,
              accessToken: account.access_token,
              imageUrl: post?.image_data?.url,
              caption: editedCaption, // Using edited caption instead of original
              scheduleDate: post.scheduleDate || "2025-02-21 15:48:56",
            };

            const response = await axios.post(
              "http://ai.1upmedia.com:3000/facebook/postImageToInstagramPage",
              postData
            );

            if (response.data.success) {
              const postUrl = `https://www.instagram.com/p/${response.data.postId}`;

              // Store share history immediately
              const shareHistoryEntry = {
                platform: "instagram",
                link: postUrl,
                extra_data: {
                  postId: response.data.postId,
                  accountName: account.account_name,
                  scheduleDate: post.scheduleDate || "2025-02-21 15:48:56",
                  imageUrl: post?.image_data?.url || null,
                },
              };

              setStatus((prev) => ({
                ...prev,
                progress: {
                  completed: prev.progress.completed + 1,
                  total: selectedAccounts.length,
                },
              }));

              try {
                await axios.put(
                  `http://ai.1upmedia.com:3000/aiagent/posts/${email}/${post.post_id}/share-history`,
                  {
                    share_history: [shareHistoryEntry],
                  }
                );
              } catch (error) {
                console.error("Error storing share history:", error);
              }

              return {
                accountName: account.account_name,
                success: true,
                message: "Successfully posted",
              };
            } else {
              throw new Error("Post failed");
            }
          } catch (error) {
            if (
              error.response?.data?.message?.includes(
                "maximum number of characters permitted"
              )
            ) {
              return {
                accountName: account.account_name,
                success: false,
                message: "Caption exceeds Instagram's character limit",
              };
            }
            return {
              accountName: account.account_name,
              success: false,
              message:
                error.response?.data?.message ||
                error.message ||
                "Error posting to Instagram",
            };
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = selectedAccounts.length - successful;

      setStatus({
        loading: false,
        message: `${successful} post${
          successful !== 1 ? "s" : ""
        } scheduled successfully${failed > 0 ? `, ${failed} failed` : ""}`,
        type:
          failed === 0
            ? "success"
            : failed === selectedAccounts.length
            ? "error"
            : "warning",
        progress: { completed: successful, total: selectedAccounts.length },
      });

      if (successful === selectedAccounts.length) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.message || error.message,
        type: "error",
        progress: { completed: 0, total: selectedAccounts.length },
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
          <FaInstagram className="ig-icon" />
          <h2>Share to Instagram</h2>
        </div>

        {/* Caption Editor */}
        <div className="caption-editor">
          <div className="caption-header">
            <label>Caption</label>
            <span className={`char-count ${isOverLimit ? "over-limit" : ""}`}>
              {remainingChars} characters remaining
            </span>
          </div>
          <textarea
            value={editedCaption}
            onChange={handleCaptionChange}
            className={`caption-textarea ${isOverLimit ? "error" : ""}`}
            placeholder="Write your caption..."
          />
          {isOverLimit && (
            <div className="caption-warning">
              <span>Caption is too long!</span>
              <button onClick={truncateCaption} className="truncate-button">
                Truncate to {INSTAGRAM_CAPTION_LIMIT} characters
              </button>
            </div>
          )}
        </div>

        {instagramAccounts?.length > 0 ? (
          <>
            <div className="select-all-container">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={selectedAccounts.length === instagramAccounts.length}
                  onChange={() => {
                    if (selectedAccounts.length === instagramAccounts.length) {
                      setSelectedAccounts([]);
                    } else {
                      setSelectedAccounts([...instagramAccounts]);
                    }
                  }}
                />
                Select All Accounts
              </label>
              <span className="selected-count">
                {selectedAccounts.length} of {instagramAccounts.length} selected
              </span>
            </div>

            <div className="ig-accounts-list">
              {instagramAccounts.map((account) => (
                <div
                  key={account._id}
                  className={`ig-account-item ${
                    selectedAccounts.some((a) => a._id === account._id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="account-info">
                    <div className="account-image">
                      <img
                        src={account.profile_picture}
                        alt={account.account_name}
                        className="profile-pic"
                      />
                    </div>
                    <div className="account-details">
                      <h3>{account.account_name}</h3>
                      <p>{account.social_media_name}</p>
                    </div>
                  </div>
                  <div className="account-select">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.some(
                        (a) => a._id === account._id
                      )}
                      onChange={() => handleAccountSelect(account)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-accounts-message">
            <p>No Instagram accounts connected.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}

        {instagramAccounts?.length > 0 && (
          <button
            className={`share-button instagram ${
              status.loading ? "loading" : ""
            }`}
            onClick={handleShare}
            disabled={
              selectedAccounts.length === 0 || status.loading || isOverLimit
            }
          >
            {status.loading
              ? `Publishing (${status.progress.completed}/${status.progress.total})...`
              : `Publish to ${selectedAccounts.length || "Instagram"} ${
                  selectedAccounts.length > 1 ? "Accounts" : "Account"
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

export default InstagramShareModal;

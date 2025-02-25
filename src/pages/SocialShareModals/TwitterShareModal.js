import React, { useState, useEffect } from "react";
import { FaTwitter } from "react-icons/fa";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";
const TWITTER_TEXT_LIMIT = 5980; // Twitter's character limit

const TwitterShareModal = ({ isOpen, onClose, post, twitterProfiles }) => {
  console.log(twitterProfiles);
  // State for selected profile

  const { authState } = useAuth();
  const { email } = authState;
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);

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
  const selectedProfile = twitterProfiles?.[selectedProfileIndex];
  const accessToken = selectedProfile?.access_token;

  // Format initial content
  useEffect(() => {
    if (post?.content) {
      const formatted = ContentFormatter.format(post.content, {
        preserveLinks: true,
        addSpacing: true,
      });
      setContent(formatted.slice(0, TWITTER_TEXT_LIMIT));
    }
  }, [post?.content]);

  const handleTruncateContent = () => {
    setContent((prev) => prev.slice(0, TWITTER_TEXT_LIMIT));
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
      message: "Publishing to Twitter...",
      type: "info",
    });

    try {
      const postData = {
        accessToken: accessToken,
        tweetText: content.trim(),
        imageUrl: post?.image_data?.url,
        scheduleDate: "2025-02-22 13:50:11",
        author: "prasannanivas",
      };

      const response = await axios.post(
        "http://ai.1upmedia.com:3000/twitter/posttweet",
        postData
      );

      // response.data

      //   {
      //     "success": true,
      //     "thread": [
      //         {
      //             "id": "1894364843412517053",
      //             "url": "https://twitter.com/i/web/status/1894364843412517053"
      //         },
      //         {
      //             "id": "1894364849418752200",
      //             "url": "https://twitter.com/i/web/status/1894364849418752200"
      //         },
      //         {
      //             "id": "1894364854443524137",
      //             "url": "https://twitter.com/i/web/status/1894364854443524137"
      //         },
      //         {
      //             "id": "1894364859434762538",
      //             "url": "https://twitter.com/i/web/status/1894364859434762538"
      //         },
      //         {
      //             "id": "1894364864421806083",
      //             "url": "https://twitter.com/i/web/status/1894364864421806083"
      //         },
      //         {
      //             "id": "1894364869488517335",
      //             "url": "https://twitter.com/i/web/status/1894364869488517335"
      //         },
      //         {
      //             "id": "1894364874567798897",
      //             "url": "https://twitter.com/i/web/status/1894364874567798897"
      //         },
      //         {
      //             "id": "1894364879596712050",
      //             "url": "https://twitter.com/i/web/status/1894364879596712050"
      //         }
      //     ],
      //     "mainTweetUrl": "https://twitter.com/i/web/status/1894364843412517053",
      //     "postedAt": "2025-02-22 15:52:50",
      //     "author": "prasannanivas"
      // }

      if (response.data.success) {
        const { mainTweetUrl, thread } = response.data;

        // Create share history object
        const shareHistoryEntry = {
          platform: "twitter",
          link: mainTweetUrl,
          extra_data: {
            thread,
          },
        };

        // Store share history in backend

        setStatus({
          loading: false,
          message: "Successfully posted to Twitter!",
          type: "success",
        });

        setSuccessWithLink({
          show: true,
          url: mainTweetUrl,
        });

        try {
          await axios.put(
            `http://ai.1upmedia.com:3000/aiagent/posts/${email}/${post.post_id}/share-history`,
            {
              share_history: [shareHistoryEntry],
            }
          );
        } catch (error) {
          console.error(error);
        }

        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.error || "Error posting to Twitter",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  const charsRemaining = TWITTER_TEXT_LIMIT - content.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div
        className="social-share-modal twitter-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaTwitter className="twitter-icon" />
          <h2>Share to Twitter</h2>

          {/* Profile Selector */}
          {twitterProfiles && twitterProfiles.length > 1 && (
            <div className="profile-selector">
              <label>Select Twitter Profile: </label>
              <select
                value={selectedProfileIndex}
                onChange={(e) =>
                  setSelectedProfileIndex(Number(e.target.value))
                }
              >
                {twitterProfiles.map((profile, index) => (
                  <option key={profile._id || index} value={index}>
                    {profile.account_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show account info */}
          <div className="twitter-account-info">
            <img
              src={selectedProfile?.profile_picture}
              alt=""
              className="profile-picture"
            />
            <span>Posting as: @{selectedProfile?.account_name}</span>
          </div>
        </div>

        <div className="content-editor-section">
          {/* Content Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Tweet Content</h3>
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
              placeholder="What's happening?"
              rows={6}
            />
          </div>
        </div>

        {/* Share Button */}
        <button
          className={`share-button twitter ${status.loading ? "loading" : ""}`}
          onClick={handleShare}
          disabled={!content.trim() || isOverLimit || status.loading}
        >
          {status.loading ? "Publishing..." : "Post to Twitter"}
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
                  className="twitter-post-link"
                >
                  View Tweet
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterShareModal;

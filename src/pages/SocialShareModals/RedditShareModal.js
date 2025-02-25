import React, { useState, useEffect, useMemo } from "react";
import { FaReddit } from "react-icons/fa";
import axios from "axios";
import debounce from "lodash/debounce";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";

const REDDIT_TITLE_LIMIT = 300;
const REDDIT_TEXT_LIMIT = 40000;

const RedditShareModal = ({ isOpen, onClose, post, redditProfiles }) => {
  // State to track which profile is currently selected
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);

  const { authState } = useAuth();
  const { email } = authState;
  // Subreddit/user-sub state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subreddits, setSubreddits] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Flair state
  const [flairs, setFlairs] = useState([]);
  const [selectedFlair, setSelectedFlair] = useState(null);
  const [flairRestricted, setFlairRestricted] = useState(false);

  // Status message/loading state
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // For personal user subreddit (u_xxx)
  const [userSubreddit, setUserSubreddit] = useState(null);

  // Safely grab the currently-selected profile
  const selectedProfile =
    redditProfiles && redditProfiles.length > 0
      ? redditProfiles[selectedProfileIndex]
      : null;

  // Utility to get the current access token safely
  const accessToken = selectedProfile?.access_token || "";
  // The user's Reddit account name
  const accountName = selectedProfile?.account_name || "";

  // Format initial content once post changes or profile changes
  useEffect(() => {
    if (!post) return;

    // Format post content
    if (post.content) {
      const formatted = ContentFormatter.format(post.content, {
        preserveLinks: true,
        addSpacing: true,
      });
      const lines = formatted.split("\n");
      setTitle(post.title);
      setContent(lines.slice(1).join("\n").trim());
    }

    // Set up user's personal subreddit if present in dynamic_fields
    if (selectedProfile?.dynamic_fields?.subreddit) {
      const userSubData = {
        // Make sure to use the correct format for user subreddits
        name: `${selectedProfile.account_name}`, // Changed this line
        title:
          selectedProfile.dynamic_fields.subreddit.title ||
          "Personal Subreddit",
        icon:
          selectedProfile.profile_picture ||
          selectedProfile.dynamic_fields.subreddit.icon_img,
        isPersonal: true,
      };
      setUserSubreddit(userSubData);
      setSelectedSubreddit(userSubData);
    } else {
      setUserSubreddit(null);
    }
  }, [post, selectedProfile]);

  // Fetch subreddits the user subscribes to
  const fetchSubreddits = async () => {
    if (!accessToken) return;

    try {
      const response = await axios.get(
        `http://ai.1upmedia.com:3000/reddit/subreddits`,
        {
          params: {
            accessToken: accessToken,
          },
        }
      );
      setSubreddits(response.data.subreddits);
    } catch (error) {
      console.error("Error fetching subreddits:", error);
      setStatus({
        loading: false,
        message: "Error fetching subreddits",
        type: "error",
      });
    }
  };

  // Debounced search function for subreddits
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        if (!accessToken || !query || query.length < 2) {
          setSearchResults([]);
          return;
        }

        try {
          const response = await axios.get(
            `http://ai.1upmedia.com:3000/reddit/search-subreddits`,
            {
              params: {
                accessToken: accessToken,
                query,
              },
            }
          );
          setSearchResults(response.data.subreddits);
        } catch (error) {
          console.error("Error searching subreddits:", error);
        }
      }, 500),
    [accessToken]
  );

  // Fetch flairs for selectedSubreddit
  const fetchFlairs = async () => {
    if (!accessToken || !selectedSubreddit) return;

    try {
      const response = await axios.get(
        `http://ai.1upmedia.com:3000/reddit/flairs`,
        {
          params: {
            accessToken: accessToken,
            subreddit: selectedSubreddit.name,
          },
        }
      );
      setFlairs(response.data.flairs);
      setFlairRestricted(response.data.flairRestricted);
    } catch (error) {
      console.error("Error fetching flairs:", error);
      setFlairs([]);
      setFlairRestricted(true);
    }
  };

  // Call fetchSubreddits when the modal opens or when the profile changes
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchSubreddits();
    }
  }, [isOpen, accessToken]);

  // Re-fetch flairs whenever selectedSubreddit changes
  useEffect(() => {
    fetchFlairs();
  }, [selectedSubreddit]);

  // Handle subreddit search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle picking a subreddit from the list
  const handleSubredditSelect = (subreddit) => {
    setSelectedSubreddit(subreddit);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedFlair(null);
  };

  // Truncate helpers
  const handleTruncateTitle = () => {
    setTitle((prev) => prev.slice(0, REDDIT_TITLE_LIMIT));
  };

  const handleTruncateContent = () => {
    setContent((prev) => prev.slice(0, REDDIT_TEXT_LIMIT));
  };

  // Actually post to Reddit
  const handleShare = async () => {
    if (!selectedSubreddit) {
      setStatus({
        loading: false,
        message: "Please select a subreddit",
        type: "error",
      });
      return;
    }
    if (!title.trim()) {
      setStatus({
        loading: false,
        message: "Title is required",
        type: "error",
      });
      return;
    }

    setStatus({
      loading: true,
      message: "Publishing to Reddit...",
      type: "info",
    });

    try {
      const postData = {
        accessToken: accessToken,
        subreddit: selectedSubreddit.name,
        title: title.trim(),
        text: content.trim(),
        flairId: selectedFlair?.id,
      };

      const response = await axios.post(
        "http://ai.1upmedia.com:3000/reddit/post",
        postData
      );

      // response.data
      //   {
      //     "success": true,
      //     "data": {
      //         "errors": [],
      //         "data": {
      //             "url": "https://www.reddit.com/r/TamilNadu/comments/1ixu06z/industry_insights_on_ltte_prabakaran/",
      //             "drafts_count": 0,
      //             "id": "1ixu06z",
      //             "name": "t3_1ixu06z"
      //         }
      //     }
      // }

      if (response.data.success) {
        const { url, id, name, drafts_count } = response.data.data;

        // Store share history immediately
        const shareHistoryEntry = {
          platform: "reddit",
          link: url,
          extra_data: {
            postId: id,
            postName: name,
            draftsCount: drafts_count,
            subreddit: selectedSubreddit.name,
            flairId: selectedFlair?.id || null,
          },
        };

        setStatus({
          loading: false,
          message: "Successfully posted to Reddit!",
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
          console.error("Error storing share history:", error);
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus({
          loading: false,
          message: "Error: Something unexpected happened.",
          type: "error",
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.error || "Error posting to Reddit",
        type: "error",
      });
    }
  };

  // Don’t render if the modal isn’t open
  if (!isOpen) return null;

  // Character limit checks
  const titleCharsRemaining = REDDIT_TITLE_LIMIT - title.length;
  const contentCharsRemaining = REDDIT_TEXT_LIMIT - content.length;
  const isTitleOverLimit = titleCharsRemaining < 0;
  const isContentOverLimit = contentCharsRemaining < 0;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div
        className="social-share-modal reddit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaReddit className="reddit-icon" />
          <h2>Share to Reddit</h2>

          {/* Profile Selector */}
          {redditProfiles && redditProfiles.length > 1 && (
            <div className="profile-selector">
              <label>Select Reddit Profile: </label>
              <select
                value={selectedProfileIndex}
                onChange={(e) =>
                  setSelectedProfileIndex(Number(e.target.value))
                }
              >
                {redditProfiles.map((profile, index) => (
                  <option key={profile._id || index} value={index}>
                    {profile.account_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show account name for clarity */}
          <div className="reddit-account-info">
            Posting as: {accountName || "Unknown"}
          </div>
        </div>

        <div className="content-editor-section">
          {/* Subreddit Selection */}
          <div className="subreddit-selector">
            <h3>Select Subreddit</h3>
            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search subreddits..."
                className="search-input"
              />
            </div>

            <div className="subreddits-list">
              {/* Personal user subreddit first, if any */}
              {userSubreddit && (
                <div
                  className={`subreddit-item personal ${
                    selectedSubreddit?.name === userSubreddit.name
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleSubredditSelect(userSubreddit)}
                >
                  {userSubreddit.icon && (
                    <img
                      src={userSubreddit.icon}
                      alt=""
                      className="subreddit-icon"
                    />
                  )}
                  <div className="subreddit-info">
                    <h4>r/{userSubreddit.name}</h4>
                    <p className="personal-tag">Personal Subreddit</p>
                  </div>
                </div>
              )}

              {/* Divider for others */}
              {userSubreddit &&
                (searchQuery ? searchResults : subreddits).length > 0 && (
                  <div className="subreddit-divider">Other Subreddits</div>
                )}

              {/* Display either search results or all subreddits */}
              {searchQuery
                ? searchResults.map((sub) => (
                    <div
                      key={sub.name}
                      className={`subreddit-item ${
                        selectedSubreddit?.name === sub.name ? "selected" : ""
                      }`}
                      onClick={() => handleSubredditSelect(sub)}
                    >
                      {sub.icon && (
                        <img src={sub.icon} alt="" className="subreddit-icon" />
                      )}
                      <div className="subreddit-info">
                        <h4>r/{sub.name}</h4>
                        <p>{sub.title}</p>
                      </div>
                    </div>
                  ))
                : subreddits.map((sub) => (
                    <div
                      key={sub.name}
                      className={`subreddit-item ${
                        selectedSubreddit?.name === sub.name ? "selected" : ""
                      }`}
                      onClick={() => handleSubredditSelect(sub)}
                    >
                      {sub.icon && (
                        <img src={sub.icon} alt="" className="subreddit-icon" />
                      )}
                      <div className="subreddit-info">
                        <h4>r/{sub.name}</h4>
                        <p>{sub.title}</p>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Title</h3>
              <div className="content-controls">
                <span className={isTitleOverLimit ? "over-limit" : ""}>
                  {titleCharsRemaining} characters remaining
                </span>
                {isTitleOverLimit && (
                  <button
                    onClick={handleTruncateTitle}
                    className="truncate-button"
                  >
                    Truncate
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`content-textarea ${isTitleOverLimit ? "error" : ""}`}
              placeholder="Post title (required)"
              rows={2}
            />
          </div>

          {/* Content Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Content</h3>
              <div className="content-controls">
                <span className={isContentOverLimit ? "over-limit" : ""}>
                  {contentCharsRemaining} characters remaining
                </span>
                {isContentOverLimit && (
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
              className={`content-textarea ${
                isContentOverLimit ? "error" : ""
              }`}
              placeholder="Post content (optional)"
              rows={6}
            />
          </div>

          {/* Flair Selection */}
          {selectedSubreddit && flairs.length > 0 && (
            <div className="flair-selector">
              <h3>Select Flair</h3>
              <div className="flair-list">
                {flairs.map((flair) => (
                  <button
                    key={flair.id}
                    className={`flair-item ${
                      selectedFlair?.id === flair.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedFlair(flair)}
                  >
                    {flair.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Post to Reddit Button */}
        <button
          className={`share-button reddit ${status.loading ? "loading" : ""}`}
          onClick={handleShare}
          disabled={
            !selectedSubreddit ||
            !title.trim() ||
            isTitleOverLimit ||
            isContentOverLimit ||
            status.loading
          }
        >
          {status.loading ? "Publishing..." : "Post to Reddit"}
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

export default RedditShareModal;

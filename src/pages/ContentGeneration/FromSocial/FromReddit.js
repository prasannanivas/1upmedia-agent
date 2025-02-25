import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RedditAuth.css";
import { useSocialMedia } from "../../../context/SocialMediaContext";
import DisplayPreviewTitles from "../../../components/DisplayPreviewTitles";

const FromReddit = () => {
  // Get the Reddit profiles from your SocialMediaContext
  const { redditProfiles } = useSocialMedia();

  // Local states for this component
  const [accessToken, setAccessToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [popup, setPopup] = useState(null);

  // For tracking which posts are selected for content generation
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  // For storing group preview titles for the selected posts
  const [groupPreviewTitles, setGroupPreviewTitles] = useState([]);

  useEffect(() => {
    if (!accessToken) return;
    fetchPosts();
  }, [accessToken]);

  // When the redditProfile becomes available, store the access token and update the user profile info
  useEffect(() => {
    const redditProfile =
      redditProfiles && redditProfiles.length > 0 ? redditProfiles[0] : null;
    if (redditProfile) {
      setAccessToken(redditProfile.access_token);
      setUserProfile({
        name: redditProfile.account_name,
        icon_img: redditProfile.profile_picture,
      });
    }
  }, [redditProfiles]);

  // Optional: Listen for messages from the auth popup (if still used)
  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.data && event.data.type === "redditAuthSuccess") {
        setAccessToken(event.data.accessToken);
        setUserProfile(event.data.userProfile);
        if (popup) {
          popup.close();
        }
      }
    };

    window.addEventListener("message", receiveMessage, false);
    return () => window.removeEventListener("message", receiveMessage);
  }, [popup]);

  // Only allow login if there are no Reddit profiles in context.
  const handleLogin = () => {
    const authUrl = "https://ai.1upmedia.com:443/reddit/auth";
    const popupWindow = window.open(
      authUrl,
      "RedditAuth",
      "width=600,height=600"
    );
    setPopup(popupWindow);
  };

  // If there’s no Reddit profile, show only the login button.
  if (!redditProfiles || redditProfiles.length === 0) {
    return (
      <div className="container">
        <h1 className="title">Ai Agents - Reddit Auth</h1>
        <button className="btn-login" onClick={handleLogin}>
          Login with Reddit
        </button>
      </div>
    );
  }

  // Fetch posts automatically once the access token is available

  // Fetch the current user's posts
  const fetchPosts = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get(
        "https://ai.1upmedia.com:443/reddit/posts",
        { params: { accessToken } }
      );
      setPosts(response.data.data?.children || []);
      // Reset selected posts and group preview titles when new posts are fetched
      setSelectedPostIds([]);
      setGroupPreviewTitles([]);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  // Toggle the selection of a post (for content generation)
  const toggleSelect = (postId) => {
    if (selectedPostIds.includes(postId)) {
      setSelectedPostIds(selectedPostIds.filter((id) => id !== postId));
    } else {
      setSelectedPostIds([...selectedPostIds, postId]);
    }
  };

  // Select or deselect all posts
  const handleSelectAll = () => {
    if (selectedPostIds.length === posts.length) {
      setSelectedPostIds([]);
    } else {
      const allIds = posts.map((postWrapper) => postWrapper.data.id);
      setSelectedPostIds(allIds);
    }
  };

  // Simple text compression logic: remove extra whitespace and truncate if too long.
  const compressText = (text) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    return cleaned.length > 200 ? cleaned.substring(0, 200) + "..." : cleaned;
  };

  // Button handler to generate preview titles for all checked posts (group generation)
  const handleGeneratePreviews = async () => {
    // Filter out the selected posts
    const selectedPosts = posts
      .map((postWrapper) => postWrapper.data)
      .filter((post) => selectedPostIds.includes(post.id));

    if (selectedPosts.length === 0) return;

    // Build a combined prompt with each selected post's title and compressed text
    let prompt = "Generate preview titles for the following posts:\n\n";
    selectedPosts.forEach((post) => {
      prompt += `Title: ${post.title}\nContent: ${compressText(
        post.selftext
      )}\n\n`;
    });

    const apiUrl = "https://ai.1upmedia.com:443/get-preview-titles";
    const postData = {
      count: 10,
      prompt,
    };

    try {
      const response = await axios.post(apiUrl, postData);
      // The API response is a string of preview titles. For example:
      // "1. \"Hyderabad: Not Named After Hyder Ali\", 2. \"The True Origin of Hyderabad's Name\", ..."
      const titlesStr = response.data.titles;
      // Use regex to extract text within double quotes
      const matches = titlesStr.match(/"([^"]+)"/g);
      let titlesArray = [];
      if (matches) {
        titlesArray = matches.map((str) => str.replace(/"/g, ""));
      } else {
        // Fallback: split by commas if regex doesn't match
        titlesArray = titlesStr.split(",").map((s) => s.trim());
      }
      setGroupPreviewTitles(titlesArray);
    } catch (error) {
      console.error("Error generating preview titles:", error);
    }
  };

  return (
    <div className="from-reddit-container">
      <h1 className="from-reddit-title">Ai Agents - Reddit Posts</h1>

      <div className="from-reddit-profile">
        <h2>Welcome, {userProfile?.name}</h2>
        {userProfile?.icon_img && (
          <img
            className="from-reddit-profile-img"
            src={userProfile.icon_img}
            alt="Profile"
          />
        )}
      </div>

      <div className="from-reddit-posts-section">
        <div className="from-reddit-posts-header">
          <h3>Your Posts:</h3>
          <button
            className="from-reddit-btn from-reddit-btn-select-all"
            onClick={handleSelectAll}
          >
            {selectedPostIds.length === posts.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <button
            className="from-reddit-btn from-reddit-btn-generate"
            onClick={handleGeneratePreviews}
            disabled={selectedPostIds.length === 0}
          >
            Generate Preview Titles
          </button>
        </div>

        {posts.length > 0 ? (
          <ul className="from-reddit-posts-list">
            {posts.map((postWrapper, index) => {
              const post = postWrapper.data;
              return (
                <li key={post.id || index} className="from-reddit-post-item">
                  <div className="from-reddit-post-header">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                    <strong>{post.title}</strong>
                    {selectedPostIds.includes(post.id) && (
                      <span className="from-reddit-selected-tag">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="from-reddit-post-excerpt">
                    {post.selftext.substring(0, 100)}...
                  </p>
                  <a
                    href={`https://reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Reddit
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="from-reddit-no-posts">No posts found.</p>
        )}
      </div>

      {groupPreviewTitles.length > 0 && (
        <div className="from-reddit-group-previews">
          <DisplayPreviewTitles previewTitles={groupPreviewTitles} />
        </div>
      )}
    </div>
  );
};

export default FromReddit;

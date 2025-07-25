import React, { useState, useEffect } from "react";
import { useSocialMedia } from "../context/SocialMediaContext";
import { useAuth } from "../context/AuthContext";
import "../components/Loader.css";
import "./SetupWizard.css";
import axios from "axios";

export default function SetupWizard() {
  const { wordpressProfiles, fetchSocialMediaProfiles } = useSocialMedia();
  const { authState } = useAuth();
  const { email } = authState;
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [trackingStatus, setTrackingStatus] = useState({
    loading: false,
    message: "",
    success: false,
  });

  // Function to check if a post is already being tracked
  const isTrackingEnabled = (post) => {
    if (!post.content || !post.id) return false;

    try {
      const content = post.content.rendered || post.content;

      // Check for tracking script and post ID
      const hasCollectorJs = content.includes("collector.js");
      const hasContentUuid =
        content.includes(`data-content-uuid="${post.id}"`) ||
        content.includes(`data-content-uuid='${post.id}'`) ||
        content.includes(`data-content-uuid=${post.id}`);

      return hasCollectorJs || hasContentUuid;
    } catch (error) {
      return false;
    }
  };
  useEffect(() => {
    const loadAccounts = async () => {
      if (email) {
        await fetchSocialMediaProfiles(email);
        setLoading(false);
      }
    };
    loadAccounts();
  }, [email]);

  const handleProfileSelect = (e) => {
    const selectedSiteUrl = e.target.value;
    const profile = wordpressProfiles.find(
      (profile) => profile.dynamic_fields.siteUrl === selectedSiteUrl
    );
    setSelectedProfile(profile);
    setPosts([]);
    setSelectedPostIds([]);
    setTrackingStatus({ loading: false, message: "", success: false });

    if (profile) {
      fetchWordPressPosts(profile);
    }
  };
  const fetchWordPressPosts = async (profile) => {
    if (!profile) return;

    setLoadingPosts(true);
    try {
      // Get credentials from the selected profile
      const credentials = {
        siteUrl: profile.dynamic_fields.siteUrl,
        username: profile.dynamic_fields.username,
        appPassword: profile.access_token,
      };

      // Call WordPress API to get posts
      const response = await axios.post(
        "https://ai.1upmedia.com:443/wordpress/validate-wordpress",
        credentials
      );

      if (response.data.success) {
        try {
          // Using WordPress REST API to fetch posts
          const postsResponse = await axios.get(
            `${credentials.siteUrl}/wp-json/wp/v2/posts`,
            {
              headers: {
                Authorization: `Basic ${btoa(
                  `${credentials.username}:${credentials.appPassword}`
                )}`,
              },
              params: {
                per_page: 50, // Fetch more posts
                status: "publish", // Only get published posts
                _fields: "id,title,link,content,status,date", // Only get fields we need
              },
            }
          ); // Include all posts, even those that are already tracked
          setPosts(postsResponse.data);

          // Count the already tracked posts
          const trackedPostsCount = postsResponse.data.filter(
            (post) =>
              post.content.rendered.includes("data-content-uuid") &&
              post.content.rendered.includes("collector.js")
          ).length;

          // If there are already tracked posts, show a message
          if (trackedPostsCount > 0) {
            setTrackingStatus({
              loading: false,
              message: `${trackedPostsCount} posts are already being tracked.`,
              success: true,
            });
          }
        } catch (apiError) {
          console.error("Error fetching WordPress posts via API:", apiError);

          // Fallback approach - try going through our backend
          const backendResponse = await axios.post(
            "https://ai.1upmedia.com:443/wordpress/fetch-posts",
            credentials
          );

          if (backendResponse.data.success) {
            setPosts(backendResponse.data.posts);
          } else {
            setPosts([]);
          }
        }
      } else {
        console.error("WordPress validation failed");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching WordPress posts:", error);
      setPosts([]);
      setTrackingStatus({
        loading: false,
        message: `Error fetching posts: ${error.message || "Unknown error"}`,
        success: false,
      });
    } finally {
      setLoadingPosts(false);
    }
  };
  const handlePostSelection = (postId) => {
    // Find the post
    const post = posts.find((p) => p.id === postId);

    // Don't allow selection if the post is already being tracked
    if (post && isTrackingEnabled(post)) {
      return;
    }

    setSelectedPostIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(postId)) {
        return prevSelectedIds.filter((id) => id !== postId);
      } else {
        return [...prevSelectedIds, postId];
      }
    });
  };
  const handleStartTracking = async () => {
    if (selectedPostIds.length === 0) {
      setTrackingStatus({
        loading: false,
        message: "Please select at least one post to track",
        success: false,
      });
      return;
    }

    setTrackingStatus({
      loading: true,
      message: "Setting up tracking...",
      success: false,
    });

    try {
      // Get credentials from the selected profile
      const credentials = {
        siteUrl: selectedProfile.dynamic_fields.siteUrl,
        username: selectedProfile.dynamic_fields.username,
        appPassword: selectedProfile.access_token,
      };
      // Prepare the tracking script that will be added to each post
      const trackingScript = `
<!-- 1Up Media Tracking Script -->
<script src="https://ai.1upmedia.com/collector.js" async></script>
<div data-content-uuid="{{POST_ID}}" style="display:none;"></div>
<!-- End 1Up Media Tracking Script -->
      `;

      // Track each selected post
      const trackingResults = await Promise.allSettled(
        selectedPostIds.map(async (postId) => {
          // Find the post content from our posts array
          const post = posts.find((p) => p.id === postId);
          if (!post) return { success: false, postId, error: "Post not found" };
          let contentToUpdate;
          let updatedContent;

          // Check if the content is in HTML format
          if (post.content && post.content.rendered) {
            contentToUpdate = post.content.rendered;

            // Check if content has proper HTML structure
            if (contentToUpdate.includes("</body>")) {
              // Insert before closing body tag
              updatedContent = contentToUpdate.replace(
                "</body>",
                trackingScript.replace("{{POST_ID}}", postId) + "</body>"
              );
            } else {
              // Append to the end if no body tag is present
              updatedContent =
                contentToUpdate + trackingScript.replace("{{POST_ID}}", postId);
            }
          } else if (typeof post.content === "string") {
            // Direct string content
            contentToUpdate = post.content;
            updatedContent =
              contentToUpdate + trackingScript.replace("{{POST_ID}}", postId);
          } else {
            // Fallback for unexpected content format
            return {
              success: false,
              postId,
              error: "Unsupported content format",
              title: post.title.rendered || post.title,
            };
          } // Update the post via WordPress API
          await axios.post(
            `${credentials.siteUrl}/wp-json/wp/v2/posts/${postId}`,
            {
              content: updatedContent,
            },
            {
              headers: {
                Authorization: `Basic ${btoa(
                  `${credentials.username}:${credentials.appPassword}`
                )}`,
                "Content-Type": "application/json",
              },
            }
          );

          return {
            success: true,
            postId,
            title: post.title.rendered,
            postUrl: post.link,
          };
        })
      );

      // Process results
      const successful = trackingResults.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;
      const failed = selectedPostIds.length - successful;

      if (failed > 0) {
        setTrackingStatus({
          loading: false,
          message: `Tracking set up for ${successful} posts. ${failed} posts failed.`,
          success: successful > 0,
        });
      } else {
        setTrackingStatus({
          loading: false,
          message: `Successfully set up tracking for all ${successful} posts!`,
          success: true,
        });

        // Store the tracked posts in the system
        // This step would integrate with your existing post tracking system
        const trackedPosts = trackingResults
          .filter(
            (result) => result.status === "fulfilled" && result.value.success
          )
          .map((result) => result.value);

        // You might want to save these posts to your database or state management
        console.log("Tracked posts:", trackedPosts);
      }
    } catch (error) {
      console.error("Error setting up tracking:", error);
      setTrackingStatus({
        loading: false,
        message: `Error setting up tracking: ${
          error.message || "Unknown error"
        }`,
        success: false,
      });
    }
  };
  if (loading) {
    return (
      <div className="setup-wizard-container">
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading WordPress accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-wizard-container">
      <h1>WordPress Account Setup</h1>

      {wordpressProfiles.length > 0 ? (
        <div className="wordpress-accounts-section">
          <h2>Select a WordPress Account</h2>
          <div className="select-container">
            <select
              value={selectedProfile?.dynamic_fields.siteUrl || ""}
              onChange={handleProfileSelect}
              className="wordpress-account-select"
            >
              <option value="">-- Select WordPress Account --</option>
              {wordpressProfiles.map((profile) => (
                <option
                  key={profile.dynamic_fields.siteUrl}
                  value={profile.dynamic_fields.siteUrl}
                >
                  {profile.dynamic_fields.siteUrl} (
                  {profile.dynamic_fields.username})
                </option>
              ))}
            </select>
          </div>

          {selectedProfile && (
            <div className="selected-account-info">
              <h3>Selected Account Details</h3>
              <p>
                <strong>Site URL:</strong>{" "}
                {selectedProfile.dynamic_fields.siteUrl}
              </p>
              <p>
                <strong>Username:</strong>{" "}
                {selectedProfile.dynamic_fields.username}
              </p>
              {selectedProfile.dynamic_fields.userRoles && (
                <p>
                  <strong>Role:</strong>{" "}
                  {selectedProfile.dynamic_fields.userRoles.join(", ")}
                </p>
              )}{" "}
              {/* Display posts section */}
              <div className="posts-section">
                <h3>Available Posts</h3>
                {loadingPosts ? (
                  <div className="posts-loading">
                    <div className="loader"></div>
                    <p>Loading posts...</p>
                  </div>
                ) : posts.length > 0 ? (
                  <>
                    <div className="posts-table-container">
                      <table className="posts-table">
                        <thead>
                          <tr>
                            {" "}
                            <th className="checkbox-column">
                              {" "}
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Only select posts that aren't already tracked
                                    setSelectedPostIds(
                                      posts
                                        .filter(
                                          (post) => !isTrackingEnabled(post)
                                        )
                                        .map((post) => post.id)
                                    );
                                  } else {
                                    setSelectedPostIds([]);
                                  }
                                }}
                                checked={
                                  selectedPostIds.length > 0 &&
                                  selectedPostIds.length ===
                                    posts.filter(
                                      (post) => !isTrackingEnabled(post)
                                    ).length &&
                                  posts.filter(
                                    (post) => !isTrackingEnabled(post)
                                  ).length > 0
                                }
                              />
                            </th>
                            <th className="title-column">Title</th>
                            <th className="date-column">Date</th>
                            <th className="status-column">Status</th>
                            <th className="tracking-column">Tracking</th>
                            <th className="link-column">Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts.map((post) => (
                            <tr
                              key={post.id}
                              className={
                                selectedPostIds.includes(post.id)
                                  ? "selected-row"
                                  : ""
                              }
                            >
                              {" "}
                              <td className="checkbox-column">
                                <input
                                  type="checkbox"
                                  checked={selectedPostIds.includes(post.id)}
                                  onChange={() => handlePostSelection(post.id)}
                                  disabled={isTrackingEnabled(post)}
                                />
                              </td>
                              <td className="title-column">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: post.title.rendered,
                                  }}
                                ></span>
                              </td>
                              <td className="date-column">
                                {new Date(post.date).toLocaleDateString()}
                              </td>{" "}
                              <td className="status-column">
                                {post.status === "publish"
                                  ? "Published"
                                  : post.status}
                              </td>
                              <td className="tracking-column">
                                {isTrackingEnabled(post) ? (
                                  <span
                                    style={{
                                      color: "#28a745",
                                      fontSize: "18px",
                                    }}
                                    title="This post is already being tracked"
                                  >
                                    ✓
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      color: "#dc3545",
                                      fontSize: "18px",
                                    }}
                                    title="This post is not being tracked"
                                  >
                                    ✗
                                  </span>
                                )}
                              </td>
                              <td className="link-column">
                                <a
                                  href={post.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="tracking-controls">
                      <p className="selected-count">
                        {selectedPostIds.length} post
                        {selectedPostIds.length !== 1 ? "s" : ""} selected
                      </p>
                      <button
                        className="start-tracking-button"
                        disabled={
                          selectedPostIds.length === 0 || trackingStatus.loading
                        }
                        onClick={handleStartTracking}
                      >
                        {trackingStatus.loading
                          ? "Setting up..."
                          : "Start Tracking"}
                      </button>
                    </div>
                    {trackingStatus.message && (
                      <p
                        className={`tracking-message ${
                          trackingStatus.success ? "success" : "error"
                        }`}
                      >
                        {trackingStatus.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="no-posts-message">
                    No posts found for this WordPress site.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-accounts-message">
          <p>
            No WordPress accounts connected. Please connect an account first.
          </p>
          <a href="/user-management" className="connect-account-link">
            Go to Account Management
          </a>
        </div>
      )}
    </div>
  );
}

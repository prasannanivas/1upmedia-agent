import React, { useState, useEffect } from "react";
import { SiWebflow } from "react-icons/si";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";
const WEBFLOW_TEXT_LIMIT = 10000; // Arbitrary limit for Webflow

const WebflowShareModal = ({ isOpen, onClose, post, webflowProfiles }) => {
  // State for selected profile and site

  console.log(webflowProfiles);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [sites, setSites] = useState([]);
  const [collections, setCollections] = useState([]);

  const { authState } = useAuth();
  const { email } = authState;

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

      // response.data

      //   {
      //     "success": true,
      //     "data": {
      //         "items": [
      //             {
      //                 "id": "67bdc5ae2e0d2a5402dcfaaa",
      //                 "cmsLocaleId": "67a3a0f0ef178ba018b84f97",
      //                 "lastPublished": null,
      //                 "lastUpdated": "2025-02-25T13:29:18.981Z",
      //                 "createdOn": "2025-02-25T13:29:18.981Z",
      //                 "isArchived": false,
      //                 "isDraft": false,
      //                 "fieldData": {
      //                     "name": "Industry Insights on LTTE Prabakaran",
      //                     "body": "\n      <article class=\"webflow-post\">\n        <h1>Industry Insights on LTTE Prabakaran</h1>\n        <div class=\"post-content\">\n          Introduction\n\nThe infamous leader of the Liberation Tigers of Tamil Eelam (LTTE), Velupillai Prabhakaran, is a figure surrounded by both intrigue and controversy.\n\nPrabhakaran's role was to spearhead the LTTE's operations in seeking an independent Tamil state in Sri Lanka.\n\nPros and Cons\n\nAdvantages and Benefits\n\n * Prabhakaran was seen by many Tamils as a champion for their rights, as he fought for self-determination.\n * He established an organized and disciplined resistance movement.\n\nDrawbacks and Disadvantages\n\n * The LTTE under Prabhakaran was involved in acts of terrorism, leading to loss of innocent lives.\n * The rebellion led to prolonged conflict, affecting the entire region of Sri Lanka.\n\nDetailed Review\n\nThe LTTE was notorious for its innovative guerilla strategies, under Prabhakaran’s strategic leadership. They developed a naval arm and even had a rudimentary air wing. Furthermore, Prabhakaran's leadership was characterized by his unwavering commitment to his cause, making the LTTE one of the most feared liberation movements globally.\n\nFor more details on his life and operations, read this Wikipedia article on Velupillai Prabhakaran (https://en.wikipedia.org/wiki/Velupillai_Prabhakaran).\n\nIn comparison to similar other rebel movements, the LTTE's structure and strategy were relatively advanced. Yet, it remains debatable whether these advantages justified the cost of their methods.\n\nEvidence of proscription on foreign soil further paints the complex international perception of the LTTE leader. Insights from the US Attorney's Office (https://www.justice.gov/archive/usao/nye/pr/2006/2006Aug21.html) detail measures taken against LTTE's international operations.\n\nConclusion\n\nOverall, Prabhakaran's influence remains a matter of extensive debate, presenting a dichotomy between freedom fighting and terrorism. Whether one views his legacy positively or negatively often depends on their perspectives on these issues. Traditional narratives around his leadership might not justify acquisition, but understanding the LTTE's historical impact is valuable.\n\nFor comprehensive insights on the LTTE, see the Liberation Tigers of Tamil Eelam - Wikipedia (https://en.wik...\n        </div>\n        \n          <div class=\"post-image\">\n            <img src=\"https://cdn.prod.website-files.com/67a3a0f0ef178ba018b84f99/67bdc5ae2e0d2a5402dcfa0e_qqr3y5xhsxqetc185ybr.png\" alt=\"Industry Insights on LTTE Prabakaran\" />\n          </div>\n        \n        \n          <div class=\"post-tags\">\n            Tags: Velupillai Prabhakaran,LTTE,Tamil Eelam,Sri Lanka,liberation movement,terrorism,guerilla warfare,conflict,self-determination,naval arm,air wing,international perception,pros and cons,freedom fighting,historical impact\n          </div>\n        \n        <div class=\"post-meta\">\n          Posted on: 2025-02-22 19:37:39\n          by: prasannanivas\n        </div>\n      </article>\n    ",
      //                     "tags": "Velupillai Prabhakaran, LTTE, Tamil Eelam, Sri Lanka, liberation movement, terrorism, guerilla warfare, conflict, self-determination, naval arm, air wing, international perception, pros and cons, freedom fighting, historical impact",
      //                     "categories": "Sri Lankan Civil War, Velupillai Prabhakaran, LTTE (Liberation Tigers of Tamil Eelam), Tamil Eelam, Freedom Fighters vs Terrorism, Guerrilla Warfare, Southeast Asian Politics, International Conflict, Terrorism and Insurgency, Militant Leadership",
      //                     "image": {
      //                         "fileId": "67bdc5ae2e0d2a5402dcfa0e",
      //                         "url": "https://cdn.prod.website-files.com/67a3a0f0ef178ba018b84f99/67bdc5ae2e0d2a5402dcfa0e_qqr3y5xhsxqetc185ybr.png",
      //                         "alt": null
      //                     },
      //                     "slug": "industry-insights-on-ltte-prabakaran-1740490157701"
      //                 }
      //             }
      //         ]
      //     },
      //     "collectionId": " ",
      //     "collectionName": "Blog Posts",
      //     "postedAt": "2025-02-22 19:37:39",
      //     "author": "prasannanivas",
      //     "liveUrl": null,
      //     "isNewCollection": false
      // }
      if (response.data.success) {
        const { liveUrl, postedAt, author, collectionId, collectionName } =
          response.data;

        // Store share history immediately
        const shareHistoryEntry = {
          platform: "Webflow",
          link: liveUrl,
          extra_data: {
            postedAt,
            collectionId,
            collectionName,
          },
        };

        setStatus({
          loading: false,
          message: "Successfully published to Webflow!",
          type: "success",
        });

        setSuccessWithLink({
          show: true,
          url: liveUrl,
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

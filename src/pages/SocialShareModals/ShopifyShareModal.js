import React, { useState, useEffect } from "react";
import { FaShopify } from "react-icons/fa";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";
import { useAuth } from "../../context/AuthContext";

const ShopifyShareModal = ({ isOpen, onClose, post, shopifyProfiles }) => {
  // State for selected profile and blog
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedBlogId, setSelectedBlogId] = useState("");
  const [blogs, setBlogs] = useState([]);

  const { authState } = useAuth();
  const { email } = authState;

  // Content state
  const [content, setContent] = useState({
    title: post?.title || "",
    body: "",
  });

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
  const selectedProfile = shopifyProfiles?.[selectedProfileIndex];
  const shop = selectedProfile?.dynamic_fields?.shopInfo?.myshopify_domain;
  const accessToken = selectedProfile?.access_token;

  // Format initial content
  useEffect(() => {
    if (post?.content) {
      const formatted = ContentFormatter.format(post.content, {
        preserveLinks: true,
        addSpacing: true,
      });
      setContent({
        title: post.title,
        body: formatted,
      });
    }
  }, [post?.content, post?.title]);

  // Fetch blogs when profile changes
  useEffect(() => {
    const fetchBlogs = async () => {
      if (!shop || !accessToken) return;

      setStatus({
        loading: true,
        message: "Fetching blogs...",
        type: "info",
      });

      try {
        const response = await axios.post(
          "https://ai.1upmedia.com:443/shopify/fetch-blogs",
          {
            shop,
            accessToken,
          }
        );

        if (response.data.blogs) {
          setBlogs(response.data.blogs);
          if (response.data.blogs.length > 0) {
            setSelectedBlogId(response.data.blogs[0].id);
          }
        }

        setStatus({
          loading: false,
          message: "",
          type: "",
        });
      } catch (error) {
        setStatus({
          loading: false,
          message: error.response?.data?.error || "Error fetching blogs",
          type: "error",
        });
      }
    };

    fetchBlogs();
  }, [shop, accessToken]);

  const handleShare = async () => {
    if (!content.title.trim() || !content.body.trim()) {
      setStatus({
        loading: false,
        message: "Title and content are required",
        type: "error",
      });
      return;
    }

    if (!selectedBlogId) {
      setStatus({
        loading: false,
        message: "Please select a blog",
        type: "error",
      });
      return;
    }

    setStatus({
      loading: true,
      message: "Publishing to Shopify...",
      type: "info",
    });

    try {
      const postData = {
        shop,
        accessToken,
        blogId: selectedBlogId,
        content: {
          title: content.title,
          body: content.body,
          tags: post?.tags || [],
          image: post?.image_data?.url,
        },
      };

      const response = await axios.post(
        "https://ai.1upmedia.com:443/shopify/post-content",
        postData
      );

      //   {
      //     "message": "Blog post created successfully",
      //     "data": {
      //         "id": 631849877567,
      //         "title": "Industry Insights on LTTE Prabakaran",
      //         "created_at": "2025-02-25T08:31:52-05:00",
      //         "body_html": "Introduction\n\nThe infamous leader of the Liberation Tigers of Tamil Eelam (LTTE), Velupillai Prabhakaran, is a figure surrounded by both intrigue and controversy.\n\nPrabhakaran's role was to spearhead the LTTE's operations in seeking an independent Tamil state in Sri Lanka.\n\nPros and Cons\n\nAdvantages and Benefits\n\n * Prabhakaran was seen by many Tamils as a champion for their rights, as he fought for self-determination.\n * He established an organized and disciplined resistance movement.\n\nDrawbacks and Disadvantages\n\n * The LTTE under Prabhakaran was involved in acts of terrorism, leading to loss of innocent lives.\n * The rebellion led to prolonged conflict, affecting the entire region of Sri Lanka.\n\nDetailed Review\n\nThe LTTE was notorious for its innovative guerilla strategies, under Prabhakaran’s strategic leadership. They developed a naval arm and even had a rudimentary air wing. Furthermore, Prabhakaran's leadership was characterized by his unwavering commitment to his cause, making the LTTE one of the most feared liberation movements globally.\n\nFor more details on his life and operations, read this Wikipedia article on Velupillai Prabhakaran (https://en.wikipedia.org/wiki/Velupillai_Prabhakaran).\n\nIn comparison to similar other rebel movements, the LTTE's structure and strategy were relatively advanced. Yet, it remains debatable whether these advantages justified the cost of their methods.\n\nEvidence of proscription on foreign soil further paints the complex international perception of the LTTE leader. Insights from the US Attorney's Office (https://www.justice.gov/archive/usao/nye/pr/2006/2006Aug21.html) detail measures taken against LTTE's international operations.\n\nConclusion\n\nOverall, Prabhakaran's influence remains a matter of extensive debate, presenting a dichotomy between freedom fighting and terrorism. Whether one views his legacy positively or negatively often depends on their perspectives on these issues. Traditional narratives around his leadership might not justify acquisition, but understanding the LTTE's historical impact is valuable.\n\nFor comprehensive insights on the LTTE, see the Liberation Tigers of Tamil Eelam - Wikipedia (https://en.wik...",
      //         "blog_id": 82077188159,
      //         "author": "Shopify API",
      //         "user_id": null,
      //         "published_at": "2025-02-25T08:31:52-05:00",
      //         "updated_at": "2025-02-25T08:31:52-05:00",
      //         "summary_html": null,
      //         "template_suffix": null,
      //         "handle": "industry-insights-on-ltte-prabakaran-1",
      //         "tags": "air wing, conflict, freedom fighting, guerilla warfare, historical impact, international perception, liberation movement, LTTE, naval arm, pros and cons, self-determination, Sri Lanka, Tamil Eelam, terrorism, Velupillai Prabhakaran",
      //         "admin_graphql_api_id": "gid://shopify/OnlineStoreArticle/631849877567",
      //         "image": {
      //             "created_at": "2025-02-25T08:31:52-05:00",
      //             "alt": null,
      //             "width": 1536,
      //             "height": 1536,
      //             "src": "https://cdn.shopify.com/s/files/1/0596/6184/4543/articles/qqr3y5xhsxqetc185ybr_a36703d9-9337-4712-993d-89e192f05217.png?v=1740490312"
      //         }
      //     }
      // }
      if (response.data.data) {
        const { id, title, published_at, author, handle, tags, image } =
          response.data.data;
        const postUrl = `https://${shop}/blogs/${selectedBlogId}/articles/${handle}`;

        // Store share history immediately
        const shareHistoryEntry = {
          platform: "shopify",
          link: postUrl,
          extra_data: {
            postId: id,
            title,
            publishedAt: published_at,
            author,
            tags,
            imageUrl: image?.src || null,
          },
        };

        setStatus({
          loading: false,
          message: "Successfully published to Shopify!",
          type: "success",
        });

        setSuccessWithLink({
          show: true,
          url: postUrl,
        });

        try {
          await axios.put(
            `https://ai.1upmedia.com:443/aiagent/posts/${email}/${post.post_id}/share-history`,
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
      }
    } catch (error) {
      setStatus({
        loading: false,
        message: error.response?.data?.error || "Error publishing to Shopify",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="social-share-modal-overlay" onClick={onClose}>
      <div
        className="social-share-modal shopify-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <FaShopify className="shopify-icon" />
          <h2>Share to Shopify</h2>

          {/* Profile Selector */}
          {shopifyProfiles && shopifyProfiles.length > 1 && (
            <div className="profile-selector">
              <label>Select Shopify Store: </label>
              <select
                value={selectedProfileIndex}
                onChange={(e) =>
                  setSelectedProfileIndex(Number(e.target.value))
                }
              >
                {shopifyProfiles.map((profile, index) => (
                  <option key={profile._id || index} value={index}>
                    {profile?.account_name} (
                    {profile?.dynamic_fields?.shopInfo.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Blog Selector */}
          {blogs.length > 0 && (
            <div className="blog-selector">
              <label>Select Blog: </label>
              <select
                value={selectedBlogId}
                onChange={(e) => setSelectedBlogId(e.target.value)}
              >
                {blogs.map((blog) => (
                  <option key={blog.id} value={blog.id}>
                    {blog.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show store info */}
          <div className="shopify-store-info">
            <span>
              Store: {selectedProfile?.dynamic_fields?.shopInfo?.name}
            </span>
            <span className="store-url">
              ({selectedProfile?.dynamic_fields?.shopInfo?.myshopify_domain})
            </span>
          </div>
        </div>

        <div className="content-editor-section">
          {/* Title Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Post Title</h3>
            </div>
            <input
              type="text"
              value={content.title}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, title: e.target.value }))
              }
              className="title-input"
              placeholder="Enter post title"
            />
          </div>

          {/* Content Input */}
          <div className="content-input">
            <div className="content-header">
              <h3>Post Content</h3>
            </div>
            <textarea
              value={content.body}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, body: e.target.value }))
              }
              className="content-textarea"
              placeholder="Write your blog post content..."
              rows={6}
            />
          </div>
        </div>

        {/* Share Button */}
        <button
          className={`share-button shopify ${status.loading ? "loading" : ""}`}
          onClick={handleShare}
          disabled={
            !content.title.trim() ||
            !content.body.trim() ||
            !selectedBlogId ||
            status.loading
          }
        >
          {status.loading ? "Publishing..." : "Post to Shopify"}
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
                  className="shopify-post-link"
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

export default ShopifyShareModal;

import React, { useState, useEffect } from "react";
import { FaShopify } from "react-icons/fa";
import axios from "axios";
import { ContentFormatter } from "../../utils/ContentFormatter";

const ShopifyShareModal = ({ isOpen, onClose, post, shopifyProfiles }) => {
  // State for selected profile and blog
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [selectedBlogId, setSelectedBlogId] = useState("");
  const [blogs, setBlogs] = useState([]);

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
          "http://ai.1upmedia.com:3000/shopify/fetch-blogs",
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
        "http://ai.1upmedia.com:3000/shopify/post-content",
        postData
      );

      if (response.data.data) {
        const postUrl = `https://${shop}/blogs/${selectedBlogId}/articles/${response.data.data.handle}`;

        setStatus({
          loading: false,
          message: "Successfully published to Shopify!",
          type: "success",
        });

        setSuccessWithLink({
          show: true,
          url: postUrl,
        });

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

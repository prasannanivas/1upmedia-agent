import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import "./PostDetails.css";
import FloatingOptions from "../components/FloatingOptions";
import { useAuth } from "../context/AuthContext";

function PostDetails() {
  const { state } = useLocation();
  const { postId } = useParams();
  const [post, setPost] = useState(state?.post || null);
  const [loading, setLoading] = useState(!state?.post);
  const [error, setError] = useState(null);
  const [showShareHistory, setShowShareHistory] = useState(false);

  const { authState } = useAuth();
  const email = authState.email;

  useEffect(() => {
    const fetchPost = async () => {
      if (!post && email && postId) {
        try {
          const response = await fetch(
            `https://ai.1upmedia.com:443/aiagent/posts/${email}/${postId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch post");
          }
          const data = await response.json();
          setPost(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPost();
  }, [email, postId, post]);

  if (loading) {
    return (
      <div className="post-details__loading">
        <div className="post-details__loading-spinner"></div>
        <div>Loading your post...</div>
      </div>
    );
  }

  if (error || !post) {
    return <div className="post-details__not-found">Post not found.</div>;
  }

  return (
    <>
      <FloatingOptions post={post} />
      <div className="post-details__container">
        <h2 className="post-details__title">{post.title}</h2>

        {post.image_data && (
          <div className="post-details__image-container">
            <img
              src={post.image_data.url}
              alt={post.image_data.alt}
              className="post-details__image"
            />
          </div>
        )}

        <div
          className="post-details__content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>

        <div className="post-details__tags-categories">
          <div className="post-details__tags">
            <strong>Tags:</strong>
            <div className="post-details__tag-list">
              {post.tags.map((tag, index) => (
                <span key={index} className="post-details__tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="post-details__categories">
            <strong>Categories:</strong>
            <div className="post-details__category-list">
              {post.categories.map((cat, index) => (
                <span key={index} className="post-details__category">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="post-details__meta">
          <strong>Scheduled Date:</strong>{" "}
          {new Date(post.schedule_time).toLocaleDateString()}
        </div>

        {/* Share History Button */}
        {/* <button
          className="post-details__share-history-btn"
          onClick={() => setShowShareHistory(true)}
        >
          View Share History
        </button> */}

        {/* Share History Modal */}
        {/* {showShareHistory && (
          <div className="share-history__modal">
            <div className="share-history__content">
              <h3>Share History</h3>
              <button
                className="share-history__close-btn"
                onClick={() => setShowShareHistory(false)}
              >
                ✖
              </button>

              {post.share_history && post.share_history.length > 0 ? (
                <ul className="share-history__list">
                  {post.share_history.map((share, index) => (
                    <li key={index} className="share-history__item">
                      <strong>{share.platform}:</strong>{" "}
                      <a
                        href={share.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {share.link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No share history available.</p>
              )}
            </div>
          </div>
        )} */}
      </div>
    </>
  );
}

export default PostDetails;

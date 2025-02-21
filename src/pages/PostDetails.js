import React from "react";
import { useLocation } from "react-router-dom";
import "./PostDetails.css"; // Import the file-specific CSS
import FloatingOptions from "../components/FloatingOptions";

function PostDetails() {
  const { state } = useLocation();
  const { post } = state || {};

  if (!post) {
    return <div className="post-details__not-found">Post not found.</div>;
  }

  console.log(post);

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
      </div>
    </>
  );
}

export default PostDetails;

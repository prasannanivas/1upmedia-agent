import React from "react";
import { useLocation } from "react-router-dom";
//import "./ContentCreation.css";

function PostDetails() {
  const { state } = useLocation();
  const { post } = state || {};

  if (!post) {
    return <div>Post not found.</div>;
  }

  return (
    <div className="post-details-container">
      <h2>{post.title}</h2>
      <p>
        <strong>Scheduled Date:</strong>{" "}
        {new Date(post.schedule_time).toLocaleDateString()}
      </p>
      <p>
        <strong>Content:</strong> {post.content}
      </p>
      <p>
        <strong>Tags:</strong> {post.tags.join(", ")}
      </p>
      <p>
        <strong>Categories:</strong> {post.categories.join(", ")}
      </p>
      {post.image && (
        <div>
          <strong>Image:</strong>
          <img src={post.image} alt="Post" className="post-image" />
        </div>
      )}
    </div>
  );
}

export default PostDetails;

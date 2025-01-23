import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getUserLoginDetails } = useAuth();
  const { email } = getUserLoginDetails();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/aiagent/posts/${email}`
        );
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          console.error("Failed to fetch posts.");
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [email]);

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(
        `http://localhost:3000/aiagent/posts/${email}/${postId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.post_id !== postId)
        );
        alert("Post deleted successfully!");
      } else {
        console.error("Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!posts.length) {
    return <div>No posts found.</div>;
  }

  return (
    <div className="posts-table-container">
      <h2>All Posts</h2>
      <table className="posts-table">
        <thead>
          <tr>
            <th className="title-column">Title</th>
            <th className="tags-column">Tags</th>
            <th className="categories-column">Categories</th>
            <th className="schedule-column">Scheduled Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.post_id}>
              <td className="title-column">{post.title}</td>
              <td className="tags-column">{post.tags.join(", ")}</td>
              <td className="categories-column">
                {post.categories.join(", ")}
              </td>
              <td className="schedule-column">
                {new Date(post.schedule_time).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={() =>
                    navigate(`/post-details/${post.post_id}`, {
                      state: { post },
                    })
                  }
                >
                  View
                </button>
                <button
                  className="edit-button"
                  onClick={() =>
                    navigate(`/edit-post/${post.post_id}`, { state: { post } })
                  }
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => deletePost(post.post_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PostsList;

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Editpost.css";
import { useAuth } from "../context/AuthContext";

function EditPost() {
  const { state } = useLocation();
  const { post } = state || {};
  const { postId } = useParams(); // Get postId from the route
  const { authState } = useAuth();
  const { email } = authState;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    tags: post?.tags?.join(", ") || "",
    categories: post?.categories?.join(", ") || "",
    schedule_time: post?.schedule_time || "",
  });

  const [loading, setLoading] = useState(!post);

  // Fetch post details if state is lost
  useEffect(() => {
    const fetchPost = async () => {
      if (!post) {
        try {
          const response = await fetch(
            `http://ai.1upmedia.com:3000/aiagent/posts/${email}/${postId}`
          );
          if (response.ok) {
            const data = await response.json();
            setFormData({
              title: data.title,
              content: data.content,
              tags: data.tags.join(", "),
              categories: data.categories.join(", "),
              schedule_time: data.schedule_time,
            });
          } else {
            alert("Failed to fetch post details.");
          }
        } catch (error) {
          console.error("Error fetching post:", error);
          alert("An error occurred while fetching the post.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPost();
  }, [post, email, postId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const saveChanges = async () => {
    try {
      const response = await fetch(
        `http://ai.1upmedia.com:3000/aiagent/posts/${email}/${postId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            tags: formData.tags,
            categories: formData.categories,
            schedule_time: formData.schedule_time,
          }),
        }
      );

      if (response.ok) {
        alert("Post updated successfully!");
        navigate(`/posts/${postId}`);
      } else {
        alert("Failed to update post.");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("An error occurred while saving the post.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-post-container">
      <h2>Edit Post</h2>
      <label>
        Title:
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Content:
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Tags (comma-separated):
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Categories (comma-separated):
        <input
          type="text"
          name="categories"
          value={formData.categories}
          onChange={handleInputChange}
        />
      </label>
      <label>
        Schedule Date:
        <input
          type="date"
          name="schedule_time"
          value={formData.schedule_time.split("T")[0]} // Format date for input
          onChange={handleInputChange}
        />
      </label>
      <button onClick={saveChanges}>Save Changes</button>
    </div>
  );
}

export default EditPost;

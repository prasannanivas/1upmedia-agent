import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import beautify from "js-beautify";
import "./Editpost.css";
import ChangeImageModal from "../components/ChangeImageModal"; // Import the new component
import { image } from "framer-motion/client";

function EditPost() {
  const { state } = useLocation();
  const { post } = state || {};
  const { postId } = useParams();
  const { authState } = useAuth();
  const { email } = authState;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: post?.title || "",
    content: post?.content || "",
    schedule_time: post?.schedule_time || "",
  });
  const [tags, setTags] = useState(post?.tags || []);
  const [categories, setCategories] = useState(post?.categories || []);
  const [imageUrl, setImageUrl] = useState(post?.image_data?.url || "");

  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [editingMode, setEditingMode] = useState("post"); // "post" or "html"
  const [loading, setLoading] = useState(!post);
  const [imageAlt, setImageAlt] = useState(""); // Stores alt text for image
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the modal visibility

  // Open modal
  const openImageModal = () => {
    setIsModalOpen(true);
  };

  // Handle image update
  const handleImageSave = (newImageUrl, newAltText, uploadedFile) => {
    setImageUrl(newImageUrl);
    setImageAlt(newAltText);
  };
  useEffect(() => {
    const fetchPost = async () => {
      if (!post) {
        try {
          const response = await fetch(
            `https://ai.1upmedia.com:443/aiagent/posts/${email}/${postId}`
          );
          if (response.ok) {
            const data = await response.json();
            setFormData({
              title: data.title,
              content: data.content,
              schedule_time: data.schedule_time,
            });
            setTags(data.tags);
            setCategories(data.categories);
            setImageUrl(data.image_data?.url || "");
            setImageAlt(data.image_data?.alt || "");
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

  const handleEditorChange = (value) => {
    setFormData((prevData) => ({ ...prevData, content: value }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter" && categoryInput.trim() !== "") {
      e.preventDefault();
      if (!categories.includes(categoryInput.trim())) {
        setCategories([...categories, categoryInput.trim()]);
      }
      setCategoryInput("");
    }
  };

  const handleRemoveCategory = (catToRemove) => {
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  // Format HTML before switching to Edit as HTML mode
  const toggleEditingMode = (mode) => {
    if (mode === "html") {
      setFormData((prevData) => ({
        ...prevData,
        content: beautify.html(prevData.content, {
          indent_size: 2,
          wrap_line_length: 80,
          preserve_newlines: true,
        }),
      }));
    }
    setEditingMode(mode);
  };

  const saveChanges = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/posts/${email}/${postId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            tags: tags,
            categories: categories,
            image_data: {
              alt: imageAlt,
              url: imageUrl,
            },
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
    <div className="edit-post__container">
      <h2 className="edit-post__title">Edit Post</h2>
      <div className="edit-post__form">
        <div className="edit-post__main">
          <label className="edit-post__label">
            Title:
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="edit-post__input"
            />
          </label>

          {/* Toggle Buttons */}
          <div className="edit-post__toggle">
            <button
              className={editingMode === "post" ? "active" : ""}
              onClick={() => toggleEditingMode("post")}
            >
              Edit as POST
            </button>
            <button
              className={editingMode === "html" ? "active" : ""}
              onClick={() => toggleEditingMode("html")}
            >
              Edit as HTML
            </button>
          </div>

          {editingMode === "post" ? (
            <ReactQuill
              value={formData.content}
              onChange={handleEditorChange}
              className="edit-post__wysiwyg"
            />
          ) : (
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className="edit-post__textarea expanded"
            />
          )}
        </div>

        {/* Sidebar for Image, Tags, Categories, and Schedule Date */}
        <div className="edit-post__sidebar">
          {/* Show image preview only if an image exists */}
          {imageUrl ? (
            <div className="edit-post__image-container">
              <img
                src={imageUrl}
                alt={imageAlt || "Post Image"}
                className="edit-post__image"
              />
            </div>
          ) : (
            <div className="edit-post__image-placeholder">
              No Image Selected
            </div>
          )}

          {/* Always show "Change Image" button */}
          <button
            className="edit-post__change-image-btn"
            onClick={openImageModal}
          >
            {imageUrl ? "Change Image" : "Add Image"}
          </button>

          {/* Image Upload Modal */}
          <ChangeImageModal
            email={email}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleImageSave}
            existingImageUrl={imageUrl}
            defaultAltText={imageAlt || formData.title}
          />

          <div className="edit-post__tags">
            <strong>Tags:</strong>
            <div className="edit-post__chip-container">
              {tags.map((tag, index) => (
                <div key={index} className="edit-post__chip">
                  {tag}
                  <span
                    className="edit-post__chip-close"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    &times;
                  </span>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="edit-post__chip-input"
              />
            </div>
          </div>

          <div className="edit-post__categories">
            <strong>Categories:</strong>
            <div className="edit-post__chip-container">
              {categories.map((cat, index) => (
                <div key={index} className="edit-post__chip">
                  {cat}
                  <span
                    className="edit-post__chip-close"
                    onClick={() => handleRemoveCategory(cat)}
                  >
                    &times;
                  </span>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add category..."
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                className="edit-post__chip-input"
              />
            </div>
          </div>

          <label className="edit-post__label">
            Schedule Date:
            <input
              type="date"
              name="schedule_time"
              value={formData.schedule_time.split("T")[0]}
              onChange={handleInputChange}
              className="edit-post__input"
            />
          </label>
        </div>
      </div>
      <button className="edit-post__save-button" onClick={saveChanges}>
        Save Changes
      </button>
    </div>
  );
}

export default EditPost;

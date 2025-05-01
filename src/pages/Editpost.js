import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import beautify from "js-beautify";
import "./Editpost.css";
import ChangeImageModal from "../components/ChangeImageModal"; // Import the new component
import AiPromptModal from "../components/AiPromptModal"; // Import the AiPromptModal component
import AiDiffPreview from "../components/AiDiffPreview"; // Import AiDiffPreview component
import { image } from "framer-motion/client";
import Quill from "quill";

// Register custom formats
const Inline = Quill.import("blots/inline");

class DiffDeleteBlot extends Inline {
  static create() {
    const node = super.create();
    node.style.backgroundColor = "#ffd7d7";
    node.style.color = "#c62828";
    node.style.textDecoration = "line-through";
    return node;
  }
}
DiffDeleteBlot.blotName = "diff-delete";
DiffDeleteBlot.tagName = "span";
Quill.register(DiffDeleteBlot);

class DiffInsertBlot extends Inline {
  static create() {
    const node = super.create();
    node.style.backgroundColor = "#d7ffd7";
    node.style.color = "#2e7d32";
    return node;
  }
}
DiffInsertBlot.blotName = "diff-insert";
DiffInsertBlot.tagName = "span";
Quill.register(DiffInsertBlot);

// Add this custom format button
const CustomToolbar = () => (
  <div id="toolbar">
    {/* ...existing Quill toolbar options... */}
    <button className="ql-ai" title="Enhance with AI">
      <span>AI</span>
    </button>
  </div>
);

// Add this custom module configuration
const modules = {
  toolbar: {
    container: "#toolbar",
    handlers: {
      ai: function () {}, // Will be defined in the component
    },
  },
};

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

  const quillRef = useRef(null);
  const [selectedText, setSelectedText] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false); // Controls the AI prompt modal visibility
  const [diffPreview, setDiffPreview] = useState({
    show: false,
    original: "",
    suggested: "",
  }); // State for diff preview

  // Add a new ref to store the selection range
  const selectionRangeRef = useRef(null);

  // Open modal
  const openImageModal = () => {
    setIsModalOpen(true);
  };

  // Handle image update
  const handleImageSave = (newImageUrl, newAltText, uploadedFile) => {
    setImageUrl(newImageUrl);
    setImageAlt(newAltText);
  };

  const handleAiEnhancement = useCallback(async () => {
    const quillEditor = quillRef.current.getEditor();
    const range = quillEditor.getSelection();

    if (range) {
      const text = quillEditor.getText(range.index, range.length);
      if (text) {
        try {
          // const response = await fetch(
          //   "https://ai.1upmedia.com:443/aiagent/enhance",
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       text,
          //       instruction:
          //         "Enhance this text while maintaining the same meaning",
          //     }),
          //   }
          // );

          // const { enhancedText } = await response.json();
          quillEditor.deleteText(range.index, range.length);
          quillEditor.insertText(
            range.index,
            "enhancedText Billa is awesome..."
          );
        } catch (error) {
          console.error("Error enhancing text:", error);
        }
      }
    }
  }, []);

  // Modify handleKeyDown to store the range
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === "i") {
      e.preventDefault();
      console.log("Ctrl+I pressed");
      const quillEditor = quillRef.current.getEditor();
      const range = quillEditor.getSelection();

      if (range) {
        const text = quillEditor.getText(range.index, range.length);
        console.log("Selected text:", text);
        if (text) {
          // Store the range and text
          selectionRangeRef.current = range;
          setSelectedText(text);
          setIsAiPromptOpen(true);
          console.log("Opening AI prompt modal with range:", range);
        }
      }
    }
  }, []);

  // Modify handleAiPromptSubmit to use the stored range
  const handleAiPromptSubmit = async (prompt) => {
    if (selectionRangeRef.current) {
      const range = selectionRangeRef.current;
      const text = selectedText;

      // Mock response for testing
      const mockResponse = {
        enhancedText: `I have enhanced this text based on your prompt: "${prompt}".`,
        reasoning: `This change was made to demonstrate how the AI enhancement works with the prompt: "${prompt}"`,
        confidence: 0.95,
      };

      const quillEditor = quillRef.current.getEditor();

      // Show inline diff
      quillEditor.formatText(range.index, range.length, "diff-delete", true);

      // Insert new text right after the deleted text
      quillEditor.insertText(
        range.index + range.length,
        mockResponse.enhancedText,
        "diff-insert",
        true
      );

      // Create floating toolbar for accept/reject
      const toolbar = document.createElement("div");
      toolbar.className = "diff-toolbar";
      toolbar.style.position = "absolute";
      toolbar.style.top = "50%";
      toolbar.style.right = "20px";
      toolbar.innerHTML = `
        <button class="accept-change">✓ Accept</button>
        <button class="reject-change">✕ Reject</button>
      `;

      quillEditor.container.appendChild(toolbar);

      // Handle accept/reject
      toolbar.querySelector(".accept-change").onclick = () => {
        // Remove old text
        quillEditor.deleteText(range.index, range.length);
        // Remove the green highlighting from new text
        quillEditor.removeFormat(range.index, mockResponse.enhancedText.length);
        // Set the text color back to default
        quillEditor.formatText(range.index, mockResponse.enhancedText.length);
        toolbar.remove();
      };

      toolbar.querySelector(".reject-change").onclick = () => {
        // Remove new text
        quillEditor.deleteText(
          range.index + range.length,
          mockResponse.enhancedText.length
        );
        // Remove formatting from original text
        quillEditor.removeFormat(range.index, range.length);
        toolbar.remove();
      };
    }

    setIsAiPromptOpen(false);
  };

  const handleAcceptChange = () => {
    console.log("Accepting changes");
    const quillEditor = quillRef.current.getEditor();
    const { range, suggested } = diffPreview;
    console.log("Range and suggested text:", { range, suggested });

    quillEditor.deleteText(range.index, range.length);
    quillEditor.insertText(range.index, suggested);
    console.log("Text replaced in editor");

    setDiffPreview({ show: false, original: "", suggested: "" });
    console.log("Diff preview cleared");
  };

  const handleRejectChange = () => {
    console.log("Rejecting changes");
    setDiffPreview({ show: false, original: "", suggested: "" });
    console.log("Diff preview cleared");
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

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    console.log("diffPreview state changed:", diffPreview);
  }, [diffPreview]);

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

  console.log("Current diffPreview state:", diffPreview);

  return (
    <div className="edit-post__container">
      <h2 className="edit-post__title">Edit Post</h2>
      <div className="edit-post__form">
        <div className="edit-post__main">
          {/* Place the AiDiffPreview at the top of the main content area */}
          {diffPreview.show && (
            <AiDiffPreview
              originalText={diffPreview.original}
              newText={diffPreview.suggested}
              onAccept={handleAcceptChange}
              onReject={handleRejectChange}
              reasoning={diffPreview.reasoning}
              confidence={diffPreview.confidence}
            />
          )}
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
            <>
              <CustomToolbar />
              {/* Add this right before your ReactQuill editor */}
              {diffPreview.show && (
                <AiDiffPreview
                  originalText={diffPreview.original}
                  newText={diffPreview.suggested}
                  onAccept={handleAcceptChange}
                  onReject={handleRejectChange}
                  reasoning={diffPreview.reasoning}
                  confidence={diffPreview.confidence}
                />
              )}
              <ReactQuill
                ref={quillRef}
                value={formData.content}
                onChange={handleEditorChange}
                className="edit-post__wysiwyg"
                modules={{
                  ...modules,
                  toolbar: {
                    ...modules.toolbar,
                    handlers: {
                      ...modules.toolbar.handlers,
                      ai: handleAiEnhancement,
                    },
                  },
                }}
              />
            </>
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
      <AiPromptModal
        isOpen={isAiPromptOpen}
        onClose={() => setIsAiPromptOpen(false)}
        onSubmit={handleAiPromptSubmit}
        selectedText={selectedText}
      />
    </div>
  );
}

export default EditPost;

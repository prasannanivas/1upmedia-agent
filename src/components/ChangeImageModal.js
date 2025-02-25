import React, { useState, useEffect } from "react";
import "./ChangeImageModal.css";

const ChangeImageModal = ({
  isOpen,
  onClose,
  onSave,
  existingImageUrl,
  defaultAltText,
  email,
}) => {
  const [imageUrl, setImageUrl] = useState(existingImageUrl || "");
  const [imageAlt, setImageAlt] = useState(defaultAltText || "");
  const [imageFile, setImageFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]); // Store Cloudinary images
  const [loadingImages, setLoadingImages] = useState(true); // Loading state

  useEffect(() => {
    if (isOpen) {
      fetchExistingImages();
    }
  }, [isOpen]);

  // Fetch images from Cloudinary
  const fetchExistingImages = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/uploadsByUser/${"ai_generated_images"}`
      );
      const data = await response.json();
      if (response.ok) {
        setExistingImages(data.images);
      } else {
        console.error("Error fetching images:", data.error);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file)); // Preview uploaded image
    }
  };

  // Save changes
  const handleSave = () => {
    if (!imageAlt.trim()) {
      setImageAlt(defaultAltText || "Default post title");
    }
    onSave(imageUrl, imageAlt, imageFile);
    onClose();
  };

  // Select an existing image (fills the URL field)
  const handleSelectExistingImage = (selectedUrl) => {
    setImageUrl(selectedUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Change Image</h3>

        {/* Image URL Input */}
        <label className="modal-label">Add Image URL:</label>
        <input
          type="text"
          value={imageUrl}
          onChange={handleImageUrlChange}
          className="modal-input"
          placeholder="Paste image URL here"
        />

        {/* Upload Image Input */}
        <label className="modal-label">Upload Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="modal-file-input"
        />

        {/* Alt Text Input */}
        <label className="modal-label">Alt Text:</label>
        <input
          type="text"
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          className="modal-input"
          placeholder="Describe the image"
        />

        {/* Existing Images Section */}
        <h4>Choose From Existing Images:</h4>
        {loadingImages ? (
          <p>Loading images...</p>
        ) : existingImages.length === 0 ? (
          <p>No images found.</p>
        ) : (
          <div className="modal-existing-images">
            {existingImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Uploaded ${index}`}
                className="modal-existing-image"
                onClick={() => handleSelectExistingImage(img)}
              />
            ))}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="modal-buttons">
          <button className="modal-save-button" onClick={handleSave}>
            Save
          </button>
          <button className="modal-cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeImageModal;

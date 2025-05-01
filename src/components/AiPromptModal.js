import React, { useState } from "react";
import "./AiPromptModal.css";

const AiPromptModal = ({ isOpen, onClose, onSubmit, selectedText }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(prompt);
    setPrompt("");
  };

  if (!isOpen) return null;

  return (
    <div className="ai-prompt-overlay">
      <div className="ai-prompt-modal">
        <div className="ai-prompt-header">
          <h3>AI Enhancement</h3>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <div className="ai-prompt-content">
          <div className="selected-text">
            <p>
              <strong>Selected Text:</strong>
            </p>
            <p className="text-preview">{selectedText}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt for AI enhancement..."
              autoFocus
            />
            <div className="button-group">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit">Enhance</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiPromptModal;

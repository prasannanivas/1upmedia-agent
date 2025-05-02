import React, { useState } from "react";
import "./AiPromptModal.css";

const AiPromptModal = ({ isOpen, onClose, onSubmit, selectedText }) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit(prompt);
    setIsLoading(false);
    setPrompt("");
  };

  if (!isOpen) return null;

  return (
    <>
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
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Enhancing..." : "Enhance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="ai-loading-overlay">
          <div className="ai-loading-container">
            <div className="ai-loading-spinner"></div>
            <div className="ai-loading-text">
              AI is enhancing your text<span className="ai-loading-dots"></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiPromptModal;

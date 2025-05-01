import React from "react";
import "./AiDiffPreview.css";

const AiDiffPreview = ({
  originalText,
  newText,
  onAccept,
  onReject,
  reasoning,
  confidence,
}) => {
  console.log("AiDiffPreview rendered with props:", {
    originalText,
    newText,
    reasoning,
    confidence,
  });

  return (
    <div className="ai-diff-preview">
      <div className="diff-header">
        <h4>AI Suggested Changes</h4>
        <span className="confidence-score">
          Confidence: {(confidence * 100).toFixed(1)}%
        </span>
      </div>

      <div className="diff-content">
        <div className="diff-section">
          <label>Original:</label>
          <div className="text-block removed">{originalText}</div>
        </div>

        <div className="diff-section">
          <label>Enhanced:</label>
          <div className="text-block added">{newText}</div>
        </div>
      </div>

      {reasoning && (
        <div className="diff-reasoning">
          <label>AI Reasoning:</label>
          <p>{reasoning}</p>
        </div>
      )}

      <div className="diff-actions">
        <button className="reject-btn" onClick={onReject}>
          Keep Original
        </button>
        <button className="accept-btn" onClick={onAccept}>
          Accept Change
        </button>
      </div>
    </div>
  );
};

export default AiDiffPreview;
